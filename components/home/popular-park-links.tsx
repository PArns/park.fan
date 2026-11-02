import { getTranslations } from 'next-intl/server';
import { CalendarRange, Timer } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getFeaturedParksMenu } from '@/lib/navigation/featured-parks-menu';
import { viewedParksSeed } from '@/lib/parks/viewed-parks-seed';
import { PARK_CALENDAR_SEGMENTS } from '@/lib/parks/calendar-segments';
import { linkBlockAttributes } from '@/lib/analytics/internal-link';
import type { Locale } from '@/i18n/config';
import { getGeoStructure } from '@/lib/api/discovery';
import { catchNonFatal } from '@/lib/api/client';
import { extractFeaturedParks } from './featured-parks-section';

/** How many parks, besides the cards beside the list. */
const PARKS = 9;

/**
 * The parks this locale's readers open most, each with a link to its live waits and one to its
 * crowd calendar, because that is how people search: „<Park> Wartezeiten" and „<Park> Andrang
 * Kalender" are most of what finds park.fan. Plain links in the first HTML, so the homepage hands
 * its weight to exactly those two pages per park. The build's page-view snapshot first
 * (`viewedParksSeed`), then the parks menu's picks, without the parks on the cards beside it (`extractFeaturedParks`, on
 * the same week-long cached fetch).
 */
export async function PopularParkLinks({ locale }: { locale: Locale }) {
  // The parks the cards beside it already show are left out; the same cached fetch as the cards.
  const geo = await catchNonFatal(getGeoStructure());
  const seen = new Set(extractFeaturedParks(geo, locale).map((park) => park.href));
  const parks = [...viewedParksSeed(locale), ...getFeaturedParksMenu(locale)]
    .filter((park) => !seen.has(park.href) && seen.add(park.href))
    .slice(0, PARKS);
  if (parks.length === 0) return null;

  const t = await getTranslations('homeStory.parkLinks');
  const calendar = PARK_CALENDAR_SEGMENTS[locale];
  return (
    <nav aria-label={t('label')} {...linkBlockAttributes('featured')}>
      <h3 className="mb-4 text-lg font-semibold">{t('title')}</h3>
      {/* Two links a park without twelve rows of „Wartezeiten · Andrang-Kalender": one pill each,
        its name leading to the waits and the icon at its end to the calendar. */}
      <ul className="flex flex-wrap gap-2">
        {parks.map((park) => (
          <li
            key={park.href}
            className="border-border/60 bg-card/40 flex min-h-10 items-center rounded-full border text-sm"
          >
            <Link
              href={park.href as '/'}
              prefetch={false}
              className="hover:text-primary flex items-center gap-1.5 self-stretch pr-2 pl-3 font-medium transition-colors"
            >
              <Timer className="text-muted-foreground size-3.5" aria-hidden="true" />
              {park.name}
              <span className="sr-only">: {t('waits')}</span>
            </Link>
            <Link
              href={`${park.href}/${calendar}` as '/'}
              prefetch={false}
              title={t('calendar')}
              className="text-muted-foreground hover:text-primary border-border/60 grid place-items-center self-stretch border-l pr-3 pl-2 transition-colors"
            >
              <CalendarRange className="size-3.5" aria-hidden="true" />
              <span className="sr-only">
                {park.name}: {t('calendar')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
