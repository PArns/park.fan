import { CalendarDays, Clock, Footprints, Gauge, Users, Wand2 } from 'lucide-react';
import { A, P } from '@/components/marketing/editorial-ui';
import { Chapter, Note } from '../_chrome';
import { PlannerDayDemo } from '../_demos';
import { DEMO_PARTY_RIDES } from '../_fixtures';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerEntry } from '@/lib/planner/types';

const PARK = '/parks/europe/germany/bruehl/phantasialand';

/** The planner page's article, English. See `content/de.tsx` for the convention. */
export function ContentEN({ day, entries }: { day: PlanDay; entries: PlannerEntry[] }) {
  return (
    <>
      <Chapter
        id="a-planned-day"
        index="01"
        icon={CalendarDays}
        kicker="The day as a timeline"
        title="Blocks and transfers"
      >
        <P>
          Every ride in your plan is a block on the day’s timeline, and it’s as tall as the queue
          you’re expected to stand in at that hour. Drag it into a busier hour and it grows; drop it
          into a quieter one and it shrinks. Between two blocks sits the transfer, with the distance
          to the next ride and whether there’s time for it. &ldquo;Tight&rdquo; means it stops
          working as soon as the wait before it is off by as much as it usually is.
        </P>
        <P>
          Below is a plan for <A href={PARK}>Phantasialand</A> on Saturday 12 September 2026, with
          the waits that were forecast for it on 4 September. Drag a block to another time and its
          height and the transfers are worked out again. None of it ends up in your own plan.
        </P>
        <PlannerDayDemo day={day} entries={entries} selected="demo-taron" />
        <Note>
          The selected block carries the time, the expected wait and how far the forecast for that
          ride is usually off.
        </Note>
        <P>
          On a wide screen two days fit side by side, say Saturday and Sunday, or two parks. Each
          has its total queueing time next to it, so you can see which day costs you less standing
          around.
        </P>
      </Chapter>

      <Chapter
        id="where-the-number-comes-from"
        index="02"
        icon={Gauge}
        kicker="Forecast"
        title="Where the wait times come from"
      >
        <P>
          Every ride has a forecast for the whole day, hour by hour. On this Saturday Black Mamba
          drops from 35 minutes at midday to 20 in the evening, while Chiapas is at 20 minutes at a
          quarter past ten and 35 in the afternoon. So on this day Black Mamba belongs in the
          evening and Chiapas in the morning.
        </P>
        <P>
          How far the forecast for a ride is usually off is on its block, 15 minutes for{' '}
          <A href={`${PARK}/taron`}>Taron</A> on this Saturday. The further away the day, the
          rougher the figure, and next to it is how it was made, from &ldquo;Hourly forecast&rdquo;
          through &ldquo;From the day forecast&rdquo; to &ldquo;Rough estimate&rdquo;.
        </P>
        <P>
          <A href="/parks/europe/germany/sierksdorf/hansa-park">Hansa-Park</A> only shows its wait
          times in its own app on the park’s Wi-Fi, so there are no figures for it. You can still
          plan a day there, just without minutes and without the sorting buttons.
        </P>
      </Chapter>

      <Chapter
        id="who-is-coming"
        index="03"
        icon={Users}
        kicker="Your group"
        title="Height limits and water rides"
      >
        <P>
          A new day starts with four questions: which park, which day, who’s coming and which big
          rides go into the plan. In the month view every day is coloured by how busy it’s expected
          to be, and the park’s <A href={`${PARK}/wait-time-calendar`}>wait-time calendar</A> has
          more detail.
        </P>
        <P>
          If children are coming, you say how tall the smallest one is and whether you’d rather stay
          dry. Rides with a higher minimum height and water rides then get a mark, and they stay in
          the list anyway, because only you know whether someone will wait at the exit holding the
          bags. At Phantasialand Taron needs {DEMO_PARTY_RIDES.taron.minimumHeight} cm and Chiapas{' '}
          {DEMO_PARTY_RIDES.chiapas.minimumHeight} cm, and Chiapas gets you wet (as of 29 September
          2026). With a child of 120 cm, both carry the mark.
        </P>
        <Note>
          Where we have no height limit on file, as with Moptis Monkey Depot, the ride gets no mark.
          At the ride’s entrance, the park’s own rule applies.
        </Note>
      </Chapter>

      <Chapter
        id="through-the-day"
        index="04"
        icon={Clock}
        kicker="Through the day"
        title="Opening times, shows and breaks"
      >
        <P>
          On this Saturday Phantasialand opens at 9:00, but Taron, F.L.Y. and most of the other big
          rides don’t run until 10:00. If you’re there at nine, start with Black Mamba or Maus au
          Chocolat. A block can’t be dragged to before its ride opens.
        </P>
        <P>
          Showtimes are on the timeline too. For today they’re the park’s own. No source publishes
          them for later dates, so we carry over the times from the last matching weekday and mark
          them &ldquo;Expected&rdquo;.
        </P>
        <P>
          Breaks, food or a meeting point go in as a block of your own, dragged to whatever length
          you need. Tick &ldquo;Plan a lunch break&rdquo; when you set up the day and there’s
          already one at 12:30. Above the day you’ll also find school and public holidays and, up to
          about two weeks ahead, the weather.
        </P>
      </Chapter>

      <Chapter
        id="sorting-the-day"
        index="05"
        icon={Wand2}
        kicker="Sorting"
        title="Having the day sorted for you"
      >
        <P>
          Two buttons put the day in order, so you don’t have to move every block yourself.
          &ldquo;Plan every headliner&rdquo; adds whichever big rides are still missing and then
          orders the whole day; &ldquo;Optimise the day&rdquo; only rearranges what’s already there.
          Either way, everything happens before the park closes and you spend as little time
          queueing as possible.
        </P>
        <P>
          A lunch break and rides you’ve ticked off stay where they are. Afterwards you see how many
          minutes of queueing you’ve saved, and Undo brings back what you had.
        </P>
        <P>
          If not everything fits, an assistant opens. First come the changes that make room without
          dropping a ride, such as a shorter lunch break. If that isn’t enough, you rank the rides
          by how much they matter to you, and cuts come from the bottom.
        </P>
      </Chapter>

      <Chapter
        id="in-the-park"
        index="06"
        icon={Footprints}
        kicker="In the park"
        title="On the day itself"
      >
        <P>
          In the park you tick off what you’ve ridden. The block then carries the wait that was
          reported when you ticked it, and how far the estimate was from it. If a planned ride is
          reporting closed right now, that’s on its block too.
        </P>
        <P>
          With notifications on, we tell you when it’s time to head to the next ride, when a planned
          ride closes or reopens, and when a wait changes a lot. Showtimes can be sent as well. You
          choose which of these you get.
        </P>
        <P>
          The plan is stored in your browser, and you don’t need an account. Only for notifications
          do we keep a copy on our server, and it’s deleted as soon as you switch them off. While
          it’s there, you can send someone a link to the plan, and they can take it over as their
          own copy.
        </P>
      </Chapter>
    </>
  );
}
