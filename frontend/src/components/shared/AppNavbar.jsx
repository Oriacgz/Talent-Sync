/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Top navigation bar inside the app (not landing page).
 *                 Shows TS— logo, current user name + role badge, logout button.
 * DEPENDS ON: authStore, authService, react-router-dom
 */
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import { useToast } from '../shared/useToast'
import { useAuthStore } from '../../store/authStore'
import { useMatchStore } from '../../store/matchStore'
import { useUIStore } from '../../store/uiStore'
import { normalizeRole } from '../../utils/roleUtils'

export default function AppNavbar() {
  const navigate = useNavigate()
  const toast = useToast()
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const clearMatches = useMatchStore((state) => state.clearMatches)
  const resetUIState = useUIStore((state) => state.resetUIState)
  const mobileSidebarOpen = useUIStore((state) => state.mobileSidebarOpen)
  const toggleMobileSidebar = useUIStore((state) => state.toggleMobileSidebar)

  const role = normalizeRole(user?.role)

  const onLogout = async () => {
    try {
      await authService.logout()
    } catch {
      // Ignore network errors on logout because tokens are client-side stateless.
    } finally {
      clearMatches()
      resetUIState()
      clearAuth()
      toast.success('Logged out successfully.')
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="neo-topbar sticky top-0 z-10 flex h-16 items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="btn-secondary btn-feedback md:hidden"
          aria-expanded={mobileSidebarOpen}
          aria-controls="mobile-sidebar"
        >
          Menu
        </button>
        <p className="font-sans text-lg font-bold tracking-tight text-ink">Workspace</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-ink">{user?.name || user?.email || 'User'}</p>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/60">{role || 'ROLE'}</p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="btn-secondary btn-feedback"
        >
          Logout
        </button>
      </div>
    </header>
  )
}