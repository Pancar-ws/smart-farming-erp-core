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
import { formatNumberID, formatRupiah } from '../../utils/formatters'

const SAPROTAN_TYPES = [
  { value: 'BENIH', label: 'BENIH (Benih Tanaman)' },
  { value: 'PUPUK_KIMIA', label: 'PUPUK_KIMIA (Pupuk NPK / Kimia)' },
  { value: 'PUPUK_ORGANIK', label: 'PUPUK_ORGANIK (Pupuk Kompos / Ramah Lingkungan)' },
  { value: 'KEMASAN', label: 'KEMASAN (Karung, Peti, Ikat)' },
]

const UOM_OPTIONS = [
  { value: 'kg', label: 'kg (Kilogram)' },
  { value: 'Pak', label: 'Pak (Kemasan Benih)' },
  { value: 'Sak 50kg', label: 'Sak 50kg' },
  { value: 'Pcs', label: 'Pcs / Lembar' },
  { value: 'Botol 1L', label: 'Botol 1 Liter' },
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

/**
 * Halaman Master Data Saprotan (Fitur 1 - URS-DAT-004, URS-INV-002, SDD Tabel 4.2)
 */
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
    }
    if (!form.name.trim()) {
      nextErr.name = 'Nama item saprotan wajib diisi.'
    }
    const buyPrice = Number(form.purchase_price)
    const sellPrice = Number(form.member_price)
    const minStock = Number(form.min_stock)

    if (form.purchase_price === '' || Number.isNaN(buyPrice) || buyPrice < 0) {
      nextErr.purchase_price = 'Harga beli dari supplier wajib >= Rp 0.'
    }
    if (form.member_price === '' || Number.isNaN(sellPrice) || sellPrice < buyPrice) {
      nextErr.member_price =
        'Harga penyaluran anggota wajib >= harga beli supplier (SDD Tabel 4.2).'
    }
    if (form.min_stock === '' || Number.isNaN(minStock) || minStock < 0) {
      nextErr.min_stock = 'Batas stok minimum (ROP) wajib >= 0.'
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
      setBanner({ type: 'danger', text: err.message || 'Gagal menyimpan data saprotan.' })
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'code', header: 'Kode Item', render: (r) => <strong>{r.code}</strong> },
    { key: 'name', header: 'Nama Barang Saprotan' },
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
      header: 'Stok Minimum (ROP)',
      render: (r) => `${formatNumberID(r.min_stock)} ${r.uom}`,
    },
    {
      key: 'qty_on_hand',
      header: 'Stok Gudang & Status',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <strong>
            {formatNumberID(r.qty_on_hand)} {r.uom}
          </strong>
          {r.below_minimum ? (
            <Badge variant="amber">⚠ Perlu Restock</Badge>
          ) : (
            <Badge variant="green">Stok Aman</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (r) =>
        canWrite ? (
          <Button variant="outline" size="sm" onClick={() => openEditModal(r)}>
            Ubah
          </Button>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Baca Saja</span>
        ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
            <Badge variant="navy">Fitur 1 — Master Saprotan</Badge>
            <Badge variant="amber">URS-DAT-004 &amp; URS-INV-002</Badge>
          </div>
          <h1 className="page-title">Master Sarana Produksi Pertanian (Saprotan)</h1>
          <p className="page-subtitle">
            Pengelolaan katalog benih, pupuk organik, pupuk kimia (NPK), dan kemasan beserta
            ambang batas stok minimum (Reorder Point / ROP).
          </p>
        </div>

        {canWrite && (
          <Button variant="primary" onClick={openCreateModal}>
            + Tambah Item Saprotan
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
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Pembedaan <strong>PUPUK_ORGANIK</strong> vs <strong>PUPUK_KIMIA</strong> digunakan
            otomatis untuk kalkulasi rasio ESG Environmental (<code>URS-RPT-007</code>).
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
            ? `Ubah Master Saprotan — ${editingItem.code}`
            : 'Tambah Item Master Saprotan Baru'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Saprotan'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="form-grid">
          <FormField
            label="Kode Unik Saprotan"
            name="code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="Contoh: SPT-00005"
            required
            readOnly={Boolean(editingItem)}
            error={errors.code}
            hint="Format standar: SPT-XXXXX (SDD Tabel 4.2)."
          />

          <FormField
            label="Kategori Klasifikasi"
            name="type"
            type="select"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={SAPROTAN_TYPES}
            required
          />

          <FormField
            label="Nama Komersial Barang Saprotan"
            name="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: Benih Cabai Rawit, Pupuk NPK 15-15-15"
            required
            fullWidth
            error={errors.name}
          />

          <FormField
            label="Satuan Ukur Kemasan (UOM)"
            name="uom"
            type="select"
            value={form.uom}
            onChange={(e) => setForm({ ...form, uom: e.target.value })}
            options={UOM_OPTIONS}
            required
          />

          <FormField
            label="Batas Stok Minimum (Reorder Point / ROP)"
            name="min_stock"
            type="number"
            min="0"
            step="1"
            value={form.min_stock}
            onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
            required
            error={errors.min_stock}
            hint="Default 500 kg untuk Pupuk NPK & Organik (URS-INV-002)."
          />

          <FormField
            label="Harga Beli Satuan dari Supplier (Rp)"
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
            label="Harga Penyaluran ke Anggota (Rp)"
            name="member_price"
            type="number"
            min="0"
            step="100"
            value={form.member_price}
            onChange={(e) => setForm({ ...form, member_price: e.target.value })}
            placeholder="Contoh: 13000"
            required
            error={errors.member_price}
            hint="Wajib >= harga beli dari supplier."
          />
        </form>
      </Modal>
    </div>
  )
}
