/**
 * Feature flags (build-time config).
 *
 * Each flag defaults OFF and is flipped per-deploy by setting the matching
 * `NEXT_PUBLIC_*` env var (in Vercel project settings or `.env.local`) — no code
 * change required. They're `NEXT_PUBLIC_*` so the same value is available in both
 * Server and Client Components (Next inlines it at build time, so the unused
 * branch can also be tree-shaken out of the bundle).
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
 * The trip planner in the LAYOUT CHROME: the header's nav entry (desktop and
 * the burger sheet), the footer link, the parks menu's call to action and the
 * floating launcher.
 *
 * A second switch beside `plannerFlag` in `flags.ts`, and the split is forced
 * rather than chosen. Reading a Flags-SDK flag reads headers and cookies, which
 * makes the reading segment dynamic — and all four of these render in
 * `app/[locale]/layout.tsx`, the layout of 3,109 statically prerendered routes.
 * So the chrome cannot follow a per-request flag at all without giving up the
 * prerender; a build-time flag is what a statically rendered nav can be gated
 * on. The two are ordered rather than parallel: this one says whether a deploy
 * ships the planner, `plannerFlag` is the live kill switch on top of it, and the
 * dynamic entry points require BOTH so that turning this off cannot leave a page
 * reachable with no way to it.
 *
 * Default **ON**, unlike every other flag in this file, for the same reason
 * `plannerFlag` carries `defaultValue: true`: it gates something the site
 * already serves, so an unset variable has to leave the site as it is rather
 * than delete a shipped feature. Turn it off for a deploy with
 * `NEXT_PUBLIC_PLANNER=off`.
 */
export const PLANNER_ENABLED = !['0', 'false', 'off', 'no'].includes(
  (process.env.NEXT_PUBLIC_PLANNER ?? '').trim().toLowerCase()
);
