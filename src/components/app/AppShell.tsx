import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, BookOpen, CalendarDays, Timer, BarChart3, Plus, Play, ListPlus, ClipboardList, Clock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Today", icon: Home },
  { to: "/syllabus", label: "Syllabus", icon: BookOpen },
  { to: "/planner", label: "Planner", icon: CalendarDays },
  { to: "/study", label: "Focus", icon: Timer },
  { to: "/mocks", label: "Insights", icon: BarChart3 },
] as const;

export function AppShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile top bar (compact) */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-display text-base font-semibold tracking-tight">
              JEE Scholar
            </span>
          </Link>
          <Link
            to="/schedule"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="School schedule"
          >
            <Clock className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Desktop compact navigation rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col items-center border-r border-border bg-background py-4 md:flex">
        <Link to="/" className="mb-6 grid place-items-center" aria-label="Home">
          <Logo />
        </Link>
        <nav className="flex flex-1 flex-col items-center gap-1">
          {NAV.map((n) => {
            const active = isActive(path, n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                title={n.label}
                className={cn(
                  "group relative flex w-14 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-all",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <Icon className={cn("h-5 w-5", active && "text-primary")} />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <Link
          to="/schedule"
          title="School schedule"
          className={cn(
            "flex w-14 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
            isActive(path, "/schedule") && "bg-muted text-foreground",
          )}
        >
          <Clock className="h-5 w-5" />
          <span>School</span>
        </Link>
      </aside>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 md:pb-12 md:pl-[88px] md:pr-6">
        <div className="animate-float-in">
          <Outlet />
        </div>
      </main>

      <Fab currentPath={path} />

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {NAV.map((n) => {
            const active = isActive(path, n.to);
            const Icon = n.icon;
            return (
              <li key={n.to}>
                <Link
                  to={n.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-xl transition-colors",
                      active && "bg-primary/10",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function isActive(path: string, to: string) {
  if (to === "/") return path === "/";
  return path === to || path.startsWith(to + "/");
}

function Logo() {
  return (
    <div className="grid h-9 w-9 place-items-center rounded-lg border border-primary/40 bg-zinc-950 font-mono text-[11px] font-bold text-primary shadow-[0_0_18px_-2px_rgba(34,211,238,0.5)]">
      JS
    </div>
  );
}

function Fab({ currentPath }: { currentPath: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  // Hide on the focus screen to keep timer distraction-free
  if (currentPath === "/study") return null;

  const actions = [
    { label: "Start session", icon: Play, to: "/study" },
    { label: "Add task", icon: ListPlus, to: "/planner" },
    { label: "Add mock test", icon: ClipboardList, to: "/mocks" },
  ];

  return (
    <div
      className="fixed right-4 z-50 flex flex-col items-end gap-2 md:right-6"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 76px)" }}
    >
      {open && (
        <div className="flex flex-col items-end gap-2 animate-float-in">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.to}
                onClick={() => go(a.to)}
                className="flex items-center gap-2 rounded-full border border-border bg-popover px-3 py-2 text-xs font-medium text-foreground shadow-lg shadow-black/30 transition-transform hover:scale-[1.02]"
              >
                <Icon className="h-4 w-4 text-primary" />
                {a.label}
              </button>
            );
          })}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(79,140,255,0.6)] transition-transform active:scale-95",
          open && "rotate-45",
        )}
        aria-label="Quick actions"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}