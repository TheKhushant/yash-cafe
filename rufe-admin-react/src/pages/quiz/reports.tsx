import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Percent, Timer, Users } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { KpiSkeleton } from "@/components/shared/Skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { quizReportsService, exportRowsAsCsv } from "@/lib/api/services/quiz-reports";
import { formatNumber } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";

export default function QuizReportsPage() {
  const scope = useAuthStore((s) => s.venueScope)();
  const report = useQuery({ queryKey: ["quiz-reports", scope], queryFn: () => quizReportsService.summary(scope) });

  function handleExport(format: "CSV" | "PDF" | "Excel") {
    if (!report.data) return;
    if (format !== "CSV") {
      toast.info(`${format} export requires an additional library (jspdf / xlsx) — not yet wired up. Exporting CSV instead.`);
    }
    exportRowsAsCsv("quiz-top-players", report.data.topPlayers.map((p) => ({ Player: p.name, Score: p.score })));
  }

  const data = report.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Participation, accuracy, and performance analytics."
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline"><Download className="size-4" /> Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("CSV")}>Export CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("Excel")}>Export Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("PDF")}>Export PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {report.isLoading || !data ? (
        <KpiSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard label="Total Participation" value={formatNumber(data.totalParticipation)} icon={Users} tone="primary" hint="unique players" />
          <KpiCard label="Accuracy Rate" value={`${data.accuracyRate}%`} icon={Percent} tone="success" hint="answers correct" />
          <KpiCard label="Avg Response Time" value={`${(data.avgResponseTimeMs / 1000).toFixed(1)}s`} icon={Timer} tone="info" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-lg">Participation</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {data && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.participationSeries} margin={{ left: -16, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={13} stroke="#64748b" />
                    <YAxis tickLine={false} axisLine={false} fontSize={13} stroke="#64748b" width={40} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13 }} />
                    <Bar dataKey="players" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-lg">Accuracy</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {data && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.accuracySeries} margin={{ left: -16, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="repAcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={13} stroke="#64748b" />
                    <YAxis tickLine={false} axisLine={false} fontSize={13} stroke="#64748b" width={40} unit="%" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13 }} />
                    <Area type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={3} fill="url(#repAcc)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-lg">Most Missed Questions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data?.mostMissedQuestions ?? []).map((q) => (
              <div key={q.questionId} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                <span className="truncate">{q.text}</span>
                <span className="shrink-0 font-medium text-destructive">{q.missRate}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Top Players</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data?.topPlayers ?? []).map((p, idx) => (
              <div key={p.playerId} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span>#{idx + 1} {p.name}</span>
                <span className="font-medium text-foreground">{p.score.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Top Categories</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data?.topCategories ?? []).map((c) => (
              <div key={c.category} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span>{c.category}</span>
                <span className="font-medium text-foreground">{c.plays} quizzes</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}