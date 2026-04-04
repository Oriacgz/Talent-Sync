/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: CRUD for job postings via /api/jobs endpoints.
 * DEPENDS ON: api.js (axios instance with JWT interceptor)
 */
import apiClient from './api'

export const jobService = {
  createJob: async (payload) => {
    const res = await apiClient.post('/api/jobs', payload)
    return res.data
  },

  // Backward-compatible alias for screens still calling getAllJobs().
  getAllJobs: async (filters = {}) => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, val]) => {
      if (val == null || val === '') return
      if (Array.isArray(val)) {
        val.forEach((v) => params.append(key, v))
      } else {
        params.set(key, val)
      }
    })

    const res = await apiClient.get('/api/jobs', { params })
    const payload = res.data
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.items)) return payload.items
    return []
  },

  getJobs: async (filters = {}) => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, val]) => {
      if (val == null || val === '') return
      if (Array.isArray(val)) {
        val.forEach((v) => params.append(key, v))
      } else {
        params.set(key, val)
      }
    })

    const res = await apiClient.get('/api/jobs', { params })
    return res.data
  },

  getJobById: async (id) => {
    const res = await apiClient.get(`/api/jobs/${id}`)
    return res.data
  },

  getMyJobs: async (filters = {}) => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, val]) => {
      if (val == null || val === '') return
      params.set(key, String(val))
    })

    const res = await apiClient.get('/api/jobs/recruiter/my-jobs', { params })
    return res.data
  },

  updateJob: async (id, payload) => {
    const res = await apiClient.patch(`/api/jobs/${id}`, payload)
    return res.data
  },

  closeJob: async (id) => {
    const res = await apiClient.delete(`/api/jobs/${id}`)
    return res.data
  },
}