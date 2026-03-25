/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Base axios instance. Attaches JWT token to every request.
 *                 Auto-refreshes token on 401. Redirects to /login on failure.
 * DEPENDS ON: axios, authStore
 */
import axios from "axios";
import { useAuthStore } from "../store/authStore";
// import { authService } from "./authService";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { refreshToken } = useAuthStore.getState();
        if (!refreshToken) throw new Error('No refresh token');

        // Use an un-intercepted axios to avoid loops
        const res = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, { refresh_token: refreshToken });

        useAuthStore.getState().setAuth(res.data.user, res.data.access_token, res.data.refresh_token);
        originalRequest.headers['Authorization'] = `Bearer ${res.data.access_token}`;
        return apiClient(originalRequest);
      } catch (err) {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;