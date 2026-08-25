import { getTranslations } from 'next-intl/server';
import { MapPin } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { getParksNearLocation } from '@/lib/api/discovery';
import { getCardObjectPosition, getParkBackgroundImage } from '@/lib/utils/park-assets';
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
    backgroundPosition: getCardObjectPosition(park.slug),
  }));

  return (
    <section className={className}>
      <ChapterHeading
        icon={MapPin}
        title={t('nearbyParks')}
        hint={t('nearbyParksArea')}
        frosted
        className="mb-4"
      />

      <LiveNearbyParks parkId={parkId} lat={lat} lng={lng} parks={staticParks} />
    </section>
  );
}
