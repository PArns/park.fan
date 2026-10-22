import { getLocale, getTranslations } from 'next-intl/server';
import { GlassCard } from '@/components/common/glass-card';
import {
  ParkHourlyProfileCard,
  type HourlyProfileLabels,
} from '@/components/parks/park-hourly-profile-card';
import { getParkHourlyProfileSeed } from '@/lib/api/stats';
import { isServableHourlyProfileRange } from '@/lib/utils/calendar-utils';
import { parkGeoPath } from '@/lib/blog/widget-park';
import type { ResolvedPark } from '@/lib/blog/park-resolver';

interface BlogHourlyProfileWidgetProps {
  park: ResolvedPark | null;
  slug: string;
  /** `top=` — how many rides. Clamped to 1–12 at the route handler. */
  top?: string;
  /** `from=` / `to=` — a fixed window of park-local days. Both or neither; invalid is ignored. */
  from?: string;
  to?: string;
}

/**
 * The park's day shape inside a blog post:
 *
 *   ```hourly-profile-widget slug=europa-park top=8
 *   ```
 *
 * `from=2025-12-01 to=2026-10-21` reads that window instead of the last year, so two fences can
 * show a park before and after a change.
 *
 * The card is a Client Component fetching the CDN-cached `/api/parks/.../stats/hourly`; here it
 * gets a server seed, because a post is prerendered and without it readers without JavaScript got
 * a grid of skeletons. `getParkHourlyProfileSeed` is timeout-bounded and resolves `null`, in which
 * case the card loads on the client.
 */
export async function BlogHourlyProfileWidget({
  park,
  slug,
  top,
  from,
  to,
}: BlogHourlyProfileWidgetProps) {
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
  // Clamped once and used twice: the seed must be fetched with the same `topN` the card queries
  // with, or the settling query swaps in a differently-sized table.
  const topN = Math.min(Math.max(Number(top) || 8, 1), 12);
  // A malformed window would be refused by the route; falling back to the default keeps a typo in
  // a fence a table instead of an empty hole.
  const range = from && to && isServableHourlyProfileRange(from, to) ? { from, to } : undefined;
  const initialProfile = await getParkHourlyProfileSeed(
    geo.continent,
    geo.country,
    geo.city,
    geo.parkSlug,
    topN,
    range?.from,
    range?.to
  );
  const labels: HourlyProfileLabels = {
    title: t('hourlyProfileTitle'),
    ride: t('rideWaitsRide'),
    hour: t('hourlyProfileHour'),
    minutes: tOverview('minutesUnit'),
    peakNote: t('hourlyProfilePeakNote'),
    // `t.raw`, not `t`: the message keeps its `{days}` placeholder for the card to fill from
    // `profile.meta.totalSampleDays`, and `t` without a `days` argument throws and prints the key.
    footnote: t.raw('hourlyProfileFootnote') as string,
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
        topN={topN}
        {...(range ? { range } : {})}
        initialProfile={initialProfile}
      />
    </div>
  );
}
