/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Form to create or edit a job posting.
 *                 Fields: title, description, required skills (tag selector),
 *                 domain, location, min GPA, stipend, duration.
 *                 Submits via jobService.createJob() or updateJob().
 * DEPENDS ON: jobService, react-router-dom
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jobService } from '../../services/jobService'
import { useToast } from '../shared/useToast'

export default function PostJobPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    requiredSkills: '',
  })
  const [saving, setSaving] = useState(false)

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const onSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await jobService.createJob({
        ...form,
        requiredSkills: form.requiredSkills.split(',').map((value) => value.trim()).filter(Boolean),
      })
      toast.success('Job posted successfully.')
      navigate('/recruiter/dashboard')
    } catch {
      toast.error('Unable to post job right now.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="stack-base">
      <header>
        <h1 className="text-primary-hero">Post Job</h1>
        <p className="text-secondary">Create a clear role description for better candidate ranking.</p>
      </header>

      <form onSubmit={onSubmit} className="stack-list card-base">
        <input value={form.title} onChange={(e) => onChange('title', e.target.value)} placeholder="Role title" className="input-brutal" required />
        <input value={form.company} onChange={(e) => onChange('company', e.target.value)} placeholder="Company" className="input-brutal" required />
        <input value={form.location} onChange={(e) => onChange('location', e.target.value)} placeholder="Location" className="input-brutal" />
        <input value={form.requiredSkills} onChange={(e) => onChange('requiredSkills', e.target.value)} placeholder="Required skills (comma separated)" className="input-brutal" />
        <textarea value={form.description} onChange={(e) => onChange('description', e.target.value)} placeholder="Job description" className="input-brutal min-h-32" required />

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-secondary btn-feedback disabled:opacity-60">
            {saving ? 'Posting...' : 'Post Job'}
          </button>
        </div>
      </form>
    </section>
  )
}