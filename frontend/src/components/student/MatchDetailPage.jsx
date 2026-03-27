/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Full detail view for one match. Left: job info + apply button.
 *                 Right: large MatchRing + full SHAPChart breakdown.
 *                 Apply button calls applicationService.apply().
 * DEPENDS ON: matchService, applicationService, SHAPChart, MatchRing, SkillTag
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { applicationService } from '../../services/applicationService'
import { matchService } from '../../services/matchService'
import {
  buildMatchNarrative,
  explainFactor,
  scoreToPercent,
  strongestShapFactor,
  topShapReasons,
  weakestShapFactor,
} from '../../utils/formatters'
import EmptyState from '../shared/EmptyState'
import MatchRing from '../shared/MatchRing'
import SHAPChart from '../shared/SHAPChart'
import { SkeletonCard } from '../shared/Skeletons'
import SkillTag from '../shared/SkillTag'
import { useToast } from '../shared/useToast'

export default function MatchDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [applyState, setApplyState] = useState('idle')
  const [reloadTick, setReloadTick] = useState(0)

  const strongest = strongestShapFactor(match?.shapValues)
  const weakest = weakestShapFactor(match?.shapValues)
  const topReasons = useMemo(() => topShapReasons(match?.shapValues, 2), [match?.shapValues])

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setLoadError('')
      if (!id || !String(id).trim()) {
        setMatch(null)
        setLoadError('Invalid match id.')
        setLoading(false)
        return
      }
      const data = await matchService.getMatchDetail(id)
      if (!active) {
        return
      }
      setMatch(data)
      setLoading(false)
    }

    load().catch((error) => {
      if (!active) {
        return
      }
      setMatch(null)
      setLoadError(error?.message || 'Unable to load match detail right now.')
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [id, reloadTick])

  const onApply = async () => {
    if (!match?.jobId) {
      return
    }
    setApplyState('loading')
    try {
      await applicationService.apply(match.jobId)
      setApplyState('done')
      toast.success('Application submitted.')
    } catch {
      setApplyState('error')
      toast.error('Unable to submit application right now.')
    }
  }

  if (loading) {
    return (
      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <SkeletonCard className="min-h-75" />
        <SkeletonCard className="min-h-75" />
      </section>
    )
  }

  if (!match) {
    return (
      <section className="space-y-4">
        <EmptyState
          title="Match not found"
          subtitle={loadError || 'This match may have expired or is no longer available.'}
          actionLabel="Back to Matches"
          onAction={() => navigate('/student/matches')}
          secondaryActionLabel="Retry"
          onSecondaryAction={() => setReloadTick((value) => value + 1)}
          icon="?"
        />
      </section>
    )
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <article className="stack-base card-base">
        <div className="brutal-panel brutal-panel-accent">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/80">Overall Match Score</p>
          <p className="text-4xl font-bold text-ink">{scoreToPercent(match.score || match.finalScore || 0)}</p>
          <p className="mt-1 text-xs text-ink/75">This score combines skill alignment, profile strength, and role-fit signals.</p>
        </div>

        <header>
          <h1 className="wrap-break-word text-2xl font-bold">{match.title || 'Role'}</h1>
          <p className="wrap-break-word text-secondary">{match.company || 'Company'} · {match.location || 'Remote'}</p>
        </header>

        <p className="text-sm text-ink/85">{buildMatchNarrative(match)}</p>

        <article className="brutal-panel text-xs text-ink/85">
          <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="uppercase tracking-wider text-ink">How this score was generated</p>
            <button
              type="button"
              onClick={() => navigate('/how-matching-works')}
              className="btn-secondary btn-feedback"
            >
              Full Method
            </button>
          </div>
          <p>{'Profile input -> data processing -> score generation -> explainability factors.'}</p>
        </article>

        <div className="surface-muted text-xs text-ink/75">
          <p className="mb-2 text-ink/90">Top explainability signals</p>
          <div className="stack-dense">
            {topReasons.length ? (
              topReasons.map((reason) => (
                <p key={reason.feature}>{reason.feature}: {reason.value >= 0 ? '+' : ''}{reason.value.toFixed(2)}</p>
              ))
            ) : (
              <p>No explainability signals available.</p>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="surface-info text-xs text-ink/85">
            <p className="mb-1 uppercase tracking-wider text-ink">Strongest Factor</p>
            <p className="font-semibold text-ink">{strongest?.feature || 'N/A'}</p>
            <p>{explainFactor(strongest)}</p>
          </div>
          <div className="surface-muted text-xs text-ink/85">
            <p className="mb-1 uppercase tracking-wider text-ink">Weakest Factor</p>
            <p className="font-semibold text-ink">{weakest?.feature || 'N/A'}</p>
            <p>{explainFactor(weakest)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(match.requiredSkills || []).map((skill) => (
            <SkillTag key={skill} skill={skill} />
          ))}
        </div>

        <button
          type="button"
          onClick={onApply}
          disabled={applyState === 'loading' || applyState === 'done'}
          className="btn-secondary btn-feedback disabled:cursor-not-allowed disabled:opacity-60"
        >
          {applyState === 'loading' ? 'Applying...' : applyState === 'done' ? 'Applied' : 'Apply Now'}
        </button>

        {applyState === 'error' ? <p className="text-sm text-pink">Unable to submit application right now.</p> : null}
      </article>

      <aside className="stack-base card-base">
        <div className="flex items-center justify-center">
          <MatchRing score={match.score || match.finalScore || 0} size={96} strokeWidth={8} />
        </div>
        <SHAPChart shapValues={match.shapValues} totalScore={match.score || match.finalScore || 0} />
      </aside>
    </section>
  )
}