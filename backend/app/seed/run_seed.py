# app/seed/run_seed.py
import os
import random
from pathlib import Path
from decimal import Decimal
from faker import Faker
from sqlalchemy import select, text
from app.core.database import SessionLocal, engine
from app.core.security import hash_password
from app.core.numbering import next_member_code
from app.modules.auth.models import User, Role
from app.modules.master.models import Member, Customer, Supplier, SupplierItem, SaprotanItem

fake = Faker("id_ID")
SQL_DIR = Path(__file__).resolve().parent.parent.parent / "sql"

def execute_sql_files(db):
    sql_files = sorted(SQL_DIR.glob("*.sql"))
    print(f"Found {len(sql_files)} SQL files in {SQL_DIR}")
    for f in sql_files:
        print(f"Executing {f.name}...")
        content = f.read_text(encoding="utf-8")
        try:
            db.execute(text(content))
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Warning/Error on {f.name}: {e}")

def seed_users(db):
    print("Seeding users...")
    roles = db.scalars(select(Role)).all()
    role_map = {r.code: r.id for r in roles}

    default_users = [
        ("superadmin", "Administrator Sistem", "SUPERADMIN"),
        ("admin_keanggotaan", "Admin Keanggotaan", "ADMIN_KEANGGOTAAN"),
        ("penerimaan", "Petugas Penerimaan", "PETUGAS_PENERIMAAN"),
        ("sortasi", "Petugas Sortasi & QC", "PETUGAS_SORTASI_QC"),
        ("gudang", "Admin Gudang", "ADMIN_GUDANG"),
        ("penjualan", "Bagian Penjualan", "BAGIAN_PENJUALAN"),
        ("keuangan", "Bagian Keuangan", "BAGIAN_KEUANGAN"),
        ("pengurus", "Pengurus Koperasi", "PENGURUS"),
        ("anggota", "Akun Anggota Tani", "ANGGOTA_READONLY"),
    ]

    pwd_hash = hash_password("password123")
    for username, full_name, rcode in default_users:
        if rcode not in role_map:
            continue
        exists = db.scalar(select(User.id).where(User.username == username))
        if not exists:
            u = User(
                username=username,
                password_hash=pwd_hash,
                full_name=full_name,
                role_id=role_map[rcode],
                is_active=True,
            )
            db.add(u)
    db.commit()

def seed_master_data(db):
    print("Seeding customers and suppliers...")
    # Customers
    customers = [
        ("CUST-001", "Pasar Induk Kramat Jati", "PASAR_MODERN", "Jakarta Timur", "081234567801", 30),
        ("CUST-002", "Toko Sayur Segar Jaya", "RETAIL", "Bandung", "081234567802", 14),
        ("CUST-003", "Warung Bu Siti", "KONSUMEN", "Bogor", "081234567803", 0),
    ]
    for code, name, segment, addr, phone, term in customers:
        if not db.scalar(select(Customer.id).where(Customer.code == code)):
            db.add(Customer(code=code, name=name, segment=segment, address=addr, phone=phone, payment_term_days=term))

    # Suppliers
    suppliers = [
        ("SUP-001", "PT Pupuk Indonesia Nusantara", "081122334455", "Gresik"),
        ("SUP-002", "CV Benih Unggul Sejahtera", "081122334466", "Malang"),
        ("SUP-003", "Pabrik Kemasan Lestari", "081122334477", "Surabaya"),
    ]
    for code, name, phone, addr in suppliers:
        if not db.scalar(select(Supplier.id).where(Supplier.code == code)):
            db.add(Supplier(code=code, name=name, phone=phone, address=addr))

    db.commit()

    # Link supplier items
    sup1 = db.scalar(select(Supplier).where(Supplier.code == "SUP-001"))
    sup2 = db.scalar(select(Supplier).where(Supplier.code == "SUP-002"))
    npk = db.scalar(select(SaprotanItem).where(SaprotanItem.code == "SPT-00002"))
    benih = db.scalar(select(SaprotanItem).where(SaprotanItem.code == "SPT-00001"))

    if sup1 and npk and not db.scalar(select(SupplierItem.id).where(SupplierItem.supplier_id == sup1.id, SupplierItem.saprotan_id == npk.id)):
        db.add(SupplierItem(supplier_id=sup1.id, saprotan_id=npk.id, default_price=Decimal("12000"), lead_time_days=3))
    if sup2 and benih and not db.scalar(select(SupplierItem.id).where(SupplierItem.supplier_id == sup2.id, SupplierItem.saprotan_id == benih.id)):
        db.add(SupplierItem(supplier_id=sup2.id, saprotan_id=benih.id, default_price=Decimal("150000"), lead_time_days=2))

    db.commit()

def seed_members(db):
    count = db.scalar(select(text("COUNT(*)")).select_from(Member))
    if count and count >= 50:
        print(f"Members already seeded ({count} members).")
        return

    print("Seeding 100 members with Faker...")
    commodities = ["Pangan", "Hortikultura Sayur", "Buah"]
    for i in range(100):
        code = next_member_code(db)
        nik = f"32{fake.numerify('##############')}"
        m = Member(
            member_code=code,
            nik=nik,
            name=fake.name(),
            address=fake.address(),
            area_ha=round(Decimal(str(random.uniform(0.3, 3.5))), 2),
            main_commodity=random.choice(commodities),
            phone=fake.numerify("08##########"),
            status="AKTIF" if i < 95 else "NON_AKTIF",
        )
        db.add(m)
    db.commit()
    print("100 members seeded successfully.")

def main():
    print("Starting database seeding...")
    db = SessionLocal()
    try:
        execute_sql_files(db)
        seed_users(db)
        seed_master_data(db)
        seed_members(db)
        print("Database seed completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    main()

