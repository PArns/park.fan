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
  LandingNextSteps,
} from '@/components/marketing/editorial-ui';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { PLANNER_SEGMENTS } from '@/lib/planner/segments';
import { HOWTO_CHAPTERS } from '@/lib/howto/chapters';
import {
  Activity,
  BarChart3,
  Bell,
  CalendarClock,
  CalendarDays,
  CloudSun,
  Database,
  Gauge,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  MessageCircle,
  Ruler,
  Scale,
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
  ParkyShot,
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
  AnatomyHolidayDemo,
  AnatomyNearbyDemo,
  AnatomyPurchasesDemo,
  AnatomyShowsDemo,
  AnatomyStatsDemo,
} from '../_anatomy-demos';
import { WeatherWarningBannerDemo } from '@/components/parks/weather-warning-banner-demo';
import { NowcastBannerDemo } from '@/components/parks/nowcast-banner-demo';
import { WeatherCardShowcase } from '@/components/parks/weather-card-demo';
import { WaitScaleBar, WaitScaleStage, type WaitScaleStep } from '../_wait-scale';
import { NightShift, type NightShiftJob } from '../_night-shift';
import { Ambience, IntroWithAside, ParkAnatomy, type AnatomyStep } from '../_chrome';
import { ChapterList, ChapterRail } from '../_chapter-rail';
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
  typical: 'Normal',
  busy: 'Busy',
  unit: 'min',
  days: 'days measured',
  record: 'Record',
  summary:
    'Taron, {label}: normally {typical} minutes, {busy} on busy days, measured across {days} days. At the entrance it says {wait} minutes.',
};

const SCALE_LEGEND = [
  {
    term: 'Normal',
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
 * The sections of a park page in the order they render (`app/[locale]/parks/.../page.tsx`,
 * `ParkPageShell`, `LiveParkData`). Whoever reorders them there reorders them here, or the guide
 * describes a page that does not exist.
 */
const PARK_SECTIONS: AnatomyStep[] = [
  {
    title: 'Title card',
    body: 'Name and location, how far away you are, the star for your favourites, a short text about the park, its links and the button for the day planner. Where enough has been measured, it also shows which weekdays are usually quiet and which are busy.',
  },
  {
    title: 'Skip-the-line prices',
    body: 'Daily prices for paid queue access such as Lightning Lane, with sold-out ones marked.',
    example:
      'At Magic Kingdom on 4 November 2026: the Multi Pass for $37, the single booking for Seven Dwarfs Mine Train sold out.',
    demo: <AnatomyPurchasesDemo />,
    onlyWhen: 'the park publishes them, so far only the Disney parks in the US.',
  },
  {
    title: 'When you’re in the park',
    body: 'A compass shows in which direction the big rides are. Below it are the rides where the queue is shorter now than it will be later, and the nearest ones with their distance and wait.',
    onlyWhen: 'you’re standing in the park and have shared your location.',
  },
  {
    title: 'In the park today',
    body: 'Status and opening hours, how many rides are open, the crowds right now, the forecast for today, the occupancy, the waits at the big rides and the next shows. If an official severe weather warning from DWD or MeteoAlarm is in force, it’s at the very top, word for word. The title row has the temperature and a warning when rain or a thunderstorm is on its way; press it to see the next few hours in quarter-hour steps. At the bottom are the holidays affecting the park today, with its own region first.',
    example:
      'On 24 August 2026 Phantasialand was open from 9 am to 7 pm, and Gelderland had summer holidays as well as North Rhine-Westphalia.',
    demo: (
      <div className="space-y-3">
        <WeatherWarningBannerDemo />
        <NowcastBannerDemo single />
        <AnatomyHolidayDemo />
      </div>
    ),
  },
  {
    title: 'The tiles',
    body: 'Under “In the park today” there’s a row of tiles, most of them with a figure from today, such as how many rides are open or when the next show starts. Attractions, Weather, Map, Shows and Restaurants open their tab on the same page; the Wait-Time Calendar and Statistics are pages of their own.',
  },
  {
    title: 'Attractions',
    body: 'The tab that’s selected when the page opens: every ride as a card like the ones in chapter 01, grouped by land or sorted by wait, searchable and filterable, for example by rider height or by open rides. Above them are the rides where it pays to arrive early. If a ride has a season, it’s on its card. Below the list, where there are any, come the rides that have closed for good and the link to the “With kids” page.',
    example: 'At Phantasialand, Taron is up there.',
    demo: <AnatomyAttractionDemo />,
  },
  {
    title: 'Wait-Time Calendar',
    body: 'A page of its own for each month: the days from chapter 04 in a month grid, a window with the details for each day, and a comparison of two days. At the top is “Best Time to Visit” with the quietest dates in the next three months and the quietest weekday.',
    demo: (
      <div className="space-y-3">
        <AnatomyBestDaysDemo locale="en" />
        <AnatomyCalendarDemo />
      </div>
    ),
  },
  {
    title: 'Weather, map, shows, restaurants',
    body: 'Four more tabs. The weather now, over the day and as a forecast, with the hours the park is open getting most of the room on the axis. A map with every ride on it. Shows with their times for the whole day, and restaurants with their status, both only when the park reports any.',
    example:
      'On 4 November 2026 Europa-Park listed 16 shows and 64 restaurants. Phantasialand had no show on that day, and so no shows tab either.',
    demo: (
      <div className="space-y-3">
        <WeatherCardShowcase variant="single" />
        <AnatomyShowsDemo />
      </div>
    ),
  },
  {
    title: 'Nearby parks',
    body: 'Up to three other parks within 100 kilometres, with distance and status.',
    example:
      'From Phantasialand, Toverland and Movie Park Germany, both a good 90 kilometres away.',
    demo: <AnatomyNearbyDemo />,
    onlyWhen: 'at least two other parks are within that range.',
  },
  {
    title: 'Blog',
    body: 'Posts this park appears in.',
    demo: <AnatomyBlogDemo locale="en" />,
    onlyWhen: 'there are any.',
  },
  {
    title: 'Statistics',
    body: 'The park’s longest queues, averaged over its opening hours, plus the months, the weekdays and the busiest and quietest days measured. The Statistics tile leads to a page of its own that also shows a normal day hour by hour.',
    demo: <AnatomyStatsDemo />,
  },
  {
    title: 'The next twelve months',
    body: 'The forecast day by day, gathered into months, with the number of recommended days. A month leads into the Wait-Time Calendar.',
    onlyWhen: 'there’s a forecast for the park.',
  },
  {
    title: 'Seasons and events',
    body: 'Halloween, Christmas and other events with their dates, whether they’re confirmed, announced or only expected, and what a separate ticket costs.',
    onlyWhen: 'we’ve researched events for the park.',
  },
  {
    title: 'Info and questions',
    body: 'Address, phone, opening year and area, as far as we have them, then common questions about this park.',
  },
];

const NIGHT_JOBS: NightShiftJob[] = [
  {
    hour: 2,
    minute: 0,
    at: 0.04,
    title: 'Yesterday, hour by hour',
    body: 'For every ride and every hour of the previous day, what the queue usually was and what it reached at its busiest.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.2,
    title: 'Each park’s normal level',
    body: 'The value a park’s crowds are measured against.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.2,
    title: 'The model for the coming weeks catches up',
    body: 'It takes in yesterday’s wait times.',
  },
  {
    hour: 4,
    minute: 0,
    at: 0.34,
    title: 'Each ride’s normal level',
    body: 'The value the crowd level on the card from chapter 01 is measured against.',
  },
  {
    hour: 4,
    minute: 30,
    at: 0.46,
    title: 'Summing up yesterday',
    body: 'The whole previous day in quarter hours.',
  },
  {
    hour: 5,
    minute: 15,
    at: 0.6,
    title: 'Is getting up early worth it?',
    body: 'For each ride, how much an early start saves and how long the head start holds.',
  },
  {
    hour: 5,
    minute: 30,
    at: 0.72,
    title: 'Normal and busy per weekday',
    body: 'The values from chapter 02 for every ride, plus the record.',
  },
  {
    hour: 6,
    minute: 0,
    at: 0.86,
    title: 'The model for the rest of the year catches up',
    body: 'It takes in yesterday’s wait times too.',
  },
];

const FAQ = [
  {
    question: 'What do “normal” and “busy” mean for a wait time?',
    answer:
      'Normal is the median of the daily peaks: on half the days measured, the longest queue was shorter. Busy is the 90th percentile of the same series, roughly the busiest day in ten. The record is shown next to them. Because both values are percentiles, a single outlier hardly moves them.',
  },
  {
    question: 'Is a 70-minute wait a lot?',
    answer:
      'It depends on the ride and on the weekday. At Taron in Phantasialand the Monday peak is normally 55 minutes, so 70 is a lot there. On Saturdays 70 minutes is the median, which makes it a perfectly normal day. Both reference values are on the ride’s own page on park.fan.',
  },
  {
    question: 'Where do the wait times come from?',
    answer:
      'From up to three public sources. ThemeParks.wiki is the main one; Queue-Times.com and Wartezeiten.app add rides it lacks and correct a “closed” that’s out of date. We fetch new values every five minutes.',
  },
  {
    question: 'Why do some parks say “No forecast”?',
    answer:
      'A crowd level compares the park with its own past, and that takes roughly 30 operating days. For new or rarely open parks we show nothing, because any colour there would be a guess.',
  },
  {
    question: 'Why does Hansa-Park show no wait times?',
    answer:
      'The park shows its wait times only in its own app, and only on the park’s Wi-Fi. There’s no public interface to read them from. That’s why park.fan puts a notice above the ride list explaining why there are no times in it.',
  },
  {
    question: 'What is rope drop?',
    answer:
      'Being at a particular ride the moment the park opens, before the paths fill up. park.fan recommends it when the ride’s peak reaches at least 60 minutes and the early start saves at least 45 of them, and gives a rough idea of how long the head start lasts.',
  },
  {
    question: 'Does park.fan cost anything, and do I need an account?',
    answer:
      'No and no. Everything on park.fan is free and works without signing up. Favourites and day plans are stored in your browser. Only if you share a plan or ask for notifications about it do we keep a copy on our side too.',
  },
  {
    question: 'How often do the numbers update?',
    answer:
      'An open park page fetches new values every five minutes. We recalculate the values per weekday and the rope-drop recommendations once a night, because they barely move from one day to the next.',
  },
];

/** The guide page's article, English. */
export function ContentEN() {
  const glossary = `/${GLOSSARY_SEGMENTS.en}`;
  const bestTime = `/${BEST_TIME_SEGMENTS.en}`;
  const planner = `/${PLANNER_SEGMENTS.en}`;

  return (
    <>
      <ChapterRail chapters={CHAPTERS} ariaLabel="Chapters" />

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
          The cards, badges and tables further down are park.fan’s own components. Most of them show
          fixed example numbers as the API returned them in the summer and autumn of 2026, nearly
          all from Phantasialand; two tables are live. In the park you’ll have the same cards on
          your phone, with today’s numbers in them.
        </P>

        <Reveal>
          <ChapterList chapters={CHAPTERS} ariaLabel="Chapters" />
        </Reveal>
      </div>

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
            The crowd level compares the number with this ride’s normal level, the median of its
            measured waits. For Taron it was {TARON_BASELINE} minutes in September, {TARON_WAIT_NOW}{' '}
            is a good one and a half times that, and that’s “Very High”. The small arrow next to it
            shows whether the queue is growing or getting shorter right now.
          </P>
          <PG>
            Where a ride has a single-rider queue, its wait is on the card too. So is the height
            requirement, so you don’t find out at the measuring post that your 120-centimetre child
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

      <Ambience>
        <SectionShell
          id="scale"
          index="02"
          kicker="The scale"
          title="Normal, busy, record"
          icon={Ruler}
        >
          <IntroWithAside
            value={`${TARON_RECORD} min`}
            label="Taron’s longest measured queue"
            note="On 16 July 2026. Schools in North Rhine-Westphalia were still open, the neighbouring regions were already on their summer holidays. It was a single day: it’s shown next to the scale as the record and barely moves it."
          >
            <P>
              To judge whether 70 minutes is a lot, you need two reference values. Normal is how
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
                        On Mondays the daily peak is normally {step.typical} minutes, and on nine
                        Mondays out of ten it stays at {step.busy} or below. If you see{' '}
                        {TARON_WAIT_NOW} today, you’ve caught one of the busy Mondays.
                      </>
                    )}
                    {i === 1 && (
                      <>
                        On Saturdays {step.typical} minutes is the median: on half of all Saturdays
                        the longest queue stayed below it. The same number is perfectly normal on
                        this day.
                      </>
                    )}
                    {i === 2 && (
                      <>
                        On weekdays the peak is normally {step.typical} minutes. The dashed line at
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

          {/* Card left, prose right: the card is a park-page sidebar component, so it keeps
              its own width and the text takes the rest. */}
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
                the busy value, the solid part below it the normal one, and at the bottom is the
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
            label="The whole park, live"
            note="Phantasialand’s longest queues, as they stand on the park page right now. This table works differently from a ride’s page: it averages over every opening hour of the last two years. “Typical” is what the queue usually is within an hour, “Peak” what it reaches in that hour’s busy minutes. That’s why its numbers sit below the daily peaks on the scale above."
            href={PARK}
            hrefLabel="Phantasialand on park.fan →"
          >
            <LiveTopAttractions locale="en" />
          </DemoFrame>
        </SectionShell>
      </Ambience>

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
          label="A week of autumn holidays"
          note="Four measured days at Phantasialand, all in the North Rhine-Westphalia autumn holidays of 2026: on Tuesday 20 October an average of 45 minutes at the big rides, on the Sunday after it 20. The same holidays, four different levels. On park.fan the same calendar runs month by month."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        {/* One column, full width, like every other chapter on this page: two prose
            columns would put a third text edge under the paragraph above. */}
        <div className="space-y-4 pt-2">
          <P>
            The neighbours’ holidays often count as much as the local ones, because day guests don’t
            stop at borders. Phantasialand is about 60 kilometres from the Netherlands, and in its
            calendar you’ll find the holidays of the Dutch provinces of Limburg and Gelderland next
            to those of North Rhine-Westphalia. The holidays of the neighbouring regions we’ve set
            for a park get a marker of their own.
          </P>
          <PG>
            The colour of a day ahead is a forecast, the colour of a past day is measured. How
            accurate our forecasts are is worked out in public on the Fancast page.
          </PG>
          <P>
            If a park publishes its opening hours, the calendar reaches as far as they do, a year at
            most, and a day on which the park is shut is marked as closed. For the overview, the
            park page sums up the forecast month by month under “The next twelve months”.
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

      <SectionShell
        id="day-plan"
        index="05"
        kicker="The planner"
        title="Playing the day through beforehand"
        icon={CalendarClock}
      >
        <P>
          In the day planner you lay out the rides you want to do on a timeline. Each block is as
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
          hrefLabel="To the day planner →"
          className="mx-auto max-w-[560px]"
        >
          <PlannerDayFigure />
        </DemoFrame>

        <P>
          Everything else in the planner, such as marking rides by height requirement or sorting the
          day at the press of a button, is described on the <A href={planner}>day planner page</A>.
        </P>
      </SectionShell>

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
              shows gets neither a shows tile nor an empty shows tab.
            </Highlight>
            <PG>
              The selected tab is part of the address. Send someone the link to the map and they’ll
              open the map, not the ride list. The calendar and the statistics are pages with an
              address of their own.
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

      <Ambience tone="emerald">
        <SectionShell
          id="night-shift"
          index="07"
          kicker="The machinery"
          title="Where the numbers come from"
          icon={Database}
        >
          <P>
            Every five minutes we fetch new wait times for each of the more than 200 parks, from up
            to three public sources. ThemeParks.wiki is the main one. Queue-Times.com and
            Wartezeiten.app add rides it lacks and correct a “closed” that’s out of date. For a few
            parks one of those two is the only source.
          </P>

          <IngredientGrid>
            <IngredientCard icon={Activity} title="Wait times" delay={0}>
              ThemeParks.wiki as the base, Queue-Times.com and Wartezeiten.app for what it lacks.
            </IngredientCard>
            <IngredientCard icon={GraduationCap} title="Holidays" delay={60}>
              Region by region: in Europe from Nager.Date and OpenHolidays, elsewhere from the
              calendars of authorities and school districts.
            </IngredientCard>
            <IngredientCard icon={CloudSun} title="Weather" delay={120}>
              Open-Meteo for the forecast and a short-term rain forecast in quarter hours, severe
              weather warnings from DWD and MeteoAlarm.
            </IngredientCard>
            <IngredientCard icon={CalendarDays} title="Opening hours" delay={0}>
              From the park calendars. Where a park publishes none, we work out the hours for today
              and the days before from ride activity and mark them as estimated.
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
              We work out how long Taron’s queue is on a normal Tuesday at night, while the parks in
              Europe are shut. When you open the page in the morning, it’s ready.
            </P>
          </div>

          <NightShift
            locale="en"
            jobs={NIGHT_JOBS}
            caption="Times in UTC. The order makes sure each step finds the numbers it needs already there. The model for today catches up later, at 8:30 am."
          />
        </SectionShell>
      </Ambience>

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
            note="Hansa-Park shows its wait times only in its own app on the park Wi-Fi. So this notice sits above its roughly 80 rides, explaining why there are no times."
          >
            <NoWaitTimesDemo />
          </DemoFrame>

          <DemoFrame
            label="A ride outside its season"
            note="Nobody reports anything about an ice rink in August. Because we know its season, November to January, it’s shown as out of season then and doesn’t count towards the open rides."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="No basis for a rating"
            note="Under about 30 operating days there’s no reference value. So a new park shows “No forecast” where the colour would be."
          >
            <BadgeRowDemo
              crowdLabel="The levels"
              caption={`Every level is measured against the ride’s or the park’s own past, never against other parks. At 70 minutes Taron is on “Very High” because its normal level in September was ${TARON_BASELINE}.`}
            />
          </DemoFrame>
        </div>
      </SectionShell>

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
                  The / key on any page, or the search field at the top. Finds parks, rides, shows,
                  restaurants and places, typos included.
                </>
              ),
            },
            {
              icon: MapPin,
              title: 'Location',
              body: (
                <>
                  Once you allow it, you’ll see the parks near you on the homepage. Inside a park a
                  compass shows where the big rides are, with the nearest rides and their distance
                  and wait.
                </>
              ),
            },
            {
              icon: Star,
              title: 'Favourites',
              body: (
                <>
                  The star on parks, rides, shows and restaurants. Favourites appear with their
                  current wait on the homepage and under <A href="/favorites">My favorites</A>,
                  stored in your browser, with no account.
                </>
              ),
            },
            {
              icon: Bell,
              title: 'Alerts',
              body: (
                <>
                  The bell on a ride or a show sends you a notification when the wait drops below
                  your limit, the ride reopens or the show is about to start. They’re all under{' '}
                  <A href="/alerts">My alerts</A>.
                </>
              ),
            },
            {
              icon: Ruler,
              title: 'Rider height',
              body: (
                <>
                  In the Attractions tab, set the slider to your smallest child and only the rides
                  they’re allowed on are left. A park’s “With kids” page has the same slider.
                </>
              ),
            },
            {
              icon: CalendarClock,
              title: 'Day planner',
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
                  History, normal and busy waits per weekday, rope drop, height requirement and how
                  accurate the forecast is for that ride.
                </>
              ),
            },
            {
              icon: Scale,
              title: 'Compare parks',
              body: (
                <>
                  <A href="/compare">Compare parks</A> puts two to four parks side by side, with
                  their average wait, their longest queue and their quietest weekday.
                </>
              ),
            },
            {
              icon: Activity,
              title: 'Blog and news',
              body: (
                <>
                  Longer pieces about parks and rides, including{' '}
                  <A href="/blog/category/guides">park guides</A> with tickets, ride order and how
                  to get there. <A href="/news">News</A> has short reports from the parks.
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

      <SectionShell
        id="parky"
        index="10"
        kicker="The assistant"
        title="Ask Parky"
        icon={MessageCircle}
      >
        <ParkyShot locale="en">
          <P>
            Parky is park.fan’s chat assistant and lives in the round button at the bottom right. On
            the homepage, on a wide screen, it stands right under the headline and only hops down to
            its corner once you scroll.
          </P>
          <P>
            Ask it how long the queues are right now, what’s forecast for today or the next few
            weeks, on which days the queues at a park are short, how tall and fast a coaster is, or
            what’s in our posts. For every answer it looks in the same data you see on the pages.
          </P>
          <P>
            It shows parks and rides as cards with their numbers. If you ask it to, it takes you to
            the right page and sets up a day in the day planner, adds rides to it or sorts them. It
            only sees your location if you press “Share location” in the chat, and it doesn’t keep
            it.
          </P>
          <P>
            A language model writes the answers, and it gets things wrong now and then. The numbers
            on the cards in the chat come straight from park.fan; if in doubt, check what Parky says
            about them on the ride’s page. It sticks to parks and rides, doesn’t search the web, and
            after three questions in 30 seconds it needs a short break.
          </P>
          <P>
            We store your questions without an IP address and delete them after 7 days. There’s more
            about Parky, with example questions, on <A href="/parky">its own page</A>.
          </P>
        </ParkyShot>
      </SectionShell>

      <SectionShell
        id="faq"
        index="11"
        kicker="Asked and answered"
        title="Common questions"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>

      <LandingNextSteps
        kicker="What now?"
        title="Keep reading"
        body="park.fan is free, with no account and no ads. The park page has all of this with today’s numbers, Fancast works out how accurate the last seven days of forecasts were, and the best time to visit compares several parks."
        destinations={[
          { href: PARK, label: 'See an example park page', icon: Activity, prefetch: false },
          { href: bestTime, label: 'Best time to visit', icon: CalendarDays, prefetch: false },
          { href: '/fancast', label: 'Forecast accuracy', icon: Sparkles, prefetch: false },
        ]}
      />
    </>
  );
}
