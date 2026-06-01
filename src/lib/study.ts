import { get, set, createStore } from "idb-keyval";
import { useEffect, useState, useCallback } from "react";

const store = createStore("jee-scholar-study", "kv");

export type StudySession = {
  id: string;
  subject: string;
  /** ms */
  duration: number;
  startTime: number;
  endTime: number;
  /** yyyy-mm-dd of startTime */
  date: string;
};

export type ActiveTimer = {
  subject: string;
  /** wall-clock start of current run segment, ms */
  runStart: number | null;
  /** ms accumulated from previous paused segments */
  accumulated: number;
  startedAt: number;
};

const SESSIONS_KEY = "study-sessions";
const SUBJECTS_KEY = "study-subjects";
const ACTIVE_KEY = "study-active-timer";

export const DEFAULT_SUBJECTS = ["Physics", "Chemistry", "Mathematics"];

export function dateKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatHMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatHuman(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h === 0 && m === 0) return `${total}s`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/* ---------- Sessions (IndexedDB) ---------- */

export async function loadSessions(): Promise<StudySession[]> {
  try {
    return ((await get(SESSIONS_KEY, store)) as StudySession[] | undefined) ?? [];
  } catch {
    return [];
  }
}

export async function saveSessions(s: StudySession[]): Promise<void> {
  try {
    await set(SESSIONS_KEY, s, store);
  } catch {
    /* noop */
  }
}

export function useStudySessions() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    loadSessions().then((s) => {
      if (!alive) return;
      setSessions(s);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const update = useCallback(
    (updater: StudySession[] | ((prev: StudySession[]) => StudySession[])) => {
      setSessions((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (p: StudySession[]) => StudySession[])(prev)
            : updater;
        saveSessions(next);
        return next;
      });
    },
    [],
  );

  return [sessions, update, ready] as const;
}

/* ---------- Subjects (IndexedDB) ---------- */

export async function loadSubjects(): Promise<string[]> {
  try {
    return ((await get(SUBJECTS_KEY, store)) as string[] | undefined) ?? DEFAULT_SUBJECTS;
  } catch {
    return DEFAULT_SUBJECTS;
  }
}

export async function saveSubjects(s: string[]): Promise<void> {
  try {
    await set(SUBJECTS_KEY, s, store);
  } catch {
    /* noop */
  }
}

export function useStudySubjects() {
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  useEffect(() => {
    let alive = true;
    loadSubjects().then((s) => {
      if (alive) setSubjects(s);
    });
    return () => {
      alive = false;
    };
  }, []);
  const update = useCallback(
    (updater: string[] | ((prev: string[]) => string[])) => {
      setSubjects((prev) => {
        const next =
          typeof updater === "function" ? (updater as (p: string[]) => string[])(prev) : updater;
        saveSubjects(next);
        return next;
      });
    },
    [],
  );
  return [subjects, update] as const;
}

/* ---------- Active timer (localStorage - sync access) ---------- */

export function readActiveTimer(): ActiveTimer | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveTimer;
  } catch {
    return null;
  }
}

export function writeActiveTimer(t: ActiveTimer | null): void {
  if (typeof localStorage === "undefined") return;
  try {
    if (t === null) localStorage.removeItem(ACTIVE_KEY);
    else localStorage.setItem(ACTIVE_KEY, JSON.stringify(t));
  } catch {
    /* noop */
  }
}

export function elapsedOf(t: ActiveTimer | null, now: number): number {
  if (!t) return 0;
  const live = t.runStart ? Math.max(0, now - t.runStart) : 0;
  return t.accumulated + live;
}

/* ---------- Aggregations ---------- */

export function sumByRange(
  sessions: StudySession[],
  fromTs: number,
  toTs: number,
): number {
  let total = 0;
  for (const s of sessions) {
    if (s.endTime >= fromTs && s.startTime <= toTs) total += s.duration;
  }
  return total;
}

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function startOfWeek(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 Sun
  const diff = (day + 6) % 7; // Mon-start
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

export function startOfMonth(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d.getTime();
}
