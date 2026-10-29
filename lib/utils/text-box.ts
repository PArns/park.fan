/**
 * A line of text trimmed to cap height and baseline (`text-box`), then padded back out to its line
 * height: the box keeps its height, and capitals and figures sit in its middle instead of high in
 * Geist's line box. For a flex item beside an icon or in a pill; the badges take it through
 * `centreCaps`. Browsers without `text-box` keep the plain line box.
 */
export const CAPS_CENTRED_CLASS =
  'supports-[text-box:trim-both_cap_alphabetic]:[text-box:trim-both_cap_alphabetic] supports-[text-box:trim-both_cap_alphabetic]:py-[calc((1lh_-_1cap)/2)]';
