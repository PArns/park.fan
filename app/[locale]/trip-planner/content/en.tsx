import { CalendarDays, Footprints, Gauge, HelpCircle, Sunrise, Theater, Wand2 } from 'lucide-react';
import { A, P } from '@/components/marketing/editorial-ui';
import { Chapter, Note } from '../_chrome';
import { PlannerDayDemo } from '../_demos';
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
        title="What the planner makes of a day at a park"
      >
        <P>
          A block is a ride, and its height is the wait predicted for its hour. Drag the same block
          into a busier hour and it grows; drop it in a quieter one and it shrinks. Between two
          blocks sits the transfer: how far it is, and whether there is time for it. Getting out of
          the station and the ride itself are counted in the transfer.
        </P>
        <P>
          The timeline below is built from the same components as the planner and shows the answer
          the API gave on 4 September 2026 for Saturday 12 September at{' '}
          <A href={PARK}>Phantasialand</A>. Drag a block to another hour. It snaps to five minutes,
          and its height and the transfers beside it are worked out again. Nothing here is saved.
        </P>
        <PlannerDayDemo day={day} entries={entries} selected="demo-taron" />
        <Note>
          The selected block spells it out: the hour, the expected wait, and how far the forecast
          for that ride is typically off.
        </Note>
      </Chapter>

      <Chapter
        id="where-the-number-comes-from"
        index="02"
        icon={Gauge}
        kicker="The figure on a block"
        title="Where the minutes come from, and how sure they are"
      >
        <P>
          For every ride the API answers with a curve across the day, hour by hour. On this Saturday
          Taron reads 45 minutes at ten, 50 at eleven, 40 at one and 50 again in the evening, never
          more than ten minutes apart across the whole day. There is no good window for Taron on
          this day, so the planner puts it wherever the rest of the day leaves room. Black Mamba, on
          the other hand, falls from 35 minutes at midday to 20 at six, and Chiapas runs the other
          way, from 20 to 35.
        </P>
        <P>
          On top of that comes how far the figure typically lands from the truth, and that follows
          the level: the longer a queue, the wider the spread. For the rides whose day peaks at 35
          minutes or more, the API reports a typical error of 15.4 minutes on this Saturday, and
          10.9 for the flatter ones. Typical means half the days are further out than that. So the
          planner writes it as a plus-minus on the selected block. Written as a range, it would look
          as if the real wait were sure to fall inside it.
        </P>
        <Note>
          Taron&apos;s curve stands on 142 measured days, Black Mamba&apos;s on 161. How many there
          are is on <A href={`${PARK}/taron`}>the ride&apos;s own page</A>.
        </Note>
        <P>
          The planner also says what kind of forecast it is holding. Where the model works the day
          through hour by hour, it says so. Where the day&apos;s height is predicted and the shape
          comes from earlier days, as on this Saturday, it says that instead. Far enough ahead even
          the height of the whole day is uncertain, and it drops to a rough estimate. For a day
          nobody has ever measured there is no plan with numbers in it at all.
        </P>
      </Chapter>

      <Chapter
        id="opening-hours"
        index="03"
        icon={Sunrise}
        kicker="Opening"
        title="The park opens at nine, the ride at ten"
      >
        <P>
          Phantasialand opens at 9:00 on this Saturday. Taron, F.L.Y., both Winja&apos;s and Raik
          run from 10:00, Chiapas from 10:15. Anybody at the turnstile at nine can ride Black Mamba
          or Maus au Chocolat and nothing else. A plan that fills the first hour with headliners
          does not work on this day.
        </P>
        <P>
          The planner knows each ride&apos;s own opening time and will not let a block slide in
          front of it. It cannot do the same for the evening, because no feed reliably reports when
          a ride closes. The axis stops at the park&apos;s closing time.
        </P>
      </Chapter>

      <Chapter
        id="transfers"
        index="04"
        icon={Footprints}
        kicker="The way between"
        title="How long it takes to get from ride to ride"
      >
        <P>
          A wait-time feed tells you Taron is at 50 minutes. It does not tell you whether you can
          get there from Rookburgh in time, and that is what the transfer works out. It takes the
          distance between the two rides&apos; coordinates, plus three minutes to get out of a
          station and three for boarding and riding where no duration is on file.
        </P>
        <P>
          That distance is a straight line, and it is labelled as one. On foot it is further: paths
          bend around water, queues and one-way routing, and Phantasialand stacks Rookburgh and
          Klugheim on top of each other. So the upper bound is worked at park pace rather than a
          brisk walk, with two thirds added to the straight line for the detour.
        </P>
        <Note>
          &ldquo;Tight&rdquo; means this transfer stops working if the forecast is as far off as it
          says it might be. Where the API reports no spread, the verdict stops at &ldquo;good&rdquo;
          and says so in its title.
        </Note>
      </Chapter>

      <Chapter
        id="sorting-the-day"
        index="05"
        icon={Wand2}
        kicker="Sorting"
        title="Letting the planner sort the day"
      >
        <P>
          Two buttons do that. &ldquo;Plan every headliner&rdquo; pulls in the park&apos;s big rides
          that are not in the day yet and then orders the lot; &ldquo;Optimise the day&rdquo; adds
          nothing and only reorders what is already planned. The same arithmetic runs behind both.
          Use the first when big rides are still missing, and the second when only the order needs
          to improve.
        </P>
        <P>
          It sorts by four rules, in this order. What matters to you comes first: whatever you pull
          to the front is the last to fall out. Next, everything has to happen before the park
          closes. The planner would rather have one ride fewer that will certainly happen than one
          more that no longer fits. Then comes the total time spent queueing. And where two orders
          cost the same, the one that finishes earlier wins. There is no slider for weighing
          queueing against hanging about, because no value for that trade-off could be justified.
        </P>
        <P>
          No rule about early mornings is hiding in there. The planner knows nothing but each
          ride&apos;s own hourly curve. Where that curve is lowest just after opening, &ldquo;the
          big ride first&rdquo; falls out of the arithmetic by itself; where it is flat, something
          else does. Across one measured day Taron reads 60, 60, 54, 53 and 59 minutes hour by hour
          while Chiapas climbs 22 minutes.
        </P>
        <P>
          Sometimes the suggestion is to wait a while rather than join a queue now. That happens
          under a single condition: the queue has to drop far enough that, break included, you are
          free again earlier than if you had queued straight away. A shorter queue alone is not
          enough; the break must not make the day end any later. Such a break never lasts more than
          two hours. That limit hardly ever comes into play, though, because a break only pays if it
          is shorter than the queue it saves, and a two-hour break would need a queue of over two
          hours.
        </P>
        <P>
          A lunch break at one stays at one, and a ride you have ticked off has happened and is not
          re-planned; the rest is arranged around both. Afterwards it says what it did. &ldquo;18
          min less queueing&rdquo; is the difference between two sums worked the same way, one
          before the press and one after; where there is nothing to gain it says the order is
          already right and the plan stays as it was. The headliner button reports no saving, since
          the day is longer with the new rides in it; it counts instead how many rides came in and
          how many are not for the group. Anything that no longer fits before closing is reported
          after either button. An undo comes with it and puts back the state from before the press,
          for as long as the planner is open.
        </P>
        <Note>
          Where no wait times arrive, neither button is drawn at all. At Hansa-Park every ride costs
          the same assumed nothing, so one order is as good as another and there is nothing to sort.
        </Note>
      </Chapter>

      <Chapter
        id="showtimes"
        index="06"
        icon={Theater}
        kicker="Shows"
        title="Where the showtimes come from"
      >
        <P>
          For today the API has the operator&apos;s own listing. For any other date no source knows
          the times in advance, so it carries the last matching weekday forward and says which date
          the times came from and how many days stand behind them. To keep the two apart, a
          projection gets a tilde in front of the time and the word &ldquo;Expected&rdquo;. An
          operator&apos;s listing gets neither.
        </P>
        <P>
          Every showtime on this Saturday is a projection: Dragon Drago and Kroka&apos;s Lodge from
          15 August, Miji African Dancers from the 29th. Kroka&apos;s Lodge&apos;s last performance
          at 19:00 does not appear on the axis: the park closes at 18:00, and projected times past
          closing are dropped.
        </P>
      </Chapter>

      <Chapter
        id="limits"
        index="07"
        icon={HelpCircle}
        kicker="Limits"
        title="What the planner does not know"
      >
        <P>
          Not every park publishes wait times.{' '}
          <A href="/parks/europe/germany/sierksdorf/hansa-park">Hansa-Park</A> shows its own only in
          its app on the park WLAN, so no number will ever arrive for it and the planner invents
          none. For dates far enough out there is no weather either: the forecast reaches about two
          weeks, and past that the panel says so rather than leaving a gap that reads as &ldquo;dry
          all day&rdquo;.
        </P>
        <P>
          On the day itself a ride can break down, a show can be cancelled or a thunderstorm can
          shift the afternoon. The plan only works out whether the day can fit with the forecast
          waits. In the park you tick off what you have ridden, and the planner records the wait
          that was actually there.
        </P>
        <P>
          The plan is stored in your browser, and you do not need an account. Only when you switch
          on notifications does a copy go to the server, and the planner says so at that point.
          Opening the planner without a plan starts the wizard with the four questions that have to
          be settled first: which park, which day, who is coming, and which big rides belong in the
          day. The right day is easiest to find in a park&apos;s{' '}
          <A href={`${PARK}/wait-time-calendar`}>wait-time calendar</A>.
        </P>
      </Chapter>
    </>
  );
}
