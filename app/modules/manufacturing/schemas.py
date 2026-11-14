from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

class SortingOutputIn(BaseModel):
    grade_id: int
    qty: Decimal = Field(ge=0)

class SortingInputIn(BaseModel):
    harvest_receipt_id: int
    qty_input: Decimal = Field(gt=0)
    outputs: list[SortingOutputIn]

class SortingOrderCreate(BaseModel):
    process_date: date = Field(default_factory=date.today)
    note: str | None = None
    inputs: list[SortingInputIn]

class QualityCheckIn(BaseModel):
    passed: bool
    notes: str | None = None

class QualityCheckOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    order_id: int
    inspector_user_id: int
    checked_at: datetime
    passed: bool
    notes: str | None

class PackagingMaterialIn(BaseModel):
    saprotan_id: int
    qty: Decimal = Field(gt=0)

class PackagingCreate(BaseModel):
    source_lot_id: int
    pack_unit: Literal["KG", "KARUNG", "IKAT", "PETI"]
    pack_size_kg: Decimal = Field(gt=0)
    pack_count: int = Field(gt=0)
    materials: list[PackagingMaterialIn] = Field(default_factory=list)

class SortingOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    order_no: str
    process_date: date
    status: str
    posted_at: datetime | None
    posted_by: int | None
    note: str | None

