import { getTranslations } from 'next-intl/server';
import { CalendarDays } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getGeoStructure } from '@/lib/api/discovery';
import { extractFeaturedParks } from '@/components/home/featured-parks-section';
import { getParkHistoricalStats } from '@/lib/api/stats';
import type { DayOfWeekStat } from '@/lib/api/types';

/**
 * "The quietest day at each park" — the one section on this page that names parks.
 *
 * Everything above it is averaged across the whole catalogue, which is honest but answers a
 * question almost nobody types. The demand is park-qualified ("beste Zeit Europa-Park besuchen"),
 * and every competitor ranking for that shape is a park-specific page. This closes part of that
 * gap with data no one else has: the weekday aggregate the backend already materializes per park.
 *
 * Reads `/stats`, not the `best-days` snapshot. That snapshot carries a weekday aggregate too,
 * but it is explicitly best-effort — absent whenever the backend's stats cache was cold at
 * precompute time — so the first version of this table rendered two parks out of six and a
 * different two on the next build. `/stats` answers reliably, retries a cold compute itself, and
 * carries the number worth printing: `avgWaitP50` in minutes.
 *
 * It is deliberately NOT a table of all 212 parks. The list is `FEATURED_PARK_SLUGS`, the same
 * per-locale six the homepage and the header rail use — curated by search volume, so the German
 * page names Europa-Park and Phantasialand while the French one names Parc Astérix. Six fetches,
 * not two hundred.
 *
 * **Every park fails on its own.** This route is prerendered, and a rejected fetch inside a
 * prerender takes the whole route with it — the documented way this project has broken a build
 * before. So the snapshots are gathered with `allSettled`, a park that errors or arrives without
 * `byDayOfWeek` is simply left out, and if none survive the section renders nothing rather than
 * an empty frame.
 */

/** Below this many observed days a weekday average is noise, not a finding. */
const MIN_SAMPLE_DAYS = 8;

/**
 * A weekday needs at least this share of the best-observed weekday's sample count to be compared
 * with it. Movie Park closes on many weekdays out of season, so its Mondays carry 13 observations
 * against 22 Sundays — calling Tuesday its busiest day would be a claim about two different
 * stretches of the year.
 */
const MIN_SAMPLE_RATIO = 0.7;

/**
 * How much quieter the quietest day has to be than the park's own week, before it is worth naming.
 * Efteling spans 2.30 to 2.80: real, but not "go on a Thursday" real.
 */
const MIN_RELATIVE_GAP = 0.06;

interface ParkRow {
  name: string;
  href: string;
  quietest: number;
  /** Median wait on that day, in minutes. */
  quietestWait: number;
  /** This park's median wait across the whole week, for the comparison. */
  averageWait: number;
  busiest: number;
  sampleDays: number;
}

/**
 * Quietest and busiest weekday — or null whenever the answer would be shakier than it looks.
 *
 * Four ways this refuses to answer, and each of them fired on a real park while this was built:
 *   - the aggregate is missing entirely (it is best-effort; the backend omits it when its stats
 *     cache was cold at precompute time)
 *   - a weekday has too few observations to mean anything on its own
 *   - the weekdays were not observed comparably often (see MIN_SAMPLE_RATIO)
 *   - the week is flat, or the quietest day ties with another one — naming either would make the
 *     sort order look like a finding
 */
function pickExtremes(byDayOfWeek: DayOfWeekStat[] | undefined) {
  if (!byDayOfWeek?.length) return null;
  const usable = byDayOfWeek.filter((d) => d.sampleDays >= MIN_SAMPLE_DAYS);
  // All seven or none: a "quietest day" picked from four of them invites the reader to compare
  // days that were never measured against each other.
  if (usable.length < 7) return null;

  const maxSamples = Math.max(...usable.map((d) => d.sampleDays));
  if (usable.some((d) => d.sampleDays < maxSamples * MIN_SAMPLE_RATIO)) return null;

  const sorted = [...usable].sort((a, b) => a.avgCrowdScore - b.avgCrowdScore);
  const [quietest, runnerUp] = sorted;
  const busiest = sorted[sorted.length - 1];

  const average = usable.reduce((sum, d) => sum + d.avgCrowdScore, 0) / usable.length;
  if (average <= 0) return null;
  if ((average - quietest.avgCrowdScore) / average < MIN_RELATIVE_GAP) return null;
  // A tie for quietest means the sort decided, not the data.
  if (quietest.avgCrowdScore === runnerUp.avgCrowdScore) return null;

  const averageWait = Math.round(usable.reduce((sum, d) => sum + d.avgWaitP50, 0) / usable.length);
  // The crowd score says the day is quieter; the waits have to agree, or the sentence the table
  // writes ("26 instead of 33 minutes") would contradict itself.
  if (!(quietest.avgWaitP50 < averageWait)) return null;

  return {
    quietest: quietest.dayOfWeek,
    quietestWait: Math.round(quietest.avgWaitP50),
    averageWait,
    busiest: busiest.dayOfWeek,
    sampleDays: usable.reduce((sum, d) => sum + d.sampleDays, 0),
  };
}

export async function QuietestDaysByPark({ locale }: { locale: string }) {
  const geo = await getGeoStructure().catch(() => null);
  const parks = extractFeaturedParks(geo, locale);
  if (parks.length === 0) return null;

  const settled = await Promise.allSettled(
    parks.map(async (park) => {
      // href is `/parks/<continent>/<country>/<city>/<park>` — the only place the city slug
      // survives `extractFeaturedParks`, which drops it after building the link.
      const [, , continent, country, city, slug] = park.href.split('/');
      const stats = await getParkHistoricalStats(continent, country, city, slug);
      const extremes = pickExtremes(stats?.byDayOfWeek);
      return extremes
        ? ({ name: park.name, href: park.href, ...extremes } satisfies ParkRow)
        : null;
    })
  );

  const rows = settled
    .filter((r): r is PromiseFulfilledResult<ParkRow | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((row): row is ParkRow => row !== null);

  if (rows.length === 0) return null;

  const t = await getTranslations('bestTime.quietestByPark');
  // Weekday names from the runtime rather than a translated list: one less thing to keep in sync
  // across six locales, and it already matches each locale's own conventions.
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  // 2023-01-01 was a Sunday, so index 0..6 maps straight onto the API's dayOfWeek.
  const dayName = (index: number) => weekday.format(new Date(Date.UTC(2023, 0, 1 + index)));

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays className="text-primary h-5 w-5" aria-hidden="true" />
        <h3 className="text-xl font-bold">{t('title')}</h3>
      </div>
      <p className="text-muted-foreground mb-4 max-w-2xl">{t('intro')}</p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-border/60 border-b">
              <th scope="col" className="text-muted-foreground py-2 pr-4 font-medium">
                {t('colPark')}
              </th>
              <th scope="col" className="text-muted-foreground py-2 pr-4 font-medium">
                {t('colQuietest')}
              </th>
              <th scope="col" className="text-muted-foreground py-2 pr-4 font-medium">
                {t('colBusiest')}
              </th>
              <th scope="col" className="text-muted-foreground py-2 font-medium">
                {t('colBasis')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.href} className="border-border/40 border-b last:border-0">
                <th scope="row" className="py-2.5 pr-4 font-semibold">
                  <Link href={row.href} className="hover:text-primary transition-colors">
                    {row.name}
                  </Link>
                </th>
                <td className="py-2.5 pr-4">
                  <span className="text-status-operating font-medium">{dayName(row.quietest)}</span>
                  <span className="text-muted-foreground ml-2 tabular-nums">
                    {t('insteadOf', { day: row.quietestWait, week: row.averageWait })}
                  </span>
                </td>
                <td className="text-muted-foreground py-2.5 pr-4">{dayName(row.busiest)}</td>
                <td className="text-muted-foreground py-2.5 tabular-nums">
                  {t('basis', { days: row.sampleDays })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
