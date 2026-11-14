import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import AlertBanner from '../../components/AlertBanner'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import { DEMO_ACCOUNTS, ROLE_META } from '../../config/roles'
import { useAuth } from '../../hooks/useAuth'

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
      setErrorMsg('Username dan kata sandi wajib diisi.')
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
      <div className="login-hero">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="sidebar-brand-logo" style={{ width: '46px', height: '46px', fontSize: '19px' }}>
              SF
            </div>
            <div>
              <div style={{ fontSize: '19px', fontWeight: 700 }}>Smart Farming ERP</div>
              <div style={{ fontSize: '13px', opacity: 0.85 }}>
                Sistem Informasi Koperasi Tani Mandiri
              </div>
            </div>
          </div>

          <h1 style={{ color: '#FFFFFF', fontSize: '30px', marginTop: '44px', lineHeight: 1.3 }}>
            Pengelolaan Operasional Koperasi Tani Terpadu
          </h1>
          <p style={{ marginTop: '14px', fontSize: '15px', opacity: 0.88, maxWidth: '500px', lineHeight: 1.6 }}>
            Kelola data keanggotaan petani, ketersediaan saprotan, penerimaan hasil panen,
            sortasi mutu komoditas, hingga distribusi penjualan dari satu sistem terpusat.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px',
              marginTop: '32px',
              maxWidth: '500px',
            }}
          >
            <div style={{ background: 'rgba(255,255,255,0.09)', padding: '16px', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Keanggotaan &amp; Gudang</div>
              <div style={{ fontSize: '12.5px', opacity: 0.8, marginTop: '4px' }}>
                Pencatatan data lahan petani, stok minimum saprotan, dan mutasi batch komoditas.
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.09)', padding: '16px', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Penjualan &amp; Alokasi Stok</div>
              <div style={{ fontSize: '12.5px', opacity: 0.8, marginTop: '4px' }}>
                Penentuan harga jual sesuai segmen pelanggan dengan pengeluaran stok urut batch tertua.
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12.5px', opacity: 0.72, marginTop: '32px' }}>
          Koperasi Tani Mandiri &bull; Sistem Manajemen Rantai Pasok Pertanian
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-card">
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '23px', fontWeight: 700 }}>Masuk ke Akun</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Silakan masuk menggunakan akun petugas atau pengurus koperasi.
            </p>
          </div>

          <AlertBanner variant="danger" onClose={() => setErrorMsg('')}>
            {errorMsg}
          </AlertBanner>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FormField
              label="Username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
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
              {submitting ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '18px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Pilih Akun Demo Cepat
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
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
