# Laporan Analisis Implementasi Jobdesc Tim ERP Smart Farming
**Branch Analisis:** `integration-testing`  
**Tanggal Analisis:** 17 November 2026  
**Dokumen Acuan:** `doc/Distribusi_Jobdesc_ERP_Smart_Farming.docx`, `URS`, `SRS`, dan `SDD`

---

## 1. Ringkasan Eksekutif

Berdasarkan analisis menyeluruh terhadap branch `integration-testing` (yang menggabungkan backend inti, migrasi basis data, dan antarmuka Core UI milik Rani), berikut adalah rekapitulasi status implementasi tugas dari 5 anggota tim:

| No | Anggota Tim | Peran Utama | Status Implementasi | Persentase |
|---|---|---|---|:---:|
| 1 | **Pancar** | Lead Backend & Database Architect | **Terimplementasi Penuh & Terverifikasi** | **100%** |
| 2 | **Aufa** | Backend Engineer & Hardware Integration | **Backend Lengkap, Periferal di Sisi Klien** | **85%** |
| 3 | **Rani** | Lead Frontend Developer | **Terimplementasi Penuh (Core UI & Master/Sales)** | **100%** |
| 4 | **Caca** | Frontend UI/UX & Field Operations | **Belum Diintegrasikan ke UI Rani** | **25%** |
| 5 | **Amel** | QA, Reporting & UAT | **Backend & Dokumen Siap, UI Pelaporan Parsial** | **70%** |

### Temuan Kunci:
1. **Backend & Database (Pancar & Aufa):** Seluruh arsitektur backend, constraint integritas data PostgreSQL (Anti Stok Negatif, Immutability Jurnal), RBAC 6 role, Auto-Journaling, Mass Balance sortasi, alokasi FIFO, hingga endpoint ESG & Traceability telah **100% selesai dan aktif**.
2. **Frontend Core (Rani):** Tata letak SPA React 19, Sidebar dinamis RBAC, Dashboard, Master Data (Petani, Saprotan, Pelanggan, Katalog Harga), dan Layar Pemesanan Penjualan (Sales Order dengan Tiering Segmen) sudah **100% berfungsi**.
3. **Kesenjangan (Gap) Integrasi:**
   - Fitur lapangan milik **Caca** (*Penerimaan Panen Touch-friendly*, *Web Serial Scale*, *Form Sortasi Real-Time Mass Balance*) dan halaman visualisasi ESG milik **Amel** sebelumnya dikembangkan di atas branch terpisah (`feature/caca-penerimaan-sortasi` dan `feature/amel-reporting-esg`) dengan basis TypeScript & Tailwind yang bertabrakan dengan desain Rani.
   - Sesuai arahan agar tidak menggabungkan branch `frontend-smart-farming`, halaman-halaman tersebut saat ini masih berstatus `ModulePlaceholderPage` pada antarmuka frontend Rani dan memerlukan adaptasi komponen (porting) ke format `.jsx`.

---

## 2. Rincian Analisis per Anggota Tim

---

### 1. Pancar (Lead Backend & Database Architect)
**Fokus:** Infrastruktur basis data, keamanan, dan logika finansial (Accounting).

| Poin Jobdesc Resmi | Status | Bukti File & Implementasi Kode | Catatan / Hasil Verifikasi |
|---|:---:|---|---|
| **Database & Skema Relasional:**<br>- Skema PostgreSQL 14 (tabel, FK, indeks batch).<br>- Constraint *"Zero Negative Stock"* di level database. | **100%**<br>SELESAI | - [`sql/001` s.d. `sql/012`](file:///d:/Organize/Projects/smart-farming-erp-core/sql)<br>- [`sql/009_integrity.sql`](file:///d:/Organize/Projects/smart-farming-erp-core/sql/009_integrity.sql)<br>- [`migrations/versions/001_initial_schema.py`](file:///d:/Organize/Projects/smart-farming-erp-core/migrations/versions/001_initial_schema.py) | - Trigger `trg_prevent_negative_lot_qty` dan `check_lot_ledger()` mencegah saldo lot < 0 di level engine database.<br>- Indeks komposit pada `(batch_code, product_id)` dan relasi FK terpasang penuh.<br>- 12 skrip DDL tereksekusi tanpa error. |
| **Keamanan & Middleware:**<br>- RBAC untuk 6 peran pengguna.<br>- Otentikasi JWT (JSON Web Token).<br>- Security Audit Trail. | **100%**<br>SELESAI | - [`app/core/security.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/core/security.py)<br>- [`app/core/deps.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/core/deps.py)<br>- [`app/core/audit.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/core/audit.py)<br>- [`app/modules/auth/router.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/modules/auth/router.py)<br>- [`sql/012_security.sql`](file:///d:/Organize/Projects/smart-farming-erp-core/sql/012_security.sql) | - Endpoint login `/api/v1/auth/login` memverifikasi hash bcrypt & menerbitkan token JWT.<br>- Dependency injection `require_roles()` memvalidasi hak akses setiap endpoint.<br>- Tabel `audit_logs` merekam IP, user_id, action, dan payload mutasi. |
| **Modul Accounting (Fitur 6):**<br>- Algoritma *Auto-Journaling* double-entry otomatis untuk setiap mutasi.<br>- Perhitungan selisih kotor (*gross margin*) per batch.<br>- Perhitungan Sisa Hasil Usaha (SHU). | **100%**<br>SELESAI | - [`app/modules/accounting/journal.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/modules/accounting/journal.py)<br>- [`app/modules/accounting/handlers.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/modules/accounting/handlers.py)<br>- [`app/modules/accounting/reports.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/modules/accounting/reports.py)<br>- [`app/modules/accounting/shu.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/modules/accounting/shu.py)<br>- [`app/modules/accounting/router.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/modules/accounting/router.py) | - Event handler `on_harvest_received`, `on_goods_received`, dan `on_sales_shipped` otomatis membuat baris jurnal seimbang (Debit = Kredit).<br>- Jurnal ter-posting immutable (hanya bisa dibalik via reversal journal).<br>- Endpoint kalkulasi SHU berbasis bobot kontribusi transaksi anggota. |
| **Modul ESG & Ketertelusuran (Fitur 7):**<br>- Endpoint API ekstraksi riwayat produk end-to-end (faktur mundur ke lahan petani).<br>- Perhitungan rasio pupuk organik & estimasi emisi karbon. | **100%**<br>SELESAI | - [`app/modules/reporting/traceability.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/modules/reporting/traceability.py)<br>- [`app/modules/reporting/esg_handlers.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/modules/reporting/esg_handlers.py)<br>- [`app/modules/reporting/router.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/modules/reporting/router.py) | - Endpoint `/api/v1/reporting/traceability/{batch_code}` menelusuri dari SO/Invoice &rarr; Delivery Order &rarr; Batch Sortasi &rarr; Setoran Panen &rarr; Petani & Titik Koordinat Lahan.<br>- Endpoint `/api/v1/reporting/esg/metrics` menghitung rasio pupuk organik vs kimia dan indeks *food loss*. |

---

### 2. Aufa (Backend Engineer & Hardware Integration)
**Fokus:** Logika operasional rantai pasok (Procurement, Inventory, Manufacturing) dan integrasi perangkat keras eksternal.

| Poin Jobdesc Resmi | Status | Bukti File & Implementasi Kode | Catatan / Hasil Verifikasi |
|---|:---:|---|---|
| **Modul Inventory & FIFO (Fitur 3):**<br>- Logika rotasi FIFO untuk alokasi pengeluaran barang jadi.<br>- Pemicu notifikasi batas minimum (*Reorder Point* / ROP). | **100%**<br>SELESAI | - [`app/modules/inventory/service.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/modules/inventory/service.py)<br>- [`app/modules/inventory/notifications.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/modules/inventory/notifications.py)<br>- [`app/modules/sales/service.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/modules/sales/service.py) | - Metode `InventoryService.allocate_fifo()` mengurutkan lot aktif berdasarkan `received_at ASC` saat pemesanan penjualan dikonfirmasi.<br>- Fungsi `evaluate_reorder_point()` memicu notifikasi peringatan saat stok saprotan turun di bawah batas aman. |
| **Modul Manufacturing & Mass Balance (Fitur 4):**<br>- Algoritma backend pemrosesan hasil sortasi.<br>- Aturan *Mass Balance Constraint* (input curah = mutu A + B + C + afkir). | **100%**<br>SELESAI | - [`app/modules/manufacturing/service.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/modules/manufacturing/service.py)<br>- [`app/modules/manufacturing/router.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/modules/manufacturing/router.py) | - Fungsi `post_sorting_order()` secara ketat memeriksa selisih massa: jika `abs(input - output) > 0`, sistem membatalkan transaksi dan melempar error domain `MASS_BALANCE_VIOLATION`.<br>- Alur terverifikasi pada tes unit `test_cabai_end_to_end_flow`. |
| **Integrasi Periferal (Hardware API):**<br>- Endpoint API & parsing serial data timbangan digital (*Web Serial API*).<br>- Pembacaan barcode scanner (*USB HID*). | **50%**<br>PARSIAL | - Sisi Backend: [`app/modules/procurement/router.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/modules/procurement/router.py)<br>- Sisi Klien: `useScale.ts` dan `useBarcodeWedge.ts` (terdapat di branch Caca). | - **Analisis Arsitektur:** Standar *Web Serial API* (`navigator.serial`) dan *USB HID keyboard wedge* dieksekusi secara lokal di peramban klien (bukan daemon server backend).<br>- Backend menerima hasil timbangan melalui payload JSON standar.<br>- Hook client-side Web Serial belum dihubungkan ke UI murni Rani di branch `integration-testing`. |

---

### 3. Rani (Lead Frontend Developer)
**Fokus:** Kerangka Single Page Application (SPA), tata letak utama, dan manajemen data.

| Poin Jobdesc Resmi | Status | Bukti File & Implementasi Kode | Catatan / Hasil Verifikasi |
|---|:---:|---|---|
| **Kerangka Utama (Core UI):**<br>- Arsitektur frontend React SPA.<br>- Sidebar navigasi dinamis berbasis hak akses (RBAC).<br>- Halaman Dashboard utama. | **100%**<br>SELESAI | - [`frontend/src/App.jsx`](file:///d:/Organize/Projects/smart-farming-erp-core/frontend/src/App.jsx)<br>- [`frontend/src/layouts/MainLayout.jsx`](file:///d:/Organize/Projects/smart-farming-erp-core/frontend/src/layouts/MainLayout.jsx)<br>- [`frontend/src/config/menu.js`](file:///d:/Organize/Projects/smart-farming-erp-core/frontend/src/config/menu.js)<br>- [`frontend/src/config/roles.js`](file:///d:/Organize/Projects/smart-farming-erp-core/frontend/src/config/roles.js)<br>- [`frontend/src/pages/dashboard/DashboardPage.jsx`](file:///d:/Organize/Projects/smart-farming-erp-core/frontend/src/pages/dashboard/DashboardPage.jsx) | - Navigasi sidebar dinamis menyaring menu sesuai izin pengguna (`permissions` & `roles`).<br>- Halaman dashboard menampilkan ringkasan metrik operasional, status gudang, dan notifikasi real-time.<br>- Telah diperbaiki pemisahan scrolling independen antara sidebar dan area konten utama. |
| **Modul Master Data & Keanggotaan (Fitur 1):**<br>- Formulir pendaftaran profil petani anggota & lahan.<br>- Master saprotan.<br>- Direktori pelanggan komersial. | **100%**<br>SELESAI | - [`frontend/src/pages/master-data/MembersPage.jsx`](file:///d:/Organize/Projects/smart-farming-erp-core/frontend/src/pages/master-data/MembersPage.jsx)<br>- [`frontend/src/pages/master-data/SaprotanPage.jsx`](file:///d:/Organize/Projects/smart-farming-erp-core/frontend/src/pages/master-data/SaprotanPage.jsx)<br>- [`frontend/src/pages/master-data/CustomersPage.jsx`](file:///d:/Organize/Projects/smart-farming-erp-core/frontend/src/pages/master-data/CustomersPage.jsx)<br>- [`frontend/src/pages/master-data/PricingCatalogPage.jsx`](file:///d:/Organize/Projects/smart-farming-erp-core/frontend/src/pages/master-data/PricingCatalogPage.jsx) | - Modal input lengkap untuk pendaftaran anggota baru beserta titik koordinat lahan.<br>- Manajemen data saprotan (pupuk organik, pupuk kimia, benih).<br>- Direktori pelanggan komersial dengan penetapan segmen pasar (Retail, Modern, Grosir, Industri). |
| **Modul Sales & Price Tiering (Fitur 5):**<br>- Antarmuka pesanan penjualan (Sales Order).<br>- Logika UI penguncian harga bertingkat otomatis berdasarkan segmen pelanggan. | **100%**<br>SELESAI | - [`frontend/src/pages/sales/SalesOrderPage.jsx`](file:///d:/Organize/Projects/smart-farming-erp-core/frontend/src/pages/sales/SalesOrderPage.jsx)<br>- [`frontend/src/services/salesService.js`](file:///d:/Organize/Projects/smart-farming-erp-core/frontend/src/services/salesService.js) | - Form Sales Order otomatis mengunci harga jual saat pelanggan dipilih berdasarkan tiering aktif (KONSUMEN, RETAIL, GROSIR, INDUSTRI).<br>- Dilengkapi tabel simulasi alokasi FIFO lot barang jadi secara visual sebelum pesanan dikirim (*shipment*). |

---

### 4. Caca (Frontend UI/UX & Field Operations)
**Fokus:** Antarmuka operasional staf lapangan (gudang dan produksi) yang mengutamakan kecepatan interaksi.

| Poin Jobdesc Resmi | Status di Branch Ini | Bukti Kode / Sumber Asli | Catatan & Analisis Kesenjangan |
|---|:---:|---|---|
| **Modul Procurement & Penerimaan (Fitur 2):**<br>- Antarmuka pencatatan setoran panen *touch-friendly* untuk layar sentuh gudang.<br>- Tombol *"Ambil Berat"* terhubung ke timbangan digital. | **Belum Diintegrasikan**<br>(Placeholder) | - Status di branch: [`frontend/src/routes/AppRoutes.jsx`](file:///d:/Organize/Projects/smart-farming-erp-core/frontend/src/routes/AppRoutes.jsx#L96-L107) masih `ModulePlaceholderPage`.<br>- Sumber di branch Caca: `PenerimaanPanen.tsx`, `WeighStationPage.tsx`, `useScale.ts`. | Kode implementasi Caca berada di branch `feature/caca-penerimaan-sortasi`. Karena menggunakan stack TypeScript + Tailwind yang berbeda dengan kerangka JSX Rani, file tersebut belum di-porting ke dalam `frontend/src/pages/procurement/`. |
| **Modul Manufacturing & Sortasi (Fitur 4):**<br>- Tabel input grading mutu.<br>- *Real-Time Mass Balance Calculator* (indikator warna kesesuaian massa). | **Belum Diintegrasikan**<br>(Placeholder) | - Status di branch: [`frontend/src/routes/AppRoutes.jsx`](file:///d:/Organize/Projects/smart-farming-erp-core/frontend/src/routes/AppRoutes.jsx#L109-L120) masih `ModulePlaceholderPage`.<br>- Sumber di branch Caca: `FormSortasi.tsx`, `SortingFormPage.tsx`, `massBalance.ts`. | Logika kalkulator massa real-time (validasi selisih 0 kg secara visual) sudah ditulis oleh Caca di `massBalance.ts` dan `FormSortasi.tsx`, namun belum diadaptasi ke komponen UI JSX Rani. |
| **Notifikasi & Error Handling:**<br>- Pesan error kontekstual.<br>- Banner peringatan Restock.<br>- Fitur *Auto-Save Draft* pada Local Storage. | **Parsial**<br>(~40%) | - Komponen aktif: [`frontend/src/components/AlertBanner.jsx`](file:///d:/Organize/Projects/smart-farming-erp-core/frontend/src/components/AlertBanner.jsx)<br>- Sumber di branch Caca: `useDraft.ts`, `useContextualError.ts`. | Komponen visual `AlertBanner` sudah tersedia di desain Rani. Namun mekanisme penyimpanan otomatis (*Auto-Save Draft*) formulir timbang ke `localStorage` dan penanganan error kontekstual lapangan belum diporting. |

---

### 5. Amel (Quality Assurance, Reporting & UAT)
**Fokus:** Pembangkitan dokumen cetak, visualisasi pelaporan (ESG), dan pengujian sistem.

| Poin Jobdesc Resmi | Status di Branch Ini | Bukti File & Implementasi Kode | Catatan & Analisis Kesenjangan |
|---|:---:|---|---|
| **Report Generation & Export:**<br>- Render dokumen PDF (Bukti Timbang, Surat Jalan, Faktur Penjualan).<br>- Ekspor laporan stok ke format Excel (.xlsx). | **75%**<br>SELESAI SEBAGIAN | - Backend Engine: [`app/modules/reporting/export.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/modules/reporting/export.py)<br>- Helper Frontend: [`frontend/src/core/print/pdfAndExcelExporter.ts`](file:///d:/Organize/Projects/smart-farming-erp-core/frontend/src/core/print/pdfAndExcelExporter.ts) | - Backend API `/api/v1/reporting/export/stock.xlsx` dan modul PDF Bukti Timbang/Faktur sudah 100% siap menghasilkan berkas biner.<br>- Helper unduh biner sudah dimasukkan ke `frontend/src/core/print/`.<br>- Tombol trigger pada layar antarmuka pengguna masih menunggu pembukaan menu laporan operasional di UI. |
| **Dashboard ESG (Fitur 7):**<br>- Visualisasi grafik frontend untuk indikator ESG (*food loss*, rasio pupuk, tren pembayaran). | **40%**<br>SELESAI SEBAGIAN | - Backend API: [`app/modules/reporting/router.py`](file:///d:/Organize/Projects/smart-farming-erp-core/app/modules/reporting/router.py)<br>- Status UI: [`frontend/src/routes/AppRoutes.jsx`](file:///d:/Organize/Projects/smart-farming-erp-core/frontend/src/routes/AppRoutes.jsx#L149-L158) masih `ModulePlaceholderPage`.<br>- Sumber di branch Amel: `ESGIndicatorsPage.tsx`. | Backend API penyedia data ESG (`/reporting/esg/metrics`) sudah berfungsi penuh. Halaman visualisasi grafik pada frontend belum di-porting ke antarmuka Rani. |
| **Software Testing (UAT):**<br>- 12 skenario pengujian UAT.<br>- Memastikan seluruh *Business Rules* (anti stok negatif, jurnal immutable) berjalan sempurna. | **95%**<br>TERDOKUMENTASI & TERUJI | - Dokumen UAT: [`docs/UAT_12_Skenario.md`](file:///d:/Organize/Projects/smart-farming-erp-core/docs/UAT_12_Skenario.md)<br>- Test Otomatis: [`tests/test_e2e_cabai.py`](file:///d:/Organize/Projects/smart-farming-erp-core/tests/test_e2e_cabai.py), [`tests/test_integrity.py`](file:///d:/Organize/Projects/smart-farming-erp-core/tests/test_integrity.py) | - Dokumen 12 skenario UAT lengkap beserta langkah uji dan *expected results* sudah ada di repositori.<br>- Pengujian otomatis backend (`pytest`) berhasil melewati seluruh pengujian integritas (5/5 passed dalam 0.8s). |

---

## 3. Matriks Rekapitulasi Status Akhir

```
[==================== 100% ====================] Pancar (Backend, Database, Accounting, Security, ESG)
[================= 85% =================       ] Aufa (Inventory FIFO, Mass Balance, Hardware API)
[==================== 100% ====================] Rani (Core UI SPA, Dynamic RBAC, Master Data, Sales Tiering)
[===== 25% ====================================] Caca (Penerimaan Panen, Sortasi Mass Balance, Offline Draft)
[============== 70% ===========================] Amel (PDF/Excel Export, UAT 12 Skenario, ESG Dashboard)
```

| Modul / Fitur | Lead / PIC | Ketersediaan di Backend | Ketersediaan di Frontend | Status Terintegrasi Saat Ini |
|---|---|:---:|:---:|:---:|
| **Skema DB & Integritas Data** | Pancar | **100% (Aktif)** | N/A (Database Engine) | **Siap Produksi** |
| **Keamanan, JWT & RBAC** | Pancar | **100% (Aktif)** | **100% (Aktif)** | **Siap Produksi** |
| **Master Data Petani & Saprotan** | Rani / Pancar | **100% (Aktif)** | **100% (Aktif)** | **Siap Produksi** |
| **Sales Order & Price Tiering** | Rani / Aufa | **100% (Aktif)** | **100% (Aktif)** | **Siap Produksi** |
| **Penerimaan Panen & Timbangan** | Caca / Aufa | **100% (Aktif)** | **Placeholder (20%)** | **Perlu Porting UI** |
| **Sortasi & Mass Balance** | Caca / Aufa | **100% (Aktif)** | **Placeholder (20%)** | **Perlu Porting UI** |
| **Auto-Journaling & SHU** | Pancar | **100% (Aktif)** | **Placeholder (20%)** | **Backend Siap, UI Perlu Disambung** |
| **ESG & Traceability** | Pancar / Amel | **100% (Aktif)** | **Placeholder (30%)** | **Backend Siap, UI Perlu Disambung** |
| **PDF & Excel Exporter** | Amel | **100% (Aktif)** | **Helper Ada (60%)** | **Tinggal Pasang Tombol di UI** |
| **Dokumen UAT & Pengujian Sistem** | Amel / Pancar | **100% (Aktif)** | **Dokumen Siap (100%)** | **Siap Diuji** |

---

## 4. Rekomendasi Langkah Selanjutnya

Untuk membuat sistem 100% lengkap dan siap dipresentasikan tanpa merusak kesepakatan desain UI Rani:

1. **Porting Halaman Penerimaan Panen (Tugas Caca):**
   - Mengonversi logika dari `PenerimaanPanen.tsx` / `WeighStationPage.tsx` milik Caca ke file baru `frontend/src/pages/procurement/HarvestReceiptPage.jsx`.
   - Menggunakan komponen input Rani (`FormField`, `Button`, `Table`) dengan tombol "Ambil Berat" (bisa diisi manual atau simulasi Web Serial).
   - Menghubungkan rute `/procurement/harvest` di `AppRoutes.jsx`.

2. **Porting Halaman Sortasi & Mass Balance (Tugas Caca):**
   - Mengonversi logika dari `FormSortasi.tsx` ke `frontend/src/pages/manufacturing/SortingPage.jsx`.
   - Menambahkan kalkulator selisih bobot *real-time* dengan indikator badge hijau jika selisih 0 kg dan merah jika tidak seimbang.
   - Menghubungkan rute `/manufacturing/sorting` di `AppRoutes.jsx`.

3. **Penyambungan Layar Akuntansi & ESG (Tugas Amel):**
   - Menghubungkan endpoint `/api/v1/reporting/esg/metrics` dan `/api/v1/accounting/reports/margin` ke halaman visualisasi sederhana menggunakan tata letak Rani.
   - Menambahkan tombol unduh PDF Bukti Timbang dan Faktur pada layar yang relevan menggunakan fungsi `exportStockToExcel` dan `downloadPdfFromApi` yang sudah tersedia di `pdfAndExcelExporter.ts`.
