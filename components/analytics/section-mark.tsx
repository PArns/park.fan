import { SECTION_SEEN_ATTRIBUTE, type SeenSection } from '@/lib/analytics/section-seen';

/**
 * A zero-height mark where a chapter of a park page begins, for `SectionSeenTracker`. It has no
 * box of its own, so the margins of the chapters on either side collapse through it as before.
 */
export function SectionMark({ section }: { section: SeenSection }) {
  return <div aria-hidden="true" {...{ [SECTION_SEEN_ATTRIBUTE]: section }} />;
}
