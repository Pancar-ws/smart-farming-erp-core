import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { ROLE_META } from '../config/roles'
import { useAuth } from '../hooks/useAuth'

/**
 * Route Guard berbasis JWT dan peran pengguna.
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
        Memuat sesi pengguna...
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
      <div
        className="card"
        style={{ maxWidth: '540px', margin: '48px auto', textAlign: 'center', padding: '36px' }}
      >
        <h2 style={{ fontSize: '20px', color: 'var(--color-red)' }}>
          Akses Halaman Dibatasi
        </h2>
        <p style={{ marginTop: '10px', color: 'var(--text-secondary)', fontSize: '14.5px' }}>
          Anda masuk sebagai <strong>{user?.name}</strong> ({roleLabel}). Akun ini tidak memiliki
          izin untuk membuka halaman tersebut.
        </p>
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return children
}
