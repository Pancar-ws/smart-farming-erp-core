/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { hasPermission, hasRole, ROLE_META } from '../config/roles'
import {
  clearAuthSession,
  getConnectionMode,
  getStoredToken,
  getStoredUser,
  setAuthSession,
  subscribeConnectionMode,
} from '../services/apiClient'
import { fetchMeApi, loginApi } from '../services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [token, setToken] = useState(() => getStoredToken())
  const [loading, setLoading] = useState(true)
  const [connMode, setConnMode] = useState(() => getConnectionMode())

  const logout = useCallback(() => {
    clearAuthSession()
    setToken(null)
    setUser(null)
  }, [])

  // Dengarkan perubahan mode koneksi (Online API vs Mock Fallback)
  useEffect(() => {
    return subscribeConnectionMode((mode) => setConnMode(mode))
  }, [])

  // Dengarkan event 401 Unauthorized dari apiClient untuk auto-logout
  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [logout])

  // Validasi token saat aplikasi pertama kali dimuat
  useEffect(() => {
    let active = true
    async function verifySession() {
      const savedToken = getStoredToken()
      const savedUser = getStoredUser()
      if (!savedToken || !savedUser) {
        if (active) setLoading(false)
        return
      }
      try {
        const me = await fetchMeApi(savedUser)
        if (active) {
          const normalizedUser = {
            id: me.id,
            username: me.username || savedUser.username,
            name: me.full_name || me.name || savedUser.name,
            role: me.role,
            roleLabel: ROLE_META[me.role]?.label || me.role,
            permissions: me.permissions || ROLE_META[me.role]?.permissions || [],
          }
          setUser(normalizedUser)
          setAuthSession({ access_token: savedToken, user: normalizedUser })
        }
      } catch {
        if (active) logout()
      } finally {
        if (active) setLoading(false)
      }
    }
    verifySession()
    return () => {
      active = false
    }
  }, [logout])

  const login = useCallback(async (username, password) => {
    const res = await loginApi(username, password)
    const normalizedUser = {
      id: res.user.id,
      username: username.trim(),
      name: res.user.name || res.user.full_name,
      role: res.user.role,
      roleLabel: ROLE_META[res.user.role]?.label || res.user.role,
      permissions: res.user.permissions || ROLE_META[res.user.role]?.permissions || [],
    }
    setAuthSession({
      access_token: res.access_token,
      refresh_token: res.refresh_token,
      user: normalizedUser,
    })
    setToken(res.access_token)
    setUser(normalizedUser)
    return normalizedUser
  }, [])

  const checkPermission = useCallback(
    (perms, mode = 'any') => hasPermission(user, perms, mode),
    [user]
  )

  const checkRole = useCallback((roles) => hasRole(user, roles), [user])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      loading,
      connMode,
      login,
      logout,
      hasPermission: checkPermission,
      hasRole: checkRole,
    }),
    [user, token, loading, connMode, login, logout, checkPermission, checkRole]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
