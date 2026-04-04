import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Sparkles, Sun, Moon, LogOut, User, ChevronDown, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { authService } from '../../services/authService'
import { useToast } from '../shared/useToast'
import { useAuthStore } from '../../store/authStore'
import { useMatchStore } from '../../store/matchStore'
import { useApplicationStore } from '../../store/applicationStore'
import { useUIStore } from '../../store/uiStore'
import { normalizeRole } from '../../utils/roleUtils'

// ── Theme helpers ────────────────────────────────────────────────────────────
function getTheme() {
  try { return localStorage.getItem('ts-theme') || 'light' } catch { return 'light' }
}

function applyTheme(mode) {
  document.documentElement.classList.toggle('dark', mode === 'dark')
  try { localStorage.setItem('ts-theme', mode) } catch {}
}

// ── Nav configs (Base) ───────────────────────────────────────────────────────
const BASE_STUDENT_LINKS = [
  { to: '/student/dashboard', label: 'Dashboard' },
  { to: '/student/matches', label: 'Matches' },
  { to: '/student/applications', label: 'Applications' },
  { to: '/student/profile', label: 'Profile' },
  { to: '/student/how-it-works', label: 'How It Works' },
]

const RECRUITER_LINKS = [
  { to: '/recruiter/dashboard', label: 'Dashboard' },
  { to: '/recruiter/candidates', label: 'Candidates' },
  { to: '/recruiter/post-job', label: 'Post Job' },
  { to: '/recruiter/analytics', label: 'Analytics' },
  { to: '/recruiter/how-it-works', label: 'How It Works' },
]

// ── Profile incomplete banner ────────────────────────────────────────────────
function ProfileBanner({ onDismiss }) {
  const navigate = useNavigate()
  return (
    <div className="flex h-10 w-full items-center justify-between bg-(--accent-yellow) px-4" role="alert">
      <p className="flex items-center gap-1.5 font-sans text-[13px] font-medium text-(--text-on-accent)">
        <Zap size={14} className="fill-current" /> Your profile is incomplete — finish it to unlock better AI matches.
      </p>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate('/student/profile')}
          className="font-heading text-[12px] font-bold uppercase text-(--text-on-accent) underline"
        >
          Complete now →
        </button>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="font-bold text-(--text-on-accent) opacity-60 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// ── Avatar Dropdown ──────────────────────────────────────────────────────────
function AvatarDropdown({ user, role, profileCompletion, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = (user?.name || user?.email || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const email = user?.email || ''
  const name = user?.name || 'User'
  const isIncomplete = role === 'STUDENT' && Number(profileCompletion ?? 100) < 100

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-md border border-(--border) px-2 py-1 transition-colors hover:bg-(--bg-subtle)"
        aria-label="User menu"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-(--accent-yellow) font-heading text-[11px] font-bold text-(--text-on-accent)">
          {initials}
        </span>
        <ChevronDown size={12} className="text-(--text-muted)" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 rounded-lg border border-(--border) bg-(--bg-card) py-1"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
        >
          {/* User info */}
          <div className="px-4 py-3 border-b border-(--border)">
            <p className="font-heading text-[14px] font-bold text-(--text-primary) leading-tight">{name}</p>
            <p className="font-sans text-[12px] text-(--text-muted) mt-0.5">{email}</p>
          </div>

          {/* Status */}
          <div className="px-4 py-2 border-b border-(--border)">
            {isIncomplete ? (
              <button
                onClick={() => { setOpen(false); navigate('/student/profile') }}
                className="flex items-center gap-1.5 font-sans text-[11px] text-(--warning) hover:underline"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-(--accent-yellow)" />
                Profile Incomplete
              </button>
            ) : (
              <span className="flex items-center gap-1.5 font-sans text-[11px] text-(--success)">
                <span className="inline-block h-2 w-2 rounded-full bg-(--success)" />
                Active
              </span>
            )}
          </div>

          {/* Actions */}
          {role === 'STUDENT' && (
            <button
              onClick={() => { setOpen(false); navigate('/student/profile') }}
              className="flex w-full items-center gap-2 px-4 py-2 font-sans text-[13px] text-(--text-primary) hover:bg-(--bg-subtle) transition-colors"
            >
              <User size={14} className="text-(--text-muted)" />
              Profile Settings
            </button>
          )}
          <div className="border-t border-(--border) mt-1" />
          <button
            onClick={() => { setOpen(false); onLogout() }}
            className="flex w-full items-center gap-2 px-4 py-2 font-sans text-[13px] text-(--text-primary) hover:bg-(--bg-subtle) hover:text-(--danger) transition-colors"
          >
            <LogOut size={14} className="text-(--text-muted)" />
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main TopBar ──────────────────────────────────────────────────────────────
export default function AppNavbar({ showBanner, onDismissBanner, profileCompletion = 100 }) {
  const navigate = useNavigate()
  const toast = useToast()
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const clearMatches = useMatchStore((state) => state.clearMatches)
  const resetUIState = useUIStore((state) => state.resetUIState)
  const { aiPanelOpen, toggleAIPanel } = useUIStore()

  const matches = useMatchStore((state) => state.matches)
  const applications = useApplicationStore((state) => state.applications)

  const role = normalizeRole(user?.role)

  const newMatchesCount = matches.filter(m => {
    const s = String(m.status || '').toLowerCase()
    return s === 'new' || s === 'unseen'
  }).length

  const appliedCount = applications.filter(a => {
    const s = String(a.status || '').toLowerCase()
    return s === 'applied'
  }).length

  const studentLinks = BASE_STUDENT_LINKS.map(link => {
    if (link.label === 'Matches') return { ...link, badge: newMatchesCount > 0 ? newMatchesCount : null }
    if (link.label === 'Applications') return { ...link, badge: appliedCount > 0 ? appliedCount : null }
    return link
  })

  const links = role === 'RECRUITER' ? RECRUITER_LINKS : studentLinks

  const [theme, setTheme] = useState(getTheme)

  // Apply saved theme on mount
  useEffect(() => { applyTheme(theme) }, [theme])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  const onLogout = async () => {
    try { await authService.logout() } catch {}
    clearMatches()
    resetUIState()
    clearAuth()
    toast.success('Logged out successfully.')
    navigate('/login', { replace: true })
  }

  return (
    <div className="sticky top-0 z-20 flex flex-col">
      <header className="flex h-14 items-center border-b border-(--border) bg-(--bg-base)/80 backdrop-blur-lg px-4 md:px-6">
        {/* LEFT: Logo area */}
        <div className="flex w-45 shrink-0 items-center">
          <button
            onClick={() => navigate(role === 'RECRUITER' ? '/recruiter/dashboard' : '/student/dashboard')}
            className="flex items-center gap-2 group"
          >
            <span className="font-heading text-[16px] font-bold text-(--accent-yellow)">TS—</span>
            <span className="font-heading text-[16px] font-bold text-(--text-primary) hidden sm:inline group-hover:text-(--accent-yellow) transition-colors">TalentSync</span>
          </button>
        </div>

        {/* CENTER: Nav links (centered) */}
        <nav className="flex-1 flex items-center justify-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative flex items-center gap-1.5 shrink-0 rounded-lg px-4 py-1.5 font-heading text-[14.5px] transition-all duration-300 whitespace-nowrap z-10
                ${isActive
                  ? 'font-bold text-(--text-primary)'
                  : 'text-(--text-secondary) hover:text-(--text-primary)'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="nav-toggle-bg"
                      className="absolute inset-0 z-0 rounded-lg bg-(--bg-subtle) border border-(--border)"
                      transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {link.label}
                    {link.badge != null && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-(--accent-yellow) px-1 font-mono text-[10px] font-bold text-(--text-on-accent)">
                        {link.badge}
                      </span>
                    )}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* RIGHT: actions area */}
        <div className="flex w-45 shrink-0 items-center justify-end gap-3">
          {/* Career AI toggle (Student Only) */}
          {role === 'STUDENT' && (
            <button
              type="button"
              onClick={toggleAIPanel}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-heading text-[13px] font-semibold transition-all whitespace-nowrap ${
                aiPanelOpen
                  ? 'bg-(--accent-yellow) text-(--text-on-accent) shadow-sm'
                  : 'bg-(--bg-subtle) text-(--text-primary) hover:bg-(--bg-card) border border-(--border)'
              }`}
            >
              <Sparkles size={14} className={aiPanelOpen ? 'fill-current' : ''} />
              <span className="hidden lg:inline">Career AI</span>
            </button>
          )}

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-md text-(--text-secondary) hover:bg-(--bg-subtle) hover:text-(--text-primary) transition-colors border border-transparent hover:border-(--border)"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Avatar dropdown */}
          <AvatarDropdown user={user} role={role} profileCompletion={profileCompletion} onLogout={onLogout} />
        </div>
      </header>

      {/* Profile incomplete banner (student only, dismissible) */}
      {showBanner && role === 'STUDENT' && (
        <ProfileBanner onDismiss={onDismissBanner} />
      )}
    </div>
  )
}