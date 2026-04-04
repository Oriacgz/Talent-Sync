import { useToast } from '../shared/useToast'
import { useProfileForm } from '../../hooks/useProfileForm'
import { SkeletonCard } from '../shared/Skeletons'
import ProfilePersonalDetails from './ProfilePersonalDetails'
import ProfileBio from './ProfileBio'
import ProfileSocialLinks from './ProfileSocialLinks'
import ProfileResume from './ProfileResume'
import ProfileCertifications from './ProfileCertifications'
import { useAuthStore } from '../../store/authStore'
import { CheckCircle2, Circle } from 'lucide-react'

function ProgressBar({ label, score }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between font-sans text-xs font-medium uppercase text-(--text-secondary)">
        <span>{label}</span>
        <span className="text-(--text-primary)">{score}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--bg-subtle)">
        <div className="h-full rounded-full bg-(--accent-yellow)" style={{ width: `${score}%` }}></div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const toast = useToast()
  const user = useAuthStore((s) => s.user)

  const {
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
  } = useProfileForm(toast)

  if (loading) {
    return (
      <section className="w-full max-w-none pb-12">
        <header className="mb-8">
          <h1 className="font-heading text-[26px] font-bold text-(--text-primary)">Profile</h1>
          <p className="font-sans text-[14px] text-(--text-secondary)">Loading your profile…</p>
        </header>
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>
    )
  }

  // Calculate mock completion percentage
  const calcCompletion = () => {
    let score = 0
    if (personal?.fullName) score += 20
    if (personal?.college && personal?.cgpa) score += 20
    if (personal?.skills?.length > 0) score += 20
    if (bio) score += 10
    if (resume?.url) score += 30
    return score
  }

  const completionScore = calcCompletion()

  return (
    <div className="flex flex-col gap-8 pb-12 w-full max-w-none">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-[26px] font-bold text-(--text-primary)">Profile</h1>
          <p className="font-sans text-[14px] text-(--text-secondary)">
            Keep your profile updated for better match quality.
          </p>
        </div>

        {user?.name && (
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-(--border) bg-(--accent-yellow) text-lg font-bold text-[#09090B]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-(--text-primary)">{user.name}</p>
              <p className="text-xs text-(--text-muted)">{user.email || user.role || 'Student'}</p>
            </div>
          </div>
        )}
      </header>

      {sectionErrors.load && (
        <div className="rounded-[8px] bg-red-500/10 border border-red-500/20 p-4 text-xs tracking-wide text-red-500">
          {sectionErrors.load}
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Left Column (60%) */}
        <div className="w-full lg:w-[65%] flex flex-col gap-6">
          <ProfilePersonalDetails
            personal={personal}
            setPersonal={setPersonal}
            saving={sectionSaving.personal}
            error={sectionErrors.personal}
            onSave={savePersonal}
          />

          <ProfileBio
            bio={bio}
            setBio={setBio}
            saving={sectionSaving.bio}
            error={sectionErrors.bio}
            onSave={saveBio}
          />

          <ProfileSocialLinks
            socialLinks={socialLinks}
            setSocialLinks={setSocialLinks}
            saving={sectionSaving.links}
            error={sectionErrors.links}
            onSave={saveSocialLinks}
          />

          <ProfileResume
            resume={resume}
            resumePublic={resumePublic}
            saving={sectionSaving.resume}
            error={sectionErrors.resume}
            onUpload={uploadResume}
            onRemove={removeResume}
            onTogglePublic={toggleResumePublic}
          />

          <ProfileCertifications
            certificates={certificates}
            certificatesPublic={certificatesPublic}
            saving={sectionSaving.certs}
            error={sectionErrors.certs}
            onUpload={uploadCertificate}
            onRemove={removeCertificate}
            onTogglePublic={toggleCertificatesPublic}
          />
        </div>

        {/* Right Column (35%) Sticky Completion Card */}
        <div className="w-full lg:w-[35%] sticky top-[80px]">
          <div className="flex flex-col gap-4 rounded-[8px] border border-(--border) bg-(--bg-card) p-6">
            <h2 className="font-heading text-lg font-bold text-(--text-primary)">Profile Completion</h2>
            <ProgressBar label="COMPLETION SCORE" score={completionScore} />
            <p className="mt-2 font-sans text-xs text-(--text-secondary) leading-relaxed">
              Companies rely on AI similarity matching to discover top candidates. Completing your profile greatly improves your match rate accuracy.
            </p>
            <ul className="mt-3 space-y-2 font-sans text-[13px] text-(--text-muted)">
              <li className={`flex items-center gap-2 ${personal?.skills?.length ? 'text-(--success)' : ''}`}>
                <span className="shrink-0">
                  {personal?.skills?.length ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                </span> Add top skills
              </li>
              <li className={`flex items-center gap-2 ${resume?.url ? 'text-(--success)' : ''}`}>
                <span className="shrink-0">
                  {resume?.url ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                </span> Upload your resume
              </li>
              <li className={`flex items-center gap-2 ${bio ? 'text-(--success)' : ''}`}>
                <span className="shrink-0">
                  {bio ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                </span> Write a short bio
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="hidden" aria-hidden="true">
        <title>Student Profile | TalentSync</title>
        <meta name="description" content="Manage your personal details, bio, resume, and certifications to improve your AI match quality." />
      </div>
    </div>
  )
}
