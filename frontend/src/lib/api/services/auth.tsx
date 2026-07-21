import type { AuthUser, LoginResponse } from "@/types";
import { apiClient } from "../client";

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post("/auth/login", {
      email,
      password,
    });

    return {
      token: data.token,
      user: data.user,
    };
  },

  async me(): Promise<AuthUser> {
    const { data } = await apiClient.get("/auth/me");
    return data.user;
  },
};