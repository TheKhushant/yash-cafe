import type {
  AssignedOffer,
  AssignedOfferQrPayload,
  AssignedOfferWithUser,
  Offer,
  OfferStatus,
} from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db, uid } from "../mock-data";
import { notificationsService } from "./notifications";

/** Same "is this offer currently live" rule used on the Offers page. */
export function offerStatus(o: Offer): OfferStatus {
  if (!o.enabled) return "Disabled";
  if (new Date(o.endDate).getTime() < Date.now()) return "Expired";
  return "Active";
}

export function offerBenefitSummary(o: Offer): string {
  switch (o.type) {
    case "Flat Discount":
      return `$${o.discountValue ?? 0} off`;
    case "Percentage Discount":
      return `${o.discountValue ?? 0}% off`;
    case "Cashback":
      return `$${o.discountValue ?? 0} cashback`;
    case "Free Item":
      return `Free ${o.freeItemName || "item"}`;
    case "Coupon Code":
      return o.code ? `Code: ${o.code}` : "Coupon";
    default:
      return o.benefitDetails || o.type;
  }
}

/** Midnight, `days` days from now, in local time — used to compute validFrom/expiry boundaries. */
function startOfDay(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Any Assigned offer whose expiry has passed is flipped to Expired.
 * Called at the top of every read so the UI never shows a stale "Assigned" badge.
 */
function sweepExpired(): void {
  const now = Date.now();
  for (const a of db().assignedOffers) {
    if (a.status === "Assigned" && new Date(a.expiryDate).getTime() < now) {
      a.status = "Expired";
    }
  }
}

export interface RedeemResult {
  ok: boolean;
  reason: string;
  assignedOffer?: AssignedOffer;
}

export const assignedOffersService = {
  /** All offers assignable right now (Active + not expired), for the Assign Offer picker. */
  async listAssignable(venueId: string | null): Promise<Offer[]> {
    if (USE_MOCKS) {
      const all = venueId ? db().offers.filter((o) => o.venueId === venueId) : db().offers;
      return delay(all.filter((o) => offerStatus(o) === "Active"));
    }
    const { data } = await apiClient.get<Offer[]>("/offers", {
      params: { venueId, status: "Active" },
    });
    return data;
  },

  async listForUser(userId: string): Promise<AssignedOffer[]> {
    sweepExpired();
    if (USE_MOCKS) {
      return delay(
        db()
          .assignedOffers.filter((a) => a.userId === userId)
          .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt)),
      );
    }
    const { data } = await apiClient.get<AssignedOffer[]>(`/users/${userId}/offers`);
    return data;
  },

  async listForOffer(offerId: string): Promise<AssignedOfferWithUser[]> {
    sweepExpired();
    if (USE_MOCKS) {
      const rows = db().assignedOffers.filter((a) => a.offerId === offerId);
      const joined = rows.map((a) => {
        const user = db().users.find((u) => u.id === a.userId);
        return { ...a, userName: user?.name ?? "Unknown", userEmail: user?.email ?? "" };
      });
      return delay(joined.sort((a, b) => b.assignedAt.localeCompare(a.assignedAt)));
    }
    const { data } = await apiClient.get<AssignedOfferWithUser[]>(
      `/offers/${offerId}/assigned-users`,
    );
    return data;
  },

  /** Assign an Active offer to a specific (Active) user. Creates the relationship row + notifies the user. */
  async assign(userId: string, offerId: string, venueId: string | null): Promise<AssignedOffer> {
    if (USE_MOCKS) {
      const user = db().users.find((u) => u.id === userId);
      if (!user) throw new Error("User not found");
      if (user.status !== "Active") throw new Error("Only Active users can be assigned offers");

      const offer = db().offers.find((o) => o.id === offerId);
      if (!offer) throw new Error("Offer not found");
      if (offerStatus(offer) !== "Active") throw new Error("Only Active offers can be assigned");

      const assignedAt = new Date().toISOString();
      const validFrom = startOfDay(1).toISOString(); // usable starting tomorrow, never same-day
      const expiryDate = offer.endDate;

      const assigned: AssignedOffer = {
        id: uid("uoff"),
        userId,
        offerId,
        name: offer.name,
        type: offer.type,
        code: offer.code,
        discountSummary: offerBenefitSummary(offer),
        description: offer.description,
        assignedAt,
        validFrom,
        expiryDate,
        status: "Assigned",
        usedAt: null,
        venueId: offer.venueId,
      };
      db().assignedOffers.unshift(assigned);
      offer.assignedCount += 1;

      await assignedOffersService.notifyAssignment(assigned, venueId);

      return delay(assigned, 250);
    }
    const { data } = await apiClient.post<AssignedOffer>(`/users/${userId}/offers`, { offerId });
    return data;
  },

  async cancel(assignedOfferId: string): Promise<AssignedOffer> {
    if (USE_MOCKS) {
      const a = db().assignedOffers.find((x) => x.id === assignedOfferId);
      if (!a) throw new Error("Assigned offer not found");
      if (a.status !== "Assigned") throw new Error("Only active assignments can be cancelled");
      a.status = "Cancelled";
      return delay({ ...a }, 200);
    }
    const { data } = await apiClient.delete<AssignedOffer>(
      `/users/_/offers/${assignedOfferId}`,
    );
    return data;
  },

  /** Re-send the "you received a new offer" notification for an existing assignment. */
  async resendNotification(assignedOfferId: string, venueId: string | null): Promise<void> {
    if (USE_MOCKS) {
      const a = db().assignedOffers.find((x) => x.id === assignedOfferId);
      if (!a) throw new Error("Assigned offer not found");
      await assignedOffersService.notifyAssignment(a, venueId);
      return delay(undefined, 200);
    }
    await apiClient.post(`/assigned-offers/${assignedOfferId}/resend-notification`, {});
  },

  async notifyAssignment(a: AssignedOffer, venueId: string | null): Promise<void> {
    const user = db().users.find((u) => u.id === a.userId);
    const validFromLabel = new Date(a.validFrom).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const expiryLabel = new Date(a.expiryDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    await notificationsService.send(
      {
        type: "Offer Assigned",
        title: "🎉 You received a new offer!",
        message: `${a.name}${a.discountSummary ? ` — ${a.discountSummary}` : ""}. Valid from ${validFromLabel}. Expires on ${expiryLabel}.`,
        audience: user?.name ?? "Single customer",
      },
      venueId,
      a.userId,
    );
  },

  /** Builds the payload embedded in the QR code shown to the customer for this assigned offer. */
  buildQrPayload(a: AssignedOffer): AssignedOfferQrPayload {
    // Lightweight non-cryptographic token for the mock backend. A real backend should
    // issue a signed token (HMAC/JWT) here instead so the scanner can verify authenticity.
    const token = btoa(`${a.id}:${a.userId}:${a.offerId}:${a.expiryDate}`);
    return { assignedOfferId: a.id, userId: a.userId, offerId: a.offerId, expiryDate: a.expiryDate, token };
  },

  parseQr(raw: string): AssignedOfferQrPayload | null {
    try {
      const obj = JSON.parse(raw);
      if (obj && typeof obj.assignedOfferId === "string") return obj as AssignedOfferQrPayload;
      return null;
    } catch {
      return null;
    }
  },

  /** Full scanner-side validation + redemption, mirroring bookingsService.checkIn's shape. */
  async redeem(raw: string): Promise<RedeemResult> {
    if (USE_MOCKS) {
      sweepExpired();
      const payload = assignedOffersService.parseQr(raw);
      if (!payload) return delay({ ok: false, reason: "Invalid QR Code" }, 150);

      const a = db().assignedOffers.find((x) => x.id === payload.assignedOfferId);
      if (!a) return delay({ ok: false, reason: "Assigned Offer Not Found" }, 150);
      if (a.userId !== payload.userId || a.offerId !== payload.offerId) {
        return delay({ ok: false, reason: "QR Does Not Match Records", assignedOffer: a }, 150);
      }
      if (a.status === "Cancelled") {
        return delay({ ok: false, reason: "Offer Cancelled", assignedOffer: a }, 150);
      }
      if (a.status === "Used") {
        return delay({ ok: false, reason: "Offer Already Used", assignedOffer: a }, 150);
      }
      if (a.status === "Expired" || new Date(a.expiryDate).getTime() < Date.now()) {
        a.status = "Expired";
        return delay({ ok: false, reason: "Offer Expired", assignedOffer: a }, 150);
      }
      if (new Date(a.validFrom).getTime() > Date.now()) {
        return delay({ ok: false, reason: "Not Valid Yet — Available From Tomorrow", assignedOffer: a }, 150);
      }

      a.status = "Used";
      a.usedAt = new Date().toISOString();
      const offer = db().offers.find((o) => o.id === a.offerId);
      if (offer) offer.redeemedCount += 1;

      return delay({ ok: true, reason: "Offer Valid — Redeemed", assignedOffer: a }, 150);
    }
    const { data } = await apiClient.patch<RedeemResult>(`/assigned-offers/redeem`, { qr: raw });
    return data;
  },
};