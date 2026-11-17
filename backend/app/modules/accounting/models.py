from datetime import datetime, date
from decimal import Decimal
from typing import Any
from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.audit import Auditable
from app.core.database import Base

Money = Numeric(16, 2)

class Account(Base):
    __tablename__ = "accounts"
    __table_args__ = (
        CheckConstraint("type IN ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE')", name="ck_acc_type"),
        CheckConstraint("code ~ '^[1-6]-[0-9]{4}$'", name="ck_acc_code"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(10), nullable=False)
    is_postable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

class AccountingPeriod(Base):
    __tablename__ = "accounting_periods"
    __table_args__ = (
        UniqueConstraint("year", "month", name="uq_period"),
        CheckConstraint("month BETWEEN 1 AND 12", name="ck_per_month"),
        CheckConstraint("status IN ('OPEN','CLOSED')", name="ck_per_status"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    year: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    month: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    status: Mapped[str] = mapped_column(String(8), default="OPEN", nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    closed_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))

class JournalEntry(Base):
    __tablename__ = "journal_entries"
    __table_args__ = (
        CheckConstraint("reversal_of_id IS NULL OR reversal_of_id <> id", name="ck_je_self"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    entry_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    period_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("accounting_periods.id"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    source_type: Mapped[str] = mapped_column(String(30), nullable=False)
    source_id: Mapped[int | None] = mapped_column(BigInteger)
    source_no: Mapped[str | None] = mapped_column(String(30))
    reversal_of_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("journal_entries.id"))
    reversed_by_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("journal_entries.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))

    period: Mapped["AccountingPeriod"] = relationship("AccountingPeriod")
    lines: Mapped[list["JournalLine"]] = relationship("JournalLine", back_populates="entry", cascade="all, delete-orphan")

class JournalLine(Base):
    __tablename__ = "journal_lines"
    __table_args__ = (
        CheckConstraint("debit >= 0 AND credit >= 0 AND (debit = 0 OR credit = 0) AND (debit + credit) > 0", name="ck_jl_amount"),
        CheckConstraint("party_type IS NULL OR party_type IN ('MEMBER','SUPPLIER','CUSTOMER')", name="ck_jl_party"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    entry_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("journal_entries.id"), nullable=False)
    account_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("accounts.id"), nullable=False)
    debit: Mapped[Decimal] = mapped_column(Money, default=Decimal(0), nullable=False)
    credit: Mapped[Decimal] = mapped_column(Money, default=Decimal(0), nullable=False)
    memo: Mapped[str | None] = mapped_column(Text)
    party_type: Mapped[str | None] = mapped_column(String(10))
    party_id: Mapped[int | None] = mapped_column(BigInteger)

    entry: Mapped["JournalEntry"] = relationship("JournalEntry", back_populates="lines")
    account: Mapped["Account"] = relationship("Account")

class Payable(Base, Auditable):
    __tablename__ = "payables"
    __table_args__ = (
        CheckConstraint(
            """(party_type = 'MEMBER' AND member_id IS NOT NULL AND supplier_id IS NULL)
            OR (party_type = 'SUPPLIER' AND supplier_id IS NOT NULL AND member_id IS NULL)""",
            name="ck_pay_party",
        ),
        CheckConstraint("amount > 0 AND paid >= 0 AND paid <= amount", name="ck_pay_amount"),
        CheckConstraint("status IN ('OPEN','PARTIAL','PAID','VOID')", name="ck_pay_status"),
        CheckConstraint("(status = 'PAID' AND paid = amount) OR (status <> 'PAID')", name="ck_pay_state"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    party_type: Mapped[str] = mapped_column(String(10), nullable=False)
    member_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("members.id"))
    supplier_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("suppliers.id"))
    source_type: Mapped[str] = mapped_column(String(30), nullable=False)
    source_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    source_no: Mapped[str | None] = mapped_column(String(30))
    amount: Mapped[Decimal] = mapped_column(Money, nullable=False)
    paid: Mapped[Decimal] = mapped_column(Money, default=Decimal(0), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(8), default="OPEN", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    member: Mapped["Member | None"] = relationship("Member")
    supplier: Mapped["Supplier | None"] = relationship("Supplier")

class Receivable(Base, Auditable):
    __tablename__ = "receivables"
    __table_args__ = (
        CheckConstraint(
            """(party_type = 'CUSTOMER' AND customer_id IS NOT NULL AND member_id IS NULL)
            OR (party_type = 'MEMBER' AND member_id IS NOT NULL AND customer_id IS NULL)""",
            name="ck_rec_party",
        ),
        CheckConstraint("amount > 0 AND paid >= 0 AND paid <= amount", name="ck_rec_amount"),
        CheckConstraint("status IN ('OPEN','PARTIAL','PAID','VOID')", name="ck_rec_status"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    party_type: Mapped[str] = mapped_column(String(10), nullable=False)
    customer_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("customers.id"))
    member_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("members.id"))
    source_type: Mapped[str] = mapped_column(String(30), nullable=False)
    source_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    source_no: Mapped[str | None] = mapped_column(String(30))
    amount: Mapped[Decimal] = mapped_column(Money, nullable=False)
    paid: Mapped[Decimal] = mapped_column(Money, default=Decimal(0), nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(8), default="OPEN", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    customer: Mapped["Customer | None"] = relationship("Customer")
    member: Mapped["Member | None"] = relationship("Member")

class Payment(Base, Auditable):
    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("direction IN ('PAY','RECEIVE')", name="ck_pm_dir"),
        CheckConstraint(
            """(party_type = 'MEMBER' AND member_id IS NOT NULL AND supplier_id IS NULL AND customer_id IS NULL)
            OR (party_type = 'SUPPLIER' AND supplier_id IS NOT NULL AND member_id IS NULL AND customer_id IS NULL)
            OR (party_type = 'CUSTOMER' AND customer_id IS NOT NULL AND member_id IS NULL AND supplier_id IS NULL)""",
            name="ck_pm_party",
        ),
        CheckConstraint("method IN ('TUNAI','TRANSFER','LAINNYA')", name="ck_pm_method"),
        CheckConstraint("amount >= 0", name="ck_pm_amount"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    payment_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    direction: Mapped[str] = mapped_column(String(7), nullable=False)
    party_type: Mapped[str] = mapped_column(String(10), nullable=False)
    member_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("members.id"))
    supplier_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("suppliers.id"))
    customer_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("customers.id"))
    paid_date: Mapped[date] = mapped_column(Date, nullable=False)
    method: Mapped[str] = mapped_column(String(10), default="TUNAI", nullable=False)
    amount: Mapped[Decimal] = mapped_column(Money, nullable=False)
    external_ref: Mapped[str | None] = mapped_column(String(60))
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))

    allocations: Mapped[list["PaymentAllocation"]] = relationship("PaymentAllocation", back_populates="payment")

class PaymentAllocation(Base):
    __tablename__ = "payment_allocations"
    __table_args__ = (
        CheckConstraint("(payable_id IS NULL) <> (receivable_id IS NULL)", name="ck_pa_one"),
        CheckConstraint("amount > 0", name="ck_pa_amount"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    payment_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("payments.id"), nullable=False)
    payable_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("payables.id"))
    receivable_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("receivables.id"))
    amount: Mapped[Decimal] = mapped_column(Money, nullable=False)
    is_offset: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    payment: Mapped["Payment"] = relationship("Payment", back_populates="allocations")
    payable: Mapped["Payable | None"] = relationship("Payable")
    receivable: Mapped["Receivable | None"] = relationship("Receivable")

class OperatingExpense(Base, Auditable):
    __tablename__ = "operating_expenses"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_exp_amount"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)
    category: Mapped[str] = mapped_column(String(40), nullable=False)
    account_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("accounts.id"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Money, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    journal_entry_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("journal_entries.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))

    account: Mapped["Account"] = relationship("Account")

class ShuRun(Base, Auditable):
    __tablename__ = "shu_runs"
    __table_args__ = (
        CheckConstraint("period_end >= period_start", name="ck_shu_period"),
        CheckConstraint("status IN ('DRAFT','FINAL')", name="ck_shu_status"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    net_income: Mapped[Decimal] = mapped_column(Money, nullable=False)
    config: Mapped[Any] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(String(8), default="DRAFT", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))

    allocations: Mapped[list["ShuAllocation"]] = relationship("ShuAllocation", back_populates="run", cascade="all, delete-orphan")

class ShuAllocation(Base):
    __tablename__ = "shu_allocations"
    __table_args__ = (
        UniqueConstraint("run_id", "member_id", name="uq_shu_member"),
        CheckConstraint("participation >= 0 AND amount >= 0", name="ck_shua"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    run_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("shu_runs.id", ondelete="CASCADE"), nullable=False)
    member_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("members.id"), nullable=False)
    participation: Mapped[Decimal] = mapped_column(Money, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Money, nullable=False)

    run: Mapped["ShuRun"] = relationship("ShuRun", back_populates="allocations")
    member: Mapped["Member"] = relationship("Member")

