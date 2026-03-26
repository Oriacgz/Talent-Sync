/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Apply to job, get my applications, update application status
 * DEPENDS ON: api.js
 */
import apiClient from "./api";
import { resolveData } from "./mockRuntime";

export const applicationService = {
  apply: async (jobId) => resolveData({
    apiCall: async () => {
      const response = await apiClient.post("/applications", { job_id: jobId });
      return response?.data || { job_id: jobId, submitted: true };
    },
    mockFile: "matches.js",
    mockExport: "applications",
    fallbackValue: { job_id: jobId, submitted: true },
  }),

  getMyApplications: async () => resolveData({
    apiCall: async () => {
      const response = await apiClient.get("/applications/me");
      return response?.data || [];
    },
    mockFile: "matches.js",
    mockExport: "applications",
    fallbackValue: [],
  }),

  updateStatus: async (id, status) => {
    return resolveData({
      apiCall: async () => {
        const response = await apiClient.patch(`/applications/${id}/status`, { status });
        return response?.data || { id, status };
      },
      mockFile: "matches.js",
      mockExport: "applications",
      fallbackValue: { id, status },
    });
  },
};