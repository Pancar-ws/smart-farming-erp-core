/**
 * API Client terpusat untuk komunikasi ke backend FastAPI (/api/v1).
 * Fitur:
 * - Membaca base URL dari import.meta.env.VITE_API_URL
 * - Menyisipkan header Authorization: Bearer <access_token> otomatis
 * - Menangani 401 (auto-logout) dan 403 (pesan akses ditolak sesuai RBAC)
 * - Mendukung fallback ke mock handler terisolasi bila server backend belum aktif
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'
const TOKEN_KEY = 'erp_sf_access_token'
const REFRESH_KEY = 'erp_sf_refresh_token'
const USER_KEY = 'erp_sf_user'

// Status apakah backend FastAPI terdeteksi aktif atau sedang memakai fallback simulasi
let connectionMode = 'checking' // 'online' | 'mock' | 'checking'
const listeners = new Set()

export function getConnectionMode() {
  return connectionMode
}

export function setConnectionMode(mode) {
  if (connectionMode !== mode) {
    connectionMode = mode
    listeners.forEach((fn) => fn(mode))
  }
}

export function subscribeConnectionMode(callback) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setAuthSession({ access_token, refresh_token, user }) {
  if (access_token) localStorage.setItem(TOKEN_KEY, access_token)
  if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token)
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}

export class ApiError extends Error {
  constructor(message, status = 500, code = 'ERROR', details = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

/**
 * Melakukan request HTTP ke backend FastAPI.
 * Jika server backend belum nyala (NetworkError / 502 / 504 dari proxy Vite)
 * dan parameter `mockFallback` disediakan, otomatis menjalankan `mockFallback()`.
 */
export async function apiRequest(endpoint, options = {}, mockFallback = null) {
  const { method = 'GET', body, headers = {}, skipAuth = false } = options
  const token = getStoredToken()

  const reqHeaders = {
    Accept: 'application/json',
    ...headers,
  }

  if (body !== undefined && !(body instanceof FormData)) {
    reqHeaders['Content-Type'] = 'application/json'
  }

  if (!skipAuth && token) {
    reqHeaders.Authorization = `Bearer ${token}`
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  try {
    const response = await fetch(url, {
      method,
      headers: reqHeaders,
      body: body !== undefined ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    })

    // Jika Vite proxy gagal konek ke localhost:8000, biasanya mengembalikan 500/502/504 tanpa JSON backend
    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')

    if (!isJson && response.status >= 500 && mockFallback) {
      setConnectionMode('mock')
      return await mockFallback()
    }

    const payload = isJson ? await response.json() : null

    if (!response.ok) {
      const errCode = payload?.error?.code || 'HTTP_ERROR'
      const errMsg =
        payload?.error?.message ||
        payload?.detail ||
        (response.status === 403
          ? 'Akses ditolak (403): Peran Anda tidak memiliki izin untuk melakukan aksi ini.'
          : response.status === 401
            ? 'Sesi telah berakhir atau kredensial tidak valid (401).'
            : `Terjadi kesalahan pada server (${response.status})`)
      const errDetails = payload?.error?.details || {}

      // Tangani 401 Unauthorized -> Logout otomatis (kecuali saat request login itu sendiri)
      if (response.status === 401 && !skipAuth) {
        clearAuthSession()
        window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { message: errMsg } }))
      }

      setConnectionMode('online')
      throw new ApiError(errMsg, response.status, errCode, errDetails)
    }

    setConnectionMode('online')
    return payload
  } catch (err) {
    if (err instanceof ApiError) {
      throw err
    }

    // NetworkError (TypeError: Failed to fetch) karena backend localhost:8000 belum dinyalakan
    if (mockFallback) {
      setConnectionMode('mock')
      return await mockFallback()
    }

    throw new ApiError(
      'Tidak dapat terhubung ke server backend (http://localhost:8000). Pastikan server FastAPI sudah berjalan.',
      0,
      'NETWORK_ERROR'
    )
  }
}
