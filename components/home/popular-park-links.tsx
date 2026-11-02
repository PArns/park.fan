import { getTranslations } from 'next-intl/server';
import { CalendarRange, Timer } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getFeaturedParksMenu } from '@/lib/navigation/featured-parks-menu';
import { viewedParksSeed } from '@/lib/parks/viewed-parks-seed';
import { PARK_CALENDAR_SEGMENTS } from '@/lib/parks/calendar-segments';
import { linkBlockAttributes } from '@/lib/analytics/internal-link';
import type { Locale } from '@/i18n/config';

/** How many parks. */
const PARKS = 12;

/**
 * The parks this locale's readers open most, each with a link to its live waits and one to its
 * crowd calendar, because that is how people search: „<Park> Wartezeiten" and „<Park> Andrang
 * Kalender" are most of what finds park.fan. Plain links in the first HTML, so the homepage hands
 * its weight to exactly those two pages per park. The build's page-view snapshot first
 * (`viewedParksSeed`), then the parks menu's picks; both are synchronous, so no `<Suspense>`.
 */
export async function PopularParkLinks({ locale }: { locale: Locale }) {
  const seen = new Set<string>();
  const parks = [...viewedParksSeed(locale), ...getFeaturedParksMenu(locale)]
    .filter((park) => !seen.has(park.href) && seen.add(park.href))
    .slice(0, PARKS);
  if (parks.length === 0) return null;

  const t = await getTranslations('homeStory.parkLinks');
  const calendar = PARK_CALENDAR_SEGMENTS[locale];
  const linkClass =
    'text-muted-foreground hover:text-primary inline-flex min-h-11 items-center gap-1.5 text-sm transition-colors md:min-h-0';

  return (
    <nav aria-label={t('label')} {...linkBlockAttributes('featured')}>
      <h3 className="mb-4 text-lg font-semibold">{t('title')}</h3>
      <ul>
        {parks.map((park) => (
          <li
            key={park.href}
            className="border-border/60 flex flex-col gap-x-4 border-t py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="font-medium">{park.name}</span>
            <span className="flex items-center gap-4">
              <Link href={park.href as '/'} prefetch={false} className={linkClass}>
                <Timer className="size-4" aria-hidden="true" />
                <span className="sr-only">{park.name}: </span>
                {t('waits')}
              </Link>
              <Link href={`${park.href}/${calendar}` as '/'} prefetch={false} className={linkClass}>
                <CalendarRange className="size-4" aria-hidden="true" />
                <span className="sr-only">{park.name}: </span>
                {t('calendar')}
              </Link>
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
