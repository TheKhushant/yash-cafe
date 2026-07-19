import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import {
  Ban, MoreHorizontal, Pause, Play, RotateCcw, SkipForward,
  SquareX, StepBack, StepForward, Trophy, Users,
} from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { KpiCard } from "@/components/shared/KpiCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { quizService } from "@/lib/api/services/quiz";
import { quizSessionService, type SessionPlayerRow } from "@/lib/api/services/quiz-session";
import { rewardService } from "@/lib/api/services/rewards";
import { useAuthStore } from "@/stores/auth-store";

export default function LiveQuizPage() {
  const scope = useAuthStore((s) => s.venueScope)();
  const qc = useQueryClient();
  const [pickQuizId, setPickQuizId] = useState<string>("");
  const [showQr, setShowQr] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const quizzes = useQuery({
    queryKey: ["quiz-library-startable", scope],
    queryFn: () => quizService.list(scope),
  });

  const activeSession = useQuery({
    queryKey: ["quiz-session-active", scope],
    queryFn: () => quizSessionService.getActive(scope),
  });

  const session = activeSession.data ?? null;

  const players = useQuery({
    queryKey: ["quiz-session-players", session?.id],
    queryFn: () => quizSessionService.listSessionPlayers(session!.id),
    enabled: !!session,
    refetchInterval: session?.status === "Live" ? 4000 : false,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["quiz-session-active"] });
    qc.invalidateQueries({ queryKey: ["quiz-session-players"] });
    qc.invalidateQueries({ queryKey: ["quiz-library-startable"] });
    qc.invalidateQueries({ queryKey: ["quiz-dashboard"] });
  };

  const start = useMutation({
    mutationFn: (quizId: string) => quizSessionService.start(quizId, scope),
    onSuccess: () => { invalidateAll(); toast.success("Session created — waiting for players"); },
  });
  const simulateJoins = useMutation({
    mutationFn: (id: string) => quizSessionService.simulateJoins(id, 4),
    onSuccess: invalidateAll,
  });
  const begin = useMutation({
    mutationFn: (id: string) => quizSessionService.beginQuiz(id),
    onSuccess: () => { invalidateAll(); toast.success("Quiz started!"); },
  });
  const pause = useMutation({ mutationFn: (id: string) => quizSessionService.pause(id), onSuccess: invalidateAll });
  const resume = useMutation({ mutationFn: (id: string) => quizSessionService.resume(id), onSuccess: invalidateAll });
  const next = useMutation({ mutationFn: (id: string) => quizSessionService.next(id), onSuccess: invalidateAll });
  const previous = useMutation({ mutationFn: (id: string) => quizSessionService.previous(id), onSuccess: invalidateAll });
  const skip = useMutation({ mutationFn: (id: string) => quizSessionService.skip(id), onSuccess: invalidateAll });
  const end = useMutation({
    mutationFn: (id: string) => quizSessionService.end(id),
    onSuccess: () => { invalidateAll(); toast.success("Quiz ended"); },
  });
  const reset = useMutation({
    mutationFn: (id: string) => quizSessionService.reset(id),
    onSuccess: () => { invalidateAll(); toast.success("Quiz reset"); },
  });
  const kick = useMutation({
    mutationFn: ({ sid, pid }: { sid: string; pid: string }) => quizSessionService.kickPlayer(sid, pid),
    onSuccess: invalidateAll,
  });
  const ban = useMutation({
    mutationFn: ({ sid, pid }: { sid: string; pid: string }) => quizSessionService.banPlayer(sid, pid),
    onSuccess: () => { invalidateAll(); toast.success("Player banned"); },
  });
  const resetScore = useMutation({
    mutationFn: ({ sid, pid }: { sid: string; pid: string }) => quizSessionService.resetPlayerScore(sid, pid),
    onSuccess: invalidateAll,
  });
  const rewardPlayer = useMutation({
    mutationFn: (row: SessionPlayerRow) =>
      rewardService.assign({
        playerId: row.playerId,
        playerName: row.name,
        sessionId: session!.id,
        quizName: session!.quizName,
        type: "Coupon",
        description: `Manual host reward — ${session!.quizName}`,
        rank: 0,
      }, scope),
    onSuccess: () => toast.success("Reward assigned"),
  });

  const quiz = quizzes.data?.find((q) => q.id === session?.quizId);
  const question = session ? quizSessionService.getCurrentQuestion(session.id) : undefined;
  const stats = session ? quizSessionService.getQuestionStats(session.id) : null;
  const totalQuestions = quiz?.questionIds.length ?? 0;

  useEffect(() => {
    if (question) setSecondsLeft(question.timeLimitSeconds);
  }, [question?.id]);

  useEffect(() => {
    if (session?.status !== "Live") return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [session?.status, question?.id]);

  const startableQuizzes = (quizzes.data ?? []).filter((q) => q.status === "Published" || q.status === "Live");

  const playerColumns: Column<SessionPlayerRow>[] = [
    { key: "name", header: "Player Name", render: (p) => <span className="font-medium text-foreground">{p.name}</span>, sortValue: (p) => p.name },
    { key: "tableNumber", header: "Table Number" },
    { key: "score", header: "Score", sortValue: (p) => p.score },
    { key: "correct", header: "Correct", sortValue: (p) => p.correct },
    { key: "wrong", header: "Wrong", sortValue: (p) => p.wrong },
    { key: "responseTimeMs", header: "Response Time", render: (p) => (p.responseTimeMs ? `${p.responseTimeMs}ms` : "—") },
    {
      key: "connectionStatus",
      header: "Connection",
      render: (p) => <StatusBadge status={p.connectionStatus} tone={p.connectionStatus === "Connected" ? "success" : "danger"} />,
    },
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
            <DropdownMenuItem onClick={() => rewardPlayer.mutate(p)}>Reward</DropdownMenuItem>
            <DropdownMenuItem onClick={() => resetScore.mutate({ sid: session!.id, pid: p.playerId })}>Reset Score</DropdownMenuItem>
            <DropdownMenuItem onClick={() => kick.mutate({ sid: session!.id, pid: p.playerId })}>Kick Player</DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => ban.mutate({ sid: session!.id, pid: p.playerId })}
            >
              <Ban className="size-4" /> Ban
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (!session) {
    return (
      <div className="space-y-6">
        <PageHeader title="Live Quiz" description="Start a live, Kahoot-style hosted session." />
        <Card className="max-w-xl p-6">
          <h3 className="text-sm font-semibold text-foreground">Start a Quiz</h3>
          <p className="mt-1 text-sm text-muted-foreground">Pick a published quiz to open the waiting room.</p>
          <div className="mt-4 flex items-center gap-3">
            <Select value={pickQuizId} onValueChange={setPickQuizId}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Select a quiz" /></SelectTrigger>
              <SelectContent>
                {startableQuizzes.map((q) => <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button disabled={!pickQuizId || start.isPending} onClick={() => start.mutate(pickQuizId)}>
              <Play className="size-4" /> Start Quiz
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Quiz"
        description={session.quizName}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setShowQr(true)}>Generate QR Code</Button>
            <Button variant="outline" onClick={() => { quizSessionService.regenerateJoinPin(session.id); invalidateAll(); }}>
              Generate Join PIN
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Question" value={session.currentQuestionIndex < 0 ? "—" : `${session.currentQuestionIndex + 1} / ${totalQuestions}`} icon={Trophy} tone="primary" hint={session.status} />
        <KpiCard label="Players Joined" value={String(session.playerIds.length)} icon={Users} tone="info" hint={`PIN ${session.pinCode}`} />
        <KpiCard label="Correct %" value={`${stats?.correctPct ?? 0}%`} icon={Trophy} tone="success" hint={`${stats?.correctCount ?? 0} correct`} />
        <KpiCard label="Wrong %" value={`${stats?.wrongPct ?? 0}%`} icon={SquareX} tone="danger" hint={`${stats?.wrongCount ?? 0} wrong`} />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Current Question</h3>
          <span className="text-2xl font-bold tabular-nums text-primary">{secondsLeft}s</span>
        </div>
        {totalQuestions > 0 && (
          <Progress className="mt-3" value={session.currentQuestionIndex < 0 ? 0 : ((session.currentQuestionIndex + 1) / totalQuestions) * 100} />
        )}
        <p className="mt-4 text-lg font-medium text-foreground">
          {question ? question.text : session.status === "Waiting" ? "Waiting for the host to start the quiz…" : "Quiz complete."}
        </p>
        {question && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {question.options.map((o) => (
              <div
                key={o.id}
                className={`rounded-lg border px-3 py-2 text-sm ${question.correctOptionIds.includes(o.id) && session.status === "Ended" ? "border-success bg-success/10 text-success" : ""}`}
              >
                {o.label}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {session.status === "Waiting" && (
            <>
              <Button variant="outline" onClick={() => simulateJoins.mutate(session.id)}>Simulate Player Joins</Button>
              <Button disabled={session.playerIds.length === 0} onClick={() => begin.mutate(session.id)}>
                <Play className="size-4" /> Start Quiz
              </Button>
            </>
          )}
          {session.status === "Live" && (
            <>
              <Button variant="outline" onClick={() => pause.mutate(session.id)}><Pause className="size-4" /> Pause</Button>
              <Button variant="outline" onClick={() => previous.mutate(session.id)} disabled={session.currentQuestionIndex <= 0}>
                <StepBack className="size-4" /> Previous
              </Button>
              <Button onClick={() => next.mutate(session.id)}><StepForward className="size-4" /> Next Question</Button>
              <Button variant="outline" onClick={() => skip.mutate(session.id)}><SkipForward className="size-4" /> Skip</Button>
              <Button variant="destructive" onClick={() => end.mutate(session.id)}><SquareX className="size-4" /> End Quiz</Button>
            </>
          )}
          {session.status === "Paused" && (
            <>
              <Button onClick={() => resume.mutate(session.id)}><Play className="size-4" /> Resume</Button>
              <Button variant="destructive" onClick={() => end.mutate(session.id)}><SquareX className="size-4" /> End Quiz</Button>
            </>
          )}
          {session.status === "Ended" && (
            <Button variant="outline" onClick={() => reset.mutate(session.id)}><RotateCcw className="size-4" /> Reset Quiz</Button>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Live Players</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            data={players.data ?? []}
            columns={playerColumns}
            rowKey={(p) => p.playerId}
            searchKeys={["name", "tableNumber"]}
            searchPlaceholder="Search players…"
            emptyMessage="No players have joined yet."
          />
        </CardContent>
      </Card>

      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Scan to Join</DialogTitle>
            <DialogDescription>PIN Code: {session.pinCode}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center rounded-lg border bg-white p-4">
            <QRCode value={quizSessionService.buildJoinQrPayload(session)} size={200} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}