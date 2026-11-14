import { useEffect, useState } from 'react'
import AlertBanner from '../../components/AlertBanner'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import Modal from '../../components/Modal'
import Table from '../../components/Table'
import { useAuth } from '../../hooks/useAuth'
import {
  createSalesPriceApi,
  fetchCategoriesApi,
  fetchGradesByCategoryApi,
  fetchProductsApi,
  fetchPurchasePricesApi,
  fetchSalesPricesApi,
} from '../../services/masterService'
import { formatDateID, formatRupiah, todayISODate } from '../../utils/formatters'

export default function PricingCatalogPage() {
  const { hasPermission } = useAuth()
  const canWriteSalesPrice = hasPermission(['price:sales:write'])

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [gradesMap, setGradesMap] = useState({})
  const [salesPrices, setSalesPrices] = useState([])
  const [purchasePrices, setPurchasePrices] = useState([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [loading, setLoading] = useState(true)
  const [banner, setBanner] = useState({ type: 'info', text: '' })

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    product_id: '1',
    grade_id: '1',
    segment: 'RETAIL',
    price: '',
    valid_from: todayISODate(),
    note: '',
  })
  const [saving, setSaving] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [prods, cats, sPrices, pPrices] = await Promise.all([
        fetchProductsApi(),
        fetchCategoriesApi(),
        fetchSalesPricesApi(),
        fetchPurchasePricesApi(),
      ])
      setProducts(prods || [])
      setCategories(cats || [])
      setSalesPrices(sPrices || [])
      setPurchasePrices(pPrices || [])

      const gMap = {}
      for (const c of cats || []) {
        const gList = await fetchGradesByCategoryApi(c.id)
        for (const g of gList || []) {
          gMap[g.id] = g
        }
      }
      setGradesMap(gMap)
    } catch (err) {
      setBanner({ type: 'danger', text: err.message || 'Gagal memuat daftar produk dan harga.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll()
  }, [])

  const filteredSalesPrices = selectedProductId
    ? salesPrices.filter((sp) => String(sp.product_id) === String(selectedProductId))
    : salesPrices

  const productLookup = (id) => products.find((p) => p.id === Number(id))
  const categoryLookup = (id) => categories.find((c) => c.id === Number(id))

  const availableGradesForForm = Object.values(gradesMap).filter((g) => {
    const prod = productLookup(form.product_id)
    return prod && g.category_id === prod.category_id
  })

  const openPriceModal = () => {
    const firstProd = products[0]
    const firstGrade = Object.values(gradesMap).find(
      (g) => firstProd && g.category_id === firstProd.category_id && !g.is_reject
    )
    setForm({
      product_id: firstProd ? String(firstProd.id) : '1',
      grade_id: firstGrade ? String(firstGrade.id) : '1',
      segment: 'RETAIL',
      price: '46000',
      valid_from: todayISODate(),
      note: 'Pembaruan harga jual segmen',
    })
    setModalOpen(true)
  }

  const handleSavePrice = async (e) => {
    e.preventDefault()
    const selectedGrade = gradesMap[Number(form.grade_id)]
    const priceNum = Number(form.price)

    if (selectedGrade?.is_reject && priceNum !== 0) {
      setBanner({
        type: 'danger',
        text: 'Harga untuk grade afkir wajib bernilai Rp 0.',
      })
      return
    }

    setSaving(true)
    try {
      await createSalesPriceApi({
        product_id: Number(form.product_id),
        grade_id: Number(form.grade_id),
        segment: form.segment,
        price: priceNum,
        valid_from: form.valid_from,
        note: form.note.trim() || null,
      })
      setBanner({
        type: 'success',
        text: `Harga jual segmen ${form.segment} berhasil disimpan (${formatRupiah(priceNum)}/kg).`,
      })
      setModalOpen(false)
      loadAll()
    } catch (err) {
      setBanner({ type: 'danger', text: err.message || 'Gagal menyimpan harga jual.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Katalog Produk, Grade &amp; Daftar Harga</h1>
          <p className="page-subtitle">
            Daftar komoditas pertanian, standar kelas mutu (Grade), harga beli dari petani anggota,
            dan daftar harga jual per segmen pelanggan.
          </p>
        </div>

        {canWriteSalesPrice && (
          <Button variant="primary" onClick={openPriceModal}>
            + Atur Harga Jual Segmen
          </Button>
        )}
      </div>

      <AlertBanner
        variant={banner.type}
        onClose={() => setBanner({ type: 'info', text: '' })}
      >
        {banner.text}
      </AlertBanner>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Komoditas, Standar Grading &amp; Harga Beli Anggota</h2>
            <p className="card-subtitle">
              Parameter pemeriksaan kualitas hasil panen, masa simpan gudang, dan harga beli per
              grade.
            </p>
          </div>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          data={products}
          columns={[
            { key: 'code', header: 'Kode Produk', render: (r) => <strong>{r.code}</strong> },
            { key: 'name', header: 'Nama Komoditas' },
            {
              key: 'category',
              header: 'Kategori',
              render: (r) => {
                const cat = categoryLookup(r.category_id)
                return <Badge variant="navy">{cat?.name || '-'}</Badge>
              },
            },
            {
              key: 'criteria',
              header: 'Kriteria Pemeriksaan Mutu',
              render: (r) => {
                const cat = categoryLookup(r.category_id)
                const list = cat?.grading_criteria?.kriteria || []
                return list.join(', ') || '-'
              },
            },
            {
              key: 'shelf_life',
              header: 'Masa Simpan',
              render: (r) => {
                const cat = categoryLookup(r.category_id)
                return `${cat?.shelf_life_days || '-'} Hari (Peringatan H-${cat?.expiry_warning_days || 2})`
              },
            },
            {
              key: 'buy_prices',
              header: 'Harga Beli Anggota',
              render: (r) => {
                const pList = purchasePrices.filter((pp) => pp.product_id === r.id)
                return (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {pList.map((pp) => {
                      const g = gradesMap[pp.grade_id]
                      return (
                        <Badge key={pp.id} variant={g?.is_reject ? 'red' : 'green'}>
                          {g?.code}: {formatRupiah(pp.price)}/{r.uom}
                        </Badge>
                      )
                    })}
                  </div>
                )
              },
            },
          ]}
        />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Daftar Harga Jual per Segmen Pelanggan</h2>
            <p className="card-subtitle">
              Harga jual di bawah ini diterapkan secara otomatis pada pembuatan pesanan penjualan.
            </p>
          </div>

          <select
            className="form-control"
            style={{ maxWidth: '260px' }}
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">Semua Komoditas</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          data={filteredSalesPrices}
          columns={[
            {
              key: 'product',
              header: 'Komoditas',
              render: (r) => {
                const p = productLookup(r.product_id)
                return <strong>{p ? `${p.name} (${p.code})` : `Produk #${r.product_id}`}</strong>
              },
            },
            {
              key: 'grade',
              header: 'Grade Mutu',
              render: (r) => {
                const g = gradesMap[r.grade_id]
                return (
                  <Badge variant={g?.is_reject ? 'red' : g?.code === 'A' || g?.code === 'Premium' ? 'green' : 'navy'}>
                    Grade {g?.code || r.grade_id}
                  </Badge>
                )
              },
            },
            {
              key: 'segment',
              header: 'Segmen Pelanggan',
              render: (r) => (
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
              ),
            },
            {
              key: 'price',
              header: 'Harga Jual Satuan',
              render: (r) => <strong>{formatRupiah(r.price)} / kg</strong>,
            },
            {
              key: 'valid_from',
              header: 'Berlaku Mulai',
              render: (r) => formatDateID(r.valid_from),
            },
            { key: 'note', header: 'Keterangan', render: (r) => r.note || '-' },
          ]}
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Atur Harga Jual per Grade & Segmen"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSavePrice} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Harga'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSavePrice} className="form-grid">
          <FormField
            label="Komoditas"
            name="product_id"
            type="select"
            value={form.product_id}
            onChange={(e) => {
              const pid = e.target.value
              const prod = productLookup(pid)
              const firstGrade = Object.values(gradesMap).find(
                (g) => prod && g.category_id === prod.category_id
              )
              setForm({
                ...form,
                product_id: pid,
                grade_id: firstGrade ? String(firstGrade.id) : '',
              })
            }}
            options={products.map((p) => ({ value: String(p.id), label: `${p.code} - ${p.name}` }))}
            required
          />

          <FormField
            label="Kelas Mutu (Grade)"
            name="grade_id"
            type="select"
            value={form.grade_id}
            onChange={(e) => {
              const gid = e.target.value
              const g = gradesMap[Number(gid)]
              setForm({
                ...form,
                grade_id: gid,
                price: g?.is_reject ? '0' : form.price,
              })
            }}
            options={availableGradesForForm.map((g) => ({
              value: String(g.id),
              label: `${g.code} - ${g.name}`,
            }))}
            required
          />

          <FormField
            label="Segmen Pelanggan"
            name="segment"
            type="select"
            value={form.segment}
            onChange={(e) => setForm({ ...form, segment: e.target.value })}
            options={[
              { value: 'KONSUMEN', label: 'Konsumen Langsung' },
              { value: 'RETAIL', label: 'Retail (Toko & Warung)' },
              { value: 'PASAR_MODERN', label: 'Pasar Modern (Supermarket)' },
            ]}
            required
          />

          <FormField
            label="Harga Jual per kg (Rp)"
            name="price"
            type="number"
            min="0"
            step="500"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="Contoh: 46000"
            required
            readOnly={Boolean(gradesMap[Number(form.grade_id)]?.is_reject)}
            hint="Grade afkir otomatis bernilai Rp 0."
          />

          <FormField
            label="Berlaku Mulai Tanggal"
            name="valid_from"
            type="date"
            value={form.valid_from}
            onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
            required
          />

          <FormField
            label="Catatan"
            name="note"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Contoh: Penyesuaian harga kuartal berjalan"
          />
        </form>
      </Modal>
    </div>
  )
}
