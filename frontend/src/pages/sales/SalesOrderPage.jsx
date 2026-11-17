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
  KONSUMEN: 'Konsumen Langsung',
  RETAIL: 'Retail (Toko & Warung)',
  PASAR_MODERN: 'Pasar Modern (Supermarket)',
}

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

  const [selectedSegment, setSelectedSegment] = useState('RETAIL')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [orderDate, setOrderDate] = useState(todayISODate())
  const [orderNote, setOrderNote] = useState('')
  const [lines, setLines] = useState([
    { product_id: 1, grade_id: 1, qty: '250' },
  ])

  const [banner, setBanner] = useState({ type: 'info', text: '' })
  const [submitting, setSubmitting] = useState(false)

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

      const allGrades = Object.values(gMap)
      setLines((prev) =>
        prev.map((ln) => {
          const prod =
            (prodList || []).find((p) => Number(p.id) === Number(ln.product_id)) ||
            (prodList || [])[0]
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

      if (!selectedCustomerId && custList?.length > 0) {
        const defaultCust =
          custList.find((c) => c.segment === selectedSegment) || custList[0]
        setSelectedCustomerId(String(defaultCust.id))
        setSelectedSegment(defaultCust.segment)
      }
    } catch (err) {
      setBanner({
        type: 'danger',
        text: err.message || 'Gagal memuat data penjualan dan stok gudang.',
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

  const applySamplePreset = () => {
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
    setOrderNote('Pesanan Cabai Grade A (700 kg) dan Grade B (200 kg)')
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
      setBanner({ type: 'danger', text: 'Silakan pilih pelanggan terlebih dahulu.' })
      return
    }
    if (hasStockError) {
      setBanner({
        type: 'danger',
        text: 'Pesanan tidak dapat diproses karena jumlah melebihi stok yang tersedia.',
      })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        customer_id: Number(selectedCustomerId),
        order_date: orderDate,
        note: orderNote.trim() || null,
        lines: computedLines.map((ln) => ({
          product_id: Number(ln.product_id),
          grade_id: Number(ln.grade_id),
          qty: Number(ln.qtyNum),
        })),
      }

      const created = await createSalesOrderApi(payload)
      setBanner({
        type: 'success',
        text: `Pesanan penjualan ${created.so_no} berhasil dikonfirmasi dengan total ${formatRupiah(
          created.total
        )}.`,
      })
      setOrderNote('')
      setLines([{ product_id: 1, grade_id: 1, qty: '150' }])
      loadSalesData()
    } catch (err) {
      setBanner({
        type: 'danger',
        text: err.message || 'Gagal mengonfirmasi pesanan penjualan.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleShipOrder = async (order) => {
    try {
      const res = await shipSalesOrderApi(order.id, {
        auto_invoice: true,
        distance_km: 20,
        vehicle_type: 'PICKUP',
      })
      setBanner({
        type: 'success',
        text: `Pengiriman dikonfirmasi. Surat Jalan ${res.delivery_order?.do_no} dan Faktur ${res.invoice?.invoice_no} telah diterbitkan.`,
      })
      loadSalesData()
    } catch (err) {
      setBanner({ type: 'danger', text: err.message || 'Gagal memproses pengiriman.' })
    }
  }

  const handleCancelOrder = async (order) => {
    try {
      await cancelSalesOrderApi(order.id)
      setBanner({
        type: 'warning',
        text: `Pesanan ${order.so_no} dibatalkan dan reservasi stok dikembalikan ke gudang.`,
      })
      loadSalesData()
    } catch (err) {
      setBanner({ type: 'danger', text: err.message || 'Gagal membatalkan pesanan.' })
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pesanan Penjualan &amp; Alokasi Stok FIFO</h1>
          <p className="page-subtitle">
            Buat pesanan penjualan dengan harga satuan otomatis sesuai segmen pelanggan dan
            alokasi stok berdasarkan urutan batch tertua.
          </p>
        </div>

        {canCreateOrder && (
          <Button variant="outline" size="sm" onClick={applySamplePreset}>
            Isi Contoh Pesanan Cabai
          </Button>
        )}
      </div>

      <AlertBanner
        variant={banner.type}
        onClose={() => setBanner({ type: 'info', text: '' })}
      >
        {banner.text}
      </AlertBanner>

      {canCreateOrder && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Formulir Pesanan Penjualan Baru</h2>
              <p className="card-subtitle">
                Pilih segmen dan pelanggan. Harga satuan terkunci otomatis mengikuti daftar harga
                segmen.
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
              Segmen: {SEGMENT_LABELS[effectiveSegment] || effectiveSegment}
            </Badge>
          </div>

          <form onSubmit={handleConfirmOrder}>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
              <FormField
                label="Segmen Pelanggan"
                name="segment_selector"
                type="select"
                value={effectiveSegment}
                onChange={(e) => handleSegmentChange(e.target.value)}
                options={[
                  { value: 'KONSUMEN', label: 'Konsumen Langsung (Eceran)' },
                  { value: 'RETAIL', label: 'Retail (Toko & Warung)' },
                  { value: 'PASAR_MODERN', label: 'Pasar Modern (Supermarket)' },
                ]}
                hint="Menentukan harga jual satuan secara otomatis."
              />

              <FormField
                label="Nama Pelanggan"
                name="customer_id"
                type="select"
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                options={customers.map((c) => ({
                  value: String(c.id),
                  label: `${c.code} - ${c.name} (${c.segment})`,
                }))}
                required
                hint={
                  activeCustomer
                    ? `Alamat: ${activeCustomer.address || '-'} | Termin: ${activeCustomer.payment_term_days} hari`
                    : 'Pilih pelanggan terdaftar'
                }
              />

              <FormField
                label="Tanggal Pesanan"
                name="order_date"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
                hint={`Tanggal: ${formatDateID(orderDate)}`}
              />
            </div>

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
                  Rincian Barang Pesanan
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
                  + Tambah Baris Barang
                </Button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '24%' }}>Komoditas</th>
                      <th style={{ width: '18%' }}>Grade Mutu</th>
                      <th style={{ width: '15%' }}>Stok Tersedia</th>
                      <th style={{ width: '15%' }}>Jumlah Pesan (kg)</th>
                      <th style={{ width: '15%' }}>Harga Satuan</th>
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
                                  {p.code} - {p.name}
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
                                Melebihi stok tersedia (kurang {formatKg(ln.fifo.shortfall)})
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
                              title="Harga satuan terkunci otomatis mengikuti segmen pelanggan"
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
                    Alokasi Stok Batch FIFO (First-In, First-Out)
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Stok barang jadi dialokasikan otomatis mulai dari tanggal masuk atau sortasi
                    paling awal.
                  </p>
                </div>
                <Badge variant="navy">Prioritas Batch Tertua</Badge>
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
                    {ln.product?.name} - Grade {ln.grade?.code} (Pesanan: {formatKg(ln.qtyNum)} |
                    Stok Tersedia: {formatKg(ln.fifo.totalAvailable)})
                  </div>
                  <Table
                    rowKey="lot_id"
                    data={ln.fifo.allocations}
                    emptyMessage="Tidak ada stok batch tersedia untuk komoditas dan grade ini."
                    columns={[
                      {
                        key: 'order_idx',
                        header: 'Urutan Prioritas',
                        render: (_, idx) => (
                          <Badge variant={idx === 0 ? 'green' : 'navy'}>
                            Batch #{idx + 1} {idx === 0 ? '(Tertua)' : ''}
                          </Badge>
                        ),
                      },
                      {
                        key: 'batch_code',
                        header: 'Nomor Batch',
                        render: (r) => <strong>{r.batch_code}</strong>,
                      },
                      {
                        key: 'received_at',
                        header: 'Tanggal Masuk',
                        render: (r) => formatDateTimeID(r.received_at),
                      },
                      {
                        key: 'expiry_date',
                        header: 'Batas Simpan',
                        render: (r) => formatDateID(r.expiry_date),
                      },
                      {
                        key: 'qty_available',
                        header: 'Stok Awal Batch',
                        render: (r) => formatKg(r.qty_available),
                      },
                      {
                        key: 'qty_allocated',
                        header: 'Dialokasikan',
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
                  label="Catatan Pengiriman (Opsional)"
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
                    TOTAL PESANAN
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
                  {submitting ? 'Memproses...' : 'Konfirmasi Pesanan'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Daftar Pesanan Penjualan &amp; Pengiriman</h2>
            <p className="card-subtitle">
              Riwayat pesanan yang telah dikonfirmasi beserta status pengiriman dan faktur.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadSalesData}>
            Muat Ulang
          </Button>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          data={orders}
          emptyMessage="Belum ada data pesanan penjualan."
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
                    <div style={{ fontWeight: 600 }}>
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
              header: 'Rincian Barang & Batch',
              render: (r) =>
                r.lines && r.lines.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {r.lines.map((ln, idx) => (
                      <div key={idx} style={{ fontSize: '13px' }}>
                        <strong>
                          {ln.product_name || `Produk #${ln.product_id}`} (Grade {ln.grade_code})
                        </strong>
                        : {formatKg(ln.qty)} x {formatRupiah(ln.unit_price)}
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
                    {r.note || 'Teralokasi sesuai urutan batch'}
                  </span>
                ),
            },
            {
              key: 'total',
              header: 'Total Nilai',
              render: (r) => <strong>{formatRupiah(r.total)}</strong>,
            },
            {
              key: 'status',
              header: 'Status',
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
              header: 'Aksi',
              render: (r) => (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {r.status === 'CONFIRMED' && canShipOrder && (
                    <Button variant="success" size="sm" onClick={() => handleShipOrder(r)}>
                      Kirim Barang
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPrintPreviewOrder(r)}
                  >
                    Surat Jalan
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

      <Modal
        isOpen={Boolean(printPreviewOrder)}
        onClose={() => setPrintPreviewOrder(null)}
        size="lg"
        title={
          printPreviewOrder
            ? `Surat Jalan Pengiriman (${printPreviewOrder.do_no || printPreviewOrder.so_no})`
            : 'Surat Jalan'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setPrintPreviewOrder(null)}>
              Tutup
            </Button>
            <Button variant="primary" onClick={() => window.print()}>
              Cetak Surat Jalan
            </Button>
          </>
        }
      >
        {printPreviewOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    SURAT JALAN PENGIRIMAN BARANG
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Koperasi Tani Mandiri Smart Farming
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
                  <strong>Tujuan Pelanggan:</strong>{' '}
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
                emptyMessage="Rincian barang pengiriman tercatat pada sistem."
                columns={[
                  { key: 'product_name', header: 'Komoditas' },
                  {
                    key: 'grade_code',
                    header: 'Grade',
                    render: (r) => <Badge variant="green">Grade {r.grade_code}</Badge>,
                  },
                  {
                    key: 'batches',
                    header: 'Nomor Batch FIFO',
                    render: (r) =>
                      (r.allocations || []).map((a) => a.batch_code).join(', ') || '-',
                  },
                  {
                    key: 'qty',
                    header: 'Jumlah Kirim',
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
                  fontWeight: 700,
                }}
              >
                Total Nilai: {formatRupiah(printPreviewOrder.total)}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
