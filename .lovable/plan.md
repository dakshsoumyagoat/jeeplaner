## What I found

I loaded every route in the preview — Today, Syllabus, Planner, Mocks all render correctly. The app is functional. The only red entry in the browser console is:

```
Failed to load resource: 401 — /manifest.webmanifest
Manifest fetch ... failed, code 401
```

This is the only real "error" surfaced by the app. It happens because the Lovable preview URL is auth-gated (`?__lovable_token=...`), so the browser's manifest fetch — which strips the query string — gets rejected by the proxy. It's harmless in the published build, but it looks like a broken app in DevTools and triggers the "visible error" you saw.

The other console noise (`postMessage` warnings from `cdn.gpteng.co/lovable.js`) comes from the Lovable editor harness, not your code. Nothing to fix there.

## Plan

1. **Silence the manifest 401 in the preview iframe.** Make the `<link rel="manifest">` tag conditional in `src/routes/__root.tsx` so it's only emitted when the app is NOT running inside the Lovable preview iframe. Installable PWA behavior on the published site is preserved; the preview console goes clean.

   Approach: detect `window.self !== window.top` (or a `lovableproject.com` hostname) on the client and inject the manifest link via a small client-only effect rather than statically in `head().links`.

2. **Quick health sweep** — read `src/routes/syllabus.tsx`, `planner.tsx`, `mocks.tsx`, `src/components/timetable/SchoolTimetable.tsx` and fix anything obviously broken (unreachable handlers, stale `usePersisted` keys, missing imports). I won't change behavior or design — only fix bugs.

3. **Verify** by re-loading each route in the browser tool and re-reading the console; the manifest 401 should be gone and no new errors should appear.

## Out of scope

- No design changes.
- No new features (still no real service worker — manifest-only stays as-is).
- No backend / Lovable Cloud changes.

If the blank screen you saw is actually something different (a specific click, the published site, or after install-to-home-screen), tell me which and I'll retarget — but based on what I can observe, the manifest 401 is the only real signal.