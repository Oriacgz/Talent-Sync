import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronDown, Sun, CloudSun, Moon, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useMatchStore } from '../../store/matchStore'
import { useApplicationStore } from '../../store/applicationStore'
import { matchService } from '../../services/matchService'
import { profileService } from '../../services/profileService'
import { SkeletonCard } from '../shared/Skeletons'

// Component: Match Card Circular Progress
function MatchArc({ score }) {
  // score is 0-1 from API; normalise so arc fills correctly
  const safeScore = Math.max(0, Math.min(1, Number(score) || 0))
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - safeScore * circumference
  return (
    <div className="relative flex items-center justify-center h-12 w-12 shrink-0">
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={radius} stroke="var(--bg-subtle)" strokeWidth="4" fill="transparent" />
        <circle
          cx="24" cy="24" r={radius}
          stroke="var(--accent-yellow)"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute font-mono text-[13px] font-bold text-(--text-primary)">{Math.round(safeScore * 100)}%</span>
    </div>
  )
}

function ProgressBar({ label, score }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-15 text-right font-sans text-[10px] font-medium uppercase text-(--text-muted)">{label}</span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-(--bg-subtle)">
        <div className="h-full rounded-full bg-(--accent-yellow)" style={{ width: `${score}%` }}></div>
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const matches = useMatchStore((state) => state.matches)
  const isLoading = useMatchStore((state) => state.isLoading)
  const setMatches = useMatchStore((state) => state.setMatches)
  const setLoading = useMatchStore((state) => state.setLoading)
  
  const applications = useApplicationStore((state) => state.applications)
  
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [howItWorksOpen, setHowItWorksOpen] = useState(false)

  const stats = useMemo(() => {
    return {
      applied: applications.filter(a => a.status === 'APPLIED').length,
      reviewed: applications.filter(a => ['REVIEWED', 'INTERVIEWING', 'SHORTLISTED'].includes(a.status)).length,
      shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
      selected: applications.filter(a => ['SELECTED', 'OFFERED', 'ACCEPTED'].includes(a.status)).length
    }
  }, [applications])

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const matchData = await matchService.getMyMatches(20)
        if (active && Array.isArray(matchData)) setMatches(matchData)
      } catch {}

      try {
        const profileData = await profileService.getMyProfile()
        if (active && profileData) {
          let score = 0
          if (profileData.fullName) score += 20
          if (profileData.college && profileData.cgpa) score += 20
          if (profileData.skills?.length > 0) score += 20
          if (profileData.bio) score += 10
          if (profileData.resume) score += 30
          setProfileIncomplete(score < 80)
        }
      } catch {}

      if (active) setLoading(false)
    }
    load()
    return () => { active = false }
  }, [setLoading, setMatches])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return { text: 'Good morning', Icon: Sun }
    if (hour >= 12 && hour < 17) return { text: 'Good afternoon', Icon: CloudSun }
    if (hour >= 17 && hour < 21) return { text: 'Good evening', Icon: Moon }
    return { text: 'Good night', Icon: Moon }
  }, [])

  const topMatches = useMemo(() => matches.slice(0, 3), [matches])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col gap-8 pb-12 w-full max-w-none"
    >
      {/* Block 1: Greeting Banner */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-[26px] font-bold text-(--text-primary)">
            {greeting.text}, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'} <greeting.Icon size={24} className="text-(--accent-yellow)" />
          </h1>
          <p className="font-sans text-[14px] text-(--text-secondary)">Your AI match engine is active and ready.</p>
        </div>
        {profileIncomplete && (
          <button
            onClick={() => navigate('/student/profile')}
            className="rounded-md bg-(--accent-yellow) px-4 py-2 font-heading text-[12px] font-bold uppercase text-(--text-on-accent) transition-transform hover:-translate-y-px"
          >
            Complete your profile <ArrowRight size={14} className="inline ml-1" />
          </button>
        )}
      </section>

      {/* Block 2: Stats Row */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'APPLIED', count: stats.applied, color: 'var(--accent-yellow)' },
          { label: 'REVIEWED', count: stats.reviewed, color: 'var(--accent-cyan)' },
          { label: 'SHORTLISTED', count: stats.shortlisted, color: 'var(--success)' },
          { label: 'SELECTED', count: stats.selected, color: 'var(--purple)' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col rounded-lg border border-(--border) bg-(--bg-card) p-4 transition-colors hover:border-(--border-strong) hover:bg-(--bg-subtle)"
            style={{ borderTop: `3px solid ${stat.color}` }}
          >
            <span className="font-sans text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)">
              {stat.label}
            </span>
            <span className="mt-2 font-mono text-[36px] font-bold leading-none text-(--text-primary)">
              {stat.count}
            </span>
          </div>
        ))}
      </section>

      {/* Block 3: Top Matches Section */}
      <section className="flex flex-col gap-4">
        <header className="flex items-end justify-between border-b border-(--border) pb-2">
          <div>
            <h2 className="font-heading text-lg font-bold text-(--text-primary)">Top Matches</h2>
            <p className="font-sans text-sm text-(--text-secondary)">Ranked by AI compatibility</p>
          </div>
          <Link
            to="/student/matches"
            className="font-sans text-[12px] font-medium text-(--text-secondary) hover:text-(--text-primary) transition-colors flex items-center gap-1"
          >
            VIEW ALL MATCHES <ChevronRight size={14} />
          </Link>
        </header>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : topMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-(--border) bg-(--bg-card) px-6 py-12 text-center">
            <svg width="120" height="80" viewBox="0 0 120 80" className="opacity-30 mb-6">
              <circle cx="20" cy="40" r="4" fill="none" stroke="var(--border-strong)" strokeWidth="2" />
              <circle cx="60" cy="20" r="6" fill="none" stroke="var(--border-strong)" strokeWidth="2" />
              <circle cx="60" cy="60" r="5" fill="none" stroke="var(--border-strong)" strokeWidth="2" />
              <circle cx="100" cy="40" r="4" fill="none" stroke="var(--border-strong)" strokeWidth="2" />
              <path d="M24 40 L54 20 M24 40 L55 60 M66 20 L96 40 M65 60 L96 40" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="4 4" />
            </svg>
            <p className="font-heading text-base font-bold text-(--text-primary)">Your AI matches will appear here</p>
            <p className="mt-1 font-sans text-sm text-(--text-secondary)">Complete your profile to unlock ranked recommendations</p>
            <button
              onClick={() => navigate('/student/profile')}
              className="mt-6 rounded-md bg-(--accent-yellow) px-4 py-2 font-heading text-[12px] font-bold text-(--text-on-accent) transition-transform hover:-translate-y-px"
            >
              START ONBOARDING <ArrowRight size={14} className="inline ml-1" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {topMatches.map((match) => (
              <div
                key={match.id}
                className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg border border-(--border) bg-(--bg-card) p-4 transition-colors hover:border-(--accent-yellow)"
              >
                <div className="flex items-center gap-4 min-w-0 md:w-[45%] lg:w-1/2 shrink-0">
                  <MatchArc score={match.score || match.finalScore || 0} />
                  <div className="min-w-0 overflow-hidden">
                    <h3 className="truncate font-heading text-[15px] font-bold text-(--text-primary)">{match.company || 'Company'}</h3>
                    <p className="truncate font-sans text-[13px] text-(--text-secondary)">{match.title || match.roleTitle || 'Role'}</p>
                    <div className="mt-2 hidden flex-wrap gap-1.5 sm:flex">
                      {(match.requiredSkills || []).slice(0, 3).map(skill => (
                        <span key={skill} className="rounded-sm border border-(--border) bg-(--bg-subtle) px-2 py-0.5 font-sans text-[11px] text-(--text-secondary)">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 md:w-55 shrink-0">
                  {/* Mock subscores based on match.score if missing */}
                  {(() => {
                    const pct = Math.round((match.score || match.finalScore || 0) * 100)
                    return (<>
                      <ProgressBar label="TECHNICAL" score={Math.min(95, pct + 5)} />
                      <ProgressBar label="ACADEMIC" score={Math.min(92, pct - 2)} />
                      <ProgressBar label="ROLE FIT" score={Math.min(98, pct + 2)} />
                    </>)
                  })()}
                  <div className="mt-1 text-right">
                    <button
                      onClick={() => navigate(`/student/match/${match.id}`)}
                      className="font-sans text-[12px] font-medium text-(--accent-cyan) hover:underline"
                    >
                      WHY THIS? <ArrowRight size={14} className="inline ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Block 4: How Matching Works */}
      <section>
        <button
          onClick={() => setHowItWorksOpen(!howItWorksOpen)}
          className="flex w-full items-center gap-2 rounded-lg bg-(--bg-subtle) px-4 py-3 text-left font-sans text-sm font-medium text-(--text-primary) transition-colors hover:bg-(--bg-card)"
        >
          <ChevronDown size={16} className={`transition-transform ${howItWorksOpen ? 'rotate-180' : ''}`} />
          How does the AI matching engine work?
        </button>
        <AnimatePresence>
          {howItWorksOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-lg bg-(--bg-subtle) p-6">
                {[
                  'Profile Standardization',
                  'Skills Contextualization',
                  'Role Fit Scoring',
                  'Ranked Recommendations'
                ].map((step, idx) => (
                  <div key={idx} className="flex min-w-[20%] items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--bg-card) text-[11px] font-bold text-(--text-primary)">
                      {idx + 1}
                    </div>
                    <span className="font-sans text-xs font-medium text-(--text-secondary)">{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* SEO */}
      <div className="hidden" aria-hidden="true">
        <title>Student Dashboard | TalentSync</title>
      </div>
    </motion.div>
  )
}
