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
    Integer,
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

Qty = Numeric(14, 3)
Money = Numeric(16, 2)
Pct = Numeric(6, 2)

class Member(Base, Auditable):
    __tablename__ = "members"
    __table_args__ = (
        CheckConstraint("member_code ~ '^AGT-[0-9]{5}$'", name="ck_members_code"),
        CheckConstraint("nik ~ '^[0-9]{16}$'", name="ck_members_nik"),
        CheckConstraint("length(btrim(name)) > 0", name="ck_members_name"),
        CheckConstraint("area_ha > 0", name="ck_members_area"),
        CheckConstraint("main_commodity IN ('Pangan','Hortikultura Sayur','Buah')", name="ck_members_comm"),
        CheckConstraint("phone IS NULL OR phone ~ '^(\\+62|62|0)[0-9]{8,13}$'", name="ck_members_phone"),
        CheckConstraint("status IN ('AKTIF','NON_AKTIF')", name="ck_members_status"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    member_code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    nik: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str | None] = mapped_column(Text)
    area_ha: Mapped[Decimal] = mapped_column(Numeric(7, 2), nullable=False)
    main_commodity: Mapped[str] = mapped_column(String(30), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(15))
    status: Mapped[str] = mapped_column(String(10), default="AKTIF", nullable=False)
    joined_at: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

class ProductCategory(Base, Auditable):
    __tablename__ = "product_categories"
    __table_args__ = (
        CheckConstraint("shelf_life_days > 0", name="ck_cat_shelf"),
        CheckConstraint(
            "expiry_warning_days >= 0 AND expiry_warning_days <= shelf_life_days",
            name="ck_cat_warn",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    grading_criteria: Mapped[Any] = mapped_column(JSONB, default=dict, nullable=False)
    shelf_life_days: Mapped[int] = mapped_column(Integer, nullable=False)
    expiry_warning_days: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    grades: Mapped[list["GradeDefinition"]] = relationship("GradeDefinition", back_populates="category")
    products: Mapped[list["Product"]] = relationship("Product", back_populates="category")

class GradeDefinition(Base, Auditable):
    __tablename__ = "grade_definitions"
    __table_args__ = (
        UniqueConstraint("category_id", "code", name="uq_grade_cat_code"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    category_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("product_categories.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(60), nullable=False)
    is_reject: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)
    criteria: Mapped[Any] = mapped_column(JSONB, default=dict, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    category: Mapped["ProductCategory"] = relationship("ProductCategory", back_populates="grades")

class Product(Base, Auditable):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("product_categories.id"), nullable=False)
    uom: Mapped[str] = mapped_column(String(10), default="kg", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    category: Mapped["ProductCategory"] = relationship("ProductCategory", back_populates="products")

class PurchasePrice(Base):
    __tablename__ = "purchase_prices"
    __table_args__ = (
        CheckConstraint("price >= 0", name="ck_pp_price"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id"), nullable=False)
    grade_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("grade_definitions.id"), nullable=False)
    price: Mapped[Decimal] = mapped_column(Money, nullable=False)
    valid_from: Mapped[date] = mapped_column(Date, nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))

    product: Mapped["Product"] = relationship("Product")
    grade: Mapped["GradeDefinition"] = relationship("GradeDefinition")

class SalesPrice(Base):
    __tablename__ = "sales_prices"
    __table_args__ = (
        CheckConstraint("price >= 0", name="ck_sp_price"),
        CheckConstraint("segment IN ('KONSUMEN','RETAIL','PASAR_MODERN')", name="ck_sp_segment"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id"), nullable=False)
    grade_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("grade_definitions.id"), nullable=False)
    segment: Mapped[str] = mapped_column(String(20), nullable=False)
    price: Mapped[Decimal] = mapped_column(Money, nullable=False)
    valid_from: Mapped[date] = mapped_column(Date, nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))

    product: Mapped["Product"] = relationship("Product")
    grade: Mapped["GradeDefinition"] = relationship("GradeDefinition")

class SaprotanItem(Base, Auditable):
    __tablename__ = "saprotan_items"
    __table_args__ = (
        CheckConstraint("type IN ('BENIH','PUPUK_ORGANIK','PUPUK_KIMIA','KEMASAN')", name="ck_sap_type"),
        CheckConstraint("purchase_price >= 0 AND member_price >= purchase_price", name="ck_sap_price"),
        CheckConstraint("min_stock >= 0", name="ck_sap_min"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    uom: Mapped[str] = mapped_column(String(20), nullable=False)
    purchase_price: Mapped[Decimal] = mapped_column(Money, default=0, nullable=False)
    member_price: Mapped[Decimal] = mapped_column(Money, default=0, nullable=False)
    min_stock: Mapped[Decimal] = mapped_column(Qty, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

class Customer(Base, Auditable):
    __tablename__ = "customers"
    __table_args__ = (
        CheckConstraint("segment IN ('KONSUMEN','RETAIL','PASAR_MODERN')", name="ck_cust_segment"),
        CheckConstraint("payment_term_days >= 0", name="ck_cust_term"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    segment: Mapped[str] = mapped_column(String(20), nullable=False)
    address: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(String(20))
    payment_term_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

class Warehouse(Base, Auditable):
    __tablename__ = "warehouses"
    __table_args__ = (
        CheckConstraint("type IN ('SAPROTAN','PANEN_MENTAH','BARANG_JADI','LIMBAH')", name="ck_wh_type"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str | None] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

class Supplier(Base, Auditable):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))
    address: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    supplier_items: Mapped[list["SupplierItem"]] = relationship("SupplierItem", back_populates="supplier")

class SupplierItem(Base):
    __tablename__ = "supplier_items"
    __table_args__ = (
        UniqueConstraint("supplier_id", "saprotan_id", name="uq_supplier_item"),
        CheckConstraint("default_price >= 0", name="ck_si_price"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    supplier_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("suppliers.id"), nullable=False)
    saprotan_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("saprotan_items.id"), nullable=False)
    default_price: Mapped[Decimal] = mapped_column(Money, nullable=False)
    lead_time_days: Mapped[int] = mapped_column(Integer, default=3, nullable=False)

    supplier: Mapped["Supplier"] = relationship("Supplier", back_populates="supplier_items")
    saprotan: Mapped["SaprotanItem"] = relationship("SaprotanItem")

