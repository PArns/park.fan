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
import { formatWindow, shortParkName } from '@/lib/orlando/hub-data';
import { holidayRegionsFor, percentBelowAverage } from '@/lib/orlando/plan-when';
import { orlandoPlannerHref, type PlanSearchRange } from '@/lib/orlando/plan-query';
import { orlandoBestTimePath, orlandoPath } from '@/lib/orlando/paths';
import {
  BEST_TIME_HOLIDAY_COUNTRIES,
  BEST_TIME_TRIP_DAYS,
  ORLANDO_BEST_TIME_RESORTS,
  bestTimeResort,
  holidayWeek,
  lastYearFrom,
  meanWeekWait,
  monthRows,
  partySeasons,
  planOrder,
  wettestMonths,
  windowList,
  type OrlandoBestTimePage,
} from '@/lib/orlando/best-time';
import type {
  OrlandoMonth,
  TripRegion,
  TripSchoolBreaks,
  TripWhenWindow,
  TripWhenWithMonths,
} from '@/lib/orlando/types';
import {
  BestWorstWeeks,
  MonthRows,
  SchoolHolidayLinks,
  WindowCards,
  YearStrip,
  bestTimeLabels,
  climatePeriod,
} from './best-time-chapters';

/** The hero photo per page, by media id; the credit and alt come from the media database. */
const HERO_IMAGE: Record<OrlandoBestTimePage, string> = {
  orlando: 'disney-hollywood-studios/fantasmic-crowd',
  'disney-world': 'disney-animal-kingdom/kunst-des-wartens-cover',
  'universal-orlando': 'universal-islands-of-adventure/welcome-cover',
};

/** The park whose crowd calendar a resort page offers as its third next step. */
const RESORT_CALENDAR_PARK: Partial<Record<OrlandoBestTimePage, string>> = {
  'disney-world': 'magic-kingdom-park',
  'universal-orlando': 'universal-epic-universe',
};

/** A week counts as busy when it runs this much above the year's mean. */
const BUSY_RATIO = 1.1;

/** What the route read and resolved, handed to the page body. */
export interface BestTimePageProps {
  locale: string;
  page: OrlandoBestTimePage;
  year: number;
  range: PlanSearchRange;
  todayIso: string;
  current: OrlandoMonth;
  region: TripRegion;
  parks: string[];
  when: TripWhenWithMonths;
  schoolBreaks: TripSchoolBreaks | null;
  /** The three windows of the first answer, best first. */
  windows: TripWhenWindow[];
}

/**
 * Orlando's best-time page body (`/orlando/<best-time segment>[/<resort>]`), a hub by the landing
 * anatomy: head with the answer, intro, four chapters, FAQ, next steps. See
 * docs/features/orlando-best-time.md.
 */
export async function BestTimePage(props: BestTimePageProps) {
  const { locale, page, year, range, todayIso, current, region, parks, when, windows } = props;
  const [t, tWhen, tHub, tLanding, labels] = await Promise.all([
    getTranslations({ locale, namespace: 'orlandoBestTime' }),
    getTranslations({ locale, namespace: 'orlandoPlanner.when' }),
    getTranslations({ locale, namespace: 'orlando' }),
    getTranslations({ locale, namespace: 'landing' }),
    bestTimeLabels(locale),
  ]);
  const days = BEST_TIME_TRIP_DAYS;
  const parkName = (slug: string) =>
    shortParkName(region.parks.find((p) => p.slug === slug)?.name ?? slug);
  const resortName = t(`resort.${page}`);
  const image = getMediaImage(HERO_IMAGE[page]);
  const top = windows[0];
  const action = top
    ? {
        href: orlandoPlannerHref({ from: top.from, to: top.to, parks }),
        label: tWhen('plan'),
        icon: CalendarPlus,
      }
    : {
        href: orlandoPlannerHref({ parks }),
        label: tLanding('orlando.action'),
        icon: CalendarPlus,
      };
  const turn = lastYearFrom(when);
  const lastYearShown = windows.some((w) => w.basis !== 'forecast');
  const rows = monthRows(when, todayIso);
  const regions = props.schoolBreaks?.regions ?? [];
  const countryOrder = holidayRegionsFor(locale)
    .map((g) => g.country)
    .filter((c) => (BEST_TIME_HOLIDAY_COUNTRIES as readonly string[]).includes(c));
  const faq = buildFaq({ ...props, t, parkName, labels, lastYearNote: tHub('when.lastYearNote') });

  const calendarPark = RESORT_CALENDAR_PARK[page];
  const calendarParkRow = calendarPark && region.parks.find((p) => p.slug === calendarPark);
  const destinations: LandingDestination[] = [
    action,
    { href: orlandoPath(), label: tHub('title'), icon: CalendarDays },
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

  return (
    <>
      <LandingHero
        kicker={tLanding('orlando.kicker')}
        title={t(`title.${page}`, { year })}
        tagline={
          windows.length
            ? `${t('answer.sentence', { days, year, windows: windowList(windows, locale) })}${
                lastYearShown ? ` ${tHub('when.lastYearNote')}` : ''
              }`
            : t('answer.none', { days, year })
        }
        imageSrc={
          image ? versionedSrc(image) : '/media/disney-hollywood-studios/fantasmic-crowd.jpg'
        }
        imageAlt={getMediaAlt(HERO_IMAGE[page], locale) ?? ''}
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
          <Lead>{t('intro.lead')}</Lead>
          <P>
            {turn
              ? t('intro.body', { date: formatParkDay(locale, addDayBefore(turn)) })
              : t('intro.bodyForecast')}
          </P>
          <nav aria-label={t('switcher')}>
            <ul className="flex flex-wrap gap-2">
              {(['orlando', ...ORLANDO_BEST_TIME_RESORTS] as const).map((p) => (
                <li key={p}>
                  <Link
                    href={orlandoBestTimePath(locale, bestTimeResort(p))}
                    prefetch={false}
                    aria-current={p === page ? 'page' : undefined}
                    className={cn(
                      'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium',
                      p === page
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted'
                    )}
                  >
                    {t(`resort.${p}`)}
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
            caption={t('strip.caption', { parks: resortName, year })}
            locale={locale}
          />
        </SectionShell>

        <SectionShell id="months" index="02" title={t('months.title')} icon={CalendarDays}>
          <P>{t('months.lead', { year })}</P>
          <MonthRows
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
          <P>{t('weeks.lead', { year })}</P>
          <BestWorstWeeks
            when={when}
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
            title={t('faq.title')}
            icon={HelpCircle}
          >
            <FaqList items={faq} />
          </SectionShell>
        )}

        <LandingNextSteps
          title={tHub('next.title')}
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
}: BestTimePageProps & {
  lastYearNote: string;
  t: Awaited<ReturnType<typeof getTranslations<'orlandoBestTime'>>>;
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
  if (wettest.length) {
    const monthName = (key: string) => formatParkDay(locale, `${key}-01`, { month: 'long' });
    items.push({
      question: t('faq.hurricaneQ'),
      answer: t('faq.hurricaneA', {
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
