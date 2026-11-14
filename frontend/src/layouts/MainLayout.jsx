import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { NavIcon } from '../components/Icons'
import { getMenusForUser } from '../config/menu'
import { ROLE_META } from '../config/roles'
import { useAuth } from '../hooks/useAuth'
import { fetchNotificationsApi, markNotificationReadApi } from '../services/authService'
import { formatDateTimeID } from '../utils/formatters'

export default function MainLayout() {
  const { user, logout, connMode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  const menuSections = getMenusForUser(user)
  const roleInfo = ROLE_META[user?.role] || { label: user?.role || 'Pengguna', description: '' }

  // Muat notifikasi peringatan ROP & sistem untuk ikon lonceng di header
  useEffect(() => {
    let mounted = true
    async function loadNotifs() {
      try {
        const list = await fetchNotificationsApi(true)
        if (mounted) setNotifications(Array.isArray(list) ? list : [])
      } catch {
        // Abaikan jika gagal memuat notifikasi
      }
    }
    loadNotifs()
    return () => {
      mounted = false
    }
  }, [location.pathname])

  const handleMarkRead = async (id) => {
    try {
      await markNotificationReadApi(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch {
      // Abaikan
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Cari nama halaman aktif untuk ditampilkan di Header
  const activeMenuItem = menuSections
    .flatMap((s) => s.items)
    .find((item) => location.pathname.startsWith(item.path))

  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="app-shell">
      {/* Sidebar Navigasi Kiri (Dinamis sesuai Role RBAC) */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">SF</div>
          <div>
            <div className="sidebar-brand-title">ERP Smart Farming</div>
            <div className="sidebar-brand-subtitle">Koperasi Tani Agribisnis</div>
          </div>
        </div>

        <div className="sidebar-role-box">
          <div className="sidebar-role-label">Peran Aktif (RBAC)</div>
          <div className="sidebar-role-name">{roleInfo.label}</div>
        </div>

        <nav className="sidebar-nav" aria-label="Menu Utama">
          {menuSections.map((sec) => (
            <div key={sec.section}>
              <div className="sidebar-section-label">{sec.section}</div>
              {sec.items.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <NavIcon name={item.icon} size={19} />
                  <span>{item.label}</span>
                  {item.badge && <span className="sidebar-link-badge">{item.badge}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div>Sistem Rantai Pasok Berkelanjutan</div>
          <div style={{ marginTop: '2px', opacity: 0.8 }}>SDGs 2, 8, 12 &amp; 13</div>
        </div>
      </aside>

      {/* Area Utama & Header Atas */}
      <div className="app-main">
        <header className="app-header">
          <div className="header-left">
            <button
              type="button"
              className="header-menu-btn"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Buka navigasi"
            >
              ☰
            </button>
            <div>
              <div className="header-page-title">
                {activeMenuItem?.label || 'Sistem ERP Koperasi Tani'}
              </div>
              <div className="header-page-subtitle">
                Manajemen Rantai Pasok Pertanian Berkelanjutan
              </div>
            </div>
          </div>

          <div className="header-right">
            {/* Indikator Status Koneksi API vs Simulasi */}
            <div
              className="conn-pill"
              title={
                connMode === 'online'
                  ? 'Terhubung langsung ke server FastAPI (localhost:8000)'
                  : 'Server FastAPI belum terdeteksi — berjalan menggunakan data simulasi lokal'
              }
            >
              <span className={`conn-dot ${connMode === 'online' ? 'online' : 'mock'}`} />
              <span>{connMode === 'online' ? 'API Backend Aktif' : 'Mode Simulasi (Mock)'}</span>
            </div>

            {/* Lonceng Notifikasi Peringatan Stok Minimum (ROP) */}
            <div className="notif-wrapper">
              <button
                type="button"
                className="notif-btn"
                onClick={() => setNotifOpen((prev) => !prev)}
                aria-label="Notifikasi sistem"
                title="Peringatan Stok Minimum (ROP) & Notifikasi"
              >
                <NavIcon name="bell" size={20} />
                {notifications.length > 0 && (
                  <span className="notif-count">{notifications.length}</span>
                )}
              </button>

              {notifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-dropdown-header">
                    <span>Notifikasi &amp; Peringatan ROP</span>
                    <Badge variant={notifications.length > 0 ? 'amber' : 'green'}>
                      {notifications.length} Baru
                    </Badge>
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <div
                        style={{
                          padding: '20px',
                          textAlign: 'center',
                          color: 'var(--text-muted)',
                          fontSize: '13.5px',
                        }}
                      >
                        Tidak ada peringatan baru. Seluruh stok berada di atas batas minimum.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="notif-item">
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                            <Badge variant={n.severity === 'WARNING' ? 'amber' : 'navy'}>
                              {n.type}
                            </Badge>
                            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                              {formatDateTimeID(n.created_at)}
                            </span>
                          </div>
                          <div style={{ fontSize: '13.5px', fontWeight: 500 }}>{n.message}</div>
                          <div>
                            <button
                              type="button"
                              onClick={() => handleMarkRead(n.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                color: 'var(--color-navy)',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Tandai sudah dibaca
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Info Pengguna Aktif */}
            <div className="header-user-box">
              <div className="header-user-avatar">{initials}</div>
              <div>
                <div className="header-user-name">{user?.name}</div>
                <div className="header-user-role">{roleInfo.shortLabel || user?.role}</div>
              </div>
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={handleLogout}
              title="Keluar dari sesi pengguna"
            >
              Keluar
            </Button>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
