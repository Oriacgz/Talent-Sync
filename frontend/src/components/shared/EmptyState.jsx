/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Centered empty state with icon, title, subtitle,
 *                 and optional action button. Used when lists are empty.
 * DEPENDS ON: nothing
 * PROPS: title, subtitle, actionLabel, onAction
 */
export default function EmptyState({ title, subtitle }) {
  return <div>{title} — {subtitle}</div>;
}