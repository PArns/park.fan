import { getTranslations } from 'next-intl/server';
import { MapPin } from 'lucide-react';
import { getParksNearLocation } from '@/lib/api/discovery';
import { getParkBackgroundImage } from '@/lib/utils/park-assets';
import { stripNewPrefix } from '@/lib/utils';
import { LiveNearbyParks, type StaticNearbyPark } from '@/components/parks/live-nearby-parks';

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

  // Status-free seed (proximity + structure only); live status is overlaid client-side.
  const staticParks: StaticNearbyPark[] = parks.map((park) => ({
    id: park.id,
    name: stripNewPrefix(park.name),
    slug: park.slug,
    city: park.city ?? '',
    country: park.country ?? '',
    distance: park.distance,
    url: park.url ?? '',
    backgroundImage: getParkBackgroundImage(park.slug),
  }));

  return (
    <section className={className}>
      <div className="bg-background/70 mb-4 rounded-xl px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <MapPin className="text-primary h-5 w-5" />
          <h2 className="text-xl font-bold">{t('nearbyParks')}</h2>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">{t('nearbyParksArea')}</p>
      </div>

      <LiveNearbyParks parkId={parkId} lat={lat} lng={lng} parks={staticParks} />
    </section>
  );
}
