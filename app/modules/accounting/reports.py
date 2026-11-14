# modules/accounting/reports.py
from datetime import date
from decimal import Decimal
from sqlalchemy import select, func, text
from sqlalchemy.orm import Session
from .models import Account, JournalEntry, JournalLine

def _balances(db: Session, start: date, end: date):
    return db.execute(
        select(
            Account.code,
            Account.name,
            Account.type,
            func.coalesce(func.sum(JournalLine.debit), 0).label("d"),
            func.coalesce(func.sum(JournalLine.credit), 0).label("c"),
        )
        .join(JournalLine, JournalLine.account_id == Account.id)
        .join(JournalEntry, JournalEntry.id == JournalLine.entry_id)
        .where(JournalEntry.entry_date.between(start, end))
        .group_by(Account.id)
        .order_by(Account.code)
    ).all()

def income_statement(db: Session, start: date, end: date) -> dict:
    rev, exp = [], []
    for code, name, typ, d, c in _balances(db, start, end):
        if typ == "REVENUE":
            rev.append({"code": code, "name": name, "amount": c - d})
        elif typ == "EXPENSE":
            exp.append({"code": code, "name": name, "amount": d - c})
    tr = sum((r["amount"] for r in rev), Decimal(0))
    te = sum((e["amount"] for e in exp), Decimal(0))
    cogs = sum((e["amount"] for e in exp if e["code"].startswith("5-")), Decimal(0))
    gross = tr - cogs
    return {
        "revenue": [{"code": r["code"], "name": r["name"], "amount": str(r["amount"])} for r in rev],
        "expenses": [{"code": e["code"], "name": e["name"], "amount": str(e["amount"])} for e in exp],
        "total_revenue": str(tr),
        "total_expense": str(te),
        "gross_profit": str(gross),
        "net_income": str(tr - te),
    }

def balance_sheet(db: Session, as_of: date) -> dict:
    rows = _balances(db, date(1900, 1, 1), as_of)
    assets = [(c, n, d - cr) for c, n, t, d, cr in rows if t == "ASSET"]
    liabs = [(c, n, cr - d) for c, n, t, d, cr in rows if t == "LIABILITY"]
    equity = [(c, n, cr - d) for c, n, t, d, cr in rows if t == "EQUITY"]
    earnings = sum((cr - d) for c, n, t, d, cr in rows if t == "REVENUE") - sum((d - cr) for c, n, t, d, cr in rows if t == "EXPENSE")

    total_assets = sum((a[2] for a in assets), Decimal(0))
    total_liabs = sum((l[2] for l in liabs), Decimal(0))
    total_equity = sum((e[2] for e in equity), Decimal(0))
    check = total_assets - (total_liabs + total_equity + earnings)

    return {
        "assets": [{"code": a[0], "name": a[1], "balance": str(a[2])} for a in assets],
        "liabilities": [{"code": l[0], "name": l[1], "balance": str(l[2])} for l in liabs],
        "equity": [{"code": e[0], "name": e[1], "balance": str(e[2])} for e in equity],
        "current_earnings": str(earnings),
        "total_assets": str(total_assets),
        "total_liabilities": str(total_liabs),
        "total_equity": str(total_equity + earnings),
        "check": str(check),  # harus 0
    }

def general_ledger(db: Session, account_code: str, start: date, end: date):
    return db.execute(
        text("""
        SELECT je.entry_date, je.entry_no, je.description, jl.debit, jl.credit,
               SUM(jl.debit - jl.credit) OVER (ORDER BY je.entry_date, je.id, jl.id) AS running
        FROM journal_lines jl
        JOIN journal_entries je ON je.id = jl.entry_id
        JOIN accounts a ON a.id = jl.account_id
        WHERE a.code = :c AND je.entry_date BETWEEN :s AND :e
        ORDER BY je.entry_date, je.id, jl.id
        """),
        {"c": account_code, "s": start, "e": end},
    ).mappings().all()

def batch_margin_report(db: Session, batch_code: str | None = None):
    stmt = "SELECT * FROM v_batch_margin"
    params = {}
    if batch_code:
        stmt += " WHERE batch_code = :b"
        params["b"] = batch_code
    rows = db.execute(text(stmt), params).mappings().all()

    total_penjualan = sum((Decimal(str(r["penjualan"])) for r in rows), Decimal(0))
    total_beli = sum((Decimal(str(r["harga_beli"])) for r in rows), Decimal(0))
    total_margin = total_penjualan - total_beli
    margin_pct = (total_margin / total_penjualan * 100).quantize(Decimal("0.01")) if total_penjualan else Decimal(0)

    return {
        "items": [dict(r) for r in rows],
        "total": {
            "penjualan": str(total_penjualan),
            "harga_beli": str(total_beli),
            "margin_kotor": str(total_margin),
            "margin_pct": str(margin_pct),
        },
    }

