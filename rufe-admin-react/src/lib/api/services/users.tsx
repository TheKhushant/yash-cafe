import type { Booking, Order, PlatformUser } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db, uid } from "../mock-data";

function scoped(venueId: string | null): PlatformUser[] {
  const all = db().users;
  return venueId ? all.filter((u) => u.venueId === venueId) : all;
}

/** Joins each user with their current assigned offers from the flat relationship table. */
function withAssignedOffers(users: PlatformUser[]): PlatformUser[] {
  return users.map((u) => ({
    ...u,
    assignedOffers: db().assignedOffers.filter((a) => a.userId === u.id),
  }));
}

export const usersService = {
  async list(venueId: string | null): Promise<PlatformUser[]> {
    if (USE_MOCKS) return delay(withAssignedOffers(scoped(venueId)));
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

  async listPlatform(): Promise<PlatformUser[]> {
    if (USE_MOCKS) {
      return delay(
        db().users.filter(
          (u) => u.role === "admin" || u.role === "super_admin"
        )
      );
    }
    const { data } = await apiClient.get<PlatformUser[]>("/platform/users");
    return data;
  },

  async createPlatform(data: { name: string; email: string; role: string }) {
    if (USE_MOCKS) {
      const newUser: PlatformUser = {
        id: uid("user"),
        name: data.name,
        email: data.email,
        status: "Active",
        joinedAt: new Date().toISOString(),
        totalBookings: 0,
        totalOrders: 0,
        venueId: null,
        role: data.role as any,
      };
      db().users.push(newUser);
      return delay(newUser);
    }
    const { data: user } = await apiClient.post("/platform/users", data);
    return user;
  },

  async setPlatformStatus(id: string, status: "Active" | "Blocked") {
    if (USE_MOCKS) {
      const user = db().users.find(u => u.id === id);
      if (user) user.status = status;
      return delay(user!);
    }
    const { data } = await apiClient.patch(`/platform/users/${id}/status`, { status });
    return data;
  },
};