## JEE Scholar Planner — UI/UX Redesign Plan

Visual + IA redesign only. No business logic, data models, or storage changes. All existing routes, hooks, and persistence (localStorage / IndexedDB) remain intact.

### 1. Design tokens (`src/styles.css`)

Replace the current palette with the spec:

- `--background: #0B0F14`
- `--card / surface: #111827`
- `--popover / elevated: #161F2E`
- `--border: rgba(255,255,255,0.08)`
- `--primary: #4F8CFF` (was purple)
- `--secondary: #7C4DFF`
- `--success: #22C55E`, `--warning: #F59E0B`, `--destructive: #EF4444`
- `--foreground: #F8FAFC`, `--muted-foreground: #94A3B8`
- Subject tokens: `--physics: #4F8CFF`, `--chemistry: #22C55E`, `--math: #7C4DFF`

Typography:
- Add Google Fonts (Sora, Inter, JetBrains Mono) via `<link>` in `__root.tsx` head
- `--font-display: "Sora"`, `--font-sans: "Inter"`, `--font-mono: "JetBrains Mono"`
- `h1–h4` → Sora 600; body → Inter; all numeric stats (`.stat`, countdowns, timer) → JetBrains Mono tabular-nums

New utility classes: `.surface`, `.surface-elevated`, `.stat-num`, `.hairline` (1px border using token), `.ring-progress`.

### 2. Navigation shell (`src/components/app/AppShell.tsx`)

- **Mobile (< md)**: bottom nav with 5 items — Today, Syllabus, Planner, Focus, Insights. Icons from `lucide-react` (Home, BookOpen, CalendarDays, Timer, BarChart3). Active item gets primary accent + soft glow underline.
- **Desktop (≥ md)**: compact 72px navigation rail on the left with icon + tiny label, no large sidebar. Tooltip on hover.
- **Floating Action Button**: bottom-right, opens a small radial/popover menu with three actions — Add Task (→ Planner), Start Session (→ Focus), Add Mock (→ Insights/Mocks). Hidden on Focus route while timer runs.
- Move School Schedule out of primary nav into a secondary tab inside Planner (Planner / Schedule toggle at the top) to keep nav at 5 items as specified.
- Mocks become a sub-tab of Insights (Overview / Mocks / Trends).

### 3. Today / Dashboard (`src/routes/index.tsx`)

Hero card (elevated surface):
- Left: "JEE Main 2027" label + huge JetBrains Mono countdown "412 Days Remaining"
- Right: Today's Goal block — 5h study / 3 chapters / 1 revision (mono numerals)
- Streak chip with flame icon
- Primary CTA button: "Start Focus Session" (full-width on mobile)

Sections below:
- **Today's Timeline** — vertical timeline list, time on left (mono), status dot (✓ filled / ○ outline), task title, subject badge. Subtle line connecting dots.
- **Subject Progress** — 3 cards (Physics / Chemistry / Math). Each shows ring progress (overall %), chapters done, weak count, exam readiness %. Subtle gradient using subject token at 8% opacity, animated ring fill.

### 4. Syllabus (`src/routes/syllabus.tsx`)

- Subject → Unit → Chapter tree with framer-motion expand/collapse (height + opacity, 200ms).
- Replace sliders with **segmented progress bars** (10 segments each) for Theory / Practice / Revision. Tap a segment to set %. Keep existing data shape; just render differently.
- Mastery chip per chapter derived from averages: Weak <30%, Average 30–60%, Strong 60–85%, Exam Ready ≥85%. Colored dot + label.
- Sticky subject header with overall % and filter pills (All / Weak / Strong).

### 5. Planner (`src/routes/planner.tsx`)

Hybrid layout:
- Top: compact monthly calendar strip (current month, dots on days with tasks)
- Below: **Kanban** with 4 columns — To Do, In Progress, Completed, Backlog. Drag with `@dnd-kit/core` (already lightweight; add dependency).
- Cards: subject badge (color dot), chapter name, due date (mono), priority chip, estimated time. Hover elevates.
- Secondary tab toggle at top: **Planner | Schedule** (Schedule renders existing timetable redesigned).

### 6. School Schedule (inside Planner tab)

- Google-Calendar-style time grid: rows = 30-min slots, columns = Mon–Sun.
- Subject color blocks spanning their duration. Click → inline edit popover (time, subject, label).
- Mobile fallback: day-tab + vertical cards.

### 7. Focus / Study Timer (`src/routes/study.tsx`)

Centerpiece layout:
- Centered massive timer (`text-8xl` JetBrains Mono, tabular-nums)
- Subject + chapter label above
- Three pill buttons: Start / Pause / Finish
- Breathing animation while running: outer ring opacity 0.6 ↔ 1 over 4s ease-in-out (framer-motion `animate`)
- 4 stat tiles below: Today's Focus Time, Weekly, Longest Session, Current Streak (mono numerals)
- Session history collapsed into an accordion underneath

### 8. Insights / Analytics (new `/insights` view; replace mocks page or add tabs)

Tabs: Overview / Mocks / Trends. Move existing mocks UI under "Mocks" tab; add Overview with Recharts:
- Study Time Trends (area chart, 30d)
- Subject Distribution (donut)
- Weekly Consistency (heatmap-style grid)
- Mock Test Performance (line)
- Revision Frequency (bar)

Chart styling: no vertical grid, dashed horizontal grid at 8% white, rounded line caps, smooth 300ms animations.

### 9. Mock Tests redesign (Insights → Mocks)

- Card per mock: name, date, score (mono), accuracy %, negatives, completion %
- Expand → 3 subject sub-cards (P/C/M) with mini bar, plus Error Analysis breakdown (Silly / Conceptual / Time) as stacked bar
- Trend chart of last N mocks at top of tab

### 10. Motion

Add `framer-motion` patterns:
- Route transitions: fade + 4px y-translate, 200ms
- Card hover: `whileHover={{ y: -2 }}` + shadow
- Progress fills: `animate={{ width }}` with `transition={{ duration: 0.6, ease: 'easeOut' }}`
- Expand/collapse: `AnimatePresence` + height auto
- Skeletons via existing shadcn `Skeleton`

### 11. Custom components (new under `src/components/app/`)

- `ProgressRing.tsx` — SVG ring with animated stroke-dashoffset
- `ChapterCard.tsx`
- `TimelineItem.tsx`
- `MockAnalysisCard.tsx`
- `AnalyticsCard.tsx` (chart wrapper with title + delta)
- `FocusTimerCard.tsx`
- `SubjectBadge.tsx`
- `StatTile.tsx`
- `Fab.tsx` (floating action menu)
- `NavRail.tsx` + `BottomNav.tsx`

### Out of scope

- No changes to data shapes in `src/lib/types.ts`, `progress.ts`, `study.ts`
- No new routes for backend/auth/cloud
- No removal of offline-first behavior

### Technical notes

- Add deps: `@dnd-kit/core`, `@dnd-kit/sortable` (kanban). Framer-motion already present.
- Fonts via Google Fonts `<link rel="stylesheet">` in `__root.tsx` to avoid bundling cost.
- All colors via tokens in `src/styles.css` — no hex literals in components.
- Keep existing route files; refactor their JSX/structure only.
- Bottom nav uses `pb-[env(safe-area-inset-bottom)]` for iOS PWA.
