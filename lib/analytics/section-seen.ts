/**
 * How a park page says how far down it was read. A zero-height mark stands where a chapter begins,
 * whether or not the park has that chapter, and `SectionSeenTracker` sends `section_seen` the first
 * time a mark comes on screen. So the counts read as how far readers got, not as views of the
 * chapter: a park without posts still has the place where they would stand. Two marks stand only
 * where their block is, and so do count its views: the planner tile on a region park's pages
 * (`trip_tile`) and the planner band on a post, a listing or `/search` (`trip_band`).
 */

/**
 * The places a park page marks, top to bottom, then the band no park page has: the closed list of
 * the event's `section`. The tile stands above „Heute im Park" or under the calendar's header.
 */
const SEEN_SECTIONS = [
  'trip_tile',
  'main_end',
  'blog',
  'nearby',
  'stats',
  'outlook',
  'faq',
  'end',
  'trip_band',
] as const;

/** One of {@link SEEN_SECTIONS}. */
export type SeenSection = (typeof SEEN_SECTIONS)[number];

/**
 * The marks that stand only where their block is: they count the block's views, and say nothing
 * about how far down a page was read.
 */
export const BLOCK_SEEN_SECTIONS: readonly SeenSection[] = ['trip_tile', 'trip_band'];

/** The attribute that makes an element a mark and names its place. */
export const SECTION_SEEN_ATTRIBUTE = 'data-section-seen';

/** Whether a string read off the DOM is a place the event knows. */
export function isSeenSection(value: string | null): value is SeenSection {
  return (SEEN_SECTIONS as readonly string[]).includes(value ?? '');
}
