import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AlertBanner from '../../components/AlertBanner'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Table from '../../components/Table'
import { ROLE_META, ROLES } from '../../config/roles'
import { useAuth } from '../../hooks/useAuth'
import { fetchDashboardSummaryApi, fetchRopAlertsApi } from '../../services/dashboardService'
import { resetMockDB } from '../../services/mockData'
import { formatKg, formatRupiah } from '../../utils/formatters'

/**
 * Halaman Dashboard Utama (SDD Section 7.2)
 * Menampilkan 4 widget utama:
 * 1. Total Panen Masuk
 * 2. Antrean Sortasi
 * 3. Peringatan Stok Minimum (ROP)
 * 4. Omset Penjualan
 * Serta tabel peringatan stok saprotan (UAT-02) dan jalan pintas sesuai role RBAC.
 */
export default function DashboardPage() {
  const { user, connMode, hasPermission, hasRole } = useAuth()
  const navigate = useNavigate()

  const [summary, setSummary] = useState({
    panen_masuk_kg: 0,
    antrean_sortasi: 0,
    item_di_bawah_minimum: 0,
    omset_hari_ini: 0,
  })
  const [ropAlerts, setRopAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [infoBanner, setInfoBanner] = useState('')

  const roleMeta = ROLE_META[user?.role] || {
    label: user?.role,
    description: 'Pengguna sistem ERP Koperasi Tani.',
  }

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const [sumData, ropData] = await Promise.all([
        fetchDashboardSummaryApi(),
        hasPermission(['inventory:read']) ? fetchRopAlertsApi() : Promise.resolve([]),
      ])
      setSummary({
        panen_masuk_kg: Number(sumData?.panen_masuk_kg ?? 0),
        antrean_sortasi: Number(sumData?.antrean_sortasi ?? 0),
        item_di_bawah_minimum: Number(sumData?.item_di_bawah_minimum ?? 0),
        omset_hari_ini: Number(sumData?.omset_hari_ini ?? 0),
      })
      setRopAlerts(Array.isArray(ropData) ? ropData : [])
    } catch {
      // Gunakan nilai default jika gagal
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleResetDemo = () => {
    resetMockDB()
    setInfoBanner('Data simulasi lokal telah dikembalikan ke kondisi awal (URS Bagian 8.1).')
    loadDashboard()
  }

  const ropColumns = [
    { key: 'code', header: 'Kode Saprotan', render: (r) => <strong>{r.code}</strong> },
    { key: 'name', header: 'Nama Item Saprotan' },
    {
      key: 'type',
      header: 'Kategori',
      render: (r) => <Badge variant="navy">{r.type}</Badge>,
    },
    { key: 'warehouse', header: 'Lokasi Gudang' },
    {
      key: 'qty_on_hand',
      header: 'Stok Tersedia',
      render: (r) => (
        <strong style={{ color: 'var(--color-red)' }}>{formatKg(r.qty_on_hand)}</strong>
      ),
    },
    {
      key: 'min_stock',
      header: 'Batas Minimum (ROP)',
      render: (r) => formatKg(r.min_stock),
    },
    {
      key: 'status',
      header: 'Status Reorder',
      render: () => <Badge variant="amber">⚠ Perlu Restock (PO Supplier)</Badge>,
    },
  ]

  return (
    <div>
      {/* Header Selamat Datang & Info Peran RBAC */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Badge variant="navy">{roleMeta.label}</Badge>
            <Badge variant={connMode === 'online' ? 'green' : 'amber'}>
              {connMode === 'online'
                ? 'Sumber Data: API PostgreSQL (/api/v1/dashboard/summary)'
                : 'Sumber Data: Simulasi URS 8.1 (Mock Fallback)'}
            </Badge>
          </div>
          <h1 className="page-title">Selamat Datang, {user?.name}</h1>
          <p className="page-subtitle">{roleMeta.description}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {connMode !== 'online' && (
            <Button variant="outline" size="sm" onClick={handleResetDemo}>
              Reset Data Simulasi
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={loadDashboard}>
            Segarkan Ringkasan
          </Button>
        </div>
      </div>

      <AlertBanner variant="success" onClose={() => setInfoBanner('')}>
        {infoBanner}
      </AlertBanner>

      {/* 4 Widget Ringkasan Harian sesuai SDD Section 7.2 */}
      <div className="stats-grid">
        <div className="stat-card green">
          <span className="stat-label">1. Total Panen Masuk</span>
          <span className="stat-value">
            {loading ? '...' : formatKg(summary.panen_masuk_kg)}
          </span>
          <span className="stat-meta">
            Akumulasi setoran panen curah anggota (Gudang Penerimaan)
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">2. Antrean Sortasi &amp; QC</span>
          <span className="stat-value">
            {loading ? '...' : `${summary.antrean_sortasi} Batch`}
          </span>
          <span className="stat-meta">
            Batch curah berstatus Menunggu / Sedang Diproses Grading
          </span>
        </div>

        <div className={`stat-card ${summary.item_di_bawah_minimum > 0 ? 'amber' : 'green'}`}>
          <span className="stat-label">3. Peringatan Stok ROP</span>
          <span
            className="stat-value"
            style={{
              color:
                summary.item_di_bawah_minimum > 0 ? 'var(--color-amber)' : 'var(--color-green)',
            }}
          >
            {loading ? '...' : `${summary.item_di_bawah_minimum} Item`}
          </span>
          <span className="stat-meta">
            Saprotan dengan stok &le; batas minimum (Reorder Point)
          </span>
        </div>

        <div className="stat-card green">
          <span className="stat-label">4. Omset Penjualan</span>
          <span className="stat-value">
            {loading ? '...' : formatRupiah(summary.omset_hari_ini)}
          </span>
          <span className="stat-meta">
            Total nilai faktur komersial (Konsumen, Retail &amp; Pasar Modern)
          </span>
        </div>
      </div>

      {/* Jalan Pintas Transaksi (Quick Shortcuts) sesuai Role */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Jalan Pintas Operasional (Sesuai Hak Akses {roleMeta.label})</h2>
            <p className="card-subtitle">
              Akses cepat menuju formulir pengelolaan data master dan transaksi harian.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {hasPermission(['member:read', 'member:write']) && (
            <Button variant="primary" onClick={() => navigate('/master/members')}>
              Kelola Petani Anggota (~100 Petani)
            </Button>
          )}
          {hasRole([
            ROLES.SUPERADMIN,
            ROLES.ADMIN_GUDANG,
            ROLES.ADMIN_KEANGGOTAAN,
            ROLES.BAGIAN_KEUANGAN,
            ROLES.PENGURUS,
          ]) && (
            <Button variant="outline" onClick={() => navigate('/master/saprotan')}>
              Master Saprotan &amp; Stok Minimum
            </Button>
          )}
          {hasRole([
            ROLES.SUPERADMIN,
            ROLES.BAGIAN_PENJUALAN,
            ROLES.ADMIN_GUDANG,
            ROLES.BAGIAN_KEUANGAN,
          ]) && (
            <Button variant="outline" onClick={() => navigate('/master/customers')}>
              Direktori Pelanggan 3 Segmen
            </Button>
          )}
          {hasPermission(['sales:read', 'sales:order']) && (
            <Button variant="success" onClick={() => navigate('/sales/orders')}>
              Buat Sales Order &amp; Alokasi FIFO (UI-SLS-01)
            </Button>
          )}
          {hasPermission(['harvest:receive', 'harvest:read']) && (
            <Button variant="outline" onClick={() => navigate('/procurement/harvest')}>
              Penerimaan Panen (UI-PRC-01)
            </Button>
          )}
          {hasPermission(['mfg:sort', 'mfg:read']) && (
            <Button variant="outline" onClick={() => navigate('/manufacturing/sorting')}>
              Sortasi &amp; Mass Balance (UI-MFG-01)
            </Button>
          )}
          {hasPermission(['report:esg', 'acct:read']) && (
            <Button variant="outline" onClick={() => navigate('/reports/esg')}>
              Laporan Keuangan &amp; Indikator ESG
            </Button>
          )}
        </div>
      </div>

      {/* Tabel Peringatan Stok Minimum Saprotan (ROP - URS-INV-002 / UAT-02) */}
      {hasPermission(['inventory:read']) && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                Peringatan Batas Stok Minimum Saprotan (Reorder Point / ROP)
              </h2>
              <p className="card-subtitle">
                Menampilkan item saprotan yang saldonya berada pada atau di bawah batas minimum
                (acuan skenario <code>UAT-02</code>: Pupuk NPK &le; 500 kg).
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/master/saprotan')}>
              Lihat Seluruh Master Saprotan
            </Button>
          </div>

          <Table
            columns={ropColumns}
            data={ropAlerts}
            rowKey="saprotan_id"
            loading={loading}
            emptyMessage="Seluruh item saprotan memiliki stok di atas batas minimum (aman)."
          />
        </div>
      )}
    </div>
  )
}
