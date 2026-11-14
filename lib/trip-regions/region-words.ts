/**
 * The words for an API code that a region may say its own way: `no_school_break` is "No US school
 * holidays" in Orlando and would name another country's breaks elsewhere. The region's own copy
 * (`tripRegion…` in a Client Component, `tripRegions.<slug>…` on the server) wins where it has the
 * key; every other code keeps the shared words. Client-safe.
 */

/** What a code lookup needs of a translator, on the server or in the browser. */
export interface CodeWords {
  (key: string, values?: Record<string, string | number | Date>): string;
  has(key: string): boolean;
}

/** The region's words for `key` where it has them, else the shared ones. */
export function regionOrShared(
  own: CodeWords,
  shared: CodeWords,
  key: string,
  values?: Record<string, string | number | Date>
): string {
  return own.has(key) ? own(key, values) : shared(key, values);
}
