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
import { Flame, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { toast } from "sonner";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

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
  const todayLabel = DATE_FORMATTER.format(new Date(`${today}T00:00:00Z`));
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

  const current: DailyTarget =
    target.date === today ? target : { text: "", done: false, date: today };

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

  const streakActive =
    streak.lastDate === today || (streak.lastDate && diffDays(streak.lastDate, today) <= 1);

  const totalChapters = progress.physics.total + progress.chemistry.total + progress.math.total;
  const doneChapters = progress.physics.done + progress.chemistry.done + progress.math.done;

  return (
    <div className="space-y-6">
      <section className="flex items-baseline justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {todayLabel}
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
        <StatCard
          label="Streak"
          value={`${streak.count}d`}
          sub={streakActive ? "Active" : "Restart"}
        />
        <StatCard
          label="Today"
          value={current.done ? "Done" : "Open"}
          sub={current.text ? "Target set" : "No target"}
        />
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
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
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
