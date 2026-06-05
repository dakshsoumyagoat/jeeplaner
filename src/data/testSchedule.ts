import type { MockType, WeeklySubject } from "@/lib/types";

export type ScheduledTest = {
  id: string;
  name: string;
  /** yyyy-mm-dd, or null for multi-day exam windows */
  date: string;
  endDate?: string;
  type: MockType | "exam";
  subject?: WeeklySubject;
  maxMarks?: number;
  note?: string;
};

// Resonance Lecture & Test Schedule — Apr 2026 to Jan 2027
export const TEST_SCHEDULE: ScheduledTest[] = [
  { id: "wt-p-1", name: "Weekly Test — Physics 1", date: "2026-04-27", type: "weekly", subject: "physics", maxMarks: 200 },
  { id: "wt-c-1", name: "Weekly Test — Chemistry 1", date: "2026-05-04", type: "weekly", subject: "chemistry", maxMarks: 200 },
  { id: "wt-m-1", name: "Weekly Test — Maths 1", date: "2026-05-11", type: "weekly", subject: "math", maxMarks: 200 },
  { id: "mt-1", name: "Main Test 1", date: "2026-05-24", type: "mains", maxMarks: 300 },
  { id: "wt-p-2", name: "Weekly Test — Physics 2", date: "2026-06-01", type: "weekly", subject: "physics", maxMarks: 200 },
  { id: "wt-c-2", name: "Weekly Test — Chemistry 2", date: "2026-06-08", type: "weekly", subject: "chemistry", maxMarks: 200 },
  { id: "mt-2", name: "Main Test 2", date: "2026-06-21", type: "mains", maxMarks: 300 },
  { id: "wt-m-2", name: "Weekly Test — Maths 2", date: "2026-06-29", type: "weekly", subject: "math", maxMarks: 200 },
  { id: "wt-p-3", name: "Weekly Test — Physics 3", date: "2026-07-06", type: "weekly", subject: "physics", maxMarks: 200 },
  { id: "mt-3", name: "Main Test 3", date: "2026-07-19", type: "mains", maxMarks: 300 },
  { id: "at-1", name: "Advanced Test 1 (One paper)", date: "2026-07-19", type: "advanced", maxMarks: 360 },
  { id: "wt-c-3", name: "Weekly Test — Chemistry 3", date: "2026-07-27", type: "weekly", subject: "chemistry", maxMarks: 200 },
  { id: "qe-1", name: "1st Quarterly Exam & CET-1", date: "2026-08-03", endDate: "2026-08-07", type: "exam" },
  { id: "mt-4", name: "Main Test 4", date: "2026-08-23", type: "mains", maxMarks: 300 },
  { id: "at-2", name: "Advanced Test 2 (One paper)", date: "2026-08-23", type: "advanced", maxMarks: 360 },
  { id: "wt-m-3", name: "Weekly Test — Maths 3", date: "2026-08-31", type: "weekly", subject: "math", maxMarks: 200 },
  { id: "wt-p-4", name: "Weekly Test — Physics 4", date: "2026-09-07", type: "weekly", subject: "physics", maxMarks: 200 },
  { id: "mt-5", name: "Main Test 5", date: "2026-09-19", type: "mains", maxMarks: 300 },
  { id: "at-3", name: "Advanced Test 3 (Two papers)", date: "2026-09-20", type: "advanced", maxMarks: 360 },
  { id: "me-1", name: "Midterm Exam & CET-2", date: "2026-09-25", endDate: "2026-10-09", type: "exam" },
  { id: "wt-c-4", name: "Weekly Test — Chemistry 4", date: "2026-11-02", type: "weekly", subject: "chemistry", maxMarks: 200 },
  { id: "mt-6", name: "Main Test 6", date: "2026-11-21", type: "mains", maxMarks: 300 },
  { id: "at-4", name: "Advanced Test 4 (Two papers)", date: "2026-11-22", type: "advanced", maxMarks: 360 },
  { id: "wt-m-4", name: "Weekly Test — Maths 4", date: "2026-11-30", type: "weekly", subject: "math", maxMarks: 200 },
  { id: "qe-2", name: "2nd Quarterly Exam & CET-3", date: "2026-12-10", endDate: "2026-12-15", type: "exam" },
  { id: "wt-p-5", name: "Weekly Test — Physics 5", date: "2026-12-21", type: "weekly", subject: "physics", maxMarks: 200 },
  { id: "mt-7", name: "Main Test 7", date: "2027-01-02", type: "mains", maxMarks: 300 },
  { id: "at-5", name: "Advanced Test 5 (Two papers)", date: "2027-01-03", type: "advanced", maxMarks: 360 },
  { id: "wt-c-5", name: "Weekly Test — Chemistry 5", date: "2027-01-11", type: "weekly", subject: "chemistry", maxMarks: 200 },
  { id: "wt-m-5", name: "Weekly Test — Maths 5", date: "2027-01-18", type: "weekly", subject: "math", maxMarks: 200 },
  { id: "mt-8", name: "Main Test 8", date: "2027-01-27", type: "mains", maxMarks: 300 },
  { id: "at-6", name: "Advanced Test 6 (Two papers)", date: "2027-01-28", type: "advanced", maxMarks: 360 },
];