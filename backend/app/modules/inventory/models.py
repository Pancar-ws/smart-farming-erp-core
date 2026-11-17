from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.audit import Auditable
from app.core.database import Base

Qty = Numeric(14, 3)
Money = Numeric(16, 2)

class InventoryLot(Base, Auditable):
    __tablename__ = "inventory_lots"
    __table_args__ = (
        CheckConstraint(
            "stock_category IN ('SAPROTAN','PANEN_MENTAH','HASIL_SORTASI','PRODUK_KEMASAN','LIMBAH')",
            name="ck_lot_category",
        ),
        CheckConstraint("qty_on_hand >= 0", name="ck_lot_nonneg"),
        CheckConstraint("qty_reserved >= 0 AND qty_reserved <= qty_on_hand", name="ck_lot_reserved"),
        CheckConstraint("unit_cost >= 0", name="ck_lot_cost"),
        CheckConstraint("(saprotan_id IS NULL) <> (product_id IS NULL)", name="ck_lot_xor"),
        CheckConstraint(
            """(stock_category = 'SAPROTAN' AND saprotan_id IS NOT NULL AND batch_code IS NULL AND grade_id IS NULL)
            OR (stock_category = 'PANEN_MENTAH' AND product_id IS NOT NULL AND batch_code IS NOT NULL AND grade_id IS NULL)
            OR (stock_category IN ('HASIL_SORTASI','PRODUK_KEMASAN','LIMBAH')
                AND product_id IS NOT NULL AND batch_code IS NOT NULL AND grade_id IS NOT NULL)""",
            name="ck_lot_shape",
        ),
        CheckConstraint(
            "stock_category = 'PRODUK_KEMASAN' OR (pack_unit IS NULL AND pack_size_kg IS NULL AND pack_count IS NULL)",
            name="ck_lot_pack",
        ),
        CheckConstraint(
            "pack_unit IS NULL OR pack_unit IN ('KG','KARUNG','IKAT','PETI')",
            name="ck_lot_packunit",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    stock_category: Mapped[str] = mapped_column(String(20), nullable=False)
    warehouse_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("warehouses.id"), nullable=False)
    saprotan_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("saprotan_items.id"))
    product_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("products.id"))
    grade_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("grade_definitions.id"))
    batch_code: Mapped[str | None] = mapped_column(String(30), ForeignKey("harvest_receipts.batch_code"))
    qty_on_hand: Mapped[Decimal] = mapped_column(Qty, default=Decimal(0), nullable=False)
    qty_reserved: Mapped[Decimal] = mapped_column(Qty, default=Decimal(0), nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Money, default=Decimal(0), nullable=False)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    pack_unit: Mapped[str | None] = mapped_column(String(10))
    pack_size_kg: Mapped[Decimal | None] = mapped_column(Qty)
    pack_count: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    warehouse: Mapped["Warehouse"] = relationship("Warehouse")
    product: Mapped["Product | None"] = relationship("Product")
    grade: Mapped["GradeDefinition | None"] = relationship("GradeDefinition")
    saprotan: Mapped["SaprotanItem | None"] = relationship("SaprotanItem")

    @property
    def qty_available(self) -> Decimal:
        return self.qty_on_hand - self.qty_reserved

class StockMovement(Base):
    __tablename__ = "stock_movements"
    __table_args__ = (
        CheckConstraint(
            """movement_type IN ('RECEIPT','ISSUE','TRANSFER_OUT','TRANSFER_IN','ADJUST_IN','ADJUST_OUT',
                                'SORT_CONSUME','SORT_OUTPUT','PACK_CONSUME','PACK_OUTPUT','DELIVERY','RETURN_IN','REVERSAL')""",
            name="ck_mv_type",
        ),
        CheckConstraint("qty_delta <> 0", name="ck_mv_delta"),
        CheckConstraint("balance_after >= 0", name="ck_mv_bal"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    lot_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("inventory_lots.id"), nullable=False)
    movement_type: Mapped[str] = mapped_column(String(20), nullable=False)
    qty_delta: Mapped[Decimal] = mapped_column(Qty, nullable=False)
    balance_after: Mapped[Decimal] = mapped_column(Qty, nullable=False)
    ref_type: Mapped[str | None] = mapped_column(String(30))
    ref_id: Mapped[int | None] = mapped_column(BigInteger)
    ref_no: Mapped[str | None] = mapped_column(String(30))
    reversal_of_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("stock_movements.id"))
    note: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    lot: Mapped["InventoryLot"] = relationship("InventoryLot")

class SaprotanIssue(Base, Auditable):
    __tablename__ = "saprotan_issues"
    __table_args__ = (
        CheckConstraint("status IN ('POSTED','REVERSED')", name="ck_iss_status"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    issue_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    member_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("members.id"), nullable=False)
    warehouse_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("warehouses.id"), nullable=False)
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(10), default="POSTED", nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))

    lines: Mapped[list["SaprotanIssueLine"]] = relationship("SaprotanIssueLine", back_populates="issue")
    member: Mapped["Member"] = relationship("Member")

class SaprotanIssueLine(Base):
    __tablename__ = "saprotan_issue_lines"
    __table_args__ = (
        CheckConstraint("qty > 0", name="ck_isl_qty"),
        CheckConstraint(
            "fertilizer_type IN ('BENIH','PUPUK_ORGANIK','PUPUK_KIMIA','KEMASAN')",
            name="ck_isl_type",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    issue_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("saprotan_issues.id"), nullable=False)
    saprotan_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("saprotan_items.id"), nullable=False)
    qty: Mapped[Decimal] = mapped_column(Qty, nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Money, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Money, nullable=False)
    fertilizer_type: Mapped[str] = mapped_column(String(20), nullable=False)

    issue: Mapped["SaprotanIssue"] = relationship("SaprotanIssue", back_populates="lines")
    saprotan: Mapped["SaprotanItem"] = relationship("SaprotanItem")

class SaprotanUsage(Base, Auditable):
    __tablename__ = "saprotan_usages"
    __table_args__ = (
        CheckConstraint("qty > 0", name="ck_use_qty"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    member_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("members.id"), nullable=False)
    saprotan_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("saprotan_items.id"), nullable=False)
    qty: Mapped[Decimal] = mapped_column(Qty, nullable=False)
    used_at: Mapped[date] = mapped_column(Date, nullable=False)
    area_ha: Mapped[Decimal | None] = mapped_column(Numeric(7, 2))
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))

class StockTransfer(Base, Auditable):
    __tablename__ = "stock_transfers"
    __table_args__ = (
        CheckConstraint("from_warehouse_id <> to_warehouse_id", name="ck_tr_diff"),
        CheckConstraint("status IN ('POSTED','REVERSED')", name="ck_tr_status"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    transfer_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    from_warehouse_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("warehouses.id"), nullable=False)
    to_warehouse_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("warehouses.id"), nullable=False)
    transfer_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(10), default="POSTED", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))

    lines: Mapped[list["StockTransferLine"]] = relationship("StockTransferLine", back_populates="transfer")

class StockTransferLine(Base):
    __tablename__ = "stock_transfer_lines"
    __table_args__ = (
        CheckConstraint("qty > 0", name="ck_trl_qty"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    transfer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("stock_transfers.id"), nullable=False)
    lot_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("inventory_lots.id"), nullable=False)
    qty: Mapped[Decimal] = mapped_column(Qty, nullable=False)

    transfer: Mapped["StockTransfer"] = relationship("StockTransfer", back_populates="lines")

class StockAdjustment(Base, Auditable):
    __tablename__ = "stock_adjustments"
    __table_args__ = (
        CheckConstraint("status IN ('POSTED','REVERSED')", name="ck_adj_status"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    adj_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    adj_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(10), default="POSTED", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))

    lines: Mapped[list["StockAdjustmentLine"]] = relationship("StockAdjustmentLine", back_populates="adjustment")

class StockAdjustmentLine(Base):
    __tablename__ = "stock_adjustment_lines"
    __table_args__ = (
        CheckConstraint("qty_counted >= 0", name="ck_adjl_counted"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    adj_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("stock_adjustments.id"), nullable=False)
    lot_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("inventory_lots.id"), nullable=False)
    qty_system: Mapped[Decimal] = mapped_column(Qty, nullable=False)
    qty_counted: Mapped[Decimal] = mapped_column(Qty, nullable=False)
    # in postgres: qty_delta GENERATED ALWAYS AS (qty_counted - qty_system) STORED

    adjustment: Mapped["StockAdjustment"] = relationship("StockAdjustment", back_populates="lines")
    lot: Mapped["InventoryLot"] = relationship("InventoryLot")

