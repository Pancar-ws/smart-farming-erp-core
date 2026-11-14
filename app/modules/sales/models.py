from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import (
    BigInteger,
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

class SalesOrder(Base, Auditable):
    __tablename__ = "sales_orders"
    __table_args__ = (
        CheckConstraint("segment IN ('KONSUMEN','RETAIL','PASAR_MODERN')", name="ck_sor_segment"),
        CheckConstraint("status IN ('CONFIRMED','SHIPPED','CANCELLED')", name="ck_sor_status"),
        CheckConstraint("total >= 0", name="ck_sor_total"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    so_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("customers.id"), nullable=False)
    segment: Mapped[str] = mapped_column(String(20), nullable=False)
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(12), default="CONFIRMED", nullable=False)
    total: Mapped[Decimal] = mapped_column(Money, default=Decimal(0), nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    customer: Mapped["Customer"] = relationship("Customer")
    lines: Mapped[list["SalesOrderLine"]] = relationship("SalesOrderLine", back_populates="so", cascade="all, delete-orphan")

class SalesOrderLine(Base):
    __tablename__ = "sales_order_lines"
    __table_args__ = (
        CheckConstraint("qty > 0", name="ck_sol_qty"),
        CheckConstraint("unit_price >= 0", name="ck_sol_price"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    so_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("sales_orders.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id"), nullable=False)
    grade_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("grade_definitions.id"), nullable=False)
    qty: Mapped[Decimal] = mapped_column(Qty, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Money, nullable=False)

    so: Mapped["SalesOrder"] = relationship("SalesOrder", back_populates="lines")
    product: Mapped["Product"] = relationship("Product")
    grade: Mapped["GradeDefinition"] = relationship("GradeDefinition")
    allocations: Mapped[list["SoAllocation"]] = relationship("SoAllocation", back_populates="so_line", cascade="all, delete-orphan")

class SoAllocation(Base):
    __tablename__ = "so_allocations"
    __table_args__ = (
        UniqueConstraint("so_line_id", "lot_id", name="uq_alloc"),
        CheckConstraint("qty > 0", name="ck_alloc_qty"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    so_line_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("sales_order_lines.id"), nullable=False)
    lot_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("inventory_lots.id"), nullable=False)
    qty: Mapped[Decimal] = mapped_column(Qty, nullable=False)

    so_line: Mapped["SalesOrderLine"] = relationship("SalesOrderLine", back_populates="allocations")
    lot: Mapped["InventoryLot"] = relationship("InventoryLot")

class DeliveryOrder(Base, Auditable):
    __tablename__ = "delivery_orders"
    __table_args__ = (
        CheckConstraint("status IN ('CONFIRMED','REVERSED')", name="ck_do_status"),
        CheckConstraint("distance_km IS NULL OR distance_km >= 0", name="ck_do_dist"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    do_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    so_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("sales_orders.id"), nullable=False)
    delivered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    vehicle_type: Mapped[str | None] = mapped_column(String(30))
    distance_km: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    status: Mapped[str] = mapped_column(String(10), default="CONFIRMED", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))

    sales_order: Mapped["SalesOrder"] = relationship("SalesOrder")
    lines: Mapped[list["DeliveryLine"]] = relationship("DeliveryLine", back_populates="delivery_order")
    invoice: Mapped["SalesInvoice | None"] = relationship("SalesInvoice", back_populates="delivery_order", uselist=False)

class DeliveryLine(Base):
    __tablename__ = "delivery_lines"
    __table_args__ = (
        CheckConstraint("qty > 0", name="ck_dl_qty"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    do_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("delivery_orders.id"), nullable=False)
    so_line_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("sales_order_lines.id"), nullable=False)
    lot_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("inventory_lots.id"), nullable=False)
    batch_code: Mapped[str] = mapped_column(String(30), ForeignKey("harvest_receipts.batch_code"), nullable=False)
    grade_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("grade_definitions.id"), nullable=False)
    qty: Mapped[Decimal] = mapped_column(Qty, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Money, nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Money, nullable=False)

    delivery_order: Mapped["DeliveryOrder"] = relationship("DeliveryOrder", back_populates="lines")
    grade: Mapped["GradeDefinition"] = relationship("GradeDefinition")
    lot: Mapped["InventoryLot"] = relationship("InventoryLot")

class SalesInvoice(Base, Auditable):
    __tablename__ = "sales_invoices"
    __table_args__ = (
        CheckConstraint("status IN ('OPEN','PARTIAL','PAID','REVERSED')", name="ck_inv_status"),
        CheckConstraint("due_date >= issue_date", name="ck_inv_dates"),
        CheckConstraint("total >= 0", name="ck_inv_total"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    invoice_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    do_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("delivery_orders.id"), unique=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("customers.id"), nullable=False)
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    total: Mapped[Decimal] = mapped_column(Money, nullable=False)
    status: Mapped[str] = mapped_column(String(10), default="OPEN", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))

    delivery_order: Mapped["DeliveryOrder"] = relationship("DeliveryOrder", back_populates="invoice")
    customer: Mapped["Customer"] = relationship("Customer")

class SalesReturn(Base, Auditable):
    __tablename__ = "sales_returns"
    __table_args__ = (
        CheckConstraint("status IN ('POSTED','REVERSED')", name="ck_ret_status"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    return_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("customers.id"), nullable=False)
    return_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(10), default="POSTED", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))

    lines: Mapped[list["SalesReturnLine"]] = relationship("SalesReturnLine", back_populates="sales_return")

class SalesReturnLine(Base):
    __tablename__ = "sales_return_lines"
    __table_args__ = (
        CheckConstraint("qty > 0", name="ck_rl_qty"),
        CheckConstraint("condition IN ('LAYAK','RUSAK')", name="ck_rl_cond"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    return_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("sales_returns.id"), nullable=False)
    delivery_line_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("delivery_lines.id"), nullable=False)
    qty: Mapped[Decimal] = mapped_column(Qty, nullable=False)
    condition: Mapped[str] = mapped_column(String(10), nullable=False)

    sales_return: Mapped["SalesReturn"] = relationship("SalesReturn", back_populates="lines")
    delivery_line: Mapped["DeliveryLine"] = relationship("DeliveryLine")

