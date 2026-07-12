import type { AnalyticsData, AttendancePoint, PopularItem, TimeSeriesPoint } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db } from "../mock-data";

function buildSeries(days: number): TimeSeriesPoint[] {
  const out: TimeSeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const base = 1800 + Math.round(Math.sin(i / 2) * 600 + (days - i) * 35);
    const orders = 22 + Math.round(Math.cos(i / 3) * 8 + (days - i) * 0.4);
    out.push({
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: Math.max(400, base),
      orders: Math.max(6, orders),
    });
  }
  return out;
}

export const analyticsService = {
  async get(venueId: string | null, rangeDays = 14): Promise<AnalyticsData> {
    if (USE_MOCKS) {
      const series = buildSeries(rangeDays);

      const events = (venueId ? db().events.filter((e) => e.venueId === venueId) : db().events)
        .filter((e) => e.status === "Published");
      const attendance: AttendancePoint[] = events.map((e) => ({
        event: e.title.length > 22 ? e.title.slice(0, 22) + "…" : e.title,
        attendance: e.attendance,
        capacity: e.capacity,
      }));

      const counter = new Map<string, PopularItem>();
      const orders = venueId ? db().orders.filter((o) => o.venueId === venueId) : db().orders;
      for (const o of orders) {
        if (o.status === "Cancelled") continue;
        for (const it of o.items) {
          const cur = counter.get(it.name) ?? { name: it.name, sold: 0, revenue: 0 };
          cur.sold += it.quantity;
          cur.revenue += it.quantity * it.price;
          counter.set(it.name, cur);
        }
      }
      const popularItems = [...counter.values()].sort((a, b) => b.sold - a.sold).slice(0, 6);

      const totalRevenue = series.reduce((s, p) => s + p.revenue, 0);
      const totalOrders = series.reduce((s, p) => s + p.orders, 0);

      return delay({
        series,
        attendance,
        popularItems,
        totalRevenue,
        totalOrders,
        avgOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
        totalAttendance: attendance.reduce((s, a) => s + a.attendance, 0),
      });
    }
    const { data } = await apiClient.get<AnalyticsData>("/analytics", {
      params: { venueId, rangeDays },
    });
    
    return data;
  },
  async getPlatformAnalytics() {
      const { data } = await apiClient.get("/platform/analytics");
      return data;
  },
  async getPlatformRevenue() {
    if (USE_MOCKS) {
      return delay({
        totalRevenue: 1248900,
        revenueChange: 18.5,
        totalOrders: 45230,
        avgOrderValue: 27.6,

        monthlyRevenue: [
          { month: "Jan", revenue: 98000 },
          { month: "Feb", revenue: 112000 },
          { month: "Mar", revenue: 125000 },
          { month: "Apr", revenue: 138000 },
          { month: "May", revenue: 149000 },
          { month: "Jun", revenue: 162000 },
        ],

        topVenues: [
          {
            name: "Downtown Sports Bar",
            city: "New York",
            revenue: 218000,
            growth: 18,
          },
          {
            name: "Arena Lounge",
            city: "Chicago",
            revenue: 197000,
            growth: 15,
          },
          {
            name: "Champions Pub",
            city: "Los Angeles",
            revenue: 181000,
            growth: 12,
          },
        ],
      });
    }

    const { data } = await apiClient.get("/platform/revenue");

    return data;
  }
};
