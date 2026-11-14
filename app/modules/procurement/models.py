from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
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
Money = Numeric(16, 2)
Pct = Numeric(6, 2)

class PurchaseOrder(Base, Auditable):
    __tablename__ = "purchase_orders"
    __table_args__ = (
        CheckConstraint(
            "status IN ('PROPOSED','DRAFT','ORDERED','PARTIAL','RECEIVED','CANCELLED')",
            name="ck_po_status",
        ),
        CheckConstraint("expected_date IS NULL OR expected_date >= order_date", name="ck_po_dates"),
        CheckConstraint("total >= 0", name="ck_po_total"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    po_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    supplier_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("suppliers.id"), nullable=False)
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    expected_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(12), default="DRAFT", nullable=False)
    is_auto: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    total: Mapped[Decimal] = mapped_column(Money, default=Decimal(0), nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    supplier: Mapped["Supplier"] = relationship("Supplier")
    lines: Mapped[list["PurchaseOrderLine"]] = relationship("PurchaseOrderLine", back_populates="po", cascade="all, delete-orphan")

class PurchaseOrderLine(Base):
    __tablename__ = "purchase_order_lines"
    __table_args__ = (
        UniqueConstraint("po_id", "saprotan_id", name="uq_pol_item"),
        CheckConstraint("qty > 0", name="ck_pol_qty"),
        CheckConstraint("unit_price >= 0", name="ck_pol_price"),
        CheckConstraint("qty_received >= 0", name="ck_pol_recv"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    po_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False)
    saprotan_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("saprotan_items.id"), nullable=False)
    qty: Mapped[Decimal] = mapped_column(Qty, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Money, nullable=False)
    qty_received: Mapped[Decimal] = mapped_column(Qty, default=Decimal(0), nullable=False)

    po: Mapped["PurchaseOrder"] = relationship("PurchaseOrder", back_populates="lines")
    saprotan: Mapped["SaprotanItem"] = relationship("SaprotanItem")

class GoodsReceipt(Base, Auditable):
    __tablename__ = "goods_receipts"
    __table_args__ = (
        CheckConstraint("status IN ('POSTED','REVERSED')", name="ck_gr_status"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    gr_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    po_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("purchase_orders.id"), nullable=False)
    warehouse_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("warehouses.id"), nullable=False)
    received_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(10), default="POSTED", nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))

    po: Mapped["PurchaseOrder"] = relationship("PurchaseOrder")
    warehouse: Mapped["Warehouse"] = relationship("Warehouse")
    lines: Mapped[list["GoodsReceiptLine"]] = relationship("GoodsReceiptLine", back_populates="gr")

class GoodsReceiptLine(Base):
    __tablename__ = "goods_receipt_lines"
    __table_args__ = (
        CheckConstraint("qty_received > 0", name="ck_grl_qty"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    gr_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("goods_receipts.id"), nullable=False)
    po_line_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("purchase_order_lines.id"), nullable=False)
    qty_received: Mapped[Decimal] = mapped_column(Qty, nullable=False)
    qty_variance: Mapped[Decimal] = mapped_column(Qty, nullable=False)

    gr: Mapped["GoodsReceipt"] = relationship("GoodsReceipt", back_populates="lines")
    po_line: Mapped["PurchaseOrderLine"] = relationship("PurchaseOrderLine")

class HarvestReceipt(Base, Auditable):
    __tablename__ = "harvest_receipts"
    __table_args__ = (
        CheckConstraint("batch_code ~ '^BATCH-[0-9]{8}-[0-9]{3,}$'", name="ck_hr_batch"),
        CheckConstraint(
            "gross_kg > 0 AND tare_kg >= 0 AND gross_kg > tare_kg AND net_kg > 0",
            name="ck_hr_weight",
        ),
        CheckConstraint(
            "abs(net_kg - (gross_kg - tare_kg) * (1 - wet_tare_pct / 100)) <= 0.002",
            name="ck_hr_net",
        ),
        CheckConstraint(
            "status IN ('MENUNGGU_SORTASI','SEDANG_DIPROSES','SELESAI','DIBATALKAN')",
            name="ck_hr_status",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    receipt_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    batch_code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    member_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("members.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id"), nullable=False)
    warehouse_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("warehouses.id"), nullable=False)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    gross_kg: Mapped[Decimal] = mapped_column(Qty, nullable=False)
    tare_kg: Mapped[Decimal] = mapped_column(Qty, default=Decimal(0), nullable=False)
    wet_tare_pct: Mapped[Decimal] = mapped_column(Pct, default=Decimal(0), nullable=False)
    net_kg: Mapped[Decimal] = mapped_column(Qty, nullable=False)
    moisture_pct: Mapped[Decimal | None] = mapped_column(Pct)
    status: Mapped[str] = mapped_column(String(20), default="MENUNGGU_SORTASI", nullable=False)
    client_request_id: Mapped[str | None] = mapped_column(String(64), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    member: Mapped["Member"] = relationship("Member")
    product: Mapped["Product"] = relationship("Product")
    warehouse: Mapped["Warehouse"] = relationship("Warehouse")

