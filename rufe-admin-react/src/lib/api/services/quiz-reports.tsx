import type { QuizReportSummary } from "@/types";
import { delay, USE_MOCKS } from "../client";
import { db } from "../mock-data";

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0;
  return h;
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export const quizReportsService = {
  async summary(venueId: string | null): Promise<QuizReportSummary> {
    if (USE_MOCKS) {
      const sessions = db().quizSessions.filter((s) => !venueId || s.venueId === venueId);
      const players = db().quizPlayers.filter((p) => !venueId || p.venueId === venueId);
      const quizzes = db().quizzes.filter((q) => !venueId || q.venueId === venueId);
      const questions = db().questions.filter((q) => !venueId || q.venueId === venueId);

      const allEntries = sessions.flatMap((s) => db().sessionLeaderboards[s.id] ?? []);
      const totalParticipation = new Set(sessions.flatMap((s) => s.playerIds)).size;
      const totalCorrect = allEntries.reduce((sum, e) => sum + e.correctAnswers, 0);
      const totalAttempts = sessions.reduce((sum, s) => sum + Math.max(0, s.currentQuestionIndex + 1) * s.playerIds.length, 0);
      const accuracyRate = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
      const avgResponseTimeMs =
        allEntries.length > 0
          ? Math.round(allEntries.reduce((sum, e) => sum + e.fastestResponseMs, 0) / allEntries.length)
          : 0;

      const mostMissedQuestions = [...questions]
        .filter((q) => q.correctOptionIds.length > 0)
        .map((q) => ({ questionId: q.id, text: q.text, missRate: 15 + (hash(q.id) % 55) }))
        .sort((a, b) => b.missRate - a.missRate)
        .slice(0, 8);

      const topPlayers = [...players]
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 8)
        .map((p) => ({ playerId: p.id, name: p.name, score: p.totalScore }));

      const categoryCounts = new Map<string, number>();
      for (const q of quizzes) categoryCounts.set(q.category, (categoryCounts.get(q.category) ?? 0) + 1);
      const topCategories = [...categoryCounts.entries()]
        .map(([category, plays]) => ({ category, plays }))
        .sort((a, b) => b.plays - a.plays);

      const dailyMap = new Map<string, number>();
      const monthlyMap = new Map<string, number>();
      for (const s of sessions) {
        if (!s.startedAt) continue;
        const d = dayLabel(s.startedAt);
        const m = monthLabel(s.startedAt);
        dailyMap.set(d, (dailyMap.get(d) ?? 0) + 1);
        monthlyMap.set(m, (monthlyMap.get(m) ?? 0) + 1);
      }
      const dailyQuizzes = [...dailyMap.entries()].map(([label, count]) => ({ label, count })).slice(-14).reverse();
      const monthlyQuizzes = [...monthlyMap.entries()].map(([label, count]) => ({ label, count })).slice(-6).reverse();

      const participationSeries = Array.from({ length: 14 }).map((_, i) => {
        const dayIdx = 13 - i;
        const label = new Date(Date.now() - dayIdx * 86400000).toLocaleDateString("en-US", { weekday: "short" });
        const h = hash(`participation-${dayIdx}`);
        return { label, players: 20 + (h % 80) };
      });
      const accuracySeries = Array.from({ length: 14 }).map((_, i) => {
        const dayIdx = 13 - i;
        const label = new Date(Date.now() - dayIdx * 86400000).toLocaleDateString("en-US", { weekday: "short" });
        const h = hash(`accuracy-${dayIdx}`);
        return { label, accuracy: 45 + (h % 45) };
      });

      const summary: QuizReportSummary = {
        totalParticipation,
        accuracyRate,
        avgResponseTimeMs,
        mostMissedQuestions,
        topPlayers,
        topCategories,
        dailyQuizzes,
        monthlyQuizzes,
        participationSeries,
        accuracySeries,
      };
      return delay(summary, 250);
    }
    // Real backend would expose a single aggregated endpoint here.
    return delay({
      totalParticipation: 0, accuracyRate: 0, avgResponseTimeMs: 0,
      mostMissedQuestions: [], topPlayers: [], topCategories: [],
      dailyQuizzes: [], monthlyQuizzes: [], participationSeries: [], accuracySeries: [],
    });
  },
};

/** Client-side CSV export — zero extra dependencies. PDF/Excel would need jspdf / xlsx to be added. */
export function exportRowsAsCsv(filename: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h] ?? "")).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}