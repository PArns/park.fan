---
title: 'Plan your park day before you join the wrong queue'
translationKey: trip-planner-launch
date: '2026-09-05'
author: patrick
mode: published
featured: false
excerpt: >-
  A wait-time feed gives you the length of the queue right now. Whether your
  list makes it to closing time you find out for yourself, usually around two in
  the afternoon. That’s what the trip planner
  is for: your rides on a timeline, every block as tall as the wait predicted
  for it, and the walk in between.
tags:
  - park-fan
  - trip-planner
  - wait-times
  - tips
  - orlando
  - behind-the-scenes
category: park-fan
parkLinks:
  # Hansa-Park gets a paragraph of its own about why the planner offers no
  # buttons there. That is exactly the question somebody on that park page has.
  - magic-kingdom-park
  - hansa-park
rideLinks: false
coverImage:
  src: /media/disney-hollywood-studios/fantasmic-crowd-16x9.jpg
  alt: 'A packed open-air theatre seen from the back, the audience waiting in the dark'
  caption: 'Fantasmic at Hollywood Studios, just before it starts. Close to ten thousand people fit in, and for that half hour none of them is queueing anywhere.'
  credit: 'Patrick Arns'
seo:
  title: 'Plan a theme park day: count the queues before you join them'
  description: >-
    Lay your rides on a timeline with predicted waits and the walks between, and
    see before you go whether they all fit before closing. No account needed.
  keywords:
    - plan a theme park day
    - theme park trip planner
    - plan around wait times
    - Magic Kingdom plan a day
    - Orlando park planning
    - ride order theme park
    - rope drop
---

The plan in your head holds until about two in the afternoon. By then you’ve
done three rides out of eight, you’re standing in the wrong queue, and you know
it won’t work out. The number above the entrance has been right the whole
time, but it only ever covered one ride.

At a compact park that costs you one ride, and you catch it next time. At a park
that opens at eight in the morning and doesn’t close until eleven at night,
that has a dozen attractions where an hour in line is unremarkable, and where
two of them are a ten-minute walk apart, it costs you half the list. Anybody who’s
spent a day in Orlando without an order knows how that ends: a lot of
walking, not much riding, and half the list unticked by the evening. Afterwards
you blame the crowds, when the real culprit was the order.

That’s the gap park.fan had. “How long is the queue right now” we’ve answered
since day one. “Is that a lot for a Tuesday” since
[late August](/blog/is-70-minutes-a-long-wait). The third question was nowhere:
do my eight rides fit in before the park closes?

Since early September it’s there. In the [trip planner](/trip-planner) you lay
your rides on a timeline, with the predicted waits and the walks in between, and
see before you set off whether they fit into the day.

## Rides as blocks on a timeline

A block is a ride, and its height is the wait predicted for its hour. Drag it into a busier hour and it grows. Drag it into a
quieter one and it shrinks. The day itself gets no longer or shorter, it moves,
and you can see it move.

Between two blocks sits the transfer: how far it is and whether the time is
enough. The walk out of the station and the ride itself live in that gap, because they
belong to getting there.

Eight rides on a list are a statement of intent, about as binding as a New
Year’s resolution. On a timeline that ends at eleven at night you can see over
breakfast which of them will still be waiting at half past ten.

![The trip planner with a planned day at Magic Kingdom: ten blocks on a timeline from 8 in the morning, with transfers between them showing distance and walking time. | Ten rides on a Saturday in September, put in this order by the planner itself.](/media/tagesplaner/planer-tag-en.webp)

Ten rides, from opening to four in the afternoon, and under the plan sits the
total: five and a quarter hours of queueing. That’s the optimiser’s order. When you let
it reorder a day you laid out yourself, you also see how many minutes of
queueing the new order saves, worked out with the same formula as before.

## Between two rides there’s a walk, often around a lake

A wait-time feed gives you the fifty minutes a ride is showing, and nothing
about whether you’ll get there in time from where you’re standing. That’s what
the transfer is for.

The maths uses the distance between the two rides’ coordinates, plus three
minutes to get out of the station and three for boarding and riding where no
ride time is on file. The distance is as the crow flies, and it’s marked that way. It’s
a lower bound, not a walking time: paths bend around water,
around queue lines and around one-way routes, some parks stack their areas on
top of each other, and at a large one the straight line often crosses a lake you
have to walk all the way around. For the upper bound we therefore use
park pace, about four kilometres an hour with crowds and pushchairs, and add 60
per cent of the straight line as a detour.

At a compact park a clumsy transfer costs three minutes and nobody notices. At a
large one it costs a quarter of an hour. Do that eight times in a day and you’ve
walked away two hours that show up in no wait-time statistic, only in
your calves that evening.

“Tight” on a transfer means it stops working if the forecast is off by as much
as its error margin allows. The API has that margin for every ride.

## “Get there early” doesn’t apply to every ride

The advice you read on every forum, and hear from every brother-in-law who’s
been to Florida once, goes like this: the big coaster first, right after
opening. Sometimes it holds. Often it doesn’t, and which of the two
applies only shows once you look at the hours one by one.
[Magic Kingdom](ref:magic-kingdom-park) suits that well, because its day is long
enough for the curves to pull far apart.

```hourly-profile-widget slug=magic-kingdom-park top=8

```

Three patterns are in there, and each wants a different answer.
[TRON](ref:magic-kingdom-park/tron-lightcycle-run) is expensive all day and gets
more expensive towards the evening. Going early is never wrong here, but it doesn’t
make it cheap either: it stays the longest queue you stand in that day.
[Jungle Cruise](ref:magic-kingdom-park/jingle-cruise) runs the other way and
falls away late in the evening, so queueing for it in the afternoon costs you a
multiple of the same ride. And
[Big Thunder](ref:magic-kingdom-park/big-thunder-mountain-railroad) costs much
the same for hours on end, so it fills the gaps the other two leave.

A rule of thumb can’t give those three answers, because it treats all three
rides alike. So there’s no rope-drop rule in the planner, and the term doesn’t
appear anywhere in its code.

```glossary-widget slug=rope-drop

```

Instead, the order comes from the hourly curve of each individual ride. Where
that curve is lowest shortly after opening, “the big one first” falls out on its
own. Where it’s flat, something else falls out.

Hardly anybody works out in their head that the first hour often isn’t yours
at all. Plenty of parks open their gates before some of the rides run, and
the headliners like to be among the later ones. Fill that first hour with them
and you’ve planned an hour that doesn’t exist. At Phantasialand the gates
open at nine, but Taron, F.L.Y. and most of the other big rides only start at
ten. Wherever the API has a ride’s own opening time, no block can slip in front of
it. There’s no counterpart for the evening. No feed reliably reports when a
single ride shuts, so nothing is said about it.

## Two buttons sort the day

Under the timeline sit two buttons. “Plan every headliner” pulls in the park’s
big rides that aren’t in the day yet and sorts everything afterwards.
“Optimise the day” adds nothing and only reorders what’s already there. The
same calculation runs behind both. They’re two buttons because they’re two
questions: fill my day, and is there a better order.

The sorting weighs three things, and the ranking between them is the real
decision.

1. **Everything has to happen before closing.** A plan with one ride fewer that
   actually takes place beats one with a ride more that never will. What counts
   is the moment you join the queue: a line you still get into a quarter of an
   hour before closing is fine. And if something falls out, it’s first whatever
   the button just added, not what you’d thought of yourself. Among the added
   rides, a second go on the same ride goes before any first ride, then the one
   with the shortest expected queue. The rides most people come for stay in
   longest.
2. **The sum of the waits.** That’s what was asked for.
3. **The time you join the last queue.** Where two orders cost the same, the one
   that finishes earlier wins.

At a park with more headliners than fit into a day, point one is the whole game,
and since 21 September you get a say in it. If not
everything fits, either button first opens an assistant with three steps.
“Adjustments” lists what would make room, such as dropping the lunch break or
cutting it to half an hour. For every line we plan the whole day again with
that change, and the line only appears if it really gets one more ride in.
“Priorities” shows the whole list in the order things would be cut, and you
move to the top whatever you must not miss. The rides you planned yourself are
on that list too, because here you decide, not the button. “Result” names what
stays out. Nothing is written into the plan until you apply it.

There’s deliberately no slider that trades queueing against hanging about,
because nobody could justify the number behind it.

One consequence I’m fond of, because nobody programmed it in: the plan
sometimes sends you for a coffee. If you would queue fifty minutes now but only
fifteen half an hour later, then wandering plus queueing together costs less
than queueing alone. Same ride, less queue, and you’re free again earlier all
the same.

What the optimiser doesn’t touch: your lunch break, any ride you’ve already
ticked off, and any block whose time has already begun. That last point took us
a while, because it’s the difference between “let me sort out your afternoon”
and “please go and join the back of that queue again”. Press the button at two
o’clock and the block you’re queueing in at two o’clock stays where it is.

And because one press can turn three blocks into eleven, the result comes with
an undo. It goes back one step only.

## Deliberate limits

We spent longest on four places where the planner claims less than it could.

**The forecast is off, and measurably so.** Every selected block shows how far,
on average over the last 45 days, the predictions for a queue that long and that
far ahead sat from what the day actually brought. It’s there up to 60 days
ahead; the measurement doesn’t reach further yet. (I’ve wanted the same from
weather forecasts for years.) An average isn’t a ceiling, and on plenty of days
the forecast lands further out. So the number stands there as a typical error
and never as a range that already contains the right answer.

**Showtimes are two different things.** What the park has published for today is
a statement. What we carried forward from the last matching weekday is a guess,
and it’s drawn more softly: a tilde in front of the time, a dotted
line, and the date the times came from. Showtimes for the Saturday after next
are known to nobody, us included.

**Some parks we can’t measure at all.** [Hansa-Park](ref:hansa-park) publishes
its wait times only in its own app on the park wi-fi. No number ever reaches us
from there. A park with no source looks exactly like a park closed for the night
in the data, so that fact comes straight from the API, and both sorting buttons
are hidden there. If every ride costs the same invented number, every order is
as good as every other.

**A day that has passed stays.** In the calendar you can reopen a day you planned
something on, and the automatic buttons are gone there. Everything by hand
continues: move, tick off, delete. A day you walked is a record, and the fact
that you really stood in that queue at one o’clock is the reason it’s kept at
all.

## It lives in your browser

You sign in nowhere. Your plan sits in your browser, and that’s the default
rather than the stripped-down version. Clear your
browser data and it’s gone. Open park.fan on your phone and it’s a different
plan, which is better learned over breakfast than at the turnstiles.

The one exception is push notifications. For us to tell you it’s time to head
over, the plan has to sit on our server, and what that means is written out in
the planner: whoever has the link can read it and change it. There’s no
password in front of it. Switch the notifications off again and the plan is deleted from the
server. If you want none of that, leave them off and you lose nothing else. What
we tell you about is your choice: when to head to the next ride, showtimes, a
planned ride closing or reopening, and a planned wait changing noticeably.

While notifications are on, there has also been a share link since 23
September. Whoever opens it gets their own copy in their planner, and whatever
they change stays with them. That’s also how a plan gets from a computer onto a
phone.

Two more things that are easy to miss. On a computer a tab hangs at the edge of
the screen on every page and opens the planner, even with nothing planned yet;
on a phone, since 24 September, a calendar icon in the top bar does that job.
And on a desktop you can open a second column, which puts two days side by side. I
built it for exactly one sentence: “and what would that look like on Saturday”.

## How to start

The way in runs through four questions. Which park, which day, who’s coming,
and which big rides should go in. The pictures below still show the first
version, with three steps.

The first is a search field, and there’s a small thing behind it that goes
wrong easily. Type “Disneyland” and you get five parks on three continents that
all go by that name. The mouse wasn’t feeling inventive when it came to names.

![Step one of the planner wizard: “Disneyland” typed into the search field, five parks in Anaheim, Paris, Tokyo, Shanghai and Hong Kong listed below it. | One name, five parks, which is why a plan is stored under the path from the API and not under the name.](/media/tagesplaner/planer-wizard-park-en.webp)

A plan is filed under the path the API itself returns, never under one we build
from the name on screen. “Netherlands” isn’t spelled the same in every
language, and a guessed path is a plan pointing at a 404.

For the second question you get a whole month instead of a dropdown with sixty
rows, and every day carries that park’s crowd forecast.
“The Saturday after next” is one glance away, and whatever else we know about
it sits under the grid. Which weekdays and months are quiet at a park in
general is on the [best time to visit page](/best-time-to-visit).

![Step two of the planner wizard: Disneyland Park in Anaheim is chosen, every day in the month grid carries the crowd forecast, and Saturday the 19th is picked. | A September forecast quiet throughout at Anaheim. Sixty rows in a dropdown never show you that.](/media/tagesplaner/planer-wizard-tag-en.webp)

The third question sounds like paperwork: plan a lunch break, are children
coming, do you want to stay dry. Lunch becomes a block
in the day. Children and staying dry become marks on the ride list, and it
says on the card that rides with a higher height limit get marked, not hidden. A filter would quietly
shorten the park, and whether grandma is holding the bags is something only you
know.

![Step three of the planner wizard: three cards for lunch, children and water rides, with the “open plan” button below them. | Three answers that don’t shorten the park. The lunch break lands as a block at 12:30 and can be moved.](/media/tagesplaner/planer-wizard-wer-en.webp)

The fourth question was added on 21 September. It puts the park’s big rides into
the day, and if they don’t all fit before closing, it shows the same
adjustments and the same list as the assistant under the timeline.

After that you land on the park page with the planner open, and from there you
drag rides onto the timeline. Every attraction page has a button for it too,
when dragging is awkward.

How a single block arrives at its height, what “From the day forecast” means and
how a transfer is worked out is all on the [planner page](/trip-planner) itself,
with a real frozen API response you can drag around. Nothing there touches your
own plan.

And if something looks off while you’re at it, a walking time that doesn’t
work, or a transfer that would never have happened in real life: write to me,
the address is in the [imprint](/impressum). The walks are the part we measure
worst, and somebody standing there right now knows better than any calculation.

— Patrick
