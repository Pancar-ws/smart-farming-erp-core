from typing import Any
from sqlalchemy.orm import Session
from app.modules.auth.models import Notification

def notify(db: Session, ntype: str, severity: str, message: str, payload: dict[str, Any] | None = None, read_by: int | None = None):
    n = Notification(
        type=ntype,
        severity=severity,
        message=message,
        payload=payload,
        read_by=read_by,
    )
    db.add(n)
    db.flush()
    return n

