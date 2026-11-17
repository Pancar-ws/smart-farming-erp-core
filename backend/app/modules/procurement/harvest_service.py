# modules/procurement/harvest_service.py
from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import DomainError
from app.core.events import publish, HarvestReceived
from app.core.numbering import next_number, ymd, ym
from app.core.settings_store import get_setting
from app.modules.inventory.service import InventoryService, q
from app.modules.master.models import Member, Product, Warehouse
from .models import HarvestReceipt
from .schemas import HarvestIn

TZ = ZoneInfo(settings.timezone)

def receive_harvest(db: Session, user, data: HarvestIn) -> HarvestReceipt:
    # Idempotensi: draf offline (Web Local Storage) yang dikirim ulang tidak menggandakan setoran
    if data.client_request_id:
        dup = db.scalar(select(HarvestReceipt).where(HarvestReceipt.client_request_id == data.client_request_id))
        if dup:
            return dup

    member = db.scalar(select(Member).where(Member.member_code == data.member_code))
    if not member:
        raise DomainError("NOT_FOUND", "Anggota tidak ditemukan", 404)
    if member.status != "AKTIF":
        raise DomainError("MEMBER_INACTIVE", "Anggota nonaktif tidak dapat menyetor", 422)

    product = db.get(Product, data.product_id)
    if not product:
        raise DomainError("NOT_FOUND", "Produk tidak ditemukan", 404)

    wet_pct = Decimal(str(get_setting(db, f"tare.wet_percent.{product.code}", 0)))  # TBDURS01
    net = q(data.gross_kg - data.tare_kg) * (Decimal(1) - wet_pct / 100)
    net = q(net)
    if net <= 0:
        raise DomainError("VALIDATION", "Berat bersih harus > 0", 422)

    now = datetime.now(TZ)
    wh = db.scalar(select(Warehouse).where(Warehouse.type == "PANEN_MENTAH", Warehouse.id == data.warehouse_id))
    if not wh:
        raise DomainError("VALIDATION", "Gudang harus bertipe PANEN_MENTAH", 422)

    rc = HarvestReceipt(
        receipt_no=next_number(db, "STR", ym(now), 3),
        batch_code=next_number(db, "BATCH", ymd(now), 3),  # BATCH-20261114-001
        member_id=member.id,
        product_id=product.id,
        warehouse_id=wh.id,
        received_at=now,
        gross_kg=data.gross_kg,
        tare_kg=data.tare_kg,
        wet_tare_pct=wet_pct,
        net_kg=net,
        moisture_pct=data.moisture_pct,
        status="MENUNGGU_SORTASI",
        client_request_id=data.client_request_id,
        created_by=user.id if user else None,
    )
    db.add(rc)
    db.flush()

    lot = InventoryService.get_or_create_lot(
        db,
        category="PANEN_MENTAH",
        warehouse_id=wh.id,
        received_at=now,
        product_id=product.id,
        batch_code=rc.batch_code,
    )
    InventoryService.move(
        db,
        lot,
        net,
        "RECEIPT",
        ref_type="HARVEST_RECEIPT",
        ref_id=rc.id,
        ref_no=rc.receipt_no,
        user_id=user.id if user else None,
    )

    publish(db, HarvestReceived(rc.id, member.id, rc.batch_code, net))
    return rc

