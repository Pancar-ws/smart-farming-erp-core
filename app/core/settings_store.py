# app/core/settings_store.py
from sqlalchemy import select
from app.modules.auth.models import SystemSetting

def get_setting(db, key: str, default=None):
    row = db.scalar(select(SystemSetting).where(SystemSetting.key == key))
    return row.value if row else default      # kolom JSONB -> tipe Python native

