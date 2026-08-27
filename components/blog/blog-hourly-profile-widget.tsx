import { getLocale, getTranslations } from 'next-intl/server';
import { GlassCard } from '@/components/common/glass-card';
import {
  ParkHourlyProfileCard,
  type HourlyProfileLabels,
} from '@/components/parks/park-hourly-profile-card';
import { getParkHourlyProfileSeed } from '@/lib/api/stats';
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
 * The card is a Client Component fetching the CDN-cached `/api/parks/.../stats/hourly`, and on the
 * guide page it stays that way. Here it gets a server seed: a blog post is statically prerendered,
 * so the fetch happens once at build time — without it this table reached readers without
 * JavaScript as 132 skeleton placeholders, twelve rides by ten hours of nothing, in the very post
 * that replaced a hand-typed matrix with it. `getParkHourlyProfileSeed` is timeout-bounded and
 * resolves `null`, in which case this renders exactly what it rendered before.
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
  // Clamped once and used twice: the seed must be fetched with the same `topN` the card queries
  // with, or the settling query swaps in a differently-sized table.
  const topN = Math.min(Math.max(Number(top) || 8, 1), 12);
  const initialProfile = await getParkHourlyProfileSeed(
    geo.continent,
    geo.country,
    geo.city,
    geo.parkSlug,
    topN
  );
  const labels: HourlyProfileLabels = {
    title: t('hourlyProfileTitle'),
    ride: t('rideWaitsRide'),
    hour: t('hourlyProfileHour'),
    minutes: tOverview('minutesUnit'),
    peakNote: t('hourlyProfilePeakNote'),
    // `t.raw`, not `t`: the message keeps its `{days}` placeholder and the card fills it in
    // from `profile.meta.totalSampleDays`, a number only the settled client query knows. Run
    // through `t` the ICU formatter is handed no `days` argument, throws FORMATTING_ERROR and
    // next-intl returns the key path — which is how „parks.stats.hourlyProfileFootnote" shipped
    // as visible text under the hourly table, in all six locales, on every post with this widget.
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
        initialProfile={initialProfile}
      />
    </div>
  );
}
