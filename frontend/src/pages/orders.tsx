import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ordersService } from "@/lib/api/services/orders";
import { formatCurrencyPrecise, relativeTime } from "@/lib/format";
import type { Order, OrderStatus } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

const STATUSES: OrderStatus[] = [
   "Order Recived", "Paid", "Cancelled",
];
// "Pending", 

export default function OrdersPage() {
  const scope = useAuthStore((s) => s.venueScope)();
  const qc = useQueryClient();
  const [active, setActive] = useState<Order | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const orders = useQuery({
    queryKey: ["orders", scope],
    queryFn: () => ordersService.list(scope),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersService.updateStatus(id, status),
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setActive((cur) => (cur ? { ...cur, status: order.status } : cur));
      toast.success(`Order ${order.id} marked ${order.status}`);
    },
    onError: () => toast.error("Could not update order"),
  });

  const data = (orders.data ?? []).filter((o) => filter === "all" || o.status === filter);

  const columns: Column<Order>[] = [
    { key: "id", header: "Order", render: (o) => <span className="font-medium text-foreground">{o.id}</span>, sortValue: (o) => o.id },
    { key: "customerName", header: "Customer", sortValue: (o) => o.customerName },
    { key: "table", header: "Table" },
    { key: "items", header: "Items", render: (o) => <span className="text-muted-foreground">{o.items.reduce((s, i) => s + i.quantity, 0)} items</span> },
    { key: "total", header: "Total", render: (o) => formatCurrencyPrecise(o.total), sortValue: (o) => o.total },
    { key: "status", header: "Status", render: (o) => <StatusBadge status={o.status} />, sortValue: (o) => o.status },
    { key: "createdAt", header: "Placed", render: (o) => <span className="text-muted-foreground">{relativeTime(o.createdAt)}</span>, sortValue: (o) => o.createdAt },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Track and manage every order across the floor." />

      {orders.isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          data={data}
          columns={columns}
          rowKey={(o) => o.id}
          searchKeys={["id", "customerName", "table"]}
          searchPlaceholder="Search orders…"
          onRowClick={(o) => setActive(o)}
          toolbar={
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          {active ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {active.id}
                  <StatusBadge status={active.status} />
                </DialogTitle>
                <DialogDescription>
                  {active.customerName} • Table {active.table} • {relativeTime(active.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                {active.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                    <span>{it.quantity}× {it.name}</span>
                    <span className="font-medium">{formatCurrencyPrecise(it.price * it.quantity)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t pt-3 text-sm font-semibold">
                  <span>Total</span>
                  <span>{formatCurrencyPrecise(active.total)}</span>
                </div>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Select
                  value={active.status}
                  onValueChange={(v) => update.mutate({ id: active.id, status: v as OrderStatus })}
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setActive(null)}>Close</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
