# modules/inventory/router.py
from datetime import datetime, date
from decimal import Decimal
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import current_user, require
from app.core.errors import DomainError
from app.core.events import publish, StockAdjusted
from app.core.numbering import next_number, ym
from app.modules.auth.models import User
from . import issue_service
from .models import (
    InventoryLot,
    SaprotanIssue,
    SaprotanUsage,
    StockAdjustment,
    StockAdjustmentLine,
    StockMovement,
    StockTransfer,
    StockTransferLine,
)
from .schemas import (
    LotOut,
    MovementOut,
    SaprotanIssueCreate,
    SaprotanUsageCreate,
    StockAdjustmentCreate,
    StockTransferCreate,
)
from .service import InventoryService

router = APIRouter(prefix="/inventory", tags=["Inventory"])
TZ = ZoneInfo(settings.timezone)

@router.get("/saprotan")
def get_saprotan_stock(db: Session = Depends(get_db), user: User = Depends(require("inventory:read"))):
    rows = db.execute(text("SELECT * FROM v_saprotan_stock")).mappings().all()
    return list(rows)

@router.get("/lots", response_model=list[LotOut])
def list_lots(
    category: str | None = None,
    warehouse_id: int | None = None,
    batch_code: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require("inventory:read")),
):
    stmt = select(InventoryLot)
    if category:
        stmt = stmt.where(InventoryLot.stock_category == category)
    if warehouse_id:
        stmt = stmt.where(InventoryLot.warehouse_id == warehouse_id)
    if batch_code:
        stmt = stmt.where(InventoryLot.batch_code == batch_code)
    return db.scalars(stmt.order_by(InventoryLot.id.desc())).all()

@router.get("/movements", response_model=list[MovementOut])
def list_movements(
    lot_id: int | None = None,
    ref_no: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require("inventory:read")),
):
    stmt = select(StockMovement)
    if lot_id:
        stmt = stmt.where(StockMovement.lot_id == lot_id)
    if ref_no:
        stmt = stmt.where(StockMovement.ref_no == ref_no)
    return db.scalars(stmt.order_by(StockMovement.id.desc()).limit(100)).all()

@router.post("/saprotan-issues", status_code=201)
def create_saprotan_issue(
    body: SaprotanIssueCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("inventory:issue")),
):
    issue = issue_service.issue_to_member(db, user, body)
    return {"id": issue.id, "issue_no": issue.issue_no, "status": issue.status}

@router.post("/saprotan-usages", status_code=201)
def record_saprotan_usage(
    body: SaprotanUsageCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("inventory:issue")),
):
    usage = SaprotanUsage(
        member_id=body.member_id,
        saprotan_id=body.saprotan_id,
        qty=body.qty,
        used_at=body.used_at,
        area_ha=body.area_ha,
        note=body.note,
        created_by=user.id,
    )
    db.add(usage)
    db.flush()
    return {"id": usage.id, "member_id": usage.member_id, "used_at": usage.used_at}

@router.post("/transfers", status_code=201)
def transfer_stock(
    body: StockTransferCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("inventory:adjust")),
):
    if body.from_warehouse_id == body.to_warehouse_id:
        raise DomainError("VALIDATION", "Gudang asal dan tujuan tidak boleh sama", 422)

    now = datetime.now(TZ)
    transfer = StockTransfer(
        transfer_no=next_number(db, "TRF", ym(now), 4),
        from_warehouse_id=body.from_warehouse_id,
        to_warehouse_id=body.to_warehouse_id,
        transfer_date=body.transfer_date,
        status="POSTED",
        created_by=user.id,
    )
    db.add(transfer)
    db.flush()

    for ln in body.lines:
        src_lot = db.scalar(select(InventoryLot).where(InventoryLot.id == ln.lot_id).with_for_update())
        if not src_lot or src_lot.warehouse_id != body.from_warehouse_id:
            raise DomainError("NOT_FOUND", f"Lot {ln.lot_id} tidak ada di gudang asal", 404)

        dst_lot = InventoryService.get_or_create_lot(
            db,
            category=src_lot.stock_category,
            warehouse_id=body.to_warehouse_id,
            received_at=src_lot.received_at,  # mempertahankan received_at agar umur FIFO tidak reset
            saprotan_id=src_lot.saprotan_id,
            product_id=src_lot.product_id,
            grade_id=src_lot.grade_id,
            batch_code=src_lot.batch_code,
            unit_cost=src_lot.unit_cost,
            expiry_date=src_lot.expiry_date,
            pack_unit=src_lot.pack_unit,
            pack_size_kg=src_lot.pack_size_kg,
            pack_count=src_lot.pack_count,
        )

        InventoryService.move(
            db,
            src_lot,
            -ln.qty,
            "TRANSFER_OUT",
            ref_type="TRANSFER",
            ref_id=transfer.id,
            ref_no=transfer.transfer_no,
            user_id=user.id,
        )
        InventoryService.move(
            db,
            dst_lot,
            ln.qty,
            "TRANSFER_IN",
            ref_type="TRANSFER",
            ref_id=transfer.id,
            ref_no=transfer.transfer_no,
            user_id=user.id,
        )
        db.add(StockTransferLine(transfer_id=transfer.id, lot_id=src_lot.id, qty=ln.qty))

    return {"transfer_no": transfer.transfer_no, "status": transfer.status}

@router.post("/adjustments", status_code=201)
def adjust_stock(
    body: StockAdjustmentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("inventory:adjust")),
):
    now = datetime.now(TZ)
    adj = StockAdjustment(
        adj_no=next_number(db, "ADJ", ym(now), 4),
        adj_date=body.adj_date,
        reason=body.reason,
        status="POSTED",
        created_by=user.id,
    )
    db.add(adj)
    db.flush()

    total_value_delta = Decimal(0)
    for ln in body.lines:
        lot = db.scalar(select(InventoryLot).where(InventoryLot.id == ln.lot_id).with_for_update())
        if not lot:
            raise DomainError("NOT_FOUND", f"Lot {ln.lot_id} tidak ditemukan", 404)
        qty_system = lot.qty_on_hand
        delta = ln.qty_counted - qty_system

        if delta != 0:
            mtype = "ADJUST_IN" if delta > 0 else "ADJUST_OUT"
            InventoryService.move(
                db,
                lot,
                delta,
                mtype,
                ref_type="STOCK_ADJUSTMENT",
                ref_id=adj.id,
                ref_no=adj.adj_no,
                user_id=user.id,
            )
            total_value_delta += delta * lot.unit_cost

        db.add(
            StockAdjustmentLine(
                adj_id=adj.id,
                lot_id=lot.id,
                qty_system=qty_system,
                qty_counted=ln.qty_counted,
            )
        )

    publish(db, StockAdjusted(adj.id, body.adj_date, total_value_delta, adj.adj_no))
    return {"adj_no": adj.adj_no, "status": adj.status, "value_delta": str(total_value_delta)}

@router.get("/alerts/rop")
def get_rop_alerts(db: Session = Depends(get_db), user: User = Depends(require("inventory:read"))):
    rows = db.execute(text("SELECT * FROM v_saprotan_stock WHERE below_minimum = TRUE")).mappings().all()
    return list(rows)

@router.get("/alerts/expiry")
def get_expiry_alerts(db: Session = Depends(get_db), user: User = Depends(require("inventory:read"))):
    rows = db.execute(text("""
        SELECT l.id, l.batch_code, p.name AS product, g.code AS grade, l.qty_on_hand, l.expiry_date,
               (l.expiry_date - CURRENT_DATE) AS days_left
        FROM inventory_lots l
        JOIN products p ON p.id = l.product_id
        JOIN product_categories c ON c.id = p.category_id
        LEFT JOIN grade_definitions g ON g.id = l.grade_id
        WHERE l.qty_on_hand > 0 AND l.expiry_date IS NOT NULL
          AND l.expiry_date - CURRENT_DATE <= c.expiry_warning_days
        ORDER BY l.expiry_date
    """)).mappings().all()
    return list(rows)

