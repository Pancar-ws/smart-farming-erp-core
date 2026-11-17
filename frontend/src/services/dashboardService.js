import { apiRequest } from './apiClient'
import { getMockDB } from './mockData'

/**
 * Service Dashboard Utama (SDD Section 7.2)
 * Kontrak Backend:
 * - GET /api/v1/dashboard/summary -> { panen_masuk_kg, antrean_sortasi, item_di_bawah_minimum, omset_hari_ini }
 * - GET /api/v1/inventory/alerts/rop -> [{ saprotan_id, code, name, type, warehouse, qty_on_hand, min_stock, below_minimum }]
 */

export async function fetchDashboardSummaryApi() {
  return apiRequest('/dashboard/summary', { method: 'GET' }, async () => {
    const db = getMockDB()
    const belowMinCount = (db.saprotan || []).filter(
      (s) => Number(s.qty_on_hand ?? 0) <= Number(s.min_stock ?? 0)
    ).length
    const totalSales = (db.salesOrders || [])
      .filter((so) => so.status !== 'CANCELLED')
      .reduce((acc, so) => acc + Number(so.total || 0), 0)

    return {
      panen_masuk_kg: db.dashboardSummary?.panen_masuk_kg ?? 3800,
      antrean_sortasi: db.dashboardSummary?.antrean_sortasi ?? 3,
      item_di_bawah_minimum: belowMinCount,
      omset_hari_ini: totalSales || 39400000,
    }
  })
}

export async function fetchRopAlertsApi() {
  return apiRequest('/inventory/alerts/rop', { method: 'GET' }, async () => {
    const db = getMockDB()
    return (db.saprotan || [])
      .filter((s) => Number(s.qty_on_hand ?? 0) <= Number(s.min_stock ?? 0))
      .map((s) => ({
        saprotan_id: s.id,
        code: s.code,
        name: s.name,
        type: s.type,
        warehouse: s.warehouse || 'Gudang Saprotan',
        qty_on_hand: s.qty_on_hand ?? 0,
        min_stock: s.min_stock ?? 0,
        below_minimum: true,
      }))
  })
}
