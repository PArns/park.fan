import { getTranslations } from 'next-intl/server';
import { ParkCard } from '@/components/parks/park-card';
import { resolvePark } from '@/lib/blog/park-resolver';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { getTranslations as getT } from 'next-intl/server';

interface BlogRelatedParksProps {
  parkSlugs: string[];
}

export async function BlogRelatedParks({ parkSlugs }: BlogRelatedParksProps) {
  if (parkSlugs.length === 0) return null;
  const t = await getTranslations('blog');
  const tGeo = await getT('geo');

  const parks = (await Promise.all(parkSlugs.map((slug) => resolvePark(slug)))).filter(
    (p): p is NonNullable<typeof p> => p !== null
  );

  if (parks.length === 0) return null;

  return (
    <section className="my-12">
      <h2 className="text-foreground mb-5 text-xl font-bold">{t('relatedParks.title')}</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {parks.map((park) => (
          <div key={park.slug} className="grid [grid-template-rows:auto_auto_1fr_auto] gap-3">
            <ParkCard
              name={park.name}
              slug={park.slug}
              parkId={park.id}
              city={park.city}
              country={translateGeoSlug(tGeo, 'countries', park.countrySlug, park.country)}
              href={park.href as '/'}
              status={park.status}
              crowdLevel={park.crowdLevel}
              averageWaitTime={park.avgWaitTime}
              operatingAttractions={park.operatingAttractions}
              totalAttractions={park.totalAttractions}
              timezone={park.timezone}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
