import os

def update_master():
    with open('scripts/create_master_document_docx.py', encoding='utf-8') as f:
        text = f.read()

    helper = """
def add_figure(doc, img_path, fig_num, caption):
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(2)
        p_img.add_run().add_picture(img_path, width=Inches(5.5))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(6)
        r_num = p_cap.add_run(f"Gambar {fig_num}: ")
        r_num.font.bold = True
        r_num.font.size = Pt(9.5)
        r_cap = p_cap.add_run(caption)
        r_cap.font.italic = True
        r_cap.font.size = Pt(9.5)
"""

    idx = text.find('def create_master_document():')
    if 'def add_figure(' not in text:
        text = text[:idx] + helper + '\n' + text[idx:]

    replacements = [
        (
            'add_heading_2("4.1 Lingkungan & Stack Teknologi Implementasi")',
            'add_heading_2("4.1 Lingkungan & Stack Teknologi Implementasi")\n    add_figure(doc, "doc/screenshots/01_login_page.png", "4.1", "Antarmuka Login dan Quick-Login Role Switcher 6 Peran")'
        ),
        (
            'add_heading_2("4.2 Implementasi Modul 1: Master Data Keanggotaan & Saprotan")',
            'add_heading_2("4.2 Implementasi Modul 1: Master Data Keanggotaan & Saprotan")\n    add_figure(doc, "doc/screenshots/03_master_data_petani.png", "4.2", "Antarmuka Master Data 100 Petani Anggota Koperasi")'
        ),
        (
            'add_heading_2("4.3 Implementasi Modul 2: Procurement & Penerimaan Panen Curah")',
            'add_heading_2("4.3 Implementasi Modul 2: Procurement & Penerimaan Panen Curah")\n    add_figure(doc, "doc/screenshots/04_penerimaan_panen.png", "4.3", "Antarmuka Formulir Penerimaan Panen Curah & QR Code Batch")'
        ),
        (
            'add_heading_2("4.4 Implementasi Modul 3: Manufaktur, Grading Mutu & Mass Balance 0 kg (The Money Shot)")',
            'add_heading_2("4.4 Implementasi Modul 3: Manufaktur, Grading Mutu & Mass Balance 0 kg (The Money Shot)")\n    add_figure(doc, "doc/screenshots/05_sortasi_grading_qc.png", "4.4", "Antarmuka Sortasi Kualitas & Validasi Mass Balance 0 kg (The Money Shot)")'
        ),
        (
            'add_heading_2("4.5 Implementasi Modul 4: Inventaris Multi-Gudang & Rotasi FIFO")',
            'add_heading_2("4.5 Implementasi Modul 4: Inventaris Multi-Gudang & Rotasi FIFO")\n    add_figure(doc, "doc/screenshots/06_manajemen_stok_gudang.png", "4.5", "Antarmuka Inventaris Multi-Gudang Berbasis Batch FIFO & Batas ROP")'
        ),
        (
            'add_heading_2("4.6 Implementasi Modul 5: Penjualan 3 Segmen Pasar & Surat Jalan DO")',
            'add_heading_2("4.6 Implementasi Modul 5: Penjualan 3 Segmen Pasar & Surat Jalan DO")\n    add_figure(doc, "doc/screenshots/07_penjualan_sales_orders.png", "4.6", "Antarmuka Sales Order 3 Segmen Pasar & Cetak Surat Jalan DO")'
        ),
        (
            'add_heading_2("4.7 Implementasi Modul 6: Akuntansi Terpadu, Jurnal Otomatis & SHU")',
            'add_heading_2("4.7 Implementasi Modul 6: Akuntansi Terpadu, Jurnal Otomatis & SHU")\n    add_figure(doc, "doc/screenshots/08_kasir_keuangan.png", "4.7", "Antarmuka Kasir Pelunasan Nota Panen & Pemotongan Piutang Saprotan")'
        ),
        (
            'add_heading_2("4.8 Implementasi Modul 7: Ketertelusuran Rantai Pasok & Dashboard ESG")',
            'add_heading_2("4.8 Implementasi Modul 7: Ketertelusuran Rantai Pasok & Dashboard ESG")\n    add_figure(doc, "doc/screenshots/02_dashboard_eksekutif.png", "4.8", "Antarmuka Dashboard Eksekutif KPI & Ringkasan Laporan ESG")'
        )
    ]

    for old_s, new_s in replacements:
        if old_s in text and new_s not in text:
            text = text.replace(old_s, new_s, 1)

    with open('scripts/create_master_document_docx.py', 'w', encoding='utf-8') as f:
        f.write(text)

    print("Updated scripts/create_master_document_docx.py")

if __name__ == '__main__':
    update_master()
