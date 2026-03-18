/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Get ranked matches for student, get match detail with SHAP,
 *                 get ranked candidates for a job (recruiter)
 * DEPENDS ON: api.js
 */
import apiClient from "./api";
export const matchService = {
  getMyMatches: (limit = 10) => {},
  getMatchDetail: (matchId) => {},
  getJobCandidates: (jobId) => {},
};