import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { analyticsService } from '../../services/analyticsService'
import EmptyState from '../shared/EmptyState'
import { SkeletonCard } from '../shared/Skeletons'

function toFriendlyMessage(error, fallback) {
  const status = error?.response?.status
  if (status === 401 || status === 403) return 'Your session has expired. Please sign in again.'
  if (status === 429) return 'Too many requests right now. Please retry in a moment.'
  return fallback
}

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
      if (!active) return
      setAnalytics(data || {})
      setLoading(false)
    }

    load().catch((loadError) => {
      if (active) {
        setAnalytics({})
        setError(toFriendlyMessage(loadError, 'Unable to load analytics right now.'))
        setLoading(false)
      }
    })

    return () => { active = false }
  }, [reloadTick])

  const totals = analytics.totals || {}
  const applicationsByDay = analytics.applicationsByDay || []
  const topSkills = analytics.topSkills || []
  const totalMatches = Number(totals.totalMatches) || Number(totals.applicants) || 0

  if (loading) {
    return (
      <section className="flex flex-col gap-6 pb-12 w-full max-w-none">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <SkeletonCard className="min-h-27.5" />
          <SkeletonCard className="min-h-27.5" />
          <SkeletonCard className="min-h-27.5" />
          <SkeletonCard className="min-h-27.5" />
          <SkeletonCard className="min-h-27.5" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonCard className="min-h-85" />
          <SkeletonCard className="min-h-85" />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="flex flex-col pb-12 w-full max-w-none">
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
    <section className="flex flex-col gap-8 pb-12 w-full max-w-none">
      <header>
        <h1 className="font-heading text-[26px] font-bold text-(--text-primary)">Recruiter Analytics</h1>
        <p className="font-sans text-[14px] text-(--text-secondary) mt-1">Pipeline health and candidate quality trends overview.</p>
      </header>

      {!applicationsByDay.length && !topSkills.length ? (
        <EmptyState
          title="No analytics data yet"
          subtitle="Data will appear as candidates apply and roles progress through the pipeline."
          icon="*"
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <article className="flex flex-col gap-1 rounded-lg border border-(--border) bg-(--bg-card) p-5">
          <p className="font-sans text-[12px] font-medium text-(--text-secondary)">Applicants</p>
          <p className="font-heading text-[28px] font-bold text-(--text-primary)">{totals.applicants || 0}</p>
        </article>
        <article className="flex flex-col gap-1 rounded-lg border border-(--border) bg-(--bg-card) p-5">
          <p className="font-sans text-[12px] font-medium text-(--text-secondary)">Total Matches</p>
          <p className="font-heading text-[28px] font-bold text-(--text-primary)">{totalMatches}</p>
        </article>
        <article className="flex flex-col gap-1 rounded-lg border border-(--border) bg-(--bg-card) p-5">
          <p className="font-sans text-[12px] font-medium text-(--text-secondary)">Shortlisted</p>
          <p className="font-heading text-[28px] font-bold text-(--text-primary)">{totals.shortlisted || 0}</p>
        </article>
        <article className="flex flex-col gap-1 rounded-lg border border-(--border) bg-(--bg-card) p-5">
          <p className="font-sans text-[12px] font-medium text-(--text-secondary)">Accepted</p>
          <p className="font-heading text-[28px] font-bold text-(--text-primary)">{totals.accepted || 0}</p>
        </article>
        <article className="flex flex-col gap-1 rounded-lg border border-(--border) bg-(--bg-card) p-5">
          <p className="font-sans text-[12px] font-medium text-(--text-secondary)">Avg Score</p>
          <p className="font-heading text-[28px] font-bold text-(--text-primary)">{Math.round((totals.averageMatchScore || 0) * 100)}%</p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="flex h-80 flex-col rounded-lg border border-(--border) bg-(--bg-card) p-6">
          <header className="mb-6">
            <h2 className="font-heading text-[16px] font-bold text-(--text-primary)">Applications by Day</h2>
            <p className="font-sans text-[13px] text-(--text-secondary)">Daily inbound application volume</p>
          </header>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={applicationsByDay}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }} 
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '6px' }} 
                  itemStyle={{ color: 'var(--accent-cyan)' }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--accent-cyan)" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: 'var(--accent-cyan)', strokeWidth: 0 }} 
                  activeDot={{ r: 6, fill: 'var(--accent-cyan)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="flex h-80 flex-col rounded-lg border border-(--border) bg-(--bg-card) p-6">
          <header className="mb-6">
            <h2 className="font-heading text-[16px] font-bold text-(--text-primary)">Top Skills Demand</h2>
            <p className="font-sans text-[13px] text-(--text-secondary)">Most frequent skills in applicant pool</p>
          </header>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSkills}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="skill"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  dy={5}
                />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 12, fill: 'var(--text-muted)' }} 
                   dx={-10}
                />
                <Tooltip 
                   contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '6px' }}
                   cursor={{ fill: 'var(--bg-subtle)' }}
                   itemStyle={{ color: 'var(--accent-cyan)' }}
                   labelStyle={{ color: 'var(--text-muted)' }}
                />
                <Bar dataKey="count" fill="var(--accent-cyan)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
      
      {/* SEO */}
      <div className="hidden" aria-hidden="true">
        <title>Recruiter Analytics | TalentSync</title>
        <meta name="description" content="View pipeline health, candidate quality trends, and skill demand analytics for your job postings." />
      </div>
    </section>
  )
}
