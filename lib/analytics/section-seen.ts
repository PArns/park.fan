/**
 * How a park page says how far down it was read. A zero-height mark stands where a chapter begins,
 * whether or not the park has that chapter, and `SectionSeenTracker` sends `section_seen` the first
 * time a mark comes on screen. So the counts read as how far readers got, not as views of the
 * chapter: a park without posts still has the place where they would stand.
 */

/** The places a park page marks, top to bottom, the closed list of the event's `section`. */
const SEEN_SECTIONS = ['main_end', 'nearby', 'blog', 'stats', 'outlook', 'faq', 'end'] as const;

/** One of {@link SEEN_SECTIONS}. */
export type SeenSection = (typeof SEEN_SECTIONS)[number];

/** The attribute that makes an element a mark and names its place. */
export const SECTION_SEEN_ATTRIBUTE = 'data-section-seen';

/** Whether a string read off the DOM is a place the event knows. */
export function isSeenSection(value: string | null): value is SeenSection {
  return (SEEN_SECTIONS as readonly string[]).includes(value ?? '');
}
