---
title: 'In the park, the compass tells you which ride is ahead of you'
translationKey: in-park-compass
date: '2026-09-28'
author: patrick
mode: published
featured: false
excerpt: >-
  A park map shows you every ride. Which way you are facing, it does not. Open
  park.fan inside a park and the headliners now sit on a compass under the
  welcome. Turn around, and underneath it says which one is ahead of you, how
  far it is and how long the queue is.
tags:
  - park-fan
  - compass
  - wait-times
  - tips
  - theme-park
  - behind-the-scenes
category: park-fan
parkLinks:
  # Phantasialand opens the post and is what the demo lays around you; the
  # screenshots are from Disneyland in Anaheim. Somebody on either park page
  # standing in that park is who the compass is for.
  - phantasialand
  - /parks/north-america/united-states/anaheim/disneyland-park
rideLinks: false
coverImage:
  src: /media/phantasialand/black-mamba-16x9.jpg
  alt: 'A rock arch and a waterfall in Deep in Africa, with the lift hill of Black Mamba behind them'
  caption: 'Black Mamba at Phantasialand. From the path you get a rock arch and a slice of lift hill, and none of the rest of the ride.'
  credit: 'Patrick Arns'
seo:
  title: 'A theme park compass: which ride is in front of you?'
  description: >-
    Open park.fan in the park and turn around: the compass shows the headliners
    around you with direction, distance and wait time. No app, no account.
  keywords:
    - theme park compass
    - find a ride in a theme park
    - live wait times in the park
    - theme park map on your phone
    - Disneyland wait times live
    - Phantasialand wait times live
    - theme park app without download
---

At [Phantasialand](ref:phantasialand?bare) you hear Taron long before you see
it. Quite often you never see it at all: the paths run between rocks and
facades, and every corner puts you in a different country. Klugheim is easy to
find on the park map. Finding yourself on it is harder, and then there is the
question of which way you are facing.

Until now, park.fan could tell you in the park how long the queue at
[Black Mamba](ref:phantasialand/black-mamba?bare) was. Where Black Mamba was
from where you stood, it could not. Since 27 September, a compass does.

## When the compass shows up

Open the home page while you are inside a park and park.fan greets you with the
park's name. Under that welcome there is now a compass with the headliners
around you. The welcome box also carries a "To the compass" button, in case you
would rather not scroll for it.

The welcome and the compass need your location, and the page only asks for it
when you tap "Enable location". If you have allowed park.fan your location for
good in the browser, the compass is there straight away. Otherwise Safari on the
iPhone asks again after every reload, and allowing it for good goes through aA
and the website settings.

![The park.fan home page on a phone at Disneyland Park in Anaheim, with the "To the compass" button above the welcome. | The button only appears when park.fan finds you inside a park. It jumps a little way down the page, to the compass.](/media/kompass/kompass-start-en.webp)

In Chrome on Android the compass turns with you straight away. On an iPhone it
first says "Turn on compass". Tap it and Safari asks once whether park.fan may
read motion and orientation. Until you say yes, there is no blue cone, and the
list gives compass points instead of arrows.

## What the circle shows

You are in the middle, with north at the top. Every headliner sits in its real
direction, and the further out it is drawn, the further away it is. The outer
dashed ring is labelled with how far it reaches. The blue cone is where you are
looking, and it turns when you turn.

Each dot tells you what the ride is doing right now. A number is the wait in
minutes, in the colours park.fan uses for waits everywhere else. A green ring
with a dot means open, with no wait posted. The orange warning triangle is a
breakdown, the wrench a refurbishment, and a small empty ring is a ride that is
closed. Names go next to as many dots as there is room for, shortened where
space runs out.

![The compass at Disneyland Park: a circle with the four cardinal points, the headliners as dots carrying their waits, and a blue cone pointing west. Below it, the "Ahead" bar with Big Thunder Mountain Railroad. | Sunday evening in Anaheim, looking west. Inside the cone: Big Thunder, a breakdown and the longest queue among the headliners.](/media/kompass/kompass-blick-en.webp)

## Ahead, nearest, pinned

Under the circle is the ride your phone points at, with its distance and wait.
Tap it to open the ride's page. "Ahead" means no more than 30 degrees either
side of where you are looking. If nothing is in that range, the bar shows the
nearest ride instead and says "Nearest" above it. That sounds obvious. The first
version still put "Ahead" over a ride 116 degrees off, with an arrow pointing
back over your shoulder.

The opposite problem was harder: too much ahead. At Disneyland Paris, seen from
the middle of the park, Buzz Lightyear, Orbitron, Hyperspace Mountain and
Autopia all lie within ten degrees of each other. A phone in your hand sways by
more than that while you walk, and in a simulation the bar switched rides ten
times in five seconds. Now a challenger has to sit at least four degrees closer
to your line of sight and stay there for 300 milliseconds before it gets the
bar.

If you want one particular ride, tap its dot. That pins it. The dot gets a pin,
a dashed line runs from you to it, and the bar stays with it whichever way you
turn. Tap it again, or the cross in the bar, and the bar goes back to following
your eyes.

![The same compass with a pinned ride: Space Mountain carries a pin, a dashed line runs to it from the centre, and the bar says "Pinned". Below it, the first rows of the list with arrow, distance and wait. | Still looking west. The bar stays on Space Mountain, to the southeast, until you unpin it.](/media/kompass/kompass-fixiert-en.webp)

Below that, the same rides appear again as a list, nearest first, each with an
arrow that turns with you. The rows do not jump around while you walk: a ride
only overtakes the one above it once it is at least 15 metres closer, more when
the GPS fix is poor. Without that margin, a simulated 160 metre walk reshuffled
the list at every fourth position fix, and anyone about to tap a row could hit
the wrong ride.

## Where north is

A phone's compass points to magnetic north. We work out the direction to each
ride from coordinates, and those are measured from the geographic North Pole.
The gap between the two is called magnetic declination, and it changes from
place to place. At Phantasialand it is just over 3 degrees, at Disneyland Paris
just over 2. Over 300 metres that is 12 to 17 metres, which nobody in a park
will ever notice.

At
[Disneyland Park in Anaheim](ref:/parks/north-america/united-states/anaheim/disneyland-park?bare),
where the pictures above were taken, it is 11 degrees. An arrow 11 degrees off
misses a ride 300 metres away by almost 60 metres. In Orlando it is almost 7
degrees the other way. So park.fan sends the park's declination along with the
ride positions, calculated with the World Magnetic Model 2025, and the compass
adds it to every reading.

## When the phone is not sure

The arrow points in a straight line, not along the path. At Phantasialand the
way to a ride behind a wall often starts in the opposite direction, and no
compass changes that. The arrow also points at the one spot our data has for a
ride. Where the queue entrance is, the data does not say.

For the rest, the compass tells you itself how far to trust it.

- If your location is only good to more than 40 metres, the circle carries a
  line like "Location imprecise (± 65 m). The arrows may be off."
- On an iPhone, Safari reports how accurate the phone's compass is right now.
  Beyond 25 degrees off, you get "Compass unsure. Move your phone in a figure
  eight a few times."
- Within 20 metres of a ride, further with a poor GPS fix, its row says "You're
  here" instead of showing an arrow that could point anywhere.
- Hold the phone upright in front of you and its top edge points at the sky.
  Past 65 degrees of tilt, the compass takes the back of the phone as your line
  of sight, the way the camera does.

Without a compass, on a laptop or on an iPhone before you turn it on, there are
no arrows. The rows say "to the southwest" instead, and the circle has no blue
cone. Anyone reads an arrow as "this way", even one that only knows where north
is and not how you are holding the phone. And nobody knows whether that laptop
is sitting on the table with its keyboard facing south.

## What leaves your phone

The direction your phone points in stays on the phone. Your location goes from
the home page to our server so it can tell which park you are in and what the
queues look like there. The home page has done that for the welcome for a while.
The ride positions come once per park, weigh less than a kilobyte and are good
for the whole day.

The compass and the precise GPS only run while the compass is on screen and the
tab is in front. Scroll on or switch apps and both stop.

What we count is whether the compass gets used: whether it was on screen,
whether the phone's compass came on, whether someone pinned a ride, opened one
from the compass or tapped "To the compass" at the top. No location, no
direction and no park.

## Try it from home

The compass is most useful in a park, but you can look at it from the sofa too.
Add `?sim=compass` to the home page address and park.fan lays Phantasialand out
around you, with that day's real wait times:
[park.fan/en?sim=compass](/en?sim=compass). A strip above the compass says it is
a demo and has a link that ends it. Tap "Use my location" in it and the park
lies around where you really are; otherwise you stand on one fixed spot in the
park.

Other parks go after a colon, as in `?sim=compass:efteling`, and there are also
`compass:europapark` and `compass:disneylandparis`. The European parks are shut
at night, and every dot is an empty ring. At nine in the evening in Central
Europe it is midday in Anaheim and mid-afternoon in Orlando, which is what
`compass:disneylandanaheim` and `compass:magickingdom` are for.

And if an arrow is off in a real park, write to me: which park, which ride and
roughly where you were standing. The email address is in the
[imprint](/impressum).

— Patrick
