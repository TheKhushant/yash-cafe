import type { LeaderboardEntry, Player, Question, Quiz, QuizSession } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db, uid } from "../mock-data";

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0;
  return h;
}

function randomPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getSession(sessionId: string): QuizSession {
  const session = db().quizSessions.find((s) => s.id === sessionId);
  if (!session) throw new Error("Quiz session not found");
  return session;
}

function getQuiz(quizId: string): Quiz {
  const quiz = db().quizzes.find((q) => q.id === quizId);
  if (!quiz) throw new Error("Quiz not found");
  return quiz;
}

function currentQuestion(session: QuizSession): Question | undefined {
  const quiz = db().quizzes.find((q) => q.id === session.quizId);
  if (!quiz || session.currentQuestionIndex < 0) return undefined;
  const qId = quiz.questionIds[session.currentQuestionIndex];
  return db().questions.find((q) => q.id === qId);
}

function ensureLeaderboard(session: QuizSession): LeaderboardEntry[] {
  let board = db().sessionLeaderboards[session.id];
  if (!board) {
    board = [];
    db().sessionLeaderboards[session.id] = board;
  }
  for (const pid of session.playerIds) {
    if (!board.some((e) => e.playerId === pid)) {
      const player = db().quizPlayers.find((p) => p.id === pid);
      board.push({
        playerId: pid,
        playerName: player?.name ?? "Player",
        score: 0,
        correctAnswers: 0,
        fastestResponseMs: 0,
        rank: board.length + 1,
        rankChange: 0,
      });
    }
  }
  return board;
}

function playerAnsweredCorrectly(sessionId: string, questionIndex: number, playerId: string): boolean {
  return hash(`${sessionId}-${questionIndex}-${playerId}`) % 100 < 58;
}

/** Awards points for the question currently on screen, then re-ranks the board. */
function scoreCurrentQuestion(session: QuizSession) {
  if (session.currentQuestionIndex < 0) return;
  const board = ensureLeaderboard(session);
  const question = currentQuestion(session);
  const prevRanks = new Map(board.map((e) => [e.playerId, e.rank]));

  for (const entry of board) {
    if (!session.playerIds.includes(entry.playerId)) continue;
    const correct = playerAnsweredCorrectly(session.id, session.currentQuestionIndex, entry.playerId);
    if (correct) {
      const points = question?.points ?? 1000;
      const responseMs = 800 + (hash(`${entry.playerId}-${session.currentQuestionIndex}`) % 4200);
      entry.score += Math.round(points * (1 - responseMs / 20000));
      entry.correctAnswers += 1;
      if (!entry.fastestResponseMs || responseMs < entry.fastestResponseMs) {
        entry.fastestResponseMs = responseMs;
      }
    }
  }

  board.sort((a, b) => b.score - a.score);
  board.forEach((entry, idx) => {
    const newRank = idx + 1;
    const oldRank = prevRanks.get(entry.playerId) ?? newRank;
    entry.rankChange = oldRank - newRank;
    entry.rank = newRank;
  });
}

export interface QuestionStats {
  responded: number;
  correctCount: number;
  wrongCount: number;
  correctPct: number;
  wrongPct: number;
}

export interface SessionPlayerRow {
  playerId: string;
  name: string;
  tableNumber: string;
  score: number;
  correct: number;
  wrong: number;
  responseTimeMs: number;
  connectionStatus: Player["connectionStatus"];
  joinedTime: string;
}

export const quizSessionService = {
  /** The single non-ended session for this scope, if any (Waiting / Live / Paused). */
  async getActive(venueId: string | null): Promise<QuizSession | null> {
    if (USE_MOCKS) {
      const session = db().quizSessions.find(
        (s) => s.status !== "Ended" && (!venueId || s.venueId === venueId),
      );
      return delay(session ?? null);
    }
    const { data } = await apiClient.get<QuizSession | null>("/quiz/sessions/active", { params: { venueId } });
    return data;
  },

  async start(quizId: string, venueId: string | null): Promise<QuizSession> {
    if (USE_MOCKS) {
      const quiz = getQuiz(quizId);
      const session: QuizSession = {
        id: uid("sess"),
        quizId: quiz.id,
        quizName: quiz.name,
        status: "Waiting",
        pinCode: quiz.pinCode,
        currentQuestionIndex: -1,
        startedAt: null,
        endedAt: null,
        playerIds: [],
        venueId: venueId ?? quiz.venueId,
      };
      db().quizSessions.unshift(session);
      db().sessionLeaderboards[session.id] = [];
      quiz.status = "Live";
      return delay(session, 250);
    }
    const { data } = await apiClient.post<QuizSession>("/quiz/sessions", { quizId, venueId });
    return data;
  },

  /** Simulates players scanning the QR / entering the PIN and landing in the waiting room. */
  async simulateJoins(sessionId: string, count = 3): Promise<QuizSession> {
    if (USE_MOCKS) {
      const session = getSession(sessionId);
      const quiz = getQuiz(session.quizId);
      const pool = db().quizPlayers.filter(
        (p) => p.status === "Active" && !session.playerIds.includes(p.id),
      );
      const toAdd = pool.slice(0, Math.min(count, Math.max(0, quiz.maxPlayers - session.playerIds.length)));
      session.playerIds.push(...toAdd.map((p) => p.id));
      ensureLeaderboard(session);
      return delay({ ...session }, 200);
    }
    const { data } = await apiClient.post<QuizSession>(`/quiz/sessions/${sessionId}/simulate-joins`, { count });
    return data;
  },

  async beginQuiz(sessionId: string): Promise<QuizSession> {
    if (USE_MOCKS) {
      const session = getSession(sessionId);
      session.status = "Live";
      session.currentQuestionIndex = 0;
      session.startedAt = new Date().toISOString();
      ensureLeaderboard(session);
      return delay({ ...session }, 200);
    }
    const { data } = await apiClient.post<QuizSession>(`/quiz/sessions/${sessionId}/begin`, {});
    return data;
  },

  async pause(sessionId: string): Promise<QuizSession> {
    if (USE_MOCKS) {
      const session = getSession(sessionId);
      session.status = "Paused";
      return delay({ ...session }, 150);
    }
    const { data } = await apiClient.post<QuizSession>(`/quiz/sessions/${sessionId}/pause`, {});
    return data;
  },

  async resume(sessionId: string): Promise<QuizSession> {
    if (USE_MOCKS) {
      const session = getSession(sessionId);
      session.status = "Live";
      return delay({ ...session }, 150);
    }
    const { data } = await apiClient.post<QuizSession>(`/quiz/sessions/${sessionId}/resume`, {});
    return data;
  },

  async next(sessionId: string): Promise<QuizSession> {
    if (USE_MOCKS) {
      const session = getSession(sessionId);
      const quiz = getQuiz(session.quizId);
      scoreCurrentQuestion(session);
      if (session.currentQuestionIndex < quiz.questionIds.length - 1) {
        session.currentQuestionIndex += 1;
      }
      return delay({ ...session }, 200);
    }
    const { data } = await apiClient.post<QuizSession>(`/quiz/sessions/${sessionId}/next`, {});
    return data;
  },

  /** Moves on without awarding points for the current question. */
  async skip(sessionId: string): Promise<QuizSession> {
    if (USE_MOCKS) {
      const session = getSession(sessionId);
      const quiz = getQuiz(session.quizId);
      if (session.currentQuestionIndex < quiz.questionIds.length - 1) {
        session.currentQuestionIndex += 1;
      }
      return delay({ ...session }, 150);
    }
    const { data } = await apiClient.post<QuizSession>(`/quiz/sessions/${sessionId}/skip`, {});
    return data;
  },

  async previous(sessionId: string): Promise<QuizSession> {
    if (USE_MOCKS) {
      const session = getSession(sessionId);
      session.currentQuestionIndex = Math.max(0, session.currentQuestionIndex - 1);
      return delay({ ...session }, 150);
    }
    const { data } = await apiClient.post<QuizSession>(`/quiz/sessions/${sessionId}/previous`, {});
    return data;
  },

  async end(sessionId: string): Promise<QuizSession> {
    if (USE_MOCKS) {
      const session = getSession(sessionId);
      scoreCurrentQuestion(session);
      session.status = "Ended";
      session.endedAt = new Date().toISOString();
      const quiz = db().quizzes.find((q) => q.id === session.quizId);
      if (quiz) quiz.status = "Published";
      return delay({ ...session }, 250);
    }
    const { data } = await apiClient.post<QuizSession>(`/quiz/sessions/${sessionId}/end`, {});
    return data;
  },

  async reset(sessionId: string): Promise<QuizSession> {
    if (USE_MOCKS) {
      const session = getSession(sessionId);
      session.status = "Waiting";
      session.currentQuestionIndex = -1;
      session.startedAt = null;
      session.endedAt = null;
      db().sessionLeaderboards[session.id] = session.playerIds.map((pid, idx) => {
        const player = db().quizPlayers.find((p) => p.id === pid);
        return {
          playerId: pid,
          playerName: player?.name ?? "Player",
          score: 0,
          correctAnswers: 0,
          fastestResponseMs: 0,
          rank: idx + 1,
          rankChange: 0,
        };
      });
      return delay({ ...session }, 200);
    }
    const { data } = await apiClient.post<QuizSession>(`/quiz/sessions/${sessionId}/reset`, {});
    return data;
  },

  regenerateJoinPin(sessionId: string): QuizSession {
    const session = getSession(sessionId);
    session.pinCode = randomPin();
    return session;
  },

  /** QR payload a customer's phone would scan to join the waiting room. */
  buildJoinQrPayload(session: QuizSession): string {
    return JSON.stringify({ sessionId: session.id, quizId: session.quizId, pin: session.pinCode });
  },

  getCurrentQuestion(sessionId: string): Question | undefined {
    return currentQuestion(getSession(sessionId));
  },

  getQuestionStats(sessionId: string): QuestionStats {
    const session = getSession(sessionId);
    const total = session.playerIds.length;
    if (total === 0 || session.currentQuestionIndex < 0) {
      return { responded: 0, correctCount: 0, wrongCount: 0, correctPct: 0, wrongPct: 0 };
    }
    const h = hash(`${session.id}-${session.currentQuestionIndex}-responses`);
    const respondedRatio = 0.55 + (h % 45) / 100;
    const responded = Math.min(total, Math.round(total * respondedRatio));
    const correctRatio = 0.3 + ((h >> 3) % 55) / 100;
    const correctCount = Math.round(responded * correctRatio);
    const wrongCount = responded - correctCount;
    return {
      responded,
      correctCount,
      wrongCount,
      correctPct: responded ? Math.round((correctCount / responded) * 100) : 0,
      wrongPct: responded ? Math.round((wrongCount / responded) * 100) : 0,
    };
  },

  async getLeaderboard(sessionId: string): Promise<LeaderboardEntry[]> {
    if (USE_MOCKS) return delay([...ensureLeaderboard(getSession(sessionId))], 150);
    const { data } = await apiClient.get<LeaderboardEntry[]>(`/quiz/sessions/${sessionId}/leaderboard`);
    return data;
  },

  async listSessionPlayers(sessionId: string): Promise<SessionPlayerRow[]> {
    if (USE_MOCKS) {
      const session = getSession(sessionId);
      const board = ensureLeaderboard(session);
      const attempted =
        session.currentQuestionIndex < 0
          ? 0
          : session.status === "Ended"
          ? session.currentQuestionIndex + 1
          : session.currentQuestionIndex;

      const rows: SessionPlayerRow[] = session.playerIds.map((pid) => {
        const player = db().quizPlayers.find((p) => p.id === pid);
        const entry = board.find((e) => e.playerId === pid);
        return {
          playerId: pid,
          name: player?.name ?? "Player",
          tableNumber: player?.tableNumber ?? "—",
          score: entry?.score ?? 0,
          correct: entry?.correctAnswers ?? 0,
          wrong: Math.max(0, attempted - (entry?.correctAnswers ?? 0)),
          responseTimeMs: entry?.fastestResponseMs ?? 0,
          connectionStatus: player?.connectionStatus ?? "Connected",
          joinedTime: session.startedAt ?? new Date().toISOString(),
        };
      });
      return delay(rows.sort((a, b) => b.score - a.score), 150);
    }
    const { data } = await apiClient.get<SessionPlayerRow[]>(`/quiz/sessions/${sessionId}/players`);
    return data;
  },

  async kickPlayer(sessionId: string, playerId: string): Promise<void> {
    if (USE_MOCKS) {
      const session = getSession(sessionId);
      session.playerIds = session.playerIds.filter((id) => id !== playerId);
      const board = db().sessionLeaderboards[sessionId];
      if (board) db().sessionLeaderboards[sessionId] = board.filter((e) => e.playerId !== playerId);
      return delay(undefined, 150);
    }
    await apiClient.post(`/quiz/sessions/${sessionId}/players/${playerId}/kick`, {});
  },

  async banPlayer(sessionId: string, playerId: string): Promise<void> {
    if (USE_MOCKS) {
      const player = db().quizPlayers.find((p) => p.id === playerId);
      if (player) player.status = "Banned";
      await quizSessionService.kickPlayer(sessionId, playerId);
      return delay(undefined, 150);
    }
    await apiClient.post(`/quiz/sessions/${sessionId}/players/${playerId}/ban`, {});
  },

  async resetPlayerScore(sessionId: string, playerId: string): Promise<void> {
    if (USE_MOCKS) {
      const board = ensureLeaderboard(getSession(sessionId));
      const entry = board.find((e) => e.playerId === playerId);
      if (entry) {
        entry.score = 0;
        entry.correctAnswers = 0;
        entry.fastestResponseMs = 0;
      }
      return delay(undefined, 150);
    }
    await apiClient.post(`/quiz/sessions/${sessionId}/players/${playerId}/reset-score`, {});
  },
};