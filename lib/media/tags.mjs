/**
 * The tag vocabulary for the media database.
 *
 * Deliberately a **controlled** vocabulary rather than free text. Tags are how
 * the pool gets sliced once it holds several photos per ride — "the night shot of
 * Taron", "the Halloween dressing of Troy" — and free text rots into `night`,
 * `nacht`, `bei-nacht` and `night-time` within a month, at which point no filter
 * returns the right set. The generator warns on any tag that is not listed here,
 * so adding one is a deliberate edit to this file.
 *
 * Grouped into facets because that is how they are chosen: an image has at most
 * one time of day, but any number of subjects. The admin browser renders one
 * chip group per facet from exactly this structure.
 *
 * Plain JS so the build script and the runtime share one list (see sidecar.mjs).
 */

export const TAG_FACETS = [
  {
    id: 'time',
    label: 'Time of day',
    /** At most one of these should apply to a given image. */
    exclusive: true,
    tags: ['day', 'dusk', 'night', 'dawn', 'blue-hour'],
  },
  {
    id: 'season',
    label: 'Season & event',
    exclusive: false,
    tags: ['halloween', 'christmas', 'winter', 'spring', 'summer', 'autumn'],
  },
  {
    id: 'weather',
    label: 'Weather',
    exclusive: false,
    tags: ['sunny', 'overcast', 'rain', 'snow', 'fog'],
  },
  {
    id: 'subject',
    label: 'Subject',
    exclusive: false,
    tags: [
      'ride',
      'coaster',
      'water-ride',
      'dark-ride',
      'flat-ride',
      'show',
      'performer',
      'queue',
      'station',
      'entrance',
      'theming',
      'signage',
      'crowd',
      'food',
      'shop',
      'park',
      'background',
      'aerial',
      'detail',
    ],
  },
  {
    id: 'setting',
    label: 'Setting',
    exclusive: true,
    tags: ['indoor', 'outdoor'],
  },
  {
    id: 'kind',
    label: 'Kind',
    exclusive: true,
    tags: ['photo', 'diagram', 'illustration', 'render', 'map'],
  },
];

/** Every tag in the vocabulary, flat. */
export const MEDIA_TAGS = TAG_FACETS.flatMap((facet) => facet.tags);

const FACET_BY_TAG = new Map(
  TAG_FACETS.flatMap((facet) => facet.tags.map((tag) => [tag, facet.id]))
);

/** Which facet a tag belongs to, or null when it is outside the vocabulary. */
export function facetOf(tag) {
  return FACET_BY_TAG.get(tag) ?? null;
}

export function isKnownTag(tag) {
  return FACET_BY_TAG.has(tag);
}

/**
 * Report tags that are unknown, plus facets claimed more than once where the
 * facet is exclusive (an image cannot be both `day` and `night`).
 */
export function auditTags(tags) {
  const issues = [];
  const seen = new Map();

  for (const tag of tags) {
    const facet = FACET_BY_TAG.get(tag);
    if (!facet) {
      issues.push(`tags: "${tag}" is not in the vocabulary (lib/media/tags.mjs)`);
      continue;
    }
    const existing = seen.get(facet);
    if (existing) existing.push(tag);
    else seen.set(facet, [tag]);
  }

  for (const facet of TAG_FACETS) {
    const claimed = seen.get(facet.id);
    if (facet.exclusive && claimed && claimed.length > 1) {
      issues.push(`tags: ${facet.label} is exclusive but got ${claimed.join(', ')}`);
    }
  }

  return issues;
}
