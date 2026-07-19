import type { Quiz, QuizSettings, QuizStatus } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db, uid } from "../mock-data";

export type QuizInput = Omit<
  Quiz,
  "id" | "createdAt" | "playersCount" | "status" | "pinCode" | "venueId"
    > & { 
        status?: QuizStatus 
    };

function scoped(venueId: string | null): Quiz[] {
  const all = db().quizzes;
  return venueId ? all.filter((q) => q.venueId === venueId) : all;
}

function randomPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const quizService = {
  async list(venueId: string | null): Promise<Quiz[]> {
    if (USE_MOCKS) return delay([...scoped(venueId)]);
    const { data } = await apiClient.get<Quiz[]>("/quiz/quizzes", { params: { venueId } });
    return data;
  },

  async get(id: string): Promise<Quiz | undefined> {
    if (USE_MOCKS) return delay(db().quizzes.find((q) => q.id === id));
    const { data } = await apiClient.get<Quiz>(`/quiz/quizzes/${id}`);
    return data;
  },

  async create(input: QuizInput, venueId: string | null): Promise<Quiz> {
    if (USE_MOCKS) {
      const quiz: Quiz = {
        ...input,
        id: uid("quiz"),
        status: input.status ?? "Draft",
        pinCode: randomPin(),
        playersCount: 0,
        createdAt: new Date().toISOString(),
        venueId: venueId ?? "venue-1",
      };
      db().quizzes.unshift(quiz);
      return delay(quiz, 250);
    }
    const { data } = await apiClient.post<Quiz>("/quiz/quizzes", { ...input, venueId });
    return data;
  },

  async update(id: string, patch: Partial<QuizInput> & { status?: QuizStatus }): Promise<Quiz> {
    if (USE_MOCKS) {
      const quiz = db().quizzes.find((q) => q.id === id);
      if (!quiz) throw new Error("Quiz not found");
      Object.assign(quiz, patch);
      return delay({ ...quiz }, 200);
    }
    const { data } = await apiClient.patch<Quiz>(`/quiz/quizzes/${id}`, patch);
    return data;
  },

  async duplicate(id: string): Promise<Quiz> {
    if (USE_MOCKS) {
      const original = db().quizzes.find((q) => q.id === id);
      if (!original) throw new Error("Quiz not found");
      const copy: Quiz = {
        ...original,
        id: uid("quiz"),
        name: `${original.name} (Copy)`,
        status: "Draft",
        pinCode: randomPin(),
        playersCount: 0,
        createdAt: new Date().toISOString(),
      };
      db().quizzes.unshift(copy);
      return delay(copy, 250);
    }
    const { data } = await apiClient.post<Quiz>(`/quiz/quizzes/${id}/duplicate`, {});
    return data;
  },

  async setStatus(id: string, status: QuizStatus): Promise<Quiz> {
    return quizService.update(id, { status });
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCKS) {
      const list = db().quizzes;
      const idx = list.findIndex((q) => q.id === id);
      if (idx !== -1) list.splice(idx, 1);
      return delay(undefined, 200);
    }
    await apiClient.delete(`/quiz/quizzes/${id}`);
  },
};

export const quizSettingsService = {
  async get(venueId: string | null): Promise<QuizSettings> {
    if (USE_MOCKS) return delay({ ...db().quizSettings, venueId: venueId ?? db().quizSettings.venueId });
    const { data } = await apiClient.get<QuizSettings>("/quiz/settings", { params: { venueId } });
    return data;
  },

  async update(patch: Partial<QuizSettings>): Promise<QuizSettings> {
    if (USE_MOCKS) {
      Object.assign(db().quizSettings, patch);
      return delay({ ...db().quizSettings }, 200);
    }
    const { data } = await apiClient.patch<QuizSettings>("/quiz/settings", patch);
    return data;
  },
};