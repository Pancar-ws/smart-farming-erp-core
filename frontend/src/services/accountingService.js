import { ApiError, apiRequest } from './apiClient'
import { getMockDB } from './mockData'

/**
 * Service Akuntansi & Finansial (Fitur 6 - Tugas Pancar)
 * Endpoint Backend (/api/v1/accounting/*):
 * - GET /accounting/journals
 * - GET /accounting/reports/income-statement
 * - GET /accounting/reports/margin
 * - POST /accounting/shu/calculate
 * - GET /accounting/accounts
 */

export async function fetchJournalsApi() {
  return apiRequest('/accounting/journals', { method: 'GET' }, async () => {
    return [
      {
        id: 1,
        entry_no: 'JRN-202611-001',
        entry_date: '2026-11-14',
        ref_type: 'HARVEST_RECEIPT',
        ref_no: 'RCV-20261114-001',
        description: 'Penerimaan setoran panen cabai rawit curah dari anggota AGT-00014',
        status: 'POSTED',
        lines: [
          { account_code: '1-3100', account_name: 'Persediaan Panen Curah', debit: 32600000, credit: 0 },
          { account_code: '2-1200', account_name: 'Hutang Pembelian Panen Anggota', debit: 0, credit: 32600000 },
        ],
      },
      {
        id: 2,
        entry_no: 'JRN-202611-002',
        entry_date: '2026-11-14',
        ref_type: 'SORTING_ORDER',
        ref_no: 'SRT-20261114-001',
        description: 'Hasil sortasi mutu batch BATCH-20261114-001 ke barang jadi',
        status: 'POSTED',
        lines: [
          { account_code: '1-3200', account_name: 'Persediaan Barang Jadi', debit: 32600000, credit: 0 },
          { account_code: '1-3100', account_name: 'Persediaan Panen Curah', debit: 0, credit: 32600000 },
        ],
      },
      {
        id: 3,
        entry_no: 'JRN-202611-003',
        entry_date: '2026-11-14',
        ref_type: 'SALES_ORDER',
        ref_no: 'SO-20261114-001',
        description: 'Penjualan cabai mutu A & B ke PT Pasar Makmur Abadi',
        status: 'POSTED',
        lines: [
          { account_code: '1-2100', account_name: 'Piutang Usaha', debit: 39400000, credit: 0 },
          { account_code: '4-1100', account_name: 'Penjualan Hasil Panen', debit: 0, credit: 39400000 },
          { account_code: '5-1100', account_name: 'HPP Hasil Panen', debit: 32600000, credit: 0 },
          { account_code: '1-3200', account_name: 'Persediaan Barang Jadi', debit: 0, credit: 32600000 },
        ],
      },
    ]
  })
}

export async function fetchBatchMarginsApi() {
  return apiRequest('/accounting/reports/margin', { method: 'GET' }, async () => {
    return [
      {
        batch_code: 'BATCH-20261114-001',
        product: 'Cabai Rawit Merah',
        revenue: 39400000,
        cogs: 32600000,
        gross_margin: 6800000,
        margin_pct: 17.26,
      },
      {
        batch_code: 'BATCH-20261115-002',
        product: 'Beras Ciherang',
        revenue: 28500000,
        cogs: 23800000,
        gross_margin: 4700000,
        margin_pct: 16.49,
      },
    ]
  })
}

export async function fetchIncomeStatementApi() {
  return apiRequest('/accounting/reports/income-statement', { method: 'GET' }, async () => {
    return {
      revenue: 67900000,
      cogs: 56400000,
      gross_profit: 11500000,
      operating_expenses: 3200000,
      net_profit: 8300000,
      period: 'November 2026',
    }
  })
}

export async function calculateShuApi(payload) {
  return apiRequest('/accounting/shu/calculate', { method: 'POST', body: payload }, async () => {
    return {
      year: payload.year || 2026,
      total_net_profit: 45000000,
      shu_alokasi: {
        cadangan_koperasi: 18000000, // 40%
        jasa_anggota_modal: 9000000,  // 20%
        jasa_anggota_usaha: 11250000, // 25% (partisipasi transaksi panen)
        dana_pendidikan: 2250000,     // 5%
        dana_sosial: 2250000,         // 5%
        dana_pengurus: 2250000,       // 5%
      },
      member_allocations: [
        { member_id: 1, member_code: 'AGT-00014', name: 'Budi Santoso', volume_transaksi: 32600000, shu_diterima: 1250000 },
        { member_id: 2, member_code: 'AGT-00021', name: 'Siti Aminah', volume_transaksi: 28400000, shu_diterima: 1088000 },
        { member_id: 3, member_code: 'AGT-00035', name: 'Joko Prabowo', volume_transaksi: 19500000, shu_diterima: 747000 },
      ],
    }
  })
}
