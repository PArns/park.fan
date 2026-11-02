import { getTranslations } from 'next-intl/server';
import {
  ArrowRight,
  CalendarRange,
  Compass,
  MessageCircle,
  Timer,
  TrendingDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { ShotRow } from '@/components/marketing/shot-row';
import { howtoPath } from '@/lib/howto/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { plannerPath } from '@/lib/planner/segments';
import { linkBlockAttributes } from '@/lib/analytics/internal-link';
import type { Locale } from '@/i18n/config';

/** One stop of the tour: its messages under `homeStory.tour.<key>`, its icon, link and screenshot. */
interface Stop {
  key: 'live' | 'calendar' | 'ride' | 'parky';
  icon: LucideIcon;
  href: string;
  /** The screenshot, from `scripts/capture-home-shots.mjs` (Parky's from its own script). */
  shot: string;
  /** Its description; Parky's page already has one for its chat. */
  alt: string;
}

/**
 * What park.fan does, shown rather than told: four stops, each a few lines beside a screenshot of
 * the real page on a phone, as on Parky's page. The live waits on a park page, the crowd calendar, a
 * ride's day with its forecast and Parky's chat; each leads to the page that explains it at length.
 * The screenshots are per locale, so a reader sees the site in their own language. More room than
 * the other chapters (`py-24 sm:py-32`), and the phones glide as the page scrolls (`ShotRow drift`),
 * since this is the chapter that shows the product rather than lists it. `overflow-hidden` keeps
 * the phones' glow from widening the page on a phone.
 */
export async function HomeTour({ locale }: { locale: Locale }) {
  const [t, tParky] = await Promise.all([
    getTranslations('homeStory.tour'),
    getTranslations('parkyPage'),
  ]);
  const stops: Stop[] = [
    {
      key: 'live',
      icon: Timer,
      href: howtoPath(locale),
      shot: `/home/${locale}/park.webp`,
      alt: t('live.alt'),
    },
    {
      key: 'calendar',
      icon: CalendarRange,
      href: `/${BEST_TIME_SEGMENTS[locale]}`,
      shot: `/home/${locale}/calendar.webp`,
      alt: t('calendar.alt'),
    },
    {
      key: 'ride',
      icon: TrendingDown,
      href: plannerPath(locale),
      shot: `/home/${locale}/ride.webp`,
      alt: t('ride.alt'),
    },
    {
      key: 'parky',
      icon: MessageCircle,
      href: '/parky',
      shot: `/parky/${locale}/chat.webp`,
      alt: tParky('chapters.ask.alt'),
    },
  ];

  return (
    <section
      className="border-border overflow-hidden border-t px-4 py-24 sm:py-32"
      {...linkBlockAttributes('nav')}
    >
      <div className="container mx-auto">
        <Reveal containsGlass>
          <ChapterHeading
            variant="tile"
            icon={Compass}
            kicker={t('kicker')}
            title={t('title')}
            hint={t('lead')}
            id="so-funktionierts"
          />
        </Reveal>

        <ol className="mt-4 space-y-24 sm:mt-8 sm:space-y-36">
          {stops.map(({ key, icon: Icon, href, shot, alt }, index) => (
            <li key={key}>
              <Reveal>
                <ShotRow
                  src={shot}
                  alt={alt}
                  label={tParky('shotLabel')}
                  reverse={index % 2 === 1}
                  drift
                >
                  {/* The stop's number as a large translucent glyph, as on Parky's page. */}
                  <span
                    aria-hidden="true"
                    className="from-primary to-status-operating block bg-gradient-to-br bg-clip-text text-7xl leading-none font-black text-transparent opacity-30 sm:text-8xl"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="text-primary inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] uppercase">
                    <span className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    {t(`${key}.kicker`)}
                  </p>
                  <h3 className="text-3xl font-black tracking-tight text-balance sm:text-4xl">
                    {t(`${key}.title`)}
                  </h3>
                  <p className="text-foreground/85 max-w-xl text-lg leading-relaxed sm:text-xl">
                    {t(`${key}.text`)}
                  </p>
                  <Link
                    href={href as '/'}
                    prefetch={false}
                    className="group text-primary inline-flex items-center gap-1.5 font-semibold"
                  >
                    {t(`${key}.link`)}
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </Link>
                </ShotRow>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
