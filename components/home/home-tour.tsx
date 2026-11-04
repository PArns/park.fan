import { getTranslations } from 'next-intl/server';
import { CalendarRange, Timer, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { plannerPath } from '@/lib/planner/segments';
import { linkBlockAttributes } from '@/lib/analytics/internal-link';
import type { Locale } from '@/i18n/config';
import { ShotStop, StopLink } from './home-stop';
import { versionedPath } from '@/lib/media/focus';
import { TOUR_PARK } from '@/lib/home/tour-park.mjs';

/** One stop of the tour: its messages under `homeStory.tour.<key>`, its icon, link and screenshot. */
interface Stop {
  key: 'live' | 'calendar' | 'ride';
  icon: LucideIcon;
  href: string;
  link: string;
}

/**
 * What park.fan does, shown rather than told: three stops, each a few lines beside a screenshot of
 * the real page on a phone (`ShotStop`), as on Parky's page. The live waits on a park page, the
 * crowd calendar and a ride's day with its forecast. The live stop leads to the park in its
 * picture ({@link TOUR_PARK}), worded "<park>: Wartezeiten live", so the homepage hands that query
 * to the park page instead of answering it itself; the other two lead to the page that tells the
 * rest. The
 * screenshots are per locale, from `scripts/capture-home-shots.mjs`, so a reader sees the site in
 * their own language. Each stop opens with its number (`ChapterHeading
 * variant="stop"`, an `<h2>` worded as people search).
 */
export async function HomeTour({ locale }: { locale: Locale }) {
  const t = await getTranslations('homeStory.tour');
  const tParks = await getTranslations('parks');
  const stops: Stop[] = [
    {
      key: 'live',
      icon: Timer,
      href: `/${TOUR_PARK.path}`,
      link: tParks('liveLink', { park: TOUR_PARK.name }),
    },
    {
      key: 'calendar',
      icon: CalendarRange,
      href: `/${BEST_TIME_SEGMENTS[locale]}`,
      link: t('calendar.link'),
    },
    { key: 'ride', icon: TrendingDown, href: plannerPath(locale), link: t('ride.link') },
  ];
  const shots: Record<Stop['key'], string> = { live: 'park', calendar: 'calendar', ride: 'ride' };

  return (
    <div id="so-funktionierts" {...linkBlockAttributes('nav')}>
      {stops.map(({ key, icon, href, link }, index) => (
        <ShotStop
          key={key}
          // The tour runs on from the stop above it (the news, or the favourites under them), with
          // no hairline: that stop keeps its room below, and that room is the gap.
          flushTop={index === 0}
          reverse={index % 2 === 1}
          src={versionedPath(`/media/home/${locale}/${shots[key]}.webp`)}
          alt={t(`${key}.alt`)}
          heading={
            <ChapterHeading
              variant="stop"
              icon={icon}
              kicker={t(`${key}.kicker`)}
              title={t(`${key}.title`)}
              hint={t(`${key}.text`)}
              action={<StopLink href={href}>{link}</StopLink>}
            />
          }
        />
      ))}
    </div>
  );
}
