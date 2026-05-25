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
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { SchoolTimetableV2, TimetableEntry } from "@/lib/types";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const DEFAULT_SLOTS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
];

const createEmpty = (slots: string[]): SchoolTimetableV2 => ({
  slots,
  entries: WEEKDAYS.reduce((acc, day) => {
    acc[day] = slots.reduce((s, slot) => ((s[slot] = null), s), {} as Record<string, TimetableEntry | null>);
    return acc;
  }, {} as Record<string, Record<string, TimetableEntry | null>>),
});

const getTextColor = (hex: string) => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160 ? "text-slate-900" : "text-white";
};

const isWeekday = (day: string): day is (typeof WEEKDAYS)[number] => WEEKDAYS.includes(day as any);

export function SchoolTimetable() {
  const [state, setState] = usePersisted<SchoolTimetableV2>(
    "school-timetable-v2",
    createEmpty(DEFAULT_SLOTS),
  );

  // Migration safety: if older data shape sneaks in, normalize.
  const slots = Array.isArray(state.slots) && state.slots.length ? state.slots : DEFAULT_SLOTS;
  const entries = state.entries && typeof state.entries === "object" ? state.entries : createEmpty(slots).entries;

  const [selected, setSelected] = useState<{ day: string; slot: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeDay, setActiveDay] = useState<(typeof WEEKDAYS)[number]>("Monday");
  const [form, setForm] = useState({ subject: "", teacher: "", room: "", color: "#8b5cf6" });
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [slotDraft, setSlotDraft] = useState("");

  const today = useMemo(() => format(new Date(), "EEEE"), []);

  useEffect(() => {
    if (isWeekday(today)) setActiveDay(today);
  }, [today]);

  const selectedEntry = selected ? entries[selected.day]?.[selected.slot] ?? null : null;

  const openEditor = (day: string, slot: string) => {
    const entry = entries[day]?.[slot];
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
    setState((prev) => ({
      slots: prev.slots ?? slots,
      entries: {
        ...prev.entries,
        [selected.day]: {
          ...prev.entries?.[selected.day],
          [selected.slot]: {
            subject: form.subject.trim(),
            teacher: form.teacher.trim() || undefined,
            room: form.room.trim() || undefined,
            color: form.color,
          },
        },
      },
    }));
    setDialogOpen(false);
  };

  const deleteSlotEntry = () => {
    if (!selected) return;
    setState((prev) => ({
      slots: prev.slots ?? slots,
      entries: {
        ...prev.entries,
        [selected.day]: { ...prev.entries?.[selected.day], [selected.slot]: null },
      },
    }));
    setDialogOpen(false);
  };

  const startEditTime = (slot: string) => {
    setEditingSlot(slot);
    setSlotDraft(slot);
  };

  const commitSlotRename = (oldSlot: string) => {
    const next = slotDraft.trim();
    setEditingSlot(null);
    if (!next || next === oldSlot) return;
    if (slots.includes(next)) return;
    setState((prev) => {
      const nextSlots = (prev.slots ?? slots).map((s) => (s === oldSlot ? next : s));
      const nextEntries: typeof prev.entries = {};
      for (const day of Object.keys(prev.entries ?? {})) {
        const row = prev.entries[day] ?? {};
        const newRow: Record<string, TimetableEntry | null> = {};
        for (const s of nextSlots) {
          newRow[s] = s === next ? row[oldSlot] ?? null : row[s] ?? null;
        }
        nextEntries[day] = newRow;
      }
      return { slots: nextSlots, entries: nextEntries };
    });
  };

  const addSlot = () => {
    const base = "New time";
    let candidate = base;
    let i = 2;
    while (slots.includes(candidate)) candidate = `${base} ${i++}`;
    setState((prev) => {
      const nextSlots = [...(prev.slots ?? slots), candidate];
      const nextEntries: typeof prev.entries = {};
      for (const day of WEEKDAYS) {
        nextEntries[day] = { ...(prev.entries?.[day] ?? {}), [candidate]: null };
      }
      return { slots: nextSlots, entries: nextEntries };
    });
    setTimeout(() => startEditTime(candidate), 0);
  };

  const removeSlot = (slot: string) => {
    setState((prev) => {
      const nextSlots = (prev.slots ?? slots).filter((s) => s !== slot);
      const nextEntries: typeof prev.entries = {};
      for (const day of Object.keys(prev.entries ?? {})) {
        const { [slot]: _, ...rest } = prev.entries[day] ?? {};
        nextEntries[day] = rest;
      }
      return { slots: nextSlots, entries: nextEntries };
    });
  };

  const resetSchedule = () => setState(createEmpty(DEFAULT_SLOTS));

  return (
    <Card className="space-y-5 rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-2xl shadow-black/10 backdrop-blur-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.26em] text-muted-foreground">
            Weekly Timetable
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Tap a time label to rename it. Tap any slot to add or edit a class.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={addSlot}>
            <Plus className="mr-1 h-4 w-4" /> Add time slot
          </Button>
          <Button size="sm" variant="outline" onClick={resetSchedule}>
            Clear all
          </Button>
        </div>
      </div>

      {/* Mobile: day tabs + list */}
      <div className="md:hidden">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
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
        <div className="space-y-2">
          {slots.map((slot) => {
            const entry = entries[activeDay]?.[slot] ?? null;
            return (
              <div key={slot} className="flex items-stretch gap-2">
                <SlotLabel
                  slot={slot}
                  editing={editingSlot === slot}
                  draft={slotDraft}
                  onStartEdit={() => startEditTime(slot)}
                  onChange={setSlotDraft}
                  onCommit={() => commitSlotRename(slot)}
                  onRemove={() => removeSlot(slot)}
                />
                <button
                  type="button"
                  onClick={() => openEditor(activeDay, slot)}
                  className={cn(
                    "flex flex-1 items-center justify-between rounded-2xl border px-3 py-3 text-left transition",
                    entry ? "border-white/10 bg-white/5" : "border-dashed border-white/10 hover:bg-white/5",
                  )}
                  style={entry ? { backgroundColor: `${entry.color}17`, borderLeftColor: entry.color, borderLeftWidth: 3 } : {}}
                >
                  {entry ? (
                    <div>
                      <div className="font-medium">{entry.subject}</div>
                      <div className="text-xs text-muted-foreground">
                        {entry.teacher ?? "—"} {entry.room ? `· ${entry.room}` : ""}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Add a class</span>
                  )}
                  <span className="text-xs text-muted-foreground">Edit</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop grid */}
      <div className="hidden md:grid gap-2 text-sm" style={{ gridTemplateColumns: `120px repeat(${WEEKDAYS.length}, minmax(0, 1fr))` }}>
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Time
        </div>
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className={cn(
              "rounded-2xl border border-white/10 bg-slate-950/80 p-3 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground",
              day === today && "border-primary/30 bg-primary/10 text-primary",
            )}
          >
            {day}
          </div>
        ))}

        {slots.map((slot) => (
          <Fragment key={slot}>
            <SlotLabel
              slot={slot}
              editing={editingSlot === slot}
              draft={slotDraft}
              onStartEdit={() => startEditTime(slot)}
              onChange={setSlotDraft}
              onCommit={() => commitSlotRename(slot)}
              onRemove={() => removeSlot(slot)}
            />
            {WEEKDAYS.map((day) => {
              const entry = entries[day]?.[slot] ?? null;
              return (
                <button
                  key={`${day}-${slot}`}
                  type="button"
                  onClick={() => openEditor(day, slot)}
                  className={cn(
                    "min-h-[84px] rounded-2xl border p-3 text-left transition",
                    entry ? "border-white/10 hover:border-white/20" : "border-dashed border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10",
                  )}
                  style={entry ? { backgroundColor: `${entry.color}17`, borderLeftColor: entry.color, borderLeftWidth: 3 } : {}}
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
                      <div className="text-xs">Empty</div>
                    )}
                  </div>
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto bg-slate-950/95 border border-white/10">
          <DialogHeader>
            <DialogTitle>
              {selectedEntry ? "Edit class" : "Add class"}
              {selected ? ` · ${selected.day} ${selected.slot}` : ""}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Save the subject, teacher, room, and a color.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Subject">
                <input
                  value={form.subject}
                  onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="e.g. Algebra II"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
                />
              </FormField>
              <FormField label="Teacher">
                <input
                  value={form.teacher}
                  onChange={(e) => setForm((p) => ({ ...p, teacher: e.target.value }))}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
                />
              </FormField>
              <FormField label="Room">
                <input
                  value={form.room}
                  onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
                />
              </FormField>
              <FormField label="Color">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900 px-3 py-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                    className="h-9 w-9 rounded-full border border-white/10 bg-transparent p-0"
                  />
                  <span className="text-sm text-white">{form.color}</span>
                </div>
              </FormField>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <Button type="button" variant="destructive" onClick={deleteSlotEntry} disabled={!selectedEntry}>
              Delete class
            </Button>
            <div className="flex gap-2 flex-wrap">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="button" onClick={saveSlot}>Save class</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function SlotLabel({
  slot,
  editing,
  draft,
  onStartEdit,
  onChange,
  onCommit,
  onRemove,
}: {
  slot: string;
  editing: boolean;
  draft: string;
  onStartEdit: () => void;
  onChange: (v: string) => void;
  onCommit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="group flex min-w-[110px] items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 p-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") {
              onChange(slot);
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="w-full rounded-md bg-slate-900 px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-primary"
        />
      ) : (
        <>
          <button onClick={onStartEdit} className="flex flex-1 items-center gap-1 text-left hover:text-foreground">
            <span>{slot}</span>
            <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
          </button>
          <button
            onClick={onRemove}
            className="ml-1 opacity-0 transition-opacity group-hover:opacity-60 hover:!opacity-100 hover:text-destructive"
            aria-label="Remove slot"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}