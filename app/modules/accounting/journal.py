# modules/accounting/journal.py
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.errors import DomainError
from app.core.numbering import next_number, ym
from .models import Account, AccountingPeriod, JournalEntry, JournalLine

@dataclass
class JLine:
    account: str
    debit: Decimal = Decimal(0)
    credit: Decimal = Decimal(0)
    memo: str | None = None
    party_type: str | None = None
    party_id: int | None = None

def post_journal(
    db: Session,
    *,
    entry_date: date,
    description: str,
    lines: list[JLine],
    source_type: str,
    source_id: int | None = None,
    source_no: str | None = None,
    user_id: int | None = None,
    reversal_of: JournalEntry | None = None,
) -> JournalEntry:
    lines = [l for l in lines if l.debit or l.credit]
    d, c = sum((l.debit for l in lines), Decimal(0)), sum((l.credit for l in lines), Decimal(0))
    if len(lines) < 2 or d != c or d <= 0:
        raise DomainError("JOURNAL_UNBALANCED", f"Jurnal tidak seimbang: debit {d} != kredit {c}", 500)

    period = db.scalar(
        select(AccountingPeriod).where(
            AccountingPeriod.year == entry_date.year,
            AccountingPeriod.month == entry_date.month,
        )
    )
    if not period or period.status != "OPEN":
        raise DomainError("PERIOD_CLOSED", f"Periode {entry_date:%m/%Y} tidak terbuka", 422)

    accs = {a.code: a for a in db.scalars(select(Account).where(Account.code.in_({l.account for l in lines})))}
    missing = {l.account for l in lines} - set(accs)
    if missing:
        raise DomainError("ACCOUNT_NOT_FOUND", f"Akun tidak ada: {missing}", 500)

    je = JournalEntry(
        entry_no=next_number(db, "JV", ym(entry_date), 5),
        entry_date=entry_date,
        period_id=period.id,
        description=description,
        source_type=source_type,
        source_id=source_id,
        source_no=source_no,
        reversal_of_id=reversal_of.id if reversal_of else None,
        created_by=user_id,
    )
    db.add(je)
    db.flush()

    for l in lines:
        db.add(
            JournalLine(
                entry_id=je.id,
                account_id=accs[l.account].id,
                debit=l.debit,
                credit=l.credit,
                memo=l.memo,
                party_type=l.party_type,
                party_id=l.party_id,
            )
        )
    db.flush()
    return je

def reverse_journal(db: Session, original: JournalEntry, user_id: int | None, reason: str, on_date: date) -> JournalEntry:
    """Koreksi = dokumen pembalik (SRS-NFR-004). Jurnal asli tidak pernah diubah selain penanda reversed_by_id."""
    if original.reversed_by_id:
        raise DomainError("INVALID_STATE", "Jurnal sudah dibalik", 422)

    swapped = [
        JLine(
            l.account.code,
            debit=l.credit,
            credit=l.debit,
            memo=f"Pembalik: {l.memo or ''}",
            party_type=l.party_type,
            party_id=l.party_id,
        )
        for l in original.lines
    ]
    rev = post_journal(
        db,
        entry_date=on_date,
        description=f"PEMBALIK {original.entry_no}: {reason}",
        lines=swapped,
        source_type="REVERSAL",
        source_id=original.id,
        source_no=original.entry_no,
        user_id=user_id,
        reversal_of=original,
    )
    original.reversed_by_id = rev.id
    return rev

