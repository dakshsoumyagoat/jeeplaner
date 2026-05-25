import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SYLLABUS } from "@/data/syllabus";
import { usePersisted } from "@/lib/storage";
import type { SyllabusState } from "@/lib/types";
import { subjectProgress, chapterAvg } from "@/lib/progress";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/syllabus")({
  head: () => ({
    meta: [
      { title: "Syllabus — JEE Scholar Planner" },
      { name: "description", content: "Track theory, practice, and revision for every JEE chapter." },
    ],
  }),
  component: SyllabusPage,
});

const TRACKS = [
  { key: "theory", label: "Theory" },
  { key: "practice", label: "Practice" },
  { key: "revision", label: "Revision" },
] as const;

function SyllabusPage() {
  const [state, setState] = usePersisted<SyllabusState>("syllabus-state", {});
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SYLLABUS;
    return SYLLABUS.map((s) => ({
      ...s,
      units: s.units
        .map((u) => ({
          ...u,
          chapters: u.chapters.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              u.name.toLowerCase().includes(q),
          ),
        }))
        .filter((u) => u.chapters.length),
    })).filter((s) => s.units.length);
  }, [query]);

  const setTrack = (
    chapterId: string,
    key: "theory" | "practice" | "revision",
    value: number,
  ) => {
    setState((prev) => ({
      ...prev,
      [chapterId]: { ...prev[chapterId], [key]: value },
    }));
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold md:text-4xl">Syllabus</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag the sliders to track theory, practice, and revision. A chapter is mastered when all three reach 100%.
        </p>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chapters or units…"
          className="pl-9"
        />
      </div>

      <div className="space-y-4">
        {filtered.map((subject) => {
          const p = subjectProgress(state, subject.id);
          return (
            <Card key={subject.id} className="overflow-hidden p-0">
              <div
                className="flex items-center justify-between border-b border-border/60 px-4 py-3"
                style={{
                  background: `linear-gradient(90deg, color-mix(in oklab, ${subject.accent} 18%, transparent), transparent)`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: subject.accent }}
                  />
                  <h2 className="font-display text-lg font-semibold">{subject.name}</h2>
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.done}/{p.total} · {p.pct}%
                </div>
              </div>
              <Accordion type="multiple" className="px-4">
                {subject.units.map((unit) => (
                  <AccordionItem key={unit.id} value={unit.id} className="border-border/50">
                    <AccordionTrigger className="text-sm font-medium">
                      {unit.name}
                      <span className="ml-auto mr-2 text-xs text-muted-foreground">
                        {unit.chapters.length}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2">
                        {unit.chapters.map((ch) => {
                          const cs = state[ch.id] || {};
                          const avg = chapterAvg(cs);
                          const allDone = avg >= 100;
                          return (
                            <li
                              key={ch.id}
                              className={cn(
                                "flex flex-col gap-3 rounded-lg border border-border/40 p-3 transition-colors",
                                allDone && "border-transparent bg-accent/40",
                              )}
                            >
                              <div className="flex items-baseline justify-between gap-2">
                                <div className="text-sm font-medium">
                                  {ch.name}
                                  {allDone && (
                                    <span
                                      className="ml-2 text-[10px] uppercase tracking-widest"
                                      style={{ color: subject.accent }}
                                    >
                                      Mastered
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] tabular-nums text-muted-foreground">
                                  {avg}%
                                </div>
                              </div>
                              <div className="grid gap-2 sm:grid-cols-3">
                                {TRACKS.map((t) => {
                                  const val = Number(cs[t.key]) || 0;
                                  return (
                                    <div key={t.key} className="space-y-1">
                                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span>{t.label}</span>
                                        <span className="tabular-nums" style={{ color: val > 0 ? subject.accent : undefined }}>
                                          {val}%
                                        </span>
                                      </div>
                                      <Slider
                                        value={[val]}
                                        min={0}
                                        max={100}
                                        step={5}
                                        onValueChange={(v) => setTrack(ch.id, t.key, v[0] ?? 0)}
                                        style={{ ['--primary' as any]: subject.accent }}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          );
        })}
      </div>
    </div>
  );
}