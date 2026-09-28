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

/**
 * The vertical padding of every band on the homepage, alone.
 *
 * For the bands the homepage borrows rather than owns: `FavoritesSection` and
 * `FeaturedParksSlot` also close every blog and glossary page, where they keep
 * their own tighter padding, so the homepage hands them this one. Without it
 * the phone's park block ran 64 | 32 at one band edge, 32 | 48 at the next and
 * 48 | 64 at the one after, against 64 | 64 everywhere else on the page.
 */
export const STORY_SECTION_Y = 'py-16 sm:py-18';

/** Untinted chapter band. */
export const STORY_SECTION = `px-4 ${STORY_SECTION_Y}`;

/** Tinted chapter band, with the rule that separates it from the one above. */
export const STORY_SECTION_TINTED = `border-border bg-muted/30 border-t px-4 ${STORY_SECTION_Y}`;
