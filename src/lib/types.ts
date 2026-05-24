export type ChapterState = {
  theory?: boolean;
  practice?: boolean;
  revision?: boolean;
};
export type SyllabusState = Record<string, ChapterState>;

export type PlannerState = Record<string, { chapterId: string; done?: boolean }[]>; // key: yyyy-mm-dd

export type DailyTarget = {
  text: string;
  done: boolean;
  date: string; // yyyy-mm-dd
};

export type MockEntry = {
  id: string;
  date: string;
  total: number;
  physics: number;
  chemistry: number;
  math: number;
  negatives: number;
  errors: { silly: number; conceptual: number; time: number; unattempted: number };
};

export type StreakState = {
  count: number;
  lastDate: string | null; // yyyy-mm-dd
};