import React from 'react';
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
import {
  Activity,
  BarChart3,
  CalendarDays,
  CloudSun,
  Compass,
  Database,
  Gauge,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  Moon,
  Ruler,
  Search,
  Sparkles,
  Star,
  Sunrise,
  Users,
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
import { ChapterRail, type Chapter } from '../_chapter-rail';
import {
  TARON_BASELINE,
  TARON_RECORD,
  TARON_WAIT_NOW,
  TARON_WEEKDAY_DAYS,
  TARON_WEEKEND_DAYS,
  WAIT_SCALE_MAX,
} from '../_fixtures';

/**
 * Feeds both the chapter list at the top and the rail down the right edge, and
 * must match the `<SectionShell id=… index=…>` calls below exactly — the rail
 * looks its sections up by id, so an entry that drifts silently stops
 * highlighting.
 */
const CHAPTERS: Chapter[] = [
  { id: 'number', index: '01', label: 'A number on its own' },
  { id: 'scale', index: '02', label: 'Typical, busy, record' },
  { id: 'moment', index: '03', label: 'The best moment' },
  { id: 'day', index: '04', label: 'The right day' },
  { id: 'park-page', index: '05', label: 'A park page, top to bottom' },
  { id: 'night-shift', index: '06', label: 'Where the numbers come from' },
  { id: 'gaps', index: '07', label: 'When we do not know' },
  { id: 'visits', index: '08', label: 'Four visits' },
  { id: 'signposts', index: '09', label: 'Where to find what' },
  { id: 'faq', index: '10', label: 'Common questions' },
];

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
    def: 'Median of the daily peaks. On half the days measured, the longest queue was shorter than this.',
    swatch: 'bg-primary/45',
  },
  {
    term: 'Busy',
    def: '90th percentile of the same series. The one day in ten when it was unusually full.',
    swatch: 'bg-primary/25',
  },
  {
    term: '70 min',
    def: 'What it says at the entrance. It stays put while the scale underneath it moves.',
    swatch: 'bg-amber-500',
  },
  {
    term: 'Record',
    def: `${TARON_RECORD} minutes on 16 July 2026. The worst day on record, which is exactly why it is not the yardstick.`,
    swatch: 'bg-foreground/40',
  },
];

/**
 * The three readings, in the order the figure steps through them. Numbers come
 * from `TARON_TYPICAL_WAITS`, so from the API rather than from the story.
 */
const SCALE_STEPS: WaitScaleStep[] = [
  { id: 'monday', label: 'Monday', typical: 55, busy: 65, sampleDays: 19 },
  { id: 'saturday', label: 'Saturday', typical: 70, busy: 85, sampleDays: 20 },
  { id: 'weekday', label: 'Weekdays', typical: 60, busy: 80, sampleDays: 97 },
];

/**
 * The sections of a park page in exactly the order they render
 * (`app/[locale]/parks/.../page.tsx`). Reorder them here and you reorder them
 * there too, or this guide describes a page that does not exist.
 */
const PARK_SECTIONS: AnatomyStep[] = [
  {
    title: 'Header',
    body: 'Name, location, how far it is from you, plus status, today’s opening hours, the crowd level right now and the “x of y open” counter.',
    example: 'Phantasialand, Brühl. Open 09:00–19:00 today, 36 of 40 rides running.',
    demo: <AnatomyHeaderDemo />,
  },
  {
    title: 'School holidays in range',
    body: 'Which school holidays and public holidays are acting on this park today: its own region first, then the neighbours.',
    example:
      'For Phantasialand the summer break in North Rhine-Westphalia comes first. Gelderland sits underneath it, 90 kilometres past the border.',
    demo: <AnatomyHolidayDemo />,
    onlyWhen: 'a holiday region actually reaches this park today.',
  },
  {
    title: 'Severe weather warning',
    body: 'Official warnings from DWD and MeteoAlarm, passed through unchanged. No judgement of our own about the weather.',
    example: 'The DWD’s wording, unchanged. For parks outside Germany, MeteoAlarm’s.',
    demo: <WeatherWarningBannerDemo />,
    onlyWhen: 'a warning is active for the location.',
  },
  {
    title: 'Rain radar',
    body: 'The next few hours in fifteen-minute steps. Tells you whether the shower is through in twenty minutes or whether it is the afternoon now.',
    example:
      'Quarter hours, not hours: a shower from 14:15 to 14:30 disappears inside an hourly value; here it is there.',
    demo: <NowcastBannerDemo single />,
    onlyWhen: 'there is precipitation in range.',
  },
  {
    title: 'Weather card',
    body: 'Current reading, the day’s curve and the forecast. The hourly axis is built around the opening hours: the hours the park is open get four times the width of the ones before and after.',
    example:
      'For Phantasialand today: the hours from 09:00 to 19:00 take three quarters of the width, the night before and after takes the rest.',
    demo: <WeatherCardShowcase variant="single" />,
  },
  {
    title: 'Skip-the-line prices',
    body: 'Daily prices for paid queue access, sold-out states included.',
    example: 'Lightning Lane at the Disney parks, a day price per ride, sold out marked as such.',
    demo: <AnatomyPurchasesDemo />,
    onlyWhen: 'the park publishes them in its calendar. So far only the Disney parks in the US.',
  },
  {
    title: 'Attractions',
    body: 'The first tab, with the ride count in its title. Cards like the ones in chapter 01, searchable and grouped by land. The park’s rope-drop overview sits on top, sorted by minutes saved.',
    example:
      'Taron in Klugheim, from 140 centimetres — the card from chapter 01. Above it the rope-drop list, led by Chiapas at 75 minutes saved.',
    demo: <AnatomyAttractionDemo />,
  },
  {
    title: 'Calendar and map',
    body: 'Two fixed tabs beside it: the daily forecasts from chapter 04, and a map with the rides as markers.',
    example: 'The four days from chapter 04, in the month grid next to their neighbours.',
    demo: <AnatomyCalendarDemo />,
  },
  {
    title: 'Shows and restaurants',
    body: 'Showtimes for the whole day, dining with opening hours.',
    example: 'Phantasialand has four shows and 46 restaurants, both with times.',
    demo: <AnatomyShowsDemo />,
    onlyWhen: 'the park supplies them. Otherwise the tab is not there at all.',
  },
  {
    title: 'Best days',
    body: 'The quietest dates in the next three months, plus the park’s quietest weekday.',
    example:
      'The park’s quietest weekday and the next quiet dates — the same calculation as chapter 04, three months out.',
    demo: <AnatomyBestDaysDemo locale="en" />,
    onlyWhen: 'the park publishes an operating calendar.',
  },
  {
    title: 'Parks nearby',
    body: 'What else is within reach, with distance and current status.',
    example:
      'From Phantasialand: Toverland and Movie Park Germany, both a good 90 kilometres away.',
    demo: <AnatomyNearbyDemo />,
    onlyWhen: 'there are neighbours. For about half of the 212 parks there are none.',
  },
  {
    title: 'Blog',
    body: 'Posts from the park.fan blog that this park appears in.',
    example: 'The Phantasialand page carries, among others, the post that goes with this page.',
    demo: <AnatomyBlogDemo locale="en" />,
    onlyWhen: 'there are any.',
  },
  {
    title: 'Statistics',
    body: 'The park’s longest queues with their typical and busy values, plus the spread across months and weekdays. The section states how many recorded days it rests on, and both breakdowns carry that count as a column of their own.',
    example:
      'The ranking from chapter 02, plus the months and weekdays with their number of measured days.',
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
    body: 'Operating season and announced events, address and time zone, and the common questions about this particular park.',
    example: 'The ice rink from chapter 07 sits here with November to January.',
    demo: <AnatomySeasonDemo label="Ice rink" />,
  },
];

const NIGHT_JOBS: NightShiftJob[] = [
  {
    hour: 2,
    minute: 0,
    at: 0.04,
    title: 'What a typical hour looks like',
    body: 'For every ride and every hour, the typical value and the busy one. Hours with fewer than three readings drop out.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.22,
    title: 'Each park’s normal level',
    body: 'The median the current crowd level is measured against. Without it, 70 minutes is just a number.',
  },
  {
    hour: 4,
    minute: 30,
    at: 0.42,
    title: 'Summing up yesterday',
    body: 'The whole previous day is condensed into quarter hours. Nothing that needs the shape of a day can run before this.',
  },
  {
    hour: 5,
    minute: 15,
    at: 0.56,
    title: 'Is getting up early worth it?',
    body: 'Per ride: how much the early start saves, how long the advantage holds, when the quietest moment falls.',
  },
  {
    hour: 5,
    minute: 30,
    at: 0.67,
    title: 'Typical per weekday',
    body: 'The table from chapter 02, recomputed for every ride, plus the record day with its date.',
  },
  {
    hour: 6,
    minute: 0,
    at: 0.8,
    title: 'The forecast model catches up',
    body: 'It trains on yesterday’s wait times. Once through, every morning.',
  },
];

const FAQ = [
  {
    question: 'What do “typical” and “busy” mean for a wait time?',
    answer:
      'Typical is the median of the daily peaks: on half of all days measured the longest queue was shorter, on the other half it was longer. Busy is the 90th percentile of the same series, roughly the one day in ten when it was unusually full. The absolute record is shown separately so that a single outlier cannot move either value.',
  },
  {
    question: 'Is a 70-minute wait a lot?',
    answer:
      'It depends on the ride and on the weekday. Taron at Phantasialand typically peaks at 55 minutes on a Monday and stays under 65 on nine Mondays out of ten, so 70 minutes there is an unusually busy day. On Saturdays the median for the same ride is exactly 70 minutes, and the same reading is then completely average. Both reference values are on the ride’s own page on park.fan, so nobody has to guess them.',
  },
  {
    question: 'Where do the wait times come from?',
    answer:
      'From three public sources at once: ThemeParks.wiki, Wartezeiten.app and Queue-Times.com. Every park is polled every five minutes. When two sources disagree, the majority decides, then the median, then the mean. The result is rounded to five minutes, because parks post their waits in five-minute steps themselves.',
  },
  {
    question: 'Why do some parks say “no forecast”?',
    answer:
      'Because the basis is missing. A crowd level comes out of a comparison with the park’s own past, and that needs roughly 30 operating days. For new or rarely open parks the field stays empty instead of showing a guessed colour.',
  },
  {
    question: 'Why does Hansa-Park show no wait times?',
    answer:
      'The park publishes its wait times only in its own app, and only for devices on the park’s Wi-Fi. There is no public interface we could read them from. Because a park with no source looks exactly like a park closed for the night in the data, this is a curated entry rather than something derived: the notice on park.fan says so, instead of listing 82 rides as apparently empty.',
  },
  {
    question: 'What is rope drop?',
    answer:
      'Being at a particular ride the moment the park opens, before the paths fill up. park.fan only recommends it when two conditions hold: the ride’s daily peak is at least 60 minutes and the early start saves at least 45 of them. It always says roughly how long the head start lasts.',
  },
  {
    question: 'Does park.fan cost anything, and do I need an account?',
    answer:
      'No and no. All wait times, statistics, calendars and forecasts are free and usable without signing up. Favourites live in a cookie in your browser, not on a server.',
  },
  {
    question: 'How often do the numbers on the page update?',
    answer:
      'An open park page on park.fan fetches new values every five minutes, in step with how often the sources are polled. The statistical values such as typical wait times or rope-drop recommendations are recalculated once a night, because they barely move from one day to the next anyway.',
  },
];

export function ContentEN() {
  const glossary = `/${GLOSSARY_SEGMENTS.en}`;
  const bestTime = `/${BEST_TIME_SEGMENTS.en}`;

  return (
    <>
      <ChapterRail chapters={CHAPTERS} ariaLabel="Chapters" />

      {/* ── Intro ───────────────────────────────────────────────────────── */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          park.fan started in a queue. Taron, mid-afternoon, the display said something with three
          digits, and nobody could say whether that was bad luck or just Tuesday.
        </Lead>
        <P>
          That question is still what the site is built around. Showing a current wait time is the
          easy part: most parks publish it themselves, at the entrance and in their own apps, which
          often only work on the park’s Wi-Fi. It only gets interesting once something beside it
          says what a normal day at this ride looks like, when the queue tends to get shorter, and
          whether today is a good day at all.
        </P>
        <P>
          There is no screenshot on this page. Every card, badge and table below is a real part of a
          part of park.fan, here filled with fixed example numbers. The same cards are in front of
          you an hour later in the park.
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
        kicker="The starting point"
        title="A number on its own says nothing"
        icon={Gauge}
      >
        <P>
          At the entrance to Taron it says 70 minutes, and nothing else. The queue already backs up
          from the first flight of steps. Your phone shows the same number. Neither tells you
          whether joining the queue is worth it right now or later in the day. On park.fan four more
          readings stand next to it: a crowd level, a trend, the second queue and the height
          requirement.
        </P>

        <BareNumberVsCard
          unit="minutes"
          signLabel="What the park posts"
          signCaption="One number, no context. Whether that is good or bad today is only obvious to somebody who has been here often enough."
          cardLabel="What park.fan makes of it"
          cardCaption="The same 70 minutes, plus crowd level, trend, single-rider wait, height requirement and a note on when it is likely to ease off."
        />

        <div className="space-y-4 pt-2">
          <P>
            “Very High” is not a matter of taste here. Taron averages {TARON_BASELINE} minutes,{' '}
            {TARON_WAIT_NOW} is about 156 percent of that, and the levels change at 60, 89, 110, 150
            and 200 percent. From 150 upwards it is called “Very High”. The small arrow beside it
            comes from the last few readings and says whether the queue is growing or being worked
            off.
          </P>
          <PG>
            The second value on the card is the single-rider queue. Plenty of rides run several
            queues in parallel, and which of them exists is rarely posted at the entrance. Next to
            it, the height requirement, so nobody walks half the park with a child who is 130
            centimetres tall.
          </PG>
        </div>

        <DemoFrame
          label="Two rides, the same minute"
          note="Both cards come from the same moment in the same park, Taron in Klugheim and Black Mamba in Deep in Africa. One queue is growing, the other is being worked off. Here on park.fan every ride in the park sits side by side like this, grouped by land."
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
            note="On 16 July 2026, in the summer holidays. A single day out of 365, which is why the scale works with percentiles instead of the maximum."
          >
            <P>
              To place a number you need two reference values and a statement of what they rest on.
              park.fan uses the median of the daily peaks and the 90th percentile of the same
              series. In plain terms: how long is the longest queue of the day usually, and how long
              was it on the busiest ten percent of days.
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
                    {i === 1 && 'For a Saturday, that is exactly the norm'}
                    {i === 2 && 'And once it was 135'}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {i === 0 && (
                      <>
                        On Mondays the daily peak is {step.typical} minutes, and on nine Mondays out
                        of ten it stays under {step.busy}. The {TARON_WAIT_NOW} at the entrance are
                        above that. Anyone standing here has caught the busiest Monday in weeks, and
                        the rides next door are usually the better idea.
                      </>
                    )}
                    {i === 1 && (
                      <>
                        On Saturdays {step.typical} minutes is the median. Same display, same place,
                        same ride: on this day it is simply average. Being annoyed will not help,
                        and neither will moving on, because the rides next door are having the same
                        Saturday.
                      </>
                    )}
                    {i === 2 && (
                      <>
                        Across all {step.sampleDays} weekdays measured, the peak sits at{' '}
                        {step.typical} minutes. The dashed line further right is the {TARON_RECORD}
                        -minute day of 16 July. Days like that are exactly why “busy” is a
                        percentile and not a maximum: one outlier would drag a mean along with it
                        and make everything below it useless.
                      </>
                    )}
                  </p>

                  {/* Below lg every step carries its own scale: there is no
                    running figure there for anything to change on. */}
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
              note="Real values for Taron, fetched on 24 August 2026."
              href={TARON}
              hrefLabel="Live values for Taron →"
            >
              <TypicalWaitsDemo />
            </DemoFrame>

            <div className="space-y-4">
              <P>
                The same distribution as bars, weekday by weekday. The number above each bar is that
                day’s busy mark, the solid part below it the typical value, and the record with its
                date sits at the bottom right. A weekday with no basis gets no estimated bar; it
                gets no bar at all.
              </P>
              <P>
                Saturday is the only day on which the {TARON_WAIT_NOW} from the beginning land right
                in the middle. On a Monday the same minutes would be the exception.
              </P>
              <P>
                How much weight all of this carries depends on the number of days measured:{' '}
                {TARON_WEEKDAY_DAYS} on weekdays and {TARON_WEEKEND_DAYS} at weekends have
                accumulated here. The card itself names the window it computes over. For the whole
                park, the total of recorded days sits in the statistics section on park.fan, and the
                month and weekday tables carry it as a column of their own.
              </P>
            </div>
          </div>

          <DemoFrame
            label="The same table for the whole park, live"
            note="No example numbers: this is the current state for Phantasialand, the typical and the busy value per ride. On the park page, the line above this section says how many recorded days it rests on. Every figure is in five-minute steps, because parks post in five-minute steps."
            href={PARK}
            hrefLabel="Phantasialand on park.fan →"
          >
            <LiveTopAttractions locale="en" />
          </DemoFrame>

          <Highlight>
            This table is the reason we archive wait times at all. A live number can be fetched when
            somebody asks for it. A median across every Tuesday on record has to be finished before
            the question arrives.
          </Highlight>
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
          “Get there early” is the advice everybody gives. It only holds if the queue grows over the
          course of the day, and that is far from true everywhere. Six rides from the same park, the
          same table, the same year:
        </P>

        <DemoFrame
          label="The real hourly profile, right now"
          note="Live from the park’s hourly profile. Each ride’s strongest hour is in bold, and across these six rides it is by no means the same one. An hour only becomes a column once it has at least ten days measured on that ride, reaches at least 40 percent of the best-measured hour and is reported by at least half the rides. That throws out the edges of the day, where a single hotel-guest queue would otherwise speak for the whole morning."
          href={PARK}
          hrefLabel="Phantasialand on park.fan →"
        >
          <LiveHourlyProfile locale="en" />
        </DemoFrame>

        <div className="space-y-4 pt-2">
          <P>
            Taron is the case where the time of day decides almost nothing: the row stays in a
            narrow band all day, and what makes the difference is the weekday from chapter 02.
            Chiapas is the opposite, climbing clearly into the afternoon. A single rule for the
            whole park would be wrong for one of the two, which is why it is computed per ride.
          </P>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <DemoFrame
            label="The recommendation that comes out of it"
            note="It is only recommended when the daily peak reaches at least 60 minutes and the early start saves at least 45 of them. Colorado Adventure in the same park saves 40 minutes off a peak of 50 and therefore gets no tip."
          >
            <RopeDropDemo />
          </DemoFrame>

          <div className="space-y-4">
            <PG>
              The card names three numbers and one time: the typical wait at opening, the daily
              peak, the difference between them, and the window in which the head start holds. After
              that it is gone, and the card says so.
            </PG>
            <P>
              The card also names the quietest time of the day, but only when it falls outside the
              early window. For Taron it does not — both land in the same hour — so there is no
              second time here. For other rides it is the evening, and then that time is what the
              card shows. For the whole park, the attractions overview lists the rides where getting
              up early pays off most, sorted by minutes saved.
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
          The date decides more than the time of day. Two days of the same week can be half an hour
          of average wait time apart, and an ordinary calendar gives no hint of it. What makes the
          difference is school holidays, public holidays, bridge days and the weather.
        </P>

        <DemoFrame
          label="Four days from the autumn holidays"
          note="15 October is the quietest of the four even though it falls in the middle of the holidays: it is raining. The 19th is grey because the park is closed that day. On park.fan the same calendar runs month by month, as far ahead as the forecast for that park reaches."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        {/* One column, full width, like every other chapter on this page. As two
            prose columns this band put a third text edge under the paragraph above
            it: a run of copy, then a 604 px column ending short of it, then a
            second column starting where that paragraph still had words. */}
        <div className="space-y-4 pt-2">
          <P>
            The holiday calendars come from two public sources and cover four years each. The
            neighbours’ holidays often matter more than the local ones. An example from today: the
            defining holiday entry for Phantasialand is not North Rhine-Westphalia but the summer
            holidays of the Dutch province of Gelderland. The park is 90 kilometres from the border,
            and day guests do not recognise one. Regions within roughly 200 kilometres therefore
            count too, and get their own marker in the calendar.
          </P>
          <PG>
            The colour of a day is a forecast, not a measurement. It comes from a model that is
            retrained every night on the previous day’s wait times and can be checked against
            reality afterwards.
          </PG>
          <P>
            How far the calendar reaches depends on the park. A park that opens all year gets a
            forecast around eleven months ahead. For a seasonal park it stops where the published
            season ends: for a Tuesday in March on which Phantasialand is demonstrably closed, the
            calendar reads closed and shows no crowd colour.
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
        id="park-page"
        index="05"
        kicker="The walk-through"
        title="A park page, top to bottom"
        icon={Layers}
      >
        <P>
          Everything so far lives on one park.fan page per park, built in the order people ask: is
          the park open today? Is it about to rain? How long is the queue? And when should I have
          come instead?
        </P>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
          <ParkAnatomy onlyWhenLabel="Only when:" steps={PARK_SECTIONS} />

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Highlight>
              Half of these blocks depend on a condition, and that is deliberate. A park with no
              shows gets no empty shows tab, and roughly half of the 212 parks render no neighbours
              section at all, because there is nothing within reach.
            </Highlight>
            <PG>
              The tabs remember your choice in the address. Open the calendar, pass the link on, and
              what you send is the calendar rather than the ride list.
            </PG>
            <div className="pt-1">
              <Link
                href={PARK}
                prefetch={false}
                className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              >
                <Activity className="h-4 w-4" />
                See it on a live park
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* ── 06 ──────────────────────────────────────────────────────────── */}
      <Ambience tone="emerald">
        <SectionShell
          id="night-shift"
          index="06"
          kicker="The machinery"
          title="Where the numbers come from"
          icon={Database}
        >
          <P>
            Every five minutes each of the 212 parks is polled, from three public sources at once.
            When they contradict each other the majority decides, then the median, then the mean.
            Only what changed is stored, rounded to five minutes, because the parks themselves post
            in five-minute steps.
          </P>

          <IngredientGrid>
            <IngredientCard icon={Activity} title="Wait times" delay={0}>
              ThemeParks.wiki, Wartezeiten.app and Queue-Times.com, every five minutes. The raw
              currency of everything else on this page.
            </IngredientCard>
            <IngredientCard icon={GraduationCap} title="Holidays" delay={60}>
              Nager.Date for public holidays and bridge days, OpenHolidays for school holidays. Four
              years, every region separately, refreshed monthly.
            </IngredientCard>
            <IngredientCard icon={CloudSun} title="Weather" delay={120}>
              Open-Meteo for forecast, hindcast and the 15-minute rain radar. Official severe
              weather warnings come from DWD and MeteoAlarm.
            </IngredientCard>
            <IngredientCard icon={CalendarDays} title="Opening hours" delay={0}>
              From the park calendars. Where a park publishes none, we reconstruct the day from ride
              activity and mark it as estimated.
            </IngredientCard>
            <IngredientCard icon={Layers} title="History" delay={60}>
              Nothing is deleted. Older periods are only compressed, so that every analysis keeps
              running on all readings.
            </IngredientCard>
            <IngredientCard icon={BarChart3} title="Forecast models" delay={120}>
              Split by horizon: one for the day in progress, one for the coming weeks, one for the
              rest of the year. Each is scored against the times that actually happened.
            </IngredientCard>
          </IngredientGrid>

          <div className="space-y-4 pt-4">
            <P>
              The second half happens at night, while the parks are shut. “How long is Taron’s queue
              on a typical Tuesday” is a median across every measured Tuesday of the past year. You
              do not start that when somebody opens a page — it takes too long. It has to be
              standing there before the question arrives.
            </P>
            <P>
              Six steps in a fixed order, every night. Each one reads what the previous one wrote,
              so none of them can go first. By the time you open the page in the morning, all of it
              has been computed.
            </P>
          </div>

          <NightShift
            locale="en"
            jobs={NIGHT_JOBS}
            caption="Times in UTC, so the middle of the night. The order explains the times: “is getting up early worth it” at 05:15 needs yesterday in quarter hours, and those are only written at 04:30."
          />
        </SectionShell>
      </Ambience>

      {/* ── 07 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="gaps"
        index="07"
        kicker="The limits"
        title="When we do not know"
        icon={HelpCircle}
      >
        <P>
          Some fields here stay empty, and that is deliberate. Three cases in which park.fan would
          rather say nothing than guess.
        </P>

        <div className="grid gap-6 lg:grid-cols-3">
          <DemoFrame
            label="A park with no readable source"
            note="Hansa-Park publishes wait times only in its own app on the park Wi-Fi. In the data that looks like a park in the middle of the night, so it is a curated notice on park.fan. Without it, 82 rides would be sitting there at “very low”."
          >
            <NoWaitTimesDemo />
          </DemoFrame>

          <DemoFrame
            label="A ride outside its season"
            note="Nobody reports anything about an ice rink in August, because there is nothing to report. Reading that silence as “open” turns a missing report into an open ride. On that day the ride also does not count towards the “12 of 45 open” tally."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="No basis for a rating"
            note="“No forecast” is for parks we cannot rate yet: under about 30 operating days the reference value is missing. A new park gets no colour rather than a guessed one."
          >
            <BadgeRowDemo
              crowdLabel="Crowd level: how busy is it right now"
              comparisonLabel="Comparison: busier than usual?"
              caption="Two scales, one example: at 70 minutes Taron reads “Very high” — that is the crowd level. Against its own typical 45 minutes it reads “Much higher” — that is the comparison with itself. A small park can be “Very high” and still “Typical”: for it, 25 minutes is normal."
            />
          </DemoFrame>
        </div>

        <Highlight>
          The same rule governs season detection. We only name a ride’s operating months after 330
          days of observation. Before that it carries no months at all, because “runs from December
          to April” would describe the period we happen to have measured so far.
        </Highlight>
      </SectionShell>

      {/* ── 08 ──────────────────────────────────────────────────────────── */}
      <SectionShell id="visits" index="08" kicker="In practice" title="Four visits" icon={Users}>
        <P>
          The same data answers very different questions. Four examples, each with the route we
          would take.
        </P>

        <div className="grid gap-5 lg:grid-cols-2">
          <PersonaBlock
            icon={CalendarDays}
            who="A family, one day in the autumn holidays"
            question="“Which day of the holiday week is quietest, and what do we do if it rains?”"
            steps={[
              <>
                Open the park page, <strong>Calendar</strong> tab. The holiday week sits there as a
                block, coloured by forecast, with weather and opening hours in every tile.
              </>,
              <>
                Tap a day. The detail names the expected average wait and which holiday regions are
                acting on that day, including the ones from across the border.
              </>,
              <>
                Planning around a rainy day? The calendar shows it as the quietest of the week. On
                the day itself, the 15-minute rain radar at the top of the park page says when it
                stops.
              </>,
              <>
                Every attraction card carries the height requirement where the park publishes it.
                Taron asks for 140 centimetres, Colorado Adventure for 120, and that decides the day
                more than any wait time.
              </>,
              <>
                Mark the children’s rides as favourites in the <strong>Attractions</strong> tab.
                They then sit on the homepage with their current wait.
              </>,
            ]}
          />

          <PersonaBlock
            icon={BarChart3}
            who="An enthusiast, three parks in a week"
            question="“Where is rope drop worth it, and is this queue really exceptional right now?”"
            steps={[
              <>
                On the park page, the overview of rope-drop rides, sorted by minutes saved. Rides
                with no real advantage do not appear there.
              </>,
              <>
                Read the table from chapter 02 alongside each ride. It names the window it computes
                over, and a weekday with no basis gets no bar there at all.
              </>,
              <>
                During the visit, watch the comparison badge: “much higher” means genuinely
                exceptional today, not merely long.
              </>,
              <>
                Every attraction page carries a score for its own forecast, from comparing past
                predictions with the real times of the last 30 days. For Taron that is a few
                thousand forecasts compared.
              </>,
              <>
                For trip planning, compare <A href={bestTime}>the best time to visit</A>. Several
                parks stand side by side there, quietest weekday included.
              </>,
            ]}
          />

          <PersonaBlock
            icon={MapPin}
            who="An annual pass holder, 20 minutes from the park"
            question="“Is it still worth driving over this evening?”"
            steps={[
              <>
                The homepage with location access. The nearest park is at the top, with status,
                current crowd level and opening hours through tonight.
              </>,
              <>
                A crowd level of “low” on a ride that usually reads “high” is exactly the evening
                the drive is worth it for.
              </>,
              <>
                Inside the park the homepage switches to close-up view: the nearest attractions with
                distance and current wait.
              </>,
              <>
                Watch the trend arrow. A falling queue in the last hour before closing is often the
                shortest moment of the whole day.
              </>,
            ]}
          />

          <PersonaBlock
            icon={Compass}
            who="First time in a big park"
            question="“What is single rider, and in what order do we do this?”"
            steps={[
              <>
                The terms are in the <A href={glossary}>dictionary</A>, in six languages. On
                attraction pages they are linked directly in the text.
              </>,
              <>
                Work through the park’s rope-drop recommendation in the morning. It is the only
                order that rests on measured data rather than on instinct.
              </>,
              <>
                From midday, decide by crowd level rather than by minutes. A “low” ride at 25
                minutes is the better call than a “high” one at 20.
              </>,
              <>
                Shows are in the tab of the same name. The times are listed there for the whole day,
                and parades empty the paths for about half an hour.
              </>,
            ]}
          />
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
                  Ctrl + K or ⌘ + K, anywhere on the site. Finds parks, rides, shows and
                  restaurants, approximate spelling included.
                </>
              ),
            },
            {
              icon: MapPin,
              title: 'Location',
              body: (
                <>
                  Granted, the homepage shows the parks near you. Inside a park it switches to the
                  close-up view with distances.
                </>
              ),
            },
            {
              icon: Star,
              title: 'Favourites',
              body: (
                <>
                  A star on every park and attraction card. Kept in a cookie in the browser, with no
                  account and no server.
                </>
              ),
            },
            {
              icon: Activity,
              title: 'Blog',
              body: (
                <>
                  Longer pieces about individual parks and rides. The tables in them pull the same
                  numbers as the park pages instead of copying them out.
                </>
              ),
            },
            {
              icon: Moon,
              title: 'Attraction page',
              body: (
                <>
                  History, typical waits per weekday, rope drop, height requirement, forecast
                  accuracy, layout elements and the blog posts about the ride.
                </>
              ),
            },
            {
              icon: HelpCircle,
              title: 'Dictionary',
              body: (
                <>
                  <A href={glossary}>Every technical term</A> with a definition, example rides and,
                  for some, a 3D model of the track element.
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
        body="Everything on park.fan is free, without an account and without ads. A park page shows all of this on a live park, the Fancast page works out in public how accurate the last 30 days of forecasts were, and the best time to visit puts several parks side by side."
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

/** One worked example: who, what they are asking, and the route through the site. */
function PersonaBlock({
  icon: Icon,
  who,
  question,
  steps,
}: {
  icon: React.ElementType;
  who: string;
  question: string;
  steps: React.ReactNode[];
}) {
  return (
    <Reveal>
      <div className="bg-card/70 h-full rounded-2xl border p-5 sm:p-6">
        <div className="mb-3 flex items-start gap-3">
          <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Icon className="text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{who}</h3>
            <p className="text-muted-foreground mt-0.5 text-sm italic">{question}</p>
          </div>
        </div>
        <ol className="mt-4 space-y-2.5">
          {steps.map((step, i) => (
            <li key={i} className="text-muted-foreground flex gap-3 text-sm leading-relaxed">
              <span className="bg-primary/10 text-primary mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}
