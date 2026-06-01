import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  Pencil,
  Search,
  Clock,
  CalendarDays,
  CalendarRange,
  Infinity as InfinityIcon,
} from "lucide-react";
import {
  ActiveTimer,
  StudySession,
  dateKey,
  elapsedOf,
  formatHMS,
  formatHuman,
  readActiveTimer,
  startOfDay,
  startOfMonth,
  startOfWeek,
  sumByRange,
  useStudySessions,
  useStudySubjects,
  writeActiveTimer,
} from "@/lib/study";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/study")({
  head: () => ({
    meta: [
      { title: "Study Tracker — JEE Scholar" },
      { name: "description", content: "Offline study timer and analytics." },
    ],
  }),
  component: StudyPage,
});

const PALETTE = [
  "var(--physics)",
  "var(--chemistry)",
  "var(--math)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
];

function StudyPage() {
  const [sessions, setSessions, ready] = useStudySessions();
  const [subjects, setSubjects] = useStudySubjects();
  const [active, setActive] = useState<ActiveTimer | null>(() => readActiveTimer());
  const [tick, setTick] = useState(Date.now());
  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0] ?? "Physics");
  const [newSubject, setNewSubject] = useState("");

  useEffect(() => {
    if (!subjects.includes(selectedSubject) && subjects[0]) setSelectedSubject(subjects[0]);
  }, [subjects, selectedSubject]);

  // tick every second when running
  useEffect(() => {
    if (!active?.runStart) return;
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active?.runStart]);

  const elapsed = elapsedOf(active, tick);

  const start = () => {
    if (active) return;
    const now = Date.now();
    const t: ActiveTimer = {
      subject: selectedSubject,
      runStart: now,
      accumulated: 0,
      startedAt: now,
    };
    setActive(t);
    writeActiveTimer(t);
  };

  const pause = () => {
    if (!active?.runStart) return;
    const now = Date.now();
    const t: ActiveTimer = {
      ...active,
      accumulated: active.accumulated + (now - active.runStart),
      runStart: null,
    };
    setActive(t);
    writeActiveTimer(t);
  };

  const resume = () => {
    if (!active || active.runStart) return;
    const t: ActiveTimer = { ...active, runStart: Date.now() };
    setActive(t);
    writeActiveTimer(t);
  };

  const stop = () => {
    if (!active) return;
    const now = Date.now();
    const total = elapsedOf(active, now);
    if (total >= 1000) {
      const session: StudySession = {
        id: crypto.randomUUID(),
        subject: active.subject,
        duration: total,
        startTime: active.startedAt,
        endTime: now,
        date: dateKey(active.startedAt),
      };
      setSessions((prev) => [session, ...prev]);
      toast.success(`Logged ${formatHuman(total)} — ${active.subject}`);
    } else {
      toast.message("Session too short to log");
    }
    setActive(null);
    writeActiveTimer(null);
  };

  const addSubject = () => {
    const name = newSubject.trim();
    if (!name) return;
    if (subjects.some((s) => s.toLowerCase() === name.toLowerCase())) {
      toast.error("Subject already exists");
      return;
    }
    setSubjects((prev) => [...prev, name]);
    setNewSubject("");
    toast.success(`Added ${name}`);
  };

  /* ----- aggregations ----- */
  const now = Date.now();
  const totals = useMemo(() => {
    const today = sumByRange(sessions, startOfDay(now), now);
    const week = sumByRange(sessions, startOfWeek(now), now);
    const month = sumByRange(sessions, startOfMonth(now), now);
    const lifetime = sessions.reduce((a, s) => a + s.duration, 0);
    return { today, week, month, lifetime };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  return (
    <div className="space-y-6 animate-fade-in">
      <section>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Offline · IndexedDB
        </p>
        <h1 className="mt-1 text-3xl font-semibold md:text-4xl">Study Tracker</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track deep work across subjects. Everything stays on this device.
        </p>
      </section>

      {/* ---------- Timer ---------- */}
      <Card className="glass-panel relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-[var(--math)]/15 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1fr,auto] md:items-center">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {active ? (active.runStart ? "Running" : "Paused") : "Ready"} ·{" "}
              {active?.subject ?? selectedSubject}
            </div>
            <div
              className={`mt-2 font-display text-6xl font-semibold tabular-nums tracking-tight md:text-7xl ${
                active?.runStart ? "text-foreground" : "text-foreground/90"
              }`}
            >
              {formatHMS(elapsed)}
            </div>
            {!active && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ManageSubjects
                  subjects={subjects}
                  setSubjects={setSubjects}
                  newSubject={newSubject}
                  setNewSubject={setNewSubject}
                  addSubject={addSubject}
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!active && (
              <Button size="lg" onClick={start} className="hover-scale">
                <Play className="h-4 w-4" /> Start
              </Button>
            )}
            {active?.runStart && (
              <Button size="lg" variant="secondary" onClick={pause} className="hover-scale">
                <Pause className="h-4 w-4" /> Pause
              </Button>
            )}
            {active && !active.runStart && (
              <Button size="lg" onClick={resume} className="hover-scale">
                <Play className="h-4 w-4" /> Resume
              </Button>
            )}
            {active && (
              <Button size="lg" variant="destructive" onClick={stop} className="hover-scale">
                <Square className="h-4 w-4" /> Stop
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ---------- Dashboard totals ---------- */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TotalCard icon={<Clock className="h-4 w-4" />} label="Today" ms={totals.today} />
        <TotalCard icon={<CalendarDays className="h-4 w-4" />} label="This week" ms={totals.week} />
        <TotalCard icon={<CalendarRange className="h-4 w-4" />} label="This month" ms={totals.month} />
        <TotalCard icon={<InfinityIcon className="h-4 w-4" />} label="Lifetime" ms={totals.lifetime} />
      </section>

      {/* ---------- Tabs ---------- */}
      <Tabs defaultValue="stats" className="w-full">
        <TabsList>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          {ready ? <StatsView sessions={sessions} /> : <Card className="p-6 text-sm text-muted-foreground">Loading…</Card>}
        </TabsContent>

        <TabsContent value="history">
          {ready ? (
            <HistoryView sessions={sessions} setSessions={setSessions} subjects={subjects} />
          ) : (
            <Card className="p-6 text-sm text-muted-foreground">Loading…</Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function TotalCard({ icon, label, ms }: { icon: React.ReactNode; label: string; ms: number }) {
  return (
    <Card className="glass-panel p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 font-display text-2xl font-semibold tabular-nums">
        {formatHuman(ms)}
      </div>
    </Card>
  );
}

function ManageSubjects({
  subjects,
  setSubjects,
  newSubject,
  setNewSubject,
  addSubject,
}: {
  subjects: string[];
  setSubjects: (u: string[] | ((p: string[]) => string[])) => void;
  newSubject: string;
  setNewSubject: (v: string) => void;
  addSubject: () => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-3.5 w-3.5" /> Subjects
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage subjects</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="e.g. Biology"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSubject();
                }
              }}
            />
            <Button onClick={addSubject}>Add</Button>
          </div>
          <ul className="divide-y divide-border/60 rounded-md border border-border/60">
            {subjects.map((s) => (
              <li key={s} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{s}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSubjects((prev) => prev.filter((x) => x !== s))}
                  aria-label={`Remove ${s}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatsView({ sessions }: { sessions: StudySession[] }) {
  // Last 14 days
  const daily = useMemo(() => {
    const rows: { date: string; label: string; minutes: number }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = dateKey(d.getTime());
      const minutes = Math.round(
        sessions.filter((s) => s.date === key).reduce((a, s) => a + s.duration, 0) / 60000,
      );
      rows.push({
        date: key,
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        minutes,
      });
    }
    return rows;
  }, [sessions]);

  // Last 8 weeks
  const weekly = useMemo(() => {
    const rows: { label: string; minutes: number }[] = [];
    const now = Date.now();
    for (let i = 7; i >= 0; i--) {
      const startBase = startOfWeek(now) - i * 7 * 86400000;
      const endBase = startBase + 7 * 86400000;
      const minutes = Math.round(sumByRange(sessions, startBase, endBase) / 60000);
      const d = new Date(startBase);
      rows.push({
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        minutes,
      });
    }
    return rows;
  }, [sessions]);

  const bySubject = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) map.set(s.subject, (map.get(s.subject) ?? 0) + s.duration);
    return [...map.entries()]
      .map(([name, ms]) => ({ name, minutes: Math.round(ms / 60000), ms }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <Card className="glass-panel p-8 text-center text-sm text-muted-foreground">
        No sessions yet. Press <span className="font-medium text-foreground">Start</span> to log your first session.
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="glass-panel p-4 md:col-span-2">
        <h3 className="mb-3 text-sm font-semibold">Daily study (last 14 days)</h3>
        <div className="h-56 w-full">
          <ResponsiveContainer>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} unit="m" />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="minutes" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="glass-panel p-4">
        <h3 className="mb-3 text-sm font-semibold">Weekly (last 8 weeks)</h3>
        <div className="h-56 w-full">
          <ResponsiveContainer>
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} unit="m" />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="minutes" fill="var(--chemistry)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="glass-panel p-4">
        <h3 className="mb-3 text-sm font-semibold">Subject distribution</h3>
        <div className="h-56 w-full">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={bySubject}
                dataKey="minutes"
                nameKey="name"
                innerRadius={45}
                outerRadius={80}
                paddingAngle={2}
              >
                {bySubject.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
                formatter={(v) => `${v as number} min`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="glass-panel p-4 md:col-span-2">
        <h3 className="mb-3 text-sm font-semibold">Subject totals</h3>
        <ul className="space-y-2">
          {bySubject.map((row, i) => {
            const max = bySubject[0]?.minutes || 1;
            const pct = Math.round((row.minutes / max) * 100);
            return (
              <li key={row.name} className="text-sm">
                <div className="flex items-center justify-between">
                  <span>{row.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatHuman(row.ms)}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: PALETTE[i % PALETTE.length] }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function HistoryView({
  sessions,
  setSessions,
  subjects,
}: {
  sessions: StudySession[];
  setSessions: (u: StudySession[] | ((p: StudySession[]) => StudySession[])) => void;
  subjects: string[];
}) {
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("__all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [editing, setEditing] = useState<StudySession | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions
      .filter((s) => (subjectFilter === "__all" ? true : s.subject === subjectFilter))
      .filter((s) => (dateFilter ? s.date === dateFilter : true))
      .filter((s) => (q ? s.subject.toLowerCase().includes(q) : true))
      .sort((a, b) => b.startTime - a.startTime);
  }, [sessions, query, subjectFilter, dateFilter]);

  return (
    <Card className="glass-panel p-4">
      <div className="grid gap-2 sm:grid-cols-[1fr,auto,auto,auto]">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subject…"
            className="pl-8"
          />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-44"
        />
        <Button
          variant="ghost"
          onClick={() => {
            setQuery("");
            setSubjectFilter("__all");
            setDateFilter("");
          }}
        >
          Reset
        </Button>
      </div>

      <div className="mt-4 divide-y divide-border/60 rounded-md border border-border/60">
        {filtered.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">No sessions match.</div>
        )}
        {filtered.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-accent/30"
          >
            <div className="min-w-32 flex-1">
              <div className="font-medium">{s.subject}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(s.startTime).toLocaleString()} →{" "}
                {new Date(s.endTime).toLocaleTimeString()}
              </div>
            </div>
            <div className="tabular-nums text-muted-foreground">{formatHuman(s.duration)}</div>
            <Button variant="ghost" size="icon" onClick={() => setEditing(s)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSessions((prev) => prev.filter((x) => x.id !== s.id));
                toast.success("Session deleted");
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <EditSessionDialog
        session={editing}
        subjects={subjects}
        onClose={() => setEditing(null)}
        onSave={(next) => {
          setSessions((prev) => prev.map((x) => (x.id === next.id ? next : x)));
          setEditing(null);
          toast.success("Session updated");
        }}
      />
    </Card>
  );
}

function EditSessionDialog({
  session,
  subjects,
  onClose,
  onSave,
}: {
  session: StudySession | null;
  subjects: string[];
  onClose: () => void;
  onSave: (s: StudySession) => void;
}) {
  const [subject, setSubject] = useState("");
  const [minutes, setMinutes] = useState("0");
  const [date, setDate] = useState("");
  const initialId = useRef<string | null>(null);

  useEffect(() => {
    if (session && session.id !== initialId.current) {
      initialId.current = session.id;
      setSubject(session.subject);
      setMinutes(String(Math.round(session.duration / 60000)));
      setDate(session.date);
    }
  }, [session]);

  if (!session) return null;

  const submit = () => {
    const mins = Math.max(0, parseInt(minutes, 10) || 0);
    const duration = mins * 60000;
    const startTime = new Date(`${date}T00:00:00`).getTime() || session.startTime;
    onSave({
      ...session,
      subject,
      duration,
      date,
      startTime,
      endTime: startTime + duration,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit session</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
                {!subjects.includes(subject) && subject && (
                  <SelectItem value={subject}>{subject}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Duration (minutes)</Label>
              <Input
                type="number"
                min={0}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}