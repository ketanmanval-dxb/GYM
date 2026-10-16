import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PulseMark } from './Logo'
import { ErrorState } from './ui'

function FullScreenLoader() {
  return (
    <div className="ambient grid min-h-dvh place-items-center" aria-busy="true" aria-label="Loading">
      <PulseMark className="h-14 w-14" />
    </div>
  )
}

/** Pages that need a logged-in user. Logged-out visitors go to /login and come back afterwards. */
export function RequireAuth({ children }) {
  const { user, loading, error, refresh } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenLoader />
  if (error) {
    return (
      <div className="ambient grid min-h-dvh place-items-center px-4">
        <div className="w-full max-w-md">
          <ErrorState error={error} onRetry={refresh} />
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

/** Login / sign-up: already logged-in users skip straight to the dashboard. */
export function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}
