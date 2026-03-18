/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Small colored skill pill tag. Each skill has a unique color.
 * DEPENDS ON: skillColors.js
 * PROPS: skill (string)
 */
export default function SkillTag({ skill }) {
  return <span>{skill}</span>;
}