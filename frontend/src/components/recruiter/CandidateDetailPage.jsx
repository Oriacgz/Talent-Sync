/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Full detail for one candidate. Shows student skills/GPA/college.
 *                 MatchRing + SHAPChart explaining why this student matched.
 *                 Status update buttons: Reviewed / Shortlist / Select / Reject.
 * DEPENDS ON: matchService, applicationService, SHAPChart, MatchRing, StatusBadge
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { applicationService } from '../../services/applicationService'
import { matchService } from '../../services/matchService'
import { buildMatchNarrative, topShapReasons } from '../../utils/formatters'
import EmptyState from '../shared/EmptyState'
import MatchRing from '../shared/MatchRing'
import SHAPChart from '../shared/SHAPChart'
import { SkeletonCard } from '../shared/Skeletons'
import SkillTag from '../shared/SkillTag'
import StatusBadge from '../shared/StatusBadge'
import { useToast } from '../shared/useToast'

const STATUS_ACTIONS = [
  { label: 'Mark Reviewed', value: 'REVIEWED' },
  { label: 'Shortlist', value: 'SHORTLISTED' },
  { label: 'Select', value: 'SELECTED' },
  { label: 'Reject', value: 'REJECTED' },
]

export default function CandidateDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const jobId = String(searchParams.get('jobId') || '').trim()
  const toast = useToast()
  const [candidate, setCandidate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)
  const [status, setStatus] = useState('APPLIED')
  const [statusSaving, setStatusSaving] = useState(false)
  const topReasons = useMemo(() => topShapReasons(candidate?.shapValues, 2), [candidate?.shapValues])

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setLoadError('')
      if (!id || !String(id).trim()) {
        setCandidate(null)
        setLoadError('Invalid candidate id.')
        setLoading(false)
        return
      }
      const data = await matchService.getJobCandidates(jobId)
      if (!active) {
        return
      }
      const all = Array.isArray(data) ? data : []
      const nextCandidate = all.find((item) => String(item.id) === String(id)) || null
      setCandidate(nextCandidate)
      setStatus(String(nextCandidate?.status || 'APPLIED').toUpperCase())
      setLoading(false)
    }

    load().catch((error) => {
      if (active) {
        setCandidate(null)
        setLoadError(error?.message || 'Unable to load candidate detail right now.')
        setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [id, jobId, reloadTick])

  if (loading) {
    return (
      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <SkeletonCard className="min-h-75" />
        <SkeletonCard className="min-h-75" />
      </section>
    )
  }

  const onUpdateStatus = async (nextStatus) => {
    if (!candidate || statusSaving || nextStatus === status) {
      return
    }

    if (!candidate.applicationId) {
      toast.error('Unable to update candidate status: missing application ID.')
      return
    }

    const previousStatus = status
    setStatusSaving(true)
    setStatus(nextStatus)
    try {
      const applicationId = candidate.applicationId
      await applicationService.updateStatus(applicationId, nextStatus)
      toast.success(`Candidate moved to ${nextStatus}.`)
    } catch {
      setStatus(previousStatus)
      toast.error('Unable to update candidate status right now.')
    } finally {
      setStatusSaving(false)
    }
  }

  if (!candidate) {
    return (
      <section className="space-y-4">
        <EmptyState
          title="Candidate not found"
          subtitle={loadError || 'The candidate record may have changed.'}
          actionLabel="Back to Candidates"
          onAction={() => navigate('/recruiter/candidates')}
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
        <header>
          <h1 className="wrap-break-word text-2xl font-bold">{candidate.fullName}</h1>
          <p className="wrap-break-word text-secondary">{candidate.college} · GPA {candidate.gpa}</p>
        </header>

        <div className="flex flex-wrap gap-2">
          {(candidate.skills || []).map((skill) => (
            <SkillTag key={skill} skill={skill} />
          ))}
        </div>

        <p className="text-sm text-ink/85">{buildMatchNarrative(candidate)}</p>

        <div className="surface-info text-xs text-ink/75">
          <p className="mb-2 text-ink/90">Top reasons this candidate matches</p>
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

        <div className="surface-muted">
          <p className="mb-2 text-xs uppercase tracking-wider text-ink/70">Hiring Funnel Actions</p>
          <div className="mb-3">
            <StatusBadge status={status} />
          </div>
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            {STATUS_ACTIONS.map((action) => (
              <button
                key={action.value}
                type="button"
                disabled={statusSaving || action.value === status}
                onClick={() => onUpdateStatus(action.value)}
                className="btn-secondary btn-feedback disabled:cursor-not-allowed"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </article>

      <aside className="stack-base card-base">
        <div className="flex items-center justify-center">
          <MatchRing score={candidate.score || 0} size={96} strokeWidth={8} />
        </div>
        <SHAPChart shapValues={candidate.shapValues} totalScore={candidate.score || 0} />
      </aside>
    </section>
  )
}