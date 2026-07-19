import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Award, BrainCircuit, Gamepad2, HelpCircle, Radio, Trophy, Users,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { KpiCard } from "@/components/shared/KpiCard";
import { KpiSkeleton } from "@/components/shared/Skeletons";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { quizService } from "@/lib/api/services/quiz";
import { questionService } from "@/lib/api/services/questions";
import { quizPlayerService } from "@/lib/api/services/quiz-players";
import { rewardService } from "@/lib/api/services/rewards";
import { quizReportsService } from "@/lib/api/services/quiz-reports";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";

export default function QuizDashboardPage() {
  const scope = useAuthStore((s) => s.venueScope)();

  const quizzes = useQuery({ queryKey: ["quiz-dashboard", "quizzes", scope], queryFn: () => quizService.list(scope) });
  const questions = useQuery({ queryKey: ["quiz-dashboard", "questions", scope], queryFn: () => questionService.list(scope) });
  const players = useQuery({ queryKey: ["quiz-dashboard", "players", scope], queryFn: () => quizPlayerService.list(scope) });
  const rewards = useQuery({ queryKey: ["quiz-dashboard", "rewards", scope], queryFn: () => rewardService.list(scope) });
  const report = useQuery({ queryKey: ["quiz-dashboard", "report", scope], queryFn: () => quizReportsService.summary(scope) });

  const loading = quizzes.isLoading || questions.isLoading || players.isLoading || rewards.isLoading;

  const allQuizzes = quizzes.data ?? [];
  const liveQuiz = allQuizzes.find((q) => q.status === "Live");
  const activePlayers = (players.data ?? []).filter((p) => p.connectionStatus === "Connected" && p.status === "Active").length;
  const avgScore = report.data && report.data.topPlayers.length > 0
    ? Math.round(report.data.topPlayers.reduce((s, p) => s + p.score, 0) / report.data.topPlayers.length)
    : 0;

  const recentQuizzes = [...allQuizzes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const upcoming = [...allQuizzes]
    .filter((q) => new Date(q.startDate).getTime() > Date.now() && q.status !== "Archived")
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 5);
  const recentWinners = [...(rewards.data ?? [])].filter((r) => r.rank === 1).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quiz Dashboard"
        description="Overview of your Kahoot-style quiz activity."
        actions={
          <Button asChild>
            <Link to="/quiz/live"><Radio className="size-4" /> Go Live</Link>
          </Button>
        }
      />

      {loading ? (
        <KpiSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <KpiCard label="Total Quizzes" value={formatNumber(allQuizzes.length)} icon={Gamepad2} tone="primary" hint="in library" />
          <KpiCard
            label="Live Quiz"
            value={liveQuiz ? "1" : "0"}
            icon={Radio}
            {...(liveQuiz ? { tone: "success" as const } : {})}
            hint={liveQuiz?.name ?? "none running"}
          />
          <KpiCard label="Active Players" value={formatNumber(activePlayers)} icon={Users} tone="info" hint="connected now" />
          <KpiCard label="Total Questions" value={formatNumber((questions.data ?? []).length)} icon={HelpCircle} tone="primary" hint="in question bank" />
          <KpiCard label="Rewards Distributed" value={formatNumber((rewards.data ?? []).filter((r) => r.status === "Delivered").length)} icon={Award} tone="success" hint="delivered" />
          <KpiCard label="Average Score" value={formatNumber(avgScore)} icon={Trophy} tone="warning" hint="top players avg" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Quiz Activity</CardTitle>
            <p className="text-sm text-muted-foreground">Sessions run per day, last 14 days</p>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              {report.data ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.data.participationSeries} margin={{ left: -16, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={13} stroke="#64748b" />
                    <YAxis tickLine={false} axisLine={false} fontSize={13} stroke="#64748b" width={40} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13 }}
                    />
                    <Bar dataKey="players" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Players" />
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Participation</CardTitle>
            <p className="text-sm text-muted-foreground">Accuracy trend, last 14 days</p>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              {report.data ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.data.accuracySeries} margin={{ left: -16, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="acc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={13} stroke="#64748b" />
                    <YAxis tickLine={false} axisLine={false} fontSize={13} stroke="#64748b" width={40} unit="%" />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13 }}
                      formatter={(v: number) => [`${v}%`, "Accuracy"]}
                    />
                    <Area type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={3} fill="url(#acc)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-lg">Recent Quizzes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentQuizzes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quizzes yet.</p>
            ) : recentQuizzes.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{q.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(q.createdAt)}</p>
                </div>
                <StatusBadge status={q.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-lg">Upcoming Scheduled Quizzes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            ) : upcoming.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{q.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(q.startDate)}</p>
                </div>
                <BrainCircuit className="size-4 shrink-0 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-lg">Recent Winners</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentWinners.length === 0 ? (
              <p className="text-sm text-muted-foreground">No winners yet.</p>
            ) : recentWinners.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Trophy className="size-4 shrink-0 text-amber-500" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{r.playerName}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.quizName}</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{r.type}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}