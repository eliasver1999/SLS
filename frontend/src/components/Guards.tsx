import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/auth'

function Loading() {
  return (
    <div className="container section" style={{ textAlign: 'center' }}>
      <p className="muted">Loading…</p>
    </div>
  )
}

/** Requires any signed-in user; otherwise redirects to /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <Loading />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** Requires an admin; customers are sent to their dashboard, guests to login. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  if (loading) return <Loading />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
