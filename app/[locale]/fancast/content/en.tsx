import React from 'react';
import { Link } from '@/i18n/navigation';
import { MLStatsSection } from '@/components/home/ml-stats-section';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
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
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import {
  Lead,
  Section,
  P,
  Highlight,
  TocNav,
  IngredientGrid,
  IngredientCard,
  CrowdLegend,
  TouchpointList,
  FaqList,
} from '../_fancast-ui';

const FAQ = [
  {
    question: 'How accurate is Fancast?',
    answer:
      'The current accuracy is shown live at the top of this page — as MAE (average error in minutes), RMSE and MAPE. Those figures come from actually comparing past predictions with the wait times that were really measured, not from a flattering test lab. They change whenever the model retrains.',
  },
  {
    question: 'How far ahead can Fancast predict?',
    answer:
      'Fancast gives daily crowd levels for a park up to 365 days ahead. For individual rides it also produces hourly wait-time forecasts. The closer the day gets, the more short-term signals like the weather forecast are factored in.',
  },
  {
    question: 'How often is the model updated?',
    answer:
      'Every day. Fancast automatically retrains once a day at 06:00 UTC on the freshest data — including yesterday’s wait times. So it literally gets a little better every morning.',
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
    <div className="space-y-14 text-base leading-7">
      {/* Intro */}
      <div className="space-y-5">
        <Lead>
          Fancast is our in-house forecasting model — the part of park.fan that looks into the future.
          The name? Shameless but systematic: <strong>fan</strong> as in park.<strong>fan</strong>,{' '}
          <strong>cast</strong> as in fore<strong>cast</strong>. A weather report for queues,
          basically.
        </Lead>
        <P>
          The idea is as simple as it is ambitious: Fancast reads millions of real live wait times and
          predicts how busy a park will be on any given day — up to 365 days ahead. Whether Saturday is
          worth it, or you would do yourself a favour with Tuesday. Green, yellow or red, long before
          you are in the car.
        </P>
        <P>
          And because we only trust numbers that have to prove themselves, Fancast does something most
          models quietly avoid: it grades itself. Every prediction is later checked against the wait
          time that actually happened — in the open, right here on this page. Cheating pointless.
        </P>
        <Highlight>
          In short: Fancast is not a fortune teller with a crystal ball. It is a stubborn statistician
          that gets tutoring every night and has to re-sit the exam every morning. A weather frog that
          fact-checks its own weather.
        </Highlight>

        <TocNav
          label="Table of contents"
          items={[
            ['#note', 'The live report card'],
            ['#ingredients', 'What Fancast reads'],
            ['#training', 'How Fancast learns'],
            ['#levels', 'Green, yellow, red'],
            ['#where', 'Where you meet Fancast'],
            ['#limits', 'Where the limits are'],
            ['#faq', 'Frequently asked'],
          ]}
        />
      </div>

      {/* Live scorecard — reuses the homepage ML section (live from the dashboard) */}
      <div id="note" className="scroll-mt-20 space-y-4">
        <P>
          Enough preamble — here is the report card, live and unvarnished. Fancast pulls these numbers
          from its own dashboard right now; they shift the moment the model retrains tonight:
        </P>
      </div>
      <div className="-mx-4">
        <MLStatsSection />
      </div>

      {/* What it reads */}
      <Section id="ingredients" title="What Fancast reads" icon={Database}>
        <P>
          A rainy bridge-day in October is a completely different animal from a sunny holiday Saturday
          in July — and a model has to learn that first. So Fancast feeds on several sources at once:
        </P>
        <IngredientGrid>
          <IngredientCard icon={Activity} title="Live wait times">
            Millions of real readings from 150+ parks, updated by the minute. The raw currency of every
            forecast.
          </IngredientCard>
          <IngredientCard icon={CalendarDays} title="Calendars & holidays">
            Weekends, public holidays and school breaks — including neighbouring regions, because
            day-trippers do not care about borders.
          </IngredientCard>
          <IngredientCard icon={CloudSun} title="Weather">
            Rain probability and temperature bend the near-term forecasts. Sun pulls crowds in, all-day
            rain empties the paths.
          </IngredientCard>
          <IngredientCard icon={PartyPopper} title="Events & season">
            Halloween, summer holidays, long weekends, a headliner in its first summer — the usual
            suspects for a packed day.
          </IngredientCard>
          <IngredientCard icon={History} title="History">
            Years of wait-time history per park. Patterns you only see if you stare at them long enough.
          </IngredientCard>
          <IngredientCard icon={Gauge} title="Hours & capacity">
            When the park opens, for how long, at what capacity — the frame everything else fits into.
          </IngredientCard>
        </IngredientGrid>
        <P>
          Out of this mix the model makes two things: an <strong>hourly wait-time forecast</strong> for
          individual rides and a <strong>daily crowd-level grade</strong> for the whole park.
        </P>
      </Section>

      {/* How it learns */}
      <Section id="training" title="How Fancast learns (and cannot cheat)" icon={RefreshCw}>
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
      </Section>

      {/* Crowd levels */}
      <Section id="levels" title="Green, yellow, red: the crowd levels" icon={Gauge}>
        <P>
          At the end of all that arithmetic sits a single colour. Six levels, from “you have basically
          got the park to yourself” to “welcome to a holiday Saturday”:
        </P>
        <CrowdLegend
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
              text: 'Full alert. Holiday Saturday in high summer. Recommended only with a strategy, stamina and a sense of humour.',
            },
          ]}
        />
      </Section>

      {/* Where you meet it */}
      <Section id="where" title="Where you meet Fancast" icon={MapPin}>
        <P>
          Fancast does not live on one lonely page — it is woven through all of park.fan, usually
          without introducing itself:
        </P>
        <TouchpointList
          items={[
            {
              title: 'Today’s forecast',
              body: 'the crowd-level grade in the park header, before you even tap the first ride.',
            },
            {
              title: 'Crowd calendar',
              body: (
                <>
                  the <Link href="/parks">calendar of best days to visit</Link> on every park page —
                  green, yellow, red, up to a year ahead.
                </>
              ),
            },
            {
              title: 'Best time to visit',
              body: 'the quietest weekdays and the upcoming insider days, distilled from the same data.',
            },
            {
              title: 'AI forecast in the wait-time chart',
              body: 'the dashed line that reveals a ride’s cheapest time windows.',
            },
            {
              title: 'Rope-drop recommendation',
              body: 'the honest answer to “is it worth arriving early?” — including the expected troughs.',
            },
          ]}
        />
        <P>
          How it all plays out inside a park is walked through step by step in the{' '}
          <Link href="/howto">full guide</Link>.
        </P>
      </Section>

      {/* Limits */}
      <Section id="limits" title="Where Fancast stays quiet (for now)" icon={ShieldAlert}>
        <P>
          Fancast is good, but not delusional — and it tells you when it would rather keep quiet. For
          parks with <strong>fewer than about 30 operating days</strong> of data there is simply no
          grade; instead it honestly says “No forecast” rather than a guessed number:
        </P>
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
          <CrowdLevelBadge level="unknown" />
          <span className="text-muted-foreground text-sm leading-relaxed">
            Not ratable yet — too few operating days to assign a colour in good conscience.
          </span>
        </div>
        <P>
          And even where Fancast has an opinion, it comes with <strong>confidence</strong> — an honest
          “pretty sure” or “more of a hunch”. New parks, exotic special events, a first-ever winter
          festival: the model is still learning there. It gets better every season — the only promise is
          that we will not sugar-coat it.
        </P>
      </Section>

      {/* FAQ */}
      <Section id="faq" title="Frequently asked about Fancast" icon={HelpCircle}>
        <FaqList items={FAQ} />
      </Section>
    </div>
  );
}
