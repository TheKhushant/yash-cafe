import type { Offer } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db, DEMO_VENUE_ID, uid } from "../mock-data";

export type OfferInput = Omit<
  Offer,
  "id" | "venueId" | "assignedCount" | "redeemedCount" | "createdAt"
>;

function scoped(venueId: string | null): Offer[] {
  const all = db().offers;
  return venueId ? all.filter((o) => o.venueId === venueId) : all;
}

export const offersService = {
  async list(venueId: string | null): Promise<Offer[]> {
    if (USE_MOCKS) {
      return delay(
        [...scoped(venueId)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
    }
    const { data } = await apiClient.get<Offer[]>("/offers", { params: { venueId } });
    return data;
  },

  async create(input: OfferInput, venueId: string | null): Promise<Offer> {
    if (USE_MOCKS) {
      const offer: Offer = {
        id: uid("off"),
        venueId: venueId ?? DEMO_VENUE_ID,
        assignedCount: 0,
        redeemedCount: 0,
        createdAt: new Date().toISOString(),
        ...input,
      };
      db().offers.unshift(offer);
      return delay(offer, 250);
    }
    const { data } = await apiClient.post<Offer>("/offers", input);
    return data;
  },

  async update(id: string, input: Partial<Offer>): Promise<Offer> {
    if (USE_MOCKS) {
      const offer = db().offers.find((o) => o.id === id);
      if (!offer) throw new Error("Offer not found");
      Object.assign(offer, input);
      return delay({ ...offer }, 250);
    }
    const { data } = await apiClient.patch<Offer>(`/offers/${id}`, input);
    return data;
  },

  async duplicate(id: string): Promise<Offer> {
    if (USE_MOCKS) {
      const offer = db().offers.find((o) => o.id === id);
      if (!offer) throw new Error("Offer not found");
      const copy: Offer = {
        ...offer,
        id: uid("off"),
        name: `${offer.name} (Copy)`,
        code: offer.code ? `${offer.code}-COPY` : undefined,
        enabled: false,
        assignedCount: 0,
        redeemedCount: 0,
        createdAt: new Date().toISOString(),
      };
      db().offers.unshift(copy);
      return delay(copy, 250);
    }
    const { data } = await apiClient.post<Offer>(`/offers/${id}/duplicate`, {});
    return data;
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCKS) {
      const list = db().offers;
      const idx = list.findIndex((o) => o.id === id);
      if (idx >= 0) list.splice(idx, 1);
      return delay(undefined, 200);
    }
    await apiClient.delete(`/offers/${id}`);
  },
};