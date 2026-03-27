/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Centered empty state with icon, title, subtitle,
 *                 and optional action button. Used when lists are empty.
 * DEPENDS ON: nothing
 * PROPS: title, subtitle, actionLabel, onAction
 */
export default function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionClassName,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionClassName,
  icon,
}) {
  return (
    <div className="brutal-panel rounded-[4px] border-dashed p-6 text-center">
      {icon ? <div className="mx-auto mb-3 w-fit text-2xl text-ink/65">{icon}</div> : null}
      <p className="text-base font-semibold text-ink">{title || 'Nothing here yet'}</p>
      <p className="mt-2 text-sm text-ink/70">{subtitle || 'Try adjusting your filters or check back later.'}</p>
      {actionLabel && typeof onAction === 'function' ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onAction}
            className={`btn-primary btn-feedback ${actionClassName || ''}`}
          >
            {actionLabel}
          </button>
          {secondaryActionLabel && typeof onSecondaryAction === 'function' ? (
            <button
              type="button"
              onClick={onSecondaryAction}
              className={`btn-secondary btn-feedback ${secondaryActionClassName || ''}`}
            >
              {secondaryActionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}