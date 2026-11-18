import { ApiError, apiRequest, getStoredToken } from './apiClient'
import { getMockDB } from './mockData'

/**
 * Service Inventory & Manajemen Stok (Fitur 3 - Tugas Aufa)
 * Endpoint Backend (/api/v1/inventory/* & /api/v1/reporting/reports/*):
 * - GET /inventory/lots
 * - GET /inventory/saprotan
 * - GET /inventory/movements
 * - GET /inventory/alerts/rop
 * - GET /reporting/reports/finished-stock?format=xlsx
 * - GET /reporting/reports/saprotan-stock?format=xlsx
 */

export async function fetchInventoryLotsApi({ category = '', warehouse_id = null, batch_code = '' } = {}) {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (warehouse_id) params.set('warehouse_id', String(warehouse_id))
  if (batch_code) params.set('batch_code', batch_code)
  const qs = params.toString() ? `?${params.toString()}` : ''

  return apiRequest(`/inventory/lots${qs}`, { method: 'GET' }, async () => {
    const db = getMockDB()
    let list = db.lots || [
      {
        id: 1,
        stock_category: 'HASIL_SORTASI',
        warehouse_id: 3,
        product_id: 1,
        product_name: 'Cabai Rawit Merah',
        grade_id: 1,
        grade_name: 'Grade A (Super)',
        batch_code: 'BATCH-20261114-001',
        qty_on_hand: '700.00',
        qty_reserved: '0.00',
        qty_available: '700.00',
        unit_cost: '38000.00',
        received_at: '2026-11-14T08:30:00Z',
        expiry_date: '2026-11-19',
      },
      {
        id: 2,
        stock_category: 'HASIL_SORTASI',
        warehouse_id: 3,
        product_id: 1,
        product_name: 'Cabai Rawit Merah',
        grade_id: 2,
        grade_name: 'Grade B (Tradisional)',
        batch_code: 'BATCH-20261114-001',
        qty_on_hand: '200.00',
        qty_reserved: '0.00',
        qty_available: '200.00',
        unit_cost: '30000.00',
        received_at: '2026-11-14T08:30:00Z',
        expiry_date: '2026-11-19',
      },
      {
        id: 3,
        stock_category: 'PANEN_CURAH',
        warehouse_id: 2,
        product_id: 2,
        product_name: 'Beras Ciherang',
        grade_id: null,
        grade_name: 'Curah',
        batch_code: 'BATCH-20261115-002',
        qty_on_hand: '1500.00',
        qty_reserved: '0.00',
        qty_available: '1500.00',
        unit_cost: '11000.00',
        received_at: '2026-11-15T09:15:00Z',
        expiry_date: null,
      },
    ]
    return list
  })
}

export async function fetchFinishedStockReportApi() {
  return apiRequest('/reports/finished-stock', { method: 'GET' }, async () => {
    return [
      {
        product_id: 1,
        product: 'Cabai Rawit Merah',
        grade_id: 1,
        grade: 'Grade A (Super)',
        batch_code: 'BATCH-20261114-001',
        warehouse_id: 3,
        stock_category: 'HASIL_SORTASI',
        qty_on_hand: '700.00',
        qty_reserved: '0.00',
        qty_available: '700.00',
        unit_cost: '38000.00',
        received_at: '2026-11-14T08:30:00Z',
        expiry_date: '2026-11-19',
        days_left: 2,
      },
      {
        product_id: 1,
        product: 'Cabai Rawit Merah',
        grade_id: 2,
        grade: 'Grade B (Tradisional)',
        batch_code: 'BATCH-20261114-001',
        warehouse_id: 3,
        stock_category: 'HASIL_SORTASI',
        qty_on_hand: '200.00',
        qty_reserved: '0.00',
        qty_available: '200.00',
        unit_cost: '30000.00',
        received_at: '2026-11-14T08:30:00Z',
        expiry_date: '2026-11-19',
        days_left: 2,
      },
    ]
  })
}

export async function fetchSaprotanStockApi() {
  return apiRequest('/reports/saprotan-stock', { method: 'GET' }, async () => {
    return [
      {
        saprotan_id: 1,
        code: 'PUPUK-ORG-01',
        name: 'Pupuk Kompos Organik Super',
        type: 'PUPUK_ORGANIK',
        warehouse_id: 1,
        warehouse: 'Gudang Saprotan',
        qty_on_hand: '1250.00',
        min_stock: '500.00',
        below_minimum: false,
      },
      {
        saprotan_id: 2,
        code: 'PUPUK-KIM-01',
        name: 'Pupuk NPK Phonska Plus',
        type: 'PUPUK_KIMIA',
        warehouse_id: 1,
        warehouse: 'Gudang Saprotan',
        qty_on_hand: '420.00',
        min_stock: '500.00',
        below_minimum: true, // ROP triggered!
      },
      {
        saprotan_id: 3,
        code: 'BENIH-CBI-01',
        name: 'Benih Unggul Cabai Rawit Hibrida',
        type: 'BENIH',
        warehouse_id: 1,
        warehouse: 'Gudang Saprotan',
        qty_on_hand: '85.00',
        min_stock: '30.00',
        below_minimum: false,
      },
      {
        saprotan_id: 4,
        code: 'KMS-KRG-50',
        name: 'Karung Kemasan Khusus 50 kg',
        type: 'KEMASAN',
        warehouse_id: 1,
        warehouse: 'Gudang Saprotan',
        qty_on_hand: '15.00',
        min_stock: '50.00',
        below_minimum: true, // ROP triggered!
      },
    ]
  })
}

export async function downloadStockExcelApi(reportType = 'finished') {
  const token = getStoredToken()
  const endpoint =
    reportType === 'finished'
      ? '/api/v1/reports/finished-stock?format=xlsx'
      : '/api/v1/reports/saprotan-stock?format=xlsx'

  const res = await fetch(endpoint, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  })

  if (!res.ok) {
    throw new ApiError('Gagal mengunduh file Excel laporan stok dari server.', res.status)
  }

  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Laporan_Stok_${reportType === 'finished' ? 'Barang_Jadi' : 'Saprotan'}.xlsx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
