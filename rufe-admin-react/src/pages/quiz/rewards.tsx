import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gift } from "lucide-react";

import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { quizSessionService } from "@/lib/api/services/quiz-session";
import { rewardService, type AutoAssignTarget } from "@/lib/api/services/rewards";
import { formatDateTime } from "@/lib/format";
import type { QuizRewardType, Reward } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

const REWARD_TYPES: QuizRewardType[] = [
  "Coupon", "Offer", "Free Drink", "Free Food", "Loyalty Points", "Gift Voucher",
];
const TARGETS: AutoAssignTarget[] = ["Winner", "Top 3", "Top 5", "Random Winner"];

export default function RewardsPage() {
  const scope = useAuthStore((s) => s.venueScope)();
  const qc = useQueryClient();

  const [target, setTarget] = useState<AutoAssignTarget>("Winner");
  const [type, setType] = useState<QuizRewardType>("Coupon");
  const [minScore, setMinScore] = useState("0");

  const rewards = useQuery({ queryKey: ["quiz-rewards", scope], queryFn: () => rewardService.list(scope) });
  const activeSession = useQuery({ queryKey: ["quiz-session-active", scope], queryFn: () => quizSessionService.getActive(scope) });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["quiz-rewards"] });

  const markDelivered = useMutation({
    mutationFn: (id: string) => rewardService.markDelivered(id),
    onSuccess: () => { invalidate(); toast.success("Marked delivered"); },
  });

  const autoAssign = useMutation({
    mutationFn: () =>
      rewardService.autoAssign(
        activeSession.data!.id,
        { target, type, minimumScore: Number(minScore) || 0 },
        scope,
      ),
    onSuccess: (created) => { invalidate(); toast.success(`${created.length} reward(s) assigned`); },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Could not assign rewards"),
  });

  const columns: Column<Reward>[] = [
    { key: "playerName", header: "Player", render: (r) => <span className="font-medium text-foreground">{r.playerName}</span>, sortValue: (r) => r.playerName },
    { key: "quizName", header: "Quiz", sortValue: (r) => r.quizName },
    { key: "type", header: "Reward Type" },
    { key: "description", header: "Description", className: "max-w-xs truncate" },
    { key: "rank", header: "Rank", render: (r) => (r.rank > 0 ? `#${r.rank}` : "—"), sortValue: (r) => r.rank },
    { key: "assignedAt", header: "Assigned", render: (r) => formatDateTime(r.assignedAt), sortValue: (r) => r.assignedAt },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} tone={r.status === "Delivered" ? "success" : "warning"} /> },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (r) => r.status === "Pending" ? (
        <Button size="sm" variant="outline" onClick={() => markDelivered.mutate(r.id)}>Mark Delivered</Button>
      ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Rewards" description="Assign and track rewards for quiz winners." />

      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Gift className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Auto-Assign from Live Session</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeSession.data ? `Assign rewards from "${activeSession.data.quizName}"'s current leaderboard.` : "No quiz is currently live."}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select value={target} onValueChange={(v) => setTarget(v as AutoAssignTarget)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TARGETS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reward Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as QuizRewardType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{REWARD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Minimum Score</Label>
            <Input type="number" min={0} value={minScore} onChange={(e) => setMinScore(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={!activeSession.data || autoAssign.isPending}
              onClick={() => autoAssign.mutate()}
            >
              {autoAssign.isPending ? "Assigning…" : "Assign Rewards"}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Reward History</CardTitle></CardHeader>
        <CardContent>
          {rewards.isLoading ? (
            <TableSkeleton />
          ) : (
            <DataTable
              data={rewards.data ?? []}
              columns={columns}
              rowKey={(r) => r.id}
              searchKeys={["playerName", "quizName"]}
              searchPlaceholder="Search rewards…"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}