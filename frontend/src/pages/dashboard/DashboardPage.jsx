import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Table from '../../components/Table'
import { ROLE_META, ROLES } from '../../config/roles'
import { useAuth } from '../../hooks/useAuth'
import { fetchDashboardSummaryApi, fetchRopAlertsApi } from '../../services/dashboardService'
import { formatKg, formatRupiah } from '../../utils/formatters'

export default function DashboardPage() {
  const { user, hasPermission, hasRole } = useAuth()
  const navigate = useNavigate()

  const [summary, setSummary] = useState({
    panen_masuk_kg: 0,
    antrean_sortasi: 0,
    item_di_bawah_minimum: 0,
    omset_hari_ini: 0,
  })
  const [ropAlerts, setRopAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  const roleMeta = ROLE_META[user?.role] || {
    label: user?.role,
    description: 'Pengguna sistem koperasi.',
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

  const ropColumns = [
    { key: 'code', header: 'Kode Barang', render: (r) => <strong>{r.code}</strong> },
    { key: 'name', header: 'Nama Saprotan' },
    {
      key: 'type',
      header: 'Kategori',
      render: (r) => <Badge variant="navy">{r.type}</Badge>,
    },
    { key: 'warehouse', header: 'Gudang' },
    {
      key: 'qty_on_hand',
      header: 'Stok Tersedia',
      render: (r) => (
        <strong style={{ color: 'var(--color-red)' }}>{formatKg(r.qty_on_hand)}</strong>
      ),
    },
    {
      key: 'min_stock',
      header: 'Stok Minimum',
      render: (r) => formatKg(r.min_stock),
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <Badge variant="amber">Perlu Pengadaan</Badge>,
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ringkasan Operasional</h1>
          <p className="page-subtitle">
            Selamat datang, <strong>{user?.name}</strong> ({roleMeta.label}). {roleMeta.description}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadDashboard}>
          Muat Ulang Data
        </Button>
      </div>

      <div className="stats-grid">
        <div className="stat-card green">
          <span className="stat-label">Total Panen Masuk</span>
          <span className="stat-value">
            {loading ? '...' : formatKg(summary.panen_masuk_kg)}
          </span>
          <span className="stat-meta">Akumulasi setoran panen anggota</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Antrean Sortasi</span>
          <span className="stat-value">
            {loading ? '...' : `${summary.antrean_sortasi} Batch`}
          </span>
          <span className="stat-meta">Batch panen menunggu proses grading</span>
        </div>

        <div className={`stat-card ${summary.item_di_bawah_minimum > 0 ? 'amber' : 'green'}`}>
          <span className="stat-label">Peringatan Stok Minimum</span>
          <span
            className="stat-value"
            style={{
              color:
                summary.item_di_bawah_minimum > 0 ? 'var(--color-amber)' : 'var(--color-green)',
            }}
          >
            {loading ? '...' : `${summary.item_di_bawah_minimum} Item`}
          </span>
          <span className="stat-meta">Item saprotan pada atau di bawah stok minimum</span>
        </div>

        <div className="stat-card green">
          <span className="stat-label">Omset Penjualan</span>
          <span className="stat-value">
            {loading ? '...' : formatRupiah(summary.omset_hari_ini)}
          </span>
          <span className="stat-meta">Total nilai penjualan terkonfirmasi</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Pintasan Modul</h2>
            <p className="card-subtitle">
              Akses cepat ke halaman pengelolaan data master dan transaksi koperasi.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {hasPermission(['member:read', 'member:write']) && (
            <Button variant="primary" onClick={() => navigate('/master/members')}>
              Data Petani &amp; Lahan
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
              Master Saprotan
            </Button>
          )}
          {hasRole([
            ROLES.SUPERADMIN,
            ROLES.BAGIAN_PENJUALAN,
            ROLES.ADMIN_GUDANG,
            ROLES.BAGIAN_KEUANGAN,
          ]) && (
            <Button variant="outline" onClick={() => navigate('/master/customers')}>
              Data Pelanggan
            </Button>
          )}
          {hasRole([
            ROLES.SUPERADMIN,
            ROLES.BAGIAN_PENJUALAN,
            ROLES.BAGIAN_KEUANGAN,
            ROLES.ADMIN_GUDANG,
            ROLES.PENGURUS,
          ]) && (
            <Button variant="outline" onClick={() => navigate('/master/pricing')}>
              Produk &amp; Daftar Harga
            </Button>
          )}
          {hasPermission(['sales:read', 'sales:order']) && (
            <Button variant="success" onClick={() => navigate('/sales/orders')}>
              Pesanan Penjualan
            </Button>
          )}
          {hasPermission(['harvest:receive', 'harvest:read']) && (
            <Button variant="outline" onClick={() => navigate('/procurement/harvest')}>
              Penerimaan Panen
            </Button>
          )}
          {hasPermission(['mfg:sort', 'mfg:read']) && (
            <Button variant="outline" onClick={() => navigate('/manufacturing/sorting')}>
              Sortasi &amp; Grading
            </Button>
          )}
          {hasPermission(['report:esg', 'acct:read']) && (
            <Button variant="outline" onClick={() => navigate('/reports/esg')}>
              Laporan &amp; ESG
            </Button>
          )}
        </div>
      </div>

      {hasPermission(['inventory:read']) && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Peringatan Stok Minimum Saprotan</h2>
              <p className="card-subtitle">
                Daftar sarana produksi pertanian yang memiliki stok pada atau di bawah batas minimum gudang.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/master/saprotan')}>
              Kelola Master Saprotan
            </Button>
          </div>

          <Table
            columns={ropColumns}
            data={ropAlerts}
            rowKey="saprotan_id"
            loading={loading}
            emptyMessage="Seluruh item saprotan memiliki stok di atas batas minimum."
          />
        </div>
      )}
    </div>
  )
}
