import type { LeaderboardEntry } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db } from "../mock-data";
import { quizSessionService } from "./quiz-session";

export type LeaderboardPeriod = "Current Session" | "Today" | "Weekly" | "Monthly";

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0;
  return h;
}

/** Fraction of a player's all-time total that would plausibly belong to this shorter window. */
function periodFactor(period: LeaderboardPeriod, playerId: string): number {
  const h = hash(`${period}-${playerId}`);
  switch (period) {
    case "Today":
      return 0.04 + (h % 10) / 100;
    case "Weekly":
      return 0.22 + (h % 20) / 100;
    case "Monthly":
      return 0.55 + (h % 30) / 100;
    default:
      return 1;
  }
}

export const leaderboardService = {
  async getForPeriod(venueId: string | null, period: LeaderboardPeriod): Promise<LeaderboardEntry[]> {
    if (USE_MOCKS) {
      if (period === "Current Session") {
        const active = await quizSessionService.getActive(venueId);
        if (!active) return [];
        return quizSessionService.getLeaderboard(active.id);
      }

      const players = db().quizPlayers.filter((p) => p.status === "Active" && p.venueId === (venueId ?? p.venueId));
      const entries: LeaderboardEntry[] = players
        .map((p) => {
          const factor = periodFactor(period, p.id);
          return {
            playerId: p.id,
            playerName: p.name,
            score: Math.round(p.totalScore * factor),
            correctAnswers: Math.round(p.quizzesPlayed * factor * 6),
            fastestResponseMs: 900 + (hash(`${period}-${p.id}-speed`) % 3500),
            rank: 0,
            rankChange: (hash(`${period}-${p.id}-move`) % 5) - 2,
          };
        })
        .filter((e) => e.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 25)
        .map((e, idx) => ({ ...e, rank: idx + 1 }));

      return delay(entries, 200);
    }
    const { data } = await apiClient.get<LeaderboardEntry[]>("/quiz/leaderboard", {
      params: { venueId, period },
    });
    return data;
  },
};