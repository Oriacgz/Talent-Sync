/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Left sidebar navigation. Shows different links based on role.
 *                 Student: Dashboard, Matches, Applications, Profile, Onboarding.
 *                 Recruiter: Dashboard, Post Job, Analytics.
 *                 Collapses to icon-only mode.
 * DEPENDS ON: authStore, uiStore, react-router-dom useLocation
 */
import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3,
  BriefcaseBusiness,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  FileText,
  LayoutDashboard,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { normalizeRole } from '../../utils/roleUtils'

const STUDENT_LINKS = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/profile', label: 'Profile', icon: UserRound },
  { to: '/student/matches', label: 'Matches', icon: Sparkles },
  { to: '/student/applications', label: 'Applications', icon: FileText },
  { to: '/how-matching-works', label: 'How It Works', icon: CircleHelp },
]

const RECRUITER_LINKS = [
  { to: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/recruiter/post-job', label: 'Post Job', icon: BriefcaseBusiness },
  { to: '/recruiter/candidates', label: 'Candidates', icon: Users },
  { to: '/recruiter/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/how-matching-works', label: 'How It Works', icon: CircleHelp },
]

export default function Sidebar() {
  const location = useLocation()
  const closeButtonRef = useRef(null)
  const role = normalizeRole(useAuthStore((state) => state.user?.role))
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const mobileSidebarOpen = useUIStore((state) => state.mobileSidebarOpen)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const closeMobileSidebar = useUIStore((state) => state.closeMobileSidebar)

  const links = role === 'RECRUITER' ? RECRUITER_LINKS : STUDENT_LINKS

  useEffect(() => {
    closeMobileSidebar()
  }, [closeMobileSidebar, location.pathname])

  useEffect(() => {
    if (!mobileSidebarOpen) {
      document.body.style.overflow = ''
      return undefined
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMobileSidebar()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [closeMobileSidebar, mobileSidebarOpen])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        closeMobileSidebar()
      }
    }

    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [closeMobileSidebar])

  return (
    <>
      <aside
        className={`neo-sidebar sticky top-0 z-20 h-screen ${
          sidebarOpen ? 'w-64' : 'w-20'
        } hidden shrink-0 transition-all duration-200 md:block`}
      >
        <div className="flex h-16 items-center justify-between border-b-[3px] border-(--border) px-4">
          {sidebarOpen ? (
            <span className="font-mono text-xs uppercase tracking-widest text-ink">TalentSync</span>
          ) : (
            <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-[3px] border-2 border-(--border) bg-(--yellow) font-mono text-xs font-bold text-ink shadow-[3px_3px_0_var(--border)]">
              TS
            </span>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="icon-btn"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
          </button>
        </div>

        <nav className="space-y-2 p-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `group neo-navlink text-sm ${
                  isActive
                    ? 'neo-navlink-active'
                    : ''
                }`
              }
              title={!sidebarOpen ? link.label : undefined}
              aria-label={link.label}
              end
            >
              <span className="flex items-center gap-2.5">
                <link.icon size={16} strokeWidth={2.2} />
                {sidebarOpen ? <span className="leading-tight">{link.label}</span> : null}
              </span>
              {!sidebarOpen ? <span className="neo-tooltip">{link.label}</span> : null}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div
        className={`fixed inset-0 z-40 bg-black/35 transition-opacity duration-200 md:hidden ${mobileSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={closeMobileSidebar}
        role="presentation"
        aria-hidden
      />

      <aside
        id="mobile-sidebar"
        className={`neo-sidebar fixed left-0 top-0 z-50 h-screen w-72 max-w-[84vw] border-r-[3px] border-(--border) shadow-[6px_0_0_var(--border)] transition-transform duration-200 md:hidden ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile sidebar"
        aria-hidden={!mobileSidebarOpen}
      >
        <div className="flex h-16 items-center justify-between border-b-[3px] border-(--border) px-4">
          <span className="font-mono text-xs uppercase tracking-widest text-ink">TalentSync</span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeMobileSidebar}
            className="icon-btn"
            aria-label="Close menu"
          >
            <ChevronsLeft size={16} />
          </button>
        </div>

        <nav className="space-y-2 p-3">
          {links.map((link) => (
            <NavLink
              key={`mobile-${link.to}`}
              to={link.to}
              className={({ isActive }) =>
                `neo-navlink text-sm ${
                  isActive
                    ? 'neo-navlink-active'
                    : ''
                }`
              }
              aria-label={link.label}
              end
            >
              <span className="flex items-center gap-2.5">
                <link.icon size={16} strokeWidth={2.2} />
                <span className="leading-tight">{link.label}</span>
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}