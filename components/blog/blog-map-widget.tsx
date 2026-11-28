import { getTranslations } from 'next-intl/server';
import { getParkByGeoPath } from '@/lib/api/parks';
import { parkGeoPath } from '@/lib/blog/widget-park';
import { BlogMapClient } from './blog-map-client';
import type { ResolvedPark } from '@/lib/blog/park-resolver';
import type { ParkWithAttractions } from '@/lib/api/types';
import { BlogWidgetLabel } from '@/components/blog/blog-widget-label';
import { BlogWidgetParkNotFound } from '@/components/blog/blog-widget-park-not-found';

interface BlogMapWidgetProps {
  park: ResolvedPark | null;
  slug: string;
}

/**
 * Inline interactive park map used inside blog posts via:
 *   ```map-widget slug=europa-park
 *   ```
 *
 * Reuses the full Leaflet `ParkMap` from the park detail page. The summary
 * `ResolvedPark` doesn't carry attraction coordinates, so we re-fetch the full
 * park (cached) and derive the geo path from its href.
 */
export async function BlogMapWidget({ park, slug }: BlogMapWidgetProps) {
  const tBlog = await getTranslations('blog');

  const geo = park ? parkGeoPath(park) : null;
  let full: ParkWithAttractions | null = null;
  if (geo) {
    full = await getParkByGeoPath(geo.continent, geo.country, geo.city, geo.parkSlug).catch(
      () => null
    );
  }

  if (!park || !full) {
    return <BlogWidgetParkNotFound slug={slug} />;
  }

  return (
    <div className="not-prose clear-both my-8 grid gap-3">
      <BlogWidgetLabel>{tBlog('widget.parkMap')}</BlogWidgetLabel>
      <BlogMapClient park={full} />
    </div>
  );
}
