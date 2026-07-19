// src/stores/ui-store.ts
import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface UiStore {
  sidebarCollapsed: boolean;
  mobileOpen: boolean;
  theme: Theme;
  
  toggleSidebar: () => void;
  setMobileOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarCollapsed: false,
  mobileOpen: false,
  theme: 'light', // Default = Light

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileOpen: (open) => set({ mobileOpen: open }),
  toggleTheme: () => set((s) => {
    const newTheme = s.theme === 'light' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    return { theme: newTheme };
  }),
  setTheme: (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },
}));