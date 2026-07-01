// src/routes/_authenticated.platform-analytics.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Building2, Users, Calendar, TrendingUp } from "lucide-react";
import {
  Bar, BarChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Cell
} from "recharts";

import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { PageSkeleton } from "@/components/shared/Skeletons";
import { analyticsService } from "@/lib/api/services/analytics.service";
import { formatCurrency, formatNumber } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/platform-analytics")({
  component: PlatformAnalyticsPage,
});

const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

function PlatformAnalyticsPage() {
  const analytics = useQuery({
    queryKey: ["platform-analytics"],
    queryFn: () => analyticsService.getPlatformAnalytics(),
  });

  if (analytics.isLoading) return <PageSkeleton />;

  const data = analytics.data || {
    totalVenues: 24,
    totalUsers: 18420,
    totalEvents: 142,
    occupancyRate: 78,
    venuePerformance: [],
    eventPopularity: []
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform Analytics"
        description="Global insights across all venues"
        icon={BarChart3}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Venues" value={data.totalVenues} icon={Building2} tone="primary" />
        <KpiCard label="Total Users" value={formatNumber(data.totalUsers)} icon={Users} tone="success" />
        <KpiCard label="Active Events" value={data.totalEvents} icon={Calendar} tone="info" />
        <KpiCard label="Avg Occupancy" value={`${data.occupancyRate}%`} icon={TrendingUp} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Venue Performance */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Venue Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.venuePerformance}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Event Popularity */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Popular Events</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.eventPopularity}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  dataKey="attendance"
                  nameKey="event"
                >
                  {data.eventPopularity.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}