import { todayISODate } from '../utils/formatters'
import { ApiError, apiRequest } from './apiClient'
import { getMockDB, saveMockDB } from './mockData'

/**
 * Service Penjualan, Price Tiering & Alokasi Batch FIFO (Fitur 5 - Tugas Rani)
 * Kontrak Backend:
 * - GET  /api/v1/inventory/lots?category=HASIL_SORTASI -> daftar lot barang jadi
 * - GET  /api/v1/sales/orders
 * - POST /api/v1/sales/orders -> membuat SO, mengunci harga sesuai segmen pelanggan, & mereservasi lot FIFO
 * - POST /api/v1/sales/orders/{so_id}/ship -> menerbitkan Surat Jalan (DO) & Faktur (Invoice)
 * - POST /api/v1/sales/orders/{so_id}/cancel -> membatalkan SO & melepas reservasi stok
 */

const SELLABLE_CATEGORIES = ['HASIL_SORTASI', 'PRODUK_KEMASAN']

/**
 * Mengambil seluruh lot barang jadi yang siap dijual, diurutkan secara FIFO
 * berdasarkan `received_at` ASC (batch tertua di urutan paling atas), selaras
 * dengan InventoryService.allocate_fifo di backend.
 */
export async function fetchSellableLotsFIFOApi() {
  return apiRequest('/inventory/lots?category=HASIL_SORTASI', { method: 'GET' }, async () => {
    const db = getMockDB()
    return (db.inventoryLots || []).filter((lot) =>
      SELLABLE_CATEGORIES.includes(lot.stock_category)
    )
  }).then((lots) => {
    return (lots || [])
      .map((lot) => {
        const onHand = Number(lot.qty_on_hand || 0)
        const reserved = Number(lot.qty_reserved || 0)
        const available = Math.max(0, onHand - reserved)
        return {
          ...lot,
          qty_on_hand: onHand,
          qty_reserved: reserved,
          qty_available: available,
        }
      })
      .filter((lot) => lot.qty_available > 0)
      .sort((a, b) => {
        const timeDiff = new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
        return timeDiff !== 0 ? timeDiff : a.id - b.id
      })
  })
}

/**
 * Menghitung simulasi/preview alokasi batch FIFO di sisi klien (UI-SLS-01)
 * persis seperti algoritma InventoryService.allocate_fifo di backend.
 */
export function simulateFifoAllocation(lots, productId, gradeId, requestedQty) {
  const matchingLots = (lots || [])
    .filter(
      (l) =>
        Number(l.product_id) === Number(productId) &&
        Number(l.grade_id) === Number(gradeId) &&
        Number(l.qty_available) > 0
    )
    .sort((a, b) => {
      const t = new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
      return t !== 0 ? t : a.id - b.id
    })

  const totalAvailable = matchingLots.reduce((sum, l) => sum + Number(l.qty_available), 0)
  let remaining = Number(requestedQty || 0)
  const allocations = []

  for (const lot of matchingLots) {
    if (remaining <= 0) break
    const take = Math.min(Number(lot.qty_available), remaining)
    allocations.push({
      lot_id: lot.id,
      batch_code: lot.batch_code,
      received_at: lot.received_at,
      expiry_date: lot.expiry_date,
      qty_available: Number(lot.qty_available),
      qty_allocated: take,
      remaining_after: Number(lot.qty_available) - take,
    })
    remaining = Number((remaining - take).toFixed(3))
  }

  return {
    matchingLots,
    totalAvailable,
    allocations,
    shortfall: Math.max(0, remaining),
    isSufficient: Number(requestedQty || 0) <= totalAvailable,
  }
}

/**
 * Mencari harga efektif per produk, grade, segmen, dan tanggal pesanan
 * (selaras dengan app/modules/master/pricing.py -> effective_price).
 */
export function lookupEffectivePrice(salesPrices, productId, gradeId, segment, onDate) {
  if (!productId || !gradeId || !segment) return null
  const targetDate = onDate || todayISODate()

  const candidates = (salesPrices || [])
    .filter(
      (sp) =>
        Number(sp.product_id) === Number(productId) &&
        Number(sp.grade_id) === Number(gradeId) &&
        sp.segment === segment &&
        sp.valid_from <= targetDate
    )
    .sort((a, b) => b.valid_from.localeCompare(a.valid_from) || b.id - a.id)

  return candidates.length > 0 ? Number(candidates[0].price) : null
}

export async function fetchSalesOrdersApi() {
  return apiRequest('/sales/orders', { method: 'GET' }, async () => {
    const db = getMockDB()
    return [...(db.salesOrders || [])].sort((a, b) => b.id - a.id)
  })
}

export async function createSalesOrderApi(payload) {
  return apiRequest('/sales/orders', { method: 'POST', body: payload }, async () => {
    const db = getMockDB()
    const cust = (db.customers || []).find((c) => c.id === Number(payload.customer_id))
    if (!cust) {
      throw new ApiError('Pelanggan tidak ditemukan', 404, 'NOT_FOUND')
    }

    if (!payload.lines || payload.lines.length === 0) {
      throw new ApiError('Pesanan penjualan harus memiliki minimal 1 baris produk', 422, 'VALIDATION')
    }

    let orderTotal = 0
    const builtLines = []

    // Validasi harga dan alokasi FIFO untuk setiap baris pesanan
    for (const line of payload.lines) {
      const qty = Number(line.qty || 0)
      if (qty <= 0) {
        throw new ApiError('Kuantitas pesanan harus lebih besar dari 0 kg', 422, 'VALIDATION')
      }

      const price = lookupEffectivePrice(
        db.salesPrices,
        line.product_id,
        line.grade_id,
        cust.segment,
        payload.order_date
      )
      if (price === null) {
        throw new ApiError(
          `Harga belum diatur untuk produk/grade ini pada segmen ${cust.segment}`,
          422,
          'PRICE_NOT_FOUND'
        )
      }

      // Ambil lot barang jadi sesuai urutan FIFO (received_at ASC, id ASC)
      const availLots = (db.inventoryLots || [])
        .filter(
          (l) =>
            SELLABLE_CATEGORIES.includes(l.stock_category) &&
            Number(l.product_id) === Number(line.product_id) &&
            Number(l.grade_id) === Number(line.grade_id) &&
            Number(l.qty_on_hand) - Number(l.qty_reserved) > 0
        )
        .sort((a, b) => {
          const t = new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
          return t !== 0 ? t : a.id - b.id
        })

      let remaining = qty
      const lineAllocations = []

      for (const lot of availLots) {
        if (remaining <= 0) break
        const lotAvail = Number(lot.qty_on_hand) - Number(lot.qty_reserved)
        const take = Math.min(lotAvail, remaining)
        lot.qty_reserved = Number(lot.qty_reserved) + take
        lineAllocations.push({
          lot_id: lot.id,
          batch_code: lot.batch_code,
          qty: take,
          received_at: lot.received_at,
        })
        remaining = Number((remaining - take).toFixed(3))
      }

      if (remaining > 0) {
        throw new ApiError(
          'Jumlah pesanan melebihi stok yang tersedia di gudang',
          422,
          'INSUFFICIENT_STOCK',
          { requested: String(qty), available: String(qty - remaining) }
        )
      }

      const prod = (db.products || []).find((p) => p.id === Number(line.product_id))
      const grade = (db.grades || []).find((g) => g.id === Number(line.grade_id))

      builtLines.push({
        product_id: Number(line.product_id),
        product_name: prod?.name || `Produk #${line.product_id}`,
        grade_id: Number(line.grade_id),
        grade_code: grade?.code || `Grade #${line.grade_id}`,
        qty,
        unit_price: price,
        allocations: lineAllocations,
      })

      orderTotal += qty * price
    }

    const nextId = (db.salesOrders || []).reduce((max, o) => Math.max(max, o.id), 0) + 1
    const ym = (payload.order_date || todayISODate()).slice(0, 7).replace('-', '')
    const newSo = {
      id: nextId,
      so_no: `SO-${ym}-${String(nextId).padStart(4, '0')}`,
      customer_id: cust.id,
      customer_name: cust.name,
      segment: cust.segment,
      order_date: payload.order_date || todayISODate(),
      status: 'CONFIRMED',
      total: orderTotal,
      note: payload.note || '',
      lines: builtLines,
    }

    db.salesOrders.unshift(newSo)
    saveMockDB(db)
    return newSo
  })
}

export async function shipSalesOrderApi(soId, payload = { auto_invoice: true }) {
  return apiRequest(`/sales/orders/${soId}/ship`, { method: 'POST', body: payload }, async () => {
    const db = getMockDB()
    const so = (db.salesOrders || []).find((o) => o.id === Number(soId))
    if (!so) throw new ApiError('Sales Order tidak ditemukan', 404, 'NOT_FOUND')
    if (so.status !== 'CONFIRMED') {
      throw new ApiError('Hanya SO berstatus CONFIRMED yang dapat dikirim', 422, 'INVALID_STATE')
    }

    // Kurangi qty_on_hand & qty_reserved pada lot sesuai alokasi FIFO
    for (const ln of so.lines || []) {
      for (const al of ln.allocations || []) {
        const lot = (db.inventoryLots || []).find((l) => l.id === al.lot_id)
        if (lot) {
          lot.qty_on_hand = Math.max(0, Number(lot.qty_on_hand) - Number(al.qty))
          lot.qty_reserved = Math.max(0, Number(lot.qty_reserved) - Number(al.qty))
        }
      }
    }

    const ym = (so.order_date || todayISODate()).slice(0, 7).replace('-', '')
    const doNo = `DO-${ym}-${String(so.id).padStart(4, '0')}`
    const invNo = `INV-${ym}-${String(so.id).padStart(4, '0')}`

    so.status = 'SHIPPED'
    so.do_no = doNo
    so.invoice_no = invNo
    saveMockDB(db)

    return {
      delivery_order: { id: so.id, do_no: doNo, status: 'CONFIRMED' },
      invoice: { id: so.id, invoice_no: invNo, total: String(so.total) },
    }
  })
}

export async function cancelSalesOrderApi(soId) {
  return apiRequest(`/sales/orders/${soId}/cancel`, { method: 'POST' }, async () => {
    const db = getMockDB()
    const so = (db.salesOrders || []).find((o) => o.id === Number(soId))
    if (!so) throw new ApiError('Sales Order tidak ditemukan', 404, 'NOT_FOUND')
    if (so.status !== 'CONFIRMED') {
      throw new ApiError('Hanya SO CONFIRMED yang dapat dibatalkan', 422, 'INVALID_STATE')
    }

    // Lepaskan reservasi stok kembali ke lot asal
    for (const ln of so.lines || []) {
      for (const al of ln.allocations || []) {
        const lot = (db.inventoryLots || []).find((l) => l.id === al.lot_id)
        if (lot) {
          lot.qty_reserved = Math.max(0, Number(lot.qty_reserved) - Number(al.qty))
        }
      }
    }

    so.status = 'CANCELLED'
    saveMockDB(db)
    return { message: 'SO berhasil dibatalkan dan reservasi stok dilepas' }
  })
}
