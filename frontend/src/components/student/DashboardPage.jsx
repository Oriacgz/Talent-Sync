import { useState, useEffect, useMemo } from "react";
import {
  Briefcase, CheckCircle, Star, UserCheck,
  ChevronRight, RefreshCw, MapPin, Zap,
  AlertCircle, BookOpen, ArrowRight, Building2,
  BarChart2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import { matchService } from "../../services/matchService";
import { applicationService } from "../../services/applicationService";
import { profileService } from "../../services/profileService";
import { buildMatchNarrative, explainFactor, topShapReasons } from "../../utils/formatters";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const scoreColor = (score) => {
  if (score >= 85) return "#4ade80";
  if (score >= 70) return "#F5C542";
  return "#f87171";
};

const scoreBarColor = (score) => {
  if (score >= 85) return "#22c55e";
  if (score >= 70) return "#F5C542";
  return "#ef4444";
};

const MODE_COLORS = {
  REMOTE: { bg: "rgba(14,165,233,0.12)", text: "#38bdf8" },
  HYBRID: { bg: "rgba(245,197,66,0.12)", text: "#F5C542" },
  ONSITE: { bg: "rgba(34,197,94,0.12)", text: "#4ade80" },
};

const TYPE_COLORS = {
  INTERNSHIP: { bg: "rgba(167,139,250,0.12)", text: "#a78bfa" },
  FULL_TIME:  { bg: "rgba(34,197,94,0.12)",   text: "#4ade80" },
  PART_TIME:  { bg: "rgba(251,146,60,0.12)",   text: "#fb923c" },
  CONTRACT:   { bg: "rgba(245,197,66,0.12)",   text: "#F5C542" },
};

function formatSalary(min, max) {
  if (!min && !max) return null;
  const fmt = (n) => n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : `₹${(n / 1000).toFixed(0)}K`;
  if (min && max) return `${fmt(min)}–${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max)}`;
}

function computeCompletion(profile) {
  if (!profile) return { pct: 0, missing: [] };
  // Handle both field name variants
  const socialLinks = profile.socialLinks || {};
  const linkedinUrl = profile.linkedinUrl || socialLinks.linkedinUrl || socialLinks.linkedin || '';
  const githubUrl = profile.githubUrl || socialLinks.githubUrl || socialLinks.github || '';
  const skills = Array.isArray(profile.skills)
    ? profile.skills
    : Array.isArray(profile.studentSkills)
      ? profile.studentSkills
      : [];

  const checks = [
    { label: "Full name",  done: !!profile.fullName },
    { label: "Bio",        done: !!profile.bio },
    { label: "College",    done: !!profile.college },
    { label: "Degree",     done: !!profile.degree },
    { label: "Skills",     done: skills.length > 0 },
    { label: "Resume",     done: !!profile.resumeUrl },
    { label: "LinkedIn",   done: !!linkedinUrl },
    { label: "GitHub",     done: !!githubUrl },
    { label: "Location",   done: !!profile.location },
  ];
  const done    = checks.filter(c => c.done).length;
  const missing = checks.filter(c => !c.done).map(c => c.label).slice(0, 3);
  return { pct: Math.round((done / checks.length) * 100), missing };
}

function initials(name) {
  if (!name) return "??";
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────
function Skeleton({ width = "100%", height = 16, radius = 6 }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: "linear-gradient(90deg, var(--bg-subtle) 25%, var(--bg-card) 50%, var(--bg-subtle) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
}

// ─────────────────────────────────────────────
// PROFILE BANNER
// ─────────────────────────────────────────────
function ProfileBanner({ pct, missing }) {
  const navigate = useNavigate();
  if (pct >= 100) return null;
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "2px solid var(--accent-yellow, #F5C542)",
      borderRadius: 10, padding: "16px 20px",
      display: "flex", alignItems: "center", gap: 16, marginBottom: 24,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 8,
        background: "rgba(245,197,66,0.12)", border: "1.5px solid var(--accent-yellow, #F5C542)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <AlertCircle size={18} color="var(--accent-yellow, #F5C542)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
            Profile {pct}% complete — finish it for better matches
          </p>
          {missing.length > 0 && (
            <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", marginLeft: 12 }}>
              {missing.join(", ")} missing
            </span>
          )}
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "var(--bg-subtle)", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: "var(--accent-yellow, #F5C542)", borderRadius: 3,
            transition: "width 0.6s ease",
          }} />
        </div>
      </div>
      <button onClick={() => navigate("/student/profile")} style={{
        background: "var(--accent-yellow, #F5C542)", border: "2px solid var(--text-primary)",
        borderRadius: 6, padding: "7px 16px",
        fontSize: 12, fontWeight: 700, color: "var(--text-on-accent, #1A1A1A)",
        cursor: "pointer", whiteSpace: "nowrap",
        display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
      }}>
        Complete <ArrowRight size={13} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────
function StatCard({ label, value, icon, color, loading }) {
  const Icon = icon;
  const accent = { yellow: "#F5C542", blue: "#3b82f6", green: "#22c55e", purple: "#a855f7" }[color];
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "2px solid var(--border)",
        borderTop: `4px solid ${accent}`,
        borderRadius: 10, padding: "20px 22px",
        flex: 1, minWidth: 0,
        transition: "transform 0.15s ease", cursor: "default",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "var(--text-muted)", margin: "0 0 10px" }}>
            {label}
          </p>
          {loading
            ? <Skeleton width={40} height={32} />
            : <p style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1 }}>
                {value ?? 0}
              </p>
          }
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 8,
          background: `${accent}22`, border: `1.5px solid ${accent}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} color={accent} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MATCH CARD
// ─────────────────────────────────────────────
function MatchCard({ match, appliedIds, onApply }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  // Normalise field names — API may return snake_case, camelCase, or nested job object
  const jobId    = match.jobId    ?? match.job_id;
  const title    = match.title    ?? match.job_title ?? match.roleTitle ?? match.job?.title ?? "—";
  const company  = match.company  ?? match.companyName ?? match.job?.recruiter?.companyName ?? "—";
  const location = match.location ?? match.job?.location ?? null;
  const workMode = (match.workMode ?? match.work_mode ?? match.job?.workMode ?? "").toUpperCase();
  const jobType  = (match.jobType  ?? match.job_type  ?? match.job?.jobType  ?? "").toUpperCase();
  const salMin   = match.salaryMin ?? match.salary_min ?? match.job?.salaryMin;
  const salMax   = match.salaryMax ?? match.salary_max ?? match.job?.salaryMax;
  const skills   = match.requiredSkills ?? match.skills ?? match.job?.skills ?? [];
  const missingSkills = match.missingSkills ?? match.missing_skills ?? [];
  const reasons  = useMemo(
    () => match.topReasons ?? match.top_reasons ?? [],
    [match.topReasons, match.top_reasons]
  );
  const shapValues = useMemo(
    () => match.shapValues ?? match.shap_values ?? {},
    [match.shapValues, match.shap_values]
  );
  const scoreBreakdown = useMemo(
    () => match.scoreBreakdown ?? match.score_breakdown ?? {},
    [match.scoreBreakdown, match.score_breakdown]
  );
  const rawScore = match.finalScore ?? match.final_score ?? match.score ?? 0;
  const score    = Math.round(rawScore * 100);
  const salary   = formatSalary(salMin, salMax);
  const isApplied = appliedIds.has(jobId);

  const similarityScore = Number(scoreBreakdown.similarityScore ?? scoreBreakdown.similarity_score ?? rawScore) || 0;
  const mlScore = Number(scoreBreakdown.mlScore ?? scoreBreakdown.ml_score ?? 0) || 0;
  const finalScore = Number(scoreBreakdown.finalScore ?? scoreBreakdown.final_score ?? rawScore) || rawScore;

  const detailedFactors = useMemo(
    () => topShapReasons(shapValues, 4, 0.01),
    [shapValues]
  );
  const detailedNarrative = reasons.length > 0
    ? reasons.join(". ")
    : buildMatchNarrative({ ...match, shapValues });
  const canExplain = reasons.length > 0 || detailedFactors.length > 0 || Object.keys(scoreBreakdown).length > 0;

  const modeBadge = MODE_COLORS[workMode] ?? { bg: "var(--bg-subtle)", text: "var(--text-muted)" };
  const typeBadge = TYPE_COLORS[jobType]  ?? { bg: "var(--bg-subtle)", text: "var(--text-muted)" };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "2px solid var(--border)",
        borderRadius: 10, padding: 20,
        transition: "transform 0.15s ease, border-color 0.15s ease",
        cursor: "default",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--accent-yellow, #F5C542)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 8, flexShrink: 0,
            background: "var(--bg-subtle)",
            border: "2px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 15,
            color: "var(--accent-yellow, #F5C542)",
          }}>
            {(company[0] || "?").toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
              {title}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)",
              display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
              <Building2 size={12} /> {company}
              {location && (
                <><span style={{ opacity: 0.4 }}>·</span><MapPin size={12} />{location}</>
              )}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, marginLeft: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: scoreColor(score) }}>
            {score}%
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>match</span>
        </div>
      </div>

      {/* Score bar */}
      <div style={{ height: 5, borderRadius: 3, background: "var(--bg-subtle)", marginBottom: 14, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: scoreBarColor(score), borderRadius: 3 }} />
      </div>

      {/* Badges */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {jobType && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 5,
            background: typeBadge.bg, color: typeBadge.text, border: `1px solid ${typeBadge.text}33` }}>
            {jobType.replace("_", " ")}
          </span>
        )}
        {workMode && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 5,
            background: modeBadge.bg, color: modeBadge.text, border: `1px solid ${modeBadge.text}33` }}>
            {workMode}
          </span>
        )}
        {salary && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 5,
            background: "var(--bg-subtle)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)" }}>
            {salary}
          </span>
        )}
        {skills.slice(0, 3).map(skill => (
          <span key={skill} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 5,
            background: "rgba(245,197,66,0.08)",
            color: "var(--accent-yellow, #F5C542)",
            border: "1px solid rgba(245,197,66,0.2)" }}>
            {skill}
          </span>
        ))}
      </div>

      {/* Top reason */}
      {reasons[0] && (
        <div style={{
          background: "var(--bg-subtle)",
          border: "1px solid var(--border)",
          borderRadius: 7, padding: "10px 12px", marginBottom: 14,
          display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <Zap size={13} color="#F5C542" style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {reasons[0]}
          </p>
        </div>
      )}

      {/* Expanded reasons */}
      {expanded && (
        <div style={{
          border: "1px solid var(--border)",
          background: "var(--bg-subtle)",
          borderRadius: 8,
          padding: "12px 14px",
          marginBottom: 14,
        }}>
          <p style={{
            margin: "0 0 8px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}>
            Why this matched in detail
          </p>

          <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>
            {detailedNarrative}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-secondary)",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 5,
              padding: "3px 8px",
            }}>
              Semantic: {Math.round(similarityScore * 100)}%
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-secondary)",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 5,
              padding: "3px 8px",
            }}>
              Model fit: {Math.round(mlScore * 100)}%
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: scoreColor(Math.round(finalScore * 100)),
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 5,
              padding: "3px 8px",
            }}>
              Final: {Math.round(finalScore * 100)}%
            </span>
          </div>

          {detailedFactors.length > 0 ? detailedFactors.map((factor) => (
            <div key={factor.feature} style={{
              padding: "8px 0",
              borderTop: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "capitalize" }}>
                  {factor.label}
                </p>
                <span style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  color: factor.value >= 0 ? "#22c55e" : "#f87171",
                }}>
                  {factor.value >= 0 ? "+" : ""}{factor.value.toFixed(2)}
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {explainFactor(factor)}
              </p>
            </div>
          )) : reasons.slice(1).map((r, i) => (
            <div key={i} style={{
              display: "flex", gap: 8, alignItems: "flex-start",
              padding: "8px 0",
              borderTop: "1px solid var(--border)",
            }}>
              <CheckCircle size={12} color="#22c55e" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{r}</p>
            </div>
          ))}

          {missingSkills.length > 0 && (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
              Skill gaps to improve: {missingSkills.slice(0, 5).join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {isApplied ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, color: "#22c55e", fontWeight: 600 }}>
            <CheckCircle size={14} /> Applied
          </div>
        ) : (
          <button onClick={() => onApply(jobId)} style={{
            background: "var(--accent-yellow, #F5C542)", border: "2px solid var(--text-primary)",
            borderRadius: 6, padding: "7px 18px",
            fontSize: 12, fontWeight: 700, color: "var(--text-on-accent, #1A1A1A)", cursor: "pointer",
          }}>
            Apply Now
          </button>
        )}

        {canExplain && (
          <button onClick={() => setExpanded(!expanded)} style={{
            background: "transparent",
            border: "1.5px solid var(--border)",
            borderRadius: 6, padding: "7px 14px",
            fontSize: 12, fontWeight: 600,
            color: "var(--text-secondary)", cursor: "pointer",
          }}>
            {expanded ? "Less" : "Why matched?"}
          </button>
        )}

        <button onClick={() => navigate(`/student/jobs/${jobId}`)} style={{
          marginLeft: "auto", background: "transparent", border: "none",
          fontSize: 12, color: "var(--text-muted)",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
        }}>
          View job <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
function EmptyMatches({ onRefresh, profileIncomplete }) {
  const navigate = useNavigate();
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "2px solid var(--border)",
      borderRadius: 10, padding: "52px 24px",
      display: "flex", flexDirection: "column",
      alignItems: "center", textAlign: "center",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 12,
        background: "var(--bg-subtle)",
        border: "2px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
      }}>
        <BarChart2 size={28} color="#F5C542" />
      </div>
      <p style={{ fontWeight: 700, fontSize: 17, color: "var(--text-primary)", margin: "0 0 8px" }}>
        {profileIncomplete ? "No matches yet" : "No matches found right now"}
      </p>
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 24px", maxWidth: 320, lineHeight: 1.6 }}>
        {profileIncomplete
          ? "Complete your profile so our AI engine can find the best-matched jobs for you."
          : "Try updating your profile skills, or check back later when new roles are posted."}
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        {profileIncomplete && (
          <button onClick={() => navigate("/student/onboarding")} style={{
            background: "var(--accent-yellow, #F5C542)", border: "2px solid var(--text-primary)",
            borderRadius: 6, padding: "9px 20px",
            fontSize: 13, fontWeight: 700, color: "var(--text-on-accent, #1A1A1A)",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>
            Complete Profile <ArrowRight size={14} />
          </button>
        )}
        <button onClick={onRefresh} style={{
          background: "transparent",
          border: "2px solid var(--border)",
          borderRadius: 6, padding: "9px 20px",
          fontSize: 13, fontWeight: 600,
          color: "var(--text-secondary)",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
        }}>
          <RefreshCw size={14} /> Try Again
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
function Sidebar({ profile, user, completionData, onOpenCareerAI }) {
  const navigate = useNavigate();

  const steps = [
    { label: "Basic details",   done: !!profile?.fullName },
    { label: "Skills added",    done: !!(profile?.skills?.length || profile?.studentSkills?.length) },
    { label: "Education",       done: !!profile?.degree },
    { label: "Resume uploaded", done: !!profile?.resumeUrl },
    { label: "Bio written",     done: !!profile?.bio },
    { label: "LinkedIn added",  done: !!profile?.linkedinUrl },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Profile card */}
      <div style={{
        background: "var(--bg-card)",
        border: "2px solid var(--border)",
        borderRadius: 10, padding: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 10,
            background: "var(--accent-yellow, #F5C542)", border: "2px solid var(--text-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 16, color: "var(--text-on-accent, #1A1A1A)", flexShrink: 0,
          }}>
            {initials(profile?.fullName || user?.name)}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
              {profile?.fullName || user?.name || "—"}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
              {user?.email || "—"}
            </p>
          </div>
        </div>

        <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
          Profile completion
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 7, borderRadius: 4, background: "var(--bg-subtle)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${completionData.pct}%`, background: "var(--accent-yellow, #F5C542)", borderRadius: 4 }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-yellow, #F5C542)", minWidth: 32 }}>
            {completionData.pct}%
          </span>
        </div>

        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 18, height: 18, borderRadius: 4, flexShrink: 0,
              background: step.done ? "#22c55e" : "var(--bg-subtle)",
              border: `1.5px solid ${step.done ? "#22c55e" : "var(--border)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {step.done && <CheckCircle size={11} color="#fff" />}
            </div>
            <span style={{
              fontSize: 12,
              color: step.done ? "var(--text-muted)" : "var(--text-primary)",
              fontWeight: step.done ? 400 : 600,
              textDecoration: step.done ? "line-through" : "none",
            }}>
              {step.label}
            </span>
          </div>
        ))}

        <button onClick={() => navigate("/student/profile")} style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, marginTop: 16, width: "100%",
          background: "var(--accent-yellow, #F5C542)", border: "2px solid var(--text-primary)",
          borderRadius: 7, padding: "9px",
          fontSize: 12, fontWeight: 700, color: "var(--text-on-accent, #1A1A1A)", cursor: "pointer",
        }}>
          Edit Profile <ArrowRight size={13} />
        </button>
      </div>

      {/* Career AI card */}
      <div style={{
        background: "rgba(245,197,66,0.06)",
        border: "2px solid var(--accent-yellow, #F5C542)",
        borderRadius: 10, padding: "18px 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Zap size={15} color="#F5C542" />
          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
            Career AI
          </p>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Ask why you matched, get resume tips, or prep for interviews.
        </p>
        <button onClick={onOpenCareerAI} style={{
          width: "100%", background: "var(--accent-yellow, #F5C542)",
          border: "2px solid var(--text-primary)", borderRadius: 7, padding: "8px",
          fontSize: 12, fontWeight: 700, color: "var(--text-on-accent, #1A1A1A)", cursor: "pointer",
        }}>
          Open Career AI
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────
export default function StudentDashboard() {
  const user = useAuthStore((state) => state.user);
  const setAIPanelOpen = useUIStore((state) => state.setAIPanelOpen);
  const navigate = useNavigate();

  const openCareerAI = () => setAIPanelOpen(true);

  const [profile,    setProfile]    = useState(null);
  const [matches,    setMatches]    = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [appStats,   setAppStats]   = useState({ applied: 0, reviewed: 0, shortlisted: 0, selected: 0 });
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Hello";
    if (h < 17) return "Hello";
    return "Hello";
  }, []);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll(force = false) {
    try {
      setError(null);
      force ? setRefreshing(true) : setLoading(true);

      const [profileRes, matchRes, appsRes] = await Promise.allSettled([
        profileService.getMyProfile(),
        force ? matchService.refreshMyMatches(50) : matchService.getMyMatches(50),
        applicationService.getMyApplications(),
      ]);

      if (profileRes.status === "fulfilled")
        setProfile(profileRes.value);

      if (matchRes.status === "fulfilled")
        setMatches(Array.isArray(matchRes.value) ? matchRes.value : []);

      if (appsRes.status === "fulfilled") {
        const apps = Array.isArray(appsRes.value) ? appsRes.value : [];
        setAppliedIds(new Set(apps.map(a => a.jobId ?? a.job_id)));
        setAppStats({
          applied:     apps.filter(a => a.status === "APPLIED").length,
          reviewed:    apps.filter(a => a.status === "REVIEWED").length,
          shortlisted: apps.filter(a => a.status === "SHORTLISTED").length,
          selected:    apps.filter(a => a.status === "SELECTED").length,
        });
      }
    } catch {
      setError("Failed to load dashboard. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleApply(jobId) {
    try {
      await applicationService.apply(jobId);
      setAppliedIds(prev => new Set([...prev, jobId]));
      setAppStats(prev => ({ ...prev, applied: prev.applied + 1 }));
    } catch (e) {
      alert(e?.response?.data?.detail ?? "Could not apply. Please try again.");
    }
  }

  const completionData = computeCompletion(profile);
  const profileIncomplete = completionData.pct <= 50;

  const STATS = [
    { label: "Applied",     value: appStats.applied,     icon: Briefcase, color: "yellow" },
    { label: "Reviewed",    value: appStats.reviewed,    icon: BookOpen,  color: "blue"   },
    { label: "Shortlisted", value: appStats.shortlisted, icon: Star,      color: "green"  },
    { label: "Selected",    value: appStats.selected,    icon: UserCheck, color: "purple" },
  ];

  return (
    <div style={{ padding: "28px 32px", maxWidth: "100%", fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>

      {/* Profile banner */}
      {!loading && <ProfileBanner pct={completionData.pct} missing={completionData.missing} />}

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(239,68,68,0.08)",
          border: "2px solid #ef4444", borderRadius: 10,
          padding: "14px 18px", marginBottom: 24,
          fontSize: 13, color: "#f87171",
        }}>
          {error}
        </div>
      )}

      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>
          {greeting}, {profile?.fullName?.split(" ")[0] || user?.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>
          Your AI match engine is active and ready.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
        {STATS.map(s => <StatCard key={s.label} {...s} loading={loading} />)}
      </div>

      {/* 2-col layout */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, alignItems: "start" }}>

        <Sidebar
          profile={profile}
          user={user}
          completionData={completionData}
          onOpenCareerAI={openCareerAI}
        />

        <div>
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>Top Matches</h2>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
                Ranked by AI compatibility score
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => fetchAll(true)} style={{
                background: "transparent",
                border: "2px solid var(--border)",
                borderRadius: 7, padding: "7px 14px",
                fontSize: 12, fontWeight: 600,
                color: "var(--text-secondary)",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}>
                <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
              <button onClick={() => navigate("/student/matches")} style={{
                background: "var(--accent-yellow, #F5C542)", border: "2px solid var(--text-primary)",
                borderRadius: 7, padding: "7px 16px",
                fontSize: 12, fontWeight: 700, color: "var(--text-on-accent, #1A1A1A)",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}>
                View All <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  background: "var(--bg-card)",
                  border: "2px solid var(--border)",
                  borderRadius: 10, padding: 20,
                }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                    <Skeleton width={42} height={42} radius={8} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <Skeleton width="55%" height={15} />
                      <Skeleton width="35%" height={12} />
                    </div>
                    <Skeleton width={48} height={32} radius={6} />
                  </div>
                  <Skeleton height={5} radius={3} />
                </div>
              ))}
            </div>
          )}

          {/* Real match cards */}
          {!loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {matches.length === 0
                ? <EmptyMatches onRefresh={() => fetchAll(true)} profileIncomplete={profileIncomplete} />
                : matches.map((m, i) => (
                    <MatchCard
                      key={m.jobId ?? m.job_id ?? i}
                      match={m}
                      appliedIds={appliedIds}
                      onApply={handleApply}
                    />
                  ))
              }
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}
