import type { Player } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db } from "../mock-data";

function scoped(venueId: string | null): Player[] {
  const all = db().quizPlayers;
  return venueId ? all.filter((p) => p.venueId === venueId) : all;
}

export const quizPlayerService = {
  async list(venueId: string | null): Promise<Player[]> {
    if (USE_MOCKS) return delay([...scoped(venueId)]);
    const { data } = await apiClient.get<Player[]>("/quiz/players", { params: { venueId } });
    return data;
  },

  async setStatus(id: string, status: Player["status"]): Promise<Player> {
    if (USE_MOCKS) {
      const player = db().quizPlayers.find((p) => p.id === id);
      if (!player) throw new Error("Player not found");
      player.status = status;
      return delay({ ...player }, 150);
    }
    const { data } = await apiClient.patch<Player>(`/quiz/players/${id}/status`, { status });
    return data;
  },

  async resetScore(id: string): Promise<Player> {
    if (USE_MOCKS) {
      const player = db().quizPlayers.find((p) => p.id === id);
      if (!player) throw new Error("Player not found");
      player.totalScore = 0;
      player.wins = 0;
      return delay({ ...player }, 150);
    }
    const { data } = await apiClient.post<Player>(`/quiz/players/${id}/reset-score`, {});
    return data;
  },
};