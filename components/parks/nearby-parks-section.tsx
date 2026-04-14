import { getTranslations } from 'next-intl/server';
import { api } from '@/lib/api/client';
import { ParkCardNearby } from '@/components/parks/park-card-nearby';
import { MapPin } from 'lucide-react';
import type { NearbyResponse, NearbyParksData } from '@/types/nearby';
import { stripNewPrefix } from '@/lib/utils';

interface NearbyParksSectionProps {
  parkId: string;
  parkName: string;
  latitude: number | string;
  longitude: number | string;
  className?: string;
}

export async function NearbyParksSection({
  parkId,
  parkName,
  latitude,
  longitude,
  className,
}: NearbyParksSectionProps) {
  const t = await getTranslations('nearby');

  let response: NearbyResponse | null = null;
  try {
    response = await api.get<NearbyResponse>(
      `/v1/discovery/nearby?lat=${latitude}&lng=${longitude}&radius=50000&limit=4`,
      { next: { revalidate: 3600 } }
    );
  } catch (error) {
    console.error('[NearbyParksSection] Error fetching nearby parks:', error);
    return null;
  }

  if (
    !response ||
    response.type !== 'nearby_parks' ||
    !response.data ||
    !('parks' in response.data)
  ) {
    return null;
  }

  const data = response.data as NearbyParksData;
  const rawParks = data.parks.filter((p) => p.id !== parkId).slice(0, 3);

  if (rawParks.length === 0) {
    return null;
  }

  const parks = [...rawParks].sort((a, b) => {
    const aOpen = a.status === 'OPERATING' ? 1 : 0;
    const bOpen = b.status === 'OPERATING' ? 1 : 0;
    if (bOpen !== aOpen) return bOpen - aOpen;
    return a.distance - b.distance;
  });

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
        {parks.map((park) => {
          const continent = park.url?.split('/')?.[3];
          return (
            <li key={park.id}>
              <ParkCardNearby
                id={park.id}
                name={stripNewPrefix(park.name)}
                city={park.city}
                country={park.country}
                continent={continent}
                distance={park.distance}
                status={park.status}
                timezone={park.timezone}
                totalAttractions={park.totalAttractions}
                operatingAttractions={park.operatingAttractions}
                analytics={park.analytics}
                todaySchedule={park.todaySchedule}
                nextSchedule={park.nextSchedule}
                backgroundImage={park.backgroundImage}
                url={park.url}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
