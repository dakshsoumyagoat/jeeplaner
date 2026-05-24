import { Fragment, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePersisted } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { SchoolTimetableState, TimetableEntry } from "@/lib/types";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const SLOTS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
] as const;

const SLOT_START_HOUR: Record<(typeof SLOTS)[number], number> = {
  "8:00 AM": 8,
  "9:00 AM": 9,
  "10:00 AM": 10,
  "11:00 AM": 11,
  "12:00 PM": 12,
  "1:00 PM": 13,
  "2:00 PM": 14,
};

const SAMPLE_SCHEDULE: SchoolTimetableState = {
  Monday: {
    "8:00 AM": { subject: "Mathematics", teacher: "Ms. Sharma", room: "A101", color: "#8b5cf6" },
    "9:00 AM": { subject: "Physics", teacher: "Mr. Singh", room: "B204", color: "#22c55e" },
    "10:00 AM": { subject: "Chemistry", teacher: "Ms. Rao", room: "C108", color: "#f97316" },
    "11:00 AM": { subject: "English", teacher: "Ms. Patel", room: "D302", color: "#0ea5e9" },
    "12:00 PM": { subject: "Computer Science", teacher: "Mr. Iyer", room: "Lab 3", color: "#ec4899" },
    "1:00 PM": { subject: "Biology", teacher: "Ms. Mehta", room: "B102", color: "#22d3ee" },
    "2:00 PM": null,
  },
  Tuesday: {
    "8:00 AM": { subject: "Chemistry", teacher: "Ms. Rao", room: "C108", color: "#f97316" },
    "9:00 AM": { subject: "Mathematics", teacher: "Ms. Sharma", room: "A101", color: "#8b5cf6" },
    "10:00 AM": { subject: "English", teacher: "Ms. Patel", room: "D302", color: "#0ea5e9" },
    "11:00 AM": { subject: "Physics", teacher: "Mr. Singh", room: "B204", color: "#22c55e" },
    "12:00 PM": { subject: "History", teacher: "Ms. Nair", room: "A203", color: "#f9a8d4" },
    "1:00 PM": { subject: "Computer Science", teacher: "Mr. Iyer", room: "Lab 3", color: "#ec4899" },
    "2:00 PM": null,
  },
  Wednesday: {
    "8:00 AM": { subject: "Biology", teacher: "Ms. Mehta", room: "B102", color: "#22d3ee" },
    "9:00 AM": { subject: "Physics", teacher: "Mr. Singh", room: "B204", color: "#22c55e" },
    "10:00 AM": { subject: "Chemistry", teacher: "Ms. Rao", room: "C108", color: "#f97316" },
    "11:00 AM": { subject: "Mathematics", teacher: "Ms. Sharma", room: "A101", color: "#8b5cf6" },
    "12:00 PM": { subject: "Art", teacher: "Ms. Desai", room: "E105", color: "#fde68a" },
    "1:00 PM": { subject: "English", teacher: "Ms. Patel", room: "D302", color: "#0ea5e9" },
    "2:00 PM": null,
  },
  Thursday: {
    "8:00 AM": { subject: "Mathematics", teacher: "Ms. Sharma", room: "A101", color: "#8b5cf6" },
    "9:00 AM": { subject: "Computer Science", teacher: "Mr. Iyer", room: "Lab 3", color: "#ec4899" },
    "10:00 AM": { subject: "Physics", teacher: "Mr. Singh", room: "B204", color: "#22c55e" },
    "11:00 AM": { subject: "Biology", teacher: "Ms. Mehta", room: "B102", color: "#22d3ee" },
    "12:00 PM": { subject: "English", teacher: "Ms. Patel", room: "D302", color: "#0ea5e9" },
    "1:00 PM": { subject: "History", teacher: "Ms. Nair", room: "A203", color: "#f9a8d4" },
    "2:00 PM": null,
  },
  Friday: {
    "8:00 AM": { subject: "Physics", teacher: "Mr. Singh", room: "B204", color: "#22c55e" },
    "9:00 AM": { subject: "Chemistry", teacher: "Ms. Rao", room: "C108", color: "#f97316" },
    "10:00 AM": { subject: "Mathematics", teacher: "Ms. Sharma", room: "A101", color: "#8b5cf6" },
    "11:00 AM": { subject: "Physical Education", teacher: "Coach Joshi", room: "Gym", color: "#facc15" },
    "12:00 PM": { subject: "Computer Science", teacher: "Mr. Iyer", room: "Lab 3", color: "#ec4899" },
    "1:00 PM": { subject: "English", teacher: "Ms. Patel", room: "D302", color: "#0ea5e9" },
    "2:00 PM": null,
  },
  Saturday: {
    "8:00 AM": null,
    "9:00 AM": null,
    "10:00 AM": null,
    "11:00 AM": null,
    "12:00 PM": null,
    "1:00 PM": null,
    "2:00 PM": null,
  },
};

const createEmptyTimetable = (): SchoolTimetableState => {
  return WEEKDAYS.reduce((acc, day) => {
    acc[day] = SLOTS.reduce((slotAcc, slot) => {
      slotAcc[slot] = null;
      return slotAcc;
    }, {} as Record<(typeof SLOTS)[number], TimetableEntry | null>);
    return acc;
  }, {} as SchoolTimetableState);
};

const getTextColor = (hex: string) => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 160 ? "text-slate-900" : "text-white";
};

const isWeekendDay = (day: string): day is (typeof WEEKDAYS)[number] => WEEKDAYS.includes(day as any);

export function SchoolTimetable() {
  const [timetable, setTimetable] = usePersisted<SchoolTimetableState>(
    "school-timetable-state",
    createEmptyTimetable(),
  );
  const [selected, setSelected] = useState<{
    day: (typeof WEEKDAYS)[number];
    slot: (typeof SLOTS)[number];
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeDay, setActiveDay] = useState<(typeof WEEKDAYS)[number]>("Monday");
  const [form, setForm] = useState({
    subject: "",
    teacher: "",
    room: "",
    color: "#8b5cf6",
  });

  const today = useMemo(() => format(new Date(), "EEEE"), []);
  const currentSlot = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    return SLOTS.find((slot) => {
      const start = SLOT_START_HOUR[slot];
      return hour === start;
    });
  }, []);

  useEffect(() => {
    if (isWeekendDay(today)) {
      setActiveDay(today);
    }
  }, [today]);

  const selectedEntry = selected ? timetable[selected.day][selected.slot] : null;

  const openEditor = (day: (typeof WEEKDAYS)[number], slot: (typeof SLOTS)[number]) => {
    const entry = timetable[day][slot];
    setSelected({ day, slot });
    setForm({
      subject: entry?.subject ?? "",
      teacher: entry?.teacher ?? "",
      room: entry?.room ?? "",
      color: entry?.color ?? "#8b5cf6",
    });
    setDialogOpen(true);
  };

  const saveSlot = () => {
    if (!selected || !form.subject.trim()) return;
    setTimetable((prev) => ({
      ...prev,
      [selected.day]: {
        ...prev[selected.day],
        [selected.slot]: {
          subject: form.subject.trim(),
          teacher: form.teacher.trim() || undefined,
          room: form.room.trim() || undefined,
          color: form.color,
        },
      },
    }));
    setDialogOpen(false);
  };

  const deleteSlot = () => {
    if (!selected) return;
    setTimetable((prev) => ({
      ...prev,
      [selected.day]: {
        ...prev[selected.day],
        [selected.slot]: null,
      },
    }));
    setDialogOpen(false);
  };

  const fillTemplate = () => setTimetable(SAMPLE_SCHEDULE);

  const resetSchedule = () => setTimetable(createEmptyTimetable());

  return (
    <Card className="space-y-5 rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-2xl shadow-black/10 backdrop-blur-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.26em] text-muted-foreground shadow-sm">
            Daily Timetable
          </div>
          <div>
            <h2 className="text-2xl font-semibold">School schedule</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Add classes quickly, edit any slot, and keep your weekly routine saved automatically.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={fillTemplate}>
            Quick Setup
          </Button>
          <Button size="sm" variant="outline" onClick={resetSchedule}>
            Clear Schedule
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-950/90 p-4 shadow-inner shadow-black/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            Current schedule is saved in IndexedDB.
          </div>
          {currentSlot && isWeekendDay(today) ? (
            <div className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">
              Current class: {today} · {currentSlot}
            </div>
          ) : (
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
              Tap any slot to add or edit a class.
            </div>
          )}
        </div>

        <div className="md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {WEEKDAYS.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={cn(
                  "min-w-[64px] rounded-full border px-3 py-2 text-xs font-medium transition",
                  activeDay === day
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20",
                )}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {SLOTS.map((slot) => {
              const entry = timetable[activeDay][slot];
              const isActive = activeDay === today && slot === currentSlot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => openEditor(activeDay, slot)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-3xl border px-4 py-4 text-left transition",
                    entry ? "border-white/10 bg-white/5" : "border-dashed border-white/10 bg-transparent hover:bg-white/5",
                    isActive && "ring-2 ring-primary/40",
                  )}
                >
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{slot}</div>
                    {entry ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="font-medium">{entry.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.teacher ?? "Teacher not set"} · {entry.room ?? "Room not set"}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Add a class</div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Edit</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden md:grid grid-cols-7 gap-2 text-sm">
          <div className="sticky top-0 z-10 rounded-3xl border border-white/10 bg-slate-950/80 p-3 text-xs uppercase tracking-[0.26em] text-muted-foreground">
            Time
          </div>
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className={cn(
                "sticky top-0 z-10 rounded-3xl border border-white/10 bg-slate-950/80 p-3 text-center text-xs uppercase tracking-[0.26em] text-muted-foreground",
                day === today && "border-primary/30 bg-primary/10 text-primary",
              )}
            >
              {day}
            </div>
          ))}

          {SLOTS.map((slot) => (
            <Fragment key={slot}>
              <div
                className="rounded-3xl border border-white/10 bg-slate-950/60 p-3 text-xs uppercase tracking-[0.2em] text-muted-foreground"
              >
                {slot}
              </div>
              {WEEKDAYS.map((day) => {
                const entry = timetable[day][slot];
                const activeClass = day === today && slot === currentSlot;
                return (
                  <button
                    key={`${day}-${slot}`}
                    type="button"
                    onClick={() => openEditor(day, slot)}
                    className={cn(
                      "min-h-[90px] rounded-3xl border p-3 text-left transition",
                      entry ? "border-white/10 hover:border-white/20" : "border-dashed border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10",
                      activeClass && "ring-2 ring-primary/40",
                    )}
                    style={
                      entry
                        ? {
                            backgroundColor: `${entry.color}17`,
                            borderLeftColor: entry.color,
                            borderLeftWidth: 3,
                          }
                        : {}
                    }
                  >
                    <div className="space-y-1">
                      <div className={cn("text-sm font-semibold", entry && getTextColor(entry.color))}>
                        {entry ? entry.subject : "Add class"}
                      </div>
                      {entry ? (
                        <div className="text-xs text-muted-foreground">
                          {entry.teacher ?? "Teacher not set"}
                          {entry.room ? ` · ${entry.room}` : ""}
                        </div>
                      ) : (
                        <div className="text-xs">Empty slot</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto bg-slate-950/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40">
          <DialogHeader>
            <DialogTitle>
              {selectedEntry ? "Edit class" : "Add class"}
              {selected ? ` · ${selected.day} ${selected.slot}` : ""}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Save the subject, teacher, room, and a color code for easy scanning.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-muted-foreground">
                <span>Subject Name</span>
                <input
                  value={form.subject}
                  onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                  placeholder="e.g. Algebra II"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="space-y-2 text-sm text-muted-foreground">
                <span>Teacher Name</span>
                <input
                  value={form.teacher}
                  onChange={(event) => setForm((prev) => ({ ...prev, teacher: event.target.value }))}
                  placeholder="Optional"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-muted-foreground">
                <span>Room / Lab</span>
                <input
                  value={form.room}
                  onChange={(event) => setForm((prev) => ({ ...prev, room: event.target.value }))}
                  placeholder="Optional"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="space-y-2 text-sm text-muted-foreground">
                <span>Color code</span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
                    className="h-10 w-10 appearance-none rounded-full border border-white/10 bg-white/0 p-0"
                  />
                  <span className="text-sm text-white">{form.color}</span>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <Button
              type="button"
              variant="destructive"
              onClick={deleteSlot}
              disabled={!selectedEntry}
            >
              Delete class
            </Button>
            <div className="flex gap-2 flex-wrap">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={saveSlot}>
                Save class
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
