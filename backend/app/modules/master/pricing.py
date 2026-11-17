# modules/master/pricing.py
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.errors import DomainError

def effective_price(db: Session, model, on_date, **flt):
    stmt = (
        select(model.price)
        .where(
            model.valid_from <= on_date,
            *[getattr(model, k) == v for k, v in flt.items()],
        )
        .order_by(model.valid_from.desc(), model.id.desc())
        .limit(1)
    )
    price = db.scalar(stmt)
    if price is None:
        raise DomainError("PRICE_NOT_FOUND", "Harga belum diatur untuk kombinasi ini", 422, flt)
    return price

