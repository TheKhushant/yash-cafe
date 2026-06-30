import type { Order, OrderStatus } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db } from "../mock-data";

// venueId null => all venues (super admin)
function scoped(venueId: string | null): Order[] {
  const all = db().orders;
  return venueId ? all.filter((o) => o.venueId === venueId) : all;
}

export const ordersService = {
  async list(venueId: string | null): Promise<Order[]> {
    if (USE_MOCKS) {
      return delay([...scoped(venueId)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }
    const { data } = await apiClient.get<Order[]>("/orders", { params: { venueId } });
    return data;
  },

  async get(id: string): Promise<Order | undefined> {
    if (USE_MOCKS) return delay(db().orders.find((o) => o.id === id));
    const { data } = await apiClient.get<Order>(`/orders/${id}`);
    return data;
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    if (USE_MOCKS) {
      const order = db().orders.find((o) => o.id === id);
      if (!order) throw new Error("Order not found");
      order.status = status;
      return delay({ ...order }, 250);
    }
    const { data } = await apiClient.patch<Order>(`/orders/${id}/status`, { status });
    return data;
  },
};
