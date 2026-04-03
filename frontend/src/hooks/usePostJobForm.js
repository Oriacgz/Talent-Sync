import { useState, useCallback } from 'react'
import { jobService } from '../../src/services/jobService'

const INITIAL_FORM = {
  title: '',
  description: '',
  skills: [],
  experienceLevel: '',
  education: 'Any',
  jobType: '',
  workMode: '',
  location: '',
  salaryMin: '',
  salaryMax: '',
  duration: '',
  openings: 1,
  deadline: '',
  perks: [],
  aboutCompany: '',
}

function validate(data) {
  const errors = {}

  if (!data.title || data.title.trim().length < 3)
    errors.title = 'Title must be at least 3 characters'
  if (data.title && data.title.length > 100)
    errors.title = 'Title must be under 100 characters'

  if (!data.description || data.description.trim().length < 100)
    errors.description = 'Description must be at least 100 characters'
  if (data.description && data.description.length > 2000)
    errors.description = 'Description must be under 2000 characters'

  if (!data.skills || data.skills.length === 0)
    errors.skills = 'Add at least one skill'
  if (data.skills && data.skills.length > 15)
    errors.skills = 'Maximum 15 skills allowed'

  if (!data.experienceLevel)
    errors.experienceLevel = 'Select an experience level'

  if (!data.jobType)
    errors.jobType = 'Select a job type'

  if (!data.workMode)
    errors.workMode = 'Select a work mode'

  if (data.workMode && data.workMode !== 'REMOTE' && !data.location?.trim())
    errors.location = 'Location is required for non-remote jobs'

  if (data.salaryMin && data.salaryMax) {
    const min = Number(data.salaryMin)
    const max = Number(data.salaryMax)
    if (min >= max) errors.salaryMax = 'Max salary must be greater than min'
  }

  if (!data.openings || Number(data.openings) < 1)
    errors.openings = 'At least 1 opening required'

  if (!data.deadline) {
    errors.deadline = 'Deadline is required'
  } else {
    const deadlineDate = new Date(data.deadline)
    const minDate = new Date()
    minDate.setDate(minDate.getDate() + 3)
    minDate.setHours(0, 0, 0, 0)
    if (deadlineDate < minDate)
      errors.deadline = 'Deadline must be at least 3 days from today'
  }

  return errors
}

export function usePostJobForm() {
  const [formData, setFormData] = useState({ ...INITIAL_FORM })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }

      // Auto-clear location when switching to REMOTE
      if (field === 'workMode' && value === 'REMOTE') {
        next.location = ''
      }

      return next
    })

    // Clear field error on change
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const handleSubmit = useCallback(async () => {
    const validationErrors = validate(formData)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) return null

    setIsLoading(true)
    setIsSuccess(false)

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      skills: formData.skills,
      experienceLevel: formData.experienceLevel,
      education: formData.education,
      jobType: formData.jobType,
      workMode: formData.workMode,
      location: formData.location?.trim() || null,
      salaryMin: formData.salaryMin ? Number(formData.salaryMin) : null,
      salaryMax: formData.salaryMax ? Number(formData.salaryMax) : null,
      duration: formData.duration?.trim() || null,
      openings: Number(formData.openings),
      deadline: formData.deadline,
      perks: formData.perks.length > 0 ? formData.perks : null,
      aboutCompany: formData.aboutCompany?.trim() || null,
    }

    try {
      const result = await jobService.createJob(payload)
      setIsSuccess(true)
      setFormData({ ...INITIAL_FORM })
      return result
    } catch (err) {
      const apiMessage =
        err?.response?.data?.detail || 'Failed to post job. Please try again.'
      throw new Error(apiMessage)
    } finally {
      setIsLoading(false)
    }
  }, [formData])

  return { formData, errors, handleChange, handleSubmit, isLoading, isSuccess }
}
