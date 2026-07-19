import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, QrCode, Tag } from "lucide-react";

import { AssignOfferDialog } from "@/components/shared/AssignOfferDialog";
import { AssignedOfferQrDialog } from "@/components/shared/AssignedOfferQrDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { assignedOffersService } from "@/lib/api/services/assigned-offers";
import { usersService } from "@/lib/api/services/users";
import { formatCurrencyPrecise, formatDate, formatDateTime } from "@/lib/format";
import type { AssignedOffer, AssignedOfferStatus, PlatformUser } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

const ASSIGNED_OFFER_TONE: Record<AssignedOfferStatus, "success" | "info" | "neutral" | "danger"> = {
  Assigned: "success",
  Used: "info",
  Expired: "neutral",
  Cancelled: "danger",
};

function AssignedOfferCard({
  offer,
  onCancel,
  onResend,
  onViewQr,
}: {
  offer: AssignedOffer;
  onCancel?: (offer: AssignedOffer) => void;
  onResend?: (offer: AssignedOffer) => void;
  onViewQr?: (offer: AssignedOffer) => void;
}) {
  const showActions = onCancel || onResend || onViewQr;
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-foreground">{offer.name}</span>
        <div className="flex items-center gap-1">
          <StatusBadge status={offer.status} tone={ASSIGNED_OFFER_TONE[offer.status]} />
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {onViewQr && (
                  <DropdownMenuItem onClick={() => onViewQr(offer)}>
                    <QrCode className="size-4" /> View QR
                  </DropdownMenuItem>
                )}
                {onResend && (
                  <DropdownMenuItem onClick={() => onResend(offer)}>
                    Resend Notification
                  </DropdownMenuItem>
                )}
                {onCancel && offer.status === "Assigned" && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onCancel(offer)}
                  >
                    Cancel Offer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {offer.type}
        {offer.code ? ` • Code: ${offer.code}` : ""}
        {offer.discountSummary ? ` • ${offer.discountSummary}` : ""}
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Assigned</p>
          <p className="font-medium text-foreground">{formatDateTime(offer.assignedAt)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Valid From</p>
          <p className="font-medium text-foreground">{formatDate(offer.validFrom)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Expiry</p>
          <p className="font-medium text-foreground">{formatDate(offer.expiryDate)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Used At</p>
          <p className="font-medium text-foreground">
            {offer.usedAt ? formatDateTime(offer.usedAt) : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const scope = useAuthStore((s) => s.venueScope)();
  const qc = useQueryClient();
  const [active, setActive] = useState<PlatformUser | null>(null);
  const [assignOfferOpen, setAssignOfferOpen] = useState(false);
  const [qrOffer, setQrOffer] = useState<AssignedOffer | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AssignedOffer | null>(null);

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

  const cancelOffer = useMutation({
    mutationFn: (offer: AssignedOffer) => assignedOffersService.cancel(offer.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Offer assignment cancelled");
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Could not cancel offer"),
  });

  const resendOffer = useMutation({
    mutationFn: (offer: AssignedOffer) => assignedOffersService.resendNotification(offer.id, scope),
    onSuccess: () => toast.success("Notification resent"),
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Could not resend notification"),
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
          {active ? (() => {
            // Always render the freshest copy of this user (status + assigned offers)
            // so cancel/resend/assign actions reflect immediately without closing the sheet.
            const current = users.data?.find((u) => u.id === active.id) ?? active;
            return (
            <>
              <SheetHeader>
                <SheetTitle>{current.name}</SheetTitle>
                <SheetDescription>{current.email}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-6 px-4 pb-6">
                <div className="flex items-center justify-between">
                  <StatusBadge status={current.status} />
                  <div className="flex items-center gap-2">
                    {current.status === "Active" && (
                      <Button size="sm" variant="outline" onClick={() => setAssignOfferOpen(true)}>
                        <Tag className="size-4" /> Assign Offer
                      </Button>
                    )}
                    <Button
                      variant={current.status === "Blocked" ? "default" : "destructive"}
                      size="sm"
                      onClick={() => setStatus.mutate({ id: current.id, status: current.status === "Blocked" ? "Active" : "Blocked" })}
                    >
                      {current.status === "Blocked" ? "Unblock" : "Block"}
                    </Button>
                  </div>
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
                    {(current.assignedOffers ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No offers have been assigned to this customer.
                      </p>
                    ) : (
                      current.assignedOffers!.map((o) => (
                        <div key={o.id} className="rounded-lg border px-3 py-2.5">
                          <AssignedOfferCard
                            offer={o}
                            onViewQr={setQrOffer}
                            onResend={(offer) => resendOffer.mutate(offer)}
                            onCancel={setCancelTarget}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <AssignOfferDialog
                open={assignOfferOpen}
                onOpenChange={setAssignOfferOpen}
                userId={current.id}
                userName={current.name}
              />
            </>
            );
          })() : null}
        </SheetContent>
      </Sheet>

      <AssignedOfferQrDialog offer={qrOffer} onOpenChange={(o) => !o && setQrOffer(null)} />

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        title="Cancel this offer?"
        description={`"${cancelTarget?.name}" will no longer be usable by this customer.`}
        destructive
        confirmLabel="Cancel Offer"
        onConfirm={() => {
          if (cancelTarget) cancelOffer.mutate(cancelTarget);
          setCancelTarget(null);
        }}
      />
    </div>
  );
}