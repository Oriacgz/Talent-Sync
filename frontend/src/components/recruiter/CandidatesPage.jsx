import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { matchService } from '../../services/matchService'
import { buildMatchNarrative, topShapReasons } from '../../utils/formatters'
import EmptyState from '../shared/EmptyState'
import MatchRing from '../shared/MatchRing'
import { SkeletonCard } from '../shared/Skeletons'
import SkillTag from '../shared/SkillTag'

const CandidateListItem = memo(function CandidateListItem({ candidate, index, onViewDetail }) {
  return (
    <article className="list-item card-hover">
      <div className="min-w-0 flex-1">
        <p className="badge w-fit border-cyan bg-cyan/20 text-ink">Rank #{index + 1}</p>
        <p className="truncate text-base font-semibold">{candidate.fullName || 'Candidate'}</p>
        <p className="truncate text-secondary">{candidate.college || 'College'} · GPA {candidate.gpa ?? '-'}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(candidate.skills || []).slice(0, 4).map((skill) => (
            <SkillTag key={`${candidate.id}-${skill}`} skill={skill} />
          ))}
        </div>
        <p className="mt-2 text-xs text-ink/75">{buildMatchNarrative(candidate)}</p>
        <div className="surface-info mt-3 text-xs text-ink/75">
          {topShapReasons(candidate.shapValues, 2).map((reason) => (
            <p key={`${candidate.id}-${reason.feature}`}>{reason.feature}: {reason.value >= 0 ? '+' : ''}{reason.value.toFixed(2)}</p>
          ))}
        </div>
      </div>

      <div className="mt-2 flex w-full items-center justify-between gap-3 sm:mt-0 sm:w-auto sm:justify-start">
        <MatchRing score={candidate.score || 0} />
        <button
          type="button"
          onClick={() => onViewDetail(candidate.id)}
          className="btn-secondary btn-feedback w-full sm:w-auto"
        >
          View Detail
        </button>
      </div>
    </article>
  )
})

export default function CandidatesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const jobId = String(searchParams.get('jobId') || '').trim()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')
      const data = await matchService.getJobCandidates(jobId)
      if (!active) {
        return
      }
      setCandidates(Array.isArray(data) ? data : [])
      setLoading(false)
    }

    load().catch((loadError) => {
      if (!active) {
        return
      }
      setCandidates([])
      setError(loadError?.message || 'Unable to load candidates right now.')
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [jobId, reloadTick])

  const sortedCandidates = useMemo(
    () => [...candidates].sort((a, b) => (Number(b?.score) || 0) - (Number(a?.score) || 0)),
    [candidates]
  )

  const onViewDetail = useCallback((candidateId) => {
    navigate(`/recruiter/candidates/${candidateId}`)
  }, [navigate])

  return (
    <section className="stack-base">
      <header>
        <h1 className="text-primary-hero">Candidates</h1>
        <p className="text-secondary">
          {jobId
            ? 'Showing ranked candidates for the selected job posting.'
            : 'Ranked candidates sorted by AI match quality.'}
        </p>
      </header>

      {jobId ? (
        <article className="surface-info flex flex-wrap items-center justify-between gap-3 text-xs text-ink/85">
          <p className="min-w-0 wrap-break-word">Filtered by job ID: {jobId}</p>
          <button
            type="button"
            onClick={() => navigate('/recruiter/candidates')}
            className="btn-secondary btn-feedback"
          >
            Clear Filter
          </button>
        </article>
      ) : null}

      <article className="card-base flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink/80">Candidate ranking uses profile-job alignment and explainability factors.</p>
        <button
          type="button"
          onClick={() => navigate('/how-matching-works')}
          className="btn-secondary btn-feedback"
        >
          How Matching Works
        </button>
      </article>

      {loading ? (
        <div className="stack-list">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {!loading && error ? (
        <EmptyState
          title="Unable to fetch candidates"
          subtitle={error}
          actionLabel="Retry"
          onAction={() => setReloadTick((value) => value + 1)}
          icon="!"
        />
      ) : null}

      {!loading && !error && candidates.length === 0 ? (
        <EmptyState
          title="No candidates found"
          subtitle={jobId
            ? 'No candidates are available for the selected job yet.'
            : 'Publish a job posting to start receiving candidate rankings.'}
          actionLabel={jobId ? 'Clear Filter' : 'Post a Job'}
          onAction={() => navigate(jobId ? '/recruiter/candidates' : '/recruiter/post-job')}
          actionClassName="btn-secondary"
          icon="*"
        />
      ) : null}

      {!loading && !error ? (
        <div className="stack-list">
          {sortedCandidates.map((candidate, index) => (
            <CandidateListItem
              key={candidate.id}
              candidate={candidate}
              index={index}
              onViewDetail={onViewDetail}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
