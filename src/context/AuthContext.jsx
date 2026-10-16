import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, today } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, streak: null, loading: true, error: null })

  const refresh = useCallback(async () => {
    try {
      const d = await api(`/api/auth/me?date=${today()}`)
      setState({ user: d.user, streak: d.streak, loading: false, error: null })
    } catch (error) {
      setState({ user: null, streak: null, loading: false, error: error.status === 401 ? null : error })
    }
  }, [])

  useEffect(() => {
    refresh()
    const onUnauthorized = () => setState({ user: null, streak: null, loading: false, error: null })
    window.addEventListener('pf:unauthorized', onUnauthorized)
    return () => window.removeEventListener('pf:unauthorized', onUnauthorized)
  }, [refresh])

  const login = useCallback(
    async (email, password) => {
      const d = await api('/api/auth/login', { method: 'POST', body: { email, password } })
      setState((s) => ({ ...s, user: d.user, error: null }))
      refresh()
      return d.user
    },
    [refresh],
  )

  const signup = useCallback(
    async (fields) => {
      const d = await api('/api/auth/signup', { method: 'POST', body: fields })
      setState({ user: d.user, streak: { current: 0, best: 0, trainedToday: false }, loading: false, error: null })
      return d.user
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } finally {
      setState({ user: null, streak: null, loading: false, error: null })
    }
  }, [])

  const setStreak = useCallback((streak) => setState((s) => ({ ...s, streak })), [])

  const value = useMemo(
    () => ({ ...state, refresh, login, signup, logout, setStreak }),
    [state, refresh, login, signup, logout, setStreak],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export const initialsOf = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || 'PF'
