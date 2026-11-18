# modules/procurement/goods_service.py
from datetime import datetime, timedelta, date
from decimal import Decimal
from zoneinfo import ZoneInfo
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import DomainError
from app.core.events import publish, SaprotanReceived
from app.core.numbering import next_number, ym
from app.core.settings_store import get_setting
from app.modules.inventory.service import InventoryService
from .models import PurchaseOrder, PurchaseOrderLine, GoodsReceipt, GoodsReceiptLine
from .schemas import PurchaseOrderCreate, GoodsReceiptCreate

TZ = ZoneInfo(settings.timezone)

def create_po(db: Session, user, data: PurchaseOrderCreate) -> PurchaseOrder:
    now = datetime.now(TZ)
    total = sum((l.qty * l.unit_price for l in data.lines), Decimal(0))
    po = PurchaseOrder(
        po_no=next_number(db, "PO", ym(now), 3),
        supplier_id=data.supplier_id,
        order_date=data.order_date,
        expected_date=data.expected_date,
        status="DRAFT",
        is_auto=False,
        total=total,
        note=data.note,
        created_by=user.id if user else None,
    )
    db.add(po)
    db.flush()
    for ln in data.lines:
        db.add(
            PurchaseOrderLine(
                po_id=po.id,
                saprotan_id=ln.saprotan_id,
                qty=ln.qty,
                unit_price=ln.unit_price,
            )
        )
    return po

def approve_po(db: Session, user, po_id: int) -> PurchaseOrder:
    po = db.get(PurchaseOrder, po_id)
    if not po:
        raise DomainError("NOT_FOUND", "PO tidak ditemukan", 404)
    if po.status not in ("PROPOSED", "DRAFT"):
        raise DomainError("INVALID_STATE", f"PO status {po.status} tidak dapat disetujui", 422)
    po.status = "ORDERED"
    db.flush()
    return po

def receive_goods(db: Session, user, data: GoodsReceiptCreate) -> GoodsReceipt:
    po = db.scalar(select(PurchaseOrder).where(PurchaseOrder.id == data.po_id).with_for_update())
    if not po:
        raise DomainError("NOT_FOUND", "PO tidak ditemukan", 404)
    if po.status not in ("ORDERED", "PARTIAL"):
        raise DomainError("INVALID_STATE", "PO belum dipesan / sudah selesai", 422)

    now = datetime.now(TZ)
    gr = GoodsReceipt(
        gr_no=next_number(db, "GR", ym(now), 3),
        po_id=po.id,
        warehouse_id=data.warehouse_id,
        received_date=data.received_date,
        status="POSTED",
        note=data.note,
        created_by=user.id if user else None,
    )
    db.add(gr)
    db.flush()

    total = Decimal(0)
    for ln in data.lines:
        pol = db.scalar(
            select(PurchaseOrderLine)
            .where(PurchaseOrderLine.id == ln.po_line_id, PurchaseOrderLine.po_id == po.id)
            .with_for_update()
        )
        if not pol:
            raise DomainError("NOT_FOUND", f"Baris PO {ln.po_line_id} tidak ditemukan", 404)

        variance = pol.qty - (pol.qty_received + ln.qty_received)
        db.add(
            GoodsReceiptLine(
                gr_id=gr.id,
                po_line_id=pol.id,
                qty_received=ln.qty_received,
                qty_variance=variance,
            )
        )
        pol.qty_received += ln.qty_received

        lot = InventoryService.get_or_create_lot(
            db,
            category="SAPROTAN",
            warehouse_id=gr.warehouse_id,
            received_at=now,
            saprotan_id=pol.saprotan_id,
        )
        InventoryService.move(
            db,
            lot,
            ln.qty_received,
            "RECEIPT",
            ref_type="GR",
            ref_id=gr.id,
            ref_no=gr.gr_no,
            user_id=user.id if user else None,
            unit_cost=pol.unit_price,
        )
        total += ln.qty_received * pol.unit_price

    po.status = "RECEIVED" if all(l.qty_received >= l.qty for l in po.lines) else "PARTIAL"
    supplier_terms = int(get_setting(db, "supplier.payment_term_days", 14))
    publish(
        db,
        SaprotanReceived(
            gr.id,
            po.supplier_id,
            data.received_date,
            total,
            gr.gr_no,
            data.received_date + timedelta(days=supplier_terms),
        ),
    )
    return gr

def quick_restock_saprotan(db: Session, user, data) -> dict:
    from app.modules.master.models import SaprotanItem
    item = db.get(SaprotanItem, data.saprotan_id)
    if not item:
        raise DomainError("NOT_FOUND", "Item saprotan tidak ditemukan", 404)

    supplier_id = data.supplier_id
    if not supplier_id:
        if item.type in ("PUPUK_ORGANIK", "PUPUK_KIMIA"):
            supplier_id = 1
        elif item.type == "BENIH":
            supplier_id = 2
        elif item.type == "KEMASAN":
            supplier_id = 3
        else:
            supplier_id = 1

    unit_price = data.unit_price if data.unit_price is not None else item.purchase_price
    today = date.today()

    # 1. Buat PO
    from .schemas import PurchaseOrderCreate, POLineIn, GoodsReceiptCreate, GRLineIn
    po_in = PurchaseOrderCreate(
        supplier_id=supplier_id,
        order_date=today,
        expected_date=today,
        note=data.note or f"Pengadaan restock saprotan {item.name}",
        lines=[POLineIn(saprotan_id=item.id, qty=data.qty, unit_price=unit_price)],
    )
    po = create_po(db, user, po_in)

    # 2. Approve PO
    po = approve_po(db, user, po.id)

    # 3. Catat Goods Receipt di Gudang GD-SAP
    gr_in = GoodsReceiptCreate(
        po_id=po.id,
        warehouse_id=data.warehouse_id,
        received_date=today,
        note=data.note or f"Penerimaan pengadaan {item.name}",
        lines=[GRLineIn(po_line_id=po.lines[0].id, qty_received=data.qty)],
    )
    gr = receive_goods(db, user, gr_in)

    return {
        "status": "SUCCESS",
        "po_no": po.po_no,
        "gr_no": gr.gr_no,
        "item_name": item.name,
        "qty_received": str(data.qty),
        "warehouse_id": data.warehouse_id,
        "total": str(data.qty * unit_price),
    }

