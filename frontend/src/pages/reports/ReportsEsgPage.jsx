import { useEffect, useState } from 'react'
import AlertBanner from '../../components/AlertBanner'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import { fetchEsgMetricsApi, fetchTraceBatchApi } from '../../services/reportingService'
import { formatDateTimeID, formatKg, formatRupiah } from '../../utils/formatters'

export default function ReportsEsgPage() {
  const [activeTab, setActiveTab] = useState('esg') // 'esg' | 'traceability'
  const [esgMetrics, setEsgMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notif, setNotif] = useState(null)

  // State Traceability
  const [searchBatch, setSearchBatch] = useState('BATCH-20261114-001')
  const [traceData, setTraceData] = useState(null)
  const [tracing, setTracing] = useState(false)

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true)
      try {
        const metrics = await fetchEsgMetricsApi()
        setEsgMetrics(metrics)
      } catch (err) {
        setNotif({
          type: 'error',
          title: 'Gagal Memuat Metrik ESG',
          message: err.message || 'Tidak dapat memuat data indikator keberlanjutan.',
        })
      } finally {
        setLoading(false)
      }
    }
    loadMetrics()
  }, [])

  const handleTraceSearch = async (e) => {
    e.preventDefault()
    if (!searchBatch.trim()) return
    setTracing(true)
    setNotif(null)
    try {
      const res = await fetchTraceBatchApi(searchBatch.trim())
      setTraceData(res)
    } catch (err) {
      setNotif({
        type: 'error',
        title: 'Pelacakan Gagal',
        message: err.message || `Data ketertelusuran untuk batch ${searchBatch} tidak ditemukan.`,
      })
      setTraceData(null)
    } finally {
      setTracing(false)
    }
  }

  return (
    <div>
      {/* Header Halaman */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-navy)' }}>
          🌱 Laporan Operasional & Dashboard ESG
        </h1>
        <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Pemantauan indikator keberlanjutan Environmental, Social, and Governance (ESG) serta penelusuran riwayat rantai pasok komoditas (*End-to-End Traceability*).
        </p>
      </div>

      {notif && (
        <div style={{ marginBottom: '16px' }}>
          <AlertBanner
            variant={notif.type}
            title={notif.title}
            message={notif.message}
            onClose={() => setNotif(null)}
          />
        </div>
      )}

      {/* Tab Navigasi */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
        <button
          className={`tab-btn ${activeTab === 'esg' ? 'active' : ''}`}
          onClick={() => setActiveTab('esg')}
          style={{
            padding: '10px 18px',
            fontSize: '14.5px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: activeTab === 'esg' ? 'var(--color-navy)' : 'transparent',
            color: activeTab === 'esg' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          🌿 Dashboard Indikator ESG
        </button>
        <button
          className={`tab-btn ${activeTab === 'traceability' ? 'active' : ''}`}
          onClick={() => setActiveTab('traceability')}
          style={{
            padding: '10px 18px',
            fontSize: '14.5px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: activeTab === 'traceability' ? 'var(--color-navy)' : 'transparent',
            color: activeTab === 'traceability' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          🔍 Pelacakan Asal Usul Batch (Traceability)
        </button>
      </div>

      {/* TAB 1: DASHBOARD ESG */}
      {activeTab === 'esg' && esgMetrics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Pilar Environmental */}
          <div className="card" style={{ padding: '24px', borderTop: '4px solid #16a34a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#166534' }}>
                  🌍 Environmental (Kelestarian Lingkungan & Pertanian Organik)
                </h2>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Penggunaan sarana produksi ramah lingkungan dan reduksi jejak karbon
                </span>
              </div>
              <Badge variant="green">Pilar Lingkungan</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>Rasio Pupuk Organik vs Kimia</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#15803d', margin: '6px 0' }}>
                  {esgMetrics.environmental.organic_ratio_pct}%
                </div>
                <div style={{ fontSize: '12px', color: '#166534' }}>
                  Organik: {formatKg(esgMetrics.environmental.organic_fertilizer_kg)} | Kimia: {formatKg(esgMetrics.environmental.chemical_fertilizer_kg)}
                </div>
              </div>

              <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>Estimasi Emisi Karbon Terhindar</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#15803d', margin: '6px 0' }}>
                  {esgMetrics.environmental.carbon_reduction_pct}%
                </div>
                <div style={{ fontSize: '12px', color: '#166534' }}>
                  Jejak karbon terpantau: {esgMetrics.environmental.estimated_carbon_emission_kg} kg CO2e
                </div>
              </div>
            </div>
          </div>

          {/* Pilar Social */}
          <div className="card" style={{ padding: '24px', borderTop: '4px solid #0284c7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#0369a1' }}>
                  👥 Social (Kesejahteraan & Ketepatan Pembayaran Petani)
                </h2>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Komitmen pembayaran panen petani anggota dalam &le; 3 hari kerja
                </span>
              </div>
              <Badge variant="blue">Pilar Sosial</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <span style={{ fontSize: '13px', color: '#0369a1', fontWeight: 600 }}>Rata-rata Durasi Pembayaran Panen</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#0284c7', margin: '6px 0' }}>
                  {esgMetrics.social.avg_payment_duration_days} Hari
                </div>
                <div style={{ fontSize: '12px', color: '#0369a1' }}>
                  Target SOP: &le; 3.0 hari kerja (Kepatuhan: {esgMetrics.social.on_time_payment_pct}%)
                </div>
              </div>

              <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <span style={{ fontSize: '13px', color: '#0369a1', fontWeight: 600 }}>Tingkat Partisipasi Petani Aktif</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#0284c7', margin: '6px 0' }}>
                  {esgMetrics.social.active_ratio_pct}%
                </div>
                <div style={{ fontSize: '12px', color: '#0369a1' }}>
                  {esgMetrics.social.active_members_count} dari {esgMetrics.social.total_members_count} anggota aktif bertransaksi
                </div>
              </div>
            </div>
          </div>

          {/* Pilar Governance */}
          <div className="card" style={{ padding: '24px', borderTop: '4px solid #7c3aed' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#6d28d9' }}>
                  ⚖️ Governance (Tata Kelola, Anti Food-Loss & Audit Trail)
                </h2>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Transparansi buku besar immutable dan mitigasi susut hasil panen
                </span>
              </div>
              <Badge variant="amber">Pilar Tata Kelola</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div style={{ backgroundColor: '#faf5ff', padding: '16px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                <span style={{ fontSize: '13px', color: '#6d28d9', fontWeight: 600 }}>Rasio Food Loss (Susut Sortasi)</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#7c3aed', margin: '6px 0' }}>
                  {esgMetrics.governance.food_loss_pct}%
                </div>
                <div style={{ fontSize: '12px', color: '#6d28d9' }}>
                  Total susut afkir: {formatKg(esgMetrics.governance.total_food_loss_kg)} dari {formatKg(esgMetrics.governance.total_harvest_kg)} panen
                </div>
              </div>

              <div style={{ backgroundColor: '#faf5ff', padding: '16px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                <span style={{ fontSize: '13px', color: '#6d28d9', fontWeight: 600 }}>Kepatuhan Audit Trail & Immutabilitas</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#7c3aed', margin: '6px 0' }}>
                  {esgMetrics.governance.immutable_records_compliance_pct}%
                </div>
                <div style={{ fontSize: '12px', color: '#6d28d9' }}>
                  {esgMetrics.governance.audit_logs_count} log perubahan sistem terekam aman
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRACEABILITY SEARCH */}
      {activeTab === 'traceability' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h2 className="card-title" style={{ fontSize: '18px', marginBottom: '8px' }}>
              Pelacakan Riwayat Komoditas Mundur (*Backward Traceability*)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Ketikkan nomor batch unik atau scan QR Code faktur untuk melihat silsilah perjalanan produk dari meja konsumen hingga ke titik petak lahan petani.
            </p>

            <form onSubmit={handleTraceSearch} style={{ display: 'flex', gap: '12px', maxWidth: '600px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Masukkan Nomor Batch (contoh: BATCH-20261114-001)"
                value={searchBatch}
                onChange={(e) => setSearchBatch(e.target.value)}
                style={{ fontSize: '15px', padding: '12px', flex: 1 }}
              />
              <Button type="submit" variant="primary" disabled={tracing} style={{ padding: '0 24px' }}>
                {tracing ? 'Melacak...' : '🔍 Lacak Batch'}
              </Button>
            </form>
          </div>

          {/* Hasil Penelusuran Silsilah */}
          {traceData && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--color-navy)' }}>
                    Hasil Penelusuran Silsilah: <code>{traceData.batch_code}</code>
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Komoditas: {traceData.product_name} ({formatKg(traceData.net_kg)})
                  </span>
                </div>
                <Badge variant="green">Lolos Uji Traceability</Badge>
              </div>

              {/* Garis Alur Rantai Pasok */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                {/* Tahap 1: Penjualan & Faktur */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    1
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ display: 'block', fontSize: '15px', color: 'var(--color-navy)' }}>
                      Penjualan Komersial & Faktur
                    </strong>
                    <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                      Pelanggan: <strong>{traceData.sales.customer_name}</strong> | No. Faktur: <code>{traceData.sales.invoice_no}</code> | Pengiriman: {traceData.sales.shipment_date}
                    </div>
                  </div>
                </div>

                {/* Tahap 2: Sortasi & Grading */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    2
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ display: 'block', fontSize: '15px', color: '#0284c7' }}>
                      Sortasi & Pemilahan Mutu (Keseimbangan Massa)
                    </strong>
                    <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                      Order Sortasi: <code>{traceData.sorting.order_no}</code> | Grade A: {traceData.sorting.grade_a_kg} kg | Grade B: {traceData.sorting.grade_b_kg} kg | Afkir: {traceData.sorting.afkir_kg} kg
                    </div>
                  </div>
                </div>

                {/* Tahap 3: Penerimaan Timbangan Gudang */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    3
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ display: 'block', fontSize: '15px', color: '#16a34a' }}>
                      Penerimaan Panen Curah & Penimbangan
                    </strong>
                    <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                      Bukti Timbang: <code>{traceData.harvest.receipt_no}</code> | Bruto: {traceData.harvest.gross_kg} kg | Kadar Air: {traceData.harvest.moisture_pct}% | Waktu: {formatDateTimeID(traceData.harvest.received_at)}
                    </div>
                  </div>
                </div>

                {/* Tahap 4: Petani & Petak Lahan */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#d97706', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    4
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#fffbeb', padding: '16px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                    <strong style={{ display: 'block', fontSize: '15px', color: '#b45309' }}>
                      Titik Asal: Petani Anggota & Koordinat Lahan
                    </strong>
                    <div style={{ fontSize: '13px', color: '#78350f', marginTop: '4px', lineHeight: '1.6' }}>
                      Nama Petani: <strong>{traceData.farmer.name}</strong> ({traceData.farmer.code})<br />
                      Alamat Lahan: {traceData.farmer.land_address} (Luas: {traceData.farmer.land_area_ha} Ha)<br />
                      Titik Geografis (GPS): <code>{traceData.farmer.coordinates}</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
