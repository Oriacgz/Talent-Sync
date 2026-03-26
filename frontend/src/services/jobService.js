/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: List jobs, get single job, create job, update job
 * DEPENDS ON: api.js
 */
import apiClient from "./api";
import { resolveData } from "./mockRuntime";

export const jobService = {
  getAllJobs: async () => resolveData({
    apiCall: async () => {
      const response = await apiClient.get("/jobs");
      return response?.data || [];
    },
    mockFile: "jobs.js",
    mockExport: "jobs",
    fallbackValue: [],
  }),

  getJobById: async (id) => resolveData({
    apiCall: async () => {
      const response = await apiClient.get(`/jobs/${id}`);
      return response?.data || null;
    },
    mockFile: "jobs.js",
    mockExport: "jobById",
    fallbackValue: null,
  }),

  createJob: async (data) => {
    const response = await apiClient.post("/jobs", data);
    return response?.data;
  },

  updateJob: async (id, data) => {
    const response = await apiClient.put(`/jobs/${id}`, data);
    return response?.data;
  },
};