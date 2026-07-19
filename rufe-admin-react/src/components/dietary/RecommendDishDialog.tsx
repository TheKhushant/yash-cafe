import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CompatibilityCard } from "@/components/dietary/CompatibilityCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { computeCompatibility } from "@/lib/dietary";
import { notificationsService } from "@/lib/api/services/notifications";
import { usersService } from "@/lib/api/services/users";
import type { MenuItem } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

export function RecommendDishDialog({
  item,
  onOpenChange,
}: {
  item: MenuItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const scope = useAuthStore((s) => s.venueScope)();
  const qc = useQueryClient();
  const [customerId, setCustomerId] = useState<string>("");
  const [acknowledged, setAcknowledged] = useState(false);

  const users = useQuery({
    queryKey: ["users", scope],
    queryFn: () => usersService.list(scope),
    enabled: !!item,
  });

  const activeCustomers = (users.data ?? []).filter((u) => u.status === "Active" && u.role === "user");
  const customer = activeCustomers.find((u) => u.id === customerId);

  const result = useMemo(
    () => (item && customer ? computeCompatibility(item, customer.dietaryPreferences) : null),
    [item, customer],
  );

  const requiresAcknowledgement = result ? result.score <= 30 : false;

  const assign = useMutation({
    mutationFn: async () => {
      if (!item || !customer) throw new Error("Pick a customer first");
      await notificationsService.send(
        {
          type: "Announcement",
          title: "👨‍🍳 A dish was recommended for you",
          message: `${item.name} was recommended for you by the team.${result && result.score < 80 ? " Please check the ingredient list before ordering." : ""}`,
          audience: customer.name,
        },
        scope,
        customer.id,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(`Recommended "${item?.name}" to ${customer?.name}`);
      close();
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Could not assign dish"),
  });

  function close() {
    setCustomerId("");
    setAcknowledged(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Recommend "{item?.name}"</DialogTitle>
          <DialogDescription>
            Pick a customer to check compatibility before recommending or assigning this dish.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setAcknowledged(false); }}>
            <SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger>
            <SelectContent>
              {activeCustomers.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {result && <CompatibilityCard result={result} />}

          {customer && !customer.dietaryPreferences && (
            <p className="text-xs text-muted-foreground">
              This customer hasn't set dietary preferences yet, so nothing to check against.
            </p>
          )}

          {requiresAcknowledgement && (
            <label className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm">
              <Checkbox checked={acknowledged} onCheckedChange={(v) => setAcknowledged(v === true)} className="mt-0.5" />
              I've reviewed the conflicts above and want to assign this dish anyway.
            </label>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button
            disabled={!customer || (requiresAcknowledgement && !acknowledged) || assign.isPending}
            onClick={() => assign.mutate()}
          >
            {assign.isPending ? "Assigning…" : "Assign Anyway"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}