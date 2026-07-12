import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Card } from "@/components/ui/card";
import { dashboardService } from "@/lib/api/services/dashboard.service";
import { analyticsService } from "@/lib/api/services/service";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const QUICK_ACTIONS = [
  { label: "New Event", to: "/events", icon: CalendarDays },
  { label: "Add Menu Item", to: "/menu", icon: UtensilsCrossed },
  { label: "Scan Ticket", to: "/scanner", icon: QrCode },
  { label: "View Orders", to: "/orders", icon: Receipt },
] as const;

function DashboardPage() {
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
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] ?? "there"}`}
        description={
          user?.role === "super_admin"
            ? "Platform-wide overview across all venues."
            : user?.venueName ?? "Your venue at a glance."
        }
      />

      {stats.isLoading || !stats.data ? (
        <KpiSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard label="Revenue" value={formatCurrency(stats.data.revenue)} icon={CircleDollarSign} change={stats.data.revenueChange} tone="success" />
          <KpiCard label="Orders" value={formatNumber(stats.data.orders)} icon={Receipt} change={stats.data.ordersChange} tone="primary" />
          <KpiCard label="Active Events" value={formatNumber(stats.data.activeEvents)} icon={CalendarDays} tone="info" hint="published" />
          <KpiCard label="Users" value={formatNumber(stats.data.users)} icon={UsersRound} change={stats.data.usersChange} tone="primary" />
          <KpiCard label="Inventory Alerts" value={formatNumber(stats.data.inventoryAlerts)} icon={PackageX} tone="warning" hint="low / out of stock" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Revenue & Orders</h3>
              <p className="text-sm text-muted-foreground">Last 14 days</p>
            </div>
          </div>
          <div className="mt-4 h-72 w-full">
            {analytics.data ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.data.series} margin={{ left: -16, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" interval="preserveStartEnd" />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" width={48} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--popover)",
                      fontSize: 12,
                    }}
                    formatter={(v: number, n) => [n === "revenue" ? formatCurrency(v) : v, n === "revenue" ? "Revenue" : "Orders"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-base font-semibold">Recent Activity</h3>
          <div className="mt-4 space-y-1">
            {(activity.data ?? []).map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Activity className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="text-base font-semibold">Quick Actions</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Button key={a.to} variant="outline" asChild className="h-auto justify-start gap-3 py-3">
              <Link to={a.to}>
                <a.icon className="size-4 text-primary" />
                {a.label}
              </Link>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
