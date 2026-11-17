from contextvars import ContextVar
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import event, inspect, insert
from sqlalchemy.orm import Session

@dataclass
class AuditContext:
    user_id: int
    ip: str | None = None

audit_ctx: ContextVar[AuditContext | None] = ContextVar("audit_ctx", default=None)

class Auditable:  # marker mixin
    pass

def _val(v):
    if isinstance(v, Decimal):
        return str(v)
    if isinstance(v, datetime):
        return v.isoformat()
    if hasattr(v, "isoformat"):
        return v.isoformat()
    return v

def _snapshot(obj):
    return {c.key: _val(getattr(obj, c.key)) for c in inspect(obj).mapper.column_attrs}

def _diff(obj):
    out = {}
    for attr in inspect(obj).mapper.column_attrs:
        h = inspect(obj).attrs[attr.key].history
        if h.has_changes():
            out[attr.key] = {
                "old": _val(h.deleted[0]) if h.deleted else None,
                "new": _val(h.added[0]) if h.added else None,
            }
    return out

@event.listens_for(Session, "after_flush")
def _audit_after_flush(session: Session, _ctx):
    from app.modules.auth.models import AuditLog
    uc = audit_ctx.get()
    if not uc:
        return
    rows, now = [], datetime.now(timezone.utc)
    def row(obj, action, changes):
        rec_id = str(inspect(obj).identity[0]) if inspect(obj).identity else None
        return dict(
            table_name=obj.__tablename__,
            record_id=rec_id,
            action=action,
            changes=changes,
            user_id=uc.user_id,
            ip_address=uc.ip,
            created_at=now,
        )
    for o in session.new:
        if isinstance(o, Auditable):
            rows.append(row(o, "INSERT", _snapshot(o)))
    for o in session.dirty:
        if isinstance(o, Auditable) and session.is_modified(o):
            d = _diff(o)
            if d:
                rows.append(row(o, "UPDATE", d))
    for o in session.deleted:
        if isinstance(o, Auditable):
            rows.append(row(o, "DELETE", _snapshot(o)))
    if rows:
        session.connection().execute(insert(AuditLog), rows)

