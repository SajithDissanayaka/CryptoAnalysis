import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { Brand } from './Icon'

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  if (loading)
    return (
      <div className="app-loading">
        <Brand />
        <span className="loading-line" />
        <p>Opening your workspace…</p>
      </div>
    )
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <Outlet />
}
