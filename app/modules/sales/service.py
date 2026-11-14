# modules/sales/service.py
from datetime import datetime, timedelta, date
from decimal import Decimal
from zoneinfo import ZoneInfo
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import DomainError
from app.core.events import publish, DeliveryPosted, InvoiceIssued, SalesReturned
from app.core.numbering import next_number, ym
from app.modules.inventory.models import InventoryLot
from app.modules.inventory.service import InventoryService, q
from app.modules.master.models import Customer, SalesPrice, Warehouse
from app.modules.master.pricing import effective_price
from .models import (
    DeliveryLine,
    DeliveryOrder,
    SalesInvoice,
    SalesOrder,
    SalesOrderLine,
    SalesReturn,
    SalesReturnLine,
    SoAllocation,
)
from .schemas import ReturnCreate, SalesOrderCreate, ShipIn

TZ = ZoneInfo(settings.timezone)

def create_order(db: Session, user, data: SalesOrderCreate) -> SalesOrder:
    cust = db.get(Customer, data.customer_id)
    if not cust:
        raise DomainError("NOT_FOUND", "Pelanggan tidak ditemukan", 404)

    now = datetime.now(TZ)
    so = SalesOrder(
        so_no=next_number(db, "SO", ym(now), 4),
        customer_id=cust.id,
        segment=cust.segment,
        order_date=data.order_date,
        status="CONFIRMED",
        total=Decimal(0),
        note=data.note,
        created_by=user.id if user else None,
    )
    db.add(so)
    db.flush()

    total = Decimal(0)
    for ln in data.lines:
        price = effective_price(
            db,
            SalesPrice,
            data.order_date,
            product_id=ln.product_id,
            grade_id=ln.grade_id,
            segment=cust.segment,
        )
        sol = SalesOrderLine(
            so_id=so.id,
            product_id=ln.product_id,
            grade_id=ln.grade_id,
            qty=q(ln.qty),
            unit_price=price,
        )
        db.add(sol)
        db.flush()

        for lot, take in InventoryService.allocate_fifo(db, ln.product_id, ln.grade_id, ln.qty):
            InventoryService.reserve(db, lot, take)
            db.add(SoAllocation(so_line_id=sol.id, lot_id=lot.id, qty=take))

        total += q(ln.qty) * price

    so.total = total
    return so

def ship_order(db: Session, user, so_id: int, data: ShipIn) -> tuple[DeliveryOrder, SalesInvoice | None]:
    so = db.scalar(select(SalesOrder).where(SalesOrder.id == so_id).with_for_update())
    if not so:
        raise DomainError("NOT_FOUND", "SO tidak ditemukan", 404)
    if so.status != "CONFIRMED":
        raise DomainError("INVALID_STATE", "SO tidak dapat dikirim", 422)

    now = datetime.now(TZ)
    do = DeliveryOrder(
        do_no=next_number(db, "DO", ym(now), 4),
        so_id=so.id,
        delivered_at=now,
        vehicle_type=data.vehicle_type,
        distance_km=data.distance_km,
        status="CONFIRMED",
        created_by=user.id if user else None,
    )
    db.add(do)
    db.flush()

    cogs = Decimal(0)
    for sol in so.lines:
        for al in sorted(sol.allocations, key=lambda a: a.lot_id):  # urut tetap -> hindari deadlock
            lot = db.scalar(select(InventoryLot).where(InventoryLot.id == al.lot_id).with_for_update())
            InventoryService.move(
                db,
                lot,
                -al.qty,
                "DELIVERY",
                consume_reserved=al.qty,
                ref_type="DO",
                ref_id=do.id,
                ref_no=do.do_no,
                user_id=user.id if user else None,
            )
            db.add(
                DeliveryLine(
                    do_id=do.id,
                    so_line_id=sol.id,
                    lot_id=lot.id,
                    batch_code=lot.batch_code,
                    grade_id=sol.grade_id,
                    qty=al.qty,
                    unit_price=sol.unit_price,
                    unit_cost=lot.unit_cost,
                )
            )
            cogs += al.qty * lot.unit_cost

    so.status = "SHIPPED"
    publish(db, DeliveryPosted(do.id, do.do_no, so.id, now.date(), cogs))

    inv = None
    if data.auto_invoice:
        inv = issue_invoice(db, user, do)
    return do, inv

def issue_invoice(db: Session, user, do: DeliveryOrder) -> SalesInvoice:
    cust = do.sales_order.customer
    total = sum((l.qty * l.unit_price for l in do.lines), Decimal(0))
    inv = SalesInvoice(
        invoice_no=next_number(db, "INV", ym(do.delivered_at), 4),
        do_id=do.id,
        customer_id=cust.id,
        issue_date=do.delivered_at.date(),
        due_date=do.delivered_at.date() + timedelta(days=cust.payment_term_days),
        total=total,
        status="OPEN",
        created_by=user.id if user else None,
    )
    db.add(inv)
    db.flush()
    publish(db, InvoiceIssued(inv.id, inv.invoice_no, cust.id, inv.issue_date, inv.due_date, total))
    return inv

def cancel_order(db: Session, user, so_id: int):
    so = db.scalar(select(SalesOrder).where(SalesOrder.id == so_id).with_for_update())
    if not so:
        raise DomainError("NOT_FOUND", "SO tidak ditemukan", 404)
    if so.status != "CONFIRMED":
        raise DomainError("INVALID_STATE", "Hanya SO CONFIRMED yang dapat dibatalkan", 422)

    for sol in so.lines:
        for al in sol.allocations:
            lot = db.scalar(select(InventoryLot).where(InventoryLot.id == al.lot_id).with_for_update())
            InventoryService.release(db, lot, al.qty)

    so.status = "CANCELLED"

def create_return(db: Session, user, data: ReturnCreate) -> SalesReturn:
    now = datetime.now(TZ)
    ret = SalesReturn(
        return_no=next_number(db, "RET", ym(now), 4),
        customer_id=data.customer_id,
        return_date=data.return_date,
        reason=data.reason,
        status="POSTED",
        created_by=user.id if user else None,
    )
    db.add(ret)
    db.flush()

    revenue_total = Decimal(0)
    cogs_total = Decimal(0)

    waste_wh = db.scalars(select(Warehouse).where(Warehouse.type == "LIMBAH", Warehouse.is_active.is_(True))).first()
    if not waste_wh:
        raise DomainError("VALIDATION", "Gudang LIMBAH tidak ditemukan", 422)

    for ln in data.lines:
        dl = db.get(DeliveryLine, ln.delivery_line_id)
        if not dl:
            raise DomainError("NOT_FOUND", f"Baris DO {ln.delivery_line_id} tidak ditemukan", 404)

        prev_ret = db.scalar(
            select(func.coalesce(func.sum(SalesReturnLine.qty), 0)).where(
                SalesReturnLine.delivery_line_id == dl.id
            )
        )
        if prev_ret + ln.qty > dl.qty:
            raise DomainError("VALIDATION", f"Kuantitas retur melebihi sisa yang dikirim untuk baris {dl.id}", 422)

        orig_lot = db.get(InventoryLot, dl.lot_id)
        if ln.condition == "LAYAK":
            # Kembali ke lot asal
            InventoryService.move(
                db,
                orig_lot,
                ln.qty,
                "RETURN_IN",
                ref_type="RETURN",
                ref_id=ret.id,
                ref_no=ret.return_no,
                user_id=user.id if user else None,
            )
        else:
            # RUSAK -> gudang limbah
            waste_lot = InventoryService.get_or_create_lot(
                db,
                category="LIMBAH",
                warehouse_id=waste_wh.id,
                received_at=now,
                product_id=orig_lot.product_id,
                grade_id=orig_lot.grade_id,
                batch_code=orig_lot.batch_code,
                unit_cost=Decimal(0),
            )
            InventoryService.move(
                db,
                waste_lot,
                ln.qty,
                "RETURN_IN",
                ref_type="RETURN",
                ref_id=ret.id,
                ref_no=ret.return_no,
                user_id=user.id if user else None,
            )

        db.add(
            SalesReturnLine(
                return_id=ret.id,
                delivery_line_id=dl.id,
                qty=ln.qty,
                condition=ln.condition,
            )
        )
        revenue_total += ln.qty * dl.unit_price
        cogs_total += ln.qty * dl.unit_cost

    publish(
        db,
        SalesReturned(
            ret.id,
            ret.return_no,
            ret.return_date,
            revenue_total,
            cogs_total,
            data.customer_id,
        ),
    )
    return ret

