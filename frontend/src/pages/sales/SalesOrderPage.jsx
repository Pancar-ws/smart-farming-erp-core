import { useEffect, useMemo, useState } from 'react'
import AlertBanner from '../../components/AlertBanner'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import Modal from '../../components/Modal'
import Table from '../../components/Table'
import { useAuth } from '../../hooks/useAuth'
import {
  fetchCategoriesApi,
  fetchCustomersApi,
  fetchGradesByCategoryApi,
  fetchProductsApi,
  fetchSalesPricesApi,
} from '../../services/masterService'
import {
  cancelSalesOrderApi,
  createSalesOrderApi,
  fetchSalesOrdersApi,
  fetchSellableLotsFIFOApi,
  lookupEffectivePrice,
  shipSalesOrderApi,
  simulateFifoAllocation,
} from '../../services/salesService'
import {
  formatDateID,
  formatDateTimeID,
  formatKg,
  formatRupiah,
  todayISODate,
} from '../../utils/formatters'

const SEGMENT_LABELS = {
  KONSUMEN: 'Konsumen Langsung (Eceran)',
  RETAIL: 'Retail (Toko & Warung)',
  PASAR_MODERN: 'Pasar Modern (Supermarket)',
}

/**
 * Layar Sales Order, Price Tiering & Alokasi FIFO (Screen ID: UI-SLS-01 — Fitur 5 Tugas Rani)
 * Spesifikasi SDD & URS:
 * - Pilihan segmen (Konsumen Langsung / Retail / Pasar Modern) mengubah harga satuan otomatis & terkunci (read-only)
 * - Tabel alokasi batch FIFO diurutkan dari tanggal masuk/sortasi tertua
 * - Validasi real-time: jumlah pesanan tidak boleh melebihi stok tersedia (URS-SLS-004)
 * - Tombol "Konfirmasi Pesanan" & tombol placeholder "Cetak Surat Jalan"
 */
export default function SalesOrderPage() {
  const { hasPermission } = useAuth()
  const canCreateOrder = hasPermission(['sales:order'])
  const canShipOrder = hasPermission(['sales:ship'])

  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [gradesMap, setGradesMap] = useState({})
  const [salesPrices, setSalesPrices] = useState([])
  const [lots, setLots] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // State Form Pembuatan Sales Order (UI-SLS-01)
  const [selectedSegment, setSelectedSegment] = useState('RETAIL')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [orderDate, setOrderDate] = useState(todayISODate())
  const [orderNote, setOrderNote] = useState('')
  const [lines, setLines] = useState([
    { product_id: 1, grade_id: 1, qty: '250' },
  ])

  const [banner, setBanner] = useState({ type: 'info', text: '' })
  const [submitting, setSubmitting] = useState(false)

  // Modal Preview Cetak Surat Jalan (Placeholder bagian Amel - URS-SLS-007)
  const [printPreviewOrder, setPrintPreviewOrder] = useState(null)

  const loadSalesData = async () => {
    setLoading(true)
    try {
      const [custList, prodList, catList, priceList, lotList, orderList] = await Promise.all([
        fetchCustomersApi(),
        fetchProductsApi(),
        fetchCategoriesApi(),
        fetchSalesPricesApi(),
        fetchSellableLotsFIFOApi(),
        fetchSalesOrdersApi(),
      ])

      const gMap = {}
      for (const c of catList || []) {
        const gList = await fetchGradesByCategoryApi(c.id)
        for (const g of gList || []) {
          gMap[g.id] = g
        }
      }

      setCustomers(custList || [])
      setProducts(prodList || [])
      setGradesMap(gMap)
      setSalesPrices(priceList || [])
      setLots(lotList || [])
      setOrders(orderList || [])

      // Pastikan setiap baris memilih grade non-reject pertama (Grade A) sesuai ID database
      const allGrades = Object.values(gMap)
      setLines((prev) =>
        prev.map((ln) => {
          const prod = (prodList || []).find((p) => Number(p.id) === Number(ln.product_id)) || (prodList || [])[0]
          const validGrades = allGrades
            .filter((g) => prod && g.category_id === prod.category_id && !g.is_reject)
            .sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))
          const currentValid = validGrades.some((g) => Number(g.id) === Number(ln.grade_id))
          return {
            ...ln,
            product_id: prod ? prod.id : ln.product_id,
            grade_id: currentValid ? ln.grade_id : validGrades[0]?.id ?? ln.grade_id,
          }
        })
      )

      // Pilih pelanggan pertama yang sesuai segmen default bila belum dipilih
      if (!selectedCustomerId && custList?.length > 0) {
        const defaultCust =
          custList.find((c) => c.segment === selectedSegment) || custList[0]
        setSelectedCustomerId(String(defaultCust.id))
        setSelectedSegment(defaultCust.segment)
      }
    } catch (err) {
      setBanner({
        type: 'danger',
        text: err.message || 'Gagal memuat data penjualan dan stok FIFO.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSalesData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pelanggan aktif & segmen terkunci
  const activeCustomer = useMemo(
    () => customers.find((c) => String(c.id) === String(selectedCustomerId)) || null,
    [customers, selectedCustomerId]
  )

  const effectiveSegment = activeCustomer ? activeCustomer.segment : selectedSegment

  const handleSegmentChange = (newSeg) => {
    setSelectedSegment(newSeg)
    const matchingCust = customers.find((c) => c.segment === newSeg)
    if (matchingCust) {
      setSelectedCustomerId(String(matchingCust.id))
    }
  }

  const handleCustomerChange = (custId) => {
    setSelectedCustomerId(custId)
    const cust = customers.find((c) => String(c.id) === String(custId))
    if (cust) {
      setSelectedSegment(cust.segment)
    }
  }

  // Kalkulasi baris pesanan: harga satuan terkunci otomatis + simulasi alokasi batch FIFO
  const computedLines = useMemo(() => {
    return lines.map((ln, index) => {
      const product = products.find((p) => Number(p.id) === Number(ln.product_id))
      const sellableGrades = Object.values(gradesMap).filter(
        (g) => product && g.category_id === product.category_id && !g.is_reject
      )
      const grade = gradesMap[Number(ln.grade_id)]

      const lockedUnitPrice = lookupEffectivePrice(
        salesPrices,
        ln.product_id,
        ln.grade_id,
        effectiveSegment,
        orderDate
      )

      const qtyNum = Number(ln.qty || 0)
      const fifo = simulateFifoAllocation(lots, ln.product_id, ln.grade_id, qtyNum)
      const subtotal = lockedUnitPrice !== null && qtyNum > 0 ? qtyNum * lockedUnitPrice : 0

      return {
        index,
        ...ln,
        product,
        grade,
        sellableGrades,
        lockedUnitPrice,
        qtyNum,
        subtotal,
        fifo,
      }
    })
  }, [lines, products, gradesMap, salesPrices, effectiveSegment, orderDate, lots])

  const grandTotal = useMemo(
    () => computedLines.reduce((sum, l) => sum + l.subtotal, 0),
    [computedLines]
  )

  const hasStockError = useMemo(
    () =>
      computedLines.some(
        (l) => l.qtyNum <= 0 || !l.fifo.isSufficient || l.lockedUnitPrice === null
      ),
    [computedLines]
  )

  const handleAddLine = () => {
    const firstProd = products[0]
    const firstGrade = Object.values(gradesMap).find(
      (g) => firstProd && g.category_id === firstProd.category_id && !g.is_reject
    )
    setLines((prev) => [
      ...prev,
      {
        product_id: firstProd ? firstProd.id : 1,
        grade_id: firstGrade ? firstGrade.id : 1,
        qty: '100',
      },
    ])
  }

  const handleRemoveLine = (idx) => {
    if (lines.length <= 1) return
    setLines((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleLineChange = (idx, field, val) => {
    setLines((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item
        if (field === 'product_id') {
          const prod = products.find((p) => Number(p.id) === Number(val))
          const defaultGrade = Object.values(gradesMap).find(
            (g) => prod && g.category_id === prod.category_id && !g.is_reject
          )
          return {
            ...item,
            product_id: Number(val),
            grade_id: defaultGrade ? defaultGrade.id : item.grade_id,
          }
        }
        return { ...item, [field]: field === 'grade_id' ? Number(val) : val }
      })
    )
  }

  // Preset simulasi UAT-08 (Cabai Grade A 700 kg + Grade B 200 kg ke Retail)
  const applyUat08Preset = () => {
    const retailCust = customers.find((c) => c.segment === 'RETAIL')
    if (retailCust) {
      setSelectedCustomerId(String(retailCust.id))
      setSelectedSegment('RETAIL')
    }
    const cabaiProd = products.find((p) => p.code?.startsWith('CABAI')) || products[0]
    const cabaiCatId = cabaiProd ? cabaiProd.category_id : 1
    const gradeA = Object.values(gradesMap).find(
      (g) => g.category_id === cabaiCatId && g.code === 'A'
    )
    const gradeB = Object.values(gradesMap).find(
      (g) => g.category_id === cabaiCatId && g.code === 'B'
    )
    setOrderNote('Simulasi UAT-08: Pesanan Cabai Grade A (700 kg) & Grade B (200 kg)')
    setLines([
      {
        product_id: cabaiProd ? cabaiProd.id : 1,
        grade_id: gradeA ? gradeA.id : 1,
        qty: '700',
      },
      {
        product_id: cabaiProd ? cabaiProd.id : 1,
        grade_id: gradeB ? gradeB.id : 2,
        qty: '200',
      },
    ])
  }

  const handleConfirmOrder = async (e) => {
    e.preventDefault()
    if (!selectedCustomerId) {
      setBanner({ type: 'danger', text: 'Harap pilih pelanggan terlebih dahulu.' })
      return
    }
    if (hasStockError) {
      setBanner({
        type: 'danger',
        text: 'Pesanan ditolak: Terdapat baris pesanan dengan kuantitas melebihi stok tersedia atau tidak valid (URS-SLS-004).',
      })
      return
    }

    setSubmitting(true)
    try {
      const created = await createSalesOrderApi({
        customer_id: Number(selectedCustomerId),
        order_date: orderDate,
        note: orderNote.trim() || null,
        lines: computedLines.map((l) => ({
          product_id: Number(l.product_id),
          grade_id: Number(l.grade_id),
          qty: Number(l.qtyNum),
        })),
      })

      setBanner({
        type: 'success',
        text: `Sales Order ${created.so_no} berhasil dikonfirmasi! Harga segmen ${created.segment} telah dikunci dan stok batch tertua (FIFO) berhasil direservasi.`,
      })
      setOrderNote('')
      loadSalesData()
    } catch (err) {
      setBanner({
        type: 'danger',
        text: err.message || 'Gagal mengonfirmasi Sales Order.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleShipOrder = async (so) => {
    try {
      const res = await shipSalesOrderApi(so.id, {
        auto_invoice: true,
        vehicle_type: 'Truk Box Pendingin',
        distance_km: 25,
      })
      setBanner({
        type: 'success',
        text: `Pengiriman berhasil! Surat Jalan ${res.delivery_order?.do_no} dan Faktur Penjualan ${res.invoice?.invoice_no} telah diterbitkan. Stok gudang berkurang sesuai FIFO.`,
      })
      loadSalesData()
    } catch (err) {
      setBanner({ type: 'danger', text: err.message || 'Gagal memproses pengiriman SO.' })
    }
  }

  const handleCancelOrder = async (so) => {
    try {
      await cancelSalesOrderApi(so.id)
      setBanner({
        type: 'warning',
        text: `Sales Order ${so.so_no} telah dibatalkan dan reservasi stok dikembalikan ke batch asal.`,
      })
      loadSalesData()
    } catch (err) {
      setBanner({ type: 'danger', text: err.message || 'Gagal membatalkan SO.' })
    }
  }

  return (
    <div>
      {/* Header Layar UI-SLS-01 */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <Badge variant="navy">Screen ID: UI-SLS-01</Badge>
            <Badge variant="green">Fitur 5 — Sales, Price Tiering &amp; Alokasi FIFO</Badge>
            <Badge variant="amber">URS-SLS-001 s.d. 007 &amp; UAT-08</Badge>
          </div>
          <h1 className="page-title">Pesanan Penjualan (Sales Order) &amp; Alokasi Batch FIFO</h1>
          <p className="page-subtitle">
            Harga jual satuan otomatis terkunci berdasarkan segmen pelanggan (
            <strong>Konsumen Langsung / Retail / Pasar Modern</strong>) dan pengeluaran barang jadi
            wajib memprioritaskan batch tertua (<strong>First-In, First-Out</strong>).
          </p>
        </div>

        {canCreateOrder && (
          <Button variant="outline" size="sm" onClick={applyUat08Preset}>
            Isi Skenario Uji UAT-08 (Cabai 700kg A + 200kg B)
          </Button>
        )}
      </div>

      <AlertBanner
        variant={banner.type}
        onClose={() => setBanner({ type: 'info', text: '' })}
      >
        {banner.text}
      </AlertBanner>

      {/* BAGIAN 1: FORMULIR PEMBUATAN SALES ORDER & PREVIEW ALOKASI FIFO */}
      {canCreateOrder && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">
                1. Formulir Pembuatan Sales Order Baru (Price Tiering Otomatis)
              </h2>
              <p className="card-subtitle">
                Pilih segmen pasar atau pelanggan komersial. Kolom harga satuan dikunci otomatis
                (read-only) untuk mencegah kesalahan input harga di lapangan.
              </p>
            </div>
            <Badge
              variant={
                effectiveSegment === 'KONSUMEN'
                  ? 'green'
                  : effectiveSegment === 'RETAIL'
                    ? 'navy'
                    : 'amber'
              }
            >
              Segmen Harga Aktif: {SEGMENT_LABELS[effectiveSegment] || effectiveSegment}
            </Badge>
          </div>

          <form onSubmit={handleConfirmOrder}>
            {/* Baris Atas: Pilihan Segmen, Pelanggan, Tanggal */}
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
              <FormField
                label="Pilihan Segmen Pasar (Price Tier)"
                name="segment_selector"
                type="select"
                value={effectiveSegment}
                onChange={(e) => handleSegmentChange(e.target.value)}
                options={[
                  { value: 'KONSUMEN', label: 'Konsumen Langsung (Harga Eceran)' },
                  { value: 'RETAIL', label: 'Retail — Toko & Warung (Harga Menengah)' },
                  { value: 'PASAR_MODERN', label: 'Pasar Modern — Supermarket (Harga Kontrak)' },
                ]}
                hint="Mengubah segmen akan memperbarui harga satuan secara otomatis."
              />

              <FormField
                label="Pelanggan / Mitra Pembeli"
                name="customer_id"
                type="select"
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                options={customers.map((c) => ({
                  value: String(c.id),
                  label: `${c.code} — ${c.name} [${c.segment}]`,
                }))}
                required
                hint={
                  activeCustomer
                    ? `Alamat: ${activeCustomer.address || '-'} | TOP: ${activeCustomer.payment_term_days} hari`
                    : 'Pilih pelanggan terdaftar'
                }
              />

              <FormField
                label="Tanggal Pesanan (Order Date)"
                name="order_date"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
                hint={`Format tampilan: ${formatDateID(orderDate)}`}
              />
            </div>

            {/* Baris Item Produk & Harga Terkunci */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <h3 style={{ fontSize: '15.5px' }}>
                  Rincian Item Komoditas &amp; Kuncian Harga Segmen ({effectiveSegment})
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
                  + Tambah Baris Komoditas
                </Button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '24%' }}>Komoditas Produk</th>
                      <th style={{ width: '18%' }}>Kelas Mutu (Grade)</th>
                      <th style={{ width: '15%' }}>Stok Tersedia</th>
                      <th style={{ width: '15%' }}>Kuantitas Pesan (kg)</th>
                      <th style={{ width: '15%' }}>Harga Satuan (Terkunci)</th>
                      <th style={{ width: '13%' }}>Subtotal</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computedLines.map((ln) => {
                      const overStock = ln.qtyNum > ln.fifo.totalAvailable
                      return (
                        <tr key={ln.index}>
                          <td>
                            <select
                              className="form-control"
                              value={ln.product_id}
                              onChange={(e) =>
                                handleLineChange(ln.index, 'product_id', e.target.value)
                              }
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.code} — {p.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              className="form-control"
                              value={ln.grade_id}
                              onChange={(e) =>
                                handleLineChange(ln.index, 'grade_id', e.target.value)
                              }
                            >
                              {ln.sellableGrades.map((g) => (
                                <option key={g.id} value={g.id}>
                                  Grade {g.code} ({g.name})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <Badge variant={ln.fifo.totalAvailable > 0 ? 'green' : 'red'}>
                              {formatKg(ln.fifo.totalAvailable)}
                            </Badge>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              className={`form-control ${overStock || ln.qtyNum <= 0 ? 'has-error' : ''}`}
                              value={ln.qty}
                              onChange={(e) =>
                                handleLineChange(ln.index, 'qty', e.target.value)
                              }
                            />
                            {overStock && (
                              <div className="form-error" style={{ marginTop: '4px' }}>
                                Melebihi stok! Kurang {formatKg(ln.fifo.shortfall)} (URS-SLS-004)
                              </div>
                            )}
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              readOnly
                              value={
                                ln.lockedUnitPrice !== null
                                  ? `${formatRupiah(ln.lockedUnitPrice)} / kg`
                                  : 'Belum Diatur'
                              }
                              title="Harga satuan dikunci otomatis berdasarkan segmen pelanggan"
                            />
                          </td>
                          <td>
                            <strong>{formatRupiah(ln.subtotal)}</strong>
                          </td>
                          <td>
                            {lines.length > 1 && (
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={() => handleRemoveLine(ln.index)}
                              >
                                Hapus
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabel Alokasi Batch FIFO Otomatis (Urut Tanggal Tertua) */}
            <div
              style={{
                backgroundColor: 'var(--bg-muted)',
                borderRadius: '12px',
                padding: '18px',
                border: '1px solid var(--border-subtle)',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '15.5px' }}>
                    Tabel Alokasi Stok Batch Otomatis — Prinsip FIFO (First-In, First-Out)
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Sistem mengurutkan batch barang jadi dari <strong>tanggal masuk/sortasi tertua</strong>{' '}
                    terlebih dahulu (<code>SDD 5.2.5.1.1 AllocateBatchFIFO</code>).
                  </p>
                </div>
                <Badge variant="navy">Rotasi Otomatis: Batch Tertua Lebih Dulu</Badge>
              </div>

              {computedLines.map((ln) => (
                <div key={`fifo-${ln.index}`} style={{ marginBottom: '14px' }}>
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 700,
                      marginBottom: '6px',
                      color: 'var(--color-navy)',
                    }}
                  >
                    Alokasi FIFO untuk: {ln.product?.name} — Grade {ln.grade?.code} (Pesanan:{' '}
                    {formatKg(ln.qtyNum)} | Tersedia: {formatKg(ln.fifo.totalAvailable)})
                  </div>
                  <Table
                    rowKey="lot_id"
                    data={ln.fifo.allocations}
                    emptyMessage="Tidak ada stok batch tersedia untuk produk dan grade ini."
                    columns={[
                      {
                        key: 'order_idx',
                        header: 'Urutan FIFO',
                        render: (_, idx) => (
                          <Badge variant={idx === 0 ? 'green' : 'navy'}>
                            Prioritas #{idx + 1} {idx === 0 ? '(Batch Tertua)' : ''}
                          </Badge>
                        ),
                      },
                      {
                        key: 'batch_code',
                        header: 'Nomor Batch Produk Jadi',
                        render: (r) => <strong>{r.batch_code}</strong>,
                      },
                      {
                        key: 'received_at',
                        header: 'Tanggal Masuk / Sortasi',
                        render: (r) => formatDateTimeID(r.received_at),
                      },
                      {
                        key: 'expiry_date',
                        header: 'Batas Masa Simpan',
                        render: (r) => formatDateID(r.expiry_date),
                      },
                      {
                        key: 'qty_available',
                        header: 'Stok Batch Sebelumnya',
                        render: (r) => formatKg(r.qty_available),
                      },
                      {
                        key: 'qty_allocated',
                        header: 'Dialokasikan ke SO Ini',
                        render: (r) => (
                          <strong style={{ color: 'var(--color-green)' }}>
                            {formatKg(r.qty_allocated)}
                          </strong>
                        ),
                      },
                      {
                        key: 'remaining_after',
                        header: 'Sisa Stok Batch',
                        render: (r) => formatKg(r.remaining_after),
                      },
                    ]}
                  />
                </div>
              ))}
            </div>

            {/* Catatan & Ringkasan Total Faktur + Tombol Konfirmasi Pesanan */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '20px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: '280px' }}>
                <FormField
                  label="Catatan Pesanan / Instruksi Pengiriman (Opsional)"
                  name="note"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Contoh: Kirim pagi pukul 06:00 WIB ke gudang penerima"
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  backgroundColor: 'var(--color-navy-soft)',
                  padding: '16px 22px',
                  borderRadius: '12px',
                  border: '1px solid #B6D4FE',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-navy)' }}>
                    TOTAL NILAI PESANAN ({effectiveSegment})
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                    {formatRupiah(grandTotal)}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={submitting || hasStockError}
                >
                  {submitting ? 'Memproses Alokasi FIFO...' : 'Konfirmasi Pesanan'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* BAGIAN 2: DAFTAR SALES ORDER, PENGIRIMAN (DO/FAKTUR) & CETAK SURAT JALAN */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              2. Daftar Pesanan Penjualan (Sales Orders), Surat Jalan (DO) &amp; Faktur
            </h2>
            <p className="card-subtitle">
              Riwayat pesanan yang telah dikonfirmasi beserta nomor batch FIFO yang dialokasikan.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadSalesData}>
            Segarkan Daftar SO
          </Button>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          data={orders}
          emptyMessage="Belum ada transaksi Sales Order."
          columns={[
            {
              key: 'so_no',
              header: 'Nomor SO & Tanggal',
              render: (r) => (
                <div>
                  <strong>{r.so_no}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {formatDateID(r.order_date)}
                  </div>
                </div>
              ),
            },
            {
              key: 'customer',
              header: 'Pelanggan & Segmen',
              render: (r) => {
                const cust = customers.find((c) => c.id === r.customer_id)
                return (
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {r.customer_name || cust?.name || `Pelanggan #${r.customer_id}`}
                    </div>
                    <Badge
                      variant={
                        r.segment === 'KONSUMEN'
                          ? 'green'
                          : r.segment === 'RETAIL'
                            ? 'navy'
                            : 'amber'
                      }
                    >
                      {r.segment}
                    </Badge>
                  </div>
                )
              },
            },
            {
              key: 'batch_allocations',
              header: 'Rincian Item & Batch FIFO',
              render: (r) =>
                r.lines && r.lines.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {r.lines.map((ln, idx) => (
                      <div key={idx} style={{ fontSize: '13px' }}>
                        <strong>
                          {ln.product_name || `Produk #${ln.product_id}`} (Grade {ln.grade_code})
                        </strong>
                        : {formatKg(ln.qty)} &times; {formatRupiah(ln.unit_price)}
                        {ln.allocations && ln.allocations.length > 0 && (
                          <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>
                            [Batch:{' '}
                            {ln.allocations.map((a) => `${a.batch_code} (${a.qty}kg)`).join(', ')}]
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {r.note || 'Teralokasi sesuai FIFO'}
                  </span>
                ),
            },
            {
              key: 'total',
              header: 'Total Nilai Faktur',
              render: (r) => <strong>{formatRupiah(r.total)}</strong>,
            },
            {
              key: 'status',
              header: 'Status SO',
              render: (r) => {
                const v =
                  r.status === 'SHIPPED'
                    ? 'green'
                    : r.status === 'CONFIRMED'
                      ? 'navy'
                      : 'red'
                return <Badge variant={v}>{r.status}</Badge>
              },
            },
            {
              key: 'actions',
              header: 'Aksi & Surat Jalan',
              render: (r) => (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {r.status === 'CONFIRMED' && canShipOrder && (
                    <Button variant="success" size="sm" onClick={() => handleShipOrder(r)}>
                      Kirim &amp; Terbitkan DO
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPrintPreviewOrder(r)}
                  >
                    Cetak Surat Jalan
                  </Button>
                  {r.status === 'CONFIRMED' && canCreateOrder && (
                    <Button variant="danger" size="sm" onClick={() => handleCancelOrder(r)}>
                      Batal
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Modal Placeholder Cetak Surat Jalan (Delivery Order - URS-SLS-007) */}
      <Modal
        isOpen={Boolean(printPreviewOrder)}
        onClose={() => setPrintPreviewOrder(null)}
        size="lg"
        title={
          printPreviewOrder
            ? `Pratinjau Cetak Surat Jalan (Delivery Order) — ${printPreviewOrder.do_no || printPreviewOrder.so_no}`
            : 'Surat Jalan'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setPrintPreviewOrder(null)}>
              Tutup
            </Button>
            <Button
              variant="primary"
              onClick={() => window.print()}
              title="Cetak via dialog printer browser (Placeholder modul PDF Amel)"
            >
              Cetak Dokumen (A4 / Thermal)
            </Button>
          </>
        }
      >
        {printPreviewOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <AlertBanner variant="info">
              <strong>Placeholder Modul Cetak PDF (PIC: Amel — URS-SLS-007):</strong> Dokumen
              pengiriman di bawah ini sudah memuat nomor batch barang jadi yang dialokasikan secara
              FIFO dan terhubung ke endpoint{' '}
              <code>GET /api/v1/sales/delivery-orders/&#123;do_id&#125;/pdf</code>.
            </AlertBanner>

            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '20px',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '2px solid var(--color-navy)',
                  paddingBottom: '12px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <h3 style={{ color: 'var(--color-navy)' }}>
                    SURAT JALAN PENGIRIMAN BARANG (DELIVERY ORDER)
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Koperasi Tani Agribisnis Smart Farming
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '13px' }}>
                  <div>
                    <strong>No. DO:</strong> {printPreviewOrder.do_no || 'DRAFT-DO'}
                  </div>
                  <div>
                    <strong>No. SO:</strong> {printPreviewOrder.so_no}
                  </div>
                  <div>
                    <strong>Tanggal:</strong> {formatDateID(printPreviewOrder.order_date)}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '16px', fontSize: '14px' }}>
                <div>
                  <strong>Kepada Pelanggan:</strong>{' '}
                  {printPreviewOrder.customer_name ||
                    customers.find((c) => c.id === printPreviewOrder.customer_id)?.name}
                </div>
                <div>
                  <strong>Segmen Harga:</strong> {printPreviewOrder.segment}
                </div>
              </div>

              <Table
                rowKey="grade_id"
                data={printPreviewOrder.lines || []}
                emptyMessage="Rincian item tercatat pada basis data."
                columns={[
                  { key: 'product_name', header: 'Komoditas Produk' },
                  {
                    key: 'grade_code',
                    header: 'Grade Mutu',
                    render: (r) => <Badge variant="green">Grade {r.grade_code}</Badge>,
                  },
                  {
                    key: 'batches',
                    header: 'Nomor Batch FIFO (URS-SLS-007)',
                    render: (r) =>
                      (r.allocations || []).map((a) => a.batch_code).join(', ') || '-',
                  },
                  {
                    key: 'qty',
                    header: 'Kuantitas Kirim',
                    render: (r) => <strong>{formatKg(r.qty)}</strong>,
                  },
                  {
                    key: 'unit_price',
                    header: 'Harga Satuan',
                    render: (r) => formatRupiah(r.unit_price),
                  },
                ]}
              />

              <div
                style={{
                  marginTop: '16px',
                  textAlign: 'right',
                  fontSize: '16px',
                  fontWeight: 800,
                }}
              >
                Total Nilai Pengiriman: {formatRupiah(printPreviewOrder.total)}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
