# Flags & Debug (Vercel Toolbar)

## Overview

Experimental and debug behavior is controlled via **Vercel Toolbar** and **Flags**, not via custom env toggles. This keeps production-safe feature toggles and avoids scattering `NEXT_PUBLIC_*` switches across the app.

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

**Production-safe:** the param is gated behind `NODE_ENV !== 'production'` in `app/api/nearby/route.ts`
and is ignored on production deployments. Presets/resolver live in `lib/nearby-simulation.ts`.

---

## Vercel Toolbar

On Vercel deployments (preview and production), the [Vercel Toolbar](https://vercel.com/docs/workflow-collaboration/vercel-toolbar) can be enabled. It provides:

- **Flags Explorer** – Override flag values (e.g. debug geo mode) for the current session.
- No need to redeploy to test different flag states.

To use the toolbar locally, link the project (`vercel link`), then pull env (e.g. `FLAGS_SECRET` for Flags Explorer) with `vercel env pull` if required. Do **not** commit secrets; they stay in `.env.local` or Vercel.

---

## Debug geo mode

**`flags.ts`** defines a single flag used for geolocation debugging:

- **Key:** `debug-geo-mode`
- **Options:**
  - **`real`** – Use browser/IP geolocation (default).
  - **`near`** – Simulate position near Phantasialand (~2 km) so “Nearby Parks” returns Phantasialand-area parks.
  - **`in`** – Simulate position inside Phantasialand (e.g. for “in park” UI).

The **decide** function defaults to `real`. Overrides are applied via the Toolbar’s Flags Explorer (or server-side when the flag is evaluated).

**Where it’s used:** `lib/debug-geo.ts`, and the API route **`/api/debug-geo-mode`** which returns the current mode for the request (used by the client or API proxy to pass through to the backend if needed). Nearby-parks and hero logic may use this to show “Near Phantasialand” or “In Phantasialand” for testing.

---

## Adding new flags

1. Define the flag in **`flags.ts`** using `flag({ key, description, options, decide })`.
2. Expose it via **`app/.well-known/vercel/flags/route.ts`** if the Toolbar needs to discover it.
3. Use the flag in code (server or client) and override via Toolbar for testing.
4. Do **not** store secrets in flag values; use Vercel env (e.g. `FLAGS_SECRET`) for the Toolbar’s own auth.

---

## Related

- [Troubleshooting – Debug Geo Mode](../troubleshooting/common-issues.md#debug-geo-mode-vercel-toolbar)
- [.env.example](https://github.com/park-fan/park.fan/blob/main/.env.example) – Mentions `FLAGS_SECRET` for Flags Explorer (no secret values in repo)
