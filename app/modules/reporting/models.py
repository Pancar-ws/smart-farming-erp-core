from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

Pct = Numeric(6, 2)
Ratio = Numeric(8, 2)

class EsgLog(Base):
    __tablename__ = "esg_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    esg_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    batch_code: Mapped[str] = mapped_column(String(30), ForeignKey("harvest_receipts.batch_code"), unique=True, nullable=False)
    food_loss_ratio: Mapped[Decimal | None] = mapped_column(Pct)
    organic_ratio: Mapped[Decimal | None] = mapped_column(Pct)
    carbon_emission_kg: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    farmer_margin_ratio: Mapped[Decimal | None] = mapped_column(Ratio)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    harvest_receipt: Mapped["HarvestReceipt"] = relationship("HarvestReceipt")

