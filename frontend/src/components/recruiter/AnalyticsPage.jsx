/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Recruiter analytics dashboard. Stat cards: total applicants,
 *                 shortlisted, avg match score, days to hire.
 *                 Bar chart: top skills. Line chart: applications per day.
 * DEPENDS ON: analyticsService, recharts
 */
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { analyticsService } from '../../services/analyticsService'
import EmptyState from '../shared/EmptyState'
import { SkeletonCard } from '../shared/Skeletons'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      const data = await analyticsService.getRecruiterAnalytics()
      if (!active) {
        return
      }
      setAnalytics(data || {})
      setLoading(false)
    }

    load().catch((loadError) => {
      if (active) {
        setAnalytics({})
        setError(loadError?.message || 'Unable to load analytics right now.')
        setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [reloadTick])

  const totals = analytics.totals || {}
  const applicationsByDay = analytics.applicationsByDay || []
  const topSkills = analytics.topSkills || []
  const totalMatches = Number(totals.totalMatches) || Number(totals.applicants) || 0

  if (loading) {
    return (
      <section className="stack-base">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <SkeletonCard className="min-h-[110px]" />
          <SkeletonCard className="min-h-[110px]" />
          <SkeletonCard className="min-h-[110px]" />
          <SkeletonCard className="min-h-[110px]" />
          <SkeletonCard className="min-h-[110px]" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonCard className="min-h-[300px]" />
          <SkeletonCard className="min-h-[300px]" />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="stack-base">
        <EmptyState
          title="Analytics unavailable"
          subtitle={error}
          actionLabel="Retry"
          onAction={() => setReloadTick((value) => value + 1)}
          icon="!"
        />
      </section>
    )
  }

  return (
    <section className="stack-base">
      <header>
        <h1 className="text-primary-hero">Recruiter Analytics</h1>
        <p className="text-secondary">Pipeline health and candidate quality trends in a clear, low-clutter view.</p>
      </header>

      {!applicationsByDay.length && !topSkills.length ? (
        <EmptyState
          title="No analytics data yet"
          subtitle="Data will appear as candidates apply and roles progress through the pipeline."
          icon="*"
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <article className="brutal-stat border-l-[var(--cyan)]"><p className="text-tertiary">Applicants</p><p className="text-2xl font-bold">{totals.applicants || 0}</p></article>
        <article className="brutal-stat border-l-[var(--cyan)]"><p className="text-tertiary">Total Matches</p><p className="text-2xl font-bold">{totalMatches}</p></article>
        <article className="brutal-stat border-l-[var(--cyan)]"><p className="text-tertiary">Shortlisted</p><p className="text-2xl font-bold">{totals.shortlisted || 0}</p></article>
        <article className="brutal-stat border-l-[var(--cyan)]"><p className="text-tertiary">Accepted</p><p className="text-2xl font-bold">{totals.accepted || 0}</p></article>
        <article className="brutal-stat border-l-[var(--cyan)]"><p className="text-tertiary">Avg Score</p><p className="text-2xl font-bold">{Math.round((totals.averageMatchScore || 0) * 100)}%</p></article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="card-base h-64 sm:h-72 md:h-80">
          <p className="text-sm text-ink/70">Applications by Day</p>
          <p className="mb-2 text-xs text-ink/60">Shows daily inbound application volume to track recruiter load.</p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={applicationsByDay}>
              <CartesianGrid stroke="rgba(10,10,10,0.12)" vertical={false} />
              <XAxis dataKey="day" stroke="#0A0A0A" axisLine={{ strokeWidth: 2 }} tickLine={{ strokeWidth: 2 }} tick={{ fontSize: 12 }} />
              <YAxis stroke="#0A0A0A" axisLine={{ strokeWidth: 2 }} tickLine={{ strokeWidth: 2 }} />
              <Tooltip />
              <Line type="linear" dataKey="value" stroke="#00D9FF" strokeWidth={3} dot={{ r: 3, fill: '#0A0A0A' }} />
            </LineChart>
          </ResponsiveContainer>
        </article>

        <article className="card-base h-64 sm:h-72 md:h-80">
          <p className="text-sm text-ink/70">Top Skills Demand</p>
          <p className="mb-2 text-xs text-ink/60">Highlights the most frequent skills in your applicant pool.</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSkills}>
              <CartesianGrid stroke="rgba(10,10,10,0.12)" vertical={false} />
              <XAxis
                dataKey="skill"
                stroke="#0A0A0A"
                axisLine={{ strokeWidth: 2 }}
                tickLine={{ strokeWidth: 2 }}
                tick={{ fontSize: 11 }}
                angle={-22}
                textAnchor="end"
                height={56}
                interval={0}
              />
              <YAxis stroke="#0A0A0A" axisLine={{ strokeWidth: 2 }} tickLine={{ strokeWidth: 2 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#00D9FF" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </div>
    </section>
  )
}