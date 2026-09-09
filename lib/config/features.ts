/**
 * Feature flags (build-time config).
 *
 * Each flag defaults OFF and is flipped per-deploy by setting the matching
 * `NEXT_PUBLIC_*` env var (in Vercel project settings or `.env.local`) — no code
 * change required. They're `NEXT_PUBLIC_*` so the same value is available in both
 * Server and Client Components (Next inlines it at build time, so the unused
 * branch can also be tree-shaken out of the bundle).
 *
 * `GAME_ENABLED` is the one exception to "defaults OFF" and says at its own
 * declaration why: it has to be on in dev and off in production, which is not a
 * single default.
 */

/** Truthy env values: `1`, `true`, `on`, `yes` (case-insensitive). */
function envFlag(value: string | undefined): boolean {
  return value != null && ['1', 'true', 'on', 'yes'].includes(value.trim().toLowerCase());
}

/**
 * Animated three.js RollerCoaster-Tycoon-style 3-D park hero on the homepage.
 *
 * Default **OFF** → the classic rotating hero photo is shown instead. Enable it
 * for a deploy with `NEXT_PUBLIC_HERO_3D=on`. When off, the three.js runtime is
 * never imported (the scene component is only rendered behind this flag).
 */
export const HERO_3D_ENABLED = envFlag(process.env.NEXT_PUBLIC_HERO_3D);

/**
 * park.fan Coaster: whether `/game` exists at all, and whether the header links it.
 *
 * This is the one flag in this file that is **not** simply "default OFF", and the asymmetry is
 * deliberate: a kill switch that fails open is not a kill switch. It resolves in three steps.
 *
 * 1. `NEXT_PUBLIC_GAME` set → that answer, either way. `on` ships it, `off` hides it even in dev,
 *    which is how the disabled path gets tested.
 * 2. Unset and `NODE_ENV !== 'production'` → **on**. That is `next dev`: the route has to stay
 *    loadable at all times or every builder agent, every `game-shot.mjs` frame and the whole
 *    verification harness go dark at once. Next inlines `NODE_ENV` into the client bundle itself,
 *    so this branch needs no environment variable to be configured anywhere.
 * 3. Unset and a **positively identified** Vercel preview (`NEXT_PUBLIC_VERCEL_ENV === 'preview'`)
 *    → on, so each pull request's deploy can be clicked through. Anything else — production, or an
 *    environment that did not identify itself — is **off**.
 *
 * Step 3 is written as an allowlist rather than as `!== 'production'` for exactly one reason: if
 * `NEXT_PUBLIC_VERCEL_ENV` is ever absent on a production build, `!== 'production'` is `true` and
 * the switch fails open on the one deploy that matters. Naming the environments that may have it
 * fails closed instead.
 *
 * That variable is documented — Vercel defines it for Next.js projects as `production`, `preview`
 * or `development` (vercel.com/docs/environment-variables/framework-environment-variables) — but
 * it arrives only while the project has "Automatically expose System Environment Variables" on,
 * and this session could not read the preview to confirm it (Deployment Protection answers 302,
 * and the Vercel MCP 403). So the practical note, because the failure is silent and looks like a
 * missing feature: **if a preview deploy comes up with no Coaster link and `/game` at 404, that
 * setting is off** — set `NEXT_PUBLIC_GAME=on` for the Preview environment in project settings and
 * it is fixed without a code change. Failing that way round is the design working, not breaking.
 *
 * With it off, `app/game/page.tsx` answers 404 and `components/layout/header.tsx` renders no link
 * in either the desktop nav or the burger. Both branches are build-time constants, so the game's
 * entry point is not merely hidden — nothing references it and the link is not in the HTML.
 *
 * Why it exists: `docs/game/STATUS.json` is the game's own scoreboard, and at the time of writing
 * it records two of twenty-four modules past their gate and no guest able to ride a coaster. A
 * link on every page of park.fan in six languages is not the right first audience for that. The
 * route is already `robots: { index: false }` and in no sitemap; this is the other half.
 * Flip it — and the two lines named in `app/game/layout.tsx` — when `docs/game/FINAL_GATE.md` has
 * actually been run.
 */
export const GAME_ENABLED =
  process.env.NEXT_PUBLIC_GAME != null
    ? envFlag(process.env.NEXT_PUBLIC_GAME)
    : process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview';

/**
 * park.fan Coaster: blueprint sharing through `app/api/game/**`. Default **OFF** — the game is
 * fully playable client-side (IndexedDB + JSON export); with the flag off the route handlers
 * answer 404 and the HUD hides the share button. Enable with `NEXT_PUBLIC_GAME_SHARING=on`.
 *
 * Has no consumer yet: `app/api/game/**` does not exist, so this flag currently describes an
 * intention rather than a switch. Recorded here rather than deleted because the docstring is the
 * spec the routes will be written against.
 */
export const GAME_SHARING_ENABLED = envFlag(process.env.NEXT_PUBLIC_GAME_SHARING);

/**
 * park.fan Coaster: seed a park from live park.fan data (park layouts, ride names, wait times)
 * through a mock-first adapter. Default **OFF**; never blocks boot. `NEXT_PUBLIC_GAME_LIVE_SEED=on`.
 *
 * Has no consumer yet either — same note as above.
 */
export const GAME_LIVE_SEED_ENABLED = envFlag(process.env.NEXT_PUBLIC_GAME_LIVE_SEED);
