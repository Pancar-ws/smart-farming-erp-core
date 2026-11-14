/**
 * TODO: Data mock terisolasi ini digunakan sebagai fallback otomatis apabila
 * server backend FastAPI (http://localhost:8000) belum dijalankan.
 * Seluruh struktur field, tipe enum, dan angka simulasi disesuaikan 100%
 * dengan sql/011_seed_reference.sql, app/seed/run_seed.py, serta URS Bagian 8.1.
 */

const STORAGE_KEY = 'erp_smart_farming_mock_db_v1'

const INITIAL_MOCK_DB = {
  categories: [
    {
      id: 1,
      name: 'Sayuran',
      grading_criteria: { kriteria: ['kesegaran', 'ukuran', 'cacat fisik'] },
      shelf_life_days: 5,
      expiry_warning_days: 2,
    },
    {
      id: 2,
      name: 'Tanaman Pangan',
      grading_criteria: { kriteria: ['kadar air', 'butir patah', 'kebersihan'] },
      shelf_life_days: 180,
      expiry_warning_days: 14,
    },
    {
      id: 3,
      name: 'Buah',
      grading_criteria: { kriteria: ['kematangan', 'ukuran', 'cacat kulit'] },
      shelf_life_days: 7,
      expiry_warning_days: 2,
    },
  ],
  grades: [
    { id: 1, category_id: 1, code: 'A', name: 'Grade A (Super)', is_reject: false, sort_order: 1, is_active: true },
    { id: 2, category_id: 1, code: 'B', name: 'Grade B (Pasar Tradisional)', is_reject: false, sort_order: 2, is_active: true },
    { id: 3, category_id: 1, code: 'AFKIR', name: 'Afkir (Reject/Limbah)', is_reject: true, sort_order: 3, is_active: true },
    { id: 4, category_id: 2, code: 'Premium', name: 'Premium (Pecah <5%)', is_reject: false, sort_order: 1, is_active: true },
    { id: 5, category_id: 2, code: 'Medium', name: 'Medium (Pecah 5-15%)', is_reject: false, sort_order: 2, is_active: true },
    { id: 6, category_id: 2, code: 'AFKIR', name: 'Afkir (Kutu/Patah Tinggi)', is_reject: true, sort_order: 3, is_active: true },
    { id: 7, category_id: 3, code: 'A', name: 'Grade A (Super Export)', is_reject: false, sort_order: 1, is_active: true },
    { id: 8, category_id: 3, code: 'B', name: 'Grade B (Lokal)', is_reject: false, sort_order: 2, is_active: true },
    { id: 9, category_id: 3, code: 'AFKIR', name: 'Afkir (Busuk/Cacat)', is_reject: true, sort_order: 3, is_active: true },
  ],
  products: [
    { id: 1, code: 'CABAI', name: 'Cabai Rawit Merah', category_id: 1, uom: 'kg', is_active: true },
    { id: 2, code: 'BERAS', name: 'Beras Ciherang', category_id: 2, uom: 'kg', is_active: true },
    { id: 3, code: 'PISANG', name: 'Pisang Cavendish', category_id: 3, uom: 'kg', is_active: true },
  ],
  purchasePrices: [
    { id: 1, product_id: 1, grade_id: 1, price: 38000, valid_from: '2026-01-01', note: 'Harga beli Cabai Grade A' },
    { id: 2, product_id: 1, grade_id: 2, price: 30000, valid_from: '2026-01-01', note: 'Harga beli Cabai Grade B' },
    { id: 3, product_id: 1, grade_id: 3, price: 0, valid_from: '2026-01-01', note: 'Afkir Rp0' },
    { id: 4, product_id: 2, grade_id: 4, price: 11500, valid_from: '2026-01-01', note: 'Harga beli Beras Premium' },
    { id: 5, product_id: 2, grade_id: 5, price: 9800, valid_from: '2026-01-01', note: 'Harga beli Beras Medium' },
    { id: 6, product_id: 3, grade_id: 7, price: 9000, valid_from: '2026-01-01', note: 'Harga beli Pisang Grade A' },
    { id: 7, product_id: 3, grade_id: 8, price: 6500, valid_from: '2026-01-01', note: 'Harga beli Pisang Grade B' },
  ],
  salesPrices: [
    // Cabai Grade A
    { id: 1, product_id: 1, grade_id: 1, segment: 'KONSUMEN', price: 48000, valid_from: '2026-01-01', note: 'Harga eceran konsumen langsung' },
    { id: 2, product_id: 1, grade_id: 1, segment: 'RETAIL', price: 46000, valid_from: '2026-01-01', note: 'Harga segmen retail/toko' },
    { id: 3, product_id: 1, grade_id: 1, segment: 'PASAR_MODERN', price: 44000, valid_from: '2026-01-01', note: 'Harga kontrak supermarket' },
    // Cabai Grade B
    { id: 4, product_id: 1, grade_id: 2, segment: 'KONSUMEN', price: 38000, valid_from: '2026-01-01', note: 'Harga eceran Grade B' },
    { id: 5, product_id: 1, grade_id: 2, segment: 'RETAIL', price: 36000, valid_from: '2026-01-01', note: 'Harga retail Grade B' },
    { id: 6, product_id: 1, grade_id: 2, segment: 'PASAR_MODERN', price: 34000, valid_from: '2026-01-01', note: 'Harga grosir modern Grade B' },
    // Beras Premium
    { id: 7, product_id: 2, grade_id: 4, segment: 'KONSUMEN', price: 14500, valid_from: '2026-01-01', note: 'Harga eceran Beras Premium' },
    { id: 8, product_id: 2, grade_id: 4, segment: 'RETAIL', price: 13800, valid_from: '2026-01-01', note: 'Harga toko/warung Beras Premium' },
    { id: 9, product_id: 2, grade_id: 4, segment: 'PASAR_MODERN', price: 13500, valid_from: '2026-01-01', note: 'Harga supermarket Beras Premium' },
    // Beras Medium
    { id: 10, product_id: 2, grade_id: 5, segment: 'KONSUMEN', price: 12500, valid_from: '2026-01-01', note: 'Harga eceran Beras Medium' },
    { id: 11, product_id: 2, grade_id: 5, segment: 'RETAIL', price: 11800, valid_from: '2026-01-01', note: 'Harga retail Beras Medium' },
    { id: 12, product_id: 2, grade_id: 5, segment: 'PASAR_MODERN', price: 11500, valid_from: '2026-01-01', note: 'Harga pasar modern Beras Medium' },
    // Pisang Grade A
    { id: 13, product_id: 3, grade_id: 7, segment: 'KONSUMEN', price: 13000, valid_from: '2026-01-01', note: 'Harga konsumen Pisang Grade A' },
    { id: 14, product_id: 3, grade_id: 7, segment: 'RETAIL', price: 12000, valid_from: '2026-01-01', note: 'Harga retail Pisang Grade A' },
    { id: 15, product_id: 3, grade_id: 7, segment: 'PASAR_MODERN', price: 11500, valid_from: '2026-01-01', note: 'Harga supermarket Pisang Grade A' },
    // Pisang Grade B
    { id: 16, product_id: 3, grade_id: 8, segment: 'KONSUMEN', price: 9500, valid_from: '2026-01-01', note: 'Harga konsumen Pisang Grade B' },
    { id: 17, product_id: 3, grade_id: 8, segment: 'RETAIL', price: 8800, valid_from: '2026-01-01', note: 'Harga retail Pisang Grade B' },
    { id: 18, product_id: 3, grade_id: 8, segment: 'PASAR_MODERN', price: 8200, valid_from: '2026-01-01', note: 'Harga pasar modern Pisang Grade B' },
  ],
  saprotan: [
    {
      id: 1,
      code: 'SPT-00001',
      name: 'Benih Cabai Hibrida Unggul',
      type: 'BENIH',
      uom: 'Pak',
      purchase_price: 150000,
      member_price: 165000,
      min_stock: 20,
      qty_on_hand: 85,
      warehouse: 'Gudang Saprotan',
      is_active: true,
    },
    {
      id: 2,
      code: 'SPT-00002',
      name: 'Pupuk NPK Phonska 15-15-15',
      type: 'PUPUK_KIMIA',
      uom: 'kg',
      purchase_price: 12000,
      member_price: 13000,
      min_stock: 500,
      qty_on_hand: 420, // Di bawah 500 kg -> memicu peringatan ROP (UAT-02)
      warehouse: 'Gudang Saprotan',
      is_active: true,
    },
    {
      id: 3,
      code: 'SPT-00003',
      name: 'Pupuk Organik Granul Kompos',
      type: 'PUPUK_ORGANIK',
      uom: 'kg',
      purchase_price: 4000,
      member_price: 4500,
      min_stock: 500,
      qty_on_hand: 1250,
      warehouse: 'Gudang Saprotan',
      is_active: true,
    },
    {
      id: 4,
      code: 'SPT-00004',
      name: 'Karung Kemasan Pangan 50kg',
      type: 'KEMASAN',
      uom: 'Pcs',
      purchase_price: 2500,
      member_price: 2500,
      min_stock: 100,
      qty_on_hand: 340,
      warehouse: 'Gudang Saprotan',
      is_active: true,
    },
  ],
  customers: [
    {
      id: 1,
      code: 'CUST-001',
      name: 'Supermarket Segarindo & Pasar Induk',
      segment: 'PASAR_MODERN',
      address: 'Jl. Raya Kramat Jati No. 18, Jakarta Timur',
      phone: '081234567801',
      payment_term_days: 30,
      is_active: true,
    },
    {
      id: 2,
      code: 'CUST-002',
      name: 'Toko Sayur Segar Jaya',
      segment: 'RETAIL',
      address: 'Pasar Manis Blok B-12, Purwokerto',
      phone: '081234567802',
      payment_term_days: 14,
      is_active: true,
    },
    {
      id: 3,
      code: 'CUST-003',
      name: 'Warung & Katering Bu Siti',
      segment: 'KONSUMEN',
      address: 'Jl. Kalimanah Raya No. 45, Purbalingga',
      phone: '081234567803',
      payment_term_days: 0,
      is_active: true,
    },
    {
      id: 4,
      code: 'CUST-004',
      name: 'PT Ritel Pangan Nusantara (Hypermart)',
      segment: 'PASAR_MODERN',
      address: 'Kawasan Industri Pulogadung, Jakarta',
      phone: '081298765404',
      payment_term_days: 30,
      is_active: true,
    },
    {
      id: 5,
      code: 'CUST-005',
      name: 'UD Berkah Tani Retail',
      segment: 'RETAIL',
      address: 'Jl. Jend. Sudirman No. 88, Sokaraja',
      phone: '081345678905',
      payment_term_days: 7,
      is_active: true,
    },
  ],
  members: [
    {
      id: 1,
      member_code: 'AGT-00001',
      nik: '3303011205850001',
      name: 'Slamet Riyadi',
      address: 'Desa Karangreja RT 02/01, Kutasari, Purbalingga',
      area_ha: 1.5,
      main_commodity: 'Hortikultura Sayur',
      phone: '081327001101',
      status: 'AKTIF',
      joined_at: '2025-02-10',
    },
    {
      id: 2,
      member_code: 'AGT-00002',
      nik: '3303012408800002',
      name: 'Siti Aminah',
      address: 'Desa Munjul RT 04/02, Kutasari, Purbalingga',
      area_ha: 2.25,
      main_commodity: 'Pangan',
      phone: '081327001102',
      status: 'AKTIF',
      joined_at: '2025-02-14',
    },
    {
      id: 3,
      member_code: 'AGT-00003',
      nik: '3303021903790003',
      name: 'Bambang Sutrisno',
      address: 'Desa Serang RT 01/03, Karangreja, Purbalingga',
      area_ha: 1.2,
      main_commodity: 'Hortikultura Sayur',
      phone: '081327001103',
      status: 'AKTIF',
      joined_at: '2025-03-01',
    },
    {
      id: 4,
      member_code: 'AGT-00004',
      nik: '3303030511880004',
      name: 'Wahyu Hidayat',
      address: 'Desa Bobotsari RT 03/05, Purbalingga',
      area_ha: 1.8,
      main_commodity: 'Buah',
      phone: '081327001104',
      status: 'AKTIF',
      joined_at: '2025-03-18',
    },
    {
      id: 5,
      member_code: 'AGT-00005',
      nik: '3303041507760005',
      name: 'Haryono Sukandar',
      address: 'Desa Padamara RT 02/04, Purbalingga',
      area_ha: 3.0,
      main_commodity: 'Pangan',
      phone: '081327001105',
      status: 'AKTIF',
      joined_at: '2025-04-05',
    },
    {
      id: 6,
      member_code: 'AGT-00006',
      nik: '3303052109900006',
      name: 'Dewi Sartika Putri',
      address: 'Desa Kalimanah Wetan RT 01/02, Purbalingga',
      area_ha: 0.85,
      main_commodity: 'Hortikultura Sayur',
      phone: '081327001106',
      status: 'NON_AKTIF',
      joined_at: '2025-05-12',
    },
  ],
  warehouses: [
    { id: 1, code: 'GD-SAP', name: 'Gudang Saprotan', location: 'Kantor Pusat', type: 'SAPROTAN', is_active: true },
    { id: 2, code: 'GD-MTH', name: 'Gudang Panen Mentah (Curah)', location: 'Area Penimbangan', type: 'PANEN_MENTAH', is_active: true },
    { id: 3, code: 'GD-JADI', name: 'Gudang Barang Jadi', location: 'Ruang Berpendingin', type: 'BARANG_JADI', is_active: true },
    { id: 4, code: 'GD-LMB', name: 'Gudang Limbah & Kompos', location: 'Area Belakang', type: 'LIMBAH', is_active: true },
  ],
  // Lot barang jadi untuk simulasi Alokasi Batch FIFO (diurutkan dari tanggal tertua)
  inventoryLots: [
    {
      id: 101,
      stock_category: 'HASIL_SORTASI',
      warehouse_id: 3,
      saprotan_id: null,
      product_id: 1, // Cabai
      grade_id: 1,   // Grade A
      batch_code: 'BCH-20261110-001',
      member_name: 'Slamet Riyadi (AGT-00001)',
      qty_on_hand: 300,
      qty_reserved: 0,
      unit_cost: 38000,
      received_at: '2026-11-10T08:30:00+07:00',
      expiry_date: '2026-11-16',
    },
    {
      id: 102,
      stock_category: 'HASIL_SORTASI',
      warehouse_id: 3,
      saprotan_id: null,
      product_id: 1, // Cabai
      grade_id: 1,   // Grade A
      batch_code: 'BCH-20261112-004',
      member_name: 'Bambang Sutrisno (AGT-00003)',
      qty_on_hand: 400,
      qty_reserved: 0,
      unit_cost: 38000,
      received_at: '2026-11-12T09:15:00+07:00',
      expiry_date: '2026-11-18',
    },
    {
      id: 103,
      stock_category: 'HASIL_SORTASI',
      warehouse_id: 3,
      saprotan_id: null,
      product_id: 1, // Cabai
      grade_id: 2,   // Grade B
      batch_code: 'BCH-20261110-001',
      member_name: 'Slamet Riyadi (AGT-00001)',
      qty_on_hand: 200,
      qty_reserved: 0,
      unit_cost: 30000,
      received_at: '2026-11-10T08:30:00+07:00',
      expiry_date: '2026-11-16',
    },
    {
      id: 104,
      stock_category: 'HASIL_SORTASI',
      warehouse_id: 3,
      saprotan_id: null,
      product_id: 2, // Beras
      grade_id: 4,   // Premium
      batch_code: 'BCH-20261105-002',
      member_name: 'Siti Aminah (AGT-00002)',
      qty_on_hand: 1100,
      qty_reserved: 200,
      unit_cost: 11500,
      received_at: '2026-11-05T10:00:00+07:00',
      expiry_date: '2027-05-05',
    },
    {
      id: 105,
      stock_category: 'HASIL_SORTASI',
      warehouse_id: 3,
      saprotan_id: null,
      product_id: 2, // Beras
      grade_id: 4,   // Premium
      batch_code: 'BCH-20261111-007',
      member_name: 'Haryono Sukandar (AGT-00005)',
      qty_on_hand: 900,
      qty_reserved: 0,
      unit_cost: 11500,
      received_at: '2026-11-11T14:20:00+07:00',
      expiry_date: '2027-05-11',
    },
    {
      id: 106,
      stock_category: 'HASIL_SORTASI',
      warehouse_id: 3,
      saprotan_id: null,
      product_id: 2, // Beras
      grade_id: 5,   // Medium
      batch_code: 'BCH-20261105-002',
      member_name: 'Siti Aminah (AGT-00002)',
      qty_on_hand: 150,
      qty_reserved: 0,
      unit_cost: 9800,
      received_at: '2026-11-05T10:00:00+07:00',
      expiry_date: '2027-05-05',
    },
    {
      id: 107,
      stock_category: 'HASIL_SORTASI',
      warehouse_id: 3,
      saprotan_id: null,
      product_id: 3, // Pisang
      grade_id: 7,   // Grade A
      batch_code: 'BCH-20261113-009',
      member_name: 'Wahyu Hidayat (AGT-00004)',
      qty_on_hand: 560,
      qty_reserved: 0,
      unit_cost: 9000,
      received_at: '2026-11-13T11:00:00+07:00',
      expiry_date: '2026-11-20',
    },
    {
      id: 108,
      stock_category: 'HASIL_SORTASI',
      warehouse_id: 3,
      saprotan_id: null,
      product_id: 3, // Pisang
      grade_id: 8,   // Grade B
      batch_code: 'BCH-20261113-009',
      member_name: 'Wahyu Hidayat (AGT-00004)',
      qty_on_hand: 180,
      qty_reserved: 0,
      unit_cost: 6500,
      received_at: '2026-11-13T11:00:00+07:00',
      expiry_date: '2026-11-20',
    },
  ],
  salesOrders: [
    {
      id: 1,
      so_no: 'SO-202611-0001',
      customer_id: 2,
      customer_name: 'Toko Sayur Segar Jaya',
      segment: 'RETAIL',
      order_date: '2026-11-14',
      status: 'SHIPPED',
      total: 39400000,
      note: 'Pesanan Cabai (Grade A 700 kg + Grade B 200 kg)',
      do_no: 'DO-202611-0001',
      invoice_no: 'INV-202611-0001',
      lines: [
        {
          product_id: 1,
          product_name: 'Cabai Rawit Merah',
          grade_id: 1,
          grade_code: 'A',
          qty: 700,
          unit_price: 46000,
          allocations: [
            { batch_code: 'BCH-20261108-001', qty: 700, received_at: '2026-11-08T08:00:00+07:00' },
          ],
        },
        {
          product_id: 1,
          product_name: 'Cabai Rawit Merah',
          grade_id: 2,
          grade_code: 'B',
          qty: 200,
          unit_price: 36000,
          allocations: [
            { batch_code: 'BCH-20261108-001', qty: 200, received_at: '2026-11-08T08:00:00+07:00' },
          ],
        },
      ],
    },
  ],
  notifications: [
    {
      id: 1,
      type: 'ROP',
      severity: 'WARNING',
      message: 'Stok Pupuk NPK Phonska 420 kg berada di bawah batas minimum 500 kg.',
      payload: { saprotan_id: 2 },
      is_read: false,
      created_at: '2026-11-14T08:15:00+07:00',
    },
    {
      id: 2,
      type: 'EXPIRY',
      severity: 'INFO',
      message: 'Batch Cabai BCH-20261110-001 (300 kg Grade A) mendekati batas masa simpan.',
      payload: { batch_code: 'BCH-20261110-001' },
      is_read: false,
      created_at: '2026-11-14T09:00:00+07:00',
    },
  ],
  dashboardSummary: {
    panen_masuk_kg: 3800,
    antrean_sortasi: 3,
    item_di_bawah_minimum: 1,
    omset_hari_ini: 39400000,
  },
}

export function getMockDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DB))
      return structuredClone(INITIAL_MOCK_DB)
    }
    return JSON.parse(raw)
  } catch {
    return structuredClone(INITIAL_MOCK_DB)
  }
}

export function saveMockDB(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Abaikan jika storage penuh
  }
}

export function resetMockDB() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DB))
  return structuredClone(INITIAL_MOCK_DB)
}
