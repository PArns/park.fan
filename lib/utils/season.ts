/**
 * Whether a seasonal entity counts as running right now. `isCurrentlyInSeason` has three values:
 * `false` is known closed, `null` is „seasonal, nothing else known" and must not hide the ride,
 * and `undefined` is an older payload. So the test is `!== false`, in exactly that shape.
 * See docs/rules/a-ride-out-of-season-is-closed-and-is-not-one-of-the-parks.md.
 */
export const isInSeason = (entity: { isCurrentlyInSeason?: boolean | null }): boolean =>
  entity.isCurrentlyInSeason !== false;
