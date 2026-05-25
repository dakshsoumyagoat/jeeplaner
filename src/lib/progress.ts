import { SYLLABUS } from "@/data/syllabus";
import type { SyllabusState, ChapterState } from "./types";

export function chapterAvg(cs: ChapterState | undefined) {
  const t = Number(cs?.theory) || 0;
  const p = Number(cs?.practice) || 0;
  const r = Number(cs?.revision) || 0;
  return Math.round((t + p + r) / 3);
}

export function subjectProgress(state: SyllabusState, subjectId: string) {
  const subj = SYLLABUS.find((s) => s.id === subjectId);
  if (!subj) return { done: 0, total: 0, pct: 0 };
  let done = 0;
  let total = 0;
  let sumPct = 0;
  for (const u of subj.units) {
    for (const c of u.chapters) {
      total++;
      const avg = chapterAvg(state[c.id]);
      sumPct += avg;
      if (avg >= 100) done++;
    }
  }
  return { done, total, pct: total ? Math.round(sumPct / total) : 0 };
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string) {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}