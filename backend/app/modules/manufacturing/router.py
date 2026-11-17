# modules/manufacturing/router.py
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import current_user, require
from app.modules.auth.models import User
from . import service
from .models import SortingOrder
from .schemas import (
    PackagingCreate,
    QualityCheckIn,
    QualityCheckOut,
    SortingOrderCreate,
    SortingOrderOut,
)

router = APIRouter(prefix="/manufacturing", tags=["Manufacturing"])

@router.post("/sorting-orders", response_model=SortingOrderOut, status_code=201)
def create_sorting_order(
    body: SortingOrderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("mfg:sort")),
):
    return service.create_sorting_order(db, user, body)

@router.get("/sorting-orders", response_model=list[SortingOrderOut])
def list_sorting_orders(
    status: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require("mfg:read")),
):
    stmt = select(SortingOrder)
    if status:
        stmt = stmt.where(SortingOrder.status == status)
    return db.scalars(stmt.order_by(SortingOrder.id.desc())).all()

@router.get("/sorting-orders/{order_id}")
def get_sorting_order(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require("mfg:read")),
):
    order = db.get(SortingOrder, order_id)
    if not order:
        from app.core.errors import DomainError
        raise DomainError("NOT_FOUND", "Order sortasi tidak ditemukan", 404)
    return {
        "id": order.id,
        "order_no": order.order_no,
        "process_date": order.process_date,
        "status": order.status,
        "posted_at": order.posted_at,
        "inputs": [
            {
                "id": inp.id,
                "harvest_receipt_id": inp.harvest_receipt_id,
                "batch_code": inp.harvest_receipt.batch_code if inp.harvest_receipt else None,
                "qty_input": str(inp.qty_input),
                "shrink_pct": str(inp.shrink_pct) if inp.shrink_pct is not None else None,
                "outputs": [
                    {"id": out.id, "grade_id": out.grade_id, "qty": str(out.qty)}
                    for out in inp.outputs
                ],
            }
            for inp in order.inputs
        ],
        "quality_checks": [
            {"id": qc.id, "passed": qc.passed, "notes": qc.notes, "checked_at": qc.checked_at}
            for qc in order.quality_checks
        ],
    }

@router.post("/sorting-orders/{order_id}/quality-checks", response_model=QualityCheckOut, status_code=201)
def create_quality_check(
    order_id: int,
    body: QualityCheckIn,
    db: Session = Depends(get_db),
    user: User = Depends(require("mfg:sort")),
):
    return service.create_quality_check(db, user, order_id, body)

@router.post("/sorting-orders/{order_id}/post", response_model=SortingOrderOut)
def post_sorting_order(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require("mfg:sort")),
):
    return service.post_sorting_order(db, user, order_id)

@router.post("/packaging", status_code=201)
def create_packaging(
    body: PackagingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("mfg:sort")),
):
    rec = service.create_packaging(db, user, body)
    return {"id": rec.id, "record_no": rec.record_no, "qty_kg": str(rec.qty_kg)}

