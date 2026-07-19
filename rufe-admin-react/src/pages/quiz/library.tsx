import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Archive, Copy, MoreHorizontal, Plus, Send, Users as UsersIcon,
} from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { QuizFormDialog } from "@/components/quiz/QuizFormDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { quizService } from "@/lib/api/services/quiz";
import { formatDate } from "@/lib/format";
import type { Quiz, QuizStatus } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

const CATEGORIES = [
  "Sports Trivia", "Movies", "Music", "General Knowledge",
  "History", "Science", "Geography", "Pop Culture",
];

export default function QuizLibraryPage() {
  const scope = useAuthStore((s) => s.venueScope)();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [viewing, setViewing] = useState<Quiz | null>(null);
  const [toDelete, setToDelete] = useState<Quiz | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const quizzes = useQuery({ queryKey: ["quiz-library", scope], queryFn: () => quizService.list(scope) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["quiz-library"] });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuizStatus }) => quizService.setStatus(id, status),
    onSuccess: (q) => { invalidate(); toast.success(`"${q.name}" is now ${q.status}`); },
  });

  const duplicate = useMutation({
    mutationFn: (id: string) => quizService.duplicate(id),
    onSuccess: () => { invalidate(); toast.success("Quiz duplicated"); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => quizService.remove(id),
    onSuccess: () => { invalidate(); toast.success("Quiz deleted"); },
  });

  const allQuizzes = quizzes.data ?? [];
  const filtered = useMemo(() => {
    return allQuizzes.filter((q) => {
      if (statusFilter !== "all" && q.status !== statusFilter) return false;
      if (categoryFilter !== "all" && q.category !== categoryFilter) return false;
      if (difficultyFilter !== "all" && q.difficulty !== difficultyFilter) return false;
      return true;
    });
  }, [allQuizzes, statusFilter, categoryFilter, difficultyFilter]);

  function openCreate() { setEditing(null); setOpen(true); }
  function openEdit(q: Quiz) { setEditing(q); setOpen(true); }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function bulkSetStatus(status: QuizStatus) {
    await Promise.all([...selected].map((id) => quizService.setStatus(id, status)));
    invalidate();
    toast.success(`${selected.size} quiz(zes) set to ${status}`);
    setSelected(new Set());
  }

  async function bulkDelete() {
    await Promise.all([...selected].map((id) => quizService.remove(id)));
    invalidate();
    toast.success(`${selected.size} quiz(zes) deleted`);
    setSelected(new Set());
  }

  const columns: Column<Quiz>[] = [
    {
      key: "select",
      header: "",
      render: (q) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={selected.has(q.id)} onCheckedChange={() => toggleSelected(q.id)} />
        </div>
      ),
    },
    {
      key: "name",
      header: "Quiz Name",
      render: (q) => <span className="font-medium text-foreground">{q.name}</span>,
      sortValue: (q) => q.name,
    },
    { key: "category", header: "Category", sortValue: (q) => q.category },
    { key: "difficulty", header: "Difficulty", sortValue: (q) => q.difficulty },
    { key: "questions", header: "Questions", render: (q) => q.questionIds.length },
    { key: "players", header: "Players", render: (q) => q.playersCount, sortValue: (q) => q.playersCount },
    { key: "status", header: "Status", render: (q) => <StatusBadge status={q.status} />, sortValue: (q) => q.status },
    { key: "createdAt", header: "Created", render: (q) => formatDate(q.createdAt), sortValue: (q) => q.createdAt },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (q) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => setViewing(q)}>View</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEdit(q)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => duplicate.mutate(q.id)}>
              <Copy className="size-4" /> Duplicate
            </DropdownMenuItem>
            {q.status !== "Published" && (
              <DropdownMenuItem onClick={() => setStatus.mutate({ id: q.id, status: "Published" })}>
                <Send className="size-4" /> Publish
              </DropdownMenuItem>
            )}
            {q.status !== "Archived" && (
              <DropdownMenuItem onClick={() => setStatus.mutate({ id: q.id, status: "Archived" })}>
                <Archive className="size-4" /> Archive
              </DropdownMenuItem>
            )}
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
        title="Quiz Library"
        description="Create, publish and manage your quizzes."
        actions={<Button onClick={openCreate}><Plus className="size-4" /> New Quiz</Button>}
      />

      {quizzes.isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          rowKey={(q) => q.id}
          searchKeys={["name", "category"]}
          searchPlaceholder="Search quizzes…"
          onRowClick={(q) => setViewing(q)}
          toolbar={
            <>
              {selected.size > 0 && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm">
                  <UsersIcon className="size-4" /> {selected.size} selected
                  <Button size="sm" variant="outline" onClick={() => bulkSetStatus("Published")}>Publish</Button>
                  <Button size="sm" variant="outline" onClick={() => bulkSetStatus("Archived")}>Archive</Button>
                  <Button size="sm" variant="destructive" onClick={bulkDelete}>Delete</Button>
                </div>
              )}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Live">Live</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[170px]"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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

      <QuizFormDialog open={open} onOpenChange={setOpen} editing={editing} venueScope={scope} />

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{viewing?.name}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <StatusBadge status={viewing.status} />
                <span className="text-muted-foreground">{viewing.category} • {viewing.difficulty}</span>
              </div>
              {viewing.description && <p className="text-muted-foreground">{viewing.description}</p>}
              <div className="grid grid-cols-2 gap-3 rounded-lg border p-3">
                <div><p className="text-xs text-muted-foreground">Entry Method</p><p className="font-medium">{viewing.entryMethod}</p></div>
                <div><p className="text-xs text-muted-foreground">PIN Code</p><p className="font-medium">{viewing.pinCode}</p></div>
                <div><p className="text-xs text-muted-foreground">Max Players</p><p className="font-medium">{viewing.maxPlayers}</p></div>
                <div><p className="text-xs text-muted-foreground">Reward Type</p><p className="font-medium">{viewing.rewardType}</p></div>
                <div><p className="text-xs text-muted-foreground">Questions</p><p className="font-medium">{viewing.questionIds.length}</p></div>
                <div><p className="text-xs text-muted-foreground">Players</p><p className="font-medium">{viewing.playersCount}</p></div>
                <div><p className="text-xs text-muted-foreground">Starts</p><p className="font-medium">{formatDate(viewing.startDate)}</p></div>
                <div><p className="text-xs text-muted-foreground">Ends</p><p className="font-medium">{formatDate(viewing.endDate)}</p></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete quiz?"
        description={`"${toDelete?.name}" will be permanently removed.`}
        destructive
        confirmLabel="Delete"
        onConfirm={() => { if (toDelete) remove.mutate(toDelete.id); setToDelete(null); }}
      />
    </div>
  );
}