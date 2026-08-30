import { getTranslations } from 'next-intl/server';
import { getGeoStructure } from '@/lib/api/discovery';
import { catchNonFatal } from '@/lib/api/client';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { extractFeaturedParks } from '@/components/home/featured-parks-section';
import { ParkShortcutStrip } from './park-shortcut-strip';

/**
 * Server half of the shortcut band: resolves the locale's featured parks and
 * hands the day-stable fields to the client strip.
 *
 * Deliberately the **same** `extractFeaturedParks(getGeoStructure(), locale)`
 * the featured grid uses rather than a second curated list. Two reasons, and
 * both are load-bearing: `getGeoStructure` is a 24 h-cached fetch, so the two
 * call sites cost one request between them; and the strip's live overlay is
 * keyed on the region set it derives from these parks, so an independent list
 * would key a second query and double the 5-min poll for six status dots.
 */
export async function ParkShortcutSlot({ locale }: { locale: string }) {
  const [tGeo, geoData] = await Promise.all([
    getTranslations('geo'),
    catchNonFatal(getGeoStructure()),
  ]);
  const parks = extractFeaturedParks(geoData, locale);
  if (parks.length === 0) return null;

  return (
    <ParkShortcutStrip
      parks={parks.map((park) => ({
        parkId: park.parkId,
        name: park.name,
        slug: park.slug,
        city: park.city,
        country: translateGeoSlug(tGeo, 'countries', park.countrySlug, park.countryName),
        href: park.href,
        backgroundImage: park.backgroundImage ?? null,
        continentSlug: park.continentSlug,
        countrySlug: park.countrySlug,
      }))}
    />
  );
}
