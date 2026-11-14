import { DEMO_ACCOUNTS, ROLE_META } from '../config/roles'
import { ApiError, apiRequest } from './apiClient'
import { getMockDB, saveMockDB } from './mockData'

/**
 * Service Autentikasi & Notifikasi Header
 * Kontrak Backend:
 * - POST /api/v1/auth/login -> { access_token, refresh_token, token_type, user: { id, name, role, permissions } }
 * - GET  /api/v1/auth/me    -> { id, username, full_name, role, member_id, permissions }
 * - GET  /api/v1/notifications?unread_only=true
 * - POST /api/v1/notifications/{id}/read
 */

export async function loginApi(username, password) {
  const cleanUser = String(username || '').trim()

  return apiRequest(
    '/auth/login',
    {
      method: 'POST',
      body: { username: cleanUser, password },
      skipAuth: true,
    },
    // TODO: Mock fallback jika server FastAPI localhost:8000 belum menyala
    async () => {
      const matched = DEMO_ACCOUNTS.find(
        (acc) => acc.username.toLowerCase() === cleanUser.toLowerCase() && acc.password === password
      )
      if (!matched) {
        throw new ApiError('Username atau kata sandi salah', 401, 'INVALID_CREDENTIALS')
      }
      const permissions = ROLE_META[matched.role]?.permissions || []
      return {
        access_token: `mock-jwt-access-${matched.username}-${Date.now()}`,
        refresh_token: `mock-jwt-refresh-${matched.username}-${Date.now()}`,
        token_type: 'bearer',
        user: {
          id: matched.id,
          username: matched.username,
          name: matched.name,
          role: matched.role,
          permissions,
        },
      }
    }
  )
}

export async function fetchMeApi(currentUser) {
  return apiRequest(
    '/auth/me',
    { method: 'GET' },
    async () => {
      if (!currentUser) {
        throw new ApiError('Token tidak ditemukan', 401, 'UNAUTHORIZED')
      }
      return {
        id: currentUser.id,
        username: currentUser.username,
        full_name: currentUser.name,
        name: currentUser.name,
        role: currentUser.role,
        permissions: currentUser.permissions || ROLE_META[currentUser.role]?.permissions || [],
      }
    }
  )
}

export async function fetchNotificationsApi(unreadOnly = true) {
  return apiRequest(
    `/notifications?unread_only=${unreadOnly ? 'true' : 'false'}`,
    { method: 'GET' },
    async () => {
      const db = getMockDB()
      const list = db.notifications || []
      return unreadOnly ? list.filter((n) => !n.is_read) : list
    }
  )
}

export async function markNotificationReadApi(notifId) {
  return apiRequest(
    `/notifications/${notifId}/read`,
    { method: 'POST' },
    async () => {
      const db = getMockDB()
      db.notifications = (db.notifications || []).map((n) =>
        n.id === Number(notifId) ? { ...n, is_read: true } : n
      )
      saveMockDB(db)
      return { message: 'Notifikasi ditandai sudah dibaca' }
    }
  )
}
