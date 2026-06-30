// Create /home/workdir/attachments/yash-cafe-main/src/routes/_authenticated.analytics.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, Calendar } from "lucide-react";
import {
  Bar, BarChart, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Cell
} from "recharts";

import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { PageSkeleton } from "@/components/shared/Skeletons";
import { analyticsService } from "@/lib/api/services/analytics.service";
import { useAuthStore } from "@/stores/auth-store";
import { formatCurrency, formatNumber } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

function AnalyticsPage() {
  const scope = useAuthStore((s) => s.venueScope)();
  
  const analytics = useQuery({
    queryKey: ["analytics", scope],
    queryFn: () => analyticsService.get(scope, 30),
  });

  if (analytics.isLoading) return <PageSkeleton />;

  const data = analytics.data || {
    series: [],
    attendance: [],
    popularItems: [],
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalAttendance: 0
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Analytics" 
        description="Performance overview and insights" 
        // icon={BarChart3}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Revenue" value={formatCurrency(data.totalRevenue)} icon={TrendingUp} tone="success" />
        <KpiCard label="Total Orders" value={formatNumber(data.totalOrders)} icon={BarChart3} tone="primary" />
        <KpiCard label="Attendance" value={formatNumber(data.totalAttendance)} icon={Users} tone="info" />
        <KpiCard label="Avg Order" value={formatCurrency(data.avgOrderValue)} icon={Calendar} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Revenue Trend (Last 30 Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.series}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Items */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Top Menu Items</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.popularItems.slice(0, 5)}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sold" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Attendance & Occupancy */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Event Attendance</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.attendance}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={140}
                dataKey="attendance"
                nameKey="event"
              >
                {data.attendance.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}