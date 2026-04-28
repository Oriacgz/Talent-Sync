import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { normalizeRole } from '../../utils/roleUtils'

export default function ProtectedRoute({ requiredRole, children }) {
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const rehydrated = useAuthStore((state) => state.rehydrated)
  const user = useAuthStore((state) => state.user)
  const [hydrationTimedOut, setHydrationTimedOut] = useState(false)

  useEffect(() => {
    if (rehydrated) return undefined

    const timeoutId = window.setTimeout(() => {
      setHydrationTimedOut(true)
    }, 4000)

    return () => window.clearTimeout(timeoutId)
  }, [rehydrated])

  if (!rehydrated && !hydrationTimedOut) {
    return (
      <div className="card-base mx-auto mt-6 max-w-md text-sm text-ink/75" role="status" aria-live="polite">
        Loading workspace session...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const normalizedRole = normalizeRole(user?.role)

  if (requiredRole && normalizedRole !== normalizeRole(requiredRole)) {
    if (normalizedRole === 'RECRUITER') {
      return <Navigate to="/recruiter/dashboard" replace />
    }
    if (normalizedRole === 'STUDENT') {
      return <Navigate to="/student/dashboard" replace />
    }
    return <Navigate to="/login" replace />
  }

  // New students with incomplete onboarding cannot access match surfaces yet.
  const blockedStudentRoutesForIncompleteOnboarding =
    location.pathname === '/student/dashboard' ||
    location.pathname === '/student/matches' ||
    location.pathname.startsWith('/student/match/')

  if (
    requiredRole &&
    normalizedRole === 'STUDENT' &&
    user?.onboardingComplete === false &&
    blockedStudentRoutesForIncompleteOnboarding
  ) {
    return <Navigate to="/student/onboarding" replace />
  }

  if (children) {
    return children
  }

  return <Outlet />
}