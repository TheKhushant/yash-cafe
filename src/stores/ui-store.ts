import { create } from "zustand";

interface UiState {
  sidebarCollapsed: boolean;
  mobileOpen: boolean;
  toggleSidebar: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileOpen: (open) => set({ mobileOpen: open }),
}));
