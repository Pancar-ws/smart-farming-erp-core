import { useEffect, useState } from 'react'
import AlertBanner from '../../components/AlertBanner'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import Table from '../../components/Table'
import {
  calculateShuApi,
  fetchBatchMarginsApi,
  fetchIncomeStatementApi,
  fetchJournalsApi,
} from '../../services/accountingService'
import { formatDateID, formatNumberID, formatRupiah } from '../../utils/formatters'

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState('journals') // 'journals' | 'profit-loss' | 'shu'
  const [journals, setJournals] = useState([])
  const [margins, setMargins] = useState([])
  const [incomeStatement, setIncomeStatement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notif, setNotif] = useState(null)

  // State Kalkulator SHU
  const [shuYear, setShuYear] = useState(2026)
  const [shuNetProfit, setShuNetProfit] = useState(45000000)
  const [shuResult, setShuResult] = useState(null)
  const [calculatingShu, setCalculatingShu] = useState(false)

  useEffect(() => {
    async function loadAccountingData() {
      setLoading(true)
      try {
        const [jrnData, mrgData, incData] = await Promise.all([
          fetchJournalsApi().catch(() => []),
          fetchBatchMarginsApi().catch(() => []),
          fetchIncomeStatementApi().catch(() => null),
        ])
        setJournals(jrnData || [])
        setMargins(Array.isArray(mrgData) ? mrgData : (mrgData?.items || []))
        setIncomeStatement(incData)
      } catch (err) {
        setNotif({
          type: 'error',
          title: 'Gagal Memuat Data Keuangan',
          message: err.message || 'Tidak dapat memuat buku jurnal dan laporan keuangan.',
        })
      } finally {
        setLoading(false)
      }
    }
    loadAccountingData()
  }, [])

  const handleCalculateShu = async (e) => {
    e.preventDefault()
    setCalculatingShu(true)
    try {
      const res = await calculateShuApi({ year: Number(shuYear), total_profit: Number(shuNetProfit) })
      setShuResult(res)
      setNotif({
        type: 'success',
        title: 'Kalkulasi SHU Berhasil',
        message: `Sisa Hasil Usaha tahun ${shuYear} berhasil dihitung dan dialokasikan berdasarkan AD/ART Koperasi.`,
      })
    } catch (err) {
      setNotif({
        type: 'error',
        title: 'Gagal Menghitung SHU',
        message: err.message,
      })
    } finally {
      setCalculatingShu(false)
    }
  }

  // Kolom Tabel Jurnal Transaksi
  const journalColumns = [
    {
      header: 'No. Jurnal & Tanggal',
      accessor: 'entry_no',
      cell: (row) => (
        <div>
          <strong style={{ display: 'block', color: 'var(--color-navy)' }}>{row.entry_no}</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {formatDateID(row.entry_date)}
          </span>
        </div>
      ),
    },
    {
      header: 'Referensi Transaksi',
      accessor: 'ref_no',
      cell: (row) => (
        <div>
          <Badge variant="blue">{row.ref_type}</Badge>
          <div style={{ fontSize: '12px', marginTop: '4px', fontWeight: 600 }}>{row.ref_no}</div>
        </div>
      ),
    },
    {
      header: 'Keterangan Mutasi',
      accessor: 'description',
      cell: (row) => <div style={{ fontSize: '13px', maxWidth: '300px' }}>{row.description}</div>,
    },
    {
      header: 'Pos Jurnal (Double-Entry)',
      accessor: 'lines',
      cell: (row) => (
        <div style={{ fontSize: '12.5px', minWidth: '280px' }}>
          {(row.lines || []).map((ln, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '3px 0',
                borderBottom: idx < row.lines.length - 1 ? '1px dashed #e2e8f0' : 'none',
              }}
            >
              <span style={{ paddingLeft: ln.credit > 0 ? '16px' : '0', color: ln.credit > 0 ? '#475569' : '#0f172a' }}>
                {ln.account_code} - {ln.account_name}
              </span>
              <strong style={{ color: ln.debit > 0 ? 'var(--color-green)' : 'var(--color-navy)' }}>
                {formatRupiah(ln.debit > 0 ? ln.debit : ln.credit)}
              </strong>
            </div>
          ))}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <div>
          <Badge variant="green">{row.status}</Badge>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>🔒 Immutable</div>
        </div>
      ),
    },
  ]

  // Kolom Tabel Margin per Batch
  const marginColumns = [
    {
      header: 'Kode Batch & Produk',
      accessor: 'batch_code',
      cell: (row) => (
        <div>
          <strong style={{ display: 'block', color: 'var(--color-navy)' }}>{row.batch_code}</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {row.product || (row.grade ? `Cabai Rawit (Grade ${row.grade})` : 'Cabai Rawit Merah')}
          </span>
        </div>
      ),
    },
    {
      header: 'Nilai Penjualan (Revenue)',
      accessor: 'penjualan',
      cell: (row) => formatRupiah(row.penjualan ?? row.revenue),
    },
    {
      header: 'Harga Pokok Penjualan (HPP)',
      accessor: 'harga_beli',
      cell: (row) => formatRupiah(row.harga_beli ?? row.cogs),
    },
    {
      header: 'Gross Margin (Selisih Kotor)',
      accessor: 'margin_kotor',
      cell: (row) => (
        <strong style={{ color: 'var(--color-green)', fontSize: '15px' }}>
          {formatRupiah(row.margin_kotor ?? row.gross_margin)}
        </strong>
      ),
    },
    {
      header: 'Persentase Margin',
      accessor: 'margin_pct',
      cell: (row) => (
        <Badge variant={Number(row.margin_pct) >= 15 ? 'green' : 'amber'}>
          {Number(row.margin_pct).toFixed(2)}%
        </Badge>
      ),
    },
  ]

  return (
    <div>
      {/* Header Halaman */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-navy)' }}>
          💰 Akuntansi, Pembayaran Anggota & SHU
        </h1>
        <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Otomasi penjurnalan berpasangan (*Auto-Journaling double-entry*), analisis selisih kotor (*Gross Margin*) per batch, dan kalkulator Sisa Hasil Usaha.
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
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
        <button
          className={`tab-btn ${activeTab === 'journals' ? 'active' : ''}`}
          onClick={() => setActiveTab('journals')}
          style={{
            padding: '10px 18px',
            fontSize: '14.5px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: activeTab === 'journals' ? 'var(--color-navy)' : 'transparent',
            color: activeTab === 'journals' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          📖 Buku Jurnal Umum (Auto-Journaling)
        </button>
        <button
          className={`tab-btn ${activeTab === 'profit-loss' ? 'active' : ''}`}
          onClick={() => setActiveTab('profit-loss')}
          style={{
            padding: '10px 18px',
            fontSize: '14.5px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: activeTab === 'profit-loss' ? 'var(--color-navy)' : 'transparent',
            color: activeTab === 'profit-loss' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          📊 Laba Rugi & Margin per Batch
        </button>
        <button
          className={`tab-btn ${activeTab === 'shu' ? 'active' : ''}`}
          onClick={() => setActiveTab('shu')}
          style={{
            padding: '10px 18px',
            fontSize: '14.5px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: activeTab === 'shu' ? 'var(--color-navy)' : 'transparent',
            color: activeTab === 'shu' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          🤝 Perhitungan SHU Anggota
        </button>
      </div>

      {/* TAB 1: BUKU JURNAL UMUM */}
      {activeTab === 'journals' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 className="card-title" style={{ fontSize: '18px', margin: 0 }}>
                Daftar Ayat Jurnal Otomatis (Double-Entry)
              </h2>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Diterbitkan secara otomatis oleh pemicu mutasi penerimaan panen, sortasi, dan pengiriman barang
              </span>
            </div>
            <Badge variant="green">{journals.length} Ayat Jurnal Ter-posting</Badge>
          </div>

          <Table
            columns={journalColumns}
            data={journals}
            loading={loading}
            emptyText="Belum ada transaksi jurnal."
          />
        </div>
      )}

      {/* TAB 2: LABA RUGI & MARGIN PER BATCH */}
      {activeTab === 'profit-loss' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {incomeStatement && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="card" style={{ padding: '20px', borderLeft: '4px solid #0284c7' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Pendapatan Usaha</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-navy)', marginTop: '4px' }}>
                  {formatRupiah(incomeStatement.total_revenue ?? incomeStatement.revenue)}
                </div>
              </div>

              <div className="card" style={{ padding: '20px', borderLeft: '4px solid #d97706' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Harga Pokok Penjualan (HPP)</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-navy)', marginTop: '4px' }}>
                  {formatRupiah(incomeStatement.total_expense ?? incomeStatement.cogs)}
                </div>
              </div>

              <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--color-green)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Laba Kotor (Gross Profit)</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-green)', marginTop: '4px' }}>
                  {formatRupiah(incomeStatement.gross_profit)}
                </div>
              </div>

              <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--color-teal)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Laba Bersih Sebelum SHU</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-teal)', marginTop: '4px' }}>
                  {formatRupiah(incomeStatement.net_income ?? incomeStatement.net_profit)}
                </div>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h2 className="card-title" style={{ fontSize: '18px', margin: 0 }}>
                Analisis Selisih Kotor (*Gross Margin*) per Batch Panen
              </h2>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Membandingkan nilai faktur penjualan dengan biaya pembelian panen anggota per batch unik
              </span>
            </div>

            <Table
              columns={marginColumns}
              data={margins}
              loading={loading}
              emptyText="Belum ada data penjualan batch."
            />
          </div>
        </div>
      )}

      {/* TAB 3: KALKULATOR SHU ANGGOTA */}
      {activeTab === 'shu' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h2 className="card-title" style={{ fontSize: '18px', marginBottom: '8px' }}>
              Kalkulator Alokasi Sisa Hasil Usaha (SHU)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Perhitungan SHU sesuai AD/ART: Dana Cadangan (40%), Jasa Modal (20%), Jasa Usaha Anggota (25%), Pendidikan & Sosial (15%).
            </p>

            <form onSubmit={handleCalculateShu} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormField label="Tahun Buku" required>
                <input
                  type="number"
                  className="form-control"
                  value={shuYear}
                  onChange={(e) => setShuYear(e.target.value)}
                  style={{ fontSize: '16px', padding: '10px' }}
                />
              </FormField>

              <FormField label="Total Laba Bersih Usaha (Rp)" required hint="Laba bersih setelah dipotong beban operasional">
                <input
                  type="number"
                  className="form-control"
                  value={shuNetProfit}
                  onChange={(e) => setShuNetProfit(e.target.value)}
                  style={{ fontSize: '20px', fontWeight: 700, padding: '12px', color: 'var(--color-navy)' }}
                />
              </FormField>

              <Button type="submit" variant="primary" disabled={calculatingShu} style={{ padding: '14px', fontSize: '16px', fontWeight: 600 }}>
                {calculatingShu ? 'Menghitung Alokasi...' : '⚙️ Hitung Pembagian SHU Anggota'}
              </Button>
            </form>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h2 className="card-title" style={{ fontSize: '18px', marginBottom: '12px' }}>
              Hasil Distribusi SHU Koperasi
            </h2>

            {shuResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Alokasi Dana Cadangan (40%):</div>
                  <strong style={{ fontSize: '18px', color: 'var(--color-navy)' }}>
                    {formatRupiah(shuResult.shu_alokasi.cadangan_koperasi)}
                  </strong>
                </div>

                <div style={{ backgroundColor: '#f0fdf4', padding: '14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '13px', color: '#166534' }}>Jasa Usaha Partisipasi Panen (25%):</div>
                  <strong style={{ fontSize: '18px', color: '#15803d' }}>
                    {formatRupiah(shuResult.shu_alokasi.jasa_anggota_usaha)}
                  </strong>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
                    Distribusi Per Anggota Berdasarkan Volume Transaksi:
                  </label>
                  {(shuResult.member_allocations || []).map((m, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: i % 2 === 0 ? '#f8fafc' : '#fff',
                        borderRadius: '6px',
                        fontSize: '13px',
                      }}
                    >
                      <div>
                        <strong>{m.name}</strong> ({m.member_code})
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                          Setoran: {formatRupiah(m.volume_transaksi)}
                        </div>
                      </div>
                      <strong style={{ color: 'var(--color-green)', alignSelf: 'center' }}>
                        + {formatRupiah(m.shu_diterima)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                Klik tombol "Hitung Pembagian SHU Anggota" untuk melihat simulasi distribusi proporsional.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
