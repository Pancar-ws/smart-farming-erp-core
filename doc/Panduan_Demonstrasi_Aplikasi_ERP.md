# PANDUAN STRATEGIS PRESENTASI & DEMO SISTEM ERP SMART FARMING
## Durasi Maksimal: 4–5 Menit | Format Tim: 5 Pembicara (Estafet Rantai Pasok)
**Koperasi Tani Agribisnis Mandiri — Single Source of Truth & Operations Management**

Dokumen ini adalah **naskah skenario (*playbook*) resmi** untuk presentasi 4–5 menit di hadapan Dosen Pengampu (*Ir. Muhammad Ihsan Fawzi, S.Kom., M.Kom.*). Dirancang agar waktu berjalan sangat presisi, setiap anggota memiliki peran krusial, transisi antar-pembicara mulus tanpa jeda canggung (*zero awkward silence*), dan audiens langsung terkesima dengan solusi yang ditawarkan.

---

### ⏱️ STRATEGI WAKTU & MATRIKS PEMBAGIAN PERAN (5 ANGGOTA)

| Waktu | Durasi | Pembicara | Peran dalam Presentasi | Fokus Panggung & Aksi Layar |
| :---: | :---: | :--- | :--- | :--- |
| **00:00 – 00:50** | 50 dtk | **Pembicara 1 (Pancar)** | *Project Lead & Context Setter* | **The Hook:** Masalah nyata koperasi tani & Solusi Smart Farming ERP terintegrasi. |
| **00:50 – 01:40** | 50 dtk | **Pembicara 2 (Amelia)** | *Procurement & Raw Ingestion* | **Hulu:** Penerimaan setoran panen 1.000 kg curah, nomor batch unik, & thermal QR slip. |
| **01:40 – 02:40** | 60 dtk | **Pembicara 3 (Aufa)** | *Manufacturing & Quality Control* | **The Money Shot:** Uji tolak Mass Balance (selisih $\neq 0$ kg) & Aturan Afkir Rp 0. |
| **02:40 – 03:40** | 60 dtk | **Pembicara 4 (Salsabilla)** | *Sales, Tiering & FIFO Allocation* | **Hilir:** Sales Order 3 segmen pasar, alokasi stok tertua FIFO, & Surat Jalan DO. |
| **03:40 – 04:40** | 60 dtk | **Pembicara 5 (Mazsa)** | *Financial Integrity, Trace & ESG* | **Valuasi & Penutup:** Auto-Journal, margin Rp 6,8 Jt, Traceability, ESG, & E2E Test PASS. |

> **💡 TIPS EMAS TEKNIS (PENTING SEBELUM MULAI):**
> 1. Gunakan **1 laptop utama** yang terhubung ke proyektor dengan browser membuka `http://localhost:5173/`.
> 2. Semua pembicara berdiri berjajar rapi. Gunakan tombol **"Pilih Akun Demo Cepat"** di halaman login untuk beralih akun dalam **1 detik** tanpa perlu mengetik username/password.
> 3. Tunjuk salah satu rekan (atau pembicara terkait) untuk mengklik mouse dengan tangkas sesuai naskah.

---

## 🎬 NASKAH LENGKAP DEMO DETIK PER DETIK

---

### BAGIAN 1: THE HOOK & VALUE PROPOSITION (00:00 – 00:50)
* **Pembicara:** **Pancar Wahyu Setiabi (H1D024018)**
* **Tampilan Layar:** Halaman Depan / Login Page (`http://localhost:5173/login`)
* **Gaya Penyampaian:** Percaya diri, energik, artikulatif, langsung menembak masalah nyata.

> **[00:00 - 00:15] Pembukaan & Hook Masalah:**  
> *"Selamat pagi/siang Bapak Dosen dan rekan-rekan sekalian. Selama puluhan tahun, koperasi pertanian di Indonesia menghadapi tiga penyakit kronis: permainan timbangan tengkulak, susut hasil panen liar yang tidak terdeteksi, dan pencatatan keuangan manual yang memicu ketidakpercayaan petani anggota."*

> **[00:15 - 00:35] Solusi yang Ditawarkan:**  
> *"Untuk mengatasi hal tersebut, kami menghadirkan **Smart Farming ERP Core**, platform terintegrasi berbasis **Single Source of Truth** yang menghubungkan seluruh mata rantai agribisnis: mulai dari keanggotaan petani, penimbangan panen, pemilahan mutu, rotasi stok FIFO, hingga akuntansi otomatis dan pelaporan keberlanjutan ESG."*

> **[00:35 - 00:50] Orientasi Sistem & Estafet:**  
> *"Seperti yang terlihat pada layar, sistem membagi wewenang ke dalam 6 peran operasional terstandarisasi URS. Bagaimana alur digital ini dimulai langsung dari lahan petani? Rekan saya **Amelia** akan mendemonstrasikannya pada modul Penerimaan."*  
> *(Aksi Layar: Klik tombol cepat peran **Penerimaan** &rarr; Masuk Dashboard Penerimaan)*

---

### BAGIAN 2: PROCUREMENT & LOT TRACING HULU (00:50 – 01:40)
* **Pembicara:** **Amelia Maharani Andessy (H1D024032)**
* **Tampilan Layar:** Modul Penerimaan Panen (`/procurement/harvest-receipts`)
* **Gaya Penyampaian:** Rapi, lugas, menekankan kepastian data dan keterlacakan.

> **[00:50 - 01:10] Aksi Timbang Panen Curah:**  
> *"Terima kasih Pancar. Pada modul Penerimaan, petani anggota kita—Bapak Budi Santoso—datang menyetorkan panen cabai rawit merah. Petugas cukup memilih nama anggota, meletakkan komoditas di timbangan digital, dan memasukkan data: berat kotor 1.000 kg tanpa potongan tara."*  
> *(Aksi Layar: Isi form setoran cabai 1.000 kg & klik tombol Simpan)*

> **[01:10 - 01:30] Penerbitan Nomor Batch & Struk Thermal QR:**  
> *"Seketika, sistem secara otomatis menerbitkan **Nomor Batch Unik: `BATCH-20261123-001`**. Nomor batch inilah yang menjadi paspor digital komoditas dari hulu ke hilir. Sistem langsung mencetak **Struk Bukti Timbang Thermal 58mm lengkap dengan QR Code**, memberikan bukti fisik transparan yang dipegang oleh petani agar tidak ada kecurigaan manipulasi berat."*  
> *(Aksi Layar: Klik tombol 'Cetak Slip' / perlihatkan pop-up struk QR Code)*

> **[01:30 - 01:40] Estafet ke Manufaktur:**  
> *"Cabai mentah curah telah aman di gudang penerimaan. Selanjutnya, rekan saya **Aufa** akan memperlihatkan bagaimana benteng pertahanan kualitas koperasi ditegakkan di bagian Sortasi."*  
> *(Aksi Layar: Klik 'Keluar' & klik tombol cepat peran **Sortasi & QC**)*

---

### BAGIAN 3: MANUFACTURING & STRICT MASS BALANCE (01:40 – 02:40) ⭐ *THE MONEY SHOT*
* **Pembicara:** **Aufa Salsabila Algifari (H1D024042)**
* **Tampilan Layar:** Modul Sortasi & Grading Mutu (`/manufacturing/sorting`)
* **Gaya Penyampaian:** Tegas, mendemonstrasikan keunggulan kontrol internal (*Wow Factor*).

> **[01:40 - 02:00] Penarikan Batch & Demo Proteksi Sistem (Kasus Negatif):**  
> *"Terima kasih Amelia. Cabai curah 1.000 kg tadi kini masuk ke meja pemilahan mutu. Di sinilah letak keunggulan utama arsitektur kami, yaitu penegakan hukum fisika **Kekekalan Massa (Mass Balance)**.  
> Perhatikan: jika petugas tidak sengaja atau sengaja menginput hasil: Grade A 700 kg, Grade B 200 kg, dan Afkir 90 kg—total hanya 990 kg, ada 10 kg yang hilang..."*  
> *(Aksi Layar: Input 700, 200, 90 &rarr; Tunjukkan banner merah selisih 10 kg dan tombol posting terkunci)*

> **[02:00 - 02:25] Reaksi Sistem & Eksekusi Valid:**  
> *"Sistem secara mutlak **menolak** dan mengunci tombol posting! Terjadi pelanggaran `MASS_BALANCE_VIOLATION`. Tidak boleh ada 1 gram pun susut liar yang tidak dipertanggungjawabkan.  
> Sekarang kita masukkan angka riil: Afkir 100 kg sehingga total tepat 1.000 kg (selisih pas 0 kg). Banner berubah hijau, Quality Check diverifikasi, dan kita klik **Simpan & Kunci Batch FIFO**."*  
> *(Aksi Layar: Ubah afkir ke 100 kg &rarr; Banner hijau 'Mass Balance Sesuai 0 kg' &rarr; Klik Posting)*

> **[02:25 - 02:40] Aturan Finansial Nol Afkir & Estafet:**  
> *"Sesuai aturan bisnis SRS, komoditas afkir/rusak dikunci pada harga **Rp 0** dan dicatat sebagai limbah susut, melindungi kas koperasi dari pembengkakan biaya. Selanjutnya, rekan saya **Salsabilla** akan mendistribusikan produk siap jual ini ke pasar komersial."*  
> *(Aksi Layar: Klik 'Keluar' & klik tombol cepat peran **Penjualan**)*

---

### BAGIAN 4: SALES ORDER, FIFO ROTATION & DELIVERY (02:40 – 03:40)
* **Pembicara:** **Salsabilla Rahma Diena (H1D025101)**
* **Tampilan Layar:** Modul Penjualan (`/sales/orders`)
* **Gaya Penyampaian:** Dinamis, fokus pada strategi bisnis dan otomatisasi logistik.

> **[02:40 - 03:00] Strategi Harga Bertingkat (Tiered Pricing):**  
> *"Terima kasih Aufa. Sekarang barang jadi Grade A dan Grade B telah tersedia di gudang. Di modul Penjualan, sistem kami menerapkan **Customer Tiered Pricing**. Saat kami memilih pelanggan segmen Retail Lokal—Toko Sayur Segar Jaya—sistem otomatis mematok harga Grade A Rp 46.000/kg dan Grade B Rp 36.000/kg."*  
> *(Aksi Layar: Pilih Customer Retail & input order 700 kg Grade A + 200 kg Grade B)*

> **[03:00 - 03:20] Penegakan Alokasi Stok Tertua (FIFO) & Anti Stok Minus:**  
> *"Total pesanan terhitung tepat Rp 39.400.000. Saat pesanan dikonfirmasi, sistem secara cerdas menjalankan aturan **FIFO (First-In, First-Out)**: mengambil stok dari batch yang tanggal panennya paling awal untuk mencegah pembusukan di gudang. Jika ada yang memesan melebihi stok fisik, sistem akan menolak secara mutlak."*  
> *(Aksi Layar: Klik 'Konfirmasi Pesanan' & tunjukkan alokasi batch tertua)*

> **[03:20 - 03:40] Eksekusi Pengiriman & Estafet:**  
> *"Hanya dengan satu klik **Kirim Barang**, sistem memotong saldo kartu stok inventaris, menerbitkan **Surat Jalan resmi**, dan otomatis membentuk **Faktur Penjualan**. Terakhir, bagaimana transaksi ini bermuara pada keuntungan petani dan transparansi koperasi? Rekan saya **Mazsa** akan merangkumnya di modul Keuangan dan ESG."*  
> *(Aksi Layar: Klik 'Kirim & Terbitkan Faktur' &rarr; Klik tombol cepat **Keuangan**)*

---

### BAGIAN 5: FINANCIAL INTEGRITY, TRACEABILITY & CLOSING (03:40 – 04:40)
* **Pembicara:** **Mazsa Amelia Maranatha (H1D025103)**
* **Tampilan Layar:** Modul Akuntansi & Laporan ESG (`/accounting` & `/reports/esg`)
* **Gaya Penyampaian:** Meyakinkan, tajam, menyajikan data angka dan kesimpulan yang kuat.

> **[03:40 - 04:00] Integrasi Jurnal Otomatis & Margin Transparan:**  
> *"Terima kasih Salsabilla. Di modul Akuntansi, tidak ada lagi staf yang menjurnal manual. Dari transaksi tadi, sistem secara otomatis membukukan jurnal berpasangan seimbang: Persediaan pada Hutang Anggota sebesar Rp 32.600.000.  
> Pada Laporan Margin, koperasi secara transparan melihat selisih kotor operasional sebesar **Rp 6.800.000 atau 17,26%**."*  
> *(Aksi Layar: Buka tab Jurnal & Laporan Margin)*

> **[04:00 - 04:20] Ketertelusuran Rantai Pasok (Traceability) & Bukti Uji Otomatis:**  
> *"Kekuatan terbesar sistem ini adalah **End-to-End Traceability**. Hanya dengan memasukkan nomor faktur retail tadi, sistem langsung merender pohon silsilah: dari meja makan konsumen, terlacak ke pabrik sortasi, hingga ke identitas Pak Budi Santoso di lahan kebun asalnya!  
> Seluruh keandalan ini bukan sekadar klaim tampilan. Kami telah memvalidasinya melalui **Automated E2E Testing Suite (16/16 PASS, 100%)** dengan kecepatan rata-rata API 23,8 milidetik."*  
> *(Aksi Layar: Buka halaman Traceability & perlihatkan diagram rantai alur batch)*

> **[04:20 - 04:40] Dampak ESG & Penutup:**  
> *"Dan pada Dashboard ESG, koperasi dapat memantau rasio pupuk ramah lingkungan serta indeks susut pangan untuk mendukung target SDGs.  
> Inilah Smart Farming ERP Core: solusi rantai pasok agribisnis yang adil bagi petani, efisien bagi koperasi, dan berkelanjutan bagi masa depan ketahanan pangan Indonesia. Terima kasih, kami siap untuk sesi diskusi dan tanya jawab."*  
> *(Semua anggota tersenyum, mengangguk sopan ke arah dosen, dan siap menjawab pertanyaan).*

---

### 📋 LEMBAR PERSIAPAN CEPAT (*CHEAT SHEET*) UNTUK SETIAP ANGGOTA

| Anggota | Kalimat Kunci yang Wajib Diucapkan | Kata Kunci Estafet ke Anggota Selanjutnya |
| :--- | :--- | :--- |
| **Pancar** | *"Single Source of Truth, memutus rantai tengkulak, 6 peran operasional terintegrasi."* | *"Rekan saya Amelia akan mendemonstrasikannya pada modul Penerimaan."* |
| **Amelia** | *"Nomor Batch Unik paspor digital, Struk Bukti Timbang Thermal 58mm dengan QR Code."* | *"Rekan saya Aufa akan memperlihatkan benteng pertahanan mutu di bagian Sortasi."* |
| **Aufa** | *"Hukum Mass Balance, deviasi selisih 0 kg, Zero-Value Afkir Rp 0 menolak susut liar."* | *"Rekan saya Salsabilla akan mendistribusikan produk siap jual ini ke pasar komersial."* |
| **Salsabilla** | *"Customer Tiered Pricing 3 segmen, rotasi stok tertua FIFO, Surat Jalan DO otomatis."* | *"Rekan saya Mazsa akan merangkumnya di modul Keuangan dan ESG."* |
| **Mazsa** | *"Auto-journal seimbang, margin Rp 6,8 Jt (17,26%), traceability end-to-end, 16/16 Automated E2E PASS."* | *"Terima kasih, kami siap untuk sesi diskusi dan tanya jawab."* |

---

### ⚠️ TIPS MENGATASI SITUASI DARURAT SAAT PRESENTASI:
1. **Jika Dosen Memotong ("Waktu tinggal 1 menit lagi!"):**
   * Langsung loncat ke bagian **Aufa (Mass Balance error 0 kg)** dan **Mazsa (Traceability diagram)**. Dua fitur ini adalah bukti paling konkret bahwa ERP Anda berfungsi nyata.
2. **Jika Koneksi / Layar Sempat Lag:**
   * Pembicara jangan berhenti bicara. Lanjutkan narasi teori dan masalah bisnis yang diselesaikan sambil menunggu layar berpindah.
3. **Jika Dosen Menanyakan Soal Pengujian:**
   * Tunjukkan file Excel [Laporan_Automated_E2E_Testing_ERP_Smart_Farming.xlsx](file:///d:/Organize/Projects/smart-farming-erp-core/doc/Laporan_Automated_E2E_Testing_ERP_Smart_Farming.xlsx) dan jelaskan bahwa sistem telah lulus 16 skenario integrasi E2E secara otomatis dalam 0,38 detik.
