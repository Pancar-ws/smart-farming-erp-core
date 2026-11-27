import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_border(cell, **kwargs):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = tcPr.first_child_found_in("w:tcBorders")
    if tcBorders is None:
        tcBorders = OxmlElement('w:tcBorders')
        tcPr.append(tcBorders)
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        edge_data = kwargs.get(edge)
        if edge_data:
            tag = 'w:{}'.format(edge)
            element = tcBorders.find(qn(tag))
            if element is None:
                element = OxmlElement(tag)
                tcBorders.append(element)
            for key, val in edge_data.items():
                element.set(qn('w:{}'.format(key)), str(val))

def set_cell_shading(cell, color_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), color_hex)
    tcPr.append(shd)

def style_table(table, col_widths=None, header_bg="1E3A8A"):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, row in enumerate(table.rows):
        is_header = (i == 0)
        trPr = row._tr.get_or_add_trPr()
        trPr.append(OxmlElement('w:cantSplit'))
        if is_header:
            trPr.append(OxmlElement('w:tblHeader'))
        for j, cell in enumerate(row.cells):
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            if col_widths and j < len(col_widths):
                cell.width = Inches(col_widths[j])
            set_cell_border(cell,
                top={'val': 'single', 'sz': '4', 'space': '0', 'color': 'D1D5DB'},
                bottom={'val': 'single', 'sz': '6', 'space': '0', 'color': '1E3A8A' if is_header else 'D1D5DB'},
                left={'val': 'single', 'sz': '4', 'space': '0', 'color': 'E5E7EB'},
                right={'val': 'single', 'sz': '4', 'space': '0', 'color': 'E5E7EB'}
            )
            if is_header:
                set_cell_shading(cell, header_bg)
                for p in cell.paragraphs:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    for r in p.runs:
                        r.font.bold = True
                        r.font.color.rgb = RGBColor(255, 255, 255)
                        r.font.name = "Times New Roman"
                        r.font.size = Pt(9.5)
            else:
                if i % 2 == 1:
                    set_cell_shading(cell, "F8FAFC")
                for p in cell.paragraphs:
                    for r in p.runs:
                        r.font.name = "Times New Roman"
                        r.font.size = Pt(9.5)

def build_urs_docx():
    doc = docx.Document()
    sec = doc.sections[0]
    sec.page_width = Inches(8.5)
    sec.page_height = Inches(11.0)
    sec.top_margin = Inches(1.0)
    sec.bottom_margin = Inches(1.0)
    sec.left_margin = Inches(1.25)
    sec.right_margin = Inches(1.25)

    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(30, 41, 59)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(4)

    # ================= COVER PAGE =================
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(10)
    p_title.paragraph_format.space_after = Pt(12)
    r = p_title.add_run("DOKUMEN KEBUTUHAN PENGGUNA\n(USER REQUIREMENTS SPECIFICATION / URS)\nSISTEM ERP SMART FARMING UNTUK MANAJEMEN RANTAI PASOK PERTANIAN BERKELANJUTAN PADA KOPERASI TANI AGRIBISNIS DAN KETAHANAN PANGAN")
    r.font.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(30, 58, 138)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(16)
    r = p_sub.add_run("Disusun dan diajukan untuk memenuhi tugas kelompok mata kuliah Enterprise Resource Planning")
    r.font.italic = True
    r.font.size = Pt(10.5)

    logo_path = "doc/logo/unsoed_logo.png"
    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_after = Pt(16)
        p_logo.add_run().add_picture(logo_path, width=Inches(1.8))

    p_dos = doc.add_paragraph()
    p_dos.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_dos.paragraph_format.space_after = Pt(14)
    r = p_dos.add_run("Dosen Pengampu:\n")
    r.font.size = Pt(10.5)
    r = p_dos.add_run("Ir. Muhammad Ihsan Fawzi, S.Kom., M.Kom.")
    r.font.bold = True
    r.font.size = Pt(11)

    p_team = doc.add_paragraph()
    p_team.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_team.paragraph_format.space_after = Pt(20)
    r = p_team.add_run("Disusun oleh (Kelompok 3):\n")
    r.font.bold = True
    r.font.size = Pt(10.5)
    members_data = [
        ("Pancar Wahyu Setiabi", "H1D024018"),
        ("Amalia Maharani Andessy", "H1D024032"),
        ("Aufa Salsabila Algifari", "H1D024042"),
        ("Salsabilla Rahma Diena", "H1D025101"),
        ("Mazsa Amelia Maranatha", "H1D025103")
    ]
    for name, nim in members_data:
        r = p_team.add_run(f"{name} \t\t{nim}\n")
        r.font.size = Pt(10)

    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_after = Pt(0)
    r = p_inst.add_run("JURUSAN INFORMATIKA\nFAKULTAS TEKNIK\nUNIVERSITAS JENDERAL SOEDIRMAN\nPURBALINGGA\n2026")
    r.font.bold = True
    r.font.size = Pt(11)

    doc.add_page_break()

    # ================= KATA PENGANTAR / RINGKASAN =================
    h = doc.add_paragraph()
    r = h.add_run("RINGKASAN EKSEKUTIF")
    r.font.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "Dokumen User Requirements Specification (URS) ini mendefinisikan seluruh kebutuhan bisnis, "
        "kebutuhan operasional pengguna, aturan integritas data, dan indikator keberlanjutan untuk pengembangan "
        "Sistem Enterprise Resource Planning (ERP) Smart Farming pada Koperasi Tani Agribisnis dan Ketahanan Pangan (Koperasi Tani Mandiri). "
        "Dokumen ini dirancang sebagai landasan acuan formal yang menginduki dokumen Software Requirements Specification (SRS) "
        "dan Software Design Description (SDD) Kelompok 3."
    )
    doc.add_paragraph(
        "Sistem ERP Smart Farming mengintegrasikan 7 modul inti rantai pasok agribisnis: Data Master Keanggotaan, "
        "Pengadaan Saprotan & Penerimaan Panen Curah, Manajemen Multi-Gudang FIFO, Manufaktur Sortasi & Quality Control (QC), "
        "Penjualan & Distribusi 3 Segmen, Akuntansi & Keuangan Koperasi, serta Pelaporan Keberlanjutan (ESG & SDGs). "
        "Dengan arsitektur terpusat ini, koperasi mampu menjamin transparansi perhitungan bagi hasil panen petani, "
        "mencegah susut (food loss), serta menyediakan ketertelusuran produk dari lahan hingga konsumen akhir (end-to-end traceability)."
    )

    # ================= BAB I =================
    doc.add_paragraph()
    h = doc.add_paragraph()
    r = h.add_run("1. PENDAHULUAN")
    r.font.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "1.1 Tujuan Dokumen\n"
        "Dokumen URS ini bertujuan untuk menguraikan secara komprehensif apa yang dibutuhkan oleh pengguna dan pengurus koperasi "
        "terhadap sistem ERP. Dokumen ini menjadi kontrak fungsional antara pemangku kepentingan (stakeholders) koperasi dan tim "
        "pengembang perangkat lunak, serta menjadi tolok ukur utama dalam verifikasi dan pengujian penerimaan sistem."
    )

    doc.add_paragraph(
        "1.2 Ruang Lingkup Sistem\n"
        "Ruang lingkup sistem ERP mencakup digitalisasi end-to-end alur rantai pasok komoditas hortikultura dan pangan: "
        "(a) Pendaftaran master data anggota petani dan poligon lahan; "
        "(b) Pengadaan dan penyaluran saprotan (benih, pupuk, pestisida) dengan batas stok minimum (ROP); "
        "(c) Penerimaan setoran panen curah dengan penimbangan digital dan penomoran batch unik; "
        "(d) Transformasi mutu melalui sortasi dan pemisahan kualitas (split lot grade A, B, afkir) dengan validasi Mass Balance 0 kg; "
        "(e) Pemenuhan pesanan penjualan (Sales Order) multi-segmen dengan reservasi batch FIFO; "
        "(f) Otomatisasi pembukuan akuntansi debit-kredit, pelunasan hutang panen potong piutang saprotan, serta kalkulasi SHU; dan "
        "(g) Pelaporan terpadu indikator keberlanjutan ESG (Environmental, Social, Governance) dan SDGs Pertanian."
    )

    doc.add_paragraph(
        "1.3 Definisi dan Singkatan\n"
        "Tabel 1 menyajikan istilah teknis dan singkatan yang digunakan dalam dokumen ini:"
    )

    # Table 1: Glossary
    t1 = doc.add_table(rows=1, cols=2)
    t1.rows[0].cells[0].paragraphs[0].add_run("Istilah / Singkatan")
    t1.rows[0].cells[1].paragraphs[0].add_run("Definisi dan Penjelasan")
    terms = [
        ("URS", "User Requirements Specification; dokumen spesifikasi kebutuhan pengguna bisnis."),
        ("SRS", "Software Requirements Specification; dokumen spesifikasi teknis perangkat lunak."),
        ("SDD", "Software Design Description; dokumen perancangan arsitektur dan model data."),
        ("ERP", "Enterprise Resource Planning; sistem informasi terpadu pengelola seluruh proses bisnis."),
        ("Saprotan", "Sarana Produksi Pertanian (benih, pupuk kimia/organik, obat/pestisida, mulsa, kemasan)."),
        ("ROP", "Reorder Point; batas ambang kuantitas stok minimum yang memicu peringatan pengadaan ulang."),
        ("Batch / Lot", "Kumpulan komoditas hasil panen yang diproses bersama dan memiliki identitas nomor unik untuk ketertelusuran."),
        ("Split Lot", "Pemisahan satu setoran panen curah menjadi beberapa lot produk jadi berdasarkan grade mutu hasil sortasi."),
        ("Mass Balance", "Hukum kekekalan massa dalam sortasi: Total Berat Input = Total Berat Output (Grade A + B) + Susut/Afkir."),
        ("FIFO", "First In, First Out; metode pengeluaran stok di mana batch yang masuk terlebih dahulu harus dijual lebih awal."),
        ("RBAC", "Role-Based Access Control; mekanisme pembatasan hak akses sistem berdasarkan peran pengguna."),
        ("SHU", "Sisa Hasil Usaha; laba bersih koperasi yang dibagikan secara adil kepada anggota pada akhir periode."),
        ("ESG", "Environmental, Social, and Governance; metrik tata kelola keberlanjutan dan kelestarian lingkungan."),
        ("Traceability Key", "Kunci identifikasi relasional (nomor batch) untuk melacak asal usul produk dari meja makan kembali ke petani.")
    ]
    for term, desc in terms:
        row = t1.add_row()
        row.cells[0].paragraphs[0].add_run(term)
        row.cells[1].paragraphs[0].add_run(desc)
    style_table(t1, [2.0, 4.0])

    # ================= BAB II =================
    doc.add_paragraph()
    h = doc.add_paragraph()
    r = h.add_run("2. GAMBARAN UMUM BISNIS & PENGGUNA SISTEM")
    r.font.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "2.1 Profil Bisnis Koperasi Tani Mandiri\n"
        "Koperasi Tani Mandiri merupakan koperasi produsen agribisnis yang menaungi 100 petani anggota dengan total kelolaan "
        "lahan seluas 150 hektar. Komoditas unggulan utama mencakup hortikultura (Cabai Rawit Merah, Cabai Merah Keriting, Bawang Merah, Tomat) "
        "serta tanaman pangan (Beras Organik). Koperasi berperan ganda: sebagai penyedia saprotan berkualitas dan sebagai aggregator pasar "
        "yang menyerap hasil panen petani dengan harga adil, menyortirnya sesuai standar mutu industri, dan mendistribusikannya ke 3 segmen pembeli."
    )

    doc.add_paragraph(
        "2.2 Permasalahan pada Kondisi Saat Ini (Pain Points)\n"
        "Sebelum implementasi ERP, koperasi menghadapi berbagai kendala operasional yang dirangkum pada Tabel 2:"
    )

    # Table 2: Problems
    t2 = doc.add_table(rows=1, cols=2)
    t2.rows[0].cells[0].paragraphs[0].add_run("Kode")
    t2.rows[0].cells[1].paragraphs[0].add_run("Deskripsi Permasalahan Operasional")
    problems = [
        ("P-01", "Pencatatan setoran panen dan keanggotaan dilakukan manual di buku kertas, rawan salah timbang, dan lambat diverifikasi."),
        ("P-02", "Stok saprotan sering kehabisan (stockout) di musim tanam karena tidak adanya peringatan batas minimum (ROP)."),
        ("P-03", "Proses sortasi dan grading tidak terstandarisasi, susut panen (food loss) tinggi dan tidak terlacak penyebabnya."),
        ("P-04", "Gudang tidak menerapkan rotasi FIFO teratur sehingga hasil panen mudah membusuk sebelum terkirim ke pelanggan."),
        ("P-05", "Tidak ada ketertelusuran produk (zero traceability), klaim retur dari pasar modern sulit diinvestigasi batch asalnya."),
        ("P-06", "Pembayaran hasil panen lambat dan rawan sengketa pemotongan piutang saprotan anggota karena data keuangan terpisah.")
    ]
    for code, desc in problems:
        row = t2.add_row()
        row.cells[0].paragraphs[0].add_run(code)
        row.cells[1].paragraphs[0].add_run(desc)
    style_table(t2, [1.0, 5.0])

    doc.add_paragraph(
        "\n2.3 Matriks Pengguna Sistem (10 Kelas Pengguna Sesuai SRS & SDD Kelompok 3)\n"
        "Hak akses pengguna sistem dikelompokkan ke dalam 10 peran pengguna berbasis RBAC sebagaimana dirinci pada Tabel 3:"
    )

    # Table 3: Roles
    t3 = doc.add_table(rows=1, cols=3)
    t3.rows[0].cells[0].paragraphs[0].add_run("Peran Pengguna (Kode RBAC)")
    t3.rows[0].cells[1].paragraphs[0].add_run("Tanggung Jawab Utama di Koperasi")
    t3.rows[0].cells[2].paragraphs[0].add_run("Modul Utama Terkait")
    roles = [
        ("Admin Keanggotaan (ADMIN_KEANGGOTAAN)", "Registrasi master petani, pemetaan lahan/musim tanam, dan validasi data profil anggota.", "Master Data & Keanggotaan"),
        ("Petugas Penerimaan (PETUGAS_PENERIMAAN)", "Menimbang setoran panen curah anggota, input berat kotor/tara, dan menerbitkan Bukti Timbang QR.", "Procurement (Penerimaan Panen)"),
        ("Petugas Sortasi & QC (PETUGAS_SORTASI_QC)", "Melakukan grading mutu (A, B, Afkir), validasi Mass Balance 0 kg, dan input hasil sortasi batch.", "Manufacturing (Sortasi & QC)"),
        ("Admin Gudang (ADMIN_GUDANG)", "Mengelola multi-gudang, penerimaan PO saprotan, penyaluran benih/pupuk, mutasi stok, dan monitor FIFO.", "Inventory & Procurement"),
        ("Bagian Penjualan (BAGIAN_PENJUALAN)", "Memproses Sales Order 3 segmen, alokasi batch FIFO, penerbitan Surat Jalan (DO), dan Faktur Penjualan.", "Sales & Distribusi"),
        ("Bagian Keuangan (BAGIAN_KEUANGAN)", "Kasir pembayaran nota panen (potong piutang saprotan), penagihan piutang SO, buku kas, Laba Rugi, dan SHU.", "Accounting & Kasir Keuangan"),
        ("Pengurus Koperasi (PENGURUS)", "Memantau dashboard eksekutif, margin komoditas, approval transaksi besar, dan pelaporan strategis.", "Dashboard Eksekutif & Laporan"),
        ("Anggota Koperasi (ANGGOTA_READONLY)", "Mengakses transparansi riwayat setoran, saldo piutang/simpanan, dan alokasi SHU dalam mode baca.", "Portal Transparansi Anggota"),
        ("Auditor Keberlanjutan (AUDITOR_ESG)", "Memeriksa kepatuhan audit trail transaksi, sertifikasi mutu, rasio pupuk organik, dan indikator ESG.", "Reporting & Audit Trail"),
        ("Administrator Sistem (SUPERADMIN)", "Manajemen akun pengguna, konfigurasi parameter sistem (system_settings), hak akses, dan backup basis data.", "Seluruh Modul & Konfigurasi")
    ]
    for r_code, r_resp, r_mod in roles:
        row = t3.add_row()
        row.cells[0].paragraphs[0].add_run(r_code)
        row.cells[1].paragraphs[0].add_run(r_resp)
        row.cells[2].paragraphs[0].add_run(r_mod)
    style_table(t3, [2.0, 2.8, 1.2])

    # ================= BAB III =================
    doc.add_paragraph()
    h = doc.add_paragraph()
    r = h.add_run("3. TUJUAN SISTEM (SYSTEM OBJECTIVES)")
    r.font.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph("Tujuan pengembangan Sistem ERP Smart Farming dirumuskan pada Tabel 4:")
    t4 = doc.add_table(rows=1, cols=3)
    t4.rows[0].cells[0].paragraphs[0].add_run("Kode")
    t4.rows[0].cells[1].paragraphs[0].add_run("Tujuan Strategis Sistem")
    t4.rows[0].cells[2].paragraphs[0].add_run("Target Kuantitatif / Indikator Capaian")
    goals = [
        ("T-01", "Digitalisasi Master Petani & Lahan", "100% petani terdata digital beserta NIK, kontak, luas lahan, dan komoditas."),
        ("T-02", "Pencegahan Stockout Saprotan", "Zero stockout benih & pupuk utama saat musim tanam berkat peringatan ROP."),
        ("T-03", "Standarisasi Grading Mutu & Reduksi Susut", "Penerapan quality gate terstandar, susut panen terpantau dan ditekan < 10%."),
        ("T-04", "Optimasi Pergudangan & Penjualan FIFO", "Rotasi stok barang jadi tertib FIFO, memperpanjang kesegaran produk komersial."),
        ("T-05", "Ketertelusuran Penuh Rantai Pasok (Traceability)", "100% batch produk dapat dilacak mundur dari faktur penjualan hingga ke petani asal."),
        ("T-06", "Transparansi Finansial & Akuntabilitas ESG", "Penyelesaian pembayaran petani < 24 jam dan pelaporan metrik ESG/SDGs otomatis.")
    ]
    for g_code, g_desc, g_target in goals:
        row = t4.add_row()
        row.cells[0].paragraphs[0].add_run(g_code)
        row.cells[1].paragraphs[0].add_run(g_desc)
        row.cells[2].paragraphs[0].add_run(g_target)
    style_table(t4, [0.8, 2.7, 2.5])

    # ================= BAB IV =================
    doc.add_paragraph()
    h = doc.add_paragraph()
    r = h.add_run("4. KEBUTUHAN FUNGSIONAL PENGGUNA (USER FUNCTIONAL REQUIREMENTS)")
    r.font.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "Kebutuhan fungsional dijabarkan berdasarkan 7 kelompok modul operasional. Seluruh ID URS dipetakan "
        "secara 1:1 ke spesifikasi teknis pada dokumen SRS Kelompok 3."
    )

    # 4.1 Master Data
    doc.add_paragraph("4.1 Modul Data Master & Keanggotaan (URS-MBR)")
    t_mbr = doc.add_table(rows=1, cols=4)
    t_mbr.rows[0].cells[0].paragraphs[0].add_run("ID URS")
    t_mbr.rows[0].cells[1].paragraphs[0].add_run("Deskripsi Kebutuhan Pengguna")
    t_mbr.rows[0].cells[2].paragraphs[0].add_run("Prioritas")
    t_mbr.rows[0].cells[3].paragraphs[0].add_run("Pengguna")
    mbr_data = [
        ("URS-MBR-001", "Sistem harus dapat menyimpan data profil anggota: ID anggota, NIK, nama, alamat, kontak, luas lahan (ha), komoditas utama, dan status keanggotaan aktif/nonaktif.", "Must", "Admin Keanggotaan"),
        ("URS-MBR-002", "Sistem harus memvalidasi keunikan nomor anggota dan NIK guna mencegah pendaftaran data ganda.", "Must", "Admin Keanggotaan"),
        ("URS-MBR-003", "Sistem harus menyediakan pencarian dan filter data anggota berdasarkan desa, komoditas tanam, luas lahan, dan status.", "Should", "Admin Keanggotaan"),
        ("URS-MBR-004", "Sistem harus mencatat dan menampilkan riwayat transaksi setoran panen dan pengambilan saprotan pada profil anggota.", "Must", "Admin Keanggotaan")
    ]
    for i, d, p, u in mbr_data:
        row = t_mbr.add_row()
        row.cells[0].paragraphs[0].add_run(i)
        row.cells[1].paragraphs[0].add_run(d)
        row.cells[2].paragraphs[0].add_run(p)
        row.cells[3].paragraphs[0].add_run(u)
    style_table(t_mbr, [1.1, 3.4, 0.7, 0.8])

    # 4.2 Procurement
    doc.add_paragraph("\n4.2 Modul Pengadaan Saprotan & Penerimaan Panen (URS-PRC)")
    t_prc = doc.add_table(rows=1, cols=4)
    t_prc.rows[0].cells[0].paragraphs[0].add_run("ID URS")
    t_prc.rows[0].cells[1].paragraphs[0].add_run("Deskripsi Kebutuhan Pengguna")
    t_prc.rows[0].cells[2].paragraphs[0].add_run("Prioritas")
    t_prc.rows[0].cells[3].paragraphs[0].add_run("Pengguna")
    prc_data = [
        ("URS-PRC-001", "Sistem harus dapat membuat pesanan pembelian (PO) saprotan ke supplier mencakup item, jumlah, harga, dan tanggal estimasi.", "Must", "Admin Gudang"),
        ("URS-PRC-002", "Sistem harus mencatat penerimaan barang (Goods Receipt) terhadap PO supplier dan mengkalkulasi selisih kirim.", "Must", "Admin Gudang"),
        ("URS-PRC-003", "Sistem harus mengelola direktori supplier saprotan beserta riwayat pasokan dan status aktif.", "Should", "Admin Gudang"),
        ("URS-PRC-004", "Sistem harus mencatat penerimaan setoran panen curah dari anggota: nomor anggota, komoditas, berat kotor, tara wadah, dan berat bersih.", "Must", "Petugas Penerimaan"),
        ("URS-PRC-005", "Sistem harus menerbitkan nomor batch unik secara otomatis untuk setiap setoran panen anggota (format: BATCH-YYYYMMDD-XXX).", "Must", "Petugas Penerimaan"),
        ("URS-PRC-006", "Sistem harus mencetak dan menampilkan Bukti Timbang Digital beserta kode QR yang merangkum data setoran panen.", "Must", "Petugas Penerimaan"),
        ("URS-PRC-007", "Sistem harus mendukung integrasi pembacaan data berat dari indikator timbangan digital eksternal via serial/USB.", "Could", "Petugas Penerimaan"),
        ("URS-PRC-008", "Sistem harus memvalidasi bahwa anggota yang menyetor berstatus aktif pada basis data koperasi.", "Must", "Petugas Penerimaan")
    ]
    for i, d, p, u in prc_data:
        row = t_prc.add_row()
        row.cells[0].paragraphs[0].add_run(i)
        row.cells[1].paragraphs[0].add_run(d)
        row.cells[2].paragraphs[0].add_run(p)
        row.cells[3].paragraphs[0].add_run(u)
    style_table(t_prc, [1.1, 3.4, 0.7, 0.8])

    # 4.3 Inventory
    doc.add_paragraph("\n4.3 Modul Inventaris & Multi-Gudang (URS-INV)")
    t_inv = doc.add_table(rows=1, cols=4)
    t_inv.rows[0].cells[0].paragraphs[0].add_run("ID URS")
    t_inv.rows[0].cells[1].paragraphs[0].add_run("Deskripsi Kebutuhan Pengguna")
    t_inv.rows[0].cells[2].paragraphs[0].add_run("Prioritas")
    t_inv.rows[0].cells[3].paragraphs[0].add_run("Pengguna")
    inv_data = [
        ("URS-INV-001", "Sistem harus menampilkan posisi stok saprotan per item dan per gudang secara real-time.", "Must", "Admin Gudang"),
        ("URS-INV-002", "Sistem harus menyimpan parameter stok minimum (ROP) dan memicu notifikasi peringatan visual saat stok menipis.", "Must", "Admin Gudang"),
        ("URS-INV-003", "Sistem harus mencatat transaksi penyaluran saprotan ke anggota (secara tunai maupun kredit/piutang saprotan).", "Must", "Admin Gudang"),
        ("URS-INV-004", "Sistem harus mencatat pemakaian saprotan per hektar lahan petani untuk audit efisiensi pertanian.", "Should", "Admin Gudang"),
        ("URS-INV-005", "Sistem harus mengelola stok hasil panen mentah per komoditas, lokasi gudang, dan nomor batch.", "Must", "Admin Gudang"),
        ("URS-INV-006", "Sistem harus mengelola stok produk jadi hasil sortasi per grade (A, B, Kemasan) dan masa kedaluwarsa.", "Must", "Admin Gudang"),
        ("URS-INV-007", "Sistem harus mencatat mutasi pemindahan barang antar-gudang (gudang pusat, transit, gudang cabang).", "Must", "Admin Gudang"),
        ("URS-INV-008", "Sistem harus memfasilitasi penyesuaian stok (stock opname) periodik dan mencatat selisih fisik vs sistem.", "Must", "Admin Gudang"),
        ("URS-INV-009", "Sistem harus menerapkan prinsip First In, First Out (FIFO) pada rekomendasi alokasi pengeluaran batch produk.", "Must", "Admin Gudang"),
        ("URS-INV-010", "Sistem harus mencatat persediaan limbah dan produk afkir untuk daur ulang menjadi pupuk organik.", "Should", "Admin Gudang")
    ]
    for i, d, p, u in inv_data:
        row = t_inv.add_row()
        row.cells[0].paragraphs[0].add_run(i)
        row.cells[1].paragraphs[0].add_run(d)
        row.cells[2].paragraphs[0].add_run(p)
        row.cells[3].paragraphs[0].add_run(u)
    style_table(t_inv, [1.1, 3.4, 0.7, 0.8])

    # 4.4 Manufacturing
    doc.add_paragraph("\n4.4 Modul Manufaktur & Sortasi Mutu (URS-MFG)")
    t_mfg = doc.add_table(rows=1, cols=4)
    t_mfg.rows[0].cells[0].paragraphs[0].add_run("ID URS")
    t_mfg.rows[0].cells[1].paragraphs[0].add_run("Deskripsi Kebutuhan Pengguna")
    t_mfg.rows[0].cells[2].paragraphs[0].add_run("Prioritas")
    t_mfg.rows[0].cells[3].paragraphs[0].add_run("Pengguna")
    mfg_data = [
        ("URS-MFG-001", "Sistem harus menyediakan konfigurasi kriteria grade per komoditas (ukuran, kesegaran, kadar air, bebas cacat).", "Must", "Petugas Sortasi & QC"),
        ("URS-MFG-002", "Sistem harus memungkinkan penambahan/pengubahan skema grade (Grade A, B, Afkir) melalui konfigurasi tanpa ubah kode.", "Must", "Petugas Sortasi & QC"),
        ("URS-MFG-003", "Sistem harus mencatat perintah sortasi (Sorting Order) yang menarik batch panen mentah sebagai bahan baku input.", "Must", "Petugas Sortasi & QC"),
        ("URS-MFG-004", "Sistem harus memvalidasi Mass Balance 0 kg (Total Berat Input = Berat Grade A + B + Afkir + Susut).", "Must", "Petugas Sortasi & QC"),
        ("URS-MFG-005", "Sistem harus mencatat hasil pemeriksaan kendali mutu (QC Check) dengan status LULUS atau TOLAK sebelum masuk gudang jadi.", "Must", "Petugas Sortasi & QC"),
        ("URS-MFG-006", "Sistem harus mencatat proses pengemasan produk jadi per ukuran berat (kemasan 500g, 1kg, karung 25kg) dan bahan kemasan.", "Should", "Petugas Sortasi & QC"),
        ("URS-MFG-007", "Sistem harus mencetak label stiker barcode/QR batch pada setiap kemasan produk jadi yang lulus QC.", "Must", "Petugas Sortasi & QC"),
        ("URS-MFG-008", "Sistem harus menghitung persentase susut dan efisiensi konversi hasil sortasi per batch secara otomatis.", "Must", "Petugas Sortasi & QC")
    ]
    for i, d, p, u in mfg_data:
        row = t_mfg.add_row()
        row.cells[0].paragraphs[0].add_run(i)
        row.cells[1].paragraphs[0].add_run(d)
        row.cells[2].paragraphs[0].add_run(p)
        row.cells[3].paragraphs[0].add_run(u)
    style_table(t_mfg, [1.1, 3.4, 0.7, 0.8])

    # 4.5 Sales
    doc.add_paragraph("\n4.5 Modul Penjualan & Distribusi Pasar (URS-SLS)")
    t_sls = doc.add_table(rows=1, cols=4)
    t_sls.rows[0].cells[0].paragraphs[0].add_run("ID URS")
    t_sls.rows[0].cells[1].paragraphs[0].add_run("Deskripsi Kebutuhan Pengguna")
    t_sls.rows[0].cells[2].paragraphs[0].add_run("Prioritas")
    t_sls.rows[0].cells[3].paragraphs[0].add_run("Pengguna")
    sls_data = [
        ("URS-SLS-001", "Sistem harus menyediakan formulir Sales Order untuk 3 segmen pembeli: Konsumen Langsung, Retail, dan Pasar Modern.", "Must", "Bagian Penjualan"),
        ("URS-SLS-002", "Sistem harus mengelola master data pelanggan beserta segmen bisnis, kontak, alamat kirim, dan termin bayar.", "Must", "Bagian Penjualan"),
        ("URS-SLS-003", "Sistem harus mengelola katalog harga jual dinamis bertingkat per komoditas, grade mutu, dan segmen pembeli.", "Must", "Bagian Penjualan"),
        ("URS-SLS-004", "Sistem harus mengalokasikan batch produk jadi secara otomatis berdasarkan urutan umur panen terlama (FIFO).", "Must", "Bagian Penjualan"),
        ("URS-SLS-005", "Sistem harus memvalidasi kecukupan stok fisik gudang sebelum Sales Order dapat disetujui (dilarang overselling).", "Must", "Bagian Penjualan"),
        ("URS-SLS-006", "Sistem harus menerbitkan dokumen Surat Jalan / Delivery Order (DO) resmi yang memuat rincian nomor batch yang dikirim.", "Must", "Bagian Penjualan"),
        ("URS-SLS-007", "Sistem harus menerbitkan Faktur Penjualan (Sales Invoice) saat barang selesai dikirim atau diterima pelanggan.", "Must", "Bagian Penjualan"),
        ("URS-SLS-008", "Sistem harus mencatat retur penjualan pelanggan beserta alasan retur dan bukti investigasi batch.", "Should", "Bagian Penjualan"),
        ("URS-SLS-009", "Sistem harus mendukung pemesanan berulang (kontrak pasokan rutin) dengan jadwal pengiriman berkala bagi pasar modern.", "Could", "Bagian Penjualan")
    ]
    for i, d, p, u in sls_data:
        row = t_sls.add_row()
        row.cells[0].paragraphs[0].add_run(i)
        row.cells[1].paragraphs[0].add_run(d)
        row.cells[2].paragraphs[0].add_run(p)
        row.cells[3].paragraphs[0].add_run(u)
    style_table(t_sls, [1.1, 3.4, 0.7, 0.8])

    # 4.6 Accounting
    doc.add_paragraph("\n4.6 Modul Akuntansi & Keuangan Koperasi (URS-ACC)")
    t_acc = doc.add_table(rows=1, cols=4)
    t_acc.rows[0].cells[0].paragraphs[0].add_run("ID URS")
    t_acc.rows[0].cells[1].paragraphs[0].add_run("Deskripsi Kebutuhan Pengguna")
    t_acc.rows[0].cells[2].paragraphs[0].add_run("Prioritas")
    t_acc.rows[0].cells[3].paragraphs[0].add_run("Pengguna")
    acc_data = [
        ("URS-ACC-001", "Sistem harus mencatat Hutang Anggota secara otomatis saat transaksi pembelian panen disetujui.", "Must", "Bagian Keuangan"),
        ("URS-ACC-002", "Sistem harus memproses pembayaran ke anggota, mencatat tanggal bayar, dan membandingkan dengan jatuh tempo.", "Must", "Bagian Keuangan"),
        ("URS-ACC-003", "Sistem harus menyediakan fitur potong piutang saprotan otomatis saat pencairan nota setoran panen anggota.", "Must", "Bagian Keuangan"),
        ("URS-ACC-004", "Sistem harus mencatat Piutang Pelanggan dan memantau status jatuh tempo pembayaran kredit.", "Must", "Bagian Keuangan"),
        ("URS-ACC-005", "Sistem harus mencatat penerimaan pelunasan pembayaran pelanggan (tunai / transfer bank).", "Must", "Bagian Keuangan"),
        ("URS-ACC-006", "Sistem harus mencatat beban operasional koperasi (listrik, BBM, gaji harian sortasi, perawatan gudang).", "Must", "Bagian Keuangan"),
        ("URS-ACC-007", "Sistem harus membuat jurnal umum akuntansi otomatis (double-entry) untuk setiap transaksi operasional.", "Must", "Bagian Keuangan"),
        ("URS-ACC-008", "Sistem harus menyajikan Laporan Laba Rugi komprehensif dan Neraca Keuangan per periode transaksi.", "Must", "Bagian Keuangan"),
        ("URS-ACC-009", "Sistem harus mengkalkulasi alokasi pembagian SHU anggota berdasarkan volume partisipasi modal dan transaksi.", "Must", "Bagian Keuangan"),
        ("URS-ACC-010", "Sistem harus menyajikan ringkasan keuangan transparan yang dapat diakses oleh anggota koperasi dalam mode baca.", "Must", "Bagian Keuangan")
    ]
    for i, d, p, u in acc_data:
        row = t_acc.add_row()
        row.cells[0].paragraphs[0].add_run(i)
        row.cells[1].paragraphs[0].add_run(d)
        row.cells[2].paragraphs[0].add_run(p)
        row.cells[3].paragraphs[0].add_run(u)
    style_table(t_acc, [1.1, 3.4, 0.7, 0.8])

    # 4.7 Cross Module & Reporting
    doc.add_paragraph("\n4.7 Kebutuhan Lintas Modul & Pelaporan ESG (URS-LNT & URS-RPT)")
    t_lnt = doc.add_table(rows=1, cols=4)
    t_lnt.rows[0].cells[0].paragraphs[0].add_run("ID URS")
    t_lnt.rows[0].cells[1].paragraphs[0].add_run("Deskripsi Kebutuhan Pengguna")
    t_lnt.rows[0].cells[2].paragraphs[0].add_run("Prioritas")
    t_lnt.rows[0].cells[3].paragraphs[0].add_run("Pengguna")
    lnt_data = [
        ("URS-LNT-001", "Sistem harus menyediakan fitur Ketertelusuran Batch Penuh (Backward Traceability) dari faktur jual ke panen dan petani.", "Must", "Seluruh Pengguna"),
        ("URS-LNT-002", "Sistem harus menjamin konsistensi basis data terpusat (single source of truth) tanpa penginputan data ganda.", "Must", "Seluruh Pengguna"),
        ("URS-LNT-003", "Sistem harus mengalirkan status transaksi secara otomatis lintas modul dari pengadaan hingga jurnal buku besar.", "Must", "Seluruh Pengguna"),
        ("URS-LNT-004", "Sistem harus menyediakan dataset simulasi (seeder) terstruktur untuk demonstrasi siklus penuh end-to-end.", "Must", "Seluruh Pengguna"),
        ("URS-RPT-001", "Laporan Stok Saprotan per item dan gudang dengan indikator visual stok di bawah ROP serta ekspor Excel.", "Must", "Admin Gudang"),
        ("URS-RPT-002", "Laporan Stok Hasil Panen dan Barang Jadi per grade, gudang, umur simpan, dan nomor batch serta ekspor Excel.", "Must", "Admin Gudang / Penjualan"),
        ("URS-RPT-003", "Laporan dan Rekapitulasi Setoran Panen per petani anggota dan per periode waktu.", "Must", "Pengurus / Keuangan"),
        ("URS-RPT-004", "Laporan Efisiensi Sortasi memuat berat input, output per grade, berat afkir, dan rasio susut panen.", "Must", "Petugas QC / Pengurus"),
        ("URS-RPT-005", "Laporan Ketertelusuran Batch (Traceability Report) beserta kode QR dari produk akhir ke petani asal.", "Must", "Pengurus / Auditor"),
        ("URS-RPT-006", "Laporan Laba Rugi komprehensif dan analisis margin kotor per batch komoditas dan per grade.", "Must", "Pengurus / Keuangan"),
        ("URS-RPT-007", "Laporan ESG Environmental: rasio pupuk organik vs kimia, rasio susut pangan (food loss), dan estimasi emisi karbon.", "Must", "Pengurus / Auditor"),
        ("URS-RPT-008", "Laporan ESG Social: jumlah petani aktif, rasio harga beli adil per grade, dan ketepatan waktu bayar.", "Must", "Pengurus / Auditor"),
        ("URS-RPT-009", "Laporan ESG Governance: persentase batch terlacak 100%, kepatuhan audit trail, dan transparansi keuangan.", "Must", "Pengurus / Auditor")
    ]
    for i, d, p, u in lnt_data:
        row = t_lnt.add_row()
        row.cells[0].paragraphs[0].add_run(i)
        row.cells[1].paragraphs[0].add_run(d)
        row.cells[2].paragraphs[0].add_run(p)
        row.cells[3].paragraphs[0].add_run(u)
    style_table(t_lnt, [1.1, 3.4, 0.7, 0.8])

    # ================= BAB V =================
    doc.add_paragraph()
    h = doc.add_paragraph()
    r = h.add_run("5. KEBUTUHAN NON-FUNGSIONAL, KESELAMATAN & MUTU (NFR, SAFETY & QUALITY)")
    r.font.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "Kebutuhan non-fungsional disusun mengacu pada standar ISO/IEC 25010 untuk menjamin sistem beroperasi secara aman, "
        "andal, terpercaya, dan mudah digunakan di area kerja koperasi."
    )

    t_nfr = doc.add_table(rows=1, cols=4)
    t_nfr.rows[0].cells[0].paragraphs[0].add_run("ID URS")
    t_nfr.rows[0].cells[1].paragraphs[0].add_run("Spesifikasi Kebutuhan Non-Fungsional")
    t_nfr.rows[0].cells[2].paragraphs[0].add_run("Prioritas")
    t_nfr.rows[0].cells[3].paragraphs[0].add_run("Kategori")
    nfr_data = [
        ("URS-NFR-001", "Role-Based Access Control (RBAC): Hak akses menu dan endpoint API dibatasi ketat berdasarkan 10 kelas pengguna.", "Must", "Keamanan"),
        ("URS-NFR-002", "Otentikasi & Enkripsi: Password pengguna di-hash dengan algoritma Argon2id dan otentikasi sesi via JWT token HS256.", "Must", "Keamanan"),
        ("URS-NFR-003", "Audit Trail Otomatis: Setiap aksi tambah, ubah, dan hapus dicatat identitas, IP, waktu, dan data JSONB pada tabel audit_logs.", "Should", "Integritas"),
        ("URS-NFR-004", "Data Immutability: Transaksi operasional dan jurnal berstatus POSTED dilarang dihapus pada basis data; koreksi via reversal.", "Should", "Integritas"),
        ("URS-NFR-005", "Lokalisasi Antarmuka: Seluruh antarmuka berbahasa Indonesia, format Rupiah (Rp), satuan kg, dan zona waktu WIB (Asia/Jakarta).", "Must", "Kegunaan"),
        ("URS-NFR-006", "Kemudahan Input Layar Tunggal: Transaksi operasional harian diselesaikan melalui satu layar formulir terpadu per alur kerja.", "Should", "Kegunaan"),
        ("URS-NFR-007", "Kinerja Respon Sistem: Waktu muat halaman dan eksekusi kalkulasi transaksi maksimal 5 detik pada beban data simulasi.", "Should", "Kinerja"),
        ("URS-NFR-008", "Skalabilitas Data Master: Desain tabel modular sehingga penambahan komoditas, grade, dan gudang tidak memerlukan ubah kode.", "Must", "Skalabilitas"),
        ("URS-NFR-009", "Pencadangan Basis Data: Sistem menyediakan skrip backup database berkala (pg_dump terkompresi dengan checksum SHA-256).", "Should", "Ketersediaan"),
        ("URS-NFR-010", "Kompatibilitas Peramban: Aplikasi berjalan konsisten di Google Chrome, Mozilla Firefox, Microsoft Edge, dan Apple Safari.", "Should", "Kompatibilitas"),
        ("URS-NFR-011", "Isolasi Data Simulasi: Paket data simulasi menggunakan dataset fiktif terstruktur yang terpisah dari lingkungan produksi.", "Must", "Integritas"),
        ("URS-SAF-001", "Fail-Safe Offline Draft: Jika koneksi putus saat menimbang panen, draf disimpan lokal (localStorage) dengan client_request_id idempoten.", "Should", "Keselamatan"),
        ("URS-SAF-002", "Disaster Recovery & Arsip: Basis data dicadangkan otomatis setiap hari pukul 23:00 WIB ke media penyimpanan terpisah.", "Should", "Keselamatan"),
        ("URS-QUA-001", "Maintainability Tanpa Deploy Ulang: Parameter operasional (katalog harga, tara air, rumus SHU) disimpan di tabel konfigurasi sistem.", "Should", "Mutu"),
        ("URS-QUA-002", "Ergonomi Layar Sentuh: Antarmuka responsif dengan tombol berukuran ramah sentuh (minimal 44px) untuk tablet/monitor gudang.", "Must", "Mutu")
    ]
    for i, d, p, k in nfr_data:
        row = t_nfr.add_row()
        row.cells[0].paragraphs[0].add_run(i)
        row.cells[1].paragraphs[0].add_run(d)
        row.cells[2].paragraphs[0].add_run(p)
        row.cells[3].paragraphs[0].add_run(k)
    style_table(t_nfr, [1.1, 3.4, 0.7, 0.8])

    # ================= BAB VI =================
    doc.add_paragraph()
    h = doc.add_paragraph()
    r = h.add_run("6. DATA SIMULASI & PERHITUNGAN TRANSAKSI NYATA (DUMMY DATASET)")
    r.font.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "Untuk memvalidasi integritas logika bisnis sistem (BR-01 s.d BR-08), dokumen URS menetapkan dataset simulasi "
        "pada komoditas unggulan Cabai Rawit Merah (1.000 kg setoran curah dari anggota):"
    )

    t_sim = doc.add_table(rows=1, cols=5)
    t_sim.rows[0].cells[0].paragraphs[0].add_run("Grade Hasil Sortasi")
    t_sim.rows[0].cells[1].paragraphs[0].add_run("Kuantitas (kg)")
    t_sim.rows[0].cells[2].paragraphs[0].add_run("Harga Beli Petani")
    t_sim.rows[0].cells[3].paragraphs[0].add_run("Harga Jual Pelanggan")
    t_sim.rows[0].cells[4].paragraphs[0].add_run("Kalkulasi Keuangan ERP")
    sim_data = [
        ("Grade A (Super)", "700 kg", "Rp38.000 / kg", "Rp46.000 / kg", "Beli: Rp26.600.000 | Jual: Rp32.200.000 (Margin Rp5.600.000)"),
        ("Grade B (Medium)", "200 kg", "Rp30.000 / kg", "Rp36.000 / kg", "Beli: Rp6.000.000 | Jual: Rp7.200.000 (Margin Rp1.200.000)"),
        ("Afkir / Susut Panen", "100 kg", "Rp0 / kg (Susut)", "Rp0 (Daur Ulang)", "Biaya Susut: Rp0 | Potensi Kompos Organik"),
        ("TOTAL SETORAN", "1.000 kg", "Hutang: Rp32.600.000", "Omset: Rp39.400.000", "Gross Profit Koperasi: Rp6.800.000 (Margin 17.26%)")
    ]
    for g, q, hb, hj, c in sim_data:
        row = t_sim.add_row()
        row.cells[0].paragraphs[0].add_run(g)
        row.cells[1].paragraphs[0].add_run(q)
        row.cells[2].paragraphs[0].add_run(hb)
        row.cells[3].paragraphs[0].add_run(hj)
        row.cells[4].paragraphs[0].add_run(c)
    style_table(t_sim, [1.3, 0.8, 1.1, 1.1, 1.7])

    doc.add_paragraph(
        "\nAturan Pembayaran & Potong Piutang di Loket Kasir:\n"
        "Petani Joko Susilo memiliki piutang saprotan (Pupuk NPK & Benih) sebesar Rp5.000.000. "
        "Saat nota panen senilai Rp32.600.000 dicairkan di kasir, sistem secara otomatis memotong piutang tersebut sehingga "
        "kas keluar riil adalah Rp27.600.000, piutang saprotan lunas, dan jurnal debit-kredit tercatat berimbang (balance)."
    )

    # ================= BAB VII =================
    doc.add_paragraph()
    h = doc.add_paragraph()
    r = h.add_run("7. MATRIKS KETERTELUSURAN KEBUTUHAN (REQUIREMENTS TRACEABILITY MATRIX)")
    r.font.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "Tabel 5 memetakan keterkaitan kebutuhan pengguna (URS) dengan kebutuhan spesifikasi teknis (SRS) dan tujuan proyek (T-01 s.d T-06):"
    )

    t_rtm = doc.add_table(rows=1, cols=5)
    t_rtm.rows[0].cells[0].paragraphs[0].add_run("Kode Kebutuhan URS")
    t_rtm.rows[0].cells[1].paragraphs[0].add_run("Kode Spesifikasi SRS")
    t_rtm.rows[0].cells[2].paragraphs[0].add_run("Kelompok Modul / Fungsi")
    t_rtm.rows[0].cells[3].paragraphs[0].add_run("Prioritas MoSCoW")
    t_rtm.rows[0].cells[4].paragraphs[0].add_run("Tujuan Proyek Terkait")
    rtm_data = [
        ("URS-MBR-001 s.d. 004", "SRS-MBR-001 s.d. 004", "Modul Data Master & Keanggotaan", "Must / Should", "T-01 (Kelola Data Petani & Lahan)"),
        ("URS-PRC-001 s.d. 008", "SRS-PRC-001 s.d. 008", "Modul Pengadaan (Procurement)", "Must / Should / Could", "T-02 & T-05 (Pengadaan Saprotan & Batch Panen)"),
        ("URS-INV-001 s.d. 010", "SRS-INV-001 s.d. 010", "Modul Inventaris (Inventory)", "Must / Should", "T-02 & T-04 (Stok Saprotan ROP & Rotasi FIFO)"),
        ("URS-MFG-001 s.d. 008", "SRS-MFG-001 s.d. 008", "Modul Manufaktur & Sortasi", "Must / Should", "T-03 (Standarisasi Grading, QC & Mass Balance)"),
        ("URS-SLS-001 s.d. 009", "SRS-SLS-001 s.d. 009", "Modul Penjualan (Sales)", "Must / Should / Could", "T-04 & T-05 (Harga 3 Segmen, FIFO & Traceability)"),
        ("URS-ACC-001 s.d. 010", "SRS-ACC-001 s.d. 010", "Modul Akuntansi & Keuangan", "Must / Should", "T-06 (Auto-Journaling, Margin Batch, Laba Rugi, SHU)"),
        ("URS-LNT-001 s.d. 004", "SRS-LNT-001 s.d. 004", "Kebutuhan Lintas Modul", "Must", "T-05 (Ketertelusuran End-to-End & Integrasi Terpusat)"),
        ("URS-RPT-001 s.d. 009", "SRS-RPT-001 s.d. 009", "Modul Pelaporan & ESG", "Must", "T-06 (Transparansi Laporan Operasional, ESG & SDGs)"),
        ("URS-NFR-001..011, SAF & QUA", "SRS-NFR-001..011, SAF & QUA", "Kebutuhan Non-Fungsional & Mutu", "Must / Should", "Keamanan RBAC, Kinerja, Integritas ACID, & Kegunaan")
    ]
    for u, s, m, p, t in rtm_data:
        row = t_rtm.add_row()
        row.cells[0].paragraphs[0].add_run(u)
        row.cells[1].paragraphs[0].add_run(s)
        row.cells[2].paragraphs[0].add_run(m)
        row.cells[3].paragraphs[0].add_run(p)
        row.cells[4].paragraphs[0].add_run(t)
    style_table(t_rtm, [1.4, 1.4, 1.3, 0.9, 1.0])

    # ================= BAB VIII =================
    doc.add_paragraph()
    h = doc.add_paragraph()
    r = h.add_run("8. LEMBAR PERSETUJUAN & PENGESAHAN DOKUMEN (SIGN-OFF)")
    r.font.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "Dokumen User Requirements Specification (URS) ini telah ditinjau dan disetujui bersama oleh perwakilan "
        "pemangku kepentingan Koperasi Tani Mandiri dan Tim Pengembang Kelompok 3 sebagai acuan resmi perancangan sistem:"
    )

    t_app = doc.add_table(rows=1, cols=4)
    t_app.rows[0].cells[0].paragraphs[0].add_run("Peran / Jabatan")
    t_app.rows[0].cells[1].paragraphs[0].add_run("Nama Pemangku Kepentingan")
    t_app.rows[0].cells[2].paragraphs[0].add_run("Tanda Tangan")
    t_app.rows[0].cells[3].paragraphs[0].add_run("Tanggal")
    app_data = [
        ("Ketua Koperasi Tani Mandiri", "Bpk. Suryanto", "[ Terverifikasi ]", "02/11/2026"),
        ("Manajer Operasional & Gudang", "Bpk. Bambang Sutrisno", "[ Terverifikasi ]", "02/11/2026"),
        ("Kepala Bagian Keuangan", "Ibu Siti Rahmawati", "[ Terverifikasi ]", "02/11/2026"),
        ("Ketua Tim Pengembang (Kelompok 3)", "Pancar Wahyu Setiabi (H1D024018)", "[ Disetujui ]", "04/11/2026"),
        ("Analis Kebutuhan & Desain (Kelompok 3)", "Amalia Maharani Andessy (H1D024032)", "[ Disetujui ]", "04/11/2026"),
        ("Pengembang Backend & DB (Kelompok 3)", "Aufa Salsabila Algifari (H1D024042)", "[ Disetujui ]", "04/11/2026"),
        ("Pengembang Frontend UI (Kelompok 3)", "Salsabilla Rahma Diena (H1D025101)", "[ Disetujui ]", "04/11/2026"),
        ("Quality Assurance & Testing (Kelompok 3)", "Mazsa Amelia Maranatha (H1D025103)", "[ Disetujui ]", "04/11/2026")
    ]
    for r_role, r_name, r_sign, r_date in app_data:
        row = t_app.add_row()
        row.cells[0].paragraphs[0].add_run(r_role)
        row.cells[1].paragraphs[0].add_run(r_name)
        row.cells[2].paragraphs[0].add_run(r_sign)
        row.cells[3].paragraphs[0].add_run(r_date)
    style_table(t_app, [1.8, 2.2, 1.0, 1.0])

    out_path = "doc/rani/Kelompok 3_Smart Farming_URS.docx"
    doc.save(out_path)
    print(f"Successfully generated: {out_path} ({os.path.getsize(out_path)} bytes)")

if __name__ == "__main__":
    build_urs_docx()
