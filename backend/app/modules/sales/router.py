# modules/sales/router.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import current_user, require
from app.modules.auth.models import User
from . import service
from .models import DeliveryOrder, SalesInvoice, SalesOrder
from .schemas import (
    DeliveryOrderOut,
    InvoiceOut,
    ReturnCreate,
    SalesOrderCreate,
    SalesOrderOut,
    ShipIn,
)

router = APIRouter(prefix="/sales", tags=["Sales"])

@router.post("/orders", response_model=SalesOrderOut, status_code=201)
def create_sales_order(
    body: SalesOrderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("sales:order")),
):
    return service.create_order(db, user, body)

@router.get("/orders", response_model=list[SalesOrderOut])
def list_sales_orders(
    status: str | None = None,
    customer_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require("sales:read")),
):
    stmt = select(SalesOrder)
    if status:
        stmt = stmt.where(SalesOrder.status == status)
    if customer_id:
        stmt = stmt.where(SalesOrder.customer_id == customer_id)
    return db.scalars(stmt.order_by(SalesOrder.id.desc())).all()

@router.post("/orders/{so_id}/ship")
def ship_sales_order(
    so_id: int,
    body: ShipIn,
    db: Session = Depends(get_db),
    user: User = Depends(require("sales:ship")),
):
    do, inv = service.ship_order(db, user, so_id, body)
    return {
        "delivery_order": {"id": do.id, "do_no": do.do_no, "status": do.status},
        "invoice": {"id": inv.id, "invoice_no": inv.invoice_no, "total": str(inv.total)} if inv else None,
    }

@router.post("/orders/{so_id}/cancel")
def cancel_sales_order(
    so_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require("sales:order")),
):
    service.cancel_order(db, user, so_id)
    return {"message": "SO berhasil dibatalkan dan reservasi stok dilepas"}

@router.get("/invoices", response_model=list[InvoiceOut])
def list_invoices(
    status: str | None = None,
    customer_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require("sales:read")),
):
    stmt = select(SalesInvoice)
    if status:
        stmt = stmt.where(SalesInvoice.status == status)
    if customer_id:
        stmt = stmt.where(SalesInvoice.customer_id == customer_id)
    return db.scalars(stmt.order_by(SalesInvoice.id.desc())).all()

@router.post("/returns", status_code=201)
def create_sales_return(
    body: ReturnCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("sales:ship")),
):
    ret = service.create_return(db, user, body)
    return {"id": ret.id, "return_no": ret.return_no, "status": ret.status}

@router.get("/delivery-orders/{do_id}/pdf")
def get_do_pdf(
    do_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require("sales:read")),
):
    from fastapi.responses import JSONResponse
    do = db.get(DeliveryOrder, do_id)
    if not do:
        from app.core.errors import DomainError
        raise DomainError("NOT_FOUND", "Surat jalan tidak ditemukan", 404)
    # Return DO print data (in production can generate ReportLab PDF stream)
    return {
        "do_no": do.do_no,
        "delivered_at": do.delivered_at,
        "customer": do.sales_order.customer.name,
        "items": [
            {
                "batch_code": ln.batch_code,
                "grade": ln.grade.code,
                "qty": str(ln.qty),
                "unit_price": str(ln.unit_price),
            }
            for ln in do.lines
        ],
    }

