/**
 * The outer chrome every chapter of the homepage story wears, in one place so a Suspense fallback
 * in `home-skeletons.tsx` reserves the same padding as the section it stands in for.
 */

/**
 * The vertical padding of every band on the homepage, alone, for the bands the homepage borrows:
 * `FavoritesSection` and `FeaturedParksSlot` keep a tighter padding on blog and glossary pages, so
 * the homepage hands them this one.
 */
export const STORY_SECTION_Y = 'py-16 sm:py-18';

/** Untinted chapter band. */
export const STORY_SECTION = `px-4 ${STORY_SECTION_Y}`;

/** Untinted chapter band, with the rule that separates it from the one above. */
export const STORY_SECTION_RULED = `border-border border-t px-4 ${STORY_SECTION_Y}`;

/** Tinted chapter band, with the rule that separates it from the one above. */
export const STORY_SECTION_TINTED = `border-border bg-muted/30 border-t px-4 ${STORY_SECTION_Y}`;
