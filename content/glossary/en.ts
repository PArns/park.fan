import type { GlossaryTermTranslation } from '@/lib/glossary/types';

const translations: GlossaryTermTranslation[] = [
  {
    id: 'wait-time',
    name: 'Wait Time',
    shortDefinition: 'The estimated duration a guest must queue before boarding an attraction.',
    definition:
      'Wait time (also called queue time) is the estimated duration a guest must stand in line before boarding a ride or attraction. Parks post wait times at ride entrances and on their official apps, calculating the figure from queue length sensors, historical throughput data, and current loading efficiency. On busy days a single popular attraction can show waits of 90 minutes or more, making real-time data invaluable for planning your day.\n\npark.fan tracks live wait times updated every few minutes so you can monitor conditions across all attractions simultaneously. By comparing wait times across a park in real time you can identify which rides are experiencing temporary lulls and which have built up long queues — and act accordingly. Combining live wait data with the crowd calendar gives you the full picture before you even arrive at the gate.',
    relatedTermIds: ['posted-wait-time', 'virtual-queue', 'single-rider', 'express-pass'],
    aliases: ['Wait Times'],
  },
  {
    id: 'single-rider',
    name: 'Single Rider',
    shortDefinition:
      'A separate, faster queue lane for guests willing to ride alone and fill odd empty seats.',
    definition:
      'Single rider queues allow guests who are comfortable riding alone — or separated from their group — to fill odd seats left over in ride vehicles. Because single riders slot into gaps rather than waiting for an entire row to fill, the line moves dramatically faster than the standby queue, often cutting wait times by 50–70%. Rides with large multi-row vehicles, such as roller coasters and simulator attractions, benefit the most from this system.\n\nNot every park or attraction offers single rider access. Where available it is one of the most cost-free strategies for reducing your daily queue time. The trade-off is that you may not sit alongside your companions, so it works best for larger thrill rides where the experience is largely individual. Always check the ride entrance signage or the park app before committing to the single rider lane.',
    alternateNames: ['Single Rider Lane', 'Solo rider queue'],
    relatedTermIds: ['wait-time', 'express-pass', 'virtual-queue'],
  },
  {
    id: 'virtual-queue',
    name: 'Virtual Queue',
    shortDefinition:
      'A digital queuing system where guests reserve a timed return slot instead of waiting in a physical line.',
    definition:
      "A virtual queue (sometimes called a boarding group or return time) lets guests register for a ride via a park app or kiosk and receive a notification when their turn is approaching. Instead of standing in a physical queue, guests can explore other attractions, eat, or rest until their group is called. Parks use virtual queues for their highest-demand new attractions where physical queuing would create dangerous or unmanageable crowd concentrations.\n\nVirtual queues typically open at a fixed time — often the moment the park gates open — and can fill within minutes on busy days. Disney has used the system for Star Wars: Rise of the Resistance and Tron Lightcycle Run; Universal introduced it for Hagrid's Magical Creatures Motorbike Adventure. The key planning insight is that securing a virtual queue spot is often the very first thing you should do upon entering the park, before visiting any other attraction.",
    relatedTermIds: ['express-pass', 'wait-time', 'single-rider'],
    aliases: ['Virtual Queues'],
  },
  {
    id: 'express-pass',
    name: 'Express Pass',
    shortDefinition:
      'A paid or included ticket upgrade granting access to a dedicated, shorter priority queue.',
    definition:
      "An Express Pass (the exact name varies by park — Universal Express, Disney Lightning Lane, Six Flags Flash Pass, etc.) is a ticket upgrade allowing holders to use a dedicated priority entrance with significantly shorter wait times. Some parks include express access in premium resort hotel packages; others sell it as a daily add-on with dynamic pricing that rises as the park gets busier. At Universal Studios parks, the unlimited Express Pass effectively allows guests to re-ride the same attraction multiple times throughout the day.\n\nWhether an Express Pass is worth the cost depends heavily on crowd levels. On a quiet day with 20-minute standby waits, a premium pass offers limited value. On a peak day with 90-minute queues, the math changes dramatically. Use park.fan's crowd calendar to forecast the busyness of your chosen visit date before deciding whether to purchase.",
    relatedTermIds: ['virtual-queue', 'single-rider', 'wait-time'],
  },
  {
    id: 'posted-wait-time',
    name: 'Posted Wait Time',
    shortDefinition:
      'The official wait time displayed by the park at a ride entrance or in its app.',
    definition:
      "The posted wait time is the official estimate displayed on signs at the physical entrance of a ride and in the park's official app. Parks calculate this figure using queue length sensors, historical throughput data, and current loading efficiency. Posted times are typically rounded to the nearest 5 or 10 minutes and can sometimes differ from the actual experienced wait — parks occasionally overestimate to manage expectations, or underestimate when queues unexpectedly lengthen.\n\nPark.fan aggregates posted wait times from official sources every few minutes, giving you a live picture of conditions across all tracked attractions. Comparing posted times across different attractions at the same moment is one of the simplest and most effective ways to decide which ride to head to next during your visit.",
    relatedTermIds: ['wait-time', 'crowd-level'],
  },
  {
    id: 'crowd-level',
    name: 'Crowd Level',
    shortDefinition:
      'A scale measuring how busy a theme park is on a given day, from Very Low to Extreme.',
    definition:
      "Crowd level describes the overall visitor density at a park on a given day or time. park.fan uses a scale from Very Low to Extreme based on historical wait time data, current occupancy patterns, and AI-driven predictions. A Very Low day means short queues across almost all attractions, a relaxed atmosphere, and manageable crowds at restaurants. An Extreme day means the park is operating near maximum capacity, with waits of 90 minutes or more for popular rides and queues forming even at quick-service food outlets.\n\nCrowd levels are shaped by school holidays, public holidays, special events (fireworks, Halloween nights), seasonal patterns, and even weather forecasts. Understanding how these factors combine is essential for planning a visit that matches your priorities. park.fan's crowd calendar presents this data in an easy day-by-day view so you can identify windows of lower attendance weeks or months in advance.",
    relatedTermIds: ['crowd-calendar', 'peak-day', 'wait-time'],
    aliases: ['Crowd Levels'],
  },
  {
    id: 'crowd-calendar',
    name: 'Crowd Calendar',
    shortDefinition:
      'A day-by-day forecast of predicted crowd levels, helping guests find the quietest times to visit.',
    definition:
      'A crowd calendar is a month-by-month or year-view calendar showing predicted crowd levels for each day at a specific park. park.fan generates crowd calendars using AI models trained on years of historical wait time data, cross-referenced with school holiday schedules across multiple countries, upcoming events, park operating hours, and seasonal trends. Green days indicate low predicted crowds; orange and red days flag high visitor numbers.\n\nFor visitors with flexible dates, the crowd calendar is one of the most powerful tools available. Shifting a visit by even one or two days can mean the difference between 30-minute queues and 90-minute queues for the same attraction. Families planning around school holidays can use the calendar to identify whether specific holiday weeks are historically busier or quieter than others at their chosen park.',
    relatedTermIds: ['crowd-level', 'peak-day', 'rope-drop'],
  },
  {
    id: 'peak-day',
    name: 'Peak Day',
    shortDefinition:
      "A day when visitor attendance reaches or approaches a park's maximum capacity.",
    definition:
      "A peak day is any day when visitor attendance is at or near a park's maximum capacity. Common peak days include major public holidays (Christmas, Easter, school summer breaks), special event days (Halloween nights, New Year's Eve fireworks), and school vacation weeks. On peak days at major European parks like Disneyland Paris or Europa-Park, wait times for headline attractions regularly exceed 90–120 minutes, restaurant queues form well before noon, and every area of the park feels congested.\n\nSome peak days are predictable years in advance — Christmas week, the first week of the summer holidays — while others emerge from unexpected circumstances like unusually good weather on an otherwise shoulder-season day. park.fan highlights peak days prominently in the crowd calendar so you can plan around them or, if you must visit on a peak day, equip yourself with the right strategies: rope drop, express pass, single rider lanes, and a smart touring plan.",
    relatedTermIds: ['crowd-level', 'crowd-calendar', 'rope-drop'],
  },
  {
    id: 'refurbishment',
    name: 'Refurbishment',
    shortDefinition:
      'A planned maintenance closure during which a ride or area undergoes repairs or upgrades.',
    definition:
      'A refurbishment (often called a "rehab" by enthusiasts) is a scheduled maintenance or renovation period during which a ride, show, or area of the park is temporarily closed. Refurbishments can last from a few days to several months and are typically planned for the off-season to minimise visitor impact. Parks usually publish refurbishment schedules in advance, though the dates can shift. Major parks like Disney and Universal schedule annual maintenance windows for each attraction, often rotating closures so that different rides are refurbished each year.\n\nRefurbishments are important planning considerations — discovering that your most anticipated ride is closed upon arrival can be deeply frustrating. park.fan marks attractions currently undergoing refurbishment so you can check the status of your target rides before booking travel. Always cross-reference park.fan data with the official park website before finalising a trip, particularly for shoulder-season visits when refurbishment activity is highest.',
    relatedTermIds: ['downtime', 'ride-capacity'],
  },
  {
    id: 'downtime',
    name: 'Downtime',
    shortDefinition:
      'An unplanned temporary closure of a ride, typically caused by a technical fault or safety check.',
    definition:
      'Downtime refers to an unscheduled, temporary closure of a ride or attraction — distinct from a planned refurbishment. Causes include mechanical malfunctions, sensor errors, safety checks triggered by guest incidents, adverse weather (particularly lightning), or animals entering the ride zone. Most downtime events are resolved within minutes to a couple of hours, though complex mechanical failures can extend closures.\n\nFrom a planning perspective, downtime is one of the least predictable variables in a theme park day. High-capacity rides with complex systems — such as large roller coasters or elaborate dark rides — tend to experience downtime more frequently than simpler attractions. park.fan displays the current operational status of every tracked attraction in real time, distinguishing between Operating, Down, Closed, and Refurbishment states, so you can adjust your route the moment a ride goes offline.',
    relatedTermIds: ['refurbishment', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'ride-capacity',
    name: 'Ride Capacity',
    shortDefinition:
      'The number of guests an attraction can process per hour under normal operating conditions.',
    definition:
      'Ride capacity (or throughput) is the maximum number of guests a ride can transport per hour under optimal conditions. It depends on vehicle size, the number of vehicles running simultaneously, loading and unloading speed, and the ride cycle time. High-capacity rides like carousels, log flumes, and large dark rides can move 1,500–2,000 guests per hour; lower-capacity rides such as single-vehicle dark rides or certain roller coasters may handle only 500–800 per hour.\n\nCapacity directly determines how quickly a queue moves. A ride posting a 30-minute wait with 1,800-guests-per-hour throughput is processing guests far faster than one posting the same wait with 600-guests-per-hour throughput. Understanding capacity also explains why certain rides always seem to have longer queues relative to their popularity — low capacity is a structural limitation that no operational strategy can fully overcome. Parks sometimes run additional vehicles or trains to boost throughput on high-demand days.',
    relatedTermIds: ['wait-time', 'downtime', 'refurbishment'],
  },
  {
    id: 'rope-drop',
    name: 'Rope Drop',
    shortDefinition:
      'The moment a park opens its gates each morning, when queues for popular rides are at their shortest.',
    definition:
      "Rope drop refers to the moment a theme park opens for the day — named after the physical rope or barrier that park staff lower to allow the first guests inside. Arriving at rope drop, or ideally 30–45 minutes before the stated opening time to clear security and reach the gate first, is one of the most effective no-cost strategies in theme park planning. Popular rides see their shortest queues of the entire day during the first 30–60 minutes of park operation, before the bulk of the crowd arrives and spreads through the park.\n\nThe optimal rope drop strategy depends on the park layout. At Magic Kingdom, for example, rushing to Seven Dwarfs Mine Train immediately at opening can mean a 15-minute wait versus a 90-minute wait by mid-morning. Many parks also offer early park entry for hotel guests, allowing access to select attractions before the general public. park.fan's schedule section shows exact opening times for each park so you can build your rope drop plan around the official hours.",
    relatedTermIds: ['crowd-calendar', 'wait-time', 'crowd-level'],
  },
  {
    id: 'early-entry',
    name: 'Early Entry',
    shortDefinition:
      'An exclusive benefit allowing resort hotel guests to enter the park 30–60 minutes before general opening.',
    definition:
      "Early Entry (also marketed as Early Park Entry, Extra Magic Hours, or Magic Morning depending on the resort) lets guests staying at on-site hotels access the park before the general public. The early window is typically 30 to 60 minutes, during which only hotel guests are present. Because the park has not yet reached its full daily crowd, queues at participating attractions are dramatically shorter than they will be even an hour later.\n\nOn a peak day, the combination of early entry and a well-planned morning strategy can allow guests to experience three or four headline attractions with waits under 20 minutes each — rides that would post 60–90-minute waits by mid-morning. The benefit effectively extends the low-crowd morning window, which is the most productive time in any theme park day. Not all attractions participate in early entry; check the park's official website to see which rides are included.",
    relatedTermIds: ['rope-drop', 'express-pass', 'peak-day'],
  },
  {
    id: 'park-hopper',
    name: 'Park Hopper',
    shortDefinition:
      'A ticket add-on allowing guests to visit multiple parks within the same resort on a single day.',
    definition:
      "A Park Hopper ticket allows entry to two or more parks operated by the same resort on a single day. Disney's Park Hopper option, for example, lets guests switch between Magic Kingdom, EPCOT, Hollywood Studios, and Animal Kingdom after 2 PM. Universal Orlando offers a two- or three-park ticket covering Universal Studios, Islands of Adventure, and Epic Universe. In Europe, PortAventura World offers a combined ticket for PortAventura Park and Ferrari Land.\n\nHopping is most worthwhile when a specific attraction you want exists only in a second park, when you want to combine a morning in one park with a dinner or evening show in another, or on shorter trips where seeing highlights across multiple parks is a priority. The cost premium over a single-park ticket varies by resort and is usually higher on peak days with dynamic pricing.",
    relatedTermIds: ['season-pass', 'rope-drop', 'crowd-calendar'],
  },
  {
    id: 'season-pass',
    name: 'Season Pass',
    shortDefinition: 'An annual ticket granting unlimited park visits over a 12-month period.',
    definition:
      "A Season Pass (Annual Pass) grants unlimited entry to one or more parks over a 12-month period. Higher tiers typically include extras such as free or discounted parking, dining discounts, merchandise deals, and early reservation windows for special events. Annual passes are sold at parks worldwide — Europa-Park's Jahrespass, Disneyland Paris's Annual Pass, and Alton Towers's Merlin Annual Pass are popular European examples.\n\nMany passes include blockout dates on the busiest days of the year, restricting entry on peak periods to manage capacity. For frequent visitors — typically three or more visits per year — an annual pass nearly always pays for itself compared to buying individual day tickets. Some passes also offer reciprocal access or discounts at partner parks, adding additional value for enthusiasts who visit multiple parks per year.",
    relatedTermIds: ['park-hopper', 'peak-day', 'express-pass'],
  },
  {
    id: 'height-requirement',
    name: 'Height Requirement',
    shortDefinition:
      'A minimum height a guest must meet to ride an attraction, enforced for safety reasons.',
    definition:
      'Height requirements are safety rules set by parks to ensure that restraint systems — lap bars, over-the-shoulder harnesses, seat belts — fit and function correctly for every rider. They typically range from 90 cm (about 35 inches) for gentler family coasters to 140 cm (55 inches) for the most intense high-speed rides. Some rides also have maximum height limits or weight restrictions, though these are less common.\n\nFor families visiting with young children, checking height requirements before arriving at a park is essential planning. Being turned away at a ride entrance after a long queue is one of the most common sources of frustration at theme parks. Most park websites and apps publish height charts for every ride. Carrying a printed copy or saving a screenshot can save time on the day. Some parks offer \"rider switch\" systems so that accompanying adults can take turns riding without re-queuing.',
    relatedTermIds: ['ride-capacity', 'refurbishment'],
    aliases: ['height requirements'],
  },
  {
    id: 'themed-land',
    name: 'Themed Land',
    shortDefinition:
      'A self-contained zone within a park built around a unified theme, story, and aesthetic.',
    definition:
      "A themed land is a distinct area within a theme park combining a unified visual design, a narrative backstory, and matching attractions, dining, and merchandise. The goal is total immersion — when done well, guests feel transported to a different world the moment they cross the land's entrance. Well-known examples include The Wizarding World of Harry Potter at Universal (both Orlando and Hollywood), Star Wars: Galaxy's Edge at Disney, and Avalon at Phantasialand.\n\nThemed lands are typically the most photographed and highest-demand sections of a park. New land openings generate enormous media attention and bring significant crowd spikes during their debut seasons. From a practical standpoint, themed lands often cluster their highest-capacity rides with their lower-capacity headliners, creating uneven wait times within the same area. Understanding a land's attraction layout helps you plan the most efficient order of operations when you arrive.",
    relatedTermIds: ['ride-capacity', 'soft-opening'],
  },
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    shortDefinition:
      'An unofficial early opening of a new attraction before its announced grand opening date.',
    definition:
      'A soft opening happens when a park quietly operates a new ride or land before the official grand opening date — typically without any formal announcement. Parks use soft openings to test systems under real crowd conditions, catch operational issues, and train staff on live audiences before the high-pressure official launch. Soft openings can begin and end without warning, sometimes lasting only a single day or even a few hours.\n\nFor guests in the park during a soft opening, it can be a spectacular bonus — riding a brand-new attraction with minimal queues before it officially exists. Enthusiast forums, social media accounts dedicated to park news, and the park.fan community are usually the fastest sources of soft opening reports. However, soft openings are not a reliable planning tool: never book travel specifically around an unconfirmed soft opening date.',
    relatedTermIds: ['refurbishment', 'downtime', 'themed-land'],
  },
  {
    id: 'standby-queue',
    name: 'Standby Queue',
    shortDefinition:
      'The standard physical waiting line accessible to all guests without a special pass or upgrade.',
    definition:
      "The standby queue is the regular waiting line that all guests can join without any ticket upgrade or priority pass. It operates on a first-come, first-served basis and wait times directly reflect the real-time crowd level at that attraction. On busy days, standby queues for headline rides at major parks can stretch to 90 minutes or more — sometimes wrapping around multiple switchback sections and extending outside the queue building entirely.\n\nTracking standby wait times across a park in real time is the core use case for park.fan. By monitoring multiple rides simultaneously, you can identify when a popular attraction's queue suddenly drops (perhaps due to downtime clearing, or a show drawing crowds away) and react quickly. The standby queue is also the baseline against which the value of any priority pass is measured — the bigger the standby wait, the more valuable an Express Pass becomes.",
    relatedTermIds: ['wait-time', 'single-rider', 'virtual-queue', 'express-pass'],
  },
  {
    id: 'lightning-lane',
    name: 'Lightning Lane',
    shortDefinition:
      "Disney's paid priority queue system, introduced in 2021 as the successor to the free FastPass+ programme.",
    definition:
      "Lightning Lane is Disney's name for its priority queue access system, introduced in late 2021 to replace the discontinued FastPass+ programme. It comes in two tiers: Individual Lightning Lane (ILL), sold separately for the highest-demand attractions at a per-person, per-ride fee; and Lightning Lane Multi Pass (LLMP), a daily subscription allowing guests to reserve timed return windows across a selection of rides. Pricing for both tiers is dynamic, rising on busier days.\n\nLightning Lane replaced a system that was free, making it one of the most debated changes in recent Disney history. The practical impact depends on how busy the park is — on quiet days the standby queue is fast enough that Lightning Lane offers marginal benefit. On peak days, Individual Lightning Lane for the very top attractions (Space Mountain, Tron, Radiator Springs Racers) can mean the difference between riding and missing out entirely. park.fan\'s crowd calendar can help you judge which days warrant the additional spend.",
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'genie-plus',
    name: 'Genie+',
    shortDefinition:
      "Disney's former daily add-on providing Lightning Lane Multi Pass access across most park attractions.",
    definition:
      "Genie+ was Disney's paid daily add-on, launched in 2021, that replaced the free FastPass+ system at Walt Disney World and Disneyland. For a per-person, per-day fee, guests could make one Lightning Lane return-time reservation at a time across a broad selection of rides, with pricing that rose dynamically on the busiest days. The headline attractions were excluded from Genie+ and sold separately as Individual Lightning Lane.\n\nGenie+ has since been rebranded as Lightning Lane Multi Pass at both Walt Disney World and Disneyland, though the core mechanics remain the same. Understanding Genie+ remains useful context when reading older trip reports or comparing the current system to its predecessor. The key planning insight — that the value of the pass rises sharply on busier days — applies equally to the current Lightning Lane Multi Pass product.",
    relatedTermIds: ['lightning-lane', 'express-pass', 'virtual-queue'],
  },
  {
    id: 'boarding-group',
    name: 'Boarding Group',
    shortDefinition:
      'A numbered virtual queue allocation granting access to a high-demand attraction when that group number is called.',
    definition:
      "A boarding group is a numbered slot within a virtual queue system, used for the most in-demand attractions where physical queuing would be impractical or create dangerous crowd concentrations. Guests tap into the boarding group system via a park app — often at the exact moment the park opens — and receive a group number. When that number range is called, typically announced in the park app with a push notification, guests have a limited window (usually 60–120 minutes) to present themselves at the attraction's dedicated entrance.\n\nBoarding groups can fill within minutes of becoming available on busy days — Disney's system for Tron Lightcycle Run and Star Wars: Rise of the Resistance has made the frantic morning boarding group grab a well-known phenomenon among frequent park visitors. If you miss the initial wave, a limited number of groups are sometimes re-released throughout the day. Monitoring the park app in the moments after opening is essential when a boarding group attraction is on your list.",
    relatedTermIds: ['virtual-queue', 'wait-time', 'lightning-lane'],
  },
  {
    id: 'off-peak',
    name: 'Off-Peak',
    shortDefinition:
      'Quieter periods in the park calendar offering shorter waits, lower ticket prices, and a more relaxed visit.',
    definition:
      "Off-peak periods are the calmer stretches of the calendar when schools are in session and no major holidays fall. Typical off-peak windows include January through early February, the second half of September through October (excluding Halloween event evenings), and the first two weeks of November. During these periods, wait times for popular attractions can be a fraction of their summer peaks — rides that post 90-minute waits in July might show 15–20 minutes in October.\n\nFor guests with flexible schedules, visiting off-peak is one of the single most effective strategies for getting the most value out of a theme park day. Ticket prices are typically at their lowest, car parks are far from full, and the atmosphere at restaurants and shopping areas is far more relaxed. The trade-off is that some seasonal attractions, entertainment, and food offerings are only available during peak periods. park.fan's crowd calendar highlights off-peak windows for every tracked park so you can identify the best available dates for your trip.",
    relatedTermIds: ['crowd-calendar', 'peak-day', 'crowd-level'],
  },
  {
    id: 'offseason',
    name: 'OffSeason',
    shortDefinition:
      'A seasonal closure period during which the park shuts completely for maintenance, ride upgrades, or a winter break — and is not open to the public.',
    definition:
      "The OffSeason is a defined period during which a theme park closes its gates entirely — not simply a quieter visiting time, but a full operational shutdown. Parks use this window to carry out essential maintenance on rides and facilities, undertake major refurbishments that cannot be performed while guests are present, and give staff a rest period before the new operating season begins. OffSeason closures are most common during winter months and typically last anywhere from a few weeks to several months depending on the park and its climate. During this time no attractions, restaurants, or shows are accessible to the public.\n\nWhen park.fan shows an OffSeason status for a park, it means no operating schedule is available for the current period and the next confirmed opening date is still some weeks away. Check the park's official website for the exact reopening date and any pre-sale ticket windows — popular parks often sell out their first days back quickly.",
    relatedTermIds: ['refurbishment', 'soft-opening', 'crowd-calendar'],
  },
  {
    id: 'ride-photo',
    name: 'Ride Photo',
    shortDefinition:
      'An automatically captured photo taken of guests at a key moment during a ride, available to purchase afterwards.',
    definition:
      "A ride photo is an on-ride image automatically captured by a fixed camera at a dramatic moment during an attraction — typically the drop on a water ride, the crest of a roller coaster's first hill, or the peak of an accelerator coaster launch. After disembarking, guests can view their photo at an on-site kiosk or in the park's official app and choose whether to purchase a digital or printed copy.\n\nMany parks offer all-day or all-resort photo packages that cover unlimited ride photos for a fixed price — these typically offer good value if you are riding several photo-equipped attractions. Ride photos have become a beloved souvenir tradition and a staple of social media trip reports. The images also provide an objective record of the drop angle and rider expressions that words struggle to capture.",
    relatedTermIds: ['themed-land'],
  },
  {
    id: 'queue-line',
    name: 'Queue Line',
    shortDefinition:
      'The physical waiting area guests walk through before boarding an attraction, often themed as part of the experience.',
    definition:
      "The queue line is the physical space — indoor corridors, outdoor switchback sections, or elaborately themed rooms — that guests walk through while waiting to board an attraction. At many modern theme parks, the queue itself is a meaningful part of the storytelling experience. Disney's Haunted Mansion queue uses gravestones, crypts, and stretching room effects to build atmosphere long before you board a Doom Buggy. Universal's Harry Potter rides begin their narrative immersion the moment you step into the queue building.\n\nA well-designed queue line makes even a substantial wait feel engaging and can meaningfully reduce perceived wait time. Parks invest heavily in queue theming for their flagship attractions precisely because the queue is where most guests spend the majority of their in-attraction time. When assessing whether a long wait is worth it, the quality of the queue experience is a genuine factor — some of the most celebrated queues in the world are at attractions with 60-minute waits that guests rate as entirely worthwhile.",
    relatedTermIds: ['wait-time', 'standby-queue', 'single-rider'],
    aliases: ['Queue Lines', 'Queues'],
  },
  {
    id: 'opening-day',
    name: 'Opening Day',
    shortDefinition:
      'The official date on which a new park, themed land, or attraction opens to the public for the first time.',
    definition:
      'Opening day is the officially announced date on which a new park, expansion, or attraction opens to the general public. Opening days are major events in the theme park community, typically drawing large media coverage, ribbon-cutting ceremonies, character appearances, and a festive atmosphere. They also attract the most dedicated enthusiasts, who often queue from the early hours to be among the first to experience the new attraction.\n\nDespite the celebratory atmosphere, opening day is rarely the optimal time for a first visit if minimising wait times is your goal. The combination of media attention, novelty factor, and enthusiast tourism typically produces some of the longest opening-week queues an attraction will ever see. Soft openings occasionally precede the official opening day and can provide a much lower-crowd alternative for guests who happen to be in the park at the right moment.',
    relatedTermIds: ['soft-opening', 'rope-drop', 'crowd-level'],
  },
  {
    id: 'rider-switch',
    name: 'Rider Switch',
    shortDefinition:
      'A system letting accompanying adults take turns riding while the other waits with a child who cannot meet the height requirement.',
    definition:
      "Rider Switch (also called Child Swap) is a system at most major theme parks allowing groups to take turns on a ride when one member — typically a young child who doesn't meet the height requirement — cannot participate. The process: one adult rides with the group while the other waits at a designated area near the ride exit with the non-riding child. When the first adult returns, the waiting adult can board the ride immediately, bypassing the standby queue entirely.\n\nAt Disney parks the system is called Rider Switch; at Universal it is Child Swap. The waiting adult essentially receives a Lightning Lane or Express return equivalent for free. On a busy day this benefit is substantial — the second adult skips what might be a 60–90-minute standby wait. Always ask a ride attendant at the entrance to activate it rather than discovering the system exists only after your group has already queued.",
    relatedTermIds: ['height-requirement', 'standby-queue', 'wait-time'],
  },
  {
    id: 'blockout-date',
    name: 'Blockout Date',
    shortDefinition:
      'A calendar date on which certain annual pass tiers are not valid for park entry, typically on the busiest days.',
    definition:
      "Blockout dates (also written as blackout dates) are specific calendar days on which certain annual pass tiers do not grant park entry. Parks implement blockout dates to manage capacity on their busiest days — peak holidays, school vacation periods, and major special events. Higher-tier annual passes have fewer or no blockout dates; lower-tier budget passes may be restricted on 30–60 or more days per year.\n\nFor annual pass holders planning multiple visits, mapping your intended visit dates against the blockout calendar for your specific tier is essential homework. A blockout date violation discovered at the park entrance means full-price admission or turning away entirely. park.fan's crowd calendar highlights the peak periods that most commonly align with blockout restrictions, making it a useful cross-reference tool when planning around your pass type.",
    relatedTermIds: ['season-pass', 'peak-day', 'crowd-calendar'],
  },
  {
    id: 'hard-ticket-event',
    name: 'Hard Ticket Event',
    shortDefinition:
      'A separately ticketed special event — typically an evening event — requiring admission beyond a regular park ticket.',
    definition:
      "A hard ticket event is a separately ticketed event held at a theme park requiring a dedicated ticket beyond regular day admission. These events offer exclusive entertainment, seasonal décor, character meet-and-greets, and experiences not available during normal operating hours. Well-known examples include Mickey's Not-So-Scary Halloween Party and Mickey's Very Merry Christmas Party at Walt Disney World, Halloween Horror Nights at Universal Studios, Frightfest at Alton Towers and Thorpe Park, and seasonal events at Disneyland Paris.\n\nOn hard ticket event days, regular day guests are typically asked to leave the park between 6 and 7 PM to make way for ticketed event guests. This means the park can feel particularly crowded in the late afternoon as day guests try to squeeze in final rides before being ushered out. Event tickets typically go on sale months in advance and frequently sell out weeks before the event date, particularly for the most popular Halloween party nights.",
    relatedTermIds: ['season-pass', 'peak-day', 'early-entry'],
  },
  {
    id: 'fastpass',
    name: 'FastPass',
    shortDefinition:
      "Disney's former free priority queue system, active 1999–2020, replaced by the paid Lightning Lane in 2021.",
    definition:
      "FastPass+ (originally launched as FastPass in 1999) was Disney's free priority queue reservation system, allowing guests to book timed return windows for attractions at no additional cost. At Walt Disney World, guests could book up to three FastPass+ reservations per day in advance via the My Disney Experience app, and additional passes one at a time on the day. The system was available at all four Walt Disney World parks and Disneyland Paris.\n\nFastPass+ was suspended during the COVID-19 closure in March 2020 and was never reinstated. In late 2021, Disney replaced it with the paid Lightning Lane system — a decision that remains one of the most discussed and debated changes in recent Disney history, because it converted a genuinely free guest benefit into a paid service. Understanding FastPass remains useful context for reading older trip reports, planning guides written before 2021, and understanding why long-time Disney fans feel so strongly about the transition.",
    relatedTermIds: ['lightning-lane', 'genie-plus', 'express-pass', 'return-time'],
  },
  {
    id: 'dark-ride',
    name: 'Dark Ride',
    shortDefinition:
      'An indoor attraction where guests travel through elaborately themed scenes in guided vehicles.',
    definition:
      "A dark ride is an indoor attraction where guests travel in vehicles — cars on a fixed or trackless system, boats on a water channel, or gondolas on an overhead rail — through elaborately themed scenes. The 'dark' in the name refers to the controlled lighting environment that makes projections, animatronics, and physical sets most effective. Dark rides range from gentle family classics (it's a small world, Pinocchio's Daring Journey) to intensely immersive narrative experiences (Star Wars: Rise of the Resistance, Hagrid's Magical Creatures Motorbike Adventure).\n\nTrackless dark rides — where vehicles move freely without fixed rails, guided by floor-embedded technology — represent the current cutting edge of the format. They enable non-linear storytelling with scenes that approach vehicles from multiple angles. Dark rides tend to have high hourly throughput compared to roller coasters, making them particularly useful for crowd management at peak parks. Symbolica at Efteling and Ratatouille: The Adventure at Disneyland Paris are celebrated European examples of the trackless format.",
    relatedTermIds: ['themed-land', 'ride-capacity', 'height-requirement'],
  },
  {
    id: 'return-time',
    name: 'Return Time',
    shortDefinition:
      'A reserved time window to return to a ride, issued by Lightning Lane, virtual queue, or similar priority access systems.',
    definition:
      "A return time (sometimes called a return window) is a specific time period — typically a one-hour block — during which a guest who has booked priority access can present at the attraction's dedicated entrance. Return times are issued by Lightning Lane reservations, virtual queue boarding group assignments, and legacy systems like FastPass+. They allow guests to spend the intervening period exploring other areas of the park rather than standing in a physical queue.\n\nMissing your return time window typically forfeits the reservation, though Disney and Universal both offer some grace-period flexibility. Return time management — knowing which attractions to book first, when to book your second reservation, and how long it takes to walk between areas of the park — is a skill that separates experienced park visitors from first-timers. park.fan's live wait time data helps inform which attractions are worth using a return time on versus which can be done efficiently in standby.",
    relatedTermIds: ['lightning-lane', 'virtual-queue', 'fastpass', 'boarding-group'],
    aliases: ['Return Times'],
  },
  {
    id: 'airtime',
    name: 'Airtime',
    shortDefinition:
      'The sensation of weightlessness or being lifted from your seat caused by negative G-forces on roller coasters.',
    definition:
      'Airtime describes the sensation of weightlessness — negative G-forces — that roller coaster riders experience when the train crests a hill or valley faster than gravitational free fall. There are two main varieties: floater airtime, characterised by mild negative Gs and a gentle floating sensation where you rise slightly from the seat; and ejector airtime, characterised by intense negative Gs where the lap bar becomes the only thing keeping you in the vehicle.\n\nAirtime is widely considered the defining quality of great coaster design, particularly for steel hyper coasters, giga coasters, and wooden coasters. Dedicated airtime hills (also called camelbacks) are engineered to follow a parabolic trajectory that maximises the negative G phase. Some of the most celebrated airtime coasters in Europe include Shambhala at PortAventura, Goliath at Walibi Holland, Balder at Liseberg, and Untamed at Walibi Holland — all consistently ranked at the top of enthusiast polls for the intensity and quality of their airtime.',
    relatedTermIds: ['airtime-hill', 'bunnyhop', 'first-drop', 'wooden-coaster'],
  },
  {
    id: 'inversion',
    name: 'Inversion',
    shortDefinition:
      'Any element on a roller coaster where riders are rotated at least partially upside down.',
    definition:
      "An inversion is any element on a roller coaster where the track and vehicle rotate riders beyond the vertical plane — placing them at least partially upside down. The major inversion types include the vertical loop, cobra roll, Immelmann, dive loop, corkscrew, inline twist, heartline roll, zero-G roll, flat spin, batwing, and pretzel loop, each producing a distinct combination of G-forces and directional change.\n\nModern coasters routinely feature six to fourteen inversions in a single layout. The inversion count is one of the primary statistics used to describe a coaster's intensity. Inversions generate positive G-forces at the bottom of loops (pressing riders into their seats) and negative G-forces at the tops (creating brief airtime while inverted). Record holders include Smiler at Alton Towers with 14 inversions, and The Swarm, Colossus, and Nemesis — all prominent European examples of inversion-heavy rides.",
    relatedTermIds: ['vertical-loop', 'cobra-roll', 'immelmann', 'zero-g-roll', 'corkscrew'],
    aliases: ['Inversions'],
    alternateNames: ['upside-down element', 'overhead element'],
  },
  {
    id: 'vertical-loop',
    name: 'Vertical Loop',
    shortDefinition:
      'The classic circular inversion taking riders through a complete 360-degree circle in the vertical plane.',
    definition:
      "The vertical loop is the most iconic inversion in roller coaster history — a complete 360-degree circle in the vertical plane that takes riders fully upside down at the apex. Modern loops use a clothoid (teardrop) shape rather than a perfect circle: the entry and exit sections of the loop are wider in radius, while the top is tighter. This geometry ensures smooth, sustained positive G-forces at the bottom and a brief negative-G moment at the top rather than the jarring spikes a perfect circle would produce.\n\nThe first modern loop coaster, Corkscrew at Knott's Berry Farm (1975), transformed the amusement industry. Today vertical loops anchor the inversion portfolios of coasters worldwide, from introductory looping coasters to record-breaking machines. Dragon Khan at PortAventura features eight loops — one of the highest counts on any European coaster. The sight of a train completing a loop remains one of the most immediately recognisable and crowd-drawing images in theme park marketing.",
    relatedTermIds: ['inversion', 'immelmann', 'cobra-roll', 'interlocking-loops', 'inclined-loop'],
  },
  {
    id: 'immelmann',
    name: 'Immelmann',
    shortDefinition:
      'A half-loop ascending to the top followed by a half-roll exiting in the opposite direction — a signature B&M inversion.',
    definition:
      "The Immelmann turn is one of B&M's signature inversion elements, consisting of two phases: the track pulls up into a half vertical loop, carrying riders over the top and briefly inverted; then a half-roll flips the train right-side-up while simultaneously reversing the heading by 180 degrees. The combined effect is a stomach-dropping inversion fused with a significant direction change — all in one fluid, high-speed movement. The element is named after World War I flying ace Max Immelmann, who used a similar aerial manoeuvre to disengage from a dogfight.\n\nImmelmanns are found on almost every B&M sit-down, inverted, and hyper coaster worldwide and are one of the most recognisable elements in modern coaster design. They tend to produce strong sustained positive G-forces on the entry arc and a brief negative-G moment at the top before the roll. Notable European examples include the Immelmanns on Shambhala at PortAventura, Nemesis at Alton Towers, and Silver Star at Europa-Park.",
    relatedTermIds: ['inversion', 'vertical-loop', 'dive-loop', 'b-and-m'],
  },
  {
    id: 'zero-g-roll',
    name: 'Zero-G Roll',
    shortDefinition:
      'A 360-degree roll following a parabolic arc where riders experience near-weightlessness while inverted at the apex.',
    definition:
      'The zero-G roll is an inversion element shaped so the train follows a parabolic arc through the rotation, similar in concept to a heartline roll but at higher speed and with greater vertical displacement. At the peak of the roll, riders experience momentary negative G-forces while upside down — the unique sensation of floating while inverted. This combination of inversion and airtime in a single element is what makes the zero-G roll one of the most celebrated elements in modern coaster design.\n\nZero-G rolls are strongly associated with B&M wing coasters and hyper coasters, where the open seating positions send riders dramatically sweeping through the sky with no track above, below, or beside them. On a wing coaster, the outside seats of a zero-G roll produce an extraordinarily open, exposed sensation unlike anything found on a conventional coaster. Shambhala at PortAventura and Fury 325 at Carowinds feature particularly celebrated zero-G rolls.',
    relatedTermIds: ['inversion', 'heartline-roll', 'airtime', 'b-and-m', 'zero-g-winder'],
  },
  {
    id: 'launch-coaster',
    name: 'Launch Coaster',
    shortDefinition:
      'A coaster that accelerates from standstill to high speed via electromagnetic, hydraulic, or pneumatic systems rather than a chain lift hill.',
    definition:
      "A launch coaster replaces the traditional chain lift hill with a propulsion system that rapidly accelerates the train from a standstill to top speed in just a few seconds. The main technologies are: LSM (Linear Synchronous Motor) launches, where electromagnetic coils accelerate a fin attached to the train — smooth, precise, and reusable; LIM (Linear Induction Motor) launches — similar but less energy-efficient; hydraulic launches, used by Intamin on record-breaking coasters like Kingda Ka (0 to 206 km/h in 3.5 seconds); and compressed-air launches. Some coasters feature multiple launches throughout the circuit, maintaining energy across the layout.\n\nThe sudden, powerful acceleration of a launch is a defining sensation that no lift hill can replicate. Taron at Phantasialand, the world's longest launched coaster by circuit length at time of installation, delivers two separate LSM launches through an intricately themed rocky landscape. Red Force at Ferrari Land in Spain reaches 180 km/h in five seconds via hydraulic launch. LSM technology has become the dominant standard for new-build launched coasters in Europe.",
    relatedTermIds: ['lifthill', 'top-hat', 'intamin', 'horseshoe'],
  },
  {
    id: 'wooden-coaster',
    name: 'Wooden Coaster',
    shortDefinition:
      'A roller coaster built primarily of wood, known for its distinctive rumble, lateral movement, and unpredictable airtime.',
    definition:
      "A wooden coaster is built with a wooden track structure (laminated layers of wood) on a wooden or steel support frame. Unlike steel coasters, wood has natural flex and imprecision in its construction that creates the characteristic rumble, lateral shuffle, and unpredictable airtime that enthusiasts prize. The experience tends to feel more raw and physical than the smooth precision of a steel coaster — a quality many riders find uniquely appealing.\n\nFamous wooden coasters include Balder at Liseberg (Sweden), widely regarded as Europe's best wooden coaster, The Beast at Kings Island (one of the longest in the world at 2.2 km), and Megafobia at Oakwood in Wales. Wooden coasters require significant ongoing maintenance — rails must be relaminated, checked, and replaced on a continuous cycle — and their ride characteristics change noticeably with temperature and humidity. Rocky Mountain Construction's conversion process can transform an ageing wooden coaster into a steel I-box hybrid, opening up new design possibilities while retaining the iconic wooden structure.",
    relatedTermIds: ['airtime', 'hybrid-coaster', 'rmc'],
    alternateNames: ['Woodie', 'Woodies'],
  },
  {
    id: 'steel-coaster',
    name: 'Steel Coaster',
    shortDefinition:
      'A roller coaster built primarily with steel track and support structure, known for its smooth, precise ride experience.',
    definition:
      'A steel coaster is built with tubular or flat steel track supported by a steel lattice or tubular frame. Unlike wooden coasters with their natural flex and unpredictable motion, steel offers engineers precise control over G-forces, transitions, and inversions. The smooth, predictable ride of a steel coaster makes it ideal for executing complex layouts with multiple inversions, tight radius curves, and sustained high-speed sections.\n\nSteel coasters dominate modern coaster development because they allow designers to create nearly any shape imaginable — beyond-vertical drops, complete inversions, and rapid direction changes. The most celebrated steel coasters in Europe include Shambhala at PortAventura, Nemesis at Alton Towers, and Silver Star at Europa-Park. Steel coasters range from small family rides to record-breaking mega coasters, making the category the most versatile in the theme park industry. The precision of steel comes at a cost: maintenance requires careful track inspection and frequent repainting, and the steel structure is less forgiving of design errors than the flexibility of wood.',
    relatedTermIds: ['wooden-coaster', 'inversion', 'launch-coaster', 'hyper-coaster'],
    aliases: ['Steel Coasters'],
    alternateNames: ['Steel track coaster', 'Steel roller coaster'],
  },
  {
    id: 'suspended-coaster',
    name: 'Suspended Coaster',
    shortDefinition:
      'A coaster where the train hangs below the track on a swinging pivot, allowing the vehicle to swing freely side to side.',
    definition:
      "A suspended coaster is a specialized coaster type where the train is suspended from above on a pivot point, allowing it to swing side to side independently of the track's path. As the train navigates curves, it swings outward like a pendulum — a motion that creates the characteristic 'whip' sensation and adds an unpredictable element to the ride experience. This swinging motion is distinct from an inverted coaster, where the train is rigidly attached above the track.\n\nSuspended coasters are less common than inverted coasters but offer a unique experience. The swinging motion makes even moderate-speed turns feel dramatic, and the sensation of 'flying' with the ground far below (or nearby obstacles) creates a thrilling exposure. Vekoma pioneered the Suspended Looping Coaster (SLC) model in the 1990s, and hundreds were built worldwide due to the format's compact footprint and distinctive experience. Kumba at Busch Gardens Tampa (B&M suspended) and the Vekoma suspended coasters at European parks remain popular examples. The swinging motion can feel chaotic compared to the precision of modern inversions, making suspended coasters either beloved for their raw, unpredictable nature or polarizing among enthusiasts.",
    relatedTermIds: ['inverted-coaster', 'b-and-m', 'vekoma'],
    aliases: ['Suspended'],
    alternateNames: ['Swinging coaster'],
  },
  {
    id: 'hybrid-coaster',
    name: 'Hybrid Coaster',
    shortDefinition:
      'A coaster combining a traditional wooden support structure with precision steel I-box track, pioneered by Rocky Mountain Construction.',
    definition:
      "A hybrid coaster pairs the wooden support structure of a traditional coaster with a precision steel I-box track manufactured by Rocky Mountain Construction (RMC). The I-box track allows for much tighter radius curves, beyond-vertical drops, and inversion elements that would be physically impossible on traditional laminated wooden track. RMC developed this technology primarily to renovate ageing, rough wooden coasters — transforming layouts that were painful to ride into world-class experiences with intense airtime, multiple inversions, and dramatic drops.\n\nRMC conversions have produced some of the most acclaimed coasters in the world. Steel Vengeance at Cedar Point, converted from Mean Streak in 2018, is frequently cited as the single best roller coaster on the planet in enthusiast polls. In Europe, Untamed at Walibi Holland (a new-build RMC hybrid opened in 2019) consistently ranks among the continent's top coasters. Wildfire at Kolmården, a new-build on a mountainside, is another celebrated European example. The RMC hybrid concept changed the calculus for parks with ageing wooden coasters, offering a path to world-class status without demolishing existing infrastructure.",
    relatedTermIds: ['wooden-coaster', 'rmc', 'airtime'],
  },
  {
    id: 'b-and-m',
    name: 'B&M',
    shortDefinition:
      'Bolliger & Mabillard, a Swiss manufacturer renowned for smooth, reliable coasters and signature elements including the Immelmann, cobra roll, and zero-G roll.',
    definition:
      "B&M (Bolliger & Mabillard) is a Swiss roller coaster manufacturer founded in 1988 by former Intamin engineers Walter Bolliger and Claude Mabillard. The company is renowned for producing exceptionally smooth, reliable rides with a distinctive experience characterised by sustained positive G-forces, signature inversions, and very high operational reliability. B&M's engineering philosophy prioritises predictable, comfortable intensity over rough surprises — a quality that has made their coasters perennial crowd favourites at every park they occupy.\n\nB&M specialises in inverted coasters, sit-down loopers, hyper coasters (over 61 m), giga coasters (over 91 m), wing coasters, dive machines, and flying coasters. Nearly every major European park features at least one B&M installation: Shambhala and Dragon Khan at PortAventura, Silver Star at Europa-Park, Nemesis at Alton Towers, Goliath at Walibi Holland, Katun at Mirabilandia, and Oziris at Parc Astérix. The company's reputation for quality has made a B&M installation a prestige signal for any park.",
    relatedTermIds: ['immelmann', 'cobra-roll', 'zero-g-roll', 'dive-coaster', 'hybrid-coaster'],
  },
  {
    id: 'intamin',
    name: 'Intamin',
    shortDefinition:
      "A Swiss manufacturer known for record-breaking hydraulic launches, mega/giga coasters, and some of the world's fastest and tallest rides.",
    definition:
      "Intamin AG is a Swiss ride manufacturer founded in 1967, responsible for some of the most ambitious coaster records in history. Their hydraulic launch system powered the world's tallest coasters for years — Kingda Ka at Six Flags Great Adventure (139 m / 456 ft) and Top Thrill Dragster at Cedar Point (128 m / 420 ft) both used Intamin hydraulic technology. Beyond record-chasers, Intamin also builds critically acclaimed mega coasters (Millennium Force at Cedar Point) and multi-launch coasters.\n\nIn Europe, Intamin has delivered some of the continent's most beloved coasters. Taron at Phantasialand is widely considered one of Europe's best coasters, combining two LSM launches with an intricate, twisting layout through a volcanic landscape. Black Mamba at Phantasialand is a celebrated B&M-style inverted coaster from Intamin's inverted portfolio. Red Force at Ferrari Land in Tarragona is Europe's fastest coaster at 180 km/h. Intamin designs tend to be operationally complex compared to B&M, which has sometimes led to reliability concerns, but the ride experiences they create are often at the very cutting edge of what is possible.",
    relatedTermIds: ['launch-coaster', 'top-hat', 'b-and-m', 'mack-rides'],
  },
  {
    id: 'mack-rides',
    name: 'Mack Rides',
    shortDefinition:
      'A German family-owned manufacturer from Waldkirch, the company behind Europa-Park and producers of water rides, dark rides, and acclaimed hyper coasters.',
    definition:
      "Mack Rides is a German ride manufacturer based in Waldkirch, Baden-Württemberg — a few kilometres from Europa-Park, which the Mack family both owns and uses as a showcase for their products. Founded in 1921, the company began with portable fairground rides before expanding into permanent park attractions. Their portfolio now spans water rides, dark rides (including Disney's Test Track and Radiator Springs Racers), and a rapidly growing range of steel coasters.\n\nMack's Blue Fire Megacoaster at Europa-Park (2009) was the first ride to feature the Stengel Dive element and immediately became one of Europe's most admired launched coasters. Their more recent hyper coasters have drawn extraordinary praise: Ride to Happiness at Plopsaland de Panne (Belgium) and Kondaa at Walibi Belgium are both considered among Europe's finest coasters by the enthusiast community. Mack has also supplied Disney with multiple custom attractions, cementing a status as one of the most technically versatile manufacturers in the world.",
    relatedTermIds: ['stengel-dive', 'b-and-m', 'intamin', 'launch-coaster'],
  },
  {
    id: 'rmc',
    name: 'RMC',
    shortDefinition:
      'An Idaho-based manufacturer that invented the hybrid coaster concept, converting ageing wooden coasters into steel I-box track rides with unprecedented airtime and inversions.',
    definition:
      "Rocky Mountain Construction (RMC) is an American roller coaster manufacturer and maintenance company based in Hayden, Idaho, best known for inventing the I-box steel track system that can be fitted onto wooden coaster support structures. This conversion technology allowed parks to transform rough, ageing wooden coasters into world-class hybrid rides featuring intense airtime, multiple inversions, beyond-vertical drops, and dramatic overbanked turns — all design features impossible on traditional wood track.\n\nRMC conversions quickly became some of the most acclaimed rides in the world: Steel Vengeance at Cedar Point, Wicked Cyclone at Six Flags New England, and Wildfire at Kolmården in Sweden all received immediate enthusiast acclaim after their openings. New-build RMC hybrids — built from scratch rather than converted from an existing coaster — include Untamed at Walibi Holland, which opened in 2019 and is consistently ranked as one of Europe's best coasters. RMC fundamentally changed the calculus for parks with ageing wooden coasters, offering a clear upgrade path without the loss of beloved heritage structures.",
    relatedTermIds: ['hybrid-coaster', 'wooden-coaster', 'airtime', 'barrel-roll-drop', 'stall'],
  },
  {
    id: 'vekoma',
    name: 'Vekoma',
    shortDefinition:
      "A Dutch manufacturer and one of the world's most prolific coaster producers, known for the Boomerang, the SLC, and a modern new-generation lineup.",
    definition:
      "Vekoma Rides Manufacturing is a Dutch roller coaster manufacturer headquartered in Vlodrop, Netherlands, and one of the world's most prolific producers by total installations. Founded in 1926, Vekoma built its global reach with the Boomerang — a compact, inexpensive shuttle coaster with three inversions ridden twice (once forward, once backward), licensed to parks worldwide. Over 50 Boomerangs were built; the model is found on every inhabited continent.\n\nOther iconic Vekoma designs include the Suspended Looping Coaster (SLC), Mine Train coasters, and the Giant Inverted Boomerang. Starting in the 2010s, Vekoma reinvented itself with a new-generation lineup featuring dramatically smoother ride systems, innovative layouts, and improved family offerings. New-generation models like the Family Boomerang, Tilt Coaster, and suspended family coasters appear increasingly at European parks. Disney has also commissioned custom Vekoma designs for several of its resorts, including the Seven Dwarfs Mine Train, signalling Vekoma's rehabilitation from manufacturer of rough but affordable coasters to trusted supplier of premium family attractions.",
    relatedTermIds: ['boomerang', 'b-and-m', 'intamin', 'gerstlauer'],
  },
  {
    id: 'gerstlauer',
    name: 'Gerstlauer',
    shortDefinition:
      'A German manufacturer best known for the Euro-Fighter model with its beyond-vertical first drop, plus spinning coasters and compact family rides.',
    definition:
      'Gerstlauer Amusement Rides GmbH is a German roller coaster manufacturer based in Münsterhausen, Bavaria. Founded in 1946 as a metalworking company, it entered the amusement ride market in the 1980s and built its global reputation with the Euro-Fighter model — a compact, electric-launch coaster famous for its beyond-vertical (up to 97-degree) first drop. Euro-Fighters can be installed in very tight spaces, making them attractive for urban parks and smaller venues. European examples include Saw – The Ride at Thorpe Park and Rage at Adventure Island.\n\nGerstlauer also produces the Infinity Coaster model, spinning coasters, and the SkyRoller — a coaster where riders control their own wing rotation, flipping themselves independently. In the enthusiast community, Gerstlauer rides are valued for packing significant intensity into small footprints. The company occupies an interesting market position between the large-scale ambitions of B&M and Intamin and the compact value of older Vekoma models.',
    relatedTermIds: [
      'euro-fighter',
      'spinning-coaster',
      'xtreme-spinning-coaster',
      'b-and-m',
      'intamin',
    ],
  },
  {
    id: 'schwarzkopf',
    name: 'Schwarzkopf',
    shortDefinition:
      'A legendary German manufacturer whose classic looping coasters from the 1970s and 80s remain beloved across European parks for their smooth, intense ride experience.',
    definition:
      "Anton Schwarzkopf GmbH & Co. KG was a German roller coaster manufacturer based in Münsterhausen, Bavaria — the same town Gerstlauer later occupied. Founded by Anton Schwarzkopf in 1954, the company was instrumental in bringing modern looping coasters to Europe and the world. The Revolution at Six Flags Magic Mountain (1976) was the world's first modern looping coaster. Schwarzkopf's Looping Star, Thriller/Wildcat, and transportable Looping Coaster models toured and were installed at parks across Europe and beyond.\n\nSchwarzzkopf coasters are revered for their extraordinary smoothness — a product of Schwarzkopf's precise engineering standards — and for the elegant efficiency of their layouts, which deliver intense airtime and inversion sensations in relatively compact, graceful designs. The company went bankrupt in 1983, but many installations remained operational decades later and are treasured as irreplaceable classics. Maintenance is now handled by specialist firms or Gerstlauer, which acquired some of the original tooling. Enthusiasts regularly campaign to preserve remaining Schwarzkopf installations whenever parks consider replacement.",
    relatedTermIds: ['b-and-m', 'intamin', 'gerstlauer', 'vekoma'],
  },
  {
    id: 'lifthill',
    name: 'Lifthill',
    shortDefinition:
      'The mechanically powered ascent that pulls a coaster train to its highest point, building the potential energy that powers the rest of the ride.',
    definition:
      "The lift hill is the segment where an external mechanism pulls the coaster train from near ground level to the ride's highest point, converting electrical energy into gravitational potential energy. The most common mechanism is a continuously moving chain running along the centre of the track — the familiar 'click-click-click' sound is the anti-rollback ratchet engaging to prevent the train from sliding backward. Alternatives include cable lifts (smoother and quieter, used on some B&M rides), tire-drive hills, and magnetic lift systems.\n\nThe height of the lift hill determines the coaster's maximum potential speed — a 70-metre lift produces more speed than a 40-metre lift, all else being equal. The lift hill is typically the slowest and most anticipation-filled moment of the ride: the gradual ascent, the ever-expanding view, and the sound of the chain create a classic theme park sensory experience that launch coasters intentionally replace with instant acceleration. Some enthusiasts specifically prefer lift hill coasters for this theatrical build-up.",
    relatedTermIds: ['first-drop', 'launch-coaster', 'block-brake'],
  },
  {
    id: 'first-drop',
    name: 'First Drop',
    shortDefinition:
      "The initial descent after the lift hill or launch — typically the ride's fastest point and the defining statement of its character.",
    definition:
      "The first drop is the primary descent immediately following the lift hill or launch segment. On most traditional coasters it is the tallest element and produces the coaster's maximum speed. The drop's angle, height, and profile strongly influence the overall character of the ride: steep-angle drops (over 80 degrees) create a sensation of near-vertical plunge and intense acceleration; parabolic drops with a carefully shaped profile can generate powerful airtime despite a gentler approach angle.\n\nDive coasters are specifically designed around an exceptionally dramatic first drop experience — the wide train pauses at the crest before plunging beyond vertical. The beyond-vertical drops (over 90 degrees) of Oblivion at Alton Towers and SheiKra at Busch Gardens have been central to those rides' identities since their opening. The first drop is the most commonly filmed element in roller coaster POV and promotional footage, and the moment most riders describe when recounting a coaster experience to someone who hasn't ridden it.",
    relatedTermIds: ['lifthill', 'airtime', 'airtime-hill', 'dive-coaster'],
  },
  {
    id: 'airtime-hill',
    name: 'Airtime Hill',
    shortDefinition:
      'A hill-shaped element engineered to produce negative G-forces, causing riders to float or be lifted from their seats.',
    definition:
      "An airtime hill (also called a camelback) is a rise-and-fall element specifically engineered to produce negative G-forces — the sensation of floating or being ejected from the seat. The hill profile follows a parabolic trajectory that keeps the train in what engineers call a 'free-fall arc', maximising the duration and intensity of the negative-G phase. Floater airtime hills produce mild, comfortable floating; ejector airtime hills are shaped more aggressively and produce intense, seat-leaving sensations where the lap bar is genuinely the only restraint between the rider and the sky.\n\nSteel coasters use precisely machined parabolic profiles for consistent, repeatable airtime on every run. Wooden coasters produce more varied airtime due to track flex and the natural irregularities of wood construction. The quality and quantity of airtime hills is one of the most important variables in enthusiast rankings of coasters — hyper coasters like Shambhala at PortAventura, Goliath at Walibi Holland, and Silver Star at Europa-Park are celebrated primarily for their sustained sequences of powerful airtime hills.",
    relatedTermIds: ['airtime', 'bunnyhop', 'first-drop', 'stengel-dive'],
  },
  {
    id: 'helix',
    name: 'Helix',
    shortDefinition:
      'A continuous spiralling section where the track wraps around a central axis, generating sustained lateral G-forces.',
    definition:
      "A helix is a section of coaster track that spirals continuously — like a screw thread — without inverting the riders. Unlike airtime hills or inversions, helices generate sustained lateral (sideways) G-forces that press riders into the outside of the turn. A descending helix converts potential energy to speed while generating lateral force; an ascending helix bleeds speed while maintaining lateral pressure.\n\nHelices are commonly used near the end of a layout to spend the train's remaining kinetic energy while providing an exciting, sustained turning sensation rather than an abrupt stop. The underground finale of Nemesis at Alton Towers — a tight descending helix carved into a rocky pit — is one of Europe's most celebrated helix moments. Expedition GeForce at Holiday Park in Germany closes with a famous positively-G-loaded helix that pins riders firmly into their seats. A well-designed helix can be as exciting as an inversion despite involving no upside-down element whatsoever.",
    relatedTermIds: ['horseshoe', 'first-drop'],
  },
  {
    id: 'block-brake',
    name: 'Block Brake',
    shortDefinition:
      'A braking section dividing the circuit into independent segments, allowing multiple trains to run simultaneously without collision risk.',
    definition:
      "A block brake divides a coaster's circuit into separate independent sections called blocks, each designed to hold exactly one train at any time. If a train ahead slows or stops, the control system automatically holds all following trains at their block brake positions. This safety architecture allows parks to operate multiple trains simultaneously — dramatically increasing hourly capacity — without any risk of collision between trains.\n\nBlock brakes are positioned at points where a stopped train will not roll backward under gravity, typically on a flat section or slight uphill. They use either magnetic eddy-current brakes (contactless, no wear) or friction brake fins. The mid-course brake run (MCBR), positioned roughly halfway through a layout, is the most visible type of block brake. When MCBR brakes trim speed excessively — a common enthusiast complaint — airtime hills and inversions later in the layout feel less intense than the designer intended.",
    relatedTermIds: ['brake-run', 'ride-capacity', 'stacking'],
  },
  {
    id: 'brake-run',
    name: 'Brake Run',
    shortDefinition:
      'The deceleration section at the end of a ride where the train slows to station-entry speed.',
    definition:
      "The brake run is the section of track following the main ride circuit where the train decelerates from full ride speed to a safe station-approach speed. Modern brake runs use eddy-current (magnetic) brakes — rows of permanent magnetic fins that interact with metal fins on the train's underside, generating resistance through electromagnetic induction with no physical contact, no friction, and no wear. Older coasters used pneumatic caliper brakes that squeezed the track directly.\n\nA mid-course brake run (MCBR) placed partway through the layout functions as a block section for multi-train operation: if the station is occupied, the train holds at the MCBR until it clears. The final brake run before the station can deliberately use lighter braking to preserve speed for a more dynamic station entry — an approach that also gets the train into the station faster and improves overall throughput.",
    relatedTermIds: ['block-brake', 'lifthill'],
  },
  {
    id: 'cobra-roll',
    name: 'Cobra Roll',
    shortDefinition:
      "A double-inversion B&M signature element shaped like a cobra's raised head — two inversions connected by a 180-degree twist at the apex.",
    definition:
      "The cobra roll is one of B&M's most recognisable signature elements, consisting of two inversions in rapid succession: the track curves upward into a half-loop, rotates 180 degrees at the top passing through a brief inverted section, then mirrors the movement to exit in the same direction as entry. Viewed from the side, the track outline resembles a cobra's raised and spread hood — the element is sometimes described as two Immelmanns placed back-to-back but entering from the same side.\n\nCobra rolls are a defining feature of B&M inverted coasters worldwide and appear on many of their sit-down looping coasters as well. Famous cobra rolls appear on Dragon Khan at PortAventura — one of the most recognised European coasters — as well as on B&M inverted coasters across the continent. The element delivers two full inversions in a compact space with smooth, predictable G-forces, making it a reliable crowd-pleaser that works well in the middle sections of a layout.",
    relatedTermIds: ['inversion', 'immelmann', 'batwing', 'b-and-m', 'banana-roll', 'sea-serpent'],
  },
  {
    id: 'corkscrew',
    name: 'Corkscrew',
    shortDefinition:
      'A classic barrel-roll inversion where the track spirals 360 degrees around a central axis — one of the earliest inversion types ever built.',
    definition:
      'The corkscrew is one of the earliest modern inversions, introduced by Arrow Dynamics in the 1970s. The track spirals around a central axis like a wine corkscrew, rotating riders through a complete 360-degree roll that is offset from the direction of travel. Corkscrews are often paired back-to-back and were the defining inversion element of the classic-era steel coaster from the mid-1970s through the early 1990s.\n\nThe German term Korkenzieher is widely used on European park maps and signage. While newer inversion designs such as the zero-G roll, inline twist, and heartline roll have largely superseded the corkscrew in modern construction for the ride quality they provide, the corkscrew remains a beloved element at many parks across Europe and North America. It carries significant historical weight as the element that proved inversions could be comfortable, repeatable, and safe — paving the way for everything that followed.',
    relatedTermIds: ['inversion', 'inline-twist', 'flat-spin'],
  },
  {
    id: 'dive-loop',
    name: 'Dive Loop',
    shortDefinition:
      'The mirror image of an Immelmann — the track dives steeply downward through a half-loop and exits in the opposite direction.',
    definition:
      'A dive loop (also called a dive turn or reverse Immelmann) is the geometric inverse of the Immelmann: rather than pulling up into a half-loop from below, the track dives steeply downward, arcing through the bottom half of a loop before exiting pointing in the opposite direction to entry. The sensation is of a swooping downward plunge followed by a forceful pull-out at the bottom — the strong positive Gs at the exit are the opposite of the negative Gs felt at the top of an Immelmann.\n\nDive loops are a B&M signature element appearing on inverted coasters, sit-down loopers, and hyper coasters. They work particularly well in inversion sequences because their geometry complements the Immelmann — the two elements produce contrasting sensations and can be alternated through a layout to vary the ride experience. Together, Immelmanns and dive loops are the workhorses of B&M inversion design.',
    relatedTermIds: ['inversion', 'immelmann', 'b-and-m'],
  },
  {
    id: 'inline-twist',
    name: 'Inline Twist',
    shortDefinition:
      "A single 360-degree roll directly around the track axis, delivering a smooth inversion without significantly changing the train's heading.",
    definition:
      'An inline twist (also called an inline roll or barrel roll) rotates the train 360 degrees around the longitudinal axis of the track — the coaster essentially rolls without deviating significantly from its direction of travel. Unlike a corkscrew, which has a spiral geometry offset from the track centreline, the inline twist pivots precisely around the track itself. The result is a smooth, brief inversion with minimal lateral forces.\n\nInline twists are common on B&M flying coasters, inverted coasters, and some hyper coasters, often appearing in pairs or combined with other elements in rapid sequences. The element produces a momentary upside-down experience that riders frequently describe as surprisingly gentle despite the complete rotation. Because the inline twist does not cause a direction change, it integrates cleanly into straight or curved sections of track without disrupting the overall flow of the layout.',
    relatedTermIds: ['inversion', 'corkscrew', 'heartline-roll', 'flat-spin'],
  },
  {
    id: 'heartline-roll',
    name: 'Heartline Roll',
    shortDefinition:
      "A 360-degree roll centred on the rider's centre of gravity rather than the track, delivering smooth, sustained near-weightlessness through the rotation.",
    definition:
      "A heartline roll (or heartline spin) is engineered so that the rider's heart — approximately the body's centre of gravity — remains at a constant elevation throughout the rotation, rather than the track being the pivot point. By keeping the centre of mass stationary, the design minimises G-forces throughout the roll, producing a smooth floating sensation quite distinct from the jolt of a standard corkscrew or even an inline twist.\n\nHeartline rolls are a hallmark of modern B&M and Intamin hyper coaster design, where the engineering philosophy prioritises smooth, sustained sensations over sudden jolts. The element illustrates a broader truth about coaster design: the difference between a comfortable ride and an uncomfortable one often comes down to subtle track geometry decisions that are invisible to riders but felt in every bone. Heartline rolls appear on several of B&M's most celebrated hyper coasters and on Intamin's best-regarded multi-element coasters.",
    relatedTermIds: ['inversion', 'zero-g-roll', 'inline-twist'],
  },
  {
    id: 'sidewinder',
    name: 'Sidewinder',
    shortDefinition:
      "A half-loop combined with a half-corkscrew that rotates the train 90 degrees and reverses direction — the building block of Vekoma's Boomerang coaster.",
    definition:
      "A sidewinder consists of a half vertical loop pulling the train upward, immediately followed by a half corkscrew that rotates the train right-side-up while turning 90 degrees. The net result is an inversion combined with a significant directional change achieved in a very compact footprint. Two sidewinder elements form the outer boundaries of Vekoma's iconic Boomerang layout, flanking a central vertical loop to create the complete three-inversion circuit that is ridden twice.\n\nThe sidewinder name reflects the snake-like twisting motion the element produces when viewed from trackside — a visual that is immediately distinctive. As a standalone element the sidewinder is mainly associated with Vekoma's Boomerang and Giant Inverted Boomerang models, but the underlying geometry (half-loop plus half-corkscrew) appears in various forms across other manufacturer's designs under different names.",
    relatedTermIds: ['inversion', 'boomerang', 'cobra-roll'],
  },
  {
    id: 'pretzel-loop',
    name: 'Pretzel Loop',
    shortDefinition:
      'A massive inversion on B&M flying coasters where riders in the horizontal Superman position pass through the bottom of a vertical loop while fully inverted.',
    definition:
      'The pretzel loop is one of the most intense inversions in theme park design, found exclusively on B&M flying coasters where riders lie in a horizontal (Superman) position. The element sends riders diving steeply downward while inverted, through the low point of a large vertical loop, then pulls them sharply upward again — the overall track shape resembling a pretzel when viewed from the side. Because the lowest point of the loop is at the bottom and riders are face-down, the positive G-forces experienced at that moment are extremely intense, often exceeding 4g.\n\nThe pretzel loop is the signature centrepiece element of every B&M flying coaster. Famous examples include Manta at SeaWorld Orlando, Tatsu at Six Flags Magic Mountain, and Superman: La Atracción de Acero at Six Flags México. The element is universally regarded as one of the most physically demanding inversions in any theme park experience, and its placement determines much of the overall intensity profile of the coaster layout it anchors.',
    relatedTermIds: ['inversion', 'b-and-m', 'inline-twist'],
  },
  {
    id: 'batwing',
    name: 'Batwing',
    shortDefinition:
      'A double-inversion with a 180-degree direction reversal combining two half-loops connected by a half-corkscrew, forming a bat-wing shape overhead.',
    definition:
      "A batwing consists of two inversions with an embedded direction reversal: the track arcs up into a half-loop, then at the top a half-corkscrew inverts the train and reverses direction before mirroring the half-loop back to ground level. Viewed from overhead, the track outline resembles spread bat wings. Unlike the bowtie (which has two inversions without a direction change), the batwing reverses the train's heading by 180 degrees during the element.\n\nBatwings are a signature B&M element, found on inverted coasters including Afterburn at Carowinds and The Incredible Hulk Coaster at Universal's Islands of Adventure. The element produces a complex series of sensations — an upward arc, a twisting inversion overhead, and a returning sweep — that feels quite different from a standard back-to-back pair of inversions. It is visually dramatic and immediately recognisable from the ground as one of the more unusual track shapes in coaster design.",
    relatedTermIds: ['inversion', 'bowtie', 'cobra-roll', 'b-and-m'],
  },
  {
    id: 'norwegian-loop',
    name: 'Norwegian Loop',
    shortDefinition:
      'A loop variant where the train enters from the top, dives through the circular path, and exits at the top — the inverse geometry of a standard vertical loop.',
    definition:
      "The Norwegian loop (sometimes called a reverse loop) has the opposite geometry to a standard vertical loop: rather than entering at the bottom and exiting at the same height after a full circle, the train enters from an elevated position, dives down through the circular loop path, and exits again at the top. The strong positive G-forces at the bottom of the circle are still present — the loop geometry hasn't changed — but the entry and exit sensations are entirely different, creating a dive-and-recover feeling rather than the classic loop pull-out.\n\nNorwegian loops are relatively uncommon in the global coaster inventory, appearing primarily on certain Vekoma designs and a small number of custom installations. They occupy an interesting niche: the element is technically a full inversion but feels quite different from a standard loop because of the altered entry approach. Their rarity makes them a notable point of interest for enthusiasts seeking out unusual coaster elements.",
    relatedTermIds: ['inversion', 'vertical-loop', 'dive-loop'],
  },
  {
    id: 'flat-spin',
    name: 'Flat Spin',
    shortDefinition:
      'A corkscrew-type inversion on inverted coasters where the spiral occurs in a nearly horizontal plane, creating a sweeping, wide rotation.',
    definition:
      "A flat spin is a corkscrew-type inversion found primarily on B&M inverted and flying coasters, where the geometry of the element is arranged so the spiral appears nearly horizontal to observers on the ground. On an inverted coaster — where the train hangs below the track with riders' feet dangling freely — a flat spin creates a particularly dramatic visual as riders sweep through a wide, nearly level circle at high speed, feet sweeping outward in a broad arc.\n\nFor riders, the flat spin produces a smooth, sustained rotation with moderate G-forces and a strong sense of sweeping speed rather than sudden directional change. It is a signature element on B&M inverted coasters such as Banshee at Kings Island and Afterburn at Carowinds — both considered among the finest inverted coasters in North America. In Europe, several B&M inverted installations including Katun at Mirabilandia feature flat spins as part of their inversion sequence.",
    relatedTermIds: ['inversion', 'corkscrew', 'inline-twist', 'b-and-m'],
  },
  {
    id: 'cutback',
    name: 'Cutback',
    shortDefinition:
      "A half-corkscrew inversion that simultaneously reverses the train's direction by approximately 180 degrees.",
    definition:
      'A cutback is an element where the track performs a half-corkscrew while curving back on itself by roughly 180 degrees. The result is an inversion combined with a significant direction reversal — distinct from a standard corkscrew, which rotates the riders but largely maintains the direction of travel. The name reflects the visual appearance: the track cuts back on its own previous heading while simultaneously flipping the riders through an inversion.\n\nCutbacks are relatively uncommon and appear mainly on certain Vekoma models and custom coasters where a compact directional change combined with an inversion is required. They tend to produce a more jarring sensation than smoothly engineered inversions like the Immelmann or zero-G roll because the dual motion of direction reversal and rotation creates complex simultaneous G-forces. Enthusiasts studying coaster layouts sometimes use the cutback as a reference point when analysing how different manufacturers solve the engineering challenge of packing directional changes into tight spaces.',
    relatedTermIds: ['inversion', 'corkscrew', 'sidewinder'],
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    shortDefinition:
      'A double-inversion element similar to a sea serpent with a lower connecting apex, producing two inversions in a compact vertical footprint.',
    definition:
      "The butterfly is a double-inversion element consisting of two half-loops connected at a relatively low apex. Like the sea serpent (two half-loops connected at a high peak), it produces two full inversions without changing the train's direction. The butterfly's lower connecting section distinguishes it from both the sea serpent (higher apex) and the bowtie (different geometric proportions) and from the batwing (which has an embedded direction change).\n\nThe butterfly is not a widely built element and appears on a small number of Vekoma and custom coaster designs. Its double-inversion nature in a compact vertical footprint makes it attractive for layouts with space constraints. For enthusiasts it represents one of the more obscure entries in the inversion taxonomy — a useful illustration of how many variations designers have found on the basic geometry of turning riders upside down.",
    relatedTermIds: ['inversion', 'bowtie', 'batwing'],
  },
  {
    id: 'bowtie',
    name: 'Bowtie',
    shortDefinition:
      'A double-inversion element where two mirrored half-loops form a bowtie shape — two inversions without a direction change.',
    definition:
      'A bowtie is a double-inversion element consisting of two mirrored half-loops connected at their shared peak. Unlike the batwing (which includes a directional reversal), the bowtie exits in the same general heading it entered. When viewed from above, the track outline resembles a bow tie. The element produces two smooth inversions in rapid succession while maintaining the overall direction of travel.\n\nBowties are relatively rare in the global coaster inventory and are found primarily on certain Vekoma and custom installations. Despite a superficially similar appearance to the batwing, the absence of a direction change produces a noticeably different ride sensation — the bowtie feels more like a flowing pair of loops rather than the twisting, reversing complexity of a batwing. The distinction between a bowtie and a batwing is a frequent reference point in enthusiast discussions about inversion taxonomy.',
    relatedTermIds: ['inversion', 'batwing', 'butterfly'],
  },
  {
    id: 'bunnyhop',
    name: 'Bunny Hop',
    shortDefinition:
      'A series of small, quick airtime hills near the end of a ride producing gentle floater airtime as the train loses speed.',
    definition:
      "Bunny hops are a series of small, rapid hills placed toward the end of a coaster layout when the train has shed most of its kinetic energy. At this reduced speed, each hill generates gentle floater airtime — a soft, rhythmic floating sensation rather than the intense ejector airtime of the faster hills earlier in the layout. The name reflects the light, bouncing motion that resembles a rabbit's series of hops.\n\nBunny hops are a classic design feature on hyper coasters, giga coasters, and wooden coasters, providing a lighthearted and energetic final flourish before the brake run. They require relatively little vertical height to be effective at low speeds, making them an efficient use of the final terrain. Many enthusiasts consider a well-executed bunny hop sequence a mark of thoughtful layout design — squeezing maximum enjoyment out of the dying moments of a ride rather than simply ending on a brake run.",
    relatedTermIds: ['airtime', 'airtime-hill', 'brake-run'],
  },
  {
    id: 'stengel-dive',
    name: 'Stengel Dive',
    shortDefinition:
      'An overbanked airtime hill tilted beyond 90 degrees, combining lateral disorientation with negative G-forces — a Mack Rides signature element named after engineer Werner Stengel.',
    definition:
      "The Stengel Dive is an airtime element where the track banks beyond 90 degrees (past vertical) so that riders hang sideways or slightly overhead while simultaneously experiencing negative G-forces from the hill profile. This unique combination of lateral disorientation and airtime produces a sensation unlike any standard hill or inversion — riders float out of their seats while the world tips sideways beneath them.\n\nThe element is named after Werner Stengel, the German engineer responsible for the design geometry of some of history's most important coasters. Stengel Dives are a defining signature of Mack Rides' hyper coaster portfolio: Blue Fire Megacoaster at Europa-Park was the first coaster to feature one. Subsequent Mack hypers including Ride to Happiness at Plopsaland de Panne and Kondaa at Walibi Belgium include multiple examples in their layouts, and both rides are consistently regarded as among Europe's finest coasters by the enthusiast community.",
    relatedTermIds: ['airtime-hill', 'mack-rides', 'airtime'],
  },
  {
    id: 'horseshoe',
    name: 'Horseshoe',
    shortDefinition:
      'A sharply banked 180-degree turnaround shaped like a horseshoe, used to redirect the train between launch segments on multi-launch coasters.',
    definition:
      'A horseshoe is a heavily banked semicircular turn — typically banked 75 to 90 degrees — that redirects the coaster 180 degrees, reversing its heading. The extreme banking prevents excessive lateral G-forces at the tight radius required for the turnaround. Horseshoes are most commonly found in launched coaster layouts as directional turnarounds between multiple launch segments, giving the train a u-turn before the next acceleration phase.\n\nThe element is visually striking and has become a hallmark of Intamin accelerator coasters and Mack multi-launch coasters. On Taron at Phantasialand, horseshoe-style turnarounds efficiently redirect the train between its two launch segments within an intricately sculpted volcanic environment. The element also appears on Top Thrill Dragster-style accelerator coasters where it connects the outbound and return portions of the track. At high speed, the banking of a horseshoe produces significant positive G-forces that pin riders into their seats.',
    relatedTermIds: ['launch-coaster', 'intamin', 'mack-rides'],
  },
  {
    id: 'predrop',
    name: 'Pre-Drop',
    shortDefinition:
      'A small dip just before the main first drop on a chain-lift coaster, easing chain tension and delivering a brief anticipatory moment of airtime.',
    definition:
      'A pre-drop is a small hill or valley positioned on the final section of the lift hill, just before the crest that leads to the main first drop. Its primary engineering function is to reduce tension on the lift chain as the train crests — preventing a jarring or rough transition from the powered chain segment to the unpowered free-fall drop. Without a pre-drop, the chain must support the full weight of the train through the crest, which can create noise, wear, and an uncomfortable jolt.\n\nA secondary benefit is purely experiential: the brief airtime pop as the train crests the pre-drop gives riders a teaser of weightlessness before the main plunge begins. Pre-drops have become a popular and widely appreciated design feature on both wooden and steel coasters. The pre-drop on Goliath at Six Flags Magic Mountain became famous among enthusiasts for the intensity of its airtime moment despite being a preparatory element rather than a headline feature.',
    relatedTermIds: ['lifthill', 'first-drop', 'airtime'],
  },
  {
    id: 'top-hat',
    name: 'Top Hat',
    shortDefinition:
      'A tall, narrow element with near-vertical ascent and descent — the signature centrepiece of hydraulic-launch Intamin accelerator coasters.',
    definition:
      "A top hat is a distinctive element where the track climbs nearly vertically to a sharp, narrow crest, then descends nearly vertically on the other side — the profile resembling a top hat when viewed from the side. It is the centrepiece element of Intamin's hydraulic launch accelerator coasters: after the initial launch accelerates the train to 200 km/h or more in under four seconds, the top hat is the immediate theatrical payoff — a vertical wall of track rushing upward to an impossibly narrow peak.\n\nInside top hats bank the track slightly inward at the peak; outside top hats bank outward, exposing riders to an airtime-heavy, widely open sensation at the crest. Kingda Ka at Six Flags Great Adventure (139 m) and Top Thrill Dragster at Cedar Point (128 m) feature the world's most iconic top hats. In Europe, Red Force at Ferrari Land in Tarragona reaches 112 m with a classic Intamin top hat after its hydraulic launch to 180 km/h.",
    relatedTermIds: ['launch-coaster', 'intamin', 'first-drop'],
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    shortDefinition:
      'A compact Vekoma coaster model that sends riders through three inversions twice — once forward, once backward — in a back-and-forth layout.',
    definition:
      "The Boomerang is one of the most widely built roller coaster models in history, manufactured by Vekoma. The layout includes a vertical loop flanked by two sidewinder elements, traversed first forward, then in reverse after the train is pulled up a second inclined lift section and released backward through the same elements. This back-and-forth design delivers six inversions (three in each direction) in a very compact footprint, making it ideal for parks with limited space or budget.\n\nOver 50 Boomerang coasters were built worldwide; the model is found at parks on every inhabited continent and became synonymous with the budget end of the thrill coaster market. The older Boomerang models have a well-known rough ride quality owing to their Arrow Dynamics-derived inversion geometry, which produces sharp G-force transitions. Vekoma's new-generation designs have addressed the smoothness issue, but the original Boomerang remains operational at dozens of mid-sized parks around the world and is often a visitor's first inversion-equipped roller coaster.",
    relatedTermIds: ['inversion', 'sidewinder', 'vertical-loop'],
  },
  {
    id: 'euro-fighter',
    name: 'Euro-Fighter',
    shortDefinition:
      'A compact Gerstlauer coaster model featuring a vertical or beyond-vertical first drop after a vertical lift hill, delivering intense thrills in a small footprint.',
    definition:
      "The Euro-Fighter is Gerstlauer's signature compact coaster model, immediately recognisable by its vertical chain lift (which pulls the train straight upward like a tower) and its first drop of 90 degrees or beyond-vertical (up to 97 degrees). Designed for parks with limited space, Euro-Fighters pack intense thrills — multiple inversions, tight turns, and high G-forces — into a very small area. The beyond-vertical drop is particularly notable: the train pauses at the top of the vertical lift with riders leaning out over the void before plunging past the vertical plane.\n\nEuropean Euro-Fighters include Saw – The Ride at Thorpe Park, Rage at Adventure Island (Southend-on-Sea), and Fluch von Novgorod at Hansa-Park in Germany. The compact nature of the design has made Euro-Fighters a popular choice for parks in urban settings or with irregular terrain, and the beyond-vertical first drop has become one of the most talked-about single moments in mid-scale coaster design.",
    relatedTermIds: ['first-drop', 'inversion', 'lifthill'],
  },
  {
    id: 'dive-coaster',
    name: 'Dive Coaster',
    shortDefinition:
      'A coaster type featuring an unusually wide train and a near-vertical or beyond-vertical drop with a deliberate pause at the crest before plunging.',
    definition:
      "A dive coaster is characterised by a wide train — typically four to eight riders across per row — a near-vertical or beyond-vertical drop (90 degrees or more), and a theatrical pause at the top of the drop where the train holds momentarily at the crest before releasing. The wide train gives every rider an unobstructed view straight down into the drop, amplifying the psychological anticipation. The pause is not an accident: it is a deliberate design decision to maximise tension before the plunge.\n\nB&M's Dive Machine line popularised the concept with Oblivion at Alton Towers (1998) — Europe's first dive coaster — and SheiKra at Busch Gardens Tampa. In Europe, Valkyria at Liseberg, Dive to Atlantis at Gardaland, and Baron 1898 at Efteling are celebrated Dive Machine installations. Gerstlauer offers a competing Dive Coaster model for smaller spaces. The combination of wide train, extreme drop angle, and deliberate pause makes dive coasters among the most immediately communicable experiences in theme park marketing.",
    relatedTermIds: ['first-drop', 'b-and-m', 'euro-fighter', 'launch-coaster'],
  },
  {
    id: 'credit',
    name: 'Credit',
    shortDefinition:
      'A roller coaster an enthusiast has ridden and logged to their personal count — collecting credits is a defining hobby in the coaster community.',
    definition:
      "A coaster credit (or simply 'credit' or 'cred') is a roller coaster that an enthusiast has ridden and officially added to their personal count. The practice of collecting credits — riding as many different coasters as possible — is one of the defining activities of the roller coaster enthusiast community. Rules about what counts vary: some count only conventional coasters, others include water coasters, family coasters, or even kiddie coasters; some require riding every version of a coaster on the same ride hardware to count it once, others count any ridden layout.\n\nTracking sites like the Roller Coaster Database (RCDB) and apps like Coaster Count allow enthusiasts to log and share their totals. The pursuit of credits has motivated thousands of enthusiasts to travel internationally, plan trips around obscure parks that house rare or historic coasters, and seek out every last installation of a model type. For many, reaching milestones (100 credits, 500, 1,000) is a meaningful personal goal that shapes their travel for years.",
    relatedTermIds: ['pov', 'wooden-coaster', 'hybrid-coaster'],
  },
  {
    id: 'pov',
    name: 'POV',
    shortDefinition:
      'Point-of-view footage filmed from the front row of a coaster, letting prospective riders virtually preview the full experience.',
    definition:
      'POV (Point of View) refers to on-ride video footage recorded from the perspective of a front-row rider, with a camera typically mounted to the train or a helmet rig. POV videos are one of the most popular content formats in the theme park community and are widely used by prospective visitors to preview a coaster before travelling to a park. A good POV shows every element, drop, and inversion in sequence, communicating the pace, intensity, and layout of a ride in a way that no verbal description can match.\n\nPark operators sometimes produce official POVs for promotional purposes; more often they are filmed by enthusiasts, media, or during special guest events. YouTube hosts tens of thousands of coaster POV videos covering installations worldwide. The term is also used more broadly for any first-person perspective footage of theme park attractions, including dark rides and water rides. For a new coaster opening, the release of official POV footage is often a major community event that drives significant viewer interest.',
    relatedTermIds: ['credit', 'dark-ride'],
  },
  {
    id: 'vr-coaster',
    name: 'VR Coaster',
    shortDefinition:
      'A roller coaster enhanced with VR headsets displaying a synchronised virtual experience that overlays the physical ride.',
    definition:
      'A VR coaster equips riders with virtual reality headsets — typically Samsung Gear VR or purpose-built devices — that display a synchronised virtual environment matching the physical movements of the coaster. As the train pulls Gs through a loop, the virtual world mirrors the sensation; as it drops, the virtual world plunges. The physical ride becomes the motion platform for an immersive animated or gaming experience.\n\nVR coasters became popular between approximately 2015 and 2019, with many parks retrofitting existing coasters. Reception has been mixed: some guests love the immersive overlay; others find the headsets uncomfortable, claustrophobic, unsanitary, or motion-sickness-inducing, and criticise the added loading time that reduces throughput and lengthens queues. Many parks that introduced VR have since removed it. A small number of dedicated VR coaster experiences — notably products from Mack Rides — have achieved better reception by designing the physical and virtual elements together from the start.',
    relatedTermIds: ['dark-ride', 'height-requirement'],
  },
  {
    id: 'ert',
    name: 'ERT',
    shortDefinition:
      'Exclusive Ride Time — private access to one or more attractions for a small group, with no general public queue.',
    definition:
      'ERT (Exclusive Ride Time) is a period during which a selected group — typically members of a coaster enthusiast club, resort hotel guests with premium packages, or season pass holders at special events — have exclusive access to a ride or set of rides with the general public excluded. During ERT, participants can ride repeatedly with minimal waiting, often achieving dozens of rides in a single session that would take multiple full park days in normal operation.\n\nERT events are organised by parks for club meetups (European Coaster Club, American Coaster Enthusiasts, and dozens of national organisations worldwide), for premium resort hotel packages offering before-hours or after-hours ride access, or as part of hard ticket events. For coaster enthusiasts, ERT is among the most prized theme park experiences — riding a coaster 15 or 20 times in succession, in different row positions, at different times of day, reveals its true character and nuances in a way that a single ride in a full-day crowd simply cannot.',
    relatedTermIds: ['hard-ticket-event', 'early-entry', 'rope-drop', 'credit'],
  },
  {
    id: 'touring-plan',
    name: 'Touring Plan',
    shortDefinition:
      'A detailed, optimised itinerary sequencing attractions to minimise total wait time and maximise rides in a single day.',
    definition:
      "A touring plan is a pre-planned sequence of attractions, meal breaks, show times, and park movements designed to minimise total time spent in queues throughout a day. Effective touring plans account for crowd patterns (which areas of the park build queues earliest), attraction capacities, queue dynamics, show schedules, walking distances, and weather. On a peak day at a major park, a well-executed touring plan can cut total queuing time by 30–50% compared to a spontaneous approach.\n\nSites like TouringPlans.com (now Thrill-Data) have published crowd-sourced, data-driven plans for major parks for over two decades. park.fan's live wait times and crowd calendar are complementary planning tools — real-time wait data allows on-the-fly adjustment of your plan throughout the day. When a ride you planned to do in the morning unexpectedly posts a 15-minute standby at 2 PM due to a queue drop, knowing that immediately allows you to redirect. The combination of advance planning and live data is more powerful than either alone.",
    relatedTermIds: ['crowd-calendar', 'rope-drop', 'wait-time', 'early-entry'],
  },
  {
    id: 'stacking',
    name: 'Stacking',
    shortDefinition:
      'A situation where multiple coaster trains accumulate in the brake run because the station is not clearing fast enough — reducing throughput and extending wait times.',
    definition:
      "Stacking occurs when a roller coaster's loading and unloading process is slower than the ride cycle time, causing trains to accumulate in the brake run waiting for the station to clear. Instead of dispatching one train as the previous one returns from its circuit, the operator must hold multiple trains in the brake run — bringing the ride to a brief stop between each dispatch. Every second a train stacks directly reduces hourly capacity and extends the standby queue wait time.\n\nCommon causes include slow guest loading (often because of complex restraint systems such as over-the-shoulder harnesses that require individual adjustment), bag check requirements, understaffing, or slow guests in specific seats. Experienced park visitors can observe stacking from the queue: watching whether a train is waiting in the brake run when the station dispatches is a reliable indicator of operational efficiency. Notably, some rides with excellent ride experiences are undermined by consistent stacking — a coaster's theoretical capacity and its actual operated capacity can differ substantially.",
    relatedTermIds: ['block-brake', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'inverted-coaster',
    name: 'Inverted Coaster',
    shortDefinition:
      "A coaster where the track runs above the train and riders' feet dangle freely beneath — providing uniquely exposed, head-chopper sensations.",
    definition:
      "An inverted coaster is a roller coaster where the track sits above the vehicle and riders' feet dangle freely below. Unlike a suspended coaster (which swings side to side on a pivot), the inverted coaster's train is rigidly attached to the rail overhead. This configuration places riders in an exposed position with nothing below their feet, creating the characteristic 'head-chopper' near-miss effects as the train sweeps close to structures, rocks, and theming at high speed.\n\nB&M pioneered the modern inverted coaster design in 1992 with Batman: The Ride and remains the dominant manufacturer. Inverted coasters are renowned for intense near-miss theming effects, smooth inversions, and the uniquely exposed sensation of dangling feet. Famous European examples include Nemesis at Alton Towers (widely regarded as one of Europe's finest coasters), Katun at Mirabilandia in Italy, Oziris at Parc Astérix in France, and Kondor at Phantasialand.",
    relatedTermIds: ['b-and-m', 'inversion', 'wing-coaster'],
  },
  {
    id: 'wing-coaster',
    name: 'Wing Coaster',
    shortDefinition:
      'A coaster type with seats extending on either side of the track, so riders have nothing above, below, or beside them — maximising the sensation of flight.',
    definition:
      "A wing coaster (also called a wing rider) places two seats on each side of the track, extending outward on pivoting arms so that riders have nothing above, below, or beside them — just open air in every direction. This design maximises the sense of flight and creates uniquely close near-miss interactions with trackside structures, rocks, and theming elements. On a wing coaster, the outside seats of a zero-G roll produce an extraordinarily open, exposed sensation.\n\nB&M is the primary manufacturer of wing coasters worldwide. Well-known European examples include Flug der Dämonen at Europa-Park — one of Europe's most highly rated coasters in enthusiast polls — The Swarm at Thorpe Park, and X Flight at Six Flags Great America. Wing coasters have become one of B&M's most successful product lines because the open seating design appeals to guests who find traditional over-the-shoulder harnesses intimidating, while the near-miss effects provide spectacle for onlookers as well as riders.",
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'dive-coaster'],
  },
  {
    id: 'spinning-coaster',
    name: 'Spinning Coaster',
    shortDefinition:
      'A coaster where cars rotate freely on a vertical axis throughout the ride, so every run offers a different orientation.',
    definition:
      "A spinning coaster features cars mounted on a platform that rotates freely around a vertical axis throughout the ride. Because the rotation is uncontrolled, each individual run produces a different sequence of forward, backward, and sideways orientations through every element. The unpredictability is a significant part of the appeal — two consecutive rides on the same circuit can feel entirely different depending on how the car rotates.\n\nMack Rides and Gerstlauer are the leading manufacturers of spinning coasters. Mack's models are particularly well regarded for their smooth ride quality and family-friendly intensity level — they are often described as among the most accessible thrill rides available, offering genuine excitement without the intimidating height, speed, or restraint systems of major coasters. Efteling's Joris en de Draak and Flying Dutchman and Phantasialand's spinning coasters are popular European examples. Spinning coasters are widely regarded as excellent family rides and frequently have lower height requirements than equivalent non-spinning coasters.",
    relatedTermIds: ['mack-rides', 'launch-coaster', 'credit'],
  },
  {
    id: 'xtreme-spinning-coaster',
    name: 'Xtreme Spinning Coaster',
    shortDefinition:
      "Gerstlauer's high-intensity spinning coaster model — faster, taller, and more aggressively spinning than a standard spinning coaster.",
    definition:
      "The Xtreme Spinning Coaster (XSC) is Gerstlauer's top-tier spinning coaster model, designed to push the spinning coaster format to its limits. Where a standard spinning coaster tends toward family-friendly intensity, the XSC features a taller structure, steeper drops, higher top speeds, and a spinning mechanism tuned for more pronounced rotation — meaning riders spin harder and more frequently through every element of the layout.\n\nThe unpredictability of spinning is amplified by the faster pace: the car's orientation changes more rapidly, so the same ride can feel completely different from run to run. Restraints are typically an over-the-shoulder or lap-bar system designed to handle the more intense forces generated. The XSC model positions Gerstlauer in the gap between approachable family spinners and full-scale thrill coasters, offering genuine intensity while keeping the playful, replayable quality that makes spinning coasters appealing to a wide audience.",
    alternateNames: ['XSC'],
    relatedTermIds: ['spinning-coaster', 'gerstlauer', 'credit'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      'A coaster between 200 and 299 feet (61–91 m) tall — typically inversion-free and focused on sustained speed and airtime over large camelback hills.',
    definition:
      "Hyper coaster is the industry classification for roller coasters between 200 and 299 feet (approximately 61–91 m) in height. B&M and Intamin use slightly different terminology — B&M calls their designs Hyper Coasters while Intamin uses the term Mega Coaster — but the height range is consistent. Both manufacturers' hyper-class rides share the same design philosophy: long, flowing layouts with large camelback airtime hills at sustained high speed, typically without any inversions.\n\nShambhala at PortAventura in Spain is Europe's tallest hyper coaster at 76 m, often ranked among the continent's best coasters overall. Other celebrated European hypers include Goliath at Walibi Holland, Silver Star at Europa-Park, and Kondaa at Walibi Belgium (Mack Rides' take on the format). Globally, Mako at SeaWorld Orlando and Diamondback at Kings Island are considered benchmarks. The combination of sheer height, sustained speed, and repeated powerful airtime moments makes hyper coasters consistently the most popular ride type among dedicated enthusiasts.",
    relatedTermIds: ['giga-coaster', 'airtime', 'b-and-m', 'intamin', 'airtime-hill'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition:
      'A coaster exceeding 300 feet (91 m) in height — the category above hyper coasters, defined by extreme height and long, fast layouts.',
    definition:
      "Giga coaster is the classification for roller coasters between 300 and 399 feet (approximately 91–121 m) in height. The term was coined by Cedar Fair and Intamin when Millennium Force opened at Cedar Point in 2000 — the world's first 300-foot coaster. Giga coasters share the hyper coaster's emphasis on height, sustained speed, and airtime rather than inversions, but the additional height translates to greater maximum speeds and longer, more expansive layouts.\n\nAs of 2025 there are no giga coasters in Europe — the continent's tallest coasters top out in the hyper coaster range. Globally, Fury 325 at Carowinds is widely considered the world's best steel coaster by enthusiast polls, with its 325-foot height, 153 km/h top speed, and 2-km layout. Millennium Force at Cedar Point and Intimidator 305 at Kings Dominion are the other landmark examples. The absence of a European giga coaster is a frequent discussion topic among European enthusiasts, who point to planning permission challenges and site size constraints as the main barriers.",
    relatedTermIds: ['hyper-coaster', 'airtime', 'first-drop'],
  },
  {
    id: 'overbank',
    name: 'Overbanked Turn',
    shortDefinition:
      'A banked turn where the track tilts beyond 90 degrees, putting riders briefly past the inverted position without completing a full inversion.',
    definition:
      'An overbanked turn (or overbank) is a curve where the track banking exceeds 90 degrees — the outside rail rises above vertical, putting riders past the inverted position without completing a full 360-degree rotation. Riders are briefly tilted past upside-down, experiencing a mix of lateral G-forces and mild negative G at the peak of the banking, before the track returns to a normal orientation. It is technically not a full inversion because the rotation does not complete — but it looks dramatic from the outside and produces a distinctive visual and sensory experience.\n\nOverbanked turns are a signature element of modern B&M hypers and Intamin mega coasters, and are ubiquitous in RMC hybrid layouts where they often appear in rapid succession with airtime hills and inversions. They are frequently confused with full inversions by casual observers because the banking looks so extreme, but the sensation for riders is notably different — lateral and slightly negative rather than the sustained full-inversion experience of a loop or zero-G roll.',
    relatedTermIds: ['inversion', 'airtime', 'b-and-m', 'rmc', 'intamin'],
  },
  {
    id: 'trim-brake',
    name: 'Trim Brake',
    shortDefinition:
      "A mid-course magnetic or friction brake that reduces a coaster's speed without bringing the train to a full stop.",
    definition:
      "A trim brake is a braking mechanism placed mid-course on a roller coaster to reduce the train's speed before a specific section — unlike a block brake, it does not stop the train completely. Trim brakes are used to manage G-forces on demanding elements, reduce structural wear on the track, meet noise or vibration limits, or simply ensure the ride operates safely in all temperature and weight conditions.\n\nEnthusiasts have a complex relationship with trim brakes: they are often criticised for dampening a ride's energy, particularly when they reduce the speed approaching airtime hills or inversions that were designed to be hit at higher velocity. Whether a trim brake is active can vary by season (cold weather produces more brake engagement), train loading, and park policy. Some coasters have been observed to run dramatically better when trims are light — making the same layout feel like a different ride depending on conditions. Monitoring enthusiast reports can indicate whether trims are running heavily or lightly on a given day.",
    relatedTermIds: ['block-brake', 'brake-run', 'airtime'],
  },
  {
    id: 'rollback',
    name: 'Rollback',
    shortDefinition:
      'When a launched coaster fails to reach the top of its circuit and rolls backward down the launch track to the launch position.',
    definition:
      'A rollback occurs when a launched coaster does not generate enough speed to crest the highest point of the circuit and instead rolls backward under gravity to the launch position. On hydraulic launch coasters — the technology used by Intamin on Kingda Ka, Top Thrill Dragster, and Stealth at Thorpe Park — rollbacks happen when the hydraulic launch mechanism fails to deliver its full specified power. The train rolls back slowly and is caught by magnetic brakes at the bottom of the launch track.\n\nPassengers are not harmed during a rollback — the catch brake system is designed specifically for this scenario — but the ride is interrupted and guests must either wait for a re-launch or disembark. Rollbacks are a known characteristic of hydraulic launch coasters and occur with some regularity at parks that operate this technology. For many enthusiasts, experiencing a rollback — and the unexpectedly gentle backward drift after the failed launch — is itself a memorable event worth noting in their park diary.',
    relatedTermIds: ['launch-coaster', 'block-brake', 'downtime'],
  },
  {
    id: 'animatronics',
    name: 'Animatronics',
    shortDefinition:
      'Electro-mechanical robotic figures used in dark rides and shows to bring characters and scenes to life.',
    definition:
      "Animatronics are electro-mechanical robotic figures used in theme park attractions and live shows to portray characters, creatures, or scene elements in a realistic or fantastical way. Disney coined the term Audio-Animatronics (a registered trademark) for their synchronised audio-figure system, first demonstrated publicly at the 1964 New York World's Fair. The technology has evolved enormously since then — from simple cam-driven cyclic figures to sophisticated servo-driven robots with complex facial expressions, full-body articulation, and real-time responsive behaviour.\n\nModern animatronics at major parks represent extraordinary engineering achievements. The Na'vi Shaman of Songs in Pandora at Disney's Animal Kingdom and the life-sized dinosaurs in the Jurassic World ride at Universal are among the most technically sophisticated moving figures ever built. For many guests, a great animatronic figure is more convincing and emotionally affecting than any screen-based effect. Parks routinely cite animatronics as the single most expensive component of a new dark ride build.",
    relatedTermIds: ['dark-ride', 'themed-land', 'trackless-ride'],
  },
  {
    id: 'ai-forecast',
    name: 'AI Forecast',
    shortDefinition:
      'Machine-learning predictions of crowd levels and wait times at theme parks, generated up to 30+ days in advance.',
    definition:
      'An AI forecast uses machine learning models trained on historical attendance data, weather patterns, school holiday calendars, and real-time queue data to predict how busy a theme park or individual attraction will be on any given day or hour. park.fan generates AI forecasts for crowd levels and expected wait times up to 30+ days in advance.\n\nThe predictions are updated continuously as new data arrives. Near-term forecasts (1–7 days) are typically very accurate because recent weather, event announcements, and booking signals can be incorporated. Longer-range forecasts are naturally less precise but still valuable for planning — they identify reliably quiet or busy periods well ahead of time.\n\nAI forecasts differ from simple historical averages by adapting to current conditions: a theme park that has just announced a new attraction, a public holiday falling on a different weekday than usual, or an unusually warm spring weekend will all shift the prediction meaningfully away from the historical baseline.',
    relatedTermIds: ['crowd-calendar', 'peak-day', 'crowd-level'],
    aliases: ['AI Forecasts'],
  },
  {
    id: 'ki',
    name: 'AI',
    shortDefinition:
      'Artificial Intelligence — the machine-learning models that calculate crowd forecasts and wait time predictions.',
    definition:
      'AI (Artificial Intelligence) refers to the machine-learning algorithms that recognise patterns in large datasets and generate predictions. park.fan uses AI models trained on years of historical wait-time data, school holiday calendars, weather data, and event announcements to produce daily crowd and wait-time forecasts for every tracked park — up to 30+ days ahead.',
    relatedTermIds: ['ai-forecast', 'crowd-forecast', 'crowd-calendar'],
    alternateNames: ['Artificial Intelligence'],
  },
  {
    id: 'realtime-wait-time',
    name: 'Live Wait Time',
    shortDefinition: 'Wait time data pulled directly from park systems and updated every minute.',
    definition:
      "A live wait time is the current, real-time wait pulled from a park's own data systems — not a historical average, but the actual figure right now, to the minute. park.fan fetches live wait times from official park APIs and third-party sources and refreshes every minute, so you always know which attractions are running short queues and which are backed up.",
    relatedTermIds: ['wait-time', 'posted-wait-time', 'crowd-forecast'],
    aliases: ['Live Wait Times'],
    alternateNames: ['Real-Time Wait Time', 'Real-Time Wait Times'],
  },
  {
    id: 'crowd-forecast',
    name: 'Crowd Forecast',
    shortDefinition: 'AI-based prediction of how busy a theme park will be on a given day.',
    definition:
      'A crowd forecast is a data-driven prediction of how crowded a theme park will be on a particular day or at a specific time. park.fan recalculates crowd forecasts daily using historical attendance figures, school holiday calendars, weather data, and special events. The results feed directly into the crowd calendar: green days signal short queues, red days indicate peak crowds with long wait times.',
    relatedTermIds: ['crowd-calendar', 'ai-forecast', 'peak-day', 'crowd-level'],
    aliases: ['Crowd Forecasts'],
  },
  {
    id: 'opening-hours',
    name: 'Opening Hours',
    shortDefinition:
      'The official daily schedule showing when a theme park or attraction opens and closes.',
    definition:
      "Opening hours are the published daily schedule for a theme park or individual attraction — specifying when it starts admitting guests and when it stops operating. Most major parks publish a rolling schedule weeks or months in advance, though hours can change at short notice due to special events, seasonal adjustments, or operational issues.\n\npark.fan shows opening hours for each park and, where available, estimated operating hours for individual attractions. Hours marked as 'Est.' (Estimated) have been derived from historical patterns rather than confirmed by the park directly — they should be verified before planning a visit around a tight schedule.\n\nOpening hours matter enormously for strategy: parks that open early reward rope-drop visitors with shorter queues before the crowd builds; parks that close late offer a second window of shorter waits in the final hour of operation as casual visitors leave.",
    relatedTermIds: ['rope-drop', 'crowd-calendar', 'soft-opening'],
  },
  {
    id: 'wait-time-trend',
    name: 'Wait Time Trend',
    shortDefinition:
      'The direction of queue length change over the last 30 minutes — shown as rising, falling, or stable.',
    definition:
      "The wait time trend indicates whether a ride's queue is getting longer, shorter, or holding steady compared to 30 minutes ago. park.fan displays this as an arrow: upward (queue growing), downward (queue shrinking), or horizontal (stable).\n\nThe trend is often more actionable than the raw wait time itself. A ride showing 45 minutes with a falling trend is a better bet than a ride showing 40 minutes with a rapidly rising trend — by the time you arrive, the first queue may be at 30 minutes while the second could be at 55.\n\nTrend data is most valuable during the park's mid-morning and late-afternoon transition periods, when crowds shift quickly as different guest cohorts move through the park.",
    relatedTermIds: ['wait-time', 'posted-wait-time', 'crowd-level'],
  },
  {
    id: 'trackless-ride',
    name: 'Trackless Ride',
    shortDefinition:
      'A dark ride where vehicles navigate freely without fixed rails, guided by technology embedded in the floor.',
    definition:
      'A trackless ride is a type of dark ride where vehicles are not constrained to a fixed track but navigate autonomously through the attraction space, guided by induction loops, Wi-Fi positioning systems, or laser/optical guidance embedded in the floor. The freedom of movement allows for dramatically more complex scene layouts, non-linear storytelling, and sequences where vehicles approach scenes from multiple angles, spin to face different directions, or travel through the same space as other vehicles simultaneously.\n\nTrackless technology is increasingly the standard for major new dark ride investments. Star Wars: Rise of the Resistance at Disneyland Paris and Walt Disney World uses trackless vehicles as part of an extraordinarily complex multi-room experience. Ratatouille: The Adventure at Disneyland Paris was an early and beloved European example when it opened in 2014. Symbolica at Efteling in the Netherlands is another celebrated trackless ride that has become a flagship attraction. The flexibility of the format allows designers to create entirely new storytelling possibilities that the fixed-track dark ride format simply cannot replicate.',
    relatedTermIds: ['dark-ride', 'animatronics', 'themed-land'],
  },
  {
    id: 'g-force',
    name: 'G-Force',
    shortDefinition:
      "The unit of acceleration experienced by riders, measured as multiples of Earth's gravitational acceleration (9.81 m/s²).",
    definition:
      "G-force (gravitational force equivalent) measures the acceleration a rider's body experiences relative to Earth's gravity. Positive G-forces (above 1G) press riders into their seats as the train pulls through a valley or tight curve — the same force that makes you feel heavy in a fast car. Negative G-forces (below 0G) lift riders from their seats, creating airtime. Lateral G-forces act sideways, pushing riders across their seat on turns and transitions.\n\nRoller coasters are designed to sequence these forces deliberately. A sustained 4–5G valley is the hallmark of a powerful first drop transition. A brief −0.5G to −1G moment on an airtime hill produces the signature floating sensation. Most coasters target a range of 0–5G of sustained positive G-force, with brief spikes above this for dramatic effect. Sustained high-G exposure beyond a few seconds can cause discomfort or greyout; well-designed coasters balance intensity peaks with recovery sections.",
    relatedTermIds: ['airtime', 'inversion', 'lateral-gs', 'hangtime', 'greyout'],
    aliases: ['G-Forces', 'G Force', 'G Forces'],
  },
  {
    id: 'greyout',
    name: 'Greyout',
    shortDefinition:
      'A temporary greying of vision caused by positive G-forces reducing blood flow to the brain.',
    definition:
      'A greyout (also grey-out) is a physiological state in which a rider experiencing strong sustained positive G-forces temporarily sees a grey or washed-out visual field. The mechanism: positive G-forces pull blood downward toward the extremities, reducing circulation to the eyes and brain. The visual field begins to close in from the periphery and turns grey — the rider remains conscious and in control, but vision is significantly impaired.\n\nBeyond greyout, progressively stronger or longer G-exposure can lead to blackout (vision goes completely dark) or G-LOC (G-Force Induced Loss of Consciousness). Well-engineered coasters keep high-G peaks brief and follow intense sections with recovery elements to prevent greyout build-up.',
    aliases: ['Greyouts', 'grey-out', 'gray-out', 'grayout'],
    alternateNames: ['positive G blackout', 'G-force greying'],
    relatedTermIds: ['g-force', 'lateral-gs', 'hangtime', 'airtime'],
  },
  {
    id: 'grey-zone',
    name: 'Grey Zone',
    shortDefinition:
      'A roller coaster element on the borderline of inversion classification — counted or not depending on the counting method used.',
    definition:
      "The grey zone (also gray zone) refers to roller coaster elements that sit at the boundary between a full inversion and a non-inverting element. Classic inversions — like vertical loops and corkscrews — are unambiguous: the train rotates the rider completely upside down. Grey zone elements either narrowly reach or fall just short of the 180° overhead threshold, placing riders in an extreme near-inverted position.\n\nTypical grey zone elements include stalls (sustained head-chopper holds without full rotation), heavily overbanked turns beyond 90°, and certain wave turn variations. Manufacturers like RMC and Intamin deliberately use these elements as an alternative to classic inversions. Depending on the counting method — strict (full rotations only) or broad (any overhead position) — a coaster's official inversion count can vary by several elements.",
    aliases: ['Grey Zones', 'gray zone', 'gray zones'],
    alternateNames: ['borderline inversion', 'near-inversion'],
    relatedTermIds: ['inversion', 'stall', 'overbank', 'roller-coaster-element'],
  },
  {
    id: 'lateral-gs',
    name: 'Lateral Gs',
    shortDefinition:
      'Sideways forces pushing riders across their seat during turns, transitions, and helix sections.',
    definition:
      'Lateral Gs (lateral G-forces) are the sideways accelerations riders experience when a coaster changes direction in the horizontal plane — on banked turns, unbanked transitions, helices, and direction changes. Well-designed laterals are smooth and controlled, contributing to an energetic and engaging ride experience. Poorly engineered or rough laterals feel like being thrown sideways against the restraint or seat back, which can be uncomfortable or even bruising.\n\nEnthusiasts distinguish between smooth, intentional laterals — like those found in the sweeping low turns of a classic wooden coaster or the exits of a well-banked steel turn — and harsh, unintended laterals produced by track deterioration or poor engineering. Wooden coasters are especially associated with lateral movement: the flex in the track and the side-to-side energy of unbanked turns is considered part of the authentic wooden coaster experience. Smooth lateral G sequences in a helix section, like those on Balder at Liseberg, are often cited as highlights by coaster enthusiasts.',
    relatedTermIds: ['g-force', 'airtime', 'helix', 'wooden-coaster'],
    aliases: ['Lateral G-Forces', 'Lateral G'],
    alternateNames: ['Laterals'],
  },
  {
    id: 'ejector-airtime',
    name: 'Ejector Airtime',
    shortDefinition:
      'Intense negative G-forces that aggressively thrust riders from their seat, held in place only by the lap bar.',
    definition:
      "Ejector airtime describes the most intense form of negative G-force, where the coaster's trajectory departs so abruptly from free fall that riders are thrown powerfully from their seats — held in only by the lap bar. The name reflects the sensation: it feels as though the seat is actively trying to eject you. This is distinct from the gentle, prolonged floating of floater airtime; ejector is sharp, sudden, and can verge on violent if the transition into it is abrupt.\n\nEjector airtime is most commonly associated with RMC hybrid coasters, certain Intamin hypers, and modern wooden coasters with steep, parabolic hills. Enthusiasts describe the best ejector moments as the highlight of a ride experience — a brief, heart-stopping instant of true weightlessness before the track pulls you back. Untamed at Walibi Holland, Wildfire at Kolmården, and Steel Vengeance at Cedar Point are frequently cited as delivering some of the world's most intense ejector sequences. The intensity is one of the primary reasons RMC coasters have achieved cult status in the enthusiast community.",
    relatedTermIds: ['airtime', 'floater-airtime', 'airtime-hill', 'rmc', 'g-force'],
    alternateNames: ['Ejector'],
  },
  {
    id: 'floater-airtime',
    name: 'Floater Airtime',
    shortDefinition:
      'Gentle, sustained negative G-forces producing a prolonged floating sensation as the train crests a hill.',
    definition:
      'Floater airtime describes the gentle end of the negative G-force spectrum: a slow, prolonged sensation where riders rise slightly from their seats and float weightlessly for an extended moment as the train crests a hill following a gradual parabolic arc. The force is mild — typically around −0.1G to −0.3G — making it accessible and pleasurable even for riders who find intense ejector airtime overwhelming.\n\nFloater airtime is most characteristic of B&M hyper and giga coasters, which use large, gently rounded hills specifically engineered to produce extended float phases. Shambhala at PortAventura, Silver Star at Europa-Park, and Goliath at Walibi Holland are European examples celebrated for their long, floaty airtime sequences. Many enthusiasts consider the prolonged, relaxed quality of floater airtime more comfortable and repeatable than the sharp intensity of ejector, though enthusiast opinion is divided on which style is superior. The two types are not mutually exclusive — a single airtime hill can transition from floater at the crest to ejector on the descent.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'airtime-hill', 'b-and-m', 'g-force'],
    alternateNames: ['Floater'],
  },
  {
    id: 'hangtime',
    name: 'Hangtime',
    shortDefinition:
      'The sensation of hanging weightlessly in restraints during an inversion, caused by negative G-forces while upside down.',
    definition:
      'Hangtime describes the distinct experience of negative G-forces while a rider is inverted — literally hanging in the restraints as the coaster moves through the top of an inversion slowly enough for negative Gs to take effect. Unlike the brief upside-down flash of a fast vertical loop, hangtime occurs when the train lingers near the apex of an inversion, producing a drawn-out sensation of suspension. Riders feel their weight shift entirely into the over-the-shoulder restraints or lap bar, creating a uniquely disorienting and memorable moment.\n\nHangtime is most pronounced on elements where the train slows significantly near the inversion apex — the pretzel loop on flying coasters is the classic example, as train speed at the apex is low enough for sustained negative Gs while fully inverted. The heartline roll on some modern coasters can also produce hangtime, as can the tops of slow Norwegian loops. Enthusiasts generally consider hangtime one of the most thrilling inversion sensations, distinct from both the sustained positive-G compression of a fast vertical loop and the floating of conventional airtime.',
    relatedTermIds: ['inversion', 'pretzel-loop', 'heartline-roll', 'g-force', 'airtime'],
    aliases: ['Hang Time'],
  },
  {
    id: 'roller-coaster-element',
    name: 'Roller Coaster Element',
    shortDefinition:
      'A named section or feature of a roller coaster track, such as a loop, airtime hill, or inversion.',
    definition:
      "A roller coaster element is any distinct, named feature incorporated into a coaster's layout — from classic inversions like vertical loops and corkscrews to non-inverting elements like airtime hills, helices, and overbanks. Engineers design each element to produce a specific physical sensation: weightlessness (airtime), lateral G-forces, or the disorientation of going upside down. Coaster enthusiasts and manufacturers use precise names for these features to describe, compare, and rate ride designs worldwide.\n\npark.fan's glossary covers dozens of individual coaster elements — from the first drop and lifthill that open every ride to advanced features like the Stengel dive, Norwegian loop, and heartline roll found on modern steel coasters.",
    relatedTermIds: ['airtime', 'inversion', 'vertical-loop', 'helix', 'first-drop'],
    aliases: ['Roller Coaster Elements'],
  },
  // ── Ride Experience ────────────────────────────────────────────────────────
  {
    id: 'front-row',
    name: 'Front Row',
    shortDefinition:
      'The first row of seats in a ride vehicle, typically offering the best view and often the most intense airtime sensation.',
    definition:
      "The front row is the first row of seats in a coaster train or ride vehicle. Front row seats offer unobstructed forward views, making them highly prized for the visual experience of navigating a coaster's layout. On hypercoasters and giga coasters, front row seats often experience the most intense airtime during the first drop and subsequent hills, as riders have no one in front to block their sensation of space. The psychological effect of seeing the drop approaching — and then plunging into it with nothing ahead — enhances the thrill factor beyond what middle or back rows provide.\n\nOn many coasters, front row has become so desirable that parks offer queue bypasses or express lane reservations specifically for this seat position. At some parks, guests wait in separate front-row-only queues, which can add 10–30 minutes to the experience but may be worth it for first-time riders seeking maximum psychological impact.",
    relatedTermIds: ['back-row', 'middle-row', 'airtime', 'first-drop'],
    alternateNames: ['Front Seat', 'First Row'],
  },
  {
    id: 'back-row',
    name: 'Back Row',
    shortDefinition:
      'The last row of seats in a ride vehicle, known for intense airtime and extended hanging sensations on hill-heavy layouts.',
    definition:
      'The back row is the final row of seats in a coaster train or ride vehicle. Back row rides on hill-heavy coasters — hypers, gigas, and airtime-focused designs — are prized by enthusiasts for producing the most intense ejector airtime. As each successive hill completes, the back row experiences sustained negative G-forces as the train goes over the crest and passengers are ejected upward from their seats (held in only by restraints). This effect compounds across multiple hills: back row airtime is typically stronger, more prolonged, and more intense than front or middle row.\n\nOn coasters like Goliath (Walibi Holland) or Shambhala (PortAventura), back row is considered the prime seating position by coaster enthusiasts. The downside is that back rows can feel rough or rattled on older coasters, and on steep drops back row produces a different psychological profile — you see the crest disappear beneath you rather than plunging into the abyss. Enthusiast culture has established rankings of where on a coaster the best riding positions are, and back row consistently ranks at the top for airtime intensity.',
    relatedTermIds: ['front-row', 'middle-row', 'airtime', 'ejector-airtime'],
    alternateNames: ['Back Seat', 'Last Row'],
  },
  {
    id: 'middle-row',
    name: 'Middle Row',
    shortDefinition:
      'The center rows of a ride vehicle, offering a balanced experience between front and back row sensations.',
    definition:
      "The middle rows are the central seats in a multi-row coaster train or ride vehicle — positioned between the intense front-row psychological impact and the ejector airtime of the back row. Middle rows tend to offer a balanced, moderate experience: enough forward view to see the layout approaching, sufficient airtime to feel significant negative Gs, but neither the extremes of front or back. For families or first-time riders nervous about intensity, middle rows provide an approachable coaster experience.\n\nMiddle rows receive less discussion in enthusiast circles because they are neither specialized for a particular sensation nor offer the extreme versions of either front-row or back-row experiences. However, on coasters with extended lateral forces or G-intensive turns, middle rows can sometimes feel the biggest compression simply due to their position in the train's center of mass. Layout analysis shows that middle rows consistently deliver solid mid-range thrills across most coaster types, making them a reliable choice when front or back row reservations are unavailable.",
    relatedTermIds: ['front-row', 'back-row', 'airtime', 'ride-cart'],
    alternateNames: ['Middle Seat', 'Center Row'],
  },
  {
    id: 'ride-cart',
    name: 'Ride Cart',
    shortDefinition:
      'Individual vehicle or car in a roller coaster train that holds a row (or rows) of riders.',
    definition:
      "A ride cart (also called a car, train car, or simply train) is the individual carriage or vehicle segment that holds passengers on a roller coaster or other ride. A typical coaster train consists of multiple carts linked together, with each cart holding one or more rows of riders sitting back-to-back. Coaster manufacturers design cart dimensions, seat positioning, and restraint geometry to optimise both comfort and sensation for the intended ride experience.\n\nCart design varies dramatically across coaster types: hyper coasters use streamlined, relatively low-profile carts to minimise wind resistance and noise; inverted coasters dangle riders below the track; wing coasters position riders on either side of a central rail with nothing beneath them; and flying coasters mount riders face-down on the train. Coaster manufacturers like B&M, Intamin, and Mack each have signature cart designs that influence how their rides feel. Understanding which manufacturer built a coaster often gives you clues about cart comfort, restraint tightness, and the nature of G-forces you'll experience.",
    relatedTermIds: ['lap-bar', 'shoulder-harness', 'front-row', 'back-row'],
    alternateNames: ['Train Car', 'Coaster Car', 'Seat Car'],
  },
  {
    id: 'lap-bar',
    name: 'Lap Bar',
    shortDefinition:
      "A horizontal safety restraint across the rider's lap that allows a greater range of free movement than over-the-shoulder harnesses.",
    definition:
      "A lap bar is a horizontal safety restraint that pins riders securely across the upper thighs or lap area. Unlike over-the-shoulder harnesses that fully encase the torso, lap bars allow the upper body to move more freely, creating a more open, less restrictive sensation. Lap bars are the standard restraint on most modern hypercoasters, giga coasters, and many traditional steel and wooden coasters. During airtime moments, lap bars let riders experience the full sensation of being ejected upward from the seat, creating the sensation that only the bar prevents them from flying out of the vehicle.\n\nLap bars are preferred by enthusiasts for high-airtime coasters because they provide the most uninhibited airtime sensation — the gap between rider and seat is immediately noticeable. However, lap bars require proper positioning and can feel uncomfortable on riders with longer torsos or certain body shapes if the bar doesn't fit ideally. Coaster manufacturers have continuously refined lap bar design over decades, and modern lap bars are significantly more comfortable than earlier generations. On coasters with intense lateral forces, the lap bar may slide back and forth slightly during sharp turns, which some riders find annoying and others find thrilling.",
    relatedTermIds: ['shoulder-harness', 'airtime', 'ride-cart'],
    alternateNames: ['Lap Restraint', 'Lap Harness'],
  },
  {
    id: 'shoulder-harness',
    name: 'Shoulder Harness',
    shortDefinition:
      'An over-the-shoulder safety restraint that fully encloses the torso, limiting movement during the ride.',
    definition:
      'A shoulder harness (also called an over-the-shoulder restraint or OTS harness) is a clamping safety device that comes down over both shoulders and across the lap, fully encasing the torso. Shoulder harnesses were the standard on coasters from the 1980s through early 2000s and remain common on inverted coasters, some suspended coasters, and family rides where maximum restraint is prioritized. Modern harnesses include ratcheting mechanisms that allow for varying tightness to accommodate different rider builds.\n\nWhen sitting in a shoulder harness on a high-airtime coaster, the sensation is notably different from a lap bar: riders cannot rise from the seat as dramatically because the shoulder restraint holds them down. This trade-off — greater security and comfort for some riders versus less intense airtime sensation — is a key design choice manufacturers make. Enthusiasts generally prefer lap bars for airtime-heavy coasters and consider shoulder harnesses slightly less thrilling for that purpose, though they can feel more secure and comfortable for nervous riders or on coasters with intense lateral forces.',
    relatedTermIds: ['lap-bar', 'airtime', 'ride-cart'],
    alternateNames: ['OTS Harness', 'Over-the-shoulder Restraint'],
  },
  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    id: 'souvenir',
    name: 'Souvenir',
    shortDefinition: 'A memento or small item purchased at a theme park to commemorate a visit.',
    definition:
      'A souvenir is a physical memento — merchandise, apparel, or collectible item — purchased by visitors to remember their theme park experience. Common souvenirs include t-shirts with park logos, hats, pins, postcards, stuffed animals, and themed collectibles. Souvenirs serve both a functional purpose (wearable clothing) and an emotional one — they anchor memories of a specific visit and create lasting connections to beloved parks and attractions.\n\nTheme parks rely heavily on souvenir sales as a revenue stream; merchandise typically carries 2–3× markup compared to retail retail prices. Parks design souvenir photography moments into themed lands and attractions specifically to encourage impulse purchases. Limited-edition or seasonal souvenirs create urgency, while park-exclusive items (available nowhere else) drive higher prices and repeat visits. For many guests, collecting souvenirs from multiple parks is part of the experience — gathering pins, trading them with others, or building a commemorative shelf.',
    relatedTermIds: ['merchandise', 'gift-shop', 'park-exclusive'],
    alternateNames: ['Memento', 'Keepsake'],
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    shortDefinition:
      'Official products and goods sold by a theme park, including apparel, collectibles, and themed items.',
    definition:
      'Merchandise refers to all goods sold by a theme park — from branded apparel (t-shirts, hoodies, hats) to collectibles (pins, figurines, plushies), food/drink merchandise, and specialty themed items tied to specific attractions or franchises. Theme parks operate vast merchandise operations spanning dozens of shops, mobile carts, and location-specific boutiques. Merchandise is a critical revenue pillar for parks, often generating 15–25% of total guest spending, second only to food and beverages.\n\nModern parks use sophisticated merchandising strategies: limited-edition seasonal items, collaboration merchandise with popular franchises, park-exclusive designs unavailable anywhere else, and special releases tied to new attraction openings or anniversaries. Merchandise design is increasingly data-driven — parks track which items sell fastest, photograph best for social media, and resonate most with repeat visitors. For dedicated fans, collecting merchandise from multiple visits becomes part of their park experience, and secondary markets exist where rare or sold-out items command premium prices.',
    relatedTermIds: ['souvenir', 'gift-shop', 'park-exclusive'],
    alternateNames: ['Merch'],
  },
  {
    id: 'gift-shop',
    name: 'Gift Shop',
    shortDefinition:
      'A retail store within a theme park selling souvenirs, merchandise, and themed products.',
    definition:
      'A gift shop is a retail space within a theme park dedicated to selling souvenirs, merchandise, and themed products — either located in a central area (like a main plaza) or integrated into specific themed lands and attractions. Major parks operate dozens of gift shops ranging from small carts to large departmental stores. Gift shops are carefully positioned at high-traffic bottleneck points: exit queues of major attractions, hotel corridors, and park entrances/exits where guests have downtime and purchasing inclination.\n\nModern gift shops use sophisticated retail design: entrance placement positions shoppers in impulsive-purchase zones, themed environments match the surrounding lands, and product placement highlights high-margin, visually-appealing items. Many attractions feature "obligatory" gift shops where exiting guests are funneled directly through the merchandise area — a proven retail strategy that inflates impulse purchases. Parks increasingly use IP merchandise (licensed brands and franchises) to command premium pricing. Collector-focused shops in premium resort hotels sell exclusive, limited-edition merchandise at significantly elevated price points.',
    relatedTermIds: ['merchandise', 'souvenir', 'park-exclusive'],
    alternateNames: ['Souvenir Shop', 'Retail Shop'],
  },
  {
    id: 'park-exclusive',
    name: 'Park Exclusive',
    shortDefinition:
      'A product or item available only at a specific theme park or within the park system, unavailable for purchase elsewhere.',
    definition:
      'Park exclusive merchandise is a product designed and sold only at a specific theme park or within a park system (such as all Disney parks, or all Universal parks) — unavailable for purchase at any external retailer. Park-exclusive items create perceived scarcity, encourage impulse purchases from guests who believe they cannot obtain the item elsewhere, and command premium pricing (often 2–3× typical retail markup). Common park exclusives include limited-edition apparel, collectible pins, themed items tied to seasonal events or new attraction openings, and novelty food items.\n\nThe park-exclusive strategy is a cornerstone of modern merchandise psychology: guests traveling significant distances and spending considerable money on admission feel elevated impulse to purchase items they cannot get at home. Secondary markets (online resale platforms) demonstrate that truly limited, desirable park exclusives retain and appreciate in value, further driving collector behavior. Parks strategically design packaging and merchandising to emphasize the exclusive nature — tags reading "Park Exclusive" or "Limited Release" prominently feature on items. Theme park social media and forums frequently discuss which exclusives are most sought-after or rare, creating viral interest and FOMO (fear of missing out) among collector communities.',
    relatedTermIds: ['merchandise', 'souvenir', 'gift-shop'],
    aliases: ['Park Exclusive Item'],
    alternateNames: ['Exclusive'],
  },
  {
    id: 'flying-coaster',
    name: 'Flying Coaster',
    shortDefinition: 'Roller coaster where riders lie face-down in a prone position.',
    definition:
      'A flying coaster suspends riders horizontally, face-down, simulating the sensation of flight. The train tilts from the seated position at the station to horizontal before the ride begins. Notable examples include B&M Flyers like Manta (SeaWorld Orlando) and Tatsu (Six Flags Magic Mountain).',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster'],
    alternateNames: ['flyer', 'Superman ride', 'prone coaster', 'flying ride'],
  },
  {
    id: 'mine-train',
    name: 'Mine Train',
    shortDefinition: 'Family steel coaster themed as a mine cart journey.',
    definition:
      'A mine train coaster is a family-friendly steel roller coaster styled as a runaway mining cart. Typically featuring moderate speeds, small drops, and tight turns through themed tunnels and rock formations. Suitable for a wide age range. Examples include Big Thunder Mountain Railroad (Disney parks) and Gold Rush (Plopsaland).',
    relatedTermIds: ['steel-coaster', 'family-coaster', 'themed-land'],
    aliases: ['mine coaster', 'mine car coaster', 'mine ride'],
    alternateNames: ['family coaster'],
  },
  {
    id: 'terrain-coaster',
    name: 'Terrain Coaster',
    shortDefinition: 'Coaster designed to follow and interact with the natural landscape.',
    definition:
      'A terrain coaster is built to take advantage of natural topography — hills, valleys, and ravines — rather than relying entirely on artificial structure. The ride interacts closely with the ground, creating a sense of speed and immersion. Classic examples include Beast (Kings Island) and Ravine Flyer II (Waldameer).',
    relatedTermIds: ['wooden-coaster', 'steel-coaster', 'airtime'],
    alternateNames: ['terrain ride', 'landscape coaster', 'ground-hugging coaster'],
  },
  {
    id: 'floorless-coaster',
    name: 'Floorless Coaster',
    shortDefinition: "Steel coaster where the floor retracts so riders' feet dangle freely.",
    definition:
      'On a floorless coaster, the car floor drops away after riders are secured, leaving legs dangling above the track. Unlike inverted coasters, the track runs beneath the car rather than above. B&M pioneered the type with Medusa (Six Flags Great Adventure, 1999). Examples in Europe include Goliath (Walibi Holland).',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster', 'dive-coaster'],
    aliases: ['floorless'],
    alternateNames: ['open floor coaster'],
  },
  {
    id: 'arrow-dynamics',
    name: 'Arrow Dynamics',
    shortDefinition: 'American coaster manufacturer responsible for the first modern loop.',
    definition:
      "Arrow Dynamics (founded 1945) was a pioneering American roller coaster manufacturer that introduced the modern tubular steel track and the first modern vertical loop on Corkscrew (Knott's Berry Farm, 1975). Arrow coasters are known for their iconic corkscrew and suspended looping coasters. The company declared bankruptcy in 2001 and its assets were acquired by S&S.",
    relatedTermIds: ['steel-coaster', 'corkscrew', 'suspended-coaster', 'vertical-loop'],
    aliases: ['Arrow', 'Arrow Development', 'S&S Arrow'],
  },
  {
    id: 'gci',
    name: 'Great Coasters International (GCI)',
    shortDefinition: 'American wooden coaster manufacturer known for fast, twisty layouts.',
    definition:
      'Great Coasters International (GCI) is an American manufacturer specialising in wooden roller coasters. Founded in 1994, GCI is known for their Millennium Flyer trains and layouts featuring rapid direction changes and sustained airtime. Notable installations include Wodan (Europa-Park), Thunderhead (Dollywood), and Troy (Toverland).',
    relatedTermIds: ['wooden-coaster', 'airtime', 'rmc', 'terrain-coaster'],
    aliases: ['Great Coasters International', 'GCI coaster'],
    alternateNames: ['Millennium Flyer'],
  },
  {
    id: 'premier-rides',
    name: 'Premier Rides',
    shortDefinition:
      'American manufacturer specialising in LSM/LIM launch coasters — in Europe best known through the Sky Scream family of inverted launch coasters.',
    definition:
      "Premier Rides (founded 1995, Baltimore, Maryland) is an American coaster manufacturer specialising in linear synchronous motor (LSM) and linear induction motor (LIM) launch systems. Their launch technology was among the earliest commercially deployed, enabling smooth high-speed launches without hydraulic catapults. The Sky Rocket II — a compact, single-looping launch coaster — became widely popular through mid-tier park installations globally.\n\nIn Europe, Premier Rides is best known through Sky Scream at Holiday Park (Haßloch, Germany), an inverted family launch coaster and regional landmark attraction. Hagrid's Magical Creatures Motorbike Adventure at Universal Orlando also uses Premier's LSM launch system, showcasing the technology's versatility beyond traditional coasters.",
    aliases: ['Premier'],
    relatedTermIds: ['launch-coaster', 'gerstlauer', 'intamin'],
  },
  {
    id: 'maurer-rides',
    name: 'Maurer Rides',
    shortDefinition:
      'German manufacturer from Munich known for spinning coasters with trick track, the X-Car custom platform, and the Sky Loop vertical loop model.',
    definition:
      "Maurer Rides (Maurer AG, metal fabrication since 1876, amusement rides from 1993) is a Munich-based German manufacturer. The company developed the SC spinning coaster series featuring their signature trick track — a section where the car tilts sideways mid-ride — and the X-Car platform, a single-articulated-car format capable of highly customised compact layouts with launches and inversions.\n\nThe Sky Loop is a standalone vertical loop structure found across European parks as a space-efficient thrill ride, while the Spike coaster uses individual pursuit cars on a shared track. Well-known European installations include Winja's Fear and Winja's Force at Phantasialand (Germany) — indoor spinning coasters with trick track — and X-Car installations across various European parks.",
    aliases: ['Maurer', 'Maurer Söhne', 'Maurer AG'],
    relatedTermIds: ['spinning-coaster', 'xtreme-spinning-coaster', 'launch-coaster', 'gerstlauer'],
  },
  {
    id: 'zamperla',
    name: 'Zamperla',
    shortDefinition:
      'Italian manufacturer with one of the largest portfolios of family-friendly coasters and flat rides worldwide, with 250+ coasters installed globally.',
    definition:
      "Zamperla (founded 1966, Altavilla Vicentina, Italy) is one of the world's most prolific amusement ride manufacturers. Where Intamin, B&M, and Mack target large-scale thrill installations, Zamperla focuses on volume and accessibility — their Family Coaster, Mini Coaster, Twister, and Disk'O Coaster models are staples of smaller parks, resort midways, and seasonal attractions worldwide.\n\nCompact footprints and modest height requirements make Zamperla rides especially common in European city parks, holiday resorts, and indoor facilities. The company also built Thunderbolt at Coney Island (New York), demonstrating their ability to scale up when required. Walt Disney Parks & Resorts has used Zamperla attractions across multiple properties.",
    aliases: ['Zamperla rides', 'Antonio Zamperla'],
    relatedTermIds: ['credit', 'mine-train', 'gerstlauer'],
  },
  {
    id: 's-and-s-worldwide',
    name: 'S&S Worldwide',
    shortDefinition:
      'American manufacturer known for pneumatic towers, the compact El Loco extreme coaster, and Free Fly 4D coasters.',
    definition:
      "S&S Worldwide (founded 1994, Logan, Utah; acquired by Sansei Technologies in 2012) originally developed pneumatic drop tower systems — the Space Shot and Turbo Drop — before expanding into coasters. Their El Loco model is a compact extreme coaster featuring a beyond-vertical first drop and inversion, delivering significant thrills within a very small footprint. The Free Fly is a 4D-style coaster where the seat pivots freely to flip riders at key moments.\n\nS&S also acquired the assets of the historic Arrow Dynamics after its 2001 bankruptcy, establishing a lineage connection to some of the most significant coasters in the industry. In Europe, S&S installations are less common than in North America, though the company's air-launch technology has influenced broader industry development.",
    aliases: ['S&S', 'S&S-Sansei', 'S&S Power', 'S&S Sansei'],
    relatedTermIds: ['launch-coaster', 'arrow-dynamics', 'gerstlauer'],
  },
  {
    id: 'zierer',
    name: 'Zierer',
    shortDefinition:
      'German manufacturer from Bavaria specialising in family coasters and classic park rides, with over 190 coasters built worldwide.',
    definition:
      "Zierer (founded 1930, Deggendorf, Bavaria) is a German manufacturer specialising in family-scale roller coasters and classic park rides. Their Force Coaster range spans multiple tiers — from compact junior models through to the higher-speed Force Custom installations. Zierer coasters are characterised by steel tubular track, smooth ride quality, and moderate height requirements, making them ideal for parks catering to a broad demographic.\n\nWith over 190 roller coasters delivered worldwide, Zierer is one of Europe's most prolific coaster builders by unit count. Notable European installations include Feuerdrache at Legoland Deutschland, and family coasters at parks across Germany, the Netherlands, and Scandinavia.",
    aliases: ['Zierer GmbH', 'Zierer rides'],
    relatedTermIds: ['credit', 'mack-rides', 'gerstlauer'],
  },
  {
    id: 'stall',
    name: 'Stall',
    shortDefinition: 'Inversion where the train briefly hangs upside-down with near-zero speed.',
    definition:
      'A stall (also called a zero-G stall) is an element where the coaster train travels into an inversion at the apex and momentarily slows almost to a stop, leaving riders hanging upside-down. Pioneered by Rocky Mountain Construction (RMC), the element delivers prolonged hangtime. Famous examples appear on Zadra (Energylandia) and Steel Vengeance (Cedar Point).',
    relatedTermIds: ['inversion', 'hangtime', 'rmc', 'zero-g-roll'],
    aliases: ['zero-g stall'],
    alternateNames: ['RMC stall', 'hangtime element'],
  },
  {
    id: 'wave-turn',
    name: 'Wave Turn',
    shortDefinition: 'Sweeping banked direction change delivering strong airtime.',
    definition:
      'A wave turn is a high-speed banked turn that transitions through a brief moment of negative or lateral G-forces, creating a sensation of airtime mid-corner. Common on Rocky Mountain Construction coasters, the element combines directional change with ejector or floater airtime. It appears on rides like Wildfire (Kolmården) and Untamed (Walibi Holland).',
    relatedTermIds: ['airtime', 'overbank', 'ejector-airtime', 'rmc', 'lateral-gs'],
    aliases: ['wave turn element'],
    alternateNames: ['banked airtime turn'],
  },
  {
    id: 'shoulder-season',
    name: 'Shoulder Season',
    shortDefinition: 'Period between peak and off-season with moderate crowds and prices.',
    definition:
      "The shoulder season refers to the transitional periods between a theme park's busiest (peak) and quietest (off-season) periods. Typically spring (March–May) and early autumn (September–October) in European parks. Crowds are moderate, prices may be lower, and most attractions are open — making it a favoured time for enthusiasts seeking a good balance of experience and value.",
    relatedTermIds: ['crowd-forecast', 'peak-season', 'school-holiday', 'crowd-level'],
    alternateNames: ['off-peak', 'mid-season', 'quiet period', 'low season'],
  },
  {
    id: 'school-holiday',
    name: 'School Holiday',
    shortDefinition: 'School vacation period that causes significant crowd spikes at theme parks.',
    definition:
      'School holidays — including summer break, Christmas/New Year, Easter, and half-term — are the primary driver of crowd spikes at theme parks. Families with children are the largest visitor segment, and their visits are concentrated in these windows. Parks often extend opening hours, add entertainment, and increase prices during these periods. Avoiding school holidays is the single most impactful crowd-reduction strategy.',
    relatedTermIds: ['crowd-forecast', 'shoulder-season', 'peak-season', 'crowd-level'],
    aliases: ['summer holidays', 'Easter holidays', 'Christmas holidays'],
    alternateNames: ['school break', 'school vacation', 'half-term'],
  },
  {
    id: 'photo-pass',
    name: 'Photo Pass',
    shortDefinition: 'Service providing unlimited digital ride and park photos.',
    definition:
      "A photo pass (or memory maker) is an optional add-on that grants digital access to all professionally taken photos and videos from a park visit — including ride photos, character meet-and-greet shots, and roaming photographer images. Sold as a flat-fee package, it can be cost-effective for families who would otherwise purchase individual ride photos. Disney's Memory Maker and Universal's Photo Pass are prominent examples.",
    relatedTermIds: ['ride-photo', 'character-meet-and-greet', 'season-pass'],
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
      'An accessibility pass (variously called DAS — Disability Access Service, accessibility card, or attraction access pass) is issued to guests who are unable to wait in a standard queue due to a disability. It typically allows the guest and a set number of companions to return at a specified time rather than physically waiting. Eligibility and processes vary by park and country.',
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
    shortDefinition:
      'Ride that combines a moving platform with a film screen for immersive experiences.',
    definition:
      'A motion simulator (or simulator ride) combines a hydraulically or electrically actuated moving platform with a large screen film or projection, synchronising physical movement with on-screen action to create immersive experiences without a traditional track. Capacity is typically high and the experience can be refreshed by changing films. Examples include Star Tours (Disney), Mystic Manor (HKDL), and various 4D cinema attractions.',
    relatedTermIds: ['dark-ride', 'trackless-ride', 'pre-show', 'animatronics'],
    alternateNames: ['simulator ride', '4D ride', 'flight simulator', 'motion base', 'sim ride'],
  },
  {
    id: 'character-meet-and-greet',
    name: 'Character Meet & Greet',
    shortDefinition: 'Scheduled opportunity to meet a costumed park character in person.',
    definition:
      'A character meet and greet is a designated area or scheduled event where guests can meet, pose for photos, and sometimes receive autographs from costumed park characters. Common at Disney and Universal parks, popular characters may have dedicated meet-and-greet locations with their own queues. They are especially popular with children and families.',
    relatedTermIds: ['photo-pass', 'character-dining', 'themed-land'],
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
      'A pre-show is a staging element in a themed attraction where guests gather in a room or queue area before the main ride or experience to receive story context, safety instructions, or entertainment that sets the scene. Pre-shows serve both narrative and operational functions, allowing groups to be staged efficiently while enhancing immersion. Famous examples include the stretching room in the Haunted Mansion and the safety video on Guardians of the Galaxy – Mission: BREAKOUT!.',
    relatedTermIds: ['dark-ride', 'motion-simulator', 'animatronics', 'themed-land'],
    aliases: ['pre show'],
    alternateNames: ['loading area entertainment', 'staging area', 'queue entertainment'],
  },
  {
    id: 'flat-ride',
    name: 'Flat Ride',
    shortDefinition:
      'A ground-level ride that spins, swings, or rotates guests without a traditional coaster track.',
    definition:
      "A flat ride is a category of amusement ride that operates on a roughly horizontal plane rather than a circuit of elevated track. The term covers a wide variety of types: spinning attractions (carousels, teacups, rotor rides), pendulum rides (Frisbees), Top Spins, and swing rides (Wave Swingers), drop and launch towers, and circular spinning platforms.\n\nUnlike roller coasters, flat rides typically have compact footprints, making them ideal for filling smaller park areas. Many flat rides have high hourly throughput, low or no height requirements, and broad age appeal — they are often the backbone of a park's family and children's ride lineup.",
    relatedTermIds: ['swing-ride', 'drop-tower', 'ride-capacity', 'height-requirement'],
    aliases: ['flat rides'],
    alternateNames: ['carnival ride', 'midway ride'],
  },
  {
    id: 'water-ride',
    name: 'Water Ride',
    shortDefinition:
      'An attraction where guests travel in boats or vehicles through water, getting wet in the process.',
    definition:
      'A water ride is any attraction where water is a central part of the experience — either the vehicle travels through a water channel or water is used as a deliberate effect. The three most common types are log flumes, where boats travel down a trough with a final plunge drop; river rapids rides, where circular rafts spin through turbulent artificial white water; and splash battles, where guests use water cannons to spray each other and bystanders. Water rides typically have low height requirements and very broad guest appeal. In summer heat they can generate extremely long queues. Capacity varies significantly: river rapids rides tend to have high hourly throughput while log flumes can be somewhat lower.',
    relatedTermIds: ['log-flume', 'river-rapids', 'ride-capacity', 'height-requirement'],
    aliases: ['water rides'],
    alternateNames: ['water attraction', 'aquatic ride', 'wet ride'],
  },
  {
    id: 'live-show',
    name: 'Live Show',
    shortDefinition:
      'A scheduled performance featuring live actors, music, stunts, or characters in a dedicated venue.',
    definition:
      'A live show is a scheduled entertainment experience performed by human cast members — distinct from a ride or fixed exhibit — in a dedicated venue such as an open-air amphitheatre, indoor theatre, or on-street performance space. Theme park live shows range from Broadway-style stage productions and stunt shows to character parades, 4D cinema experiences with live elements, and laser or fireworks spectaculars. Unlike rides, live shows run on fixed schedules with limited capacity per performance; adding shows to a touring plan is important to avoid timing conflicts. Strategically, live shows serve as useful rest periods during the midday crowd peak when ride queues are at their longest.',
    relatedTermIds: ['themed-land', 'pre-show', 'ride-capacity'],
    alternateNames: ['show', 'live entertainment', 'stage show', 'performance', 'stunt show'],
  },
  {
    id: 'quick-service',
    name: 'Quick Service',
    shortDefinition: 'Counter-service restaurant with no table waiting staff.',
    definition:
      'Quick service (also called counter service or fast casual) refers to park dining where guests order at a counter and carry their own food to a table. It is the most common type of in-park dining, offering speed and convenience. Disney popularised the term "quick service" to distinguish it from "table service" in their dining reservation system.',
    relatedTermIds: ['table-service', 'character-dining'],
    alternateNames: ['counter service', 'fast food', 'fast casual', 'self-service restaurant'],
  },
  {
    id: 'table-service',
    name: 'Table Service',
    shortDefinition: 'Sit-down restaurant with waitstaff where reservations are often required.',
    definition:
      'Table service restaurants inside theme parks provide a full sit-down dining experience with waitstaff. Reservations (often bookable 60–180 days in advance at Disney parks) are strongly recommended as popular venues fill quickly, especially during peak season. Table service typically costs significantly more than quick service but offers higher food quality and a relaxing atmosphere away from the park crowds.',
    relatedTermIds: ['quick-service', 'character-dining', 'peak-season'],
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
      "Character dining is a table-service (or occasionally buffet) dining experience where costumed characters visit each table to interact with guests, pose for photos, and sign autographs during the meal. It guarantees character interaction without waiting in a separate meet-and-greet queue, making it popular with families. Examples include Chef Mickey's (Disney World) and the Princess Storybook Dining at Auberge de Cendrillon (Disneyland Paris).",
    relatedTermIds: ['table-service', 'character-meet-and-greet', 'quick-service'],
    aliases: ['character breakfast', 'character lunch', 'character dinner'],
    alternateNames: ['character meal', 'dining with characters'],
  },
  {
    id: 'drop-tower',
    name: 'Drop Tower',
    shortDefinition:
      'A tower attraction that lifts guests to height and releases them in a rapid free-fall descent.',
    definition:
      'A drop tower (also called a free-fall tower or drop ride) is an attraction in which riders are lifted in a gondola or individual seats arranged around a central tower structure, then released to plummet rapidly toward the ground. The drop may be near-true free-fall (approaching weightlessness), progressively braked, or in some models an ejector-style launch element fires riders upward first before the drop. A deceleration phase near the bottom brings the gondola to a smooth stop. Variants include rotating drop towers, multi-directional models, and hybrids that combine a drop with a launch sequence. Drop towers offer intense thrills with a very compact footprint, making them popular worldwide. Well-known examples include the Tower of Terror installations at Disney parks and numerous models from manufacturers such as Intamin, Mondial, and S&S Worldwide.',
    relatedTermIds: ['flat-ride', 'height-requirement', 's-and-s-worldwide', 'intamin'],
    aliases: ['free-fall', 'drop towers', 'launch tower', 'launch towers'],
    alternateNames: ['free fall tower', 'drop ride', 'free fall ride', 'launch ride'],
  },
  {
    id: 'log-flume',
    name: 'Log Flume',
    shortDefinition:
      'A water channel ride where boat-shaped vehicles travel through a trough and finish with a dramatic plunge and splash.',
    definition:
      'A log flume (also called a flume ride or splash ride) is a water ride in which guests sit in boat-shaped vehicles — traditionally log-shaped fibreglass hulls — and travel along a water-filled channel, navigating a course of flat sections and small rises before a final steep drop splash. The impact at the bottom almost guarantees wet riders; the extent depends on the drop height and trough design. Log flumes were introduced in the 1960s and became a fixture of parks worldwide, prized for their family friendliness, moderate throughput, and iconic summer appeal. Many classic examples have received major theming upgrades. Well-known European examples include Poseidon at Europa-Park and various Wildwasserbahn installations across German-speaking parks.',
    relatedTermIds: ['water-ride', 'river-rapids', 'height-requirement'],
    alternateNames: ['flume ride', 'log ride', 'splash ride', 'water flume'],
  },
  {
    id: 'river-rapids',
    name: 'River Rapids',
    shortDefinition:
      'A circular raft ride through turbulent artificial rapids where guests are likely to get soaked.',
    definition:
      'A river rapids ride (also called a white-water rafting ride or wild-water ride) puts guests in circular inflatable or fibreglass rafts that drift and spin along an artificially created channel designed to simulate the chaos of white-water rapids. Because the circular raft rotates freely on the current, each ride-through is unpredictable: depending on raft position at each water feature, some riders get completely drenched while others stay relatively dry. River rapids rides tend to have high hourly capacity and strong family appeal, with typically low height requirements. They are especially popular on hot days. Prominent European examples include the Wildwasser rides at Phantasialand and the various rapids attractions at Efteling, Europa-Park, and Thorpe Park.',
    relatedTermIds: ['water-ride', 'log-flume', 'height-requirement'],
    alternateNames: ['rapids ride', 'raft ride', 'white water rapids', 'white-water ride'],
  },
  {
    id: 'top-spin',
    name: 'Top Spin',
    shortDefinition:
      'A flat ride by Huss in which a gondola of riders is freely rotated in any direction while its supporting frame swings up and down.',
    definition:
      'The Top Spin is a flat ride model manufactured by Huss Rides. A gondola holding typically 40 riders is mounted on a pivoting frame; the gondola can be rotated continuously in any direction as the frame swings, creating an unpredictable combination of swinging and spinning forces. The ride can be programmed from gentle rocking to relentless full rotations, making it adaptable to different intensity levels.\n\nTop Spins were ubiquitous in theme parks and travelling fairs from the 1990s through the 2010s and remain a recognisable sight in many parks worldwide. Despite the swinging motion, the Top Spin is not a pendulum ride — the gondola is not suspended from a long arm but rather clamped between two rotating side frames.',
    relatedTermIds: ['flat-ride', 'pendulum-ride', 'height-requirement'],
    aliases: ['Top Spins'],
    alternateNames: ['Huss Top Spin'],
  },
  {
    id: 'pendulum-ride',
    name: 'Pendulum Ride',
    shortDefinition:
      'A flat ride where a gondola hangs from a long arm and swings in a wide pendulum arc, often while spinning.',
    definition:
      'A pendulum ride is a type of flat ride in which a gondola is suspended from a long arm that swings back and forth in an increasingly wide arc, often reaching near-vertical heights. As the arm swings, the gondola also rotates, combining the pendulum motion with axial spin for a highly intense experience.\n\nThe most iconic example is the Frisbee (Mondial), a disc-shaped gondola that swings like a pendulum while rotating. Other well-known pendulum rides include the KMG Afterburner and Intamin Giant Frisbee. Pendulum rides are a popular fixture in theme parks and travelling fairs worldwide, valued for their dramatic visual spectacle and relatively compact footprint.',
    relatedTermIds: ['flat-ride', 'swing-ride', 'drop-tower', 'height-requirement'],
    aliases: ['Frisbee', 'Frisbees', 'pendulum rides'],
    alternateNames: ['giant frisbee', 'swinging gondola ride'],
  },
  {
    id: 'swing-ride',
    name: 'Swing Ride',
    shortDefinition:
      'A rotating tower attraction where chairs suspended by chains swing outward as the ride spins.',
    definition:
      'A swing ride (also called a chair swing, wave swinger, or Kettenflieger) is a rotating attraction in which chairs suspended from chains are attached to a revolving central structure. As the ride spins, centrifugal force causes the chairs to swing outward and upward, giving riders a sensation of flying. Swing rides are among the oldest surviving fairground ride types, with roots in early 20th-century carnivals; modern theme park versions range from gentle low-speed models designed for young children to enormous tower versions (chain towers or starflyers) that lift riders dozens of metres into the air. They are a near-universal presence in both major theme parks and travelling funfairs worldwide.',
    relatedTermIds: ['flat-ride', 'ride-capacity', 'height-requirement'],
    aliases: ['wave swingers', 'wave swinger'],
    alternateNames: ['chair swing', 'wave swinger', 'chain swing', 'Chairoplane'],
  },
  {
    id: 'racing-coaster',
    name: 'Racing Coaster',
    shortDefinition:
      'Two parallel roller coaster tracks on which trains are dispatched simultaneously to race side by side.',
    definition:
      'A racing coaster features two separate but mirrored roller coaster tracks running parallel to each other, with trains dispatched simultaneously so riders experience the sensation of racing against the other car. The tracks typically cross or run extremely close to each other at multiple points, maximising the head-to-head tension. Some racing coasters are built as Möbius-loop designs, where the two tracks form a single continuous circuit and riders automatically switch sides between rides. The format works equally well with wooden and steel coasters. Classic examples include Racer at Kings Island and Gemini at Cedar Point in the United States. In Europe, notable examples include Piraten at Djurs Sommerland and Dwervelwind at Plopsaland.',
    relatedTermIds: ['wooden-coaster', 'steel-coaster', 'credit'],
    alternateNames: ['twin coaster', 'duelling coaster', 'dueling coaster', 'dual track coaster'],
  },
  {
    id: 'high-five',
    name: 'High Five',
    shortDefinition:
      "A coaster near-miss element where two trains on parallel tracks pass each other at arm's reach.",
    definition:
      "A High Five is a near-miss coaster element in which two roller coaster trains on separate but closely spaced tracks pass each other at extremely short range — sometimes within arm's reach — creating an exhilarating illusion of imminent collision. The name comes from the sensation that riders could reach out and high-five occupants of the other train. The element depends on tight dispatch timing to synchronise both trains at the crossing point. Wing coasters and inverted coasters are especially well-suited to High Five elements because the outboard seating of the ride vehicles amplifies the near-miss sensation. Duelling Dragon / Dragon Challenge at Universal's Islands of Adventure was a celebrated early example; the element has since appeared on various B&M wing coasters and other near-miss designs around the world.",
    relatedTermIds: ['wing-coaster', 'inverted-coaster', 'b-and-m'],
    aliases: ['high 5'],
    alternateNames: ['near miss element', 'near-miss', 'near fly'],
  },
  {
    id: 'dining-reservation',
    name: 'Dining Reservation',
    shortDefinition:
      'An advance booking for a table-service restaurant inside a theme park or resort.',
    definition:
      'A dining reservation is an advance booking for a table-service or character-dining restaurant at a theme park, resort hotel, or associated entertainment complex. At Disney parks, reservations can be made up to 60 days in advance (with a 10-day head-start for resort hotel guests) and are considered essential for the most popular restaurants — failing to book in advance during busy periods can mean missing out entirely. Reservations typically require a credit card to hold; most Disney table-service venues charge a no-show fee if guests cancel within 24 hours or fail to arrive. In enthusiast communities, advance dining reservations are commonly abbreviated as ADRs. For parks other than Disney, the booking window is typically shorter and systems less formalised.',
    relatedTermIds: ['table-service', 'character-dining', 'peak-season'],
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
      "Mobile ordering allows guests to browse a restaurant menu, place and pay for an order, and select a pickup time window directly through the park's official smartphone app — skipping the standard counter queue entirely. Disney popularised the system at its quick-service restaurants; Universal, Six Flags, Merlin parks, and many other major operators have since introduced their own versions. When the selected pickup window arrives, guests receive a notification to head to the restaurant's dedicated mobile order pickup counter, where food is ready. Mobile ordering can save significant time at busy dining periods, particularly the midday lunch rush. The system requires a charged smartphone and reliable in-park connectivity, which is not always consistent throughout large parks.",
    relatedTermIds: ['quick-service', 'dining-reservation'],
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
    relatedTermIds: ['quick-service', 'table-service', 'mobile-ordering'],
    alternateNames: ['food area', 'food hall', 'dining court'],
  },
  {
    id: 'capacity-closure',
    name: 'Capacity Closure',
    shortDefinition:
      'When a park stops admitting new guests because its maximum safe attendance has been reached.',
    definition:
      "A capacity closure (also called a park sellout or capacity cap) occurs when a theme park reaches its maximum permitted or operationally safe attendance figure and temporarily stops selling day tickets or admitting new guests at the gate. Parks manage capacity through a combination of timed entry reservations, real-time attendance monitoring, and temporary gate closures. Annual passholders at some parks may be blocked from admission on capacity days; others use pre-sold reservation systems that prevent overcrowding before it starts. Capacity closures are most common during school holiday peaks, fireworks nights, and special event evenings. Some parks communicate real-time admission status via their apps; others provide limited advance warning. Checking a park's social media and app on the morning of a planned visit can help guests avoid an unexpected closure.",
    relatedTermIds: ['peak-season', 'annual-pass', 'school-holiday', 'crowd-level'],
    alternateNames: ['park full', 'park sold out', 'sold out day', 'park sellout', 'capacity cap'],
  },
  {
    id: 'zero-g-winder',
    name: 'Zero-G Winder',
    shortDefinition:
      'A zero-G roll variant that incorporates a built-in directional change, so the train enters and exits the inversion on different headings.',
    definition:
      "The zero-G winder takes the core concept of a zero-G roll — a 360-degree inversion with a parabolic arc that produces near-weightlessness at the apex — and adds a directional change into the geometry. While a standard zero-G roll has the train enter and exit on roughly parallel headings, the winder curves the track during the roll so the train exits pointing in a meaningfully different direction from where it entered. This makes the element a layout-planning tool as well as an inversion: it simultaneously delivers the floating sensation of a zero-G roll and redirects the coaster into the next section.\n\nZero-G winders are strongly associated with newer, more technically ambitious coaster designs and appear on rides built by manufacturers such as Intamin and B&M. Kondaa at Walibi Belgium and VelociCoaster at Universal's Islands of Adventure both feature zero-G winders as standout elements. The combination of airtime, inversion, and directional transition in a single element gives a zero-G winder a more complex, multi-phase sensation than a straight zero-G roll.",
    relatedTermIds: ['zero-g-roll', 'inversion', 'airtime', 'intamin'],
    aliases: ['zero g winder', 'zero-G winder', 'winder'],
  },
  {
    id: 'banana-roll',
    name: 'Banana Roll',
    shortDefinition:
      'An extended, asymmetric double-inversion element in which two inversions are connected by a long curved arc — giving the element a banana-like shape.',
    definition:
      'The banana roll is a stretched variation of the double-inversion concept in which two inversions are spaced further apart and connected by a sweeping curved section rather than the tight, symmetrical back-to-back geometry of a standard cobra roll. Viewed from above, the track follows a gradual arc through both inversions, resembling the curve of a banana. The looser geometry spreads the two inversions over a longer section of track, giving riders a more drawn-out, flowing experience through both inversions compared to the rapid-fire intensity of a conventional cobra roll.\n\nThe banana roll first appeared on Takabisha at Fuji-Q Highland, Japan, which opened in 2011 and was built by Gerstlauer. S&S Worldwide later developed their own variant for Steel Curtain at Kennywood, which features a double-inverting version of the element. Because the element requires considerable lateral space, it tends to appear on larger, ground-level installations where the track can sweep broadly between inversions. The visual impact — a gently curving double-inversion rather than the angular shape of a cobra roll — is distinctive and immediately recognisable.',
    relatedTermIds: ['cobra-roll', 'inversion', 'gerstlauer', 's-and-s-worldwide'],
  },
  {
    id: 'inclined-loop',
    name: 'Inclined Loop',
    shortDefinition:
      'A vertical loop rotated off its perpendicular axis, so the train approaches and exits at an angle rather than straight-on.',
    definition:
      "An inclined loop (also called a tilted loop) is a standard vertical loop that has been rotated around its axis, typically by 45 to 80 degrees relative to the track's direction of travel. Instead of the train entering and exiting the loop while traveling straight forward — as in a conventional upright loop — it approaches and leaves at an oblique angle, creating an asymmetric visual profile and a noticeably different on-ride sensation.\n\nThe tilted geometry changes how riders experience the inversion: the approach feels more lateral than a standard loop, and the pull-out at the bottom of the circle comes from a different direction than expected, which can be both disorienting and thrilling. From spectator viewpoints, an inclined loop looks dramatically different from a standard loop and is immediately recognisable as unusual. Inclined loops appear on several B&M and Intamin coasters, often in the mid or final sections of a layout where the track needs to change direction and designers incorporate the loop as a combined inversion and transition element.",
    relatedTermIds: ['vertical-loop', 'inversion', 'b-and-m', 'intamin'],
    alternateNames: ['tilted loop', 'tilted-loop', 'angled loop'],
  },
  {
    id: 'sea-serpent',
    name: 'Sea Serpent',
    shortDefinition:
      'A Vekoma double-inversion element in which the train passes through two inversions and exits traveling in the same direction it entered.',
    definition:
      "The sea serpent is a double-inversion element most closely associated with Vekoma's inverted coaster designs. Like a cobra roll, it consists of two inversion sequences joined by a central connecting section, but the track geometry differs in a key way: while a cobra roll sends the train through a 180-degree direction reversal during the element, the sea serpent is laid out so the train enters and exits traveling in the same general direction. The two inversions arc up and over in a flowing sequence without reversing the train's heading, giving the element a longer, more S-curve-like appearance when viewed from the side — reminiscent of the body of a sea serpent arching through two peaks.\n\nSea serpents appear on Vekoma's Suspended Looping Coaster (SLC) model and on some of the manufacturer's custom installations. Because the SLC has been produced in large numbers for parks around the world, the sea serpent is one of the most widely distributed double-inversion elements globally, even if it is less well known by name than the cobra roll. The riding experience varies considerably across installations depending on track condition and wheel profile.",
    relatedTermIds: ['inversion', 'cobra-roll', 'batwing', 'vekoma'],
    aliases: ['sea serpent'],
    alternateNames: ['roll over'],
  },
  {
    id: 'barrel-roll-drop',
    name: 'Barrel Roll Drop',
    shortDefinition:
      'An RMC signature element that combines the first drop and a full barrel roll into one continuous sequence, inverting riders while they are still descending.',
    definition:
      "The barrel roll drop is one of Rocky Mountain Construction's most celebrated signature elements, merging what would normally be two separate experiences — the first drop and a full inversion — into a single, uninterrupted sequence. After departing the lift hill, the track rotates the train through a complete barrel roll while simultaneously descending: riders find themselves fully inverted near the steepest point of the drop, then are rotated back upright as the train reaches the bottom and transitions into the rest of the layout. The inversion happens at high speed because the train is accelerating through the drop at the same moment it is rolling.\n\nThe element was made possible by RMC's I-Box steel track system, which allows the tight radii and complex three-dimensional geometry required for a simultaneous roll and drop — a combination that would have been structurally impossible on traditional wooden coaster track. Medusa Steel Coaster at Six Flags Mexico was among the early coasters to feature a barrel roll drop; Steel Vengeance at Cedar Point and Zadra at Energylandia are other widely celebrated examples. The element has become one of the defining visual and experiential signatures of RMC's converted wooden coasters.",
    relatedTermIds: ['inversion', 'rmc', 'first-drop', 'hybrid-coaster', 'stall'],
    aliases: ['barrel roll drop', 'barrel roll downdrop'],
    alternateNames: ['RMC barrel roll'],
  },
  {
    id: 'mcbr',
    name: 'MCBR',
    shortDefinition:
      'Mid-Course Brake Run — a set of brakes positioned partway through a coaster layout that can bring the train to a full stop to allow safe multi-train operation.',
    definition:
      "A mid-course brake run (MCBR) is a braking section installed somewhere in the middle of a coaster's layout — after the ride's initial major elements but before the closing sequence. Unlike trim brakes, which merely reduce speed and allow the train to continue immediately, an MCBR is a full block-section brake: it can stop the train completely and hold it until the next block section ahead is confirmed clear. This makes it possible to run multiple trains on the same track simultaneously without risk of collision, significantly increasing the ride's throughput capacity.\n\nOn a busy operating day with trains dispatched at full capacity, a well-timed MCBR will release a stopped train almost immediately, and riders may barely notice the brief deceleration before the ride continues. On quieter days with fewer trains running, the stop can last longer and feel more abrupt. MCBRs are standard on most large coasters: B&M inverted and floorless coasters, many Intamin rides, and other high-capacity attractions use them routinely. Riders sometimes note the way an MCBR can disrupt the pacing of a layout — slowing the train before a second half that was designed to run at higher speed.",
    relatedTermIds: ['block-brake', 'brake-run', 'trim-brake', 'stacking', 'ride-capacity'],
    aliases: ['mid course brake', 'midcourse brake', 'mid-course brake'],
    alternateNames: ['mid-course brake run'],
  },
  {
    id: 'interlocking-loops',
    name: 'Interlocking Loops',
    shortDefinition:
      'Two vertical loops whose planes cross each other — creating a visually dramatic chain-link or figure-eight structure.',
    definition:
      "Interlocking loops are two vertical loops positioned so their structural planes intersect, typically at roughly perpendicular angles. The result is a striking visual configuration in which one loop appears to pass through the other when seen from certain angles, resembling a chain link or an oversized figure-eight rising out of the ground. The structural engineering required to make two loops cross without the tracks actually touching is considerable, but the visual payoff makes the element a crowd-pleasing focal point in a park's skyline.\n\nInterlocking loops are most commonly associated with B&M inverted coasters and sit-down looping coasters designed for high inversion counts. Dragon Khan at PortAventura, long one of Europe's most famous coasters, features interlocking loops as part of its eight-inversion layout, and the crossing loops are one of the most photographed sections of the ride. The element appears on a number of other high-inversion coasters around the world. From a riding perspective, the experience of passing through an interlocking loop sequence is similar to two closely spaced vertical loops, though the compressed structural geometry can make the transitions feel unusually rapid.",
    relatedTermIds: ['vertical-loop', 'inversion', 'b-and-m'],
    aliases: ['interlocking loops'],
    alternateNames: ['crossing loops', 'linked loops'],
  },
  {
    id: 'anti-rollback',
    name: 'Anti-Rollback',
    shortDefinition:
      'The ratcheting safety device on a lift hill that prevents the train from rolling backwards — the source of the iconic click-clack sound.',
    definition:
      'An anti-rollback device (also called a rollback dog or anti-rollback dog) is a mechanical safety mechanism fitted along the underside of a lift hill. As the train climbs, spring-loaded metal pawls — sometimes called "dogs" — ratchet over a series of teeth embedded in the lift hill structure. If the chain or drive mechanism were to fail, the pawls would catch on the teeth and lock the train in place, preventing it from rolling back down. The ratcheting action of the pawls over the teeth is the source of the rhythmic clicking sound that has become one of the most recognisable audio signatures of traditional roller coasters.\n\nOn modern coasters with smooth elevator-cable or LSM-powered lift hills, anti-rollback dogs are often eliminated or replaced with quiet electromagnetic braking systems, which is why some newer lift hills are noticeably quieter. Enthusiasts sometimes lament this change as the loss of a classic sensory element of the coaster experience — the building tension of the click-clack soundtrack as the train climbs before the drop.',
    relatedTermIds: ['lifthill', 'rollback', 'launch-coaster'],
    aliases: ['anti-rollback device', 'anti-rollback system'],
    alternateNames: ['rollback dog', 'click-clack'],
  },
  {
    id: 'head-choppers',
    name: 'Head Choppers',
    shortDefinition:
      "Structural elements or track sections designed to pass just above riders' heads at speed — creating a thrilling near-miss illusion.",
    definition:
      "Head choppers are deliberate design features in which a coaster's support structure, cross-bracing, tunnels, or sections of track pass immediately above riders' heads at the moment the train is travelling at speed. The proximity and timing create a powerful illusion that something is about to strike the riders — an adrenaline spike with no actual danger, since the clearance is precisely engineered. The sensation is sharpest when riders have no warning: a train exiting a banked turn might sweep under a low beam just as it accelerates, leaving barely enough time to register what just happened.\n\nHead choppers are particularly associated with tightly spaced wooden coasters and with inverted coasters, where the dangling legs of riders and the low-slung profile of the hanging trains bring them close to supports, station buildings, and other track sections. Designers of compact twister coasters often route different sections of the track to pass within centimetres of each other at speed, maximising these near-miss moments. For many enthusiasts, well-designed head choppers are a sign of creative layout work and contribute significantly to the perceived intensity of a ride.",
    relatedTermIds: ['roller-coaster-element', 'inverted-coaster', 'twister-coaster'],
    aliases: ['head chopper', 'head-chopper element'],
    alternateNames: ['near miss'],
  },
  {
    id: 'stapling',
    name: 'Stapling',
    shortDefinition:
      'When a ride operator presses lap bars or restraints too tightly against riders — reducing comfort and eliminating the airtime the ride was designed to deliver.',
    definition:
      'Stapling refers to the practice — intentional or over-cautious — of an operator pushing a lap bar or shoulder harness so firmly against a rider that it is significantly tighter than the minimum required safe position. The term comes from the sensation of being pinned or "stapled" into the seat. On airtime-focused coasters, lap bars are supposed to sit loosely enough for riders to actually lift slightly off the seat at the crests of hills — that\'s what delivers airtime. A stapled rider is held flat against the seat throughout and cannot experience the intended floating sensation, regardless of how well-designed the hills are.\n\nStapling is a common source of frustration in the enthusiast community, particularly on wooden coasters and hybrid coasters where airtime is the primary attraction. The degree of stapling varies by park, by operator, by time of day, and sometimes by the visible size of the rider being restrained. Some parks are known for consistently loose, rider-friendly policies; others are criticised for systematically over-restraining. Riders who want to maximise airtime often board as late as possible to avoid early check-by operators, and position the bar themselves before operators come to check it.',
    relatedTermIds: ['lap-bar', 'shoulder-harness', 'airtime', 'ejector-airtime'],
    aliases: ['stapled', 'over-stapled'],
    alternateNames: ['over-tightened restraint'],
  },
  {
    id: 'valleying',
    name: 'Valleying',
    shortDefinition:
      'When a coaster train loses enough speed mid-ride that it becomes stranded in a low point of the track and cannot complete the course.',
    definition:
      'Valleying occurs when a coaster train, having lost too much kinetic energy during the ride, fails to have sufficient momentum to crest the next hill or complete the next element and comes to a stop — or rolls back — in a valley between two high points on the track. Because the train is now sitting at a low point rather than at a brake run or station, it cannot be moved by the normal operating systems. Recovering a valleyed train typically requires maintenance personnel to physically push or winch the train over the next high point, or disembark riders and pull the train back.\n\nValleying is rare under normal operating conditions, since rides are designed with substantial speed margins. It is more likely to occur in unusually cold weather (when wheel bearings run sluggish and friction increases), on an underpowered train running with fewer passengers than designed for, after excessive trim braking, or on rides that were originally designed for different wheel and axle specifications than are currently installed. Valleying incidents occasionally occur on ageing wooden coasters whose track geometry has shifted over time. When a coaster is reported to have "valleyed," it typically takes the ride out of operation for hours while recovery work is completed.',
    relatedTermIds: ['rollback', 'trim-brake', 'brake-run', 'downtime'],
    aliases: ['valley', 'valleyed'],
    alternateNames: ['stalled train', 'stranded train'],
  },
  {
    id: 'wild-mouse',
    name: 'Wild Mouse',
    shortDefinition:
      'A coaster style using small individual cars and a compact layout of tight flat turns at the edges of elevated platforms — creating the sensation the car is about to fly off.',
    definition:
      'A wild mouse coaster (also simply "mouse coaster") uses small cars seating two to four riders rather than the long trains of conventional coasters. The hallmark of the design is a series of tight, flat-banked hairpin turns executed at the very edges of the track, where the car travels perpendicular to the curve before turning sharply. Because the turns are not steeply banked — unlike the smooth banked curves of other coasters — riders are thrown laterally against the side of the car, and the momentum of the approach makes the turn feel later than expected, creating a convincing sensation that the car is about to slide off the track.\n\nWild mouse coasters are among the most space-efficient designs available, fitting a surprising amount of ride into a compact footprint by layering the hairpin turns on elevated platforms above the track below. Steel wild mouse models appear at parks around the world from manufacturers including Mack Rides, Maurer, and Gerstlauer; wooden wild mouse coasters exist but are rare. The ride profile appeals broadly — the cars are accessible to riders of many heights and ages, the speed is moderate, and the hairpin-turn sensation is reliably surprising regardless of how many times a rider has experienced it.',
    relatedTermIds: ['spinning-coaster', 'steel-coaster', 'mack-rides', 'gerstlauer'],
    aliases: ['wild mouse coaster'],
    alternateNames: ['mouse coaster', 'Wilde Maus'],
  },
  {
    id: 'fourth-dimension-coaster',
    name: 'Fourth Dimension Coaster',
    shortDefinition:
      "A coaster type where seats are mounted on rotating arms extending beyond the sides of the train — spinning independently of the train's direction of travel.",
    definition:
      "A fourth dimension coaster (4D coaster) is a coaster design in which the passenger seats are not fixed to the train but are instead mounted on pivoting arms extending to the left and right of each car. The seats can rotate forward or backward independently of the direction the train is travelling — controlled either by a fixed rail running alongside the track (which forces the seat to a predetermined position at each moment in the layout) or by allowing free rotation driven by gravity and rider weight distribution. The result is that passengers may be facing downward during a drop, inverted during a turn, or rotating through multiple axes simultaneously during inversions.\n\nThe concept was developed by Arrow Dynamics and later refined by S&S Worldwide. X2 at Six Flags Magic Mountain in California is the most famous example and the world's first 4D coaster, having opened in 2002 — its redesign in 2008 added fire effects and an audio system. Eejanaika at Fuji-Q Highland in Japan features the most inversions of any coaster in the world partly because the seat rotation multiplies inversion count. The riding experience on a 4D coaster is highly variable and often disorientating in a way that conventional coasters cannot replicate.",
    relatedTermIds: [
      'inverted-coaster',
      'spinning-coaster',
      'arrow-dynamics',
      's-and-s-worldwide',
      'inversion',
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
      'An out-and-back is one of the two foundational roller coaster layout types. The train departs the station, travels outward in a broadly linear direction — typically delivering a series of hills optimised for airtime — executes a turnaround at the far end of the property, and returns along a similar path roughly parallel to the outbound leg. The two legs rarely cross, giving the layout a long, narrow footprint compared to the alternative twister layout.\n\nOut-and-back designs are strongly associated with traditional wooden coasters, where the sustained speed built on the long outbound hills is best exploited through a returning sequence of progressively faster, lower hills that maximise floater airtime. The layout style rewards designers who can tune each hill for a specific speed: as the train is lightest (fastest) on the return, the return hills are shorter and more closely spaced to maintain the floating sensation. Famous out-and-back wooden coasters include The Voyage at Holiday World, Comet at The Great Escape, and the various versions of the Racer coaster type. Steel coasters can also follow out-and-back paths, though the style is less common in steel than in wood.',
    relatedTermIds: ['twister-coaster', 'airtime', 'wooden-coaster', 'airtime-hill'],
    aliases: ['out and back', 'out-and-back layout', 'out and back coaster'],
  },
  {
    id: 'twister-coaster',
    name: 'Twister',
    shortDefinition:
      'A coaster layout that loops, spirals, and crosses back over itself — packing maximum elements into a compact footprint.',
    definition:
      'A twister coaster (also called a cyclone layout) is a coaster design in which the track spirals, doubles back, and crosses over or under itself repeatedly, weaving an intricate structure rather than following the simple two-legged path of an out-and-back layout. The defining characteristic is that the train frequently passes within close range of other sections of the same track — often in different directions and at different heights — creating the head-chopper near-miss sensations and visual complexity that define the type.\n\nTwister layouts are efficient with land area: a great deal of track length and vertical displacement can be packed into a relatively compact, roughly square or rectangular footprint. This makes them a popular choice in space-constrained parks. Wooden twisters include classics like the Twister at Grona Lund in Stockholm and the Jack Rabbit at Seabreeze; steel twisters include many B&M and Intamin designs. Because the train is constantly changing direction — banking, turning, climbing and descending all within the same compact zone — twister layouts tend to feel more intense and visually complex than out-and-back designs, even if their top speeds or heights are comparable.',
    relatedTermIds: ['out-and-back', 'wooden-coaster', 'head-choppers', 'helix'],
    aliases: ['twister layout', 'twister coaster'],
    alternateNames: ['cyclone', 'cyclone layout'],
  },
  {
    id: 'mae',
    name: 'MAE',
    shortDefinition:
      'Mean Absolute Error — the average number of minutes by which a wait time prediction misses the actual queue.',
    definition:
      'MAE (Mean Absolute Error) is the standard measure of prediction accuracy used by park.fan. It calculates the average difference — in minutes — between each predicted wait time and the actual wait time recorded at the park gate. An MAE of 8 minutes means the model\'s predictions are off by 8 minutes on average across all tracked predictions.\n\nMAE treats every error equally: a 5-minute miss and a 15-minute miss are averaged together linearly. This makes it intuitive to interpret — if you see MAE = 10, you can think of it as "predictions are typically within 10 minutes of reality." A lower MAE always means more accurate predictions.',
    relatedTermIds: ['rmse', 'mape', 'r-squared', 'ai-forecast'],
    alternateNames: ['Mean Absolute Error'],
  },
  {
    id: 'rmse',
    name: 'RMSE',
    shortDefinition:
      'Root Mean Square Error — like MAE but penalises large prediction errors more heavily.',
    definition:
      'RMSE (Root Mean Square Error) measures prediction accuracy by squaring each error before averaging, then taking the square root. This means large errors — say, being 40 minutes off on a queue — contribute far more to the RMSE than a 5-minute miss would. RMSE is always equal to or larger than MAE for the same dataset.\n\nFor park.fan, a large gap between RMSE and MAE signals that the model occasionally has big misses on specific rides or days, even if most predictions are close. A small gap means errors are consistently spread without extreme outliers. Both metrics are shown live on the homepage so you can see exactly how the model is performing right now.',
    relatedTermIds: ['mae', 'mape', 'r-squared', 'ai-forecast'],
    alternateNames: ['Root Mean Square Error'],
  },
  {
    id: 'mape',
    name: 'MAPE',
    shortDefinition:
      'Mean Absolute Percentage Error — prediction error expressed as a share of the actual wait time.',
    definition:
      'MAPE (Mean Absolute Percentage Error) expresses prediction accuracy as a percentage rather than an absolute number of minutes. Instead of saying "off by 8 minutes," it says "off by 15% of the actual wait time." This makes it useful for comparing accuracy across attractions with very different typical queues — a 10-minute error means something very different on a ride that usually has a 15-minute wait versus one that usually has 90 minutes.\n\nMAPE can be misleadingly high when actual wait times are very short (e.g., a 2-minute wait where even a 1-minute error is 50%). For this reason, park.fan shows MAPE alongside MAE and RMSE rather than as the sole accuracy metric.',
    relatedTermIds: ['mae', 'rmse', 'r-squared', 'ai-forecast'],
    alternateNames: ['Mean Absolute Percentage Error'],
  },
  {
    id: 'r-squared',
    name: 'R²',
    shortDefinition:
      'R-squared — a measure of how well the AI model explains the patterns in actual wait times (0–1, higher is better).',
    definition:
      "R² (R-squared, also called the coefficient of determination) measures how much of the variation in real wait times the model successfully captures. A value of 1.0 would mean the model perfectly predicts every queue; 0.0 means it explains nothing beyond a simple average. In practice, values above 0.7 indicate a strong model; values above 0.9 are excellent.\n\nFor wait time prediction, achieving high R² is challenging because queues are influenced by unpredictable factors — ride breakdowns, sudden weather changes, viral social media moments — that no model can foresee. park.fan's R² score reflects real-world performance across all tracked predictions, updated daily.",
    relatedTermIds: ['mae', 'rmse', 'mape', 'ai-forecast'],
    alternateNames: ['coefficient of determination'],
  },
  {
    id: 'seasonal-attraction',
    name: 'Seasonal Attraction',
    shortDefinition:
      'A ride, show, or experience that only operates during specific months of the year — such as an ice rink in winter or a water ride in summer.',
    definition:
      "A seasonal attraction is a ride, show, or experience that the park only runs during a defined part of the calendar year. Ice skating rinks, sled rides, and holiday-themed shows typically run in winter (November to February); log flumes, water play areas, and outdoor spectaculars tend to run in summer (May to September). Some seasonal attractions are tied to specific events such as Halloween or Christmas seasons.\n\nOn park.fan, seasonal attractions and shows are automatically identified based on historical operating data and hidden from the park's tab view and map when they are outside their active months — reducing visual clutter and helping you focus on what is actually open today. A seasonal badge (❄️ Winter, ☀️ Summer, or 🍃 generic) appears on every such attraction's card. When the attraction is currently out of season, the badge is dimmed to indicate it is inactive. An off-season toggle button in the Attractions and Shows tabs lets you reveal hidden entries when needed — for example, to plan a future winter visit.",
    relatedTermIds: ['offseason', 'refurbishment', 'crowd-calendar'],
    alternateNames: ['seasonal ride', 'seasonal show', 'seasonal experience'],
  },
];

export default translations;
