import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePersisted } from "@/lib/storage";
import type { MockEntry, MockType, WeeklySubject } from "@/lib/types";
import { todayKey } from "@/lib/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/mocks")({
  head: () => ({
    meta: [
      { title: "Mocks — JEE Scholar Planner" },
      { name: "description", content: "Log weekly tests, JEE Mains and JEE Advanced mocks." },
    ],
  }),
  component: MocksPage,
});

const MOCK_META: Record<MockType, { label: string; maxMarks: number; short: string }> = {
  weekly: { label: "Weekly Test", maxMarks: 200, short: "Weekly" },
  mains: { label: "JEE Mains", maxMarks: 300, short: "Mains" },
  advanced: { label: "JEE Advanced", maxMarks: 360, short: "Advanced" },
};

const WEEKLY_SUBJECTS: { value: WeeklySubject; label: string }[] = [
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "math", label: "Mathematics" },
];

const emptyDraft = (type: MockType): Omit<MockEntry, "id"> => ({
  date: todayKey(),
  type,
  total: 0,
  maxMarks: MOCK_META[type].maxMarks,
  subject: type === "weekly" ? "physics" : undefined,
  physics: type === "weekly" ? undefined : 0,
  chemistry: type === "weekly" ? undefined : 0,
  math: type === "weekly" ? undefined : 0,
  negatives: 0,
  errors: { silly: 0, conceptual: 0, time: 0, unattempted: 0 },
});

function MocksPage() {
  const [mocks, setMocks] = usePersisted<MockEntry[]>("mocks-v2", []);
  const [tab, setTab] = useState<MockType>("weekly");

  const remove = (id: string) => setMocks((prev) => prev.filter((m) => m.id !== id));

  const filtered = useMemo(
    () => mocks.filter((m) => m.type === tab).sort((a, b) => a.date.localeCompare(b.date)),
    [mocks, tab],
  );

  const addEntry = (entry: MockEntry) => {
    setMocks((prev) => [...prev, entry].sort((a, b) => a.date.localeCompare(b.date)));
    toast.success(`${MOCK_META[entry.type].label} logged.`);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold md:text-4xl">Mock analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track Weekly Tests, JEE Mains and JEE Advanced separately. Patterns are louder than single scores.
        </p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as MockType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly">Weekly Test</TabsTrigger>
          <TabsTrigger value="mains">JEE Mains</TabsTrigger>
          <TabsTrigger value="advanced">JEE Advanced</TabsTrigger>
        </TabsList>

        {(["weekly", "mains", "advanced"] as MockType[]).map((type) => (
          <TabsContent key={type} value={type} className="mt-6 space-y-6">
            <MockForm type={type} onSubmit={addEntry} />
            <Analytics entries={filtered.filter((m) => m.type === type)} type={type} onRemove={remove} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function MockForm({ type, onSubmit }: { type: MockType; onSubmit: (e: MockEntry) => void }) {
  const [draft, setDraft] = useState(emptyDraft(type));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...draft, type, id: crypto.randomUUID() });
    setDraft(emptyDraft(type));
  };

  const meta = MOCK_META[type];

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Log a {meta.label}</h2>
        <span className="text-xs text-muted-foreground">Max marks: {meta.maxMarks}</span>
      </div>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Date">
          <Input
            type="date"
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            required
          />
        </Field>

        {type === "weekly" ? (
          <Field label="Subject">
            <Select
              value={draft.subject ?? "physics"}
              onValueChange={(v) => setDraft({ ...draft, subject: v as WeeklySubject })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKLY_SUBJECTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}

        <NumField
          label={`Total / ${meta.maxMarks}`}
          value={draft.total}
          max={meta.maxMarks}
          onChange={(v) => setDraft({ ...draft, total: v })}
        />

        {type !== "weekly" && (
          <>
            <NumField label="Physics" value={draft.physics ?? 0} onChange={(v) => setDraft({ ...draft, physics: v })} />
            <NumField label="Chemistry" value={draft.chemistry ?? 0} onChange={(v) => setDraft({ ...draft, chemistry: v })} />
            <NumField label="Math" value={draft.math ?? 0} onChange={(v) => setDraft({ ...draft, math: v })} />
          </>
        )}

        <NumField label="Negatives" value={draft.negatives} onChange={(v) => setDraft({ ...draft, negatives: v })} />
        <NumField label="Silly errors" value={draft.errors.silly} onChange={(v) => setDraft({ ...draft, errors: { ...draft.errors, silly: v } })} />
        <NumField label="Conceptual" value={draft.errors.conceptual} onChange={(v) => setDraft({ ...draft, errors: { ...draft.errors, conceptual: v } })} />
        <NumField label="Time errors" value={draft.errors.time} onChange={(v) => setDraft({ ...draft, errors: { ...draft.errors, time: v } })} />
        <NumField label="Unattempted" value={draft.errors.unattempted} onChange={(v) => setDraft({ ...draft, errors: { ...draft.errors, unattempted: v } })} />

        <div className="col-span-2 flex items-end sm:col-span-4">
          <Button type="submit" className="ml-auto">Save {meta.short}</Button>
        </div>
      </form>
    </Card>
  );
}

function Analytics({
  entries,
  type,
  onRemove,
}: {
  entries: MockEntry[];
  type: MockType;
  onRemove: (id: string) => void;
}) {
  const meta = MOCK_META[type];

  const chartData = useMemo(() => {
    return entries.map((m) => {
      const base: Record<string, string | number> = {
        date: m.date.slice(5),
        Total: m.total,
      };
      if (type === "weekly") {
        base.Subject = m.subject ?? "";
      } else {
        base.Physics = m.physics ?? 0;
        base.Chemistry = m.chemistry ?? 0;
        base.Math = m.math ?? 0;
      }
      return base;
    });
  }, [entries, type]);

  const errorTotals = useMemo(() => {
    const acc = { silly: 0, conceptual: 0, time: 0, unattempted: 0 };
    for (const m of entries) {
      acc.silly += m.errors.silly;
      acc.conceptual += m.errors.conceptual;
      acc.time += m.errors.time;
      acc.unattempted += m.errors.unattempted;
    }
    return [
      { name: "Silly", value: acc.silly, color: "var(--chart-5)" },
      { name: "Conceptual", value: acc.conceptual, color: "var(--physics)" },
      { name: "Time", value: acc.time, color: "var(--chart-4)" },
      { name: "Unattempted", value: acc.unattempted, color: "var(--math)" },
    ];
  }, [entries]);

  const avg = useMemo(() => {
    if (!entries.length) return null;
    const avgTotal = Math.round(entries.reduce((a, m) => a + m.total, 0) / entries.length);
    const pct = Math.round((avgTotal / meta.maxMarks) * 100);
    return { avgTotal, pct };
  }, [entries, meta.maxMarks]);

  return (
    <>
      <Card className="p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Score trend</h2>
          {avg && (
            <span className="text-xs text-muted-foreground">
              Avg {avg.avgTotal}/{meta.maxMarks} · {avg.pct}%
            </span>
          )}
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No {meta.label} entries yet. Log one to see your trend.</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, meta.maxMarks]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="Total" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
                {type !== "weekly" && (
                  <>
                    <Line type="monotone" dataKey="Physics" stroke="var(--physics)" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="Chemistry" stroke="var(--chemistry)" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="Math" stroke="var(--math)" strokeWidth={1.5} dot={false} />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Error breakdown</h2>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Log a {meta.label} to see weak spots.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={errorTotals}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    cursor={{ fill: "var(--accent)" }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {errorTotals.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold">History</h2>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet.</p>
          ) : (
            <ul className="space-y-2">
              {[...entries].reverse().map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3 text-sm"
                >
                  <div>
                    <div className="font-medium">{m.date}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.type === "weekly"
                        ? `${m.subject ? m.subject[0].toUpperCase() + m.subject.slice(1) : ""} · −${m.negatives}`
                        : `P ${m.physics ?? 0} · C ${m.chemistry ?? 0} · M ${m.math ?? 0} · −${m.negatives}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-display text-xl font-semibold">
                      {m.total}
                      <span className="text-xs font-normal text-muted-foreground">/{m.maxMarks}</span>
                    </div>
                    <button
                      onClick={() => onRemove(m.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        min={0}
        max={max}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </Field>
  );
}