/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Student's main page. Fetches top matches from matchService.
 *                 Shows ranked match cards with MatchRing, SkillTags, Apply link.
 *                 Shows EmptyState if no matches with link to Onboarding.
 * DEPENDS ON: matchService, matchStore, MatchRing, SkillTag, EmptyState
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../shared/EmptyState'
import FloatingCareerAssistant from './FloatingCareerAssistant'
import MatchRing from '../shared/MatchRing'
import { SkeletonCard } from '../shared/Skeletons'
import SkillTag from '../shared/SkillTag'
import { jobService } from '../../services/jobService'
import { matchService } from '../../services/matchService'
import { useMatchStore } from '../../store/matchStore'
import { buildMatchNarrative, getSkillGapInsight, topShapReasons } from '../../utils/formatters'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [reloadTick, setReloadTick] = useState(0)
  const [jobs, setJobs] = useState([])
  const matches = useMatchStore((state) => state.matches)
  const isLoading = useMatchStore((state) => state.isLoading)
  const error = useMatchStore((state) => state.error)
  const setMatches = useMatchStore((state) => state.setMatches)
  const setLoading = useMatchStore((state) => state.setLoading)
  const setError = useMatchStore((state) => state.setError)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError(null)
      const [matchResult, jobResult] = await Promise.allSettled([
        matchService.getMyMatches(20),
        jobService.getAllJobs(),
      ])
      if (!active) {
        return
      }
      const matchData = matchResult.status === 'fulfilled' ? matchResult.value : []
      const jobData = jobResult.status === 'fulfilled' ? jobResult.value : []
      if (Array.isArray(matchData)) {
        setMatches(matchData)
      } else {
        setMatches([])
      }
      setJobs(Array.isArray(jobData) ? jobData : [])
      if (matchResult.status === 'rejected') {
        setError(matchResult.reason?.message || 'Some match data could not be loaded.')
      }
      setLoading(false)
    }

    load().catch((loadError) => {
      if (!active) {
        return
      }
      setLoading(false)
      setError(loadError?.message || 'Unable to load matches')
      setJobs([])
    })

    return () => {
      active = false
    }
  }, [reloadTick, setError, setLoading, setMatches])

  const retryLoad = () => {
    setReloadTick((value) => value + 1)
  }

  const topMatches = useMemo(() => matches.slice(0, 3), [matches])
  const skillGapInsight = useMemo(() => getSkillGapInsight(topMatches, jobs), [jobs, topMatches])

  return (
    <>
    <section className="stack-base">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-primary-hero">Top 3 Matches</h1>
          <p className="text-secondary">Your strongest opportunities based on skills, profile, and role-fit signals.</p>
        </div>
      </header>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard className="hidden xl:block" />
        </div>
      ) : null}

      {!isLoading && error ? (
        <EmptyState
          title="Could not load your matches"
          subtitle={error}
          actionLabel="Retry"
          onAction={retryLoad}
          secondaryActionLabel="Complete Onboarding"
          onSecondaryAction={() => navigate('/student/onboarding')}
          icon="!"
        />
      ) : null}

      {!isLoading && !error && matches.length === 0 ? (
        <EmptyState
          title="No matches yet"
          subtitle="Complete onboarding and profile details to get ranked recommendations."
          actionLabel="Start Onboarding"
          onAction={() => navigate('/student/onboarding')}
        />
      ) : null}

      {!isLoading && !error && matches.length > 0 ? (
        <article className="card-base stack-dense">
          <p className="text-xs uppercase tracking-wider text-ink/70">Skill Gap Insight</p>
          {skillGapInsight ? (
            <>
              <p className="text-sm text-ink/90">You are currently missing <span className="font-semibold text-ink">{skillGapInsight.skill}</span> in your top opportunities.</p>
              <p className="text-xs text-ink/70">
                {typeof skillGapInsight.prevalencePercent === 'number'
                  ? `${skillGapInsight.prevalencePercent}% of listed requirements in available jobs mention this skill.`
                  : 'Prevalence percentage is currently unavailable from the available dataset.'}
              </p>
            </>
          ) : (
            <p className="text-sm text-ink/80">No high-priority missing skill detected in your current top matches.</p>
          )}
        </article>
      ) : null}

      {!isLoading && !error ? (
        <article className="card-base stack-dense">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs uppercase tracking-wider text-ink">How Matching Works</p>
            <button
              type="button"
              onClick={() => navigate('/how-matching-works')}
              className="btn-secondary btn-feedback"
            >
              View Full Flow
            </button>
          </div>
          <ol className="list-decimal space-y-1 pl-4 text-xs text-ink/80">
            <li>Your profile and preferences are standardized into comparable signals.</li>
            <li>Role requirements are compared against those signals for fit.</li>
            <li>A match score is generated to rank the best opportunities.</li>
            <li>Top factors are shown so you can understand and improve your score.</li>
          </ol>
        </article>
      ) : null}

      {!isLoading && !error ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topMatches.map((match, index) => (
            <article key={match.id} className="card-base card-hover">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="badge w-fit border-ink text-ink">Rank #{index + 1}</p>
                <h2 className="truncate text-base font-semibold">{match.title || match.roleTitle || 'Untitled role'}</h2>
                <p className="truncate text-secondary">{match.company || 'Company'}</p>
                <p className="truncate text-tertiary">{match.location || 'Remote'}</p>
              </div>
              <div className="shrink-0">
                <MatchRing score={match.score || match.finalScore || 0} />
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {(match.requiredSkills || []).slice(0, 4).map((skill) => (
                <SkillTag key={`${match.id}-${skill}`} skill={skill} />
              ))}
            </div>

            <div className="surface-muted mb-4 stack-dense text-xs text-ink/80">
              <p className="text-ink">Top contributing factors</p>
              {topShapReasons(match.shapValues, 2).map((reason) => (
                <p key={`${match.id}-${reason.feature}`}>
                  {reason.feature}: {reason.value >= 0 ? '+' : ''}{reason.value.toFixed(2)}
                </p>
              ))}
            </div>

            <p className="mb-4 text-xs text-ink/75">{buildMatchNarrative(match)}</p>

            <button
              type="button"
              onClick={() => navigate(`/student/match/${match.id}`)}
              className="btn-primary btn-feedback w-full"
            >
              View Match Details
            </button>
            </article>
          ))}
        </div>
      ) : null}
    </section>
    <FloatingCareerAssistant />
    </>
  )
}