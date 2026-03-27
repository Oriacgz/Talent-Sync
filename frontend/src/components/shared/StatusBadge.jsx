/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Shows application status as a colored badge.
 *                 applied=gray, reviewed=yellow, shortlisted=cyan,
 *                 selected=green, rejected=pink
 * DEPENDS ON: nothing
 * PROPS: status (string)
 */
import Badge from '../ui/Badge'

const STATUS_COLOR = {
  APPLIED: 'ink',
  REVIEWED: 'yellow',
  SHORTLISTED: 'cyan',
  SELECTED: 'green',
  HIRED: 'green',
  REJECTED: 'pink',
  DECLINED: 'pink',
}

export default function StatusBadge({ status }) {
  const normalized = String(status || 'UNKNOWN').toUpperCase()
  const color = STATUS_COLOR[normalized] || 'ink'
  return <Badge label={normalized} color={color} />
}