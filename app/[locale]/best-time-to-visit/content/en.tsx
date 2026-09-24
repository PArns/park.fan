import React from 'react';
import { Link } from '@/i18n/navigation';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { PopularParksGrid } from '@/components/home/featured-parks-slot';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import {
  CalendarRange,
  Sunrise,
  Ban,
  Ticket,
  HelpCircle,
  Sparkles,
  Clock,
  CalendarDays,
  CloudRain,
  Users,
  Sun,
} from 'lucide-react';
import {
  Lead,
  P,
  PG,
  Highlight,
  SectionShell,
  SplitFigure,
  TouchpointGrid,
  FaqList,
} from '@/components/marketing/editorial-ui';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { FancastCta } from '../_best-time-ui';
import { BestTimesData, type BestTimesLabels } from '../_best-times-data';
import { QuietestDaysByPark } from '../_quietest-days-by-park';

const DATA_LABELS: BestTimesLabels = {
  weekdaysTitle: 'The quietest weekdays',
  weekdaysBody:
    'Every park counts the same here, Disneyland or small family park: we scale each one to its own average first and only then average across parks. The bar shows how busy a typical weekday is compared with the average. Saturday stands out; the other six days sit closer together than most people expect.',
  monthsTitle: 'The quietest months',
  monthsBody:
    'The same maths, spread across the year. December is the odd one out, because the only parks in it are the ones that open in winter at all, and those are running their Christmas programme.',
  quieter: 'quieter',
  busier: 'busier',
  typical: 'about average',
  footnote: 'Based on {days} park-days across {parks} parks, last {months} months.',
  pending:
    'The live ranking is still gathering wait times. The quietest days will appear here as soon as enough data has built up.',
};

const FAQ = [
  {
    question: 'When is the best time to visit a theme park?',
    answer:
      'Weekdays outside the school holidays are the most relaxed, Tuesday to Thursday above all. The exact patterns by weekday and month are further up this page, straight from the measured wait times across all parks.',
  },
  {
    question: 'Which weekday is least crowded?',
    answer:
      'Averaged across all parks, Tuesday, Wednesday and Thursday are the quietest. Only Saturday is exceptionally busy; Sunday sits closer to Tuesday than to Saturday. Individual parks can look different, and the crowd calendar on each park page shows that day by day.',
  },
  {
    question: 'Which months are theme parks least crowded?',
    answer:
      'It depends more on the park than the rule of thumb suggests. Averaged across all parks, the summer months are not the busiest, and December sticks out at the top, because in winter only the parks with a Christmas programme are open. The month overview further up shows it month by month. For a particular park, its own calendar is what counts.',
  },
  {
    question: 'Is it worth visiting in the rain?',
    answer:
      'Often, yes. Bad weather keeps a lot of people away and the queues get shorter, especially at coasters that keep running in the rain. The insider tip only works until everyone has the same idea, which is why our forecasting model folds the weather in directly.',
  },
  {
    question: 'How do I find the best day for a specific park?',
    answer:
      'This page gives you the broad patterns. For a specific park, open its crowd calendar: it shows green, yellow or red for every published day, with that region’s school and public holidays included.',
  },
  {
    question: 'Where does this data come from?',
    answer:
      'From the wait times we have recorded ourselves at more than 200 parks. So that the ranking is not decided by the biggest parks, each park is normalised to its own average first and only then averaged across all of them.',
  },
] as const;

export function ContentEN() {
  return (
    <>
      {/* Intro */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          When a theme park fills up is surprisingly predictable, and certainly more predictable
          than a six-year-old’s mood at three in the afternoon. Weekday, school holidays, weather
          and season largely decide whether you wait ten minutes at the coaster or an hour and a
          half. And because every park day leaves wait times behind, it can be worked out fairly
          precisely.
        </Lead>
        <P>
          So we worked it out, from the wait times recorded at more than 200 parks. Further down are
          the quietest weekdays and months, the calmest hours of the day and the dates on which the
          sofa is the better option. The crowd calendar then picks the right day for the park you
          have in mind.
        </P>
        <Highlight>
          Short version for the impatient: Tuesday to Thursday outside the school holidays, at the
          gate for opening, and treat a mixed forecast as a gift, provided there is a rain jacket in
          the bag.
        </Highlight>
      </div>

      {/* 01 — Data: quietest weekdays + months (live) */}
      <SectionShell
        id="patterns"
        index="01"
        kicker="The data"
        title="The quietest weekdays and months"
        icon={CalendarRange}
      >
        <PG>
          Weekday and month move the most. We averaged both across all parks, from the wait times
          that were actually measured:
        </PG>
        <BestTimesData locale="en" labels={DATA_LABELS} />
        <QuietestDaysByPark locale="en" />
      </SectionShell>

      {/* 02 — Times of day */}
      <SectionShell
        id="times"
        index="02"
        kicker="By the hour"
        title="The quietest times of day"
        icon={Clock}
      >
        <P>
          After the weekday, the hour decides the most. These four windows are quietest almost
          everywhere:
        </P>
        <TouchpointGrid
          items={[
            {
              icon: Sunrise,
              title: (
                <>
                  At opening (<GlossaryTermLink termId="rope-drop">rope drop</GlossaryTermLink>)
                </>
              ),
              body: 'The first hour after the gates open is the best of the day. Be there on time and you often ride the big coasters before a queue has even formed.',
            },
            {
              icon: Users,
              title: 'Around lunchtime',
              body: 'While everyone sits down to eat, the queues get shorter. Use the time for the popular rides and eat later. The chips taste the same at half past two.',
            },
            {
              icon: Sun,
              title: 'The last hour',
              body: 'Many families head home before the end. In the last hour before closing, waits often drop noticeably once more.',
            },
            {
              icon: Ticket,
              title: 'During the big evening show',
              body: 'A parade or fireworks draws thousands of people at once. That is exactly when seats on the coasters suddenly come free.',
            },
          ]}
        />
        <SplitFigure
          src="/media/phantasialand/black-mamba.jpg"
          alt="Black Mamba racing through the jungle at Phantasialand"
          kicker="Rope drop"
          title="Arriving early helps, but not at every ride"
        >
          At the big headliners the first hour after opening often buys more rides than two in the
          afternoon. It does not hold everywhere: some rides stay equally busy all day, others only
          wake up after lunch. Each ride’s own page carries its day curve, and says whether the
          earlier alarm pays off for it.
        </SplitFigure>
      </SectionShell>

      {/* 03 — Dates to avoid */}
      <SectionShell id="avoid" index="03" kicker="Red days" title="Dates to avoid" icon={Ban}>
        <PG>
          It is just as useful to know when not to go. On these dates the parks are packed. You can
          prepare for that with snacks and a lot of patience, or plan around it:
        </PG>
        <SplitFigure
          src="/media/walibi-holland/goliath.jpg"
          alt="Goliath roller coaster at Walibi Holland on a busy day"
          kicker="Peak day"
          title="Sunny, everyone off, everyone here"
          reverse
          badge={
            <GlossaryTermLink termId="crowd-level" className="inline-flex cursor-help">
              <CrowdLevelBadge level="very_high" />
            </GlossaryTermLink>
          }
        >
          A Saturday in the summer holidays in perfect weather is the worst case: everyone is off,
          everyone wants out, everyone is here. If you are flexible, take the Tuesday after. The
          same park then looks as if someone rebuilt it overnight and forgot the queues.
        </SplitFigure>
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Weekends & public holidays',
              body: 'Across all parks, Saturday is the busiest day by a clear margin over the rest of the week. Public holidays and long weekends add another layer.',
            },
            {
              icon: CalendarRange,
              title: <GlossaryTermLink termId="school-holiday">School holidays</GlossaryTermLink>,
              body: 'As soon as your region or the one next door is on holiday, it gets busier. The summer holidays are peak season.',
            },
            {
              icon: Sun,
              title: 'Bridge days & holiday Saturdays in high summer',
              body: 'Sunshine, a day off and high season all at once. Of every combination on the calendar, this is the busiest.',
            },
            {
              icon: Sparkles,
              title: 'New rides in their first summer',
              body: 'In its first season everyone wants to have ridden the brand-new coaster, preferably before their colleagues. Expect long waits at premieres.',
            },
          ]}
        />
      </SectionShell>

      {/* 04 — Tactics */}
      <SectionShell
        id="tactics"
        index="04"
        kicker="Play it smart"
        title="Tactics for short queues"
        icon={Sparkles}
      >
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Weekday over weekend',
              body: 'The biggest lever on the calendar. Averaged across all parks, Saturday sits furthest above average and Tuesday furthest below.',
            },
            {
              icon: CloudRain,
              title: 'Use the weather cleverly',
              body: 'A mixed forecast keeps a lot of people at home. If a bit of drizzle does not bother you, you queue noticeably less. A rain jacket beats an umbrella.',
            },
            {
              icon: Ticket,
              title: (
                <>
                  <GlossaryTermLink termId="single-rider">Single rider</GlossaryTermLink> &{' '}
                  <GlossaryTermLink termId="virtual-queue">virtual queues</GlossaryTermLink>
                </>
              ),
              body: 'Fill empty seats as a single rider, or join the queue in the app while you eat or wander. You will not sit together, but you will sit sooner.',
            },
          ]}
        />
        <P>
          How it all plays out inside a park is walked through step by step in the{' '}
          <Link href={`/${HOWTO_SEGMENTS.en}`}>full guide</Link>.
        </P>
      </SectionShell>

      {/* 05 — Crowd calendar for your park */}
      <SectionShell
        id="parks"
        index="05"
        kicker="For your park"
        title="The crowd calendar"
        icon={Ticket}
      >
        <P>
          The patterns above are the rough frame. The best day for your park comes from the{' '}
          <GlossaryTermLink termId="crowd-calendar">crowd calendar</GlossaryTermLink> on each park
          page: green, yellow or red for every single day, as far as the park has published its
          schedule, with that region’s holidays built in.
        </P>
        <SplitFigure
          src="/media/efteling/symbolica.jpg"
          alt="Symbolica palace ride at Efteling"
          kicker="Green, yellow, red"
          title="One colour per day, as far as the schedule goes"
          badge={
            <GlossaryTermLink termId="crowd-level" className="inline-flex cursor-help">
              <CrowdLevelBadge level="low" />
            </GlossaryTermLink>
          }
        >
          Every park page carries a day-by-day forecast that knows the school and public holidays of
          the right region, including the ones you have never heard of. Pick a green day and the
          most important part of the planning is done before you buy a ticket.
        </SplitFigure>
        <P>A few popular parks to jump straight in:</P>
        <PopularParksGrid />
      </SectionShell>

      {/* Powered by Fancast */}
      <FancastCta
        title="Powered by Fancast"
        body="Our own forecasting model estimates the crowds for every published day and grades itself as it goes."
      />

      {/* 06 — FAQ */}
      <SectionShell
        id="faq"
        index="06"
        kicker="In brief"
        title="Frequently asked about the best time to visit"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>
    </>
  );
}
