import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Terminal } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type Mode = "signin" | "signup";

// Username-only auth: synthesize a stable email so Supabase Auth (which
// requires email/password) can store the credential without ever exposing
// a real email to the user.
const USERNAME_DOMAIN = "scholar.local";
const usernameToEmail = (u: string) => `${u.toLowerCase()}@${USERNAME_DOMAIN}`;

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already signed in, bounce to dashboard.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  const validate = (): string | null => {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
      return "Username must be 3–20 characters (letters, numbers, underscore).";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (mode === "signup" && password !== confirm) return "Passwords do not match.";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setLoading(true);
    try {
      const email = usernameToEmail(username.trim());
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: username.trim().toLowerCase() },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) {
          const msg = /already|registered|exists/i.test(error.message)
            ? "Username already taken."
            : error.message;
          toast.error(msg);
          return;
        }
        toast.success("Account created. Initializing session…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error("Invalid credentials.");
          return;
        }
        toast.success("Session initialized.");
      }
      navigate({ to: "/", replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient grid + glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-40 blur-[140px]"
        style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 60%)" }}
      />

      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-12">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg border border-primary/40 bg-zinc-950 font-mono text-xs font-bold text-primary shadow-[0_0_24px_-4px_rgba(34,211,238,0.6)]">
            JS
          </div>
          <div className="text-center">
            <h1 className="font-display text-xl font-semibold tracking-tight">
              JEE Scholar Planner
            </h1>
            <p className="mt-1 flex items-center justify-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Terminal className="h-3 w-3" />
              {mode === "signin" ? "auth // session" : "auth // provision"}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full rounded-xl border border-border bg-card/70 p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur-sm">
          {/* Tabs */}
          <div className="relative mb-6 grid grid-cols-2 gap-1 rounded-lg border border-border bg-zinc-950/60 p-1">
            <span
              aria-hidden
              className={cn(
                "absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-md bg-zinc-800/80 ring-1 ring-white/5 transition-transform duration-300 ease-out",
                mode === "signin" ? "translate-x-1" : "translate-x-[calc(100%+0.25rem)]",
              )}
            />
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "relative z-10 rounded-md py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
                  mode === m ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "signin" ? "Sign in" : "Create"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Username"
              value={username}
              onChange={setUsername}
              autoComplete="username"
              placeholder="aspirant_2027"
            />
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              type={showPw ? "text" : "password"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder="••••••••"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            {mode === "signup" && (
              <Field
                label="Confirm password"
                value={confirm}
                onChange={setConfirm}
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "group relative mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-all",
                "shadow-[0_0_0_1px_rgba(34,211,238,0.3),0_10px_30px_-12px_rgba(34,211,238,0.6)]",
                "hover:shadow-[0_0_0_1px_rgba(34,211,238,0.5),0_14px_36px_-12px_rgba(34,211,238,0.75)]",
                "disabled:cursor-not-allowed disabled:opacity-70",
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : mode === "signin" ? (
                "Initialize Session"
              ) : (
                "Access Hub"
              )}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <span>
              {mode === "signin" ? "No account yet?" : "Already have an account?"}
            </span>
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-mono uppercase tracking-wider text-primary transition-colors hover:text-primary/80"
            >
              {mode === "signin" ? "Provision" : "Sign in"}
            </button>
          </div>
        </div>

        <p className="mt-6 max-w-xs text-center text-[11px] leading-relaxed text-muted-foreground/70">
          Credentials are stored on Lovable Cloud — never persisted locally.
        </p>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  trailing,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <div
        className={cn(
          "group relative flex h-10 items-center rounded-md border border-border bg-zinc-950/60",
          "transition-all focus-within:border-primary/60",
          "focus-within:shadow-[0_0_0_3px_rgba(34,211,238,0.12)]",
        )}
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          spellCheck={false}
          className="h-full w-full rounded-md bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        />
        {trailing && <div className="pr-2.5">{trailing}</div>}
      </div>
    </label>
  );
}