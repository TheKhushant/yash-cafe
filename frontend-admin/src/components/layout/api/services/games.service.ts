import type { Game } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db, DEMO_VENUE_ID, uid } from "../mock-data";

export type GameInput = Omit<Game, "id" | "venueId">;

function scoped(venueId: string | null): Game[] {
  const all = db().games;
  return venueId ? all.filter((g) => g.venueId === venueId) : all;
}

export const gamesService = {
  async list(venueId: string | null): Promise<Game[]> {
    if (USE_MOCKS) {
      return delay([...scoped(venueId)].sort((a, b) => a.schedule.localeCompare(b.schedule)));
    }
    const { data } = await apiClient.get<Game[]>("/games", { params: { venueId } });
    return data;
  },

  async create(input: GameInput, venueId: string | null): Promise<Game> {
    if (USE_MOCKS) {
      const game: Game = { id: uid("game"), venueId: venueId ?? DEMO_VENUE_ID, ...input };
      db().games.unshift(game);
      return delay(game, 250);
    }
    const { data } = await apiClient.post<Game>("/games", input);
    return data;
  },

  async update(id: string, input: Partial<Game>): Promise<Game> {
    if (USE_MOCKS) {
      const game = db().games.find((g) => g.id === id);
      if (!game) throw new Error("Game not found");
      Object.assign(game, input);
      return delay({ ...game }, 250);
    }
    const { data } = await apiClient.patch<Game>(`/games/${id}`, input);
    return data;
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCKS) {
      const list = db().games;
      const idx = list.findIndex((g) => g.id === id);
      if (idx >= 0) list.splice(idx, 1);
      return delay(undefined, 200);
    }
    await apiClient.delete(`/games/${id}`);
  },
};
