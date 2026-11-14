from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.audit import Auditable
from app.core.database import Base

Qty = Numeric(14, 3)
Pct = Numeric(6, 2)

class SortingOrder(Base, Auditable):
    __tablename__ = "sorting_orders"
    __table_args__ = (
        CheckConstraint("status IN ('DRAFT','POSTED','REVERSED')", name="ck_so_status"),
        CheckConstraint("(status = 'DRAFT') OR posted_at IS NOT NULL", name="ck_so_posted"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    order_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    process_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(10), default="DRAFT", nullable=False)
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    posted_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    inputs: Mapped[list["SortingInput"]] = relationship("SortingInput", back_populates="order", cascade="all, delete-orphan")
    quality_checks: Mapped[list["QualityCheck"]] = relationship("QualityCheck", back_populates="order")

class SortingInput(Base):
    __tablename__ = "sorting_inputs"
    __table_args__ = (
        UniqueConstraint("order_id", "harvest_receipt_id", name="uq_sin_order_receipt"),
        CheckConstraint("qty_input > 0", name="ck_sin_qty"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    order_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("sorting_orders.id"), nullable=False)
    harvest_receipt_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("harvest_receipts.id"), nullable=False)
    qty_input: Mapped[Decimal] = mapped_column(Qty, nullable=False)
    shrink_pct: Mapped[Decimal | None] = mapped_column(Pct)

    order: Mapped["SortingOrder"] = relationship("SortingOrder", back_populates="inputs")
    harvest_receipt: Mapped["HarvestReceipt"] = relationship("HarvestReceipt")
    outputs: Mapped[list["SortingOutput"]] = relationship("SortingOutput", back_populates="input", cascade="all, delete-orphan")

class SortingOutput(Base):
    __tablename__ = "sorting_outputs"
    __table_args__ = (
        UniqueConstraint("input_id", "grade_id", name="uq_sout_input_grade"),
        CheckConstraint("qty >= 0", name="ck_sout_qty"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    input_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("sorting_inputs.id"), nullable=False)
    grade_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("grade_definitions.id"), nullable=False)
    qty: Mapped[Decimal] = mapped_column(Qty, nullable=False)

    input: Mapped["SortingInput"] = relationship("SortingInput", back_populates="outputs")
    grade: Mapped["GradeDefinition"] = relationship("GradeDefinition")

class QualityCheck(Base):
    __tablename__ = "quality_checks"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    order_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("sorting_orders.id"), nullable=False)
    inspector_user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    order: Mapped["SortingOrder"] = relationship("SortingOrder", back_populates="quality_checks")
    inspector: Mapped["User"] = relationship("User")

class PackagingRecord(Base, Auditable):
    __tablename__ = "packaging_records"
    __table_args__ = (
        CheckConstraint("pack_unit IN ('KG','KARUNG','IKAT','PETI')", name="ck_pk_unit"),
        CheckConstraint("pack_size_kg > 0 AND pack_count > 0 AND qty_kg > 0", name="ck_pk_qty"),
        CheckConstraint("abs(qty_kg - pack_size_kg * pack_count) <= 0.002", name="ck_pk_total"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    record_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    source_lot_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("inventory_lots.id"), nullable=False)
    output_lot_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("inventory_lots.id"), nullable=False)
    pack_unit: Mapped[str] = mapped_column(String(10), nullable=False)
    pack_size_kg: Mapped[Decimal] = mapped_column(Qty, nullable=False)
    pack_count: Mapped[int] = mapped_column(Integer, nullable=False)
    qty_kg: Mapped[Decimal] = mapped_column(Qty, nullable=False)
    packaged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))

    source_lot: Mapped["InventoryLot"] = relationship("InventoryLot", foreign_keys=[source_lot_id])
    output_lot: Mapped["InventoryLot"] = relationship("InventoryLot", foreign_keys=[output_lot_id])
    materials: Mapped[list["PackagingMaterial"]] = relationship("PackagingMaterial", back_populates="record")

class PackagingMaterial(Base):
    __tablename__ = "packaging_materials"
    __table_args__ = (
        CheckConstraint("qty > 0", name="ck_pm_qty"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    record_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("packaging_records.id"), nullable=False)
    saprotan_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("saprotan_items.id"), nullable=False)
    qty: Mapped[Decimal] = mapped_column(Qty, nullable=False)

    record: Mapped["PackagingRecord"] = relationship("PackagingRecord", back_populates="materials")
    saprotan: Mapped["SaprotanItem"] = relationship("SaprotanItem")

