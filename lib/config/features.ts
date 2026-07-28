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
 * Kill switch: ON unless the env var explicitly says otherwise
 * (`0` / `false` / `off` / `no`, case-insensitive).
 *
 * The counterpart to `envFlag` for things that must be live by default — a
 * third-party badge we agreed to display, not an experiment we're rolling out.
 */
function envKillSwitch(value: string | undefined): boolean {
  return value == null || !['0', 'false', 'off', 'no'].includes(value.trim().toLowerCase());
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
 * StartupBar promo bar (startupbar.co) — a 36 px bar pinned above the page.
 *
 * Default **ON**, unlike the flags above: it's a listing we applied for, and
 * startupbar.co verifies the script is live on park.fan. Take it down for a
 * deploy with `NEXT_PUBLIC_STARTUPBAR=off` — no code change, the loader script
 * then isn't rendered at all. To remove it for good, delete
 * `components/common/startup-bar.tsx` and its usage in `app/[locale]/layout.tsx`.
 */
export const STARTUPBAR_ENABLED = envKillSwitch(process.env.NEXT_PUBLIC_STARTUPBAR);
