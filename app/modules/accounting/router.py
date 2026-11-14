# modules/accounting/router.py
from datetime import date, datetime
from decimal import Decimal
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import current_user, require
from app.core.errors import DomainError
from app.modules.auth.models import User
from . import journal, payment_service, reports, shu
from .journal import JLine as L
from .models import Account, AccountingPeriod, JournalEntry, OperatingExpense, Payable, Receivable
from .schemas import (
    ExpenseCreate,
    PaymentCustomerIn,
    PaymentMemberIn,
    PaymentSupplierIn,
    ShuCalculateIn,
)

router = APIRouter(prefix="/accounting", tags=["Accounting"])
TZ = ZoneInfo(settings.timezone)

@router.get("/accounts")
def list_accounts(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.scalars(select(Account).where(Account.is_active == True).order_by(Account.code)).all()

@router.get("/journals")
def list_journals(
    entry_date: date | None = None,
    source_type: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require("acct:read")),
):
    stmt = select(JournalEntry)
    if entry_date:
        stmt = stmt.where(JournalEntry.entry_date == entry_date)
    if source_type:
        stmt = stmt.where(JournalEntry.source_type == source_type)
    entries = db.scalars(stmt.order_by(JournalEntry.id.desc()).limit(100)).all()
    return [
        {
            "id": e.id,
            "entry_no": e.entry_no,
            "entry_date": e.entry_date,
            "description": e.description,
            "source_type": e.source_type,
            "source_no": e.source_no,
            "reversal_of_id": e.reversal_of_id,
            "reversed_by_id": e.reversed_by_id,
            "lines": [
                {
                    "account_code": l.account.code,
                    "account_name": l.account.name,
                    "debit": str(l.debit),
                    "credit": str(l.credit),
                    "memo": l.memo,
                }
                for l in e.lines
            ],
        }
        for e in entries
    ]

@router.post("/journals/{entry_id}/reverse")
def reverse_journal_entry(
    entry_id: int,
    reason: str = Query(...),
    reverse_date: date | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require("acct:post")),
):
    orig = db.get(JournalEntry, entry_id)
    if not orig:
        raise DomainError("NOT_FOUND", "Jurnal tidak ditemukan", 404)
    target_date = reverse_date or date.today()
    rev = journal.reverse_journal(db, orig, user.id, reason, target_date)
    return {"id": rev.id, "entry_no": rev.entry_no, "reversal_of": orig.entry_no}

@router.post("/payments/member", status_code=201)
def pay_member(
    body: PaymentMemberIn,
    db: Session = Depends(get_db),
    user: User = Depends(require("acct:payment")),
):
    pay = payment_service.pay_member(db, user, body)
    return {"id": pay.id, "payment_no": pay.payment_no, "cash_amount": str(pay.amount)}

@router.post("/payments/supplier", status_code=201)
def pay_supplier(
    body: PaymentSupplierIn,
    db: Session = Depends(get_db),
    user: User = Depends(require("acct:payment")),
):
    pay = payment_service.pay_supplier(db, user, body)
    return {"id": pay.id, "payment_no": pay.payment_no, "amount": str(pay.amount)}

@router.post("/payments/customer", status_code=201)
def receive_customer_payment(
    body: PaymentCustomerIn,
    db: Session = Depends(get_db),
    user: User = Depends(require("acct:payment")),
):
    pay = payment_service.receive_from_customer(db, user, body)
    return {"id": pay.id, "payment_no": pay.payment_no, "amount": str(pay.amount)}

@router.post("/expenses", status_code=201)
def record_operating_expense(
    body: ExpenseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("acct:post")),
):
    acc = db.get(Account, body.account_id)
    if not acc or acc.type != "EXPENSE":
        raise DomainError("VALIDATION", "Akun beban tidak valid", 422)

    je = journal.post_journal(
        db,
        entry_date=body.expense_date,
        description=f"Beban operasional: {body.category} - {body.description or ''}",
        lines=[
            L(acc.code, debit=body.amount),
            L("1-1100", credit=body.amount),  # Kas
        ],
        source_type="EXPENSE",
        user_id=user.id,
    )

    exp = OperatingExpense(
        expense_date=body.expense_date,
        category=body.category,
        account_id=body.account_id,
        amount=body.amount,
        description=body.description,
        journal_entry_id=je.id,
        created_by=user.id,
    )
    db.add(exp)
    db.flush()
    return {"id": exp.id, "journal_no": je.entry_no, "amount": str(exp.amount)}

@router.get("/reports/income-statement")
def get_income_statement(
    start: date = Query(default=date(2026, 1, 1)),
    end: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
    user: User = Depends(require("acct:read")),
):
    return reports.income_statement(db, start, end)

@router.get("/reports/balance-sheet")
def get_balance_sheet(
    as_of: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
    user: User = Depends(require("acct:read")),
):
    return reports.balance_sheet(db, as_of)

@router.get("/reports/general-ledger")
def get_general_ledger(
    account_code: str = Query(...),
    start: date = Query(default=date(2026, 1, 1)),
    end: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
    user: User = Depends(require("acct:read")),
):
    rows = reports.general_ledger(db, account_code, start, end)
    return list(rows)

@router.get("/reports/margin")
def get_margin_report(
    batch_code: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require("acct:read")),
):
    return reports.batch_margin_report(db, batch_code)

@router.post("/shu/calculate", status_code=201)
def run_shu_calculation(
    body: ShuCalculateIn,
    db: Session = Depends(get_db),
    user: User = Depends(require("acct:post")),
):
    run = shu.calculate_shu(db, user, body.period_start, body.period_end)
    return {
        "id": run.id,
        "net_income": str(run.net_income),
        "status": run.status,
        "allocations_count": len(run.allocations),
    }

@router.post("/periods/{year}/{month}/close")
def close_accounting_period(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    user: User = Depends(require("acct:close")),
):
    period = db.scalar(select(AccountingPeriod).where(AccountingPeriod.year == year, AccountingPeriod.month == month))
    if not period:
        raise DomainError("NOT_FOUND", "Periode tidak ditemukan", 404)
    if period.status == "CLOSED":
        raise DomainError("INVALID_STATE", "Periode sudah ditutup", 422)
    period.status = "CLOSED"
    period.closed_at = datetime.now(TZ)
    period.closed_by = user.id
    db.flush()
    return {"message": f"Periode {month:02d}/{year} berhasil ditutup", "status": period.status}

