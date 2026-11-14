# modules/reporting/traceability.py
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.core.errors import DomainError
from app.modules.master.models import Customer, GradeDefinition, Member
from app.modules.manufacturing.models import SortingInput, SortingOrder, SortingOutput
from app.modules.procurement.models import HarvestReceipt
from app.modules.sales.models import DeliveryLine, DeliveryOrder, SalesInvoice, SalesOrder

def trace_batch(db: Session, batch_code: str) -> dict:
    """URS-LNT-001 / RPT-005 (maju: panen -> pelanggan)"""
    rc = db.scalar(select(HarvestReceipt).where(HarvestReceipt.batch_code == batch_code))
    if not rc:
        raise DomainError("NOT_FOUND", "Batch tidak ditemukan", 404)
    m = db.get(Member, rc.member_id)

    sorting = db.execute(
        select(
            SortingOrder.order_no,
            SortingOrder.process_date,
            SortingOutput.qty,
            GradeDefinition.code.label("grade"),
        )
        .join(SortingInput, SortingInput.order_id == SortingOrder.id)
        .join(SortingOutput, SortingOutput.input_id == SortingInput.id)
        .join(GradeDefinition, GradeDefinition.id == SortingOutput.grade_id)
        .where(SortingInput.harvest_receipt_id == rc.id, SortingOrder.status == "POSTED")
    ).all()

    sales = db.execute(
        select(
            DeliveryOrder.do_no,
            DeliveryOrder.delivered_at,
            SalesInvoice.invoice_no,
            Customer.name.label("customer_name"),
            Customer.segment,
            DeliveryLine.qty,
            GradeDefinition.code.label("grade"),
        )
        .join(DeliveryLine, DeliveryLine.do_id == DeliveryOrder.id)
        .join(SalesOrder, SalesOrder.id == DeliveryOrder.so_id)
        .join(Customer, Customer.id == SalesOrder.customer_id)
        .join(GradeDefinition, GradeDefinition.id == DeliveryLine.grade_id)
        .outerjoin(SalesInvoice, SalesInvoice.do_id == DeliveryOrder.id)
        .where(DeliveryLine.batch_code == batch_code)
    ).all()

    return {
        "batch_code": batch_code,
        "harvest": {
            "receipt_no": rc.receipt_no,
            "date": rc.received_at.isoformat() if hasattr(rc.received_at, "isoformat") else str(rc.received_at),
            "net_kg": str(rc.net_kg),
            "member": {
                "code": m.member_code if m else None,
                "name": m.name if m else None,
                "address": m.address if m else None,
            },
        },
        "sorting": [
            {
                "order_no": r[0],
                "process_date": str(r[1]),
                "qty": str(r[2]),
                "grade": r[3],
            }
            for r in sorting
        ],
        "sales": [
            {
                "do_no": r[0],
                "delivered_at": str(r[1]),
                "invoice_no": r[2],
                "customer": r[3],
                "segment": r[4],
                "qty": str(r[5]),
                "grade": r[6],
            }
            for r in sales
        ],
    }

def trace_invoice(db: Session, invoice_no: str) -> list[dict]:
    """Mundur: faktur -> batch -> anggota"""
    rows = db.execute(
        select(DeliveryLine.batch_code, func.sum(DeliveryLine.qty))
        .join(DeliveryOrder, DeliveryOrder.id == DeliveryLine.do_id)
        .join(SalesInvoice, SalesInvoice.do_id == DeliveryOrder.id)
        .where(SalesInvoice.invoice_no == invoice_no)
        .group_by(DeliveryLine.batch_code)
    ).all()

    return [{**trace_batch(db, b), "qty_in_invoice": str(q)} for b, q in rows]

