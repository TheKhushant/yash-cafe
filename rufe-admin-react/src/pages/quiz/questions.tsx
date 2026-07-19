import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Plus } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { QuestionFormDialog } from "@/components/quiz/QuestionFormDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { questionService } from "@/lib/api/services/questions";
import type { Question, QuestionType } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

const QUESTION_TYPES: QuestionType[] = [
  "MCQ", "True/False", "Multiple Correct", "Image Question", "Logo Quiz", "Poll", "Survey",
];

function correctAnswerLabel(q: Question): string {
  if (q.correctOptionIds.length === 0) return "—";
  return q.correctOptionIds
    .map((id) => q.options.find((o) => o.id === id)?.label ?? id)
    .join(", ");
}

export default function QuestionBankPage() {
  const scope = useAuthStore((s) => s.venueScope)();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [toDelete, setToDelete] = useState<Question | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const questions = useQuery({ queryKey: ["question-bank", scope], queryFn: () => questionService.list(scope) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["question-bank"] });

  const toggleEnabled = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => questionService.setEnabled(id, enabled),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => questionService.remove(id),
    onSuccess: () => { invalidate(); toast.success("Question deleted"); },
  });

  const all = questions.data ?? [];
  const filtered = useMemo(() => all.filter((q) => {
    if (typeFilter !== "all" && q.type !== typeFilter) return false;
    if (difficultyFilter !== "all" && q.difficulty !== difficultyFilter) return false;
    return true;
  }), [all, typeFilter, difficultyFilter]);

  function openCreate() { setEditing(null); setOpen(true); }
  function openEdit(q: Question) { setEditing(q); setOpen(true); }

  const columns: Column<Question>[] = [
    {
      key: "text",
      header: "Question",
      render: (q) => <span className="line-clamp-2 max-w-md font-medium text-foreground">{q.text}</span>,
      sortValue: (q) => q.text,
    },
    { key: "category", header: "Category", sortValue: (q) => q.category },
    { key: "difficulty", header: "Difficulty", sortValue: (q) => q.difficulty },
    { key: "type", header: "Question Type", sortValue: (q) => q.type },
    { key: "correct", header: "Correct Answer", render: (q) => <span className="text-sm">{correctAnswerLabel(q)}</span> },
    { key: "timeLimitSeconds", header: "Time Limit", render: (q) => `${q.timeLimitSeconds}s`, sortValue: (q) => q.timeLimitSeconds },
    { key: "points", header: "Points", sortValue: (q) => q.points },
    { key: "usageCount", header: "Usage Count", sortValue: (q) => q.usageCount },
    {
      key: "status",
      header: "Status",
      render: (q) => <StatusBadge status={q.enabled ? "Active" : "Blocked"} label={q.enabled ? "Active" : "Inactive"} />,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (q) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(q)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleEnabled.mutate({ id: q.id, enabled: !q.enabled })}>
              {q.enabled ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(q)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question Bank"
        description="Reusable question repository shared across all quizzes."
        actions={<Button onClick={openCreate}><Plus className="size-4" /> New Question</Button>}
      />

      {questions.isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          rowKey={(q) => q.id}
          searchKeys={["text", "category"]}
          searchPlaceholder="Search questions…"
          toolbar={
            <>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[170px]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {QUESTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Difficulty" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
        />
      )}

      <QuestionFormDialog open={open} onOpenChange={setOpen} editing={editing} venueScope={scope} />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete question?"
        description="This question will be permanently removed from the bank."
        destructive
        confirmLabel="Delete"
        onConfirm={() => { if (toDelete) remove.mutate(toDelete.id); setToDelete(null); }}
      />
    </div>
  );
}