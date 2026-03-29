/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Personal Details subsection — editable fields for name,
 *                 college, branch, CGPA, preferred roles/skills as tags,
 *                 phone, location, address.
 * DEPENDS ON: useProfileForm state
 */
import { useState } from 'react'

function TagInput({ tags, onChange, placeholder, label }) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const val = input.trim()
    if (val && !tags.includes(val)) {
      onChange([...tags, val])
    }
    setInput('')
  }

  const removeTag = (idx) => {
    onChange(tags.filter((_, i) => i !== idx))
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
    if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink/70">
        {label}
      </label>
      <div className="flex min-h-[52px] flex-wrap items-center gap-2 rounded-[4px] border-2 border-ink bg-[var(--bg)] p-3 transition-shadow focus-within:shadow-[3px_3px_0_var(--border)] focus-within:-translate-x-px focus-within:-translate-y-px">
        {tags.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className="inline-flex items-center gap-1 rounded-[3px] border-2 border-ink bg-yellow px-2 py-1 text-xs font-semibold text-ink shadow-[2px_2px_0_var(--border)]"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="ml-0.5 text-ink/60 hover:text-ink"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : 'Type & press Enter'}
          className="min-w-[120px] flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink/40"
        />
      </div>
    </div>
  )
}

export default function ProfilePersonalDetails({
  personal,
  setPersonal,
  saving,
  error,
  onSave,
}) {
  const update = (key, value) =>
    setPersonal((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="card-base" id="profile-personal">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-[3px] border-2 border-ink bg-yellow text-sm font-bold shadow-[2px_2px_0_var(--border)]">
          1
        </span>
        <h2 className="text-xl font-bold text-ink">Personal Details</h2>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink/70">
              Full Name
            </label>
            <input
              value={personal.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              placeholder="Full name"
              className="input-brutal"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink/70">
              Email
            </label>
            <input
              value={personal.email}
              readOnly
              className="input-brutal cursor-not-allowed opacity-70"
              title="Email cannot be changed"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink/70">
              College
            </label>
            <input
              value={personal.college}
              onChange={(e) => update('college', e.target.value)}
              placeholder="College name"
              className="input-brutal text-ink/70 placeholder:text-ink/55"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink/70">
              Branch / Degree
            </label>
            <input
              value={personal.branch}
              onChange={(e) => update('branch', e.target.value)}
              placeholder="e.g. B.Tech CSE"
              className="input-brutal text-ink/70 placeholder:text-ink/55"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink/70">
              CGPA
            </label>
            <input
              value={personal.cgpa}
              onChange={(e) => update('cgpa', e.target.value)}
              placeholder="e.g. 8.5"
              className="input-brutal text-ink/70 placeholder:text-ink/55"
              type="text"
              inputMode="decimal"
            />
          </div>
        </div>

        <TagInput
          label="Preferred Roles"
          tags={personal.preferredRoles}
          onChange={(val) => update('preferredRoles', val)}
          placeholder="e.g. Frontend Developer, ML Engineer"
        />

        <TagInput
          label="Skills"
          tags={personal.skills}
          onChange={(val) => update('skills', val)}
          placeholder="e.g. React, Python, SQL"
        />

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink/70">
              Phone
            </label>
            <input
              value={personal.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="Add later"
              className="input-brutal text-ink/70 placeholder:text-ink/55"
              type="tel"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink/70">
              Location
            </label>
            <input
              value={personal.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="Add later"
              className="input-brutal text-ink/70 placeholder:text-ink/55"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink/70">
              Address
            </label>
            <input
              value={personal.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="Add later"
              className="input-brutal text-ink/70 placeholder:text-ink/55"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs font-medium text-red-600">{error}</p>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="btn-primary btn-feedback"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
