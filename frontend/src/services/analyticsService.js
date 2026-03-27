/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Fetch platform-wide stats and recruiter-specific analytics
 * DEPENDS ON: api.js
 */
import apiClient from "./api";
import { resolveData } from "./mockRuntime";

export const analyticsService = {
  getPlatformStats: async () => resolveData({
    apiCall: async () => {
      const response = await apiClient.get("/analytics/platform");
      return response?.data || {};
    },
    mockFile: "analytics.js",
    mockExport: "platformStats",
    fallbackValue: {},
  }),

  getRecruiterAnalytics: async () => resolveData({
    apiCall: async () => {
      const response = await apiClient.get("/analytics/recruiter/me");
      return response?.data || {};
    },
    mockFile: "analytics.js",
    mockExport: "recruiterAnalytics",
    fallbackValue: {},
  }),
};