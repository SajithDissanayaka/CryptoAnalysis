import { Navigate, Outlet } from 'react-router'

import { useAuth } from '../hooks/useAuth'


function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <p>Checking authentication...</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}


export default ProtectedRoute