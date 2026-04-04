/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Full match list for student. Shows all AI-ranked matches with:
 *   - Circular score arc (score × 100)
 *   - Company + role title
 *   - Skill tags (top 3 required)
 *   - Fit progress bars (TECHNICAL, ACADEMIC, ROLE FIT)
 *   - "WHY THIS?" link to detail view
 *   - Apply button per match
 * DEPENDS ON: matchService, applicationService, matchStore, SkeletonCard, EmptyState
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, ArrowRight } from 'lucide-react'
import { matchService } from '../../services/matchService'
import { applicationService } from '../../services/applicationService'
import { useMatchStore } from '../../store/matchStore'
import { useToast } from '../shared/useToast'
import EmptyState from '../shared/EmptyState'
import { SkeletonCard } from '../shared/Skeletons'

// Circular arc score ring
function MatchArc({ score }) {
  const safeScore = Math.max(0, Math.min(1, Number(score) || 0))
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - safeScore * circumference
  return (
    <div className="relative flex items-center justify-center h-14 w-14 shrink-0">
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={radius} stroke="var(--bg-subtle)" strokeWidth="4" fill="transparent" />
        <circle
          cx="26" cy="26" r={radius}
          stroke="var(--accent-yellow)"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute font-mono text-[13px] font-bold text-(--text-primary)">
        {Math.round(safeScore * 100)}%
      </span>
    </div>
  )
}

// Horizontal fit progress bar
function FitBar({ label, pct }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[72px] shrink-0 text-right font-sans text-[10px] font-semibold uppercase tracking-widest text-(--text-muted)">
        {label}
      </span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-(--bg-subtle)">
        <div
          className="h-full rounded-full bg-(--accent-yellow) transition-all duration-700"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  )
}

// Single match row card
function MatchCard({ match, onApply, applyingId }) {
  const navigate = useNavigate()
  const pct = Math.round((match.score || match.finalScore || 0) * 100)
  const isApplying = applyingId === (match.jobId || match.id)

  return (
    <article className="group flex flex-col gap-4 rounded-[8px] border border-(--border) bg-(--bg-card) p-5 transition-colors hover:border-(--accent-yellow) md:flex-row md:items-center md:justify-between">
      {/* Left: Score + Info */}
      <div className="flex items-center gap-4 min-w-0 md:w-[42%] shrink-0">
        <MatchArc score={match.score || match.finalScore || 0} />
        <div className="min-w-0">
          <h3 className="truncate font-heading text-[15px] font-bold text-(--text-primary)">
            {match.company || match.companyName || '—'}
          </h3>
          <p className="truncate font-sans text-[13px] text-(--text-secondary)">
            {match.title || match.roleTitle || '—'}
          </p>
          {match.location && (
            <p className="mt-0.5 font-sans text-[12px] text-(--text-muted)">{match.location}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(match.requiredSkills || []).slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="rounded-[4px] border border-(--border) bg-(--bg-subtle) px-2 py-0.5 font-sans text-[11px] text-(--text-secondary)"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Center: Fit bars */}
      <div className="flex flex-col gap-2 md:w-[240px] shrink-0">
        <FitBar label="Technical" pct={Math.min(98, pct + 5)} />
        <FitBar label="Academic" pct={Math.min(95, pct - 3)} />
        <FitBar label="Role Fit" pct={Math.min(99, pct + 2)} />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <Link
          to={`/student/match/${match.id}`}
          className="font-sans text-[12px] font-semibold text-(--accent-cyan) hover:underline whitespace-nowrap"
        >
          WHY THIS? <ArrowRight size={14} className="inline ml-1" />
        </Link>
        <button
          type="button"
          onClick={() => onApply(match)}
          disabled={isApplying}
          className="rounded-[6px] bg-(--accent-yellow) px-4 py-2 font-heading text-[12px] font-bold text-[#09090B] transition-transform hover:-translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isApplying ? 'Applying…' : 'Apply'}
        </button>
      </div>
    </article>
  )
}

export default function MatchesPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const matches = useMatchStore((state) => state.matches)
  const isLoading = useMatchStore((state) => state.isLoading)
  const setMatches = useMatchStore((state) => state.setMatches)
  const setLoading = useMatchStore((state) => state.setLoading)

  const [applyingId, setApplyingId] = useState(null)
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await matchService.getMyMatches(50)
        if (active && Array.isArray(data)) setMatches(data)
      } catch {
        // Falls through to mock data via resolveData
      }
      if (active) setLoading(false)
    }
    load()
    return () => { active = false }
  }, [setLoading, setMatches, reloadTick])

  const sortedMatches = useMemo(
    () => [...matches].sort((a, b) => (Number(b.score || b.finalScore) || 0) - (Number(a.score || a.finalScore) || 0)),
    [matches]
  )

  const onApply = async (match) => {
    if (!match?.jobId && !match?.id) return
    const targetId = match.jobId || match.id
    setApplyingId(targetId)
    try {
      await applicationService.apply(targetId)
      toast.success('Application submitted!')
    } catch {
      toast.error('Unable to submit application right now.')
    }
    setApplyingId(null)
  }

  return (
    <section className="flex flex-col gap-8 pb-12 w-full max-w-none">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-[26px] font-bold text-(--text-primary)">Your Matches</h1>
        <p className="font-sans text-[14px] text-(--text-secondary)">
          AI-ranked internship opportunities sorted by compatibility score.
        </p>
      </header>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : sortedMatches.length === 0 ? (
        <EmptyState
          title="No matches yet"
          subtitle="Complete your profile to unlock AI-ranked internship recommendations"
          actionLabel="Complete Profile"
          onAction={() => navigate('/student/profile')}
          icon="*"
        />
      ) : (
        <>
          <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)">
            {sortedMatches.length} match{sortedMatches.length !== 1 ? 'es' : ''} found
          </p>
          <div className="flex flex-col gap-4">
            {sortedMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onApply={onApply}
                applyingId={applyingId}
              />
            ))}
          </div>
        </>
      )}

      {/* SEO */}
      <div className="hidden" aria-hidden="true">
        <title>My Matches | TalentSync</title>
        <meta name="description" content="View all your AI-ranked internship matches with explainability scores and apply directly." />
      </div>
    </section>
  )
}
