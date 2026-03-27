import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { normalizeRole } from '../../utils/roleUtils'

export default function RoleRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const userRole = useAuthStore((state) => state.user?.role)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const role = normalizeRole(userRole)

  if (role === 'RECRUITER') {
    return <Navigate to="/recruiter/dashboard" replace />
  }

  if (role !== 'STUDENT') {
    return <Navigate to="/login" replace />
  }

  return <Navigate to="/student/dashboard" replace />
}
