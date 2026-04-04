import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight, Filter } from 'lucide-react'
import { matchService } from '../../services/matchService'
import { topShapReasons } from '../../utils/formatters'
import EmptyState from '../shared/EmptyState'
import MatchRing from '../shared/MatchRing'
import { SkeletonCard } from '../shared/Skeletons'

function toFriendlyMessage(error, fallback) {
  const status = error?.response?.status
  if (status === 401 || status === 403) return 'Your session has expired. Please sign in again.'
  if (status === 429) return 'Too many requests right now. Please retry in a moment.'
  return fallback
}

function getTopSkills(skills) {
  if (!skills) return []
  return skills.slice(0, 3)
}

function TableRow({ candidate, index, onViewDetail }) {
  const topReasons = topShapReasons(candidate.shapValues, 2)
  const skills = getTopSkills(candidate.skills)

  return (
    <tr
      onClick={() => onViewDetail(candidate.id)}
      className="group cursor-pointer border-b border-(--border) bg-(--bg-base) transition-colors hover:bg-(--bg-subtle)"
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-(--text-primary) text-[11px] font-bold text-(--bg-base)">
            #{index + 1}
          </div>
          <div>
            <p className="font-heading text-[14px] font-bold text-(--text-primary)">
              {candidate.fullName || 'Candidate'}
            </p>
            <p className="font-sans text-[12px] text-(--text-secondary)">
              {candidate.college || 'College'} <span className="opacity-50 mx-1">•</span> GPA {candidate.gpa ?? '-'}
            </p>
          </div>
        </div>
      </td>
      
      <td className="px-4 py-4 align-top">
        <div className="flex flex-wrap gap-1.5 mt-1">
          {skills.length > 0 ? (
            skills.map((skill) => (
              <span key={`${candidate.id}-${skill}`} className="rounded-sm border border-(--border) bg-(--bg-card) px-2 py-0.5 text-[11px] font-medium text-(--text-primary)">
                {skill}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-(--text-muted)">No skills listed</span>
          )}
          {candidate.skills?.length > 3 && (
             <span className="rounded-sm bg-(--bg-subtle) px-2 py-0.5 text-[11px] font-medium text-(--text-secondary)">
               +{candidate.skills.length - 3}
             </span>
          )}
        </div>
      </td>

      <td className="max-w-62.5 px-4 py-4 align-top">
        <div className="flex items-center gap-2 mb-1.5">
          <MatchRing score={candidate.score || 0} size={28} strokeWidth={4} />
          <span className="font-sans text-[13px] font-semibold text-(--accent-cyan)">
             {Math.round((candidate.score || 0) * 100)}% Match
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          {topReasons.map((reason) => (
            <span key={`${candidate.id}-${reason.feature}`} className="font-sans text-[11px] text-(--text-muted) truncate">
              {reason.feature}: {reason.value >= 0 ? '+' : ''}{reason.value.toFixed(2)}
            </span>
          ))}
        </div>
      </td>
      
      <td className="px-4 py-4 align-middle text-right pr-6">
        <ChevronRight size={18} className="inline-block text-(--text-muted) transition-colors group-hover:text-(--text-primary)" />
      </td>
    </tr>
  )
}

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
      if (!active) return
      setCandidates(Array.isArray(data) ? data : [])
      setLoading(false)
    }

    load().catch((loadError) => {
      if (!active) return
      setCandidates([])
      setError(toFriendlyMessage(loadError, 'Unable to load candidates right now.'))
      setLoading(false)
    })

    return () => { active = false }
  }, [jobId, reloadTick])

  const sortedCandidates = useMemo(
    () => [...candidates].sort((a, b) => (Number(b?.score) || 0) - (Number(a?.score) || 0)),
    [candidates]
  )

  const onViewDetail = useCallback((candidateId) => {
    navigate(`/recruiter/candidates/${candidateId}`)
  }, [navigate])

  return (
    <section className="flex flex-col gap-8 pb-12 w-full max-w-none">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-[26px] font-bold text-(--text-primary)">Candidates Pipeline</h1>
          <p className="font-sans text-[14px] text-(--text-secondary)">
            {jobId
              ? `Ranked matching results for job posting #${jobId.slice(0, 6)}...`
              : 'All candidates ranked by AI match quality.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {jobId && (
            <button
              onClick={() => navigate('/recruiter/candidates')}
              className="rounded-md border border-(--border-strong) bg-(--bg-base) px-4 py-2 font-sans text-[13px] font-medium text-(--text-primary) transition-colors hover:bg-(--bg-subtle)"
            >
              Clear Filter
            </button>
          )}
          <button
            onClick={() => navigate('/recruiter/how-it-works')}
            className="flex items-center gap-2 rounded-md border border-(--border) bg-(--bg-subtle) px-4 py-2 font-sans text-[13px] font-medium text-(--text-primary) transition-colors hover:border-(--accent-yellow)"
          >
             <Filter size={14} /> Matching Details
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col gap-4">
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
          icon="*"
        />
      ) : null}

      {!loading && !error && candidates.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-(--border) bg-(--bg-card) shadow-sm">
          <table className="min-w-200 w-full border-collapse text-left font-sans">
            <thead className="border-b border-(--border) bg-(--bg-subtle)">
              <tr>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-(--text-muted) w-[35%]">
                  Candidate Info
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-(--text-muted) w-[30%]">
                  Top Skills
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-(--text-muted) w-[30%]">
                  Match Analysis
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-(--text-muted) w-[5%] text-right pr-6">
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCandidates.map((candidate, index) => (
                <TableRow
                  key={candidate.id}
                  candidate={candidate}
                  index={index}
                  onViewDetail={onViewDetail}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* SEO */}
      <div className="hidden" aria-hidden="true">
        <title>Candidates | TalentSync Recruiter</title>
        <meta name="description" content="View and manage ranked candidates for your job postings with AI-driven match quality scores." />
      </div>
    </section>
  )
}
