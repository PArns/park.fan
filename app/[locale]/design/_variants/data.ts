import { getTranslations } from 'next-intl/server';
import { getGeoStructure } from '@/lib/api/discovery';
import { getGlobalStats } from '@/lib/api/analytics';
import { catchNonFatal } from '@/lib/api/client';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { extractFeaturedParks } from '@/components/home/featured-parks-section';
import { listPostsByRecency } from '@/lib/blog/listing';
import { getCardObjectPosition } from '@/lib/utils/park-assets';
import type { FeaturedCardStatic } from '@/components/home/featured-park-cards-live';
import type { Locale } from '@/i18n/config';

/**
 * Alles, was der Entwurf rendert — einmal geholt.
 *
 * Zwei Aufrufe, und beide macht die echte Startseite ohnehin: `getGeoStructure` für die Parks,
 * `getGlobalStats` für die Zahlen — inklusive `shortestWaitRide.typicalWaitThisHour`, aus dem der
 * Erklärteil seinen Vergleich baut. Der Entwurf kostet die API damit keine einzige Anfrage mehr
 * als die Seite, die er ersetzen soll.
 */
export async function loadDesignData(locale: Locale) {
  const [tGeo, geoData, stats] = await Promise.all([
    getTranslations('geo'),
    catchNonFatal(getGeoStructure()),
    catchNonFatal(getGlobalStats()),
  ]);

  const parks: FeaturedCardStatic[] = extractFeaturedParks(geoData, locale).map((park) => ({
    parkId: park.parkId,
    name: park.name,
    slug: park.slug,
    city: park.city,
    country: translateGeoSlug(tGeo, 'countries', park.countrySlug, park.countryName),
    href: park.href,
    backgroundImage: park.backgroundImage ?? null,
    backgroundPosition: getCardObjectPosition(park.slug),
    continentSlug: park.continentSlug,
    countrySlug: park.countrySlug,
  }));

  return {
    stats: stats ?? null,
    parks,
    posts: listPostsByRecency(locale).slice(0, 6),
  };
}
