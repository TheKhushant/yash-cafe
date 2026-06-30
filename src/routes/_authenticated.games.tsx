import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { gamesService, type GameInput } from "@/lib/api/services/games.service";
import { formatDateTime, toDatetimeLocal } from "@/lib/format";
import type { Game } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/_authenticated/games")({
  component: GamesPage,
});

const EMPTY: GameInput = { title: "", league: "", schedule: new Date().toISOString(), enabled: true };

function GamesPage() {
  const scope = useAuthStore((s) => s.venueScope)();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Game | null>(null);
  const [form, setForm] = useState<GameInput>(EMPTY);
  const [toDelete, setToDelete] = useState<Game | null>(null);

  const games = useQuery({ queryKey: ["games", scope], queryFn: () => gamesService.list(scope) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["games"] });

  const save = useMutation({
    mutationFn: () => editing ? gamesService.update(editing.id, form) : gamesService.create(form, scope),
    onSuccess: () => { invalidate(); setOpen(false); toast.success(editing ? "Game updated" : "Game added"); },
  });
  const patch = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Game> }) => gamesService.update(id, data),
    onSuccess: () => invalidate(),
  });
  const remove = useMutation({
    mutationFn: (id: string) => gamesService.remove(id),
    onSuccess: () => { invalidate(); toast.success("Game deleted"); },
  });

  function openCreate() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(g: Game) { setEditing(g); setForm({ title: g.title, league: g.league, schedule: g.schedule, enabled: g.enabled }); setOpen(true); }

  const columns: Column<Game>[] = [
    { key: "title", header: "Match", render: (g) => <span className="font-medium text-foreground">{g.title}</span>, sortValue: (g) => g.title },
    { key: "league", header: "League", sortValue: (g) => g.league },
    { key: "schedule", header: "Kick-off", render: (g) => formatDateTime(g.schedule), sortValue: (g) => g.schedule },
    { key: "enabled", header: "Status", render: (g) => <StatusBadge status={g.enabled ? "Active" : "Disabled"} tone={g.enabled ? "success" : "neutral"} /> },
    {
      key: "actions", header: "", headerClassName: "text-right", className: "text-right",
      render: (g) => (
        <div className="flex items-center justify-end gap-1">
          <Switch checked={g.enabled} onCheckedChange={(v) => patch.mutate({ id: g.id, data: { enabled: v } })} />
          <Button variant="ghost" size="sm" onClick={() => openEdit(g)}>Edit</Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setToDelete(g)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Games" description="Schedule the matches showing at your venue." actions={<Button onClick={openCreate}><Plus className="size-4" />Add Game</Button>} />
      {games.isLoading ? <TableSkeleton /> : (
        <DataTable data={games.data ?? []} columns={columns} rowKey={(g) => g.id} searchKeys={["title", "league"]} searchPlaceholder="Search games…" />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit game" : "Add game"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2"><Label>Match title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>League</Label><Input value={form.league} onChange={(e) => setForm({ ...form, league: e.target.value })} /></div>
            <div className="space-y-2"><Label>Kick-off</Label><Input type="datetime-local" value={toDatetimeLocal(form.schedule)} onChange={(e) => setForm({ ...form, schedule: new Date(e.target.value).toISOString() })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={!form.title || save.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title="Delete game?" description={`"${toDelete?.title}" will be removed.`} destructive confirmLabel="Delete" onConfirm={() => { if (toDelete) remove.mutate(toDelete.id); setToDelete(null); }} />
    </div>
  );
}
