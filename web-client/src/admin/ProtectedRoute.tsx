import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function ProtectedRoute() {
  const { token, loading } = useAuth()

  if (loading) return null
  if (!token) return <Navigate to="/admin/login" replace />

  return <Outlet />
}
