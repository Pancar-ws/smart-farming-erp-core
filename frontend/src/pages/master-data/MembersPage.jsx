import { useEffect, useMemo, useState } from 'react'
import AlertBanner from '../../components/AlertBanner'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import Modal from '../../components/Modal'
import Table from '../../components/Table'
import { useAuth } from '../../hooks/useAuth'
import {
  createMemberApi,
  fetchMemberSummaryApi,
  fetchMembersApi,
  updateMemberApi,
} from '../../services/masterService'
import {
  formatDateID,
  formatDateTimeID,
  formatKg,
  formatNumberID,
  formatRupiah,
  todayISODate,
} from '../../utils/formatters'

const COMMODITY_OPTIONS = [
  { value: 'Hortikultura Sayur', label: 'Hortikultura Sayur (Cabai, Tomat, Bawang)' },
  { value: 'Pangan', label: 'Tanaman Pangan (Beras, Jagung Pipil)' },
  { value: 'Buah', label: 'Hortikultura Buah (Pisang, Jeruk, Melon)' },
]

const STATUS_OPTIONS = [
  { value: 'AKTIF', label: 'AKTIF (Dapat Menyetor Panen & Menerima Saprotan)' },
  { value: 'NON_AKTIF', label: 'NON_AKTIF (Ditolak Saat Transaksi Setoran Panen)' },
]

const INITIAL_FORM = {
  nik: '',
  name: '',
  address: '',
  area_ha: '',
  main_commodity: 'Hortikultura Sayur',
  phone: '',
  status: 'AKTIF',
  joined_at: todayISODate(),
}

/**
 * Halaman Master Data Petani Anggota (Fitur 1 - URS-MBR-001 s.d. URS-MBR-004, SDD 4.1)
 */
export default function MembersPage() {
  const { hasPermission } = useAuth()
  const canWrite = hasPermission(['member:write'])

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [banner, setBanner] = useState({ type: 'info', text: '' })

  // State Modal Tambah / Edit
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // State Modal Riwayat Setoran & Rekap Anggota (URS-MBR-003 & URS-MBR-004)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [summaryData, setSummaryData] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const loadMembers = async () => {
    setLoading(true)
    try {
      const list = await fetchMembersApi({ status: statusFilter, q: searchQ })
      setMembers(Array.isArray(list) ? list : [])
    } catch (err) {
      setBanner({ type: 'danger', text: err.message || 'Gagal memuat data anggota.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const stats = useMemo(() => {
    const total = members.length
    const activeCount = members.filter((m) => m.status === 'AKTIF').length
    const totalArea = members.reduce((sum, m) => sum + Number(m.area_ha || 0), 0)
    return { total, activeCount, inactiveCount: total - activeCount, totalArea }
  }, [members])

  const openCreateModal = () => {
    setEditingMember(null)
    setForm({ ...INITIAL_FORM, joined_at: todayISODate() })
    setErrors({})
    setModalOpen(true)
  }

  const openEditModal = (member) => {
    setEditingMember(member)
    setForm({
      nik: member.nik || '',
      name: member.name || '',
      address: member.address || '',
      area_ha: String(member.area_ha ?? ''),
      main_commodity: member.main_commodity || 'Hortikultura Sayur',
      phone: member.phone || '',
      status: member.status || 'AKTIF',
      joined_at: member.joined_at || todayISODate(),
    })
    setErrors({})
    setModalOpen(true)
  }

  const openSummaryModal = async (member) => {
    setSummaryOpen(true)
    setSummaryLoading(true)
    setSummaryData(null)
    try {
      const res = await fetchMemberSummaryApi(member.id)
      setSummaryData(res)
    } catch (err) {
      setBanner({ type: 'danger', text: err.message || 'Gagal memuat rekap setoran anggota.' })
      setSummaryOpen(false)
    } finally {
      setSummaryLoading(false)
    }
  }

  const validateForm = () => {
    const nextErr = {}
    const cleanNik = String(form.nik || '').trim()

    if (!editingMember) {
      if (!/^\d{16}$/.test(cleanNik)) {
        nextErr.nik = 'NIK wajib terdiri dari tepat 16 digit angka numerik (SDD Tabel 4.1).'
      } else if (members.some((m) => m.nik === cleanNik)) {
        nextErr.nik = 'NIK sudah terdaftar pada anggota lain (URS-MBR-002).'
      }
    }

    if (!form.name.trim()) {
      nextErr.name = 'Nama lengkap petani wajib diisi.'
    }

    const areaVal = Number(form.area_ha)
    if (!form.area_ha || Number.isNaN(areaVal) || areaVal <= 0) {
      nextErr.area_ha = 'Luas lahan budidaya wajib lebih besar dari 0,00 ha (SDD Tabel 4.1).'
    }

    if (form.phone && !/^[0-9+ -]{8,16}$/.test(form.phone.trim())) {
      nextErr.phone = 'Format nomor telepon/WhatsApp tidak valid (8–15 digit angka).'
    }

    setErrors(nextErr)
    return Object.keys(nextErr).length === 0
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSaving(true)
    try {
      if (editingMember) {
        const updated = await updateMemberApi(editingMember.id, {
          name: form.name.trim(),
          address: form.address.trim() || null,
          area_ha: Number(form.area_ha),
          main_commodity: form.main_commodity,
          phone: form.phone.trim() || null,
          status: form.status,
        })
        setBanner({
          type: 'success',
          text: `Data anggota ${updated.member_code} (${updated.name}) berhasil diperbarui.`,
        })
      } else {
        const created = await createMemberApi({
          nik: form.nik.trim(),
          name: form.name.trim(),
          address: form.address.trim() || null,
          area_ha: Number(form.area_ha),
          main_commodity: form.main_commodity,
          phone: form.phone.trim() || null,
          status: form.status,
          joined_at: form.joined_at || todayISODate(),
        })
        setBanner({
          type: 'success',
          text: `Petani anggota baru berhasil terdaftar dengan kode unik ${created.member_code} (${created.name}).`,
        })
      }
      setModalOpen(false)
      loadMembers()
    } catch (err) {
      if (err.details?.field === 'nik') {
        setErrors((prev) => ({ ...prev, nik: err.message }))
      } else {
        setBanner({ type: 'danger', text: err.message || 'Gagal menyimpan data anggota.' })
      }
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key: 'member_code',
      header: 'ID Anggota',
      render: (r) => <strong>{r.member_code}</strong>,
    },
    { key: 'nik', header: 'NIK (16 Digit)' },
    {
      key: 'name',
      header: 'Nama Petani & Alamat Lahan',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700 }}>{r.name}</div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            {r.address || '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'area_ha',
      header: 'Luas Lahan',
      render: (r) => <strong>{formatNumberID(r.area_ha)} ha</strong>,
    },
    {
      key: 'main_commodity',
      header: 'Komoditas Utama',
      render: (r) => <Badge variant="navy">{r.main_commodity}</Badge>,
    },
    { key: 'phone', header: 'Kontak / WA', render: (r) => r.phone || '-' },
    {
      key: 'joined_at',
      header: 'Tgl Gabung',
      render: (r) => formatDateID(r.joined_at),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) =>
        r.status === 'AKTIF' ? (
          <Badge variant="green">AKTIF</Badge>
        ) : (
          <Badge variant="red">NON-AKTIF (Setoran Ditolak)</Badge>
        ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (r) => (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={() => openSummaryModal(r)}>
            Riwayat &amp; Rekap
          </Button>
          {canWrite && (
            <Button variant="primary" size="sm" onClick={() => openEditModal(r)}>
              Ubah
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
            <Badge variant="navy">Fitur 1 — Master Data &amp; Keanggotaan</Badge>
            <Badge variant="green">URS-MBR-001 s.d. 004</Badge>
          </div>
          <h1 className="page-title">Data Master Petani Anggota Koperasi</h1>
          <p className="page-subtitle">
            Registrasi profil petani anggota (~100 anggota), pemetaan luas lahan budidaya (ha),
            komoditas tanam, serta rekapitulasi riwayat setoran panen.
          </p>
        </div>

        {canWrite && (
          <Button variant="primary" onClick={openCreateModal}>
            + Daftarkan Petani Anggota Baru
          </Button>
        )}
      </div>

      <AlertBanner
        variant={banner.type}
        onClose={() => setBanner({ type: 'info', text: '' })}
      >
        {banner.text}
      </AlertBanner>

      {/* Ringkasan Statistik Keanggotaan */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <span className="stat-label">Total Anggota Terdaftar</span>
          <span className="stat-value">{stats.total} Petani</span>
          <span className="stat-meta">Kode identitas unik otomatis (AGT-XXXXX)</span>
        </div>
        <div className="stat-card green">
          <span className="stat-label">Status Keanggotaan Aktif</span>
          <span className="stat-value">{stats.activeCount} Aktif</span>
          <span className="stat-meta">
            {stats.inactiveCount} anggota berstatus Non-Aktif (diblokir saat timbang panen)
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Luas Lahan Garapan</span>
          <span className="stat-value">{formatNumberID(stats.totalArea)} ha</span>
          <span className="stat-meta">Akumulasi lahan Pangan, Hortikultura Sayur &amp; Buah</span>
        </div>
      </div>

      {/* Filter & Tabel Anggota */}
      <div className="card">
        <div className="toolbar">
          <form
            className="toolbar-filters"
            onSubmit={(e) => {
              e.preventDefault()
              loadMembers()
            }}
          >
            <input
              type="text"
              className="form-control"
              style={{ maxWidth: '340px' }}
              placeholder="Cari nama petani, kode AGT-XXXXX, atau NIK..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
            />
            <select
              className="form-control"
              style={{ maxWidth: '220px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status Keanggotaan</option>
              <option value="AKTIF">Hanya Anggota AKTIF</option>
              <option value="NON_AKTIF">Hanya Anggota NON-AKTIF</option>
            </select>
            <Button type="submit" variant="outline">
              Cari / Filter
            </Button>
          </form>
        </div>

        <Table
          columns={columns}
          data={members}
          rowKey="id"
          loading={loading}
          emptyMessage="Tidak ditemukan data petani anggota yang sesuai filter."
        />
      </div>

      {/* Modal Formulir Tambah / Ubah Petani Anggota */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingMember
            ? `Ubah Data Petani Anggota — ${editingMember.member_code}`
            : 'Formulir Pendaftaran Petani Anggota Baru'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Data Anggota'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="form-grid">
          <FormField
            label="Nomor Anggota (ID Unik)"
            name="member_code_preview"
            value={editingMember ? editingMember.member_code : 'Otomatis (Format: AGT-XXXXX)'}
            readOnly
            hint="Dijaga unik secara otomatis oleh basis data (URS-MBR-002)."
          />

          <FormField
            label="NIK (Nomor Induk Kependudukan)"
            name="nik"
            value={form.nik}
            onChange={(e) => setForm({ ...form, nik: e.target.value.replace(/\D/g, '') })}
            placeholder="16 digit angka sesuai KTP"
            maxLength={16}
            required
            readOnly={Boolean(editingMember)}
            error={errors.nik}
            hint="Wajib 16 digit angka numerik dan unik."
          />

          <FormField
            label="Nama Lengkap Petani"
            name="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Masukkan nama lengkap petani sesuai kartu anggota"
            required
            error={errors.name}
          />

          <FormField
            label="Luas Lahan Budidaya (Hektare / ha)"
            name="area_ha"
            type="number"
            step="0.01"
            min="0.01"
            value={form.area_ha}
            onChange={(e) => setForm({ ...form, area_ha: e.target.value })}
            placeholder="Contoh: 1.50"
            required
            error={errors.area_ha}
            hint="Wajib bernilai lebih besar dari 0,00 ha."
          />

          <FormField
            label="Komoditas Utama yang Ditanam"
            name="main_commodity"
            type="select"
            value={form.main_commodity}
            onChange={(e) => setForm({ ...form, main_commodity: e.target.value })}
            options={COMMODITY_OPTIONS}
            required
          />

          <FormField
            label="Nomor Telepon / WhatsApp Aktif"
            name="phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Contoh: 081327001101"
            error={errors.phone}
          />

          <FormField
            label="Tanggal Bergabung"
            name="joined_at"
            type="date"
            value={form.joined_at}
            onChange={(e) => setForm({ ...form, joined_at: e.target.value })}
            readOnly={Boolean(editingMember)}
          />

          <FormField
            label="Status Legalitas Keanggotaan"
            name="status"
            type="select"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={STATUS_OPTIONS}
            required
          />

          <FormField
            label="Alamat Lengkap & Blok Lahan Tani"
            name="address"
            type="textarea"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Contoh: Desa Karangreja RT 02/01, Blok Sawah Utara, Purbalingga"
            fullWidth
          />

          {form.status === 'NON_AKTIF' && (
            <div className="full-width">
              <AlertBanner variant="warning">
                <strong>Perhatian Aturan Bisnis (SDD 8.3a):</strong> Anggota dengan status{' '}
                <code>NON_AKTIF</code> akan ditolak secara otomatis oleh sistem ketika melakukan
                penimbangan/setoran panen di gudang penerimaan.
              </AlertBanner>
            </div>
          )}
        </form>
      </Modal>

      {/* Modal Riwayat Setoran Panen & Rekap Anggota (URS-MBR-003 & URS-MBR-004) */}
      <Modal
        isOpen={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        size="lg"
        title={
          summaryData
            ? `Rekapitulasi & Riwayat Setoran — ${summaryData.member.code} (${summaryData.member.name})`
            : 'Memuat Rekapitulasi Anggota...'
        }
        footer={
          <Button variant="primary" onClick={() => setSummaryOpen(false)}>
            Tutup Rekapitulasi
          </Button>
        }
      >
        {summaryLoading || !summaryData ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            Memuat data riwayat setoran dan saldo anggota...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 0 }}>
              <div className="stat-card green">
                <span className="stat-label">Total Nilai Setoran Panen</span>
                <span className="stat-value" style={{ fontSize: '20px' }}>
                  {formatRupiah(summaryData.payable_total)}
                </span>
                <span className="stat-meta">Akumulasi pembelian hasil panen oleh koperasi</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Pembayaran Sudah Diterima</span>
                <span className="stat-value" style={{ fontSize: '20px' }}>
                  {formatRupiah(summaryData.paid_total)}
                </span>
                <span className="stat-meta">Dana hasil panen yang telah dicairkan ke petani</span>
              </div>
              <div className="stat-card amber">
                <span className="stat-label">Sisa Piutang Saprotan</span>
                <span className="stat-value" style={{ fontSize: '20px' }}>
                  {formatRupiah(summaryData.saprotan_outstanding)}
                </span>
                <span className="stat-meta">Tagihan benih/pupuk yang belum dipotong</span>
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: '10px', fontSize: '15px' }}>
                Riwayat Setoran Panen Anggota (URS-MBR-003)
              </h4>
              <Table
                rowKey="batch_code"
                columns={[
                  {
                    key: 'batch_code',
                    header: 'Nomor Batch Unik',
                    render: (r) => <strong>{r.batch_code}</strong>,
                  },
                  {
                    key: 'received_at',
                    header: 'Waktu Setor',
                    render: (r) => formatDateTimeID(r.received_at),
                  },
                  {
                    key: 'product_id',
                    header: 'Komoditas / Produk',
                    render: (r) => r.product_name || `Produk #${r.product_id}`,
                  },
                  {
                    key: 'net_kg',
                    header: 'Berat Bersih Timbangan',
                    render: (r) => <strong>{formatKg(r.net_kg)}</strong>,
                  },
                ]}
                data={summaryData.deposits || []}
                emptyMessage="Belum ada riwayat setoran panen untuk anggota ini."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
