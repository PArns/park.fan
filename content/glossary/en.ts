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
  },
  {
    id: 'vertical-loop',
    name: 'Vertical Loop',
    shortDefinition:
      'The classic circular inversion taking riders through a complete 360-degree circle in the vertical plane.',
    definition:
      "The vertical loop is the most iconic inversion in roller coaster history — a complete 360-degree circle in the vertical plane that takes riders fully upside down at the apex. Modern loops use a clothoid (teardrop) shape rather than a perfect circle: the entry and exit sections of the loop are wider in radius, while the top is tighter. This geometry ensures smooth, sustained positive G-forces at the bottom and a brief negative-G moment at the top rather than the jarring spikes a perfect circle would produce.\n\nThe first modern loop coaster, Corkscrew at Knott's Berry Farm (1975), transformed the amusement industry. Today vertical loops anchor the inversion portfolios of coasters worldwide, from introductory looping coasters to record-breaking machines. Dragon Khan at PortAventura features eight loops — one of the highest counts on any European coaster. The sight of a train completing a loop remains one of the most immediately recognisable and crowd-drawing images in theme park marketing.",
    relatedTermIds: ['inversion', 'immelmann', 'cobra-roll'],
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
    relatedTermIds: ['inversion', 'heartline-roll', 'airtime', 'b-and-m'],
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
    name: 'Rocky Mountain Construction',
    shortDefinition:
      'An Idaho-based manufacturer that invented the hybrid coaster concept, converting ageing wooden coasters into steel I-box track rides with unprecedented airtime and inversions.',
    definition:
      "Rocky Mountain Construction (RMC) is an American roller coaster manufacturer and maintenance company based in Hayden, Idaho, best known for inventing the I-box steel track system that can be fitted onto wooden coaster support structures. This conversion technology allowed parks to transform rough, ageing wooden coasters into world-class hybrid rides featuring intense airtime, multiple inversions, beyond-vertical drops, and dramatic overbanked turns — all design features impossible on traditional wood track.\n\nRMC conversions quickly became some of the most acclaimed rides in the world: Steel Vengeance at Cedar Point, Wicked Cyclone at Six Flags New England, and Wildfire at Kolmården in Sweden all received immediate enthusiast acclaim after their openings. New-build RMC hybrids — built from scratch rather than converted from an existing coaster — include Untamed at Walibi Holland, which opened in 2019 and is consistently ranked as one of Europe's best coasters. RMC fundamentally changed the calculus for parks with ageing wooden coasters, offering a clear upgrade path without the loss of beloved heritage structures.",
    relatedTermIds: ['hybrid-coaster', 'wooden-coaster', 'airtime'],
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
    relatedTermIds: ['euro-fighter', 'spinning-coaster', 'b-and-m', 'intamin'],
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
    name: 'Lift Hill',
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
    relatedTermIds: ['inversion', 'immelmann', 'batwing', 'b-and-m'],
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
    name: 'Coaster Credit',
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
      "An AI forecast uses machine learning models trained on historical attendance data, weather patterns, school holiday calendars, and real-time queue data to predict how busy a theme park or individual attraction will be on any given day or hour. park.fan generates AI forecasts for crowd levels and expected wait times up to 30+ days in advance.\n\nThe predictions are updated continuously as new data arrives. Near-term forecasts (1–7 days) are typically very accurate because recent weather, event announcements, and booking signals can be incorporated. Longer-range forecasts are naturally less precise but still valuable for planning — they identify reliably quiet or busy periods well ahead of time.\n\nAI forecasts differ from simple historical averages by adapting to current conditions: a theme park that has just announced a new attraction, a public holiday falling on a different weekday than usual, or an unusually warm spring weekend will all shift the prediction meaningfully away from the historical baseline.",
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
    aliases: ['Artificial Intelligence'],
  },
  {
    id: 'realtime-wait-time',
    name: 'Live Wait Time',
    shortDefinition:
      'Wait time data pulled directly from park systems and updated every minute.',
    definition:
      'A live wait time is the current, real-time wait pulled from a park\'s own data systems — not a historical average, but the actual figure right now, to the minute. park.fan fetches live wait times from official park APIs and third-party sources and refreshes every minute, so you always know which attractions are running short queues and which are backed up.',
    relatedTermIds: ['wait-time', 'posted-wait-time', 'crowd-forecast'],
    aliases: ['Live Wait Times', 'Real-Time Wait Time', 'Real-Time Wait Times'],
  },
  {
    id: 'crowd-forecast',
    name: 'Crowd Forecast',
    shortDefinition:
      'AI-based prediction of how busy a theme park will be on a given day.',
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
    id: 'roller-coaster-element',
    name: 'Roller Coaster Element',
    shortDefinition:
      'A named section or feature of a roller coaster track, such as a loop, airtime hill, or inversion.',
    definition:
      "A roller coaster element is any distinct, named feature incorporated into a coaster's layout — from classic inversions like vertical loops and corkscrews to non-inverting elements like airtime hills, helices, and overbanks. Engineers design each element to produce a specific physical sensation: weightlessness (airtime), lateral G-forces, or the disorientation of going upside down. Coaster enthusiasts and manufacturers use precise names for these features to describe, compare, and rate ride designs worldwide.\n\npark.fan's glossary covers dozens of individual coaster elements — from the first drop and lifthill that open every ride to advanced features like the Stengel dive, Norwegian loop, and heartline roll found on modern steel coasters.",
    relatedTermIds: ['airtime', 'inversion', 'vertical-loop', 'helix', 'first-drop'],
    aliases: ['Roller Coaster Elements'],
  },
];

export default translations;
