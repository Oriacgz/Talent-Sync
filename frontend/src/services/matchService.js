/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Get ranked matches for student, get match detail with SHAP,
 *                 get ranked candidates for a job (recruiter)
 * DEPENDS ON: api.js
 */
import apiClient from "./api";
import { getMockExport, resolveData } from "./mockRuntime";

export const matchService = {
  getMyMatches: async (limit = 10) => resolveData({
    apiCall: async () => {
      const response = await apiClient.get("/matches/me", { params: { limit } });
      return response?.data || [];
    },
    mockFile: "matches.js",
    mockExport: "matches",
    fallbackValue: [],
  }),

  getMatchDetail: async (matchId) => {
    const id = String(matchId);
    const apiResult = await resolveData({
      apiCall: async () => {
        const response = await apiClient.get(`/matches/${id}/detail`);
        return response?.data || null;
      },
      mockFile: "matches.js",
      mockExport: "matches",
      fallbackValue: [],
    });

    if (Array.isArray(apiResult)) {
      return apiResult.find((match) => String(match.id) === id) || null;
    }
    return apiResult;
  },

  getJobCandidates: async (jobId) => {
    const id = String(jobId || "");
    const apiResult = await resolveData({
      apiCall: async () => {
        const response = await apiClient.get(`/matches/job/${id}/candidates`);
        return response?.data || [];
      },
      mockFile: "students.js",
      mockExport: "candidates",
      fallbackValue: [],
    });

    if (!id) {
      return apiResult;
    }

    if (Array.isArray(apiResult)) {
      return apiResult.filter((candidate) => !candidate.jobId || String(candidate.jobId) === id);
    }

    const candidates = (await getMockExport("students.js", "candidates")) || [];
    return candidates.filter((candidate) => !candidate.jobId || String(candidate.jobId) === id);
  },
};