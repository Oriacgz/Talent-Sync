import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { usePostJobForm } from '../../hooks/usePostJobForm'
import { useToast } from '../shared/useToast'
import SkillTagInput from '../ui/SkillTagInput'
import PillSelect from '../ui/PillSelect'
import { Briefcase, MapPin, IndianRupee, Calendar, Users, GraduationCap, Sparkles } from 'lucide-react'

const EXPERIENCE_OPTIONS = [
  { label: 'Fresher', value: 'FRESHER' },
  { label: 'Intern', value: 'INTERN' },
  { label: 'Junior', value: 'JUNIOR' },
  { label: 'Mid', value: 'MID' },
  { label: 'Senior', value: 'SENIOR' },
]

const JOB_TYPE_OPTIONS = [
  { label: 'Full-Time', value: 'FULL_TIME' },
  { label: 'Part-Time', value: 'PART_TIME' },
  { label: 'Internship', value: 'INTERNSHIP' },
  { label: 'Contract', value: 'CONTRACT' },
]

const WORK_MODE_OPTIONS = [
  { label: 'Remote', value: 'REMOTE' },
  { label: 'Hybrid', value: 'HYBRID' },
  { label: 'On-Site', value: 'ONSITE' },
]

const EDUCATION_OPTIONS = ['Any', 'B.Tech', 'M.Tech', 'MBA', 'BCA', 'MCA', 'PhD']

function FieldError({ error }) {
  if (!error) return null
  return <p className="text-[12px] font-medium text-(--danger) mt-1.5">{error}</p>
}

function SectionHeader({ icon, title, subtitle }) {
  const Icon = icon
  return (
    <div className="flex items-center gap-3 border-b border-(--border) pb-4 mb-6">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-(--bg-subtle) text-(--text-primary)">
        <Icon size={16} />
      </div>
      <div>
        <h3 className="font-heading text-base font-bold text-(--text-primary)">{title}</h3>
        {subtitle && <p className="font-sans text-[12px] text-(--text-muted) mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function CharCounter({ current, max, warn }) {
  const isWarn = current > (warn || max - 200)
  return (
    <span
      className={`absolute bottom-3 right-4 text-[11px] font-mono select-none ${isWarn ? 'text-(--danger) font-bold' : 'text-(--text-muted)'}`}
    >
      {current}/{max}
    </span>
  )
}

function formatSalary(min, max) {
  if (!min && !max) return 'Salary undisclosed'
  if (min && max) return `₹${min} - ₹${max}`
  if (min) return `From ₹${min}`
  return `Up to ₹${max}`
}

function JobPreviewCard({ formData, companyName }) {
  const { title, jobType, workMode, location, skills, salaryMin, salaryMax } = formData

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-(--border) bg-(--bg-card) p-6">
      <div>
        <h2 className="font-heading text-lg font-bold text-(--text-primary)">
          {title || 'Job Title'}
        </h2>
        <p className="font-sans text-[13px] text-(--text-secondary) mt-1">
          {companyName} <span className="mx-1.5 opacity-50">•</span> {location || (workMode === 'REMOTE' ? 'Remote' : 'Location')}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {jobType && (
          <span className="rounded-full bg-(--bg-subtle) px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-widest text-(--text-secondary)">
            {JOB_TYPE_OPTIONS.find(o => o.value === jobType)?.label || jobType}
          </span>
        )}
        {workMode && (
          <span className="rounded-full bg-(--bg-subtle) px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-widest text-(--text-secondary)">
            {WORK_MODE_OPTIONS.find(o => o.value === workMode)?.label || workMode}
          </span>
        )}
        {(salaryMin || salaryMax) && (
          <span className="rounded-full border border-(--accent-yellow) bg-(--accent-yellow)/10 px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-widest text-(--accent-yellow)">
            {formatSalary(salaryMin, salaryMax)}
          </span>
        )}
      </div>

      {skills?.length > 0 && (
        <div className="mt-2">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-(--text-muted) mb-2">Required Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {skills.map(skill => (
              <span key={skill} className="rounded-sm border border-(--border) bg-(--bg-base) px-2 py-1 text-[12px] font-medium text-(--text-primary)">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PostJobPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const user = useAuthStore((s) => s.user)
  const { formData, errors, handleChange, handleSubmit, isLoading } = usePostJobForm()

  const companyName = user?.companyName || user?.name || 'Your Company'

  const minDeadline = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return d.toISOString().split('T')[0]
  })()

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      await handleSubmit()
      toast.success('Job Posted! ✓')
      navigate('/recruiter/dashboard')
    } catch (err) {
      toast.error(err?.message || 'Unable to post this job right now. Please try again shortly.')
    }
  }

  const inputClass = "w-full rounded-md border border-(--border) bg-(--bg-base) px-3 py-2 text-[13px] text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--border-strong) focus:outline-none transition-colors"
  const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)"

  return (
    <section className="flex flex-col gap-8 pb-12 w-full max-w-none">
      <header>
        <h1 className="font-heading text-[26px] font-bold text-(--text-primary)">Post a New Job</h1>
        <p className="font-sans text-[14px] text-(--text-secondary)">
          Create a clear role description for better candidate matching.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Left Column: Form */}
        <div className="w-full lg:w-[65%]">
          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            
            {/* ── Section 1: Basic Info ────────────────────── */}
            <div className="rounded-lg bg-(--bg-card) border border-(--border) p-6">
              <SectionHeader icon={Briefcase} title="Basic Info" subtitle="Job title and description" />

              <div className="space-y-5">
                <div>
                  <label htmlFor="post-job-title" className={labelClass}>
                    Job Title <span className="text-(--danger)">*</span>
                  </label>
                  <input
                    id="post-job-title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g. Frontend Developer Intern"
                    className={inputClass}
                    maxLength={100}
                  />
                  <FieldError error={errors.title} />
                </div>

                <div>
                  <label className={labelClass}>Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    readOnly
                    className="w-full rounded-md border border-(--border) bg-(--bg-subtle) px-3 py-2 text-[13px] text-(--text-secondary) cursor-not-allowed opacity-70"
                  />
                </div>

                <div className="relative">
                  <label htmlFor="post-job-description" className={labelClass}>
                    Job Description <span className="text-(--danger)">*</span>
                  </label>
                  <textarea
                    id="post-job-description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe responsibilities, expectations, and what makes this role exciting (min 100 chars)..."
                    className={`${inputClass} min-h-40 resize-y pb-8`}
                    maxLength={2000}
                  />
                  <CharCounter current={formData.description.length} max={2000} warn={1800} />
                  <FieldError error={errors.description} />
                </div>
              </div>
            </div>

            {/* ── Section 2: Requirements ──────────────────── */}
            <div className="rounded-lg bg-(--bg-card) border border-(--border) p-6">
              <SectionHeader icon={GraduationCap} title="Requirements" subtitle="Skills, experience, and education" />

              <div className="space-y-5">
                <div>
                  <label className={labelClass}>
                    Skills <span className="text-(--danger)">*</span>
                  </label>
                  <SkillTagInput
                    id="post-job-skills"
                    tags={formData.skills}
                    onChange={(tags) => handleChange('skills', tags)}
                    placeholder="React, Python, Docker..."
                    maxTags={15}
                  />
                  <FieldError error={errors.skills} />
                </div>

                <div>
                  <label className={labelClass}>
                    Experience Level <span className="text-(--danger)">*</span>
                  </label>
                  <PillSelect
                    id="post-job-experience"
                    options={EXPERIENCE_OPTIONS}
                    value={formData.experienceLevel}
                    onChange={(val) => handleChange('experienceLevel', val)}
                  />
                  <FieldError error={errors.experienceLevel} />
                </div>

                <div>
                  <label htmlFor="post-job-education" className={labelClass}>Education</label>
                  <select
                    id="post-job-education"
                    value={formData.education}
                    onChange={(e) => handleChange('education', e.target.value)}
                    className={`${inputClass} appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-size-[20px] bg-position-[right_8px_center] bg-no-repeat pr-10`}
                  >
                    {EDUCATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Section 3: Job Details ───────────────────── */}
            <div className="rounded-lg bg-(--bg-card) border border-(--border) p-6">
              <SectionHeader icon={MapPin} title="Job Details" subtitle="Type, mode, salary, and location" />

              <div className="space-y-5">
                <div>
                  <label className={labelClass}>
                    Job Type <span className="text-(--danger)">*</span>
                  </label>
                  <PillSelect
                    id="post-job-type"
                    options={JOB_TYPE_OPTIONS}
                    value={formData.jobType}
                    onChange={(val) => handleChange('jobType', val)}
                  />
                  <FieldError error={errors.jobType} />
                </div>

                <div>
                  <label className={labelClass}>
                    Work Mode <span className="text-(--danger)">*</span>
                  </label>
                  <PillSelect
                    id="post-job-workmode"
                    options={WORK_MODE_OPTIONS}
                    value={formData.workMode}
                    onChange={(val) => handleChange('workMode', val)}
                  />
                  <FieldError error={errors.workMode} />
                </div>

                <div>
                  <label htmlFor="post-job-location" className={labelClass}>
                    Location {formData.workMode !== 'REMOTE' && <span className="text-(--danger)">*</span>}
                  </label>
                  <input
                    id="post-job-location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder={formData.workMode === 'REMOTE' ? 'Not required for remote' : 'e.g. Bangalore, Mumbai'}
                    className={`${inputClass} ${formData.workMode === 'REMOTE' ? 'opacity-50 cursor-not-allowed bg-(--bg-subtle)' : ''}`}
                    disabled={formData.workMode === 'REMOTE'}
                  />
                  <FieldError error={errors.location} />
                </div>

                <div>
                  <label className={labelClass}>Salary Range (₹)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
                      <input
                        id="post-job-salary-min"
                        type="number"
                        value={formData.salaryMin}
                        onChange={(e) => handleChange('salaryMin', e.target.value)}
                        placeholder="Min salary"
                        className={`${inputClass} pl-8`}
                        min={0}
                      />
                    </div>
                    <div className="relative">
                      <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
                      <input
                        id="post-job-salary-max"
                        type="number"
                        value={formData.salaryMax}
                        onChange={(e) => handleChange('salaryMax', e.target.value)}
                        placeholder="Max salary"
                        className={`${inputClass} pl-8`}
                        min={0}
                      />
                      <FieldError error={errors.salaryMax} />
                    </div>
                  </div>
                </div>

                {formData.jobType === 'INTERNSHIP' && (
                  <div>
                    <label htmlFor="post-job-duration" className={labelClass}>Duration</label>
                    <input
                      id="post-job-duration"
                      type="text"
                      value={formData.duration}
                      onChange={(e) => handleChange('duration', e.target.value)}
                      placeholder="e.g. 3 months, 6 months"
                      className={inputClass}
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="post-job-openings" className={labelClass}>
                    Number of Openings <span className="text-(--danger)">*</span>
                  </label>
                  <div className="relative max-w-50">
                    <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
                    <input
                      id="post-job-openings"
                      type="number"
                      value={formData.openings}
                      onChange={(e) => handleChange('openings', e.target.value)}
                      className={`${inputClass} pl-8`}
                      min={1}
                    />
                  </div>
                  <FieldError error={errors.openings} />
                </div>
              </div>
            </div>

            {/* ── Section 4: Extra ─────────────────────────── */}
            <div className="rounded-lg bg-(--bg-card) border border-(--border) p-6">
              <SectionHeader icon={Sparkles} title="Extra" subtitle="Deadline, perks, and company info" />

              <div className="space-y-5">
                <div>
                  <label htmlFor="post-job-deadline" className={labelClass}>
                    Application Deadline <span className="text-(--danger)">*</span>
                  </label>
                  <div className="relative max-w-75">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
                    <input
                      id="post-job-deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => handleChange('deadline', e.target.value)}
                      min={minDeadline}
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                  <FieldError error={errors.deadline} />
                </div>

                <div>
                  <label className={labelClass}>Perks / Benefits</label>
                  <SkillTagInput
                    id="post-job-perks"
                    tags={formData.perks}
                    onChange={(tags) => handleChange('perks', tags)}
                    placeholder="Health Insurance, Flexible hours..."
                    maxTags={10}
                  />
                </div>

                <div className="relative">
                  <label htmlFor="post-job-about" className={labelClass}>About Company</label>
                  <textarea
                    id="post-job-about"
                    value={formData.aboutCompany}
                    onChange={(e) => handleChange('aboutCompany', e.target.value)}
                    placeholder="Briefly describe your company, culture, and what makes it special..."
                    className={`${inputClass} min-h-25 resize-y pb-8`}
                    maxLength={500}
                  />
                  <CharCounter current={formData.aboutCompany.length} max={500} />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              id="post-job-submit"
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full rounded-md bg-(--text-primary) px-4 py-3.5 font-sans text-[13px] font-bold tracking-widest uppercase text-(--bg-base) transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-(--bg-base) border-t-transparent rounded-full animate-spin" />
                  POSTING...
                </span>
              ) : (
                'POST JOB'
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Preview Sticky */}
        <div className="sticky top-20 hidden lg:block lg:w-[35%]">
          <h3 className="font-sans text-[11px] font-semibold uppercase tracking-widest text-(--text-muted) mb-3">Live Preview</h3>
          <JobPreviewCard formData={formData} companyName={companyName} />
          <p className="mt-4 font-sans text-xs text-(--text-secondary) leading-relaxed">
            This is a preview of how your job card will appear to students on their matching dashboard. Our AI will analyze your provided description and required skills to match with the most relevant candidate profiles.
          </p>
        </div>
      </div>

      {/* SEO */}
      <div className="hidden" aria-hidden="true">
        <title>Post a Job | TalentSync Recruiter</title>
        <meta name="description" content="Create a new job posting and start matching with the best students using our AI engine." />
      </div>
    </section>
  )
}