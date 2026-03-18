/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Stores logged-in user info, JWT token, and role globally
 * DEPENDS ON: zustand, zustand/middleware persist
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(persist(() => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  setAuth: () => {},
  clearAuth: () => {},
  updateUser: () => {},
}), { name: "talentsync-auth" }));