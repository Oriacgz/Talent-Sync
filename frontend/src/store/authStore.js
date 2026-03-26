/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Stores logged-in user info, JWT token, and role globally
 * DEPENDS ON: zustand, zustand/middleware persist
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEV_MODE = true;
const DEV_ROLE = "student"; // Switch between "student" and "recruiter" for dashboard testing.

const DEV_USER = {
  name: "Demo User",
  role: DEV_ROLE,
};

const getInitialAuthState = () => {
  if (DEV_MODE) {
    return {
      user: DEV_USER,
      token: null,
      refreshToken: null,
      isAuthenticated: true,
    };
  }

  return {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
  };
};

export const useAuthStore = create(persist((set) => ({
  ...getInitialAuthState(),
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
}), {
  name: "talentsync-auth",
  merge: (persistedState, currentState) => {
    if (DEV_MODE) {
      return currentState;
    }
    return {
      ...currentState,
      ...(persistedState || {}),
    };
  },
}));