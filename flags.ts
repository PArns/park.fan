import { flag } from 'flags/next';
import { vercelAdapter } from '@flags-sdk/vercel';

/**
 * Feature flags, as functions.
 *
 * Declared here rather than read as string keys at the call sites, which is the
 * Flags SDK's whole point: a flag that is renamed or archived becomes a compile
 * error instead of a silently `false` feature.
 *
 * **Every flag in this file needs a `defaultValue`.** A flag that is archived on
 * Vercel, or that exists in code before it exists in the dashboard, evaluates to
 * `defaultValue` — and *without* one, evaluation throws. On a site where the
 * layout renders on 3,109 prerendered routes, a throw is not a degraded feature,
 * it is a blank page.
 */

/**
 * The trip planner: the floating launcher, its flyout, and the two controls that
 * put something into a plan.
 *
 * `defaultValue: true` because that is what the site serves today. The skill's
 * rule for an existing flag is "the value to serve when the flag is archived or
 * evaluation fails — usually what production serves today", and the planner is
 * shipped and visible. So this is a kill switch: turning it off in the dashboard
 * removes the feature, and every failure mode leaves the site exactly as it is
 * rather than silently deleting a feature because a token expired.
 *
 * NOT read in `app/[locale]/layout.tsx`, where the launcher is mounted. Reading
 * a flag reads headers and cookies, which would make that layout dynamic — and
 * it is the layout of 3,109 statically prerendered routes. Measured, not
 * assumed: the prerender manifest is compared before and after, the way
 * `docs/architecture/caching-strategy.md` requires for anything that touches
 * render mode. The two entry points below are on routes that are already
 * `force-dynamic`, so gating them costs nothing.
 */
export const plannerFlag = flag<boolean>({
  key: 'planner',
  description: 'The trip planner — launcher, day grid and the controls that fill a plan',
  defaultValue: true,
  adapter: vercelAdapter,
});
