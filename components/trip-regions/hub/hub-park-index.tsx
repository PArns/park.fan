import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { parkCalendarHref, regionGroups, shortParkName } from '@/lib/trip-regions/hub-data';
import type { TripBestDays, TripRegion } from '@/lib/trip-regions/types';

/**
 * Each park's own crowd calendar, as links under the month index: the next question after a day
 * in the region is "and this park on other days?". Navigation, not a chapter: a labelled `<nav>`
 * with the month index's label style. The anchor carries "<park> Crowd Calendar", the query that
 * page ranks for. A park the window has no quiet days for (a water park out of season) is left out;
 * without `/best-days` every headliner park is listed, so a failed read never takes the links away.
 */
export async function HubParkIndex({
  region,
  bestDays,
  locale,
  className,
}: {
  region: TripRegion;
  bestDays: TripBestDays | null;
  locale: string;
  className?: string;
}) {
  const t = await getTranslations('tripHub.parksIndex');
  const shown = bestDays
    ? new Set(
        bestDays.parks
          .filter((p) => p.basis !== 'none' && (p.quiet.length > 0 || !!p.flat))
          .map((p) => p.slug)
      )
    : null;
  const parks = regionGroups(region)
    .flatMap((group) => group.parks)
    .filter((park) => (shown ? shown.has(park.slug) : park.headliner));
  if (parks.length === 0) return null;
  return (
    <nav aria-label={t('label')} className={cn(className)}>
      <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
        {t('label')}
      </p>
      <ul className="grid grid-cols-2 gap-x-4 text-sm sm:grid-cols-3 lg:grid-cols-4">
        {parks.map((park) => (
          <li key={park.slug} className="flex flex-col">
            <Link
              href={parkCalendarHref(park, locale)}
              prefetch={false}
              className="text-primary-ink inline-flex min-h-11 items-center font-medium underline-offset-4 hover:underline sm:min-h-8"
            >
              {t('link', { park: shortParkName(park.name) })}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
