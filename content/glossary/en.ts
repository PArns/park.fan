import type { GlossaryTermTranslation } from '@/lib/glossary/types';

const translations: GlossaryTermTranslation[] = [
  {
    id: 'wait-time',
    name: 'Wait Time',
    shortDefinition: 'The estimated duration a guest must queue before boarding an attraction.',
    definition:
      'Wait time (also called queue time) is the estimated duration a guest stands in line before boarding a ride or attraction. Parks post wait times at ride entrances and in their own apps, and work the figure out from queue length sensors, past throughput and how fast the ride is loading at that moment. park.fan re-reads the wait times every five minutes, for every attraction in a park.',
    relatedTermIds: ['express-pass', 'posted-wait-time', 'single-rider', 'virtual-queue'],
    aliases: ['Wait Times', 'queue time', 'queue times'],
  },
  {
    id: 'single-rider',
    name: 'Single Rider',
    shortDefinition:
      'A separate, faster queue lane for guests willing to ride alone and fill odd empty seats.',
    definition:
      'A single rider queue is for guests willing to be split from their group, and fills the odd seats left over in ride vehicles. Because single riders slot into those gaps instead of waiting for a whole row to come free, the lane moves faster than the standby queue, often cutting the wait by 50–70%. Not every park or attraction offers it, and whether a ride runs the lane on a given day is announced at its entrance and in the park app.',
    alternateNames: ['Single Rider Lane', 'Solo rider queue'],
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['Single Riders'],
  },
  {
    id: 'virtual-queue',
    name: 'Virtual Queue',
    shortDefinition:
      'A digital queuing system where guests reserve a timed return slot instead of waiting in a physical line.',
    definition:
      'A virtual queue (sometimes called a boarding group or return time) lets guests sign up for a ride through the park app or a kiosk and get a notification when their turn is coming. Instead of standing in a physical queue you can be somewhere else in the park until your group is called. Parks use them for their highest-demand new attractions, where a physical queue would concentrate more people in one place than the walkways can hold. A virtual queue usually opens at a fixed time, often the moment the gates do, and can be full within minutes.',
    relatedTermIds: ['express-pass', 'single-rider', 'wait-time'],
    aliases: ['Virtual Queues'],
  },
  {
    id: 'express-pass',
    name: 'Express Pass',
    shortDefinition:
      'A paid or included ticket upgrade granting access to a dedicated, shorter priority queue.',
    definition:
      'An Express Pass (the exact name varies by park: Universal Express, Disney Lightning Lane, Six Flags Flash Pass) is a ticket upgrade that lets the holder use a separate priority entrance with much shorter waits. Some parks include express access in premium hotel packages; others sell it as a daily add-on at a price that climbs as the park fills. At Universal Studios parks the unlimited version can be used on the same attraction again and again through the day.',
    relatedTermIds: ['single-rider', 'virtual-queue', 'wait-time'],
    aliases: ['Express Passes'],
  },
  {
    id: 'posted-wait-time',
    name: 'Posted Wait Time',
    shortDefinition:
      'The official wait time displayed by the park at a ride entrance or in its app.',
    definition:
      "The posted wait time is the official estimate shown at the entrance of a ride and in the park's own app. Parks work it out from the measured length of the queue, the ride's throughput so far and the pace at which it is currently loading. Posted times are usually rounded to the nearest 5 or 10 minutes and can differ from the wait a guest actually experiences, in both directions. park.fan merges the posted wait times from several public sources every five minutes.",
    relatedTermIds: ['crowd-level', 'wait-time'],
    aliases: ['posted wait times', 'posted wait', 'displayed wait time'],
  },
  {
    id: 'crowd-level',
    name: 'Crowd Level',
    shortDefinition:
      'A scale measuring how busy a theme park is on a given day, from Very Low to Extreme.',
    definition:
      "Crowd level describes how busy a park is on a given day or at a given hour. park.fan works it out from the wait times it has recorded, the park's current occupancy and the forecast, on a scale from Very Low to Extreme. Very Low means short queues at almost every attraction and room on the walkways; Extreme means the park is running near capacity, with 90 minutes or more at the popular rides and queues even at the quick-service counters. What moves the figure is school holidays, public holidays, special events such as Halloween nights or fireworks, and the weather forecast.",
    relatedTermIds: ['crowd-calendar', 'peak-day', 'wait-time'],
    aliases: ['Crowd Levels'],
  },
  {
    id: 'crowd-calendar',
    name: 'Crowd Calendar',
    shortDefinition:
      'A day-by-day forecast of crowd levels, used to find the quietest days to visit.',
    definition:
      'A crowd calendar is a month or year view showing the predicted crowd level for each day at one park. park.fan builds its crowd calendars with models trained on the wait times it has recorded, cross-referenced with school holiday schedules across several countries, upcoming events, park operating hours and seasonal patterns. Green days mean low predicted attendance; orange and red days mark the busy ones.',
    relatedTermIds: ['crowd-level', 'peak-day', 'rope-drop'],
    aliases: ['crowd calendars'],
  },
  {
    id: 'peak-day',
    name: 'Peak Day',
    shortDefinition:
      'A day when visitor attendance reaches or approaches a park’s maximum capacity.',
    definition:
      "A peak day is any day on which attendance sits at or near a park's maximum capacity. The usual candidates are major public holidays (Christmas, Easter), special event days such as Halloween nights and New Year's Eve fireworks, and school holiday weeks. On a peak day at Disneyland Paris or Europa-Park the headline attractions regularly pass 90 to 120 minutes and restaurant queues form well before noon. park.fan marks peak days in the crowd calendar.",
    relatedTermIds: ['crowd-calendar', 'crowd-level', 'rope-drop'],
  },
  {
    id: 'refurbishment',
    name: 'Refurbishment',
    shortDefinition:
      'A planned maintenance closure during which a ride or area undergoes repairs or upgrades.',
    definition:
      'A refurbishment (enthusiasts usually shorten it to “rehab”) is a scheduled maintenance or renovation period during which a ride, show or area of the park is closed. It can run from a few days to several months and is normally planned for the off-season. Parks publish refurbishment schedules in advance, though the dates shift; Disney and Universal rotate the closures so that different attractions come out of service each year. park.fan marks attractions currently undergoing refurbishment.',
    relatedTermIds: ['downtime', 'ride-capacity'],
    aliases: ['Refurbishments', 'refurb', 'refurbs'],
  },
  {
    id: 'downtime',
    name: 'Downtime',
    shortDefinition:
      'An unplanned temporary closure of a ride, typically caused by a technical fault or safety check.',
    definition:
      'Downtime is an unscheduled, temporary closure of a ride, as opposed to a planned refurbishment. The causes are mechanical faults, sensor errors, safety checks after a guest incident, weather (lightning above all) or an animal in the ride zone. Most of it is resolved within minutes to a couple of hours, though a complex mechanical failure can keep a ride shut for the rest of the day. park.fan shows the current operating status of every tracked attraction and tells Operating, Down, Closed and Refurbishment apart.',
    relatedTermIds: ['refurbishment', 'ride-capacity', 'wait-time'],
    aliases: ['Downtimes', 'ride downtime'],
  },
  {
    id: 'ride-capacity',
    name: 'Ride Capacity',
    shortDefinition:
      'The number of guests an attraction can process per hour under normal operating conditions.',
    definition:
      'Ride capacity, or throughput, is the number of guests a ride can carry per hour under good operating conditions. It follows from vehicle size, how many vehicles are running, how fast the station loads and unloads, and the length of the ride cycle. Carousels, log flumes and large dark rides move 1,500 to 2,000 guests an hour; a single-vehicle dark ride or a coaster running one train may manage 500 to 800. Capacity is what decides how fast a queue moves: a 30-minute wait at 1,800 an hour is clearing people three times faster than the same 30 minutes at 600. Parks add trains or vehicles on busy days for exactly that reason.',
    relatedTermIds: ['downtime', 'refurbishment', 'wait-time'],
  },
  {
    id: 'rope-drop',
    name: 'Rope Drop',
    shortDefinition:
      'The moment a park opens its gates each morning, when queues for popular rides are at their shortest.',
    definition:
      "Rope drop is the moment a park opens for the day, named after the rope or barrier staff lower to let the first guests through. Popular rides see their shortest queues of the day in the first 30 to 60 minutes, before the crowd has spread through the park. How much being at the gate at opening buys depends on the ride: some run at much the same level from morning to evening. Many parks also give hotel guests early entry to a selection of attractions before the general public. park.fan's schedule section shows the exact opening times for each park.",
    relatedTermIds: ['crowd-calendar', 'crowd-level', 'early-entry', 're-ride', 'wait-time'],
    aliases: ['Rope Drops'],
  },
  {
    id: 'early-entry',
    name: 'Early Entry',
    shortDefinition:
      'Entry for resort hotel guests 30–60 minutes before the park opens to everyone else.',
    definition:
      "Early Entry (marketed as Early Park Entry, Extra Magic Hours or Magic Morning, depending on the resort) lets guests staying at on-site hotels into the park before the general public. The window is normally 30 to 60 minutes, and only hotel guests are inside for it. With the day's crowd still outside the gates, the queues at the participating attractions are a fraction of what they will be an hour later: on a peak day, three or four headline rides under 20 minutes each, against 60 to 90 minutes by mid-morning. Not every attraction takes part, and the park publishes the list.",
    relatedTermIds: ['express-pass', 'peak-day', 'rope-drop'],
  },
  {
    id: 'park-hopper',
    name: 'Park Hopper',
    shortDefinition:
      'A ticket add-on allowing guests to visit multiple parks within the same resort on a single day.',
    definition:
      "A Park Hopper ticket admits the holder to two or more parks at the same resort on one day. Disney's version lets guests move between Magic Kingdom, EPCOT, Hollywood Studios and Animal Kingdom after 2 PM. Universal Orlando sells a two- or three-park ticket covering Universal Studios, Islands of Adventure and Epic Universe, and PortAventura World has a combined ticket for PortAventura Park and Ferrari Land. Hopping pays off when the ride you came for is in the second park, when a morning in one park is to be followed by an evening show in another, or on a short trip. The premium over a single-park ticket varies by resort and climbs on peak days.",
    relatedTermIds: ['crowd-calendar', 'rope-drop', 'season-pass'],
    aliases: ['Park Hoppers'],
  },
  {
    id: 'season-pass',
    name: 'Season Pass',
    shortDefinition: 'An annual ticket granting unlimited park visits over a 12-month period.',
    definition:
      "A season pass, or annual pass, grants unlimited entry to one or more parks over twelve months. The higher tiers usually add free or discounted parking, dining and merchandise discounts, and earlier booking windows for special events. Europa-Park's Jahrespass, Disneyland Paris's Annual Pass and Alton Towers's Merlin Annual Pass are three European examples. Many passes carry blockout dates on the busiest days of the year, which is how parks keep pass holders out of a park already at capacity. From about three or four visits a year, a pass costs less than the equivalent day tickets. Some also carry reciprocal discounts at partner parks.",
    relatedTermIds: ['express-pass', 'park-hopper', 'peak-day'],
    aliases: ['Season Passes'],
  },
  {
    id: 'height-requirement',
    name: 'Height Requirement',
    shortDefinition:
      'A minimum height a guest must meet to ride an attraction, enforced for safety reasons.',
    definition:
      'Height requirements are safety rules parks set so that restraints, lap bars, over-the-shoulder harnesses and seat belts, sit correctly on every rider. They run from about 90 cm (35 inches) on gentler family coasters to 140 cm (55 inches) on the most intense rides. A few attractions also have a maximum height or a weight limit, though those are rarer. Park websites and apps publish a height chart for every ride, which is worth reading before a family day rather than at the ride entrance. Where a child is too small, most parks run a rider switch system so the adults can take turns without queueing twice.',
    relatedTermIds: ['refurbishment', 'ride-capacity'],
    aliases: ['height requirements'],
  },
  {
    id: 'themed-land',
    name: 'Themed Land',
    shortDefinition:
      'A self-contained zone within a park built around a unified theme, story, and aesthetic.',
    definition:
      "A themed land is a defined area of a park that holds one visual design, one backstory and matching attractions, restaurants and shops. The intention is that crossing the entrance feels like crossing into somewhere else. The Wizarding World of Harry Potter at Universal, Star Wars: Galaxy's Edge at Disney, Klugheim at Phantasialand and Scandinavia at Europa-Park are four examples. A new land is also a crowd event in its own right: the opening season draws media coverage and a visible spike in attendance, and because a land tends to mix one low-capacity headliner with several high-capacity rides, wait times inside the same area can differ by an hour.",
    relatedTermIds: ['refurbishment', 'ride-capacity', 'soft-opening'],
    aliases: ['Themed Lands'],
  },
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    shortDefinition:
      'An unofficial early opening of a new attraction before its announced grand opening date.',
    definition:
      'A soft opening is a park quietly running a new ride or land before the official opening date, usually with no announcement at all. Parks use them to test the systems with real guests, find the operational problems and train staff before the launch date. A soft opening can start and stop without warning and sometimes lasts a single day or a few hours. For anybody in the park at the time it is a windfall: a brand-new attraction with almost no queue. Enthusiast forums and park-news accounts on social media are usually the first to report one. It is not something to book travel around.',
    relatedTermIds: ['downtime', 'refurbishment', 'themed-land'],
  },
  {
    id: 'standby-queue',
    name: 'Standby Queue',
    shortDefinition:
      'The standard physical waiting line accessible to all guests without a special pass or upgrade.',
    definition:
      'The standby queue is the ordinary waiting line, open to every guest without a ticket upgrade or priority pass. It runs first come, first served, and its posted wait reflects how busy that attraction is at that moment. On a busy day the standby queue for a headline ride can reach 90 minutes or more, filling every switchback and running back out of the queue building. park.fan shows the standby wait time for each attraction next to the other queue types.',
    relatedTermIds: ['express-pass', 'single-rider', 'virtual-queue', 'wait-time'],
    aliases: ['standby queues', 'standby'],
  },
  {
    id: 'lightning-lane',
    name: 'Lightning Lane',
    shortDefinition:
      'Disney’s paid priority queue system, introduced in 2021 as the successor to the free FastPass+ programme.',
    definition:
      "Lightning Lane is Disney's name for the priority queue system it introduced in late 2021 to replace FastPass+. It comes in two tiers: Individual Lightning Lane (ILL), sold per person and per ride for the highest-demand attractions, and Lightning Lane Multi Pass (LLMP), a daily purchase that books timed return windows across a selection of rides. Both are priced dynamically and cost more on busier days. Because it replaced something that had been free, it is still argued about. What it buys depends on the day: on a quiet one the standby queue is fast enough that it changes little, on a peak day an Individual Lightning Lane for Space Mountain, Tron or Radiator Springs Racers can be the difference between riding and not. The days with long standby queues expected are marked in park.fan's crowd calendar.",
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['Lightning Lanes'],
  },
  {
    id: 'genie-plus',
    name: 'Genie+',
    shortDefinition:
      'Disney’s former daily add-on providing Lightning Lane Multi Pass access across most park attractions.',
    definition:
      "Genie+ was Disney's paid daily add-on, launched in 2021, which replaced the free FastPass+ system at Walt Disney World and Disneyland. For a per-person, per-day fee, guests held one Lightning Lane return-time reservation at a time across a broad selection of rides, at a price that rose on the busiest days. The headline attractions were excluded and sold separately as Individual Lightning Lane. It has since been renamed Lightning Lane Multi Pass at both resorts, with the mechanics unchanged, and the old name still turns up throughout trip reports written while it was current. park.fan shows the current crowd level for each park.",
    relatedTermIds: ['express-pass', 'lightning-lane', 'virtual-queue'],
  },
  {
    id: 'boarding-group',
    name: 'Boarding Group',
    shortDefinition:
      'A numbered virtual queue allocation granting access to a high-demand attraction when that group number is called.',
    definition:
      "A boarding group is a numbered slot in a virtual queue system, used at the attractions where a physical queue would put more people in one place than the walkways can hold. Guests join through the park app, often at the exact minute the park opens, and are given a group number; when that range is called, usually by push notification, they have a limited window, normally 60 to 120 minutes, to reach the attraction's own entrance. On a busy day every group can be gone within minutes of the system opening. Disney's boarding groups for Tron Lightcycle Run and Star Wars: Rise of the Resistance are what made the term familiar. A limited number of groups is sometimes released again later in the day.",
    relatedTermIds: ['lightning-lane', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'off-peak',
    name: 'Off-Peak',
    shortDefinition:
      'Quieter weeks in the park calendar, with shorter waits and lower ticket prices.',
    definition:
      "Off-peak is the quiet part of the calendar, when schools are in session and no major holiday falls: January to early February, the second half of September through October outside the Halloween evenings, and the first two weeks of November. Wait times in those weeks are a fraction of the summer figures, with rides that post 90 minutes in July showing 15 to 20 in October. Ticket prices are usually at their lowest and the car parks are half empty. The trade is that some seasonal attractions, shows and food offerings only run in the peak weeks. park.fan's crowd calendar marks a park's off-peak windows.",
    relatedTermIds: ['crowd-calendar', 'crowd-level', 'peak-day'],
  },
  {
    id: 'offseason',
    name: 'OffSeason',
    shortDefinition:
      'A seasonal closure period during which the park shuts completely for maintenance, ride upgrades, or a winter break, and is not open to the public.',
    definition:
      'The OffSeason is a defined period during which a theme park closes its gates entirely and shuts down all operations; off-peak, by comparison, is only a quieter time to visit. Parks use this window to carry out maintenance on rides and facilities, undertake major refurbishments that cannot be performed while guests are present, and give staff a rest period before the new operating season begins. OffSeason closures are most common during winter months and typically last anywhere from a few weeks to several months depending on the park and its climate. During this time no attractions, restaurants, or shows are accessible to the public.\n\nWhen park.fan shows an OffSeason status for a park, it means no operating schedule is available for the current period and the next confirmed opening date is still some weeks away. Check the park’s official website for the exact reopening date and any pre-sale ticket windows. At popular parks the first days back often sell out quickly.',
    relatedTermIds: ['crowd-calendar', 'refurbishment', 'soft-opening'],
  },
  {
    id: 'ride-photo',
    name: 'Ride Photo',
    shortDefinition:
      'An automatically captured photo of guests at one point of a ride, available to buy afterwards.',
    definition:
      'A ride photo is an on-ride image taken automatically by a fixed camera at one point of the ride: the drop on a water ride, the first hill of a coaster, the moment an accelerator launches. Afterwards guests can look at it at a kiosk or in the park app and decide whether to buy a print or the digital file. Many parks sell an all-day or all-resort photo package covering unlimited ride photos for a fixed price, which works out cheaper from about three or four rides.',
    relatedTermIds: ['onride-offride', 'themed-land'],
  },
  {
    id: 'queue-line',
    name: 'Queue Line',
    shortDefinition:
      'The physical waiting area guests walk through before boarding an attraction, often themed as part of the experience.',
    definition:
      "The queue line is the physical space (indoor corridors, outdoor switchbacks or themed rooms) that guests walk through before boarding an attraction. At many modern parks the queue is part of the attraction itself: the Haunted Mansion queue uses gravestones, crypts and the stretching room to set the tone long before anyone reaches a Doom Buggy, and Universal's Harry Potter rides begin their story the moment you step into the building. A queue built that way makes a long wait easier to sit out. park.fan shows the current wait time for every attraction in a park.",
    relatedTermIds: ['single-rider', 'standby-queue', 'wait-time'],
    aliases: ['Queue Lines', 'Queues'],
  },
  {
    id: 'opening-day',
    name: 'Opening Day',
    shortDefinition:
      'The official date on which a new park, themed land, or attraction opens to the public for the first time.',
    definition:
      "Opening day is the officially announced date on which a new park, expansion or attraction first admits the public. Opening days draw media coverage, ribbon-cutting ceremonies and the most dedicated enthusiasts, who queue from the early hours to be among the first to ride. That combination also makes them a poor choice for anyone who wants short waits: an attraction's opening week is usually the busiest it will ever be. Soft openings occasionally run before the official date, with far fewer people in the park.",
    relatedTermIds: ['crowd-level', 'rope-drop', 'soft-opening'],
    aliases: ['Opening Days'],
  },
  {
    id: 'rider-switch',
    name: 'Rider Switch',
    shortDefinition:
      'A system letting accompanying adults take turns riding while the other waits with a child who cannot meet the height requirement.',
    definition:
      'Rider Switch (also called Child Swap) lets a group take turns on a ride when one of them, usually a child under the height requirement, cannot go. One adult rides while the other waits with the child in a designated area; when the first returns, the second boards straight away without queueing again. Disney calls it Rider Switch, Universal calls it Child Swap. On a busy day it saves the second adult a standby wait that can run to 60 or 90 minutes. The attendants at the ride entrance are the ones who set it up.',
    relatedTermIds: ['height-requirement', 'standby-queue', 'wait-time'],
  },
  {
    id: 'blockout-date',
    name: 'Blockout Date',
    shortDefinition:
      'A calendar date on which certain annual pass tiers are not valid for park entry, typically on the busiest days.',
    definition:
      "A blockout date (also written blackout date) is a calendar day on which certain annual pass tiers do not grant entry. Parks use them to hold attendance down on their busiest days: peak public holidays, school vacation periods and major special events. A top-tier annual pass has few blockout dates or none at all; an entry-level pass can be blocked on 30 to 60 days a year or more. The restriction only becomes visible at the gate, so the calendar for that specific tier is worth reading before booking travel. park.fan's crowd calendar marks the peak periods that blockout dates usually sit on.",
    relatedTermIds: ['crowd-calendar', 'peak-day', 'season-pass'],
  },
  {
    id: 'hard-ticket-event',
    name: 'Hard Ticket Event',
    shortDefinition:
      'A separately ticketed special event, usually in the evening, that needs its own admission on top of a regular park ticket.',
    definition:
      "A hard ticket event is a separately ticketed evening event at a theme park, requiring its own admission on top of, or instead of, a day ticket. These events run entertainment, seasonal décor and walkthrough experiences that the normal operating day does not have. Examples are Mickey's Not-So-Scary Halloween Party and Mickey's Very Merry Christmas Party at Walt Disney World, Halloween Horror Nights at Universal Studios, and the Halloween and Wintertraum seasons at Phantasialand. On event days regular day guests are usually asked to leave between 6 and 7 PM, which makes the late afternoon unusually crowded as everyone tries to fit in a last ride. Tickets go on sale months ahead and the popular Halloween nights sell out weeks before the date.",
    relatedTermIds: ['early-entry', 'peak-day', 'season-pass'],
  },
  {
    id: 'fastpass',
    name: 'FastPass',
    shortDefinition:
      'Disney’s former free priority queue system, active 1999–2020, replaced by the paid Lightning Lane in 2021.',
    definition:
      "FastPass+ (launched as FastPass in 1999) was Disney's free priority queue system: a guest booked a timed return window for an attraction at no extra cost. At Walt Disney World that meant up to three reservations a day in advance through the My Disney Experience app, then further ones one at a time on the day. It ran at all four Walt Disney World parks and at Disneyland Paris. Disney suspended it for the COVID-19 closure in March 2020, never reinstated it, and replaced it in late 2021 with the paid Lightning Lane. The switch is still argued about in the Disney community, because it turned a free benefit into a paid one, and the term still turns up throughout trip reports and planning guides written before 2021.",
    relatedTermIds: ['express-pass', 'genie-plus', 'lightning-lane', 'return-time'],
  },
  {
    id: 'dark-ride',
    name: 'Dark Ride',
    shortDefinition:
      'An indoor attraction where guests travel through elaborately themed scenes in guided vehicles.',
    definition:
      "A dark ride is an indoor attraction where guests travel in vehicles (cars on a fixed or trackless system, boats in a water channel or gondolas on an overhead rail) through themed scenes. The name refers to the controlled lighting environment that lets projections, animatronics and physical sets do their work. Dark rides run from gentle family classics (it's a small world, Pinocchio's Daring Journey) to long narrative attractions such as Star Wars: Rise of the Resistance. On a trackless dark ride the vehicles have no rails and are guided from the floor, so a scene can approach from several directions and two vehicles need not take the same route; Symbolica at the Efteling and Ratatouille at Disneyland Paris are the European examples. Dark rides usually carry more guests per hour than a roller coaster, which is why parks lean on them on busy days.",
    relatedTermIds: [
      'height-requirement',
      'ride-capacity',
      'soft-opening',
      'themed-land',
      'vr-coaster',
      'wait-time',
    ],
    aliases: ['Dark Rides'],
  },
  {
    id: 'return-time',
    name: 'Return Time',
    shortDefinition:
      'A reserved time window to return to a ride, issued by Lightning Lane, virtual queue, or similar priority access systems.',
    definition:
      "A return time (sometimes called a return window) is a fixed period, usually an hour, during which a guest holding priority access can present at the attraction's separate entrance. Return times are issued by Lightning Lane reservations, virtual queue boarding groups and older systems such as FastPass+. They leave the time in between free for other parts of the park instead of a queue. Miss the window and the reservation is normally forfeited, though Disney and Universal both allow a short grace period. park.fan shows live wait times and crowd levels beside a park's return times.",
    relatedTermIds: ['boarding-group', 'fastpass', 'lightning-lane', 'virtual-queue'],
    aliases: ['Return Times'],
  },
  {
    id: 'airtime',
    name: 'Airtime',
    shortDefinition:
      'Negative G-force on a roller coaster, which makes riders float or lifts them out of their seats.',
    definition:
      'Airtime is negative G-force: the weightlessness riders feel when a train crests a hill faster than gravity would carry it. It comes in two kinds: floater airtime, a mild negative G where you rise slightly out of the seat, and ejector airtime, where the lap bar is the only thing keeping you in the car. Airtime hills, also called camelbacks, are shaped to follow a parabolic path so the negative-G phase lasts as long as the layout allows.',
    relatedTermIds: [
      'airtime-hill',
      'bunnyhop',
      'first-drop',
      'quad-down',
      'restraint-freedom',
      's-hill',
      'wooden-coaster',
    ],
  },
  {
    id: 'inversion',
    name: 'Inversion',
    shortDefinition:
      'Any element on a roller coaster where riders are rotated at least partially upside down.',
    definition:
      'An inversion is any element where the track turns riders past the vertical plane, at least partly upside down. The main types are the vertical loop, cobra roll, Immelmann, dive loop, corkscrew, inline twist, heartline roll, zero-G roll, flat spin, batwing and pretzel loop, each with its own combination of G-force and change of direction. Modern coasters routinely fit six to fourteen of them into a single layout, and the count is one of the standard figures quoted for a coaster; The Smiler at Alton Towers holds the record with 14. Inversions produce positive G at the bottom of a loop and negative G at the top, where riders get a brief moment of airtime while upside down.',
    relatedTermIds: ['cobra-roll', 'corkscrew', 'immelmann', 'vertical-loop', 'zero-g-roll'],
    aliases: ['Inversions'],
    alternateNames: ['upside-down element', 'overhead element'],
  },
  {
    id: 'vertical-loop',
    name: 'Vertical Loop',
    shortDefinition:
      'A circular inversion that takes riders through a complete 360-degree circle in the vertical plane.',
    definition:
      "The vertical loop is a full 360-degree circle in the vertical plane that carries riders upside down at the apex. Modern loops are clothoids, teardrop-shaped, with a wide radius at entry and exit and a tight one at the top. That geometry gives sustained positive G at the bottom and a short negative-G moment at the top instead of the sharp spikes a true circle would produce. Corkscrew at Knott's Berry Farm (1975) was the first modern looping coaster, and the loop has been standard equipment ever since, on everything from family coasters to record machines.",
    relatedTermIds: ['cobra-roll', 'immelmann', 'inclined-loop', 'interlocking-loops', 'inversion'],
  },
  {
    id: 'immelmann',
    name: 'Immelmann',
    shortDefinition:
      'A half-loop up to the top followed by a half-roll that exits in the opposite direction, common on B&M inverted and dive coasters.',
    definition:
      "The Immelmann is an inversion in two phases: the track pulls up into a half vertical loop, carrying riders over the top and briefly inverted, and a half-roll then rights the train while reversing its heading by 180 degrees. The element is named after the First World War pilot Max Immelmann, who used a comparable manoeuvre to break off a dogfight. It produces sustained positive G on the way up and a short negative-G moment at the top before the roll, and it turns up on B&M's inverted and dive coasters: Baron 1898 at the Efteling and Krake at Heide-Park both take one straight out of the first drop.",
    relatedTermIds: ['b-and-m', 'dive-loop', 'inversion', 'vertical-loop'],
  },
  {
    id: 'zero-g-roll',
    name: 'Zero-G Roll',
    shortDefinition:
      'A 360-degree roll following a parabolic arc where riders experience near-weightlessness while inverted at the apex.',
    definition:
      'The zero-G roll is an inversion in which the track follows a parabolic arc through the rotation, like a heartline roll but faster and with more vertical travel. At the top of the roll riders get a brief negative G while upside down, which is airtime and an inversion in the same element. B&M builds it into its inverted and wing coasters. On a wing coaster, where the outer seats sit clear of the track, a zero-G roll swings those riders through a wide arc with nothing above, below or beside them.',
    relatedTermIds: ['airtime', 'b-and-m', 'heartline-roll', 'inversion', 'zero-g-winder'],
  },
  {
    id: 'launch-coaster',
    name: 'Launch Coaster',
    shortDefinition:
      'A coaster that accelerates from standstill to high speed via electromagnetic, hydraulic, or pneumatic systems rather than a chain lift hill.',
    definition:
      "A launch coaster replaces the chain lift with a propulsion system that takes the train from a standstill to full speed in a few seconds. The technologies are LSM (linear synchronous motor), where electromagnetic coils accelerate a fin under the train; LIM (linear induction motor), similar but less efficient; hydraulic launches, Intamin's cable-and-piston system behind record machines such as Kingda Ka, which does 0 to 206 km/h in 3.5 seconds; and compressed air. Some coasters launch two or three times through the circuit to keep the energy up across a long layout. Taron at Phantasialand runs two LSM launches through a themed rock landscape and was the longest launched coaster in the world when it opened; Red Force at Ferrari Land reaches 180 km/h in five seconds on a hydraulic launch. LSM is now the standard for new launched coasters in Europe.",
    relatedTermIds: ['horseshoe', 'intamin', 'lifthill', 'top-hat'],
    aliases: ['Launch Coasters'],
  },
  {
    id: 'wooden-coaster',
    name: 'Wooden Coaster',
    shortDefinition:
      'A roller coaster built primarily of wood, with a rumbling ride, lateral movement and unpredictable airtime.',
    definition:
      "A wooden coaster runs on a track of laminated wood layers, carried on a wooden or steel support structure. Wood flexes and is never built to steel tolerances, and that is where the rumble, the lateral shuffle and the unpredictable airtime come from. Balder at Liseberg, Colossos at Heide-Park and Wodan at Europa-Park are European examples; The Beast at Kings Island, at 2.2 km, is one of the longest anywhere. The maintenance never stops: rails are checked, relaminated and replaced on a rolling cycle, and the same ride behaves differently in different temperature and humidity. Rocky Mountain Construction's conversion process can put a steel I-box track on an ageing wooden coaster, which keeps the wooden structure and changes everything else.",
    relatedTermIds: ['airtime', 'hybrid-coaster', 'quad-down', 'rattle', 'rmc'],
    alternateNames: ['Woodie', 'Woodies'],
  },
  {
    id: 'steel-coaster',
    name: 'Steel Coaster',
    shortDefinition:
      'A roller coaster built primarily with steel track and support structure, with a smooth, precise ride.',
    definition:
      'A steel coaster is built with tubular or flat steel track on a steel lattice or tubular frame. Where wood flexes and moves, steel gives engineers precise control over the G-forces, the transitions and the inversions, which is what makes complex layouts with several inversions, tight radii and long high-speed sections possible.\n\nSteel dominates modern coaster construction because a designer can draw almost any shape: beyond-vertical drops, full inversions, rapid changes of direction. Shambhala at PortAventura, Nemesis at Alton Towers and Silver Star at Europa-Park are European examples, and the category runs from small family rides to record-breaking mega coasters. The precision costs something: the track has to be inspected carefully and repainted often, and a design error in steel is less forgiving than one in wood.',
    relatedTermIds: [
      'bobsled-coaster',
      'hyper-coaster',
      'inversion',
      'launch-coaster',
      'single-rail-coaster',
      'stand-up-coaster',
      'wooden-coaster',
    ],
    aliases: ['Steel Coasters'],
    alternateNames: ['Steel track coaster', 'Steel roller coaster'],
  },
  {
    id: 'suspended-coaster',
    name: 'Suspended Coaster',
    shortDefinition:
      'A coaster whose train hangs below the track from a pivot and swings freely from side to side.',
    definition:
      'A suspended coaster hangs its train from a pivot above the track, so the cars can swing sideways independently of the path the track takes. Going into a curve, the train swings out like a pendulum, which is where the whip comes from and what makes each lap slightly different. That is the difference from an inverted coaster, whose train is rigidly fixed to the rail.\n\nSuspended coasters are less common than inverted ones. The swing is noticeable even in a moderate-speed turn, with the ground a long way below. Vekoma developed the Suspended Looping Coaster (SLC) in the 1990s and hundreds were built, because the model fits into a small plot. The swinging can feel chaotic next to the precision of a modern inversion.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'vekoma'],
    aliases: ['Suspended'],
    alternateNames: ['Swinging coaster'],
  },
  {
    id: 'hybrid-coaster',
    name: 'Hybrid Coaster',
    shortDefinition:
      'A coaster combining a traditional wooden support structure with precision steel I-box track, pioneered by Rocky Mountain Construction.',
    definition:
      'A hybrid coaster puts a precision steel I-box track from Rocky Mountain Construction (RMC) onto the wooden support structure of a traditional coaster. The I-box allows tighter radii, beyond-vertical drops and inversions that laminated wood cannot carry. RMC developed it to rescue ageing wooden coasters that had become too rough to enjoy, and the rebuilt layouts come back with hard airtime, several inversions and steep drops. Steel Vengeance at Cedar Point was converted from Mean Streak in 2018; in Europe, Untamed at Walibi Holland (a new build, 2019) and Wildfire at Kolmården, built down a mountainside, are two examples.',
    relatedTermIds: ['airtime', 'rmc', 'wooden-coaster'],
  },
  {
    id: 'b-and-m',
    name: 'B&M',
    shortDefinition:
      'Bolliger & Mabillard, a Swiss manufacturer of smooth, reliable coasters, many of them with an Immelmann, a cobra roll or a zero-G roll.',
    definition:
      'B&M (Bolliger & Mabillard) is a Swiss roller coaster manufacturer founded in 1988 by Walter Bolliger and Claude Mabillard, both previously at Intamin. Their rides run very smoothly and break down rarely. The forces are sustained positive G without sharp jolts, and the inversions the company comes back to are the Immelmann, the cobra roll and the zero-G roll. The company builds inverted coasters, sit-down loopers, hyper coasters (over 61 m), giga coasters (over 91 m), wing coasters, dive machines and flying coasters. Nearly every large European park has at least one: Shambhala and Dragon Khan at PortAventura, Silver Star at Europa-Park, Nemesis at Alton Towers, Goliath at Walibi Holland, Katun at Mirabilandia, Oziris at Parc Astérix.',
    relatedTermIds: [
      'cobra-roll',
      'dive-coaster',
      'hybrid-coaster',
      'immelmann',
      'smoothness',
      'stand-up-coaster',
      'zero-g-roll',
    ],
  },
  {
    id: 'intamin',
    name: 'Intamin',
    shortDefinition:
      'A Swiss manufacturer of record-breaking hydraulic launch coasters, mega and giga coasters, and several of the world’s fastest and tallest rides.',
    definition:
      "Intamin AG is a Swiss ride manufacturer founded in 1967 and the company behind a long run of coaster records. Its hydraulic launch powered the tallest coasters in the world for years: Kingda Ka at Six Flags Great Adventure (139 m) and Top Thrill Dragster at Cedar Point (128 m). Beyond the record chasers it builds mega and giga coasters (Millennium Force at Cedar Point), multi-launch coasters, water rides and dark rides. In Europe: Taron at Phantasialand, two LSM launches through a volcanic landscape; Red Force at Ferrari Land in Tarragona, at 180 km/h the fastest coaster on the continent; Expedition GeForce at Holiday Park; and the wooden Colossos at Heide-Park. Intamin designs are more complex to operate than B&M's, and several installations have had long spells of downtime.",
    relatedTermIds: ['b-and-m', 'launch-coaster', 'mack-rides', 'top-hat'],
  },
  {
    id: 'mack-rides',
    name: 'Mack Rides',
    shortDefinition:
      'A German family-owned manufacturer from Waldkirch, run by the family that owns Europa-Park, that builds water rides, dark rides and hyper coasters.',
    definition:
      'Mack Rides is a German ride manufacturer in Waldkirch, Baden-Württemberg, a few kilometres from Europa-Park, which the Mack family owns and uses as a showcase. Founded in 1921, it started with portable fairground rides before moving into permanent park attractions. The portfolio covers water rides, dark rides (Test Track and Radiator Springs Racers for Disney among them) and a growing range of steel coasters. Blue Fire Megacoaster at Europa-Park (2009) was the first ride anywhere to carry a Stengel Dive. Kondaa at Walibi Belgium is their hyper coaster, and The Ride to Happiness at Plopsaland de Panne a launched spinning coaster.',
    relatedTermIds: [
      'b-and-m',
      'bobsled-coaster',
      'intamin',
      'launch-coaster',
      'mackprodukt',
      'powered-coaster',
      'splashdown',
      'stengel-dive',
      'water-coaster',
    ],
  },
  {
    id: 'rmc',
    name: 'RMC',
    shortDefinition:
      'An Idaho-based manufacturer that invented the hybrid coaster: it refits ageing wooden coasters with steel I-box track that can carry hard airtime and inversions.',
    definition:
      "Rocky Mountain Construction (RMC) is an American roller coaster manufacturer and maintenance company in Hayden, Idaho, best known for the I-box steel track that can be fitted onto an existing wooden coaster's support structure. The conversion turns a rough, ageing woodie into a ride with hard airtime, inversions, beyond-vertical drops and overbanked turns, none of which laminated wood track can carry. Steel Vengeance at Cedar Point (from Mean Streak) and Wicked Cyclone at Six Flags New England are two such conversions; Untamed at Walibi Holland, opened in 2019, and Wildfire at Kolmården in Sweden are new builds on the same track system. For a park with a wooden coaster nobody wants to ride any more, the conversion is an alternative to demolition.",
    relatedTermIds: [
      'airtime',
      'barrel-roll-drop',
      'hybrid-coaster',
      'single-rail-coaster',
      'stall',
      'wooden-coaster',
    ],
  },
  {
    id: 'vekoma',
    name: 'Vekoma',
    shortDefinition:
      'A Dutch manufacturer, among the world’s largest coaster builders by number of installations, behind the Boomerang, the SLC and a newer generation of smoother models.',
    definition:
      'Vekoma Rides Manufacturing is a Dutch roller coaster manufacturer in Vlodrop and one of the most prolific in the world by number of installations. Founded in 1926 as an engineering firm, it moved into amusement rides in the 1970s and reached parks everywhere with the Boomerang: a compact, inexpensive shuttle coaster with three inversions, ridden once forwards and once backwards. More than 50 were built, on every inhabited continent. Other Vekoma models are the Suspended Looping Coaster (SLC), the mine train and the Giant Inverted Boomerang. From the 2010s the company rebuilt its product line around much smoother track and trains, and the new-generation Family Boomerang, Tilt Coaster and suspended family coasters are appearing across Europe. Disney has commissioned custom Vekoma designs, the Seven Dwarfs Mine Train among them.',
    relatedTermIds: ['b-and-m', 'boomerang', 'gerstlauer', 'intamin', 'single-rail-coaster'],
  },
  {
    id: 'gerstlauer',
    name: 'Gerstlauer',
    shortDefinition:
      'A German manufacturer best known for the Euro-Fighter model with its beyond-vertical first drop, plus spinning coasters and compact family rides.',
    definition:
      'Gerstlauer Amusement Rides GmbH is a German roller coaster manufacturer in Münsterhausen, Bavaria. Founded in 1946 as a metalworking firm, it entered the ride market in the 1980s and made its name with the Euro-Fighter: a compact coaster with a vertical chain lift and a first drop of up to 97 degrees. Euro-Fighters fit into very little space, which suits city parks and smaller sites; Saw – The Ride at Thorpe Park, Rage at Adventure Island and Speed at Oakwood are the British examples. Gerstlauer also builds the Infinity Coaster, spinning coasters and the SkyRoller, on which riders control their own rotation.',
    relatedTermIds: [
      'b-and-m',
      'beyond-vertical-drop',
      'euro-fighter',
      'intamin',
      'spinning-coaster',
      'xtreme-spinning-coaster',
    ],
  },
  {
    id: 'schwarzkopf',
    name: 'Schwarzkopf',
    shortDefinition:
      'A German manufacturer whose looping coasters from the 1970s and 80s still run in many European parks.',
    definition:
      'Anton Schwarzkopf GmbH & Co. KG was a German roller coaster manufacturer in Münsterhausen, Bavaria, the town Gerstlauer later worked out of. Founded by Anton Schwarzkopf in 1954, it was the company that brought the modern looping coaster to Europe and to the world: Revolution at Six Flags Magic Mountain (1976) was the first of them. The Looping Star, the Thriller/Wildcat and the transportable Looping Coaster toured fairs and were installed at parks across Europe. Schwarzkopf coasters run smoothly for their age because they were precisely engineered, and their layouts fit strong airtime and inversions into a small footprint. The company went bankrupt in 1983; many of its rides are still operating decades later, maintained by specialist firms or by Gerstlauer, which took over some of the original tooling.',
    relatedTermIds: ['b-and-m', 'gerstlauer', 'intamin', 'vekoma'],
  },
  {
    id: 'lifthill',
    name: 'Lifthill',
    shortDefinition:
      'The mechanically powered climb that pulls a coaster train to its highest point; the height gained there powers the rest of the ride.',
    definition:
      'The lift hill is the section where an external mechanism pulls the train from near ground level to the highest point of the ride, turning electrical energy into height. Usually that mechanism is a chain running along the centre of the track, and the familiar click-click-click is the anti-rollback ratchet engaging so the train cannot slide back. The alternatives are cable lifts (quieter and smoother, used on some B&M rides), tyre drives and magnetic lifts. The height of the lift hill sets the top speed the layout can reach: 70 metres buys more than 40, everything else being equal. It is also the slowest part of the ride, and the part a launch coaster deliberately does without.',
    relatedTermIds: ['block-brake', 'first-drop', 'launch-coaster'],
  },
  {
    id: 'first-drop',
    name: 'First Drop',
    shortDefinition:
      'The first descent after the lift hill or launch, usually where the ride reaches its top speed.',
    definition:
      "The first drop is the main descent immediately after the lift hill or the launch. On most traditional coasters it is the tallest element and the point at which the train reaches its top speed. Angle, height and profile shape the character of the whole ride: a drop steeper than 80 degrees reads as a near-vertical plunge, while a carefully profiled parabolic drop can deliver strong airtime at a gentler angle. Dive coasters are built around the drop itself, holding the wide train at the crest before releasing it over an edge at or beyond vertical, and Gerstlauer's Euro-Fighter takes it to 97 degrees.",
    relatedTermIds: ['airtime', 'airtime-hill', 'beyond-vertical-drop', 'dive-coaster', 'lifthill'],
  },
  {
    id: 'airtime-hill',
    name: 'Airtime Hill',
    shortDefinition:
      'A hill-shaped element built to produce negative G-forces, which make riders float or lift them from their seats.',
    definition:
      'An airtime hill (also called a camelback) is a rise-and-fall element built to produce negative G-force, which makes riders float or lifts them out of the seat. The hill follows a parabolic path that keeps the train on a free-fall arc for as long as the profile allows. A floater hill gives mild, comfortable floating; an ejector hill is shaped harder, and the lap bar is what keeps the rider in the car. Steel coasters use precisely machined profiles and give the same airtime on every run; wooden coasters vary from lap to lap, because the track flexes.',
    relatedTermIds: ['airtime', 'bunnyhop', 'first-drop', 's-hill', 'stengel-dive'],
  },
  {
    id: 'helix',
    name: 'Helix',
    shortDefinition:
      'A section where the track spirals continuously around a central axis, with sustained lateral G-forces.',
    definition:
      'A helix is a section of track that spirals continuously around a central axis, like a screw thread, without turning riders upside down. Where an airtime hill works vertically, a helix produces sustained lateral G-force that presses riders into the outside of the turn. A descending helix trades height for speed; an ascending one bleeds speed off while keeping the lateral pressure on. Helices often sit near the end of a layout, to spend whatever kinetic energy is left rather than stopping the train abruptly. The underground finale of Nemesis at Alton Towers runs a tight descending helix through a rock pit, and Expedition GeForce at Holiday Park closes on a heavily loaded one.',
    relatedTermIds: ['first-drop', 'horseshoe'],
  },
  {
    id: 'block-brake',
    name: 'Block Brake',
    shortDefinition:
      'A braking section that divides the circuit into independent segments, so several trains can run at once without risk of collision.',
    definition:
      "A block brake divides a coaster's circuit into independent sections called blocks, each of which may hold exactly one train at a time. If the train ahead slows or stops, the control system holds every following train at its block brake. That is what lets a park run several trains at once, which raises hourly capacity considerably, with no risk of one train reaching another. Block brakes sit where a stopped train cannot roll backwards, so on a flat section or a slight rise, and use either magnetic eddy-current fins (contactless, no wear) or friction brakes. The most visible kind is the mid-course brake run about halfway through a layout; when it trims more speed than the layout was drawn around, the hills and inversions after it come out weaker.",
    relatedTermIds: ['brake-run', 'ride-capacity', 'stacking'],
  },
  {
    id: 'brake-run',
    name: 'Brake Run',
    shortDefinition:
      'The deceleration section at the end of a ride where the train slows to station-entry speed.',
    definition:
      'The brake run is the stretch of track after the main circuit, where the train slows from ride speed to a safe station approach. Modern brake runs use eddy-current brakes: rows of permanent magnets that meet metal fins under the train and generate resistance by induction, with no contact, no friction and no wear. Older coasters used pneumatic caliper brakes that gripped the track directly. A mid-course brake run partway through the layout doubles as a block section for multi-train operation, holding the train until the station clears. The final brake run before the station is sometimes braked deliberately lightly, which keeps the entry into the station quick and gets the train back to the platform sooner.',
    relatedTermIds: ['block-brake', 'lifthill'],
  },
  {
    id: 'cobra-roll',
    name: 'Cobra Roll',
    shortDefinition:
      'A B&M double inversion shaped like a cobra’s raised head: two inversions joined by a 180-degree twist at the apex.',
    definition:
      "The cobra roll is a B&M element that puts two inversions in quick succession: the track curves up into a half-loop, rotates 180 degrees at the top through a short inverted passage, then mirrors the movement to exit in the direction it came from. Seen from the side the outline resembles a cobra's raised and spread hood. It fits two full inversions into a small footprint with smooth, predictable G-forces, which is why it usually sits in the middle of a layout rather than at either end. Dragon Khan at PortAventura has one, as do B&M inverted coasters across Europe.",
    relatedTermIds: ['b-and-m', 'banana-roll', 'batwing', 'immelmann', 'inversion', 'sea-serpent'],
  },
  {
    id: 'corkscrew',
    name: 'Corkscrew',
    shortDefinition:
      'A barrel-roll inversion in which the track spirals 360 degrees around a central axis, one of the earliest inversion types.',
    definition:
      'The corkscrew is one of the earliest modern inversions, introduced by Arrow Dynamics in the 1970s. The track spirals around a central axis like a wine corkscrew, rolling riders through a full 360 degrees on a path offset from the direction of travel. Corkscrews are often built in pairs, back to back, and were the most common inversion on steel coasters from the mid-1970s to the early 1990s. German park maps and signage use the word Korkenzieher for it. Smoother designs such as the zero-G roll, inline twist and heartline roll have largely replaced it in new construction, but many parks in Europe and North America still run corkscrew coasters.',
    relatedTermIds: ['flat-spin', 'inline-twist', 'inversion'],
  },
  {
    id: 'dive-loop',
    name: 'Dive Loop',
    shortDefinition:
      'The mirror image of an Immelmann: the track dives steeply downward through a half-loop and exits in the opposite direction.',
    definition:
      "A dive loop (also called a dive turn or reverse Immelmann) is the Immelmann run the other way round: instead of pulling up into a half-loop from below, the track dives steeply downward, arcs through the bottom half of a loop and exits pointing the opposite way to the entry. In the seat it is a steep plunge followed by a hard pull-out, and the strong positive G at the exit is the mirror image of the negative G at the top of an Immelmann. Dive loops are a B&M element and turn up on the manufacturer's inverted coasters and sit-down loopers, frequently alternated with Immelmanns so that the two follow one another through a layout.",
    relatedTermIds: ['b-and-m', 'immelmann', 'inversion'],
  },
  {
    id: 'inline-twist',
    name: 'Inline Twist',
    shortDefinition:
      'A single 360-degree roll around the track axis: a smooth inversion that leaves the train’s heading largely unchanged.',
    definition:
      'An inline twist (also called an inline roll or barrel roll) rotates the train a full 360 degrees around the long axis of the track, so the coaster rolls without changing direction. Unlike a corkscrew, whose spiral is offset from the track centreline, the inline twist pivots on the track itself, which makes it a short, smooth inversion with very little lateral force. It is common on B&M flying and inverted coasters, often in pairs or run straight into another element, and because it leaves the heading unchanged it drops into a straight or a curved section without disturbing the rest of the layout.',
    relatedTermIds: ['corkscrew', 'flat-spin', 'heartline-roll', 'inversion'],
  },
  {
    id: 'heartline-roll',
    name: 'Heartline Roll',
    shortDefinition:
      'A 360-degree roll centred on the rider’s centre of gravity instead of the track, so riders are close to weightless through the rotation.',
    definition:
      "A heartline roll is shaped so that the rider's heart, roughly the body's centre of gravity, stays at the same height through the whole rotation, instead of the track being the pivot point. Holding the centre of mass still keeps the forces low through the roll, and riders float through it without the jolt of a corkscrew or even an inline twist. It turns up in modern B&M and Intamin designs, where the geometry is worked out to avoid sudden loads, above all on their hyper coasters.",
    relatedTermIds: ['inline-twist', 'inversion', 'zero-g-roll'],
  },
  {
    id: 'sidewinder',
    name: 'Sidewinder',
    shortDefinition:
      'A half-loop combined with a half-corkscrew that rotates the train 90 degrees and reverses direction. Two of them make up the ends of Vekoma’s Boomerang.',
    definition:
      "A sidewinder is a half vertical loop that pulls the train upward, followed immediately by a half corkscrew that rights it while turning it through 90 degrees. The result is an inversion plus a large change of direction in a very small footprint. Two of them are the outer halves of Vekoma's Boomerang layout, flanking a central vertical loop to make the three-inversion circuit that is ridden forwards and then backwards. The name comes from the snake-like twist the track makes when you watch it from trackside. As a standalone element it belongs mostly to Vekoma's Boomerang and Giant Inverted Boomerang models, though the same half-loop-plus-half-corkscrew geometry turns up under other names elsewhere.",
    relatedTermIds: ['boomerang', 'cobra-roll', 'inversion'],
  },
  {
    id: 'pretzel-loop',
    name: 'Pretzel Loop',
    shortDefinition:
      'A large inversion on B&M flying coasters where riders in the horizontal Superman position pass through the bottom of a vertical loop while fully inverted.',
    definition:
      'The pretzel loop is an inversion found only on B&M flying coasters, where riders lie face-down in a Superman position. The track sends them diving steeply downward while inverted, through the low point of a large vertical loop, then pulls them sharply upward again; seen from the side the shape is roughly a pretzel. Because the low point comes with riders face-down, the positive G there often passes 4g. Every B&M flying coaster is built around one; Manta at SeaWorld Orlando and Tatsu at Six Flags Magic Mountain are two examples.',
    relatedTermIds: ['b-and-m', 'inline-twist', 'inversion'],
  },
  {
    id: 'batwing',
    name: 'Batwing',
    shortDefinition:
      'A double-inversion with a 180-degree direction reversal combining two half-loops connected by a half-corkscrew, forming a bat-wing shape overhead.',
    definition:
      'A batwing is two inversions with a change of direction built into them: the track arcs up into a half-loop, a half-corkscrew at the top inverts the train and turns it round, and the half-loop is then mirrored back down to ground level. Seen from above, the outline resembles a pair of spread bat wings. Unlike the bowtie, which puts two inversions back to back without changing the heading, the batwing leaves the train travelling 180 degrees from where it entered. It is a B&M element and appears on their inverted coasters, Montu at Busch Gardens Tampa and Afterburn at Carowinds among them.',
    relatedTermIds: ['b-and-m', 'bowtie', 'cobra-roll', 'inversion'],
  },
  {
    id: 'norwegian-loop',
    name: 'Norwegian Loop',
    shortDefinition:
      'A vertical loop taken the other way round: the train enters from the top, dives through the circular path and exits at the top.',
    definition:
      'The Norwegian loop (sometimes called a reverse loop) is a standard vertical loop taken the other way round: instead of entering at the bottom and exiting at the same height, the train comes in from above, dives down through the circular path and exits again at the top. The strong positive G at the bottom of the circle is unchanged, since the geometry of the loop is, but the entry and exit feel like a dive and a recovery rather than the classic loop pull-out. Norwegian loops are rare, and turn up mainly on certain Vekoma designs and on a handful of custom installations.',
    relatedTermIds: ['dive-loop', 'inversion', 'vertical-loop'],
  },
  {
    id: 'flat-spin',
    name: 'Flat Spin',
    shortDefinition:
      'A corkscrew-type inversion on inverted coasters in which the spiral runs nearly horizontally, through a wide circle.',
    definition:
      "A flat spin is a corkscrew-type inversion arranged so the spiral runs almost horizontally when watched from the ground. It belongs to B&M inverted and flying coasters. On an inverted coaster, where the train hangs under the track with riders' feet free, the flat spin swings those riders through a wide, nearly level circle at speed. From the seat it is a smooth, sustained rotation at moderate G, with no sharp change of direction. Banshee at Kings Island and Afterburn at Carowinds have them, and so do several European B&M inverts including Katun at Mirabilandia.",
    relatedTermIds: ['b-and-m', 'corkscrew', 'inline-twist', 'inversion'],
  },
  {
    id: 'cutback',
    name: 'Cutback',
    shortDefinition:
      'A half-corkscrew inversion that simultaneously reverses the train’s direction by approximately 180 degrees.',
    definition:
      'A cutback is a half-corkscrew in which the track also curves back on itself through roughly 180 degrees, so the element combines an inversion with a full reversal of direction. A standard corkscrew rotates the riders and leaves the heading largely intact; a cutback does not. The name describes what the track does, cutting back across its own previous heading while it flips. Cutbacks are uncommon and appear mainly on certain Vekoma models and on custom coasters that need a tight turnaround and an inversion in the same place. Doing both at once makes for harsher forces than a purpose-shaped Immelmann or zero-G roll.',
    relatedTermIds: ['corkscrew', 'inversion', 'sidewinder'],
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    shortDefinition:
      'A double-inversion element like a sea serpent but with a lower connecting apex, which fits two inversions into little vertical space.',
    definition:
      'The butterfly is a double inversion made of two half-loops joined at a relatively low apex. Like the sea serpent, which joins its half-loops at a high peak, it turns riders over twice without changing the direction of travel. The lower connecting section is what separates it from the sea serpent, from the bowtie, whose proportions differ, and from the batwing, which does change direction. Few have been built: the element appears on a small number of Vekoma and custom designs, where two inversions in very little vertical space are what the layout needs.',
    relatedTermIds: ['batwing', 'bowtie', 'inversion'],
  },
  {
    id: 'bowtie',
    name: 'Bowtie',
    shortDefinition:
      'A double-inversion element where two mirrored half-loops form a bowtie shape, with no change of direction.',
    definition:
      'A bowtie is two mirrored half-loops joined at a shared peak: two inversions in quick succession, after which the train leaves in roughly the direction it entered. From above, the track outline looks like a bow tie. That is the difference from the batwing, which looks similar from the ground but reverses the heading: a bowtie rides as a flowing pair of loops rather than a twisting turnaround. Bowties are rare and are found mainly on certain Vekoma and custom installations.',
    relatedTermIds: ['batwing', 'butterfly', 'inversion'],
  },
  {
    id: 'bunnyhop',
    name: 'Bunny Hop',
    shortDefinition:
      'A series of small, quick airtime hills near the end of a ride, with gentle floater airtime as the train slows.',
    definition:
      'Bunny hops are a run of small, quick hills near the end of a layout, once the train has spent most of its energy. At that lower speed each hill gives gentle floater airtime, a soft rhythmic lift rather than the ejector airtime of the bigger hills earlier on. The name is the bouncing motion. They need very little height to work at low speed, which makes them an efficient way to use the last stretch of ground, and they are a standard closing figure on hyper coasters, giga coasters and wooden coasters.',
    relatedTermIds: ['airtime', 'airtime-hill', 'brake-run', 's-hill'],
  },
  {
    id: 'stengel-dive',
    name: 'Stengel Dive',
    shortDefinition:
      'An airtime hill banked beyond 90 degrees, so the negative G arrives with riders tipped past sideways. It is named after engineer Werner Stengel, and several Mack Rides coasters have one.',
    definition:
      "The Stengel Dive is an airtime element in which the track banks past 90 degrees, so riders hang sideways or slightly overhead while the profile of the hill is lifting them out of their seats at the same time. The airtime arrives with the horizon rotated. It is named after Werner Stengel, the German engineer who worked out the geometry of a large share of the world's coasters. Blue Fire Megacoaster at Europa-Park was the first ride to carry one, in 2009; later Mack rides such as Kondaa at Walibi Belgium and The Ride to Happiness at Plopsaland de Panne use several in one layout.",
    relatedTermIds: ['airtime', 'airtime-hill', 'mack-rides'],
  },
  {
    id: 'horseshoe',
    name: 'Horseshoe',
    shortDefinition:
      'A sharply banked 180-degree turnaround shaped like a horseshoe, used to redirect the train between launch segments on multi-launch coasters.',
    definition:
      'A horseshoe is a heavily banked semicircular turn, usually at 75 to 90 degrees, that turns the train through 180 degrees. The steep banking is what keeps the lateral force down at the tight radius the turnaround needs, and at speed it converts into positive G that presses riders into their seats. Horseshoes are mostly found in launched layouts, as the turnaround between two launch segments: Taron at Phantasialand uses them to swing the train back between its two launches through the rock landscape, and accelerator coasters use one to join the outbound and return legs.',
    relatedTermIds: ['intamin', 'launch-coaster', 'mack-rides'],
  },
  {
    id: 'predrop',
    name: 'Pre-Drop',
    shortDefinition:
      'A small dip just before the first drop on a chain-lift coaster, which eases chain tension and gives a brief pop of airtime.',
    definition:
      'A pre-drop is a small hill or dip at the end of the lift hill, immediately before the crest that leads into the first drop. Its job is mechanical: it takes the tension off the lift chain as the train goes over the top, which would otherwise have to hold the whole weight of the train through the crest and would produce noise, wear and a jolt. The side effect is for the rider, a short pop of airtime before the main drop begins. Pre-drops are common on wooden and steel coasters alike; the one on Goliath at Six Flags Magic Mountain gives a strong pop.',
    relatedTermIds: ['airtime', 'first-drop', 'lifthill'],
  },
  {
    id: 'top-hat',
    name: 'Top Hat',
    shortDefinition:
      'A tall, narrow element with a near-vertical climb and descent, built after the launch on Intamin’s hydraulic accelerator coasters.',
    definition:
      "A top hat is an element where the track climbs almost vertically to a narrow crest and drops almost vertically down the other side, which in profile looks like a top hat. On Intamin's hydraulic launch accelerators the launch takes the train past 200 km/h in under four seconds, and the top hat is what that speed is for. An inside top hat banks the track slightly inward at the peak, an outside top hat banks it outward, which puts riders on the outside of the curve with airtime and nothing to look at but the ground. Kingda Ka at Six Flags Great Adventure (139 m) and Top Thrill Dragster at Cedar Point (128 m) are the tall ones; in Europe, Red Force at Ferrari Land reaches 112 m after a hydraulic launch to 180 km/h.",
    relatedTermIds: ['first-drop', 'intamin', 'launch-coaster'],
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    shortDefinition:
      'A compact Vekoma coaster model that sends riders through three inversions twice, once forwards and once backwards.',
    definition:
      "The Boomerang is one of the most-built roller coaster models there is, made by Vekoma. The layout is a vertical loop with a sidewinder on either side of it, ridden forwards, then backwards after the train has been hauled up a second inclined lift and released back through the same elements. That gives six inversions, three in each direction, on a very small plot, which is what made it affordable for parks with little space or budget. More than 50 were built, on every inhabited continent. The older ones ride roughly, because the inversion geometry descends from Arrow Dynamics and the transitions are sharp; Vekoma's new-generation track has fixed that, but the original model is still running at dozens of mid-sized parks and is where a lot of people take their first inversion.",
    relatedTermIds: ['inversion', 'sidewinder', 'vertical-loop'],
  },
  {
    id: 'euro-fighter',
    name: 'Euro-Fighter',
    shortDefinition:
      'A compact Gerstlauer coaster model with a vertical lift hill and a first drop at or beyond vertical, built for small sites.',
    definition:
      "The Euro-Fighter is Gerstlauer's compact coaster model. Its chain lift pulls the train straight up like a tower, and its first drop is 90 degrees or beyond, up to 97. It fits several inversions, tight turns and high G-forces into a very small area, which is why it suits parks with little room. At the top of the lift the train pauses with riders leaning out over the edge before the drop begins. European Euro-Fighters include Saw – The Ride at Thorpe Park, Rage at Adventure Island in Southend-on-Sea, Speed at Oakwood and Fluch von Novgorod at Hansa-Park.",
    relatedTermIds: ['beyond-vertical-drop', 'first-drop', 'inversion', 'lifthill'],
  },
  {
    id: 'dive-coaster',
    name: 'Dive Coaster',
    shortDefinition:
      'A coaster type with an unusually wide train and a drop at or beyond vertical, and a pause at the crest before the train is released.',
    definition:
      "A dive coaster has an unusually wide train, typically eight or ten riders across in a row, a drop at or close to vertical, and a hold at the top of that drop: the train stops for a few seconds on the edge before it is released. The wide train gives every rider the same view straight down, and the hold is a design decision rather than a mechanical necessity. B&M's Dive Machine line started the format with Oblivion at Alton Towers in 1998, the first of its kind anywhere; Valkyria at Liseberg, Baron 1898 at the Efteling and Krake at Heide-Park are the other European installations. Gerstlauer sells a competing model for smaller sites.",
    relatedTermIds: [
      'b-and-m',
      'beyond-vertical-drop',
      'euro-fighter',
      'first-drop',
      'launch-coaster',
    ],
    aliases: ['Dive Coasters'],
  },
  {
    id: 'credit',
    name: 'Credit',
    shortDefinition:
      'A roller coaster an enthusiast has ridden and logged in a personal count. Collecting them is a hobby of its own.',
    definition:
      'A coaster credit (or cred) is a roller coaster an enthusiast has ridden and added to a personal count. Collecting credits means riding as many different coasters as possible. What counts varies: some people count only conventional coasters, others include water coasters, family coasters and kiddie coasters; some insist on riding every version of a layout, others count it once. The Roller Coaster Database (RCDB) and apps such as Coaster Count are where the totals get logged. Chasing credits is what sends enthusiasts on international trips and into small parks that hold a rare or historic ride, and round numbers (100, 500, 1,000) shape those itineraries for years.',
    relatedTermIds: [
      'hybrid-coaster',
      'mackprodukt',
      'onride-offride',
      'pov',
      'powered-coaster',
      're-ride',
      'wooden-coaster',
    ],
  },
  {
    id: 'pov',
    name: 'POV',
    shortDefinition:
      'Point-of-view footage filmed from the front row of a coaster, watched to see a ride before riding it.',
    definition:
      'POV (point of view) is on-ride video shot from a front-row seat, usually with a camera mounted to the train. POV videos are how many people look at a coaster before travelling to it: a good one shows every element, drop and inversion in order, and carries the pace and the layout better than a description can. Parks sometimes produce an official POV for a new ride; more often the footage comes from enthusiasts, media or a special guest event. YouTube holds tens of thousands of them. The term is also used for first-person footage of dark rides and water rides.',
    relatedTermIds: ['credit', 'dark-ride', 'onride-offride'],
  },
  {
    id: 'vr-coaster',
    name: 'VR Coaster',
    shortDefinition:
      'A roller coaster ridden with VR headsets that show a virtual scene synchronised with the movement of the train.',
    definition:
      "A VR coaster hands riders a virtual reality headset, usually a Samsung Gear VR or a purpose-built device, showing a virtual world synchronised with the movement of the train: as the coaster goes through a loop the virtual world turns with it, and as it drops the virtual world drops. The ride becomes the motion platform for an animated or game-like scene. VR coasters spread between roughly 2015 and 2019, mostly as retrofits to existing rides. Reception was split: the headsets are uncomfortable, unhygienic or nausea-inducing for some riders, and they slow loading down, which cuts throughput and lengthens the queue. Many parks that installed VR have since taken it out. The systems designed with the physical ride from the start, Mack Rides' among them, fared better.",
    relatedTermIds: ['dark-ride', 'height-requirement'],
  },
  {
    id: 'ert',
    name: 'ERT',
    shortDefinition:
      'Exclusive Ride Time, a period in which a small group has one or more attractions to itself, with no public queue.',
    definition:
      "ERT (Exclusive Ride Time) is a period in which a selected group has a ride or a set of rides to itself, with the general public excluded: members of a coaster enthusiast club, hotel guests on a premium package, or season pass holders at a special event. During ERT the same people ride again and again with almost no wait, often getting through dozens of laps in one session. Parks run them for club meetups (European Coaster Club, American Coaster Enthusiasts and dozens of national organisations), for hotel packages with before-hours or after-hours access, and as part of hard ticket events. Fifteen or twenty laps in a row, in different rows and at different times of day, show a coaster's character in a way one ride in a full park cannot.",
    relatedTermIds: ['credit', 'early-entry', 'hard-ticket-event', 're-ride', 'rope-drop'],
  },
  {
    id: 'touring-plan',
    name: 'Touring Plan',
    shortDefinition:
      'A planned order of attractions for one day, drawn up to keep the total wait short and fit in as many rides as possible.',
    definition:
      "A touring plan is a prepared sequence of attractions, meal breaks and movements around a park, put together to keep the total time spent queueing down. A workable plan accounts for which areas fill up first, how much each attraction can carry, how its queue behaves, the show schedule, the walking distances and the weather. TouringPlans.com and Thrill-Data both publish detailed plans for the major parks. park.fan's live wait times and crowd calendar work alongside such a plan: a ride that was pencilled in for the morning and posts a 15-minute standby at 2 PM is a reason to change the order on the spot.",
    relatedTermIds: ['crowd-calendar', 'early-entry', 'rope-drop', 'wait-time'],
  },
  {
    id: 'stacking',
    name: 'Stacking',
    shortDefinition:
      'Coaster trains piling up in the brake run because the station is not clearing fast enough, which cuts throughput and lengthens waits.',
    definition:
      'Stacking happens when a coaster loads and unloads more slowly than the ride cycle takes, so trains pile up in the brake run waiting for the station to clear. Instead of dispatching one train as the previous one comes back, the operator has to hold trains outside, and the ride stops briefly between dispatches. Every second of it comes straight off hourly capacity and goes onto the standby wait. The usual causes are slow loading (over-the-shoulder harnesses that have to be checked one seat at a time), bag checks and understaffing. It is visible from the queue: if a train is sitting in the brake run when the station dispatches, the ride is stacking, and its operated capacity is well under the figure the manufacturer quotes.',
    relatedTermIds: ['block-brake', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'inverted-coaster',
    name: 'Inverted Coaster',
    shortDefinition:
      "A coaster where the track runs above the train and riders' feet hang free below it.",
    definition:
      "An inverted coaster runs the train underneath the track with riders' feet hanging free. Unlike a suspended coaster, whose cars swing sideways on a pivot, an inverted coaster's train is rigidly fixed to the rail above it, so the layout decides the whole movement. Having nothing under the feet is what makes the head-chopper near misses work as the train sweeps past structures, rocks and theming. B&M built the first modern inverted coaster in 1992 with Batman: The Ride and still builds most of them. European examples include Nemesis at Alton Towers, Katun at Mirabilandia, Oziris at Parc Astérix and Black Mamba at Phantasialand.",
    relatedTermIds: ['b-and-m', 'inversion', 'wing-coaster'],
  },
  {
    id: 'wing-coaster',
    name: 'Wing Coaster',
    shortDefinition:
      'A coaster type with seats extending on either side of the track, so riders have nothing above, below, or beside them.',
    definition:
      'A wing coaster (also called a wing rider) puts two seats on each side of the track, out on arms, so riders have nothing above, below or beside them. The layouts are built around near misses with theming and structure that would be impossible with the track in the way; on the outer seats, a zero-G roll swings riders through a wide arc of open air. B&M is the main manufacturer. European examples are Flug der Dämonen at Heide-Park and The Swarm at Thorpe Park. park.fan lists the current wait times for every wing coaster it tracks.',
    relatedTermIds: ['b-and-m', 'dive-coaster', 'inverted-coaster'],
  },
  {
    id: 'spinning-coaster',
    name: 'Spinning Coaster',
    shortDefinition:
      'A coaster whose cars rotate freely on a vertical axis throughout the ride, so no two runs face the same way.',
    definition:
      "A spinning coaster carries cars on a platform that turns freely around a vertical axis while the train runs. The rotation is not controlled, so every car takes the layout in a different order of forwards, backwards and sideways, and two consecutive rides on the same circuit feel different. Mack Rides in Waldkirch builds most of them; Maurer and Gerstlauer build their own versions. Winja's Fear and Winja's Force at Phantasialand and Dwervelwind at Toverland are European examples. Spinning coasters make good family rides, since the height requirement is usually lower than on a comparable non-spinning coaster.",
    relatedTermIds: ['credit', 'launch-coaster', 'mack-rides'],
  },
  {
    id: 'xtreme-spinning-coaster',
    name: 'Xtreme Spinning Coaster',
    shortDefinition:
      'Gerstlauer’s thrill version of the spinning coaster: taller and faster than a standard model, with cars that spin harder.',
    definition:
      'The Xtreme Spinning Coaster (XSC) is the thrill-ride version of Gerstlauer’s spinning coaster. A standard spinning coaster is built for families; the XSC has a taller structure, steeper drops, higher top speeds and a spinning mechanism tuned for more rotation, so riders spin harder and more often through every element of the layout.\n\nAt the higher pace the car’s orientation changes faster, and the same ride can differ completely from one run to the next. Restraints are usually an over-the-shoulder or lap-bar system built for the higher forces. The model sits between family spinners and full-size thrill coasters.',
    alternateNames: ['XSC'],
    relatedTermIds: ['credit', 'gerstlauer', 'spinning-coaster'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      'A coaster between 200 and 299 feet (61–91 m) tall, usually without inversions and built around speed and airtime over large camelback hills.',
    definition:
      "Hyper coaster is the classification for roller coasters between 200 and 299 feet, roughly 61 to 91 m, tall. B&M call their models Hyper Coasters and Intamin call the comparable ones Mega Coasters, but the height band is the same. Both build long, flowing layouts with large camelback airtime hills at sustained speed, and usually without inversions. Europe's tallest are Hyperion at Energylandia at 77 m and Shambhala at PortAventura at 76 m. Goliath at Walibi Holland, Silver Star at Europa-Park and Kondaa at Walibi Belgium are the other European examples; Mako at SeaWorld Orlando and Diamondback at Kings Island are two American ones.",
    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'giga-coaster', 'intamin'],
    aliases: ['Hyper Coasters'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition:
      'A coaster over 300 feet (91 m) tall, the category above hyper coasters, with long, fast layouts.',
    definition:
      'Giga coaster is the classification for roller coasters between 300 and 399 feet, roughly 91 to 121 m, tall. Cedar Fair and Intamin coined the word when Millennium Force opened at Cedar Point in 2000 as the first 300-foot coaster. Gigas are built like hyper coasters, for height, sustained speed and airtime instead of inversions, and the extra height buys higher speeds and longer layouts. Europe has none: the tallest coasters on the continent stop inside the hyper range, which planning permission and the size of European park sites both bear on. Fury 325 at Carowinds is 99 m tall, reaches 153 km/h and has a layout just under 2 km long; Millennium Force and Intimidator 305 at Kings Dominion are two more.',
    relatedTermIds: ['airtime', 'first-drop', 'hyper-coaster'],
  },
  {
    id: 'overbank',
    name: 'Overbanked Turn',
    shortDefinition:
      'A banked turn where the track tilts beyond 90 degrees, putting riders briefly past the inverted position without completing a full inversion.',
    definition:
      'An overbanked turn is a curve banked past 90 degrees, so the outer rail rises above vertical and riders are tilted slightly beyond upside down without the rotation ever completing. What they feel is lateral force mixed with a little negative G at the top of the banking, then the track rights itself. It is not an inversion, though it is regularly counted as one by people watching from the ground, because the banking looks that extreme. Overbanks are a fixture of modern B&M hypers and Intamin megas, and RMC layouts use them constantly, often straight into an airtime hill or a real inversion.',
    relatedTermIds: ['airtime', 'b-and-m', 'intamin', 'inversion', 'rmc'],
  },
  {
    id: 'trim-brake',
    name: 'Trim Brake',
    shortDefinition:
      'A mid-course magnetic or friction brake that reduces a coaster’s speed without bringing the train to a full stop.',
    definition:
      'A trim brake is a brake placed mid-course to take some speed off the train before a particular section, without stopping it the way a block brake does. Parks use them to hold the G-forces on a demanding element within limits, to cut wear on the track, to keep noise and vibration down, or to keep the ride within its envelope whatever the temperature and however loaded the train is. A trim costs airtime: a hill drawn for a certain speed gives less of it when the train arrives slower. How hard a trim bites varies with the season (cold weather brings more of it), with the weight in the train and with park policy, so the same layout can feel like two different rides.',
    relatedTermIds: ['airtime', 'block-brake', 'brake-run'],
  },
  {
    id: 'rollback',
    name: 'Rollback',
    shortDefinition:
      'When a launched coaster fails to reach the top of its circuit and rolls backward down the launch track to the launch position.',
    definition:
      'A rollback happens when a launched train does not reach enough speed to clear the highest point of the circuit and rolls back down to the launch position under gravity. On hydraulic launch coasters, the Intamin technology behind Kingda Ka, Top Thrill Dragster and Stealth at Thorpe Park, that means the launch did not deliver its full power. The train drifts back and magnetic brakes at the bottom of the launch track catch it. Nobody is hurt, since the catch brakes exist for exactly this, but the ride stops and the train is either launched again or unloaded. Rollbacks are a known trait of hydraulic launches and happen regularly at the parks that run them.',
    relatedTermIds: ['block-brake', 'downtime', 'launch-coaster'],
  },
  {
    id: 'animatronics',
    name: 'Animatronics',
    shortDefinition:
      'Electro-mechanical robotic figures that play characters and parts of a scene in dark rides and shows.',
    definition:
      "Animatronics are electro-mechanical figures used in attractions and live shows to play characters, creatures or parts of a scene. Disney coined the term Audio-Animatronics, a registered trademark, for its synchronised audio-and-figure system, shown publicly at the 1964 New York World's Fair. The range now runs from simple cam-driven figures that repeat one cycle to servo-driven robots with facial expression, full-body articulation and behaviour that reacts in real time. The Na'vi Shaman of Songs in Pandora at Disney's Animal Kingdom and the dinosaurs in Universal's Jurassic World ride are two examples of the servo-driven kind.",
    relatedTermIds: ['dark-ride', 'themed-land', 'trackless-ride'],
  },
  {
    id: 'ai-forecast',
    name: 'AI Forecast',
    shortDefinition:
      'Machine-learning predictions of crowd levels and wait times at theme parks, generated up to 365 days in advance.',
    definition:
      'An AI forecast uses machine learning models trained on historical attendance data, weather patterns, school holiday calendars, and real-time queue data to predict how busy a theme park or individual attraction will be on any given day or hour. park.fan generates AI forecasts for crowd levels and expected wait times up to 365 days in advance.\n\nThe predictions are recalculated with every training run, daily at 06:00 UTC. Near-term forecasts (1–7 days) are the most accurate, because recent weather, event announcements, and booking signals can be incorporated. Longer-range forecasts are less precise, but they still pick out the quiet and the busy periods well ahead of time.\n\nAI forecasts differ from simple historical averages by adapting to current conditions: a theme park that has just announced a new attraction, a public holiday falling on a different weekday than usual, or an unusually warm spring weekend will all move the prediction away from the historical baseline.',
    relatedTermIds: ['crowd-calendar', 'crowd-level', 'peak-day'],
    aliases: ['AI Forecasts', 'AI prediction', 'AI predictions'],
  },
  {
    id: 'ki',
    name: 'AI',
    shortDefinition:
      'Artificial Intelligence; on park.fan, the machine-learning models behind the crowd forecasts and wait time predictions.',
    definition:
      'AI (Artificial Intelligence) refers to the machine-learning algorithms that recognise patterns in large datasets and generate predictions. park.fan uses AI models trained on the wait times it has recorded, school holiday calendars, weather data, and event announcements to produce daily crowd and wait-time forecasts for every tracked park, up to 365 days ahead.',
    relatedTermIds: ['ai-forecast', 'crowd-calendar', 'crowd-forecast'],
    alternateNames: ['Artificial Intelligence'],
  },
  {
    id: 'realtime-wait-time',
    name: 'Live Wait Time',
    shortDefinition:
      'Wait time data pulled from a park’s own systems and refreshed every five minutes.',
    definition:
      'A live wait time is the current wait at a ride, pulled from the park’s own data systems, as opposed to a historical average. park.fan reads live wait times from public sources and refreshes them every five minutes, so you can see which attractions are running short queues and which are backed up.',
    relatedTermIds: ['crowd-forecast', 'posted-wait-time', 'wait-time'],
    aliases: ['Live Wait Times', 'live wait time', 'real-time wait time', 'real-time wait times'],
    alternateNames: ['Real-Time Wait Time', 'Real-Time Wait Times'],
  },
  {
    id: 'crowd-forecast',
    name: 'Crowd Forecast',
    shortDefinition: 'AI-based prediction of how busy a theme park will be on a given day.',
    definition:
      'A crowd forecast is a prediction of how crowded a theme park will be on a particular day or at a specific time. park.fan recalculates crowd forecasts daily using historical attendance figures, school holiday calendars, weather data, and special events. The results feed directly into the crowd calendar: green days mean short queues, red days peak crowds with long wait times.',
    relatedTermIds: ['ai-forecast', 'crowd-calendar', 'crowd-level', 'peak-day'],
    aliases: ['Crowd Forecasts'],
  },
  {
    id: 'opening-hours',
    name: 'Opening Hours',
    shortDefinition:
      'The official daily schedule showing when a theme park or attraction opens and closes.',
    definition:
      "Opening hours are the published daily schedule for a theme park or individual attraction: the time it starts admitting guests and the time it stops operating. Most major parks publish a rolling schedule weeks or months in advance, though hours can change at short notice due to special events, seasonal adjustments, or operational issues.\n\npark.fan shows opening hours for each park and, where available, estimated operating hours for individual attractions. Hours marked as 'Est.' (Estimated) have been derived from historical patterns rather than confirmed by the park directly. Check them with the park before planning a visit around a tight schedule.\n\nAt parks that open early, rope-drop visitors get shorter queues before the crowd builds; at parks that close late, the waits shorten again in the final hour of operation as casual visitors leave.",
    relatedTermIds: ['crowd-calendar', 'rope-drop', 'soft-opening'],
  },
  {
    id: 'wait-time-trend',
    name: 'Wait Time Trend',
    shortDefinition:
      'The direction a queue has moved over the last 30 minutes: rising, falling, or stable.',
    definition:
      'The wait time trend indicates whether a ride’s queue is getting longer, shorter, or holding steady compared to 30 minutes ago. park.fan displays this as an arrow: upward (queue growing), downward (queue shrinking), or horizontal (stable).\n\nThe trend is often more useful than the wait time itself. A ride at 45 minutes with a falling trend is a better bet than a ride at 40 minutes with a rapidly rising trend: by the time you arrive, the first queue may be at 30 minutes and the second at 55.\n\nThe trend is most useful in mid-morning and late afternoon, when crowds shift quickly as different groups of guests move through the park.',
    relatedTermIds: ['crowd-level', 'posted-wait-time', 'wait-time'],
  },
  {
    id: 'trackless-ride',
    name: 'Trackless Ride',
    shortDefinition:
      'A dark ride whose vehicles move without fixed rails, guided by technology embedded in the floor.',
    definition:
      "A trackless ride is a dark ride whose vehicles are not tied to a fixed rail but find their own way through the show building, guided by induction loops in the floor, Wi-Fi positioning or optical systems. Freeing the vehicle from a rail lets scenes be laid out more densely, lets a vehicle turn to face whichever way the scene needs, and lets several vehicles share the same space at once. Star Wars: Rise of the Resistance at Disneyland and Disney's Hollywood Studios runs trackless vehicles through a multi-room sequence; Ratatouille: The Adventure at Disneyland Paris was the early European one, in 2014, and Symbolica at the Efteling has been the park's headline attraction since 2017. Trackless has become the default for large new dark ride projects.",
    relatedTermIds: ['animatronics', 'dark-ride', 'themed-land'],
  },
  {
    id: 'g-force',
    name: 'G-Force',
    shortDefinition:
      'The unit of acceleration experienced by riders, measured as multiples of Earth’s gravitational acceleration (9.81 m/s²).',
    definition:
      'G-force (gravitational force equivalent) measures the acceleration a rider’s body experiences relative to Earth’s gravity. Positive G-forces (above 1G) press riders into their seats as the train pulls through a valley or tight curve (the same force that makes you feel heavy in a fast car). Negative G-forces (below 0G) lift riders from their seats; that is airtime. Lateral G-forces act sideways and push riders across their seat on turns and transitions.\n\nCoaster designers sequence these forces deliberately. The valley at the bottom of a big first drop can hold 4–5G for a moment; a brief −0.5G to −1G on an airtime hill is what makes riders float. Most coasters stay within 0–5G of sustained positive G-force, with brief spikes above that. Sustained high G beyond a few seconds can cause discomfort or greyout, so layouts follow the peaks with recovery sections.',
    relatedTermIds: ['airtime', 'greyout', 'hangtime', 'inversion', 'lateral-gs', 'smoothness'],
    aliases: ['G-Forces', 'G Force', 'G Forces'],
  },
  {
    id: 'greyout',
    name: 'Greyout',
    shortDefinition:
      'A temporary greying of vision caused by positive G-forces reducing blood flow to the brain.',
    definition:
      'A greyout (also grey-out) is a physiological state in which a rider experiencing strong sustained positive G-forces temporarily sees a grey or washed-out visual field. The mechanism: positive G-forces pull blood downward toward the extremities, reducing circulation to the eyes and brain. The visual field begins to close in from the periphery and turns grey; the rider stays conscious and in control, but sees much less.\n\nBeyond greyout, progressively stronger or longer G-exposure can lead to blackout (vision goes completely dark) or G-LOC (G-Force Induced Loss of Consciousness). Coaster layouts keep high-G peaks brief and follow the heaviest sections with recovery elements, so that greyout does not build up.',
    aliases: ['Greyouts', 'grey-out', 'gray-out', 'grayout'],
    alternateNames: ['positive G blackout', 'G-force greying'],
    relatedTermIds: ['airtime', 'g-force', 'hangtime', 'lateral-gs'],
  },
  {
    id: 'grey-zone',
    name: 'Grey Zone',
    shortDefinition:
      'A roller coaster element on the borderline of an inversion, counted as one or not depending on the counting method.',
    definition:
      'The grey zone (also gray zone) refers to roller coaster elements that sit at the boundary between a full inversion and a non-inverting element. Classic inversions such as vertical loops and corkscrews are unambiguous: the train rotates the rider completely upside down. Grey zone elements either just reach or fall just short of the 180° overhead threshold, with riders nearly upside down.\n\nTypical grey zone elements include stalls (sustained head-chopper holds without full rotation), heavily overbanked turns beyond 90°, and certain wave turn variations. Manufacturers like RMC and Intamin deliberately use these elements as an alternative to classic inversions. A coaster’s official inversion count can vary by several elements depending on the counting method: strict (full rotations only) or broad (any overhead position).',
    aliases: ['Grey Zones', 'gray zone', 'gray zones'],
    alternateNames: ['borderline inversion', 'near-inversion'],
    relatedTermIds: ['inversion', 'overbank', 'roller-coaster-element', 'stall'],
  },
  {
    id: 'lateral-gs',
    name: 'Lateral Gs',
    shortDefinition:
      'Sideways forces pushing riders across their seat during turns, transitions, and helix sections.',
    definition:
      'Lateral Gs (lateral G-forces) are the sideways accelerations riders feel when a coaster changes direction in the horizontal plane: on banked turns, unbanked transitions, helices and direction changes. Well-designed laterals are smooth and controlled. Poorly engineered or rough laterals throw riders sideways against the restraint or seat back, which can be uncomfortable or even bruising.\n\nThere are intended laterals, such as those in the sweeping low turns of a classic wooden coaster or the exit of a well-banked steel turn, and unintended ones produced by track deterioration or poor engineering. Wooden coasters in particular move sideways: the track flexes, and unbanked turns push the train from side to side. Balder at Liseberg has smooth lateral G sequences in its helix sections.',
    relatedTermIds: ['airtime', 'g-force', 'helix', 'wooden-coaster'],
    aliases: ['Lateral G-Forces', 'Lateral G'],
    alternateNames: ['Laterals'],
  },
  {
    id: 'ejector-airtime',
    name: 'Ejector Airtime',
    shortDefinition:
      'Strong negative G-force that throws riders up out of the seat, so that only the lap bar holds them in.',
    definition:
      'Ejector airtime is the strongest form of negative G-force: the coaster’s path drops away from free fall so abruptly that riders are thrown up out of their seats and held in only by the lap bar. The name describes it: the seat seems to be trying to eject you. Floater airtime is gentle and long; ejector is sharp and sudden, and can verge on violent if the transition into it is abrupt.\n\nEjector airtime turns up most on RMC hybrid coasters, certain Intamin hypers, and modern wooden coasters with steep, parabolic hills. It lasts an instant before the track pulls the train back down. Untamed at Walibi Holland, Wildfire at Kolmården, and Steel Vengeance at Cedar Point all have strong ejector sequences.',
    relatedTermIds: ['airtime', 'airtime-hill', 'floater-airtime', 'g-force', 'rmc'],
    alternateNames: ['Ejector'],
  },
  {
    id: 'floater-airtime',
    name: 'Floater Airtime',
    shortDefinition:
      'Mild, sustained negative G-force that lets riders float for a moment as the train crests a hill.',
    definition:
      'Floater airtime is the gentle end of the negative G-force range: riders rise slightly from their seats and float for an extended moment as the train crests a hill on a gradual parabolic arc. The force is mild, typically around −0.1G to −0.3G, which suits riders who find ejector airtime too strong.\n\nFloater airtime is most typical of B&M hyper and giga coasters, whose large, gently rounded hills are drawn to produce long float phases. Shambhala at PortAventura, Silver Star at Europa-Park, and Goliath at Walibi Holland are European examples with long floater sequences. Floater is gentler than ejector and easier to take lap after lap. A single airtime hill can also go from floater at the crest to ejector on the descent.',
    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'ejector-airtime', 'g-force'],
    alternateNames: ['Floater'],
  },
  {
    id: 'hangtime',
    name: 'Hangtime',
    shortDefinition:
      'Hanging in the restraints while upside down, when an inversion is taken slowly enough for negative G to act.',
    definition:
      'Hangtime is negative G-force while a rider is inverted: the coaster moves through the top of an inversion slowly enough that riders hang in the restraints. In a fast vertical loop riders are upside down for a brief flash; hangtime happens when the train lingers near the apex of an inversion. The rider’s whole weight shifts into the over-the-shoulder restraints or the lap bar.\n\nHangtime is strongest on elements where the train slows right down near the apex. The pretzel loop on flying coasters is the classic example: the train is slow enough at the apex for sustained negative G while riders are fully inverted. The heartline roll on some modern coasters can also produce hangtime, as can the tops of slow Norwegian loops.',
    relatedTermIds: ['airtime', 'g-force', 'heartline-roll', 'inversion', 'pretzel-loop'],
    aliases: ['Hang Time'],
  },
  {
    id: 'roller-coaster-element',
    name: 'Roller Coaster Element',
    shortDefinition:
      'A named section or feature of a roller coaster track, such as a loop, airtime hill, or inversion.',
    definition:
      'A roller coaster element is any distinct, named feature in a coaster’s layout: inversions such as vertical loops and corkscrews, and non-inverting elements such as airtime hills, helices and overbanks. Each element is drawn to put a particular force on the rider: negative G (airtime), lateral G, or the rotation of going upside down. Manufacturers and enthusiasts use the names to describe and compare layouts.\n\npark.fan’s glossary covers dozens of individual coaster elements, from the first drop and lifthill at the start of most rides to the Stengel dive, Norwegian loop and heartline roll on modern steel coasters.',
    relatedTermIds: ['airtime', 'first-drop', 'helix', 'inversion', 'vertical-loop'],
    aliases: ['Roller Coaster Elements'],
  },
  // ── Ride Experience ────────────────────────────────────────────────────────
  {
    id: 'front-row',
    name: 'Front Row',
    shortDefinition:
      'The first row of seats in a ride vehicle, with the clearest view and, on some coasters, the strongest airtime.',
    definition:
      'The front row is the first row of seats in a coaster train or ride vehicle. Nobody sits in front of it, so the view of the layout ahead is unobstructed. On hyper and giga coasters the front row often gets the strongest airtime on the first drop and the hills after it. Riders there also see each drop coming before they go over it, which riders in the middle and back rows do not.\n\nOn many coasters the front row is in such demand that parks sell queue bypasses or express lane reservations for it. At some parks guests wait in a separate front-row queue, which can add 10–30 minutes to the wait.',
    relatedTermIds: ['airtime', 'back-row', 'first-drop', 'middle-row'],
    alternateNames: ['Front Seat', 'First Row'],
  },
  {
    id: 'back-row',
    name: 'Back Row',
    shortDefinition:
      'The last row of seats in a ride vehicle, where the airtime on hill-heavy layouts is usually strongest.',
    definition:
      'The back row is the final row of seats in a coaster train or ride vehicle. On hill-heavy coasters (hypers, gigas and other airtime-focused designs) it gets the strongest ejector airtime. Over each crest the back row gets sustained negative G, and riders are thrown up out of their seats, held in only by the restraints. Across a run of hills, back-row airtime is usually stronger and longer than in the front or middle rows.\n\nOn Goliath (Walibi Holland) or Shambhala (PortAventura), the back row is the seat to ask for. The downside is that back rows can ride roughly on older coasters. On a steep drop, riders in the back see the crest disappear beneath them instead of watching the drop ahead.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'front-row', 'middle-row'],
    alternateNames: ['Back Seat', 'Last Row'],
  },
  {
    id: 'middle-row',
    name: 'Middle Row',
    shortDefinition:
      'The center rows of a ride vehicle, between the view of the front row and the airtime of the back row.',
    definition:
      'The middle rows are the central seats in a multi-row coaster train or ride vehicle, between the front row with its view and the back row with its ejector airtime. Riders there see enough of the layout ahead and feel clear negative G, but get neither extreme. For families or first-time riders nervous about the forces, a middle row is the gentler choice.\n\nMiddle rows get less attention among enthusiasts for that reason. On coasters with long lateral forces or heavy turns, though, the middle rows can feel the strongest compression, because they sit at the train’s center of mass. On most coaster types they are a reasonable choice when front or back row reservations are unavailable.',
    relatedTermIds: ['airtime', 'back-row', 'front-row', 'ride-cart'],
    alternateNames: ['Middle Seat', 'Center Row'],
  },
  {
    id: 'ride-cart',
    name: 'Ride Cart',
    shortDefinition:
      'Individual vehicle or car in a roller coaster train that holds a row (or rows) of riders.',
    definition:
      'A ride cart (also called a car, train car, or simply train) is the individual carriage or vehicle segment that holds passengers on a roller coaster or other ride. A typical coaster train consists of multiple carts linked together, with each cart holding one or more rows of riders sitting back-to-back. Manufacturers size the cart, place the seats and shape the restraints for the forces the layout puts on riders.\n\nCart design varies with the coaster type: hyper coasters use streamlined, relatively low-profile carts to minimise wind resistance and noise; inverted coasters dangle riders below the track; wing coasters position riders on either side of a central rail with nothing beneath them; and flying coasters mount riders face-down on the train. B&M, Intamin, and Mack each have their own cart designs, so if you know which manufacturer built a coaster, you can predict a fair amount about seat comfort, restraint tightness and the kind of G-forces to expect.',
    relatedTermIds: ['back-row', 'front-row', 'lap-bar', 'shoulder-harness'],
    alternateNames: ['Train Car', 'Coaster Car', 'Seat Car'],
  },
  {
    id: 'lap-bar',
    name: 'Lap Bar',
    shortDefinition:
      'A horizontal safety restraint across the rider’s lap that allows a greater range of free movement than over-the-shoulder harnesses.',
    definition:
      'A lap bar is a horizontal safety restraint that holds riders across the upper thighs or lap. An over-the-shoulder harness encloses the torso; a lap bar leaves the upper body free to move. Lap bars are the standard restraint on most modern hyper and giga coasters, and on many traditional steel and wooden coasters. During airtime the rider rises out of the seat until the bar stops them, and it feels as though only the bar keeps them in the car.\n\nOn a high-airtime coaster a lap bar gets in the way least: the gap between rider and seat is noticeable at once. Lap bars have to be positioned properly, and they can be uncomfortable for riders with longer torsos or certain body shapes if the bar does not fit well. Manufacturers have refined the design for decades, and modern lap bars are much more comfortable than earlier ones. On coasters with strong lateral forces, the bar may slide back and forth slightly during sharp turns.',
    relatedTermIds: ['airtime', 'restraint-freedom', 'ride-cart', 'shoulder-harness'],
    alternateNames: ['Lap Restraint', 'Lap Harness'],
  },
  {
    id: 'shoulder-harness',
    name: 'Shoulder Harness',
    shortDefinition:
      'An over-the-shoulder safety restraint that fully encloses the torso, limiting movement during the ride.',
    definition:
      'A shoulder harness (also called an over-the-shoulder restraint or OTS harness) is a clamping safety device that comes down over both shoulders and across the lap, fully encasing the torso. Shoulder harnesses were the standard on coasters from the 1980s through early 2000s and remain common on inverted coasters, some suspended coasters, and family rides where maximum restraint is prioritized. Modern harnesses ratchet down to different settings for different rider builds.\n\nOn a high-airtime coaster a shoulder harness rides differently from a lap bar: riders cannot rise as far out of the seat, because the harness holds them down. Manufacturers choose between the two, trading more airtime against more security and, for some riders, more comfort. A harness can feel safer to nervous riders and on coasters with strong lateral forces.',
    relatedTermIds: ['airtime', 'lap-bar', 'restraint-freedom', 'ride-cart'],
    alternateNames: ['OTS Harness', 'Over-the-shoulder Restraint'],
  },
  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    id: 'souvenir',
    name: 'Souvenir',
    shortDefinition: 'A memento or small item purchased at a theme park to commemorate a visit.',
    definition:
      'A souvenir is a physical memento (merchandise, clothing or a collectible) bought to remember a park visit by. The usual ones are t-shirts with the park logo, caps, pins, postcards, soft toys and themed collectibles. They do two jobs at once: a practical one, since a shirt is a shirt, and an emotional one, in anchoring the memory of a particular day.\n\nParks make a substantial part of their revenue on merchandise, which typically carries a two- to threefold markup over retail prices. Photo spots are designed into themed lands to encourage the impulse purchase, limited and seasonal items create urgency, and park-exclusive items carry higher prices because they cannot be had anywhere else. For a lot of guests, collecting from several parks is part of the trip: gathering pins, trading them, filling a shelf.',
    relatedTermIds: ['gift-shop', 'merchandise', 'park-exclusive'],
    alternateNames: ['Memento', 'Keepsake'],
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    shortDefinition:
      'Official products and goods sold by a theme park, including apparel, collectibles, and themed items.',
    definition:
      'Merchandise is all the goods a theme park sells: branded apparel (t-shirts, hoodies, hats), collectibles (pins, figurines, plushies), food and drink merchandise, and themed items tied to specific attractions or franchises. Large parks sell it through dozens of shops, mobile carts and small stores tied to one location. Merchandise often makes up 15–25% of total guest spending, second only to food and beverages.\n\nParks sell limited-edition seasonal items, collaborations with franchises, park-exclusive designs that are sold nowhere else, and special releases for new attraction openings or anniversaries. They track which items sell fastest, which photograph best for social media and which repeat visitors buy. Some fans collect merchandise from every visit, and rare or sold-out items fetch high prices on resale markets.',
    relatedTermIds: ['gift-shop', 'park-exclusive', 'souvenir'],
    alternateNames: ['Merch'],
  },
  {
    id: 'gift-shop',
    name: 'Gift Shop',
    shortDefinition:
      'A retail store within a theme park selling souvenirs, merchandise, and themed products.',
    definition:
      'A gift shop is a retail space in a theme park that sells souvenirs, merchandise, and themed products, either in a central area (like a main plaza) or inside a themed land or attraction. Major parks run dozens of them, from small carts to department-store-sized buildings. They sit where guests pass in numbers and have time on their hands: at the exits of major attractions, in hotel corridors, and at the park entrance and exit.\n\nInside, impulse items sit near the door, the decor matches the surrounding land, and the high-margin items are placed where they are seen first. Many attractions end in an "obligatory" gift shop that exiting guests have to walk through, which raises impulse purchases. Parks lean more and more on licensed brands and franchises to charge higher prices, and collector shops in the premium resort hotels sell exclusive, limited-edition merchandise at higher prices still.',
    relatedTermIds: ['merchandise', 'park-exclusive', 'souvenir'],
    alternateNames: ['Souvenir Shop', 'Retail Shop'],
  },
  {
    id: 'park-exclusive',
    name: 'Park Exclusive',
    shortDefinition: 'A product sold only at a specific theme park or within its park system.',
    definition:
      'Park exclusive merchandise is designed for and sold only at a specific theme park or within a park system (such as all Disney parks, or all Universal parks); no outside retailer carries it. The exclusivity creates a sense of scarcity, prompts impulse purchases from guests who believe they cannot get the item elsewhere, and supports higher prices (often a 2–3× markup over typical retail). Common park exclusives include limited-edition apparel, collectible pins, themed items tied to seasonal events or new attraction openings, and novelty food items.\n\nGuests who have travelled a long way and paid a lot for admission are more inclined to buy something they cannot get at home. On online resale platforms, park exclusives that are scarce and in demand hold or gain value, which encourages collecting. Packaging and tags make the point, with "Park Exclusive" or "Limited Release" printed prominently on the items. Theme park forums and social media discuss which exclusives are the rarest and most sought after.',
    relatedTermIds: ['gift-shop', 'merchandise', 'souvenir'],
    aliases: ['Park Exclusive Item'],
    alternateNames: ['Exclusive'],
  },
  {
    id: 'flying-coaster',
    name: 'Flying Coaster',
    shortDefinition: 'Roller coaster where riders lie face-down in a prone position.',
    definition:
      'A flying coaster suspends riders horizontally and face-down, in the position of someone flying. The train tilts from the seated position at the station to horizontal before the ride begins. Examples are the B&M Flyers Manta (SeaWorld Orlando) and Tatsu (Six Flags Magic Mountain).',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster'],
    alternateNames: ['flyer', 'Superman ride', 'prone coaster', 'flying ride'],
  },
  {
    id: 'mine-train',
    name: 'Mine Train',
    shortDefinition: 'Family steel coaster themed as a mine cart journey.',
    definition:
      'A mine train coaster is a family steel roller coaster themed as a runaway mining cart. Speeds are moderate, the drops small and the turns tight, through themed tunnels and rock formations, so a wide age range can ride. Examples include Big Thunder Mountain Railroad (Disney parks) and Gold Rush (Plopsaland).',
    relatedTermIds: ['powered-coaster', 'steel-coaster', 'themed-land'],
    aliases: ['mine coaster', 'mine car coaster', 'mine ride'],
    alternateNames: ['family coaster'],
  },
  {
    id: 'terrain-coaster',
    name: 'Terrain Coaster',
    shortDefinition: 'Coaster built to follow the natural landscape.',
    definition:
      'A terrain coaster is built along the natural topography (hills, valleys and ravines) instead of relying entirely on artificial structure. The track stays close to the ground, and the speed feels higher for it. Examples include Beast (Kings Island) and Ravine Flyer II (Waldameer).',
    relatedTermIds: ['airtime', 'alpine-coaster', 'steel-coaster', 'wooden-coaster'],
    alternateNames: ['terrain ride', 'landscape coaster', 'ground-hugging coaster'],
  },
  {
    id: 'floorless-coaster',
    name: 'Floorless Coaster',
    shortDefinition: "Steel coaster where the floor retracts so riders' feet dangle freely.",
    definition:
      'On a floorless coaster, the car floor drops away after riders are secured, leaving legs dangling above the track. Unlike inverted coasters, the track runs beneath the car rather than above. B&M pioneered the type with Medusa (Six Flags Great Adventure, 1999). Examples in Europe include Goliath (Walibi Holland).',
    relatedTermIds: [
      'b-and-m',
      'dive-coaster',
      'inverted-coaster',
      'stand-up-coaster',
      'steel-coaster',
    ],
    aliases: ['floorless'],
    alternateNames: ['open floor coaster'],
  },
  {
    id: 'arrow-dynamics',
    name: 'Arrow Dynamics',
    shortDefinition: 'American coaster manufacturer responsible for the first modern loop.',
    definition:
      'Arrow Dynamics (founded 1945) was an American roller coaster manufacturer that introduced the modern tubular steel track and the first modern vertical loop on Corkscrew (Knott’s Berry Farm, 1975). Arrow is best known for its corkscrew and suspended looping coasters. The company declared bankruptcy in 2001 and its assets were acquired by S&S.',
    relatedTermIds: ['corkscrew', 'rattle', 'steel-coaster', 'suspended-coaster', 'vertical-loop'],
    aliases: ['Arrow', 'Arrow Development', 'S&S Arrow'],
  },
  {
    id: 'gci',
    name: 'Great Coasters International (GCI)',
    shortDefinition: 'American wooden coaster manufacturer that builds fast, twisting layouts.',
    definition:
      'Great Coasters International (GCI) is an American manufacturer specialising in wooden roller coasters. Founded in 1994, GCI builds its own Millennium Flyer trains, and its layouts have rapid direction changes and sustained airtime. Installations include Wodan (Europa-Park), Thunderhead (Dollywood), and Troy (Toverland).',
    relatedTermIds: ['airtime', 'rmc', 'terrain-coaster', 'wooden-coaster'],
    aliases: ['Great Coasters International', 'GCI coaster'],
    alternateNames: ['Millennium Flyer'],
  },
  {
    id: 'premier-rides',
    name: 'Premier Rides',
    shortDefinition:
      'American manufacturer specialising in LSM/LIM launch coasters. In Europe it is best known for the Sky Scream family of inverted launch coasters.',
    definition:
      'Premier Rides (founded 1995, Baltimore, Maryland) is an American coaster manufacturer specialising in linear synchronous motor (LSM) and linear induction motor (LIM) launch systems. Its launch systems were among the earliest in commercial use and gave smooth high-speed launches without a hydraulic catapult. The Sky Rocket II, a compact launch coaster with a single loop, has been installed at many mid-sized parks worldwide.\n\nIn Europe, Premier Rides is best known for Sky Scream at Holiday Park (Haßloch, Germany), an inverted family launch coaster. Hagrid’s Magical Creatures Motorbike Adventure at Universal Orlando also uses Premier’s LSM launch system, which puts the technology on a ride that is not a conventional coaster at all.',
    aliases: ['Premier'],
    relatedTermIds: ['gerstlauer', 'intamin', 'launch-coaster'],
  },
  {
    id: 'maurer-rides',
    name: 'Maurer Rides',
    shortDefinition:
      'German manufacturer from Munich known for spinning coasters with trick track, the X-Car custom platform, and the Sky Loop vertical loop model.',
    definition:
      'Maurer Rides (Maurer AG, metal fabrication since 1876, amusement rides from 1993) is a Munich-based German manufacturer. The company developed the SC spinning coaster series with its trick track (a section where the car tilts sideways mid-ride) and the X-Car platform, a single articulated car that can run compact custom layouts with launches and inversions.\n\nThe Sky Loop is a standalone vertical loop on a small footprint, installed at parks across Europe, while the Spike coaster uses individual pursuit cars on a shared track. European installations include Winja’s Fear and Winja’s Force at Phantasialand (Germany), indoor spinning coasters with trick track, and X-Cars at various European parks.',
    aliases: ['Maurer', 'Maurer Söhne', 'Maurer AG'],
    relatedTermIds: ['gerstlauer', 'launch-coaster', 'spinning-coaster', 'xtreme-spinning-coaster'],
  },
  {
    id: 'zamperla',
    name: 'Zamperla',
    shortDefinition:
      'Italian manufacturer of family coasters and flat rides, with more than 250 coasters installed worldwide.',
    definition:
      'Zamperla (founded 1966, Altavilla Vicentina, Italy) is one of the world’s most prolific amusement ride manufacturers. Intamin, B&M, and Mack build mostly large thrill installations; Zamperla builds in volume for smaller sites. Its Family Coaster, Mini Coaster, Twister, and Disk’O Coaster models stand in smaller parks, on resort midways and at seasonal attractions worldwide.\n\nCompact footprints and modest height requirements make Zamperla rides especially common in European city parks, holiday resorts, and indoor facilities. The company also built the larger Thunderbolt at Coney Island (New York). Walt Disney Parks & Resorts has used Zamperla attractions across multiple properties.',
    aliases: ['Zamperla rides', 'Antonio Zamperla'],
    relatedTermIds: ['credit', 'gerstlauer', 'mine-train'],
  },
  {
    id: 'huss-rides',
    name: 'Huss Rides',
    shortDefinition:
      'German flat ride manufacturer founded in 1961, known for the Top Spin, Break Dance, Enterprise, Ranger, and Condor.',
    definition:
      'Huss Rides GmbH is a German amusement ride manufacturer founded in 1961 by Paul Huss and based in Bremen. The company produced many of the common flat ride models of the late 20th century, which run in theme parks and at travelling fairs worldwide.\n\nHuss models include the Top Spin, Break Dance (rotating cars on a spinning disc), Enterprise (centrifugal gondola wheel), Ranger (swinging pendulum ship), Condor (rotating chair tower), and Troika. Other manufacturers copied many of these designs. Huss rides are closely tied to the 1980s and 1990s, the peak years of flat rides in European parks.',
    relatedTermIds: ['drop-tower', 'flat-ride', 'pendulum-ride', 'top-spin'],
    aliases: ['Huss', 'Huss Park Attractions'],
  },
  {
    id: 's-and-s-worldwide',
    name: 'S&S Worldwide',
    shortDefinition:
      'American manufacturer of pneumatic towers, the compact El Loco coaster, and Free Fly 4D coasters.',
    definition:
      'S&S Worldwide (founded 1994, Logan, Utah; acquired by Sansei Technologies in 2012) originally developed pneumatic drop tower systems (the Space Shot and Turbo Drop) before expanding into coasters. Its El Loco model is a compact coaster with a beyond-vertical first drop and an inversion on a very small footprint. The Free Fly is a 4D-style coaster where the seat pivots freely to flip riders at set points.\n\nS&S also acquired the assets of Arrow Dynamics after its 2001 bankruptcy. S&S installations are less common in Europe than in North America.',
    aliases: ['S&S', 'S&S-Sansei', 'S&S Power', 'S&S Sansei'],
    relatedTermIds: ['arrow-dynamics', 'gerstlauer', 'launch-coaster'],
  },
  {
    id: 'zierer',
    name: 'Zierer',
    shortDefinition:
      'German manufacturer from Bavaria specialising in family coasters and classic park rides, with over 190 coasters built worldwide.',
    definition:
      'Zierer (founded 1930, Deggendorf, Bavaria) is a German manufacturer specialising in family-scale roller coasters and classic park rides. Its Force Coaster range runs from compact junior models to the faster Force Custom installations. Zierer coasters have tubular steel track, ride smoothly and have moderate height requirements, so parks use them for a wide range of ages.\n\nWith over 190 roller coasters delivered worldwide, Zierer is one of Europe’s most prolific coaster builders by unit count. European installations include Feuerdrache at Legoland Deutschland, and family coasters at parks across Germany, the Netherlands, and Scandinavia.',
    aliases: ['Zierer GmbH', 'Zierer rides'],
    relatedTermIds: ['credit', 'gerstlauer', 'mack-rides'],
  },
  {
    id: 'stall',
    name: 'Stall',
    shortDefinition: 'Inversion where the train briefly hangs upside-down with near-zero speed.',
    definition:
      'A stall (also called a zero-G stall) is an element where the coaster train travels into an inversion at the apex and momentarily slows almost to a stop, leaving riders hanging upside-down. Rocky Mountain Construction (RMC) introduced it, and riders get a long moment of hangtime. Zadra (Energylandia) and Steel Vengeance (Cedar Point) both have one.',
    relatedTermIds: ['hangtime', 'inversion', 'rmc', 'zero-g-roll'],
    aliases: ['zero-g stall'],
    alternateNames: ['RMC stall', 'hangtime element'],
  },
  {
    id: 'wave-turn',
    name: 'Wave Turn',
    shortDefinition: 'Banked change of direction with a moment of strong airtime mid-turn.',
    definition:
      'A wave turn is a high-speed banked turn that passes through a brief moment of negative or lateral G-force, so riders get airtime mid-corner. It is common on Rocky Mountain Construction coasters, and the airtime can be ejector or floater. It appears on rides like Wildfire (Kolmården) and Untamed (Walibi Holland).',
    relatedTermIds: ['airtime', 'ejector-airtime', 'lateral-gs', 'overbank', 'rmc', 's-hill'],
    aliases: ['wave turn element'],
    alternateNames: ['banked airtime turn'],
  },
  {
    id: 'shoulder-season',
    name: 'Shoulder Season',
    shortDefinition: 'Period between peak and off-season with moderate crowds and prices.',
    definition:
      'The shoulder season refers to the transitional periods between a theme park’s busiest (peak) and quietest (off-season) periods. In European parks that is typically spring (March–May) and early autumn (September–October). Crowds are moderate, prices may be lower, and most attractions are open.',
    relatedTermIds: ['crowd-forecast', 'crowd-level', 'peak-day', 'school-holiday'],
    alternateNames: ['off-peak', 'mid-season', 'quiet period', 'low season'],
  },
  {
    id: 'school-holiday',
    name: 'School Holiday',
    shortDefinition: 'School vacation period that causes significant crowd spikes at theme parks.',
    definition:
      'School holidays (summer break, Christmas/New Year, Easter, and half-term) are the main cause of crowd spikes at theme parks. Families with children are the largest visitor group, and their visits are concentrated in these windows. Parks often extend opening hours, add entertainment, and increase prices during these periods. Staying away in the school holidays is the most effective way to avoid crowds.',
    relatedTermIds: ['crowd-forecast', 'crowd-level', 'peak-day', 'shoulder-season'],
    aliases: ['summer holidays', 'Easter holidays', 'Christmas holidays'],
    alternateNames: ['school break', 'school vacation', 'half-term'],
  },
  {
    id: 'photo-pass',
    name: 'Photo Pass',
    shortDefinition: 'Service providing unlimited digital ride and park photos.',
    definition:
      'A photo pass (or memory maker) is an optional add-on that grants digital access to all professionally taken photos and videos from a park visit: ride photos, character meet-and-greet shots, and roaming photographer images. Sold as a flat-fee package, it can be cost-effective for families who would otherwise purchase individual ride photos. Disney’s Memory Maker and Universal’s Photo Pass are two examples.',
    relatedTermIds: ['character-meet-and-greet', 'ride-photo', 'season-pass'],
    alternateNames: [
      'Memory Maker',
      'photo package',
      'photo bundle',
      'park photos',
      'all-day photos',
    ],
  },
  {
    id: 'accessibility-pass',
    name: 'Accessibility Pass',
    shortDefinition:
      'Pass allowing guests with disabilities to access attractions with reduced wait.',
    definition:
      'An accessibility pass (variously called DAS, for Disability Access Service, an accessibility card, or an attraction access pass) is issued to guests who are unable to wait in a standard queue due to a disability. It typically allows the guest and a set number of companions to return at a specified time rather than physically waiting. Eligibility and processes vary by park and country.',
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    alternateNames: [
      'DAS',
      'Disability Access Service',
      'attraction access pass',
      'accessibility card',
      'disabled pass',
      'PRM pass',
      'KMG pass',
    ],
  },
  {
    id: 'motion-simulator',
    name: 'Motion Simulator',
    shortDefinition: 'Ride that combines a moving platform with a film screen.',
    definition:
      'A motion simulator (or simulator ride) combines a hydraulically or electrically actuated moving platform with a large screen film or projection, and moves the platform in time with the action on screen, without a traditional track. Capacity is typically high, and the ride can be refreshed by changing the film. Examples include Star Tours (Disney), Mystic Manor (HKDL), and various 4D cinema attractions.',
    relatedTermIds: ['animatronics', 'dark-ride', 'pre-show', 'trackless-ride'],
    alternateNames: ['simulator ride', '4D ride', 'flight simulator', 'motion base', 'sim ride'],
  },
  {
    id: 'character-meet-and-greet',
    name: 'Character Meet & Greet',
    shortDefinition: 'Scheduled opportunity to meet a costumed park character in person.',
    definition:
      'A character meet and greet is a designated area or scheduled event where guests can meet, pose for photos, and sometimes receive autographs from costumed park characters. Common at Disney and Universal parks, popular characters may have dedicated meet-and-greet locations with their own queues. They are especially popular with children and families.',
    relatedTermIds: ['character-dining', 'photo-pass', 'themed-land'],
    alternateNames: [
      'character encounter',
      'character appearance',
      'meet and greet',
      'character experience',
    ],
  },
  {
    id: 'pre-show',
    name: 'Pre-Show',
    shortDefinition: 'Entertainment area that prepares guests for an attraction before boarding.',
    definition:
      'A pre-show is a staging element in a themed attraction where guests gather in a room or queue area before the main ride or experience to receive story context, safety instructions, or entertainment that sets the scene. A pre-show does two jobs: it tells the story, and it lets staff move guests on to the ride in groups. Examples are the stretching room in the Haunted Mansion and the safety video on Guardians of the Galaxy – Mission: BREAKOUT!.',
    relatedTermIds: ['animatronics', 'dark-ride', 'motion-simulator', 'themed-land'],
    aliases: ['pre show'],
    alternateNames: ['loading area entertainment', 'staging area', 'queue entertainment'],
  },
  {
    id: 'flat-ride',
    name: 'Flat Ride',
    shortDefinition:
      'A ground-level ride that spins, swings, or rotates guests without a traditional coaster track.',
    definition:
      'A flat ride is a category of amusement ride that operates on a roughly horizontal plane rather than a circuit of elevated track. The term covers a wide variety of types: spinning attractions (carousels, teacups, rotor rides), Frisbees (pendulum rides), Top Spins, and swing rides (Wave Swingers), drop and launch towers, and circular spinning platforms.\n\nFlat rides usually take up far less room than roller coasters and fit into smaller park areas. Many have high hourly throughput and low or no height requirements, and in many parks they make up most of the rides for families and children.',
    relatedTermIds: ['drop-tower', 'height-requirement', 'ride-capacity', 'swing-ride'],
    aliases: ['flat rides'],
    alternateNames: ['carnival ride', 'midway ride'],
  },
  {
    id: 'water-ride',
    name: 'Water Ride',
    shortDefinition:
      'An attraction where guests travel in boats or vehicles through water, getting wet in the process.',
    definition:
      'A water ride is any attraction built around water: either the vehicle travels through a water channel or water is used as a deliberate effect. The three most common types are log flumes, where boats travel down a trough with a final plunge drop; river rapids rides, where circular rafts spin through turbulent artificial white water; and splash battles, where guests use water cannons to spray each other and bystanders. Water rides typically have low height requirements, and in summer heat their queues can get very long. Capacity varies significantly: river rapids rides tend to have high hourly throughput while log flumes can be somewhat lower.',
    relatedTermIds: ['height-requirement', 'log-flume', 'ride-capacity', 'river-rapids'],
    aliases: ['water rides'],
    alternateNames: ['water attraction', 'aquatic ride', 'wet ride'],
  },
  {
    id: 'live-show',
    name: 'Live Show',
    shortDefinition:
      'A scheduled performance featuring live actors, music, stunts, or characters in a dedicated venue.',
    definition:
      'A live show is a scheduled performance by human cast members in a dedicated venue such as an open-air amphitheatre, an indoor theatre, or a street performance space. Theme park live shows include Broadway-style stage productions, stunt shows, character parades, 4D cinema with live elements, and laser or fireworks shows. Live shows run on fixed schedules with limited capacity per performance, so they have to be fitted into a touring plan at set times. A show at midday, when ride queues are at their longest, is also a sit-down break.',
    relatedTermIds: ['pre-show', 'ride-capacity', 'themed-land'],
    alternateNames: ['show', 'live entertainment', 'stage show', 'performance', 'stunt show'],
  },
  {
    id: 'quick-service',
    name: 'Quick Service',
    shortDefinition: 'Counter-service restaurant with no table waiting staff.',
    definition:
      'Quick service (also called counter service or fast casual) refers to park dining where guests order at a counter and carry their own food to a table. It is the most common type of in-park dining, and the quickest. Disney popularised the term "quick service" to distinguish it from "table service" in their dining reservation system.',
    relatedTermIds: ['character-dining', 'table-service'],
    alternateNames: ['counter service', 'fast food', 'fast casual', 'self-service restaurant'],
  },
  {
    id: 'table-service',
    name: 'Table Service',
    shortDefinition: 'Sit-down restaurant with waitstaff where reservations are often required.',
    definition:
      'Table service restaurants inside theme parks are sit-down restaurants with waitstaff. Reservations (often bookable 60–180 days in advance at Disney parks) are strongly recommended, as popular venues fill quickly, especially during peak season. Table service costs considerably more than quick service; the food is usually better, and the dining room is away from the park crowds.',
    relatedTermIds: ['character-dining', 'peak-day', 'quick-service'],
    alternateNames: [
      'sit-down dining',
      'full-service restaurant',
      'waiter service',
      'reservation dining',
    ],
  },
  {
    id: 'character-dining',
    name: 'Character Dining',
    shortDefinition: 'Restaurant where costumed park characters visit tables during the meal.',
    definition:
      'Character dining is a table-service (or occasionally buffet) meal during which costumed characters visit each table to talk to guests, pose for photos, and sign autographs. Every table gets its visit without a separate meet-and-greet queue, and families book it for that reason. Examples include Chef Mickey’s (Disney World) and the Princess Storybook Dining at Auberge de Cendrillon (Disneyland Paris).',
    relatedTermIds: ['character-meet-and-greet', 'quick-service', 'table-service'],
    aliases: ['character breakfast', 'character lunch', 'character dinner'],
    alternateNames: ['character meal', 'dining with characters'],
  },
  {
    id: 'drop-tower',
    name: 'Drop Tower',
    shortDefinition:
      'A tower attraction that lifts guests to height and releases them in a rapid free-fall descent.',
    definition:
      'A drop tower (also called a free-fall tower or drop ride) is an attraction in which riders are lifted in a gondola or individual seats arranged around a central tower structure, then released to fall towards the ground. The drop may be near-true free-fall (approaching weightlessness), progressively braked, or in some models an ejector-style launch element fires riders upward first before the drop. A deceleration phase near the bottom brings the gondola to a smooth stop. Variants include rotating drop towers, multi-directional models, and hybrids that combine a drop with a launch sequence. A drop tower needs very little ground, and parks worldwide run them. Examples include the Tower of Terror installations at Disney parks and many models from manufacturers such as Intamin, Mondial, and S&S Worldwide.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'intamin', 's-and-s-worldwide'],
    aliases: ['free-fall', 'drop towers', 'launch tower', 'launch towers'],
    alternateNames: ['free fall tower', 'drop ride', 'free fall ride', 'launch ride'],
  },
  {
    id: 'log-flume',
    name: 'Log Flume',
    shortDefinition:
      'A water channel ride where boat-shaped vehicles travel through a trough and finish with a steep drop into a splash.',
    definition:
      'A log flume (also called a flume ride or splash ride) is a water ride in which guests sit in boat-shaped vehicles (traditionally log-shaped fibreglass hulls) and travel along a water-filled channel, over flat sections and small rises, before a final steep drop into a splash. The impact at the bottom almost guarantees wet riders; how wet depends on the drop height and trough design. Log flumes were introduced in the 1960s and spread to parks worldwide as a family ride with moderate throughput. Many older ones have since been rethemed. European examples include Poseidon at Europa-Park and various Wildwasserbahn installations across German-speaking parks.',
    relatedTermIds: [
      'height-requirement',
      'river-rapids',
      'splashdown',
      'water-coaster',
      'water-ride',
    ],
    alternateNames: ['flume ride', 'log ride', 'splash ride', 'water flume'],
  },
  {
    id: 'river-rapids',
    name: 'River Rapids',
    shortDefinition:
      'A circular raft ride through turbulent artificial rapids where guests are likely to get soaked.',
    definition:
      'A river rapids ride (also called a white-water rafting ride or wild-water ride) puts guests in circular inflatable or fibreglass rafts that drift and spin along an artificial channel built to imitate white-water rapids. Because the circular raft rotates freely on the current, each ride-through is unpredictable: depending on raft position at each water feature, some riders get completely drenched while others stay relatively dry. River rapids rides usually have high hourly capacity and low height requirements, and they are busiest on hot days. European examples include the Wildwasser rides at Phantasialand and the various rapids attractions at Efteling, Europa-Park, and Thorpe Park.',
    relatedTermIds: ['height-requirement', 'log-flume', 'water-ride'],
    alternateNames: ['rapids ride', 'raft ride', 'white water rapids', 'white-water ride'],
  },
  {
    id: 'top-spin',
    name: 'Top Spin',
    shortDefinition:
      'A flat ride by Huss in which a gondola of riders is freely rotated in any direction while its supporting frame swings up and down.',
    definition:
      'The Top Spin is a flat ride model manufactured by Huss Rides. A gondola holding typically 40 riders is mounted on a pivoting frame; the gondola can rotate continuously in any direction while the frame swings, so swinging and spinning combine unpredictably. Programs run from gentle rocking to continuous full rotations.\n\nTop Spins were common in theme parks and at travelling fairs from the 1990s through the 2010s, and many parks worldwide still run one. Despite the swinging motion, the Top Spin is not a pendulum ride: the gondola is clamped between two rotating side frames instead of hanging from a long arm.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides', 'pendulum-ride'],
    aliases: ['Top Spins'],
    alternateNames: ['Huss Top Spin'],
  },
  {
    id: 'break-dance',
    name: 'Break Dance',
    shortDefinition:
      'A Huss flat ride with multiple cars mounted on a large spinning disc, each car rotating freely on its own axis.',
    definition:
      'The Break Dance is a flat ride model by Huss Rides in which a set of small cars (each holding two to four riders) is arranged around a large spinning disc. The cars are free to rotate on their own axes as the disc rotates, so the spinning and tilting differ from one ride cycle to the next.\n\nFrom the 1980s onward the Break Dance became one of the most common flat ride models at fairs and in parks, with its illuminated spinning disc and loud music programme. Numerous variants and imitations from other manufacturers exist under different names.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides'],
    aliases: ['Breakdance', 'Break Dancer'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    shortDefinition:
      'A centrifugal flat ride where gondolas on a large rotating ring are held in place by G-force as the ring tilts to vertical.',
    definition:
      'The Enterprise is a flat ride in which gondolas are arranged around the circumference of a large rotating ring. As the ring accelerates, centrifugal force pins riders firmly into their seats; once at full speed, the entire ring tilts progressively to a near-vertical position, leaving riders rotating overhead.\n\nOriginated by Huss Rides and subsequently produced by multiple other manufacturers, the Enterprise became a staple of both permanent parks and travelling fairs from the 1970s onward.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides'],
    aliases: ['Enterprises'],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    shortDefinition:
      'A swinging ship flat ride: a large gondola shaped like a Viking or pirate vessel that swings in an increasingly wide pendulum arc.',
    definition:
      "The Ranger is Huss Rides' swinging ship model: a large gondola shaped like a Viking longship or pirate vessel that swings back and forth in an arc, building progressively higher with each swing. Riders sit along the sides of the ship, facing inward. At full swing the gondola reaches high angles, and riders get strong negative G at the apex.\n\nSwinging ship rides are produced by many manufacturers worldwide under various names (Viking, Pirate Ship, Sea Monster). The Ranger is among the most widely installed Huss flat ride models, found in permanent parks and on travelling fairs across Europe and beyond.",
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides', 'pendulum-ride'],
    aliases: ['swinging ship', 'swinging ships', 'pirate ship ride', 'Viking ship ride'],
    alternateNames: ['Huss Ranger', 'Viking ship', 'pirate ship'],
  },
  {
    id: 'condor',
    name: 'Condor',
    shortDefinition:
      'A Huss flat ride with gondola arms that extend outward from a central column as the ride rotates and rises.',
    definition:
      'The Condor is a flat ride model by Huss Rides consisting of a tall central column with several gondola arms. As the ride operates, the arms extend outward and the gondolas rise while the entire structure rotates. Riders turn, rise and lean outward, with views across the park from a moderate height.\n\nThe Condor was a common sight in European parks from the 1970s through the 1990s and can still be found in many permanent locations. It is sometimes confused with chair tower (swing ride) attractions but has enclosed gondolas rather than open suspended chairs.',
    relatedTermIds: ['flat-ride', 'huss-rides', 'swing-ride'],
  },
  {
    id: 'troika',
    name: 'Troika',
    shortDefinition:
      'A Huss flat ride with three rotating arms, each carrying a gondola whose cars spin simultaneously with the main platform.',
    definition:
      'The Troika is a flat ride model by Huss Rides in which three arms extend from a central hub; each arm carries a gondola with several cars that can rotate. As the main platform revolves, the gondolas also rotate and the cars spin, so riders turn about several axes at once. The motion is hard to predict and disorienting.\n\nThe Troika was a popular addition to European amusement parks and fairs from the 1970s onward. Variants and imitations from other manufacturers are sometimes known as Trabant or Walzer.',
    relatedTermIds: ['break-dance', 'flat-ride', 'huss-rides'],
    aliases: ['Troikas', 'Trojka'],
    alternateNames: ['Huss Troika'],
  },
  {
    id: 'pendulum-ride',
    name: 'Pendulum Ride',
    shortDefinition:
      'A flat ride where a gondola hangs from a long arm and swings in a wide pendulum arc, often while spinning.',
    definition:
      'A pendulum ride is a type of flat ride in which a gondola is suspended from a long arm that swings back and forth in an increasingly wide arc, often reaching near-vertical heights. As the arm swings, the gondola also rotates, so the pendulum motion and the spin add up.\n\nThe classic example is the Frisbee (Mondial), a disc-shaped gondola that swings like a pendulum while rotating. Other pendulum rides include the KMG Afterburner and Intamin Giant Frisbee. Pendulum rides stand in theme parks and at travelling fairs worldwide; they can be seen from far off and need relatively little ground.',
    relatedTermIds: ['drop-tower', 'flat-ride', 'height-requirement', 'swing-ride'],
    aliases: ['Frisbee', 'Frisbees', 'pendulum rides'],
    alternateNames: ['giant frisbee', 'swinging gondola ride'],
  },
  {
    id: 'swing-ride',
    name: 'Swing Ride',
    shortDefinition:
      'A rotating tower attraction where chairs suspended by chains swing outward as the ride spins.',
    definition:
      'A swing ride (also called a chair swing, wave swinger, or Kettenflieger) is a rotating attraction in which chairs suspended from chains are attached to a revolving central structure. As the ride spins, centrifugal force swings the chairs outward and upward. Swing rides are among the oldest fairground ride types still running, with roots in early 20th-century carnivals. Modern theme park versions run from gentle low-speed models for young children to tower versions (chain towers or starflyers) that lift riders dozens of metres into the air. Almost every major theme park and travelling funfair has one.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'ride-capacity'],
    aliases: ['wave swingers', 'wave swinger'],
    alternateNames: ['chair swing', 'wave swinger', 'chain swing', 'Chairoplane'],
  },
  {
    id: 'racing-coaster',
    name: 'Racing Coaster',
    shortDefinition:
      'Two parallel roller coaster tracks on which trains are dispatched simultaneously to race side by side.',
    definition:
      'A racing coaster has two separate but mirrored tracks running parallel to each other, with the trains dispatched at the same moment so that each set of riders is racing the other. The tracks cross or run very close together at several points, which is what the format is for. Some are built as a Möbius loop, where the two tracks form one continuous circuit and riders automatically change sides between laps. It works with wooden and steel track alike. Racer at Kings Island and Gemini at Cedar Point are the American examples; in Europe they are rare, and the Möbius woodie Grand National at Blackpool Pleasure Beach is one.',
    relatedTermIds: ['credit', 'steel-coaster', 'wooden-coaster'],
    alternateNames: ['twin coaster', 'duelling coaster', 'dueling coaster', 'dual track coaster'],
  },
  {
    id: 'high-five',
    name: 'High Five',
    shortDefinition:
      'A coaster near-miss element where two trains on parallel tracks pass each other at arm’s reach.',
    definition:
      'A High Five is a near-miss coaster element in which two roller coaster trains on separate but closely spaced tracks pass each other at very short range, sometimes within arm’s reach, so that the trains seem about to collide. The name comes from the idea that riders could reach out and high-five the people on the other train. The element depends on tight dispatch timing to bring both trains to the crossing point together. Wing coasters and inverted coasters suit High Five elements, because their outboard seats bring riders closer to the other train. Duelling Dragon / Dragon Challenge at Universal’s Islands of Adventure was an early example; the element has since appeared on various B&M wing coasters and other near-miss designs around the world.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'wing-coaster'],
    aliases: ['high 5'],
    alternateNames: ['near miss element', 'near-miss', 'near fly'],
  },
  {
    id: 'dining-reservation',
    name: 'Dining Reservation',
    shortDefinition:
      'An advance booking for a table-service restaurant inside a theme park or resort.',
    definition:
      'A dining reservation is an advance booking for a table-service or character-dining restaurant at a theme park, resort hotel, or associated entertainment complex. At Disney parks, reservations can be made up to 60 days in advance (with a 10-day head-start for resort hotel guests); in busy periods the most popular restaurants can be fully booked for anyone who did not reserve. Reservations typically require a credit card to hold; most Disney table-service venues charge a no-show fee if guests cancel within 24 hours or fail to arrive. In enthusiast communities, advance dining reservations are commonly abbreviated as ADRs. For parks other than Disney, the booking window is typically shorter and systems less formalised.',
    relatedTermIds: ['character-dining', 'peak-day', 'table-service'],
    alternateNames: [
      'ADR',
      'advance dining reservation',
      'restaurant booking',
      'table booking',
      'restaurant reservation',
    ],
  },
  {
    id: 'mobile-ordering',
    name: 'Mobile Ordering',
    shortDefinition:
      'A feature in park apps allowing guests to order and pay for food in advance and skip the counter queue.',
    definition:
      'Mobile ordering allows guests to browse a restaurant menu, place and pay for an order, and select a pickup time window directly through the park’s official smartphone app, without standing in the counter queue. Disney popularised the system at its quick-service restaurants; Universal, Six Flags, Merlin parks, and many other major operators have since introduced their own versions. When the selected pickup window arrives, guests receive a notification to head to the restaurant’s dedicated mobile order pickup counter, where food is ready. Mobile ordering can save significant time at busy dining periods, particularly the midday lunch rush. The system requires a charged smartphone and reliable in-park connectivity, which is not always consistent throughout large parks.',
    relatedTermIds: ['dining-reservation', 'quick-service'],
    aliases: ['mobile order'],
    alternateNames: ['app ordering', 'app order', 'mobile food order'],
  },
  {
    id: 'food-court',
    name: 'Food Court',
    shortDefinition:
      'A large shared dining area with multiple quick-service counters offering different cuisines under one roof.',
    definition:
      'A food court is a communal dining space containing multiple individual quick-service counters or kiosks, each offering different cuisines or menu concepts, sharing a common seating area. In theme parks, food courts are typically the highest-capacity dining venues, designed to handle the volume of the midday dining rush. They allow different members of a group to order from different outlets and still sit together. Theming varies: Disney and Universal often integrate food courts into their land theming, while other parks operate them as purely functional spaces near entrance plazas or high-traffic areas. Food courts are generally the most affordable in-park dining option and do not require advance reservations.',
    relatedTermIds: ['mobile-ordering', 'quick-service', 'table-service'],
    alternateNames: ['food area', 'food hall', 'dining court'],
  },
  {
    id: 'capacity-closure',
    name: 'Capacity Closure',
    shortDefinition:
      'When a park stops admitting new guests because its maximum safe attendance has been reached.',
    definition:
      'A capacity closure (also called a park sellout or capacity cap) occurs when a theme park reaches its maximum permitted or operationally safe attendance figure and temporarily stops selling day tickets or admitting new guests at the gate. Parks manage capacity through a combination of timed entry reservations, real-time attendance monitoring, and temporary gate closures. Annual passholders at some parks may be blocked from admission on capacity days; others use pre-sold reservation systems that prevent overcrowding before it starts. Capacity closures are most common during school holiday peaks, fireworks nights, and special event evenings. Some parks communicate real-time admission status via their apps; others provide limited advance warning. Checking a park’s social media and app on the morning of a planned visit can help guests avoid an unexpected closure.',
    relatedTermIds: ['crowd-level', 'peak-day', 'school-holiday', 'season-pass'],
    alternateNames: ['park full', 'park sold out', 'sold out day', 'park sellout', 'capacity cap'],
  },
  {
    id: 'zero-g-winder',
    name: 'Zero-G Winder',
    shortDefinition:
      'A zero-G roll variant that incorporates a built-in directional change, so the train enters and exits the inversion on different headings.',
    definition:
      'The zero-G winder is a zero-G roll (a 360-degree inversion on a parabolic arc, with near-weightlessness at the apex) with a change of direction built into its geometry. In a standard zero-G roll the train enters and exits on roughly parallel headings; in a winder the track curves during the roll, and the train leaves pointing in a clearly different direction. The element is an inversion and a turn at once: riders float as in a zero-G roll while the coaster is pointed into its next section.\n\nZero-G winders appear mostly on newer coaster designs, from manufacturers such as Intamin and B&M. Kondaa at Walibi Belgium and VelociCoaster at Universal’s Islands of Adventure both have one.',
    relatedTermIds: ['airtime', 'intamin', 'inversion', 'zero-g-roll'],
    aliases: ['zero g winder', 'zero-G winder', 'winder'],
  },
  {
    id: 'banana-roll',
    name: 'Banana Roll',
    shortDefinition:
      'An extended, asymmetric double-inversion element in which two inversions are connected by a long curved arc, in the shape of a banana.',
    definition:
      'The banana roll is a stretched variation of the double-inversion concept in which two inversions are spaced further apart and connected by a sweeping curved section rather than the tight, symmetrical back-to-back geometry of a standard cobra roll. Viewed from above, the track follows a gradual arc through both inversions, resembling the curve of a banana. The looser geometry spreads the two inversions over a longer section of track, so riders go through them more slowly and smoothly than through a cobra roll.\n\nThe banana roll first appeared on Takabisha at Fuji-Q Highland, Japan, which opened in 2011 and was built by Gerstlauer. S&S Worldwide later developed their own variant for Steel Curtain at Kennywood, which features a double-inverting version of the element. Because the element requires considerable lateral space, it tends to appear on larger, ground-level installations where the track can sweep broadly between inversions.',
    relatedTermIds: ['cobra-roll', 'gerstlauer', 'inversion', 's-and-s-worldwide'],
  },
  {
    id: 'inclined-loop',
    name: 'Inclined Loop',
    shortDefinition:
      'A vertical loop rotated off its perpendicular axis, so the train approaches and exits at an angle rather than straight-on.',
    definition:
      'An inclined loop (also called a tilted loop) is a standard vertical loop that has been rotated around its axis, typically by 45 to 80 degrees relative to the track’s direction of travel. Instead of entering and exiting the loop while traveling straight forward, as in a conventional upright loop, the train approaches and leaves at an oblique angle. The loop looks asymmetric and rides differently.\n\nIn the seat, the approach is more lateral than in a standard loop, and the pull-out at the bottom of the circle comes from an unexpected direction. Inclined loops appear on several B&M and Intamin coasters, often in the middle or final section of a layout where the track has to change direction and the loop is inversion and turn at once.',
    relatedTermIds: ['b-and-m', 'intamin', 'inversion', 'vertical-loop'],
    alternateNames: ['tilted loop', 'tilted-loop', 'angled loop'],
  },
  {
    id: 'sea-serpent',
    name: 'Sea Serpent',
    shortDefinition:
      'A Vekoma double-inversion element in which the train passes through two inversions and exits traveling in the same direction it entered.',
    definition:
      'The sea serpent is a double-inversion element found mainly on Vekoma’s inverted coaster designs. Like a cobra roll, it consists of two inversion sequences joined by a central connecting section, but where a cobra roll reverses the train through 180 degrees, the sea serpent is laid out so the train enters and exits traveling in the same general direction. The two inversions arc up and over one after the other without reversing the train’s heading, and from the side the element has a long S-curve shape, like the body of a sea serpent arching through two peaks.\n\nSea serpents appear on Vekoma’s Suspended Looping Coaster (SLC) model and on some of the manufacturer’s custom installations. Because the SLC has been produced in large numbers for parks around the world, the sea serpent is one of the most widely built double-inversion elements, though less well known by name than the cobra roll. How it rides varies considerably between installations, with track condition and wheel profile.',
    relatedTermIds: ['batwing', 'cobra-roll', 'inversion', 'vekoma'],
    aliases: ['sea serpent'],
    alternateNames: ['roll over'],
  },
  {
    id: 'cobra-loop',
    name: 'Cobra Loop',
    shortDefinition:
      'The name Hersheypark gave the first inversion on Storm Runner: a loop the train twists out of, sideways, instead of completing.',
    definition:
      'A cobra loop climbs like a vertical loop and then, at the top, twists out to one side instead of coming back down the way a loop would, so the train leaves the element travelling in a different direction from the one it entered. It inverts riders once.\n\nThe name belongs to one ride. Intamin built the element for Storm Runner at Hersheypark in 2004 and the park marketed it as the world’s first cobra loop; in geometry it is what other manufacturers call a sidewinder. Where a cobra roll pairs two of these back to back and reverses the train, the cobra loop is a single half of that shape.',
    relatedTermIds: ['sidewinder', 'cobra-roll', 'vertical-loop', 'inversion', 'intamin'],
    alternateNames: ['Sidewinder'],
  },
  {
    id: 'jojo-roll',
    name: 'Jojo Roll',
    shortDefinition:
      'A slow heartline roll taken straight out of the station, before the train has climbed anything.',
    definition:
      'A jojo roll is a 360-degree heartline roll placed immediately after the station, so the train rolls upside down at little more than walking pace. Because there is almost no speed behind it, riders hang in their restraints instead of being pressed into the seat. Taken at full speed later in a layout, the same figure does the opposite.\n\nHydra: The Revenge at Dorney Park introduced it in 2005. The element was suggested by the park’s vice president of maintenance and construction, Joe Greene, and named after him. Copperhead Strike at Carowinds has since been built with one.',
    relatedTermIds: ['heartline-roll', 'inversion', 'hangtime', 'lifthill'],
    aliases: ['Jojo Rolls', 'JoJo Roll'],
  },
  {
    id: 'flying-snake-dive',
    name: 'Flying Snake Dive',
    shortDefinition:
      'A heartline roll that runs straight into a twisting dive, inverting riders twice and throwing the train off to the side.',
    definition:
      'In a flying snake dive the train rolls through a heartline roll and, without ever levelling out, drops into a twisting dive that sends it away in the opposite direction. It counts as two inversions, and the two run together closely enough that riders rarely register where one ends and the next begins.\n\nIntamin designed the element in 2005 for Maverick at Cedar Point, and Maverick never got one. Testing showed it would pull excessive force on riders, so it was cut and replaced with an S-curve before the ride opened in 2007. Storm Runner at Hersheypark, built three years earlier, is where you actually ride one: a heartline roll followed by a half Immelmann that plunges back down toward the creek.',
    relatedTermIds: ['heartline-roll', 'dive-drop', 'immelmann', 'inversion', 'intamin'],
  },
  {
    id: 'barrel-roll-drop',
    name: 'Barrel Roll Drop',
    shortDefinition:
      'An RMC element that combines the first drop and a full barrel roll into one continuous sequence, so riders are upside down while still descending.',
    definition:
      'The barrel roll drop is a Rocky Mountain Construction element that merges two things normally kept apart, the first drop and a full inversion, into one uninterrupted sequence. After the lift hill, the track rotates the train through a complete barrel roll while it descends: riders are fully inverted near the steepest point of the drop, then are rotated back upright as the train reaches the bottom and transitions into the rest of the layout. The inversion happens at high speed because the train is accelerating through the drop at the same moment it is rolling.\n\nThe element was made possible by RMC’s I-Box steel track system, which allows the tight radii and complex three-dimensional geometry required for a simultaneous roll and drop, which traditional wooden coaster track could not carry. Medusa Steel Coaster at Six Flags Mexico was among the early coasters with a barrel roll drop; Steel Vengeance at Cedar Point and Zadra at Energylandia are other examples.',
    relatedTermIds: ['first-drop', 'hybrid-coaster', 'inversion', 'rmc', 'stall'],
    aliases: ['barrel roll drop', 'barrel roll downdrop'],
    alternateNames: ['RMC barrel roll'],
  },
  {
    id: 'mcbr',
    name: 'MCBR',
    shortDefinition:
      'Mid-Course Brake Run, a set of brakes partway through a coaster layout that can stop the train completely, so several trains can run safely at once.',
    definition:
      'A mid-course brake run (MCBR) is a braking section installed somewhere in the middle of a coaster’s layout, after the first major elements and before the closing sequence. Unlike trim brakes, which merely reduce speed and allow the train to continue immediately, an MCBR is a full block-section brake: it can stop the train completely and hold it until the next block section ahead is confirmed clear. That lets a park run several trains on the same track at once without risk of collision, and raises the ride’s hourly capacity considerably.\n\nOn a busy operating day with trains dispatched at full capacity, a well-timed MCBR will release a stopped train almost immediately, and riders may barely notice the brief deceleration before the ride continues. On quieter days with fewer trains running, the stop can last longer and feel more abrupt. MCBRs are standard on most large coasters: B&M inverted and floorless coasters, many Intamin rides, and other high-capacity attractions use them routinely. An MCBR can also break the pacing of a layout, slowing the train before a second half that was drawn for higher speed.',
    relatedTermIds: ['block-brake', 'brake-run', 'ride-capacity', 'stacking', 'trim-brake'],
    aliases: ['mid course brake', 'midcourse brake', 'mid-course brake'],
    alternateNames: ['mid-course brake run'],
  },
  {
    id: 'interlocking-loops',
    name: 'Interlocking Loops',
    shortDefinition:
      'Two vertical loops whose planes cross each other, forming a chain-link or figure-eight structure.',
    definition:
      'Interlocking loops are two vertical loops positioned so their planes intersect, typically at roughly right angles. From certain angles one loop appears to pass through the other, like a chain link or an oversized figure-eight rising out of the ground. Making two loops cross without the tracks touching takes considerable structural engineering, and the pair stands out on a park’s skyline.\n\nInterlocking loops are found mostly on B&M inverted coasters and on sit-down looping coasters built for high inversion counts. Dragon Khan at PortAventura has interlocking loops in its eight-inversion layout, and the crossing loops are among the most photographed parts of the ride. The element appears on a number of other high-inversion coasters around the world. In the seat, an interlocking pair rides like two closely spaced vertical loops, though the tight geometry can make the transitions come quickly.',
    relatedTermIds: ['b-and-m', 'inversion', 'vertical-loop'],
    aliases: ['interlocking loops'],
    alternateNames: ['crossing loops', 'linked loops'],
  },
  {
    id: 'anti-rollback',
    name: 'Anti-Rollback',
    shortDefinition:
      'The ratcheting safety device on a lift hill that stops the train from rolling backwards, and the source of the click-clack sound.',
    definition:
      'An anti-rollback device (also called a rollback dog or anti-rollback dog) is a mechanical safety mechanism fitted along the underside of a lift hill. As the train climbs, spring-loaded metal pawls (sometimes called "dogs") ratchet over a series of teeth embedded in the lift hill structure. If the chain or drive mechanism were to fail, the pawls would catch on the teeth and lock the train in place, so it could not roll back down. The pawls ratcheting over the teeth make the rhythmic clicking heard on traditional roller coasters.\n\nOn modern coasters with smooth elevator-cable or LSM-powered lift hills, anti-rollback dogs are often eliminated or replaced with quiet electromagnetic braking systems, which is why some newer lift hills are noticeably quieter.',
    relatedTermIds: ['launch-coaster', 'lifthill', 'rollback'],
    aliases: ['anti-rollback device', 'anti-rollback system'],
    alternateNames: ['rollback dog', 'click-clack'],
  },
  {
    id: 'head-choppers',
    name: 'Head Choppers',
    shortDefinition:
      "Structural elements or track sections built to pass just above riders' heads at speed, as a near miss.",
    definition:
      "Head choppers are deliberate design features in which a coaster’s support structure, cross-bracing, tunnels, or sections of track pass immediately above riders' heads while the train is travelling at speed. At that distance and speed it looks as though the beam is about to hit the riders; there is no actual danger, since the clearance is precisely engineered. It works best without warning: a train exiting a banked turn sweeps under a low beam just as it accelerates, and riders barely register it before it is gone.\n\nHead choppers are most common on tightly packed wooden coasters and on inverted coasters, where the dangling legs of riders and the low-slung profile of the hanging trains bring them close to supports, station buildings, and other track sections. Designers of compact twister coasters often route sections of track within centimetres of each other at speed, to get as many of these near misses as possible.",
    relatedTermIds: ['inverted-coaster', 'roller-coaster-element', 'twister-coaster'],
    aliases: ['head chopper', 'head-chopper element'],
    alternateNames: ['near miss'],
  },
  {
    id: 'stapling',
    name: 'Stapling',
    shortDefinition:
      'An operator pressing a lap bar or restraint too tightly against a rider, which is uncomfortable and takes away the airtime the ride was built for.',
    definition:
      'Stapling is an operator, deliberately or out of caution, pushing a lap bar or shoulder harness so firmly against a rider that it is much tighter than the minimum safe position. The term comes from the feeling of being pinned or "stapled" into the seat. On airtime-focused coasters, lap bars are supposed to sit loosely enough for riders to lift slightly off the seat at the crests of hills; that is where the airtime comes from. A stapled rider is held flat against the seat throughout and does not float, however well the hills are drawn.\n\nStapling costs the most on wooden coasters and hybrid coasters, where airtime is the main reason to ride. The degree of stapling varies by park, by operator, by time of day, and sometimes by the visible size of the rider being restrained. Some parks consistently leave restraints loose; others tighten them as a matter of routine. Riders who want to maximise airtime often board as late as possible to avoid early check-by operators, and position the bar themselves before operators come to check it.',
    relatedTermIds: [
      'airtime',
      'ejector-airtime',
      'lap-bar',
      'restraint-freedom',
      'shoulder-harness',
    ],
    aliases: ['stapled', 'over-stapled'],
    alternateNames: ['over-tightened restraint'],
  },
  {
    id: 'valleying',
    name: 'Valleying',
    shortDefinition:
      'When a coaster train loses enough speed mid-ride that it becomes stranded in a low point of the track and cannot complete the course.',
    definition:
      'Valleying occurs when a coaster train, having lost too much kinetic energy during the ride, fails to have sufficient momentum to crest the next hill or complete the next element and comes to a stop (or rolls back) in a valley between two high points on the track. Because the train is now sitting at a low point rather than at a brake run or station, it cannot be moved by the normal operating systems. Recovering a valleyed train typically requires maintenance personnel to physically push or winch the train over the next high point, or disembark riders and pull the train back.\n\nValleying is rare under normal operating conditions, since rides are designed with substantial speed margins. It is more likely to occur in unusually cold weather (when wheel bearings run sluggish and friction increases), on an underpowered train running with fewer passengers than designed for, after excessive trim braking, or on rides that were originally designed for different wheel and axle specifications than are currently installed. Valleying incidents occasionally occur on ageing wooden coasters whose track geometry has shifted over time. A valleyed coaster is typically out of operation for hours while the train is recovered.',
    relatedTermIds: ['brake-run', 'downtime', 'rollback', 'trim-brake'],
    aliases: ['valley', 'valleyed'],
    alternateNames: ['stalled train', 'stranded train'],
  },
  {
    id: 'wild-mouse',
    name: 'Wild Mouse',
    shortDefinition:
      'A coaster style with small individual cars and tight, flat turns at the edges of elevated platforms, where the car seems about to run off the track.',
    definition:
      'A wild mouse coaster (also simply "mouse coaster") uses small cars seating two to four riders instead of the long trains of conventional coasters. The design is built around a series of tight, flat hairpin turns at the very edges of the track, where the car travels straight at the edge before turning sharply. Because the turns are barely banked, riders are thrown sideways against the side of the car, and the car turns so late that it seems about to slide off the track.\n\nWild mouse coasters are among the most space-efficient designs available: they fit a long ride into a compact footprint by stacking the hairpin turns on elevated levels above the track below. Steel wild mouse models appear at parks around the world from manufacturers including Mack Rides, Maurer, and Gerstlauer; wooden wild mouse coasters exist but are rare. The cars take riders of many heights and ages, the speed is moderate, and the hairpins surprise riders however often they have ridden.',
    relatedTermIds: [
      'bobsled-coaster',
      'gerstlauer',
      'mack-rides',
      'spinning-coaster',
      'steel-coaster',
    ],
    aliases: ['wild mouse coaster'],
    alternateNames: ['mouse coaster', 'Wilde Maus'],
  },
  {
    id: 'fourth-dimension-coaster',
    name: 'Fourth Dimension Coaster',
    shortDefinition:
      'A coaster type where seats are mounted on rotating arms on either side of the train and spin independently of its direction of travel.',
    definition:
      'A fourth dimension coaster (4D coaster) is a coaster design in which the passenger seats are mounted on pivoting arms extending to the left and right of each car. The seats can rotate forward or backward independently of the direction the train is travelling. The rotation is controlled either by a fixed rail running alongside the track (which forces the seat to a predetermined position at each moment in the layout) or left free, driven by gravity and rider weight distribution. Passengers may face downward during a drop, hang inverted during a turn, or rotate about several axes at once during inversions.\n\nThe concept was developed by Arrow Dynamics and later refined by S&S Worldwide. X2 at Six Flags Magic Mountain in California was the world’s first 4D coaster, opened in 2002; its redesign in 2008 added fire effects and an audio system. Eejanaika at Fuji-Q Highland in Japan has the most inversions of any coaster in the world, partly because the seat rotation adds to the count. Since the seat turns independently of the track, riders on a 4D coaster are often disoriented.',
    relatedTermIds: [
      'arrow-dynamics',
      'inversion',
      'inverted-coaster',
      's-and-s-worldwide',
      'spinning-coaster',
    ],
    aliases: ['4D coaster', 'fourth dimension', '4th dimension coaster'],
    alternateNames: ['free spin coaster'],
  },
  {
    id: 'out-and-back',
    name: 'Out-and-Back',
    shortDefinition:
      'A coaster layout that travels in a relatively straight line away from the station, turns around at the far end, and returns along a parallel path.',
    definition:
      'An out-and-back is one of the two foundational roller coaster layout types. The train departs the station, travels outward in a broadly straight line (typically over a series of hills drawn for airtime), turns around at the far end of the property, and returns along a similar path roughly parallel to the outbound leg. The two legs rarely cross, and the footprint is long and narrow, unlike the more compact twister layout.\n\nOut-and-back designs are typical of traditional wooden coasters: the speed built on the long outbound hills is spent on a return run of lower hills that give floater airtime. Each hill has to be tuned for a specific speed: on the return, where the train is fastest, the hills are shorter and more closely spaced to keep riders floating. Out-and-back wooden coasters include The Voyage at Holiday World, Comet at The Great Escape, and the various versions of the Racer coaster type. Steel coasters can also follow out-and-back paths, though the style is less common in steel than in wood.',
    relatedTermIds: ['airtime', 'airtime-hill', 'twister-coaster', 'wooden-coaster'],
    aliases: ['out and back', 'out-and-back layout', 'out and back coaster'],
  },
  {
    id: 'twister-coaster',
    name: 'Twister',
    shortDefinition:
      'A coaster layout that loops, spirals, and crosses back over itself on a compact footprint.',
    definition:
      'A twister coaster (also called a cyclone layout) is a coaster design in which the track spirals, doubles back, and crosses over or under itself repeatedly, instead of following the two legs of an out-and-back layout. The train often passes close to other sections of its own track, in other directions and at other heights, which is where the head-chopper near misses come from.\n\nTwister layouts are efficient with land area: a great deal of track length and vertical displacement fits into a relatively compact, roughly square or rectangular footprint, which suits parks short of space. Wooden twisters include classics like the Twister at Grona Lund in Stockholm and the Jack Rabbit at Seabreeze; steel twisters include many B&M and Intamin designs. Because the train changes direction constantly, banking, turning, climbing and descending within a small area, a twister feels more forceful than an out-and-back of the same height and speed.',
    relatedTermIds: ['head-choppers', 'helix', 'out-and-back', 'wooden-coaster'],
    aliases: ['twister layout', 'twister coaster'],
    alternateNames: ['cyclone', 'cyclone layout'],
  },
  {
    id: 'mae',
    name: 'MAE',
    shortDefinition:
      'Mean Absolute Error: the average number of minutes by which a wait time prediction misses the actual queue.',
    definition:
      'MAE (Mean Absolute Error) is the standard measure of prediction accuracy used by park.fan. It is the average difference, in minutes, between each predicted wait time and the actual wait time recorded at the park gate. An MAE of 8 minutes means the model’s predictions are off by 8 minutes on average across all tracked predictions.\n\nMAE treats every error equally: a 5-minute miss and a 15-minute miss are averaged together linearly. That makes it easy to read: MAE = 10 means the predictions are typically within 10 minutes of the actual wait. A lower MAE always means more accurate predictions.',
    relatedTermIds: ['ai-forecast', 'mape', 'r-squared', 'rmse'],
    alternateNames: ['Mean Absolute Error'],
  },
  {
    id: 'rmse',
    name: 'RMSE',
    shortDefinition:
      'Root Mean Square Error: like MAE, but large prediction errors count for more.',
    definition:
      'RMSE (Root Mean Square Error) measures prediction accuracy by squaring each error before averaging, then taking the square root. Large errors (being 40 minutes off on a queue, say) count far more towards the RMSE than a 5-minute miss. RMSE is always equal to or larger than MAE for the same dataset.\n\nFor park.fan, a large gap between RMSE and MAE means that the model occasionally misses badly on specific rides or days, even if most predictions are close. A small gap means errors are consistently spread without extreme outliers. Both metrics are shown live on the homepage so you can see exactly how the model is performing right now.',
    relatedTermIds: ['ai-forecast', 'mae', 'mape', 'r-squared'],
    alternateNames: ['Root Mean Square Error'],
  },
  {
    id: 'mape',
    name: 'MAPE',
    shortDefinition:
      'Mean Absolute Percentage Error: prediction error expressed as a share of the actual wait time.',
    definition:
      'MAPE (Mean Absolute Percentage Error) expresses prediction accuracy as a percentage rather than an absolute number of minutes. Instead of "off by 8 minutes", the error reads "off by 15% of the actual wait time". This makes it useful for comparing accuracy across attractions with very different typical queues: a 10-minute error means something very different on a ride that usually has a 15-minute wait versus one that usually has 90 minutes.\n\nMAPE can be misleadingly high when actual wait times are very short (e.g., a 2-minute wait where even a 1-minute error is 50%). For this reason, park.fan shows MAPE alongside MAE and RMSE rather than as the sole accuracy metric.',
    relatedTermIds: ['ai-forecast', 'mae', 'r-squared', 'rmse'],
    alternateNames: ['Mean Absolute Percentage Error'],
  },
  {
    id: 'r-squared',
    name: 'R²',
    shortDefinition:
      'R-squared, a measure of how well the AI model explains the patterns in actual wait times (0–1, higher is better).',
    definition:
      'R² (R-squared, also called the coefficient of determination) measures how much of the variation in measured wait times the model captures. A value of 1.0 would mean the model perfectly predicts every queue; 0.0 means it explains nothing beyond a simple average. In practice, values above 0.7 indicate a strong model; values above 0.9 are excellent.\n\nFor wait time prediction, a high R² is hard to reach, because queues are influenced by things no model can foresee: ride breakdowns, sudden weather changes, a post that goes viral on social media. The R² score on park.fan comes from checking every forecast against the wait time later measured, and is recalculated daily.',
    relatedTermIds: ['ai-forecast', 'mae', 'mape', 'rmse'],
    alternateNames: ['coefficient of determination'],
  },
  {
    id: 'seasonal-attraction',
    name: 'Seasonal Attraction',
    shortDefinition:
      'A ride, show, or experience that only operates during specific months of the year, such as an ice rink in winter or a water ride in summer.',
    definition:
      'A seasonal attraction is a ride, show, or experience that the park only runs during a defined part of the calendar year. Ice skating rinks, sled rides, and holiday-themed shows typically run in winter (November to February); log flumes, water play areas, and outdoor shows tend to run in summer (May to September). Some seasonal attractions are tied to specific events such as Halloween or Christmas seasons.\n\nOn park.fan, seasonal attractions and shows are automatically identified based on historical operating data and hidden from the park’s tab view and map when they are outside their active months, so the view lists what is open today. A seasonal badge (❄️ Winter, ☀️ Summer, or 🍃 generic) appears on every such attraction’s card. When the attraction is currently out of season, the badge is dimmed to indicate it is inactive. An off-season toggle button in the Attractions and Shows tabs lets you reveal hidden entries when needed, for example to plan a winter visit.',
    relatedTermIds: ['crowd-calendar', 'offseason', 'refurbishment'],
    alternateNames: ['seasonal ride', 'seasonal show', 'seasonal experience'],
  },
  {
    id: 'gravity-group',
    name: 'The Gravity Group',
    shortDefinition: 'An American design firm specializing in modern wooden roller coasters.',
    definition:
      'The Gravity Group is an American engineering and design firm that designs modern wooden roller coasters. Formed by veterans of Custom Coasters International (CCI), the group draws compact, forceful wooden layouts. Its designs often run "timberliner" trains, which can take tight, twisting sections that traditional wooden coaster trains cannot. Examples of their work include Voyage at Holiday World and Wodan - Timburcoaster at Europa-Park.',
    relatedTermIds: ['hybrid-coaster', 'rmc', 'wooden-coaster'],
    aliases: ['Gravity Group'],
  },
  {
    id: 'sally-dark-rides',
    name: 'Sally Dark Rides',
    shortDefinition: 'A Florida manufacturer of dark rides and animatronics.',
    definition:
      'Sally Dark Rides (formerly Sally Corporation) develops dark rides and animatronics. Based in Florida, the company specializes in "turnkey" attractions and handles the storytelling, set design, ride systems and character animation itself. Many of its dark rides are interactive, with guests using blasters to score points, such as the various Justice League: Battle for Metropolis attractions and many Scooby-Doo themed rides around the world.',
    relatedTermIds: ['animatronics', 'dark-ride', 'interactive-dark-ride'],
    aliases: ['Sally Corporation'],
  },
  {
    id: 'mondial',
    name: 'Mondial',
    shortDefinition: 'A Dutch manufacturer of large thrill flat rides.',
    definition:
      'Mondial is a Netherlands-based manufacturer specializing in large thrill flat rides, many of which turn riders about several axes at once. Its models include the Top Scan, the Shake, and the Turbine. Mondial rides run in major theme parks and on the European traveling fair circuit, where they are built to be packed up and set up again week after week.',
    relatedTermIds: ['flat-ride', 'huss-rides', 'top-spin'],
  },
  {
    id: 'kmg',
    name: 'KMG',
    shortDefinition: 'A Dutch manufacturer of portable flat rides.',
    definition:
      'KMG (Kermis Machinebouw Gaasbeek) is a Dutch engineering firm that builds flat rides. It started out building for travelling fairs, and its rides are also installed in permanent theme parks, because they are reliable and easy to maintain. KMG developed the Afterburner (Frisbee-style) and the Freak Out; its rides are quick to set up and run smoothly.',
    relatedTermIds: ['flat-ride', 'mondial', 'pendulum-ride'],
  },
  {
    id: 'oceaneering',
    name: 'Oceaneering',
    shortDefinition: 'A technology company that builds ride systems and motion bases.',
    definition:
      'Oceaneering Entertainment Systems (OES), a division of Oceaneering International, builds ride systems. Drawing on the parent company’s subsea robotics, it developed the motion-base vehicles used in The Amazing Adventures of Spider-Man at Universal Islands of Adventure. It also builds trackless ride systems and animatronic figures for theme parks.',
    relatedTermIds: ['dark-ride', 'motion-simulator', 'trackless-ride'],
  },
  {
    id: 'etf-ride-systems',
    name: 'ETF Ride Systems',
    shortDefinition: 'A Dutch manufacturer specializing in trackless and multi-mover ride systems.',
    definition:
      'ETF Ride Systems is a Dutch company that builds ride platforms, above all trackless vehicles. The vehicles follow a guide wire or a local positioning system across a flat floor, so ride paths need not be linear and vehicles can "dance". ETF systems run dark rides such as Symbolica at Efteling and Ratatouille: The Adventure at Disneyland Paris and Walt Disney World.',
    relatedTermIds: ['dark-ride', 'oceaneering', 'trackless-ride'],
  },
  {
    id: 'chance-rides',
    name: 'Chance Rides',
    shortDefinition: 'An American manufacturer of coasters, flat rides, and transit systems.',
    definition:
      'Chance Rides is an American manufacturer that has built carousels, miniature trains and high-speed roller coasters. After acquiring the assets of D.H. Morgan Manufacturing, it entered the hypercoaster market. Its products today include the "Hyper GT-X" coaster model, flat rides such as the Zipper and the Wipeout, and park trams and carousels.',
    relatedTermIds: ['arrow-dynamics', 'flat-ride', 'hyper-coaster', 'steel-coaster'],
  },
  {
    id: 'non-inverting-loop',
    name: 'Non-Inverting Loop',
    shortDefinition:
      'A loop-shaped coaster element that twists so the riders never go fully upside down.',
    definition:
      'A non-inverting loop is a roller coaster element that mimics the shape of a traditional vertical loop but incorporates a twist at the apex so that the train remains upright. Riders see a loop and feel strong vertical G-forces, but are never upside down. This element was popularized by Maurer Rides on their X-Car coasters (like Hollywood Rip Ride Rockit) and has since been used by other manufacturers like Mack Rides.',
    relatedTermIds: ['airtime', 'inversion', 'vertical-loop'],
    aliases: ['Non-Inverting Loops'],
  },
  {
    id: 'pretzel-knot',
    name: 'Pretzel Knot',
    shortDefinition: 'A large, pretzel-shaped element where the track crosses over itself.',
    definition:
      'A pretzel knot is a coaster element consisting of a simultaneous entrance and exit that forms a pretzel-like shape. Not to be confused with the "pretzel loop" found on flying coasters, the pretzel knot is a rarer element found on coasters like Banshee at Kings Island. It involves two inversions (a dive loop followed by an Immelmann) that overlap and put strong forces on riders.',
    relatedTermIds: ['corkscrew', 'inversion', 'pretzel-loop'],
    aliases: ['Pretzel Knots'],
  },
  {
    id: 'raven-turn',
    name: 'Raven Turn',
    shortDefinition:
      'An element on 4D coasters consisting of a half-loop that changes the seat orientation.',
    definition:
      'A raven turn is an element of 4th Dimension roller coasters (like X2 or Eejanaika). It is a half-loop that can be performed either "inside" or "outside". Because 4D coasters have seats that rotate independently of the track, the raven turn is often combined with a seat flip, and to the rider the world seems to somersault.',
    relatedTermIds: ['fourth-dimension-coaster', 'inversion', 'wing-coaster'],
    aliases: ['Raven Turns'],
  },
  {
    id: 'dive-drop',
    name: 'Dive Drop',
    shortDefinition:
      'An inversion on wing coasters that starts with an inline twist at the top of a lift hill.',
    definition:
      'A dive drop is a coaster element used almost exclusively on B&M Wing Coasters. It is the first drop: the train leaves the lift hill, slowly twists 180 degrees into an inverted position, and then dives down into a half-loop. Riders get a moment of "hangtime" and look straight down the drop, those in the outside seats most of all.',
    relatedTermIds: ['first-drop', 'hangtime', 'inversion', 'wing-coaster'],
    aliases: ['Dive Drops'],
  },
  {
    id: 'outerbanked-turn',
    name: 'Outerbanked Turn',
    shortDefinition: 'A turn where the track is tilted away from the direction of the turn.',
    definition:
      'An outerbanked turn is a maneuver where the track is banked in the opposite direction of what is traditionally expected. Instead of leaning "into" the curve to neutralize lateral forces, the track leans "out", and riders are thrown toward the outside of the vehicle. RMC and Intamin build it into modern layouts for a mix of lateral and negative G-forces (airtime).',
    relatedTermIds: ['airtime', 'lateral-gs', 'overbank', 'rmc'],
    aliases: ['Outerbanked Turns'],
  },
  {
    id: 'camelback',
    name: 'Camelback',
    shortDefinition: 'A series of humps or hills designed to provide airtime.',
    definition:
      'A camelback (or camelback hill) is a classic roller coaster element consisting of a large, hump-shaped hill. As the train crests the hill, riders get "floater" airtime and lift out of their seats. Camelbacks are the basic element of hypercoasters and are often built in sequence, for several moments of weightlessness.',
    relatedTermIds: ['airtime', 'airtime-hill', 'hyper-coaster', 'quad-down'],
    aliases: ['Camelbacks', 'Camel back'],
  },
  {
    id: 'zero-g-stall',
    name: 'Zero-G Stall',
    shortDefinition:
      'An inversion where the train stays upside down while traveling along a straight section of track.',
    definition:
      'A zero-g stall is an element where the track twists 180 degrees into an inverted position, remains upside down for a prolonged straight or slightly curved section, and then twists back. Unlike a zero-g roll, which is a continuous rotation, the stall pauses the inversion, and riders hang weightless in their restraints for a sustained moment. It was popularized by RMC on their hybrid and I-Box coasters.',
    relatedTermIds: ['hangtime', 'inversion', 'rmc', 'stall', 'zero-g-roll'],
    aliases: ['Zero-G Stalls'],
  },
  {
    id: 'gp',
    name: 'GP (General Public)',
    shortDefinition: 'A term used by enthusiasts to refer to non-enthusiast park guests.',
    definition:
      'GP, or "General Public," is a slang term used within the theme park and roller coaster enthusiast community to describe average park guests who do not share the same level of technical knowledge or passion for rides. The term is often used when discussing how parks market their attractions or how guests react to ride operations and closures. It is generally not used by parks themselves.',
    relatedTermIds: ['credit', 'ert', 'fanboy', 'hype-train', 'mackprodukt', 'touring-plan'],
    aliases: ['General Public'],
  },
  {
    id: 'strata-coaster',
    name: 'Strata Coaster',
    shortDefinition: 'A roller coaster with a height or drop exceeding 400 feet (122 meters).',
    definition:
      'A strata coaster is a roller coaster that reaches a height of 400 feet (122 meters) or more. This classification was originally coined by Cedar Point for the opening of Top Thrill Dragster. Strata coasters are rare, because they cost a great deal and are hard to engineer. Only a handful have ever been built, including Kingda Ka at Six Flags Great Adventure.',
    relatedTermIds: ['giga-coaster', 'hyper-coaster', 'launch-coaster'],
    aliases: ['Strata Coasters'],
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    shortDefinition: 'The act of sending a ride vehicle or train from the station.',
    definition:
      'A dispatch occurs when the ride operators clear a vehicle for departure and start its cycle. Quick dispatches keep the "riders per hour" (capacity) high. If dispatches are too slow, it can lead to "stacking," where subsequent trains must wait outside the station for the previous one to clear. Enthusiasts often track "dispatch times" as a measure of a park’s operational efficiency.',
    relatedTermIds: ['queue-line', 'ride-capacity', 'stacking'],
    aliases: ['Dispatches'],
  },
  {
    id: 'near-miss',
    name: 'Near-Miss',
    shortDefinition:
      'A design element that creates the illusion of a rider colliding with a structure.',
    definition:
      'A near-miss (or head-chopper/foot-chopper) is a thematic or structural element placed very close to the ride path. While riders are always safely within the "clearance envelope," the speed and perspective of the ride make it appear as though they might hit an oncoming beam, tunnel wall, or another part of the track. These effects are engineered to make the ride feel faster and more dangerous than it is.',
    relatedTermIds: ['clearance-envelope', 'foot-chopper', 'head-choppers'],
    aliases: ['Near-Misses', 'Near miss'],
  },
  {
    id: 'clearance-envelope',
    name: 'Clearance Envelope',
    shortDefinition:
      'The safe space around a ride vehicle that must remain free of any obstructions.',
    definition:
      'The clearance envelope is the calculated three-dimensional space around a ride vehicle that must be kept entirely clear of any structures, supports, or vegetation. This ensures that even the tallest riders with their arms or legs extended cannot make contact with anything outside the vehicle. During testing, parks often use "reach envelopes" (physical frames attached to the train) to verify that no part of the environment encroaches on this safety zone.',
    relatedTermIds: ['foot-chopper', 'head-choppers', 'near-miss', 'testing'],
    aliases: ['Clearance Envelopes'],
  },
  {
    id: 'testing',
    name: 'Testing',
    shortDefinition:
      'The cycles a ride runs empty: before it opens, every morning, and after every repair.',
    definition:
      "Testing is everything between a finished ride and a loaded train. Commissioning runs use water dummies or sandbags in place of riders, the ride system is put through thousands of cycles to prove it, and reach-envelope checks confirm that nothing along the track is close enough for an outstretched arm to touch.\n\nIt never really stops. Parks run empty cycles each morning before the first guests and again after any downtime or maintenance, which is why a ride can show as open and still not be dispatching. New rides test in plain sight, with trains running over guests' heads for weeks before opening day, and a soft opening is itself a test, only with real riders in the seats. In Germany the TUV has to sign a ride off before it may carry anybody.",
    relatedTermIds: ['clearance-envelope', 'soft-opening', 'downtime', 'refurbishment'],
    aliases: ['Test runs', 'Test cycles'],
  },
  {
    id: 'kuka',
    name: 'KUKA',
    shortDefinition:
      'A German industrial robot maker whose factory arms were adapted to carry riders.',
    definition:
      'KUKA (short for Keller und Knappich Augsburg, and still headquartered there) builds the orange robot arms found on car assembly lines. The heavy-duty KR 500 was adapted for ride use as the RoboCoaster: a four-seat bench bolted to the end of the arm, free to pitch, roll and sweep riders through motions no fixed track could produce.\n\nHarry Potter and the Forbidden Journey opened in 2010 with RoboCoaster G2 benches mounted on moving bases, so the arms travel through the show scenes instead of performing in one spot. Epcot’s Sum of All Thrills (2009-2016) used a custom KUKA arm the other way round: guests designed a coaster profile at a terminal and the arm then flew what they had drawn.',
    relatedTermIds: ['dynamic-attractions', 'dark-ride', 'motion-simulator', 'flying-theater'],
    alternateNames: ['Keller und Knappich Augsburg'],
  },
  {
    id: 'foot-chopper',
    name: 'Foot-Chopper',
    shortDefinition:
      "A near-miss effect specifically designed for coasters where the riders' legs are exposed.",
    definition:
      "A foot-chopper is a specific type of near-miss effect found on inverted, suspended, or floorless roller coasters. It involves placing track supports, water, or theming elements close to where the riders' feet pass. For a moment it looks as though the rider’s feet will strike the object.",
    relatedTermIds: [
      'clearance-envelope',
      'head-choppers',
      'inverted-coaster',
      'near-miss',
      'wing-coaster',
    ],
    aliases: ['Foot-Choppers'],
  },
  {
    id: 'projection-mapping',
    name: 'Projection Mapping',
    shortDefinition:
      'A technology used to project video onto non-flat surfaces like buildings or ride sets.',
    definition:
      'Projection mapping is a display technique that turns objects, often irregularly shaped ones like castle walls or dark ride sets, into a surface for video projection. Specialized software "maps" the 3D geometry of the object, and the projection can then make the surface appear to move, change shape or gain depth. It is used in nighttime shows (like castle shows) and in modern dark rides, to create moving scenery without physical sets.',
    relatedTermIds: ['animatronics', 'dark-ride', 'interactive-dark-ride', 'pre-show'],
    aliases: ['Video mapping', 'Digital mapping'],
  },
  {
    id: 'omnimover',
    name: 'Omnimover',
    shortDefinition:
      'A ride system with a continuous chain of vehicles that move at a constant speed.',
    definition:
      'The Omnimover is a ride system developed by Disney with a continuous loop of vehicles. Because the vehicles never stop moving, the system has a very high capacity. The vehicles can rotate, so each one points its riders at the scene the designers want them to see. Examples include The Haunted Mansion and Spaceship Earth. Other manufacturers have since developed similar continuous-chain systems.',
    relatedTermIds: ['dark-ride', 'ride-capacity', 'trackless-ride'],
    aliases: ['Omnimovers'],
  },
  {
    id: 'pepper-ghost',
    name: 'Pepper’s Ghost',
    shortDefinition: 'A classic illusion using glass and light to create "transparent" ghosts.',
    definition:
      'Pepper’s Ghost is a theatrical illusion technique used to create transparent "ghosts." It works by placing a large sheet of glass at an angle between the audience and a scene; by lighting an object in a hidden room so its reflection appears in the glass, it looks like a translucent figure is standing in the main scene. The ballroom scene of Disney’s Haunted Mansion uses this 19th-century technique on a large scale.',
    relatedTermIds: ['animatronics', 'dark-ride', 'pre-show', 'projection-mapping'],
    aliases: ['Pepper’s Ghost'],
  },
  {
    id: 'dynamic-attractions',
    name: 'Dynamic Attractions',
    shortDefinition: 'A Canadian manufacturer of complex ride systems, including the Robocoaster.',
    definition:
      'Dynamic Attractions is a ride manufacturer that builds technically complex ride systems. Among them is the "Robocoaster" robotic arm system used in attractions like Harry Potter and the Forbidden Journey. It also builds track systems, motion theaters, and structural components for theme parks worldwide.',
    relatedTermIds: ['dark-ride', 'flying-theater', 'kuka', 'motion-simulator'],
  },
  {
    id: 'flying-theater',
    name: 'Flying Theater',
    shortDefinition:
      'An attraction that simulates flight using a large curved screen and moving suspended seats.',
    definition:
      'A flying theater is a type of simulation attraction where guests sit in suspended seats that move in synchronization with a film projected onto a large, spherical screen. The seats often "fly" forward into the screen area. Examples include Disney’s Soarin\' and Europa-Park’s Voletarium.',
    relatedTermIds: ['dark-ride', 'dynamic-attractions', 'motion-simulator', 'pre-show'],
  },
  {
    id: 'shuttle-coaster',
    name: 'Shuttle Coaster',
    shortDefinition:
      'A roller coaster that does not form a complete circuit and travels both forward and backward.',
    definition:
      'A shuttle coaster is a type of roller coaster that travels from a station to an endpoint (often a vertical spike), then reverses direction and returns to the station. Because the track does not form a closed loop, guests experience the entire course both forward and backward.',
    relatedTermIds: ['boomerang', 'launch-coaster', 'spike', 'steel-coaster'],
  },
  {
    id: 'carousel',
    name: 'Carousel',
    shortDefinition: 'A classic rotating attraction with seats, often in the form of horses.',
    definition:
      'A carousel (or merry-go-round) is a traditional rotating ride with a circular platform and decorated seats. These seats are typically shaped like horses or other animals and often move up and down to imitate galloping. Almost every amusement park has one.',
    relatedTermIds: ['flat-ride', 'themed-land'],
  },
  {
    id: 'walkthrough',
    name: 'Walkthrough',
    shortDefinition: 'An attraction experienced on foot through themed environments.',
    definition:
      'A walkthrough is an attraction designed to be experienced on foot rather than in a ride vehicle. Guests move through themed environments that may include interactive elements, live actors, or special effects. They range from simple themed paths to elaborate haunted houses or funhouses.',
    relatedTermIds: ['dark-ride', 'funhouse', 'themed-land'],
  },
  {
    id: 'funhouse',
    name: 'Funhouse',
    shortDefinition:
      'A classic walkthrough attraction filled with physical obstacles and optical illusions.',
    definition:
      'A funhouse is a traditional walkthrough attraction that challenges guests with physical obstacles like moving floors, rotating barrels, distorted mirrors, and slides. Funhouses are common at fairs, and many permanent parks have more elaborate ones.',
    relatedTermIds: ['flat-ride', 'walkthrough'],
  },
  {
    id: 'ferris-wheel',
    name: 'Ferris Wheel',
    shortDefinition:
      'A large, vertical rotating wheel with passenger gondolas providing panoramic views.',
    definition:
      'A Ferris wheel is a large vertical wheel with passenger gondolas mounted around its rim, turning slowly enough that riders get a long look out over the park and the country around it. It is a landmark at a lot of parks and fairgrounds, partly because it is visible from outside the fence. They range from small family wheels a few metres across to observation wheels on the scale of the London Eye.',
    relatedTermIds: ['flat-ride', 'opening-hours'],
  },
  {
    id: 'spike',
    name: 'Spike',
    shortDefinition: 'A vertical or steeply inclined dead-end track section on a shuttle coaster.',
    definition:
      'A spike is a term for a vertical or steeply inclined section of track on a shuttle coaster that ends abruptly. The train travels up the spike until it loses momentum, then falls back down in the opposite direction. Spikes are common features on launched shuttle coasters.',
    relatedTermIds: ['rollback', 'shuttle-coaster', 'steel-coaster'],
  },
  {
    id: 'forced-perspective',
    name: 'Forced Perspective',
    shortDefinition:
      'A design technique used to make structures appear larger or smaller than they actually are.',
    definition:
      'Forced perspective is an optical illusion used by designers to manipulate the perceived scale and distance of objects. By scaling buildings down as they get higher, designers can make them appear much taller. Sleeping Beauty Castle at Disneyland uses it to look taller than it is.',
    relatedTermIds: ['themed-land'],
  },
  {
    id: 'show-building',
    name: 'Show Building',
    shortDefinition:
      'The large, utilitarian structure that houses the track and sets of an indoor attraction.',
    definition:
      'A show building is the structural warehouse or hangar that contains the track, sets, and special effects of an indoor ride or dark ride. The interior holds the sets; the exterior is often a plain box hidden from guest view by landscaping or themed facades.',
    relatedTermIds: ['dark-ride', 'forced-perspective', 'themed-land'],
  },
  {
    id: 'practical-effects',
    name: 'Practical Effects',
    shortDefinition:
      'Physical special effects produced live within an attraction rather than digitally.',
    definition:
      'Practical effects are physical special effects created live on-site, such as animatronics, water, real fire, fog, and physical props, as opposed to digital or screen-based effects.',
    relatedTermIds: ['animatronics', 'dark-ride', 'projection-mapping'],
  },
  {
    id: 'chicken-exit',
    name: 'Chicken Exit',
    shortDefinition:
      'A dedicated exit path for guests who decide not to ride just before boarding.',
    definition:
      'A chicken exit is a designated path that allows guests to leave the queue and exit the attraction just before they would board the ride vehicle. It is used by guests who change their minds about a thrill ride or by those who were only accompanying others in the queue.',
    relatedTermIds: ['queue-line', 'rider-switch', 'single-rider', 'wait-time'],
  },
  {
    id: 'in-show-exit',
    name: 'In-Show Exit',
    shortDefinition:
      'An exit or evacuation from a ride vehicle within the themed area of an attraction.',
    definition:
      'An in-show exit occurs when guests leave a ride vehicle while it is still within the attraction’s themed environment, usually during a technical breakdown or evacuation. Staff guide the guests along walkways through the "backstage" areas of the ride.',
    relatedTermIds: ['dark-ride', 'downtime', 'e-stop'],
  },
  {
    id: 'e-stop',
    name: 'E-Stop',
    shortDefinition: 'An emergency stop that immediately halts all ride motion for safety reasons.',
    definition:
      'An E-Stop (Emergency Stop) is a safety mechanism or procedure that immediately cuts power or applies brakes to halt all ride movement. It can be triggered automatically by sensors or manually by operators. After an E-Stop, the ride must usually be inspected and reset before resuming service.',
    relatedTermIds: ['block-brake', 'downtime', 'in-show-exit'],
  },
  {
    id: 'mackprodukt',
    name: 'Mackprodukt',
    shortDefinition:
      'German-community slang for the reflexive, uncritical praise that devoted Mack Rides fans heap on anything the manufacturer builds.',
    definition:
      'A "Mackprodukt" (literally "Mack product") is an in-joke from the German-speaking coaster enthusiast community, used to gently mock the fervent loyalty of Mack Rides fans. Because Mack is a German manufacturer and the family behind Europa-Park, its fans are unusually loyal, and critics joke that every new Mack ride is hailed as a masterpiece before anyone has even ridden it.\n\nThe meme is built around a handful of stock phrases that supposedly stand in for any real analysis: admiration for how beautifully the track is bent ("die Schiene ist so toll gebogen", "the track is so wonderfully curved") and for the gorgeous ride elements ("wunderschöne Fahrfiguren"), aesthetic compliments that conveniently sidestep how the coaster actually rides. Calling something a "Mackprodukt", or simply quoting the phrases, has become the community’s shorthand for affectionate eye-rolling at brand loyalty winning out over substance.',
    relatedTermIds: ['credit', 'fanboy', 'gp', 'hype-train', 'mack-rides'],
    aliases: ['Mack-Produkt', 'Mackprodukte'],
  },
  {
    id: 'onride-offride',
    name: 'On-Ride / Off-Ride',
    shortDefinition:
      'Enthusiast shorthand for footage filmed on board a ride (on-ride) versus filmed from the ground watching it (off-ride).',
    definition:
      'On-ride and off-ride describe the two main ways enthusiasts capture a coaster. An on-ride video is shot from a rider’s seat and conveys the pacing, airtime and forces of the experience, while an off-ride video is filmed trackside and shows the layout, theming and trains in motion. The pair comes up constantly when discussing POVs and ride videos shared online; because many parks ban loose phone filming on board, sanctioned on-ride footage is in demand.',
    relatedTermIds: ['pov', 'ride-photo', 'credit'],
    aliases: ['On-Ride', 'Off-Ride', 'Onride', 'Offride'],
  },
  {
    id: 're-ride',
    name: 'Re-Ride',
    shortDefinition:
      'Staying on or immediately re-boarding a ride for another lap without leaving your seat or rejoining the queue.',
    definition:
      'A re-ride is when a guest is allowed to remain on a ride (or hop straight back into the station) for an additional cycle without walking the full line again. Re-rides are common late in the day, during quiet periods, or at enthusiast events when demand is low and operators simply wave riders back on. Where a park allows them, coaster fans use re-rides for back-to-back laps, to compare different rows or to ride a favourite again.',
    relatedTermIds: ['credit', 'ert', 'rope-drop'],
    aliases: ['Re-Rides', 'Reride'],
  },
  {
    id: 'hype-train',
    name: 'Hype Train',
    shortDefinition:
      'The wave of community excitement that builds around an announced ride, sometimes inflating expectations beyond reality.',
    definition:
      'The "hype train" is the surge of anticipation that builds across forums and social media once a new attraction is teased or announced. It feeds on construction updates, leaked layouts and early POV releases, and can push expectations sky-high long before opening day. Enthusiasts joke about "boarding the hype train", and about the let-down when a ride fails to live up to it. The concept is closely tied to fanbase loyalty and to memes like the Mackprodukt.',
    relatedTermIds: ['gp', 'mackprodukt', 'fanboy'],
    aliases: ['Hype', 'Hype-Train'],
  },
  {
    id: 'fanboy',
    name: 'Fanboy',
    shortDefinition:
      'A fan whose devotion to a particular park, manufacturer or ride makes their opinion reflexively positive and uncritical.',
    definition:
      'In enthusiast circles a "fanboy" (used regardless of gender) is someone whose attachment to a specific park or manufacturer colours every judgement they make, defending it and praising its products almost on reflex. The label is usually applied half-jokingly, but in the hobby brand loyalty does sometimes outweigh a fair assessment. The German-community Mackprodukt meme is fanboyism turned into a running gag.',
    relatedTermIds: ['mackprodukt', 'hype-train', 'gp'],
    aliases: ['Fanboys', 'Fangirl'],
  },
  {
    id: 'smoothness',
    name: 'Ride Smoothness',
    shortDefinition:
      'How free a coaster is from jolts, shuffling and vibration; the opposite of a rough or rattly ride.',
    definition:
      'Smoothness (German enthusiasts call it "Laufruhe") describes how cleanly a coaster’s trains track through the layout without head-banging, shuffling or vibration. It is shaped by the precision of the track manufacturing, the train and wheel design, and the ride’s age and maintenance. B&M and Mack coasters usually run glass-smooth, and a coaster that stays smooth as it ages was well engineered. A rough, rattling ride is one of the most common complaints among enthusiasts.',
    relatedTermIds: ['rattle', 'b-and-m', 'g-force'],
    aliases: ['Smooth', 'Laufruhe', 'Glass-smooth'],
  },
  {
    id: 'rattle',
    name: 'Rattle',
    shortDefinition:
      'Unwanted vibration or shaking transmitted through a coaster train, which makes an otherwise good ride feel rough.',
    definition:
      'A rattle is the buzzing, shaking or shuffling that develops when a coaster’s wheels no longer track perfectly against the rails, often a sign of track wear, wheel condition or ageing construction. German enthusiasts call it "Rattern" or "Geruckel". A rattle can make an otherwise good layout uncomfortable, and it is common on older Arrow and Vekoma steel coasters. Its absence is called smoothness, or Laufruhe.',
    relatedTermIds: ['smoothness', 'wooden-coaster', 'arrow-dynamics'],
    aliases: ['Rattling', 'Rattern', 'Geruckel'],
  },
  {
    id: 'restraint-freedom',
    name: 'Restraint Freedom',
    shortDefinition:
      'How much room a rider has to move under the lap bar or shoulder harness, which decides how airtime and ejector feel.',
    definition:
      'Restraint freedom ("Bügelfreiheit" in the German community) describes how much space is left between the rider and the restraint once it is locked. With room under the lap bar, riders lift out of the seat during airtime and float or get thrown up; a tight or stapled restraint holds them down. Many Intamin and Mack designs have loose lap bars.',
    relatedTermIds: ['lap-bar', 'shoulder-harness', 'airtime', 'stapling'],
    aliases: ['Bügelfreiheit', 'Restraint Room'],
  },
  {
    id: 'single-rail-coaster',
    name: 'Single-Rail Coaster',
    shortDefinition:
      'A modern coaster type running on one narrow central rail, with riders seated single-file for an exposed, twisty ride.',
    definition:
      'A single-rail coaster uses a single narrow box-section rail instead of the usual two parallel rails, with trains in which riders sit one behind another straddling the track. The thin rail allows very tight, twisting layouts, and riders sit with almost no structure around them. Rocky Mountain Construction pioneered the modern version with its "Raptor" model (such as RailBlazer at California’s Great America), and Vekoma and Intamin have since developed their own single-rail designs.',
    relatedTermIds: ['rmc', 'vekoma', 'steel-coaster'],
    aliases: ['Single Rail', 'Raptor Track', 'Single-Rail Coasters'],
  },
  {
    id: 'stand-up-coaster',
    name: 'Stand-Up Coaster',
    shortDefinition:
      'A coaster on which riders are secured in a standing position rather than seated.',
    definition:
      'A stand-up coaster restrains riders in an upright, standing posture, using a bicycle-style seat and an over-the-shoulder harness to hold them in place. The format was popular in the late 1980s and 1990s, built chiefly by TOGO and B&M. Standing changes how the forces reach the body: loops and turns put unusual pressure on the legs. Few new stand-ups have been built since, and several have been converted to other formats (B&M’s Mantis became the floorless Rougarou), so the survivors are rare credits.',
    relatedTermIds: ['b-and-m', 'floorless-coaster', 'steel-coaster'],
    aliases: ['Stand Up Coaster', 'Standup Coaster', 'Stand-Up Coasters'],
  },
  {
    id: 'bobsled-coaster',
    name: 'Bobsled Coaster',
    shortDefinition:
      'A coaster whose cars run freely through an open, banked trough instead of being locked to a fixed track.',
    definition:
      'A bobsled coaster sends its cars down a curved, tube-like trough rather than along a conventional track, so they are free to find their own line through the banked turns, much like a real bobsleigh run. The ride has no inversions; the forces are mostly lateral, set by the speed and the shape of the channel. Schwarzkopf built early versions, and Mack Rides is the main maker of the modern steel bobsled, several of which run at German and Alpine parks.',
    relatedTermIds: ['mack-rides', 'wild-mouse', 'steel-coaster'],
    aliases: ['Bobsleigh Coaster', 'Bobbahn', 'Bobsled Coasters'],
  },
  {
    id: 'powered-coaster',
    name: 'Powered Coaster',
    shortDefinition:
      'A coaster-style ride driven continuously by an on-board or track motor instead of relying on gravity.',
    definition:
      'A powered coaster looks like a roller coaster but is propelled throughout its circuit by electric motors rather than being lifted once and released to gravity. Because it can hold speed and run multiple laps, it is typically a gentle family attraction (often themed as a mine train, a dragon or an animal) with high capacity and mild forces. Whether powered coasters "count" as credits is a long-running, semi-serious debate in the enthusiast community.',
    relatedTermIds: ['alpine-coaster', 'credit', 'mack-rides', 'mine-train'],
    aliases: ['Powered Coasters', 'Powered Track Ride'],
  },
  {
    id: 'water-coaster',
    name: 'Water Coaster',
    shortDefinition:
      'A hybrid of roller coaster and water ride, combining coaster-style track and lifts with one or more splashdowns.',
    definition:
      'A water coaster combines coaster mechanics (chain or powered lifts, drops and banked track) with the soaking finale of a water ride. Boats or coaster-style cars are hauled up lift hills and sent through dips before braking sharply into a trough of water that throws up a wave. Mack Rides is the main maker of the modern water coaster, with installations like Poseidon at Europa-Park. The ride has the pacing of a coaster and ends in a splash, which draws long queues on hot days.',
    relatedTermIds: ['mack-rides', 'log-flume', 'splashdown'],
    aliases: ['Water Coasters', 'Aqua Coaster'],
  },
  {
    id: 'alpine-coaster',
    name: 'Alpine Coaster',
    shortDefinition:
      'A rail-guided downhill coaster, usually on a mountainside, where riders control their own speed with a brake lever.',
    definition:
      'An alpine coaster (also called a mountain coaster) is a sled- or cart-based ride fixed to a rail that follows the natural contours of a hillside, letting riders descend at a speed they set themselves with a hand brake. Unlike a traditional coaster there is no train and usually no powered launch: gravity and the terrain do the work, and a cable tows the carts back to the top. They are a year-round fixture at Alpine resorts and have spread worldwide; the older, trough-based "Sommerrodelbahn" (summer toboggan run) is their close relative.',
    relatedTermIds: ['terrain-coaster', 'powered-coaster'],
    aliases: ['Mountain Coaster', 'Alpine Coasters', 'Sommerrodelbahn'],
  },
  {
    id: 'beyond-vertical-drop',
    name: 'Beyond-Vertical Drop',
    shortDefinition:
      'A drop steeper than 90 degrees, so the track tips riders past straight-down and briefly faces them backward.',
    definition:
      'A beyond-vertical drop is steeper than 90 degrees: the track curls back under itself so riders are momentarily tilted past straight-down and pointed slightly backward toward the structure. Gerstlauer’s Euro-Fighter model popularised the format with drops around 95–97°, and B&M and others have built dive coasters with similar overhanging first drops. Rides like Mumbo Jumbo and Takabisha have held records for the steepest such drops.',
    relatedTermIds: ['dive-coaster', 'euro-fighter', 'first-drop', 'gerstlauer'],
    aliases: ['Beyond Vertical Drop', 'Over-Vertical Drop', 'Beyond-Vertical Drops'],
  },
  {
    id: 'splashdown',
    name: 'Splashdown',
    shortDefinition:
      'The water-braking finale of a water ride or water coaster, where the boat hits a trough and throws up a wave.',
    definition:
      'A splashdown is the moment a boat or car plunges into a shallow channel of water at the bottom of a drop; the water slows the vehicle and throws up a curtain of spray. On water coasters and log flumes it is where riders get wet, and designers tune the depth and shape of the trough to control how drenched riders (and onlookers on nearby bridges) get.',
    relatedTermIds: ['water-coaster', 'log-flume', 'mack-rides'],
    aliases: ['Splash-down', 'Splashdowns', 'Water Splashdown'],
  },
  {
    id: 'quad-down',
    name: 'Quad-Down',
    shortDefinition:
      'A series of four descending hops in quick succession near the end of a layout, each with a pop of airtime.',
    definition:
      'A quad-down (and its smaller cousins the triple-down and double-down) is a stack of descending steps taken in quick succession, each giving a sharp pop of airtime as the train drops, levels briefly and drops again. Wooden and hybrid coasters use it to fit several pops of airtime into a compact footprint. It builds on the same idea as the camelback and the bunny hop, with the hops chained into one rapid sequence.',
    relatedTermIds: ['airtime', 'camelback', 'wooden-coaster'],
    aliases: ['Quad Down', 'Triple-Down', 'Double-Down'],
  },
  {
    id: 's-hill',
    name: 'S-Hill',
    shortDefinition: 'An S-shaped airtime hill that throws riders to one side as it lifts them.',
    definition:
      'An S-hill is an airtime hill built with an S-shaped curve, so as the train crests and floats it is also pushed laterally to one side and then the other. Riders get vertical airtime and a sideways snap at once. The element is common on modern wooden and hybrid coasters built for unpredictable, "out-of-control" pacing. It is closely related to the wave turn, which leans the airtime fully onto its side.',
    relatedTermIds: ['airtime', 'airtime-hill', 'wave-turn', 'bunnyhop'],
    aliases: ['S Hill', 'S-Hills', 'Speed Bump'],
  },
  {
    id: 'celestial-spin',
    name: 'Celestial Spin',
    shortDefinition:
      'A dual-track inversion by Mack Rides: two racing trains crest a shared hill while their tracks twist around each other, one rolling up, the other down.',
    definition:
      'A celestial spin is a dual-track inversion patented by Mack Rides and built for [Stardust Racers](/en/parks/north-america/united-states/orlando/universal-epic-universe/stardust-racers), the duelling launch coaster at [Universal Epic Universe](/en/parks/north-america/united-states/orlando/universal-epic-universe). As the two racing trains crest a shared hill, their tracks invert around one another: one train rolls upward through a zero-G roll while, at the very same moment, the other rolls downward through a barrel roll, and the cars appear to spiral around each other in mid-air.\n\nBecause both rolls are timed to the airtime hill, riders float through a long moment of weightlessness while the sister train twists past just metres away. Watch it head-on in the front view to see the two tracks wind around each other, switch to follow mode to track the duel, or ride onboard to feel your own horizon invert as the other train sweeps overhead. It is closely related to the zero-G roll, the inversion and the airtime hill.',
    relatedTermIds: ['zero-g-roll', 'airtime-hill', 'inversion', 'hangtime'],
    aliases: ['Celestial Roll', 'Celestial Rolls', 'Celestial Spins'],
    alternateNames: ['Celestial Roll'],
  },
  {
    id: 'launch',
    name: 'Launch',
    shortDefinition:
      'A propulsion section that accelerates the train to speed in seconds instead of hauling it up a lift hill.',
    definition:
      'A launch is the section of track where a coaster gets its energy from a motor rather than from gravity. Four technologies dominate. LSM (linear synchronous motor) launches line the track with electromagnets that pull on a fin under the train. They are smooth, precisely controllable and can be repeated mid-circuit, which is why almost every new launched coaster uses them. LIM (linear induction motor) launches work similarly but waste more energy as heat. Hydraulic launches use a winch driven by nitrogen-pressurised accumulators and give the hardest acceleration of the first three; compressed-air launches, used on Maxx Force, are faster still over the first metres.\n\nA launch also differs from a lift hill in where the energy can be spent. A lift hill has to be the highest point of the ride, so everything after it is downhill. A launch can sit anywhere, which is why multi-launch layouts like [Taron](/en/parks/europe/germany/bruehl/phantasialand/taron) at [Phantasialand](/en/parks/europe/germany/bruehl/phantasialand) or [Voltron Nevera](/en/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) at [Europa-Park](/en/parks/europe/germany/rust/europa-park) can stay fast for their whole length instead of trading height for speed once. A launch that fails to make it through the layout results in a rollback.',
    relatedTermIds: ['launch-coaster', 'lifthill', 'swing-launch', 'rollback', 'top-hat'],
    aliases: ['Launches', 'LSM launch', 'LIM launch'],
    alternateNames: ['Catapult Launch'],
  },
  {
    id: 'swing-launch',
    name: 'Swing Launch',
    shortDefinition:
      'A launch that fires the train back and forth several times, gaining speed on each pass before it finally clears the layout.',
    definition:
      'A swing launch (also called a shuttle or multi-pass launch) accelerates the train, lets it run out of speed on a rising section of track, and catches it again on the way back, two or three times over, until there is enough energy to complete the circuit. Each pass adds speed the launch motors alone could not deliver in one go, so a swing launch buys a much higher top speed out of a much shorter launch track.\n\nIt is also a show element in its own right: riders travel backwards through part of the layout, usually up a vertical spike, before being thrown forwards again. [Toutatis](/en/parks/europe/france/plailly/parc-asterix/toutatis) at Parc Astérix, [The Ride to Happiness](/en/parks/europe/belgium/de-panne/plopsaland-belgium/the-ride-to-happiness-by-tomorrowland) at Plopsaland and Hansa-Park’s [Oath of Kärnan](/en/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) all use one. Premier Rides’ Sky Rocket II model builds an entire compact coaster around the idea.',
    relatedTermIds: ['launch', 'spike', 'shuttle-coaster', 'launch-coaster'],
    aliases: ['Swing Launches', 'Shuttle Launch', 'Multi-pass launch'],
    alternateNames: ['Shuttle Launch'],
  },
  {
    id: 'vertical-lift',
    name: 'Vertical Lift',
    shortDefinition:
      'A lift hill that climbs at 90 degrees, hauling the train straight up the face of the structure.',
    definition:
      'A vertical lift replaces the usual 30-to-45-degree chain incline with a section of track that rises at a right angle to the ground. Because a conventional chain and anti-rollback dog cannot hold a train reliably on a vertical face, these lifts use a cable, a catch-car, or a chain with a positive-lock carriage instead. Riders end up lying on their backs looking straight at the sky for the length of the climb, which is exactly the effect the ride is buying.\n\nGerstlauer builds it into its Euro-Fighter and Infinity Coaster models, where it feeds directly into a beyond-vertical drop: [Takabisha](/en/parks/asia/japan/fujikawaguchiko/fuji-q-highland/takabisha-steepest-roller-coaster) at Fuji-Q Highland climbs vertically then drops at 121 degrees, the steepest drop on any steel coaster. Hansa-Park’s [Oath of Kärnan](/en/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) uses a 73-metre vertical lift inside a closed tower, so riders climb in the dark. Not to be confused with an elevator lift, where the whole piece of track rises with the train on it.',
    relatedTermIds: ['lifthill', 'beyond-vertical-drop', 'euro-fighter', 'anti-rollback'],
    aliases: ['Vertical Lifts', 'Vertical lift hill'],
    alternateNames: ['90° Lift Hill'],
  },
  {
    id: 'drop-track',
    name: 'Drop Track',
    shortDefinition:
      'A section of track that falls away with the train standing on it, so the floor of the ride drops from beneath you.',
    definition:
      'A drop track is a short, movable piece of track mounted on a hydraulic or electric platform. The train rolls onto it, stops, and the whole segment (rails, train and all) is released downwards, usually a few metres, before the track locks into a new alignment and the ride continues. Unlike a normal drop, the fall begins while the train is stationary and level, which is why it reads as the ground giving way rather than as a dive.\n\nIt is almost always a story beat rather than a thrill element: the effect only works if riders do not see it coming, so drop tracks live inside show buildings and tunnels. [Hagrid’s Magical Creatures Motorbike Adventure](/en/parks/north-america/united-states/orlando/universal-islands-of-adventure/hagrids-magical-creatures-motorbike-adventure) drops riders into darkness mid-layout, [Verbolten](/en/parks/north-america/united-states/williamsburg/busch-gardens-williamsburg/verbolten) at Busch Gardens Williamsburg drops them out of the Black Forest, and Harry Potter and the Escape from Gringotts uses one in its vault sequence.',
    relatedTermIds: ['switch-track', 'dark-ride', 'first-drop', 'indoor-coaster'],
    aliases: ['Drop Tracks', 'Drop-track'],
    alternateNames: ['Falling Track'],
  },
  {
    id: 'scorpion-tail',
    name: 'Scorpion Tail',
    shortDefinition:
      'A Mack Rides element: the track curls past vertical into an overhang, so the train climbs backwards up a 105-degree wall.',
    definition:
      'The scorpion tail is a launch spike that does not stop at vertical. Instead of rising to 90 degrees and holding the train there, the track curves through the vertical and leans back over itself into an overhang of roughly 105 degrees. A train launched into it climbs upside down and slightly backwards, hangs at the apex, and then falls back the way it came.\n\nMack Rides built the first one for [Voltron Nevera](/en/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) at [Europa-Park](/en/parks/europe/germany/rust/europa-park) in 2024, where it is the steepest launch section on any roller coaster in the world. The hangtime here comes with no forward motion at all: riders are held inverted at the top by nothing but the shape of the track and the train’s remaining momentum. The name comes from the silhouette, a tail curling up and over.',
    relatedTermIds: ['spike', 'swing-launch', 'launch', 'hangtime', 'mack-rides'],
    aliases: ['Scorpion Tails'],
  },
  {
    id: 'step-up-under-flip',
    name: 'Step-Up Under-Flip',
    shortDefinition:
      'An RMC inversion where the train climbs a banked hill, rolls over the top and drops out inverted on the far side.',
    definition:
      'A step-up under-flip is a two-stage inversion invented by Rocky Mountain Construction. The train first "steps up" a rising, heavily banked section and then flips underneath itself on the way down, so the roll happens on the descending half rather than at the crest. The result is a longer, slower rotation than a barrel roll and a hard shot of ejector airtime as the train falls out of it.\n\nIt appears on [Steel Vengeance](/en/parks/north-america/united-states/sandusky/cedar-point/steel-vengeance) at Cedar Point, [Zadra](/en/parks/europe/poland/zator/energylandia/zadra-rc) at Energylandia and [Untamed](/en/parks/europe/netherlands/biddinghuizen/walibi-holland/untamed) at Walibi Holland, the first RMC conversion in Europe. Because the manoeuvre needs precisely twisted steel track on a wooden or steel support structure, it is effectively impossible on traditional wooden track.',
    relatedTermIds: [
      'rmc',
      'hybrid-coaster',
      'inversion',
      'ejector-airtime',
      'twisted-horseshoe-roll',
    ],
    aliases: ['Step Up Under Flip', 'Step-up under flips'],
  },
  {
    id: 'twisted-horseshoe-roll',
    name: 'Twisted Horseshoe Roll',
    shortDefinition:
      'An RMC element: a 180-degree horseshoe turn with a barrel roll built into each half, so the train inverts twice while reversing direction.',
    definition:
      'A twisted horseshoe roll takes the horseshoe (a tight 180-degree turnaround that sends the train back the way it came) and threads an inversion into both legs. The train rolls over on the way into the turn, travels through the horseshoe, and rolls again on the way out. Two inversions and a full change of direction happen in one continuous, unusually drawn-out manoeuvre.\n\nRocky Mountain Construction introduced it on Outlaw Run at Silver Dollar City, the first wooden coaster ever to carry a double barrel roll, and has since built it into [Steel Vengeance](/en/parks/north-america/united-states/sandusky/cedar-point/steel-vengeance), [Zadra](/en/parks/europe/poland/zator/energylandia/zadra-rc), [Iron Gwazi](/en/parks/north-america/united-states/tampa/busch-gardens-tampa/iron-gwazi) and [Untamed](/en/parks/europe/netherlands/biddinghuizen/walibi-holland/untamed). Riders spend most of the element sideways or upside down with very little G-force, which is why it produces so much hangtime.',
    relatedTermIds: ['horseshoe', 'rmc', 'inversion', 'hangtime', 'step-up-under-flip'],
    aliases: ['Twisted Horseshoe Rolls', 'Double barrel roll'],
  },
  {
    id: 'double-down',
    name: 'Double Down',
    shortDefinition:
      'A drop interrupted halfway by a short level section, so it delivers two separate hits of airtime instead of one.',
    definition:
      'A double down is a descent split into two stages: the track drops, briefly flattens or even rises a fraction, then drops again. Each transition throws riders out of their seats, so a single hill produces two distinct pops of airtime rather than one long float. The mirror-image element, a double up, does the same thing on the way up a hill.\n\nIt is one of the oldest tricks in wooden coaster design: [Jack Rabbit](/en/parks/north-america/united-states/west-mifflin/kennywood/jack-rabbit) at Kennywood has been throwing riders out of their seats with its double dip since 1920. Modern wooden and hybrid layouts still lean on it: [Colossos](/en/parks/europe/germany/soltau/heide-park/colossos-kampf-der-giganten) at Heide-Park, [Balder](/en/parks/europe/sweden/gothenburg/liseberg/balder) at Liseberg and [Troy](/en/parks/europe/netherlands/sevenum/attractiepark-toverland/troy) at Toverland all finish drops this way. Stretch the idea further and you get a quad-down: four stages in one descent.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'quad-down', 'camelback', 'wooden-coaster'],
    aliases: ['Double Downs', 'Double dip', 'Double-down'],
    alternateNames: ['Double Dip'],
  },
  {
    id: 'switch-track',
    name: 'Switch Track',
    shortDefinition:
      'A movable section of track that redirects the train onto a different path, for backwards sections, branching layouts and maintenance sidings.',
    definition:
      'A switch track is the coaster equivalent of a railway point: a length of track that slides, pivots or rotates to connect the main circuit to a second path. Mechanically it is straightforward; what it buys is layout freedom. A switch lets a train be sent backwards through a section it has already ridden, lets a ride offer two different routes from the same station, or simply lets trains be pulled off the circuit into a transfer shed at closing time.\n\nAs a show element it is usually about surprise. [Expedition Everest](/en/parks/north-america/united-states/orlando/disneys-animal-kingdom-theme-park/expedition-everest-legend-of-the-forbidden-mountain) reveals torn-up track ahead, then sends the train backwards down the mountain. [Big Grizzly Mountain](/en/parks/asia/hong-kong/hong-kong/hong-kong-disneyland-park/big-grizzly-mountain-runaway-mine-cars) at Hong Kong Disneyland uses two. Bobbejaanland’s [Fury](/en/parks/europe/belgium/kasterlee/bobbejaanland/fury) uses one to give riders a forwards or a backwards ride from the same layout.',
    relatedTermIds: ['drop-track', 'turntable', 'block-brake', 'dark-ride'],
    aliases: ['Switch Tracks', 'Track switch'],
    alternateNames: ['Transfer Track'],
  },
  {
    id: 'turntable',
    name: 'Turntable',
    shortDefinition:
      'A rotating platform in the circuit that spins the train on the spot, usually to send it back out in the other direction.',
    definition:
      'A turntable is a piece of track mounted on a rotating disc. The train rolls on, the disc turns (180 degrees most often) and the train rolls off facing the other way. Because the rotation happens with the train stopped, it is a quiet moment by design: it lets a ride reverse direction without a shuttle spike or a switch track, and gives the show a beat where riders can be shown something.\n\nOn [Voltron Nevera](/en/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) at Europa-Park the turntable sets up a backwards launch, and on many dark rides it is used to face riders towards a scene at exactly the right moment. Trackless dark rides achieve the same effect without any special hardware, since their vehicles can rotate freely at any point.',
    relatedTermIds: ['switch-track', 'swing-launch', 'trackless-ride', 'dark-ride'],
    aliases: ['Turntables'],
  },
  {
    id: 'treble-clef',
    name: 'Treble Clef',
    shortDefinition:
      'A non-inverting element shaped like the musical symbol: the track loops over itself and threads back through its own curve.',
    definition:
      'A treble clef is a stacked, self-crossing curve: the train climbs into a loop, crosses over its own track and exits through the middle of the shape, tracing something close to the outline of the musical symbol. It is not an inversion: the train stays upright throughout, held by heavy banking rather than by going upside down. What riders feel is a long, disorienting sweep with the track passing very close overhead and underneath.\n\nThe element was built by Maurer Rides for [Hollywood Rip Ride Rockit](/en/parks/north-america/united-states/orlando/universal-studios-florida/hollywood-rip-ride-rockit) at Universal Studios Florida, whose layout is themed to music and names its figures accordingly; the treble clef follows the ride’s "double take" non-inverting loop. It remains a one-off.',
    relatedTermIds: ['non-inverting-loop', 'maurer-rides', 'overbank', 'inversion'],
    aliases: ['Treble Clefs'],
  },
  {
    id: 'indoor-coaster',
    name: 'Indoor Coaster',
    shortDefinition:
      'A roller coaster built entirely inside a building, where lighting, sound and set dressing replace the view.',
    definition:
      'An indoor coaster runs its whole circuit inside an enclosed show building. Removing daylight changes the ride fundamentally: riders lose the visual cues that let them anticipate a drop or a turn, so a modest layout feels far more intense than the same track outdoors. It also hands the designer complete control of lighting, projection, sound and scenery, which is why the format is the natural home of the coaster-dark-ride hybrid.\n\nSpace Mountain is the archetype: [Disneyland](/en/parks/north-america/united-states/anaheim/disneyland-park/space-mountain) opened its version in 1977, and the family of rides is still the most-copied dark coaster in the world. European examples are [Eurosat](/en/parks/europe/germany/rust/europa-park/eurosat-cancan-coaster) and [Euro-Mir](/en/parks/europe/germany/rust/europa-park/euro-mir) at Europa-Park, Efteling’s [Vogel Rok](/en/parks/europe/netherlands/kaatsheuvel/efteling/vogel-rok), and Phantasialand’s [Crazy Bats](/en/parks/europe/germany/bruehl/phantasialand/crazy-bats), still the longest indoor coaster anywhere.',
    relatedTermIds: ['dark-ride', 'show-building', 'projection-mapping', 'vr-coaster'],
    aliases: ['Indoor Coasters', 'Indoor roller coaster'],
    alternateNames: ['Enclosed Coaster'],
  },
  {
    id: 'family-coaster',
    name: 'Family Coaster',
    shortDefinition:
      'A coaster designed so children and adults can ride together, with moderate forces, a low height limit and no inversions.',
    definition:
      'A family coaster is built for the widest possible range of riders. Height requirements typically start around 100–110 cm (often with an accompanying adult below that), speeds stay under about 60 km/h, and layouts avoid inversions and sustained high G-forces. A good family coaster still has airtime and pacing, within a much narrower envelope.\n\nCommercially they are among the most valuable rides a park can buy, because a whole group can ride together and the queue never empties. Vekoma’s Family Boomerang, Mack’s Youngstar and Zierer’s Tivoli are the workhorse models; [Pegasus](/en/parks/europe/germany/rust/europa-park/pegasus) at Europa-Park, [Raik](/en/parks/europe/germany/bruehl/phantasialand/raik) at Phantasialand and [Slinky Dog Dash](/en/parks/north-america/united-states/orlando/disneys-hollywood-studios/slinky-dog-dash) at Disney’s Hollywood Studios are all built to this brief.',
    relatedTermIds: ['height-requirement', 'mine-train', 'wild-mouse', 'launch-coaster'],
    aliases: ['Family Coasters', 'Junior coaster'],
    alternateNames: ['Junior Coaster'],
  },
  {
    id: 'motorbike-coaster',
    name: 'Motorbike Coaster',
    shortDefinition:
      'A coaster ridden astride, motorcycle-style, with riders leaning forward over handlebars in single file.',
    definition:
      'On a motorbike coaster riders straddle the vehicle rather than sitting in it, gripping handlebars and leaning forward with their feet on pegs. The seating changes the whole experience: the centre of gravity sits low and directly over the rails, so banked turns and lateral forces read as leaning into a corner. It also means the trains are long and narrow, and capacity per vehicle is low.\n\nVekoma built the first with Booster Bike at [Toverland](/en/parks/europe/netherlands/sevenum/attractiepark-toverland/booster-bike) in 2004; Intamin took the idea furthest on [Hagrid’s Magical Creatures Motorbike Adventure](/en/parks/north-america/united-states/orlando/universal-islands-of-adventure/hagrids-magical-creatures-motorbike-adventure), which adds a sidecar so non-straddling riders can join. Disney’s [TRON Lightcycle / Run](/en/parks/north-america/united-states/orlando/magic-kingdom-park/tron-lightcycle-run) uses the same posture with an enclosed canopy over each rider.',
    relatedTermIds: ['launch-coaster', 'vekoma', 'intamin', 'suspended-coaster'],
    aliases: ['Motorbike Coasters', 'Motorcycle coaster'],
    alternateNames: ['Motorcycle Coaster'],
  },
  {
    id: 'infinity-coaster',
    name: 'Infinity Coaster',
    shortDefinition:
      'Gerstlauer’s successor to the Euro-Fighter: the same steep drops and compact footprint, but with open, stadium-style trains.',
    definition:
      'The Infinity Coaster is Gerstlauer’s current custom-coaster platform. It keeps the Euro-Fighter’s beyond-vertical drops, vertical lifts and layouts that fit into very little land, and replaces the boxy four-seat cars with longer, lower trains that have open sides and vest restraints instead of over-the-shoulder harnesses. The result rides noticeably smoother and lets the designer use more airtime hills, which the older model handled badly.\n\nThe range covers everything from compact park-filler coasters to record-holders: [The Smiler](/en/parks/europe/united-kingdom/farley/alton-towers/the-smiler) at Alton Towers holds the world record for inversions with fourteen, Hansa-Park’s [Oath of Kärnan](/en/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) pairs a 73-metre vertical lift with a swing launch, and [Star Trek: Operation Enterprise](/en/parks/europe/germany/bottrop/movie-park-germany/star-trek-operation-enterprise) at Movie Park Germany runs the model as a multi-launch shuttle.',
    relatedTermIds: ['gerstlauer', 'euro-fighter', 'beyond-vertical-drop', 'vertical-lift'],
    aliases: ['Infinity Coasters'],
  },
  {
    id: 'interactive-dark-ride',
    name: 'Interactive Dark Ride',
    shortDefinition:
      'A dark ride where riders shoot, aim or otherwise play along, and the ride keeps score.',
    definition:
      'An interactive dark ride hands riders a device (usually an infrared blaster, sometimes a touchscreen or just their hands) and builds the show around what they do with it. Targets in each scene register hits and feed a per-rider score displayed at the end. The score gives people a reason to ride again and again, and operators keep building them.\n\nThe genre splits into two schools. Physical rides shoot at real, animated set pieces: [Maus au Chocolat](/en/parks/europe/germany/bruehl/phantasialand/maus-au-chocolat) at Phantasialand and [Men in Black: Alien Attack](/en/parks/north-america/united-states/orlando/universal-studios-florida/men-in-black-alien-attack) at Universal Studios Florida. Screen-based rides shoot at projected targets, which allows far more elaborate effects: [Toy Story Mania](/en/parks/north-america/united-states/orlando/disneys-hollywood-studios/toy-story-mania) and [WEB SLINGERS](/en/parks/north-america/united-states/anaheim/disney-california-adventure-park/web-slingers-a-spider-man-adventure), which tracks riders’ hand movements with no blaster at all.',
    relatedTermIds: ['dark-ride', 'animatronics', 'projection-mapping', 'trackless-ride'],
    aliases: ['Interactive Dark Rides', 'Shooting dark ride'],
    alternateNames: ['Shooting Dark Ride'],
  },
  {
    id: 'madhouse',
    name: 'Madhouse',
    shortDefinition:
      'An attraction where the room rotates around a gently swinging bench, convincing riders they are being turned upside down.',
    definition:
      'A madhouse is an illusion built out of one trick: the seating swings by only a few degrees, while the entire room around it rotates a full 360 degrees. With no fixed visual reference (the walls, ceiling and props all move together), the brain reads the motion as the bench turning over. Riders are certain they have been inverted; they never leave a shallow arc.\n\nVekoma made the format common after building [Villa Volta](/en/parks/europe/netherlands/kaatsheuvel/efteling/villa-volta) for Efteling in 1996, and the ride system is often just called a "Vekoma Madhouse". Phantasialand’s [Feng Ju Palace](/en/parks/europe/germany/bruehl/phantasialand/feng-ju-palace), Europa-Park’s [Cassandra’s Curse](/en/parks/europe/germany/rust/europa-park/cassandras-curse) and Toverland’s [Villa Fiasko](/en/parks/europe/netherlands/sevenum/attractiepark-toverland/villa-fiasko) all run the same system behind different stories.',
    relatedTermIds: ['dark-ride', 'vekoma', 'pre-show', 'animatronics'],
    aliases: ['Madhouses', 'Haunted swing'],
    alternateNames: ['Haunted Swing'],
  },
  {
    id: 'boat-ride',
    name: 'Boat Ride',
    shortDefinition:
      'A dark ride where guests travel by boat through a water channel rather than on a track.',
    definition:
      'A boat ride carries guests through the show in a flume of water, usually guided by an underwater track or by the channel walls themselves. Water buys two things a track cannot: capacity, because long boats load quickly and run close together, and quiet, because there is no drive mechanism under the guest to be heard over the show. That is why so many of the largest and longest-running dark rides in the world are boat rides.\n\nMany of the classics are: [Pirates of the Caribbean](/en/parks/north-america/united-states/anaheim/disneyland-park/pirates-of-the-caribbean), ["it’s a small world"](/en/parks/north-america/united-states/anaheim/disneyland-park/its-a-small-world-holiday), Efteling’s [Fata Morgana](/en/parks/europe/netherlands/kaatsheuvel/efteling/fata-morgana) and Europa-Park’s [Pirates in Batavia](/en/parks/europe/germany/rust/europa-park/pirates-in-batavia). Shanghai Disneyland’s Pirates of the Caribbean goes further still, putting the boats on a trackless magnetic drive so they can rotate and move sideways.',
    relatedTermIds: ['dark-ride', 'animatronics', 'trackless-ride', 'log-flume', 'water-ride'],
    aliases: ['Boat Rides', 'Water dark ride'],
  },
  {
    id: 'shoot-the-chute',
    name: 'Shoot-the-Chute',
    shortDefinition:
      'A large-boat water ride built around one big drop into a trough, throwing a wall of water over the splashdown bridge.',
    definition:
      'A shoot-the-chute takes a wide, flat-bottomed boat holding twenty or more people up a single lift and drops it down one steep chute into a shallow trough. The boat displaces an enormous amount of water on impact, which is the point: the splash is aimed at a viewing bridge as much as at the riders. Unlike a log flume, which strings several small drops through a long meandering course, a shoot-the-chute is built around one drop and one splash.\n\nA shoot-the-chute is usually the main ride of its themed area: [Jurassic Park River Adventure](/en/parks/north-america/united-states/orlando/universal-islands-of-adventure/jurassic-park-river-adventure) at Islands of Adventure runs a full dark ride before the 26-metre drop, and Europa-Park’s [Atlantica SuperSplash](/en/parks/europe/germany/rust/europa-park/atlantica-supersplash) combines it with a water-coaster layout.',
    relatedTermIds: ['log-flume', 'water-ride', 'splashdown', 'water-coaster'],
    aliases: ['Shoot the Chutes', 'Shoot-the-chutes'],
    alternateNames: ['Splash Boat'],
  },
  {
    id: 'people-mover',
    name: 'People Mover',
    shortDefinition:
      'A continuously moving transport ride that carries guests slowly through or above a themed area.',
    definition:
      'A people mover is a low-speed, high-capacity transport attraction: an unbroken chain of vehicles moving at walking pace, often on an elevated beam, with a moving-platform station so it never has to stop. In a park it does double duty: transport between areas, and a slow overview ride past the land and, often, through the interiors of other attractions.\n\nThe Tomorrowland Transit Authority PeopleMover at [Magic Kingdom](/en/parks/north-america/united-states/orlando/magic-kingdom-park/tomorrowland-transit-authority-peoplemover) still runs, gliding through the Space Mountain show building on its circuit. The linear-induction drive it uses was later licensed for real urban transit systems. Universal’s Villain-Con Minion Blast adapts the same idea to a moving walkway.',
    relatedTermIds: ['dark-ride', 'omnimover', 'observation-tower', 'walkthrough'],
    aliases: ['People Movers', 'Peoplemover'],
    alternateNames: ['Transit System'],
  },
  {
    id: 'bumper-cars',
    name: 'Bumper Cars',
    shortDefinition:
      'A flat ride where guests drive small electric cars around a metal floor and crash into each other on purpose.',
    definition:
      'Bumper cars run on a steel floor with a conductive ceiling grid: a pole on each car picks up current from above and returns it through the floor, so the vehicles can be driven freely without batteries or a track. Heavy rubber bumpers absorb the collisions the whole ride is built around. Modern installations increasingly use floor-pickup or battery-powered cars, which removes the overhead grid and frees the designer to theme the ceiling.\n\nIt is one of the oldest ride types still in continuous production (the Lusse Auto-Skooter dates to the 1920s), and one of the few where riders control what happens. Nearly every full-size park runs a set, from Phantasialand’s [Bumper Klumpen](/en/parks/europe/germany/bruehl/phantasialand/bumper-klumpen) to Europa-Park’s Lada Autodrom.',
    relatedTermIds: ['flat-ride', 'funhouse', 'carousel'],
    aliases: ['Bumper Car', 'Dodgems', 'Autoscooter'],
    alternateNames: ['Dodgems', 'Autoscooter'],
  },
  {
    id: 'observation-tower',
    name: 'Observation Tower',
    shortDefinition:
      'A tower ride that lifts a rotating cabin slowly to the top for the view, with no drop involved.',
    definition:
      'An observation tower carries a glazed or open gondola up a central column, usually rotating as it climbs so every seat gets the full panorama, holds at the top, and lowers again. Mechanically it is a close cousin of the drop tower, and the two are often confused. The difference is one of intent: an observation tower is built to be looked out of, a drop tower to be fallen from.\n\nIn a park it is a landmark first and a ride second, a fixed point on the skyline that can be seen from the car park. The [Euro-Tower](/en/parks/europe/germany/rust/europa-park/euro-tower) at Europa-Park has stood there since 1979.',
    relatedTermIds: ['drop-tower', 'ferris-wheel', 'flat-ride', 'people-mover'],
    aliases: ['Observation Towers', 'Gyro tower'],
    alternateNames: ['Gyro Tower'],
  },
  {
    id: 'wdi',
    name: 'Walt Disney Imagineering',
    shortDefinition:
      'Disney’s in-house design and engineering arm, the group that invents, designs and builds every Disney park attraction.',
    definition:
      'Walt Disney Imagineering (WDI) is the division that designs and builds Disney’s parks, from the master plan of a land down to the mechanism inside a single figure. Founded in 1952 as WED Enterprises to build Disneyland, it is unusual in the industry for combining show design, architecture, ride engineering and software under one roof: the same organisation that writes the story also builds the vehicle that tells it.\n\nMany of its inventions are now standard in other parks: Audio-Animatronics, the Omnimover (a continuously moving car that rotates to point riders at each scene), the trackless ride system first used on [Pooh’s Hunny Hunt](/en/parks/asia/japan/tokyo/tokyo-disneyland/poohs-hunny-hunt), and the tubular steel coaster track that Arrow built for the [Matterhorn Bobsleds](/en/parks/north-america/united-states/anaheim/disneyland-park/matterhorn-bobsleds) in 1959 and that every steel coaster since has descended from. Where a Disney ride carries an outside manufacturer, WDI has usually still designed the show around it.',
    relatedTermIds: ['omnimover', 'trackless-ride', 'animatronics', 'dark-ride', 'arrow-dynamics'],
    aliases: ['WDI', 'Imagineering', 'Imagineers', 'WED Enterprises'],
    alternateNames: ['WDI', 'Imagineering'],
  },
  {
    id: 'brogent',
    name: 'Brogent Technologies',
    shortDefinition:
      'Taiwanese manufacturer of the i-Ride flying theatre system used by most non-Disney flying theatres worldwide.',
    definition:
      'Brogent Technologies, founded in Kaohsiung in 2001, builds the i-Ride flying theatre: a suspended seating gondola that swings out over a large spherical screen with riders’ feet dangling, synchronised with wind, scent and mist effects. Where Disney’s Soarin’ established the format, Brogent industrialised it: the i-Ride is the system most parks buy when they want a flying theatre, and it now runs on every continent.\n\nIn Europe it runs [Voletarium](/en/parks/europe/germany/rust/europa-park/voletarium) at Europa-Park, which flies over the continent’s landmarks with two theatres running in parallel for capacity. The company also builds smaller media-based ride systems and dome attractions.',
    relatedTermIds: ['flying-theater', 'motion-simulator', 'projection-mapping', 'pre-show'],
    aliases: ['Brogent', 'i-Ride'],
    alternateNames: ['Brogent'],
  },
  {
    id: 'quick-pass',
    name: 'QUICK Pass',
    shortDefinition:
      'Phantasialand’s paid queue-jump product, bought per attraction rather than per day.',
    definition:
      'The QUICK Pass is Phantasialand’s paid way past the queue. Unlike at most parks, it is sold per attraction instead of per day, for rides such as Taron, Black Mamba, Chiapas, Talocan and Maus au Chocolat.\n\nIt is bought in the park’s app or in the park itself, and the price per attraction is fixed; it does not move with the crowds.\n\nThe pass shortens the wait: the QUICK Pass entrance has a queue too, only a much shorter one.',
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time', 'fastpass'],
    aliases: ['Quick Pass', 'QuickPass'],
  },
  {
    id: 'virtual-line',
    name: 'VirtualLine',
    shortDefinition: 'Europa-Park’s free virtual queue, reserved in the park’s own app.',
    definition:
      'VirtualLine is Europa-Park’s free reservation service: in the Europa-Park & Rulantica app you book a time slot for a selected attraction and enter through a shortened queue during that slot. Until then you can ride other attractions, watch a show or eat.\n\nIt is offered for blue fire Megacoaster, Euro-Mir, Pirates in Batavia, Poseidon, Voletarium, Voltron Nevera powered by Rimac and WODAN – Timburcoaster. The number of slots per day is limited.\n\nIt costs nothing, unlike a fast pass: VirtualLine moves the waiting out of the queue instead of selling a way past it.',
    relatedTermIds: ['virtual-queue', 'return-time', 'boarding-group', 'wait-time'],
    aliases: ['Virtual Line'],
  },
  {
    id: 'fast-lane',
    name: 'Fast Lane',
    shortDefinition: 'The paid front-of-line pass, usually bought for a whole day of the visit.',
    definition:
      'Fast Lane is what the queue-jump product is called across many Six Flags and Walibi parks, from Cedar Point to Walibi Holland. It is bought for the visit rather than for a single ride: a wristband or digital ticket opens the Fast Lane entrance of the included attractions all day.\n\nThere are usually tiers. At Walibi Holland they are Gold (unlimited, around 90 % less waiting), Silver and Bronze, plus single shots for one or four rides. Which rides are included is up to the park; haunted houses are frequently excluded.\n\nBecause the price covers the day rather than the ride, park.fan shows a "from" price on those rides instead of a fixed one.',
    relatedTermIds: ['express-pass', 'quick-pass', 'wait-time', 'single-rider'],
    aliases: ['Fastlane'],
  },
  {
    id: 'speedy-pass',
    name: 'Speedy Pass',
    shortDefinition: 'Movie Park Germany’s paid virtual queue service.',
    definition:
      'The Speedy Pass is Movie Park Germany’s queue-jump product. It works as a virtual queue: you reserve a ride on one of the included attractions from your phone and enter through a separate entrance at the reserved time.\n\nIt comes in tiers, from Speedy Pass One Ride for a single attraction up to Gold and Platinum, which cover nearly everything. It applies to more than 25 attractions; a few houses and special attractions are excluded.',
    relatedTermIds: ['virtual-queue', 'express-pass', 'quick-pass', 'wait-time'],
    aliases: ['Speedypass'],
  },
  {
    id: 'fastrack',
    name: 'Fastrack',
    shortDefinition: 'The paid skip-the-line ticket at the Merlin parks, such as Alton Towers.',
    definition:
      'Fastrack is the name the UK Merlin parks (Alton Towers, Thorpe Park, Chessington) use for their paid access past the queue. It is sold for a single ride or as a package: Bronze for a chosen handful of rides, Silver for one ride on every included attraction, Gold for unlimited use.\n\nFastrack is always an additional ticket: park admission is not included.',
    relatedTermIds: ['express-pass', 'quick-pass', 'wait-time'],
    aliases: ['Fast Track', 'Fasttrack'],
  },
  {
    id: 'premier-access',
    name: 'Disney Premier Access',
    shortDefinition: 'Disney’s paid skip-the-line outside the US, bought per attraction.',
    definition:
      'Disney Premier Access is what the US parks call Lightning Lane: paid access past the queue, at Disneyland Paris and Tokyo Disney Resort.\n\nPremier Access One is bought per attraction, usually on the day of the visit through the app, and the price depends on the date and the attraction; it is noticeably higher for new ones. Premier Access Ultimate covers every participating attraction once.\n\nBecause the price is set anew each day, park.fan carries no fixed price on those rides.',
    relatedTermIds: ['lightning-lane', 'express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['Premier Access'],
  },
  {
    id: 'headliner',
    name: 'Headliner',
    shortDefinition:
      'The attraction people pick the park for in the first place, usually its newest or largest ride.',
    definition:
      'A headliner is the attraction a park goes on a travel list for: the newest coaster, the most expensive dark ride, whatever is on the poster. Parks build one roughly every five to ten years, and in its opening season it pulls a substantial share of everyone who comes through the gate.\n\nFor planning a day it is the single biggest item. A headliner collects the park’s longest queue and often holds it from opening until evening, while the rest of the place is still empty in the morning. That is why it sits at the top of almost every recommendation: the headliner first, then everything else. The exception is a virtual queue, which pins it to a time slot anyway.\n\npark.fan marks headliners in a park’s attraction list and lifts them in the wait-time ranking. Whether a ride counts as one is curated rather than derived from its queue: a ride can have a long line on a given day without anybody travelling for it.',
    aliases: ['Headliner attraction', 'Marquee attraction'],
    relatedTermIds: ['wait-time', 'crowd-level', 'rope-drop', 'virtual-queue', 'peak-day'],
  },
];

export default translations;
