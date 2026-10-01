import type { ReactNode } from 'react';
import { parseGlossaryRideHref } from '@/lib/blog/glossary-ride-href';
import { resolveAttraction, resolvePark } from '@/lib/blog/park-resolver';
import { BlogAttractionLink } from './blog-attraction-link';

const CHIP_ONLY = new Set(['chip']);

/**
 * A ride link authored in a glossary definition, rendered inside a blog post: the label plus the
 * live wait-time (or status) chip a `ref:` link carries.
 *
 * Definitions hold finished geo paths where `ref:` links hold a slug key, so the path is split
 * (`parseGlossaryRideHref`) and resolved the way `ref:` links are. The chip carries no photos: the
 * hover card falls back to its photo-less layout, which a `ref:` link also uses without an image. A park link (four segments), an unknown ride or a
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
  const ref = parseGlossaryRideHref(href);
  if (!ref) return fallback;
  const { geoPath, parkSlug, rideSlug } = ref;
  const park = await resolvePark(parkSlug, geoPath);
  // `resolvePark` falls back to a bare slug shared by another park; the chip must be this park's.
  if (!park || park.href !== `/parks/${geoPath}/${parkSlug}`) return fallback;
  const attraction = await resolveAttraction(parkSlug, rideSlug, geoPath);
  if (!attraction?.detail) return fallback;
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
