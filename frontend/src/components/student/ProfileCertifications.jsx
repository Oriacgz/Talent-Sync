import { useRef } from 'react'
import { FileBadge, Plus, X } from 'lucide-react'

function VisibilityToggle({ isPublic, onToggle, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[11px] font-semibold uppercase tracking-widest ${isPublic ? 'text-(--text-muted)' : 'text-(--text-primary)'}`}>
        Private
      </span>
      <button
        type="button"
        onClick={onToggle}
        className={`relative h-6 w-10 shrink-0 rounded-full border border-(--border) transition-colors ${
          isPublic ? 'bg-(--accent-yellow)' : 'bg-(--bg-subtle)'
        }`}
        aria-label={`Toggle ${label} visibility`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full border border-(--border) bg-[#09090B] transition-transform ${
            isPublic ? 'translate-x-[15px]' : 'translate-x-0 bg-white'
          }`}
        />
      </button>
      <span className={`text-[11px] font-semibold uppercase tracking-widest ${isPublic ? 'text-(--text-primary)' : 'text-(--text-muted)'}`}>
        Public
      </span>
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function getFileIcon(name) {
  const ext = String(name || '').split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return <FileBadge size={20} />
  if (ext === 'pdf') return <FileBadge size={20} />
  return <FileBadge size={20} />
}

export default function ProfileCertifications({
  certificates,
  certificatesPublic,
  saving,
  error,
  onUpload,
  onRemove,
  onTogglePublic,
}) {
  const inputRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col rounded-[8px] border border-(--border) bg-(--bg-card) p-6 transition-colors hover:border-(--border-strong)" id="profile-certifications">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-(--border) pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-(--accent-yellow) text-[11px] font-bold text-[#09090B]">
            5
          </span>
          <h2 className="font-heading text-base font-bold text-(--text-primary)">Certifications</h2>
        </div>
        <VisibilityToggle
          isPublic={certificatesPublic}
          onToggle={onTogglePublic}
          label="certifications"
        />
      </div>

      {certificates.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center gap-3 rounded-[6px] border border-(--border) bg-(--bg-base) p-3 transition-colors hover:border-(--border-strong)"
            >
              {cert.url &&
              /\.(jpg|jpeg|png|webp|gif)$/i.test(cert.url) ? (
                <img
                  src={cert.url}
                  alt={cert.name}
                  className="h-10 w-10 shrink-0 rounded-[4px] border border-(--border) object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-(--bg-subtle) text-(--text-primary)">
                  {getFileIcon(cert.name)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-[13px] font-semibold text-(--text-primary)">
                  {cert.name || 'Certificate'}
                </p>
                <p className="font-sans text-[11px] text-(--text-muted)">
                  {formatDate(cert.uploadedAt || cert.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onRemove(cert.id)}
                disabled={saving}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-(--text-muted) hover:bg-(--bg-subtle) hover:text-(--danger) transition-colors"
                aria-label={`Delete ${cert.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={saving}
        className="flex w-full items-center justify-center gap-1.5 rounded-[6px] border border-dashed border-(--border-strong) bg-(--bg-base) hover:bg-(--bg-subtle) py-3 text-[12px] font-medium uppercase tracking-wider text-(--text-secondary) transition-colors disabled:opacity-50"
      >
        <Plus size={14} /> Add Certificate
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFile}
      />

      {error && (
        <p className="mt-3 text-[12px] font-medium text-(--danger)">{error}</p>
      )}

      {saving && (
        <p className="mt-3 text-[12px] font-medium text-(--text-muted)">Uploading…</p>
      )}
    </div>
  )
}
