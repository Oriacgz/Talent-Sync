/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Controls sidebar open/close and global loading state
 * DEPENDS ON: zustand
 */
import { create } from "zustand";
export const useUIStore = create(() => ({
  sidebarOpen: true,
  globalLoading: false,
  toggleSidebar: () => {},
  setGlobalLoading: () => {},
}));