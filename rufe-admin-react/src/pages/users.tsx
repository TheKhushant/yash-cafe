import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { usersService } from "@/lib/api/services/users";
import { formatCurrencyPrecise, formatDate } from "@/lib/format";
import type { PlatformUser } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

export default function UsersPage() {
  const scope = useAuthStore((s) => s.venueScope)();
  const qc = useQueryClient();
  const [active, setActive] = useState<PlatformUser | null>(null);

  const users = useQuery({ queryKey: ["users", scope], queryFn: () => usersService.list(scope) });
  const history = useQuery({
    queryKey: ["user-history", active?.id],
    queryFn: () => usersService.history(active!.id),
    enabled: !!active,
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PlatformUser["status"] }) => usersService.setStatus(id, status),
    onSuccess: (u) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setActive((cur) => (cur ? { ...cur, status: u.status } : cur));
      toast.success(`${u.name} ${u.status === "Blocked" ? "blocked" : "unblocked"}`);
    },
  });

  const columns: Column<PlatformUser>[] = [
    { key: "name", header: "Name", render: (u) => <span className="font-medium text-foreground">{u.name}</span>, sortValue: (u) => u.name },
    { key: "email", header: "Email", className: "text-muted-foreground", sortValue: (u) => u.email },
    { key: "totalOrders", header: "Orders", sortValue: (u) => u.totalOrders },
    { key: "totalBookings", header: "Bookings", sortValue: (u) => u.totalBookings },
    { key: "joinedAt", header: "Joined", render: (u) => formatDate(u.joinedAt), sortValue: (u) => u.joinedAt },
    { key: "status", header: "Status", render: (u) => <StatusBadge status={u.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="View customer activity and manage access." />
      {users.isLoading ? <TableSkeleton /> : (
        <DataTable data={users.data ?? []} columns={columns} rowKey={(u) => u.id} searchKeys={["name", "email"]} searchPlaceholder="Search users…" onRowClick={(u) => setActive(u)} />
      )}

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {active ? (
            <>
              <SheetHeader>
                <SheetTitle>{active.name}</SheetTitle>
                <SheetDescription>{active.email}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-6 px-4 pb-6">
                <div className="flex items-center justify-between">
                  <StatusBadge status={active.status} />
                  <Button
                    variant={active.status === "Blocked" ? "default" : "destructive"}
                    size="sm"
                    onClick={() => setStatus.mutate({ id: active.id, status: active.status === "Blocked" ? "Active" : "Blocked" })}
                  >
                    {active.status === "Blocked" ? "Unblock" : "Block"}
                  </Button>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-semibold">Booking history</h4>
                  <div className="space-y-2">
                    {(history.data?.bookings ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No bookings.</p>
                    ) : history.data?.bookings.map((b) => (
                      <div key={b.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                        <span className="truncate">{b.eventTitle}</span>
                        <StatusBadge status={b.status} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-semibold">Order history</h4>
                  <div className="space-y-2">
                    {(history.data?.orders ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No orders.</p>
                    ) : history.data?.orders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                        <span>{o.id}</span>
                        <span className="font-medium">{formatCurrencyPrecise(o.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
