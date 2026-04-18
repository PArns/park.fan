import { getTranslations } from 'next-intl/server';
import { MapPin } from 'lucide-react';
import { ParkCardNearby } from '@/components/parks/park-card-nearby';
import { getParksNearLocation } from '@/lib/api/discovery';
import { stripNewPrefix } from '@/lib/utils';
import { getParkBackgroundImage } from '@/lib/utils/park-assets';

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

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {parks.map((park) => (
          <li key={park.id}>
            <ParkCardNearby
              id={park.id}
              name={stripNewPrefix(park.name)}
              city={park.city ?? ''}
              country={park.country ?? ''}
              distance={park.distance}
              status={park.status}
              timezone={park.timezone}
              totalAttractions={park.totalAttractions}
              operatingAttractions={park.operatingAttractions}
              analytics={park.analytics}
              todaySchedule={park.todaySchedule ?? undefined}
              nextSchedule={park.nextSchedule ?? undefined}
              backgroundImage={getParkBackgroundImage(park.slug)}
              url={park.url ?? ''}
              hasOperatingSchedule={park.hasOperatingSchedule}
            />{' '}
          </li>
        ))}
      </ul>
    </section>
  );
}
