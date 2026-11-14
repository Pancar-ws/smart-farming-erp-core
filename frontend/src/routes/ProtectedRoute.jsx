import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { ROLE_META } from '../config/roles'
import { useAuth } from '../hooks/useAuth'

/**
 * Route Guard berbasis JWT dan RBAC (SRS-NFR-001 & UAT-12).
 * - Jika belum login: arahkan ke /login
 * - Jika role/permission tidak memenuhi syarat: tampilkan layar 403 Akses Ditolak
 */
export default function ProtectedRoute({
  children,
  requiredPermissions = [],
  allowedRoles = [],
}) {
  const { user, isAuthenticated, loading, hasPermission, hasRole } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Memverifikasi sesi pengguna...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const roleAllowed = allowedRoles.length === 0 || hasRole(allowedRoles)
  const permAllowed =
    requiredPermissions.length === 0 || hasPermission(requiredPermissions, 'any')

  if (!roleAllowed || !permAllowed) {
    const roleLabel = ROLE_META[user?.role]?.label || user?.role
    return (
      <div className="card" style={{ maxWidth: '640px', margin: '40px auto', textAlign: 'center', padding: '36px' }}>
        <Badge variant="red">HTTP 403 — FORBIDDEN</Badge>
        <h2 style={{ marginTop: '14px', fontSize: '22px', color: 'var(--color-red)' }}>
          Akses Ditolak: Di Luar Hak Akses Peran Anda
        </h2>
        <p style={{ marginTop: '10px', color: 'var(--text-secondary)', fontSize: '15px' }}>
          Akun Anda saat ini masuk sebagai <strong>{user?.name}</strong> dengan peran{' '}
          <strong>{roleLabel} ({user?.role})</strong>. Sesuai aturan keamanan RBAC
          (<code>URS-NFR-001</code> / <code>UAT-12</code>), peran ini tidak memiliki izin untuk
          membuka halaman atau melakukan aksi pada modul ini.
        </p>
        {requiredPermissions.length > 0 && (
          <div
            style={{
              marginTop: '16px',
              padding: '10px 14px',
              background: 'var(--bg-muted)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}
          >
            Izin yang dibutuhkan: <code>{requiredPermissions.join(', ')}</code>
          </div>
        )}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Kembali ke Dashboard Utama
          </Button>
        </div>
      </div>
    )
  }

  return children
}
