---
title: 'The trip planner: we check whether your park day adds up'
translationKey: trip-planner-launch
date: '2026-09-05'
author: patrick
mode: published
featured: true
excerpt: >-
  A wait-time feed tells you how long the queue is right now. It does not tell
  you whether your list makes it to closing time. That is what the trip planner
  is for: your rides on a timeline, every block as tall as the wait predicted
  for it, and the walk in between.
tags:
  - park-fan
  - trip-planner
  - wait-times
  - tips
  - orlando
  - behind-the-scenes
category: news
parkLinks:
  # Hansa-Park gets a paragraph of its own about why the planner offers no
  # buttons there. That is exactly the question somebody on that park page has.
  - magic-kingdom-park
  - hansa-park
rideLinks: false
coverImage:
  src: /media/disney-hollywood-studios/fantasmic-crowd-16x9.jpg
  alt: 'A packed open-air theatre seen from the back, the audience waiting in the dark'
  caption: 'Everybody in the same place at the same time. That is the normal case, not the exception.'
  credit: 'Patrick Arns'
seo:
  title: 'A trip planner for theme parks: count the queues before you go'
  description: >-
    The new park.fan trip planner lays your rides on a timeline, works with the
    predicted waits, knows when each individual ride opens and how far apart
    they are. No account, all in your browser.
  keywords:
    - plan a theme park day
    - theme park trip planner
    - plan around wait times
    - Magic Kingdom plan a day
    - Orlando park planning
    - ride order theme park
    - rope drop
---

The plan in your head holds until about two in the afternoon. By then you have
done three rides out of eight, you are standing in the wrong queue, and you know
it will not work out. The number above the entrance has been right the whole
time. It is almost always right. It just says nothing about whether the rest of
your list still happens today.

At a compact park that costs you one ride, and you catch it next time. At a park
that opens at eight in the morning and does not close until eleven at night,
that has a dozen attractions where an hour in line is unremarkable, and where
two of them are a ten-minute walk apart, it costs you half the list. Anybody who
has spent a day in Orlando without an order knows how that ends: a lot of
walking, not much riding, and half the list unticked by the evening. Not because
it was too busy, but because the order was wrong.

That is the gap park.fan had. “How long is the queue right now” we have answered
since day one. “Is that a lot for a Tuesday” since
[last summer](/blog/is-70-minutes-a-long-wait). The third question was nowhere:
does my day actually add up?

Since this week it is there. The [trip planner](/trip-planner) lays your rides
on a timeline and works the day out before you set off.

## A day is an order, and the order has a clock

The idea is quickly told. A block is a ride, and its height is the wait
predicted for its hour. Drag it into a busier hour and it grows. Drag it into a
quieter one and it shrinks. The day itself gets no longer or shorter, it moves,
and you can see it move.

Between two blocks sits the transfer: how far it is and whether the time is
enough. The walk out of the station and the ride itself live in that gap rather
than in the block, because they belong to getting there and not to queueing.

Sounds like a detail, and it changes how you look at a park day. A list of eight
rides says nothing about whether eight rides are possible that day. Eight blocks
on a timeline that ends at eleven at night say it immediately.

![The trip planner with a planned day at Magic Kingdom: ten blocks on a timeline from 8 in the morning, with transfers between them showing distance and walking time. | Ten rides on a Saturday in September, put in this order by the planner itself.](/media/tagesplaner/planer-tag-en.webp)

Ten rides, from opening to four in the afternoon, and under the plan sits the
total: five and a quarter hours of queueing. That is the version the optimiser
considered best. Without an order you queue just as long and ride less.

## Between two rides there is a walk

A wait-time feed can tell you that a ride is showing fifty minutes. What it
cannot tell you is that you will not get there in time from where you are
standing. That is what the transfer is for.

The maths uses the distance between the two rides’ coordinates, plus three
minutes to get out of the station and three for boarding and riding where no
ride time is on file. The distance is as the crow flies, and the planner says so
out loud. It is a lower bound and not a walking time: paths bend around water,
around queue lines and around one-way routes, some parks stack their areas on
top of each other, and at a large one the straight line often crosses a lake you
have to walk around. For the upper bound the planner therefore uses park pace
rather than walking pace and adds two thirds of the straight line as a detour.

At a compact park a clumsy transfer costs three minutes and nobody notices. At a
large one it costs a quarter of an hour. Do that eight times in a day and you
have walked away two hours that show up in no wait-time statistic.

When a transfer says “tight”, that does not mean it looks close. It means the
transfer stops working if the forecast is as far off as it says it can be. The
API knows that margin for every ride, and this is where the spread turns into
something you can act on.

## “Get there early” does not apply to every ride

The advice you read everywhere goes like this: the big coaster first, right
after opening. Sometimes it holds. Often it does not, and which of the two
applies only shows once you look at the hours one by one.
[Magic Kingdom](ref:magic-kingdom-park) suits that well, because its day is long
enough for the curves to pull far apart.

```hourly-profile-widget slug=magic-kingdom-park top=8

```

Three patterns are in there, and each wants a different answer.
[TRON](ref:magic-kingdom-park/tron-lightcycle-run) is expensive all day and gets
more expensive towards the evening. Going early is never wrong here, but it does
not make it cheap either: it stays the longest queue you stand in that day.
[Jungle Cruise](ref:magic-kingdom-park/jingle-cruise) runs the other way and
falls away late in the evening, so queueing for it in the afternoon costs you a
multiple of the same ride. And
[Big Thunder](ref:magic-kingdom-park/big-thunder-mountain-railroad) is much the
same price for hours on end, which makes it the filler for the gaps the other
two leave.

A rule of thumb cannot give those three answers, because it treats all three
rides alike. So there is no rope-drop rule in the planner; the code does not
even know the term.

```glossary-widget slug=rope-drop

```

What it does know is the hourly curve of each individual ride. Where that curve
is lowest shortly after opening, “the big one first” falls out on its own. Where
it is flat, something else falls out, and that is the right answer there.

A second thing people rarely do in their heads: the first hour is often not
yours at all. Plenty of parks open their gates before some of the rides run, and
the headliners like to be among the later ones. Fill that first hour with them
and you have planned an hour that does not exist. The planner knows when each
ride opens and lets no block slip in front of it. There is no counterpart to
that: no feed reliably reports when a single ride shuts for the evening, so
nothing is said about it.

## Two buttons sort the day

Under the timeline sit two buttons. “Plan every headliner” pulls in the park’s
big rides that are not in the day yet and sorts everything afterwards.
“Optimise the day” adds nothing and only reorders what is already there. The
same calculation runs behind both. They are two buttons because they are two
questions: fill my day, and is there a better order.

The sorting weighs three things, and the ranking between them is the real
decision.

1. **Everything has to happen before closing.** A plan with one ride fewer that
   actually takes place beats one with a ride more that never will. And if
   something falls out, it falls out from the back: first whatever the button
   just added, never what you had thought of yourself.
2. **The sum of the waits.** That is what was asked for.
3. **The time you join the last queue.** Where two orders cost the same, the one
   that finishes earlier wins.

At a park with more headliners than fit into a day, point one is the whole game.
Which is why the button does not always disappear after a press: if a ride is
left over with no room for it, the count sits underneath and the offer stays
standing in case you drop something else.

There is deliberately no slider that trades queueing against hanging about.
Nobody could justify that number, and the first person to disagree with it would
be right.

One consequence I am fond of, because nobody programmed it in: the planner
sometimes sends you for a coffee. If you would queue fifty minutes now but only
fifteen half an hour later, then wandering plus queueing together costs less
than queueing alone. Same ride, less queue, and you are free again earlier all
the same.

What the optimiser does not touch: your lunch break, any ride you have already
ticked off, and any block whose time has already begun. That last point took us
a while, because it is the difference between “let me sort out your afternoon”
and “please go and join the back of that queue again”. Press the button at two
o’clock and you are standing in some queue at two o’clock, and nobody moves that
one.

And because one press can turn three blocks into eleven, there is an undo beside
the result. Once, not endlessly, but the one time you need it.

## What the planner does not know, it says

The longest work on a thing like this is the four places where it deliberately
claims less than it could.

**The forecast is off, and measurably so.** Every selected block says how far
the predictions for that ride sat, on average, from what the day actually
brought. “Typical” means literally what it says: half the days land further out.
So the number stands there as a typical error and never as a range that already
contains the right answer.

**Showtimes are two different things.** What the park has published for today is
a statement. What we carried forward from the last matching weekday is a guess,
and the planner draws it more softly: a tilde in front of the time, a dotted
line, and the date the times came from. Nobody on earth knows showtimes for the
Saturday after next.

**Some parks we cannot measure at all.** [Hansa-Park](ref:hansa-park) publishes
its wait times only in its own app on the park wi-fi. No number ever reaches us
from there. A park with no source looks exactly like a park closed for the night
in the data, so the planner takes that fact straight from the API and hides both
sorting buttons there. If every ride costs the same invented number, every order
is as good as every other, and a button that changes nothing would be a promise.

**A day that has passed stays.** The calendar lets you reopen a day you planned
something on, and the automatic buttons are gone there. Everything by hand
continues: move, tick off, delete. A day you walked is a record, and the fact
that you really stood in that queue at one o’clock is the reason it is kept at
all.

## It lives in your browser

There is no account, no sign-up and no login. Your plan sits in your browser,
and that is the default rather than the stripped-down version. Clear your
browser data and it is gone. Open park.fan on your phone and it is a different
plan.

The one exception is push notifications. For us to tell you it is time to head
over, the plan has to sit on our server, and the planner writes down what that
means: whoever has the link can read it and change it. No password stands in
front of it. If you do not want that, leave the notifications off and you lose
nothing else.

Two more things that are easy to miss. A tab hangs at the right edge of the
screen on every page and opens the planner, even with nothing planned yet. And
on a desktop you can open a second column, which puts two days side by side. I
built it for exactly one sentence: “and what would that look like on Saturday”.

## How to start

The way in runs through three questions. Which park, which day, and who is
coming.

The first is a search field, and there is a small thing behind it that goes
wrong easily. Type “Disneyland” and you get five parks on three continents that
all go by that name.

![Step one of the planner wizard: “Disneyland” typed into the search field, five parks from five countries listed below it. | One name, five parks. Which is why the planner remembers the path from the API and not the name.](/media/tagesplaner/planer-wizard-park-en.webp)

A plan is filed under the path the API itself returns, never under one we build
from the name on screen. “Netherlands” is not spelled the same in every
language, and a guessed path is a plan pointing at a 404.

The second question is the interesting one: instead of a dropdown with sixty
rows you get a whole month, and every day carries that park’s crowd forecast.
“The Saturday after next” is a glance rather than a scroll, and whatever else we
know about it sits under the grid.

![Step two of the planner wizard: a photo of Disneyland Park in Anaheim above a month grid where every day carries the crowd forecast, with Saturday the 19th picked. | A September forecast quiet throughout at Anaheim. Sixty rows in a dropdown never show you that.](/media/tagesplaner/planer-wizard-tag-en.webp)

The third question sounds like paperwork and matters more than it looks: plan a
lunch break, are children coming, do you want to stay dry. All three are marks
on the ride list rather than filters, and the planner puts it on the card: rides
with a higher height limit get marked, not hidden. A filter would quietly
shorten the park, and whether grandma is holding the bags is something only you
know.

![Step three of the planner wizard: three cards for lunch, children and water rides, with the “open plan” button below them. | Three answers that do not shorten the park. The lunch break lands as a block at 12:30 and can be moved.](/media/tagesplaner/planer-wizard-wer-en.webp)

After that you land on the park page with the planner open, and from there you
drag rides onto the timeline. Every attraction page has a button for it too,
when dragging is awkward.

How a single block arrives at its height, what “From the day forecast” means and
how a transfer is worked out is all on the [planner page](/trip-planner) itself,
with a real frozen API response you can drag around. Nothing there touches your
own plan.

And if something looks off while you are at it, a walking time that does not
work, or a transfer that would never have happened in real life: write to me,
the address is in the [imprint](/impressum). The walks are the part we measure
worst, and somebody standing there right now knows better than any calculation.

— Patrick
