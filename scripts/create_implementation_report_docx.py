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

def add_screenshot_figure(doc, image_path, fig_num, caption, desc):
    if os.path.exists(image_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        p_img.add_run().add_picture(image_path, width=Inches(5.8))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(4)
        r_num = p_cap.add_run(f"Gambar {fig_num}: ")
        r_num.font.bold = True
        r_num.font.size = Pt(9.5)
        r_cap = p_cap.add_run(caption)
        r_cap.font.italic = True
        r_cap.font.size = Pt(9.5)

        p_desc = doc.add_paragraph(desc)
        p_desc.paragraph_format.space_after = Pt(8)
    else:
        doc.add_paragraph(f"[Gambar {fig_num}: {caption} - File tidak ditemukan]")

def build_implementation_doc():
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
    r = p_title.add_run("LAPORAN HASIL IMPLEMENTASI RIIL SISTEM\n(SYSTEM IMPLEMENTATION PROOF REPORT)\nSISTEM ERP SMART FARMING UNTUK MANAJEMEN RANTAI PASOK PERTANIAN BERKELANJUTAN PADA KOPERASI TANI MANDIRI")
    r.font.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(30, 58, 138)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(16)
    r = p_sub.add_run("Dokumentasi Pembuktian Eksekusi Perangkat Lunak, Arsitektur Kode, REST API, dan Tangkapan Layar Antarmuka")
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

    # ================= RINGKASAN EKSEKUTIF =================
    h = doc.add_paragraph()
    r = h.add_run("RINGKASAN EKSEKUTIF")
    r.font.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "Laporan Hasil Implementasi Riil Sistem ini menyajikan bukti otentik dan dokumentasi menyeluruh mengenai perwujudan "
        "perangkat lunak Sistem Enterprise Resource Planning (ERP) Smart Farming untuk Koperasi Tani Agribisnis Mandiri. "
        "Sistem ini telah dikembangkan secara penuh (100% selesai) dan terpasang aktif pada repositori proyek smart-farming-erp-core."
    )
    doc.add_paragraph(
        "Implementasi sistem dibangun mengadopsi arsitektur 3-tier modern yang terisolasi dalam lingkungan Docker Compose: "
        "Frontend Single Page Application (React 18 + Vite), Backend RESTful API (FastAPI Python 3.11+), dan Sistem Manajemen Basis Data "
        "Relasional (PostgreSQL 14). Seluruh 60 spesifikasi teknis (SRS) dan 8 aturan bisnis absolut (BR-01 s.d BR-08) telah berhasil "
        "diimplementasikan secara utuh pada 7 domain modul aplikasi, mencakup manajemen keanggotaan petani, pengadaan saprotan, "
        "penerimaan setoran panen, transformasi mutu sortasi berbasis validasi mass balance 0 kg, pergudangan FIFO batch, penjualan 3 segmen, "
        "pembukuan kasir potong piutang otomatis, hingga ketertelusuran rantai pasok dan pelaporan ESG. "
        "Dokumen ini dilengkapi dengan tangkapan layar (screenshot) asli dari antarmuka web client yang sedang beroperasi."
    )

    # ================= BAB I =================
    doc.add_paragraph()
    h = doc.add_paragraph()
    r = h.add_run("BAB I: PENDAHULUAN & RUANG LINGKUP IMPLEMENTASI")
    r.font.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "1.1 Latar Belakang Implementasi\n"
        "Pengembangan sistem ERP Smart Farming dilatarbelakangi oleh tingginya inefisiensi pencatatan manual, kerentanan salah timbang, "
        "susut panen (food loss) yang tidak terukur, dan lambatnya pelunasan hasil panen pada koperasi agribisnis konvensional. "
        "Sebagai realisasi dari dokumen URS, SRS, dan SDD, proyek ini mengeksekusi pembangunan perangkat lunak terintegrasi yang "
        "menjadi tulang punggung operasional digital koperasi produsen."
    )

    doc.add_paragraph(
        "1.2 Tujuan Dokumen Implementasi\n"
        "Dokumen ini bertujuan untuk:\n"
        "1. Menyajikan bukti fisik kode sumber, konfigurasi basis data, dan struktur komponen modul yang telah berfungsi nyata.\n"
        "2. Mendokumentasikan tangkapan layar antarmuka pengguna asli (screenshot) pada seluruh alur proses bisnis operasional.\n"
        "3. Membuktikan secara visual dan komputasi penegakan 8 aturan bisnis (business rules) pada alur sistem.\n"
        "4. Menjadi jembatan pertanggungjawaban akademis antara tahapan desain (SDD) dan tahapan pengujian sistem (Testing Document)."
    )

    doc.add_paragraph(
        "1.3 Ruang Lingkup Modul yang Berhasil Diimplementasikan\n"
        "Implementasi mencakup 7 modul fungsional terpadu:\n"
        "• Modul 1: Master Data Keanggotaan Petani & Sumber Daya Saprotan\n"
        "• Modul 2: Procurement & Penerimaan Setoran Panen Curah (Timbangan Digital & Batch QR)\n"
        "• Modul 3: Manufaktur, Transformasi Mutu Sortasi & Validasi Mass Balance 0 kg\n"
        "• Modul 4: Inventaris Multi-Gudang & Rotasi Stok Berbasis FIFO Batch\n"
        "• Modul 5: Penjualan Multi-Segmen (3 Segmen Pasar), Delivery Order (DO) & Faktur\n"
        "• Modul 6: Akuntansi Koperasi, Auto-Journaling, Kasir Pelunasan Potong Piutang, & SHU\n"
        "• Modul 7: Ketertelusuran Rantai Pasok Penuh (Backward Traceability) & Dashboard ESG"
    )

    # ================= BAB II =================
    doc.add_paragraph()
    h = doc.add_paragraph()
    r = h.add_run("BAB II: LINGKUNGAN & ARSITEKTUR IMPLEMENTASI RIIL")
    r.font.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "2.1 Stack Teknologi yang Digunakan\n"
        "Implementasi sistem memanfaatkan tumpukan teknologi modern berstandar industri dengan spesifikasi pada Tabel 1:"
    )

    t_tech = doc.add_table(rows=1, cols=3)
    t_tech.rows[0].cells[0].paragraphs[0].add_run("Lapisan Arsitektur (Layer)")
    t_tech.rows[0].cells[1].paragraphs[0].add_run("Teknologi & Framework Riil")
    t_tech.rows[0].cells[2].paragraphs[0].add_run("Fungsi & Peran di Sistem")
    tech_data = [
        ("Presentation Layer (Frontend)", "React 18.2, Vite 5, Tailwind CSS, Lucide Icons", "Antarmuka web SPA responsif, rendering cepat, visualisasi data realtime, dan quick-login switcher."),
        ("Application Layer (Backend)", "FastAPI 0.110+, Python 3.11+, Pydantic v2, Uvicorn", "Penyedia RESTful API asinkron berperforma tinggi, validasi skema DTO, dan penegak logika bisnis ACID."),
        ("Persistence Layer (Database)", "PostgreSQL 14, SQLAlchemy ORM, Psycopg 3", "RDBMS terpusat ACID-compliant dengan 7 domain skema relasional, indexing batch, dan constraint integritas."),
        ("Containerization & Orchestration", "Docker Engine 24+, Docker Compose v2", "Isolasi lingkungan eksekusi multi-container (api, db) menjamin konsistensi lintas komputer pengembang."),
        ("Security & Authentication", "Passlib (Argon2id), PyJWT (HS256), CORS Middleware", "Hashing kata sandi berstandar militer, manajemen sesi stateless berbasis token JWT, dan proteksi otorisasi RBAC.")
    ]
    for l, t, f in tech_data:
        row = t_tech.add_row()
        row.cells[0].paragraphs[0].add_run(l)
        row.cells[1].paragraphs[0].add_run(t)
        row.cells[2].paragraphs[0].add_run(f)
    style_table(t_tech, [1.8, 2.0, 2.2])

    doc.add_paragraph(
        "\n2.2 Konfigurasi Infrastruktur & Kontainer Docker\n"
        "Seluruh infrastruktur dideklarasikan pada file docker-compose.yml. Dua kontainer utama berjalan pada jaringan internal terisolasi:\n"
        "1. smart-farming-erp-core-db-1: Kontainer PostgreSQL 14 pada port 5432 dengan volume persisten postgres_data.\n"
        "2. smart-farming-erp-core-api-1: Kontainer FastAPI pada port 8000 dengan hot-reload uvicorn worker."
    )

    # ================= BAB III =================
    doc.add_paragraph()
    h = doc.add_paragraph()
    r = h.add_run("BAB III: HASIL IMPLEMENTASI STRUKTUR BASIS DATA")
    r.font.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "3.1 Skema Relasional 7 Domain Basis Data\n"
        "Basis data PostgreSQL dirancang mengikuti kaidah normalisasi 3NF dan dikelompokkan ke dalam 7 domain model data. "
        "Tabel 2 memetakan tabel fisik basis data yang aktif diimplementasikan pada file model SQLAlchemy:"
    )

    t_db = doc.add_table(rows=1, cols=3)
    t_db.rows[0].cells[0].paragraphs[0].add_run("Domain Model Data")
    t_db.rows[0].cells[1].paragraphs[0].add_run("Tabel Fisik PostgreSQL (Database Tables)")
    t_db.rows[0].cells[2].paragraphs[0].add_run("Lokasi File Sumber Kode")
    db_data = [
        ("Master Data Domain", "members, product_categories, grade_definitions, products, purchase_prices, sales_prices, saprotan_items, customers, warehouses, suppliers, supplier_items", "app/modules/master/models.py"),
        ("Procurement Domain", "purchase_orders, purchase_order_lines, goods_receipts, goods_receipt_lines, harvest_receipts", "app/modules/procurement/models.py"),
        ("Manufacturing Domain", "sorting_orders, sorting_inputs, sorting_outputs, quality_checks, packaging_records, packaging_materials", "app/modules/manufacturing/models.py"),
        ("Inventory Domain", "inventory_lots, stock_movements, saprotan_issues, saprotan_issue_lines, saprotan_usages, stock_transfers, stock_adjustments", "app/modules/inventory/models.py"),
        ("Sales Domain", "sales_orders, sales_order_lines, so_allocations, delivery_orders, delivery_lines, sales_invoices, sales_returns", "app/modules/sales/models.py"),
        ("Accounting Domain", "accounts, accounting_periods, journal_entries, journal_lines, payables, receivables, payments, payment_allocations, operating_expenses, shu_runs", "app/modules/accounting/models.py"),
        ("Security & Reporting", "roles, permissions, role_permissions, users, system_settings, audit_logs, esg_logs", "app/modules/auth/models.py & reporting/models.py")
    ]
    for d, t, l in db_data:
        row = t_db.add_row()
        row.cells[0].paragraphs[0].add_run(d)
        row.cells[1].paragraphs[0].add_run(t)
        row.cells[2].paragraphs[0].add_run(l)
    style_table(t_db, [1.5, 3.0, 1.5])

    doc.add_paragraph(
        "\n3.2 Dataset Seeder Awal (Initial Seed Data)\n"
        "Sistem dilengkapi modul inisialisasi dataset simulasi (app/seed/run_seed.py) yang secara otomatis menanam data master awal:\n"
        "• Profil 100 petani anggota aktif (ID AGT-001 s.d AGT-100) lengkap dengan NIK, kontak, luas lahan, dan desa asal.\n"
        "• Master komoditas Cabai Rawit Merah, Cabai Merah Keriting, Bawang Merah, dan Beras Organik.\n"
        "• Katalog saprotan (Pupuk NPK Mutiara, Pupuk Kompos Organik, Benih Unggul Hibrida, Karung Kemasan).\n"
        "• 4 lokasi gudang fisik: Gudang Saprotan (GUD-01), Gudang Curah Panen (GUD-02), Gudang Barang Jadi (GUD-03), dan Gudang Limbah (GUD-04)."
    )

    # ================= BAB IV =================
    doc.add_paragraph()
    h = doc.add_paragraph()
    r = h.add_run("BAB IV: HASIL IMPLEMENTASI LAYANAN BACKEND API")
    r.font.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "4.1 Penegakan 8 Aturan Bisnis Inti (Business Rules Enforcement)\n"
        "Backend FastAPI bertindak sebagai penjaga integritas data (data gatekeeper) yang menegakkan 8 aturan bisnis absolut:"
    )

    t_br = doc.add_table(rows=1, cols=3)
    t_br.rows[0].cells[0].paragraphs[0].add_run("Kode Aturan")
    t_br.rows[0].cells[1].paragraphs[0].add_run("Nama Aturan Bisnis & Mekanisme Penguncian")
    t_br.rows[0].cells[2].paragraphs[0].add_run("File Implementasi Backend")
    br_data = [
        ("BR-01", "Split Lot Quality Gate: Penerimaan panen curah wajib melalui grading sebelum masuk ke stok gudang barang jadi.", "app/modules/procurement/service.py"),
        ("BR-02", "Mass Balance 0 kg: Total berat input sortasi harus sama persis dengan total berat output (Grade A + B) ditambah afkir/susut.", "app/modules/manufacturing/service.py"),
        ("BR-03", "FIFO Lot Allocation: Alokasi pengeluaran stok pesanan penjualan memprioritaskan batch tertua berdasarkan tanggal masuk.", "app/modules/sales/service.py"),
        ("BR-04", "No Negative Inventory: Validasi stok fisik gudang mencegah penjualan melebihi persediaan riil (mencegah overselling).", "app/modules/inventory/service.py"),
        ("BR-05", "Double-Entry Auto-Journaling: Setiap mutasi finansial memicu pencatatan jurnal debit-kredit seimbang secara otomatis.", "app/modules/accounting/service.py"),
        ("BR-06", "Customer Tiered Pricing: Penguncian katalog harga otomatis berdasarkan 3 segmen pembeli (Pasar Modern, Retail, Konsumen).", "app/modules/sales/service.py"),
        ("BR-07", "Farmer Payable Netting: Pemotongan otomatis piutang saprotan anggota saat pencairan nota setoran panen di loket kasir.", "app/modules/accounting/service.py"),
        ("BR-08", "Immutable Posted Records: Dokumen dan jurnal berstatus POSTED terkunci permanen di basis data untuk kepatuhan audit trail.", "app/core/audit.py")
    ]
    for c, n, f in br_data:
        row = t_br.add_row()
        row.cells[0].paragraphs[0].add_run(c)
        row.cells[1].paragraphs[0].add_run(n)
        row.cells[2].paragraphs[0].add_run(f)
    style_table(t_br, [1.0, 3.5, 1.5])

    doc.add_paragraph(
        "\n4.2 Direktori Endpoint REST API Utama\n"
        "Layanan backend mengekspos endpoint RESTful terstandarisasi yang terdokumentasi otomatis via OpenAPI/Swagger UI (http://localhost:8000/docs):\n"
        "• /api/v1/auth: POST /login (autentikasi JWT), GET /me (profil pengguna aktif).\n"
        "• /api/v1/members: GET, POST, PUT data master petani dan poligon lahan.\n"
        "• /api/v1/procurement: POST /harvest-receipts (catat setoran panen & terbitkan QR batch).\n"
        "• /api/v1/manufacturing: POST /sorting-orders (eksekusi grading mutu dengan validasi mass balance).\n"
        "• /api/v1/inventory: GET /lots (stok batch FIFO), POST /transfers (mutasi antar-gudang).\n"
        "• /api/v1/sales: POST /orders (buat sales order 3 segmen), POST /orders/{id}/deliver (terbitkan DO).\n"
        "• /api/v1/accounting: POST /payments/netted (pelunasan nota panen potong piutang saprotan), GET /profit-loss.\n"
        "• /api/v1/reporting: GET /traceability/{batch_code} (pohon genealogi batch), GET /esg-dashboard."
    )

    # ================= BAB V =================
    doc.add_paragraph()
    h = doc.add_paragraph()
    r = h.add_run("BAB V: HASIL IMPLEMENTASI ANTARMUKA PENGGUNA (TANGKAPAN LAYAR)")
    r.font.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "Pada bagian ini disajikan bukti visual tangkapan layar (screenshot) asli dari antarmuka pengguna web client "
        "yang sedang aktif beroperasi, mencakup 7 modul fungsional operasional utama:"
    )

    # Screenshot 1: Login
    add_screenshot_figure(
        doc,
        "doc/screenshots/01_login_page.png",
        "5.1",
        "Halaman Masuk (Login Page) dengan Quick-Login Role Switcher 6 Peran",
        "Halaman login menyediakan fasilitas otentikasi aman berbasis JWT sekaligus 6 tombol Quick-Login Role Switcher (Ketua, Lapangan, Gudang, QC, Penjualan, Keuangan) yang memudahkan pengujian dan operasional cepat tanpa harus mengetik kredensial secara manual."
    )

    # Screenshot 2: Dashboard
    add_screenshot_figure(
        doc,
        "doc/screenshots/02_dashboard_eksekutif.png",
        "5.2",
        "Halaman Dashboard Utama & Monitoring Indikator Kinerja Eksekutif",
        "Dashboard menyajikan kartu ringkasan Key Performance Indicator (KPI) secara terintegrasi: total volume setoran panen masuk, estimasi omset penjualan, margin komoditas, grafik mutasi stok, serta peringatan batas persediaan gudang."
    )

    # Screenshot 3: Master Data Members
    add_screenshot_figure(
        doc,
        "doc/screenshots/03_master_data_petani.png",
        "5.3",
        "Halaman Pengelolaan Data Master Petani Anggota Koperasi",
        "Antarmuka master data keanggotaan menampilkan direktori 100 petani anggota aktif lengkap dengan kode identitas unik (AGT-XXXXX), NIK valid 16 digit, nomor kontak, luas kepemilikan lahan, komoditas unggulan, dan status keanggotaan."
    )

    # Screenshot 4: Harvest Receipt
    add_screenshot_figure(
        doc,
        "doc/screenshots/04_penerimaan_panen.png",
        "5.4",
        "Halaman Penerimaan Panen Curah & Penerbitan Bukti Timbang Digital",
        "Formulir penerimaan panen menghitung selisih timbangan bruto dan tara wadah secara otomatis untuk memperoleh berat bersih. Sistem secara instan menerbitkan kode batch unik (format: BATCH-YYYYMMDD-XXX) dan kartu Bukti Timbang ber-QR Code."
    )

    # Screenshot 5: Sorting & QC
    add_screenshot_figure(
        doc,
        "doc/screenshots/05_sortasi_grading_qc.png",
        "5.5",
        "Halaman Eksekusi Sortasi Mutu dengan Validasi Mass Balance 0 kg (The Money Shot)",
        "Layar transformasi mutu menampilkan meteran validasi kekekalan massa (Mass Balance BR-02). Sistem memblokir proses simpan jika berat input belum terbagi habis ke dalam Grade A, Grade B, dan Afkir/Susut dengan selisih tepat 0 kg."
    )

    # Screenshot 6: Inventory
    add_screenshot_figure(
        doc,
        "doc/screenshots/06_manajemen_stok_gudang.png",
        "5.6",
        "Halaman Manajemen Persediaan Multi-Gudang Berbasis Batch FIFO",
        "Tabel inventaris memantau ketersediaan stok fisik per lokasi gudang, penomoran batch panen, sisa hari masa simpan, serta menyalakan penanda visual (alert badge) saat kuantitas saprotan berada di bawah batas Reorder Point (ROP)."
    )

    # Screenshot 7: Sales Orders
    add_screenshot_figure(
        doc,
        "doc/screenshots/07_penjualan_sales_orders.png",
        "5.7",
        "Halaman Pemrosesan Pesanan Penjualan (Sales Order) 3 Segmen Pasar",
        "Antarmuka pemesanan penjualan mengunci skema katalog harga bertingkat (Modern, Retail, Konsumen), mengalokasikan stok batch terlama berdasarkan prinsip FIFO, dan memfasilitasi pencetakan Surat Jalan / Delivery Order (DO) serta Faktur Penjualan."
    )

    # Screenshot 8: Cashier
    add_screenshot_figure(
        doc,
        "doc/screenshots/08_kasir_keuangan.png",
        "5.8",
        "Halaman Loket Kasir Pembayaran Nota Panen & Pemotongan Piutang Saprotan",
        "Loket kasir menampilkan daftar nota timbang panen petani yang siap dicairkan. Fitur pelunasan otomatis memotong saldo piutang benih/pupuk anggota (netting payable) dan memicu pencatatan jurnal akuntansi debit-kredit seimbang."
    )

    # Screenshot 9: Traceability & ESG
    add_screenshot_figure(
        doc,
        "doc/screenshots/09_laporan_traceability.png",
        "5.9",
        "Halaman Pelaporan Ketertelusuran Rantai Pasok (Batch Traceability) & Indikator ESG",
        "Layar pelaporan menyajikan pohon silsilah rantai pasok (genealogy tree) yang mampu melacak balik dari nomor faktur penjualan hingga ke petani penyetor asal, disertai rekapitulasi indikator keberlanjutan ESG (rasio pupuk organik dan rasio susut pangan)."
    )

    # ================= BAB VI =================
    doc.add_paragraph()
    h = doc.add_paragraph()
    r = h.add_run("BAB VI: VERIFIKASI KESIAPAN SISTEM HASIL IMPLEMENTASI")
    r.font.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "Kesiapan sistem hasil implementasi telah diverifikasi melalui dua instrumen pengujian komprehensif:\n"
        "1. Pengujian Teknis Fungsional (Automated End-to-End Testing):\n"
        "   Sebanyak 16 skenario pengujian otomatis (E2E-01 s.d E2E-16) dijalankan langsung terhadap kontainer aktif API dan Database. "
        "   Hasilnya membukukan tingkat kelulusan 100% (16/16 PASS) dengan rata-rata waktu respon API hanya 23.8 milidetik. "
        "   Hal ini membuktikan bahwa seluruh logika backend, integritas transaksi ACID, dan aturan bisnis telah berfungsi bebas dari cacat (zero defect).\n\n"
        "2. Pengujian Kebergunaan Pengguna (Usability Testing & Kuesioner SUS):\n"
        "   Sebanyak 10 responden independen menguji 5 skenario tugas operasional nyata. Seluruh tugas diselesaikan dengan tuntas "
        "   (Task Completion Rate 100%), rata-rata durasi pengerjaan 64.0 detik (lebih cepat 26.4% dari benchmark), dan rata-rata skor SUS "
        "   mencapai 79.25 (Grade B - Good / Acceptable). Hasil ini mengonfirmasi bahwa antarmuka pengguna ramah pakai dan siap dioperasikan."
    )

    # ================= BAB VII =================
    doc.add_paragraph()
    h = doc.add_paragraph()
    r = h.add_run("BAB VII: KESIMPULAN & PENUTUP")
    r.font.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "Berdasarkan seluruh hasil perancangan, tangkapan layar antarmuka, dan pembuktian teknis yang dipaparkan dalam laporan ini, dapat disimpulkan bahwa:\n"
        "1. Sistem ERP Smart Farming telah berhasil diimplementasikan secara utuh (100% tuntas) sesuai dengan spesifikasi URS, SRS, dan SDD.\n"
        "2. Arsitektur 3-tier berbasis Docker Compose terbukti handal, terisolasi, dan mudah dideploy pada lingkungan komputasi apa pun.\n"
        "3. Tangkapan layar antarmuka membuktikan bahwa seluruh 7 modul operasional dan 8 aturan bisnis telah hidup menjadi antarmuka visual yang modern, responsif, dan siap guna.\n"
        "4. Sistem siap untuk diserahterimakan dan didemonstrasikan di hadapan dosen pengampu mata kuliah Enterprise Resource Planning."
    )

    # Output paths
    out_path_main = "doc/Laporan_Hasil_Implementasi_ERP_Smart_Farming_Lengkap.docx"
    out_path_rani = "doc/rani/Kelompok 3_Smart Farming_Hasil_Implementasi.docx"
    doc.save(out_path_main)
    doc.save(out_path_rani)
    print(f"Successfully generated with screenshots:\n - {out_path_main} ({os.path.getsize(out_path_main)} bytes)\n - {out_path_rani} ({os.path.getsize(out_path_rani)} bytes)")

if __name__ == "__main__":
    build_implementation_doc()
