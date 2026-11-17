from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

class SOLineIn(BaseModel):
    product_id: int
    grade_id: int
    qty: Decimal = Field(gt=0)

class SalesOrderCreate(BaseModel):
    customer_id: int
    order_date: date = Field(default_factory=date.today)
    note: str | None = None
    lines: list[SOLineIn]

class ShipIn(BaseModel):
    auto_invoice: bool = True
    vehicle_type: str | None = None
    distance_km: Decimal | None = None

class SalesOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    so_no: str
    customer_id: int
    segment: str
    order_date: date
    status: str
    total: Decimal
    note: str | None

class DeliveryOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    do_no: str
    so_id: int
    delivered_at: datetime
    vehicle_type: str | None
    distance_km: Decimal | None
    status: str

class InvoiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    invoice_no: str
    do_id: int
    customer_id: int
    issue_date: date
    due_date: date
    total: Decimal
    status: str

class ReturnLineIn(BaseModel):
    delivery_line_id: int
    qty: Decimal = Field(gt=0)
    condition: Literal["LAYAK", "RUSAK"]

class ReturnCreate(BaseModel):
    customer_id: int
    return_date: date = Field(default_factory=date.today)
    reason: str | None = None
    lines: list[ReturnLineIn]

