import type { Question } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db, uid } from "../mock-data";

export type QuestionInput = Omit<Question, "id" | "createdAt" | "usageCount" | "venueId">;

function scoped(venueId: string | null): Question[] {
  const all = db().questions;
  return venueId ? all.filter((q) => q.venueId === venueId) : all;
}

export const questionService = {
  async list(venueId: string | null): Promise<Question[]> {
    if (USE_MOCKS) return delay([...scoped(venueId)]);
    const { data } = await apiClient.get<Question[]>("/quiz/questions", { params: { venueId } });
    return data;
  },

  async create(input: QuestionInput, venueId: string | null): Promise<Question> {
    if (USE_MOCKS) {
      const question: Question = {
        ...input,
        id: uid("q"),
        usageCount: 0,
        createdAt: new Date().toISOString(),
        venueId: venueId ?? "venue-1",
      };
      db().questions.unshift(question);
      return delay(question, 250);
    }
    const { data } = await apiClient.post<Question>("/quiz/questions", { ...input, venueId });
    return data;
  },

  async update(id: string, patch: Partial<QuestionInput>): Promise<Question> {
    if (USE_MOCKS) {
      const question = db().questions.find((q) => q.id === id);
      if (!question) throw new Error("Question not found");
      Object.assign(question, patch);
      return delay({ ...question }, 200);
    }
    const { data } = await apiClient.patch<Question>(`/quiz/questions/${id}`, patch);
    return data;
  },

  async setEnabled(id: string, enabled: boolean): Promise<Question> {
    return questionService.update(id, { enabled });
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCKS) {
      const list = db().questions;
      const idx = list.findIndex((q) => q.id === id);
      if (idx !== -1) list.splice(idx, 1);
      return delay(undefined, 200);
    }
    await apiClient.delete(`/quiz/questions/${id}`);
  },
};