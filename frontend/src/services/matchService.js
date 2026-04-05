/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Get ranked matches for student, get match detail with SHAP,
 *                 get ranked candidates for a job (recruiter)
 * DEPENDS ON: api.js
 */
import apiClient from "./api";

const mapStudentMatch = (row) => {
  if (!row || typeof row !== "object") return null;

  const topReasons = Array.isArray(row.top_reasons) ? row.top_reasons : [];
  const scoreBreakdown = row.score_breakdown || {};

  return {
    id: String(row.job_id || ""),
    jobId: String(row.job_id || ""),
    title: row.job_title || "",
    roleTitle: row.job_title || "",
    company: row.company || "",
    companyName: row.company || "",
    location: row.location || null,
    workMode: row.work_mode || null,
    jobType: row.job_type || null,
    salaryMin: row.salary_min ?? null,
    salaryMax: row.salary_max ?? null,
    score: Number(row.final_score) || 0,
    finalScore: Number(row.final_score) || 0,
    similarityScore: Number(row.similarity_score) || 0,
    ruleScore: Number(row.ml_score) || 0,
    mlScore: Number(row.ml_score) || 0,
    topReasons,
    shapValues: row.shap_values || {},
    scoreBreakdown: {
      similarityScore: Number(scoreBreakdown.similarity_score) || 0,
      mlScore: Number(scoreBreakdown.ml_score) || 0,
      finalScore: Number(scoreBreakdown.final_score) || 0,
    },
    applied: Boolean(row.applied),
    rank: row.rank ?? null,
    requiredSkills: [],
    missingSkills: [],
    explanation: topReasons.join(" | "),
  };
};

const mapCandidate = (row) => {
  if (!row || typeof row !== "object") return null;
  return {
    id: String(row.student_id || ""),
    studentId: String(row.student_id || ""),
    fullName: row.student_name || "Candidate",
    score: Number(row.final_score) || 0,
    finalScore: Number(row.final_score) || 0,
    similarityScore: Number(row.similarity_score) || 0,
    topReasons: Array.isArray(row.top_reasons) ? row.top_reasons : [],
    shapValues: row.shap_values || {},
    skills: [],
    status: "APPLIED",
    applicationId: null,
    college: null,
    gpa: null,
  };
};

export const matchService = {
  getMyMatches: async (limit = 10) => {
    const response = await apiClient.get("/matches", { params: { limit } });
    return Array.isArray(response?.data)
      ? response.data.map(mapStudentMatch).filter(Boolean)
      : [];
  },

  getMatchDetail: async (matchId) => {
    const id = String(matchId);
    if (!id) return null;
    const list = await matchService.getMyMatches(50);
    const found = list.find((item) => String(item?.id) === id || String(item?.jobId) === id);
    return found || null;
  },

  getJobCandidates: async (jobId) => {
    const id = String(jobId || "");
    if (!id) return [];
    const response = await apiClient.get(`/matches/job/${id}`);
    return Array.isArray(response?.data)
      ? response.data.map(mapCandidate).filter(Boolean)
      : [];
  },
};