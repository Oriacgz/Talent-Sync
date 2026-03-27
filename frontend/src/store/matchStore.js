/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Stores match results and the currently selected match
 * DEPENDS ON: zustand
 */
import { create } from "zustand";
export const useMatchStore = create((set) => ({
  matches: [],
  activeMatch: null,
  isLoading: false,
  error: null,
  setMatches: (matches) => set({ matches: Array.isArray(matches) ? matches : [] }),
  setActiveMatch: (activeMatch) => set({ activeMatch: activeMatch || null }),
  setLoading: (isLoading) => set({ isLoading: Boolean(isLoading) }),
  setError: (error) => set({ error: error || null }),
  clearMatches: () => set({ matches: [], activeMatch: null, error: null, isLoading: false }),
}));