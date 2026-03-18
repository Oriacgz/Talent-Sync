/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Stores match results and the currently selected match
 * DEPENDS ON: zustand
 */
import { create } from "zustand";
export const useMatchStore = create(() => ({
  matches: [],
  activeMatch: null,
  isLoading: false,
  error: null,
  setMatches: () => {},
  setActiveMatch: () => {},
  setLoading: () => {},
  setError: () => {},
  clearMatches: () => {},
}));