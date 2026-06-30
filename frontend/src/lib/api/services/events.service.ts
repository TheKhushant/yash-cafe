import type { VenueEvent } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db, DEMO_VENUE_ID, uid } from "../mock-data";

export type EventInput = Omit<VenueEvent, "id" | "venueId" | "attendance">;

function scoped(venueId: string | null): VenueEvent[] {
  const all = db().events;
  return venueId ? all.filter((e) => e.venueId === venueId) : all;
}

export const eventsService = {
  async list(venueId: string | null): Promise<VenueEvent[]> {
    if (USE_MOCKS) {
      return delay([...scoped(venueId)].sort((a, b) => b.date.localeCompare(a.date)));
    }
    const { data } = await apiClient.get<VenueEvent[]>("/events", { params: { venueId } });
    return data;
  },

  async create(input: EventInput, venueId: string | null): Promise<VenueEvent> {
    if (USE_MOCKS) {
      const ev: VenueEvent = {
        id: uid("evt"),
        venueId: venueId ?? DEMO_VENUE_ID,
        attendance: 0,
        ...input,
      };
      db().events.unshift(ev);
      return delay(ev, 250);
    }
    const { data } = await apiClient.post<VenueEvent>("/events", input);
    return data;
  },

  async update(id: string, input: Partial<VenueEvent>): Promise<VenueEvent> {
    if (USE_MOCKS) {
      const ev = db().events.find((e) => e.id === id);
      if (!ev) throw new Error("Event not found");
      Object.assign(ev, input);
      return delay({ ...ev }, 250);
    }
    const { data } = await apiClient.patch<VenueEvent>(`/events/${id}`, input);
    return data;
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCKS) {
      const list = db().events;
      const idx = list.findIndex((e) => e.id === id);
      if (idx >= 0) list.splice(idx, 1);
      return delay(undefined, 200);
    }
    await apiClient.delete(`/events/${id}`);
  },
};
