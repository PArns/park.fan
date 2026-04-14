import { getTranslations } from 'next-intl/server';
import { ParkCardNearby } from '@/components/parks/park-card-nearby';
import { MapPin } from 'lucide-react';
import { stripNewPrefix } from '@/lib/utils';
import { getCountriesWithParks } from '@/lib/api/discovery';
import type { ParkReference } from '@/lib/api/types';

interface NearbyParksSectionProps {
  parkId: string;
  parkName: string;
  continentSlug: string;
  countrySlug: string;
  className?: string;
}

export async function NearbyParksSection({
  parkId,
  parkName,
  continentSlug,
  countrySlug,
  className,
}: NearbyParksSectionProps) {
  const t = await getTranslations('nearby');

  let parks: (ParkReference & { citySlug: string; cityName: string })[] = [];
  let countryName = '';

  try {
    const countryData = await getCountriesWithParks(continentSlug);
    if (!countryData || !countryData.data) return null;

    const country = countryData.data.find((c) => c.slug === countrySlug);
    if (!country) return null;
    countryName = country.name;

    const allParks = [];
    for (const city of country.cities) {
      for (const park of city.parks) {
        if (park.id === parkId) continue;
        allParks.push({
          ...park,
          citySlug: city.slug,
          cityName: city.name,
        });
      }
    }

    if (allParks.length === 0) return null;

    parks = allParks
      .sort((a, b) => {
        const aOpen = a.status === 'OPERATING' ? 1 : 0;
        const bOpen = b.status === 'OPERATING' ? 1 : 0;
        if (bOpen !== aOpen) return bOpen - aOpen;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 3);
  } catch (error) {
    console.error('[NearbyParksSection] Error fetching nearby parks:', error);
    return null;
  }

  if (parks.length === 0) return null;

  return (
    <section className={className}>
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="text-park-primary h-5 w-5" />
        <h2 className="text-xl font-bold">{t('nearbyParks')}</h2>
      </div>
      <p className="text-muted-foreground mb-4 text-sm">
        {t('nearParkSubtitle', { parkName: stripNewPrefix(parkName) })}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {parks.map((park) => (
          <li key={park.id}>
            <ParkCardNearby
              id={park.id}
              name={stripNewPrefix(park.name)}
              city={park.cityName}
              country={countryName}
              continent={continentSlug}
              distance={0}
              status={park.status || 'CLOSED'}
              timezone={'UTC'}
              totalAttractions={park.analytics?.statistics?.totalAttractions || 0}
              operatingAttractions={park.analytics?.statistics?.operatingAttractions || 0}
              analytics={{
                avgWaitTime: park.analytics?.statistics?.avgWaitTime,
                crowdLevel: park.currentLoad?.crowdLevel,
              }}
              url={`/v1/parks/${continentSlug}/${countrySlug}/${park.citySlug}/${park.slug}`}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
