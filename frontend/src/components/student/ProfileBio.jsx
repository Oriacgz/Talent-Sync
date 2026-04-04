const MAX_BIO = 406
const WARN_THRESHOLD = 380

export default function ProfileBio({ bio, setBio, saving, error, onSave }) {
  const charCount = bio.length
  const isWarn = charCount > WARN_THRESHOLD

  return (
    <div className="flex flex-col rounded-[8px] border border-(--border) bg-(--bg-card) p-6 transition-colors hover:border-(--border-strong)" id="profile-bio">
      <div className="mb-6 flex items-center gap-3 border-b border-(--border) pb-4">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-(--accent-yellow) text-[11px] font-bold text-[#09090B]">
          2
        </span>
        <h2 className="font-heading text-base font-bold text-(--text-primary)">Bio</h2>
      </div>

      <div className="relative">
        <textarea
          value={bio}
          onChange={(e) => {
            if (e.target.value.length <= MAX_BIO) {
              setBio(e.target.value)
            }
          }}
          placeholder="Tell recruiters a bit about yourself..."
          maxLength={MAX_BIO}
          rows={5}
          className="w-full resize-none rounded-[6px] border border-(--border) bg-(--bg-base) p-3 text-[13px] text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--border-strong) focus:outline-none transition-colors"
          style={{ minHeight: '130px' }}
        />
        <span
          className={`absolute bottom-3 right-3 font-mono text-[11px] transition-colors ${
            isWarn ? 'font-bold text-(--danger)' : 'text-(--text-muted)'
          }`}
        >
          {charCount} / {MAX_BIO}
        </span>
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
          {saving ? 'Saving…' : 'Save Bio'}
        </button>
      </div>
    </div>
  )
}
