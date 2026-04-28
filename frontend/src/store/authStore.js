/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Stores logged-in user info, JWT token, and role globally
 * DEPENDS ON: zustand, zustand/middleware persist
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

let hydrateAuthStoreState;

const DEV_MODE = import.meta.env.DEV && String(import.meta.env.VITE_DEV_AUTH_MODE || "false").toLowerCase() === "true";
const DEV_ROLE = String(import.meta.env.VITE_DEV_AUTH_ROLE || "student").toLowerCase() === "recruiter"
  ? "recruiter"
  : "student";

const DEV_USER = {
  name: DEV_ROLE === "recruiter" ? "Recruiter Account" : "Student Account",
  email: DEV_ROLE === "recruiter" ? "recruiter@local.dev" : "student@local.dev",
  role: DEV_ROLE,
};

const getInitialAuthState = () => {
  if (DEV_MODE) {
    return {
      user: DEV_USER,
      token: null,
      refreshToken: null,
      isAuthenticated: true,
      rehydrated: true,
    };
  }

  return {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    rehydrated: false,
  };
};

export const useAuthStore = create(persist((set) => {
  hydrateAuthStoreState = set;

  return {
    ...getInitialAuthState(),
    setAuth: (user, token, refreshToken) => set({
      user,
      token,
      refreshToken,
      isAuthenticated: true,
      rehydrated: true,
    }),
    clearAuth: () => set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      rehydrated: true,
    }),
    setRehydrated: (rehydrated) => set({ rehydrated: Boolean(rehydrated) }),
    updateUser: (userUpdates) => set((state) => ({
      user: { ...state.user, ...userUpdates }
    })),
  };
}, {
  name: "talentsync-auth",
  merge: (persistedState, currentState) => {
    if (DEV_MODE) {
      return currentState;
    }
    return {
      ...currentState,
      ...(persistedState || {}),
      rehydrated: false,
    };
  },
  onRehydrateStorage: () => (state) => {
    state?.setRehydrated?.(true);
    hydrateAuthStoreState?.({ rehydrated: true });
  },
}));