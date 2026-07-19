// src/routes/_authenticated.bars.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { venuesService, type VenueInput } from "@/lib/api/services/venues";
import { formatCurrency } from "@/lib/format";
import type { Venue } from "@/types";

const EMPTY: VenueInput = { name: "", city: "", owner: "", status: "Active" };

export default function BarsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Venue | null>(null);
  const [form, setForm] = useState<VenueInput>(EMPTY);
  const [toDelete, setToDelete] = useState<Venue | null>(null);

  const venues = useQuery({ queryKey: ["venues"], queryFn: () => venuesService.list() });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["venues"] });

  const save = useMutation({
    mutationFn: () => editing 
      ? venuesService.update(editing.id, form) 
      : venuesService.create(form),
    onSuccess: () => { invalidate(); setOpen(false); toast.success(editing ? "Bar updated" : "Bar added"); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => venuesService.remove(id),
    onSuccess: () => { invalidate(); toast.success("Bar deleted"); },
  });

  const columns: Column<Venue>[] = [
    { key: "name", header: "Bar Name", render: (v) => <span className="font-medium">{v.name}</span> },
    { key: "city", header: "City" },
    { key: "owner", header: "Owner" },
    { key: "status", header: "Status", render: (v) => <StatusBadge status={v.status} /> },
    { key: "revenue", header: "Revenue", render: (v) => formatCurrency(v.revenue) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Bars" 
        description="Manage all venues on the platform" 
        actions={<Button onClick={() => {setEditing(null); setForm(EMPTY); setOpen(true);}}><Plus className="size-4" />Add Bar</Button>}
        // icon={Building2}
      />

      {venues.isLoading ? <TableSkeleton /> : (
        <DataTable data={venues.data ?? []} columns={columns} rowKey={(v) => v.id} />
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Bar" : "Add New Bar"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><Label>City</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></div>
            <div><Label>Owner</Label><Input value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
            open={!!toDelete}
            onOpenChange={(open) => {
                if (!open) setToDelete(null);
            }}
            title="Delete Bar?"
            description="This action cannot be undone."
            destructive
            onConfirm={() => {
                if (toDelete) {
                remove.mutate(toDelete.id);
                setToDelete(null);
                }
            }}
        />
    </div>
  );
}