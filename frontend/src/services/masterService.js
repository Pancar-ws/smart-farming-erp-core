import { todayISODate } from '../utils/formatters'
import { ApiError, apiRequest } from './apiClient'
import { getMockDB, saveMockDB } from './mockData'

/**
 * Service Master Data & Keanggotaan (Fitur 1 - Tugas Rani)
 * Kontrak Backend (/api/v1/master/*):
 * - GET/POST/PATCH /master/members & GET /master/members/{id}/summary
 * - GET/POST /master/saprotan (+GET /inventory/saprotan untuk saldo stok per gudang)
 * - GET/POST /master/customers
 * - GET/POST /master/products, /master/categories, /master/categories/{id}/grades
 * - GET/POST /master/sales-prices, /master/purchase-prices
 */

// ==================== 1. PETANI ANGGOTA (MEMBERS) ====================

export async function fetchMembersApi({ status = '', q = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (q) params.set('q', q)
  const qs = params.toString() ? `?${params.toString()}` : ''

  return apiRequest(`/master/members${qs}`, { method: 'GET' }, async () => {
    const db = getMockDB()
    let list = [...(db.members || [])]
    if (status) {
      list = list.filter((m) => m.status === status)
    }
    if (q) {
      const keyword = q.toLowerCase()
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(keyword) ||
          m.member_code.toLowerCase().includes(keyword) ||
          (m.nik && m.nik.includes(keyword))
      )
    }
    return list.sort((a, b) => b.id - a.id)
  })
}

export async function createMemberApi(payload) {
  return apiRequest(
    '/master/members',
    { method: 'POST', body: payload },
    async () => {
      const db = getMockDB()
      const cleanNik = String(payload.nik || '').trim()
      if (!/^\d{16}$/.test(cleanNik)) {
        throw new ApiError('NIK harus terdiri dari 16 digit angka valid', 422, 'VALIDATION_ERROR')
      }
      if (db.members.some((m) => m.nik === cleanNik)) {
        throw new ApiError('NIK sudah terdaftar pada anggota lain', 409, 'DUPLICATE', { field: 'nik' })
      }
      if (Number(payload.area_ha) <= 0) {
        throw new ApiError('Luas lahan harus lebih besar dari 0 hektare', 422, 'VALIDATION_ERROR')
      }

      const nextId = db.members.reduce((max, m) => Math.max(max, m.id), 0) + 1
      const nextCode = `AGT-${String(nextId).padStart(5, '0')}`
      const newMember = {
        id: nextId,
        member_code: nextCode,
        nik: cleanNik,
        name: payload.name.trim(),
        address: payload.address || '',
        area_ha: Number(payload.area_ha),
        main_commodity: payload.main_commodity,
        phone: payload.phone || '',
        status: payload.status || 'AKTIF',
        joined_at: payload.joined_at || todayISODate(),
      }
      db.members.push(newMember)
      saveMockDB(db)
      return newMember
    }
  )
}

export async function updateMemberApi(memberId, payload) {
  return apiRequest(
    `/master/members/${memberId}`,
    { method: 'PATCH', body: payload },
    async () => {
      const db = getMockDB()
      const idx = db.members.findIndex((m) => m.id === Number(memberId))
      if (idx === -1) {
        throw new ApiError('Anggota tidak ditemukan', 404, 'NOT_FOUND')
      }
      if (payload.area_ha !== undefined && Number(payload.area_ha) <= 0) {
        throw new ApiError('Luas lahan harus lebih besar dari 0 hektare', 422, 'VALIDATION_ERROR')
      }
      db.members[idx] = {
        ...db.members[idx],
        ...payload,
        area_ha: payload.area_ha !== undefined ? Number(payload.area_ha) : db.members[idx].area_ha,
      }
      saveMockDB(db)
      return db.members[idx]
    }
  )
}

export async function fetchMemberSummaryApi(memberId) {
  return apiRequest(`/master/members/${memberId}/summary`, { method: 'GET' }, async () => {
    const db = getMockDB()
    const member = db.members.find((m) => m.id === Number(memberId))
    if (!member) {
      throw new ApiError('Anggota tidak ditemukan', 404, 'NOT_FOUND')
    }
    // Contoh simulasi riwayat setoran panen & rekap hutang/piutang sesuai URS-MBR-003 & URS-MBR-004
    const sampleDeposits =
      member.id === 1
        ? [
            { received_at: '2026-11-10T08:30:00+07:00', batch_code: 'BCH-20261110-001', product_id: 1, product_name: 'Cabai Rawit Merah', net_kg: '1000.00' },
            { received_at: '2026-11-02T09:10:00+07:00', batch_code: 'BCH-20261102-003', product_id: 1, product_name: 'Cabai Rawit Merah', net_kg: '650.00' },
          ]
        : member.id === 2
          ? [
              { received_at: '2026-11-05T10:00:00+07:00', batch_code: 'BCH-20261105-002', product_id: 2, product_name: 'Beras Ciherang', net_kg: '2000.00' },
            ]
          : [
              { received_at: '2026-11-12T09:15:00+07:00', batch_code: `BCH-20261112-00${member.id}`, product_id: 1, product_name: member.main_commodity, net_kg: '800.00' },
            ]

    return {
      member: {
        id: member.id,
        code: member.member_code,
        name: member.name,
        status: member.status,
      },
      deposits: sampleDeposits,
      payable_total: member.id === 1 ? '32600000' : '22170000',
      paid_total: member.id === 1 ? '20000000' : '22170000',
      saprotan_outstanding: member.id === 1 ? '1450000' : '0',
    }
  })
}

// ==================== 2. MASTER SAPROTAN ====================

export async function fetchSaprotanApi() {
  return apiRequest('/master/saprotan', { method: 'GET' }, async () => {
    const db = getMockDB()
    return [...(db.saprotan || [])].sort((a, b) => a.id - b.id)
  })
}

export async function fetchSaprotanStockViewApi() {
  return apiRequest('/inventory/saprotan', { method: 'GET' }, async () => {
    const db = getMockDB()
    return (db.saprotan || []).map((s) => ({
      saprotan_id: s.id,
      code: s.code,
      name: s.name,
      type: s.type,
      warehouse: s.warehouse || 'Gudang Saprotan',
      qty_on_hand: s.qty_on_hand ?? 0,
      min_stock: s.min_stock ?? 0,
      below_minimum: Number(s.qty_on_hand ?? 0) <= Number(s.min_stock ?? 0),
    }))
  })
}

export async function createSaprotanApi(payload) {
  return apiRequest(
    '/master/saprotan',
    { method: 'POST', body: payload },
    async () => {
      const db = getMockDB()
      const cleanCode = String(payload.code || '').trim().toUpperCase()
      if (db.saprotan.some((s) => s.code.toUpperCase() === cleanCode)) {
        throw new ApiError('Kode saprotan sudah digunakan', 409, 'DUPLICATE')
      }
      const nextId = db.saprotan.reduce((max, s) => Math.max(max, s.id), 0) + 1
      const item = {
        id: nextId,
        code: cleanCode,
        name: payload.name.trim(),
        type: payload.type,
        uom: payload.uom.trim(),
        purchase_price: Number(payload.purchase_price || 0),
        member_price: Number(payload.member_price || 0),
        min_stock: Number(payload.min_stock || 0),
        qty_on_hand: Number(payload.qty_on_hand ?? 0),
        warehouse: 'Gudang Saprotan',
        is_active: true,
      }
      db.saprotan.push(item)
      saveMockDB(db)
      return item
    }
  )
}

/**
 * TODO: Di backend (app/modules/master/router.py) saat ini baru tersedia GET & POST /master/saprotan.
 * Fungsi update ini tetap mencoba PATCH /master/saprotan/{id} dan fallback ke state lokal.
 */
export async function updateSaprotanApi(saprotanId, payload) {
  return apiRequest(
    `/master/saprotan/${saprotanId}`,
    { method: 'PATCH', body: payload },
    async () => {
      const db = getMockDB()
      const idx = db.saprotan.findIndex((s) => s.id === Number(saprotanId))
      if (idx === -1) throw new ApiError('Item saprotan tidak ditemukan', 404, 'NOT_FOUND')
      db.saprotan[idx] = {
        ...db.saprotan[idx],
        ...payload,
        purchase_price: Number(payload.purchase_price ?? db.saprotan[idx].purchase_price),
        member_price: Number(payload.member_price ?? db.saprotan[idx].member_price),
        min_stock: Number(payload.min_stock ?? db.saprotan[idx].min_stock),
      }
      saveMockDB(db)
      return db.saprotan[idx]
    }
  )
}

// ==================== 3. DIREKTORI PELANGGAN (CUSTOMERS) ====================

export async function fetchCustomersApi() {
  return apiRequest('/master/customers', { method: 'GET' }, async () => {
    const db = getMockDB()
    return [...(db.customers || [])].sort((a, b) => a.id - b.id)
  })
}

export async function createCustomerApi(payload) {
  return apiRequest(
    '/master/customers',
    { method: 'POST', body: payload },
    async () => {
      const db = getMockDB()
      const cleanCode = String(payload.code || '').trim().toUpperCase()
      if (db.customers.some((c) => c.code.toUpperCase() === cleanCode)) {
        throw new ApiError('Kode pelanggan sudah digunakan', 409, 'DUPLICATE')
      }
      const nextId = db.customers.reduce((max, c) => Math.max(max, c.id), 0) + 1
      const cust = {
        id: nextId,
        code: cleanCode,
        name: payload.name.trim(),
        segment: payload.segment,
        address: payload.address || '',
        phone: payload.phone || '',
        payment_term_days: Number(payload.payment_term_days || 0),
        is_active: true,
      }
      db.customers.push(cust)
      saveMockDB(db)
      return cust
    }
  )
}

/**
 * TODO: Di backend (app/modules/master/router.py) saat ini baru tersedia GET & POST /master/customers.
 * Fungsi update ini mencoba PATCH /master/customers/{id} dan fallback ke state lokal.
 */
export async function updateCustomerApi(customerId, payload) {
  return apiRequest(
    `/master/customers/${customerId}`,
    { method: 'PATCH', body: payload },
    async () => {
      const db = getMockDB()
      const idx = db.customers.findIndex((c) => c.id === Number(customerId))
      if (idx === -1) throw new ApiError('Pelanggan tidak ditemukan', 404, 'NOT_FOUND')
      db.customers[idx] = {
        ...db.customers[idx],
        ...payload,
        payment_term_days: Number(payload.payment_term_days ?? db.customers[idx].payment_term_days),
      }
      saveMockDB(db)
      return db.customers[idx]
    }
  )
}

// ==================== 4. PRODUK, KATEGORI, GRADE & HARGA BERTINGKAT ====================

export async function fetchCategoriesApi() {
  return apiRequest('/master/categories', { method: 'GET' }, async () => {
    const db = getMockDB()
    return db.categories || []
  })
}

export async function fetchGradesByCategoryApi(categoryId) {
  return apiRequest(`/master/categories/${categoryId}/grades`, { method: 'GET' }, async () => {
    const db = getMockDB()
    return (db.grades || [])
      .filter((g) => g.category_id === Number(categoryId))
      .sort((a, b) => a.sort_order - b.sort_order)
  })
}

export async function fetchProductsApi() {
  return apiRequest('/master/products', { method: 'GET' }, async () => {
    const db = getMockDB()
    return db.products || []
  })
}

export async function fetchSalesPricesApi({ productId, segment } = {}) {
  const params = new URLSearchParams()
  if (productId) params.set('product_id', productId)
  if (segment) params.set('segment', segment)
  const qs = params.toString() ? `?${params.toString()}` : ''

  return apiRequest(`/master/sales-prices${qs}`, { method: 'GET' }, async () => {
    const db = getMockDB()
    let list = [...(db.salesPrices || [])]
    if (productId) list = list.filter((sp) => sp.product_id === Number(productId))
    if (segment) list = list.filter((sp) => sp.segment === segment)
    return list.sort((a, b) => b.valid_from.localeCompare(a.valid_from) || b.id - a.id)
  })
}

export async function createSalesPriceApi(payload) {
  return apiRequest('/master/sales-prices', { method: 'POST', body: payload }, async () => {
    const db = getMockDB()
    const grade = (db.grades || []).find((g) => g.id === Number(payload.grade_id))
    if (grade?.is_reject && Number(payload.price) !== 0) {
      throw new ApiError('Harga grade Afkir wajib bernilai Rp0 (Zero Value Rule)', 422, 'REJECT_PRICE')
    }
    const nextId = (db.salesPrices || []).reduce((max, p) => Math.max(max, p.id), 0) + 1
    const rec = {
      id: nextId,
      product_id: Number(payload.product_id),
      grade_id: Number(payload.grade_id),
      segment: payload.segment,
      price: Number(payload.price),
      valid_from: payload.valid_from || todayISODate(),
      note: payload.note || '',
    }
    db.salesPrices.unshift(rec)
    saveMockDB(db)
    return rec
  })
}

export async function fetchPurchasePricesApi(productId) {
  const qs = productId ? `?product_id=${productId}` : ''
  return apiRequest(`/master/purchase-prices${qs}`, { method: 'GET' }, async () => {
    const db = getMockDB()
    let list = [...(db.purchasePrices || [])]
    if (productId) list = list.filter((pp) => pp.product_id === Number(productId))
    return list.sort((a, b) => b.valid_from.localeCompare(a.valid_from) || b.id - a.id)
  })
}
