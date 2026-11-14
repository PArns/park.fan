import { getTranslations } from 'next-intl/server';
import {
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  HelpCircle,
  School,
  Trophy,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import {
  FaqList,
  HERO_FLOW_INTO_PULL,
  LandingHero,
  LandingNextSteps,
  Lead,
  P,
  SectionShell,
  type LandingDestination,
} from '@/components/marketing/editorial-ui';
import { cn } from '@/lib/utils';
import { getMediaImage } from '@/lib/media';
import { getMediaAlt } from '@/lib/media/text';
import { versionedSrc } from '@/lib/media/focus';
import { getListFormat } from '@/lib/utils/intl-format';
import { formatParkDay } from '@/lib/utils/park-day';
import { PARK_CALENDAR_SEGMENTS } from '@/lib/parks/calendar-segments';
import { formatHubDate, formatWindow, shortParkName } from '@/lib/trip-regions/hub-data';
import { holidayRegionsFor, percentBelowAverage } from '@/lib/trip-regions/plan-when';
import { plannerHrefOn, type PlanSearchRange } from '@/lib/trip-regions/plan-query';
import { tripRegionBestTimePath, tripRegionPath } from '@/lib/trip-regions/paths';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';
import { ownWords } from '@/lib/trip-regions/region-words';
import { bestTimePageOf, requireTripRegion } from '@/lib/trip-regions/registry';
import {
  BEST_TIME_TRIP_DAYS,
  flatStretch,
  holidayWeek,
  lastYearFrom,
  meanWeekWait,
  monthRows,
  partySeasons,
  planOrder,
  wettestMonths,
  windowList,
  type BestTimePageId,
} from '@/lib/trip-regions/best-time';
import type {
  TripMonth,
  TripRegion,
  TripSchoolBreaks,
  TripWhenWindow,
  TripWhenWithMonths,
} from '@/lib/trip-regions/types';
import {
  BestWorstWeeks,
  MonthRows,
  SchoolHolidayLinks,
  WindowCards,
  YearStrip,
  bestTimeLabels,
  climatePeriod,
} from './best-time-chapters';

/**
 * A week counts as busy when it runs this much above the year's mean: about the busiest tenth of
 * the year's weeks. Last year's measured weeks spread far wider than the forecast did, so a tenth
 * above the mean no longer sets a week apart.
 */
const BUSY_RATIO = 1.2;

/** What the route read and resolved, handed to the page body. */
export interface BestTimePageProps {
  locale: string;
  page: BestTimePageId;
  year: number;
  range: PlanSearchRange;
  todayIso: string;
  current: TripMonth;
  region: TripRegion;
  parks: string[];
  when: TripWhenWithMonths;
  schoolBreaks: TripSchoolBreaks | null;
  /** The three windows of the first answer, best first. */
  windows: TripWhenWindow[];
}

/**
 * A region's best-time page body (`/orlando/<best-time segment>[/<resort>]`), a hub by the landing
 * anatomy: head with the answer, intro, four chapters, FAQ, next steps. Which pages a region has,
 * their photos and parks are its registry entry's `bestTime`; the titles, the intro and the FAQ
 * are its own copy. See docs/features/orlando-best-time.md.
 */
export async function BestTimePage(props: BestTimePageProps) {
  const { locale, page, year, range, todayIso, current, region, parks, when, windows } = props;
  const config = requireTripRegion(region.slug);
  const pageConfig = bestTimePageOf(config, page);
  const [t, tOwn, tWhen, tHub, tHubOwn, tLanding, tNavOwn, labels] = await Promise.all([
    getTranslations({ locale, namespace: 'tripBestTime' }),
    getRegionTranslations(region.slug, 'bestTime', locale),
    getTranslations({ locale, namespace: 'tripPlanner.when' }),
    getTranslations({ locale, namespace: 'tripHub' }),
    getRegionTranslations(region.slug, 'hub', locale),
    getTranslations({ locale, namespace: 'landing' }),
    getRegionTranslations(region.slug, 'nav', locale),
    bestTimeLabels(locale),
  ]);
  const days = BEST_TIME_TRIP_DAYS;
  const parkName = (slug: string) =>
    shortParkName(region.parks.find((p) => p.slug === slug)?.name ?? slug);
  const resortName = tOwn(`resort.${page}`);
  const heroImage = pageConfig?.photo ?? config.bestTime[0]?.photo ?? '';
  const image = getMediaImage(heroImage);
  const hubPath = tripRegionPath(region.slug, locale);
  const top = windows[0];
  const action = top
    ? {
        href: plannerHrefOn(hubPath, { from: top.from, to: top.to, parks }),
        label: tWhen('plan'),
        icon: CalendarPlus,
      }
    : {
        href: plannerHrefOn(hubPath, { parks }),
        label: tHub('plan'),
        icon: CalendarPlus,
      };
  const turn = lastYearFrom(when);
  const lastYearShown = windows.some((w) => w.basis !== 'forecast');
  const rows = monthRows(when, todayIso);
  const regions = props.schoolBreaks?.regions ?? [];
  const countryOrder = holidayRegionsFor(props.schoolBreaks ?? undefined, locale).map(
    (c) => c.country
  );
  const faq = buildFaq({
    ...props,
    t: tOwn,
    stormSeason: config.stormSeason,
    parkName,
    labels,
    lastYearNote: tHub('when.lastYearNote'),
  });

  const calendarPark = pageConfig?.calendarPark;
  const calendarParkRow = calendarPark && region.parks.find((p) => p.slug === calendarPark);
  const destinations: LandingDestination[] = [
    action,
    { href: hubPath, label: tHubOwn('title'), icon: CalendarDays },
    ...(calendarParkRow
      ? [
          {
            href: `${calendarParkRow.path}/${PARK_CALENDAR_SEGMENTS[locale as keyof typeof PARK_CALENDAR_SEGMENTS]}`,
            label: tHub('next.parkCalendar', { park: shortParkName(calendarParkRow.name) }),
            icon: CalendarRange,
          },
        ]
      : []),
  ];

  // Where the year is flat around the first window, say so rather than rank a tie.
  const flat = windows[0] ? flatStretch(when.weeks, windows[0].from) : null;
  return (
    <>
      <LandingHero
        kicker={`park.fan · ${ownWords(tNavOwn, 'name') ?? region.name}`}
        title={tOwn(`title.${page}`, { year })}
        tagline={
          windows.length
            ? `${t('answer.sentence', { days, year, windows: windowList(windows, locale) })}${
                flat
                  ? ` ${t('answer.flat', {
                      from: formatHubDate(flat.from, locale, 'dayMonth'),
                      to: formatHubDate(flat.to, locale, 'dayMonth'),
                      minutes: flat.minutes,
                    })}`
                  : ''
              }${lastYearShown ? ` ${tHub('when.lastYearNote')}` : ''}`
            : t('answer.none', { days, year })
        }
        // A page whose photo the media database does not hold yet gets the gradient head.
        imageSrc={image ? versionedSrc(image) : undefined}
        imageAlt={image ? (getMediaAlt(heroImage, locale) ?? '') : undefined}
        scrollLabel={tLanding('scroll')}
        action={action}
        flowInto
      />

      <div
        id="start"
        className={cn('relative space-y-16 pt-0 sm:space-y-24 sm:pt-20', HERO_FLOW_INTO_PULL)}
      >
        {windows.length > 0 && (
          <div className="container mx-auto px-4">
            <WindowCards
              regionSlug={region.slug}
              windows={windows}
              seasons={when.seasons}
              parks={parks}
              year={year}
              locale={locale}
              seasonLabel={labels.seasonLabel}
            />
          </div>
        )}

        <div className="container mx-auto space-y-4 px-4">
          <Lead>{tOwn('intro.lead')}</Lead>
          <P>
            {turn
              ? tOwn('intro.body', { date: formatParkDay(locale, addDayBefore(turn)) })
              : tOwn('intro.bodyForecast')}
          </P>
          <nav aria-label={t('switcher')}>
            <ul className="flex flex-wrap gap-2">
              {config.bestTime.map(({ id: p }) => (
                <li key={p}>
                  <Link
                    href={tripRegionBestTimePath(region.slug, locale, p)}
                    prefetch={false}
                    aria-current={p === page ? 'page' : undefined}
                    className={cn(
                      'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium',
                      p === page
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted'
                    )}
                  >
                    {tOwn(`resort.${p}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <SectionShell id="year" index="01" title={t('strip.title')} icon={CalendarRange}>
          <P>{t('strip.lead', { parks: resortName, year })}</P>
          <YearStrip
            when={when}
            windows={windows}
            weather={region.weather}
            caption={t('strip.caption', { parks: resortName, year })}
            locale={locale}
          />
        </SectionShell>

        <SectionShell id="months" index="02" title={t('months.title')} icon={CalendarDays}>
          <MonthRows
            regionSlug={region.slug}
            weather={region.weather}
            rows={rows}
            when={when}
            regions={regions}
            countries={countryOrder}
            current={current}
            locale={locale}
            seasonLabel={labels.seasonLabel}
            seasonStatus={labels.seasonStatus}
          />
        </SectionShell>

        <SectionShell id="weeks" index="03" title={t('weeks.title')} icon={Trophy}>
          <BestWorstWeeks
            regionSlug={region.slug}
            when={when}
            windows={windows}
            range={range}
            locale={locale}
            seasonLabel={labels.seasonLabel}
          />
        </SectionShell>

        {regions.length > 0 && (
          <SectionShell id="school-holidays" index="04" title={t('holidays.title')} icon={School}>
            <P>{t('holidays.lead', { days })}</P>
            <p className="text-muted-foreground text-sm">{t('holidays.note', { days })}</p>
            <SchoolHolidayLinks
              regionSlug={region.slug}
              regions={regions}
              countries={countryOrder}
              openCountry={new Intl.Locale(locale).maximize().region}
              range={range}
              days={days}
              parks={parks}
              year={year}
              locale={locale}
            />
          </SectionShell>
        )}

        {faq.length > 0 && (
          <SectionShell
            id="faq"
            index={regions.length > 0 ? '05' : '04'}
            title={tOwn('faq.title')}
            icon={HelpCircle}
          >
            <FaqList items={faq} />
          </SectionShell>
        )}

        <LandingNextSteps
          title={tHubOwn('next.title')}
          body={tHub('next.body')}
          destinations={
            destinations as
              | [LandingDestination]
              | [LandingDestination, LandingDestination]
              | [LandingDestination, LandingDestination, LandingDestination]
          }
        />
      </div>
    </>
  );
}

/** The day before a `YYYY-MM-DD`: the forecast's last day when last year begins on `date`. */
function addDayBefore(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * The FAQ, every answer built from the figures on the page; a question whose figure is missing is
 * left out rather than answered in general terms.
 */
function buildFaq({
  locale,
  page,
  year,
  region,
  parks,
  when,
  windows,
  t,
  parkName,
  labels,
  lastYearNote,
  stormSeason,
}: BestTimePageProps & {
  lastYearNote: string;
  /** The region's own best-time copy (`tripRegions.<slug>.bestTime`). */
  t: Awaited<ReturnType<typeof getRegionTranslations>>;
  stormSeason: 'hurricane' | 'typhoon' | undefined;
  parkName: (slug: string) => string;
  labels: Awaited<ReturnType<typeof bestTimeLabels>>;
}): Array<{ question: string; answer: string }> {
  const items: Array<{ question: string; answer: string }> = [];
  const days = BEST_TIME_TRIP_DAYS;
  const longDay = (date: string) => formatParkDay(locale, date, { day: 'numeric', month: 'long' });
  const list = (parts: string[]) => getListFormat(locale, { type: 'conjunction' }).format(parts);

  const [first, ...others] = windows;
  const below = first ? percentBelowAverage(first) : null;
  if (first && below !== null) {
    items.push({
      question: t(`faq.quietQ.${page}`, { year }),
      answer:
        t('faq.quietA', {
          days,
          date: longDay(first.from),
          minutes: first.headlinerWait,
          percent: below,
          year,
          others: list(others.map((w) => formatWindow(w, locale))),
        }) + (first.basis !== 'forecast' ? ` ${lastYearNote}` : ''),
    });
  }

  const average = meanWeekWait(when.weeks);
  const holiday = holidayWeek(when.weeks);
  if (holiday && average) {
    const values = {
      busy: holiday.week.headlinerWait! >= average * BUSY_RATIO ? 'yes' : 'no',
      date: longDay(holiday.week.start),
      minutes: holiday.week.headlinerWait!,
      average,
      year,
    };
    items.push({
      question: t('faq.christmasQ'),
      answer:
        holiday.holiday === 'christmas' ? t('faq.christmasA', values) : t('faq.newYearA', values),
    });
  }

  const parties = partySeasons(when.seasons, parks);
  if (parties.length) {
    items.push({
      question: t('faq.partyQ'),
      answer: t('faq.partyA', {
        list: parties
          .map((s) =>
            t('faq.partyItem', {
              name: labels.seasonLabel(s),
              park: parkName(s.parkSlug),
              dates: formatWindow({ from: s.startDate, to: s.endDate }, locale),
              status: labels.seasonStatus(s),
            })
          )
          .join('; '),
      }),
    });
  }

  const wettest = wettestMonths(when.months);
  if (stormSeason && t.has(`faq.${stormSeason}Q`) && wettest.length) {
    const monthName = (key: string) => formatParkDay(locale, `${key}-01`, { month: 'long' });
    items.push({
      question: t(`faq.${stormSeason}Q`),
      answer: t(`faq.${stormSeason}A`, {
        months: list(wettest.map((m) => monthName(m.month))),
        rain: Math.round(wettest[0].climate!.precipitationMm),
        period: climatePeriod(wettest[0].climate!.period),
      }),
    });
  }

  const order = first
    ? planOrder(first).filter((p) => region.parks.some((r) => r.slug === p.slug))
    : [];
  if (first && order.length > 1) {
    items.push({
      question: t(`faq.firstQ.${page}`),
      answer: t('faq.firstA', {
        date: longDay(first.from),
        order: list(
          order.map((o) => t('faq.firstItem', { park: parkName(o.slug), date: longDay(o.date) }))
        ),
      }),
    });
  }
  return items;
}
