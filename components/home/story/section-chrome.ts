/**
 * The outer chrome every chapter of the homepage story wears.
 *
 * It exists because a Suspense fallback has to reserve the height its content
 * takes, and the first version of this rebuild broke that the moment two
 * sections were re-headed: `GlobalStatsSection` and `LiveActivitySection` grew a
 * `ChapterHeading` tile and went from `py-12` to `py-16 sm:py-18`, while
 * `home-skeletons.tsx` — a different file nobody had to touch to make that
 * change compile — kept reserving the old geometry, ~135 px short per boundary
 * and more on a phone where the German title wraps.
 *
 * Two constants and a shared heading component do not make that impossible, but
 * they make it one edit instead of two files that only meet at runtime.
 */

/** Untinted chapter band. */
export const STORY_SECTION = 'px-4 py-16 sm:py-18';

/** Tinted chapter band, with the rule that separates it from the one above. */
export const STORY_SECTION_TINTED = 'border-border bg-muted/30 border-t px-4 py-16 sm:py-18';

/** Untinted band that still wants the separating rule. */
export const STORY_SECTION_RULED = 'border-border border-t px-4 py-16 sm:py-18';
