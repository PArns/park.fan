/**
 * Parky's elements on the page that hand him a question, and what each one said: the closed list
 * behind `parky_element_seen` and `parky_element_clicked`. Where on the site an element stood is
 * the event's page type, so a walk-on stamp on a park page's card and one on a ride page share a
 * kind.
 */
export const PARKY_ELEMENT_KINDS = {
  stamp: ['walk_on', 'below_typical'],
  tip: ['good', 'meh', 'bad'],
  callout: ['post'],
  empty: ['not_found', 'error', 'favorites', 'search'],
} as const;

/** One of {@link PARKY_ELEMENT_KINDS}' keys. */
export type ParkyElementName = keyof typeof PARKY_ELEMENT_KINDS;

/** An element and what it said, as both events carry it. */
export type ParkyElement = {
  [Name in ParkyElementName]: { element: Name; kind: (typeof PARKY_ELEMENT_KINDS)[Name][number] };
}[ParkyElementName];

/** What an empty state's „Frag Parky“ stands on: the 404, the error page, no favourites, no hits. */
export type ParkyEmptyKind = (typeof PARKY_ELEMENT_KINDS)['empty'][number];
