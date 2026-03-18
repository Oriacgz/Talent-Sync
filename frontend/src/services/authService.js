/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Login, register, logout, token refresh API calls
 * DEPENDS ON: api.js
 */
import apiClient from "./api";
export const authService = {
  login: (email, password) => {},
  register: (name, email, password, role) => {},
  refresh: (refreshToken) => {},
  logout: () => {},
};