import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { questionService, type QuestionInput } from "@/lib/api/services/questions";
import type { Question, QuestionType, QuizDifficulty } from "@/types";

const CATEGORIES = [
  "Sports Trivia", "Movies", "Music", "General Knowledge",
  "History", "Science", "Geography", "Pop Culture",
];
const DIFFICULTIES: QuizDifficulty[] = ["Easy", "Medium", "Hard"];
const QUESTION_TYPES: QuestionType[] = [
  "MCQ", "True/False", "Multiple Correct", "Image Question", "Logo Quiz", "Poll", "Survey",
];

interface FormState {
  text: string;
  imageUrl: string;
  type: QuestionType;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctIds: string[];
  timeLimitSeconds: string;
  points: string;
  explanation: string;
  category: string;
  difficulty: QuizDifficulty;
  tags: string;
}

const EMPTY_FORM: FormState = {
  text: "",
  imageUrl: "",
  type: "MCQ",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctIds: [],
  timeLimitSeconds: "20",
  points: "1000",
  explanation: "",
  category: CATEGORIES[0],
  difficulty: "Medium",
  tags: "",
};

function needsImage(type: QuestionType) {
  return type === "Image Question" || type === "Logo Quiz";
}
function isTrueFalse(type: QuestionType) {
  return type === "True/False";
}
function hasNoCorrectAnswer(type: QuestionType) {
  return type === "Poll" || type === "Survey";
}
function allowsMultipleCorrect(type: QuestionType) {
  return type === "Multiple Correct";
}

function questionToForm(q: Question): FormState {
  const get = (id: string) => q.options.find((o) => o.id === id)?.label ?? "";
  return {
    text: q.text,
    imageUrl: q.imageUrl ?? "",
    type: q.type,
    optionA: get("A"),
    optionB: get("B"),
    optionC: get("C"),
    optionD: get("D"),
    correctIds: q.correctOptionIds,
    timeLimitSeconds: String(q.timeLimitSeconds),
    points: String(q.points),
    explanation: q.explanation ?? "",
    category: q.category,
    difficulty: q.difficulty,
    tags: q.tags.join(", "),
  };
}

function formToInput(form: FormState): QuestionInput {
  const options = isTrueFalse(form.type)
    ? [{ id: "A", label: "True" }, { id: "B", label: "False" }]
    : [
        { id: "A", label: form.optionA },
        { id: "B", label: form.optionB },
        { id: "C", label: form.optionC },
        { id: "D", label: form.optionD },
      ];

  return {
    text: form.text.trim(),
    imageUrl: needsImage(form.type) ? form.imageUrl || undefined : undefined,
    type: form.type,
    options,
    correctOptionIds: hasNoCorrectAnswer(form.type) ? [] : form.correctIds,
    timeLimitSeconds: Number(form.timeLimitSeconds) || 20,
    points: Number(form.points) || 1000,
    explanation: form.explanation.trim() || undefined,
    category: form.category,
    difficulty: form.difficulty,
    tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    enabled: true,
  };
}

export function QuestionFormDialog({
  open,
  onOpenChange,
  editing,
  venueScope,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Question | null;
  venueScope: string | null;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (open) setForm(editing ? questionToForm(editing) : EMPTY_FORM);
  }, [open, editing]);

  const save = useMutation({
    mutationFn: () =>
      editing
        ? questionService.update(editing.id, formToInput(form))
        : questionService.create(formToInput(form), venueScope),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["question-bank"] });
      toast.success(editing ? "Question updated" : "Question created");
      onOpenChange(false);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Could not save question"),
  });

  function toggleCorrect(id: string) {
    if (allowsMultipleCorrect(form.type)) {
      setForm((f) => ({
        ...f,
        correctIds: f.correctIds.includes(id) ? f.correctIds.filter((x) => x !== id) : [...f.correctIds, id],
      }));
    } else {
      setForm((f) => ({ ...f, correctIds: [id] }));
    }
  }

  function handleImageUpload(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, imageUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  const optionRows = isTrueFalse(form.type)
    ? ([["A", "True"], ["B", "False"]] as const)
    : ([["A", form.optionA], ["B", form.optionB], ["C", form.optionC], ["D", form.optionD]] as const);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Question" : "Create Question"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-2">
            <Label>Question Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v as QuestionType, correctIds: [] })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Question</Label>
            <Textarea
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              rows={2}
              placeholder="Which team won the 2018 World Cup?"
            />
          </div>

          {needsImage(form.type) && (
            <div className="space-y-2">
              <Label>Image Upload</Label>
              <div className="flex items-center gap-3">
                <Button variant="outline" asChild className="gap-2">
                  <label className="cursor-pointer">
                    <ImagePlus className="size-4" /> Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files?.[0])}
                    />
                  </label>
                </Button>
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="Preview" className="h-14 w-20 rounded-md border object-cover" />
                )}
              </div>
            </div>
          )}

          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <h3 className="text-sm font-semibold text-foreground">Options</h3>
            {optionRows.map(([id, value], idx) => (
              <div key={id} className="flex items-center gap-3">
                {!hasNoCorrectAnswer(form.type) && (
                  <Checkbox
                    checked={form.correctIds.includes(id)}
                    onCheckedChange={() => toggleCorrect(id)}
                  />
                )}
                <Input
                  value={value}
                  disabled={isTrueFalse(form.type)}
                  onChange={(e) => {
                    const key = (["optionA", "optionB", "optionC", "optionD"] as const)[idx];
                    setForm({ ...form, [key]: e.target.value });
                  }}
                  placeholder={`Option ${id}`}
                />
              </div>
            ))}
            {hasNoCorrectAnswer(form.type) ? (
              <p className="text-xs text-muted-foreground">
                {form.type} questions have no correct answer — responses are just tallied.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Check the box next to each correct option.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Time Limit (seconds)</Label>
              <Input
                type="number"
                min={5}
                value={form.timeLimitSeconds}
                onChange={(e) => setForm({ ...form, timeLimitSeconds: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Points</Label>
              <Input
                type="number"
                min={0}
                value={form.points}
                onChange={(e) => setForm({ ...form, points: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Explanation (optional)</Label>
            <Textarea
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              rows={2}
              placeholder="Shown to players after they answer"
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

          <div className="space-y-2">
            <Label>Tags (comma separated)</Label>
            <Input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="football, world-cup, easy"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={!form.text || save.isPending}>
            {save.isPending ? "Saving..." : editing ? "Save Changes" : "Create Question"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}