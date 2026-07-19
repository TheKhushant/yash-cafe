import type { QuizRewardType, Reward } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db, uid } from "../mock-data";
import { quizSessionService } from "./quiz-session";

export type AutoAssignTarget = "Winner" | "Top 3" | "Top 5" | "Random Winner";

function scoped(venueId: string | null): Reward[] {
  const all = db().quizRewards;
  return venueId ? all.filter((r) => r.venueId === venueId) : all;
}

export const rewardService = {
  async list(venueId: string | null): Promise<Reward[]> {
    if (USE_MOCKS) {
      return delay(
        [...scoped(venueId)].sort((a, b) => b.assignedAt.localeCompare(a.assignedAt)),
      );
    }
    const { data } = await apiClient.get<Reward[]>("/quiz/rewards", { params: { venueId } });
    return data;
  },

  async assign(input: {
    playerId: string;
    playerName: string;
    sessionId: string;
    quizName: string;
    type: QuizRewardType;
    description: string;
    rank: number;
  }, venueId: string | null): Promise<Reward> {
    if (USE_MOCKS) {
      const reward: Reward = {
        ...input,
        id: uid("reward"),
        assignedAt: new Date().toISOString(),
        status: "Pending",
        venueId: venueId ?? "venue-1",
      };
      db().quizRewards.unshift(reward);
      return delay(reward, 200);
    }
    const { data } = await apiClient.post<Reward>("/quiz/rewards", { ...input, venueId });
    return data;
  },

  async markDelivered(id: string): Promise<Reward> {
    if (USE_MOCKS) {
      const reward = db().quizRewards.find((r) => r.id === id);
      if (!reward) throw new Error("Reward not found");
      reward.status = "Delivered";
      return delay({ ...reward }, 150);
    }
    const { data } = await apiClient.patch<Reward>(`/quiz/rewards/${id}`, { status: "Delivered" });
    return data;
  },

  /** Assigns rewards straight from a session's leaderboard, per the Rewards page config. */
  async autoAssign(
    sessionId: string,
    config: { target: AutoAssignTarget; minimumScore: number; type: QuizRewardType },
    venueId: string | null,
  ): Promise<Reward[]> {
    if (USE_MOCKS) {
      const session = db().quizSessions.find((s) => s.id === sessionId);
      if (!session) throw new Error("Session not found");
      const board = (await quizSessionService.getLeaderboard(sessionId)).filter(
        (e) => e.score >= config.minimumScore,
      );

      let selected = board;
      if (config.target === "Winner") selected = board.slice(0, 1);
      else if (config.target === "Top 3") selected = board.slice(0, 3);
      else if (config.target === "Top 5") selected = board.slice(0, 5);
      else if (config.target === "Random Winner" && board.length > 0) {
        selected = [board[Math.floor(Math.random() * board.length)]];
      }

      const created: Reward[] = [];
      for (const entry of selected) {
        const reward: Reward = {
          id: uid("reward"),
          playerId: entry.playerId,
          playerName: entry.playerName,
          sessionId,
          quizName: session.quizName,
          type: config.type,
          description: `${config.type} for ${config.target} — ${session.quizName}`,
          rank: entry.rank,
          assignedAt: new Date().toISOString(),
          status: "Pending",
          venueId: venueId ?? session.venueId,
        };
        db().quizRewards.unshift(reward);
        created.push(reward);
      }
      return delay(created, 250);
    }
    const { data } = await apiClient.post<Reward[]>(`/quiz/sessions/${sessionId}/rewards/auto-assign`, {
      ...config,
      venueId,
    });
    return data;
  },
};