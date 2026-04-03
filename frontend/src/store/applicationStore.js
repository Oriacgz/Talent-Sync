/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Stores application data and handles badges
 * DEPENDS ON: zustand
 */
import { create } from "zustand";

export const useApplicationStore = create((set) => ({
  applications: [],
  isLoading: false,
  error: null,
  setApplications: (applications) => set({ applications: Array.isArray(applications) ? applications : [] }),
  setLoading: (isLoading) => set({ isLoading: Boolean(isLoading) }),
  setError: (error) => set({ error: error || null }),
  clearApplications: () => set({ applications: [], error: null, isLoading: false }),
}));
