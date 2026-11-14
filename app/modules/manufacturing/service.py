# modules/manufacturing/service.py
from datetime import datetime, timedelta, date
from decimal import Decimal
from zoneinfo import ZoneInfo
from sqlalchemy import select, exists
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import DomainError
from app.core.events import publish, SortingPosted
from app.core.numbering import next_number, ym
from app.core.settings_store import get_setting
from app.modules.inventory.models import InventoryLot
from app.modules.inventory.service import InventoryService, q
from app.modules.master.models import GradeDefinition, Product, ProductCategory, PurchasePrice, Warehouse
from app.modules.master.pricing import effective_price
from app.modules.procurement.models import HarvestReceipt
from .models import (
    PackagingMaterial,
    PackagingRecord,
    QualityCheck,
    SortingOrder,
    SortingInput,
    SortingOutput,
)
from .schemas import PackagingCreate, QualityCheckIn, SortingOrderCreate

TZ = ZoneInfo(settings.timezone)

def _warehouse(db: Session, wh_type: str) -> Warehouse:
    wh = db.scalars(select(Warehouse).where(Warehouse.type == wh_type, Warehouse.is_active.is_(True))).first()
    if not wh:
        raise DomainError("VALIDATION", f"Gudang tipe {wh_type} tidak ditemukan", 422)
    return wh

def create_sorting_order(db: Session, user, data: SortingOrderCreate) -> SortingOrder:
    now = datetime.now(TZ)
    order = SortingOrder(
        order_no=next_number(db, "SRT", ym(now), 4),
        process_date=data.process_date,
        status="DRAFT",
        note=data.note,
        created_by=user.id if user else None,
    )
    db.add(order)
    db.flush()

    for i in data.inputs:
        rc = db.get(HarvestReceipt, i.harvest_receipt_id)
        if not rc:
            raise DomainError("NOT_FOUND", f"Setoran panen {i.harvest_receipt_id} tidak ditemukan", 404)
        if rc.status not in ("MENUNGGU_SORTASI", "SEDANG_DIPROSES"):
            raise DomainError("INVALID_STATE", f"Batch {rc.batch_code} sudah selesai/dibatalkan", 422)

        inp = SortingInput(order_id=order.id, harvest_receipt_id=rc.id, qty_input=q(i.qty_input))
        db.add(inp)
        db.flush()

        for o in i.outputs:
            db.add(SortingOutput(input_id=inp.id, grade_id=o.grade_id, qty=q(o.qty)))
        rc.status = "SEDANG_DIPROSES"

    return order

def create_quality_check(db: Session, user, order_id: int, data: QualityCheckIn) -> QualityCheck:
    order = db.get(SortingOrder, order_id)
    if not order:
        raise DomainError("NOT_FOUND", "Order sortasi tidak ditemukan", 404)
    qc = QualityCheck(
        order_id=order.id,
        inspector_user_id=user.id,
        passed=data.passed,
        notes=data.notes,
    )
    db.add(qc)
    db.flush()
    return qc

def post_sorting_order(db: Session, user, order_id: int) -> SortingOrder:
    order = db.scalar(select(SortingOrder).where(SortingOrder.id == order_id).with_for_update())
    if not order or order.status != "DRAFT":
        raise DomainError("INVALID_STATE", "Order sortasi bukan DRAFT", 422)

    if get_setting(db, "mfg.require_qc_pass", True) and not db.scalar(
        select(exists().where(QualityCheck.order_id == order.id, QualityCheck.passed.is_(True)))
    ):
        raise DomainError("QC_REQUIRED", "Order sortasi belum memiliki hasil QC yang lolos", 422)

    now = datetime.now(TZ)
    fin_wh = _warehouse(db, "BARANG_JADI")
    waste_wh = _warehouse(db, "LIMBAH")
    lines, total_value = [], Decimal(0)

    for inp in order.inputs:
        rc = db.scalar(select(HarvestReceipt).where(HarvestReceipt.id == inp.harvest_receipt_id).with_for_update())
        product = db.get(Product, rc.product_id)
        cat = db.get(ProductCategory, product.category_id)

        # 1) MASS BALANCE: input == Σ output (toleransi 0 kg) - SRS-MFG-005 / SDD 9.1
        total_out = sum((q(o.qty) for o in inp.outputs), Decimal(0))
        diff = q(inp.qty_input) - total_out
        if diff != 0:
            raise DomainError(
                "MASS_BALANCE_VIOLATION",
                f"Keseimbangan massa gagal untuk batch {rc.batch_code}: input {inp.qty_input} kg != output {total_out} kg (selisih {diff} kg)",
                422,
                {
                    "batch_code": rc.batch_code,
                    "input": str(inp.qty_input),
                    "output": str(total_out),
                    "diff": str(diff),
                },
            )

        # 2) Konsumsi lot mentah
        raw = db.scalars(
            select(InventoryLot)
            .where(
                InventoryLot.stock_category == "PANEN_MENTAH",
                InventoryLot.batch_code == rc.batch_code,
            )
            .with_for_update()
        ).one()
        InventoryService.move(
            db,
            raw,
            -inp.qty_input,
            "SORT_CONSUME",
            ref_type="SORTING",
            ref_id=order.id,
            ref_no=order.order_no,
            user_id=user.id if user else None,
        )

        # 3) Output per grade: batch DIWARISI (MFG-006)
        reject_qty = Decimal(0)
        for o in inp.outputs:
            g = db.get(GradeDefinition, o.grade_id)
            if g.category_id != product.category_id:
                raise DomainError("VALIDATION", f"Grade {g.code} bukan skema kategori {cat.name}", 422)
            if o.qty == 0:
                continue

            if g.is_reject:
                reject_qty += o.qty
                unit_cost = Decimal(0)
                lot = InventoryService.get_or_create_lot(
                    db,
                    category="LIMBAH",
                    warehouse_id=waste_wh.id,
                    received_at=now,
                    product_id=product.id,
                    grade_id=g.id,
                    batch_code=rc.batch_code,
                    unit_cost=unit_cost,
                )
            else:
                unit_cost = effective_price(db, PurchasePrice, order.process_date, product_id=product.id, grade_id=g.id)
                lot = InventoryService.get_or_create_lot(
                    db,
                    category="HASIL_SORTASI",
                    warehouse_id=fin_wh.id,
                    received_at=now,
                    product_id=product.id,
                    grade_id=g.id,
                    batch_code=rc.batch_code,
                    unit_cost=unit_cost,
                    expiry_date=order.process_date + timedelta(days=cat.shelf_life_days),
                )

            InventoryService.move(
                db,
                lot,
                o.qty,
                "SORT_OUTPUT",
                ref_type="SORTING",
                ref_id=order.id,
                ref_no=order.order_no,
                user_id=user.id if user else None,
            )

            val = q(o.qty) * unit_cost
            total_value += val
            lines.append(
                {
                    "batch_code": rc.batch_code,
                    "member_id": rc.member_id,
                    "product_id": product.id,
                    "grade_id": g.id,
                    "grade": g.code,
                    "qty": o.qty,
                    "unit_cost": unit_cost,
                    "value": val,
                    "is_reject": g.is_reject,
                }
            )

        rc.status = "SELESAI" if raw.qty_on_hand == 0 else "SEDANG_DIPROSES"
        inp.shrink_pct = (reject_qty / inp.qty_input * 100).quantize(Decimal("0.01"))

    order.status, order.posted_at, order.posted_by = "POSTED", now, user.id if user else None
    db.flush()
    publish(db, SortingPosted(order.id, order.process_date, lines, total_value, user.id if user else None))
    return order

def create_packaging(db: Session, user, data: PackagingCreate) -> PackagingRecord:
    src_lot = db.scalar(select(InventoryLot).where(InventoryLot.id == data.source_lot_id).with_for_update())
    if not src_lot or src_lot.stock_category != "HASIL_SORTASI":
        raise DomainError("VALIDATION", "Lot sumber harus berstatus HASIL_SORTASI", 422)

    total_pack_kg = q(data.pack_size_kg * data.pack_count)
    if total_pack_kg > src_lot.qty_available:
        raise DomainError("INSUFFICIENT_STOCK", "Stok lot sumber tidak mencukupi untuk pengemasan", 422)

    now = datetime.now(TZ)
    record_no = next_number(db, "PCK", ym(now), 4)

    # 1. Konsumsi lot sumber
    InventoryService.move(
        db,
        src_lot,
        -total_pack_kg,
        "PACK_CONSUME",
        ref_type="PACKAGING",
        ref_no=record_no,
        user_id=user.id if user else None,
    )

    # 2. Buat lot produk kemasan (mewarisi batch, grade, unit_cost, received_at dari lot sumber)
    out_lot = InventoryService.get_or_create_lot(
        db,
        category="PRODUK_KEMASAN",
        warehouse_id=src_lot.warehouse_id,
        received_at=src_lot.received_at,
        product_id=src_lot.product_id,
        grade_id=src_lot.grade_id,
        batch_code=src_lot.batch_code,
        unit_cost=src_lot.unit_cost,
        expiry_date=src_lot.expiry_date,
        pack_unit=data.pack_unit,
        pack_size_kg=data.pack_size_kg,
        pack_count=data.pack_count,
    )
    InventoryService.move(
        db,
        out_lot,
        total_pack_kg,
        "PACK_OUTPUT",
        ref_type="PACKAGING",
        ref_no=record_no,
        user_id=user.id if user else None,
    )

    record = PackagingRecord(
        record_no=record_no,
        source_lot_id=src_lot.id,
        output_lot_id=out_lot.id,
        pack_unit=data.pack_unit,
        pack_size_kg=data.pack_size_kg,
        pack_count=data.pack_count,
        qty_kg=total_pack_kg,
        packaged_at=now,
        created_by=user.id if user else None,
    )
    db.add(record)
    db.flush()

    # 3. Konsumsi bahan kemasan (saprotan)
    for mat in data.materials:
        InventoryService.issue_saprotan(
            db,
            saprotan_id=mat.saprotan_id,
            warehouse_id=src_lot.warehouse_id,
            qty=mat.qty,
            ref_type="PACKAGING_MATERIAL",
            ref_id=record.id,
            ref_no=record_no,
            user_id=user.id if user else None,
        )
        db.add(PackagingMaterial(record_id=record.id, saprotan_id=mat.saprotan_id, qty=mat.qty))

    return record

