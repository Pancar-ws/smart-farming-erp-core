-- ============================================================================
-- 011_seed_reference.sql: Data Awal Referensi & Master Sistem
-- ============================================================================

-- 9.1 Role
INSERT INTO roles (code, name) VALUES
 ('SUPERADMIN','Administrator Sistem'),
 ('ADMIN_KEANGGOTAAN','Admin Keanggotaan'),
 ('PETUGAS_PENERIMAAN','Petugas Penerimaan'),
 ('PETUGAS_SORTASI_QC','Petugas Sortasi & QC'),
 ('ADMIN_GUDANG','Admin Gudang'),
 ('BAGIAN_PENJUALAN','Bagian Penjualan'),
 ('BAGIAN_KEUANGAN','Bagian Keuangan'),
 ('PENGURUS','Pengurus Koperasi'),
 ('ANGGOTA_READONLY','Anggota (baca saja)')
ON CONFLICT (code) DO NOTHING;

-- 9.2 Permission
INSERT INTO permissions (code, description) VALUES
 ('*','Semua izin'),
 ('member:read','Lihat anggota'),
 ('member:write','Kelola anggota'),
 ('master:write','Kelola master'),
 ('harvest:receive','Terima setoran panen'),
 ('harvest:read','Lihat setoran panen'),
 ('mfg:sort','Eksekusi sortasi'),
 ('mfg:config','Konfigurasi grade/kriteria'),
 ('mfg:read','Lihat sortasi'),
 ('inventory:read','Lihat stok'),
 ('inventory:issue','Salurkan saprotan'),
 ('inventory:adjust','Mutasi & opname'),
 ('po:read','Lihat PO'),
 ('po:write','Kelola PO & penerimaan barang'),
 ('price:purchase:write','Ubah harga beli'),
 ('price:sales:write','Ubah harga jual'),
 ('sales:read','Lihat penjualan'),
 ('sales:order','Buat SO'),
 ('sales:ship','Kirim & faktur'),
 ('acct:read','Lihat laporan keuangan'),
 ('acct:post','Posting jurnal/beban'),
 ('acct:payment','Catat pembayaran'),
 ('acct:close','Tutup periode'),
 ('report:operational','Laporan operasional'),
 ('report:esg','Laporan ESG'),
 ('admin:user','Kelola pengguna')
ON CONFLICT (code) DO NOTHING;

-- 9.3 Peta role → permission (selaras Backend §11)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM (VALUES
 ('SUPERADMIN',         ARRAY['*']),
 ('ADMIN_KEANGGOTAAN',  ARRAY['member:read','member:write','harvest:read','inventory:read','report:operational']),
 ('PETUGAS_PENERIMAAN', ARRAY['harvest:receive','harvest:read','member:read','inventory:read']),
 ('PETUGAS_SORTASI_QC', ARRAY['mfg:sort','mfg:config','mfg:read','harvest:read','inventory:read','report:operational']),
 ('ADMIN_GUDANG',       ARRAY['inventory:read','inventory:issue','inventory:adjust','po:read','po:write','harvest:read','master:write','mfg:read','report:operational']),
 ('BAGIAN_PENJUALAN',   ARRAY['sales:read','sales:order','sales:ship','price:sales:write','inventory:read','report:operational']),
 ('BAGIAN_KEUANGAN',    ARRAY['acct:read','acct:post','acct:payment','acct:close','price:purchase:write','price:sales:write',
                              'member:read','harvest:read','po:read','sales:read','inventory:read','report:esg','report:operational']),
 ('PENGURUS',           ARRAY['acct:read','report:esg','report:operational','member:read','inventory:read','sales:read']),
 ('ANGGOTA_READONLY',   ARRAY['acct:read','report:esg'])
) v(role_code, perms)
JOIN roles r ON r.code = v.role_code
JOIN permissions p ON p.code = ANY (v.perms)
ON CONFLICT DO NOTHING;

-- 9.4 Bagan akun
INSERT INTO accounts (code, name, type) VALUES
 ('1-1100','Kas','ASSET'),
 ('1-1200','Bank','ASSET'),
 ('1-2100','Piutang Usaha','ASSET'),
 ('1-2200','Piutang Saprotan Anggota','ASSET'),
 ('1-3100','Persediaan Saprotan','ASSET'),
 ('1-3200','Persediaan Barang Jadi','ASSET'),
 ('2-1100','Hutang Supplier','LIABILITY'),
 ('2-1200','Hutang Pembelian Panen Anggota','LIABILITY'),
 ('3-1100','Simpanan/Modal Anggota','EQUITY'),
 ('3-2000','Cadangan Koperasi','EQUITY'),
 ('4-1100','Penjualan Hasil Panen','REVENUE'),
 ('4-1200','Pendapatan Penjualan Saprotan','REVENUE'),
 ('4-1300','Retur Penjualan','REVENUE'),
 ('5-1100','HPP Hasil Panen','EXPENSE'),
 ('5-1200','HPP Saprotan','EXPENSE'),
 ('5-1300','Selisih Persediaan','EXPENSE'),
 ('6-1100','Beban Listrik & Air','EXPENSE'),
 ('6-1200','Beban Transportasi','EXPENSE'),
 ('6-1300','Beban Gaji & Honor','EXPENSE'),
 ('6-1400','Beban Pemeliharaan','EXPENSE'),
 ('6-1900','Beban Operasional Lain','EXPENSE')
ON CONFLICT (code) DO NOTHING;

-- 9.5 Periode akuntansi tahun berjalan (dan tahun sebelumnya/berikutnya)
INSERT INTO accounting_periods (year, month)
SELECT y::smallint, m::smallint
FROM (VALUES (2025), (2026), (2027)) years(y)
CROSS JOIN generate_series(1,12) m
ON CONFLICT (year, month) DO NOTHING;

-- 9.6 Gudang
INSERT INTO warehouses (code, name, location, type) VALUES
 ('GD-SAP','Gudang Saprotan','Kantor Pusat','SAPROTAN'),
 ('GD-MTH','Gudang Panen Mentah (Curah)','Area Penimbangan','PANEN_MENTAH'),
 ('GD-JADI','Gudang Barang Jadi','Ruang Berpendingin','BARANG_JADI'),
 ('GD-LMB','Gudang Limbah & Kompos','Area Belakang','LIMBAH')
ON CONFLICT (code) DO NOTHING;

-- 9.7 Kategori, Grade & Produk
INSERT INTO product_categories (name, grading_criteria, shelf_life_days, expiry_warning_days) VALUES
 ('Sayuran', '{"kriteria":["kesegaran","ukuran","cacat fisik"]}', 5, 2),
 ('Tanaman Pangan', '{"kriteria":["kadar air","butir patah","kebersihan"]}', 180, 14),
 ('Buah', '{"kriteria":["kematangan","ukuran","cacat kulit"]}', 7, 2)
ON CONFLICT (name) DO NOTHING;

INSERT INTO grade_definitions (category_id, code, name, is_reject, sort_order)
SELECT c.id, g.code, g.name, g.is_reject, g.sort_order
FROM product_categories c
JOIN (VALUES
 ('Sayuran', 'A', 'Grade A (Super)', false, 1),
 ('Sayuran', 'B', 'Grade B (Pasar Tradisional)', false, 2),
 ('Sayuran', 'AFKIR', 'Afkir (Reject/Limbah)', true, 3),
 ('Tanaman Pangan', 'Premium', 'Premium (Pecah <5%)', false, 1),
 ('Tanaman Pangan', 'Medium', 'Medium (Pecah 5-15%)', false, 2),
 ('Tanaman Pangan', 'AFKIR', 'Afkir (Kutu/Patah Tinggi)', true, 3),
 ('Buah', 'A', 'Grade A (Super Export)', false, 1),
 ('Buah', 'B', 'Grade B (Lokal)', false, 2),
 ('Buah', 'AFKIR', 'Afkir (Busuk/Cacat)', true, 3)
) g(cat, code, name, is_reject, sort_order) ON g.cat = c.name
ON CONFLICT (category_id, code) DO NOTHING;

INSERT INTO products (code, name, category_id)
SELECT p.code, p.name, c.id FROM (VALUES
 ('CABAI','Cabai','Sayuran'),
 ('BERAS','Beras','Tanaman Pangan'),
 ('PISANG','Pisang','Buah')
) p(code, name, cat) JOIN product_categories c ON c.name = p.cat
ON CONFLICT (code) DO NOTHING;

-- 9.8 Saprotan (URS §8.1)
INSERT INTO saprotan_items (code, name, type, uom, purchase_price, member_price, min_stock) VALUES
 ('SPT-00001','Benih Cabai','BENIH','Pak',150000,165000,0),
 ('SPT-00002','Pupuk NPK','PUPUK_KIMIA','kg',12000,13000,500),
 ('SPT-00003','Pupuk Organik','PUPUK_ORGANIK','kg',4000,4500,500),
 ('SPT-00004','Karung Kemasan 50kg','KEMASAN','Pcs',2500,2500,100)
ON CONFLICT (code) DO NOTHING;

-- 9.9 Harga skenario cabai (SRS 6.2): beli A 38.000 / B 30.000; jual (RETAIL) 46.000 / 36.000
INSERT INTO purchase_prices (product_id, grade_id, price, valid_from, note)
SELECT p.id, g.id, v.price, DATE '2026-01-01', 'Harga awal'
FROM (VALUES ('A',38000),('B',30000),('AFKIR',0)) v(code, price)
JOIN products p ON p.code = 'CABAI'
JOIN grade_definitions g ON g.category_id = p.category_id AND g.code = v.code
WHERE NOT EXISTS (
  SELECT 1 FROM purchase_prices pp WHERE pp.product_id = p.id AND pp.grade_id = g.id AND pp.valid_from = DATE '2026-01-01'
);

INSERT INTO sales_prices (product_id, grade_id, segment, price, valid_from, note)
SELECT p.id, g.id, v.seg, v.price, DATE '2026-01-01', 'Harga awal'
FROM (VALUES ('A','KONSUMEN',48000),('A','RETAIL',46000),('A','PASAR_MODERN',44000),
             ('B','KONSUMEN',38000),('B','RETAIL',36000),('B','PASAR_MODERN',34000),
             ('AFKIR','KONSUMEN',0),('AFKIR','RETAIL',0),('AFKIR','PASAR_MODERN',0)) v(code, seg, price)
JOIN products p ON p.code = 'CABAI'
JOIN grade_definitions g ON g.category_id = p.category_id AND g.code = v.code
WHERE NOT EXISTS (
  SELECT 1 FROM sales_prices sp WHERE sp.product_id = p.id AND sp.grade_id = g.id AND sp.segment = v.seg AND sp.valid_from = DATE '2026-01-01'
);

-- 9.10 Pengaturan sistem (konfigurasi tanpa deploy ulang)
INSERT INTO system_settings (key, value, description) VALUES
 ('member.payment_term_days','7','Jatuh tempo hutang anggota (hari)'),
 ('supplier.payment_term_days','14','Jatuh tempo hutang supplier (hari)'),
 ('mfg.require_qc_pass','true','Sortasi wajib punya QC lolos sebelum POST'),
 ('mfg.allow_partial','true','Izinkan sortasi sebagian berat batch'),
 ('shu.formula','{"cadangan":40,"jasa_usaha_anggota":40,"pengurus":10,"pendidikan":5,"sosial":5}','Pembagian SHU (%)'),
 ('esg.emission_factor_kg_per_ton_km','0.1','Faktor emisi transportasi (kg CO2/ton-km)'),
 ('scale.max_kg','5000','Batas atas bobot timbangan valid'),
 ('tare.wet_percent.CABAI','0','Potongan tara basah cabai (%) — TBDURS01'),
 ('label.barcode_type','"QR"','Jenis barcode label batch — TBDURS03')
ON CONFLICT (key) DO NOTHING;

