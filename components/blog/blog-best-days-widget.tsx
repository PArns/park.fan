import { connection } from 'next/server';
import { getLocale, getTranslations } from 'next-intl/server';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, addDays, min } from 'date-fns';
import { GlassCard } from '@/components/common/glass-card';
import { ParkBestDaysSection } from '@/components/parks/park-best-days-section';
import { getBestDaysCalendar } from '@/lib/api/integrated-calendar';
import { getParkHistoricalStats } from '@/lib/api/stats';
import { parkGeoPath } from '@/lib/blog/widget-park';
import { getServerToday } from '@/lib/utils/server-time';
import type { ResolvedPark } from '@/lib/blog/park-resolver';
import type { IntegratedCalendarResponse } from '@/lib/api/types';

interface BlogBestDaysWidgetProps {
  park: ResolvedPark | null;
  slug: string;
}

/**
 * Inline "best days to visit" card used inside blog posts via:
 *   ```best-days-widget slug=phantasialand
 *   ```
 *
 * Reuses the park detail page's ParkBestDaysSection in its compact form, fed by
 * the same integrated-calendar + day-of-week-stats data the park page uses.
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

  // Dynamic PPR hole: keeps the slow calendar/stats out of the static shell
  // prerender (same pattern as the park page's Streamed* components).
  await connection();
  const locale = await getLocale();
  // Read "today" via getServerToday so it sits inside a 'use cache' boundary
  // (Cache Components forbids reading the clock during prerender).
  const today = parseISO(await getServerToday(park.timezone ?? 'UTC'));
  const from = startOfMonth(today);
  const to = min([endOfMonth(addMonths(today, 2)), addDays(from, 89)]);

  // getBestDaysCalendar wraps getIntegratedCalendar in unstable_cache + projects
  // it down to ~13 KB, so the Cache Components prerender check doesn't trip on
  // the raw 2.25 MB upstream body (see lib/api/integrated-calendar.ts for the
  // pattern the park page uses inside its Suspense holes).
  const [calendarData, stats] = await Promise.all([
    getBestDaysCalendar(geo.continent, geo.country, geo.city, geo.parkSlug, {
      from: format(from, 'yyyy-MM-dd'),
      to: format(to, 'yyyy-MM-dd'),
    }).catch(
      (): IntegratedCalendarResponse => ({
        meta: { slug: geo.parkSlug, timezone: park.timezone ?? '', hasOperatingSchedule: false },
        days: [],
      })
    ),
    getParkHistoricalStats(geo.continent, geo.country, geo.city, geo.parkSlug).catch(() => null),
  ]);

  if (calendarData.days.length === 0) return null;

  return (
    <div className="not-prose my-8">
      <ParkBestDaysSection
        calendarData={calendarData}
        statsByDayOfWeek={stats?.byDayOfWeek}
        parkName={park.name}
        parkSlug={geo.parkSlug}
        locale={locale}
        compact
      />
    </div>
  );
}
