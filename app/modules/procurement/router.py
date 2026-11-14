# modules/procurement/router.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import current_user, require
from app.modules.auth.models import User
from . import goods_service, harvest_service
from .models import HarvestReceipt, PurchaseOrder
from .schemas import (
    GoodsReceiptCreate,
    GROut,
    HarvestIn,
    HarvestOut,
    POOut,
    PurchaseOrderCreate,
)

router = APIRouter(prefix="/procurement", tags=["Procurement"])

@router.post("/harvest-receipts", response_model=dict, status_code=201)
def create_harvest(
    body: HarvestIn,
    db: Session = Depends(get_db),
    user: User = Depends(require("harvest:receive")),
):
    rc = harvest_service.receive_harvest(db, user, body)
    return {
        "id": rc.id,
        "receipt_no": rc.receipt_no,
        "batch_code": rc.batch_code,
        "net_kg": str(rc.net_kg),
        "print": {"template": "nota_timbang", "qr_payload": f"BATCH:{rc.batch_code}"},
    }

@router.get("/harvest-receipts", response_model=list[HarvestOut])
def list_harvest_receipts(
    status: str | None = None,
    member_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require("harvest:read")),
):
    stmt = select(HarvestReceipt)
    if status:
        stmt = stmt.where(HarvestReceipt.status == status)
    if member_id:
        stmt = stmt.where(HarvestReceipt.member_id == member_id)
    return db.scalars(stmt.order_by(HarvestReceipt.id.desc())).all()

@router.post("/purchase-orders", response_model=POOut, status_code=201)
def create_po(
    body: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("po:write")),
):
    return goods_service.create_po(db, user, body)

@router.get("/purchase-orders", response_model=list[POOut])
def list_pos(
    status: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require("po:read")),
):
    stmt = select(PurchaseOrder)
    if status:
        stmt = stmt.where(PurchaseOrder.status == status)
    return db.scalars(stmt.order_by(PurchaseOrder.id.desc())).all()

@router.post("/purchase-orders/{po_id}/approve", response_model=POOut)
def approve_po(
    po_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require("po:write")),
):
    return goods_service.approve_po(db, user, po_id)

@router.post("/goods-receipts", response_model=dict, status_code=201)
def receive_goods(
    body: GoodsReceiptCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("po:write")),
):
    gr = goods_service.receive_goods(db, user, body)
    return {"id": gr.id, "gr_no": gr.gr_no, "status": gr.status}

