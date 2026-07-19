import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { quizService, type QuizInput } from "@/lib/api/services/quiz";
import type { Quiz, QuizDifficulty, QuizEntryMethod, QuizRewardType, QuizVisibility } from "@/types";

const CATEGORIES = [
  "Sports Trivia", "Movies", "Music", "General Knowledge",
  "History", "Science", "Geography", "Pop Culture",
];
const DIFFICULTIES: QuizDifficulty[] = ["Easy", "Medium", "Hard"];
const ENTRY_METHODS: QuizEntryMethod[] = ["QR Code", "PIN Code", "Invite Only"];
const REWARD_TYPES: QuizRewardType[] = [
  "Coupon", "Offer", "Free Drink", "Free Food", "Loyalty Points", "Gift Voucher",
];

interface FormState {
  name: string;
  description: string;
  category: string;
  difficulty: QuizDifficulty;
  visibility: QuizVisibility;
  entryMethod: QuizEntryMethod;
  maxPlayers: string;
  rewardType: QuizRewardType;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowLateJoin: boolean;
  showLeaderboard: boolean;
  enableTimer: boolean;
  autoNextQuestion: boolean;
}

const TODAY = new Date().toISOString().slice(0, 10);
const IN_7_DAYS = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  category: CATEGORIES[0],
  difficulty: "Medium",
  visibility: "Public",
  entryMethod: "QR Code",
  maxPlayers: "50",
  rewardType: "Coupon",
  startDate: TODAY,
  startTime: "19:00",
  endDate: IN_7_DAYS,
  endTime: "21:00",
  shuffleQuestions: true,
  shuffleOptions: true,
  allowLateJoin: true,
  showLeaderboard: true,
  enableTimer: true,
  autoNextQuestion: false,
};

function quizToForm(q: Quiz): FormState {
  const start = new Date(q.startDate);
  const end = new Date(q.endDate);
  return {
    name: q.name,
    description: q.description ?? "",
    category: q.category,
    difficulty: q.difficulty,
    visibility: q.visibility,
    entryMethod: q.entryMethod,
    maxPlayers: String(q.maxPlayers),
    rewardType: q.rewardType,
    startDate: start.toISOString().slice(0, 10),
    startTime: start.toISOString().slice(11, 16),
    endDate: end.toISOString().slice(0, 10),
    endTime: end.toISOString().slice(11, 16),
    shuffleQuestions: q.shuffleQuestions,
    shuffleOptions: q.shuffleOptions,
    allowLateJoin: q.allowLateJoin,
    showLeaderboard: q.showLeaderboard,
    enableTimer: q.enableTimer,
    autoNextQuestion: q.autoNextQuestion,
  };
}

function formToInput(form: FormState): QuizInput {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    category: form.category,
    difficulty: form.difficulty,
    visibility: form.visibility,
    entryMethod: form.entryMethod,
    maxPlayers: Number(form.maxPlayers) || 50,
    rewardType: form.rewardType,
    startDate: new Date(`${form.startDate}T${form.startTime}:00`).toISOString(),
    endDate: new Date(`${form.endDate}T${form.endTime}:00`).toISOString(),
    shuffleQuestions: form.shuffleQuestions,
    shuffleOptions: form.shuffleOptions,
    allowLateJoin: form.allowLateJoin,
    showLeaderboard: form.showLeaderboard,
    enableTimer: form.enableTimer,
    autoNextQuestion: form.autoNextQuestion,
    questionIds: [],
  };
}

export function QuizFormDialog({
  open,
  onOpenChange,
  editing,
  venueScope,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Quiz | null;
  venueScope: string | null;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (open) setForm(editing ? quizToForm(editing) : EMPTY_FORM);
  }, [open, editing]);

  const save = useMutation({
    mutationFn: () =>
      editing
        ? quizService.update(editing.id, formToInput(form))
        : quizService.create(formToInput(form), venueScope),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quiz-library"] });
      qc.invalidateQueries({ queryKey: ["quiz-dashboard"] });
      toast.success(editing ? "Quiz updated" : "Quiz created");
      onOpenChange(false);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Could not save quiz"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Quiz" : "Create Quiz"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
            <div className="space-y-2">
              <Label>Quiz Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Friday Night Sports Trivia"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Short description shown to players before joining"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={form.difficulty}
                  onValueChange={(v) => setForm({ ...form, difficulty: v as QuizDifficulty })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
            <h3 className="text-sm font-semibold text-foreground">Access & Rewards</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={form.visibility}
                  onValueChange={(v) => setForm({ ...form, visibility: v as QuizVisibility })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Public">Public</SelectItem>
                    <SelectItem value="Private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Entry Method</Label>
                <Select
                  value={form.entryMethod}
                  onValueChange={(v) => setForm({ ...form, entryMethod: v as QuizEntryMethod })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENTRY_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Maximum Players</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxPlayers}
                  onChange={(e) => setForm({ ...form, maxPlayers: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Reward Type</Label>
                <Select
                  value={form.rewardType}
                  onValueChange={(v) => setForm({ ...form, rewardType: v as QuizRewardType })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REWARD_TYPES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Schedule</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Gameplay Options</h3>
            {([
              ["shuffleQuestions", "Shuffle Questions"],
              ["shuffleOptions", "Shuffle Options"],
              ["allowLateJoin", "Allow Late Join"],
              ["showLeaderboard", "Show Leaderboard"],
              ["enableTimer", "Enable Timer"],
              ["autoNextQuestion", "Auto Next Question"],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border px-4 py-3">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <Switch
                  checked={form[key]}
                  onCheckedChange={(v) => setForm({ ...form, [key]: v })}
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={!form.name || save.isPending}>
            {save.isPending ? "Saving..." : editing ? "Save Changes" : "Create Quiz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}