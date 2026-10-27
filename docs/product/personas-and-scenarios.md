# Personas, scenarios and product gaps

Six visitor personas walked through a park visit from choosing a park to after the visit, mapped
against what park.fan ships and what is missing (the gap backlog G1–G9), and the order in which
personas get a landing page. Open it before proposing a feature, a landing page or a data
investment. Re-checked against both repos on 2026-10-27; claims name the code that backs them.

## 1. Personas

| Persona                                | Who                                                                                       | Success means                                                            | Asks                                                                                                     |
| -------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **P1 Sandra**, family trip planner     | 38, Cologne, kids 5 and 9, 1–2 trips a year; plans weeks ahead on desktop, phone in park  | short waits for rides her kids may ride, a rain plan, food without drama | "Least crowded day in the autumn break?" · "Can my 110 cm kid ride this?" · "If it rains?" · "Cost?"     |
| **P2 Tim**, coaster enthusiast         | 24, 15–25 parks a year, phone-first, daily user                                           | maximum ride count, headliners at rope drop, data to brag with           | "Which of three parks is quietest on Saturday?" · "Real P90 on Taron in August?" · "My rides last year?" |
| **P3 Mehmet**, local passholder        | 29, annual pass, 30 min away, decides the same morning, phone only                        | never driving to a packed park; hearing about an unexpectedly quiet day  | "How full is it now and until close?" · "Will the rain pass by 15:00?" · "Ping me on a green day"        |
| **P4 Emily**, first-time tourist       | 45, Madrid, one Disneyland day on a Paris trip, foreign SIM, lost in jargon               | not feeling lost, seeing the must-dos, knowing the rules before the gate | "What must we not miss?" · "What is a return time?" · "In what order?" · "How early?"                    |
| **P5 Renate & Wolfgang**, grandparents | 67 and 69 with grandkids 6 and 8; a knee prosthesis, no intense rides; shared tablet      | short walks, quiet slots, rides the whole group can do together          | "Rides for a 6-year-old and someone who can't spin?" · "Manageable with limited mobility?"               |
| **P6 Lena**, search drive-by           | 26, googles "wie voll ist der Europa-Park heute" on the way to the car, 30–90 s attention | one number and a verdict above the fold; remembering the site next time  | "Crowded today?" · "Open at all?" · and the product's question: why come back?                           |

P1 and P5 stress pre-visit content and safety metadata, P2 data depth and multi-park tooling, P3
real-time and proactive signals, P4 guidance and i18n, P6 landing speed and conversion.

## 2. Scenario walkthroughs

✅ works · 🟡 partial · ❌ missing.

### S-A · Choosing a park (P1, P2, P4, P5)

| Need                   | State | Notes                                                                                                                                                     |
| ---------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browse parks by region | ✅    | geo hierarchy `/parks/[continent]/[country]/[city]` with live open counts                                                                                 |
| Best time to visit     | ✅    | `/best-time-to-visit` and the per-park best-days section                                                                                                  |
| Country summaries      | ✅    | `CountrySummarySection`, data-derived and server-rendered on every country page                                                                           |
| Park vs. park          | ✅    | `/compare?parks=a,b` (`ParkCompareTool`, PAR-655) renders `ParkComparisonCard`; `noindex` and out of the sitemap by decision (a tool, not a landing page) |
| Family suitability     | ✅    | the park page's height filter ("23 of 40", `lib/utils/rider-height.ts`, `RiderHeightFilter`), `mayGetWet` badges, the with-kids page                      |
| Rankings across parks  | 🟡    | per-park statistics page exists ([park sub-pages](../seo/park-sub-pages.md)); no cross-park "best parks for X" ranking                                    |

### S-B · Planning, weeks to months ahead (P1, P2, P4, P5)

| Need                       | State | Notes                                                                                                                                                                       |
| -------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Crowd calendar, 365 days   | ✅    | calendar with ML yearly predictions and holiday overlays incl. cross-border catchments (`influencingRegions`)                                                               |
| Best days, weekday pattern | ✅    | `ParkBestDaysSection`, park statistics (month, weekday, rides P50/P90)                                                                                                      |
| Seasons and special events | ✅    | `ParkSeasonsCard` from hand-researched `ParkSeason` records (status, dates, separate-ticket price); backend `TICKETED_EVENT` schedule entries are not used                  |
| Ticket prices and links    | 🟡    | paid skip-the-line prices from `schedule[].purchases` (`ParkPurchasesCard`; Disney US parks only, Universal and EU deliver none); no admission prices anywhere              |
| Day plan                   | ✅    | the trip planner: wizard, timeline against forecast waits, `lib/planner/optimize.ts` orders the day; it knows the shortest rider and who stays dry (`lib/planner/party.ts`) |
| Save a planned trip        | 🟡    | kept in `localStorage` (`lib/planner/store.ts`), one device                                                                                                                 |
| Cross-device continuity    | 🟡    | a plan can be handed over by link (`/trip-planner/shared#<trip id>`, `lib/planner/trip-share.ts`; the id is the credential); favorites stay in cookies. No accounts (G2)    |
| Accommodation, travel      | ❌    | out of scope; only nearby parks                                                                                                                                             |

### S-C · The final week (P1, P3, P5)

| Need                                               | State | Notes                                                                                                                                                                                         |
| -------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 16-day weather, hourly chart                       | ✅    | forecast strip and hourly chart per park                                                                                                                                                      |
| Updated crowd prediction                           | ✅    | calendar and Fancast, but the visitor has to re-check                                                                                                                                         |
| "Your day changed" alert                           | 🟡    | the push channel exists; the plan's topics are `next-up`, `rain-soon` and `morning-plan` (backend `PUSH_TOPICS`), all about the day itself. Nothing watches the forecast for a day a week out |
| Severe-weather warnings                            | ✅    | official CAP warnings (DWD, MeteoAlarm) in `WeatherWarningBanner`                                                                                                                             |
| Practical info (bags, lockers, parking, strollers) | ❌    | nothing per park (G9)                                                                                                                                                                         |

### S-D · Arrival and rope drop (all; P4 most)

| Need                         | State | Notes                                                                                                                                                                                                                         |
| ---------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rope-drop recommendations    | ✅    | tier-1/tier-2 headliners per park and ride (`RopeDropCard`, `RopeDropHeadliners`)                                                                                                                                             |
| "How does this park work"    | 🟡    | `/how-park-fan-works` and the glossary explain concepts generically; the park page opens with the park's guide (`ParkFirstVisitGuide`) for about 29 parks that have one, in all six languages. Other parks show nothing extra |
| Today's hours and crowd      | ✅    | `ParkTodayPanel`; "today" is picked on the client in the park's timezone                                                                                                                                                      |
| Guided plan for the day      | ✅    | the planner; `lib/planner/live.ts` corrects the current block against live standby                                                                                                                                            |
| Jargon help in six languages | ✅    | glossary with localized URLs, terms linked from park and ride pages                                                                                                                                                           |
| Offline at the gate          | ❌    | `public/sw.js` handles push only and has no `fetch` listener, by decision ([caching strategy](../architecture/caching-strategy.md), PAR-423; G4)                                                                              |

### S-E · In the park (all; P2 and P3 most)

| Need                        | State | Notes                                                                                                                                                                                                  |
| --------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Live waits, 5-min refresh   | ✅    | `LiveParkData`, `LiveAttractionData`                                                                                                                                                                   |
| Near me now                 | ✅    | `components/parks/nearby-in-park-view.tsx`: nearest rides and headliners with live waits and distance; the homepage switches to in-park mode                                                           |
| Map, shows, nowcast         | ✅    | Leaflet park map, shows tab with showtimes, 15-minute rain and thunder nowcast                                                                                                                         |
| Rain plan                   | 🟡    | the „Überdacht" filter and the nowcast's list share `lib/utils/covered-rides.ts`; offered once half a park's in-season rides carry `indoorOutdoor`: 10 parks, 440 of 7,447 rides on 2026-10-22         |
| Wait-time alerts            | ✅    | ride alerts with `thresholdMinutes`, show follows, `/alerts` (`lib/push/push-follows.ts`, `components/push/alerts-overview.tsx`), web push                                                             |
| Next best ride              | ✅    | with a plan, the running block; without, up to three rides at least 10 min under their forecast (`suggestNextRides`, `lib/planner/next-best-ride.ts`, PAR-419)                                         |
| Single rider, virtual queue | ✅    | `QueueTypeBadge`: single-rider waits, return windows, boarding groups, live paid-queue prices                                                                                                          |
| Restaurant depth            | ❌    | `RestaurantCard` can show cuisine and a reservation badge, but the source sends no cuisine and the backend mapper hardcodes `requiresReservation: false` (`themeparks.mapper.ts`); needs a data source |

### S-F · After the visit (P2 most)

| Need                       | State | Notes                                                                                                                                         |
| -------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Contribute photos          | ✅    | `/contribute` (Turnstile-gated)                                                                                                               |
| Blog                       | ✅    | blog and news with live embeds, RSS                                                                                                           |
| Ride log                   | 🟡    | rides can be marked ridden per browser (`lib/utils/ridden-rides.ts`, "x of y ridden" via `RiddenCounter`); no dated visit diary, no sync (G7) |
| Visit vs. prediction recap | ❌    | accuracy data exists in the ML entities, nothing user-facing                                                                                  |
| Reviews, community         | ❌    | deliberately absent                                                                                                                           |
| Re-engagement              | 🟡    | a browser with one alert has a push subscription, but sends are scoped to what the visitor asked for; nothing editorial, no email (G2)        |

## 3. Persona → biggest unmet need

| Persona             | Served well                                                                                 | #1 gap                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| P1 Sandra           | calendar, weather, best days, height filter, planner, with-kids page                        | proof the with-kids page brings her in (re-measurement PAR-590)                             |
| P2 Tim              | P50/P90, rope drop, history, Fancast, planner, `/compare`                                   | a dated ride log (G7)                                                                       |
| P3 Mehmet           | live status, nowcast, in-park view, ride and show alerts                                    | the "green day" ping: every alert is per ride, show or plan, never "today is worth it" (G3) |
| P4 Emily            | glossary, guide, i18n, planner, park guides as the park page's primer                       | a primer for the parks without a guide, and practical info (G5a, G9)                        |
| P5 the grandparents | quiet-day data, the grandchildren's height question                                         | accessibility and intensity metadata (G1)                                                   |
| P6 Lena             | fast server-rendered answer, the park page's alert entry (`RideAlertsEntryButton`, PAR-375) | proof that she returns (re-measurement PAR-576)                                             |

Since July the capabilities landed (planner, height filter, push); what was left was ways in, and
§5 ordered those.

## 4. Gap backlog

The gaps the scenarios above name, with what is still missing. The work and its order are in
Linear.

| #      | Gap                                                             | Personas       | Missing                                                                                           | Issue    |
| ------ | --------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- | -------- |
| **G1** | Attraction metadata                                             | P1, P5, P4     | intensity and accessibility ([sources](attraction-metadata-sources.md)); they block a page for P5 | PAR-1127 |
| **G2** | Accounts or cross-device sync                                   | P1, P2, P6     | a decision; only per-browser identities exist (push subscription, trip id, plan link)             | PAR-1128 |
| **G3** | Alerts and notifications                                        | P3, P1, P2, P6 | the green-day ping and "your day changed" for a date a week out                                   | PAR-1130 |
| **G4** | Offline shell                                                   | P3, P6         | nothing: decided against (PAR-423); the install prompt shipped, the service worker is push-only   | none     |
| **G5** | Touring guide per park                                          | P4, P1, P2     | G5b, the planner, shipped; G5a, a primer for the parks without a guide                            | PAR-1133 |
| **G6** | Park comparison and statistics pages                            | P2, P1         | `/compare` and the per-park average-wait-times page shipped; a cross-park ranking is not planned  | none     |
| **G7** | Ride log and visit recap                                        | P2             | a dated log; it waits on G2, because losing the browser would lose the count                      | PAR-1128 |
| **G8** | Surface data the backend already has                            | P1, P2, P4     | restaurant cuisine and reservation need a data source                                             | PAR-1135 |
| **G9** | Practical per-park info: parking, lockers, bag rules, strollers | P1, P4, P5     | all of it; editorial work that pairs with the park guides                                         | PAR-1133 |

## 5. Landing-page pilot order

Decided for PAR-355 on 2026-09-21; input to PAR-356–358.

**The criterion.** A persona landing page earns its build where **the product meets the need but
no page addresses it**. Where a page already addresses it, a second one competes for the same
query; where the product cannot meet it, the page promises what it cannot do. It is the product
side of the SEO rule in [park sub-pages](../seo/park-sub-pages.md#the-rule-a-new-url-must-server-render-what-no-other-url-does);
where the two disagree, the SEO rule has the measurements.

1. **P1 Sandra: built** as the with-kids page per park (PAR-356). The height filter and the
   planner's party question existed; no page said so to somebody searching for a family day out.
2. **P4 Emily: built** as the primer slot on the park page (`ParkFirstVisitGuide`): arrangement of
   the existing guides rather than new writing.
3. **P5 the grandparents: blocked** on the accessibility and intensity half of G1. A page before
   that data would be a page about rides park.fan cannot describe.

Not in the pilot: **P6** is the persona the traffic supports (search is the largest inbound
channel), but the park page already server-renders her answer, so a bare live-wait page would be
a duplicate; her step is conversion on the page she lands on, the alert entry (PAR-375).
**P2** wants features (a ride log) before a page. **P3** needs a notification, not a page.

**What would overturn this:** the order optimises for conversion. If the goal were visibility,
P6 would come first; that half is the per-park statistics page (PAR-371), which is not a live
park-query page, so the two bets do not collide.
