import { getLocale } from 'next-intl/server';
import { ParkBestDaysSection } from '@/components/parks/park-best-days-section';
import { parkGeoPath } from '@/lib/blog/widget-park';
import type { ResolvedPark } from '@/lib/blog/park-resolver';
import { BlogWidgetParkNotFound } from '@/components/blog/blog-widget-park-not-found';

interface BlogBestDaysWidgetProps {
  park: ResolvedPark | null;
  slug: string;
}

/**
 * Inline "best days to visit" card used inside blog posts via:
 *   ```best-days-widget slug=phantasialand
 *   ```
 *
 * `ParkBestDaysSection` fetches the heavy calendar and weekday stats itself, as on the park page,
 * so they never land in the server render and a post's render does not wait for them.
 */
export async function BlogBestDaysWidget({ park, slug }: BlogBestDaysWidgetProps) {
  const geo = park ? parkGeoPath(park) : null;

  if (!park || !geo) {
    return <BlogWidgetParkNotFound slug={slug} />;
  }

  const locale = await getLocale();
  return (
    <div className="not-prose clear-both my-8">
      <ParkBestDaysSection
        continent={geo.continent}
        country={geo.country}
        city={geo.city}
        parkSlug={geo.parkSlug}
        timezone={park.timezone ?? ''}
        hasOperatingSchedule={park.hasOperatingSchedule ?? false}
        parkName={park.name}
        locale={locale}
        compact
      />
    </div>
  );
}
