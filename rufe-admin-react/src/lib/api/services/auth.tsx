import type { AuthUser, LoginResponse, Role } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";

// Demo accounts for mock mode
const DEMO_ACCOUNTS: Array<{ password: string; user: AuthUser }> = [
  {
    password: "password",
    user: {
      id: "admin-1",
      name: "Demo Admin",
      email: "admin@sportsbar.app",
      role: "admin",
      venueId: "venue-1",
      venueName: "The Endzone Sports Bar",
    },
  },
  {
    password: "password",
    user: {
      id: "super-1",
      name: "Platform Owner",
      email: "super@sportsbar.app",
      role: "super_admin",
      venueId: null,
      venueName: null,
    },
  },
];

function fakeJwt(user: AuthUser): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({ sub: user.id, role: user.role, email: user.email, exp: Date.now() + 86_400_000 }),
  );
  return `${header}.${payload}.mock-signature`;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    if (USE_MOCKS) {
      const match = DEMO_ACCOUNTS.find(
        (a) => a.user.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
      );
      if (!match) {
        await delay(null, 400);
        throw new Error("Invalid email or password");
      }
      return delay({ token: fakeJwt(match.user), user: match.user });
    }
    const { data } = await apiClient.post<LoginResponse>("/auth/login", { email, password });
    return data;
  },
  

  async me(): Promise<AuthUser> {
    if (USE_MOCKS) {
      return delay(DEMO_ACCOUNTS[0].user);
    }
    const { data } = await apiClient.get<AuthUser>("/auth/me");
    return data;
  },
};

  export function useAuth() {
    return {
      user: {
        id: "1",
        name: "Admin",
        email: "admin@example.com",
        role: "admin",
      },

      isAuthenticated: true,
      loading: false,

      logout() {
        localStorage.removeItem("token");
        window.location.href = "/login";
      },
    };
  }

export const DEMO_LOGINS: Array<{ label: string; email: string; password: string; role: Role }> = [
  { label: "Admin", email: "admin@sportsbar.app", password: "password", role: "admin" },
  { label: "Super Admin", email: "super@sportsbar.app", password: "password", role: "super_admin" },
];
