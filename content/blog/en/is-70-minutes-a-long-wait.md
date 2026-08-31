---
title: 'Is 70 Minutes a Long Wait? Depends on the Weekday'
translationKey: is-seventy-minutes-a-lot
date: '2026-08-24'
author: patrick
mode: published
excerpt: >-
  There is a number at the entrance to Taron, and on its own it says almost
  nothing. Only the comparison with every Tuesday on record turns it into an
  answer. Why park.fan archives wait times, what happens to them overnight and
  where we would rather say nothing at all.
tags:
  - wait-times
  - park-fan
  - phantasialand
  - statistics
  - behind-the-scenes
category: behind-the-scenes
parkLinks:
  # Hansa-Park gets a paragraph of its own — why its page shows no wait times at
  # all — which is exactly the question somebody on that page is asking.
  - phantasialand
  - hansa-park
rideLinks:
  - phantasialand/taron
coverImage:
  src: /media/phantasialand/taron.jpg
  alt: 'A Taron train between the basalt rocks of Klugheim'
  caption: 'Taron in Klugheim. The number at the entrance says 70. Now what?'
  credit: 'Patrick Arns'
seo:
  title: 'How to Read a Wait Time: Is 70 Minutes a Lot?'
  description: >-
    Why a wait time means nothing without a reference value, what “typical” and
    “busy” stand for on a ride, and how park.fan turns millions of readings into
    an answer.
  keywords:
    - theme park wait times
    - how to read wait times
    - Taron wait time
    - Phantasialand wait times
    - wait time percentile
    - rope drop
    - crowd calendar
---

You are standing in front of [Taron](ref:phantasialand/taron), the display says **70 minutes**, and
your head immediately does the wrong thing: it compares that number with your
memory. Last visit it was 40, so today is worse. The visit before that it was
90, so today is great. Two visits are not a basis, and your memory rounds
against you anyway ([here is why](/blog/the-art-of-waiting)).

The number itself is not the problem. The parks post it, it is usually roughly
right, and it costs us one request every five minutes. The problem is that it
stands alone. Seventy minutes on a Tuesday in May is a completely different
thing from 70 minutes on a Saturday in the summer holidays, and without the
second half of that sentence there is nothing you can do with it.

## What “typical” and “busy” actually mean

park.fan puts two reference values next to every ride. **Typical** is the median
of the daily peaks: on half of all days measured the longest queue was shorter
than that value, on the other half longer. **Busy** is the 90th percentile of
the same series, roughly the one day in ten when there really was a crowd.

Both are percentiles rather than averages, and that is not a detail. A mean can
be shifted by a single exceptional day: one afternoon with a breakdown and a
150-minute backlog drags a whole month’s average upwards, even though on 29 days
none of it was noticeable. The median does not flinch at a day like that. The
record is therefore listed separately, with its date, so you can see it without
it touching the other two numbers.

For [Phantasialand](ref:phantasialand) the ranking looks like this. The column with the days measured
is the important one: it says how much weight a row carries.

```ride-waits-widget park=phantasialand top=8 columns=land,peak,days highlight=taron

```

What is in there is live. Read this article again in three months and the table
will hold different numbers, while the text around it still holds. That is what
these widgets are for: four older articles had their figures typed by hand into
Markdown tables, spread across six languages, and after a few weeks they had
quietly drifted apart.

## The day has a shape

A ride does not carry the same queue all day. Everybody knows the basic
movement: short at opening, then it picks up, and towards the evening it becomes
bearable again. Where exactly the high point sits differs from ride to ride, and
those differences are the useful part.

```hourly-profile-widget slug=phantasialand top=6

```

Two recommendations come out of that shape. The first is **rope drop**: heading
straight for one particular ride at opening, before the paths fill up. We only
suggest it when the daily peak reaches at least 60 minutes and the early start
saves at least 45 of them. Anything below that would be advice that applies
everywhere and is therefore worth nothing anywhere.

The second is the quieter alternative in the evening. On the big coasters the
last hour before closing is often as good as the first hour after opening, and
nobody has to get up at seven for it. Both figures are on every ride’s page,
with a concrete time in park time.

## Most of it is decided before you set off

The time of day saves you half an hour. The date saves you the day. Two days of
the same holiday week can be half an hour of average wait apart, and an ordinary
calendar gives no sign of it. What makes the difference: which regions are on
holiday, whether a bridge day is attached, whether it rains, and whether
something is going on across the border.

That last point tends to get underestimated. A park near a border notices
immediately when the holidays start next door, so we count regions within
roughly 200 kilometres and mark them separately in the calendar. Three parks
side by side, each with its quietest weekday:

```park-comparison-widget slugs=phantasialand,efteling,europa-park show=quietest

```

If a cell in the last column stays empty, this park has no weekday that reliably
stands out from the others.

## What a night shift is for

Showing a live wait time is one request. A median across every Tuesday on record
is something else: it has to be finished before anybody asks for it. So a chain
of jobs runs every night, and their order is fixed, because each step sits on
the one before. At 02:00 UTC the percentiles per hour, at 03:00 the park
baselines, at 04:30 the roll-up of yesterday, at 05:15 the rope-drop
recommendations, which read exactly that roll-up. At 06:00 the forecast model
retrains itself on the previous day’s wait times.

Then there is the other half: we throw nothing away. Older periods get
compressed, but every analysis still runs over every reading that ever arrived.
An archive you want to create in hindsight is the one thing you cannot create in
hindsight.

## And the places where we say nothing

A page full of filled-in fields is easy to build. It only gets interesting when
the filled fields can be trusted, and for that a few fields have to be allowed
to stay empty.

[Hansa-Park](ref:hansa-park), for instance, only publishes its wait times in its own app, and only
for devices on the park’s Wi-Fi. There is no public interface. In the raw data
this park looks like any other at three in the morning: no ride is reporting
anything. If we drew the obvious conclusion, 82 attractions would be sitting
there at “very low”, plus an average of 0 minutes and a forecast built on zero
observations. Instead there is a notice on the park page saying that there is
nothing to read here.

The same rule in a smaller place: the ice rink at Phantasialand runs from
November to January. In August nobody reports anything about it, because there
is nothing to report. Reading that silence as “open” would be the convenient
mistake, and it did actually say that on the park page once. And we do not name
a ride’s operating months until 330 days of observation: before that it carries
no months at all, because “runs from December to April” would describe the
period we happen to have measured.

## Where all of this lives

The long version, with the real cards to read along with, is now a page of its
own: [How park.fan works](/en/how-park-fan-works). Chapter by chapter it covers
what an attraction card shows, how the scale under “typical” and “busy” works,
how the calendar accounts for holidays, and the three places where we
deliberately claim nothing. Four concrete visits are in there too, from the
family in the autumn holidays to the annual pass holder at seven in the evening.

And the next time you are standing at the entrance staring at the display: look
up what is normal for this ride on a Tuesday. Ten seconds later you will know
whether this is worth being annoyed about or whether today is simply Tuesday.

— Patrick
