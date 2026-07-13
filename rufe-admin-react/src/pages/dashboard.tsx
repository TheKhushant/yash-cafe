import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CalendarDays,
  CircleDollarSign,
  PackageX,
  QrCode,
  Receipt,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { KpiCard } from "@/components/shared/KpiCard";
import { KpiSkeleton } from "@/components/shared/Skeletons";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardService } from "@/lib/api/services/dashboard.service";
import { analyticsService } from "@/lib/api/services/service";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";

const QUICK_ACTIONS = [
  { label: "New Event", to: "/events", icon: CalendarDays },
  { label: "Add Menu Item", to: "/menu", icon: UtensilsCrossed },
  { label: "Scan Ticket", to: "/scanner", icon: QrCode },
  { label: "View Orders", to: "/orders", icon: Receipt },
] as const;

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const venueScope = useAuthStore((s) => s.venueScope);
  const scope = venueScope();

  const stats = useQuery({
    queryKey: ["dashboard-stats", scope],
    queryFn: () => dashboardService.stats(scope),
  });

  const activity = useQuery({
    queryKey: ["dashboard-activity", scope],
    queryFn: () => dashboardService.activity(scope),
  });

  const analytics = useQuery({
    queryKey: ["dashboard-analytics", scope],
    queryFn: () => analyticsService.get(scope, 14),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] ?? "there"}!`}
        description={
          user?.role === "super_admin"
            ? "Platform-wide overview across all venues."
            : user?.venueName ?? "Your venue at a glance."
        }
      />

      {/* KPI Cards */}
      {stats.isLoading || !stats.data ? (
        <KpiSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard 
            label="Revenue" 
            value={formatCurrency(stats.data.revenue)} 
            icon={CircleDollarSign} 
            change={stats.data.revenueChange} 
            tone="success" 
          />
          <KpiCard 
            label="Orders" 
            value={formatNumber(stats.data.orders)} 
            icon={Receipt} 
            change={stats.data.ordersChange} 
            tone="primary" 
          />
          <KpiCard 
            label="Active Events" 
            value={formatNumber(stats.data.activeEvents)} 
            icon={CalendarDays} 
            tone="info" 
            hint="published" 
          />
          <KpiCard 
            label="Users" 
            value={formatNumber(stats.data.users)} 
            icon={UsersRound} 
            change={stats.data.usersChange} 
            tone="primary" 
          />
          <KpiCard 
            label="Inventory Alerts" 
            value={formatNumber(stats.data.inventoryAlerts)} 
            icon={PackageX} 
            tone="warning" 
            hint="low / out of stock" 
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Revenue & Orders</CardTitle>
            <p className="text-sm text-muted-foreground">Last 14 days performance</p>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              {analytics.data ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.data.series} margin={{ left: -16, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      tickLine={false} 
                      axisLine={false} 
                      fontSize={13} 
                      stroke="#64748b" 
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      fontSize={13} 
                      stroke="#64748b" 
                      width={48} 
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        background: "#ffffff",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        fontSize: 13,
                      }}
                      formatter={(v: number, n: string) => [
                        n === "revenue" ? formatCurrency(v) : v,
                        n === "revenue" ? "Revenue" : "Orders",
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      fill="url(#rev)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-2 space-y-3">
              {(activity.data ?? []).map((a) => (
                <div 
                  key={a.id} 
                  className="flex items-start gap-4 rounded-xl px-4 py-3 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Activity className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{a.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {QUICK_ACTIONS.map((a) => (
              <Button 
                key={a.to} 
                variant="outline" 
                asChild 
                className="h-auto justify-start gap-3 py-6 text-left hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all"
              >
                <Link to={a.to}>
                  <a.icon className="size-5 text-primary" />
                  <span className="font-medium">{a.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}