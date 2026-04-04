/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Fetch platform-wide stats and recruiter-specific analytics
 * DEPENDS ON: api.js
 */
import apiClient from "./api";

export const analyticsService = {
  getPlatformStats: async () => {
    const response = await apiClient.get("/analytics/platform");
    return response?.data || {};
  },

  getRecruiterAnalytics: async () => {
    const response = await apiClient.get("/analytics/recruiter/me");
    return response?.data || {};
  },
};