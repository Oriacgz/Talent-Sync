/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Get ranked matches for student, get match detail with SHAP,
 *                 get ranked candidates for a job (recruiter)
 * DEPENDS ON: api.js
 */
import apiClient from "./api";

export const matchService = {
  getMyMatches: async (limit = 10) => {
    const response = await apiClient.get("/matches/me", { params: { limit } });
    return Array.isArray(response?.data) ? response.data : [];
  },

  getMatchDetail: async (matchId) => {
    const id = String(matchId);
    if (!id) return null;
    const response = await apiClient.get(`/matches/${id}/detail`);
    return response?.data || null;
  },

  getJobCandidates: async (jobId) => {
    const id = String(jobId || "");
    const target = id || "all";
    const response = await apiClient.get(`/matches/job/${target}/candidates`);
    return Array.isArray(response?.data) ? response.data : [];
  },
};