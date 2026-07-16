import { create } from "zustand";
import type { AuthUser } from "@/types";
import { authService } from "@/lib/api/services/auth";
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "@/lib/api/client";

const USER_KEY = "sba_user";

function loadUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser, remember: boolean) {
  if (typeof window === "undefined") return;
  const value = JSON.stringify(user);
  if (remember) {
    localStorage.setItem(USER_KEY, value);
    sessionStorage.removeItem(USER_KEY);
  } else {
    sessionStorage.setItem(USER_KEY, value);
    localStorage.removeItem(USER_KEY);
  }
}

function clearUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
}

interface AuthState {
  user: AuthUser | null;
  hydrated: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<AuthUser>;
  logout: () => void;
  hydrate: () => void;
  /** null venueId for super admin (sees all venues) */
  venueScope: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  hydrated: false,
  isAuthenticated: false,

  hydrate: () => {
    const token = getStoredToken();
    const user = loadUser();
    set({
      user: token && user ? user : null,
      isAuthenticated: Boolean(token && user),
      hydrated: true,
    });
  },

  login: async (email, password, remember) => {
    const { token, user } = await authService.login(email, password);
    setStoredToken(token, remember);
    persistUser(user, remember);
    set({ user, isAuthenticated: true, hydrated: true });
    return user;
  },

  logout: () => {
    clearStoredToken();
    clearUser();
    set({ user: null, isAuthenticated: false });
  },

  venueScope: () => {
    const user = get().user;
    if (!user) return null;
    return user.role === "super_admin" ? null : user.venueId;
  },
}));
