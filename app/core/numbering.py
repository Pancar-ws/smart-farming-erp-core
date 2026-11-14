from datetime import date, datetime
from sqlalchemy import text
from sqlalchemy.orm import Session

def next_number(db: Session, prefix: str, period: str, width: int) -> str:
    n = db.execute(
        text("""
        INSERT INTO document_sequences(prefix, period_key, last_value) VALUES (:p, :k, 1)
        ON CONFLICT (prefix, period_key)
        DO UPDATE SET last_value = document_sequences.last_value + 1
        RETURNING last_value
        """),
        {"p": prefix, "k": period},
    ).scalar_one()
    return f"{prefix}-{period}-{n:0{width}d}"

def ymd(d: date | datetime) -> str:
    return d.strftime("%Y%m%d")

def ym(d: date | datetime) -> str:
    return d.strftime("%Y%m")

def next_member_code(db: Session) -> str:
    n = db.execute(
        text("""
        INSERT INTO document_sequences(prefix, period_key, last_value) VALUES ('AGT','-',1)
        ON CONFLICT (prefix, period_key) DO UPDATE SET last_value = document_sequences.last_value + 1
        RETURNING last_value
        """)
    ).scalar_one()
    return f"AGT-{n:05d}"

