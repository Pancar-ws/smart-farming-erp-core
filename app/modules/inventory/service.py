# modules/inventory/service.py
from datetime import datetime
from decimal import Decimal
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.core.errors import DomainError
from app.core.events import publish, StockBelowMinimum
from .models import InventoryLot, StockMovement

Q = Decimal("0.001")
def q(x) -> Decimal:
    return Decimal(str(x)).quantize(Q)

SELLABLE = ("HASIL_SORTASI", "PRODUK_KEMASAN")

class InventoryService:

    @staticmethod
    def get_or_create_lot(
        db: Session,
        *,
        category: str,
        warehouse_id: int,
        received_at: datetime,
        saprotan_id: int | None = None,
        product_id: int | None = None,
        grade_id: int | None = None,
        batch_code: str | None = None,
        unit_cost: Decimal = Decimal(0),
        expiry_date=None,
        pack_unit: str | None = None,
        pack_size_kg: Decimal | None = None,
        pack_count: int | None = None,
    ) -> InventoryLot:
        stmt = (
            select(InventoryLot)
            .where(
                InventoryLot.stock_category == category,
                InventoryLot.warehouse_id == warehouse_id,
                InventoryLot.saprotan_id.is_not_distinct_from(saprotan_id),
                InventoryLot.product_id.is_not_distinct_from(product_id),
                InventoryLot.grade_id.is_not_distinct_from(grade_id),
                InventoryLot.batch_code.is_not_distinct_from(batch_code),
                InventoryLot.pack_unit.is_not_distinct_from(pack_unit),
                InventoryLot.pack_size_kg.is_not_distinct_from(pack_size_kg),
            )
            .with_for_update()
        )
        lot = db.scalars(stmt).first()
        if lot:
            return lot

        lot = InventoryLot(
            stock_category=category,
            warehouse_id=warehouse_id,
            saprotan_id=saprotan_id,
            product_id=product_id,
            grade_id=grade_id,
            batch_code=batch_code,
            unit_cost=unit_cost,
            received_at=received_at,
            expiry_date=expiry_date,
            pack_unit=pack_unit,
            pack_size_kg=pack_size_kg,
            pack_count=pack_count,
            qty_on_hand=Decimal(0),
            qty_reserved=Decimal(0),
        )
        db.add(lot)
        db.flush()
        return lot

    @staticmethod
    def move(
        db: Session,
        lot: InventoryLot,
        delta,
        mtype: str,
        *,
        ref_type: str | None = None,
        ref_id: int | None = None,
        ref_no: str | None = None,
        consume_reserved=Decimal(0),
        user_id: int | None = None,
        unit_cost: Decimal | None = None,
    ) -> StockMovement:
        """SATU-SATUNYA pintu mutasi stok. Lot HARUS sudah terkunci (FOR UPDATE)."""
        delta = q(delta)
        consume_reserved = q(consume_reserved)
        new_on_hand = lot.qty_on_hand + delta
        new_reserved = lot.qty_reserved - consume_reserved

        if new_on_hand < 0 or new_reserved < 0 or new_reserved > new_on_hand:
            raise DomainError(
                "INSUFFICIENT_STOCK",
                "Transaksi ditolak: stok tidak mencukupi / menjadi negatif",
                422,
                {
                    "lot_id": lot.id,
                    "batch_code": lot.batch_code,
                    "on_hand": str(lot.qty_on_hand),
                    "reserved": str(lot.qty_reserved),
                    "requested": str(delta),
                },
            )

        if delta > 0 and unit_cost is not None and lot.stock_category == "SAPROTAN":
            # Biaya rata-rata tertimbang
            lot.unit_cost = ((lot.qty_on_hand * lot.unit_cost) + (delta * unit_cost)) / new_on_hand

        lot.qty_on_hand = new_on_hand
        lot.qty_reserved = new_reserved

        mv = StockMovement(
            lot_id=lot.id,
            movement_type=mtype,
            qty_delta=delta,
            balance_after=new_on_hand,
            ref_type=ref_type,
            ref_id=ref_id,
            ref_no=ref_no,
            created_by=user_id,
        )
        db.add(mv)
        db.flush()

        if lot.stock_category == "SAPROTAN" and delta < 0:
            InventoryService.evaluate_reorder_point(db, lot.saprotan_id)

        return mv

    @staticmethod
    def evaluate_reorder_point(db: Session, saprotan_id: int):
        from app.modules.master.models import SaprotanItem
        from .notifications import notify

        item = db.get(SaprotanItem, saprotan_id)
        if not item:
            return

        on_hand = db.scalar(
            select(func.coalesce(func.sum(InventoryLot.qty_on_hand), 0)).where(
                InventoryLot.saprotan_id == saprotan_id
            )
        )
        if on_hand <= item.min_stock:
            notify(
                db,
                "ROP",
                "WARNING",
                f"Stok {item.name} {on_hand} <= minimum {item.min_stock} — Perlu Restock",
                {"saprotan_id": saprotan_id},
            )
            publish(db, StockBelowMinimum(saprotan_id, on_hand, item.min_stock))

    @staticmethod
    def issue_saprotan(
        db: Session,
        *,
        saprotan_id: int,
        warehouse_id: int,
        qty: Decimal,
        ref_type: str,
        ref_id: int,
        ref_no: str,
        user_id: int | None = None,
    ) -> InventoryLot:
        lot = db.scalars(
            select(InventoryLot)
            .where(
                InventoryLot.stock_category == "SAPROTAN",
                InventoryLot.saprotan_id == saprotan_id,
                InventoryLot.warehouse_id == warehouse_id,
            )
            .with_for_update()
        ).first()

        if not lot:
            raise DomainError("INSUFFICIENT_STOCK", "Stok saprotan belum ada di gudang ini", 422)

        InventoryService.move(
            db,
            lot,
            -qty,
            "ISSUE",
            ref_type=ref_type,
            ref_id=ref_id,
            ref_no=ref_no,
            user_id=user_id,
        )
        return lot

    @staticmethod
    def available_qty(db: Session, product_id: int, grade_id: int) -> Decimal:
        return db.scalar(
            select(func.coalesce(func.sum(InventoryLot.qty_on_hand - InventoryLot.qty_reserved), 0)).where(
                InventoryLot.stock_category.in_(SELLABLE),
                InventoryLot.product_id == product_id,
                InventoryLot.grade_id == grade_id,
            )
        )

    @staticmethod
    def allocate_fifo(db: Session, product_id: int, grade_id: int, qty: Decimal) -> list[tuple[InventoryLot, Decimal]]:
        """Task AllocateBatchFIFO: lot tertua dulu (received_at ASC, id ASC). Lot dikunci."""
        lots = db.scalars(
            select(InventoryLot)
            .where(
                InventoryLot.stock_category.in_(SELLABLE),
                InventoryLot.product_id == product_id,
                InventoryLot.grade_id == grade_id,
                (InventoryLot.qty_on_hand - InventoryLot.qty_reserved) > 0,
            )
            .order_by(InventoryLot.received_at.asc(), InventoryLot.id.asc())
            .with_for_update()
        ).all()

        remaining = q(qty)
        plan = []
        for lot in lots:
            take = min(lot.qty_available, remaining)
            plan.append((lot, take))
            remaining -= take
            if remaining <= 0:
                break

        if remaining > 0:
            raise DomainError(
                "INSUFFICIENT_STOCK",
                "Jumlah pesanan melebihi stok tersedia",
                422,
                {"requested": str(q(qty)), "available": str(q(qty) - remaining)},
            )
        return plan

    @staticmethod
    def reserve(db: Session, lot: InventoryLot, qty: Decimal):
        new_res = lot.qty_reserved + q(qty)
        if new_res > lot.qty_on_hand:
            raise DomainError("INSUFFICIENT_STOCK", "Reservasi melebihi stok", 422)
        lot.qty_reserved = new_res

    @staticmethod
    def release(db: Session, lot: InventoryLot, qty: Decimal):
        lot.qty_reserved = max(Decimal(0), lot.qty_reserved - q(qty))

