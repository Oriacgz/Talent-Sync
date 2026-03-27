/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Recruiter's main page. Lists their job postings.
 *                 Each job shows candidate count and "View Candidates" link.
 *                 "Post New Job" button links to PostJobPage.
 * DEPENDS ON: jobService, react-router-dom
 */
import { memo, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsService } from '../../services/analyticsService'
import { jobService } from '../../services/jobService'
import { getRecruiterFunnel } from '../../utils/formatters'
import EmptyState from '../shared/EmptyState'
import { SkeletonCard } from '../shared/Skeletons'

const JobListItem = memo(function JobListItem({ job, onViewCandidates }) {
  return (
    <article className="list-item card-hover">
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold">{job.title}</p>
        <p className="truncate text-secondary">{job.company} · {job.location || 'Remote'}</p>
      </div>
      <button
        type="button"
        onClick={() => onViewCandidates(job.id)}
        className="btn-secondary btn-feedback w-full sm:w-auto"
      >
        View Candidates ({job.candidateCount || 0})
      </button>
    </article>
  )
})

export default function RecruiterDashboard() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [funnel, setFunnel] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)
  const onViewCandidates = useCallback((jobId) => {
    const id = String(jobId || '').trim()
    navigate(id ? `/recruiter/candidates?jobId=${encodeURIComponent(id)}` : '/recruiter/candidates')
  }, [navigate])

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      const [jobResult, analyticsResult] = await Promise.allSettled([
        jobService.getAllJobs(),
        analyticsService.getRecruiterAnalytics(),
      ])
      if (!active) {
        return
      }
      const jobData = jobResult.status === 'fulfilled' ? jobResult.value : []
      const analyticsData = analyticsResult.status === 'fulfilled' ? analyticsResult.value : {}
      setJobs(Array.isArray(jobData) ? jobData : [])
      setFunnel(getRecruiterFunnel(analyticsData?.totals || {}))
      if (jobResult.status === 'rejected') {
        setError(jobResult.reason?.message || 'Some recruiter data could not be loaded.')
      }
      setLoading(false)
    }

    load().catch((loadError) => {
      if (!active) {
        return
      }
      setJobs([])
      setFunnel([])
      setError(loadError?.message || 'Unable to load jobs right now.')
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [reloadTick])

  return (
    <section className="stack-base">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-primary-hero">Recruiter Dashboard</h1>
          <p className="text-secondary">Monitor active roles and candidate pipeline.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/recruiter/post-job')}
          className="btn-secondary btn-feedback"
        >
          Post New Job
        </button>
      </header>

      {loading ? (
        <div className="stack-list">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {!loading && error ? (
        <EmptyState
          title="Unable to load jobs"
          subtitle={error}
          actionLabel="Retry"
          onAction={() => setReloadTick((value) => value + 1)}
          icon="!"
        />
      ) : null}

      {!loading && !error && jobs.length === 0 ? (
        <EmptyState
          title="No jobs posted yet"
          subtitle="Create your first job posting to start receiving candidates."
          actionLabel="Post First Job"
          onAction={() => navigate('/recruiter/post-job')}
          actionClassName="btn-secondary"
          icon="*"
        />
      ) : null}

      {!loading && !error && funnel.length ? (
        <article className="card-base stack-dense">
          <p className="text-xs uppercase tracking-wider text-ink/70">Hiring Funnel</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {funnel.map((stage) => (
              <div key={stage.key} className="brutal-stat border-l-(--cyan) bg-(--bg)">
                <p className="text-[10px] uppercase tracking-[0.15em] text-ink/60">{stage.label}</p>
                <p className="text-xl font-semibold text-ink">{stage.count}</p>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {!loading && !error ? (
        <div className="stack-list">
          {jobs.map((job) => (
            <JobListItem key={job.id} job={job} onViewCandidates={onViewCandidates} />
          ))}
        </div>
      ) : null}
    </section>
  )
}