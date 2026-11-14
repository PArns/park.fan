import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { BookOpen, CalendarDays, CalendarPlus, Sun } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import {
  HERO_FLOW_INTO_PULL,
  LandingHero,
  LandingNextSteps,
} from '@/components/marketing/editorial-ui';
import type { Locale } from '@/i18n/config';
import { resolveEntryForLocale } from '@/lib/blog/listing';
import { postPath } from '@/lib/blog/paths';
import { getMediaImageBySrc } from '@/lib/media';
import { getMediaAlt } from '@/lib/media/text';
import { versionedSrc } from '@/lib/media/focus';
import { cn } from '@/lib/utils';
import {
  dayBasis,
  formatHubDate,
  formatHubMonth,
  glanceDay,
  HUB_WINDOW_DAYS,
  resortMonthSummaries,
  sliceCalendar,
  slimRegion,
} from '@/lib/trip-regions/hub-data';
import { bestTimeYear } from '@/lib/trip-regions/best-time';
import { lastYearStart } from '@/lib/trip-regions/plan-copy';
import {
  monthKey,
  TRIP_CALENDAR_ID,
  TRIP_PLANNER_ID,
  tripRegionBestTimePath,
  tripRegionPath,
} from '@/lib/trip-regions/paths';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';
import { ownWords } from '@/lib/trip-regions/region-words';
import { requireTripRegion } from '@/lib/trip-regions/registry';
import type {
  TripMonth,
  TripBestDays,
  TripCalendar,
  TripForecastAccuracy,
  TripRegion,
  TripWhen,
} from '@/lib/trip-regions/types';
import { HubAccuracy } from './hub-accuracy';
import { HubCalendar } from './hub-calendar';
import { HubFaq } from './hub-faq';
import { HubGlance, MonthGlance } from './hub-glance';
import { HubLegend } from './hub-legend';
import { HubMonthIndex } from './hub-month-index';
import { PlannerChapterSlot } from './planner-chapter-slot';
import { HubWhen } from './hub-when';
import { HubHeroActions } from './hub-hero-action';
import { HubFinalCta } from './hub-final-cta';
import { HubHowItWorks } from './hub-how-it-works';
import { HubResorts } from './hub-resorts';
import { HubPlanFold, HubTripProvider } from './hub-trip-state';

/**
 * The hero photo: the first of the region's `hub.heroPhotos` the media database still has, with
 * its credit and alt from there. Without one the head draws the brand gradient.
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
  /**
   * The forecast's measured error, a read the route started and bounded; the hub awaits it only
   * inside `<Suspense>`. A month page passes `null`: the figure is the region's, not the month's.
   */
  accuracy: Promise<TripForecastAccuracy | null>;
}

/**
 * A region's hub and its month pages, one anatomy (docs/product/landing-pages.md), a landing page
 * around the trip planner. The head asks the visitor's question, says in one line what the page
 * holds, and offers the planner and the calendar, with the answer under them: the best park per
 * resort and the quietest days ahead. Then 01 how the planner plans a trip (its four steps) and the
 * planner, 02 the calendar with its key and the month index, 03 the resorts with each park's
 * calendar, 04 the best time to go (where the region has best-time pages), 05 the questions, the
 * closing call and the band, which ends on the region's travel guide while that post is served.
 *
 * Two states (`HubTripProvider`): the served HTML is always the landing page; with a plan in the
 * address bar or remembered in this browser, chapter 01 is the plan, the head's buttons lead to it
 * and the calendar and the resorts fold into a line each. A block without the region's words draws
 * nothing. Every sentence and every day of the window are in the served HTML.
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
  accuracy,
}: TripRegionHubPageProps) {
  const t = await getTranslations('tripHub');
  const tRegion = await getRegionTranslations(region.slug, 'hub');
  const tNav = await getRegionTranslations(region.slug, 'nav');
  const config = requireTripRegion(region.slug);
  const monthLabel = month ? formatHubMonth(month.year, month.month, locale) : null;
  const hero = heroPhoto(config.hub.heroPhotos, locale);

  const summaries = calendar ? resortMonthSummaries(region, calendar, bestDays) : [];
  const firstFrom = calendar?.days.find((d) => d.date >= todayIso)?.date ?? todayIso;
  const windowDays = calendar?.days.filter((d) => d.date >= firstFrom) ?? [];
  const lastYearDays = calendar?.days.filter((d) => dayBasis(d) === 'last_year') ?? [];
  const lastYear = !!calendar && lastYearDays.length > calendar.days.length / 2;
  const lastYearFrom = calendar
    ? lastYearStart(calendar.days, (d) => dayBasis(d) === 'last_year')
    : null;
  const pagePath = tripRegionPath(region.slug, locale, month);
  const bestTimePath = tripRegionBestTimePath(region.slug, locale);
  const planHref = `${pagePath}#${TRIP_PLANNER_ID}`;

  const title = monthLabel ? tRegion('monthTitle', { month: monthLabel }) : tRegion('title');
  // The month is in the H1's first line already; a second mention would read twice in the element.
  const question = t('question');
  const tagline = monthLabel
    ? ownWords(tRegion, 'leadMonth', { month: monthLabel })
    : ownWords(tRegion, 'lead');
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
      summaries={summaries}
      windowTo={calendar?.meta.to ?? todayIso}
      locale={locale}
    />
  );
  const page = month ? 'month' : 'hub';
  const actions = (
    <HubHeroActions
      planHref={planHref}
      calendarHref={`${pagePath}#${TRIP_CALENDAR_ID}`}
      planLabel={t('plan')}
      calendarLabel={t('toCalendar')}
      region={region.slug}
      page={page}
      locale={locale}
    />
  );

  const whenYear = when ? bestTimeYear(when.meta.from) : null;
  // The best-time chapter needs the region's pages and its words for them; without, it is left out.
  const whenTitle =
    config.bestTime.length > 0
      ? whenYear
        ? ownWords(tRegion, 'when.title', { year: whenYear })
        : ownWords(tRegion, 'when.titleNoYear')
      : null;
  const bestTimeLabel = whenYear
    ? ownWords(tRegion, 'when.pageLink', { year: whenYear })
    : ownWords(tRegion, 'when.pageLinkNoYear');
  const attribution = region.travel.attribution?.trim();
  const sources = calendar
    ? [
        t('calendar.sources', {
          date: formatHubDate(calendar.meta.computedAt.slice(0, 10), locale),
        }),
        ...(attribution ? [t('calendar.sourcesTravel', { attribution })] : []),
      ].join(' · ')
    : null;
  const regionName = ownWords(tNav, 'name') ?? region.name;
  const bandTitle = ownWords(tRegion, 'next.title') ?? t('nextTitle', { region: regionName });
  const guidePost = config.regionGuide
    ? resolveEntryForLocale(config.regionGuide, locale as Locale)
    : null;

  const parkCount = region.parks.length;
  const planner = (
    <PlannerChapterSlot
      index="01"
      region={region}
      locale={locale}
      defaultMonth={month ? monthKey(month) : undefined}
      landing={
        <HubHowItWorks
          region={region.slug}
          shots={config.hub.howItWorks}
          locale={locale}
          planHref={planHref}
          page={page}
        />
      }
    />
  );

  return (
    <HubTripProvider region={region.slug} todayIso={todayIso}>
      <LandingHero
        kicker={title}
        title={title}
        question={question}
        tagline={tagline ?? undefined}
        answer={answer}
        actionElement={actions}
        imageSrc={hero?.src}
        imageAlt={hero?.alt}
        flowInto
        short
      />

      <div
        id="start"
        className={cn(
          'relative container mx-auto px-4 pt-0 pb-16 sm:pt-12 sm:pb-24',
          HERO_FLOW_INTO_PULL
        )}
      >
        <div className="space-y-16 sm:space-y-24">
          {planner}

          <section id={TRIP_CALENDAR_ID} className="scroll-mt-24">
            <ChapterHeading
              index="02"
              icon={CalendarDays}
              kicker={
                calendar
                  ? t('calendar.kicker', {
                      from: formatHubDate(calendar.meta.from, locale),
                      to: formatHubDate(calendar.meta.to, locale),
                    })
                  : undefined
              }
              title={
                monthLabel
                  ? t('calendar.titleMonth', { month: monthLabel })
                  : t('calendar.title', { days: HUB_WINDOW_DAYS })
              }
              hint={t('howItWorks.calendarLead')}
            />
            <HubPlanFold summary={t('howItWorks.calendarFold', { count: parkCount })}>
              {/* Past 60 days a day reads last year's measured figure: said once, not on each square. */}
              {lastYearFrom && (
                <p
                  role="note"
                  className="border-border/60 bg-muted/40 mb-4 max-w-3xl rounded-xl border px-4 py-3 text-sm leading-relaxed"
                >
                  {t('lastYearFrom', {
                    date: formatHubDate(lastYearFrom.from, locale, 'dayMonth'),
                  })}
                </p>
              )}
              {calendar && windowDays.length > 0 ? (
                <HubCalendar
                  region={slimRegion(region)}
                  // The whole window from today, the hub's 30 days or the month: a week shows at a
                  // time, and the others stay in the served HTML for a reader without script.
                  calendar={sliceCalendar(calendar, windowDays)}
                  todayIso={todayIso}
                  locale={locale}
                  legend={<HubLegend />}
                />
              ) : (
                <p className="text-muted-foreground">{t('calendar.unavailable')}</p>
              )}
              {sources && (
                <p className="text-muted-foreground mt-4 text-xs leading-relaxed">{sources}</p>
              )}
              <Suspense fallback={null}>
                <HubAccuracy region={region.slug} accuracy={accuracy} />
              </Suspense>
              <HubMonthIndex
                region={region.slug}
                current={current}
                active={month}
                locale={locale}
                className="mt-8"
              />
            </HubPlanFold>
          </section>

          <HubResorts
            index="03"
            region={region}
            hub={config.hub}
            bestDays={bestDays}
            locale={locale}
          />

          {whenTitle && (
            <section className="scroll-mt-24" id="best-time">
              <ChapterHeading
                index="04"
                icon={Sun}
                kicker={ownWords(tRegion, 'when.kicker') ?? undefined}
                title={whenTitle}
              />
              <HubWhen region={region.slug} when={when} pagePath={pagePath} locale={locale} />
            </section>
          )}

          {/* The questions wait for the measured error, bounded; the page above never does. */}
          <Suspense fallback={null}>
            <HubFaq
              index={whenTitle ? '05' : '04'}
              region={region}
              calendar={calendar}
              summaries={summaries}
              monthLabel={monthLabel}
              accuracy={accuracy}
              locale={locale}
            />
          </Suspense>

          <HubFinalCta
            region={region.slug}
            scene={config.hub.scene}
            locale={locale}
            planHref={planHref}
            page={page}
          />
        </div>
      </div>

      <LandingNextSteps
        title={bandTitle}
        destinations={
          [
            { href: planHref, label: t('plan'), icon: CalendarPlus },
            ...(whenTitle && bestTimeLabel
              ? [{ href: bestTimePath, label: bestTimeLabel, icon: Sun }]
              : []),
            ...(guidePost
              ? [
                  {
                    href: postPath({ slug: guidePost.entry.slug, frontmatter: guidePost.entry.fm }),
                    label: t('regionGuide', { region: regionName }),
                    icon: BookOpen,
                  },
                ]
              : []),
          ] as Parameters<typeof LandingNextSteps>[0]['destinations']
        }
      />
    </HubTripProvider>
  );
}
