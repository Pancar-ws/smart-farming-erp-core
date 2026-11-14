# 🌾 Smart Farming ERP Core

Sistem Enterprise Resource Planning (ERP) terintegrasi untuk manajemen rantai pasok agribisnis berkelanjutan pada Koperasi Tani, dirancang mengikuti standar spesifikasi perangkat lunak **IEEE Std 830-1998 (SRS)** dan **Software Design Document (SDD)** berbasis **Modern Three-Tier Architecture**.

---

## 🏛️ Dokumentasi Implementasi: Pancar (Lead Backend & Database Architect)

Bagian ini mendokumentasikan secara rinci arsitektur teknis, desain basis data, sistem keamanan, modul akuntansi terotomatisasi, serta ketertelusuran rantai pasok dan ESG yang menjadi tanggung jawab utama **Pancar** sesuai dokumen *Distribusi Jobdesc Proyek ERP Smart Farming*.

---

### 1. Arsitektur Basis Data Relasional & Integritas Data (PostgreSQL 14)
*Lokasi Berkas:* `sql/001_...` s/d `sql/012_security.sql`, `migrations/`, `app/core/database.py`

* **Skema Database Terpusat (*Single Source of Truth*):**
  Mengimplementasikan skema relasional menyeluruh (12 skrip DDL/DML) yang mencakup entitas Master Keanggotaan (`members`, `lands`), Pengadaan (`purchase_orders`, `harvest_receipts`), Inventaris (`inventory_lots`, `stock_movements`), Manufaktur/Sortasi (`sorting_orders`, `sorting_outputs`), Penjualan (`sales_orders`, `delivery_orders`), serta Akuntansi & ESG (`journal_entries`, `journal_lines`, `shu_runs`, `esg_logs`).
* **Integritas Data di Tingkat RDBMS:**
  * **Zero Negative Stock Policy (`ck_lot_nonneg`):** Menolak mutasi stok keluar jika kuantitas on-hand bernilai negatif atau kuantitas *reserved* melampaui stok fisik.
  * **Aturan Keseimbangan Rekonsiliasi Lot (`trg_lot_ledger`):** Mencegah ketidaksesuaian antara saldo kuantitas pada entitas lot dengan akumulasi mutasi fisik pada tabel buku besar stok.
  * **Penomoran Dokumen Otomatis (`document_sequences` & `app/core/numbering.py`):** Pembangkitan kode transaksi unik berbasis periode secara konsisten (contoh: `AGT-XXXXX`, `STR-YYYYMM-XXX`, `BCH-YYYYMMDD-XX`, `SO-YYYYMM-XXXX`).
  * **Database Migration:** Terintegrasi penuh dengan Alembic untuk memastikan evolusi skema database yang terkontrol dan dapat direproduksi di lingkungan kontainer Docker.

---

### 2. Sistem Keamanan, Autentikasi JWT & RBAC
*Lokasi Berkas:* `app/core/security.py`, `app/core/deps.py`, `app/modules/auth/`

* **Hashing Kata Sandi Berstandar Industri (SRS-NFR-002):**
  Menggunakan algoritma kriptografi modern **Argon2id** (`argon2-cffi`) dengan penambahan *salt* acak untuk mencegah serangan kamus maupun *rainbow table*.
* **Otentikasi Berbasis Token (JWT):**
  Penerbitan *JSON Web Token* bertanda tangan HMAC-SHA256 dengan pemisahan masa berlaku *access token* (default: 30 menit) dan *refresh token* (default: 8 jam).
* **Role-Based Access Control (RBAC 7 Peran):**
  Menerapkan mekanisme otorisasi berlapis menggunakan *dependency injection* FastAPI (`require("permission:code")`) yang membatasi hak akses secara ketat:
  1. `SUPERADMIN` — Akses konfigurasi penuh sistem dan manajemen peran.
  2. `PENGURUS` — Akses pemantauan eksekutif, persetujuan transaksi, dan laporan ESG.
  3. `KEUANGAN` — Akses penuh modul akuntansi, jurnal umum, hutang/piutang, dan penutupan buku.
  4. `PENERIMAAN` — Akses pencatatan setoran panen dan penimbangan gudang curah.
  5. `GUDANG` — Pengelolaan stok multi-gudang, kartu stok, dan approval mutasi.
  6. `SORTASI` — Input hasil sortasi, grading mutu fisik, dan pemakaian kemasan.
  7. `PENJUALAN` — Pemrosesan pesanan penjualan (SO), harga bertingkat, dan surat jalan (DO).
  *Contoh Penegakan:* Petugas Penerimaan yang mencoba memodifikasi master harga penjualan komersial secara otomatis diblokir dengan respon HTTP `403 Forbidden` (UAT-12).
* **Security Audit Trail (`app/core/audit.py`):**
  Pencatatan riwayat setiap aksi mutasi, manipulasi data penting, serta percobaan autentikasi (berhasil/gagal) ke dalam tabel `audit_logs` yang mencatat timestamp, User ID, nama tabel, jenis aksi, dan alamat IP klien.

---

### 3. Modul Akuntansi Terpadu & Auto-Journaling (Fitur 6)
*Lokasi Berkas:* `app/modules/accounting/` (`journal.py`, `handlers.py`, `shu.py`, `payment_service.py`, `reports.py`)

* **Event-Driven Auto-Journaling:**
  Sistem akuntansi tidak memerlukan input jurnal manual berulang. Menggunakan *In-Memory Event Bus* (`app/core/events.py`), modul ini secara otomatis mendengarkan *lifecycle event* dari modul operasional lain:
  * **Penerimaan Panen Mentah:** Otomatis mendebit Persediaan Panen Mentah dan mengkredit Hutang Anggota (AP).
  * **Penyelesaian Sortasi/Manufaktur:** Mendebit Persediaan Barang Jadi (Grade A/B) dan Beban Susut/Afkir, serta mengkredit Persediaan Panen Mentah.
  * **Pengiriman Penjualan (DO):** Mendebit Harga Pokok Penjualan (HPP) dan mengkredit Persediaan Barang Jadi.
  * **Penerbitan Faktur Penjualan:** Mendebit Piutang Pelanggan (AR) dan mengkredit Pendapatan Penjualan.
* **Prinsip Immutability Jurnal (SRS-NFR-004 / SDD 2.5):**
  Jurnal transaksi yang sudah di-*posting* dikunci permanen di tingkat database (`forbid_mutation` trigger). Transaksi tidak dapat diedit atau dihapus (`DELETE` dilarang); koreksi pembukuan wajib dilakukan melalui mekanisme jurnal balik (*reversing entry*).
* **Evaluasi Margin Batch Transparan (UAT-09):**
  Menyajikan laporan selisih kotor operasional per nomor batch sortasi secara *real-time* melalui view basis data `v_batch_margin` (menghitung total nilai jual dikurangi total harga beli anggota).
* **Kalkulasi Sisa Hasil Usaha (SHU):**
  Algoritma perhitungan alokasi laba bersih koperasi pada akhir periode akuntansi, mendistribusikan SHU secara proporsional kepada petani anggota berdasarkan kontribusi nilai transaksi setoran masing-masing.

---

### 4. Modul Ketertelusuran Rantai Pasok (Traceability) & Metrik ESG (Fitur 7)
*Lokasi Berkas:* `app/modules/reporting/` (`traceability.py`, `esg_handlers.py`, `export.py`)

* **Ketertelusuran End-to-End Berbasis QR Code (UAT-10):**
  Menyediakan endpoint API dan generator QR Code kemasan (`/api/v1/reporting/traceability/{batch_code}/qr`) yang memungkinkan audit mundur secara lengkap:
  $$\text{Faktur / Surat Jalan Pelanggan} \longrightarrow \text{Batch Sortasi & Grade} \longrightarrow \text{Bukti Timbang} \longrightarrow \text{Petani Anggota & Koordinat Lahan}$$
* **Metrik Keberlanjutan Lingkungan & Sosial (ESG):**
  * **Environmental (SDG 12 & 13):** Perhitungan otomatis persentase susut pangan (*Food Loss Ratio*) per komoditas pasca-sortasi, perbandingan proporsi penyaluran pupuk organik vs. kimiawi, serta estimasi emisi jejak karbon transportasi armada distribusi.
  * **Social (SDG 2 & 8):** Pemantauan rasio keadilan harga beli petani terhadap harga jual pasar (*Farmer Margin Ratio*), ketepatan waktu pelunasan pembayaran hasil panen, dan jumlah anggota tani aktif.
  * **Governance:** Keterlacakan audit transaksi 100% dan transparansi buku besar koperasi.

---

## 🛠️ Stack Teknologi Backend

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Bahasa Pemrograman** | Python 3.12 | Tipe data modern & performa tinggi |
| **Framework Web** | FastAPI >= 0.110 | Asynchronous RESTful API & auto OpenAPI Swagger |
| **Server ASGI** | Uvicorn | High-performance ASGI runtime |
| **Database** | PostgreSQL 14 | ACID-compliant RDBMS dengan native custom domains & triggers |
| **ORM & Migrations** | SQLAlchemy 2.0 & Alembic | Abstraksi model relasional & version control skema DB |
| **Kriptografi & Auth** | Argon2id (`argon2-cffi`) & PyJWT | Password hashing berstandar enterprise & stateless JWT |
| **Containerization** | Docker & Docker Compose | Multi-container stack (`db`, `api`, `nginx`) |

---

## 🚀 Panduan Menjalankan Sistem (Local Development)

### 1. Prasyarat
* Docker Desktop aktif
* Python 3.10+ (opsional, jika menjalankan di luar container)

### 2. Menjalankan Layanan Menggunakan Docker Compose
```powershell
# 1. Gandakan file env konfigurasi
copy .env.example .env

# 2. Nyalakan seluruh layanan (Database, Backend API, Nginx)
docker compose up -d

# 3. Pantau log proses server
docker compose logs -f api
```

### 3. Mengakses Dokumentasi Interaktif
Setelah layanan berstatus *healthy*, buka browser:
* **Interactive API Docs (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Alternative API Docs (ReDoc):** [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **Root Health Check:** [http://localhost:8000/](http://localhost:8000/)

---

## 🧪 Eksekusi Pengujian Otomatis (UAT & Test Suite)

Untuk memvalidasi integritas data, aturan RBAC, dan simulasi transaksi cabai end-to-end:

```powershell
# Menjalankan seluruh test suite di dalam container
docker compose run --rm api pytest tests/ -v
```
