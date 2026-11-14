# modules/inventory/issue_service.py
from datetime import datetime, date
from decimal import Decimal
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import DomainError
from app.core.events import publish, SaprotanIssued
from app.core.numbering import next_number, ym
from app.modules.master.models import Member, SaprotanItem
from .models import SaprotanIssue, SaprotanIssueLine
from .service import InventoryService

TZ = ZoneInfo(settings.timezone)

def issue_to_member(db: Session, user, data) -> SaprotanIssue:
    member = db.get(Member, data.member_id)
    if not member:
        raise DomainError("NOT_FOUND", "Anggota tidak ditemukan", 404)
    if member.status != "AKTIF":
        raise DomainError("MEMBER_INACTIVE", "Anggota nonaktif", 422)

    now = datetime.now(TZ)
    issue = SaprotanIssue(
        issue_no=next_number(db, "ISS", ym(now), 3),
        member_id=member.id,
        warehouse_id=data.warehouse_id,
        issue_date=data.issue_date,
        status="POSTED",
        created_by=user.id if user else None,
    )
    db.add(issue)
    db.flush()

    cost_total = Decimal(0)
    price_total = Decimal(0)
    for ln in data.lines:
        item = db.get(SaprotanItem, ln.saprotan_id)
        if not item:
            raise DomainError("NOT_FOUND", f"Item saprotan {ln.saprotan_id} tidak ditemukan", 404)
        lot = InventoryService.issue_saprotan(
            db,
            saprotan_id=item.id,
            warehouse_id=data.warehouse_id,
            qty=ln.qty,
            ref_type="SAPROTAN_ISSUE",
            ref_id=issue.id,
            ref_no=issue.issue_no,
            user_id=user.id if user else None,
        )
        db.add(
            SaprotanIssueLine(
                issue_id=issue.id,
                saprotan_id=item.id,
                qty=ln.qty,
                unit_cost=lot.unit_cost,
                unit_price=item.member_price,
                fertilizer_type=item.type,
            )
        )
        cost_total += ln.qty * lot.unit_cost
        price_total += ln.qty * item.member_price

    publish(
        db,
        SaprotanIssued(
            issue.id,
            member.id,
            data.issue_date,
            cost_total,
            price_total,
            issue.issue_no,
        ),
    )
    return issue

