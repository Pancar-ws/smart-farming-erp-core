# 🌾 Smart Farming ERP Backend

Backend terpusat (*Single Source of Truth*) untuk sistem Enterprise Resource Planning (ERP) Smart Farming, dibangun dengan standar integritas enterprise, ketertelusuran batch penuh (*end-to-end traceability*), mass balance manufacturing, dan pembukuan berimbang otomatis (*auto-journaling*).

---

## 🛠️ Tech Stack

- **Runtime & Framework**: Python 3.12, FastAPI
- **ORM & Database**: SQLAlchemy 2.0, PostgreSQL 14+, Psycopg 3
- **Database Migrations**: Alembic
- **Authentication & Security**: PyJWT, Argon2id (`argon2-cffi`), SlowAPI (Rate Limiting)
- **Exports & Utilities**: OpenPyXL (XLSX), ReportLab (PDF), QRCode
- **Testing**: Pytest, HTTPX

---

## 🏗️ Struktur Modul

```text
smart-farming-erp-core/
├── app/
│   ├── core/                  # Fondasi: config, db, security, deps, errors, events, audit, numbering
│   ├── modules/
│   │   ├── auth/              # Autentikasi (JWT + Argon2id), Users, Roles, Permissions (RBAC 9 roles)
│   │   ├── master/            # Master Anggota, Kategori, Produk, Grade, Harga Beli/Jual, Saprotan, Pelanggan, Gudang, Pemasok
│   │   ├── procurement/       # Purchase Orders (PO), Goods Receipts (GR), Setoran Panen (Harvest Receipts -> Batch)
│   │   ├── inventory/         # Lot Stok, Ledger Mutasi (Append-only), Penyaluran/Pemakaian Saprotan, Mutasi & Opname
│   │   ├── manufacturing/     # Order Sortasi (Mass Balance), Quality Checks (QC), Pengemasan
│   │   ├── sales/             # Sales Orders (SO), Alokasi FIFO, Surat Jalan (DO), Faktur (Invoice), Retur Penjualan
│   │   ├── accounting/        # Mesin Jurnal Berpasangan, Auto-journaling handlers, Hutang/Piutang (AP/AR), Pembayaran, SHU
│   │   └── reporting/         # Traceability Maju/Mundur, Metrik ESG (Lingkungan, Sosial, Tata Kelola), Dashboard, Ekspor
│   ├── seed/                  # Seeder data referensi & 100 anggota demo Faker
│   └── main.py                # Inisialisasi FastAPI & registrasi router
├── sql/                       # 12 Berkas DDL, Fungsi, Trigger, Indeks, View, & Seed SQL PostgreSQL
├── migrations/                # Konfigurasi dan migrasi Alembic
├── tests/                     # Uji E2E skenario Cabai (UAT-04 s.d. UAT-11) & uji integritas
├── docker-compose.yml         # Orkestrasi PostgreSQL 14 + FastAPI + Nginx TLS
├── Dockerfile                 # Image container backend API
├── nginx.conf                 # Konfigurasi reverse proxy TLS 1.3
└── requirements.txt           # Dependensi Python
```

---

## 🚀 Cara Menjalankan

### 1. Menggunakan Docker Compose (Direkomendasikan)

```bash
# Salin konfigurasi environment
cp .env.example .env

# Jalankan service database dan API
docker compose up -d
```

Aplikasi akan tersedia di:
- **API Base**: `http://localhost:8000/api/v1`
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### 2. Menjalankan Lokal

```bash
# Buat virtual environment
python -m venv .venv
source .venv/bin/activate  # atau .venv\Scripts\activate di Windows

# Install dependensi
pip install -r requirements.txt

# Setup database PostgreSQL dan jalankan migrasi
alembic upgrade head

# Jalankan seeder
python -m app.seed.run_seed

# Jalankan server development
uvicorn app.main:app --reload --port 8000
```

---

## 🔒 9 Role & Akun Bawaan (Default Password: `password123`)

| Username | Role | Tanggung Jawab Utama |
|---|---|---|
| `superadmin` | `SUPERADMIN` | Akses penuh seluruh sistem |
| `admin_keanggotaan` | `ADMIN_KEANGGOTAAN` | Kelola data anggota & riwayat setoran |
| `penerimaan` | `PETUGAS_PENERIMAAN` | Penimbangan setoran panen & pembuatan batch unik |
| `sortasi` | `PETUGAS_SORTASI_QC` | Input hasil pemilahan grade & uji kendali mutu |
| `gudang` | `ADMIN_GUDANG` | Penerimaan PO, penyaluran saprotan, opname, alokasi FIFO |
| `penjualan` | `BAGIAN_PENJUALAN` | Pembuatan Sales Order, pengiriman surat jalan, faktur |
| `keuangan` | `BAGIAN_KEUANGAN` | Pembayaran anggota/supplier, jurnal kas, laporan neraca & SHU |
| `pengurus` | `PENGURUS` | Pemantauan operasional, laporan keuangan, kepatuhan ESG |
| `anggota` | `ANGGOTA_READONLY` | Portal baca-saja untuk rekap setoran & hutang koperasi |

---

## 🧪 Menjalankan Pengujian

```bash
pytest -v
```

Pengujian mencakup:
- **E2E Skenario Cabai (UAT-04 → UAT-11)**:
  - Penerimaan setoran 1.000 kg cabai → Terbit `BATCH-YYYYMMDD-XXX`
  - Validasi Mass Balance: Total input = Σ output (Tolak jika selisih ≠ 0)
  - Pembentukan hutang anggota otomatis: 700 kg Grade A + 200 kg Grade B = Rp32.600.000
  - Penjualan Retail: 700 kg Grade A + 200 kg Grade B = Rp39.400.000
  - Perhitungan margin terealisasi: Rp6.800.000 (17,26%)
  - Ketertelusuran dari Surat Jalan kembali ke Petani Anggota
- **Uji Integritas**: RBAC 403 Forbidden, penolakan stok negatif, keabsahan login.
