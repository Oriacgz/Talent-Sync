import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { applicationService } from '../../services/applicationService'
import { matchService } from '../../services/matchService'
import { buildMatchNarrative, topShapReasons } from '../../utils/formatters'
import EmptyState from '../shared/EmptyState'
import MatchRing from '../shared/MatchRing'
import SHAPChart from '../shared/SHAPChart'
import { SkeletonCard } from '../shared/Skeletons'
import StatusBadge from '../shared/StatusBadge'
import { useToast } from '../shared/useToast'

function toFriendlyMessage(error, fallback) {
  const status = error?.response?.status
  if (status === 401 || status === 403) return 'Your session has expired. Please sign in again.'
  if (status === 429) return 'Too many requests right now. Please retry in a moment.'
  return fallback
}

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
      if (!active) return
      const all = Array.isArray(data) ? data : []
      const nextCandidate = all.find((item) => String(item.id) === String(id)) || null
      setCandidate(nextCandidate)
      setStatus(String(nextCandidate?.status || 'APPLIED').toUpperCase())
      setLoading(false)
    }

    load().catch((error) => {
      if (active) {
        setCandidate(null)
        setLoadError(toFriendlyMessage(error, 'Unable to load candidate detail right now.'))
        setLoading(false)
      }
    })

    return () => { active = false }
  }, [id, jobId, reloadTick])

  if (loading) {
    return (
      <section className="mx-auto grid w-full max-w-275 gap-6 pb-12 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <SkeletonCard className="min-h-75" />
        <SkeletonCard className="min-h-75" />
      </section>
    )
  }

  const onUpdateStatus = async (nextStatus) => {
    if (!candidate || statusSaving || nextStatus === status) return

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
      <section className="w-full max-w-none pb-12">
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
    <section className="flex flex-col gap-6 pb-12 w-full max-w-none">
      <header className="flex items-center gap-4">
        <button
          onClick={() => navigate('/recruiter/candidates')}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-(--border) bg-(--bg-base) text-(--text-secondary) transition-colors hover:bg-(--bg-subtle) hover:text-(--text-primary)"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-heading text-[22px] font-bold text-(--text-primary)">Candidate Detail</h1>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        {/* Left Column: Candidate Info & Actions */}
        <div className="flex flex-col gap-6">
          <article className="rounded-lg border border-(--border) bg-(--bg-card) p-6">
            <header className="mb-6">
              <h2 className="font-heading text-[24px] font-bold text-(--text-primary)">{candidate.fullName}</h2>
              <p className="font-sans text-[14px] text-(--text-secondary) mt-1">
                {candidate.college} <span className="opacity-50 mx-1.5">•</span> GPA {candidate.gpa}
              </p>
            </header>

            <div className="flex flex-wrap gap-2 mb-6">
              {(candidate.skills || []).map((skill) => (
                <span key={skill} className="rounded-sm border border-(--border) bg-(--bg-base) px-2.5 py-1 text-[12px] font-medium text-(--text-primary)">
                  {skill}
                </span>
              ))}
            </div>

            <p className="font-sans text-[14px] leading-relaxed text-(--text-secondary) mb-8">
              {buildMatchNarrative(candidate)}
            </p>

            <div className="mt-6 rounded-md bg-(--bg-subtle) p-4">
               <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-(--text-muted) mb-3">Top Reasons For Match</p>
               <div className="flex flex-col gap-1.5">
                {topReasons.length ? (
                  topReasons.map((reason) => (
                    <p key={reason.feature} className="font-sans text-[13px] text-(--text-primary)">
                      <span className="font-semibold">{reason.feature}</span>: {reason.value >= 0 ? '+' : ''}{reason.value.toFixed(2)}
                    </p>
                  ))
                ) : (
                  <p className="font-sans text-[13px] text-(--text-muted)">No explainability signals available.</p>
                )}
               </div>
            </div>
          </article>

          <article className="rounded-lg border border-(--border) bg-(--bg-card) p-6">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-(--text-muted) mb-4">Hiring Funnel Actions</p>
            <div className="mb-6">
              <StatusBadge status={status} />
            </div>
            <div className="flex flex-wrap gap-3">
              {STATUS_ACTIONS.map((action) => (
                <button
                  key={action.value}
                  type="button"
                  disabled={statusSaving || action.value === status}
                  onClick={() => onUpdateStatus(action.value)}
                  className={`rounded-md px-4 py-2 font-sans text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50
                    ${action.value === status 
                      ? 'border border-(--border-strong) bg-(--bg-subtle) text-(--text-secondary)'
                      : 'border border-(--border-strong) bg-(--bg-base) text-(--text-primary) hover:bg-(--text-primary) hover:text-(--bg-base)'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </article>
        </div>

        {/* Right Column: SHAP Chart & Score */}
        <aside className="max-h-min rounded-lg border border-(--border) bg-(--bg-card) p-6">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-(--text-muted) mb-6 text-center">Compatibility Score</p>
          <div className="flex items-center justify-center mb-8">
            <MatchRing score={candidate.score || 0} size={120} strokeWidth={8} />
          </div>
          <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-(--text-muted) mb-4">Match Explainability</p>
          <SHAPChart shapValues={candidate.shapValues} totalScore={candidate.score || 0} />
        </aside>
      </div>

      {/* SEO */}
      <div className="hidden" aria-hidden="true">
        <title>Candidate Details | TalentSync Recruiter</title>
        <meta name="description" content="Detailed candidate profile with AI match explanation and hiring funnel actions." />
      </div>
    </section>
  )
}
