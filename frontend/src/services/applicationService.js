/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Apply to job, get my applications, update application status
 * DEPENDS ON: api.js
 */
import apiClient from "./api";

export const applicationService = {
  apply: async (jobId) => {
    const response = await apiClient.post("/applications", { job_id: jobId });
    return response?.data;
  },

  getMyApplications: async () => {
    const response = await apiClient.get("/applications/me");
    return Array.isArray(response?.data) ? response.data : [];
  },

  updateStatus: async (id, status) => {
    const response = await apiClient.patch(`/applications/${id}/status`, { status });
    return response?.data;
  },
};