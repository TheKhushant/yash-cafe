import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { Podium } from "@/components/quiz/Podium";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { leaderboardService, type LeaderboardPeriod } from "@/lib/api/services/leaderboard";
import type { LeaderboardEntry } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

const PERIODS: LeaderboardPeriod[] = ["Current Session", "Today", "Weekly", "Monthly"];

function RankChange({ value }: { value: number }) {
  if (value > 0) return <span className="inline-flex items-center gap-1 text-success"><ArrowUp className="size-3.5" />{value}</span>;
  if (value < 0) return <span className="inline-flex items-center gap-1 text-destructive"><ArrowDown className="size-3.5" />{Math.abs(value)}</span>;
  return <span className="inline-flex items-center gap-1 text-muted-foreground"><Minus className="size-3.5" /></span>;
}

export default function LeaderboardPage() {
  const scope = useAuthStore((s) => s.venueScope)();
  const [period, setPeriod] = useState<LeaderboardPeriod>("Current Session");

  const leaderboard = useQuery({
    queryKey: ["quiz-leaderboard", scope, period],
    queryFn: () => leaderboardService.getForPeriod(scope, period),
  });

  const columns: Column<LeaderboardEntry>[] = [
    { key: "rank", header: "Rank", render: (e) => <span className="font-semibold text-foreground">#{e.rank}</span>, sortValue: (e) => e.rank },
    { key: "playerName", header: "Player", render: (e) => <span className="font-medium text-foreground">{e.playerName}</span>, sortValue: (e) => e.playerName },
    { key: "score", header: "Score", render: (e) => e.score.toLocaleString(), sortValue: (e) => e.score },
    { key: "correctAnswers", header: "Correct Answers", sortValue: (e) => e.correctAnswers },
    { key: "fastestResponseMs", header: "Fastest Response", render: (e) => `${e.fastestResponseMs}ms`, sortValue: (e) => e.fastestResponseMs },
    { key: "rankChange", header: "Rank Movement", render: (e) => <RankChange value={e.rankChange} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Leaderboard" description="Real-time ranking across your quizzes." />

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Top 3</CardTitle>
          <Select value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {leaderboard.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <Podium entries={leaderboard.data ?? []} />
          )}
        </CardContent>
      </Card>

      {leaderboard.isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          data={leaderboard.data ?? []}
          columns={columns}
          rowKey={(e) => e.playerId}
          searchKeys={["playerName"]}
          searchPlaceholder="Search players…"
          emptyMessage={period === "Current Session" ? "No quiz is currently live." : "No data for this period."}
        />
      )}
    </div>
  );
}