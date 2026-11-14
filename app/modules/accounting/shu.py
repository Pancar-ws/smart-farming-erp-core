# modules/accounting/shu.py
from datetime import date
from decimal import Decimal
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.errors import DomainError
from app.core.settings_store import get_setting
from .models import Payable, ShuAllocation, ShuRun
from .reports import income_statement

DEFAULT_SHU = {
    "cadangan": 40,
    "jasa_usaha_anggota": 40,
    "pengurus": 10,
    "pendidikan": 5,
    "sosial": 5,
}

def calculate_shu(db: Session, user, start: date, end: date) -> ShuRun:
    is_ = income_statement(db, start, end)
    net = Decimal(is_["net_income"])
    cfg = get_setting(db, "shu.formula", DEFAULT_SHU)

    if sum(cfg.values()) != 100:
        raise DomainError("VALIDATION", "Total persentase SHU harus 100", 422)

    run = ShuRun(
        period_start=start,
        period_end=end,
        net_income=net,
        config=cfg,
        status="DRAFT",
        created_by=user.id if user else None,
    )
    db.add(run)
    db.flush()

    if net <= 0:
        return run

    pool = net * Decimal(cfg["jasa_usaha_anggota"]) / 100
    # Partisipasi ekonomi = nilai setoran panen anggota pada periode (dari hutang panen)
    parts = db.execute(
        select(Payable.member_id, func.sum(Payable.amount))
        .where(
            Payable.party_type == "MEMBER",
            Payable.status != "VOID",
            Payable.created_at.between(start, end),
        )
        .group_by(Payable.member_id)
    ).all()

    total_part = sum((p[1] for p in parts), Decimal(0)) or Decimal(1)
    for member_id, part in parts:
        db.add(
            ShuAllocation(
                run_id=run.id,
                member_id=member_id,
                participation=part,
                amount=(pool * part / total_part).quantize(Decimal("0.01")),
            )
        )
    return run

