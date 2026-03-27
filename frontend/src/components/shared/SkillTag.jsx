/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Small colored skill pill tag. Each skill has a unique color.
 * DEPENDS ON: skillColors.js
 * PROPS: skill (string)
 */
import { getSkillColor } from '../../utils/skillColors'

export default function SkillTag({ skill }) {
  const label = String(skill || '').trim() || 'Skill'
  return (
    <span
      className={`inline-flex items-center rounded-[2px] border-2 px-2 py-2 text-[11px] font-semibold leading-none ${getSkillColor(label)}`}
    >
      {label}
    </span>
  )
}