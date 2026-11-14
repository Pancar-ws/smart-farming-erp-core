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
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  const menuSections = getMenusForUser(user)
  const roleInfo = ROLE_META[user?.role] || { label: user?.role || 'Pengguna', description: '' }

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
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">SF</div>
          <div>
            <div className="sidebar-brand-title">Smart Farming ERP</div>
            <div className="sidebar-brand-subtitle">Koperasi Tani Mandiri</div>
          </div>
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
                  <NavIcon name={item.icon} size={18} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{roleInfo.label}</div>
          <div style={{ marginTop: '2px', opacity: 0.75 }}>Sistem Informasi Koperasi</div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <div className="header-left">
            <button
              type="button"
              className="header-menu-btn"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Buka navigasi"
            >
              <NavIcon name="menu" size={20} />
            </button>
            <div>
              <div className="header-page-title">
                {activeMenuItem?.label || 'Dashboard'}
              </div>
            </div>
          </div>

          <div className="header-right">
            <div className="notif-wrapper">
              <button
                type="button"
                className="notif-btn"
                onClick={() => setNotifOpen((prev) => !prev)}
                aria-label="Notifikasi sistem"
                title="Notifikasi Sistem"
              >
                <NavIcon name="bell" size={19} />
                {notifications.length > 0 && (
                  <span className="notif-count">{notifications.length}</span>
                )}
              </button>

              {notifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-dropdown-header">
                    <span>Notifikasi</span>
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
                        Belum ada notifikasi baru.
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
                                fontWeight: 600,
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

            <div className="header-user-box">
              <div className="header-user-avatar">{initials}</div>
              <div>
                <div className="header-user-name">{user?.name}</div>
                <div className="header-user-role">{roleInfo.shortLabel || user?.role}</div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                borderColor: 'rgba(255, 255, 255, 0.24)',
              }}
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
