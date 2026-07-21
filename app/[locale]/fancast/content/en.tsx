import React from 'react';
import { Link } from '@/i18n/navigation';
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
    'The rides whose recent forecasts landed closest to the real wait — average error in minutes, live from the model.',
  colAttraction: 'Ride',
  colPark: 'Park',
  colError: 'Avg error',
  minUnit: 'min',
};

const FAQ = [
  {
    question: 'How accurate is Fancast?',
    answer:
      'The current accuracy is shown live in the scorecard above — as MAE (average error in minutes), RMSE and MAPE. Those figures come from actually comparing past predictions with the wait times that were really measured, not from a flattering test lab. They change whenever the model retrains.',
  },
  {
    question: 'How far ahead can Fancast predict?',
    answer:
      'Fancast gives daily crowd levels for a park up to 365 days ahead. For individual rides it also produces hourly wait-time forecasts. The closer the day gets, the more short-term signals like the weather forecast are factored in.',
  },
  {
    question: 'How does Fancast know a holiday Saturday will be busy?',
    answer:
      'From the interplay of many signals: school and public holiday calendars (including neighbouring regions), the day of week, the weather forecast, special events and the park’s full wait-time history. A holiday Saturday in high summer carries almost all of those factors at once — which is why the forecast spikes there, while a rainy Tuesday in November stays green.',
  },
  {
    question: 'How often is the model updated?',
    answer:
      'Every day. Fancast automatically retrains once a day at 06:00 UTC on the freshest data — including yesterday’s wait times. So it literally gets a little better every morning.',
  },
  {
    question: 'Can I use Fancast for a specific park and day?',
    answer:
      'Yes. Every park page on park.fan has a crowd calendar that shows you a green, yellow or red forecast for each individual day up to a year ahead — from Europa-Park to Phantasialand, Efteling and Walt Disney World. You also get hourly wait-time forecasts for the individual rides.',
  },
  {
    question: 'What data does Fancast use?',
    answer:
      'Live and historical wait times from over 150 parks, school and public holiday calendars (including neighbouring regions), weather forecasts, opening hours, special events and seasonal patterns. That mix produces the daily crowd levels and the hourly wait-time forecasts.',
  },
  {
    question: 'Why does a park show “No forecast”?',
    answer:
      'Fancast only rates a park once there is enough operating data — at least around 30 operating days. Brand-new or rarely-open parks do not have that basis yet, so we would rather honestly show “No forecast” than a guessed number.',
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
      <div className="container mx-auto max-w-4xl space-y-5 px-4">
        <Lead>
          Fancast is our in-house forecasting model — the part of park.fan that looks into the future.
          The name? Shameless but systematic: <strong>fan</strong> as in park.<strong>fan</strong>,{' '}
          <strong>cast</strong> as in fore<strong>cast</strong>. A weather report for queues,
          basically.
        </Lead>
        <P>
          And because we only trust numbers that have to prove themselves, Fancast does something most
          models quietly avoid: it grades itself. Every prediction is later checked against the wait
          time that actually happened — in the open, on this page. Cheating pointless.
        </P>
        <Highlight>
          In short: Fancast is not a fortune teller with a crystal ball. It is a stubborn statistician
          that gets tutoring every night and has to re-sit the exam every morning. A weather frog that
          fact-checks its own weather.
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
          Enough preamble — here is the grade, live and unvarnished. Fancast pulls these numbers from
          its own dashboard right now; they shift the moment the model retrains tonight.
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
          A rainy bridge-day in October is a completely different animal from a sunny holiday Saturday
          in July — and a model has to learn that first. So Fancast feeds on several sources at once:
        </PG>
        <IngredientGrid>
          <IngredientCard icon={Activity} title="Live wait times" delay={0}>
            Millions of real readings from 150+ parks, updated by the minute. The raw currency of every
            forecast.
          </IngredientCard>
          <IngredientCard icon={CalendarDays} title="Calendars & holidays" delay={60}>
            Weekends, public holidays and school breaks — including neighbouring regions, because
            day-trippers do not care about borders.
          </IngredientCard>
          <IngredientCard icon={CloudSun} title="Weather" delay={120}>
            Rain probability and temperature bend the near-term forecasts. Sun pulls crowds in, all-day
            rain empties the paths.
          </IngredientCard>
          <IngredientCard icon={PartyPopper} title="Events & season" delay={0}>
            Halloween, summer holidays, long weekends, a headliner in its first summer — the usual
            suspects for a packed day.
          </IngredientCard>
          <IngredientCard icon={History} title="History" delay={60}>
            Years of wait-time history per park. Patterns you only see if you stare at them long enough.
          </IngredientCard>
          <IngredientCard icon={Gauge} title="Hours & capacity" delay={120}>
            When the park opens, for how long, at what capacity — the frame everything else fits into.
          </IngredientCard>
        </IngredientGrid>
        <P>
          Out of this mix the model makes two things: an <strong>hourly wait-time forecast</strong> for
          individual rides and a <strong>daily crowd-level grade</strong> for the whole park.
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
          All theory is grey — Fancast only gets tangible at an actual park. Three examples of how the
          same ingredients turn into three completely different forecasts:
        </P>
        <SplitFigure
          src="/images/parks/europa-park/silver-star.jpg"
          alt="Silver Star at Europa-Park"
          kicker="Europa-Park · bridge-day in October"
          title="Calm, green, under 30 minutes"
          badge={<CrowdLevelBadge level="very_low" />}
        >
          Fancast sees: school holidays in only one neighbouring region, mixed weather, no special
          event. Result: a calm, green forecast — Voltron Nevera probably under 30 minutes, blue fire a
          walk-on. The same park three weeks later on a holiday Saturday? Deep red. Six million yearly
          guests do not spread themselves out on their own.
        </SplitFigure>
        <SplitFigure
          src="/images/parks/phantasialand/taron.jpg"
          alt="Taron racing through Klugheim at Phantasialand"
          kicker="Phantasialand · holiday Saturday"
          title="Compact, packed, orange to red"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          Compact park, few headliners, everyone wants Taron — saturation arrives faster than the first
          beer is poured. Fancast knows this and paints the day orange to red. The calendar next to it
          promptly suggests the Tuesday after, when you can ride Taron back-to-back instead of just
          longing for it.
        </SplitFigure>
        <SplitFigure
          src="/images/parks/efteling/baron-1898.jpg"
          alt="Baron 1898 at Efteling"
          kicker="Efteling · rainy Tuesday in November"
          title="The insider tip the model already counts in"
          badge={<CrowdLevelBadge level="low" />}
        >
          Exactly the day gut-feeling planners avoid — and that Fancast paints green. Few holidays,
          miserable weather, short queues. It works precisely until everyone has read the same insider
          tip; which is why the model folds the rain probability in itself, instead of relying on
          folklore.
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
          The most important trick is an unglamorous one: Fancast retrains <strong>every night</strong>,
          every day at 06:00 UTC. Whatever happened yesterday, the model knows today. A coaster fan
          gets older and more tired over the years — Fancast gets a little smarter every morning.
        </P>
        <P>
          And it is only ever tested on days it has <strong>never seen</strong> — on the future, not on
          memorised days from the past. Anything else would be like slipping yourself the exam questions
          in advance and then celebrating your straight-A report card.
        </P>
        <P>
          On top of that, Fancast watches whether it is <strong>drifting</strong> — whether reality is
          slowly running away from it. And a new model version only goes live if it genuinely beats the
          old one in a fair head-to-head. Democracy among algorithms: if you are not better, you stay on
          the bench.
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
          At the end of all that arithmetic sits a single colour. Six levels, from “you have basically
          got the park to yourself” to “welcome to a holiday Saturday”:
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
              text: 'Normal operation. The headliners fill up, the rest stays easy-going. A solid compromise day.',
            },
            {
              level: 'high',
              text: 'Noticeably busy. For the top rides it pays to get up early — or to bring patience.',
            },
            {
              level: 'very_high',
              text: 'Properly busy. Long queues at the highlights; planning clearly beats spontaneity.',
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
          Enough theory. Fancast runs on every park page — here are a few popular ones to try it on
          directly. Click in, open the crowd calendar, and see which colour your chosen day gets:
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
          Fancast does not live on one lonely page — it is woven through all of park.fan, usually
          without introducing itself:
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
                  the <Link href="/parks">calendar of best days to visit</Link> on every park page —
                  green, yellow, red, up to a year ahead.
                </>
              ),
            },
            {
              icon: CalendarDays,
              title: 'Best time to visit',
              body: 'the quietest weekdays and the upcoming insider days, distilled from the same data.',
            },
            {
              icon: LineChart,
              title: 'AI forecast in the wait-time chart',
              body: 'the dashed line that reveals a ride’s cheapest time windows.',
            },
            {
              icon: Sunrise,
              title: 'Rope-drop recommendation',
              body: 'the honest answer to “is it worth arriving early?” — including the expected troughs.',
            },
            {
              icon: HelpCircle,
              title: 'No forecast',
              body: (
                <>
                  honest over guessed: parks with too little data get{' '}
                  <CrowdLevelBadge level="unknown" /> instead of an invented number.
                </>
              ),
            },
          ]}
        />
        <P>
          How it all plays out inside a park is walked through step by step in the{' '}
          <Link href="/howto">full guide</Link> — crowd calendar, badges and live wait times included.
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
