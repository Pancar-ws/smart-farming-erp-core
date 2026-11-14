from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

class SaprotanIssueLineIn(BaseModel):
    saprotan_id: int
    qty: Decimal = Field(gt=0)

class SaprotanIssueCreate(BaseModel):
    member_id: int
    warehouse_id: int
    issue_date: date = Field(default_factory=date.today)
    lines: list[SaprotanIssueLineIn]

class SaprotanUsageCreate(BaseModel):
    member_id: int
    saprotan_id: int
    qty: Decimal = Field(gt=0)
    used_at: date = Field(default_factory=date.today)
    area_ha: Decimal | None = None
    note: str | None = None

class StockTransferLineIn(BaseModel):
    lot_id: int
    qty: Decimal = Field(gt=0)

class StockTransferCreate(BaseModel):
    from_warehouse_id: int
    to_warehouse_id: int
    transfer_date: date = Field(default_factory=date.today)
    lines: list[StockTransferLineIn]

class StockAdjustmentLineIn(BaseModel):
    lot_id: int
    qty_counted: Decimal = Field(ge=0)

class StockAdjustmentCreate(BaseModel):
    adj_date: date = Field(default_factory=date.today)
    reason: str
    lines: list[StockAdjustmentLineIn]

class LotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    stock_category: str
    warehouse_id: int
    saprotan_id: int | None
    product_id: int | None
    grade_id: int | None
    batch_code: str | None
    qty_on_hand: Decimal
    qty_reserved: Decimal
    unit_cost: Decimal
    received_at: datetime
    expiry_date: date | None

class MovementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    lot_id: int
    movement_type: str
    qty_delta: Decimal
    balance_after: Decimal
    ref_type: str | None
    ref_id: int | None
    ref_no: str | None
    created_at: datetime

