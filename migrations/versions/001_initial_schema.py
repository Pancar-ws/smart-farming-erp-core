"""Initial schema and integrity triggers

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-11-14 09:00:00

"""
from typing import Sequence, Union
from pathlib import Path
from alembic import op
import sqlalchemy as sa

revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SQL_DIR = Path(__file__).resolve().parent.parent.parent / "sql"

def upgrade() -> None:
    sql_files = [
        "001_extensions_domains.sql",
        "002_auth_system.sql",
        "003_master_data.sql",
        "004_procurement.sql",
        "005_inventory.sql",
        "006_manufacturing.sql",
        "007_sales.sql",
        "008_accounting_esg.sql",
        "009_integrity.sql",
        "010_indexes_views.sql",
        "011_seed_reference.sql",
        "012_security.sql",
    ]
    for fname in sql_files:
        fpath = SQL_DIR / fname
        if fpath.exists():
            content = fpath.read_text(encoding="utf-8")
            # Gunakan connection.exec_driver_sql agar SQLAlchemy tidak menganggap tanda titik dua (:) sebagai bind parameter
            bind = op.get_bind()
            bind.exec_driver_sql(content)

def downgrade() -> None:
    pass

