import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { PageSkeleton } from "@/components/shared/Skeletons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { eventsService, type EventInput } from "@/lib/api/services/events";
import { formatCurrencyPrecise, formatDateTime, toDatetimeLocal } from "@/lib/format";
import type { VenueEvent } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

const EMPTY: EventInput = {
  title: "", description: "", date: new Date().toISOString(), ticketPrice: 0, capacity: 50, status: "Draft",
};

export default function EventsPage() {
  const scope = useAuthStore((s) => s.venueScope)();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VenueEvent | null>(null);
  const [form, setForm] = useState<EventInput>(EMPTY);
  const [toDelete, setToDelete] = useState<VenueEvent | null>(null);

  const events = useQuery({ queryKey: ["events", scope], queryFn: () => eventsService.list(scope) });
  const invalidate = () => { qc.invalidateQueries({ queryKey: ["events"] }); qc.invalidateQueries({ queryKey: ["dashboard-stats"] }); };

  const save = useMutation({
    mutationFn: () => editing ? eventsService.update(editing.id, form) : eventsService.create(form, scope),
    onSuccess: () => { invalidate(); setOpen(false); toast.success(editing ? "Event updated" : "Event created"); },
  });
  const patch = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VenueEvent> }) => eventsService.update(id, data),
    onSuccess: () => invalidate(),
  });
  const remove = useMutation({
    mutationFn: (id: string) => eventsService.remove(id),
    onSuccess: () => { invalidate(); toast.success("Event deleted"); },
  });

  function openCreate() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(e: VenueEvent) {
    setEditing(e);
    setForm({ title: e.title, description: e.description, date: e.date, ticketPrice: e.ticketPrice, capacity: e.capacity, status: e.status });
    setOpen(true);
  }

  if (events.isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Plan watch parties and ticketed match days."
        actions={<Button onClick={openCreate}><Plus className="size-4" />New Event</Button>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(events.data ?? []).map((e) => (
          <Card key={e.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold leading-snug text-foreground">{e.title}</h3>
              <StatusBadge status={e.status} />
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="size-4" />{formatDateTime(e.date)}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Users className="size-4" />{e.attendance}/{e.capacity} attending • {formatCurrencyPrecise(e.ticketPrice)}</div>
              <Progress value={(e.attendance / e.capacity) * 100} className="h-1.5" />
            </div>
            <div className="mt-4 flex items-center gap-2 border-t pt-4">
              <Button variant="outline" size="sm" onClick={() => openEdit(e)}>Edit</Button>
              <Button variant="ghost" size="sm" onClick={() => patch.mutate({ id: e.id, data: { status: e.status === "Published" ? "Draft" : "Published" } })}>
                {e.status === "Published" ? "Unpublish" : "Publish"}
              </Button>
              <Button variant="ghost" size="sm" className="ml-auto text-destructive" onClick={() => setToDelete(e)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit event" : "New event"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>Date & time</Label><Input type="datetime-local" value={toDatetimeLocal(form.date)} onChange={(e) => setForm({ ...form, date: new Date(e.target.value).toISOString() })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Ticket price</Label><Input type="number" step="0.01" value={form.ticketPrice} onChange={(e) => setForm({ ...form, ticketPrice: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={!form.title || save.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete event?"
        description={`"${toDelete?.title}" will be permanently removed.`}
        destructive confirmLabel="Delete"
        onConfirm={() => { if (toDelete) remove.mutate(toDelete.id); setToDelete(null); }}
      />
    </div>
  );
}
