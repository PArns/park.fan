# Flags & Debug

## Overview

Experimental and debug behavior is controlled via a small set of **build-time feature flags** (`lib/config/features.ts`) and the **`?sim=` nearby-simulation** query param — not via scattered ad-hoc env toggles.

---

## Build-time feature flags (`lib/config/features.ts`)

A small set of **static, build-time** feature toggles live in **`lib/config/features.ts`** — for shipping a feature behind an off-by-default switch that flips per-deploy (not per-session like the Toolbar flags). Each reads a `NEXT_PUBLIC_*` env var and **defaults OFF**; set the var in Vercel project settings (or `.env.local`) to enable. `NEXT_PUBLIC_*` so the value is readable in both Server and Client Components and the unused branch tree-shakes out.

| Flag              | Env var               | Default | Effect                                                                                                                  |
| ----------------- | --------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| `HERO_3D_ENABLED` | `NEXT_PUBLIC_HERO_3D` | off     | On → animated three.js RCT-style 3-D park hero. Off → classic rotating hero photo. (three.js is only imported when on.) |

Accepts `1` / `true` / `on` / `yes` (case-insensitive). Use these for product feature gating; use the `?sim=` param below for per-session geo/debug overrides.

**The trip planner had two switches and now has none.** While it was being
built it carried a Flags-SDK kill switch (`plannerFlag` in `flags.ts`) plus a
build-time `PLANNER_ENABLED`, and the split was forced rather than chosen:
reading a Flags-SDK flag reads headers and cookies, and the header, the footer,
the parks menu and the launcher all render in `app/[locale]/layout.tsx` — the
layout of 3,109 prerendered routes, every one of which would have turned dynamic.
A statically rendered nav can only be gated at build time. Both are gone with the
feature shipped, and with them `flags.ts`, `/.well-known/vercel/flags` and the
`flags` / `@flags-sdk/vercel` packages. Anything gated per request again wants
the same two-tier shape, and the layout half of it still cannot be per-request.

---

## Nearby in-park simulation (`?sim=`)

For developing the homepage **in-park** view (headliner list, live wait times, seasonal handling)
without physically standing in a park, append a `sim` query param to any page:

| Value                | Effect                                                                          |
| -------------------- | ------------------------------------------------------------------------------- |
| `?sim=in_park`       | Simulate standing in the default park (Phantasialand, returns real headliners). |
| `?sim=efteling` etc. | Named preset (`phantasialand`, `efteling`, `europapark`, `disneylandparis`).    |
| `?sim=50.79,6.87`    | Arbitrary `lat,lng` coordinates.                                                |

How it works: the param is **not** fabricated data. `/api/nearby` (the proxy) overrides the request
coordinates with the chosen park, so the **real backend** returns a genuine `in_park` response —
including the real `isHeadliner` / `isSeasonal` / `isCurrentlyInSeason` flags. The client hook
(`lib/hooks/use-nearby-parks.ts`) forwards the param, runs even without GPS, and bypasses the
localStorage cache so simulated results never mix with real ones.

**Production-safe:** enabled on local dev **and Vercel preview deployments**, disabled only on the
real production deployment. The gate lives in `isSimulationEnabled()` (`lib/nearby-simulation.ts`):
since Vercel runs previews with `NODE_ENV='production'`, it keys off `VERCEL_ENV` (`preview` vs
`production`) and falls back to `NODE_ENV` for non-Vercel runs. Presets/resolver live in the same file.

---

## Adding new flags

1. Add a new export to **`lib/config/features.ts`** that reads a `NEXT_PUBLIC_*` env var (default OFF).
2. Document the env var in `.env.example`.
3. Gate the feature in code on the flag constant so the unused branch tree-shakes out.
4. Do **not** add per-session/runtime flag systems — geo/debug overrides go through `?sim=` (see above).

---

## Related

- [.env.example](https://github.com/park-fan/park.fan/blob/main/.env.example) – Lists the `NEXT_PUBLIC_*` flag env vars (no secret values in repo)
