import type { MenuItem } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db, DEMO_VENUE_ID, uid } from "../mock-data";

export type MenuInput = Omit<MenuItem, "id" | "venueId" | "outOfStock"> & {
  outOfStock?: boolean;
};

function scoped(venueId: string | null): MenuItem[] {
  const all = db().menu;
  return venueId ? all.filter((m) => m.venueId === venueId) : all;
}

export const menuService = {
  async list(venueId: string | null): Promise<MenuItem[]> {
    if (USE_MOCKS) return delay([...scoped(venueId)]);
    const { data } = await apiClient.get<MenuItem[]>("/menu", { params: { venueId } });
    return data;
  },

  async create(input: MenuInput, venueId: string | null): Promise<MenuItem> {
    if (USE_MOCKS) {
      const item: MenuItem = {
        id: uid("menu"),
        venueId: venueId ?? DEMO_VENUE_ID,
        outOfStock: input.outOfStock ?? false,
        ...input,
      };
      db().menu.unshift(item);
      return delay(item, 250);
    }
    const { data } = await apiClient.post<MenuItem>("/menu", input);
    return data;
  },

  async update(id: string, input: Partial<MenuItem>): Promise<MenuItem> {
    if (USE_MOCKS) {
      const item = db().menu.find((m) => m.id === id);
      if (!item) throw new Error("Item not found");
      Object.assign(item, input);
      return delay({ ...item }, 250);
    }
    const { data } = await apiClient.patch<MenuItem>(`/menu/${id}`, input);
    return data;
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCKS) {
      const list = db().menu;
      const idx = list.findIndex((m) => m.id === id);
      if (idx >= 0) list.splice(idx, 1);
      return delay(undefined, 200);
    }
    await apiClient.delete(`/menu/${id}`);
  },
};
