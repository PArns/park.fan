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
        title="Blocks and transfers"
      >
        <P>
          A block is a ride, and its height is the wait predicted for its hour. Drag the same block
          into a busier hour and it grows; drop it in a quieter one and it shrinks. Between two
          blocks sits the transfer: how far it is, and whether there’s time for it. Getting out of
          the station and the ride itself are already counted in it.
        </P>
        <P>
          The timeline below is built from the same components as the planner and shows the answer
          the API gave on 4 September 2026 for Saturday 12 September at{' '}
          <A href={PARK}>Phantasialand</A>. Drag a block to another hour. It snaps to five minutes,
          and its height and the transfers beside it are worked out again. Nothing here is saved.
        </P>
        <PlannerDayDemo day={day} entries={entries} selected="demo-taron" />
        <Note>
          On the selected block the same is written out in words: the hour, the expected wait, and
          how far the forecast for that ride is typically off.
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
          For every ride the API returns a curve across the day, hour by hour. On this Saturday
          Taron reads 45 minutes at ten, 50 at eleven, 40 at one and 50 again in the evening, never
          more than ten minutes apart across the whole day. With no good window for Taron that day,
          it ends up wherever the rest of the day leaves room. Black Mamba falls from 35 minutes at
          midday to 20 at six, and Chiapas runs the other way, from 20 to 35.
        </P>
        <P>
          Each figure also comes with how far it typically lands from the truth, and the longer the
          queue, the wider that spread. For the rides whose day peaks at 35 minutes or more, the API
          reports a typical error of 15.4 minutes on this Saturday, and 10.9 for the flatter ones.
          On half of all days the real wait is further out than that. That’s why it’s shown as a
          plus-minus on the selected block. A range would look as if the real wait were sure to fall
          inside it.
        </P>
        <Note>
          Taron’s curve rests on 142 measured days, Black Mamba’s on 161. How many there are for any
          ride is on <A href={`${PARK}/taron`}>the ride’s own page</A>.
        </Note>
        <P>
          Next to the figure is the kind of forecast behind it. Where the model works the day
          through hour by hour, the label says so. Where the day’s height is predicted and the shape
          comes from earlier days, as on this Saturday, it says that instead. Far enough ahead even
          the height of the whole day is uncertain, and the label drops to a rough estimate. For a
          day nobody has ever measured, there’s no plan with numbers in it at all.
        </P>
      </Chapter>

      <Chapter
        id="opening-hours"
        index="03"
        icon={Sunrise}
        kicker="Opening"
        title="Rides that open later than the park"
      >
        <P>
          Phantasialand opens at 9:00 on this Saturday. Taron, F.L.Y., both Winja’s and Raik run
          from 10:00, Chiapas from 10:15. Anybody at the turnstile at nine can choose between Black
          Mamba and Maus au Chocolat. A plan that fills the first hour with headliners doesn’t work
          on this day.
        </P>
        <P>
          Every ride has its own opening time, and its block can only be dragged to that time or
          later. The evening has no such limit, because no feed reliably reports when a ride closes;
          the axis stops at the park’s closing time.
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
          A wait-time feed reports Taron at 50 minutes. Whether you can get there from Rookburgh in
          time is what the transfer works out. It takes the distance between the two rides’
          coordinates, plus three minutes to get out of a station and three for boarding and riding
          where no duration is on file.
        </P>
        <P>
          That distance is a straight line, and it’s labelled as one. On foot it’s further, because
          paths bend around water, queues and one-way routing, and Phantasialand stacks Rookburgh
          and Klugheim on top of each other. So the upper bound is worked at park pace rather than a
          brisk walk, with two thirds added to the straight line for the detour.
        </P>
        <Note>
          A transfer counts as &ldquo;tight&rdquo; when it stops working once the forecast is off by
          as much as its own stated error. Where the API reports no spread, the verdict stays at
          &ldquo;good&rdquo;, and its title adds that.
        </Note>
      </Chapter>

      <Chapter
        id="sorting-the-day"
        index="05"
        icon={Wand2}
        kicker="Sorting"
        title="Two buttons that sort the day"
      >
        <P>
          Both run the same arithmetic. &ldquo;Plan every headliner&rdquo; pulls in whichever of the
          park’s big rides the day still lacks and then orders the lot; &ldquo;Optimise the
          day&rdquo; only reorders what’s already planned. Use the first when big rides are still
          missing, and the second when only the order needs to improve.
        </P>
        <P>
          It sorts by four rules, in this order. What matters to you comes first: whatever you pull
          to the front is the last to fall out. Next, everything has to happen before the park
          closes, and one ride fewer that will certainly happen beats one more that would come too
          late. Then comes the total time spent queueing, and where two orders cost the same, the
          one that finishes earlier wins. There’s no slider for weighing queueing against hanging
          about, because no value for that trade-off could be justified.
        </P>
        <P>
          There’s no separate rule for early mornings, only each ride’s own hourly curve. Where that
          curve is lowest just after opening, &ldquo;the big ride first&rdquo; falls out of the
          arithmetic by itself; where it’s flat, something else does. Across one measured day Taron
          reads 60, 60, 54, 53 and 59 minutes hour by hour while Chiapas climbs 22 minutes.
        </P>
        <P>
          Sometimes the suggestion is to wait a while rather than join a queue now. That happens
          when the queue drops far enough that, break included, you’re free again earlier than if
          you’d queued straight away. A shorter queue alone isn’t enough, because the break mustn’t
          make the day end any later. Such a break lasts two hours at most, and it rarely gets near
          that, since a break only pays if it’s shorter than the queue it saves, and a two-hour
          break would need a queue of over two hours.
        </P>
        <P>
          A lunch break at one stays at one, and a ride you’ve ticked off stays where it is; the
          rest is arranged around both. After the press you see what changed. &ldquo;18 min less
          queueing&rdquo; is the difference between two sums worked the same way, one before the
          press and one after. Where there’s nothing to gain, you’re told the order is already
          right, and the plan stays as it was. In place of a saving, the headliner button shows how
          many rides came in and how many don’t suit the group, since the day gets longer with the
          new rides in it. Anything that no longer fits before closing is listed after either
          button. Undo puts back the state from before the press, for as long as the planner is
          open.
        </P>
        <Note>
          Where no wait times arrive, both buttons are missing. At Hansa-Park every ride costs the
          same assumed zero, so one order is as good as another.
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
          For today the API has the operator’s own listing. For any other date it carries the last
          matching weekday forward, since no source publishes the times in advance, and gives the
          date the times came from and how many days stand behind them. A projection gets a tilde in
          front of the time and the word &ldquo;Expected&rdquo;; an operator’s listing gets neither.
        </P>
        <P>
          Every showtime on this Saturday is a projection: Dragon Drago and Kroka’s Lodge from 15
          August, Miji African Dancers from the 29th. Kroka’s Lodge’s last performance at 19:00 is
          missing from the axis, because the park closes at 18:00 and projected times past closing
          are dropped.
        </P>
      </Chapter>

      <Chapter
        id="limits"
        index="07"
        icon={HelpCircle}
        kicker="Limits"
        title="Missing data and where your plan is stored"
      >
        <P>
          <A href="/parks/europe/germany/sierksdorf/hansa-park">Hansa-Park</A> shows its wait times
          only in its own app on the park WLAN, so no number will ever arrive for it, and we don’t
          invent one. The weather forecast reaches about two weeks; for later dates the panel says
          so rather than leaving a gap that reads as &ldquo;dry all day&rdquo;.
        </P>
        <P>
          On the day itself a ride can break down, a show can be cancelled or a thunderstorm can
          shift the afternoon. The plan works out whether the day can fit with the forecast waits.
          In the park you tick off what you’ve ridden, and the wait that was actually there is noted
          next to it.
        </P>
        <P>
          The plan is stored in your browser, and you don’t need an account. Only when you switch on
          notifications does a copy go to our server, and you’re told so at that point. Without a
          plan, you start with a wizard and its four questions: which park, which day, who’s coming,
          and which big rides belong in the day. The right day is easiest to find in a park’s{' '}
          <A href={`${PARK}/wait-time-calendar`}>wait-time calendar</A>.
        </P>
      </Chapter>
    </>
  );
}
