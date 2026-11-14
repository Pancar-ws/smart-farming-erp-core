from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

class PayableAllocIn(BaseModel):
    payable_id: int
    amount: Decimal = Field(gt=0)

class PaymentMemberIn(BaseModel):
    member_id: int
    paid_date: date = Field(default_factory=date.today)
    method: Literal["TUNAI", "TRANSFER", "LAINNYA"] = "TUNAI"
    external_ref: str | None = None
    note: str | None = None
    allocations: list[PayableAllocIn]
    offset_receivable_ids: list[int] = Field(default_factory=list)

class PaymentSupplierIn(BaseModel):
    supplier_id: int
    paid_date: date = Field(default_factory=date.today)
    method: Literal["TUNAI", "TRANSFER", "LAINNYA"] = "TUNAI"
    external_ref: str | None = None
    allocations: list[PayableAllocIn]

class ReceivableAllocIn(BaseModel):
    receivable_id: int
    amount: Decimal = Field(gt=0)

class PaymentCustomerIn(BaseModel):
    customer_id: int
    paid_date: date = Field(default_factory=date.today)
    method: Literal["TUNAI", "TRANSFER", "LAINNYA"] = "TUNAI"
    external_ref: str | None = None
    allocations: list[ReceivableAllocIn]

class ExpenseCreate(BaseModel):
    expense_date: date = Field(default_factory=date.today)
    category: str
    account_id: int
    amount: Decimal = Field(gt=0)
    description: str | None = None

class ShuCalculateIn(BaseModel):
    period_start: date
    period_end: date

class PeriodCloseIn(BaseModel):
    year: int
    month: int

