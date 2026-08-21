/**
 * Whether a seasonal entity counts as running right now.
 *
 * The API answers this per attraction and per show (`isCurrentlyInSeason`), and
 * the answer has three values, not two. `false` means we know it cannot open —
 * either its operating months are on file and this is not one of them, or the
 * backend's detector recorded the last day it ran. `null` means "seasonal, and
 * nothing else known", which must NOT be read as closed: it would hide a ride
 * nobody has understood yet. `undefined` is an older payload.
 *
 * So the predicate is `!== false`, in that exact shape, and it lives here
 * because two surfaces of the same park page ask it. The card grid hid
 * off-season rides behind its "N außer Saison" toggle while the pre-mount
 * wait-time overview — the only attraction markup a crawler sees without JS —
 * listed them all, right under a counter that leaves them out.
 */
export const isInSeason = (entity: { isCurrentlyInSeason?: boolean | null }): boolean =>
  entity.isCurrentlyInSeason !== false;
