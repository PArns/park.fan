/**
 * The gap above a chapter, below `sm` and from `sm` up.
 *
 * `ChapterPanel`, `PageSection` and `AttractionHistoryPanel` open with `mt-10 max-sm:mt-6`
 * (PAR-433). The park page's own chapters sat at a flat `mt-8` and kept 32 px on a phone, so
 * a phone saw two rhythms on one page. `CHAPTER_GAP_COMPACT` is the 32 px variant for those
 * chapters: 24 px below `sm` like the other three, 32 px from `sm` as before.
 *
 * `max-sm:` goes on top of the desktop value rather than replacing it, so a `className` margin
 * still wins from `sm` up (see the spacing note in `ChapterHeading`). A skeleton uses the same
 * constant as the section it stands in for, so both change together
 * (`docs/rules/a-streamed-section-owes-the-page-its-height.md`).
 */
export const CHAPTER_GAP = 'mt-10 max-sm:mt-6';
export const CHAPTER_GAP_COMPACT = 'mt-8 max-sm:mt-6';
