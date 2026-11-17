# modules/reporting/esg_handlers.py
from datetime import date
from decimal import Decimal
from sqlalchemy import select, func, text
from sqlalchemy.orm import Session
from app.core.events import subscribe, SortingPosted, DeliveryPosted
from app.core.numbering import next_number, ym
from app.core.settings_store import get_setting
from app.modules.inventory.models import SaprotanIssue, SaprotanIssueLine
from app.modules.sales.models import DeliveryLine, DeliveryOrder
from .models import EsgLog

@subscribe(SortingPosted)
def on_sorting_esg(db, e: SortingPosted):
    by_batch: dict[str, dict] = {}
    for ln in e.lines:
        b = by_batch.setdefault(ln["batch_code"], {"total": Decimal(0), "reject": Decimal(0)})
        b["total"] += ln["qty"]
        if ln["is_reject"]:
            b["reject"] += ln["qty"]

    for code, v in by_batch.items():
        ratio = (v["reject"] / v["total"] * 100).quantize(Decimal("0.01")) if v["total"] else Decimal(0)
        existing = db.scalar(select(EsgLog).where(EsgLog.batch_code == code))
        if existing:
            existing.food_loss_ratio = ratio
        else:
            db.add(
                EsgLog(
                    esg_no=next_number(db, "ESG", ym(e.process_date), 3),
                    batch_code=code,
                    food_loss_ratio=ratio,
                )
            )

@subscribe(DeliveryPosted)
def on_delivery_esg(db, e: DeliveryPosted):
    do = db.get(DeliveryOrder, e.do_id)
    if not do:
        return
    factor = Decimal(str(get_setting(db, "esg.emission_factor_kg_per_ton_km", 0.1)))

    batches = db.execute(
        select(DeliveryLine.batch_code, func.sum(DeliveryLine.qty))
        .where(DeliveryLine.do_id == do.id)
        .group_by(DeliveryLine.batch_code)
    ).all()

    for batch_code, qty_kg in batches:
        log = db.scalar(select(EsgLog).where(EsgLog.batch_code == batch_code))
        if not log:
            log = EsgLog(
                esg_no=next_number(db, "ESG", ym(do.delivered_at), 3),
                batch_code=batch_code,
            )
            db.add(log)
            db.flush()

        buy, sell = db.execute(
            select(
                func.sum(DeliveryLine.qty * DeliveryLine.unit_cost),
                func.sum(DeliveryLine.qty * DeliveryLine.unit_price),
            ).where(DeliveryLine.batch_code == batch_code)
        ).one()

        if sell and sell > 0:
            log.farmer_margin_ratio = (buy / sell * 100).quantize(Decimal("0.01"))
        if do.distance_km:
            log.carbon_emission_kg = (do.distance_km * (qty_kg / 1000) * factor).quantize(Decimal("0.01"))

def esg_environmental(db: Session, start: date, end: date) -> dict:
    org = db.scalar(
        select(func.coalesce(func.sum(SaprotanIssueLine.qty), 0))
        .join(SaprotanIssue)
        .where(
            SaprotanIssueLine.fertilizer_type == "PUPUK_ORGANIK",
            SaprotanIssue.issue_date.between(start, end),
        )
    )
    chem = db.scalar(
        select(func.coalesce(func.sum(SaprotanIssueLine.qty), 0))
        .join(SaprotanIssue)
        .where(
            SaprotanIssueLine.fertilizer_type == "PUPUK_KIMIA",
            SaprotanIssue.issue_date.between(start, end),
        )
    )

    ratio = (org / (org + chem) * 100).quantize(Decimal("0.01")) if (org + chem) else Decimal(0)
    loss = db.execute(
        text("""
        SELECT p.name,
               SUM(CASE WHEN g.is_reject THEN o.qty ELSE 0 END) AS afkir,
               SUM(o.qty) AS total,
               ROUND(100 * SUM(CASE WHEN g.is_reject THEN o.qty ELSE 0 END) / NULLIF(SUM(o.qty), 0), 2) AS pct
        FROM sorting_outputs o
        JOIN sorting_inputs i ON i.id = o.input_id
        JOIN sorting_orders so ON so.id = i.order_id
        JOIN harvest_receipts h ON h.id = i.harvest_receipt_id
        JOIN products p ON p.id = h.product_id
        JOIN grade_definitions g ON g.id = o.grade_id
        WHERE so.status = 'POSTED' AND so.process_date BETWEEN :s AND :e
        GROUP BY p.name
        """),
        {"s": start, "e": end},
    ).mappings().all()

    return {
        "organic_ratio_pct": str(ratio),
        "organic_kg": str(org),
        "chemical_kg": str(chem),
        "food_loss_by_commodity": [dict(r) for r in loss],
    }

