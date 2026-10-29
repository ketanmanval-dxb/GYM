// Browser-side API client. The frontend only ever talks to /api; it never sees the database.
import { useCallback, useEffect, useRef, useState } from 'react'

export class ApiError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

const OFFLINE = 'Can’t reach the PulseFit server. Check that "npm run dev" is running, then try again.'

/** The user's local calendar date (YYYY-MM-DD), so "today" matches their time zone. */
export function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function api(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, OFFLINE, 'NETWORK')
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    /* empty or non-JSON body */
  }

  if (!res.ok) {
    // No JSON from a 5xx usually means the dev proxy couldn't reach the API server.
    if (!data && res.status >= 500) throw new ApiError(res.status, OFFLINE, 'NETWORK')
    if (res.status === 401 && !path.startsWith('/api/auth/')) window.dispatchEvent(new Event('pf:unauthorized'))
    throw new ApiError(res.status, data?.error || 'Something went wrong. Please try again.', data?.code)
  }
  return data
}

export const isConnectionError = (e) => ['DB_UNAVAILABLE', 'DB_NOT_SETUP', 'NETWORK'].includes(e?.code)

/** Loads a GET endpoint. `setData` allows optimistic local updates. */
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  // Only the newest request may set state. Otherwise a slower, older response (e.g. the duplicate
  // load React's StrictMode does in development) replaces the data a moment after the page draws,
  // which restarts chart animations from their end state.
  const latest = useRef(0)

  const reload = useCallback(async () => {
    const id = ++latest.current
    setState((s) => ({ ...s, loading: !s.data, error: null }))
    try {
      const data = await api(path)
      if (id === latest.current) setState({ data, error: null, loading: false })
    } catch (error) {
      if (id === latest.current) setState({ data: null, error, loading: false })
    }
  }, [path])

  useEffect(() => {
    reload()
  }, [reload])

  const setData = useCallback((fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })), [])

  return { ...state, reload, setData }
}
