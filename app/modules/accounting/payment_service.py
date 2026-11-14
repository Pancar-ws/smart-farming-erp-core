# modules/accounting/payment_service.py
from datetime import date
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import DomainError
from app.core.numbering import next_number, ym
from .journal import post_journal, JLine as L
from .models import Payable, Payment, PaymentAllocation, Receivable

KAS = "1-1100"
PIUT_USAHA = "1-2100"
PIUT_SAPROTAN = "1-2200"
HUT_SUPP = "2-1100"
HUT_ANGGOTA = "2-1200"

def pay_member(db: Session, user, data) -> Payment:
    """data: member_id, paid_date, method, external_ref, allocations:[{payable_id, amount}], offset_receivable_ids:[...]"""
    gross = Decimal(0)
    alloc_rows = []
    for a in data.allocations:
        p = db.scalar(
            select(Payable)
            .where(Payable.id == a.payable_id, Payable.member_id == data.member_id)
            .with_for_update()
        )
        if not p:
            raise DomainError("NOT_FOUND", f"Hutang ID {a.payable_id} tidak ditemukan", 404)
        if a.amount <= 0 or p.paid + a.amount > p.amount:
            raise DomainError("VALIDATION", "Alokasi melebihi sisa hutang", 422)
        p.paid += a.amount
        p.status = "PAID" if p.paid == p.amount else "PARTIAL"
        gross += a.amount
        alloc_rows.append((p.id, a.amount, False))

    # Potong piutang saprotan anggota (SDD 6.4 tahap 9)
    offset = Decimal(0)
    offset_alloc_rows = []
    for rid in (data.offset_receivable_ids or []):
        r = db.scalar(
            select(Receivable)
            .where(Receivable.id == rid, Receivable.member_id == data.member_id)
            .with_for_update()
        )
        if not r:
            continue
        take = min(r.amount - r.paid, gross - offset)
        if take <= 0:
            continue
        r.paid += take
        r.status = "PAID" if r.paid == r.amount else "PARTIAL"
        offset += take
        offset_alloc_rows.append((r.id, take, True))

    cash = gross - offset
    pay = Payment(
        payment_no=next_number(db, "PAY", ym(data.paid_date), 4),
        direction="PAY",
        party_type="MEMBER",
        member_id=data.member_id,
        paid_date=data.paid_date,
        method=data.method,
        amount=cash,
        external_ref=data.external_ref,
        note=getattr(data, "note", None),
        created_by=user.id if user else None,
    )
    db.add(pay)
    db.flush()

    for p_id, amt, is_off in alloc_rows:
        db.add(PaymentAllocation(payment_id=pay.id, payable_id=p_id, amount=amt, is_offset=is_off))
    for r_id, amt, is_off in offset_alloc_rows:
        db.add(PaymentAllocation(payment_id=pay.id, receivable_id=r_id, amount=amt, is_offset=is_off))

    lines = [L(HUT_ANGGOTA, debit=gross, party_type="MEMBER", party_id=data.member_id)]
    if offset:
        lines.append(L(PIUT_SAPROTAN, credit=offset, memo="Potong piutang saprotan", party_type="MEMBER", party_id=data.member_id))
    if cash:
        lines.append(L(KAS, credit=cash))

    post_journal(
        db,
        entry_date=data.paid_date,
        description=f"Pembayaran hasil panen {pay.payment_no}",
        lines=lines,
        source_type="PAYMENT",
        source_id=pay.id,
        source_no=pay.payment_no,
        user_id=user.id if user else None,
    )
    return pay

def pay_supplier(db: Session, user, data) -> Payment:
    gross = Decimal(0)
    alloc_rows = []
    for a in data.allocations:
        p = db.scalar(
            select(Payable)
            .where(Payable.id == a.payable_id, Payable.supplier_id == data.supplier_id)
            .with_for_update()
        )
        if not p:
            raise DomainError("NOT_FOUND", f"Hutang ID {a.payable_id} tidak ditemukan", 404)
        if a.amount <= 0 or p.paid + a.amount > p.amount:
            raise DomainError("VALIDATION", "Alokasi melebihi sisa hutang", 422)
        p.paid += a.amount
        p.status = "PAID" if p.paid == p.amount else "PARTIAL"
        gross += a.amount
        alloc_rows.append((p.id, a.amount))

    pay = Payment(
        payment_no=next_number(db, "PAY", ym(data.paid_date), 4),
        direction="PAY",
        party_type="SUPPLIER",
        supplier_id=data.supplier_id,
        paid_date=data.paid_date,
        method=data.method,
        amount=gross,
        external_ref=data.external_ref,
        created_by=user.id if user else None,
    )
    db.add(pay)
    db.flush()

    for p_id, amt in alloc_rows:
        db.add(PaymentAllocation(payment_id=pay.id, payable_id=p_id, amount=amt, is_offset=False))

    post_journal(
        db,
        entry_date=data.paid_date,
        description=f"Pembayaran hutang supplier {pay.payment_no}",
        lines=[
            L(HUT_SUPP, debit=gross, party_type="SUPPLIER", party_id=data.supplier_id),
            L(KAS, credit=gross),
        ],
        source_type="PAYMENT",
        source_id=pay.id,
        source_no=pay.payment_no,
        user_id=user.id if user else None,
    )
    return pay

def receive_from_customer(db: Session, user, data) -> Payment:
    gross = Decimal(0)
    alloc_rows = []
    for a in data.allocations:
        r = db.scalar(
            select(Receivable)
            .where(Receivable.id == a.receivable_id, Receivable.customer_id == data.customer_id)
            .with_for_update()
        )
        if not r:
            raise DomainError("NOT_FOUND", f"Piutang ID {a.receivable_id} tidak ditemukan", 404)
        if a.amount <= 0 or r.paid + a.amount > r.amount:
            raise DomainError("VALIDATION", "Alokasi melebihi sisa piutang", 422)
        r.paid += a.amount
        r.status = "PAID" if r.paid == r.amount else "PARTIAL"
        gross += a.amount
        alloc_rows.append((r.id, a.amount))

    pay = Payment(
        payment_no=next_number(db, "PAY", ym(data.paid_date), 4),
        direction="RECEIVE",
        party_type="CUSTOMER",
        customer_id=data.customer_id,
        paid_date=data.paid_date,
        method=data.method,
        amount=gross,
        external_ref=data.external_ref,
        created_by=user.id if user else None,
    )
    db.add(pay)
    db.flush()

    for r_id, amt in alloc_rows:
        db.add(PaymentAllocation(payment_id=pay.id, receivable_id=r_id, amount=amt, is_offset=False))

    post_journal(
        db,
        entry_date=data.paid_date,
        description=f"Penerimaan pembayaran pelanggan {pay.payment_no}",
        lines=[
            L(KAS, debit=gross),
            L(PIUT_USAHA, credit=gross, party_type="CUSTOMER", party_id=data.customer_id),
        ],
        source_type="PAYMENT",
        source_id=pay.id,
        source_no=pay.payment_no,
        user_id=user.id if user else None,
    )
    return pay

