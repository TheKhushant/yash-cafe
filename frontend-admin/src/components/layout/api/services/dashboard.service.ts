import type { ActivityEntry, DashboardStats } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db } from "../mock-data";

export const dashboardService = {
  async stats(venueId: string | null): Promise<DashboardStats> {
    if (USE_MOCKS) {
      const orders = venueId ? db().orders.filter((o) => o.venueId === venueId) : db().orders;
      const events = venueId ? db().events.filter((e) => e.venueId === venueId) : db().events;
      const users = venueId ? db().users.filter((u) => u.venueId === venueId) : db().users;
      const menu = venueId ? db().menu.filter((m) => m.venueId === venueId) : db().menu;

      const revenue = orders
        .filter((o) => o.status !== "Cancelled")
        .reduce((s, o) => s + o.total, 0);
      const inventoryAlerts = menu.filter((m) => m.outOfStock || m.stock <= 5).length;

      return delay({
        revenue,
        revenueChange: 12.4,
        orders: orders.length,
        ordersChange: 8.1,
        activeEvents: events.filter((e) => e.status === "Published").length,
        users: users.length,
        usersChange: 5.3,
        inventoryAlerts,
      });
    }
    const { data } = await apiClient.get<DashboardStats>("/dashboard/stats", {
      params: { venueId },
    });
    return data;
  },

  async activity(venueId: string | null): Promise<ActivityEntry[]> {
    if (USE_MOCKS) {
      const orders = (venueId ? db().orders.filter((o) => o.venueId === venueId) : db().orders)
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6);
      const fmt = (iso: string) => {
        const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
        if (mins < 60) return `${mins}m ago`;
        return `${Math.round(mins / 60)}h ago`;
      };
      const entries: ActivityEntry[] = orders.map((o) => ({
        id: o.id,
        icon: o.status === "Cancelled" ? "x" : "receipt",
        text: `Order ${o.id} • ${o.customerName} • ${o.status}`,
        time: fmt(o.createdAt),
      }));
      return delay(entries);
    }
    const { data } = await apiClient.get<ActivityEntry[]>("/dashboard/activity", {
      params: { venueId },
    });
    return data;
  },
};
