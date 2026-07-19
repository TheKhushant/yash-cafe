import QRCode from "react-qr-code";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { assignedOffersService } from "@/lib/api/services/assigned-offers";
import { formatDateTime } from "@/lib/format";
import type { AssignedOffer } from "@/types";

export function AssignedOfferQrDialog({
  offer,
  onOpenChange,
}: {
  offer: AssignedOffer | null;
  onOpenChange: (open: boolean) => void;
}) {
  const payload = offer ? assignedOffersService.buildQrPayload(offer) : null;

  return (
    <Dialog open={!!offer} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{offer?.name}</DialogTitle>
          <DialogDescription>
            Scan this code at the venue to redeem. Valid until {offer ? formatDateTime(offer.expiryDate) : ""}.
          </DialogDescription>
        </DialogHeader>
        {offer && payload ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="rounded-lg border bg-white p-4">
              <QRCode value={JSON.stringify(payload)} size={200} />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              This QR uniquely identifies this assigned offer — it cannot be reused once redeemed.
            </p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}