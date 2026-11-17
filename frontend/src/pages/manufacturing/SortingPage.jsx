import { useEffect, useMemo, useState } from 'react'
import AlertBanner from '../../components/AlertBanner'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import Table from '../../components/Table'
import { useAuth } from '../../hooks/useAuth'
import {
  createSortingOrderApi,
  fetchSortingOrdersApi,
  postSortingOrderApi,
} from '../../services/manufacturingService'
import { fetchHarvestReceiptsApi } from '../../services/procurementService'
import { formatDateTimeID, formatKg, todayISODate } from '../../utils/formatters'

export default function SortingPage() {
  const { hasPermission } = useAuth()
  const canSort = hasPermission(['mfg:sort'])

  // Master / Reference data
  const [harvestReceipts, setHarvestReceipts] = useState([])
  const [sortingOrders, setSortingOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [selectedReceiptId, setSelectedReceiptId] = useState('')
  const [batchCode, setBatchCode] = useState('BATCH-20261117-001')
  const [inputCurah, setInputCurah] = useState(100)
  const [mutuA, setMutuA] = useState(70)
  const [mutuB, setMutuB] = useState(20)
  const [mutuC, setMutuC] = useState(0)
  const [afkir, setAfkir] = useState(10)
  const [processDate, setProcessDate] = useState(todayISODate())
  const [note, setNote] = useState('')

  // Notifikasi
  const [notif, setNotif] = useState(null)

  // 1. Kalkulasi Real-Time Mass Balance (Ciri Khas Caca)
  const totalOutput = useMemo(() => {
    const a = parseFloat(mutuA) || 0
    const b = parseFloat(mutuB) || 0
    const c = parseFloat(mutuC) || 0
    const afk = parseFloat(afkir) || 0
    return Number((a + b + c + afk).toFixed(2))
  }, [mutuA, mutuB, mutuC, afkir])

  const inputCurahNum = useMemo(() => {
    return parseFloat(inputCurah) || 0
  }, [inputCurah])

  const selisih = useMemo(() => {
    return Number((inputCurahNum - totalOutput).toFixed(2))
  }, [inputCurahNum, totalOutput])

  const isBalanced = useMemo(() => {
    return inputCurahNum > 0 && Math.abs(selisih) === 0
  }, [inputCurahNum, selisih])

  // Persentase susut / afkir
  const shrinkPct = useMemo(() => {
    if (inputCurahNum <= 0) return 0
    const afk = parseFloat(afkir) || 0
    return ((afk / inputCurahNum) * 100).toFixed(1)
  }, [afkir, inputCurahNum])

  // 2. Load data batch panen & daftar order sortasi
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [rcvData, sortData] = await Promise.all([
          fetchHarvestReceiptsApi().catch(() => []),
          fetchSortingOrdersApi().catch(() => []),
        ])
        setHarvestReceipts(rcvData || [])
        setSortingOrders(sortData || [])

        if (rcvData && rcvData.length > 0) {
          const first = rcvData[0]
          setSelectedReceiptId(String(first.id))
          setBatchCode(first.batch_code)
          setInputCurah(Number(first.net_kg))
          // Default estimasi mutu 70% A, 20% B, 10% Afkir
          const net = Number(first.net_kg)
          const a = Number((net * 0.7).toFixed(2))
          const b = Number((net * 0.2).toFixed(2))
          const afk = Number((net - a - b).toFixed(2))
          setMutuA(a)
          setMutuB(b)
          setMutuC(0)
          setAfkir(afk)
        }
      } catch (err) {
        setNotif({
          type: 'error',
          title: 'Gagal Memuat Data',
          message: err.message || 'Tidak dapat memuat data sortasi.',
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Handler saat operator memilih batch panen yang berbeda
  const handleSelectReceipt = (receiptIdStr) => {
    setSelectedReceiptId(receiptIdStr)
    const found = harvestReceipts.find((r) => String(r.id) === receiptIdStr)
    if (found) {
      setBatchCode(found.batch_code)
      const net = Number(found.net_kg)
      setInputCurah(net)
      const a = Number((net * 0.7).toFixed(2))
      const b = Number((net * 0.2).toFixed(2))
      const afk = Number((net - a - b).toFixed(2))
      setMutuA(a)
      setMutuB(b)
      setMutuC(0)
      setAfkir(afk)
    }
  }

  // 3. Simpan Order Sortasi
  const handleSaveSorting = async (e) => {
    e.preventDefault()

    if (!isBalanced) {
      setNotif({
        type: 'error',
        title: 'Pelanggaran Mass Balance Constraint',
        message: `Total output (${totalOutput} kg) harus mutlak sama dengan total input curah (${inputCurahNum} kg). Selisih saat ini: ${selisih} kg.`,
      })
      return
    }

    setSubmitting(true)
    setNotif(null)

    try {
      const payload = {
        process_date: processDate,
        note: note || `Sortasi batch ${batchCode}`,
        inputs: [
          {
            harvest_receipt_id: Number(selectedReceiptId || 1),
            qty_input: inputCurahNum,
            outputs: [
              { grade_id: 1, qty: parseFloat(mutuA) || 0 }, // Mutu A
              { grade_id: 2, qty: parseFloat(mutuB) || 0 }, // Mutu B
              { grade_id: 3, qty: parseFloat(afkir) || 0 }, // Afkir
            ],
          },
        ],
      }

      const res = await createSortingOrderApi(payload)

      // Coba posting langsung ke stok FIFO
      try {
        await postSortingOrderApi(res.id)
        setNotif({
          type: 'success',
          title: 'Sortasi Berhasil Diproses & Ter-posting!',
          message: `Nomor Order: ${res.order_no} berhasil dikunci dan stok barang jadi (Grade A: ${mutuA} kg, Grade B: ${mutuB} kg) masuk ke gudang FIFO GD-JADI.`,
        })
      } catch {
        setNotif({
          type: 'success',
          title: 'Hasil Sortasi Berhasil Disimpan (Status: Draft)',
          message: `Nomor Order: ${res.order_no} berhasil dibuat dan memenuhi aturan Mass Balance.`,
        })
      }

      // Refresh tabel
      const updated = await fetchSortingOrdersApi().catch(() => [])
      setSortingOrders(updated)
    } catch (err) {
      setNotif({
        type: 'error',
        title: 'Gagal Menyimpan Sortasi',
        message: err.message || 'Terjadi kesalahan sistem.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Kolom Riwayat Sortasi
  const sortingColumns = [
    {
      header: 'No. Order & Tanggal',
      accessor: 'order_no',
      cell: (row) => (
        <div>
          <strong style={{ display: 'block', color: 'var(--color-navy)' }}>{row.order_no}</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Tanggal: {row.process_date}
          </span>
        </div>
      ),
    },
    {
      header: 'Catatan / Batch Induk',
      accessor: 'note',
      cell: (row) => row.note || '-',
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <Badge variant={row.status === 'POSTED' ? 'green' : 'amber'}>
          {row.status === 'POSTED' ? 'POSTED (MASUK FIFO)' : 'DRAFT'}
        </Badge>
      ),
    },
    {
      header: 'Waktu Posting',
      accessor: 'posted_at',
      cell: (row) => (row.posted_at ? formatDateTimeID(row.posted_at) : 'Belum diposting'),
    },
    {
      header: 'Aksi',
      accessor: 'id',
      cell: (row) =>
        row.status !== 'POSTED' ? (
          <Button
            variant="primary"
            size="sm"
            onClick={async () => {
              try {
                await postSortingOrderApi(row.id)
                const updated = await fetchSortingOrdersApi().catch(() => [])
                setSortingOrders(updated)
                setNotif({
                  type: 'success',
                  title: 'Order Berhasil Diposting',
                  message: `Order ${row.order_no} telah diposting ke stok gudang.`,
                })
              } catch (err) {
                setNotif({
                  type: 'error',
                  title: 'Gagal Posting Order',
                  message: err.message,
                })
              }
            }}
          >
            Posting ke FIFO
          </Button>
        ) : (
          <span style={{ fontSize: '13px', color: 'var(--color-green)', fontWeight: 600 }}>
            ✅ Terkunci
          </span>
        ),
    },
  ]

  return (
    <div>
      {/* Header Halaman */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-navy)' }}>
          ⚙️ Sortasi & Grading Mutu Komoditas
        </h1>
        <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Pemilahan hasil panen mentah menjadi stok per kelas mutu (Grade A, Grade B, dan Afkir) dengan validasi mutlak Keseimbangan Massa (*Mass Balance*).
        </p>
      </div>

      {/* Banner Peringatan Reorder Point (Ciri Khas Caca) */}
      <div style={{ marginBottom: '16px' }}>
        <AlertBanner
          variant="warning"
          title="Peringatan Restock (Reorder Point - ROP Gudang)"
          message="Stok karung kemasan berpendingin 50 kg tersisa 15 lembar. Segera lakukan pengadaan ulang ke pemasok."
        />
      </div>

      {/* Notifikasi Status Form */}
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

      {/* Grid Formulir Sortasi & Indikator Mass Balance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Kartu Form Input Sortasi */}
        <div className="card" style={{ padding: '24px' }}>
          <div className="card-header" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
            <h2 className="card-title" style={{ fontSize: '18px', margin: 0 }}>
              Form Input Grading & Pemilahan Mutu
            </h2>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Memvalidasi aturan SRS-MFG-005 (total input curah = total output mutu + afkir)
            </span>
          </div>

          <form onSubmit={handleSaveSorting} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Pilih Batch Panen */}
            <FormField label="Pilih Batch Panen Masuk (GD-MTH)" required hint="Ambil dari bukti timbang setoran anggota">
              <select
                className="form-control"
                value={selectedReceiptId}
                onChange={(e) => handleSelectReceipt(e.target.value)}
                style={{ fontSize: '15px', padding: '12px' }}
                disabled={!canSort || submitting}
              >
                {harvestReceipts.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.batch_code} ({r.receipt_no}) — Netto: {formatKg(r.net_kg)}
                  </option>
                ))}
              </select>
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Kode Batch Induk" required>
                <input
                  type="text"
                  className="form-control"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  style={{ fontSize: '15px', padding: '10px' }}
                  disabled={!canSort || submitting}
                />
              </FormField>

              <FormField label="Total Berat Input Curah (kg)" required>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={inputCurah || ''}
                  onChange={(e) => setInputCurah(parseFloat(e.target.value) || 0)}
                  style={{ fontSize: '18px', fontWeight: 700, padding: '10px', color: 'var(--color-navy)' }}
                  disabled={!canSort || submitting}
                />
              </FormField>
            </div>

            {/* Tabel Input Grading Mutu (Ciri Khas Caca) */}
            <div style={{ marginTop: '8px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>
                Hasil Penimbangan per Kategori Mutu:
              </label>

              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '10px 14px' }}>Kelas Mutu</th>
                      <th style={{ padding: '10px 14px' }}>Kriteria Fisik</th>
                      <th style={{ padding: '10px 14px', width: '140px' }}>Berat (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--color-green)' }}>
                        Mutu A (Super / Modern)
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '12.5px', color: '#64748b' }}>
                        Kadar air &lt; 14%, fisik mulus tanpa cacat
                      </td>
                      <td style={{ padding: '6px 14px' }}>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={mutuA || ''}
                          onChange={(e) => setMutuA(parseFloat(e.target.value) || 0)}
                          style={{ fontWeight: 600, padding: '8px' }}
                          disabled={!canSort || submitting}
                        />
                      </td>
                    </tr>

                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0284c7' }}>
                        Mutu B (Tradisional)
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '12.5px', color: '#64748b' }}>
                        Standar konsumsi umum pasar lokal
                      </td>
                      <td style={{ padding: '6px 14px' }}>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={mutuB || ''}
                          onChange={(e) => setMutuB(parseFloat(e.target.value) || 0)}
                          style={{ fontWeight: 600, padding: '8px' }}
                          disabled={!canSort || submitting}
                        />
                      </td>
                    </tr>

                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#d97706' }}>
                        Mutu C (Ekonomis)
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '12.5px', color: '#64748b' }}>
                        Ukuran kecil / olahan bumbu pasta
                      </td>
                      <td style={{ padding: '6px 14px' }}>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={mutuC || ''}
                          onChange={(e) => setMutuC(parseFloat(e.target.value) || 0)}
                          style={{ fontWeight: 600, padding: '8px' }}
                          disabled={!canSort || submitting}
                        />
                      </td>
                    </tr>

                    <tr style={{ backgroundColor: '#fff5f5' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#dc2626' }}>
                        Afkir (Susut / Reject)
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '12.5px', color: '#991b1b' }}>
                        Busuk / rusak (dialihkan ke kompos)
                      </td>
                      <td style={{ padding: '6px 14px' }}>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={afkir || ''}
                          onChange={(e) => setAfkir(parseFloat(e.target.value) || 0)}
                          style={{ fontWeight: 700, color: '#dc2626', padding: '8px' }}
                          disabled={!canSort || submitting}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* INDIKATOR REAL-TIME MASS BALANCE (Ciri Khas Caca) */}
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: isBalanced ? '#dcfce7' : '#fee2e2',
                border: `2px solid ${isBalanced ? '#22c55e' : '#ef4444'}`,
                color: isBalanced ? '#166534' : '#991b1b',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px', fontWeight: 700 }}>
                <span>
                  Total Output: {totalOutput} kg / {inputCurahNum} kg
                </span>
                <span>
                  {isBalanced
                    ? '✅ Mass Balance Sesuai (0 kg selisih)'
                    : selisih > 0
                    ? `⚠️ Kurang ${selisih} kg lagi`
                    : `❌ Kelebihan ${Math.abs(selisih)} kg`}
                </span>
              </div>
              <div style={{ fontSize: '12.5px', marginTop: '6px', opacity: 0.9 }}>
                {isBalanced
                  ? 'Keseimbangan massa terpenuhi 100%. Data siap dikunci dan dialokasikan ke gudang stok FIFO.'
                  : 'Total bobot output mutlak harus seimbang dengan berat input sebelum tombol simpan dapat ditekan.'}
              </div>
            </div>

            {/* Tombol Simpan (Otomatis Disabled jika Tidak Seimbang) */}
            <Button
              type="submit"
              variant="success"
              disabled={!canSort || submitting || !isBalanced}
              style={{
                padding: '16px',
                fontSize: '17px',
                fontWeight: 700,
                width: '100%',
                marginTop: '4px',
              }}
            >
              {submitting
                ? 'Mengunci Batch & Memposting Stok...'
                : isBalanced
                ? '💾 Simpan Hasil Sortasi & Kunci Batch FIFO'
                : '⚠️ Lengkapi Berat Hingga Seimbang untuk Menyimpan'}
            </Button>
          </form>
        </div>

        {/* Panel Ringkasan Susut & Informasi Bisnis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card Statistik Susut / Food Loss */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: 'var(--color-navy)' }}>
              📊 Metrik Efisiensi & Susut Panen
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Rasio Mutu Komersial (A+B)</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-green)' }}>
                  {inputCurahNum > 0 ? (((parseFloat(mutuA || 0) + parseFloat(mutuB || 0)) / inputCurahNum) * 100).toFixed(1) : 0}%
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Rasio Susut / Afkir (Limbah)</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#dc2626' }}>
                  {shrinkPct}%
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: '1.6' }}>
              Komponen afkir bernilai beli Rp0 dan otomatis diteruskan ke indikator <em>Food Loss ESG</em> serta pencatatan limbah organik untuk bahan baku pupuk kompos.
            </p>
          </div>

          {/* SOP Sortasi */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: 'var(--color-navy)' }}>
              📋 SOP Sortasi & Rotasi Stok FIFO
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              <li><strong>Zero Tolerance:</strong> Sistem memblokir toleransi selisih bobot &gt; 0 kg sesuai kaidah hukum kekekalan massa (Mass Balance).</li>
              <li><strong>Alokasi Lot Otomatis:</strong> Hasil sortasi mutu A dan B langsung menerima ID Lot Baru bertanggal terima sama untuk memastikan rotasi FIFO saat penjualan.</li>
              <li><strong>Auto-Journaling:</strong> Saat order berstatus <em>POSTED</em>, sistem akuntansi otomatis mendebit Persediaan Barang Jadi dan mengkredit Persediaan Panen Curah.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tabel Riwayat Sortasi */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '18px', margin: 0 }}>
              Riwayat Order Sortasi & Grading
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Daftar proses pemilahan mutu yang telah diselesaikan
            </span>
          </div>
          <Badge variant="green">{sortingOrders.length} Order</Badge>
        </div>

        <Table
          columns={sortingColumns}
          data={sortingOrders}
          loading={loading}
          emptyText="Belum ada order sortasi tercatat."
        />
      </div>
    </div>
  )
}
