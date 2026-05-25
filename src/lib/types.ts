export type ChapterState = {
  theory?: number;   // 0-100
  practice?: number; // 0-100
  revision?: number; // 0-100
};
export type SyllabusState = Record<string, ChapterState>;

export type PlannerEntry = {
  chapterId: string;
  done?: boolean;
  /** Optional target completion date (yyyy-mm-dd) */
  due?: string;
};
export type PlannerState = Record<string, PlannerEntry[]>; // key: yyyy-mm-dd (scheduled date)

export type TimetableEntry = {
  subject: string;
  teacher?: string;
  room?: string;
  color: string;
};

export type SchoolTimetableState = Record<string, Record<string, TimetableEntry | null>>;

export type SchoolTimetableV2 = {
  slots: string[];
  entries: Record<string, Record<string, TimetableEntry | null>>;
};

export type DailyTarget = {
  text: string;
  done: boolean;
  date: string; // yyyy-mm-dd
};

export type MockType = "weekly" | "mains" | "advanced";
export type WeeklySubject = "physics" | "chemistry" | "math";

export type MockEntry = {
  id: string;
  date: string;
  type: MockType;
  /** Total marks scored */
  total: number;
  /** Maximum marks possible for this mock */
  maxMarks: number;
  /** For weekly tests only */
  subject?: WeeklySubject;
  /** For mains / advanced */
  physics?: number;
  chemistry?: number;
  math?: number;
  negatives: number;
  errors: { silly: number; conceptual: number; time: number; unattempted: number };
};

export type StreakState = {
  count: number;
  lastDate: string | null; // yyyy-mm-dd
};