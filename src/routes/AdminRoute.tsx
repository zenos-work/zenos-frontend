import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ADMIN_ROLES = ['SUPERADMIN', 'APPROVER']

export default function AdminRoute() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user || !ADMIN_ROLES.includes(user.role))
    return <Navigate to='/' replace />
  return <Outlet />
}
