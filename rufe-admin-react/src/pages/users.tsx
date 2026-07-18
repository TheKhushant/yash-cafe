import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { usersService } from "@/lib/api/services/users";
import { formatCurrencyPrecise, formatDate, formatDateTime } from "@/lib/format";
import type { AssignedOffer, AssignedOfferStatus, PlatformUser } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

const ASSIGNED_OFFER_TONE: Record<AssignedOfferStatus, "success" | "info" | "neutral" | "danger"> = {
  Active: "success",
  Redeemed: "info",
  Expired: "neutral",
  Cancelled: "danger",
};

function AssignedOfferCard({ offer }: { offer: AssignedOffer }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-foreground">{offer.name}</span>
        <StatusBadge status={offer.status} tone={ASSIGNED_OFFER_TONE[offer.status]} />
      </div>
      <p className="text-xs text-muted-foreground">
        {offer.type}
        {offer.code ? ` • Code: ${offer.code}` : ""}
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Assigned</p>
          <p className="font-medium text-foreground">{formatDateTime(offer.assignedAt)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Expires</p>
          <p className="font-medium text-foreground">{formatDateTime(offer.expiresAt)}</p>
        </div>
      </div>
    </div>
  );
}

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
    {
      key: "offers",
      header: "Offers",
      render: (u) => {
        const assigned = u.assignedOffers ?? [];
        if (assigned.length === 0) {
          return <span className="text-sm text-muted-foreground">No Offers</span>;
        }
        const shown = assigned.slice(0, 2);
        const extra = assigned.length - shown.length;
        return (
          <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {shown.map((o) => (
              <Popover key={o.id}>
                <PopoverTrigger asChild>
                  <button type="button">
                    <Badge variant="secondary" className="cursor-pointer font-normal">
                      {o.name}
                    </Badge>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72">
                  <AssignedOfferCard offer={o} />
                </PopoverContent>
              </Popover>
            ))}
            {extra > 0 && (
              <button type="button" onClick={() => setActive(u)}>
                <Badge variant="outline" className="cursor-pointer font-normal">
                  +{extra} More
                </Badge>
              </button>
            )}
          </div>
        );
      },
    },
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

                <div>
                  <h4 className="mb-2 text-sm font-semibold">Assigned offers</h4>
                  <div className="space-y-2">
                    {(active.assignedOffers ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No offers have been assigned to this customer.
                      </p>
                    ) : (
                      active.assignedOffers!.map((o) => (
                        <div key={o.id} className="rounded-lg border px-3 py-2.5">
                          <AssignedOfferCard offer={o} />
                        </div>
                      ))
                    )}
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