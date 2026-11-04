import { getTranslations } from 'next-intl/server';
import { CalendarRange, Timer, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { howtoPath } from '@/lib/howto/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { plannerPath } from '@/lib/planner/segments';
import { linkBlockAttributes } from '@/lib/analytics/internal-link';
import type { Locale } from '@/i18n/config';
import { ShotStop, StopLink } from './home-stop';
import { versionedPath } from '@/lib/media/focus';

/** One stop of the tour: its messages under `homeStory.tour.<key>`, its icon, link and screenshot. */
interface Stop {
  key: 'live' | 'calendar' | 'ride';
  icon: LucideIcon;
  href: string;
}

/**
 * What park.fan does, shown rather than told: three stops, each a few lines beside a screenshot of
 * the real page on a phone (`ShotStop`), as on Parky's page. The live waits on a park page, the
 * crowd calendar and a ride's day with its forecast; each leads to the page that explains it at
 * length. The screenshots are per locale, from `scripts/capture-home-shots.mjs`, so a reader sees
 * the site in their own language. Each stop opens with its number (`ChapterHeading
 * variant="stop"`, an `<h2>` worded as people search).
 */
export async function HomeTour({ locale }: { locale: Locale }) {
  const t = await getTranslations('homeStory.tour');
  const stops: Stop[] = [
    { key: 'live', icon: Timer, href: howtoPath(locale) },
    { key: 'calendar', icon: CalendarRange, href: `/${BEST_TIME_SEGMENTS[locale]}` },
    { key: 'ride', icon: TrendingDown, href: plannerPath(locale) },
  ];
  const shots: Record<Stop['key'], string> = { live: 'park', calendar: 'calendar', ride: 'ride' };

  return (
    <div id="so-funktionierts" {...linkBlockAttributes('nav')}>
      {stops.map(({ key, icon, href }, index) => (
        <ShotStop
          key={key}
          // The tour runs on from the news board, with no hairline: the board's stop keeps its room
          // below, and that room is the gap.
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
              action={<StopLink href={href}>{t(`${key}.link`)}</StopLink>}
            />
          }
        />
      ))}
    </div>
  );
}
