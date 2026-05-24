
# JEE Scholar Planner — Build Plan

A dark-mode-first, mobile-optimized study companion for JEE aspirants with offline-friendly local persistence, syllabus tracking, planner, and mock analytics.

## Note on "PWA" / offline

A full service-worker PWA does not work reliably inside the Lovable editor preview (service workers cache stale builds and break the preview iframe). I'll ship the app as **installable** via a web app manifest + icons + standalone display + theme colors — users can "Add to Home Screen" on mobile/desktop. All data lives in **IndexedDB** (via a tiny wrapper), so the app remains fully usable after first load even without network for already-loaded routes. If you specifically need true offline (works with no network on a cold start), we can add a guarded service worker later — flag this and I'll wire it in with the preview-safe pattern.

## Pages & routes

```text
/              Dashboard (Today's target, 3 syllabus rings, streak)
/syllabus      Interactive checklist (accordion + search + 3 toggles per chapter)
/planner       Weekly calendar + Backlog Manager
/mocks         Mock test form + line chart + strengths/weaknesses
```

Bottom navigation bar (mobile) + top nav (desktop) — same 4 destinations.

## Features per page

**Dashboard**
- "Today's Target" card with mark-complete toggle (drives streak).
- 3 circular progress rings (Physics / Chemistry / Math) computed from chapter completion (chapter = done when all 3 toggles checked).
- Streak counter (consecutive days with ≥1 completed target).

**Syllabus**
- Seeded JEE syllabus: Subject → Unit → Chapter (curated standard list).
- Per chapter: 3 toggle badges — Theory / Practice / Revision.
- Search bar filters chapters live.
- Accent colors: Physics neon-blue, Chemistry emerald, Math purple.

**Planner**
- Weekly view (7-day grid, navigable by week).
- Click a day to assign chapters from a picker (drag-and-drop on desktop, tap-to-add on mobile — simpler and more reliable on touch).
- Backlog section: any past-day assignment not marked done shows red with "Reschedule" action.

**Mocks**
- Form: date, total, P/C/M scores, negatives, plus tagged error types (Silly / Conceptual / Time / Unattempted).
- Line chart of total + per-subject trend (Recharts).
- Strengths vs Weaknesses: aggregated error-type bar.

## Design system

- Dark-first theme in `src/styles.css` using oklch tokens.
  - Background: deep slate/near-black; surfaces: layered slate.
  - Accents: `--physics` (neon blue), `--chemistry` (emerald), `--math` (purple).
- Typography: Space Grotesk (display) + Inter (body) via Google Fonts.
- Micro-interactions: tw-animate-css for accordion expand, check-toggle pop, tab transitions.
- shadcn primitives: accordion, card, progress, tabs, dialog, input, button, badge, sonner.

## Data layer

- IndexedDB via a small `idb-keyval`-style wrapper in `src/lib/storage.ts`.
- Stores: `syllabus-state`, `daily-targets`, `streak`, `planner`, `mocks`.
- React Query for in-memory cache; persisted writes on mutation.
- Seed syllabus shipped as a static TS module.

## File plan

```text
src/
  routes/
    __root.tsx           (add fonts, meta, manifest link, AppShell with bottom nav)
    index.tsx            (Dashboard)
    syllabus.tsx
    planner.tsx
    mocks.tsx
  components/
    app-shell.tsx        (top + bottom nav)
    progress-ring.tsx
    today-target-card.tsx
    streak-card.tsx
    syllabus-tree.tsx
    planner-week.tsx
    backlog-list.tsx
    mock-form.tsx
    mock-chart.tsx
    error-breakdown.tsx
  data/
    syllabus.ts          (seed JEE syllabus)
  lib/
    storage.ts           (IndexedDB wrapper)
    progress.ts          (derive % + streak)
  styles.css             (dark-first tokens, subject accents)
public/
  manifest.webmanifest
  icon-192.png
  icon-512.png
  apple-touch-icon.png
```

## Dependencies to add

- `recharts` (charts)
- `date-fns` (week math)
- `idb-keyval` (tiny IndexedDB wrapper)

## Out of scope (unless you confirm)

- Real service worker / true cold-start offline.
- Cloud sync / auth (everything is local-only).
- Drag-and-drop library on mobile — using tap-to-assign instead.

Ready to build on approval.
