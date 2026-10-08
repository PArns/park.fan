---
title: 'Is 70 Minutes a Long Wait?'
translationKey: is-seventy-minutes-a-lot
date: '2026-08-24'
updatedAt: '2026-10-05'
author: patrick
mode: published
excerpt: >-
  There’s a number at the entrance to Taron, and on its own it’s about as
  useful as a temperature without a season. Only the comparison with every Tuesday
  on record turns it into an answer. Why park.fan throws nothing away, what
  happens overnight and why we no longer recommend ice skating in August.
tags:
  - wait-times
  - park-fan
  - phantasialand
  - statistics
  - behind-the-scenes
category: behind-the-scenes
parkLinks:
  # Hansa-Park gets a paragraph of its own on why its page shows no wait times at
  # all. That is exactly the question somebody on that page is asking.
  - phantasialand
  - hansa-park
rideLinks:
  - phantasialand/taron
coverImage:
  src: /media/phantasialand/taron.jpg
  alt: 'A Taron train between the basalt rocks of Klugheim'
  caption: 'Taron in Klugheim. At the entrance it says 70. Now what?'
  credit: 'Patrick Arns'
seo:
  title: 'How to Read a Wait Time: Is 70 Minutes a Lot?'
  description: >-
    A wait time without a reference is a temperature without a season. What
    “typical” and “busy” mean, and how park.fan turns it into an answer.
  keywords:
    - theme park wait times
    - how to read wait times
    - Taron wait time
    - Phantasialand wait times
    - wait time percentile
    - rope drop
    - crowd calendar
---

You’re standing in front of [Taron](ref:phantasialand/taron), the display shows
**70 minutes**, and your head immediately compares that number with your
memory. Last visit it was 40, so today is worse. The visit before that it was
90, so today is great. Two visits aren’t a basis, and your memory rounds
against you anyway ([here’s why](/blog/the-art-of-waiting)).

The parks post the number, it’s usually roughly right, and it costs us one
request every five minutes. But it stands alone, like a temperature without a
season. Seventy minutes on a Tuesday in May is a completely different
thing from 70 minutes on a Saturday in the summer holidays, and without the
second half of that sentence there’s nothing you can do with it.

## What “typical” and “busy” actually mean

park.fan puts two reference values next to every big ride in a park, worked out
over the last 365 days. **Typical** is the median of the daily peaks: on half of
all days measured the longest queue was shorter than that value, on the other
half longer. **Busy** is the 90th percentile of the same series, roughly the one
day in ten when there really was a crowd. On the ride’s page both are shown for
today’s weekday, with the whole week day by day underneath.

Both are percentiles rather than averages. A single exceptional day can shift a mean. One afternoon with a breakdown and a
150-minute backlog drags a whole month’s average upwards, even though on 29 days
none of it was noticeable. The median doesn’t even flinch at a day like that. The
record is therefore listed separately, with its date, so you can see it without
it touching the other two numbers.

For [Phantasialand](ref:phantasialand) the ranking looks like this. How much
weight a row carries depends on the column with the days measured.

```ride-waits-widget park=phantasialand top=8 columns=land,peak,days highlight=taron

```

These tables are live. Read this article again in three months and the table
will hold different numbers, while the text around it still holds. These widgets
exist because four older articles had their figures typed by hand into
Markdown tables, spread across six languages, and after a few weeks they had
quietly drifted apart, like the clocks in a holiday rental.

## The same 70 minutes on a Saturday and on a Tuesday

On Taron’s page we list “typical” and “busy” for each weekday separately, and
the weekends clearly stand out. Saturday and Sunday have the higher values,
Tuesday the lowest. So the same 70 minutes is an ordinary day at this ride on a
Saturday, and well above what’s normal there on a Tuesday.

The month shifts the comparison again. Across the whole park (not Taron alone),
July and August are the busy months, and December came out about as high on the
few days we measured in it. September is the quietest month we’ve measured.
October has just a few days so far, because our record began in December 2025
and October 2026 has only just started.

```stats-widget slug=phantasialand show=months

```

None of that is posted at the entrance, just the one number. The ride’s page has
both values for today, with the week day by day underneath, so you can judge
the 70 minutes for yourself.

## The day has a shape

A ride doesn’t carry the same queue all day. Everybody knows the basic
movement: short at opening, then the rest of the world finishes breakfast, and
towards the evening it becomes bearable again. Where exactly the high point sits differs from ride to ride, and
those differences are the useful part.

```hourly-profile-widget slug=phantasialand top=6

```

Two recommendations come out of that shape. The first is **rope drop**: heading
straight for one particular ride at opening, before the paths fill up. We only
suggest it when the daily peak on an ordinary day of the last 70 reaches at
least 60 minutes and the early start saves at least 45 of them. Anything below that would be advice that applies
everywhere and is therefore worth nothing anywhere.

The second is the quieter alternative: the time of day when the queue at that
ride is usually at its shortest. If that falls in the evening, nobody has to get
up at seven for it. Both are on the page of every big ride with enough days
measured, with a concrete time in park time.

## Most of it is decided before you set off

At a ride where we suggest rope drop, the time of day saves you at least three
quarters of an hour. The date decides the whole day. In the North
Rhine-Westphalian summer holidays of 2026, Tuesday 18 August sat at “Normal” in
the Phantasialand calendar and the Thursday of the same week at “Very High” (as
of September 2026), and an ordinary calendar gives no sign of it. The
difference comes from which regions are on
holiday, whether a bridge day is attached, whether it rains, and whether
something is going on across the border.

A park near a border notices
immediately when the holidays start next door, usually from the number plates
in the car park. So we count regions within
roughly 200 kilometres and mark them separately in the calendar. Three parks
side by side, each with its quietest weekday:

```park-comparison-widget slugs=phantasialand,efteling,europa-park show=quietest

```

A dash in the last column means no weekday reliably stands out at that park, or
its weekdays were measured too unevenly to compare. Two days there means both
are equally quiet. The same table, with many more parks, is on the
[best time to visit page](/best-time-to-visit).

## What a night shift is for

Showing a live wait time is one request. A median across every Tuesday on record
has to be finished before anybody asks for it. So a chain
of jobs runs every night, and their order is fixed, because each step sits on
the one before. At 02:00 UTC the percentiles per hour, at 03:00 the park
baselines, at 04:30 the roll-up of yesterday, at 05:15 the rope-drop
recommendations, which read exactly that roll-up, at 05:30 “typical” and “busy”
for the big rides. At 06:00 the forecast model
retrains itself on the previous day’s wait times, while the rope-drop crowd is
already stuck on the motorway.

We also throw no reading away. Older periods get
compressed, not thinned out. How far back an analysis looks is a separate
decision: for “typical” and “busy” we take the last 365 days, one full turn of
the year, for the rope-drop advice just the last 70, so it follows the season.
Start storing in your third year and you have one year of history in your third
year, and the two before it are gone for good. Our record starts on 26 December
2025, and the column of days measured in the table above counts from there.

## Where we’d rather say nothing

[Hansa-Park](ref:hansa-park), for instance, only publishes its wait times in its
own app, and only for devices on the park’s Wi-Fi. There’s no public interface. In the raw data
this park looks like any other at three in the morning, with no ride reporting
anything. If we drew the obvious conclusion, every attraction in the park would be sitting
there at “very low”, plus an average of 0 minutes and a forecast built on zero
observations. A dream day for every visitor, and entirely made up. Instead
there’s a notice on the park page saying that there’s
nothing to read here. What we can still tell you about the park is in the
[Hansa-Park guide](/blog/hansa-park-tips).

The same goes for the “Berliner Eislaufen” ice rink on
Phantasialand’s Kaiserplatz, which only exists during Wintertraum, this time from 14
November 2026 to 24 January 2027. In August nobody reports anything about it, because there’s
nothing to report. Reading that silence as “open” would be the convenient
mistake, and it did actually say that on the park page once: ice skating in
high summer, with our blessing. And operating months that we read off our own
measurements aren’t named until 330 days of observation. Before that it carries
no months at all, because “runs from December to April” would describe the
period we happen to have measured.

## What you can do with 70 minutes

If the number at the entrance is at or below the typical value for that weekday,
I join the queue. When it’s well above, have a look at the hourly curve further
up, and if that dips in the late afternoon or the evening, ride something else
first and come back. On Taron’s page there’s a recommendation for the end of the
day next to the one for opening time, because by our measurements the queue
there gets a lot shorter again just before closing.

If you’d rather buy the time, a Quick Pass for one ride on Taron costs €12,
according to Phantasialand’s information page (as of 5 October 2026). You can
only get it on the spot, at Guest Services on Kaiserplatz, and supply is
limited. When the posted wait is normal for that weekday anyway, it rarely pays
off. What we think of it, and when the Quick Pass Ultimate is worth it, is in
the [Phantasialand guide](/blog/phantasialand-wait-times-tips).

For a whole day there’s the [trip planner](/blog/trip-planner). You pick your
rides and get them in an order based on the day’s forecast wait times. That way
you know before you set off whether you’ll get to all of them before the park
closes, instead of finding out at five in the afternoon in front of the last
queue.

## Where all of this lives

The long version, with the real cards to read along with, is now a page of its
own: [How park.fan works](/en/how-park-fan-works). Chapter by chapter it covers
what an attraction card shows, how the scale under “typical” and “busy” works,
how the holidays go into the calendar, how that becomes a day in the trip
planner, and the three places where we deliberately claim nothing. Four concrete
visits are in there too, from the family in the autumn holidays via the annual
pass holder deciding on an evening trip to a first time at a big park.

And the next time you’re standing at the entrance staring at the display, look
up what’s normal for this ride on a Tuesday.

— Patrick
