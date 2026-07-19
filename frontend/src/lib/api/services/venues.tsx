import type { Venue } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db, uid } from "../mock-data";

export type VenueInput = Omit<Venue, "id" | "createdAt" | "revenue">;

export const venuesService = {
  async list(): Promise<Venue[]> {
    if (USE_MOCKS) return delay([...db().venues]);
    const { data } = await apiClient.get<Venue[]>("/venues");
    return data;
  },

  async create(input: VenueInput): Promise<Venue> {
    if (USE_MOCKS) {
      const venue: Venue = {
        id: uid("venue"),
        createdAt: new Date().toISOString(),
        revenue: 0,
        ...input,
      };
      db().venues.unshift(venue);
      return delay(venue, 250);
    }
    const { data } = await apiClient.post<Venue>("/venues", input);
    return data;
  },

  async update(id: string, input: Partial<Venue>): Promise<Venue> {
    if (USE_MOCKS) {
      const venue = db().venues.find((v) => v.id === id);
      if (!venue) throw new Error("Venue not found");
      Object.assign(venue, input);
      return delay({ ...venue }, 250);
    }
    const { data } = await apiClient.patch<Venue>(`/venues/${id}`, input);
    return data;
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCKS) {
      const list = db().venues;
      const idx = list.findIndex((v) => v.id === id);
      if (idx >= 0) list.splice(idx, 1);
      return delay(undefined, 200);
    }
    await apiClient.delete(`/venues/${id}`);
  },
};
