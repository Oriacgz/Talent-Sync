/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Controls sidebar open/close and global loading state
 * DEPENDS ON: zustand
 */
import { create } from "zustand";
export const useUIStore = create((set) => ({
  sidebarOpen: true,
  mobileSidebarOpen: false,
  globalLoading: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
  resetUIState: () => set({ sidebarOpen: true, mobileSidebarOpen: false, globalLoading: false }),
  setGlobalLoading: (globalLoading) => set({ globalLoading: Boolean(globalLoading) }),
}));