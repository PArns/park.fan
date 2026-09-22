import React from 'react';
import { Link } from '@/i18n/navigation';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { MLStatsSection } from '@/components/home/ml-stats-section';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { PopularParksGrid } from '@/components/home/featured-parks-slot';
import {
  Activity,
  CalendarDays,
  CloudSun,
  PartyPopper,
  History,
  Gauge,
  Database,
  RefreshCw,
  MapPin,
  HelpCircle,
  Compass,
  Ticket,
  Palette,
  CalendarCheck,
  CalendarRange,
  LineChart,
  Sunrise,
} from 'lucide-react';
import {
  Lead,
  SectionShell,
  P,
  PG,
  Highlight,
  SplitFigure,
  CrowdSpectrum,
  IngredientGrid,
  IngredientCard,
  TouchpointGrid,
  FaqList,
} from '../_fancast-ui';
import { FancastLive, type FancastLiveLabels } from '../_fancast-live';

const LIVE_LABELS: FancastLiveLabels = {
  edition: 'Current edition',
  trained: 'Trained',
  basis: 'Training basis',
  datapoints: '{n} data points',
  days: 'over {d} days',
  vsPrevious: 'vs {v}',
  moreAccurate: 'more accurate',
  topTitle: 'Where Fancast has been most on-point lately',
  topIntro:
    'The rides whose recent forecasts landed closest to the real wait. Average error in minutes, live from the model.',
  colAttraction: 'Ride',
  colPark: 'Park',
  colError: 'Avg error',
  minUnit: 'min',
};

const FAQ = [
  {
    question: 'How accurate is Fancast?',
    answer:
      'The current accuracy is shown live further up this page, as MAE (average error in minutes), RMSE and MAPE. The figures come from comparing past predictions with the wait times that were measured afterwards. They change every time the model retrains.',
  },
  {
    question: 'How far ahead can Fancast predict?',
    answer:
      'Fancast gives a daily crowd level for every day a park has already put on its schedule. For individual rides it also produces hourly wait-time forecasts. The closer the day gets, the more short-term signals such as the weather forecast come into it.',
  },
  {
    question: 'How does Fancast know a holiday Saturday will be busy?',
    answer:
      'From several signals read together: school and public holiday calendars (including neighbouring regions), the day of the week, the weather forecast, special events and the park’s full wait-time history. A holiday Saturday in high summer brings almost all of them at once. That is why the forecast spikes there, while a rainy Tuesday in November stays green.',
  },
  {
    question: 'How often is the model updated?',
    answer:
      'Every day. Fancast retrains automatically once a day at 06:00 UTC, on yesterday’s wait times.',
  },
  {
    question: 'Can I use Fancast for a specific park and day?',
    answer:
      'Yes. Every park page on park.fan has a crowd calendar with a green, yellow or red forecast for each day the park has published, from Europa-Park to Phantasialand, Efteling and Walt Disney World. On top of that come hourly wait-time forecasts for the individual rides.',
  },
  {
    question: 'What data does Fancast use?',
    answer:
      'Live and historical wait times from over 200 parks, school and public holiday calendars (including neighbouring regions), weather forecasts, opening hours, special events and seasonal patterns. That mix produces the daily crowd levels and the hourly wait-time forecasts.',
  },
  {
    question: 'Why does a park show “No forecast”?',
    answer:
      'Fancast only rates a park once there is enough operating data, meaning at least around 30 operating days. Brand-new or rarely-open parks do not have that basis yet, so the badge reads “No forecast” instead of a guessed number.',
  },
  {
    question: 'Does Fancast cost anything?',
    answer:
      'No. Like all of park.fan, every forecast, crowd calendar and statistic is free, ad-free and usable without an account.',
  },
] as const;

export function ContentEN() {
  return (
    <>
      {/* Intro */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          Fancast is our own forecasting model, the part of park.fan that wants to know today how
          long the queue will be on Saturday. We named it without the help of an agency, and it
          shows: <strong>fan</strong> as in park.
          <strong>fan</strong>, <strong>cast</strong> as in fore<strong>cast</strong>. A weather
          report for queues, minus the presenter waving at a map.
        </Lead>
        <P>
          Predictions that nobody checks are easy; horoscopes have been doing it for centuries.
          Fancast has to sit an exam every day, and the results hang on this page for anyone to
          read.
        </P>
        <Highlight>
          Every forecast is set against the measured wait time the day after. The result appears in
          the next section as MAE, RMSE and MAPE, bad days included.
        </Highlight>
      </div>

      {/* 01 — Scorecard (live) */}
      <SectionShell
        id="note"
        index="01"
        kicker="The report card"
        title="How good is Fancast really?"
        icon={Gauge}
      >
        <P>
          The grades here come live from the model, not from a press kit. They change with the next
          training run tomorrow morning, so please don’t frame them.
        </P>
        <div className="overflow-hidden rounded-2xl border">
          <MLStatsSection />
        </div>
        <FancastLive labels={LIVE_LABELS} />
      </SectionShell>

      {/* 02 — What it reads */}
      <SectionShell
        id="ingredients"
        index="02"
        kicker="The ingredients"
        title="What Fancast reads"
        icon={Database}
      >
        <PG>
          Anyone who visits parks a lot knows that a rainy bridge-day in October and a sunny holiday
          Saturday in July are two different sports. A model has to learn that, and to do it Fancast
          reads six sources at once:
        </PG>
        <IngredientGrid>
          <IngredientCard icon={Activity} title="Live wait times" delay={0}>
            One reading per queue every five minutes, from more than 200 parks. Everything else is
            built on that.
          </IngredientCard>
          <IngredientCard icon={CalendarDays} title="Calendars & holidays" delay={60}>
            Weekends, public holidays and school breaks, including neighbouring regions. Dutch
            day-trippers have never once planned around a German school calendar.
          </IngredientCard>
          <IngredientCard icon={CloudSun} title="Weather" delay={120}>
            Rain probability and temperature bend the near-term forecasts. Sun brings everyone out,
            all-day rain sends them back to the sofa.
          </IngredientCard>
          <IngredientCard icon={PartyPopper} title="Events & season" delay={0}>
            Halloween, summer holidays, long weekends, a headliner in its first summer: the usual
            suspects for a packed day.
          </IngredientCard>
          <IngredientCard icon={History} title="History" delay={60}>
            Every operating day a park has been recorded on, without a gap since April 2026. That is
            where the weekly and seasonal rhythm come from.
          </IngredientCard>
          <IngredientCard icon={Gauge} title="Hours & capacity" delay={120}>
            When the park opens, for how long, at what capacity. That is the frame the rest has to
            fit into.
          </IngredientCard>
        </IngredientGrid>
        <P>
          Out of this stew the model cooks two things: an <strong>hourly wait-time forecast</strong>{' '}
          for individual rides and a <strong>daily crowd-level grade</strong> for the whole park.
        </P>
      </SectionShell>

      {/* 03 — Concrete park examples */}
      <SectionShell
        id="examples"
        index="03"
        kicker="At real parks"
        title="Fancast at three parks"
        icon={Compass}
      >
        <P>
          The same ingredients turn into very different days depending on the park and the date.
          Three examples:
        </P>
        <SplitFigure
          src="/media/europa-park/silver-star.jpg"
          alt="Silver Star at Europa-Park"
          kicker="Europa-Park · bridge-day in October"
          title="Calm, green, under 30 minutes"
          badge={<CrowdLevelBadge level="very_low" />}
        >
          Fancast sees school holidays in exactly one neighbouring region, mixed weather and no
          special event. What comes out is a calm, green forecast: Voltron Nevera probably under 30
          minutes, blue fire practically a walk-on. The same park three weeks later on a holiday
          Saturday is deep red, because six million guests a year refuse to spread themselves
          politely across the calendar.
        </SplitFigure>
        <SplitFigure
          src="/media/phantasialand/taron.jpg"
          alt="Taron racing through Klugheim at Phantasialand"
          kicker="Phantasialand · holiday Saturday"
          title="Compact, packed, orange to red"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          Compact park, few headliners, and everyone wants Taron. It fills up faster than the kiosk
          can pour its first beer. Fancast knows this and paints the day orange to red. The crowd
          calendar on the park page suggests a Tuesday instead, when you can ride Taron several
          times in a row rather than gazing at it from the path.
        </SplitFigure>
        <SplitFigure
          src="/media/efteling/baron-1898.jpg"
          alt="Baron 1898 at Efteling"
          kicker="Efteling · rainy Tuesday in November"
          title="The insider tip the model already counts in"
          badge={<CrowdLevelBadge level="low" />}
        >
          The day gut-feeling planners avoid is exactly the one Fancast paints green: few holidays,
          miserable weather, short queues. Wet socks come free. The catch with any insider tip is
          that it only works until everyone has read it, so the model folds in the rain probability
          for that exact day rather than trusting folklore.
        </SplitFigure>
      </SectionShell>

      {/* 04 — How it learns */}
      <SectionShell
        id="training"
        index="04"
        kicker="The method"
        title="How Fancast learns (and cannot cheat)"
        icon={RefreshCw}
      >
        <P>
          The most important trick is about as thrilling as brushing your teeth. Fancast retrains{' '}
          <strong>once a day</strong>, at 06:00 UTC. Whatever happened in the park yesterday is in
          the forecast from the next morning on.
        </P>
        <P>
          It is only ever tested on days it has <strong>never seen</strong>. Anything else would be
          like slipping yourself the exam questions in advance and then celebrating the A.
        </P>
        <P>
          Fancast also checks whether it is <strong>drifting</strong>, whether reality is slowly
          running away from it. A new model version only goes live once it beats the old one
          head-to-head. Promotion here goes to whoever is actually better, which is more than most
          offices can say.
        </P>
      </SectionShell>

      {/* 05 — Crowd levels */}
      <SectionShell
        id="levels"
        index="05"
        kicker="The scale"
        title="Green, yellow, red: the crowd levels"
        icon={Palette}
      >
        <PG>
          At the end of all that arithmetic sits a single colour. Six levels, from “you have
          basically got the park to yourself” to “welcome to a holiday Saturday”:
        </PG>
        <CrowdSpectrum
          items={[
            {
              level: 'very_low',
              text: 'Almost empty. Rope-drop dreams, back-to-back rides, a photo with the mascot and no queue.',
            },
            {
              level: 'low',
              text: 'Relaxed. Short waits, you get on everything without needing a battle plan.',
            },
            {
              level: 'moderate',
              text: 'Normal operation. The headliners get busier, the rest stays easy-going. A rough plan will do.',
            },
            {
              level: 'high',
              text: 'Noticeably busy. For the big rides the alarm clock pays off; otherwise bring patience and an audiobook.',
            },
            {
              level: 'very_high',
              text: 'Properly busy. Long queues at the big rides, and whoever stays spontaneous spends the day in the switchbacks.',
            },
            {
              level: 'extreme',
              text: 'Full alert. Holiday Saturday in high summer. Only with a strategy, stamina and a sense of humour.',
            },
          ]}
        />
      </SectionShell>

      {/* 06 — Try a real park */}
      <SectionShell
        id="parks"
        index="06"
        kicker="Try it yourself"
        title="Grab a park"
        icon={Ticket}
      >
        <P>
          Fancast runs on every park page. Here are a few popular ones to try: pick a park, open the
          crowd calendar and check which colour your day gets. If it is red, look at the days around
          it.
        </P>
        <PopularParksGrid />
      </SectionShell>

      {/* 07 — Where you meet it */}
      <SectionShell
        id="where"
        index="07"
        kicker="All over the park"
        title="Where you meet Fancast"
        icon={MapPin}
      >
        <P>
          This page is just the office. Fancast does its actual work everywhere else on park.fan,
          and it rarely introduces itself:
        </P>
        <TouchpointGrid
          items={[
            {
              icon: CalendarCheck,
              title: 'Today’s forecast',
              body: 'the crowd-level grade in the park header, before you even tap the first ride.',
            },
            {
              icon: CalendarRange,
              title: 'Crowd calendar',
              body: (
                <>
                  the <Link href="/parks">calendar of best days to visit</Link> on every park page:
                  green, yellow, red, as far as the schedule goes.
                </>
              ),
            },
            {
              icon: CalendarDays,
              title: 'Best time to visit',
              body: (
                <>
                  the quietest weekdays and the upcoming insider days, drawn from the same data. See
                  the <Link href={`/${BEST_TIME_SEGMENTS.en}`}>best time to visit</Link>.
                </>
              ),
            },
            {
              icon: LineChart,
              title: 'AI forecast in the wait-time chart',
              body: 'the dashed line that reveals a ride’s cheapest time windows.',
            },
            {
              icon: Sunrise,
              title: 'Rope-drop recommendation',
              body: 'the answer to “is it worth arriving early?”, with the expected troughs.',
            },
            {
              icon: HelpCircle,
              title: 'No forecast',
              body: (
                <>
                  Rather than guess: parks with too little data get{' '}
                  <CrowdLevelBadge level="unknown" /> instead of an invented number.
                </>
              ),
            },
          ]}
        />
        <P>
          How it all plays out inside a park is walked through step by step in the{' '}
          <Link href={`/${HOWTO_SEGMENTS.en}`}>full guide</Link>, crowd calendar, badges and live
          wait times included.
        </P>
      </SectionShell>

      {/* 08 — FAQ */}
      <SectionShell
        id="faq"
        index="08"
        kicker="In brief"
        title="Frequently asked about Fancast"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>
    </>
  );
}
