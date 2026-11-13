/**
 * Entries the API lists as parks that are events: a park's seasonal show with gates of its own,
 * such as Traumatica, Europa-Park's Halloween. Neither the geo structure nor the park payload has a
 * kind or category that tells them apart (the API's `parkType` is theme or water park, and not
 * public), so they are named here, by the API's slug. A surface that offers parks to plan a day at
 * leaves them out: their run is a few weeks, and a check for published hours alone lets them back
 * every autumn.
 */
export const EVENT_PARK_SLUGS: ReadonlySet<string> = new Set(['traumatica']);

/** Whether a park slug names an event rather than a park. */
export function isEventPark(slug: string): boolean {
  return EVENT_PARK_SLUGS.has(slug);
}
