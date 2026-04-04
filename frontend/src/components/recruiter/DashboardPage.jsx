import { memo, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { analyticsService } from '../../services/analyticsService'
import { jobService } from '../../services/jobService'
import { getRecruiterFunnel } from '../../utils/formatters'
import EmptyState from '../shared/EmptyState'
import { SkeletonCard } from '../shared/Skeletons'

function toFriendlyMessage(error, fallback) {
  const status = error?.response?.status
  if (status === 401 || status === 403) return 'Your session has expired. Please sign in again.'
  if (status === 429) return 'Too many requests right now. Please retry in a moment.'
  return fallback
}

const JobListItem = memo(function JobListItem({ job, onViewCandidates }) {
  return (
    <article className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-(--border) bg-(--bg-card) p-4 transition-colors hover:border-(--border-strong) hover:bg-(--bg-subtle)">
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-[16px] font-bold text-(--text-primary)">{job.title}</p>
        <p className="truncate font-sans text-[13px] text-(--text-secondary)">
          {job.company} <span className="mx-1.5 opacity-50">•</span> {job.location || 'Remote'}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onViewCandidates(job.id)}
        className="rounded-md border border-(--border-strong) bg-(--bg-base) px-4 py-2 font-sans text-[13px] font-medium text-(--text-primary) transition-colors hover:bg-(--text-primary) hover:text-(--bg-base)"
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
      if (!active) return

      const jobData = jobResult.status === 'fulfilled' ? jobResult.value : []
      const analyticsData = analyticsResult.status === 'fulfilled' ? analyticsResult.value : {}
      setJobs(Array.isArray(jobData) ? jobData : [])
      setFunnel(getRecruiterFunnel(analyticsData?.totals || {}))
      
      if (jobResult.status === 'rejected') {
        setError(toFriendlyMessage(jobResult.reason, 'Some recruiter data could not be loaded.'))
      }
      setLoading(false)
    }

    load().catch((loadError) => {
      if (!active) return
      setJobs([])
      setFunnel([])
      setError(toFriendlyMessage(loadError, 'Unable to load jobs right now.'))
      setLoading(false)
    })

    return () => { active = false }
  }, [reloadTick])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col gap-8 pb-12 w-full max-w-none"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-[26px] font-bold text-(--text-primary)">Recruiter Dashboard</h1>
          <p className="font-sans text-[14px] text-(--text-secondary)">Monitor active roles and candidate pipeline.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/recruiter/post-job')}
          className="flex items-center gap-2 rounded-md bg-(--text-primary) px-4 py-2 font-sans text-[13px] font-medium text-(--bg-base) transition-opacity hover:opacity-90"
        >
          <Plus size={16} /> Post New Job
        </button>
      </header>

      {loading ? (
        <div className="flex flex-col gap-4">
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
          icon="*"
        />
      ) : null}

      {!loading && !error && funnel.length > 0 ? (
        <article className="flex flex-col gap-3">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)">Hiring Funnel</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {funnel.map((stage) => (
              <div
                key={stage.key}
                className="flex flex-col rounded-lg bg-(--bg-card) p-4 transition-colors hover:bg-(--bg-subtle) border border-(--border)"
                style={{ borderTop: '3px solid var(--accent-cyan)' }}
              >
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.15em] text-(--text-muted)">
                  {stage.label}
                </p>
                <p className="mt-2 font-mono text-[32px] font-bold leading-none text-(--text-primary)">
                  {stage.count}
                </p>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {!loading && !error && jobs.length > 0 ? (
        <div className="flex flex-col gap-4">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)">My Postings</p>
          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <JobListItem key={job.id} job={job} onViewCandidates={onViewCandidates} />
            ))}
          </div>
        </div>
      ) : null}

      {/* SEO */}
      <div className="hidden" aria-hidden="true">
        <title>Recruiter Dashboard | TalentSync</title>
        <meta name="description" content="Manage your job postings and monitor the hiring funnel status for all active roles." />
      </div>
    </motion.div>
  )
}
