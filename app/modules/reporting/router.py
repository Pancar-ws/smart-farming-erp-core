# modules/reporting/router.py
from datetime import date
from io import BytesIO
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import select, text
from sqlalchemy.orm import Session
import qrcode

from app.core.database import get_db
from app.core.deps import current_user, require
from app.core.errors import DomainError
from app.modules.auth.models import Notification, SystemSetting, User
from . import esg_handlers, export, traceability
from .models import EsgLog

router = APIRouter(tags=["Reporting & Traceability"])

# --- Traceability ---
@router.get("/trace/batches/{code}")
def trace_by_batch(code: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return traceability.trace_batch(db, code)

@router.get("/trace/invoices/{invoice_no}")
def trace_by_invoice(invoice_no: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return traceability.trace_invoice(db, invoice_no)

@router.get("/trace/batches/{code}/qr")
def get_batch_qr(code: str):
    qr = qrcode.QRCode(box_size=10, border=4)
    qr.add_data(f"https://erp.koperasi.local/trace/{code}")
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return Response(content=buf.getvalue(), media_type="image/png")

# --- ESG Reports ---
@router.get("/reports/esg/environmental")
def get_esg_environmental(
    start: date = Query(default=date(2026, 1, 1)),
    end: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
    user: User = Depends(require("report:esg")),
):
    return esg_handlers.esg_environmental(db, start, end)

@router.get("/reports/esg/social")
def get_esg_social(db: Session = Depends(get_db), user: User = Depends(require("report:esg"))):
    rows = db.execute(text("SELECT * FROM v_esg_payment_timeliness")).mappings().all()
    active_members = db.execute(text("SELECT COUNT(*) FROM members WHERE status = 'AKTIF'")).scalar()
    return {
        "active_members_count": active_members,
        "payment_timeliness": list(rows),
    }

@router.get("/reports/esg/governance")
def get_esg_governance(db: Session = Depends(get_db), user: User = Depends(require("report:esg"))):
    total_periods = db.execute(text("SELECT COUNT(*) FROM accounting_periods")).scalar()
    closed_periods = db.execute(text("SELECT COUNT(*) FROM accounting_periods WHERE status = 'CLOSED'")).scalar()
    ratio = (closed_periods / total_periods * 100) if total_periods else 0
    return {
        "closed_accounting_periods": closed_periods,
        "total_accounting_periods": total_periods,
        "financial_transparency_pct": round(ratio, 2),
    }

# --- Operational Reports ---
@router.get("/reports/saprotan-stock")
def report_saprotan_stock(
    format: str = "json",
    db: Session = Depends(get_db),
    user: User = Depends(require("report:operational")),
):
    rows = db.execute(text("SELECT * FROM v_saprotan_stock")).mappings().all()
    if format == "xlsx":
        headers = ["ID", "Kode", "Nama", "Tipe", "Gudang ID", "Nama Gudang", "Stok", "Min Stok", "Bawah Min"]
        data = [[r["saprotan_id"], r["code"], r["name"], r["type"], r["warehouse_id"], r["warehouse"], r["qty_on_hand"], r["min_stock"], r["below_minimum"]] for r in rows]
        return export.to_xlsx("Laporan_Stok_Saprotan", headers, data)
    return list(rows)

@router.get("/reports/finished-stock")
def report_finished_stock(
    format: str = "json",
    db: Session = Depends(get_db),
    user: User = Depends(require("report:operational")),
):
    rows = db.execute(text("SELECT * FROM v_finished_stock")).mappings().all()
    if format == "xlsx":
        headers = ["Produk ID", "Produk", "Grade ID", "Grade", "Batch", "Gudang", "Kategori", "On Hand", "Reserved", "Available", "Unit Cost", "Tgl Terima", "Kadaluarsa", "Sisa Hari"]
        data = [[r["product_id"], r["product"], r["grade_id"], r["grade"], r["batch_code"], r["warehouse_id"], r["stock_category"], r["qty_on_hand"], r["qty_reserved"], r["qty_available"], r["unit_cost"], r["received_at"], r["expiry_date"], r["days_left"]] for r in rows]
        return export.to_xlsx("Laporan_Stok_Barang_Jadi", headers, data)
    return list(rows)

@router.get("/reports/sorting-efficiency")
def report_sorting_efficiency(
    format: str = "json",
    db: Session = Depends(get_db),
    user: User = Depends(require("report:operational")),
):
    rows = db.execute(text("SELECT * FROM v_sorting_efficiency")).mappings().all()
    if format == "xlsx":
        headers = ["Bulan", "Produk ID", "Produk", "Total Input", "Total Afkir", "Susut (%)"]
        data = [[r["bulan"], r["product_id"], r["product"], r["total_input"], r["total_afkir"], r["susut_pct"]] for r in rows]
        return export.to_xlsx("Efisiensi_Sortasi", headers, data)
    return list(rows)

@router.get("/reports/payable-aging")
def report_payable_aging(
    db: Session = Depends(get_db),
    user: User = Depends(require("report:operational")),
):
    rows = db.execute(text("SELECT * FROM v_payable_aging")).mappings().all()
    return list(rows)

# --- Dashboard & Settings ---
@router.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db), user: User = Depends(current_user)):
    row = db.execute(text("SELECT * FROM v_dashboard_today")).mappings().first()
    return dict(row) if row else {}

@router.get("/notifications")
def get_notifications(
    unread_only: bool = True,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    stmt = select(Notification)
    if unread_only:
        stmt = stmt.where(Notification.is_read == False)
    return db.scalars(stmt.order_by(Notification.created_at.desc()).limit(50)).all()

@router.post("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    n = db.get(Notification, notif_id)
    if not n:
        raise DomainError("NOT_FOUND", "Notifikasi tidak ditemukan", 404)
    n.is_read = True
    n.read_by = user.id
    db.flush()
    return {"message": "Notifikasi ditandai sudah dibaca"}

@router.get("/settings/{key}")
def get_system_setting(key: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    s = db.get(SystemSetting, key)
    if not s:
        raise DomainError("NOT_FOUND", f"Setting '{key}' tidak ditemukan", 404)
    return {"key": s.key, "value": s.value, "description": s.description}

@router.put("/settings/{key}")
def update_system_setting(
    key: str,
    payload: dict,
    db: Session = Depends(get_db),
    user: User = Depends(require("admin:user")),
):
    s = db.get(SystemSetting, key)
    if not s:
        s = SystemSetting(key=key, value=payload.get("value"), updated_by=user.id)
        db.add(s)
    else:
        s.value = payload.get("value")
        s.updated_by = user.id
    db.flush()
    return {"key": s.key, "value": s.value}

@router.get("/health")
def health_check():
    return {"status": "ok", "app": "Smart Farming ERP API", "version": "1.0.0"}

