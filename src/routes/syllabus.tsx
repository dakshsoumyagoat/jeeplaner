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
import { subjectProgress } from "@/lib/progress";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/syllabus")({
  head: () => ({
    meta: [
      { title: "Syllabus — JEE Scholar Planner" },
      { name: "description", content: "Track theory, practice, and revision for every JEE chapter." },
    ],
  }),
  component: SyllabusPage,
});

const TOGGLES = [
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

  const toggle = (chapterId: string, key: "theory" | "practice" | "revision") => {
    setState((prev) => ({
      ...prev,
      [chapterId]: { ...prev[chapterId], [key]: !prev[chapterId]?.[key] },
    }));
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold md:text-4xl">Syllabus</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap a badge to mark progress. A chapter counts as done when all three badges are filled.
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
                          const allDone = cs.theory && cs.practice && cs.revision;
                          return (
                            <li
                              key={ch.id}
                              className={cn(
                                "flex flex-col gap-2 rounded-lg border border-border/40 p-3 transition-colors sm:flex-row sm:items-center sm:justify-between",
                                allDone && "border-transparent bg-accent/40",
                              )}
                            >
                              <div className="text-sm">
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
                              <div className="flex flex-wrap gap-1.5">
                                {TOGGLES.map((t) => {
                                  const on = !!cs[t.key];
                                  return (
                                    <button
                                      key={t.key}
                                      onClick={() => toggle(ch.id, t.key)}
                                      className={cn(
                                        "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all active:scale-95",
                                        on
                                          ? "border-transparent text-background"
                                          : "border-border/60 text-muted-foreground hover:text-foreground",
                                      )}
                                      style={
                                        on
                                          ? { background: subject.accent }
                                          : undefined
                                      }
                                    >
                                      {t.label}
                                    </button>
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