---
title: 'Single rider: where riding alone gets you on faster'
translationKey: single-rider-guide
date: '2026-10-08'
author: patrick
mode: published
featured: false
excerpt: >-
  In 18 of the 203 parks we measure wait times for, our API lists at least one
  ride with a single rider queue, 66 rides in all. If you ride alone or let the
  rest of your group split off, you fill empty seats and usually queue less. It
  is not worth it for families with small children.
tags:
  - single-rider
  - wait-times
  - queues
  - tips
  - theme-park
  - europa-park
  - efteling
  - disney
  - universal
category: guides
coverImage:
  src: /media/europa-park/voltron-nevera-powered-by-rimac.jpg
  alt: 'A Voltron Nevera train runs upside down through an inversion, lit in pink and blue.'
  caption: 'Voltron Nevera at Europa-Park has its own single rider entrance.'
  credit: 'Patrick Arns'
seo:
  title: 'Single rider in theme parks: which rides, for whom'
  description: >-
    Which rides in 18 theme parks have a single rider queue, how it works and
    when it isn’t worth it.
  keywords:
    - single rider theme park
    - single rider Europa-Park
    - single rider Efteling
    - riding alone theme park
    - single rider Disney
    - single rider Universal Orlando
    - single rider queue
    - save wait time theme park
---

Single rider means you join a separate queue and take a seat that is left over in the vehicle, next
to strangers. In return you usually wait less than in the standard queue. Efteling explains on its
site that single riders fill the empty seats that come up in the vehicles.

Our API lists this queue as its own type, `SINGLE_RIDER`, and knows 66 rides in 18 parks that have
one. This post lists which rides those are, what the parks themselves write about the rules and who
benefits from the single rider entrance. How much time it saves we can only partly answer, and the
reasons are further down.

## How a single rider entrance works

A train has fixed seat groups, and not every group in the standard queue fills them. Where a seat
stays empty, the park puts someone from the single rider queue into it. The ride runs fuller, and the
groups in the standard queue lose nothing, because nobody from their row is moved ahead. Efteling
writes that this shortens the wait for groups and single riders alike.

That tells you what to expect. The single rider queue only moves as fast as gaps appear. On paper it
is shorter, but whether it is in your hour depends on the gaps the groups ahead of you leave.
Efteling puts it like this: single riders usually wait less, but how much depends on the number of
visitors and the free seats.

Three rules apply at every park whose page we could read:

1. **You don’t pick your seat.** Efteling assigns a seat, together with other guests. Walt Disney
   World guarantees neither immediate boarding nor your choice of seat.
2. **The usual boarding requirements apply.** Walt Disney World and the Disneyland Resort write that
   single riders must meet all of the ride’s requirements. Efteling lets children enter the single
   rider entrance alone if they meet the ride’s height and other requirements.
3. **The queue can be closed.** Efteling says so outright: on quiet days it may stay shut. Walt Disney
   World writes that the service depends on availability.

```glossary-widget slug=single-rider

```

## Who it is for, and when it is not

The single rider entrance is worth it in three cases: you are alone in the park, your group can be
split, or you badly want one particular ride and the standard wait is too long for you. In the second
case you split up, ride separately and meet at the exit.

It isn’t worth it in these cases:

- **You are riding with a child who needs a companion.** For Eurosat at Europa-Park the park’s page
  gives 120 to 195 centimetres, and below 130 centimetres only with an adult. If you need the child
  next to you, you can’t board separately.
- **You want to ride together.** Efteling lets groups use the single rider entrance, but they ride one
  after another. Only if several seats happen to be free do people from the single rider queue sit
  side by side.
- **The ride tells a story you want to experience together.** On Symbolica at Efteling you cannot
  choose which of the three palace tours you get as a single rider.
- **The standard queue is short anyway.** Then the advantage is gone, and the group is split for no
  reason.

## What our data knows about the queue

There are two questions, and our data answers only one of them well.

**Does the ride have a single rider queue?** That is stored per ride in the field `hasSingleRider`, a
fixed attribute. On the attraction page park.fan shows a “Single rider” badge for it. The value
`null` means “unknown” and never “no”. A missing badge therefore says nothing about whether the queue
exists.

**How long is it right now?** Here the number is often missing. On 8 October 2026 we pulled the live
data of all 18 parks. It contained 41 single rider queues in twelve parks, 19 of them open, in seven parks. Not one
of the 41 carried a wait time. The parks tell us the queue is open, but not how long it is. On the
attraction page park.fan then shows “Single rider” without a time, and the tables in this post show
the standard queue.

So how much time the entrance saves can’t currently be calculated from our data. All that is backed
up is Efteling’s statement that single riders usually wait less. We don’t quote the result of our own
measurement as long as there is none.

## Park by park: how many rides we know

The table shows how many rides per park carry the attribute, how many attractions the park has in our
database and for how many the value is missing. The data is from 8 October 2026.

| Park                           | Rides with single rider | Attractions | Value unknown |
| ------------------------------ | ----------------------- | ----------- | ------------- |
| Efteling                       | 7                       | 37          | 30            |
| Disney Adventure World         | 7                       | 14          | 7             |
| Europa-Park                    | 6                       | 97          | 1             |
| Universal Epic Universe        | 6                       | 14          | 8             |
| Universal Islands of Adventure | 5                       | 25          | 20            |
| PortAventura Park              | 4                       | 51          | 45            |
| Alton Towers                   | 4                       | 55          | 48            |
| Disney California Adventure    | 4                       | 29          | 25            |
| Disney’s Hollywood Studios     | 3                       | 11          | 8             |
| Universal Studios Florida      | 3                       | 44          | 41            |
| Phantasialand                  | 3                       | 40          | 0             |
| Hong Kong Disneyland           | 3                       | 47          | 44            |
| Disneyland Park (Anaheim)      | 2                       | 56          | 54            |
| Disneyland Park (Paris)        | 2                       | 43          | 41            |
| Shanghai Disneyland            | 2                       | 37          | 35            |
| EPCOT                          | 2                       | 34          | 32            |
| Thorpe Park                    | 2                       | 45          | 38            |
| Disney’s Animal Kingdom        | 1                       | 17          | 16            |

Two parks stand out. At Europa-Park and Phantasialand the value is filled in for almost every
attraction, missing for one and for none. There, “not on the list” really does mean “no single rider
queue”. Everywhere else the list is a lower bound: at Disneyland Park in Paris the value is missing for
41 of 43 attractions, at Disneyland Park in Anaheim for 54 of 56.

The other 185 of the 203 parks don’t have a single ride with the attribute. Whether that is a “no” or
a gap, we don’t know there.

## Europa-Park

At [Europa-Park](ref:europa-park), six rides carry the attribute: ARTHUR in the Minimoys Kingdom
themed area, WODAN – Timburcoaster and blue fire Megacoaster in Iceland, Eurosat – CanCan Coaster in
France, the Voletarium in Germany and Voltron Nevera powered by Rimac in Croatia.

The park itself confirms two of them. On the page for
[Voltron Nevera](ref:europa-park/voltron-nevera-powered-by-rimac), single rider is listed among the
features as a special queue for individual guests, and so it is on the page for
[Eurosat – CanCan Coaster](ref:europa-park/eurosat-cancan-coaster). Voltron Nevera admits riders from
130 centimetres, and a train holds 16 people. On Eurosat the limit is 120 to 195 centimetres and six
years of age, and under eight only those with an adult ride along.

All six rides have a minimum height of 120 or 130 centimetres, according to the figures in our
database. The single rider entrance therefore helps mostly teenagers and adults who are on their own or
in a group without small children. How to lay out a sensible day in the park is in the
[Europa-Park guide](/blog/europa-park-wait-times-tips).

```ride-waits-widget rides=europa-park/voltron-nevera-powered-by-rimac|Voltron Nevera;europa-park/blue-fire-megacoaster|blue fire;europa-park/wodan-timburcoaster|WODAN;europa-park/eurosat-cancan-coaster|Eurosat;europa-park/voletarium|Voletarium;europa-park/arthur|ARTHUR columns=land,peak

```

The table shows the standard queue, in the same order as the rides above. When it fills up is shown in
the distribution over the day:

```hourly-profile-widget slug=europa-park top=6

```

## Efteling

[Efteling](ref:efteling) has the most complete official description we found. The page on the single
rider entrance names six rides: Danse Macabre, Joris en de Draak, Symbolica, Baron 1898, Max & Moritz
and Python. Each has two queues, one for groups and families, one for single riders. Our data
additionally lists De Vliegende Hollander, which the park’s page doesn’t name.

The page also explains what a single rider gives up: choosing the seat, and on Symbolica the choice of
one of the three palace tours. Groups may use the entrance but ride one after another, and children may
enter alone if they meet the ride’s requirements. The page doesn’t state the requirements, they differ
by attraction. According to the figures in our database, the minimum height is 90 centimetres on
Max & Moritz, 110 on Joris en de Draak, 120 on Python, De Vliegende Hollander and Danse Macabre, and
132 on Baron 1898. Symbolica has no figure.

![Python at night, lit in purple|Python at Efteling, one of the rides with a single rider entrance.|wide](/media/efteling/python.jpg)

```ride-waits-widget rides=efteling/baron-1898|Baron 1898;efteling/python|Python;efteling/joris-en-de-draak|Joris en de Draak;efteling/symbolica|Symbolica;efteling/danse-macabre|Danse Macabre;efteling/max-and-moritz|Max & Moritz;efteling/de-vliegende-hollander|De Vliegende Hollander columns=land,peak

```

## Phantasialand

At [Phantasialand](ref:phantasialand), three rides carry the attribute: [Taron](ref:phantasialand/taron)
and [Raik](ref:phantasialand/raik) in the Mystery themed area and
[Chiapas – DIE Wasserbahn](ref:phantasialand/chiapas-die-wasserbahn) in Mexico. We could not retrieve
a page from the park that confirms this.

Next to Europa-Park, Phantasialand is the park where the value is filled in for every attraction: of
40 attractions, it is missing for none. The three rides are therefore the complete list. The minimum
height is 140 centimetres on Taron, 130 on Chiapas and 120 on Raik.

```ride-waits-widget rides=phantasialand/taron|Taron;phantasialand/raik|Raik;phantasialand/chiapas-die-wasserbahn|Chiapas columns=land,peak

```

## Disneyland Paris

The resort has two parks, and the rides with a single rider entrance are spread unevenly. In
[Disney Adventure World](ref:disney-adventure-world) there are seven: Spider-Man W.E.B. Adventure and
Avengers Assemble: Flight Force in Marvel Avengers Campus, Frozen Ever After in the World of Frozen,
Ratatouille: L’Aventure Totalement Toquée de Rémy in Toon Studio, plus Crush’s Coaster, RC Racer and
Toy Soldiers Parachute Drop, also in Toon Studio. That is seven of 14 attractions, the highest share of
any park in the table.

In [Disneyland Park](ref:/parks/europe/france/paris/disneyland-park) there are two: Star Wars
Hyperspace Mountain in Discoveryland and Indiana Jones and the Temple of Peril in Adventureland. We
could not retrieve a Disneyland Paris page on the single rider service.

```ride-waits-widget rides=disney-adventure-world/frozen-ever-after|Frozen Ever After;disney-adventure-world/spider-man-web-adventure|Spider-Man W.E.B. Adventure;disney-adventure-world/crushs-coaster|Crush’s Coaster;disney-adventure-world/rc-racer|RC Racer;/parks/europe/france/paris/disneyland-park/star-wars-hyperspace-mountain|Star Wars Hyperspace Mountain;/parks/europe/france/paris/disneyland-park/indiana-jones-and-the-temple-of-peril|Indiana Jones and the Temple of Peril columns=park,peak

```

## Alton Towers and Thorpe Park

At [Alton Towers](ref:alton-towers) there are four rides in the Thrills area: TH13TEEN, Spinball
Whizzer, The Smiler and Galactica. At [Thorpe Park](ref:thorpe-park) there are two, both in the
Coasters area: SAW – The Ride and Hyperia. At both parks the value is missing for most rides: at Alton
Towers for 48 of 55 attractions, at Thorpe Park for 38 of 45. The minimum height is 120 centimetres on
TH13TEEN and Spinball Whizzer, 130 on Hyperia and 140 on The Smiler, Galactica and SAW. We haven’t
read a page from either park that confirms the list.

```ride-waits-widget rides=alton-towers/the-smiler|The Smiler;alton-towers/galactica|Galactica;alton-towers/th13teen|TH13TEEN;alton-towers/spinball-whizzer|Spinball Whizzer;thorpe-park/hyperia|Hyperia;thorpe-park/saw-the-ride|SAW – The Ride columns=park,peak

```

## PortAventura

At [PortAventura Park](ref:portaventura-park) we know four rides: Hurakan Condor, Furius Baco,
Shambhala and Dragon Khan. The value is missing for 45 of the 51 attractions, so the list is
especially short compared with what we don’t know.

```ride-waits-widget rides=portaventura-park/shambhala|Shambhala;portaventura-park/dragon-khan|Dragon Khan;portaventura-park/furius-baco|Furius Baco;portaventura-park/hurakan-condor|Hurakan Condor columns=peak

```

## Walt Disney World

On its single rider service page, Walt Disney World names five rides: Millennium Falcon: Smugglers
Run, Star Wars: Rise of the Resistance and Rock ’n’ Roller Coaster Starring The Muppets at Disney’s
Hollywood Studios, plus Remy’s Ratatouille Adventure and Test Track at EPCOT. Added to that is
Expedition Everest at Disney’s Animal Kingdom, which isn’t on the park’s list.

The rules are on the same page. The service lets groups split up and board separately. Immediate
boarding and the choice of seat aren’t guaranteed, special seating requests may not be met, and the
participating attractions and the wait times can change.

The three single rider queues at Disney’s Hollywood Studios were listed as “open” on 8 October 2026,
with no wait time. That holds for all 19 open single rider queues in our live data, Universal included.

```ride-waits-widget rides=disneys-hollywood-studios/star-wars-rise-of-the-resistance|Rise of the Resistance;disneys-hollywood-studios/millennium-falcon-smugglers-run|Smugglers Run;disneys-hollywood-studios/rock-n-roller-coaster-starring-aerosmith|Rock ’n’ Roller Coaster;epcot/test-track|Test Track;epcot/remys-ratatouille-adventure|Remy’s Ratatouille Adventure;disneys-animal-kingdom-theme-park/expedition-everest-legend-of-the-forbidden-mountain|Expedition Everest columns=park,peak

```

## Disneyland Resort in California

The resort in Anaheim names eleven rides on its page. At Disneyland Park they are Millennium Falcon:
Smugglers Run, Matterhorn Bobsleds, Space Mountain, Tiana’s Bayou Adventure and Indiana Jones
Adventure. At Disney California Adventure Park they are Goofy’s Sky School, Incredicoaster, Radiator
Springs Racers, Grizzly River Run, WEB SLINGERS and Soarin’ Over California.

In our data there are six in total: Millennium Falcon and Tiana’s Bayou Adventure at
[Disneyland Park](ref:/parks/north-america/united-states/anaheim/disneyland-park), and Incredicoaster,
Radiator Springs Racers, WEB SLINGERS and Silly Symphony Swings at
[Disney California Adventure Park](ref:disney-california-adventure-park). Six rides on the resort’s
list are missing from our data, and the Silly Symphony Swings aren’t on the list.

The park writes that Cast Members direct you to the designated queue, where your group is split up to
fill the seats that guests in the standard queue don’t take.

```ride-waits-widget rides=/parks/north-america/united-states/anaheim/disneyland-park/millennium-falcon-smugglers-run|Millennium Falcon;/parks/north-america/united-states/anaheim/disneyland-park/tianas-bayou-adventure|Tiana’s Bayou Adventure;disney-california-adventure-park/radiator-springs-racers|Radiator Springs Racers;disney-california-adventure-park/incredicoaster|Incredicoaster;disney-california-adventure-park/web-slingers-a-spider-man-adventure|WEB SLINGERS columns=park,peak

```

## Universal Orlando

Universal Orlando has 14 rides in three parks, Walt Disney World six in three parks. At
[Universal Studios Florida](ref:universal-studios-florida) they are Revenge of the Mummy, MEN IN BLACK
Alien Attack and Harry Potter and the Escape from Gringotts. At
[Islands of Adventure](ref:universal-islands-of-adventure) there are five: Harry Potter and the
Forbidden Journey, Hagrid’s Magical Creatures Motorbike Adventure, The Incredible Hulk Coaster,
Doctor Doom’s Fearfall and The Amazing Adventures of Spider-Man. At
[Epic Universe](ref:universal-epic-universe) there are six of 14 attractions, including Stardust
Racers, Mine-Cart Madness and Mario Kart: Bowser’s Challenge.

We could not retrieve a Universal page that confirms this. The figures come from our data and are a
pointer, not a promise. At Epic Universe the value is missing for 8 of 14 attractions, at Islands of
Adventure for 20 of 25.

```ride-waits-widget rides=universal-islands-of-adventure/harry-potter-and-the-forbidden-journey|Forbidden Journey;universal-islands-of-adventure/hagrids-magical-creatures-motorbike-adventure|Hagrid’s Motorbike Adventure;universal-islands-of-adventure/the-incredible-hulk-coaster|Incredible Hulk Coaster;universal-studios-florida/harry-potter-and-the-escape-from-gringotts|Escape from Gringotts;universal-studios-florida/revenge-of-the-mummy|Revenge of the Mummy;universal-epic-universe/stardust-racers|Stardust Racers;universal-epic-universe/mario-kart-bowsers-challenge|Mario Kart columns=park,peak

```

## Shanghai Disneyland and Hong Kong Disneyland

The two Asian Disney parks have two and three rides. At
[Shanghai Disneyland](ref:shanghai-disneyland) they are Zootopia: Hot Pursuit and Seven Dwarfs Mine
Train, at [Hong Kong Disneyland](ref:hong-kong-disneyland-park) Hyperspace Mountain, Big Grizzly
Mountain Runaway Mine Cars and Toy Soldier Parachute Drop. Here too the value is missing almost
everywhere: for 35 of 37 attractions in Shanghai and for 44 of 47 in Hong Kong.

## How to plan a day with single rider

**Pick two or three rides beforehand.** On the park page at park.fan you can see which rides carry the
badge. The entrance is worth most on the ride where the standard queue is longest.

**Check that the queue is open before you split up.** On the attraction page the “Single rider” badge
appears with the status of the queue. It can be closed without the ride being closed.

**Split up if it pays off.** For two adults the fastest option is for one to take the standard queue
and the other the single rider entrance. Whoever rides first waits at the exit.

How waiting feels, and why moving up in the queue gets you nothing, is in the post
[The art of waiting](/blog/the-art-of-waiting).

## Frequently asked questions about single rider

### What does single rider mean in a theme park?

Single rider is a separate queue for individual guests. Whoever uses it takes the seats left over in a
vehicle and sits next to strangers. Efteling describes it this way: single riders fill the empty seats
that come up in the vehicles.

### Is the single rider queue always shorter?

No. Efteling writes that single riders usually wait less, but that this depends on the number of
visitors and the free seats. On quiet days the queue can be closed altogether.

### Can I use single rider with my family?

Only if everyone is willing to ride separately. Efteling lets groups use the single rider entrance, but
they ride one after another. A child who needs a companion has to sit next to the adult, so the single
rider entrance is ruled out.

### Which rides at Europa-Park have single rider?

Six: ARTHUR, WODAN, blue fire, Eurosat, the Voletarium and Voltron Nevera. The park states it
explicitly on the pages for Voltron Nevera and Eurosat.

### Which rides at Efteling have single rider?

The park’s page names Danse Macabre, Joris en de Draak, Symbolica, Baron 1898, Max & Moritz and
Python. In our data De Vliegende Hollander is listed as well.

### Where can I see whether a ride has single rider?

On the attraction page at park.fan, from the “Single rider” badge. If the badge is missing, the value
may be unknown.

### Do I have to meet the minimum height on single rider?

Yes. Walt Disney World and the Disneyland Resort write that single riders must meet all of the ride’s
requirements. Efteling writes the same for children who enter alone.

### Can I choose my seat?

No. Efteling assigns a seat, and Walt Disney World doesn’t guarantee the choice of seat.

## Where the data has gaps

Three limits apply to everything in this post:

- `hasSingleRider` is a fixed attribute per ride. It doesn’t say whether the queue is open today.
- “Unknown” is not “no”. Where nothing is entered, the ride isn’t in the lists.
- For Phantasialand, Disneyland Paris, PortAventura, Alton Towers, Thorpe Park, Universal and the Asian
  Disney parks, the value comes from our data, not from a park page we could read. At Efteling our data
  lists one ride more than the park does.

## Further reading

- [Europa-Park: wait times and tips](/blog/europa-park-wait-times-tips)
- [Phantasialand: wait times and tips](/blog/phantasialand-wait-times-tips)
- [Disneyland Paris: wait times and tips](/blog/disneyland-paris-wait-times-tips)
- [The art of waiting](/blog/the-art-of-waiting)

### Sources & further reading

- Single rider at Efteling, list of the six rides, rules for groups and children, Symbolica:
  [Single rider entrance (official)](https://www.efteling.com/de/park/informationen/single-rider-eingang)
- Single rider at Walt Disney World, five rides and the rules:
  [Single Rider Services (official)](https://disneyworld.disney.go.com/guest-services/single-rider-line/)
- Single rider at the Disneyland Resort, eleven rides and the rules:
  [Single Rider Services (official)](https://disneyland.disney.go.com/guest-services/single-rider-line/)
- Voltron Nevera, minimum height, capacity and single rider note:
  [Voltron Nevera powered by Rimac (official)](https://www.europapark.de/en/theme-park/attractions/voltron-nevera-powered-rimac)
- Eurosat, height and age limits and single rider note:
  [Eurosat – CanCan Coaster (official)](https://www.europapark.de/en/theme-park/attractions/eurosat-cancan-coaster)
- Which rides in which park carry the attribute, the figures in the table and the live queues: query
  of the park.fan API (`/v1/parks/<continent>/<country>/<city>/<park>`, fields `hasSingleRider` and
  `queues`), retrieved on 8 October 2026 for 203 parks with live wait times
