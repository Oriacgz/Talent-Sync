/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Shows application status as a colored badge.
 *                 applied=gray, reviewed=yellow, shortlisted=cyan,
 *                 selected=green, rejected=pink
 * DEPENDS ON: nothing
 * PROPS: status (string)
 */
export default function StatusBadge({ status }) {
  return <span>{status}</span>;
}