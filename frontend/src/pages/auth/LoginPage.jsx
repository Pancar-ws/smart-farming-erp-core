import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import AlertBanner from '../../components/AlertBanner'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import { DEMO_ACCOUNTS, ROLE_META } from '../../config/roles'
import { useAuth } from '../../hooks/useAuth'

/**
 * Halaman Login (SDD Section 7.2)
 * Mengautentikasi kredensial ke POST /api/v1/auth/login dan mengarahkan ke Dashboard sesuai role RBAC.
 */
export default function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    const target = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={target} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!username.trim() || !password) {
      setErrorMsg('Harap isi Username dan Kata Sandi terlebih dahulu.')
      return
    }

    setSubmitting(true)
    try {
      await login(username, password)
      const target = location.state?.from?.pathname || '/dashboard'
      navigate(target, { replace: true })
    } catch (err) {
      setErrorMsg(err.message || 'Gagal masuk. Periksa kembali username dan kata sandi Anda.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickFill = (acc) => {
    setUsername(acc.username)
    setPassword(acc.password)
    setErrorMsg('')
  }

  return (
    <div className="login-page">
      {/* Panel Informasi Kiri */}
      <div className="login-hero">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="sidebar-brand-logo" style={{ width: '48px', height: '48px', fontSize: '20px' }}>
              SF
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>ERP Smart Farming</div>
              <div style={{ fontSize: '13.5px', opacity: 0.85 }}>
                Koperasi Tani Agribisnis &amp; Ketahanan Pangan
              </div>
            </div>
          </div>

          <h1 style={{ color: '#FFFFFF', fontSize: '32px', marginTop: '40px', lineHeight: 1.25 }}>
            Manajemen Rantai Pasok Pertanian Berkelanjutan Terpadu
          </h1>
          <p style={{ marginTop: '16px', fontSize: '15.5px', opacity: 0.9, maxWidth: '540px' }}>
            Platform Single Source of Truth yang menghubungkan 100 petani anggota mulai dari
            penyaluran saprotan, penimbangan batch panen, sortasi mutu (Mass Balance), rotasi
            gudang FIFO, penjualan bertingkat 3 segmen, hingga pelaporan keuangan &amp; ESG.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px',
              marginTop: '32px',
              maxWidth: '540px',
            }}
          >
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>Traceability Batch Penuh</div>
              <div style={{ fontSize: '12.5px', opacity: 0.82, marginTop: '4px' }}>
                Lacak asal produk kemasan di pasar modern kembali hingga ke petani penyetor.
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>Price Tiering &amp; FIFO</div>
              <div style={{ fontSize: '12.5px', opacity: 0.82, marginTop: '4px' }}>
                Harga jual terkunci otomatis per segmen pembeli dan alokasi stok batch tertua.
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12.5px', opacity: 0.78, marginTop: '32px' }}>
          Jurusan Informatika — Fakultas Teknik — Universitas Jenderal Soedirman (2026)
        </div>
      </div>

      {/* Panel Formulir Login Kanan */}
      <div className="login-form-side">
        <div className="login-card">
          <div style={{ marginBottom: '20px' }}>
            <Badge variant="navy">Otentikasi Pengguna (RBAC 9 Peran)</Badge>
            <h2 style={{ fontSize: '24px', marginTop: '10px' }}>Masuk ke Sistem ERP</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Masukkan kredensial akun Anda untuk membuka menu sesuai hak akses peran.
            </p>
          </div>

          <AlertBanner variant="danger" onClose={() => setErrorMsg('')}>
            {errorMsg}
          </AlertBanner>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FormField
              label="Username / NIP"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: superadmin, admin_keanggotaan, penjualan"
              required
            />

            <FormField
              label="Kata Sandi"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting}
              className="full-width"
            >
              {submitting ? 'Memverifikasi Kredensial...' : 'Masuk ke Dashboard'}
            </Button>
          </form>

          {/* Pintasan 9 Akun Demo untuk Pengujian RBAC & UAT */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '18px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                AKUN DEMO UAT (KLIK UNTUK ISI OTOMATIS)
              </span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Sandi: <code>password123</code>
              </span>
            </div>

            <div className="demo-accounts-grid">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  className="demo-chip"
                  onClick={() => handleQuickFill(acc)}
                  title={ROLE_META[acc.role]?.description}
                >
                  <span className="demo-chip-role">{ROLE_META[acc.role]?.shortLabel}</span>
                  <span className="demo-chip-user">{acc.username}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
