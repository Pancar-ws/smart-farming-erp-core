import { useEffect, useState } from 'react'
import AlertBanner from '../../components/AlertBanner'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import Modal from '../../components/Modal'
import Table from '../../components/Table'
import { useAuth } from '../../hooks/useAuth'
import {
  createSaprotanApi,
  fetchSaprotanApi,
  fetchSaprotanStockViewApi,
  updateSaprotanApi,
} from '../../services/masterService'
import { quickRestockSaprotanApi } from '../../services/procurementService'
import { formatNumberID, formatRupiah } from '../../utils/formatters'

const SAPROTAN_TYPES = [
  { value: 'PUPUK_ORGANIK', label: 'PUPUK_ORGANIK (Pupuk Organik / Kompos)' },
  { value: 'PUPUK_KIMIA', label: 'PUPUK_KIMIA (Pupuk Kimia / NPK / Urea)' },
  { value: 'BENIH', label: 'BENIH (Benih / Bibit Tanaman)' },
  { value: 'PESTISIDA', label: 'PESTISIDA (Pestisida / Obat Pertanian)' },
  { value: 'KEMASAN', label: 'KEMASAN (Karung / Keranjang / Plastik)' },
]

const UOM_OPTIONS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'Liter', label: 'Liter (L)' },
  { value: 'Pak', label: 'Pak / Sachet' },
  { value: 'Pcs', label: 'Pcs / Lembar' },
]

const INITIAL_FORM = {
  code: '',
  name: '',
  type: 'PUPUK_ORGANIK',
  uom: 'kg',
  purchase_price: '',
  member_price: '',
  min_stock: '500',
}

export default function SaprotanPage() {
  const { hasPermission } = useAuth()
  const canWrite = hasPermission(['master:write'])

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [banner, setBanner] = useState({ type: 'info', text: '' })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // State Modal Restock / Pengadaan Masuk Gudang
  const [restockModalOpen, setRestockModalOpen] = useState(false)
  const [restockItem, setRestockItem] = useState(null)
  const [restockQty, setRestockQty] = useState('1000')
  const [restockSupplierId, setRestockSupplierId] = useState('1')
  const [restockUnitPrice, setRestockUnitPrice] = useState('0')
  const [restockNote, setRestockNote] = useState('')
  const [restocking, setRestocking] = useState(false)

  const openRestockModal = (item) => {
    setRestockItem(item)
    // Berikan kuantitas saran: jika min_stock > 0 berikan min_stock * 2 atau default 1000
    const recQty = Number(item.min_stock) > 0 ? Number(item.min_stock) * 2 : 100
    setRestockQty(String(recQty))
    setRestockUnitPrice(String(item.purchase_price ?? 0))
    // Default supplier
    if (item.type === 'BENIH') setRestockSupplierId('2')
    else if (item.type === 'KEMASAN') setRestockSupplierId('3')
    else setRestockSupplierId('1')
    setRestockNote(`Pengadaan restock pasokan ${item.name}`)
    setRestockModalOpen(true)
  }

  const handleRestockSubmit = async () => {
    if (!restockItem || !restockQty || Number(restockQty) <= 0) return
    setRestocking(true)
    try {
      const res = await quickRestockSaprotanApi({
        saprotan_id: restockItem.id,
        supplier_id: Number(restockSupplierId),
        warehouse_id: 1, // GD-SAP
        qty: Number(restockQty),
        unit_price: Number(restockUnitPrice),
        note: restockNote,
      })

      setBanner({
        type: 'success',
        text: `Pengadaan Berhasil! ${res.qty_received} ${restockItem.uom} ${restockItem.name} berhasil diterima di Gudang GD-SAP (No. GR: ${res.gr_no}). Saldo stok diperbarui.`,
      })
      setRestockModalOpen(false)
      loadData()
    } catch (err) {
      setBanner({
        type: 'danger',
        text: err.message || 'Gagal memproses pengadaan restock.',
      })
    } finally {
      setRestocking(false)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [masterList, stockView] = await Promise.all([
        fetchSaprotanApi(),
        fetchSaprotanStockViewApi().catch(() => []),
      ])

      const stockMap = new Map()
      for (const s of stockView || []) {
        const prev = stockMap.get(s.saprotan_id) || 0
        stockMap.set(s.saprotan_id, prev + Number(s.qty_on_hand || 0))
      }

      const merged = (masterList || []).map((item) => {
        const onHand = stockMap.has(item.id)
          ? stockMap.get(item.id)
          : Number(item.qty_on_hand ?? 0)
        return {
          ...item,
          qty_on_hand: onHand,
          below_minimum: onHand <= Number(item.min_stock || 0),
        }
      })
      setItems(merged)
    } catch (err) {
      setBanner({ type: 'danger', text: err.message || 'Gagal memuat master saprotan.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [])

  const filteredItems = typeFilter
    ? items.filter((i) => i.type === typeFilter)
    : items

  const openCreateModal = () => {
    const nextIdx = items.length + 1
    setEditingItem(null)
    setForm({
      ...INITIAL_FORM,
      code: `SPT-${String(nextIdx).padStart(5, '0')}`,
    })
    setErrors({})
    setModalOpen(true)
  }

  const openEditModal = (item) => {
    setEditingItem(item)
    setForm({
      code: item.code,
      name: item.name,
      type: item.type,
      uom: item.uom,
      purchase_price: String(item.purchase_price ?? 0),
      member_price: String(item.member_price ?? 0),
      min_stock: String(item.min_stock ?? 0),
    })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const nextErr = {}
    if (!form.code.trim()) {
      nextErr.code = 'Kode saprotan wajib diisi (contoh: SPT-00005).'
    } else if (
      !editingItem &&
      items.some((i) => i.code.toLowerCase() === form.code.trim().toLowerCase())
    ) {
      nextErr.code = 'Kode saprotan sudah terdaftar.'
    }

    if (!form.name.trim()) {
      nextErr.name = 'Nama item saprotan wajib diisi.'
    }

    const buyPrice = Number(form.purchase_price)
    const sellPrice = Number(form.member_price)
    const minStock = Number(form.min_stock)

    if (Number.isNaN(buyPrice) || buyPrice < 0) {
      nextErr.purchase_price = 'Harga beli dari supplier tidak boleh negatif.'
    }
    if (Number.isNaN(sellPrice) || sellPrice < buyPrice) {
      nextErr.member_price = 'Harga salur ke anggota tidak boleh lebih rendah dari harga beli.'
    }
    if (Number.isNaN(minStock) || minStock < 0) {
      nextErr.min_stock = 'Batas stok minimum tidak boleh negatif.'
    }

    setErrors(nextErr)
    return Object.keys(nextErr).length === 0
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        type: form.type,
        uom: form.uom,
        purchase_price: Number(form.purchase_price),
        member_price: Number(form.member_price),
        min_stock: Number(form.min_stock),
      }

      if (editingItem) {
        await updateSaprotanApi(editingItem.id, payload)
        setBanner({
          type: 'success',
          text: `Master saprotan ${payload.code} (${payload.name}) berhasil diperbarui.`,
        })
      } else {
        await createSaprotanApi(payload)
        setBanner({
          type: 'success',
          text: `Item saprotan baru ${payload.code} (${payload.name}) berhasil ditambahkan.`,
        })
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      setBanner({ type: 'danger', text: err.message || 'Gagal menyimpan master saprotan.' })
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'code', header: 'Kode Barang', render: (r) => <strong>{r.code}</strong> },
    { key: 'name', header: 'Nama Saprotan' },
    {
      key: 'type',
      header: 'Kategori',
      render: (r) => {
        const variant =
          r.type === 'PUPUK_ORGANIK'
            ? 'green'
            : r.type === 'PUPUK_KIMIA'
              ? 'amber'
              : 'navy'
        return <Badge variant={variant}>{r.type}</Badge>
      },
    },
    { key: 'uom', header: 'Satuan' },
    {
      key: 'purchase_price',
      header: 'Harga Beli Supplier',
      render: (r) => formatRupiah(r.purchase_price),
    },
    {
      key: 'member_price',
      header: 'Harga Salur Anggota',
      render: (r) => <strong>{formatRupiah(r.member_price)}</strong>,
    },
    {
      key: 'min_stock',
      header: 'Stok Minimum',
      render: (r) => `${formatNumberID(r.min_stock)} ${r.uom}`,
    },
    {
      key: 'qty_on_hand',
      header: 'Stok Gudang',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <strong>
            {formatNumberID(r.qty_on_hand)} {r.uom}
          </strong>
          {r.below_minimum ? (
            <Badge variant="amber">Perlu Pengadaan</Badge>
          ) : (
            <Badge variant="green">Stok Aman</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (r) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {canWrite && (
            <Button variant="outline" size="sm" onClick={() => openEditModal(r)}>
              Ubah
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            style={{
              backgroundColor: r.below_minimum ? '#0284c7' : '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onClick={() => openRestockModal(r)}
            title="Tambah stok fisik masuk gudang via pengadaan"
          >
            📦 Restock
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Master Sarana Produksi Pertanian (Saprotan)</h1>
          <p className="page-subtitle">
            Kelola katalog benih, pupuk organik, pupuk kimia, dan kemasan beserta batas stok
            minimum gudang.
          </p>
        </div>

        {canWrite && (
          <Button variant="primary" onClick={openCreateModal}>
            + Tambah Saprotan
          </Button>
        )}
      </div>

      <AlertBanner
        variant={banner.type}
        onClose={() => setBanner({ type: 'info', text: '' })}
      >
        {banner.text}
      </AlertBanner>

      <div className="card">
        <div className="toolbar">
          <div className="toolbar-filters">
            <select
              className="form-control"
              style={{ maxWidth: '300px' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Semua Kategori Saprotan</option>
              {SAPROTAN_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredItems}
          rowKey="id"
          loading={loading}
          emptyMessage="Belum ada item saprotan terdaftar."
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingItem
            ? `Ubah Data Saprotan (${editingItem.code})`
            : 'Tambah Item Saprotan Baru'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="form-grid">
          <FormField
            label="Kode Barang"
            name="code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="Contoh: SPT-00005"
            required
            readOnly={Boolean(editingItem)}
            error={errors.code}
          />

          <FormField
            label="Kategori"
            name="type"
            type="select"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={SAPROTAN_TYPES}
            required
          />

          <FormField
            label="Nama Barang Saprotan"
            name="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: Benih Cabai Rawit, Pupuk NPK 15-15-15"
            required
            fullWidth
            error={errors.name}
          />

          <FormField
            label="Satuan Ukur"
            name="uom"
            type="select"
            value={form.uom}
            onChange={(e) => setForm({ ...form, uom: e.target.value })}
            options={UOM_OPTIONS}
            required
          />

          <FormField
            label="Batas Stok Minimum Gudang"
            name="min_stock"
            type="number"
            min="0"
            step="1"
            value={form.min_stock}
            onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
            required
            error={errors.min_stock}
          />

          <FormField
            label="Harga Beli dari Supplier (Rp)"
            name="purchase_price"
            type="number"
            min="0"
            step="100"
            value={form.purchase_price}
            onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
            placeholder="Contoh: 12000"
            required
            error={errors.purchase_price}
          />

          <FormField
            label="Harga Salur ke Anggota (Rp)"
            name="member_price"
            type="number"
            min="0"
            step="100"
            value={form.member_price}
            onChange={(e) => setForm({ ...form, member_price: e.target.value })}
            placeholder="Contoh: 13000"
            required
            error={errors.member_price}
          />
        </form>
      </Modal>

      {/* Modal Restock / Pengadaan Saprotan */}
      {restockModalOpen && restockItem && (
        <Modal
          title={`Pengadaan & Restock: ${restockItem.name} (${restockItem.code})`}
          isOpen={restockModalOpen}
          onClose={() => setRestockModalOpen(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                fontSize: '13px',
                lineHeight: 1.6,
              }}
            >
              <div><strong>Status Stok Saat Ini:</strong> {formatNumberID(restockItem.qty_on_hand)} {restockItem.uom}</div>
              <div><strong>Batas Minimum (ROP):</strong> {formatNumberID(restockItem.min_stock)} {restockItem.uom}</div>
              <div style={{ color: '#166534', marginTop: '4px', fontSize: '12px', fontWeight: 600 }}>
                💡 Rekomendasi restock aman: Minimal {Math.max(100, Number(restockItem.min_stock) * 2)} {restockItem.uom}
              </div>
            </div>

            <FormField label={`Jumlah Masuk Gudang (${restockItem.uom})`} required hint="Kuantitas fisik yang diterima dari supplier">
              <input
                type="number"
                step="1"
                min="1"
                className="form-control"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                style={{ fontSize: '18px', fontWeight: 700, padding: '10px 14px' }}
              />
            </FormField>

            <FormField label="Supplier Pemasok" required hint="Pemasok resmi terdaftar">
              <select
                className="form-control"
                value={restockSupplierId}
                onChange={(e) => setRestockSupplierId(e.target.value)}
                style={{ padding: '10px' }}
              >
                <option value="1">SUP-001 - PT Pupuk Indonesia Nusantara</option>
                <option value="2">SUP-002 - CV Benih Unggul Sejahtera</option>
                <option value="3">SUP-003 - Pabrik Kemasan Lestari</option>
              </select>
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Harga Beli Satuan (Rp)" hint="Harga beli per satuan">
                <input
                  type="number"
                  className="form-control"
                  value={restockUnitPrice}
                  onChange={(e) => setRestockUnitPrice(e.target.value)}
                  style={{ padding: '10px' }}
                />
              </FormField>

              <FormField label="Estimasi Total Pengadaan">
                <input
                  type="text"
                  className="form-control"
                  disabled
                  value={formatRupiah((Number(restockQty) || 0) * (Number(restockUnitPrice) || 0))}
                  style={{ fontWeight: 700, backgroundColor: '#f8fafc', padding: '10px' }}
                />
              </FormField>
            </div>

            <FormField label="Gudang Penerima">
              <input
                type="text"
                className="form-control"
                disabled
                value="GD-SAP (Gudang Sarana Produksi Pertanian)"
                style={{ backgroundColor: '#f8fafc', padding: '10px' }}
              />
            </FormField>

            <FormField label="Catatan Pengadaan">
              <input
                type="text"
                className="form-control"
                placeholder="Misal: Restock persiapan musim tanam 2026"
                value={restockNote}
                onChange={(e) => setRestockNote(e.target.value)}
                style={{ padding: '10px' }}
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
              <Button variant="outline" onClick={() => setRestockModalOpen(false)}>
                Batal
              </Button>
              <Button
                variant="primary"
                disabled={restocking || !restockQty || Number(restockQty) <= 0}
                onClick={handleRestockSubmit}
                style={{ backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {restocking ? 'Memproses Pengadaan...' : '📦 Terima Stok ke Gudang (GD-SAP)'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
