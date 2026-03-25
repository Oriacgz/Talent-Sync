/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Login, register, logout, token refresh API calls
 * DEPENDS ON: api.js
 */
import apiClient from "./api";

export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (name, email, password, role) => {
    const response = await apiClient.post('/auth/register', { name, email, password, role });
    return response.data;
  },
  refresh: async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};