/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Get and update student profile, upload resume PDF
 * DEPENDS ON: api.js
 */
import apiClient from "./api";

export const profileService = {
  getMyProfile: async () => {
    const response = await apiClient.get("/students/me/profile");
    return response?.data || null;
  },

  updateProfile: async (data) => {
    const response = await apiClient.put("/students/me/profile", data);
    return response?.data;
  },

  uploadResume: async (file) => {
    const body = new FormData();
    body.append("file", file);
    const response = await apiClient.post("/students/me/resume", body, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response?.data;
  },

  uploadCertificate: async (file) => {
    const body = new FormData();
    body.append("file", file);
    const response = await apiClient.post("/students/me/certificates", body, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response?.data;
  },

  deleteCertificate: async (certificateId) => {
    const response = await apiClient.delete(`/students/me/certificates/${certificateId}`);
    return response?.data;
  },
};