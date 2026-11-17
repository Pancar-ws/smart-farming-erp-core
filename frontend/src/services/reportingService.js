import { ApiError, apiRequest } from './apiClient'

/**
 * Service Pelaporan & ESG (Fitur 7 - Tugas Pancar & Amel)
 * Endpoint Backend (/api/v1/reporting/*):
 * - GET /reporting/reports/esg/environmental
 * - GET /reporting/reports/esg/social
 * - GET /reporting/reports/esg/governance
 * - GET /reporting/trace/batches/{code}
 * - GET /reporting/reports/sorting-efficiency
 */

export async function fetchEsgMetricsApi() {
  const [env, soc, gov] = await Promise.all([
    apiRequest('/reporting/reports/esg/environmental', { method: 'GET' }, async () => ({
      organic_fertilizer_kg: 1250,
      chemical_fertilizer_kg: 420,
      organic_ratio_pct: 74.85,
      estimated_carbon_emission_kg: 385.2,
      carbon_reduction_pct: 22.4,
    })),
    apiRequest('/reporting/reports/esg/social', { method: 'GET' }, async () => ({
      active_members_count: 85,
      total_members_count: 100,
      active_ratio_pct: 85.0,
      avg_payment_duration_days: 1.8,
      on_time_payment_pct: 97.5,
    })),
    apiRequest('/reporting/reports/esg/governance', { method: 'GET' }, async () => ({
      total_harvest_kg: 12500,
      total_food_loss_kg: 850,
      food_loss_pct: 6.8,
      audit_logs_count: 248,
      immutable_records_compliance_pct: 100,
    })),
  ])

  return { environmental: env, social: soc, governance: gov }
}

export async function fetchTraceBatchApi(batchCode) {
  return apiRequest(`/reporting/trace/batches/${batchCode}`, { method: 'GET' }, async () => {
    return {
      batch_code: batchCode,
      product_name: 'Cabai Rawit Merah (Grade A Super)',
      net_kg: 700,
      harvest: {
        receipt_no: 'RCV-20261114-001',
        received_at: '2026-11-14T08:30:00Z',
        gross_kg: 1000,
        moisture_pct: 13.8,
      },
      sorting: {
        order_no: 'SRT-20261114-001',
        process_date: '2026-11-14',
        grade_a_kg: 700,
        grade_b_kg: 200,
        afkir_kg: 100,
      },
      farmer: {
        code: 'AGT-00014',
        name: 'Budi Santoso',
        phone: '0812-3456-7890',
        land_address: 'Blok Sawah Krajan, Lahan C-04, Banyumas',
        land_area_ha: 1.2,
        coordinates: '-7.4312, 109.2458',
      },
      sales: {
        order_no: 'SO-20261114-001',
        customer_name: 'PT Pasar Makmur Abadi (Modern Retail)',
        shipment_date: '2026-11-15',
        invoice_no: 'INV-20261115-001',
      },
    }
  })
}
