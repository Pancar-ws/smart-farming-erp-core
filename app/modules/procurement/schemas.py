from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

class HarvestIn(BaseModel):
    member_code: str
    product_id: int
    warehouse_id: int
    gross_kg: Decimal = Field(gt=0)
    tare_kg: Decimal = Field(default=Decimal(0), ge=0)
    moisture_pct: Decimal | None = Field(default=None, ge=0, le=100)
    client_request_id: str | None = None

class HarvestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    receipt_no: str
    batch_code: str
    member_id: int
    product_id: int
    warehouse_id: int
    received_at: datetime
    gross_kg: Decimal
    tare_kg: Decimal
    wet_tare_pct: Decimal
    net_kg: Decimal
    moisture_pct: Decimal | None
    status: str

class POLineIn(BaseModel):
    saprotan_id: int
    qty: Decimal = Field(gt=0)
    unit_price: Decimal = Field(ge=0)

class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    order_date: date = Field(default_factory=date.today)
    expected_date: date | None = None
    note: str | None = None
    lines: list[POLineIn]

class POOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    po_no: str
    supplier_id: int
    order_date: date
    expected_date: date | None
    status: str
    is_auto: bool
    total: Decimal
    note: str | None

class GRLineIn(BaseModel):
    po_line_id: int
    qty_received: Decimal = Field(gt=0)

class GoodsReceiptCreate(BaseModel):
    po_id: int
    warehouse_id: int
    received_date: date = Field(default_factory=date.today)
    note: str | None = None
    lines: list[GRLineIn]

class GROut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    gr_no: str
    po_id: int
    warehouse_id: int
    received_date: date
    status: str

