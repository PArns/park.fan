import type { ReactNode } from 'react';
import { resolveAttraction, resolvePark } from '@/lib/blog/park-resolver';
import { BlogAttractionLink } from './blog-attraction-link';

/** `/<locale>/parks/<continent>/<country>/<city>/<park>/<ride>`: five segments after `parks`. */
const RIDE_HREF = /^\/[a-z]{2}\/parks\/([^/?#]+)\/([^/?#]+)\/([^/?#]+)\/([^/?#]+)\/([^/?#]+)\/?$/;

const CHIP_ONLY = new Set(['chip']);

/**
 * A ride link authored in a glossary definition, rendered inside a blog post: the label plus the
 * live wait-time (or status) chip a `ref:` link carries.
 *
 * Definitions hold finished geo paths where `ref:` links hold a slug key, so the path is split
 * here and resolved the way `ref:` links are. A park link (four segments), an unknown ride or a
 * failed lookup shows `fallback`, the plain anchor, instead of throwing.
 */
export async function BlogGlossaryRideLink({
  label,
  href,
  fallback,
}: {
  label: string;
  href: string;
  fallback: ReactNode;
}) {
  const m = RIDE_HREF.exec(href);
  if (!m) return fallback;
  const [, continent, country, city, parkSlug, rideSlug] = m;
  const geoPath = `${continent}/${country}/${city}`;
  const park = await resolvePark(parkSlug, geoPath);
  const attraction = park ? await resolveAttraction(parkSlug, rideSlug, geoPath) : null;
  if (!park || !attraction?.detail) return fallback;
  return (
    <BlogAttractionLink
      attraction={attraction}
      park={park}
      fallbackLabel={label}
      refKey={`${parkSlug}/${rideSlug}`}
      options={CHIP_ONLY}
    >
      {label}
    </BlogAttractionLink>
  );
}
