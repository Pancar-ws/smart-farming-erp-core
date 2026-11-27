# Panduan Lengkap Eksekusi Usability Testing & Kuesioner SUS
## Sistem ERP Smart Farming – Koperasi Tani Mandiri
*(Edisi Praktis & Efisien: 5 Responden Terpadu)*

---

## 1. Latar Belakang dan Landasan Teori

Dokumen ini disusun sebagai panduan teknis operasional bagi tim pengembang untuk melaksanakan **Pengujian Kebergunaan Pengguna (*Usability Testing*)** dan **Pengukuran Kepuasan Pengguna (*System Usability Scale / SUS*)** sebagai pelengkap dari *Automated End-to-End (E2E) Testing*.

Pengujian ini mengombinasikan dua pilar evaluasi pengguna:
1. **Pengujian Kinerja Objektif (Usability Testing):** Menguji efektivitas (*Task Completion Rate*) dan efisiensi (*Time-on-Task*) pengguna saat menjalankan tugas operasional nyata.
2. **Pengujian Persepsi Subjektif (Kuesioner SUS):** Mengukur tingkat kepuasan, kemudahan pemakaian, dan penerimaan pengguna menggunakan instrumen baku internasional 10 butir pertanyaan skala Likert (*Brooke, 1996*).

Kedua metode ini mengacu pada standar kualitas perangkat lunak **ISO/IEC 25010** (khususnya karakteristik *Usability: Appropriateness Recognizability, Learnability, Operability, User Error Protection*) dan **ISO 9241-11** (*Usability in Context*).

---

## 2. Kebutuhan Responden & Justifikasi Ilmiah (5 Responden)

### 2.1 Justifikasi Ilmiah Jumlah Responden (N = 5 Orang)
Pendekatan yang digunakan adalah **Terpadu & Efisien (*Paired Testing*)** dengan melibatkan **5 orang responden**. Masing-masing responden menjalankan sesi *Usability Testing* terlebih dahulu, kemudian langsung mengisi *Kuesioner SUS*.

Penetapan jumlah 5 responden ini memiliki landasan metodologis yang sangat kuat:
1. **Landasan Usability Testing (Jakob Nielsen, Nielsen Norman Group):**  
   Riset empiris membuktikan bahwa **5 orang responden sudah mampu menemukan ~85% dari seluruh masalah kebergunaan (*usability defects*)** pada suatu antarmuka. Menguji lebih dari 5 orang pada kelompok pengguna yang sama akan mengalami *diminishing returns* (menemukan masalah berulang yang sama).
2. **Landasan Kuesioner SUS pada Sampel Kecil (Tullis & Stetson, 2004; Sauro & Lewis, 2012):**  
   Instrumen SUS dirancang khusus agar memiliki reliabilitas sangat tinggi (*Cronbach's alpha* > 0.85) bahkan pada sampel kecil. Penelitian membuktikan bahwa sampel **5 sampai 8 responden** sudah memiliki tingkat akurasi di atas 80% dalam menentukan apakah sistem masuk kategori *Acceptable* (layak rilis) atau *Not Acceptable*.

### 2.2 Kriteria Responden
1. Mahasiswa atau rekan sejawat di luar tim inti pengembang (agar evaluasi objektif dan bebas bias pengembang).
2. Memiliki kemampuan dasar menggunakan komputer dan peramban web (*web browser*).
3. Belum pernah melihat atau mengoperasikan antarmuka sistem ERP Smart Farming ini sebelumnya.

### 2.3 Matriks Distribusi Peran (1 Responden = 1 Peran Operasional)
Kelima responden dialokasikan untuk mewakili 5 peran inti operasional sistem ERP:

| ID Responden | Inisial / Nama | Peran Operasional yang Disimulasikan | Modul Utama yang Diuji |
| :---: | :--- | :--- | :--- |
| **R-01** | Responden 1 | Petugas Lapangan (*Field Officer*) | Modul 1 & 2: Pendaftaran Anggota & Input Panen |
| **R-02** | Responden 2 | Petugas QC (*Quality Control*) | Modul 3: Penerimaan Panen & Split Lot Grading |
| **R-03** | Responden 3 | Petugas Gudang (*Warehouse Officer*) | Modul 4: Inventaris & Manajemen Stok Batch FIFO |
| **R-04** | Responden 4 | Kasir / Bagian Keuangan (*Finance/Cashier*) | Modul 6: Pencairan Pembayaran Nota Timbang |
| **R-05** | Responden 5 | Ketua Koperasi (*Executive/Manager*) | Modul 5 & Dashboard: Monitoring KPI & Laporan |

---

## 3. Persiapan Lingkungan Pengujian (*Pre-Test Setup*)

Sebelum memulai sesi pengujian bersama responden, pastikan checklist berikut terpenuhi:
1. [ ] **Docker Aktif:** Kontainer Backend API (`http://localhost:8000`) dan Database PostgreSQL berjalan normal.
2. [ ] **Frontend Berjalan:** Aplikasi web dapat diakses melalui browser di `http://localhost:5173`.
3. [ ] **Quick-Login Switcher Siap:** Tombol *Role Switcher* pada halaman login berfungsi (responden cukup klik tombol peran tanpa mengetik username/password).
4. [ ] **Master Data Terisi:** Master anggota (Pak Joko Susilo, dkk), katalog komoditas (Cabai Rawit Merah), dan gudang sudah siap di database.
5. [ ] **Alat Penguji:**
   - 1 unit laptop/PC pengujian untuk responden.
   - 1 lembar observasi penguji (pencatat waktu *stopwatch* dan lembar kesalahan).
   - 1 tautan Google Form kuesioner SUS yang sudah disiapkan.

---

## 4. Skenario Tugas Usability Testing (*Task Scenarios*)

Penguji memberikan lembar instruksi tugas kepada responden.  
> **ATURAN PENGUJI:** Penguji **TIDAK BOLEH** menunjuk tombol mana yang harus diklik atau menuntun langkah demi langkah. Biarkan responden mengeksplorasi antarmuka secara natural. Jika responden tersesat, catat sebagai *error* antarmuka.

---

### Skenario Tugas 1 (Task 1): Pencatatan & Input Penerimaan Panen
* **Diuji oleh:** Responden 1 (Peran: Petugas Lapangan)
* **Konteks:** Petani anggota bernama Pak Joko Susilo membawa hasil panen cabai rawit merah dari lahannya ke pos penimbangan koperasi.
* **Instruksi Pengguna:**
  > *"Silakan login sebagai Petugas Lapangan. Buat pencatatan penerimaan panen baru untuk anggota 'Joko Susilo', pilih komoditas 'Cabai Rawit Merah', masukkan total berat kotor 100 kg, lalu simpan datanya."*
* **Kriteria Sukses (*Success Criteria*):** Data penerimaan panen berhasil dibuat dan masuk ke antrean verifikasi grading.
* **Batas Waktu Wajar (*Benchmark Time*):** 90 detik.

---

### Skenario Tugas 2 (Task 2): Verifikasi Kualitas & Split Lot Grading
* **Diuji oleh:** Responden 2 (Peran: Petugas QC)
* **Konteks:** Hasil panen yang baru masuk harus disortir kualitasnya sebelum disimpan ke gudang.
* **Instruksi Pengguna:**
  > *"Silakan login sebagai Petugas QC. Buka antrean grading penerimaan panen atas nama 'Joko Susilo'. Lakukan pemisahan kualitas (split lot): masukkan 70 kg untuk Grade A dan 30 kg untuk Grade B (total pas 100 kg). Simpan verifikasi grading tersebut."*
* **Kriteria Sukses (*Success Criteria*):** Alokasi grading pas 100 kg, status berubah menjadi terverifikasi (*verified*), dan sistem menghasilkan nomor batch.
* **Batas Waktu Wajar (*Benchmark Time*):** 120 detik.

---

### Skenario Tugas 3 (Task 3): Pengecekan Stok Gudang Berbasis Batch FIFO
* **Diuji oleh:** Responden 3 (Peran: Petugas Gudang)
* **Konteks:** Petugas gudang memastikan stok cabai yang baru di-grading sudah tercatat di inventaris gudang dan siap dialokasikan.
* **Instruksi Pengguna:**
  > *"Silakan login sebagai Petugas Gudang. Buka menu Persediaan/Gudang, lalu periksa apakah stok 'Cabai Rawit Merah Grade A' sebesar 70 kg sudah tercatat dengan nomor batch yang sesuai."*
* **Kriteria Sukses (*Success Criteria*):** Responden berhasil menemukan tabel persediaan batch dan mengidentifikasi stok 70 kg Grade A.
* **Batas Waktu Wajar (*Benchmark Time*):** 60 detik.

---

### Skenario Tugas 4 (Task 4): Pembayaran Nota Timbang Petani di Loket Kasir
* **Diuji oleh:** Responden 4 (Peran: Kasir / Keuangan)
* **Konteks:** Petani Joko Susilo mendatangi kasir untuk mencairkan uang hasil penjualan panennya.
* **Instruksi Pengguna:**
  > *"Silakan login sebagai Kasir/Keuangan. Buka menu Kasir/Pembayaran Panen, temukan nota atas nama 'Joko Susilo', periksa rincian total nominalnya, lalu lakukan proses konfirmasi pelunasan hingga statusnya menjadi LUNAS."*
* **Kriteria Sukses (*Success Criteria*):** Responden berhasil memproses nota pembayaran dan status berubah menjadi Lunas.
* **Batas Waktu Wajar (*Benchmark Time*):** 90 detik.

---

### Skenario Tugas 5 (Task 5): Monitoring Dashboard Eksekutif & Laporan
* **Diuji oleh:** Responden 5 (Peran: Ketua Koperasi)
* **Konteks:** Ketua koperasi ingin melihat ringkasan volume panen dan kondisi arus kas koperasi hari ini.
* **Instruksi Pengguna:**
  > *"Silakan login sebagai Ketua Koperasi. Periksa kartu metrik (KPI cards) di Dashboard Utama (volume panen dan omset), kemudian buka menu Laporan Keuangan untuk memeriksa posisi kas masuk dan kas keluar."*
* **Kriteria Sukses (*Success Criteria*):** Responden dapat menyebutkan angka metrik di dashboard dan berhasil bernavigasi ke halaman laporan keuangan.
* **Batas Waktu Wajar (*Benchmark Time*):** 75 detik.

---

## 5. Instrumen Kuesioner: System Usability Scale (SUS)

Tepat setelah menyelesaikan skenario tugasnya masing-masing, **kelima responden** diberikan kuesioner **SUS**. Responden diminta memberikan penilaian secara mandiri dan jujur tanpa intervensi.

### 5.1 Skala Penilaian (Skala Likert 5 Poin)
| Nilai | Keterangan |
| :---: | :--- |
| **1** | Sangat Tidak Setuju (STS) |
| **2** | Tidak Setuju (TS) |
| **3** | Ragu-ragu / Netral (N) |
| **4** | Setuju (S) |
| **5** | Sangat Setuju (SS) |

### 5.2 Daftar 10 Butir Pertanyaan Standar SUS (Bahasa Indonesia Baku)

> **Catatan Metodologi:** Format ini menggunakan terjemahan standar ilmiah (*Brooke, 1996; Sharfina & Santoso, 2016*). Jangan mengubah urutan pertanyaan karena susunan ganjil-positif dan genap-negatif dirancang untuk mencegah bias jawaban responden.

| No | Pernyataan Kuesioner | Sifat Butir |
| :---: | :--- | :---: |
| **Q1** | Saya merasa bahwa saya akan sering menggunakan sistem ERP ini dalam operasional. | Positif |
| **Q2** | Saya merasa sistem ini terlalu rumit untuk digunakan. | Negatif |
| **Q3** | Saya merasa sistem ini mudah digunakan. | Positif |
| **Q4** | Saya rasa saya memerlukan bantuan dari orang teknis untuk dapat menggunakan sistem ini. | Negatif |
| **Q5** | Saya merasa berbagai fitur dan fungsi dalam sistem ini terintegrasi dengan baik. | Positif |
| **Q6** | Saya merasa ada terlalu banyak hal yang tidak konsisten pada sistem ini. | Negatif |
| **Q7** | Saya yakin kebanyakan orang akan dapat mempelajari sistem ini dengan sangat cepat. | Positif |
| **Q8** | Saya merasa sistem ini sangat membingungkan saat digunakan. | Negatif |
| **Q9** | Saya merasa sangat percaya diri saat menggunakan sistem ini. | Positif |
| **Q10** | Saya perlu belajar banyak hal terlebih dahulu sebelum saya dapat mengoperasikan sistem ini. | Negatif |

---

## 6. Prosedur Pengolahan Data & Formula Perhitungan

### 6.1 Pengolahan Metrik Usability Testing (Objektif)

1. **Task Completion Rate (TCR) / Tingkat Keberhasilan:**
   $$\text{TCR} = \left( \frac{\text{Jumlah Skenario Berhasil Diselesaikan}}{\text{Total Skenario yang Diberikan (5 Task)}} \right) \times 100\%$$
   *Standar Kelulusan:* $\ge 80\%$ (Kategori Baik / Lulus).

2. **Mean Time on Task (Rata-rata Waktu Pengerjaan):**
   $$\overline{T} = \frac{\sum_{i=1}^{5} T_i}{5}$$
   *Tolak Ukur:* Jika rata-rata waktu pengerjaan aktual $\le$ batas waktu wajar (*benchmark time*), antarmuka dinilai efisien.

3. **Error Frequency:**
   Mencatat jumlah kesalahan klik, kebingungan navigasi, atau input gagal per tugas.

---

### 6.2 Pengolahan Skor Kuesioner SUS (Subjektif)

Untuk setiap responden $k$ (dari Responden 1 sampai Responden 5), lakukan kalkulasi sebagai berikut:

1. **Untuk Pertanyaan Bernomor Ganjil (Q1, Q3, Q5, Q7, Q9):**
   $$\text{Skor Poin}_i = \text{Nilai Jawaban} - 1$$
2. **Untuk Pertanyaan Bernomor Genap (Q2, Q4, Q6, Q8, Q10):**
   $$\text{Skor Poin}_i = 5 - \text{Nilai Jawaban}$$
3. **Total Nilai Responden:**
   $$\text{Total Poin} = \sum_{i=1}^{10} \text{Skor Poin}_i$$
4. **Skor Akhir SUS Responden (Skala 0 – 100):**
   $$\text{Skor SUS}_k = \text{Total Poin} \times 2.5$$
5. **Rata-rata Skor SUS Keseluruhan (5 Responden):**
   $$\overline{\text{SUS}} = \frac{\sum_{k=1}^{5} \text{Skor SUS}_k}{5}$$

---

### 6.3 Standar Interpretasi Nilai SUS (Sauro & Lewis, 2012; Bangor et al., 2008)

Cocokkan nilai rata-rata $\overline{\text{SUS}}$ dengan matriks interpretasi internasional berikut:

| Rata-rata Skor SUS | Grade Scale | Adjective Rating | Acceptability Range | Keterangan Evaluasi |
| :---: | :---: | :---: | :---: | :--- |
| **> 80.3** | **Grade A** | **Excellent / Best Imaginable** | **Acceptable** | Sistem luar biasa mudah, antarmuka sangat matang |
| **68.0 – 80.2** | **Grade B** | **Good** | **Acceptable** | Di atas rata-rata industri, sistem siap rilis |
| **68.0 (Benchmark)**| **Grade C** | **OK (Rata-rata Industri)** | **Marginal** | Batas ambang kelayakan standar industri global |
| **51.0 – 67.9** | **Grade D** | **Poor / Fair** | **Marginal** | Ada beberapa kendala navigasi yang perlu dibenahi |
| **< 51.0** | **Grade F** | **Worst Imaginable** | **Not Acceptable** | Sistem sangat membingungkan, butuh revisi total |

> **Target Proyek ERP Kita:** Memperoleh rata-rata skor SUS **$\ge 70.0$ (Grade B - Good / Acceptable)**, yang membuktikan bahwa antarmuka ERP dinilai nyaman dan layak dioperasikan oleh pengguna.

---

## 7. Lembar Observasi Penguji (*Observer Checklist Sheet*)

Gunakan format tabel berikut saat mendampingi sesi pengujian per responden:

**Nama Penguji:** ________________________  
**ID Responden:** R-____ (Peran: ______________________)  
**Tanggal Pengujian:** ____________________  

| Task No. | Nama Skenario Tugas | Target Waktu | Status | Waktu Aktual | Jumlah Error | Catatan Kendala / Komentar Responden |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **Task 1** | Input Penerimaan Panen (Lapangan) | 90 dtk | [ ] Sukses<br>[ ] Gagal | _____ dtk | _____ kali | |
| **Task 2** | Split Lot Grading Kualitas (QC) | 120 dtk | [ ] Sukses<br>[ ] Gagal | _____ dtk | _____ kali | |
| **Task 3** | Cek Stok Batch FIFO (Gudang) | 60 dtk | [ ] Sukses<br>[ ] Gagal | _____ dtk | _____ kali | |
| **Task 4** | Pelunasan Nota di Kasir (Keuangan) | 90 dtk | [ ] Sukses<br>[ ] Gagal | _____ dtk | _____ kali | |
| **Task 5** | Monitoring Dashboard (Ketua) | 75 dtk | [ ] Sukses<br>[ ] Gagal | _____ dtk | _____ kali | |

---

## 8. Langkah-Langkah Eksekusi Lapangan (Total Waktu: ~1 Jam Selesai)

1. **Tahap 1: Pengondisian (3 Menit per Orang)**
   - Sambut responden dengan ramah.
   - Sampaikan pengantar: *"Kami sedang menguji kebergunaan sistem aplikasi ERP Smart Farming. Yang kami uji adalah sistemnya, bukan kecerdasan Anda. Jika Anda mengalami kebingungan, itu adalah masukan berharga bagi perbaikan antarmuka kami."*
2. **Tahap 2: Pelaksanaan Usability Testing (7–10 Menit per Orang)**
   - Berikan lembar tugas peran yang diujikan. Biarkan responden mengoperasikan sistem di laptop.
   - Penguji menyalakan stopwatch dan mencatat waktu pengerjaan serta kesalahan pada Lembar Observasi.
3. **Tahap 3: Pengisian Kuesioner SUS (3 Menit per Orang)**
   - Begitu selesai tugas, buka Google Form kuesioner SUS.
   - Responden mengisi 10 butir pertanyaan secara mandiri.
4. **Tahap 4: Rekapitulasi Data di Spreadsheet (10 Menit)**
   - Masukkan waktu dan skor SUS ke file Excel. Formula otomatis akan langsung menampilkan rata-rata skor akhir SUS dan status kelulusan pengujian.
