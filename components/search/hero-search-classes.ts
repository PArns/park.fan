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
 * element the frame is a later sibling of. It carries the field's focus ring, 2 px inside the row
 * and round at the frame's corners; the frame's border tint alone is no indicator. The row of a
 * text box draws it on `focus-within` ({@link HERO_SEARCH_INPUT_ROW_CLASS}), the phone's trigger on
 * `focus-visible`, so the focus Radix hands back to it when a tap closes the palette draws none.
 */
export const HERO_SEARCH_FIELD_ROW_CLASS = `relative z-[41] ${HERO_SEARCH_FIELD_HEIGHT_CLASS} rounded-t-xl ring-inset ring-primary-ink`;

/** {@link HERO_SEARCH_FIELD_ROW_CLASS} around a text box: the ring while the box has focus. */
export const HERO_SEARCH_INPUT_ROW_CLASS = `${HERO_SEARCH_FIELD_ROW_CLASS} focus-within:ring-2`;

/** The hairline between the field and its list, on the box that holds the list. */
export const HERO_SEARCH_LIST_BOX_CLASS = 'border-foreground/10 border-t';

/**
 * A row of the hero's phone list: a fixed 48 px, the 36 px thumbnail and two lines (the name, then
 * the status and wait pills and the distance), so the reserved height holds at every phone width.
 */
export const HERO_PHONE_ROW_CLASS = 'h-12';

/**
 * The phone list's rows box: inset sideways like cmdk's groups, under the heading row. No padding
 * above or below: the heading row's 44 px tap target took it.
 */
export const HERO_PHONE_LIST_CLASS = 'px-1.5';

/** The box of the phone's two posts: a hairline above, the rows inset like the parks. */
export const HERO_PHONE_READING_CLASS = 'border-foreground/10 border-t px-1.5';

/** The box of the phone's park block (`HeroParkActions`) in place of rows and posts. */
export const HERO_PHONE_PARK_CLASS =
  'border-foreground/10 flex flex-col justify-center border-t p-3';

/** A post row on the phone: the kicker over a one-line title, a fixed 44 px. */
export const HERO_PHONE_READING_ROW_CLASS = 'h-11';

/**
 * The hero list's group headings, read out but not drawn: the heading row above the listbox names
 * the parks, and the posts carry their kickers. Each group still has its own name, so the posts do
 * not read as part of „Beliebte Parks".
 */
export const HERO_GROUP_HEADING_HIDDEN_CLASS = '[&_[cmdk-group-heading]]:sr-only';

/**
 * The small grey text of the search lists: a heading, a place, a distance, a teaser. 70 % of the
 * foreground clears 4.5 : 1 on the hero's glass over every hero photo, in both themes
 * (docs/features/homepage-hero.md); the 35–60 % it replaced did not. Small text in the brand
 * colour takes `text-primary-ink` for the same reason.
 */
export const SEARCH_SECONDARY_TEXT_CLASS = 'text-foreground/70';

/** The hint under the hero's desktop list („Tippe los, …"), in the shell and in the panel alike. */
export const HERO_SEARCH_HINT_CLASS = `border-border/40 bg-muted/30 ${SEARCH_SECONDARY_TEXT_CLASS} shrink-0 border-t px-4 py-2.5 text-xs`;
