/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Base axios instance. Attaches JWT token to every request.
 *                 Auto-refreshes token on 401. Redirects to /login on failure.
 * DEPENDS ON: axios, authStore
 */
import axios from "axios";
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  timeout: 10000,
});
export default apiClient;