import { useEffect, useState } from 'react'
import AlertBanner from '../../components/AlertBanner'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import Modal from '../../components/Modal'
import Table from '../../components/Table'
import { useAuth } from '../../hooks/useAuth'
import {
  createCustomerApi,
  fetchCustomersApi,
  updateCustomerApi,
} from '../../services/masterService'

const CUSTOMER_SEGMENTS = [
  {
    value: 'KONSUMEN',
    label: 'Konsumen Langsung (Eceran / Katering / Rumah Tangga)',
    badgeVariant: 'green',
  },
  {
    value: 'RETAIL',
    label: 'Retail Lokal (Toko Sayur / Warung / Pedagang Pasar)',
    badgeVariant: 'navy',
  },
  {
    value: 'PASAR_MODERN',
    label: 'Pasar Modern (Supermarket / Hypermart / Mitra B2B)',
    badgeVariant: 'amber',
  },
]

const INITIAL_FORM = {
  code: '',
  name: '',
  segment: 'RETAIL',
  address: '',
  phone: '',
  payment_term_days: '14',
}

export default function CustomersPage() {
  const { hasPermission } = useAuth()
  const canWrite = hasPermission(['master:write', 'sales:order'])

  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [segmentFilter, setSegmentFilter] = useState('')
  const [banner, setBanner] = useState({ type: 'info', text: '' })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const list = await fetchCustomersApi()
      setCustomers(Array.isArray(list) ? list : [])
    } catch (err) {
      setBanner({ type: 'danger', text: err.message || 'Gagal memuat data pelanggan.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCustomers()
  }, [])

  const filtered = segmentFilter
    ? customers.filter((c) => c.segment === segmentFilter)
    : customers

  const openCreateModal = () => {
    const nextIdx = customers.length + 1
    setEditingCustomer(null)
    setForm({
      ...INITIAL_FORM,
      code: `CUST-${String(nextIdx).padStart(3, '0')}`,
    })
    setErrors({})
    setModalOpen(true)
  }

  const openEditModal = (cust) => {
    setEditingCustomer(cust)
    setForm({
      code: cust.code,
      name: cust.name,
      segment: cust.segment,
      address: cust.address || '',
      phone: cust.phone || '',
      payment_term_days: String(cust.payment_term_days ?? 0),
    })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const nextErr = {}
    if (!form.code.trim()) {
      nextErr.code = 'Kode pelanggan wajib diisi.'
    } else if (
      !editingCustomer &&
      customers.some((c) => c.code.toLowerCase() === form.code.trim().toLowerCase())
    ) {
      nextErr.code = 'Kode pelanggan sudah digunakan.'
    }

    if (!form.name.trim()) {
      nextErr.name = 'Nama pelanggan atau perusahaan wajib diisi.'
    }

    const term = Number(form.payment_term_days)
    if (Number.isNaN(term) || term < 0) {
      nextErr.payment_term_days = 'Termin pembayaran tidak boleh bernilai negatif.'
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
        segment: form.segment,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        payment_term_days: Number(form.payment_term_days || 0),
      }

      if (editingCustomer) {
        await updateCustomerApi(editingCustomer.id, payload)
        setBanner({
          type: 'success',
          text: `Data pelanggan ${payload.code} (${payload.name}) berhasil diperbarui.`,
        })
      } else {
        await createCustomerApi(payload)
        setBanner({
          type: 'success',
          text: `Pelanggan baru ${payload.code} (${payload.name}) berhasil didaftarkan.`,
        })
      }
      setModalOpen(false)
      loadCustomers()
    } catch (err) {
      setBanner({ type: 'danger', text: err.message || 'Gagal menyimpan data pelanggan.' })
    } finally {
      setSaving(false)
    }
  }

  const segmentLabel = (seg) => {
    if (seg === 'KONSUMEN') return 'Konsumen Langsung'
    if (seg === 'RETAIL') return 'Retail (Toko/Warung)'
    if (seg === 'PASAR_MODERN') return 'Pasar Modern'
    return seg
  }

  const segmentVariant = (seg) => {
    if (seg === 'KONSUMEN') return 'green'
    if (seg === 'RETAIL') return 'navy'
    return 'amber'
  }

  const columns = [
    { key: 'code', header: 'Kode Pelanggan', render: (r) => <strong>{r.code}</strong> },
    { key: 'name', header: 'Nama Pelanggan / Mitra' },
    {
      key: 'segment',
      header: 'Segmen Harga',
      render: (r) => <Badge variant={segmentVariant(r.segment)}>{segmentLabel(r.segment)}</Badge>,
    },
    { key: 'address', header: 'Alamat Pengiriman', render: (r) => r.address || '-' },
    { key: 'phone', header: 'Telepon', render: (r) => r.phone || '-' },
    {
      key: 'payment_term_days',
      header: 'Termin Pembayaran',
      render: (r) =>
        Number(r.payment_term_days) === 0
          ? 'Tunai (0 Hari)'
          : `${r.payment_term_days} Hari`,
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
          <h1 className="page-title">Data Pelanggan Komersial</h1>
          <p className="page-subtitle">
            Kelola direktori mitra pembeli berdasarkan segmen Konsumen Langsung, Retail, dan Pasar
            Modern.
          </p>
        </div>

        {canWrite && (
          <Button variant="primary" onClick={openCreateModal}>
            + Tambah Pelanggan
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
              style={{ maxWidth: '320px' }}
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
            >
              <option value="">Semua Segmen Pelanggan</option>
              {CUSTOMER_SEGMENTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Table
          columns={columns}
          data={filtered}
          rowKey="id"
          loading={loading}
          emptyMessage="Belum ada pelanggan terdaftar pada segmen ini."
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingCustomer
            ? `Ubah Data Pelanggan (${editingCustomer.code})`
            : 'Tambah Pelanggan Baru'
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
            label="Kode Pelanggan"
            name="code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="Contoh: CUST-006"
            required
            readOnly={Boolean(editingCustomer)}
            error={errors.code}
          />

          <FormField
            label="Segmen Pelanggan"
            name="segment"
            type="select"
            value={form.segment}
            onChange={(e) => {
              const seg = e.target.value
              const defaultTerm = seg === 'PASAR_MODERN' ? '30' : seg === 'RETAIL' ? '14' : '0'
              setForm({ ...form, segment: seg, payment_term_days: defaultTerm })
            }}
            options={CUSTOMER_SEGMENTS}
            required
          />

          <FormField
            label="Nama Pelanggan / Perusahaan"
            name="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: Toko Sayur Segar Jaya"
            required
            fullWidth
            error={errors.name}
          />

          <FormField
            label="Nomor Telepon"
            name="phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Contoh: 081234567890"
          />

          <FormField
            label="Termin Jatuh Tempo (Hari)"
            name="payment_term_days"
            type="number"
            min="0"
            step="1"
            value={form.payment_term_days}
            onChange={(e) => setForm({ ...form, payment_term_days: e.target.value })}
            error={errors.payment_term_days}
            hint="0 hari untuk pembayaran tunai."
          />

          <FormField
            label="Alamat Pengiriman"
            name="address"
            type="textarea"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Masukkan alamat lengkap pengiriman"
            fullWidth
          />
        </form>
      </Modal>
    </div>
  )
}
