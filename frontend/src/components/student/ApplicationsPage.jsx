/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: List of all student's applications with StatusBadge
 *                 and pipeline progress bar showing current step.
 * DEPENDS ON: applicationService, StatusBadge, EmptyState
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationService } from '../../services/applicationService'
import { formatDate, getApplicationPipeline } from '../../utils/formatters'
import EmptyState from '../shared/EmptyState'
import { SkeletonCard } from '../shared/Skeletons'
import StatusBadge from '../shared/StatusBadge'

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
      if (!active) {
        return
      }
      setApplications(Array.isArray(data) ? data : [])
      setLoading(false)
    }

    load().catch((loadError) => {
      if (!active) {
        return
      }
      setApplications([])
      setError(loadError?.message || 'Unable to load applications right now.')
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [reloadTick])

  const pipeline = useMemo(() => getApplicationPipeline(applications), [applications])

  return (
    <section className="stack-base">
      <header>
        <h1 className="text-primary-hero">Applications</h1>
        <p className="text-secondary">Track your current pipeline status.</p>
      </header>

      {!loading && !error ? (
        <article className="card-base stack-dense">
          <p className="text-xs uppercase tracking-wider text-ink/70">Application Pipeline</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {pipeline.map((stage) => (
              <div
                key={stage.key}
                className={`brutal-stat ${stage.active ? 'border-l-[var(--yellow)] bg-[#fff8d7]' : 'border-l-[var(--border)]'}`}
              >
                <p className="text-[10px] uppercase tracking-[0.15em] text-ink/60">{stage.label}</p>
                <p className="text-lg font-semibold text-ink">{stage.count}</p>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {loading ? (
        <div className="stack-list">
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

      {!loading && !error ? (
        <div className="stack-list">
          {applications.map((application) => (
            <article key={application.id} className="list-item card-hover">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold">{application.jobTitle || application.title || 'Internship Role'}</p>
                <p className="truncate text-secondary">{application.company || 'Company'}</p>
                <p className="text-tertiary">Applied on {formatDate(application.appliedAt)}</p>
              </div>
              <div className="shrink-0">
                <StatusBadge status={application.status} />
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}