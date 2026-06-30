import type { Booking, Order, PlatformUser } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db } from "../mock-data";

function scoped(venueId: string | null): PlatformUser[] {
  const all = db().users;
  return venueId ? all.filter((u) => u.venueId === venueId) : all;
}

export const usersService = {
  async list(venueId: string | null): Promise<PlatformUser[]> {
    if (USE_MOCKS) return delay([...scoped(venueId)]);
    const { data } = await apiClient.get<PlatformUser[]>("/users", { params: { venueId } });
    return data;
  },

  async setStatus(id: string, status: PlatformUser["status"]): Promise<PlatformUser> {
    if (USE_MOCKS) {
      const user = db().users.find((u) => u.id === id);
      if (!user) throw new Error("User not found");
      user.status = status;
      return delay({ ...user }, 200);
    }
    const { data } = await apiClient.patch<PlatformUser>(`/users/${id}/status`, { status });
    return data;
  },

  async history(userId: string): Promise<{ bookings: Booking[]; orders: Order[] }> {
    if (USE_MOCKS) {
      const user = db().users.find((u) => u.id === userId);
      const bookings = db().bookings.filter((b) => b.userId === userId);
      const orders = db()
        .orders.filter((o) => user && o.customerName === user.name)
        .slice(0, 8);
      return delay({ bookings, orders });
    }
    const { data } = await apiClient.get(`/users/${userId}/history`);
    return data;
  },
};
