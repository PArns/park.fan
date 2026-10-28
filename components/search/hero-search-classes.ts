/**
 * Class strings of the hero search's field and list, in a module that imports nothing, so the
 * header's search trigger can draw the phone's hero field without pulling the hero into every
 * page's chrome. The frame they sit on is `HeroSearchFrame` (`hero-search-field.tsx`).
 */

/**
 * The field's height: 48 px on a phone, 56 from `md`. The text stays 16 px on a phone, below which
 * iOS Safari zooms into a focused field, so only the padding and the icon shrink there. The frame's
 * slot under the field takes the same class.
 */
export const HERO_SEARCH_FIELD_HEIGHT_CLASS = 'h-12 md:h-14';

/**
 * The hero field's text box: no fill, no border and no blur of its own, since it sits on
 * `HeroSearchFrame`, the glass it shares with its list. The shell, the desktop panel and the
 * phone's palette trigger all draw it.
 */
export const HERO_SEARCH_INPUT_CLASS = `placeholder:text-foreground/40 dark:placeholder:text-muted-foreground/50 ${HERO_SEARCH_FIELD_HEIGHT_CLASS} w-full bg-transparent pr-4 pl-10 text-base outline-none md:pl-12`;

/** The search icon at the field's left edge, in the padding {@link HERO_SEARCH_INPUT_CLASS} leaves. */
export const HERO_SEARCH_ICON_CLASS =
  'text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 md:left-4 md:h-5 md:w-5';

/**
 * The field's row, painted over the frame (`z-40`), which starts at the field's top edge. Put on the
 * element the frame is a later sibling of.
 */
export const HERO_SEARCH_FIELD_ROW_CLASS = `relative z-[41] ${HERO_SEARCH_FIELD_HEIGHT_CLASS}`;

/** The hairline between the field and its list, on the box that holds the list. */
export const HERO_SEARCH_LIST_BOX_CLASS = 'border-foreground/10 border-t';

/**
 * A row of the hero's phone list: a fixed 48 px, the 36 px thumbnail and two lines (the name, then
 * the status and wait pills and the distance), so the reserved height holds at every phone width.
 */
export const HERO_PHONE_ROW_CLASS = 'h-12';

/** The phone list's rows box: inset like cmdk's groups, under the heading row. */
export const HERO_PHONE_LIST_CLASS = 'px-1.5 pb-1';

/** The box of the phone's two posts: a hairline above, the rows inset like the parks. */
export const HERO_PHONE_READING_CLASS = 'border-foreground/10 border-t px-1.5 py-1';

/** A post row on the phone: the kicker over a one-line title, a fixed 44 px. */
export const HERO_PHONE_READING_ROW_CLASS = 'h-11';
