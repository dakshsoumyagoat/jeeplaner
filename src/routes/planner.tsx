import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { usePersisted } from "@/lib/storage";
import { SYLLABUS } from "@/data/syllabus";
import { todayKey } from "@/lib/progress";
import type { PlannerState } from "@/lib/types";
import { addDays, startOfWeek, format } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, X, RotateCcw, CheckCircle2, CalendarIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Planner — JEE Scholar Planner" },
      { name: "description", content: "Plan your week. Catch up on backlog." },
    ],
  }),
  component: PlannerPage,
});

const CHAPTER_MAP = (() => {
  const m = new Map<string, { name: string; subject: string; accent: string }>();
  for (const s of SYLLABUS) for (const u of s.units) for (const c of u.chapters) {
    m.set(c.id, { name: c.name, subject: s.name, accent: s.accent });
  }
  return m;
})();

function PlannerPage() {
  const [planner, setPlanner] = usePersisted<PlannerState>("planner-state", {});
  const [weekOffset, setWeekOffset] = useState(0);
  const [assignFor, setAssignFor] = useState<string | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addBacklogOpen, setAddBacklogOpen] = useState(false);

  const weekStart = useMemo(
    () => addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7),
    [weekOffset],
  );
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const today = todayKey();

  const backlog = useMemo(() => {
    const out: { date: string; chapterId: string }[] = [];
    for (const [date, entries] of Object.entries(planner)) {
      if (date < today) {
        for (const e of entries) if (!e.done) out.push({ date, chapterId: e.chapterId });
      }
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }, [planner, today]);

  const assign = (date: string, chapterId: string) => {
    setPlanner((prev) => {
      const list = prev[date] || [];
      if (list.some((e) => e.chapterId === chapterId)) return prev;
      return { ...prev, [date]: [...list, { chapterId, done: false }] };
    });
  };

  const assignFull = (date: string, chapterId: string, due?: string) => {
    setPlanner((prev) => {
      const list = prev[date] || [];
      if (list.some((e) => e.chapterId === chapterId)) {
        // update due date if already present
        return {
          ...prev,
          [date]: list.map((e) =>
            e.chapterId === chapterId ? { ...e, due } : e,
          ),
        };
      }
      return { ...prev, [date]: [...list, { chapterId, done: false, due }] };
    });
  };

  const setDue = (date: string, chapterId: string, due?: string) => {
    setPlanner((prev) => ({
      ...prev,
      [date]: (prev[date] || []).map((e) =>
        e.chapterId === chapterId ? { ...e, due } : e,
      ),
    }));
  };

  const remove = (date: string, chapterId: string) => {
    setPlanner((prev) => ({
      ...prev,
      [date]: (prev[date] || []).filter((e) => e.chapterId !== chapterId),
    }));
  };

  const toggleDone = (date: string, chapterId: string) => {
    setPlanner((prev) => ({
      ...prev,
      [date]: (prev[date] || []).map((e) =>
        e.chapterId === chapterId ? { ...e, done: !e.done } : e,
      ),
    }));
  };

  const reschedule = (fromDate: string, chapterId: string) => {
    setPlanner((prev) => {
      const from = (prev[fromDate] || []).filter((e) => e.chapterId !== chapterId);
      const to = prev[today] || [];
      if (to.some((e) => e.chapterId === chapterId)) return { ...prev, [fromDate]: from };
      return { ...prev, [fromDate]: from, [today]: [...to, { chapterId, done: false }] };
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold md:text-4xl">Planner</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" /> Add task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add task to planner</DialogTitle>
              </DialogHeader>
              <AddTaskForm
                defaultDate={today}
                onSubmit={(chapterId, scheduled, due) => {
                  assignFull(scheduled, chapterId, due);
                  setAddTaskOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
              <ChevronRight />
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const entries = planner[key] || [];
          const isToday = key === today;
          const isPast = key < today;
          return (
            <Card
              key={key}
              className={cn(
                "flex min-h-[140px] flex-col p-3",
                isToday && "border-primary/60 bg-primary/5",
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {format(d, "EEE")}
                  </div>
                  <div className="font-display text-lg font-semibold">{format(d, "d")}</div>
                </div>
                <Dialog
                  open={assignFor === key}
                  onOpenChange={(o) => setAssignFor(o ? key : null)}
                >
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add chapter — {format(d, "EEE, MMM d")}</DialogTitle>
                    </DialogHeader>
                    <ChapterPicker
                      onPick={(id) => {
                        assign(key, id);
                        setAssignFor(null);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <ul className="space-y-1.5">
                {entries.length === 0 && (
                  <li className="text-[11px] italic text-muted-foreground">No tasks</li>
                )}
                {entries.map((e) => {
                  const ch = CHAPTER_MAP.get(e.chapterId);
                  if (!ch) return null;
                  const isBacklog = isPast && !e.done;
                  const dueOverdue = e.due && !e.done && e.due < today;
                  return (
                    <li
                      key={e.chapterId}
                      className={cn(
                        "group flex items-start gap-1.5 rounded-md border border-border/40 p-1.5 text-[11px]",
                        e.done && "opacity-60",
                        isBacklog && "border-destructive/60 bg-destructive/10",
                      )}
                    >
                      <button onClick={() => toggleDone(key, e.chapterId)} className="mt-0.5 shrink-0">
                        {e.done ? (
                          <CheckCircle2 className="h-3.5 w-3.5" style={{ color: ch.accent }} />
                        ) : (
                          <span
                            className="block h-3 w-3 rounded-full border"
                            style={{ borderColor: ch.accent }}
                          />
                        )}
                      </button>
                      <div className="flex-1 leading-tight">
                        <div className={e.done ? "line-through" : ""}>{ch.name}</div>
                        <div className="text-[10px] text-muted-foreground">{ch.subject}</div>
                        <DueDatePicker
                          value={e.due}
                          overdue={!!dueOverdue}
                          onChange={(due) => setDue(key, e.chapterId, due)}
                        />
                      </div>
                      <button
                        onClick={() => remove(key, e.chapterId)}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Remove"
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Backlog</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{backlog.length} pending</span>
            <Dialog open={addBacklogOpen} onOpenChange={setAddBacklogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add to backlog
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add to backlog</DialogTitle>
                </DialogHeader>
                <ChapterPicker
                  onPick={(id) => {
                    // Park as undone on yesterday so it appears in backlog list.
                    const y = format(addDays(new Date(), -1), "yyyy-MM-dd");
                    assign(y, id);
                    setAddBacklogOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {backlog.length === 0 ? (
          <p className="text-sm text-muted-foreground">All caught up. Strong work.</p>
        ) : (
          <ul className="space-y-2">
            {backlog.map((b) => {
              const ch = CHAPTER_MAP.get(b.chapterId);
              if (!ch) return null;
              return (
                <li
                  key={`${b.date}-${b.chapterId}`}
                  className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm"
                >
                  <div>
                    <div className="font-medium">{ch.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {ch.subject} · missed {format(new Date(b.date + "T00:00:00"), "MMM d")}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => reschedule(b.date, b.chapterId)}
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" /> Today
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function ChapterPicker({ onPick }: { onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const ql = q.trim().toLowerCase();
  return (
    <div className="space-y-3">
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search chapters…"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />
      <div className="space-y-3">
        {SYLLABUS.map((s) => {
          const matches = s.units.flatMap((u) =>
            u.chapters.filter((c) => !ql || c.name.toLowerCase().includes(ql)),
          );
          if (!matches.length) return null;
          return (
            <div key={s.id}>
              <div
                className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: s.accent }}
              >
                {s.name}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matches.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onPick(c.id)}
                    className="rounded-full border border-border/60 px-2.5 py-1 text-xs hover:border-primary hover:text-primary"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddTaskForm({
  defaultDate,
  onSubmit,
}: {
  defaultDate: string;
  onSubmit: (chapterId: string, scheduled: string, due?: string) => void;
}) {
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<Date>(new Date(defaultDate + "T00:00:00"));
  const [due, setDue] = useState<Date | undefined>(undefined);

  const chapter = chapterId ? CHAPTER_MAP.get(chapterId) : null;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Chapter
        </div>
        {chapter ? (
          <div className="flex items-center justify-between rounded-md border border-border/60 p-2 text-sm">
            <div>
              <div className="font-medium">{chapter.name}</div>
              <div className="text-xs text-muted-foreground">{chapter.subject}</div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setChapterId(null)}>
              Change
            </Button>
          </div>
        ) : (
          <ChapterPicker onPick={setChapterId} />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Scheduled date
          </div>
          <DatePopover value={scheduled} onChange={(d) => d && setScheduled(d)} placeholder="Pick a date" />
        </div>
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Completion date <span className="text-muted-foreground/70">(optional)</span>
          </div>
          <DatePopover value={due} onChange={setDue} placeholder="No due date" clearable />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          disabled={!chapterId}
          onClick={() =>
            chapterId &&
            onSubmit(
              chapterId,
              format(scheduled, "yyyy-MM-dd"),
              due ? format(due, "yyyy-MM-dd") : undefined,
            )
          }
        >
          Add task
        </Button>
      </div>
    </div>
  );
}

function DatePopover({
  value,
  onChange,
  placeholder,
  clearable,
}: {
  value?: Date;
  onChange: (d: Date | undefined) => void;
  placeholder: string;
  clearable?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
          {clearable && value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange(undefined);
                }
              }}
              className="ml-auto text-xs text-muted-foreground hover:text-destructive"
            >
              Clear
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

function DueDatePicker({
  value,
  onChange,
  overdue,
}: {
  value?: string;
  onChange: (due: string | undefined) => void;
  overdue: boolean;
}) {
  const date = value ? new Date(value + "T00:00:00") : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "mt-1 flex items-center gap-1 text-[10px] transition-colors",
            value
              ? overdue
                ? "text-destructive"
                : "text-muted-foreground hover:text-foreground"
              : "text-muted-foreground/60 opacity-0 group-hover:opacity-100",
          )}
        >
          {overdue ? (
            <AlertCircle className="h-3 w-3" />
          ) : (
            <CalendarIcon className="h-3 w-3" />
          )}
          {value ? `Due ${format(date!, "MMM d")}` : "Set due date"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : undefined)}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
        {value && (
          <div className="border-t border-border/60 p-2">
            <Button size="sm" variant="ghost" className="w-full" onClick={() => onChange(undefined)}>
              Clear due date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}