# Strategi & Metode Testing — ERP Smart Farming Koperasi Tani

> Dokumen pendamping **Backend**, **Frontend**, dan **Database Smart Farming**.
> Isi: pemilihan metode testing berdasarkan risiko, teknik desain test case, contoh test case, dan urutan pelaksanaan.
> Catatan: nilai batas pada contoh BVA bersifat ilustrasi. Sesuaikan dengan constraint final di DDL dan SRS.

---

## Daftar Isi

1. [Karakter Sistem yang Memengaruhi Strategi](#1-karakter-sistem-yang-memengaruhi-strategi)
2. [Ringkasan Metode & Prioritas](#2-ringkasan-metode--prioritas)
3. [Teknik Desain Test Case](#3-teknik-desain-test-case)
4. [Level & Jenis Testing](#4-level--jenis-testing)
5. [Yang Tidak Diprioritaskan](#5-yang-tidak-diprioritaskan)
6. [Tambahan atas Dokumen yang Ada](#6-tambahan-atas-dokumen-yang-ada)
7. [Urutan Pelaksanaan & Kriteria Selesai](#7-urutan-pelaksanaan--kriteria-selesai)

---

## 1. Karakter Sistem yang Memengaruhi Strategi

| Karakter | Konsekuensi untuk testing |
|---|---|
| Aturan bisnis ketat dan angka presisi (stok tidak negatif, jurnal seimbang, mass balance) | Perlu BVA dan assertion angka eksak, bukan sekadar cek "berhasil/gagal". |
| Integritas dijaga dua lapis: service layer dan trigger/constraint PostgreSQL | Integration test harus memakai **DB asli**. Mock DB membuat trigger tidak teruji. |
| Dokumen punya siklus status dan dokumen terposting tidak boleh diubah | Perlu state transition testing, termasuk transisi terlarang dan reversal. |
| Ada konkurensi (alokasi FIFO, penomoran dokumen) | Perlu uji paralel khusus. |
| RBAC berlapis, termasuk role anggota yang hanya bisa membaca | Perlu decision table peran × aksi, diuji sampai level API. |
| Perangkat lapangan: timbangan (Web Serial), antrean offline, dokumen cetak, layar 1080p dan tablet 10" | Perlu unit test parser, uji offline, dan uji viewport. |

---

## 2. Ringkasan Metode & Prioritas

Sembilan metode di bawah ini adalah **menu berdasarkan risiko**, bukan daftar yang harus dijalankan semuanya dengan bobot sama.

| # | Metode | Kelompok | Untuk apa |
|---|---|---|---|
| 1 | Integration test dengan DB asli (pytest + PostgreSQL Docker) | **Inti** | Service + trigger: stok negatif, jurnal tidak seimbang, edit dokumen terposting, periode tertutup. |
| 2 | Black-box: Boundary Value Analysis + Equivalence Partitioning | **Inti** | Berat, kuantitas jual vs stok, NIK, persen susut, mass balance, batas periode. |
| 3 | Decision table | **Inti** | Matriks RBAC dan penentuan harga (produk × grade × segmen × tanggal berlaku). |
| 4 | State transition testing | **Inti** | Siklus status dokumen dan reversal. |
| 5 | White-box: unit test + branch coverage pada logika murni | Sebaiknya ada | FIFO, `effective_price`, rumus SHU/margin/ESG, `massBalance`, `normalizeDecimal`, `parseScaleLine`. |
| 6 | Scenario/UAT berbasis use case (E2E Playwright) | **Inti** | UAT-01 s.d. UAT-12 dengan angka acuan. |
| 7 | Uji konkurensi | Sebaiknya ada | Dua alokasi FIFO bersamaan pada lot yang sama; 20 penomoran paralel. |
| 8 | Non-fungsional (performa, keamanan, aksesibilitas, lintas browser) | Versi ringan | p95 < 5 detik pada ±100 anggota; RBAC via API langsung; axe-core. |
| 9 | Uji ketahanan offline | Kondisional | Wajib hanya jika fitur offline stasiun timbang diimplementasikan. |

> Metode 2, 3, dan 4 adalah teknik **merancang** test case. Teknik ini dipakai di dalam metode 1, 5, dan 6, bukan sebagai pengujian terpisah.

**Jika waktu terbatas:** kerjakan minimal metode **1, 6, dan teknik 2–4** pada tiga modul paling berisiko: **Inventory, Sortasi, Accounting**.

---

## 3. Teknik Desain Test Case

### 3.1 Boundary Value Analysis & Equivalence Partitioning

Contoh kandidat bidang uji (nilai batas disesuaikan dengan constraint final):

| Bidang | Partisi valid | Partisi tidak valid | Nilai batas yang diuji |
|---|---|---|---|
| Berat setoran panen (kg) | > 0 | 0, negatif, bukan angka | 0; 0,001; nilai maksimum kolom `NUMERIC(14,3)` |
| Kuantitas penjualan vs stok | ≤ stok tersedia | > stok tersedia | stok − 0,001; stok; stok + 0,001 |
| NIK anggota | Format sesuai `ck_members_nik` | Kurang/lebih digit, mengandung huruf | panjang − 1; panjang; panjang + 1 |
| Persentase (`d_pct`, 0–100) | 0–100 | < 0, > 100 | −0,01; 0; 100; 100,01 |
| Mass balance sortasi | Σ output = input | Σ output ≠ input | input 1000 kg: output 1000 (lulus), 990 (kurang 10 kg, Posting nonaktif), 1010 (lebih) |
| Susut per komoditas | sesuai konfigurasi (mis. beras 2,50%; pisang 7,50%) | di luar konfigurasi | tepat di batas, ± satu satuan terkecil |
| Tanggal jurnal vs periode | Periode terbuka | Periode tertutup (`PERIOD_CLOSED`) | hari terakhir periode terbuka; hari pertama periode tertutup |

### 3.2 Decision Table — RBAC (contoh kerangka)

Isi baris sesuai matriks RBAC di dokumen Backend §11. Setiap sel diuji dua kali: lewat UI dan lewat panggilan API langsung.

| Aksi / Endpoint | Petugas Penerimaan | Pengurus | Anggota (read-only) | Tanpa login |
|---|---|---|---|---|
| Buat setoran panen | Izin | (sesuai matriks) | Tolak (`FORBIDDEN`) | Tolak (401) |
| Lihat menu harga jual | Tidak tampil | (sesuai matriks) | Tidak tampil | Tolak |
| Buka `/pengaturan/harga` | Tolak (403) | (sesuai matriks) | Tolak | Tolak |
| Lihat laporan milik sendiri | Tolak | (sesuai matriks) | Izin (hanya `member_id` sendiri) | Tolak |
| Lihat laporan anggota lain | Tolak | (sesuai matriks) | **Tolak** | Tolak |

### 3.3 Decision Table — Penentuan Harga (contoh kerangka)

| Produk | Grade | Segmen | Tanggal dalam masa berlaku | Hasil yang diharapkan |
|---|---|---|---|---|
| Ada | Ada | Cocok | Ya | Harga sesuai baris yang berlaku |
| Ada | Ada | Cocok | Tidak (sebelum/sesudah) | Error / harga tidak ditemukan |
| Ada | Ada | Tidak ada baris | Ya | Error / harga tidak ditemukan |
| Ada | Ada | Cocok | Dua harga tumpang tindih | Harga dengan tanggal berlaku terbaru (verifikasi aturan di SRS) |
| Ubah harga master setelah transaksi | – | – | – | Baris transaksi lama **tidak berubah** (prinsip snapshot P4) |

### 3.4 State Transition — Siklus Status Dokumen

Gunakan diagram status pada dokumen Database §10 sebagai acuan. Kerangka umum:

```
DRAFT ──posting──▶ POSTED ──reversal──▶ REVERSED
  │                   │
  └──batal──▶ CANCELLED
```

| Dari | Aksi | Ke | Diharapkan |
|---|---|---|---|
| DRAFT | edit | DRAFT | Berhasil |
| DRAFT | posting | POSTED | Berhasil; stok/jurnal/hutang/log ESG terbentuk atomik |
| POSTED | edit | – | **Ditolak** (immutability) |
| POSTED | hapus | – | **Ditolak** |
| POSTED | reversal | REVERSED | Terbentuk baris pembalik; baris asli tidak diubah |
| REVERSED | posting ulang | – | **Ditolak** |

> Sesuaikan nama status dan transisi dengan §10 dokumen Database.

---

## 4. Level & Jenis Testing

### 4.1 Unit test (white-box, logika murni)

| Area | Fungsi/Modul | Alat |
|---|---|---|
| Backend | `q()`, `next_number`, `effective_price`, alokasi FIFO, rumus ESG/SHU/margin | pytest |
| Frontend | `massBalance`, `fmtIdr`/`fmtKg`/`fmtPct`, `normalizeDecimal`, `parseScaleLine`, pemetaan error, `can()` | Vitest |

Target: **branch coverage pada fungsi-fungsi di atas**, bukan coverage seluruh basis kode.

### 4.2 Integration test dengan DB asli

- Fixture: DB dibuat ulang per sesi (`alembic upgrade head` + seed minimal); tiap test berjalan dalam transaksi yang di-rollback (`SAVEPOINT`).
- Uji pelanggaran (harus **ditolak** oleh database): stok negatif, jurnal tidak seimbang, edit/hapus baris ledger, NIK tidak valid, jurnal pada periode tertutup. Rujuk dokumen Database §16.2.
- Uji rekonsiliasi: setelah rangkaian test, jalankan query §16.1 dan pastikan **0 baris**.

### 4.3 API test

Kontrak endpoint, format error seragam, dan RBAC memakai `TestClient` (httpx).

### 4.4 Uji konkurensi

| Skenario | Diharapkan |
|---|---|
| Dua alokasi FIFO bersamaan pada lot yang sama | Tidak ada oversell; stok akhir konsisten dengan Σ `stock_movements` |
| 20 permintaan nomor dokumen paralel | Tidak ada nomor ganda |

Implementasi: `ThreadPoolExecutor` pada pytest.

### 4.5 E2E / UAT (Playwright)

Angka acuan dari URS/SRS:

| UAT | Cek utama |
|---|---|
| UAT-01 | PO → penerimaan → stok saprotan naik; hutang supplier tampil |
| UAT-02 | Stok NPK < 500 → peringatan ROP muncul |
| UAT-03 | Penyaluran → stok turun; tercatat di rekap anggota |
| UAT-04 | Timbang cabai 1.000 kg → batch `BATCH-…` tampil; stok mentah 1.000 kg |
| UAT-05/06 | A 700 / B 200 / afkir 100 → seimbang, susut 10,00%; versi 990 kg → Posting nonaktif; beras 2,50%, pisang 7,50% |
| UAT-07 | Hutang anggota **Rp32.600.000** |
| UAT-08 | Total penjualan **Rp39.400.000**; jumlah > stok ditolak; pratinjau FIFO benar |
| UAT-09 | Margin **Rp6.800.000 (17,26%)** |
| UAT-10 | Rantai penjualan → sortasi → setoran → anggota tampil |
| UAT-11 | Bayar anggota; Laba Rugi, SHU, 3 panel ESG tampil |
| UAT-12 | RBAC: menu tidak tampil, URL langsung 403, API langsung `FORBIDDEN` |

### 4.6 Non-fungsional (versi ringan)

| Jenis | Cakupan minimal | Alat |
|---|---|---|
| Performa | 2–3 endpoint laporan berat; target p95 < 5 detik pada ±100 anggota | k6 / Locust |
| Keamanan | RBAC via API langsung; rate limit login (10/menit); tanpa token = ditolak | pytest + Playwright |
| Aksesibilitas | Pemindaian halaman utama (target WCAG 2.2 AA) | axe-core di Playwright |
| Kompatibilitas | Chromium, Firefox, WebKit; viewport 1920×1080 dan 1280×800 | Playwright |
| Cetak | Snapshot PDF nota, surat jalan, faktur | Playwright `page.pdf()` |

### 4.7 Uji ketahanan offline (kondisional)

Matikan jaringan → simpan setoran → data masuk antrean (outbox) → nyalakan jaringan → tersinkron → **tidak ada duplikat**.

---

## 5. Yang Tidak Diprioritaskan

| Hal | Alasan |
|---|---|
| Mock database untuk uji aturan bisnis | Trigger dan constraint tidak ikut teruji. |
| Target coverage 100% / mutation testing | Biaya besar untuk skala ±100 anggota. |
| Visual regression menyeluruh | Cukup snapshot PDF dokumen cetak. |
| Uji keamanan mendalam (penetration test) dan lintas browser penuh | Tunda sampai fitur inti stabil. |

---

## 6. Tambahan atas Dokumen yang Ada

1. **Tulis teknik desain test case secara eksplisit** (BVA, EP, decision table, state transition). Dokumen Backend §13 dan Frontend §18 hanya menyebut level dan alat.
2. **Jalankan query rekonsiliasi (Database §16.1) otomatis setelah rangkaian E2E.** Hasil harus 0 baris; ini menjadi uji invarian ledger yang murah.
3. **Pasang regression otomatis di CI:** `lint → unit → integrasi → E2E`, agar perubahan di satu modul tidak diam-diam merusak alur closed-loop antarmodul.

---

## 7. Urutan Pelaksanaan & Kriteria Selesai

### 7.1 Urutan yang disarankan

| Tahap | Pekerjaan | Hasil |
|---|---|---|
| 1 | Siapkan fixture DB + seed; unit test logika murni (metode 5) | Fondasi test berjalan di CI |
| 2 | Integration test + uji pelanggaran pada Inventory, Sortasi, Accounting (metode 1 + teknik 2–4) | Invarian ledger terjaga |
| 3 | Uji konkurensi (metode 7) | Tidak ada oversell / nomor ganda |
| 4 | E2E UAT-01…12 (metode 6) | Alur utama terverifikasi |
| 5 | Non-fungsional ringan (metode 8); offline bila fitur ada (metode 9) | Syarat NFR terpenuhi |

### 7.2 Kriteria selesai

- [ ] Seluruh uji pelanggaran Database §16.2 ditolak dengan pesan error yang diharapkan.
- [ ] Query rekonsiliasi Database §16.1 menghasilkan 0 baris setelah E2E.
- [ ] Tidak ada oversell dan tidak ada nomor dokumen ganda pada uji konkurensi.
- [ ] UAT-01 s.d. UAT-12 lulus dengan angka acuan yang sesuai.
- [ ] Matriks RBAC teruji lewat UI **dan** API langsung.
- [ ] p95 < 5 detik pada endpoint laporan berat (±100 anggota).
- [ ] Pipeline CI hijau pada setiap perubahan.
