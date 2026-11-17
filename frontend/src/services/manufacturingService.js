import { todayISODate } from '../utils/formatters'
import { ApiError, apiRequest } from './apiClient'
import { getMockDB, saveMockDB } from './mockData'

/**
 * Service Manufacturing & Sortasi Mutu (Fitur 4 - Tugas Aufa & Caca)
 * Endpoint Backend (/api/v1/manufacturing/*):
 * - GET /manufacturing/sorting-orders
 * - POST /manufacturing/sorting-orders
 * - POST /manufacturing/sorting-orders/{id}/post
 */

export async function fetchSortingOrdersApi({ status = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  const qs = params.toString() ? `?${params.toString()}` : ''

  return apiRequest(`/manufacturing/sorting-orders${qs}`, { method: 'GET' }, async () => {
    const db = getMockDB()
    let list = db.sortingOrders || []
    if (status) {
      list = list.filter((o) => o.status === status)
    }
    return [...list].sort((a, b) => b.id - a.id)
  })
}

export async function createSortingOrderApi(payload) {
  return apiRequest(
    '/manufacturing/sorting-orders',
    {
      method: 'POST',
      body: payload,
    },
    async () => {
      const db = getMockDB()
      db.sortingOrders = db.sortingOrders || []

      // Mass balance check
      for (const inp of payload.inputs || []) {
        const totalOut = (inp.outputs || []).reduce((acc, cur) => acc + Number(cur.qty), 0)
        const diff = Math.abs(Number(inp.qty_input) - totalOut)
        if (diff > 0.001) {
          throw new ApiError(
            `Keseimbangan massa gagal: Total input (${inp.qty_input} kg) mutlak harus sama dengan total output (${totalOut} kg).`,
            422,
            'MASS_BALANCE_VIOLATION'
          )
        }
      }

      const id = db.sortingOrders.length + 1
      const todayStr = todayISODate().replace(/-/g, '')
      const newOrder = {
        id,
        order_no: `SRT-${todayStr}-${String(id).padStart(3, '0')}`,
        process_date: payload.process_date || todayISODate(),
        status: 'DRAFT',
        posted_at: null,
        posted_by: null,
        note: payload.note || null,
        inputs: payload.inputs,
      }

      db.sortingOrders.push(newOrder)
      saveMockDB(db)
      return newOrder
    }
  )
}

export async function postSortingOrderApi(orderId) {
  return apiRequest(
    `/manufacturing/sorting-orders/${orderId}/post`,
    {
      method: 'POST',
    },
    async () => {
      const db = getMockDB()
      db.sortingOrders = db.sortingOrders || []
      const order = db.sortingOrders.find((o) => o.id === Number(orderId))
      if (!order) {
        throw new ApiError('Order sortasi tidak ditemukan', 404)
      }
      order.status = 'POSTED'
      order.posted_at = new Date().toISOString()
      saveMockDB(db)
      return order
    }
  )
}
