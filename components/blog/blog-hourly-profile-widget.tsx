import { getLocale, getTranslations } from 'next-intl/server';
import { GlassCard } from '@/components/common/glass-card';
import {
  ParkHourlyProfileCard,
  type HourlyProfileLabels,
} from '@/components/parks/park-hourly-profile-card';
import { parkGeoPath } from '@/lib/blog/widget-park';
import type { ResolvedPark } from '@/lib/blog/park-resolver';

interface BlogHourlyProfileWidgetProps {
  park: ResolvedPark | null;
  slug: string;
  /** `top=` — how many rides. Clamped to 1–12 at the route handler. */
  top?: string;
}

/**
 * The park's day shape inside a blog post:
 *
 *   ```hourly-profile-widget slug=europa-park top=8
 *   ```
 *
 * Replaces the Europa-Park post's hand-typed 8 × 10 matrix — eighty numbers per locale, four
 * hundred and eighty across the six, none of which anything could bring forward. It is also the
 * table that most needed replacing: a queue's shape over the day changes when a park moves its
 * opening time or rebuilds a queue line, and the article read as a statement about today.
 *
 * The card is a Client Component fetching the CDN-cached `/api/parks/.../stats/hourly`, so the
 * post shell stays statically prerenderable, exactly like the other data widgets here.
 */
export async function BlogHourlyProfileWidget({ park, slug, top }: BlogHourlyProfileWidgetProps) {
  const [t, tOverview, tBlog] = await Promise.all([
    getTranslations('parks.stats'),
    getTranslations('parks.overview'),
    getTranslations('blog'),
  ]);
  const geo = park ? parkGeoPath(park) : null;

  if (!park || !geo) {
    return (
      <GlassCard variant="light" className="not-prose clear-both my-8">
        <p className="text-muted-foreground text-sm">{tBlog('widget.parkNotFound', { slug })}</p>
      </GlassCard>
    );
  }

  const locale = await getLocale();
  const labels: HourlyProfileLabels = {
    title: t('hourlyProfileTitle'),
    ride: t('rideWaitsRide'),
    hour: t('hourlyProfileHour'),
    minutes: tOverview('minutesUnit'),
    peakNote: t('hourlyProfilePeakNote'),
    footnote: t('hourlyProfileFootnote'),
  };

  return (
    <div className="not-prose clear-both my-8">
      <ParkHourlyProfileCard
        continent={geo.continent}
        country={geo.country}
        city={geo.city}
        parkSlug={geo.parkSlug}
        basePath={park.href}
        labels={labels}
        locale={locale}
        topN={Math.min(Math.max(Number(top) || 8, 1), 12)}
      />
    </div>
  );
}
