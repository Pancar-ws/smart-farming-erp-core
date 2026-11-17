# modules/procurement/handlers.py
from datetime import date
from sqlalchemy import select
from app.core.events import subscribe, StockBelowMinimum
from app.core.numbering import next_number, ym
from app.modules.master.models import SupplierItem
from .models import PurchaseOrder, PurchaseOrderLine

@subscribe(StockBelowMinimum)
def propose_po(db, e: StockBelowMinimum):
    exists_open = db.scalar(
        select(PurchaseOrder.id)
        .join(PurchaseOrderLine)
        .where(
            PurchaseOrderLine.saprotan_id == e.saprotan_id,
            PurchaseOrder.status.in_(("PROPOSED", "DRAFT", "ORDERED", "PARTIAL")),
        )
    )
    if exists_open:
        return  # hindari usulan ganda

    si = db.scalars(
        select(SupplierItem)
        .where(SupplierItem.saprotan_id == e.saprotan_id)
        .order_by(SupplierItem.default_price)
    ).first()
    if not si:
        return

    qty = max(e.min_stock * 2 - e.on_hand, e.min_stock)  # target = 2x minimum
    po = PurchaseOrder(
        po_no=next_number(db, "PO", ym(date.today()), 3),
        supplier_id=si.supplier_id,
        order_date=date.today(),
        status="PROPOSED",
        is_auto=True,
        total=qty * si.default_price,
    )
    db.add(po)
    db.flush()
    db.add(
        PurchaseOrderLine(
            po_id=po.id,
            saprotan_id=e.saprotan_id,
            qty=qty,
            unit_price=si.default_price,
            qty_received=0,
        )
    )

