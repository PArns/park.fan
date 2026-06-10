import { getLocale, getTranslations } from 'next-intl/server';
import { GlassCard } from '@/components/common/glass-card';
import { ParkBestDaysSection } from '@/components/parks/park-best-days-section';
import { parkGeoPath } from '@/lib/blog/widget-park';
import type { ResolvedPark } from '@/lib/blog/park-resolver';

interface BlogBestDaysWidgetProps {
  park: ResolvedPark | null;
  slug: string;
}

/**
 * Inline "best days to visit" card used inside blog posts via:
 *   ```best-days-widget slug=phantasialand
 *   ```
 *
 * Mirrors the park detail page: `ParkBestDaysSection` is a Client Component
 * that fetches the integrated calendar + day-of-week stats itself, so the
 * heavy ~2.25 MB calendar never lands on the server render and the post
 * shell stays statically prerenderable.
 */
export async function BlogBestDaysWidget({ park, slug }: BlogBestDaysWidgetProps) {
  const tBlog = await getTranslations('blog');
  const geo = park ? parkGeoPath(park) : null;

  if (!park || !geo) {
    return (
      <GlassCard variant="light" className="not-prose my-8">
        <p className="text-muted-foreground text-sm">{tBlog('widget.parkNotFound', { slug })}</p>
      </GlassCard>
    );
  }

  const locale = await getLocale();
  return (
    <div className="not-prose my-8">
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
