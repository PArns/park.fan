import type { MediaLicense, MediaQuery, MediaRole } from './types';

/**
 * The media filters of a query string, read the same way by the public API and the admin browser.
 * `park=` and `ride=` with an empty value mean "has none": the park-level tier, images of a park
 * but of no particular ride, is a category and not missing data.
 */
export function parseMediaSearchParams(params: URLSearchParams): MediaQuery {
  return {
    q: params.get('q') ?? undefined,
    park: params.has('park') ? params.get('park') || null : undefined,
    ride: params.has('ride') ? params.get('ride') || null : undefined,
    collection: params.get('collection') ?? undefined,
    tags: params.getAll('tag'),
    role: (params.get('role') as MediaRole) || undefined,
    license: (params.get('license') as MediaLicense) || undefined,
    unlicensedOnly: params.get('unlicensed') === '1',
    unassignedOnly: params.get('unassigned') === '1',
  };
}
