import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePersisted } from "@/lib/storage";
import type { MockEntry } from "@/lib/types";
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
      { name: "description", content: "Log mock tests and analyze score trends." },
    ],
  }),
  component: MocksPage,
});

const empty = (): Omit<MockEntry, "id"> => ({
  date: todayKey(),
  total: 0,
  physics: 0,
  chemistry: 0,
  math: 0,
  negatives: 0,
  errors: { silly: 0, conceptual: 0, time: 0, unattempted: 0 },
});

function MocksPage() {
  const [mocks, setMocks] = usePersisted<MockEntry[]>("mocks", []);
  const [draft, setDraft] = useState(empty());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: MockEntry = { ...draft, id: crypto.randomUUID() };
    setMocks((prev) => [...prev, entry].sort((a, b) => a.date.localeCompare(b.date)));
    setDraft(empty());
    toast.success("Mock logged.");
  };

  const remove = (id: string) => setMocks((prev) => prev.filter((m) => m.id !== id));

  const chartData = useMemo(
    () =>
      mocks.map((m) => ({
        date: m.date.slice(5),
        Total: m.total,
        Physics: m.physics,
        Chemistry: m.chemistry,
        Math: m.math,
      })),
    [mocks],
  );

  const errorTotals = useMemo(() => {
    const acc = { silly: 0, conceptual: 0, time: 0, unattempted: 0 };
    for (const m of mocks) {
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
  }, [mocks]);

  const subjectAvg = useMemo(() => {
    if (!mocks.length) return null;
    const sum = mocks.reduce(
      (a, m) => ({ p: a.p + m.physics, c: a.c + m.chemistry, m: a.m + m.math }),
      { p: 0, c: 0, m: 0 },
    );
    return {
      Physics: Math.round(sum.p / mocks.length),
      Chemistry: Math.round(sum.c / mocks.length),
      Math: Math.round(sum.m / mocks.length),
    };
  }, [mocks]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold md:text-4xl">Mock analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log every mock. Patterns are louder than single scores.
        </p>
      </header>

      <Card className="p-5">
        <h2 className="mb-4 text-lg font-semibold">Log a mock</h2>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Date">
            <Input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              required
            />
          </Field>
          <NumField label="Total" value={draft.total} onChange={(v) => setDraft({ ...draft, total: v })} />
          <NumField label="Physics" value={draft.physics} onChange={(v) => setDraft({ ...draft, physics: v })} />
          <NumField label="Chemistry" value={draft.chemistry} onChange={(v) => setDraft({ ...draft, chemistry: v })} />
          <NumField label="Math" value={draft.math} onChange={(v) => setDraft({ ...draft, math: v })} />
          <NumField label="Negatives" value={draft.negatives} onChange={(v) => setDraft({ ...draft, negatives: v })} />
          <NumField
            label="Silly errors"
            value={draft.errors.silly}
            onChange={(v) => setDraft({ ...draft, errors: { ...draft.errors, silly: v } })}
          />
          <NumField
            label="Conceptual"
            value={draft.errors.conceptual}
            onChange={(v) => setDraft({ ...draft, errors: { ...draft.errors, conceptual: v } })}
          />
          <NumField
            label="Time errors"
            value={draft.errors.time}
            onChange={(v) => setDraft({ ...draft, errors: { ...draft.errors, time: v } })}
          />
          <NumField
            label="Unattempted"
            value={draft.errors.unattempted}
            onChange={(v) => setDraft({ ...draft, errors: { ...draft.errors, unattempted: v } })}
          />
          <div className="col-span-2 flex items-end sm:col-span-4">
            <Button type="submit" className="ml-auto">Save mock</Button>
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-lg font-semibold">Score trend</h2>
        {mocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No mocks yet. Log one to see your trend.</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="Total" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Physics" stroke="var(--physics)" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Chemistry" stroke="var(--chemistry)" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Math" stroke="var(--math)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {subjectAvg && (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {Object.entries(subjectAvg).map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border/50 p-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k} avg</div>
                <div className="font-display text-lg font-semibold">{v}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Error breakdown</h2>
          {mocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Log a mock to see your weak spots.</p>
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
          {mocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet.</p>
          ) : (
            <ul className="space-y-2">
              {[...mocks].reverse().map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3 text-sm"
                >
                  <div>
                    <div className="font-medium">{m.date}</div>
                    <div className="text-xs text-muted-foreground">
                      P {m.physics} · C {m.chemistry} · M {m.math} · −{m.negatives}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-display text-xl font-semibold">{m.total}</div>
                    <button
                      onClick={() => remove(m.id)}
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
    </div>
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

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <Field label={label}>
      <Input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </Field>
  );
}