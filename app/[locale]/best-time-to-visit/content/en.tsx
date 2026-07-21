import React from 'react';
import { Link } from '@/i18n/navigation';
import { PopularParksGrid } from '@/components/home/featured-parks-slot';
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
import { Section, P, PG, TipList, FancastCta, FaqList } from '../_best-time-ui';
import { BestTimesData, type BestTimesLabels } from '../_best-times-data';

const DATA_LABELS: BestTimesLabels = {
  weekdaysTitle: 'The quietest weekdays',
  weekdaysBody:
    'Averaged across all parks — each park normalised to its own average first, so big parks do not drown out small ones. This is how busy a typical weekday is versus the average. Tuesday to Thursday win almost every time.',
  monthsTitle: 'The quietest months',
  monthsBody:
    'The same maths across the year: off-season months are noticeably emptier than the summer and holiday peaks.',
  quieter: 'quieter',
  busier: 'busier',
  typical: 'about average',
  footnote: 'Based on {days} park-days across {parks} parks, last {months} months.',
};

const FAQ = [
  {
    question: 'When is the best time to visit a theme park?',
    answer:
      'It is quietest on weekdays outside school holidays — Tuesday to Thursday in the off-season are almost always the most relaxed days. The exact patterns by weekday and month are shown above, live from real wait-time data across all parks.',
  },
  {
    question: 'Which weekday is least crowded?',
    answer:
      'Averaged across all parks, Tuesday, Wednesday and Thursday are the quietest, while Saturday and Sunday are clearly the busiest. Individual parks can differ — each park page has a crowd calendar that shows it day by day.',
  },
  {
    question: 'Which months are theme parks least crowded?',
    answer:
      'The off-season months away from the summer and public-holiday peaks are the emptiest. The month overview above shows relative busyness across the year, averaged over all parks.',
  },
  {
    question: 'Is it worth visiting in the rain?',
    answer:
      'Often yes: bad weather puts many visitors off and queues shorten — especially for coasters that run anyway. But the insider tip only works until everyone has the same idea, which is why our forecasting model folds the weather in directly.',
  },
  {
    question: 'How do I find the best day for a specific park?',
    answer:
      'This page shows the global patterns as a starting point. For a specific park, open its crowd calendar: it shows a green, yellow or red forecast for each individual day up to a year ahead — including that region’s school and public holidays.',
  },
  {
    question: 'Where does this data come from?',
    answer:
      'From the actually recorded wait times of 150+ parks over the last two years. Each park is normalised to its own average and then averaged across all parks, so the ranking is fair and not dominated by the biggest parks.',
  },
] as const;

export function ContentEN() {
  return (
    <div className="space-y-14 text-base leading-7">
      {/* Data: quietest weekdays + months (live) */}
      <div className="space-y-4">
        <PG>
          Theme-park crowds are not random: when it gets busy follows clear patterns of weekday,
          holidays, weather and season. Here are the biggest ones — averaged across all parks, from
          real wait-time data:
        </PG>
        <BestTimesData locale="en" labels={DATA_LABELS} />
      </div>

      {/* Times of day */}
      <Section id="times" title="The quietest times of day" icon={Clock}>
        <P>
          It is not only the day that matters, but the hour too. Three windows are quietest almost
          everywhere:
        </P>
        <TipList
          items={[
            {
              icon: Sunrise,
              title: 'At opening (rope drop)',
              body: 'The first hour is golden: arrive for opening and you often ride the headliners at a fraction of the later wait.',
            },
            {
              icon: Users,
              title: 'Around lunchtime',
              body: 'When the crowds eat, the queues drain — a good moment for the popular rides (and to eat later).',
            },
            {
              icon: Sun,
              title: 'The last 90 minutes',
              body: 'Many day-trippers leave early. Just before closing, waits often drop noticeably once more.',
            },
            {
              icon: Ticket,
              title: 'During the big evening show',
              body: 'A parade or fireworks ties up thousands of guests at once — the coasters’ wait times measurably dip.',
            },
          ]}
        />
      </Section>

      {/* Dates to avoid */}
      <Section id="avoid" title="Dates to avoid" icon={Ban}>
        <PG>
          As important as the quiet days are the busy ones. Expect crowds on these dates — plan for
          them, or plan around them:
        </PG>
        <TipList
          items={[
            {
              icon: CalendarDays,
              title: 'Weekends & public holidays',
              body: 'Saturday and Sunday are the busiest across all parks; public holidays and long weekends push it further.',
            },
            {
              icon: CalendarRange,
              title: 'School holidays',
              body: 'Crowds rise sharply during the holidays of your own and neighbouring regions — the summer break most of all.',
            },
            {
              icon: Sun,
              title: 'Bridge days & holiday Saturdays in high summer',
              body: 'The classic peak combo: sunny, everyone off, everyone there. If you can, take the Tuesday after instead.',
            },
            {
              icon: Sparkles,
              title: 'New rides in their first summer',
              body: 'A brand-new coaster pulls crowds in its opening season — expect long queues at premieres.',
            },
          ]}
        />
      </Section>

      {/* Tactics */}
      <Section id="tactics" title="Tactics for short queues" icon={Sparkles}>
        <TipList
          items={[
            {
              icon: CalendarDays,
              title: 'Weekday over weekend',
              body: 'The single biggest lever: a Tuesday instead of a Saturday can halve the wait times.',
            },
            {
              icon: CloudRain,
              title: 'Use the weather cleverly',
              body: 'A mixed forecast puts many people off. If you are weatherproof, you queue less — a rain jacket beats an umbrella.',
            },
            {
              icon: Sunrise,
              title: 'Arrive early',
              body: 'Rope drop beats almost every other tactic. The first hour often replaces two in the afternoon.',
            },
            {
              icon: Ticket,
              title: 'Single rider & virtual queues',
              body: 'Ride alone or queue digitally while you eat or shop — free time on busy days.',
            },
          ]}
        />
        <P>
          How it all plays out inside a park is walked through step by step in the{' '}
          <Link href="/howto">full guide</Link>.
        </P>
      </Section>

      {/* Grab a park */}
      <Section id="parks" title="For your park: the crowd calendar" icon={Ticket}>
        <P>
          The patterns above are the starting point. The exact best day comes from the crowd calendar
          on each park page — green, yellow, red, up to a year ahead, with that region’s holidays
          built in. A few popular parks to jump straight in:
        </P>
        <PopularParksGrid />
      </Section>

      {/* Powered by Fancast */}
      <FancastCta
        title="Powered by Fancast"
        body="Our forecasting model — it predicts crowds up to 365 days ahead and grades itself in the open."
      />

      {/* FAQ */}
      <Section id="faq" title="Frequently asked about the best time to visit" icon={HelpCircle}>
        <FaqList items={FAQ} />
      </Section>
    </div>
  );
}
