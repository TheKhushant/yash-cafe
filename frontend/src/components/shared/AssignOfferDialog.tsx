import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  assignedOffersService,
  offerBenefitSummary,
  offerStatus,
} from "@/lib/api/services/assigned-offers";
import { formatDate } from "@/lib/format";
import type { Offer } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

export function AssignOfferDialog({
  open,
  onOpenChange,
  userId,
  userName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}) {
  const scope = useAuthStore((s) => s.venueScope)();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Offer | null>(null);

  const offers = useQuery({
    queryKey: ["assignable-offers", scope],
    queryFn: () => assignedOffersService.listAssignable(scope),
    enabled: open,
  });

  const assign = useMutation({
    mutationFn: () => assignedOffersService.assign(userId, selected!.id, scope),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["offers"] });
      toast.success(`"${selected?.name}" assigned to ${userName}`);
      setSelected(null);
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Could not assign offer");
    },
  });

  const columns: Column<Offer>[] = [
    {
      key: "name",
      header: "Offer Name",
      render: (o) => (
        <div className="flex items-center gap-2">
          {selected?.id === o.id ? <CheckCircle2 className="size-4 text-primary" /> : null}
          <div>
            <div className="font-medium text-foreground">{o.name}</div>
            {o.code ? <div className="text-xs text-muted-foreground">Code: {o.code}</div> : null}
          </div>
        </div>
      ),
      sortValue: (o) => o.name,
    },
    { key: "discount", header: "Discount", render: (o) => offerBenefitSummary(o) },
    { key: "type", header: "Offer Type", render: (o) => o.type, sortValue: (o) => o.type },
    {
      key: "expiryDate",
      header: "Expiry Date",
      render: (o) => formatDate(o.endDate),
      sortValue: (o) => o.endDate,
    },
    {
      key: "status",
      header: "Status",
      render: (o) => <StatusBadge status={offerStatus(o)} />,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setSelected(null); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Offer to {userName}</DialogTitle>
          <DialogDescription>
            Pick one Active offer below. It will be assigned only to this customer and becomes
            usable starting tomorrow.
          </DialogDescription>
        </DialogHeader>

        <DataTable
          data={offers.data ?? []}
          columns={columns}
          rowKey={(o) => o.id}
          searchKeys={["name", "code", "type"]}
          searchPlaceholder="Search offers…"
          emptyMessage={offers.isLoading ? "Loading offers…" : "No active offers available."}
          onRowClick={(o) => setSelected(o)}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!selected || assign.isPending} onClick={() => assign.mutate()}>
            {assign.isPending ? "Assigning…" : "Assign Offer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}