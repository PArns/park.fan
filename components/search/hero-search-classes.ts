/**
 * Class strings of the hero search's field and list, in a module that imports nothing, so the
 * header's search trigger can draw the phone's hero field without pulling the hero into every
 * page's chrome. The frame they sit on is `HeroSearchFrame` (`hero-search-field.tsx`).
 */

/**
 * The hero field's text box: no fill, no border and no blur of its own, since it sits on
 * `HeroSearchFrame`, the glass it shares with its list. The shell, the desktop panel and the
 * phone's palette trigger all draw it.
 */
export const HERO_SEARCH_INPUT_CLASS =
  'placeholder:text-foreground/40 dark:placeholder:text-muted-foreground/50 h-14 w-full bg-transparent pr-4 pl-12 text-base outline-none';

/** The search icon at the field's left edge, in the padding {@link HERO_SEARCH_INPUT_CLASS} leaves. */
export const HERO_SEARCH_ICON_CLASS =
  'text-muted-foreground pointer-events-none absolute top-1/2 left-4 z-10 h-5 w-5 -translate-y-1/2';

/**
 * The field's row, painted over the frame (`z-40`), which starts at the field's top edge. Put on the
 * element the frame is a later sibling of.
 */
export const HERO_SEARCH_FIELD_ROW_CLASS = 'relative z-[41] h-14';

/** The hairline between the field and its list, on the box that holds the list. */
export const HERO_SEARCH_LIST_BOX_CLASS = 'border-foreground/10 border-t';

/**
 * The box of a row in the hero's phone list, a fixed 52 px whatever the thumbnail (36 px, 44 px from
 * `sm`), so the reserved height holds at every phone width.
 */
export const HERO_PHONE_ROW_CLASS = 'h-13 py-0 sm:py-0';

/** The phone list's own box: rows inset like cmdk's groups, under the heading row. */
export const HERO_PHONE_LIST_CLASS = 'px-1.5 pt-0 pb-1.5';
