import { useCallback, useRef, useState } from 'react'
import { FileText, Upload, X } from 'lucide-react'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

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

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ProfileResume({
  resume,
  resumePublic,
  saving,
  error,
  onUpload,
  onRemove,
  onTogglePublic,
}) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState('')

  const handleFile = useCallback(
    (file) => {
      setFileError('')
      if (!file) return

      if (file.type !== 'application/pdf') {
        setFileError('Only PDF files are accepted.')
        return
      }
      if (file.size > MAX_SIZE) {
        setFileError('File exceeds 5MB limit.')
        return
      }
      onUpload(file)
    },
    [onUpload]
  )

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer?.files?.[0]
      handleFile(file)
    },
    [handleFile]
  )

  const onDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const onDragLeave = () => setDragOver(false)

  return (
    <div className="flex flex-col rounded-[8px] border border-(--border) bg-(--bg-card) p-6 transition-colors hover:border-(--border-strong)" id="profile-resume">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-(--border) pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-(--accent-yellow) text-[11px] font-bold text-[#09090B]">
            4
          </span>
          <h2 className="font-heading text-base font-bold text-(--text-primary)">Resume</h2>
        </div>
        <VisibilityToggle
          isPublic={resumePublic}
          onToggle={onTogglePublic}
          label="resume"
        />
      </div>

      {resume ? (
        <div className="flex items-center justify-between rounded-[6px] border border-(--border) bg-(--bg-base) p-4 transition-colors hover:border-(--border-strong)">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-(--bg-subtle) text-(--text-primary)">
              <FileText size={20} />
            </div>
            <div>
              <p className="font-sans text-[14px] font-semibold text-(--text-primary)">
                {resume.name || resume.fileName || 'Resume.pdf'}
              </p>
              <p className="font-sans text-[12px] text-(--text-muted)">
                {formatFileSize(resume.size || resume.fileSize)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={saving}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] text-(--text-muted) hover:bg-(--bg-subtle) hover:text-(--danger) transition-colors"
            aria-label="Remove resume"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-[6px] border border-dashed py-10 text-center transition-colors ${
            dragOver
              ? 'border-(--accent-yellow) bg-(--accent-yellow)/5'
              : 'border-(--border-strong) bg-(--bg-base) hover:bg-(--bg-subtle)'
          }`}
        >
          <span className="mb-3 text-(--text-secondary)"><Upload size={24} /></span>
          <p className="font-sans text-[14px] font-semibold text-(--text-primary)">
            Drag & drop your resume or click to browse
          </p>
          <p className="mt-1 font-sans text-[12px] text-(--text-muted)">PDF only • Max 5MB</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {(fileError || error) && (
        <p className="mt-3 text-[12px] font-medium text-(--danger)">
          {fileError || error}
        </p>
      )}

      {saving && (
        <p className="mt-3 text-[12px] font-medium text-(--text-muted)">Uploading…</p>
      )}
    </div>
  )
}
