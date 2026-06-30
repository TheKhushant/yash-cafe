import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { menuService, type MenuInput } from "@/lib/api/services/menu.service";
import { formatCurrencyPrecise } from "@/lib/format";
import type { MenuItem } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/_authenticated/menu")({
  component: MenuPage,
});

const EMPTY: MenuInput = {
  name: "", category: "Mains", price: 0, stock: 0, enabled: true, description: "",
};

function MenuPage() {
  const scope = useAuthStore((s) => s.venueScope)();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuInput>(EMPTY);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<MenuItem | null>(null);

  const items = useQuery({ queryKey: ["menu", scope], queryFn: () => menuService.list(scope) });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["menu"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const save = useMutation({
    mutationFn: () =>
      editing ? menuService.update(editing.id, form) : menuService.create(form, scope),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      toast.success(editing ? "Item updated" : "Item added");
    },
  });

  const patch = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MenuItem> }) => menuService.update(id, data),
    onSuccess: () => invalidate(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => menuService.remove(id),
    onSuccess: () => { invalidate(); toast.success("Item deleted"); },
  });

  function openCreate() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(m: MenuItem) {
    setEditing(m);
    setForm({ name: m.name, category: m.category, price: m.price, stock: m.stock, enabled: m.enabled, description: m.description, outOfStock: m.outOfStock });
    setOpen(true);
  }

  const columns: Column<MenuItem>[] = [
    { key: "name", header: "Item", render: (m) => <span className="font-medium text-foreground">{m.name}</span>, sortValue: (m) => m.name },
    { key: "category", header: "Category", sortValue: (m) => m.category },
    { key: "price", header: "Price", render: (m) => formatCurrencyPrecise(m.price), sortValue: (m) => m.price },
    { key: "stock", header: "Stock", render: (m) => <span className={m.stock <= 5 ? "text-warning-foreground" : ""}>{m.stock}</span>, sortValue: (m) => m.stock },
    {
      key: "status", header: "Availability",
      render: (m) => (m.outOfStock ? <StatusBadge status="Out of Stock" tone="danger" /> : m.enabled ? <StatusBadge status="Available" tone="success" /> : <StatusBadge status="Disabled" tone="neutral" />),
    },
    {
      key: "actions", header: "", headerClassName: "text-right", className: "text-right",
      render: (m) => (
        <div className="flex items-center justify-end gap-1">
          <Switch checked={!m.outOfStock} onCheckedChange={(v) => patch.mutate({ id: m.id, data: { outOfStock: !v } })} title="In stock" />
          <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(m)}><Pencil className="size-4" /></Button>
          <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => setToDelete(m)}><Trash2 className="size-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu & Inventory"
        description="Manage items, pricing and stock availability."
        actions={<Button onClick={openCreate}><Plus className="size-4" />Add Item</Button>}
      />

      {items.isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable data={items.data ?? []} columns={columns} rowKey={(m) => m.id} searchKeys={["name", "category"]} searchPlaceholder="Search menu…" />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit item" : "Add item"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Price</Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Stock</Label>
              <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <Label>Enabled</Label>
              <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={!form.name || save.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete item?"
        description={`"${toDelete?.name}" will be permanently removed.`}
        destructive
        confirmLabel="Delete"
        onConfirm={() => { if (toDelete) remove.mutate(toDelete.id); setToDelete(null); }}
      />
    </div>
  );
}
