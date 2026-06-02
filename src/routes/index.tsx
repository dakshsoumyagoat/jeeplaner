import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressRing } from "@/components/app/ProgressRing";
import { usePersisted } from "@/lib/storage";
import { SYLLABUS } from "@/data/syllabus";
import { subjectProgress, todayKey, diffDays } from "@/lib/progress";
import type { DailyTarget, StreakState, SyllabusState } from "@/lib/types";
import { Flame, CheckCircle2, Circle, Sparkles, Play, ArrowRight } from "lucide-react";
import { toast } from "sonner";

// JEE Main 2027 — first session typically late January
const JEE_TARGET = new Date("2027-01-24T00:00:00");

function daysUntil(target: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((target.getTime() - today.getTime()) / 86400000));
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — JEE Scholar Planner" },
      { name: "description", content: "Your daily focus and overall syllabus progress." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const today = todayKey();
  const [syllabus] = usePersisted<SyllabusState>("syllabus-state", {});
  const [target, setTarget] = usePersisted<DailyTarget>("daily-target", {
    text: "",
    done: false,
    date: today,
  });
  const [streak, setStreak] = usePersisted<StreakState>("streak", {
    count: 0,
    lastDate: null,
  });
  const [draft, setDraft] = useState("");

  const current: DailyTarget = target.date === today ? target : { text: "", done: false, date: today };

  const progress = useMemo(
    () => ({
      physics: subjectProgress(syllabus, "physics"),
      chemistry: subjectProgress(syllabus, "chemistry"),
      math: subjectProgress(syllabus, "math"),
    }),
    [syllabus],
  );

  const overall = useMemo(() => {
    const pcts = [progress.physics.pct, progress.chemistry.pct, progress.math.pct];
    return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  }, [progress]);

  const setTodayTarget = (text: string) => {
    setTarget({ text, done: false, date: today });
    setDraft("");
  };

  const toggleDone = () => {
    const nextDone = !current.done;
    setTarget({ ...current, done: nextDone });
    if (nextDone) {
      setStreak((prev) => {
        if (prev.lastDate === today) return prev;
        if (prev.lastDate && diffDays(prev.lastDate, today) === 1) {
          return { count: prev.count + 1, lastDate: today };
        }
        return { count: 1, lastDate: today };
      });
      toast.success("Nice. Streak counted.", { description: "Keep showing up tomorrow." });
    }
  };

  const streakActive = streak.lastDate === today || (streak.lastDate && diffDays(streak.lastDate, today) <= 1);

  const daysLeft = daysUntil(JEE_TARGET);
  const totalChapters = progress.physics.total + progress.chemistry.total + progress.math.total;
  const doneChapters = progress.physics.done + progress.chemistry.done + progress.math.done;

  return (
    <div className="space-y-6">
      <section className="flex items-baseline justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 text-3xl font-semibold md:text-4xl">Mission Control</h1>
        </div>
        {streakActive && (
          <div className="flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
            <Flame className="h-3.5 w-3.5" />
            <span className="stat-num">{streak.count}</span>
            <span className="text-muted-foreground">day streak</span>
          </div>
        )}
      </section>

      {/* ============ Hero: JEE Countdown ============ */}
      <Card className="surface-elevated relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              JEE Main 2027
            </p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="stat-num text-6xl font-semibold text-foreground md:text-7xl">
                {daysLeft}
              </span>
              <span className="text-sm text-muted-foreground">days remaining</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Every focused day compounds. Make today count.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button asChild size="lg" className="rounded-xl">
                <Link to="/study">
                  <Play className="h-4 w-4" /> Start focus session
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl">
                <Link to="/planner">
                  Plan today <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <GoalTile value="5" unit="hrs" label="Study" />
            <GoalTile value={String(Math.max(0, 3 - 0))} unit="left" label="Chapters" />
            <GoalTile value="1" unit="set" label="Revision" />
          </div>
        </div>
      </Card>

      {/* ============ Daily Target ============ */}
      <Card className="surface overflow-hidden p-5">
        {current.text ? (
          <div className="flex items-start gap-4">
            <button
              onClick={toggleDone}
              className="mt-0.5 shrink-0 transition-transform hover:scale-110 active:scale-95"
              aria-label="Toggle target"
            >
              {current.done ? (
                <CheckCircle2 className="h-7 w-7 text-success" />
              ) : (
                <Circle className="h-7 w-7 text-muted-foreground" />
              )}
            </button>
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Daily target
              </div>
              <div
                className={`mt-1 text-lg font-medium leading-snug ${current.done ? "text-muted-foreground line-through" : ""}`}
              >
                {current.text}
              </div>
              <button
                onClick={() => setTarget({ text: "", done: false, date: today })}
                className="mt-3 text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Change target
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Set today&rsquo;s target
            </div>
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim()) setTodayTarget(draft.trim());
              }}
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="e.g. Physics: Rotation revision + 30 MCQs"
                className="bg-background/60"
              />
              <Button type="submit">Set target</Button>
            </form>
          </div>
        )}
      </Card>

      {/* ============ Quick Stats ============ */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Overall" value={`${overall}%`} sub="syllabus" />
        <StatCard label="Chapters" value={`${doneChapters}`} sub={`of ${totalChapters}`} />
        <StatCard label="Streak" value={`${streak.count}d`} sub={streakActive ? "Active" : "Restart"} />
        <StatCard label="Today" value={current.done ? "Done" : "Open"} sub={current.text ? "Target set" : "No target"} />
      </section>

      {/* ============ Subject Progress ============ */}
      <Card className="surface p-5">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold">Subject readiness</h2>
          <Link to="/syllabus" className="text-xs text-primary hover:underline">
            View syllabus →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {SYLLABUS.map((s) => {
            const p = progress[s.id];
            return (
              <ProgressRing
                key={s.id}
                pct={p.pct}
                label={s.name}
                sub={`${p.done}/${p.total}`}
                color={s.accent}
                size={110}
              />
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="surface p-3 transition-transform hover:-translate-y-0.5">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="stat-num mt-1.5 text-xl font-semibold text-foreground">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </Card>
  );
}

function GoalTile({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3 text-center">
      <div className="stat-num text-2xl font-semibold text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{unit}</div>
      <div className="mt-1 text-[11px] font-medium text-foreground/80">{label}</div>
    </div>
  );
}
