import { getTranslations } from 'next-intl/server';
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  Gauge,
  HelpCircle,
  Star,
  Sun,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { ChapterHeading } from '@/components/common/chapter-heading';
import {
  HERO_FLOW_INTO_PULL,
  LandingHero,
  LandingNextSteps,
  Lead,
} from '@/components/marketing/editorial-ui';
import { getMediaImageBySrc } from '@/lib/media';
import { getMediaAlt } from '@/lib/media/text';
import { versionedSrc } from '@/lib/media/focus';
import { plannerPath } from '@/lib/planner/segments';
import { cn } from '@/lib/utils';
import {
  dayBasis,
  firstDays,
  formatHubDate,
  formatHubMonth,
  glanceDay,
  resortMonthSummaries,
  sliceCalendar,
  slimRegion,
  shortParkName,
} from '@/lib/trip-regions/hub-data';
import { bestTimeYear } from '@/lib/trip-regions/best-time';
import {
  TRIP_CALENDAR_ID,
  TRIP_PLANNER_ID,
  tripRegionBestTimePath,
  tripRegionPath,
} from '@/lib/trip-regions/paths';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';
import { requireTripRegion } from '@/lib/trip-regions/registry';
import type {
  TripMonth,
  TripBestDays,
  TripCalendar,
  TripRegion,
  TripWhen,
} from '@/lib/trip-regions/types';
import { HubBestDays, parkCalendarHref } from './hub-best-days';
import { HubCalendar } from './hub-calendar';
import { HubFaq } from './hub-faq';
import { HubGlance, MonthGlance } from './hub-glance';
import { HubLegend } from './hub-legend';
import { HubMethod } from './hub-method';
import { HubMonthIndex } from './hub-month-index';
import { HubMonthSummary } from './hub-month-summary';
import { PlannerChapterSlot } from './planner-chapter-slot';
import { HubWhen } from './hub-when';
import { HubHeroAction } from './hub-hero-action';

/**
 * The hero photo: the first of the region's `hub.heroPhotos` the media database still has, with
 * its credit and alt from there.
 */
function heroPhoto(
  sources: readonly string[],
  locale: string
): { src: string; alt: string } | null {
  for (const src of sources) {
    const image = getMediaImageBySrc(src);
    if (image) return { src: versionedSrc(image), alt: getMediaAlt(image.id, locale) ?? '' };
  }
  return null;
}

/** What the route resolved and read, handed to the page body. */
export interface TripRegionHubPageProps {
  locale: string;
  /** The month a month page shows; `null` on the hub. */
  month: TripMonth | null;
  /** The region's current month. */
  current: TripMonth;
  region: TripRegion;
  calendar: TripCalendar | null;
  bestDays: TripBestDays | null;
  /** The quietest trip windows of the next twelve months, for the best-time teaser. */
  when: TripWhen | null;
  /** The region's today and the render's clock, for the first answer. */
  todayIso: string;
  nowMs: number;
}

/**
 * A region's hub and its month pages, one anatomy (docs/product/landing-pages.md): the hub head
 * with the first answer, the intro with the key, 01 which park on which day, 02 the trip planner,
 * 03 the best days per park, 04 how the forecast works, the questions and the next steps. Simple
 * first, more on request: the head answers, the matrix shows only minutes, the day sheet holds the
 * rest. Every sentence and the first week are in the served HTML.
 */
export async function TripRegionHubPage({
  locale,
  month,
  current,
  region,
  calendar,
  bestDays,
  when,
  todayIso,
  nowMs,
}: TripRegionHubPageProps) {
  const t = await getTranslations('tripHub');
  const tRegion = await getRegionTranslations(region.slug, 'hub');
  const tLanding = await getRegionTranslations(region.slug, 'landing');
  const { hub } = requireTripRegion(region.slug);
  const monthLabel = month ? formatHubMonth(month.year, month.month, locale) : null;
  const hero = heroPhoto(hub.heroPhotos, locale);

  const summaries = calendar ? resortMonthSummaries(region, calendar, bestDays) : [];
  const firstFrom = calendar?.days.find((d) => d.date >= todayIso)?.date ?? todayIso;
  const week = calendar ? firstDays(calendar, firstFrom) : [];
  const lastYearDays = calendar?.days.filter((d) => dayBasis(d) === 'last_year') ?? [];
  const lastYear = !!calendar && lastYearDays.length > calendar.days.length / 2;
  const forecastUntil = calendar?.meta.forecastUntil ?? bestDays?.meta.forecastUntil;
  const pagePath = tripRegionPath(region.slug, locale, month);
  const bestTimePath = tripRegionBestTimePath(region.slug, locale);
  const action = {
    href: `${pagePath}#${TRIP_PLANNER_ID}`,
    label: tLanding('action'),
    icon: CalendarPlus,
  };
  const answer = month ? (
    <MonthGlance
      summaries={summaries}
      monthLabel={monthLabel!}
      lastYear={lastYear}
      locale={locale}
    />
  ) : (
    <HubGlance
      day={calendar ? glanceDay(calendar, region, todayIso, nowMs) : null}
      region={region}
      locale={locale}
    />
  );
  const heroAction = <HubHeroAction href={action.href} label={action.label} />;
  const title = monthLabel ? tRegion('monthTitle', { month: monthLabel }) : tRegion('title');
  const tagline = monthLabel ? tRegion('leadMonth', { month: monthLabel }) : tRegion('lead');
  const nextStepPark = hub.nextStepPark && region.parks.find((p) => p.slug === hub.nextStepPark);
  const periodLabel = monthLabel ?? t('nextDays');
  const whenYear = when ? bestTimeYear(when.meta.from) : null;
  const bestTimeLabel = whenYear
    ? tRegion('when.pageLink', { year: whenYear })
    : tRegion('when.pageLinkNoYear');

  return (
    <>
      {hero ? (
        <LandingHero
          kicker={tLanding('kicker')}
          title={title}
          tagline={tagline}
          answer={answer}
          actionElement={heroAction}
          imageSrc={hero.src}
          imageAlt={hero.alt}
          scrollLabel={t('scroll')}
          flowInto
        />
      ) : (
        <LandingHero
          variant="compact"
          kicker={tLanding('kicker')}
          title={title}
          tagline={tagline}
          answer={answer}
          actionElement={heroAction}
        />
      )}

      <div
        id="start"
        className={cn(
          'relative container mx-auto px-4 pb-16 sm:pb-24',
          hero ? cn('pt-0 sm:pt-12', HERO_FLOW_INTO_PULL) : 'pt-8 sm:pt-12'
        )}
      >
        <div className="space-y-16 sm:space-y-24">
          {/* Intro: what a square says, at one line, and the window in sentences. */}
          <section aria-label={t('introLabel')} className="space-y-6">
            {lastYearDays.length > 0 && (
              <p
                role="note"
                className="border-border/60 bg-muted/40 max-w-3xl rounded-xl border px-4 py-3 text-sm leading-relaxed"
              >
                {forecastUntil
                  ? t('lastYearBanner', { date: formatHubDate(forecastUntil, locale, 'long') })
                  : t('lastYearBannerNoDate')}
              </p>
            )}
            {!month && (
              // The hub's opening is about the region, not a month: a month page's own lead and
              // summary say what differs, and twelve copies of one paragraph would not.
              <div className="max-w-3xl">
                <Lead>{tRegion('opening')}</Lead>
              </div>
            )}
            <p className="text-muted-foreground max-w-3xl leading-relaxed">{t('intro')}</p>
            <HubMonthSummary
              summaries={summaries}
              calendar={calendar}
              region={region}
              locale={locale}
            />
            <HubLegend region={region.slug} forecastUntil={forecastUntil} locale={locale} />
          </section>

          <section id={TRIP_CALENDAR_ID} className="scroll-mt-24">
            <ChapterHeading
              index="01"
              icon={CalendarDays}
              kicker={
                calendar
                  ? t('calendar.kicker', {
                      from: formatHubDate(calendar.meta.from, locale),
                      to: formatHubDate(calendar.meta.to, locale),
                    })
                  : undefined
              }
              title={t('calendar.title')}
              hint={t('calendar.hint')}
            />
            {calendar && week.length > 0 ? (
              <HubCalendar
                region={slimRegion(region)}
                // A month page serves its whole month, the table that URL exists for; the hub its
                // first week, the rest through the relay.
                initial={sliceCalendar(
                  calendar,
                  month ? calendar.days.filter((d) => d.date >= firstFrom) : week
                )}
                window={{ from: firstFrom, to: calendar.meta.to }}
                todayIso={todayIso}
                locale={locale}
              />
            ) : (
              <p className="text-muted-foreground">{t('calendar.unavailable')}</p>
            )}
            {calendar && (
              <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
                {t('calendar.sources', {
                  date: formatHubDate(calendar.meta.computedAt.slice(0, 10), locale),
                  attribution: region.travel.attribution,
                })}
              </p>
            )}
            <HubMonthIndex
              region={region.slug}
              current={current}
              active={month}
              locale={locale}
              className="mt-8"
            />
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <li>
                <Link
                  href={bestTimePath}
                  className="text-primary-ink inline-flex min-h-11 items-center gap-1 font-medium underline-offset-4 hover:underline sm:min-h-0"
                >
                  {bestTimeLabel}
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </li>
              <li>
                <Link
                  href={plannerPath(locale as Locale)}
                  className="text-primary-ink inline-flex min-h-11 items-center gap-1 font-medium underline-offset-4 hover:underline sm:min-h-0"
                >
                  {t('calendar.dayPlanner')}
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </li>
            </ul>
          </section>

          <section className="scroll-mt-24" id="best-time">
            <ChapterHeading
              index="02"
              icon={Sun}
              kicker={tRegion('when.kicker')}
              title={
                whenYear ? tRegion('when.title', { year: whenYear }) : tRegion('when.titleNoYear')
              }
              hint={tRegion('when.hint')}
            />
            <HubWhen region={region.slug} when={when} pagePath={pagePath} locale={locale} />
          </section>

          <PlannerChapterSlot
            index="03"
            region={region}
            locale={locale}
            defaultMonth={
              month ? `${month.year}-${String(month.month).padStart(2, '0')}` : undefined
            }
          />

          <section className="scroll-mt-24" id="best-days">
            <ChapterHeading
              index="04"
              icon={Star}
              kicker={periodLabel}
              title={t('bestDays.title')}
              hint={t('bestDays.hint')}
            />
            <HubBestDays region={region} bestDays={bestDays} calendar={calendar} locale={locale} />
          </section>

          <section className="scroll-mt-24" id="method">
            <ChapterHeading index="05" icon={Gauge} title={tRegion('method.title')} />
            <HubMethod
              region={region.slug}
              forecastUntil={forecastUntil}
              attribution={region.travel.attribution}
              locale={locale}
            />
          </section>

          <section className="scroll-mt-24" id="faq">
            <ChapterHeading icon={HelpCircle} title={tRegion('faq.title')} />
            <HubFaq
              region={region}
              calendar={calendar}
              summaries={summaries}
              monthLabel={monthLabel}
              locale={locale}
            />
          </section>
        </div>
      </div>

      <LandingNextSteps
        title={tRegion('next.title')}
        body={t('next.body')}
        destinations={
          [
            action,
            ...(nextStepPark
              ? [
                  {
                    href: parkCalendarHref(nextStepPark, locale),
                    label: t('next.parkCalendar', { park: shortParkName(nextStepPark.name) }),
                    icon: CalendarRange,
                  },
                ]
              : []),
            { href: bestTimePath, label: bestTimeLabel, icon: Sun },
          ] as Parameters<typeof LandingNextSteps>[0]['destinations']
        }
      />
    </>
  );
}
