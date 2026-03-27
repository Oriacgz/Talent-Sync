/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Maps skill names to Tailwind border+text color classes
 * DEPENDS ON: nothing
 */
const SKILL_CLASS_MAP = {
	python: "border-cyan text-ink bg-cyan/20",
	react: "border-yellow text-ink bg-yellow/30",
	javascript: "border-yellow text-ink bg-yellow/30",
	typescript: "border-cyan text-ink bg-cyan/20",
	sql: "border-pink text-ink bg-pink/25",
	pandas: "border-green text-ink bg-green/20",
	numpy: "border-green text-ink bg-green/20",
	fastapi: "border-cyan text-ink bg-cyan/20",
	node: "border-yellow text-ink bg-yellow/30",
	ml: "border-pink text-ink bg-pink/25",
};

export const getSkillColor = (skill) => {
	const key = String(skill || "").trim().toLowerCase();
	if (!key) {
		return "border-ink/30 text-ink/70 bg-[var(--bg-soft)]";
	}
	return SKILL_CLASS_MAP[key] || "border-ink/30 text-ink bg-[var(--bg-soft)]";
};