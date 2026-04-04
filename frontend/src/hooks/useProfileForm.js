/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Custom hook managing form state + API calls for all
 *                 profile subsections (personal, bio, links, resume, certs).
 * DEPENDS ON: profileService, authStore, useToast
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { profileService } from '../services/profileService'
import { useAuthStore } from '../store/authStore'

const INITIAL_PERSONAL = {
  fullName: '',
  email: '',
  college: '',
  branch: '',
  cgpa: '',
  preferredRoles: [],
  skills: [],
  phone: '',
  location: '',
  address: '',
}

const INITIAL_PROFILE = {
  bio: '',
  socialLinks: [''],
  resume: null,
  resumePublic: true,
  certificates: [],
  certificatesPublic: true,
}

export function useProfileForm(toast) {
  const user = useAuthStore((s) => s.user)

  const [personal, setPersonal] = useState(INITIAL_PERSONAL)
  const [bio, setBio] = useState('')
  const [socialLinks, setSocialLinks] = useState([''])
  const [resume, setResume] = useState(null)
  const [resumePublic, setResumePublic] = useState(true)
  const [certificates, setCertificates] = useState([])
  const [certificatesPublic, setCertificatesPublic] = useState(true)

  const [loading, setLoading] = useState(true)
  const [sectionSaving, setSectionSaving] = useState({})
  const [sectionErrors, setSectionErrors] = useState({})
  const mountedRef = useRef(true)

  const toFriendlyError = useCallback((err, fallback = 'Unable to complete this action right now.') => {
    const status = err?.response?.status
    if (status === 400) return 'Please review your input and try again.'
    if (status === 401 || status === 403) return 'Your session has expired. Please sign in again.'
    if (status === 404) return 'This item is no longer available.'
    if (status >= 500) return 'Server is currently unavailable. Please try again shortly.'
    if (err?.code === 'ECONNABORTED') return 'Request timed out. Please try again.'
    return fallback
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    try {
      const data = await profileService.getMyProfile()
      if (!mountedRef.current) {
        setLoading(false)
        return
      }

      if (!data) {
        setPersonal((prev) => ({
          ...INITIAL_PERSONAL,
          fullName: user?.name || '',
          email: user?.email || '',
        }))
        setBio('')
        setSocialLinks([''])
        setResume(null)
        setResumePublic(true)
        setCertificates([])
        setCertificatesPublic(true)
        setLoading(false)
        return
      }

      setPersonal({
        fullName: data.fullName || data.name || user?.name || '',
        email: data.email || user?.email || '',
        college: data.college || '',
        branch: data.branch || data.degree || '',
        cgpa: data.cgpa || data.gpa || '',
        preferredRoles: Array.isArray(data.preferredRoles) ? data.preferredRoles : [],
        skills: Array.isArray(data.skills) ? data.skills : [],
        phone: data.phone || '',
        location: data.location || '',
        address: data.address || '',
      })

      setBio(data.bio || '')
      setSocialLinks(
        Array.isArray(data.socialLinks) && data.socialLinks.length > 0
          ? data.socialLinks
          : ['']
      )
      const rawResume = data.resume || null
      let parsedResume = null
      if (typeof rawResume === 'string') {
        parsedResume = { url: rawResume, name: rawResume.split('/').pop() || 'Resume.pdf', size: 0 }
      } else if (rawResume && typeof rawResume === 'object') {
        parsedResume = rawResume
      }
      setResume(parsedResume)

      setResumePublic(data.resumePublic !== false)
      setCertificates(Array.isArray(data.certificates) ? data.certificates : [])
      setCertificatesPublic(data.certificatesPublic !== false)
    } catch (err) {
      if (mountedRef.current) {
        setSectionErrors((p) => ({ ...p, load: toFriendlyError(err, 'Unable to load your profile right now.') }))
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [toFriendlyError, user])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const setSaving = (section, val) =>
    setSectionSaving((p) => ({ ...p, [section]: val }))

  const clearError = (section) =>
    setSectionErrors((p) => ({ ...p, [section]: null }))

  const showResult = (section, success, msg) => {
    if (success) {
      toast?.success(msg || 'Saved ✓')
    } else {
      toast?.error(msg || 'Save failed.')
      setSectionErrors((p) => ({ ...p, [section]: msg || 'Save failed.' }))
    }
  }

  const savePersonal = async () => {
    setSaving('personal', true)
    clearError('personal')
    try {
      await profileService.updateProfile({
        fullName: personal.fullName,
        college: personal.college,
        branch: personal.branch,
        cgpa: Number(personal.cgpa) || 0,
        preferredRoles: personal.preferredRoles,
        skills: personal.skills,
        phone: personal.phone,
        location: personal.location,
        address: personal.address,
      })
      showResult('personal', true)
    } catch (err) {
      showResult('personal', false, toFriendlyError(err, 'Unable to save personal details.'))
    } finally {
      setSaving('personal', false)
    }
  }

  const saveBio = async () => {
    setSaving('bio', true)
    clearError('bio')
    try {
      await profileService.updateProfile({ bio })
      showResult('bio', true)
    } catch (err) {
      showResult('bio', false, toFriendlyError(err, 'Unable to save your bio.'))
    } finally {
      setSaving('bio', false)
    }
  }

  const saveSocialLinks = async () => {
    setSaving('links', true)
    clearError('links')
    try {
      const filtered = socialLinks.filter((l) => l.trim())
      await profileService.updateProfile({ socialLinks: filtered })
      showResult('links', true)
    } catch (err) {
      showResult('links', false, toFriendlyError(err, 'Unable to save social links.'))
    } finally {
      setSaving('links', false)
    }
  }

  const uploadResume = async (file) => {
    setSaving('resume', true)
    clearError('resume')
    try {
      const result = await profileService.uploadResume(file)
      setResume(result?.resume || result || { url: result?.url, name: file.name, size: file.size })
      showResult('resume', true, 'Resume uploaded ✓')
    } catch (err) {
      showResult('resume', false, toFriendlyError(err, 'Unable to upload resume.'))
    } finally {
      setSaving('resume', false)
    }
  }

  const removeResume = async () => {
    setSaving('resume', true)
    clearError('resume')
    try {
      await profileService.updateProfile({ resume: null })
      setResume(null)
      showResult('resume', true, 'Resume removed.')
    } catch (err) {
      showResult('resume', false, toFriendlyError(err, 'Unable to remove resume.'))
    } finally {
      setSaving('resume', false)
    }
  }

  const toggleResumePublic = async () => {
    const next = !resumePublic
    setResumePublic(next)
    try {
      await profileService.updateProfile({ resumePublic: next })
    } catch {
      setResumePublic(!next)
    }
  }

  const uploadCertificate = async (file) => {
    setSaving('certs', true)
    clearError('certs')
    try {
      const cert = await profileService.uploadCertificate(file)
      if (cert) {
        setCertificates((prev) => [...prev, cert])
      }
      showResult('certs', true, 'Certificate uploaded ✓')
    } catch (err) {
      showResult('certs', false, toFriendlyError(err, 'Unable to upload certificate.'))
    } finally {
      setSaving('certs', false)
    }
  }

  const removeCertificate = async (certId) => {
    setSaving('certs', true)
    clearError('certs')
    try {
      await profileService.deleteCertificate(certId)
      setCertificates((prev) => prev.filter((c) => c.id !== certId))
      showResult('certs', true, 'Certificate removed.')
    } catch (err) {
      showResult('certs', false, toFriendlyError(err, 'Unable to remove certificate.'))
    } finally {
      setSaving('certs', false)
    }
  }

  const toggleCertificatesPublic = async () => {
    const next = !certificatesPublic
    setCertificatesPublic(next)
    try {
      await profileService.updateProfile({ certificatesPublic: next })
    } catch {
      setCertificatesPublic(!next)
    }
  }

  return {
    loading,
    sectionSaving,
    sectionErrors,
    personal, setPersonal,
    bio, setBio,
    socialLinks, setSocialLinks,
    resume, resumePublic,
    certificates, certificatesPublic,
    savePersonal,
    saveBio,
    saveSocialLinks,
    uploadResume, removeResume, toggleResumePublic,
    uploadCertificate, removeCertificate, toggleCertificatesPublic,
  }
}
