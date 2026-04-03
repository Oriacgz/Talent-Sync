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
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)">
        {label}
      </label>
      <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-[6px] border border-(--border) bg-(--bg-base) p-2 transition-colors focus-within:border-(--border-strong)">
        {tags.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className="inline-flex items-center gap-1 rounded-[4px] border border-(--border) bg-(--bg-subtle) px-2 py-1 text-[12px] font-medium text-(--text-primary)"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="ml-0.5 text-(--text-muted) hover:text-(--text-primary) transition-colors"
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
          className="min-w-[120px] flex-1 bg-transparent text-[13px] text-(--text-primary) outline-none placeholder:text-(--text-muted)"
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
  const update = (key, value) => setPersonal((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="flex flex-col rounded-[8px] border border-(--border) bg-(--bg-card) p-6 transition-colors hover:border-(--border-strong)" id="profile-personal">
      <div className="mb-6 flex items-center gap-3 border-b border-(--border) pb-4">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-(--accent-yellow) text-[11px] font-bold text-[#09090B]">
          1
        </span>
        <h2 className="font-heading text-base font-bold text-(--text-primary)">Personal Details</h2>
      </div>

      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)">
              Full Name
            </label>
            <input
              value={personal.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              placeholder="Full name"
              className="w-full rounded-[6px] border border-(--border) bg-(--bg-base) px-3 py-2 text-[13px] text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--border-strong) focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)">
              Email
            </label>
            <input
              value={personal.email}
              readOnly
              className="w-full rounded-[6px] border border-(--border) bg-(--bg-subtle) px-3 py-2 text-[13px] text-(--text-secondary) cursor-not-allowed opacity-70"
              title="Email cannot be changed"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)">
              College
            </label>
            <input
              value={personal.college}
              onChange={(e) => update('college', e.target.value)}
              placeholder="College name"
              className="w-full rounded-[6px] border border-(--border) bg-(--bg-base) px-3 py-2 text-[13px] text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--border-strong) focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)">
              Branch / Degree
            </label>
            <input
              value={personal.branch}
              onChange={(e) => update('branch', e.target.value)}
              placeholder="e.g. B.Tech CSE"
              className="w-full rounded-[6px] border border-(--border) bg-(--bg-base) px-3 py-2 text-[13px] text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--border-strong) focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)">
              CGPA
            </label>
            <input
              value={personal.cgpa}
              onChange={(e) => update('cgpa', e.target.value)}
              placeholder="e.g. 8.5"
              className="w-full rounded-[6px] border border-(--border) bg-(--bg-base) px-3 py-2 text-[13px] text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--border-strong) focus:outline-none transition-colors"
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

        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)">
              Phone
            </label>
            <input
              value={personal.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="Add later"
              className="w-full rounded-[6px] border border-(--border) bg-(--bg-base) px-3 py-2 text-[13px] text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--border-strong) focus:outline-none transition-colors"
              type="tel"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)">
              Location
            </label>
            <input
              value={personal.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="Add later"
              className="w-full rounded-[6px] border border-(--border) bg-(--bg-base) px-3 py-2 text-[13px] text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--border-strong) focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)">
              Address
            </label>
            <input
              value={personal.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="Add later"
              className="w-full rounded-[6px] border border-(--border) bg-(--bg-base) px-3 py-2 text-[13px] text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--border-strong) focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-[12px] font-medium text-(--danger)">{error}</p>
      )}

      <div className="mt-6 flex justify-end border-t border-(--border) pt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-[6px] bg-(--text-primary) px-4 py-2 font-sans text-[12px] font-medium text-(--bg-base) hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Details'}
        </button>
      </div>
    </div>
  )
}
