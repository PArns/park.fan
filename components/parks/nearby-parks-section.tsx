import { getTranslations } from 'next-intl/server';
import { MapPin } from 'lucide-react';
import { ParkCard } from '@/components/parks/park-card';
import { getParksNearLocation } from '@/lib/api/discovery';
import { stripNewPrefix } from '@/lib/utils';

interface NearbyParksSectionProps {
  parkId: string;
  lat: number;
  lng: number;
  className?: string;
}

export async function NearbyParksSection({ parkId, lat, lng, className }: NearbyParksSectionProps) {
  const [t, parks] = await Promise.all([
    getTranslations('nearby'),
    getParksNearLocation(lat, lng, parkId, 3, 100_000),
  ]);

  if (parks.length < 2) return null;

  return (
    <section className={className}>
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="text-primary h-5 w-5" />
        <h2 className="text-xl font-bold">{t('nearbyParks')}</h2>
      </div>
      <p className="text-muted-foreground mb-4 text-sm">{t('nearbyParksArea')}</p>

      <ul className="grid [grid-auto-rows:auto_1fr_auto] gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {parks.map((park) => (
          <li key={park.id} className="row-span-3 grid [grid-template-rows:subgrid]">
            <ParkCard
              id={park.id}
              slug={park.slug}
              name={stripNewPrefix(park.name)}
              city={park.city ?? ''}
              country={park.country ?? ''}
              distance={park.distance}
              status={park.status as import('@/lib/api/types').ParkStatus}
              timezone={park.timezone}
              totalAttractions={park.totalAttractions}
              operatingAttractions={park.operatingAttractions}
              analytics={park.analytics}
              todaySchedule={park.todaySchedule ?? undefined}
              nextSchedule={park.nextSchedule ?? undefined}
              url={park.url ?? ''}
              hasOperatingSchedule={park.hasOperatingSchedule}
              translateCountry
            />{' '}
          </li>
        ))}
      </ul>
    </section>
  );
}
