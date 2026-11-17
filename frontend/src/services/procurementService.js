import { todayISODate } from '../utils/formatters'
import { ApiError, apiRequest } from './apiClient'
import { getMockDB, saveMockDB } from './mockData'

/**
 * Service Procurement & Penerimaan Panen (Fitur 2 - Tugas Caca)
 * Endpoint Backend (/api/v1/procurement/*):
 * - GET /procurement/harvest-receipts
 * - POST /procurement/harvest-receipts
 */

export async function fetchHarvestReceiptsApi({ status = '', member_id = null } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (member_id) params.set('member_id', String(member_id))
  const qs = params.toString() ? `?${params.toString()}` : ''

  return apiRequest(`/procurement/harvest-receipts${qs}`, { method: 'GET' }, async () => {
    const db = getMockDB()
    let list = db.harvestReceipts || []
    if (status) {
      list = list.filter((r) => r.status === status)
    }
    if (member_id) {
      list = list.filter((r) => r.member_id === Number(member_id))
    }
    return [...list].sort((a, b) => b.id - a.id)
  })
}

export async function createHarvestReceiptApi(payload) {
  return apiRequest(
    '/procurement/harvest-receipts',
    {
      method: 'POST',
      body: {
        member_code: payload.member_code,
        product_id: Number(payload.product_id),
        warehouse_id: Number(payload.warehouse_id || 2), // Default GD-MTH
        gross_kg: Number(payload.gross_kg),
        tare_kg: Number(payload.tare_kg || 0),
        moisture_pct: payload.moisture_pct ? Number(payload.moisture_pct) : null,
        client_request_id: payload.client_request_id || null,
      },
    },
    async () => {
      const db = getMockDB()
      db.harvestReceipts = db.harvestReceipts || []

      const member = (db.members || []).find((m) => m.code === payload.member_code)
      if (!member) {
        throw new ApiError(`Petani anggota dengan kode ${payload.member_code} tidak ditemukan.`, 404)
      }

      const id = db.harvestReceipts.length + 1
      const todayStr = todayISODate().replace(/-/g, '')
      const receipt_no = `RCV-${todayStr}-${String(id).padStart(3, '0')}`
      const batch_code = `BATCH-${todayStr}-${String(id).padStart(3, '0')}`
      const gross = Number(payload.gross_kg)
      const tare = Number(payload.tare_kg || 0)
      const net = Math.max(0, gross - tare)

      const newReceipt = {
        id,
        receipt_no,
        batch_code,
        member_id: member.id,
        member_name: member.name,
        product_id: Number(payload.product_id),
        warehouse_id: Number(payload.warehouse_id || 2),
        received_at: new Date().toISOString(),
        gross_kg: gross,
        tare_kg: tare,
        wet_tare_pct: 0,
        net_kg: net,
        moisture_pct: payload.moisture_pct ? Number(payload.moisture_pct) : null,
        status: 'RECEIVED',
      }

      db.harvestReceipts.push(newReceipt)
      saveMockDB(db)

      return {
        id,
        receipt_no,
        batch_code,
        net_kg: String(net),
        print: { template: 'nota_timbang', qr_payload: `BATCH:${batch_code}` },
      }
    }
  )
}
