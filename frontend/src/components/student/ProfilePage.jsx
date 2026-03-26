/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Editable student profile form.
 *                 Sections: Basic Info, Skills (toggleable tags), Preferences,
 *                 Resume Upload. Saves via profileService.updateProfile().
 * DEPENDS ON: profileService, skillColors.js (for skill list)
 */
import { useEffect, useMemo, useState } from 'react'
import { profileService } from '../../services/profileService'
import { useToast } from '../shared/useToast'

const AVAILABLE_SKILLS = ['React', 'TypeScript', 'Python', 'SQL', 'FastAPI', 'ML']

export default function ProfilePage() {
  const toast = useToast()
  const [form, setForm] = useState({
    fullName: '',
    college: '',
    branch: '',
    gpa: '',
    preferredRoles: '',
    preferredLocations: '',
    skills: [],
  })
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoadError('')
      const data = await profileService.getMyProfile()
      if (!active || !data) {
        return
      }
      setForm((prev) => ({
        ...prev,
        fullName: data.fullName || data.name || '',
        college: data.college || '',
        branch: data.branch || '',
        gpa: data.gpa || data.cgpa || '',
        preferredRoles: (data.preferredRoles || []).join(', '),
        preferredLocations: (data.preferredLocations || []).join(', '),
        skills: Array.isArray(data.skills) ? data.skills : [],
      }))
    }

    load().catch((error) => {
      setLoadError(error?.message || 'Unable to load profile data right now.')
    })

    return () => {
      active = false
    }
  }, [])

  const selectedSet = useMemo(() => new Set(form.skills), [form.skills])

  const toggleSkill = (skill) => {
    setForm((prev) => {
      const exists = prev.skills.includes(skill)
      return {
        ...prev,
        skills: exists ? prev.skills.filter((item) => item !== skill) : [...prev.skills, skill],
      }
    })
  }

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await profileService.updateProfile({
        fullName: form.fullName,
        college: form.college,
        branch: form.branch,
        gpa: Number(form.gpa) || 0,
        preferredRoles: form.preferredRoles.split(',').map((v) => v.trim()).filter(Boolean),
        preferredLocations: form.preferredLocations.split(',').map((v) => v.trim()).filter(Boolean),
        skills: form.skills,
      })
      toast.success('Profile saved successfully.')
    } catch {
      toast.error('Unable to save profile right now.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="stack-base">
      <header>
        <h1 className="text-primary-hero">Profile</h1>
        <p className="text-secondary">Keep your profile updated for better match quality.</p>
      </header>

      {loadError ? (
        <p className="brutal-panel-error text-xs text-ink">{loadError}</p>
      ) : null}

      <form onSubmit={onSubmit} className="stack-base card-base">
        <div className="grid gap-4 md:grid-cols-2">
          <input value={form.fullName} onChange={(e) => onChange('fullName', e.target.value)} placeholder="Full name" className="input-brutal" />
          <input value={form.college} onChange={(e) => onChange('college', e.target.value)} placeholder="College" className="input-brutal" />
          <input value={form.branch} onChange={(e) => onChange('branch', e.target.value)} placeholder="Branch" className="input-brutal" />
          <input value={form.gpa} onChange={(e) => onChange('gpa', e.target.value)} placeholder="GPA" className="input-brutal" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input value={form.preferredRoles} onChange={(e) => onChange('preferredRoles', e.target.value)} placeholder="Preferred roles (comma separated)" className="input-brutal" />
          <input value={form.preferredLocations} onChange={(e) => onChange('preferredLocations', e.target.value)} placeholder="Preferred locations (comma separated)" className="input-brutal" />
        </div>

        <div className="brutal-panel stack-dense">
          <p className="text-sm text-ink/80">Skills</p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_SKILLS.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`rounded-[3px] border-2 px-3 py-2 text-xs font-medium text-ink transition-colors ${selectedSet.has(skill) ? 'bg-[var(--yellow)] shadow-[2px_2px_0px_var(--border)]' : 'bg-[var(--bg)] hover:bg-[#ede9df]'}`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary btn-feedback disabled:opacity-60">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </section>
  )
}