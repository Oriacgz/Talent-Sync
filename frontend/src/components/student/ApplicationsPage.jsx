import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationService } from '../../services/applicationService'
import { formatDate, getApplicationPipeline } from '../../utils/formatters'
import EmptyState from '../shared/EmptyState'
import { SkeletonCard } from '../shared/Skeletons'
import StatusBadge from '../shared/StatusBadge'

function toFriendlyMessage(error, fallback) {
  const status = error?.response?.status
  if (status === 401 || status === 403) return 'Your session has expired. Please sign in again.'
  if (status === 429) return 'Too many requests right now. Please retry in a moment.'
  return fallback
}

export default function ApplicationsPage() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      const data = await applicationService.getMyApplications()
      if (!active) return
      setApplications(Array.isArray(data) ? data : [])
      setLoading(false)
    }

    load().catch((loadError) => {
      if (!active) return
      setApplications([])
      setError(toFriendlyMessage(loadError, 'Unable to load applications right now.'))
      setLoading(false)
    })

    return () => { active = false }
  }, [reloadTick])

  const pipeline = useMemo(() => getApplicationPipeline(applications), [applications])

  return (
    <section className="flex flex-col gap-8 pb-12 w-full max-w-none">
      <header>
        <h1 className="font-heading text-[26px] font-bold text-(--text-primary)">Applications</h1>
        <p className="font-sans text-[14px] text-(--text-secondary)">Track your current pipeline status.</p>
      </header>

      {!loading && !error && applications.length > 0 && (
        <article className="flex flex-col gap-3">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)">Pipeline Status</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pipeline.map((stage) => (
              <div
                key={stage.key}
                className="flex flex-col rounded-lg bg-(--bg-card) p-4 transition-colors hover:bg-(--bg-subtle) border border-(--border)"
                style={{ borderTop: stage.active ? '3px solid var(--accent-yellow)' : '1px solid var(--border)' }}
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
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {!loading && error ? (
        <EmptyState
          title="Unable to fetch applications"
          subtitle={error}
          actionLabel="Retry"
          onAction={() => setReloadTick((value) => value + 1)}
          icon="!"
        />
      ) : null}

      {!loading && !error && applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          subtitle="Apply to a match to start your pipeline."
          actionLabel="Explore Matches"
          onAction={() => navigate('/student/matches')}
          icon="*"
        />
      ) : null}

      {!loading && !error && applications.length > 0 ? (
        <div className="flex flex-col gap-3">
          {applications.map((application) => (
            <article 
              key={application.id} 
              className="group flex items-center justify-between gap-4 rounded-lg border border-(--border) bg-(--bg-card) p-4 transition-colors hover:border-(--border-strong) hover:bg-(--bg-subtle)"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-[16px] font-bold text-(--text-primary)">
                  {application.jobTitle || application.title || 'Internship Role'}
                </p>
                <p className="truncate font-sans text-[13px] text-(--text-secondary)">
                  {application.company || 'Company'}
                </p>
                <p className="mt-1 font-sans text-[12px] text-(--text-tertiary)">
                  Applied on {formatDate(application.appliedAt)}
                </p>
              </div>
              <div className="shrink-0">
                <StatusBadge status={application.status} />
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {/* SEO */}
      <div className="hidden" aria-hidden="true">
        <title>My Applications | TalentSync</title>
        <meta name="description" content="Track your internship applications and monitor your progress through the recruitment pipeline." />
      </div>
    </section>
  )
}
