import type { ReactNode } from 'react';
import { parseGlossaryRideHref } from '@/lib/blog/glossary-ride-href';
import { resolveAttraction, resolvePark } from '@/lib/blog/park-resolver';
import { BlogAttractionLink } from './blog-attraction-link';

const CHIP_ONLY = new Set(['chip']);

/**
 * A ride link authored in a glossary definition, rendered inside a blog post: the label plus the
 * live wait-time (or status) chip a `ref:` link carries. The definition's geo path is split
 * (`parseGlossaryRideHref`) and resolved as `ref:` links are; the hover card uses its photo-less
 * layout. A park link, an unknown ride or a failed lookup shows `fallback`, the plain anchor.
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
