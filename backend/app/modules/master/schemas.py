from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field

# --- Member ---
class MemberCreate(BaseModel):
    nik: str = Field(min_length=16, max_length=16)
    name: str = Field(min_length=1, max_length=100)
    address: str | None = None
    area_ha: Decimal = Field(gt=0)
    main_commodity: Literal["Pangan", "Hortikultura Sayur", "Buah"]
    phone: str | None = None
    status: Literal["AKTIF", "NON_AKTIF"] = "AKTIF"
    joined_at: date = Field(default_factory=date.today)

class MemberUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    area_ha: Decimal | None = None
    main_commodity: Literal["Pangan", "Hortikultura Sayur", "Buah"] | None = None
    phone: str | None = None
    status: Literal["AKTIF", "NON_AKTIF"] | None = None

class MemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    member_code: str
    nik: str
    name: str
    address: str | None
    area_ha: Decimal
    main_commodity: str
    phone: str | None
    status: str
    joined_at: date

# --- Category & Grade ---
class ProductCategoryCreate(BaseModel):
    name: str
    grading_criteria: dict[str, Any] = Field(default_factory=dict)
    shelf_life_days: int = Field(gt=0)
    expiry_warning_days: int = Field(default=2, ge=0)

class ProductCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    grading_criteria: dict[str, Any]
    shelf_life_days: int
    expiry_warning_days: int

class GradeDefinitionCreate(BaseModel):
    code: str
    name: str
    is_reject: bool = False
    sort_order: int = 0
    criteria: dict[str, Any] = Field(default_factory=dict)

class GradeDefinitionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    category_id: int
    code: str
    name: str
    is_reject: bool
    sort_order: int
    criteria: dict[str, Any]
    is_active: bool

# --- Product ---
class ProductCreate(BaseModel):
    code: str
    name: str
    category_id: int
    uom: str = "kg"

class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    name: str
    category_id: int
    uom: str
    is_active: bool

# --- Prices ---
class PurchasePriceCreate(BaseModel):
    product_id: int
    grade_id: int
    price: Decimal = Field(ge=0)
    valid_from: date
    note: str | None = None

class PurchasePriceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    grade_id: int
    price: Decimal
    valid_from: date
    note: str | None

class SalesPriceCreate(BaseModel):
    product_id: int
    grade_id: int
    segment: Literal["KONSUMEN", "RETAIL", "PASAR_MODERN"]
    price: Decimal = Field(ge=0)
    valid_from: date
    note: str | None = None

class SalesPriceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    grade_id: int
    segment: str
    price: Decimal
    valid_from: date
    note: str | None

# --- Saprotan ---
class SaprotanCreate(BaseModel):
    code: str
    name: str
    type: Literal["BENIH", "PUPUK_ORGANIK", "PUPUK_KIMIA", "KEMASAN"]
    uom: str
    purchase_price: Decimal = Field(default=0, ge=0)
    member_price: Decimal = Field(default=0, ge=0)
    min_stock: Decimal = Field(default=0, ge=0)

class SaprotanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    name: str
    type: str
    uom: str
    purchase_price: Decimal
    member_price: Decimal
    min_stock: Decimal
    is_active: bool

# --- Customer ---
class CustomerCreate(BaseModel):
    code: str
    name: str
    segment: Literal["KONSUMEN", "RETAIL", "PASAR_MODERN"]
    address: str | None = None
    phone: str | None = None
    payment_term_days: int = 0

class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    name: str
    segment: str
    address: str | None
    phone: str | None
    payment_term_days: int
    is_active: bool

# --- Warehouse ---
class WarehouseCreate(BaseModel):
    code: str
    name: str
    location: str | None = None
    type: Literal["SAPROTAN", "PANEN_MENTAH", "BARANG_JADI", "LIMBAH"]

class WarehouseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    name: str
    location: str | None
    type: str
    is_active: bool

# --- Supplier ---
class SupplierCreate(BaseModel):
    code: str
    name: str
    phone: str | None = None
    address: str | None = None

class SupplierOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    name: str
    phone: str | None
    address: str | None
    is_active: bool

class SupplierItemCreate(BaseModel):
    supplier_id: int
    saprotan_id: int
    default_price: Decimal = Field(ge=0)
    lead_time_days: int = 3

class SupplierItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    supplier_id: int
    saprotan_id: int
    default_price: Decimal
    lead_time_days: int

