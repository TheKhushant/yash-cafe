import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { quizSettingsService } from "@/lib/api/services/quiz";
import type { QuizSettings } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

const TOGGLES: { key: keyof QuizSettings; label: string; hint: string }[] = [
  { key: "shuffleQuestions", label: "Shuffle Questions", hint: "Randomize question order by default." },
  { key: "shuffleOptions", label: "Shuffle Options", hint: "Randomize answer option order by default." },
  { key: "showCorrectAnswer", label: "Show Correct Answer", hint: "Reveal the correct answer after each question." },
  { key: "enableSounds", label: "Enable Sounds", hint: "Play sound effects during live sessions." },
  { key: "enableCountdown", label: "Enable Countdown", hint: "Show a countdown before each question starts." },
  { key: "allowRejoin", label: "Allow Rejoin", hint: "Let disconnected players rejoin an in-progress session." },
  { key: "enableQrJoin", label: "Enable QR Join", hint: "Allow players to join by scanning a QR code." },
  { key: "autoLeaderboard", label: "Auto Leaderboard", hint: "Automatically show the leaderboard between questions." },
];

export default function QuizSettingsPage() {
  const scope = useAuthStore((s) => s.venueScope)();
  const qc = useQueryClient();
  const [form, setForm] = useState<QuizSettings | null>(null);

  const settings = useQuery({ queryKey: ["quiz-settings", scope], queryFn: () => quizSettingsService.get(scope) });

  useEffect(() => {
    if (settings.data) setForm(settings.data);
  }, [settings.data]);

  const save = useMutation({
    mutationFn: (patch: Partial<QuizSettings>) => quizSettingsService.update(patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quiz-settings"] });
      toast.success("Quiz settings saved");
    },
  });

  if (!form) {
    return (
      <div className="space-y-6">
        <PageHeader title="Quiz Settings" description="Defaults applied to every new quiz." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quiz Settings"
        description="Defaults applied to every new quiz."
        actions={<Button onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending ? "Saving..." : "Save Changes"}</Button>}
      />

      <Card>
        <CardHeader><CardTitle className="text-lg">Defaults</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Default Timer (seconds)</Label>
            <Input
              type="number"
              min={5}
              value={form.defaultTimerSeconds}
              onChange={(e) => setForm({ ...form, defaultTimerSeconds: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Default Points</Label>
            <Input
              type="number"
              min={0}
              value={form.defaultPoints}
              onChange={(e) => setForm({ ...form, defaultPoints: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Maximum Players</Label>
            <Input
              type="number"
              min={1}
              value={form.maxPlayers}
              onChange={(e) => setForm({ ...form, maxPlayers: Number(e.target.value) || 0 })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Gameplay</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {TOGGLES.map((t) => (
            <div key={t.key} className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.hint}</p>
              </div>
              <Switch
                checked={Boolean(form[t.key])}
                onCheckedChange={(v) => setForm({ ...form, [t.key]: v })}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}