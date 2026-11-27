# 🌾 Smart Farming ERP Core

Sistem **Enterprise Resource Planning (ERP)** terintegrasi hulu-ke-hilir untuk agribisnis dan koperasi pertanian modern (**Koperasi Tani Mandiri**). Dirancang dengan standar integritas enterprise, ketertelusuran rantai pasok penuh (*end-to-end traceability*), penegakan *Mass Balance Constraint*, rotasi stok FIFO, pembukuan jurnal berimbang otomatis (*Subledger-to-General-Ledger*), serta pemantauan indikator keberlanjutan ESG (SDG 2, 8, 12, 13).

---

## 👥 Tim Pengembang (Kelompok 3)

| Nama | NIM | Peran Utama & Tanggung Jawab (*Jobdesc*) |
|---|---|---|
| **Pancar Wahyu Setiabi** | H1D024018 | **Project Lead / Lead Backend & Database Architect**<br>Arsitektur PostgreSQL 3NF, Keamanan RBAC (Argon2id + JWT), Subledger-to-GL, Netting BR-07, & Kalkulasi SHU |
| **Amalia Maharani Andessy** | H1D024032 | **Lead Frontend Developer & Document Lead**<br>Arsitektur React SPA, Manajemen Status Global, Dynamic Navigation RBAC, & Penyusunan Dokumen URS/SRS/SDD |
| **Aufa Salsabila Algifari** | H1D024042 | **Backend Engineer & Hardware Integration**<br>Logika Rantai Pasok (Procurement, Inventory, Manufacturing), FIFO Allocation Engine, & Integrasi Timbangan/Barcode |
| **Salsabilla Rahma Diena (Caca)** | H1D025101 | **Frontend UI/UX & Field Operations Specialist**<br>Antarmuka Layar Sentuh Gudang, Tombol Ambil Berat Serial API, Real-Time Mass Balance Indicator, & Resilience UX |
| **Mazsa Amelia Maranatha (Amel)** | H1D025103 | **Quality Assurance, Reporting & UAT Lead**<br>Generator Dokumen (PDF Bukti Timbang/Faktur & Excel), Visualisasi Dashboard ESG, & Eksekusi Pengujian SUS / E2E Suite |

---

## 🛠️ Tech Stack & Arsitektur Sistem

Sistem mengadopsi pola **Three-Tier Modular Architecture** yang terisolasi penuh:

* **Lapisan Presentasi (Frontend)**: React 18, Vite, React Router v6, Tailwind CSS, Heroicons
* **Lapisan Logika Bisnis (Backend API)**: Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.0 (ORM), SlowAPI
* **Lapisan Basis Data (Data Layer)**: PostgreSQL 14+ (33 Tabel terindeks 3NF, Trigger PL/pgSQL, ACID Compliant)
* **Keamanan & Kriptografi**: Argon2id (`argon2-cffi`), Stateless JWT (HS256), Segregation of Duties (SoD)
* **Ekspor & Utilitas**: ReportLab (PDF Generator), OpenPyXL (Excel XLSX), QRCode
* **Pengujian Otomatis**: Automated E2E Suite (`httpx`), Pytest
* **Infrastruktur & Orkestrasi**: Docker, Docker Compose, Nginx (Reverse Proxy & TLS Termination)

---

## 🏗️ Struktur Modul & Bounded Context

```text
smart-farming-erp-core/
├── app/                                # Backend Engine (FastAPI)
│   ├── core/                          # Fondasi: config, db, security, deps (RBAC), errors, events, audit
│   ├── modules/                       # 8 Modul Bounded Context
│   │   ├── auth/                      # Autentikasi (JWT + Argon2id), Users, Roles, Permissions (RBAC)
│   │   ├── master/                    # Master Anggota Tani, Produk, Kategori, Grade, Harga, Pelanggan, Gudang
│   │   ├── procurement/               # PO, Goods Receipt, & Setoran Panen (Harvest Intake -> Batch Paspor)
│   │   ├── inventory/                 # Lot Stok, Kartu Mutasi (Append-only), Saldo Saprotan, Alokasi FIFO
│   │   ├── manufacturing/             # Sortasi Mutu (Mass Balance Constraint), QC, & Pengemasan Lot
│   │   ├── sales/                     # Sales Order B2B, Price Tiering Dinamis, Surat Jalan (DO), & Faktur
│   │   ├── accounting/                # Engine Auto-Journal, Subledger-to-GL, Netting Piutang (BR-07), & SHU
│   │   └── reporting/                 # Traceability Maju/Mundur, Metrik ESG, Dashboard, & Generator Dokumen
│   ├── seed/                          # Script Seeder Data Master & Simulasi Operasional Awal
│   └── main.py                        # Entry point FastAPI & registrasi router (/api/v1)
├── frontend/                          # Client Web Application (React SPA)
│   ├── src/
│   │   ├── components/                # Komponen UI Reusable (Table, Modal, Badge, Button, FormField)
│   │   ├── config/                    # Definisi Peran (roles.js) & Akun Demo Cepat
│   │   ├── pages/                     # Tampilan Modul (Auth, Dashboard, Master, Panen, Sortasi, Gudang, Sales, Accounting, ESG)
│   │   └── services/                  # REST API Client (Axios/Fetch wrapper)
│   ├── package.json                   # Dependensi Node.js
│   └── vite.config.js                 # Konfigurasi Vite Bundler
├── sql/                               # 12 File Migrasi DDL, Trigger Integritas, Indeks, & Keamanan PostgreSQL
├── doc/                               # Dokumentasi Lengkap & Laporan Uji
│   ├── screenshots/                   # Tangkapan Layar HD Verifikasi Sistem & Dashboard
│   ├── Outline_Slide_Presentasi_ERP_10_Menit.md
│   ├── Laporan_Automated_E2E_Testing_ERP_Smart_Farming.xlsx
│   └── Laporan_Pengujian_Usability_Testing_ERP_Smart_Farming.xlsx
├── scripts/                           # Otomasi Pengujian E2E, Screenshot CDP, & Generator Laporan
├── docker-compose.yml                 # Multi-container Compose (PostgreSQL 14 + FastAPI + Nginx)
├── Dockerfile                         # Container backend API
└── requirements.txt                   # Dependensi Python
```

---

## ⚡ Aturan Bisnis Inti (Business Rules)

Sistem menegakkan 8 Aturan Bisnis Absolut (**BR-01 s.d. BR-08**) langsung di level basis data dan API gateway:

1. **BR-01 (Zero Negative Stock)**: Saldo fisik inventori tidak boleh negatif. Perintah pengeluaran barang ditolak otomatis oleh *Check Constraint* DBMS jika stok tidak mencukupi.
2. **BR-02 (Immediate Double-Entry Journaling)**: Setiap mutasi fisik (panen masuk, mutasi gudang, penjualan) seketika membukukan entri jurnal umum dengan validasi mutlak $\sum \text{Debit} == \sum \text{Kredit}$.
3. **BR-03 (Active Member Intake)**: Setoran panen hanya dapat diterima dari petani anggota yang berstatus *AKTIF*.
4. **BR-04 (Zero-Valued Afkir & Mass Balance)**: Berat total curah panen mutlak sama dengan $\sum \text{Mutu (A+B+C)} + \text{Afkir}$. Komoditas afkir/reject dinilai Rp0 untuk melindungi kas koperasi.
5. **BR-05 (Anti-Loss Selling Price)**: Harga jual komoditas tidak boleh berada di bawah Harga Pokok Produksi (HPP).
6. **BR-06 (FIFO Stock Rotation)**: Pengeluaran stok produk segar mengutamakan lot dengan tanggal penerimaan tertua untuk memitigasi *food loss*.
7. **BR-07 (Automated Netting Payable)**: Saat pencairan hasil panen anggota, sistem otomatis mendeteksi dan memotong sisa piutang saprotan (pupuk/bibit) anggota tersebut.
8. **BR-08 (Document Immutability)**: Dokumen finansial dan mutasi stok berstatus *POSTED* bersifat *append-only*. Perubahan hanya dapat dilakukan melalui jurnal pembalik (*reversal*).

---

## 🔒 Hak Akses RBAC & Akun Demo Cepat

Sistem menyediakan tombol **Pilih Akun Demo** di halaman login (`http://localhost:5173/login`) untuk berpindah peran secara instan (Default Password: `password123`):

| Username | Role | Tanggung Jawab Utama (*Segregation of Duties*) |
|---|---|---|
| `superadmin` | `SUPERADMIN` | Administrator penuh sistem & konfigurasi platform |
| `admin_keanggotaan` | `ADMIN_KEANGGOTAAN` | Master data anggota tani, kuota lahan, & verifikasi legalitas |
| `penerimaan` | `PETUGAS_PENERIMAAN` | Penimbangan panen curah, hitung tara/kadar air, & cetak batch QR |
| `sortasi` | `PETUGAS_SORTASI_QC` | Pemilahan mutu grade A/B/C & penegakan Mass Balance Constraint |
| `gudang` | `ADMIN_GUDANG` | Penerimaan saprotan, monitoring masa simpan, & alokasi FIFO |
| `penjualan` | `BAGIAN_PENJUALAN` | Pengelolaan Sales Order B2B, price tiering, & surat jalan (DO) |
| `keuangan` | `BAGIAN_KEUANGAN` | Validasi jurnal, netting piutang panen (BR-07), neraca, & SHU |
| `pengurus` | `PENGURUS` | Pemantauan dashboard eksekutif, audit trail, & kepatuhan ESG |
| `anggota` | `ANGGOTA_READONLY` | Portal transparansi anggota (saldo simpanan, riwayat panen, SHU) |

---

## 🚀 Panduan Instalasi & Menjalankan Sistem

### Opsi A: Menggunakan Docker Compose (Direkomendasikan)

Pastikan Docker Desktop aktif di komputer Anda:

```bash
# 1. Clone repository
git clone https://github.com/username/smart-farming-erp-core.git
cd smart-farming-erp-core

# 2. Salin environment variable
cp .env.example .env

# 3. Jalankan seluruh container (PostgreSQL 14, FastAPI, Nginx)
docker compose up -d
```

Aplikasi dapat diakses di:
* **Frontend Web Application**: `http://localhost:5173` (atau port `80/443` via Nginx)
* **Backend REST API**: `http://localhost:8000/api/v1`
* **Swagger API Documentation**: `http://localhost:8000/docs`
* **ReDoc API Documentation**: `http://localhost:8000/redoc`

---

### Opsi B: Menjalankan Secara Lokal (Development)

#### 1. Setup Backend (FastAPI):
```bash
# Buat dan aktifkan virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependensi backend
pip install -r requirements.txt

# Jalankan seeder database awal
python -m app.seed.run_seed

# Jalankan server backend
uvicorn app.main:app --reload --port 8000
```

#### 2. Setup Frontend (React SPA):
```bash
cd frontend

# Install dependensi frontend
npm install

# Jalankan Vite development server
npm run dev
```

---

## 🧪 Hasil Verifikasi & Pengujian Sistem

Kesiapan sistem telah dibuktikan secara empiris melalui dua instrumen pengujian terstandarisasi:

### 1. Automated End-to-End (E2E) Testing Suite (ISO/IEC 25010)
* **Status Kelulusan**: **16 / 16 PASS (100% SUCCESS)**
* **Waktu Eksekusi**: **1.44 Detik**
* **Rata-rata Latensi REST API**: **23.8 ms** (jauh melampaui ambang batas toleransi 5.000 ms pada SRS-NFR-007)
* **Cakupan Uji**: Alur transaksi penuh hulu-ke-hilir (Uji Kredensial, Manipulasi RBAC, Setoran Panen, Mass Balance Rejection, Zero-Stock Rejection, DO/Faktur Penjualan, Jurnal Double-Entry, Margin Batch, Traceability, hingga Alokasi SHU).
* **Eksekusi Pengujian**:
  ```bash
  python scripts/run_automated_e2e_suite.py
  ```

### 2. Usability Testing (System Usability Scale - SUS)
* **Skor Rata-Rata SUS**: **79.25** (**Grade B / Kategori EXCELLENT / GOOD**) — *Unggul signifikan di atas ambang standar industri global 68.0*.
* **Task Completion Rate (TCR)**: **100%** sukses mandiri tanpa intervensi penguji.
* **Responden**: 10 Responden Independen mewakili seluruh peran pengguna (Admin, Kasir, Gudang, Petani, Akuntan).
* **Instrumen Ukur**: 20 Butir Kuesioner Skala Likert (Q1–Q10 Baku SUS + Q11–Q20 Evaluasi Antarmuka Modul ERP).

---

## 📄 Lisensi & Hak Cipta

Dikembangkan oleh **Kelompok 3** — Program Studi Informatika, Fakultas Teknik, Universitas Jenderal Soedirman (2026).
Dirancang untuk memenuhi tugas besar mata kuliah Enterprise Resource Planning (ERP).
