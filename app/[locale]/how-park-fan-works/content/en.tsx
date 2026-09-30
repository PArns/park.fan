import { Link } from '@/i18n/navigation';
import {
  A,
  SectionShell,
  Lead,
  P,
  PG,
  Highlight,
  IngredientGrid,
  IngredientCard,
  TouchpointGrid,
  FaqList,
} from '@/components/marketing/editorial-ui';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { PLANNER_SEGMENTS } from '@/lib/planner/segments';
import { HOWTO_CHAPTERS } from '@/lib/howto/chapters';
import {
  Activity,
  BarChart3,
  CalendarClock,
  CalendarDays,
  CloudSun,
  Database,
  Gauge,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  Ruler,
  Search,
  Sparkles,
  Star,
  Sunrise,
} from 'lucide-react';
import {
  BadgeRowDemo,
  BareNumberVsCard,
  CalendarDaysDemo,
  DemoFrame,
  LiveHourlyProfile,
  LiveTopAttractions,
  NoWaitTimesDemo,
  OffSeasonDemo,
  PlannerDayFigure,
  RopeDropDemo,
  TwoRidesDemo,
  TypicalWaitsDemo,
} from '../_demos';
import {
  AnatomyAttractionDemo,
  AnatomyBestDaysDemo,
  AnatomyBlogDemo,
  AnatomyCalendarDemo,
  AnatomyHeaderDemo,
  AnatomyHolidayDemo,
  AnatomyNearbyDemo,
  AnatomyPurchasesDemo,
  AnatomySeasonDemo,
  AnatomyShowsDemo,
  AnatomyStatsDemo,
} from '../_anatomy-demos';
import { WeatherWarningBannerDemo } from '@/components/parks/weather-warning-banner-demo';
import { NowcastBannerDemo } from '@/components/parks/nowcast-banner-demo';
import { WeatherCardShowcase } from '@/components/parks/weather-card-demo';
import { WaitScaleBar, WaitScaleStage, type WaitScaleStep } from '../_wait-scale';
import { NightShift, type NightShiftJob } from '../_night-shift';
import { Ambience, ClosingBand, IntroWithAside, ParkAnatomy, type AnatomyStep } from '../_chrome';
import { ChapterRail } from '../_chapter-rail';
import {
  TARON_BASELINE,
  TARON_RECORD,
  TARON_WAIT_NOW,
  TARON_WEEKDAY_DAYS,
  TARON_WEEKEND_DAYS,
  WAIT_SCALE_MAX,
} from '../_fixtures';

/** See `HOWTO_CHAPTERS`: the ids there must match the `<SectionShell>` calls below. */
const CHAPTERS = HOWTO_CHAPTERS.en;

const PARK = '/parks/europe/germany/bruehl/phantasialand';
const TARON = `${PARK}/taron`;

const SCALE_LABELS = {
  typical: 'Typical',
  busy: 'Busy',
  unit: 'min',
  days: 'days measured',
  record: 'Record',
  summary:
    'Taron on {label}: typically {typical} minutes, {busy} on busy days, measured across {days} days. At the entrance it says {wait} minutes.',
};

const SCALE_LEGEND = [
  {
    term: 'Typical',
    def: 'On half the days measured, the longest queue was shorter than this.',
    swatch: 'bg-primary/45',
  },
  {
    term: 'Busy',
    def: 'The busiest day in ten.',
    swatch: 'bg-primary/25',
  },
  {
    term: '70 min',
    def: 'What it says at the entrance.',
    swatch: 'bg-amber-500',
  },
  {
    term: 'Record',
    def: `${TARON_RECORD} minutes on 16 July 2026, the longest wait measured.`,
    swatch: 'bg-foreground/40',
  },
];

/**
 * The three readings, in the order the figure steps through them.
 * Figures from `TARON_TYPICAL_WAITS`, i.e. from the API and not from the story.
 */
const SCALE_STEPS: WaitScaleStep[] = [
  { id: 'monday', label: 'Monday', typical: 55, busy: 70, sampleDays: 21 },
  { id: 'saturday', label: 'Saturday', typical: 70, busy: 85, sampleDays: 20 },
  { id: 'weekday', label: 'Weekdays', typical: 60, busy: 75, sampleDays: 107 },
];

/**
 * The sections of a park page in exactly the order they render
 * (`app/[locale]/parks/.../page.tsx`). Whoever reorders them there reorders
 * them here, or the guide describes a page that does not exist.
 */
const PARK_SECTIONS: AnatomyStep[] = [
  {
    title: 'Header',
    body: 'Name, location and distance, plus status, today’s opening hours, the crowd level and how many rides are open right now.',
    example: 'Phantasialand, Brühl. Open 09:00–19:00 today, 36 of 40 rides running.',
    demo: <AnatomyHeaderDemo />,
  },
  {
    title: 'School holidays in range',
    body: 'Which school holidays and public holidays affect the park today, with its own region first.',
    demo: <AnatomyHolidayDemo />,
    onlyWhen: 'school holidays or a public holiday affect the park today.',
  },
  {
    title: 'Severe weather warning',
    body: 'Official warnings from DWD and MeteoAlarm, word for word.',
    demo: <WeatherWarningBannerDemo />,
    onlyWhen: 'a warning is active for the location.',
  },
  {
    title: 'Rain radar',
    body: 'The next few hours in fifteen-minute steps, so you can see whether a shower will have passed in twenty minutes.',
    demo: <NowcastBannerDemo single />,
    onlyWhen: 'there’s rain nearby.',
  },
  {
    title: 'Weather card',
    body: 'Current weather, the day’s curve and the forecast. The hours the park is open get most of the room on the axis.',
    demo: <WeatherCardShowcase variant="single" />,
  },
  {
    title: 'Skip-the-line prices',
    body: 'Daily prices for paid queue access such as Lightning Lane, with sold-out ones marked.',
    demo: <AnatomyPurchasesDemo />,
    onlyWhen: 'the park publishes them, so far only the Disney parks in the US.',
  },
  {
    title: 'Attractions',
    body: 'Every ride as a card like the ones in chapter 01, searchable and grouped by land. Above them are the rides where it pays to arrive early.',
    example: 'At Phantasialand, Taron is up there with 60 minutes saved.',
    demo: <AnatomyAttractionDemo />,
  },
  {
    title: 'Calendar and map',
    body: 'The daily forecasts from chapter 04 in a month grid, and a map with every ride on it.',
    demo: <AnatomyCalendarDemo />,
  },
  {
    title: 'Shows and restaurants',
    body: 'Showtimes for the whole day, restaurants with opening hours.',
    example: 'Phantasialand has four shows and 46 restaurants.',
    demo: <AnatomyShowsDemo />,
    onlyWhen: 'the park reports any.',
  },
  {
    title: 'Best days',
    body: 'The quietest dates in the next three months and the park’s quietest weekday.',
    demo: <AnatomyBestDaysDemo locale="en" />,
    onlyWhen: 'the park publishes an operating calendar.',
  },
  {
    title: 'Parks nearby',
    body: 'What else is within reach, with distance and status.',
    example:
      'From Phantasialand, Toverland and Movie Park Germany, both a good 90 kilometres away.',
    demo: <AnatomyNearbyDemo />,
    onlyWhen: 'another park is within reach.',
  },
  {
    title: 'Blog',
    body: 'Posts this park appears in.',
    demo: <AnatomyBlogDemo locale="en" />,
    onlyWhen: 'there are any.',
  },
  {
    title: 'Statistics',
    body: 'The park’s longest queues with their typical and busy values, plus the spread across months and weekdays.',
    demo: (
      <AnatomyStatsDemo
        title="Rides with the longest queues"
        labelAttraction="Rides"
        labelMinutes="min"
        labelNow="Now"
        labelP50="Typical"
        labelP90="Peak"
      />
    ),
  },
  {
    title: 'Season, info, questions',
    body: 'Operating season and events, address and time zone, and common questions about this park.',
    example: 'The ice rink from chapter 08 is listed here, running November to January.',
    demo: <AnatomySeasonDemo label="Ice rink" />,
  },
];

const NIGHT_JOBS: NightShiftJob[] = [
  {
    hour: 2,
    minute: 0,
    at: 0.04,
    title: 'What a typical hour looks like',
    body: 'The typical and the busy value for every ride and every hour.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.22,
    title: 'Each park’s normal level',
    body: 'The value the crowd level is measured against.',
  },
  {
    hour: 4,
    minute: 30,
    at: 0.42,
    title: 'Summing up yesterday',
    body: 'The whole previous day in quarter hours.',
  },
  {
    hour: 5,
    minute: 15,
    at: 0.56,
    title: 'Is getting up early worth it?',
    body: 'For each ride, how much an early start saves and how long the head start holds.',
  },
  {
    hour: 5,
    minute: 30,
    at: 0.67,
    title: 'Typical per weekday',
    body: 'The table from chapter 02 for every ride, plus the record.',
  },
  {
    hour: 6,
    minute: 0,
    at: 0.8,
    title: 'The forecast model catches up',
    body: 'It trains on yesterday’s wait times.',
  },
];

const FAQ = [
  {
    question: 'What do “typical” and “busy” mean for a wait time?',
    answer:
      'Typical is the median of the daily peaks: on half the days measured, the longest queue was shorter. Busy is the 90th percentile of the same series, roughly the busiest day in ten. The record is shown separately so that a single outlier can’t move either value.',
  },
  {
    question: 'Is a 70-minute wait a lot?',
    answer:
      'It depends on the ride and on the weekday. At Taron in Phantasialand the Monday peak is typically 55 minutes, so 70 is a lot there. On Saturdays 70 minutes is the median, which makes it a perfectly normal day. Both reference values are on the ride’s own page on park.fan.',
  },
  {
    question: 'Where do the wait times come from?',
    answer:
      'From three public sources: ThemeParks.wiki, Wartezeiten.app and Queue-Times.com. We poll every park every five minutes, and when the sources report different numbers, the majority wins.',
  },
  {
    question: 'Why do some parks say “No forecast”?',
    answer:
      'A crowd level compares the park with its own past, and that takes roughly 30 operating days. For new or rarely open parks we show nothing, because any colour there would be a guess.',
  },
  {
    question: 'Why does Hansa-Park show no wait times?',
    answer:
      'The park shows its wait times only in its own app, and only on the park’s Wi-Fi. There’s no public interface to read them from. That’s why park.fan shows a notice instead of 82 rides that look empty.',
  },
  {
    question: 'What is rope drop?',
    answer:
      'Being at a particular ride the moment the park opens, before the paths fill up. park.fan recommends it when the ride’s peak reaches at least 60 minutes and the early start saves at least 45 of them, and gives a rough idea of how long the head start lasts.',
  },
  {
    question: 'Does park.fan cost anything, and do I need an account?',
    answer:
      'No and no. Everything on park.fan is free and works without signing up. Favourites and day plans are stored in your browser.',
  },
  {
    question: 'How often do the numbers update?',
    answer:
      'An open park page fetches new values every five minutes. We recalculate typical wait times and rope-drop recommendations once a night, because they barely move from one day to the next.',
  },
];

export function ContentEN() {
  const glossary = `/${GLOSSARY_SEGMENTS.en}`;
  const bestTime = `/${BEST_TIME_SEGMENTS.en}`;
  const planner = `/${PLANNER_SEGMENTS.en}`;

  return (
    <>
      <ChapterRail chapters={CHAPTERS} ariaLabel="Chapters" />

      {/* ── Intro ───────────────────────────────────────────────────────── */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          park.fan started in a queue. Taron, mid-afternoon, the display said something with three
          digits, and nobody in the queue could tell whether that was bad luck or just a Tuesday.
        </Lead>
        <P>
          The current wait time is up at the entrance and in the park’s app. On park.fan you also
          see what a normal day at that ride looks like, when its queue gets shorter and which day
          is worth the trip in the first place.
        </P>
        <P>
          The cards, badges and tables further down are park.fan’s own components, fed with fixed
          example numbers from Phantasialand. In the park you’ll have the same cards on your phone,
          with today’s numbers in them.
        </P>

        <Reveal>
          <nav
            aria-label="Chapters"
            className="bg-muted/40 not-prose grid gap-x-6 gap-y-2 rounded-2xl border p-5 text-sm sm:grid-cols-2 lg:grid-cols-3"
          >
            {CHAPTERS.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                className="text-muted-foreground hover:text-primary group flex items-baseline gap-2 transition-colors"
              >
                <span className="text-primary/40 group-hover:text-primary/70 text-xs font-bold tabular-nums transition-colors">
                  {c.index}
                </span>
                {c.label}
              </a>
            ))}
          </nav>
        </Reveal>
      </div>

      {/* ── 01 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="number"
        index="01"
        kicker="The card"
        title="Four readings next to the wait time"
        icon={Gauge}
      >
        <P>
          At the entrance to Taron it says 70 minutes, and nothing about whether to join now or
          after lunch. On park.fan the same number comes with a crowd level, a trend, the
          single-rider queue and the height requirement.
        </P>

        <BareNumberVsCard
          unit="minutes"
          signLabel="What the park posts"
          signCaption="A number with nothing to compare it to."
          cardLabel="What park.fan makes of it"
          cardCaption="The same 70 minutes with crowd level, trend, single-rider wait, height requirement and a note on when it gets quieter."
        />

        <div className="space-y-4 pt-2">
          <P>
            The crowd level compares the number with what’s normal at this ride. Taron averages{' '}
            {TARON_BASELINE} minutes, {TARON_WAIT_NOW} is a good one and a half times that, and
            that’s “Very High”. The small arrow next to it shows whether the queue is growing or
            getting shorter right now.
          </P>
          <PG>
            Where a ride has a single-rider queue, its wait is on the card too. So is the height
            requirement, so you don’t find out at the measuring post that your 130-centimetre child
            is too short.
          </PG>
        </div>

        <DemoFrame
          label="Two rides, the same minute"
          note="Taron and Black Mamba at the same moment. One queue is growing, the other is getting shorter. On the park page every ride is listed like this, grouped by land."
          href={PARK}
          hrefLabel="Phantasialand on park.fan →"
        >
          <TwoRidesDemo />
        </DemoFrame>
      </SectionShell>

      {/* ── 02 ──────────────────────────────────────────────────────────── */}
      <Ambience>
        <SectionShell
          id="scale"
          index="02"
          kicker="The scale"
          title="Typical, busy, record"
          icon={Ruler}
        >
          <IntroWithAside
            value={`${TARON_RECORD} min`}
            label="Taron’s longest measured queue"
            note="On 16 July 2026, in the summer holidays. It was a single day, so it’s shown separately as the record and kept out of the scale."
          >
            <P>
              To judge whether 70 minutes is a lot, you need two reference values. Typical is how
              long the day’s longest queue at this ride usually gets. Busy is how long it got on the
              busiest ten percent of days.
            </P>
          </IntroWithAside>

          <div className="pt-2">
            <WaitScaleStage
              steps={SCALE_STEPS}
              wait={TARON_WAIT_NOW}
              max={WAIT_SCALE_MAX}
              record={TARON_RECORD}
              labels={SCALE_LABELS}
              legend={SCALE_LEGEND}
            >
              {SCALE_STEPS.map((step, i) => (
                <div key={step.id} data-wait-step={step.id} className="scroll-mt-28">
                  <div className="text-primary mb-2 text-xs font-semibold tracking-widest uppercase">
                    {step.label}
                  </div>
                  <h3 className="mb-3 text-xl font-bold sm:text-2xl">
                    {i === 0 && 'For a Monday, 70 minutes is a lot'}
                    {i === 1 && 'On a Saturday, 70 minutes is normal'}
                    {i === 2 && 'And once it was 135'}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {i === 0 && (
                      <>
                        On Mondays the daily peak is typically {step.typical} minutes, and on nine
                        Mondays out of ten it stays at {step.busy} or below. If you see{' '}
                        {TARON_WAIT_NOW} today, you’ve caught one of the busy Mondays.
                      </>
                    )}
                    {i === 1 && (
                      <>
                        On Saturdays {step.typical} minutes is the median. The same number is
                        perfectly normal on this day, and the rides next door are just as busy.
                      </>
                    )}
                    {i === 2 && (
                      <>
                        On weekdays the peak is typically {step.typical} minutes. The dashed line at
                        the far end is the record of {TARON_RECORD} minutes on 16 July. A day like
                        that would skew an average, which is why “busy” works from the busiest ten
                        percent of days instead of the maximum.
                      </>
                    )}
                  </p>

                  {/* Below lg every step carries its own scale: there is no
                    pinned figure there that could change. */}
                  <WaitScaleBar
                    step={step}
                    wait={TARON_WAIT_NOW}
                    max={WAIT_SCALE_MAX}
                    record={TARON_RECORD}
                    labels={SCALE_LABELS}
                    className="bg-card/60 mt-5 rounded-2xl border p-5 lg:hidden"
                  />
                </div>
              ))}
            </WaitScaleStage>
          </div>

          {/* Card left, prose right. The card is a park-page sidebar component and
              looks absurd stretched across a 1500 px column, so it keeps its own
              width and the text takes the rest instead of leaving a hole. */}
          <div className="grid items-start gap-8 pt-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
            <DemoFrame
              label="On a ride’s own page"
              note="Taron’s values as the API returned them on 10 September 2026."
              href={TARON}
              hrefLabel="Live values for Taron →"
            >
              <TypicalWaitsDemo />
            </DemoFrame>

            <div className="space-y-4">
              <P>
                Every ride’s page has this scale weekday by weekday. The number above each bar is
                the busy value, the solid part below it the typical one, and at the bottom is the
                record with its date.
              </P>
              <P>
                Saturday is the only day on which Taron’s {TARON_WAIT_NOW} minutes land right in the
                middle. It’s worked out from {TARON_WEEKDAY_DAYS} days measured on weekdays and{' '}
                {TARON_WEEKEND_DAYS} at weekends.
              </P>
            </div>
          </div>

          <DemoFrame
            label="The same table for the whole park, live"
            note="The current state for Phantasialand, with the typical and the busy value for each ride."
            href={PARK}
            hrefLabel="Phantasialand on park.fan →"
          >
            <LiveTopAttractions locale="en" />
          </DemoFrame>
        </SectionShell>
      </Ambience>

      {/* ── 03 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="moment"
        index="03"
        kicker="The time of day"
        title="The best moment of the day"
        icon={Sunrise}
      >
        <P>
          “Get there early” only helps if the queue grows over the course of the day, and it doesn’t
          at every ride. Six rides from the same park, hour by hour:
        </P>

        <DemoFrame
          label="The hourly profile, right now"
          note="Live from the park’s hourly profile. Each ride’s busiest hour is in bold."
          href={PARK}
          hrefLabel="Phantasialand on park.fan →"
        >
          <LiveHourlyProfile locale="en" />
        </DemoFrame>

        <div className="space-y-4 pt-2">
          <P>
            At Taron the time of day barely matters. The values stay in a narrow band all day, and
            what makes the difference is the weekday from chapter 02. Chiapas, on the other hand,
            gets clearly busier into the afternoon. That’s why we work out the best moment for each
            ride separately.
          </P>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <DemoFrame
            label="The recommendation that comes out of it"
            note="It’s only recommended when the ride’s peak reaches at least 60 minutes and the early start saves at least 45 of them."
          >
            <RopeDropDemo />
          </DemoFrame>

          <div className="space-y-4">
            <PG>
              The card lists the typical wait at opening, the daily peak, how much you save and
              until when the head start holds.
            </PG>
            <P>
              If a ride’s quietest time falls somewhere else, in the evening for instance, that’s on
              the card as well. The park page lists the rides where getting up early pays off most,
              sorted by minutes saved.
            </P>
          </div>
        </div>
      </SectionShell>

      {/* ── 04 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="day"
        index="04"
        kicker="The date"
        title="The right day, months ahead"
        icon={CalendarDays}
      >
        <P>
          The date decides more than the time of day. Two days in the same week can be half an hour
          of average wait apart, depending on school holidays, public holidays, bridge days and the
          weather.
        </P>

        <DemoFrame
          label="Four days from the autumn holidays"
          note="15 October is the quietest of the four, even though it’s in the middle of the holidays, because it’s raining. On the 19th the park is closed. On park.fan the same calendar runs month by month."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        {/* One column, full width, like every other chapter on this page. As two
            prose columns this band put a third text edge under the paragraph above
            it: a run of copy, then a 604 px column ending short of it, then a
            second column starting where that paragraph still had words. */}
        <div className="space-y-4 pt-2">
          <P>
            The neighbours’ holidays often count as much as the local ones, because day guests don’t
            stop at borders. Phantasialand is about 90 kilometres from the Netherlands, and in its
            calendar you’ll find the holidays of the Dutch province of Gelderland next to those of
            North Rhine-Westphalia. Holiday regions within roughly 200 kilometres get a marker of
            their own.
          </P>
          <PG>
            The colour of a day is a forecast. How accurate our forecasts are is worked out in
            public on the Fancast page.
          </PG>
          <P>
            For a park that’s open all year, the calendar reaches about eleven months ahead. For a
            seasonal park it ends with the published season, and a day on which the park is shut is
            marked as closed.
          </P>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/fancast"
            prefetch={false}
            className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            How well the model does
          </Link>
          <Link
            href={bestTime}
            prefetch={false}
            className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
          >
            <CalendarDays className="h-4 w-4" />
            Best time to visit, park by park
          </Link>
        </div>
      </SectionShell>

      {/* ── 05 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="day-plan"
        index="05"
        kicker="The planner"
        title="Playing the day through beforehand"
        icon={CalendarClock}
      >
        <P>
          In the trip planner you lay out the rides you want to do on a timeline. Each block is as
          tall as the wait predicted for its hour, and between two blocks you can see whether
          there’s enough time for the walk.
        </P>
        <P>
          Below is a plan for Phantasialand on Saturday 12 September 2026, using the forecast from 4
          September. Drag a block to another time and its height changes, and so do the transfers.
          Your own plan stays untouched.
        </P>

        <DemoFrame
          label="A planned Saturday"
          href={planner}
          hrefLabel="To the trip planner →"
          className="mx-auto max-w-[560px]"
        >
          <PlannerDayFigure />
        </DemoFrame>

        <P>
          Everything else in the planner, such as marking rides by height requirement or sorting the
          day at the press of a button, is described on the <A href={planner}>trip planner page</A>.
        </P>
      </SectionShell>

      {/* ── 06 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="park-page"
        index="06"
        kicker="The walk-through"
        title="A park page, top to bottom"
        icon={Layers}
      >
        <P>
          Everything from the first chapters sits on one page per park, in the order people ask: is
          the park open today? Is it about to rain? How long is the queue? And when should I have
          come instead?
        </P>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
          <ParkAnatomy onlyWhenLabel="Only when:" steps={PARK_SECTIONS} />

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Highlight>
              Half of these sections only appear when there’s something to show. A park with no
              shows gets no empty shows tab.
            </Highlight>
            <PG>
              The selected tab is part of the address. Send someone the link to the calendar and
              they’ll open the calendar, not the ride list.
            </PG>
            <div className="pt-1">
              <Link
                href={PARK}
                prefetch={false}
                className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              >
                <Activity className="h-4 w-4" />
                See Phantasialand
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* ── 07 ──────────────────────────────────────────────────────────── */}
      <Ambience tone="emerald">
        <SectionShell
          id="night-shift"
          index="07"
          kicker="The machinery"
          title="Where the numbers come from"
          icon={Database}
        >
          <P>
            Every five minutes we poll each of the 212 parks from three public sources at once. When
            they report different numbers, the majority wins.
          </P>

          <IngredientGrid>
            <IngredientCard icon={Activity} title="Wait times" delay={0}>
              ThemeParks.wiki, Wartezeiten.app and Queue-Times.com, every five minutes.
            </IngredientCard>
            <IngredientCard icon={GraduationCap} title="Holidays" delay={60}>
              Nager.Date for public holidays and bridge days, OpenHolidays for school holidays,
              every region separately.
            </IngredientCard>
            <IngredientCard icon={CloudSun} title="Weather" delay={120}>
              Open-Meteo for the forecast and rain radar, severe weather warnings from DWD and
              MeteoAlarm.
            </IngredientCard>
            <IngredientCard icon={CalendarDays} title="Opening hours" delay={0}>
              From the park calendars. Where a park publishes none, we estimate the hours from ride
              activity and say so.
            </IngredientCard>
            <IngredientCard icon={Layers} title="History" delay={60}>
              Every wait time we measure stays stored, including the ones from a quiet Tuesday
              morning.
            </IngredientCard>
            <IngredientCard icon={BarChart3} title="Forecast models" delay={120}>
              One for today, one for the coming weeks, one for the rest of the year. Each is checked
              against the wait times that actually happened.
            </IngredientCard>
          </IngredientGrid>

          <div className="space-y-4 pt-4">
            <P>
              We work out how long Taron’s queue is on a typical Tuesday at night, while the parks
              are shut. When you open the page in the morning, it’s ready.
            </P>
          </div>

          <NightShift
            locale="en"
            jobs={NIGHT_JOBS}
            caption="Times in UTC. Each step builds on the one before."
          />
        </SectionShell>
      </Ambience>

      {/* ── 08 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="gaps"
        index="08"
        kicker="The limits"
        title="When we don’t know"
        icon={HelpCircle}
      >
        <P>In three cases we’d rather leave a field empty than guess a number.</P>

        <div className="grid gap-6 lg:grid-cols-3">
          <DemoFrame
            label="A park with no readable source"
            note="Hansa-Park shows its wait times only in its own app on the park Wi-Fi. Without this notice, park.fan would list 82 rides that look empty."
          >
            <NoWaitTimesDemo />
          </DemoFrame>

          <DemoFrame
            label="A ride outside its season"
            note="Nobody reports anything about an ice rink in August. So it’s shown as out of season and doesn’t count towards the open rides that day."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="No basis for a rating"
            note="Under about 30 operating days there’s no reference value. So a new park shows “No forecast” where the colour would be."
          >
            <BadgeRowDemo
              crowdLabel="Crowd level: how busy is it right now"
              comparisonLabel="Comparison: busier than usual?"
              caption="At 70 minutes Taron is at “Very High”, and compared with its typical 45 minutes it’s “Much Higher”. At a small park where 25 minutes is normal, “Very High” can sit next to “Typical”."
            />
          </DemoFrame>
        </div>
      </SectionShell>

      {/* ── 09 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="signposts"
        index="09"
        kicker="Signposts"
        title="Where to find what"
        icon={Search}
      >
        <TouchpointGrid
          items={[
            {
              icon: Search,
              title: 'Search',
              body: (
                <>
                  Ctrl + K or ⌘ + K on any page. Finds parks, rides, shows and restaurants, typos
                  included.
                </>
              ),
            },
            {
              icon: MapPin,
              title: 'Location',
              body: (
                <>
                  Once you allow it, you’ll see the parks near you on the homepage, and inside a
                  park the nearest rides with their distance and wait time.
                </>
              ),
            },
            {
              icon: Star,
              title: 'Favourites',
              body: (
                <>
                  The star on every park and attraction card. Favourites appear on the homepage with
                  their current wait and are stored in your browser, with no account.
                </>
              ),
            },
            {
              icon: Ruler,
              title: 'Rider height',
              body: (
                <>
                  In the Attractions tab, set the slider to your smallest child and only the rides
                  they’re allowed on are left.
                </>
              ),
            },
            {
              icon: CalendarClock,
              title: 'Trip planner',
              body: (
                <>
                  Opens from any page. The plan is kept in your browser, and chapter 05 has more on
                  it.
                </>
              ),
            },
            {
              icon: BarChart3,
              title: 'Attraction page',
              body: (
                <>
                  History, typical waits per weekday, rope drop, height requirement and how accurate
                  the forecast is for that ride.
                </>
              ),
            },
            {
              icon: Activity,
              title: 'Blog',
              body: (
                <>
                  Longer pieces about parks and rides, including{' '}
                  <A href="/blog/category/guides">park guides</A> with tickets, ride order and how
                  to get there.
                </>
              ),
            },
            {
              icon: HelpCircle,
              title: 'Dictionary',
              body: (
                <>
                  <A href={glossary}>Every technical term</A> with an explanation and example rides,
                  some with a 3D model.
                </>
              ),
            },
          ]}
        />
      </SectionShell>

      {/* ── 10 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="faq"
        index="10"
        kicker="Asked and answered"
        title="Common questions"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>

      <ClosingBand
        kicker="What now?"
        title="Keep reading"
        body="park.fan is free, with no account and no ads. The park page has all of this with today’s numbers, Fancast works out how accurate the last 30 days of forecasts were, and the best time to visit compares several parks."
      >
        <Link
          href={PARK}
          prefetch={false}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
        >
          <Activity className="h-4 w-4" />
          See an example park page
        </Link>
        <Link
          href={bestTime}
          prefetch={false}
          className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          <CalendarDays className="h-4 w-4" />
          Best time to visit
        </Link>
        <Link
          href="/fancast"
          prefetch={false}
          className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Forecast accuracy
        </Link>
      </ClosingBand>
    </>
  );
}
