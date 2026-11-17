# app/core/fmt.py - SRS-NFR-005 (dipakai ekspor & dokumen cetak)
from datetime import date
from decimal import Decimal

def fmt_idr(v: Decimal | int | float) -> str:
    return "Rp" + f"{Decimal(v):,.0f}".replace(",", ".")      # Rp32.600.000

def fmt_date(d: date) -> str:
    return d.strftime("%d/%m/%Y")  # 14/11/2026

def fmt_kg(v) -> str:
    return f"{Decimal(v):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") + " kg"

