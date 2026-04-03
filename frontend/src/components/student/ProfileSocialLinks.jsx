import { useState } from 'react'
import { Plus, X } from 'lucide-react'

const MAX_LINKS = 6

function isValidUrl(str) {
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default function ProfileSocialLinks({
  socialLinks,
  setSocialLinks,
  saving,
  error,
  onSave,
}) {
  const [linkErrors, setLinkErrors] = useState({})

  const updateLink = (idx, val) => {
    setSocialLinks((prev) => prev.map((l, i) => (i === idx ? val : l)))
    if (linkErrors[idx]) {
      setLinkErrors((prev) => ({ ...prev, [idx]: null }))
    }
  }

  const addLink = () => {
    if (socialLinks.length < MAX_LINKS) {
      setSocialLinks((prev) => [...prev, ''])
    }
  }

  const removeLink = (idx) => {
    setSocialLinks((prev) => prev.filter((_, i) => i !== idx))
    setLinkErrors((prev) => {
      const next = { ...prev }
      delete next[idx]
      return next
    })
  }

  const validateLink = (idx) => {
    const val = socialLinks[idx]?.trim()
    if (val && !isValidUrl(val)) {
      setLinkErrors((prev) => ({ ...prev, [idx]: 'Invalid URL format' }))
    }
  }

  return (
    <div className="flex flex-col rounded-[8px] border border-(--border) bg-(--bg-card) p-6 transition-colors hover:border-(--border-strong)" id="profile-social-links">
      <div className="mb-6 flex items-center gap-3 border-b border-(--border) pb-4">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-(--accent-yellow) text-[11px] font-bold text-[#09090B]">
          3
        </span>
        <h2 className="font-heading text-base font-bold text-(--text-primary)">Social Links</h2>
      </div>

      <div className="space-y-3">
        {socialLinks.map((link, idx) => (
          <div key={idx}>
            <div className="flex items-center gap-2">
              <input
                value={link}
                onChange={(e) => updateLink(idx, e.target.value)}
                onBlur={() => validateLink(idx)}
                placeholder={
                  idx === 0
                    ? 'https://linkedin.com/in/...'
                    : 'https://github.com/...'
                }
                className="w-full flex-1 rounded-[6px] border border-(--border) bg-(--bg-base) px-3 py-2 text-[13px] text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--border-strong) focus:outline-none transition-colors"
                type="url"
              />
              {idx > 0 && (
                <button
                  type="button"
                  onClick={() => removeLink(idx)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] text-(--text-muted) hover:bg-(--bg-subtle) hover:text-(--danger) transition-colors"
                  aria-label="Remove link"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {linkErrors[idx] && (
              <p className="mt-1.5 text-[12px] font-medium text-(--danger)">{linkErrors[idx]}</p>
            )}
          </div>
        ))}
      </div>

      {socialLinks.length < MAX_LINKS && (
        <button
          type="button"
          onClick={addLink}
          className="mt-4 flex w-fit items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-medium uppercase tracking-wider text-(--text-secondary) hover:bg-(--bg-subtle) hover:text-(--text-primary) transition-colors"
        >
          <Plus size={14} /> Add Link
        </button>
      )}

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
          {saving ? 'Saving…' : 'Save Links'}
        </button>
      </div>
    </div>
  )
}
