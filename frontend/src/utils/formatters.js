/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Utility functions — score to %, date formatting,
 *                 text truncation, match color by score
 * DEPENDS ON: nothing
 */
export const scoreToPercent = (score) => {
	const value = Number(score);
	if (!Number.isFinite(value)) {
		return "0%";
	}
	return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
};

export const formatDate = (iso) => {
	if (!iso) {
		return "";
	}
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return String(iso);
	}
	return date.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

export const truncateText = (text, max = 140) => {
	if (!text) {
		return "";
	}
	const raw = String(text);
	if (raw.length <= max) {
		return raw;
	}
	return `${raw.slice(0, Math.max(0, max - 3))}...`;
};

export const getMatchColor = (score) => {
	const safeScore = Number.isFinite(Number(score)) ? Number(score) : 0;
	if (safeScore >= 0.75) {
		return "#00F5D4";
	}
	if (safeScore >= 0.55) {
		return "#FFE135";
	}
	return "#FF2D78";
};

export const topShapReasons = (shapValues, count = 2) => {
	if (!shapValues || typeof shapValues !== "object") {
		return [];
	}

	return Object.entries(shapValues)
		.map(([feature, value]) => ({
			feature,
			value: Number(value) || 0,
		}))
		.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
		.slice(0, Math.max(1, count));
};

const FEATURE_LABELS = {
	projects: "project experience",
	react: "React skill",
	typescript: "TypeScript skill",
	python: "Python skill",
	sql: "SQL skill",
	ml: "machine learning fundamentals",
	location: "location preference fit",
	"location match": "location preference fit",
	domain: "domain familiarity",
	"domain fit": "domain familiarity",
	communication: "communication signals",
	gpa: "academic profile",
};

const STUDENT_PIPELINE = ["APPLIED", "REVIEWED", "SHORTLISTED", "SELECTED"];

const toSafeArray = (value) => (Array.isArray(value) ? value : []);

const toFeatureLabel = (feature) => {
	const key = String(feature || "").trim().toLowerCase();
	if (!key) {
		return "profile signals";
	}
	return FEATURE_LABELS[key] || String(feature);
};

export const strongestShapFactor = (shapValues) => {
	return topShapReasons(shapValues, 1)[0] || null;
};

export const weakestShapFactor = (shapValues) => {
	const entries = topShapReasons(shapValues, 32);
	if (!entries.length) {
		return null;
	}
	return [...entries].sort((a, b) => Math.abs(a.value) - Math.abs(b.value))[0] || null;
};

export const explainFactor = (factor) => {
	if (!factor?.feature) {
		return "No strong factor identified yet.";
	}

	const label = toFeatureLabel(factor.feature);
	if ((Number(factor.value) || 0) >= 0) {
		return `${label} is helping this match.`;
	}
	return `${label} is currently lowering this match score.`;
};

export const buildMatchNarrative = (match) => {
	if (!match || typeof match !== "object") {
		return "This match is generated from your profile, skills, and role fit signals.";
	}

	if (match.explanation) {
		return String(match.explanation);
	}

	const strongest = strongestShapFactor(match.shapValues);
	if (!strongest) {
		return "This match is based on profile fit, skills, and academic indicators.";
	}

	const label = toFeatureLabel(strongest.feature);
	return `This match is stronger because your ${label} aligns with role requirements.`;
};

const collectRequiredSkills = (jobs, matches) => {
	const fromJobs = toSafeArray(jobs)
		.flatMap((job) => toSafeArray(job?.requiredSkills))
		.map((skill) => String(skill || "").trim())
		.filter(Boolean);

	if (fromJobs.length) {
		return fromJobs;
	}

	return toSafeArray(matches)
		.flatMap((match) => toSafeArray(match?.requiredSkills))
		.map((skill) => String(skill || "").trim())
		.filter(Boolean);
};

export const getSkillGapInsight = (matches, jobs) => {
	const topMatches = toSafeArray(matches).slice(0, 3);
	const missingSkills = topMatches
		.flatMap((match) => toSafeArray(match?.missingSkills))
		.map((skill) => String(skill || "").trim())
		.filter(Boolean);

	if (!missingSkills.length) {
		return null;
	}

	const missingCountBySkill = missingSkills.reduce((acc, skill) => {
		const key = skill.toLowerCase();
		acc[key] = {
			skill,
			count: (acc[key]?.count || 0) + 1,
		};
		return acc;
	}, {});

	const primaryMissing = Object.values(missingCountBySkill)
		.sort((a, b) => b.count - a.count)[0];

	if (!primaryMissing?.skill) {
		return null;
	}

	const requiredSkills = collectRequiredSkills(jobs, matches);
	const totalRequirements = requiredSkills.length;
	const requirementHits = requiredSkills.filter(
		(skill) => skill.toLowerCase() === primaryMissing.skill.toLowerCase()
	).length;

	const prevalencePercent = totalRequirements
		? Math.round((requirementHits / totalRequirements) * 100)
		: null;

	return {
		skill: primaryMissing.skill,
		missingCount: primaryMissing.count,
		prevalencePercent,
		totalRequirements,
	};
};

export const getApplicationPipeline = (applications) => {
	const safeApplications = toSafeArray(applications);
	const counts = STUDENT_PIPELINE.reduce((acc, stage) => {
		acc[stage] = 0;
		return acc;
	}, {});

	safeApplications.forEach((application) => {
		const status = String(application?.status || "").toUpperCase();
		if (status === "HIRED") {
			counts.SELECTED += 1;
			return;
		}
		if (status in counts) {
			counts[status] += 1;
		}
	});

	let currentStageIndex = -1;
	STUDENT_PIPELINE.forEach((stage, index) => {
		if (counts[stage] > 0) {
			currentStageIndex = index;
		}
	});

	return STUDENT_PIPELINE.map((stage, index) => ({
		key: stage,
		label: stage.charAt(0) + stage.slice(1).toLowerCase(),
		count: counts[stage],
		active: index <= currentStageIndex,
	}));
};

export const getRecruiterFunnel = (totals = {}) => {
	const applicants = Number(totals?.applicants) || 0;
	const reviewed = Number(totals?.reviewed) || Math.max(0, applicants - (Number(totals?.shortlisted) || 0));
	const shortlisted = Number(totals?.shortlisted) || 0;
	const selected = Number(totals?.accepted) || Number(totals?.selected) || 0;

	return [
		{ key: "APPLIED", label: "Applied", count: applicants },
		{ key: "REVIEWED", label: "Reviewed", count: reviewed },
		{ key: "SHORTLISTED", label: "Shortlisted", count: shortlisted },
		{ key: "SELECTED", label: "Selected", count: selected },
	];
};