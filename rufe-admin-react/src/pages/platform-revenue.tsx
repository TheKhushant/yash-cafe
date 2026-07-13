// src/routes/_authenticated.platform-revenue.tsx
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, CartesianGrid
} from "recharts";

import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { PageSkeleton } from "@/components/shared/Skeletons";
import { formatCurrency, formatNumber } from "@/lib/format";
import { analyticsService } from "@/lib/api/services/service";

export default function PlatformRevenuePage() {
  const platformRevenue = useQuery({
    queryKey: ["platform-revenue"],
    queryFn: () => analyticsService.getPlatformRevenue(), // Platform-wide
  });

  if (platformRevenue.isLoading) return <PageSkeleton />;

  const data = platformRevenue.data || {
    totalRevenue: 1248900,
    revenueChange: 18.5,
    totalOrders: 45230,
    avgOrderValue: 27.6,
    monthlyRevenue: [],
    topVenues: []
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform Revenue"
        description="Overall financial performance across all bars"
        icon={DollarSign}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          label="Total Revenue" 
          value={formatCurrency(data.totalRevenue)} 
          change={data.revenueChange} 
          icon={TrendingUp} 
          tone="success" 
        />
        <KpiCard 
          label="Total Orders" 
          value={formatNumber(data.totalOrders)} 
          icon={BarChart3} 
          tone="primary" 
        />
        <KpiCard 
          label="Avg Order Value" 
          value={formatCurrency(data.avgOrderValue)} 
          icon={DollarSign} 
          tone="info" 
        />
        <KpiCard 
          label="Active Venues" 
          value="24" 
          icon={TrendingUp} 
          tone="warning" 
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Trend */}
        <div className="lg:col-span-4 card p-6">
          <h3 className="font-semibold mb-4">Platform Revenue Trend</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `$${(v/1000)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#2563eb" 
                  fill="#3b82f6" 
                  fillOpacity={0.3} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing Venues */}
        <div className="lg:col-span-3 card p-6">
          <h3 className="font-semibold mb-4">Top Performing Bars</h3>
          <div className="space-y-4">
            {(data.topVenues || []).map((venue: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div>
                  <div className="font-medium">{venue.name}</div>
                  <div className="text-sm text-muted-foreground">{venue.city}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(venue.revenue)}</div>
                  <div className="text-xs text-emerald-600">+{venue.growth}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}