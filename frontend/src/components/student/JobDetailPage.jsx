import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  GraduationCap,
  MapPin,
  Users,
  Wallet,
} from 'lucide-react'
import { applicationService } from '../../services/applicationService'
import { jobService } from '../../services/jobService'
import EmptyState from '../shared/EmptyState'
import { SkeletonCard } from '../shared/Skeletons'
import { useToast } from '../shared/useToast'

function normalizeList(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
}

function toLabel(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return raw
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function formatSalaryRange(min, max) {
  const minValue = Number(min)
  const maxValue = Number(max)
  const hasMin = Number.isFinite(minValue) && minValue > 0
  const hasMax = Number.isFinite(maxValue) && maxValue > 0
  if (!hasMin && !hasMax) return null

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)

  if (hasMin && hasMax) return `${formatCurrency(minValue)} - ${formatCurrency(maxValue)}`
  if (hasMin) return `From ${formatCurrency(minValue)}`
  return `Up to ${formatCurrency(maxValue)}`
}

function toFriendlyMessage(error, fallback) {
  const status = error?.response?.status
  if (status === 401 || status === 403) return 'Your session has expired. Please sign in again.'
  if (status === 404) return 'This job is no longer available.'
  if (status === 429) return 'Too many requests right now. Please retry in a moment.'
  return fallback
}

function resolveCompanyName(job) {
  const direct = [job?.companyName, job?.company_name, job?.company]
    .map((value) => String(value || '').trim())
    .find(Boolean)
  if (direct) return direct

  const aboutCompany = String(job?.aboutCompany || '').trim()
  if (aboutCompany && aboutCompany.length <= 80 && !aboutCompany.includes('\n')) {
    return aboutCompany
  }

  const recruiter = String(job?.recruiterName || '').trim()
  return recruiter || ''
}

function InfoTile({ icon, label, value }) {
  const Icon = icon
  return (
    <div className="brutal-panel text-sm text-ink/85">
      <div className="mb-1 flex items-center gap-2 text-ink/65">
        <Icon size={14} />
        <p className="text-[11px] font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className="font-semibold text-ink">{value || 'Not specified'}</p>
    </div>
  )
}

export default function StudentJobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [job, setJob] = useState(null)
  const [applied, setApplied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)
  const [applyState, setApplyState] = useState('idle')

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setLoadError('')

      const cleanId = String(id || '').trim()
      if (!cleanId) {
        setJob(null)
        setLoadError('Invalid job id.')
        setLoading(false)
        return
      }

      const [jobResult, appsResult] = await Promise.allSettled([
        jobService.getJobById(cleanId),
        applicationService.getMyApplications(),
      ])

      if (!active) return

      if (jobResult.status !== 'fulfilled') {
        setJob(null)
        setApplied(false)
        setLoadError(toFriendlyMessage(jobResult.reason, 'Unable to load this job right now.'))
        setLoading(false)
        return
      }

      const nextJob = jobResult.value
      if (!nextJob || nextJob.isActive === false) {
        setJob(null)
        setApplied(false)
        setLoadError('This job is no longer active.')
        setLoading(false)
        return
      }

      setJob(nextJob)

      if (appsResult.status === 'fulfilled' && Array.isArray(appsResult.value)) {
        const hasApplied = appsResult.value.some(
          (entry) => String(entry?.jobId ?? entry?.job_id ?? '') === String(nextJob.id),
        )
        setApplied(hasApplied)
        if (hasApplied) {
          setApplyState('done')
        }
      } else {
        setApplied(false)
      }

      setLoading(false)
    }

    load().catch((error) => {
      if (!active) return
      setJob(null)
      setApplied(false)
      setLoadError(toFriendlyMessage(error, 'Unable to load this job right now.'))
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [id, reloadTick])

  const salaryLabel = useMemo(
    () => formatSalaryRange(job?.salaryMin, job?.salaryMax),
    [job?.salaryMin, job?.salaryMax],
  )
  const deadlineLabel = useMemo(() => formatDate(job?.deadline), [job?.deadline])
  const createdLabel = useMemo(() => formatDate(job?.createdAt), [job?.createdAt])
  const skills = useMemo(() => normalizeList(job?.skills), [job?.skills])
  const perks = useMemo(() => normalizeList(job?.perks), [job?.perks])
  const branches = useMemo(() => normalizeList(job?.eligibleBranches), [job?.eligibleBranches])
  const companyNameLabel = useMemo(() => resolveCompanyName(job), [job])

  const handleApply = async () => {
    if (!job?.id || applyState === 'loading' || applied) return

    setApplyState('loading')
    try {
      await applicationService.apply(job.id)
      setApplied(true)
      setApplyState('done')
      toast.success('Application submitted.')
    } catch (error) {
      const detail = String(error?.response?.data?.detail || '').toLowerCase()
      if (error?.response?.status === 400 && detail.includes('already')) {
        setApplied(true)
        setApplyState('done')
        toast.info('You have already applied to this job.')
        return
      }

      setApplyState('error')
      toast.error(toFriendlyMessage(error, 'Unable to submit application right now.'))
    }
  }

  if (loading) {
    return (
      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <SkeletonCard className="min-h-75" />
        <SkeletonCard className="min-h-75" />
      </section>
    )
  }

  if (!job) {
    return (
      <section className="space-y-4">
        <EmptyState
          title="Job not found"
          subtitle={loadError || 'This role may have expired or been removed.'}
          actionLabel="Back to Dashboard"
          onAction={() => navigate('/student/dashboard')}
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate('/student/dashboard')}
            className="btn-secondary btn-feedback"
          >
            <ArrowLeft size={14} className="mr-1" /> Back
          </button>
          <span className="text-xs font-semibold uppercase tracking-wider text-ink/65">
            Full Job Posting
          </span>
        </div>

        <header className="space-y-1">
          <h1 className="wrap-break-word text-2xl font-bold text-ink">{job.title || 'Role'}</h1>
          <p className="wrap-break-word text-sm text-ink/75">
            Location · {(job.location || (job.workMode === 'REMOTE' ? 'Remote' : 'Not specified'))}
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {job.jobType ? (
            <span className="rounded border border-(--border) bg-(--bg-subtle) px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink/80">
              {toLabel(job.jobType)}
            </span>
          ) : null}
          {job.workMode ? (
            <span className="rounded border border-(--border) bg-(--bg-subtle) px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink/80">
              {toLabel(job.workMode)}
            </span>
          ) : null}
          {job.experienceLevel ? (
            <span className="rounded border border-(--border) bg-(--bg-subtle) px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink/80">
              {toLabel(job.experienceLevel)}
            </span>
          ) : null}
        </div>

        <article className="brutal-panel">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/70">Job Description</p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-ink/90">
            {job.description || 'No description provided.'}
          </p>
        </article>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile icon={BriefcaseBusiness} label="Job Type" value={toLabel(job.jobType)} />
          <InfoTile icon={MapPin} label="Work Mode" value={toLabel(job.workMode)} />
          <InfoTile icon={GraduationCap} label="Education" value={job.education} />
          <InfoTile icon={Users} label="Openings" value={job.openings ? String(job.openings) : ''} />
          <InfoTile icon={Wallet} label="Salary" value={salaryLabel} />
          <InfoTile icon={CalendarDays} label="Deadline" value={deadlineLabel} />
          <InfoTile icon={Clock3} label="Duration" value={job.duration} />
          <InfoTile icon={Building2} label="Minimum CGPA" value={job.minCgpa != null ? String(job.minCgpa) : ''} />
        </div>

        {skills.length ? (
          <article className="brutal-panel">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/70">Required Skills</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded border border-(--border) bg-(--bg-subtle) px-2 py-1 text-xs font-semibold text-ink/85"
                >
                  {skill}
                </span>
              ))}
            </div>
          </article>
        ) : null}

        {branches.length ? (
          <article className="brutal-panel">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/70">Eligible Branches</p>
            <p className="text-sm text-ink/85">{branches.join(', ')}</p>
          </article>
        ) : null}

        {perks.length ? (
          <article className="brutal-panel">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/70">Perks</p>
            <div className="flex flex-wrap gap-2">
              {perks.map((perk) => (
                <span
                  key={perk}
                  className="rounded border border-(--border) bg-(--bg-subtle) px-2 py-1 text-xs font-medium text-ink/85"
                >
                  {perk}
                </span>
              ))}
            </div>
          </article>
        ) : null}

        <article className="brutal-panel">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/70">Company Name</p>
          <p className="text-sm leading-6 text-ink/90">{companyNameLabel || 'Not specified'}</p>
        </article>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleApply}
            disabled={applyState === 'loading' || applied || job.isActive === false}
            className="btn-primary btn-feedback disabled:cursor-not-allowed disabled:opacity-60"
          >
            {job.isActive === false
              ? 'Job Closed'
              : applyState === 'loading'
                ? 'Applying...'
                : applied
                  ? 'Applied'
                  : 'Apply Now'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/student/matches')}
            className="btn-secondary btn-feedback"
          >
            Back to Matches
          </button>
        </div>

        {applyState === 'error' ? (
          <p className="text-sm text-pink">Unable to submit application right now.</p>
        ) : null}
      </article>

      <aside className="stack-base card-base">
        <article className="brutal-panel">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/70">Posting Summary</p>
          <p className="text-sm text-ink/90">Posted by {job.recruiterName || 'Recruiter'}</p>
          <p className="mt-1 text-sm text-ink/70">{job.recruiterEmail || 'Email not available'}</p>
          <p className="mt-3 text-xs text-ink/65">Posted on {createdLabel || 'N/A'}</p>
          <p className="mt-1 text-xs text-ink/65">Status: {job.isActive ? 'Active' : 'Closed'}</p>
        </article>

        <article className="brutal-panel text-sm text-ink/85">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/70">Location</p>
          <p>{job.location || (job.workMode === 'REMOTE' ? 'Remote' : 'Not specified')}</p>
        </article>

        <article className="brutal-panel text-sm text-ink/85">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/70">Experience Level</p>
          <p>{toLabel(job.experienceLevel) || 'Not specified'}</p>
        </article>
      </aside>
    </section>
  )
}
