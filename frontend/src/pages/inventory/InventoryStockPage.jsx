import { useEffect, useState } from 'react'
import AlertBanner from '../../components/AlertBanner'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Table from '../../components/Table'
import {
  downloadStockExcelApi,
  fetchFinishedStockReportApi,
  fetchSaprotanStockApi,
} from '../../services/inventoryService'
import { formatDateID, formatDateTimeID, formatKg, formatRupiah } from '../../utils/formatters'

export default function InventoryStockPage() {
  const [activeTab, setActiveTab] = useState('finished') // 'finished' | 'saprotan'
  const [finishedStock, setFinishedStock] = useState([])
  const [saprotanStock, setSaprotanStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [notif, setNotif] = useState(null)

  useEffect(() => {
    async function loadStockData() {
      setLoading(true)
      try {
        const [finData, sapData] = await Promise.all([
          fetchFinishedStockReportApi().catch(() => []),
          fetchSaprotanStockApi().catch(() => []),
        ])
        setFinishedStock(finData || [])
        setSaprotanStock(sapData || [])
      } catch (err) {
        setNotif({
          type: 'error',
          title: 'Gagal Memuat Stok',
          message: err.message || 'Tidak dapat memuat data persediaan gudang.',
        })
      } finally {
        setLoading(false)
      }
    }
    loadStockData()
  }, [])

  const handleDownloadExcel = async () => {
    setDownloading(true)
    try {
      await downloadStockExcelApi(activeTab)
      setNotif({
        type: 'success',
        title: 'Unduhan Berhasil',
        message: `Berkas Excel laporan stok ${activeTab === 'finished' ? 'barang jadi' : 'saprotan'} berhasil diunduh.`,
      })
    } catch (err) {
      setNotif({
        type: 'error',
        title: 'Gagal Mengunduh Excel',
        message: err.message || 'Terjadi kesalahan saat meminta berkas ke server.',
      })
    } finally {
      setDownloading(false)
    }
  }

  // Hitung KPI
  const totalFinishedKg = finishedStock.reduce((acc, cur) => acc + (parseFloat(cur.qty_on_hand) || 0), 0)
  const totalSaprotanKg = saprotanStock.reduce((acc, cur) => acc + (parseFloat(cur.qty_on_hand) || 0), 0)
  const ropWarningsCount = saprotanStock.filter((s) => s.below_minimum).length

  // Kolom Tabel Stok Barang Jadi
  const finishedColumns = [
    {
      header: 'Produk & Grade',
      accessor: 'product',
      cell: (row) => (
        <div>
          <strong style={{ display: 'block', color: 'var(--color-navy)' }}>{row.product}</strong>
          <span style={{ fontSize: '12px', color: 'var(--color-teal)', fontWeight: 600 }}>
            {row.grade}
          </span>
        </div>
      ),
    },
    {
      header: 'Kode Batch',
      accessor: 'batch_code',
      cell: (row) => <code>{row.batch_code}</code>,
    },
    {
      header: 'Stok On-Hand / Tersedia',
      accessor: 'qty_on_hand',
      cell: (row) => (
        <div>
          <strong>{formatKg(row.qty_on_hand)}</strong>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Tersedia: {formatKg(row.qty_available)}
          </div>
        </div>
      ),
    },
    {
      header: 'Biaya Pokok (HPP)',
      accessor: 'unit_cost',
      cell: (row) => formatRupiah(row.unit_cost),
    },
    {
      header: 'Tgl Terima & Kadaluarsa',
      accessor: 'received_at',
      cell: (row) => (
        <div style={{ fontSize: '12.5px' }}>
          <div>Terima: {formatDateID(row.received_at)}</div>
          {row.days_left != null && (
            <div style={{ color: row.days_left <= 2 ? '#dc2626' : '#166534', fontWeight: 600 }}>
              Sisa {row.days_left} hari lagi
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Gudang',
      accessor: 'warehouse_id',
      cell: () => <Badge variant="green">GD-JADI</Badge>,
    },
  ]

  // Kolom Tabel Stok Saprotan
  const saprotanColumns = [
    {
      header: 'Kode & Nama Saprotan',
      accessor: 'name',
      cell: (row) => (
        <div>
          <strong style={{ display: 'block', color: 'var(--color-navy)' }}>{row.name}</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.code}</span>
        </div>
      ),
    },
    {
      header: 'Kategori',
      accessor: 'type',
      cell: (row) => (
        <Badge variant={row.type === 'PUPUK_ORGANIK' ? 'green' : row.type === 'BENIH' ? 'blue' : 'amber'}>
          {row.type}
        </Badge>
      ),
    },
    {
      header: 'Saldo Stok Gudang',
      accessor: 'qty_on_hand',
      cell: (row) => <strong>{formatKg(row.qty_on_hand)}</strong>,
    },
    {
      header: 'Batas Minimum (ROP)',
      accessor: 'min_stock',
      cell: (row) => formatKg(row.min_stock),
    },
    {
      header: 'Status Restock',
      accessor: 'below_minimum',
      cell: (row) =>
        row.below_minimum ? (
          <Badge variant="red">⚠️ PERLU RESTOCK (DIBAWAH ROP)</Badge>
        ) : (
          <Badge variant="green">AMAN</Badge>
        ),
    },
  ]

  return (
    <div>
      {/* Header Halaman */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-navy)' }}>
            📦 Manajemen Stok & Inventaris Gudang
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Pemantauan saldo fisik per lot FIFO di seluruh fasilitas gudang, evaluasi batas minimum (ROP), dan pengawasan masa simpan.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleDownloadExcel}
          disabled={downloading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          📥 {downloading ? 'Mengunduh...' : 'Unduh Laporan Excel (.xlsx)'}
        </Button>
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

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--color-teal)' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Total Barang Jadi (GD-JADI)
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-navy)', marginTop: '6px' }}>
            {formatKg(totalFinishedKg)}
          </div>
          <span style={{ fontSize: '12px', color: '#16a34a' }}>Tersedia untuk alokasi SO (FIFO)</span>
        </div>

        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--color-green)' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Total Saprotan Siap Salur (GD-SAP)
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-navy)', marginTop: '6px' }}>
            {formatKg(totalSaprotanKg)}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pupuk organik, kimia & benih</span>
        </div>

        <div className="card" style={{ padding: '20px', borderLeft: `4px solid ${ropWarningsCount > 0 ? '#ef4444' : '#22c55e'}` }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Peringatan Reorder Point (ROP)
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: ropWarningsCount > 0 ? '#dc2626' : '#166534', marginTop: '6px' }}>
            {ropWarningsCount} Komoditas / Bahan
          </div>
          <span style={{ fontSize: '12px', color: ropWarningsCount > 0 ? '#dc2626' : '#166534' }}>
            {ropWarningsCount > 0 ? 'Segera terbitkan usulan Purchase Order (PO)' : 'Semua stok di atas batas aman'}
          </span>
        </div>
      </div>

      {/* Tab Navigasi */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
        <button
          className={`tab-btn ${activeTab === 'finished' ? 'active' : ''}`}
          onClick={() => setActiveTab('finished')}
          style={{
            padding: '10px 18px',
            fontSize: '14.5px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: activeTab === 'finished' ? 'var(--color-navy)' : 'transparent',
            color: activeTab === 'finished' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          🥬 Stok Barang Jadi & Lot FIFO
        </button>
        <button
          className={`tab-btn ${activeTab === 'saprotan' ? 'active' : ''}`}
          onClick={() => setActiveTab('saprotan')}
          style={{
            padding: '10px 18px',
            fontSize: '14.5px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: activeTab === 'saprotan' ? 'var(--color-navy)' : 'transparent',
            color: activeTab === 'saprotan' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          🌱 Stok Saprotan & Peringatan ROP
        </button>
      </div>

      {/* Konten Tabel */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '17px', margin: 0 }}>
              {activeTab === 'finished' ? 'Daftar Lot Aktif Barang Jadi (FIFO)' : 'Status Persediaan Sarana Produksi Pertanian'}
            </h2>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              {activeTab === 'finished'
                ? 'Lot diurutkan berdasarkan tanggal panen/sortasi tertua untuk rotasi pengeluaran'
                : 'Peringatan otomatis muncul saat saldo fisik berada di bawah titik pemesanan ulang (ROP)'}
            </span>
          </div>
          <Badge variant="blue">
            {activeTab === 'finished' ? `${finishedStock.length} Lot Aktif` : `${saprotanStock.length} Item`}
          </Badge>
        </div>

        <Table
          columns={activeTab === 'finished' ? finishedColumns : saprotanColumns}
          data={activeTab === 'finished' ? finishedStock : saprotanStock}
          loading={loading}
          emptyText="Tidak ada data persediaan stok."
        />
      </div>
    </div>
  )
}
