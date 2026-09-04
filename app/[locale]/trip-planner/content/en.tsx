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
          into a busier hour and it grows; drop it in a quieter one and it shrinks. What sits
          between two blocks is not empty space but the transfer: how far it is, and whether there
          is time for it. Getting out of the station and the ride itself are counted there rather
          than in the block.
        </P>
        <P>
          Nothing below is redrawn. These are the components the planner itself runs, fed with the
          answer the API gave on 4 September 2026 for Saturday 12 September at{' '}
          <A href={PARK}>Phantasialand</A>. Drag a block to another hour: it snaps to five minutes,
          recomputes its height, and the transfers beside it follow. Nothing here is saved.
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
          Taron reads 45 minutes at ten, 50 at eleven, 40 at one and 50 again in the evening. That
          is the real reason to ride Taron early: not because mornings are always quieter, but
          because this day holds no quiet hour for this ride. Black Mamba does the opposite, falling
          from 35 minutes at midday to 20 at six, and Chiapas climbs from 20 to 35.
        </P>
        <P>
          On top of that comes how far the figure typically lands from the truth, and that follows
          the level: the longer a queue, the wider the spread. For the rides whose day peaks at 35
          minutes or more, the API reports a typical error of 15.4 minutes on this Saturday, and
          10.9 for the flatter ones. Typical means half the days are further out than that. So the
          planner writes it as a plus-minus on the selected block and never as a range with the
          right answer already inside it.
        </P>
        <Note>
          Taron&apos;s curve stands on 142 measured days, Black Mamba&apos;s on 161. How many there
          are is on <A href={`${PARK}/taron`}>the ride&apos;s own page</A>.
        </Note>
        <P>
          The planner also says what kind of forecast it is holding. Where the model works the day
          through hour by hour, it says so. Where the day&apos;s height is predicted and the shape
          comes from earlier days — which is the case on this Saturday — it says that instead. Far
          enough ahead the height itself gets thin and it drops to a rough estimate. For a day
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
          or Maus au Chocolat, and that is the list. It is not a detail: a plan that fills the first
          hour with headliners has planned an hour that does not exist.
        </P>
        <P>
          The planner knows each ride&apos;s own opening time and will not let a block slide in
          front of it. There is no counterpart for the evening: no feed reliably reports when a ride
          shuts, so nothing is claimed about it. The axis stops at the park&apos;s closing time.
        </P>
      </Chapter>

      <Chapter
        id="transfers"
        index="04"
        icon={Footprints}
        kicker="The way between"
        title="Between two rides there is a walk, and it costs time"
      >
        <P>
          A wait-time feed can tell you Taron is at 50 minutes. What it cannot tell you is that you
          will not get there from Rookburgh in time. That is what the transfer is for. It works from
          the distance between the two rides&apos; coordinates, plus three minutes to get out of a
          station and three for boarding and riding where no duration is on file.
        </P>
        <P>
          That distance is a straight line, and it is labelled as one. It is a lower bound and never
          a walking time: paths bend around water, queues and one-way routing, and Phantasialand
          stacks Rookburgh and Klugheim on top of each other. So the upper bound is worked at park
          pace rather than a brisk walk, with two thirds added to the straight line for the detour.
        </P>
        <Note>
          &ldquo;Tight&rdquo; does not mean narrow. It means this transfer stops working if the
          forecast is as wrong as it says it might be. Where the API reports no spread, the verdict
          stops at &ldquo;good&rdquo; and says so in its title.
        </Note>
      </Chapter>

      <Chapter
        id="sorting-the-day"
        index="05"
        icon={Wand2}
        kicker="Sorting"
        title="The day can sort itself"
      >
        <P>
          Two buttons do that. &ldquo;Plan every headliner&rdquo; pulls in the park&apos;s big rides
          that are not in the day yet and then orders the lot; &ldquo;Optimise the day&rdquo; adds
          nothing and only reorders what is already planned. The same arithmetic runs behind both,
          and they are two buttons because they are two questions: fill my day, and is this the best
          order.
        </P>
        <P>
          It sorts for three things, and the ranking between them is the actual decision. First that
          everything still happens before the park closes: a plan with one ride fewer that really
          takes place beats a plan with one more that will not. Then the total time spent queueing,
          which is what was asked for. And where two orders cost the same, the one that finishes
          earlier wins. There is no slider weighing queueing against hanging about, because nobody
          could defend the number on it.
        </P>
        <P>
          No rule about early mornings is hiding in there. The planner knows nothing but each
          ride&apos;s own hourly curve. Where that curve is lowest just after opening, &ldquo;the
          big ride first&rdquo; falls out of the arithmetic by itself; where it is flat, something
          else does. Across one measured day Taron reads 60, 60, 54, 53 and 59 minutes hour by hour
          while Chiapas climbs 22 minutes. A fixed rule would give both rides the same advice.
        </P>
        <P>
          Sometimes the suggestion is to wait a while rather than join a queue now. That happens
          under a single condition: the queue has to drop far enough that, break included, you are
          free again earlier than if you had queued straight away. Queueing less on its own is not
          enough, and the day never gets longer out of this arithmetic. Nor does it ever leave you
          waiting more than two hours. That ceiling rarely does any work by itself: a break only
          pays if it is shorter than the queue it saves, so two hours of waiting would take a queue
          of over two hours to earn.
        </P>
        <P>
          A lunch break at one stays at one, and a ride you have ticked off has happened and is not
          re-planned; the rest is arranged around both. Afterwards it says what it did. &ldquo;18
          min less queueing&rdquo; is the difference between two sums worked the same way, one
          before the press and one after; where there is nothing to gain it says the order is
          already right and the plan stays as it was. The headliner button reports no saving, since
          the day is longer with the new rides in it — it counts instead how many rides came in and
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
        title="A showtime is either the operator's or our arithmetic"
      >
        <P>
          For today the API has the operator&apos;s own listing. For any other date no source knows
          the times in advance, so it carries the last matching weekday forward and says which date
          the times came from and how many days stand behind them. The two may not look alike: a
          projection gets a tilde in front of the time and the word for &ldquo;expected&rdquo;, an
          operator&apos;s listing gets neither.
        </P>
        <P>
          Every showtime on this Saturday is a projection — Dragon Drago and Kroka&apos;s Lodge from
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
          And what a plan really costs is decided on the day. A ride goes down, a show is cancelled,
          a thunderstorm turns the afternoon around. So the plan is not a timetable but an argument
          about whether the day can work at all. In the park you tick off what you have ridden, and
          the planner records the wait that was actually there.
        </P>
        <P>
          All of it lives in your browser. No account, no server, no sync: the plan is a file in
          your own storage, and opening the planner without one starts the wizard with the three
          questions that come first. Which park, which day, who is coming. The day itself is easiest
          to pick in a park&apos;s <A href={`${PARK}/wait-time-calendar`}>wait-time calendar</A>.
        </P>
      </Chapter>
    </>
  );
}
