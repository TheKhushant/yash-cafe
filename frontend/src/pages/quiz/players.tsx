import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Trophy, UserCheck, Users, Wifi } from "lucide-react";

import { DataTable, type Column } from "@/components/shared/DataTable";
import { KpiCard } from "@/components/shared/KpiCard";
import { KpiSkeleton, TableSkeleton } from "@/components/shared/Skeletons";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { quizPlayerService } from "@/lib/api/services/quiz-players";
import { formatDate, formatNumber } from "@/lib/format";
import type { Player } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

export default function QuizPlayersPage() {
  const scope = useAuthStore((s) => s.venueScope)();
  const qc = useQueryClient();

  const players = useQuery({ queryKey: ["quiz-players", scope], queryFn: () => quizPlayerService.list(scope) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["quiz-players"] });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Player["status"] }) => quizPlayerService.setStatus(id, status),
    onSuccess: (p) => { invalidate(); toast.success(`${p.name} ${p.status === "Banned" ? "banned" : "unbanned"}`); },
  });

  const resetScore = useMutation({
    mutationFn: (id: string) => quizPlayerService.resetScore(id),
    onSuccess: () => { invalidate(); toast.success("Score reset"); },
  });

  const all = players.data ?? [];
  const connected = all.filter((p) => p.connectionStatus === "Connected").length;
  const banned = all.filter((p) => p.status === "Banned").length;
  const totalWins = all.reduce((sum, p) => sum + p.wins, 0);

  const columns: Column<Player>[] = [
    { key: "name", header: "Name", render: (p) => <span className="font-medium text-foreground">{p.name}</span>, sortValue: (p) => p.name },
    { key: "tableNumber", header: "Table" },
    { key: "totalScore", header: "Total Score", sortValue: (p) => p.totalScore },
    { key: "quizzesPlayed", header: "Quizzes Played", sortValue: (p) => p.quizzesPlayed },
    { key: "wins", header: "Wins", sortValue: (p) => p.wins },
    { key: "joinedAt", header: "Joined", render: (p) => formatDate(p.joinedAt), sortValue: (p) => p.joinedAt },
    {
      key: "connectionStatus",
      header: "Connection",
      render: (p) => <StatusBadge status={p.connectionStatus} tone={p.connectionStatus === "Connected" ? "success" : "neutral"} />,
    },
    { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} tone={p.status === "Banned" ? "danger" : "success"} /> },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => resetScore.mutate(p.id)}>Reset Score</DropdownMenuItem>
            <DropdownMenuItem
              className={p.status === "Active" ? "text-destructive focus:text-destructive" : undefined}
              onClick={() => setStatus.mutate({ id: p.id, status: p.status === "Active" ? "Banned" : "Active" })}
            >
              {p.status === "Active" ? "Ban Player" : "Unban Player"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Players" description="Everyone who has ever joined one of your quizzes." />

      {players.isLoading ? (
        <KpiSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total Players" value={formatNumber(all.length)} icon={Users} tone="primary" />
          <KpiCard label="Connected Now" value={formatNumber(connected)} icon={Wifi} tone="info" />
          <KpiCard label="Banned" value={formatNumber(banned)} icon={UserCheck} tone="danger" />
          <KpiCard label="Total Wins Recorded" value={formatNumber(totalWins)} icon={Trophy} tone="success" />
        </div>
      )}

      {players.isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          data={all}
          columns={columns}
          rowKey={(p) => p.id}
          searchKeys={["name", "tableNumber"]}
          searchPlaceholder="Search players…"
        />
      )}
    </div>
  );
}