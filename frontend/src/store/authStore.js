/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Stores logged-in user info, JWT token, and role globally
 * DEPENDS ON: zustand, zustand/middleware persist
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(persist((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  setAuth: (user, token, refreshToken) => set({
    user,
    token,
    refreshToken,
    isAuthenticated: true
  }),
  clearAuth: () => set({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false
  }),
  updateUser: (userUpdates) => set((state) => ({
    user: { ...state.user, ...userUpdates }
  })),
}), { name: "talentsync-auth" }));