# Parky, the chat assistant

Parky is the round button at the bottom right. Pressing it opens a small chat window that answers
questions about parks, rides, wait times, forecasts and park.fan's own news and posts, plus a
feedback form. Open this page before changing the widget, its rollout or the admin pages. The bot
itself, with its prompt, tools, limits and the stored key, runs on api.park.fan (module
`src/assistant/`, documented in that repo's `docs/frontend/assistant.md`).

## What runs where

| Part                                   | Where                                                         |
| -------------------------------------- | ------------------------------------------------------------- |
| Claude key, prompt, tool loop, limits  | api.park.fan `/v1/assistant/*`, model Claude Haiku 5.5        |
| Chat, rating, feedback (`POST`)        | browser → api.park.fan directly (`ASSISTANT_API`), streamed   |
| Rollout config                         | `/api/assistant-config` relays `/v1/assistant/config`, 60 s   |
| Blog and news for the bot              | `/api/assistant-posts` (search), `/api/assistant-post` (text) |
| Widget                                 | `components/assistant/`, mounted in `app/[locale]/layout.tsx` |
| Admin: settings, chats, feedback, cost | `/admin/assistant`, through the admin proxy                   |

The chat goes to the API directly, not through a relay route, so a streamed answer never holds a
Vercel function open. The config goes through a route because Cloudflare caches it, and a cached
answer cannot carry a per-origin CORS header.

`/api/assistant-post?locale=&slug=` returns a post's `title`, `date`, `url`, its plain `text` cut
near 9,000 characters (`shortened` when cut) and `sections`, the H2 and H3 headings. A guide runs
past that limit, so the API passes the visitor's question as `q` (at most 200 characters): `text`
then holds the intro and the sections that answer it best, in the post's order, and `omitted` names
the headings left out. A section scores with the site search's word matching: a hit in its heading
counts four times one in its body, a word found in few sections counts more, one found in more than half counts nothing,
and words under four letters drop out as a stand-in for stop words, unless the question writes them
as a name ("VIP", or "Zoo" inside a sentence). An H2 that is taken brings its H3s along as far as
they fit, those without a hit of their own only after every other section with one, and an H3 taken alone keeps its H2's heading line above it (`postTextForQuery` in
`lib/assistant/post-text.ts`). Both routes are CDN-cached per URL.

The browser sends one question at a time with the chat's id. The history stays on the API, so
nobody can hand Parky made-up earlier answers.

On a phone the window takes the screen, and only the chat scrolls. While it is open the page
behind is pinned (`position: fixed` on `<body>`, moved up by the scroll it had, put back on close),
since `overflow: hidden` alone lets iOS Safari scroll it under a finger. The window stands in what
the browser shows, from 5.5rem below its top to just above the keyboard (`useSheetViewport` with
`--assistant-viewport` and `--assistant-viewport-lift`), and a drag that no scroll area inside the
window can take is cancelled (`scrollsWithin`), so with the keyboard up iOS cannot pan the view
either; a pinch still zooms. All of it in `AssistantPanel`, below `ASSISTANT_PHONE_QUERY`.

## Rollout

Nothing is drawn on the server. `assistantGate` (`lib/assistant/config.ts`) decides in the browser,
after the first paint:

1. `NEXT_PUBLIC_ASSISTANT=off` hides Parky without asking anything (emergency switch, needs a
   deploy).
2. A browser signed in to the admin (the `parkfan_admin` marker cookie) always sees Parky.
3. `?assistant=on` shows Parky for the rest of the session whatever the admin says; `?assistant=off`
   ends that.
4. Otherwise the admin's switch and share decide: a stable bucket 0–99 per browser
   (`localStorage`) against `rolloutPercent`. The config is read once per session.

The config says off when no key is stored, `ASSISTANT_SECRET_KEY` is missing or the day's token
budget is spent. The switch only decides who is shown the widget: admins and testers can chat while
it is off, and removing the key stops every chat. The strings
(`assistant` namespace, a lazy boundary) are fetched only for a browser inside the rollout, the
window's code on the first press.

## The challenge

Before the first question the window solves Cloudflare Turnstile with the action
`assistant-session` (`AssistantChallenge`, `appearance="interaction-only"`), so almost always
nobody sees it: Parky's mark turns and a line says it is checking. Only when Cloudflare wants a
click does the widget appear, in a glass card. The solved token is traded at the API for a session
token (`useAssistantSession`, kept for the browser session), which every chat, rating and feedback
carries. A 401 drops it and the window asks again.

The API refuses a question without asking the model in two cases, and the window words each
(`useAssistantChat`): a 429, more than three questions in 30 seconds or a pause for repeated junk,
reads `errorLimit`; a 422 `unclear`, a message the API took for junk (nothing to read, one key held
down, letters without a vowel, the question just answered asked again), reads `errorUnclear`. The
rules live in the API's `assistant-junk.ts`.

## Parky's break

After repeated abuse the API ends the chat: `chat_end` with `cooldownMinutes` (1 to 1440), the
answer being Parky's goodbye. Once the answer is in, the goodbye stays 2.5 s, the window closes and
Parky puts on his `nightcap` on the button. Until the break ends (`lib/assistant/chat-end.ts`, the
end kept in session storage as `parkfan:assistant-break`, so a reload keeps it) the window shows
`paused` („Parky macht gerade eine kurze Pause.") where the input was; the launcher stays. While the
break runs the API refuses questions with the code `CHAT_ENDED_CODE` (`chat_ended`), as an HTTP
error's body or a stream `error` event; the widget takes that the same way, which is how a second
tab learns of it, with the refusal's `cooldownMinutes`, else its `Retry-After`, else 15 minutes.

## Answers are model output

`AssistantMessageText` renders them with `react-markdown`, without raw HTML and with only `p`,
`strong`, `em`, lists, `br` and `a`. A link stays a link only when `safeAssistantHref` accepts it
(a park.fan page, given the reader's locale) or it is Google Maps directions to coordinates
(`directionsHref`, new tab). Anything else, `javascript:` and `/\host` included, is shown as text.
What the visitor typed is shown as text too. The admin shows chats, tool inputs and feedback as
plain text, never as Markdown or HTML, and links a stored page only through `sitePageUrl`
(`app/admin/assistant/_lib/assistant.ts`), which takes nothing but a path of slugs, so a path
glued to the origin cannot become `https://park.fan@host`. The admin exports nothing.

Each answer in the chat view carries the prompt version it was written with (`Prompt v26`), and
the chat list shows the version of a chat's latest answer and filters by it, so a bad answer
can be placed before or after a prompt fix. Chats stored before the API kept the version show
none.

## Actions, cards and the position

The API sends an `action` event when Parky acts; `readAssistantAction` (`lib/assistant/actions.ts`)
checks it again, hands on a page or a card's links as the path it checked, and builds the language
switch and the feedback chip anew, so nothing else rides along. `useAssistantActions` carries it out
through the site's own paths:

| Action                 | What the widget does                                                                 | Chip        |
| ---------------------- | ------------------------------------------------------------------------------------ | ----------- |
| `card`                 | draws a card (`AssistantCardView`): see the kinds below                              |             |
| `navigate`             | `router.push` to the park.fan path in the reader's locale                            | Seite       |
| `planner_open_day`     | `openDay` in the planner store, `plannerUi.requestOpen('assistant')`                 | Tagesplaner |
| `planner_add_rides`    | `addRide(…, 'assistant')` per ride, then opens the day                               | Tagesplaner |
| `planner_add_block`    | `addCustom(…, 'assistant')`, then opens the day                                      | Tagesplaner |
| `planner_optimize`     | opens the day and `plannerUi.requestOptimize`: the day's optimise row runs           | sortiert    |
| `planner_remove`       | `removeEntry` per id, then opens the day                                             | Tagesplaner |
| `planner_move`         | `moveEntryToIndex`, or `moveEntry` to a time; a show to another performance          | Tagesplaner |
| `planner_update_block` | `setCustomBlock`, and `moveEntry` for a new start; free blocks only                  | Tagesplaner |
| `planner_add_show`     | `addShow(…, 'assistant')` for a showtime the day's `/plan/day` lists                 | Tagesplaner |
| `planner_set_prefs`    | `setDayPrefs` (height, water rides, early entry)                                     | Tagesplaner |
| `planner_mark_done`    | `setEntryDone` per id                                                                | Tagesplaner |
| `planner_clear_day`    | `clearDay`, undoable through `planner_undo`                                          | Tagesplaner |
| `planner_reserve_days` | `reserveDays` for the park, opens the first; `prefs` on the days it filed            | Tagesplaner |
| `planner_reserve_trip` | `reserveDays` for a trip across parks in one write, opens the first                  | Tagesplaner |
| `trip_set`             | the trip planner's own `update` through the bridge, else the hub with the query      | Reiseplaner |
| `trip_undo`            | the trip before Parky's last change, unless the visitor changed it since             | Rückgängig  |
| `replies`              | the reply chips under the newest answer (`AssistantReplies`)                         |             |
| `interview_state`      | the interview's state in session storage; a trip's party with its remembered trip    |             |
| `planner_undo`         | puts the day back as before Parky's last change, unless the visitor changed it since | Tagesplaner |
| `planner_share`        | opens the panel and the bell's popover with the share link; never shares             | Tagesplaner |
| `request_location`     | shows the share card under the answer                                                |             |
| `switch_locale`        | once the answer is complete, the same page in that language, window open             | Sprache     |
| `feedback_sent`        | nothing; the API stored the visitor's feedback                                       | Team        |

A card (`components/assistant/assistant-card.tsx`) is a park or ride with `ParkStatusBadge` and
`CrowdLevelBadge`, a park's rides, a few parks, its calendar, its day in tiles, its shows or its
restaurants, all from live data; or one to three of park.fan's own posts, each as the guides
menu's row (`MenuPostRow`: cover, category, title, teaser, date and reading time), or one to three
glossary terms with their category's icon and short definition. The API reads the posts from
`/api/assistant-posts` (with `slugs=a,b` for exact posts, and the row's cover, crop, category and
reading time) and the terms from `/api/glossary-search`, which names each term's canonical page
(`buildGlossaryTermHref`). A post's url keeps its locale, since its slug belongs to it; the card
links it with the site's prefix and drops a post in another language than the page. A row without
a title or name, or with a link off the site, refuses the card; a cover from another host is
dropped, not the post.

A change to a day or a trip shows a receipt under the answer (`AssistantReceipts`): what changed
(„Reiseplaner: Tage getauscht", „Tagesplaner: Phantasialand, 21. Nov.") and „Rückgängig", which
runs Parky's own undo below and then reads „Zurückgenommen", „Seither geändert, bleibt so" or
„Nicht mehr rückgängig zu machen" (a reload forgets Parky's undo). On a phone during an interview
the window stays open after a change and the receipt offers „Ansehen", which closes it for a look.

Every planner change keeps the day as it was before and as it was right after
(`rememberParkyChange`, `lib/assistant/planner-context.ts`), one level per park and day for the
tab. `planner_undo` puts the day back with `restoreDay`, preferences and reservation included, and
drops a day that did not exist, but only while the day is still what Parky left: once the visitor
has changed it (a move, an add, a tick) the undo leaves it alone and shows „Tag seither geändert",
so their own edits are never undone. The optimise row keeps its own undo, so `planner_optimize`
leaves none here. An entry id that is not in the plan changes nothing, and a change that changes
nothing shows no chip and keeps the earlier undo. A show is added only at a time the planner's own
show picker would list (`showLinesFor` over the day's `/plan/day`).

Parky sees the plan through the `planner` field every question carries
(`assistantPlannerSnapshot`): every planned day (`isPlannedDay`) from today on in each park's own
date, nearest first; the day open in the planner and the nearest in full, at most 8, each with at
most 40 entries in plan order, the start the planner prints on the block (`formatGridTime`) and the
entry's own minute (past 1440 after midnight), a show's slug, a block's or show's length and the
tick; the day's preferences, and the active park and day. The other planned days, at most 60, go as
`more`, by park and date with their counts. With nothing planned the field is left out. The API
answers with the next turn, so Parky reads what its last action did from that plan.

### The trip planner

The trip planner keeps no state of its own; its state is the hub's query. The mounted planner
publishes it through a bridge (`tripPlannerBridge`, `lib/trip-regions/planner-bridge.ts`, one
effect in `use-plan-state.ts`, independent of the order of the planner's steps), and remembers the
last trip per region in this browser (`parkfan_trip_<slug>`, `lib/trip-regions/remembered-trip.ts`:
the query once it holds dates or a search, and the party Parky's interview asked about; a bare hub
visit never erases it; the hub does not reopen it by itself, Parky does on request). Every question
carries `trips` (`assistantTripsSnapshot`, `lib/assistant/trip-context.ts`): the trip on screen
with `onScreen`, then each region's remembered trip, at most 4, left out without any. The API plans
the trip on screen before the answer and lists it a line a day, which is where Parky's unasked hints
come from.

`trip_set` goes through the planner's own `update` with the query read as a link is read
(`readPlanQuery`), the path a press takes: written to the address bar, re-planned on screen. Where
the hub is not on screen the widget opens it with the query (`tripRegionPath`, `#planner`). Parky's
change is kept per region (`rememberTripChange`): the query before it and, once the planner has
written it back, the query after it in the planner's own spelling. `trip_undo` (Parky's tool, or the
receipt's button) puts the trip back only while it still says what Parky left (`sameTripQuery`,
parameter order aside); the visitor's own change since is never undone.

A hub link Parky writes is `/trip-regions/<slug>…` (the API does not know the segments); the site
redirects it, and the widget resolves it from the registry first (`regionHubPath`,
`lib/assistant/links.ts`), so a press lands on `/de/orlando` without the hop.

**Live regions.** The registry's `live` flag (`lib/trip-regions/registry.ts`) is the one switch a
region flips at go-live: it opens the hub's routes, and every question sends the same list as
`liveRegions` (`LIVE_TRIP_REGIONS`), so Parky plans, changes and links those regions only and says a
coming one opens later. The snapshot of trips takes live regions only, and the widget refuses a
`trip_set`, a `trip_undo` or an interview region for a region not live (`readAssistantAction`), so
nothing ever opens a hub that answers 404. The API's side is its `docs/frontend/assistant.md#live-regions`.

**The route.** In a region with bases (Japan, Paris) Parky's `change_trip` sets the stays
(`bases`), the city an airport serves (`startBase`, `endBase`), the hotel-change buffer and the
plan's stay suggestion; the widget applies the query like any other, and the receipt says
„Reiseplaner: Route geändert“ (kind `route`) or „Zeit für Hotelwechsel eingestellt“ (`buffer`).
A date search arrives as `when=…&days=…`, which the planner opens in its finder.

Reminders (`lib/assistant/alerts-context.ts`, `alert-writes.ts`) carry the ids the push endpoints
take: `alert_ride_set` the ride's UUID as `rideId`, a `kind` (`wait_below` with
`thresholdMinutes` 1 to 240, or `reopen`), `alert_show_set` the show's UUID and the performance
as an ISO instant with the park's offset, which `alertTarget` prints in the park's clock and
ignores once it is over. Only with push `ready` (a subscription and the
permission granted, `readPushState`) is the reminder written mid-answer, since then nothing can
prompt. Otherwise, and after a failed write, the answer carries `AssistantAlertAsk`: what would be
set and a button, whose press is the visitor's gesture and runs the same write, prompt included; a
failure reads in the bells' own sentences (`usePushErrorMessage`, the 429 wait among them). A set
counts as `ride_alert_set` or `show_follow_add` with source `assistant`, which also rings Parky's
bell. `alert_remove` names exactly one slug and goes by the mirror's names, today's `/plan/day` as
the fallback for an entry stored without them. A removal that fails shows an error chip with the
bells' sentence for it (`removalOutcome`), the 429 wait among them.

The `alerts` field of every question is the mirror (`assistantAlertsSnapshot`): `push`, and the
ride alerts and show reminders whose names the mirror keeps, at most 100 each, a pinned performance
as the park's `HH:MM`. Left out where push is out of reach and nothing is set.

Favourites go through `lib/utils/favorites.ts`, so every star on the page follows. `favorite_set`
names the favourite's type `entity` (`type` is the action's) and an id the cookie keeps, a UUID; it sets the state asked for and never toggles blindly. An add plays
Parky's `love`, through the same `favorite_add` a star sends. The `favorites` field of every
question is the cookie's ids as stored, UUIDs only (all the API takes), at most 50 of each kind, left out when there are none
(`assistantFavoritesSnapshot`).

The rides the visitor ticked off as ridden (`lib/utils/ridden-rides.ts`, the „x von y gefahren“
counter) go along as `ridden`: the ids from this browser's store, UUIDs only, the newest
`RIDDEN_SNAPSHOT_MAX` (300, what the API takes), left out when none is marked
(`assistantRiddenSnapshot`). Parky's ride lists mark them, so "which headliners haven't I done
yet?" has an answer.

A trip Parky planned for Orlando (the API's `plan_vacation`) goes into the planner as
`planner_reserve_trip`: each day with its park, a hop day's two parks on one date, at most 16 (the
visits a plan places), each park checked like every other planner action and each park and day
once. Both reserve actions share one write (`reserve` in `useAssistantActions`), so every day it
files is undoable on its own and a day that already holds a plan stays as it is. The Orlando hub is
an ordinary `navigate`: `/orlando`, or `/orlando?from=…&to=…&parks=…#planner` with the plan in the
`/plan` route's own parameter names, which `safeAssistantHref` and `localizedPath` keep; "orlando"
is the same word in every locale.

`plannerUi.requestOptimize` is held until the day's `PlannerOptimizeActions` is on screen with its
data, which then presses its own button (`RunOnce`), fit assistant and undo included. On a phone
Parky's window closes after a page change or a planner action, so the result is visible.

The position is never read without a press: the share card calls the site's own geolocation
(`useGeolocation().refresh()`), so the same yes also brings the in-park markers and the compass on
the park's page. It goes to the API once, with the next question, and Parky keeps it nowhere.

## Reply chips

The API ends an answer the visitor is likely to answer with up to four replies the model wrote
(`suggest_replies`, sent as the `replies` action, checked again by `readReplies`: plain lines, each
once, no link or Markdown, at most 40 characters). `AssistantReplies` draws them under the newest
answer only, on the visitor's side of the chat, as the site's outline `Button` in the primary ink
(32 px at a desk, 44 px on a phone); they go once anything is sent. A press sends the text as the
visitor's message (`assistant_question` kind `chip`). They are a labelled group (`repliesLabel`),
read once by the chat's live region when they arrive; Tab reaches them after the answer, Enter or
Space sends.

## The interview

Parky can plan a trip or a park day with the visitor from simple to detailed: a short core (a
trip's region, dates and parks; a day's park, date and must-dos), a plan at once, then refinements
he offers as replies (party and heights, tickets, hotel, pace, the day planner; a day's heights,
shows and arrival). The order is a guide: what a visitor says early is taken at once. The API's
`docs/frontend/assistant.md#the-interview` holds the steps and the tool.

- **Ways in:** the trip planner's „Plane mit Parky deine perfekte Reise" (above the setup) and the
  day planner's „Plane mit Parky deinen perfekten Parktag" (on an empty day),
  `parky-trip-interview-button.tsx` and `parky-day-interview-button.tsx` on one
  `ParkyInterviewStart`, in separate files so each route ships only its own planner's two strings,
  drawn only where Parky shows for this visitor (`assistantGate`). The card lays itself out by its
  own width (`@container`, side by side from `@xl`, 36rem), not the window's: the day planner's
  panel is about 400 px wide on the widest screen, the trip planner's card wide on a tablet. A
  press sets the interview on its first step (`startInterview`) and opens the window
  (`openParky('interview')`), which sends „Plan meine Reise mit mir, Frage für Frage." as the
  visitor's message once its session is ready (`takeInterviewKickoff`, `assistant_question` kind
  `interview`). In the chat: asking for it, or the opener's `suggestInterview` and
  `suggestInterviewHere`.
- **The state** (`interviewStore`, `lib/assistant/interview.ts`, session storage beside the chat)
  goes with every question as `interview` and changes only by the API's `interview_state` action
  and the bar's button. Every answer is in the planners already, so leaving keeps everything.
- **The bar** (`AssistantInterviewBar`) over the messages: the interview's name, „Schritt 2 von 3:
  Reisedaten" with a dot per core step, then „Dein Plan steht. Feinschliff nach Wunsch"; „Beenden",
  or „Fertig" once the plan stands.

## Language

Parky answers in the language the visitor writes in when it is one of the site's six, else in the
page's. Asked for the site in another of them ("in English please", "auf Deutsch?"), he switches it
at once; a visitor who simply writes in one of them gets the answer in it and, once per chat, the
offer to switch, and a yes counts as asking. A name, a ride title or a single word is no reason to
offer. The rule is in the API's prompt (`# Language`, `docs/frontend/assistant.md` there).

The switch is the `switch_language` tool, which the API allows only to one of the six other than the
page's, once per answer and before any lookup, so a post or a name a tool brought in cannot ask for
it. The widget holds `switch_locale` until the answer is complete and stored (`useAssistantChat`),
since the new locale mounts the layout afresh and would cut off an answer still streaming. It then
goes where the page's own hreflang link for that language points (`hreflangPath`,
`lib/i18n/hreflang.ts`, which the header's switcher and the language banner read too), as a post's
slug differs per language, else to the same path with its localized segment respelled
(`localeSwitchPath`, `lib/assistant/switch-locale.ts`); anything that would not land on a park.fan
page in that language is dropped. next-intl's router replaces the page with `{ locale }`, which also
sets the locale cookie, and keeps the query. Before it, `reopenAfterSwitch` (`lib/assistant/open.ts`)
notes in session storage that the window was open; the launcher on the new page reads it once
(`takeReopen`, within 30 s) and opens the window with the chat as it was, counted as
`assistant_opened` with source `language`.

## Feedback

The window's second tab is a form: a message, an e-mail for those who want an answer, the page and
the open chat. Parky also passes feedback on from the chat: a bug, a wrong figure, a missing park or
ride, a wish, praise or criticism with substance goes to the same inbox through the API's
`submit_feedback`, as the visitor's own words, and the answer carries the chip „Ans Team
weitergegeben". The API stores only the visitor's messages as typed, never text the model wrote, at
most twice per chat, never the same words twice, within the form's limits per session and per
address. The admin's feedback list marks those „Von Parky aus dem Chat" with the kind Parky took them
for, and quotes them.

## Chips and times

Every wait an answer names ("30 Min.", "30 minutes" …) is drawn as the site's `LiveWaitPill`
(`splitWaits`, `lib/assistant/wait-chips.ts`), and the cards use it for their waits. Every time
is park time, as on the planner, the showtimes and the park pages: the API gives the model each
time on the clock of the park it is about, and the cards read the park's clock off the offset the
API writes on every card time (`parkClock`, `lib/assistant/cards.ts`), never the browser's. A park
card stored in the chat before the API wrote offsets carries `Z` times; `clock` in
`assistant-card.tsx` shows those in the browser's clock, as they were shown then. The chat
still sends the browser's time zone, for the visitor's own "now" and so Parky can say "park time"
when the two differ.

## Parky's face

Parky's code has two folders. What is drawn sits in `components/assistant/parky/`: `parky-logo.tsx`
composes the face, `drawing.ts` holds the palette and shapes, `props.tsx`, `dreams.tsx` and
`looks.tsx` the props, dreams and outfits, and the face's hooks are `use-gaze.ts`,
`use-idle-act.ts` and `use-search-along.ts`. What decides sits in `lib/assistant/parky/`, free of
React except for the `use-parky-*` hooks: `acts.ts` (every act, its length, the classes and their
pauses), `rides.ts`, `look.ts`, `boredom.ts`, `facts.ts`, `lines.ts`, `reactions.ts`,
`easter-eggs.ts` and `motion.ts`. The launcher, the window, the teaser and Parky's hops between
them (`parky-jump.ts`, `parky-dock.ts`, `entrance.ts`, the fling) stay with the chat in
`components/assistant/` and `lib/assistant/`.

`ParkyLogo` (`components/assistant/parky/parky-logo.tsx`) draws Parky as an SVG; its motion is CSS
in `app/parky.css` (`.parky-*`) and runs only without `prefers-reduced-motion`. The few motions
that are web animations (a ride's path, the seat's airtime, the dream train) go through
`animateParky` (`lib/assistant/parky/motion.ts`), which under reduced motion holds them at their
finished pose, as the stylesheet leaves its own parts; `parkyStill()` there is the one
reduced-motion check every Parky script asks. While the chat works
it shows a mood: `thinking` with thought bubbles, `looking` into a book, `talking`. With nothing to
do (the closed button, the open window between answers) it has a life of its own, paced by one
store for the whole page, `parkyBoredom` (`lib/assistant/parky/boredom.ts`). Activity is a pointer
move or press, a key, the mouse wheel or a touch.

Its life of its own comes in classes, each with its own pace (`CLASS_ACTS`, `CLASS_PAUSE_MS`):

| Class    | When                                      | What Parky does                                                                                                                                                                                                                                                                               |
| -------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| blink    | always, every 7–8 s (CSS, `parky-blink`)  | shuts and opens his eyes                                                                                                                                                                                                                                                                      |
| `fidget` | `awake` (< 60 s quiet), 7–10 s apart      | winks, looks around, tilts his head, wiggles                                                                                                                                                                                                                                                  |
| `showy`  | `awake`, about every 30 s (27–33 s)       | a ride (seven tickets of 36, about one in five); two tickets each for hops, spins, eye rolls, twirls, dances, sunglasses, lights, whistles, gum, reading, nodding off; one each for cotton candy, a churro, a balloon, the park map, a photo, a drink and airtime                             |
| `sleepy` | `bored` (60 s quiet), every 8–12 s        | yawns first, then naps, pulls on his nightcap, nods off                                                                                                                                                                                                                                       |
| asleep   | `asleep` (90 s quiet)                     | eyes shut, slow breathing under rising Zs, the hat stops; activity wakes him with a "!"                                                                                                                                                                                                       |
| dreams   | asleep, 15–25 s after the last one, 6.5 s | a cloud over his head (`ParkyDreamCloud`): a coaster car round a loop with him aboard, a little Parky cheering under confetti, a fairy-tale castle rising under a shooting star, fireworks over the castle, a log boat plunging into a splash, or a Ferris wheel at night with its cabins lit |
| doing    | whenever something happens                | moods (`thinking`, `looking`, `talking`), searching along, and the cues that answer the visitor                                                                                                                                                                                               |

Late in the visitor's evening, from 22:00 until 05:00 by the browser's clock, both quiet times are
halved (`LATE_SLEEPY_FACTOR` in `boredomThresholds`): bored at 30 s, asleep at 45 s.

The moments of a park day are props drawn over his face (`ParkyMoment` in
`components/assistant/parky/props.tsx`): cotton candy at his right cheek with a bite gone at each
chomp; a churro, two bites, a happy squint and a heart, because it is his favourite; a balloon that
bobs, slips away and floats off while he watches it go; a three-panel park map unfolding with a dot
pulsing where he is; a camera over his right eye, the left one shut, a click and a flash; a drink
through a straw, the level dropping and bubbles rising. Airtime, his signature move, floats him up
off the ground for joy, the hat a little higher still. `grumpy` (arms crossed, brows down, a frown,
steam off the top of his head) is an act like the others but holds no ticket: it is meant for long
queues on the page. The drawing's shared colours and shapes are in `components/assistant/parky/drawing.ts`, the dreams
in `dreams.tsx`.

A showy act takes the place of the fidget that would come after it is due. That is the button in
the corner. In the open window and in the homepage hero Parky is `calm`: awake he only blinks and
follows the pointer, bored he gets sleepy, falls asleep and dreams, and what he does for the
visitor plays as everywhere. The dream's cloud is drawn half again as large as its puffs
(`DREAM_CLOUD_SCALE`), its scene stays inside it (`clipPath`), and the train runs its track as a
web animation measured off the path.

A change of stage never cuts an act short: an act still on stage when Parky gets bored, falls
asleep or wakes up plays to its end, with the dizziness after a ride, and only then does the new
stage begin. A cue (an easter egg, Parky's answer to something the visitor did) still plays at
once, and without a life of its own (a mood, a search, the window closed) Parky stops at once.

The hat, the rides and the dizzy stars reach beyond the drawing's 48-unit box, which only works
while the `<svg>` element itself is not animated: Safari clips an animated SVG that has a filter,
or sits under one, to its own box. So the button's bob moves a wrapper around the drawing, and the
drop shadow stays on the `<svg>`.

Parky's hat is a Ferris wheel with eight coloured cabins, set into its head: the lowest cabin goes
behind the head, and the A-frame's right leg runs down the head's slope, so the wheel stands in it
rather than on top. The cabins are circles, so they need no counter-turn to hang straight while the
wheel spins, and a light edge under the rim keeps the wheel legible over any page. It rises about
7.5 of the drawing's 48 units above the face.

Button, bubble and window share one layer above everything else on the page, `PARKY_LAYER`
(`z-[10000]`, `components/assistant/parky-layer.ts`), over the header, the planner and the
navigation bar's `z-[9999]`. So that Parky and his hat, which rise over the window's top edge, keep
clear of the 48 px header rather than cover it, the window starts 88 px from the top on a phone and
caps its height at the screen minus 10rem on a desktop. While a modal dialog has the page
(`usePageLocked`: the planner's wizard, the whole planner on a phone, an alert), the button ducks
below the screen's edge and is `inert`, so it never sits on the dialog's buttons, and comes back up
once the dialog closes. It moves by `translate`, which an entrance's `transform` fill leaves alone.
The search palette is the exception: there Parky stays and searches along.

An easter egg can ask for a ride from outside: `ParkyLogo`'s `cue` plays it at once, a named one
or `ride` for any of six, and now and then Parky takes one by itself as one act among the rest.
Parky sits in a red car, a log boat or a teacup (`ParkyVehicle`, with the rails drawn by
`ParkyRideTrack`):

- **Loop** (`coaster`): it turns about the centre of a loop (`LOOP`), so the car's wheels run
  round the rails drawn around it, upside down at the top. The stylesheet turns it.
- **Launch**: shot to the left, up a spike until the speed runs out, a hang at the top, back down
  backwards through the station and a few swings to rest.
- **Hills**: over two camel-backs to the left and out of sight, back in from the right as if the
  circuit ran on behind the page, braking into the station.
- **Tower**: pulled up a mast with his eyes screwed shut (he is afraid of heights), a shiver at
  the top, eyes wide for the drop, the brakes; the hat lifts off the head as it falls and lands
  again.
- **Flume**: a log boat slowly up a lift hill to the left, a float over the crest, the plunge, a
  splash where it hits the water (the ride's `splash`); it drifts out of sight and floats back in
  from the right, and Parky shakes the water off like a wet dog.
- **Teacups**: a pink teacup twice round a turntable to the left of the station, swaying and a
  little smaller at the back.

Airtime runs through the rides as a stop's `lift`: over the hills' crests, in the tower's free fall
and over the flume's crest Parky floats up off his seat while the vehicle sinks back by as much and
stays on the rail.

The rides beyond the loop are worked out in `lib/assistant/parky/rides.ts`: one geometry gives both the rails
drawn and the stops the car passes, played with the Web Animations API and turned about the wheels'
resting point, so the two cannot drift apart. On the hills the car is slower near the top and
faster low down. Eyes go wide and the mouth opens on every ride, and off every ride but the flume
Parky is dizzy (`FOLLOW_UP`): the pupils swirl round their eyes, one each way, the body reels, the mouth
goes wavy and three stars circle its head.

A random ride (`ride`, by itself or from a cue) is only one that fits on screen where Parky is at
that moment (`rideFits`). Every ride heads up or to the left, away from the button's corner, but in
the open window Parky sits in the top left corner, where the launch climbs about 72 units and the
free fall about 112 units above the drawing, 120 and 187 px at the window's size. The same module
works out each ride's reach from its geometry: Parky in the car as points round its outline, placed
at every stop, and the rails. Only the left and top edges count; to the right the loop reaches a
little past the drawing, and the hills come back from off the page on purpose. With no ride that
fits, the turn passes. On a phone Parky keeps 8 px from the window's edge so the loop still fits; a
laptop window needs about 740 px of height for the launch and about 870 px for the free fall. A ride
asked for by name, as on Parky's page, plays anywhere.

While a search is open anywhere on the page (the palette from the header or `/`, the hero's field,
the homepage's step card, a listing's, the glossary's, the compare picker), Parky searches along: a
magnifying glass swings up to its right eye, the eye looks big behind it, the pupils scan the
page while the body peers to one side and the other, the mouth is pulled to one side with the
tip of the tongue out, and at each keystroke it leans the glass in. Idle acts pause meanwhile; when
the search closes the glass swings away. The signal is `searchPresence`
(`lib/analytics/search-presence.ts`): every `useSearchSession` reports its openings and closings
there, and only a session still on the page counts, so a field that leaves the page open leaves
no search behind. `/search` stays out (`presence: false`): each load there is an opening that
never closes. The glass's size holds under reduced motion; its motion does not.

A hard scroll throws Parky, an easter egg (`useScrollFling`, decided by `FlingTracker` in
`lib/assistant/fling-tracker.ts`). Thrown down, the page carries him to the top of the screen, where
he stares at the drop with his mouth open and trembles over streaming fall lines (`scared`,
`.parky-drop`); thrown up, it presses him flat into his corner (`squashed`). He holds on while the
page still moves faster than 0.5 px/ms and lets go once it has all but stopped for 250 ms, dropping
back with a bounce into the dizzy act, or springing up past his height.

A throw is distance, not a peak: the page has to travel a few viewport heights one way, moved by
hand in the last second, and how far depends on the hand. Read once a frame, the speed jitters (a
reading that catches two frames of movement in one frame's time doubles it), and ordinary swipes
reach one fast frame. The hand is told apart by its events, not by the device, so a laptop with a
touch screen or a tablet with a trackpad gets the right one. A press on the page's own scrollbar
lands on `<html>` and nothing reports the drag after it, so the scrollbar counts as the hand from
that press until the button is let go, and a press anywhere else ends it:

| Hand            | Throw                  | Why                                                                                                 |
| --------------- | ---------------------- | --------------------------------------------------------------------------------------------------- |
| finger          | 3 screens in 600 ms    | a flick carries the page on its momentum: a brisk swipe covers two screens, only a hard flick three |
| wheel, trackpad | 1.25 screens in 500 ms | a mouse wheel moves in steps without momentum: a few notches at a time cover less than a screen     |
| scrollbar       | 1 screen in 500 ms     | the thumb covers the most page per move of the hand: a quick pull, never a slow one to read along   |
| key             | 3 screens in 600 ms    | one press of the space bar or Page Down is less than a screen; a held key goes far                  |

More than a screen between two readings is a jump, as when a link opens a new page at its top,
except while the scrollbar is pulled, whose thumb covers that much of a long page in a frame; a page
scrolled by a link or a script never throws him. Once he has let go he can be thrown again at once,
either way, so a hard scroll down, a moment's stop and a hard scroll back up play both, again and
again; the third throw inside 30 s gets the `rough` line, and he says at most one line about it
every 20 s. Without the stop the first throw holds: a hanging Parky is not squashed. He trembles by
a wrapper around the drawing (`.parky-shake`), which the compositor moves: an SVG transform is
painted, and with the drop shadow and the glow's blur he would be painted again in every frame of
the scroll.

Replayed on a production build on 3 November 2026 (`/de/blog/europa-park-wartezeiten-tipps`, the old
rule and the new on the same recording of the scroll position): on a Pixel 7, with the finger led
along a phone's momentum curve, a flick at 5 px/ms threw him before and does not now, one at 8 px/ms
still does; on a 1280×800 desktop each of three presses of the space bar threw him before and none
does now, a wheel at 15 notches a second or in bursts of five to eight does not and one at 20 does.
With a visible scrollbar on the same page (44,252 px high), a pull of the thumb covering a screen
and a half in its fastest half second throws him, and pulled down, up, down and up with 0.6 s stops
it throws him four times; a slow pull to read along does not. Hanging for 3 s on a Pixel 7 at 4× CPU
throttling, the tremble on the drawing cost about 350 paints, 200 ms of paint and 175 layouts; on
the wrapper it is about 50 paints, 35 ms and 24 layouts, the steps of the hat's wheel.

The store keeps one timer for the next stage, so a moving pointer costs a timestamp. Each act's
length is written once, in `ACT_MS`; the stylesheet reads it as `--parky-act`. Under reduced
motion the store answers `null` and Parky only shows its moods.

### Outfits

Parky dresses for the time of year and, on a park's page, for the weather there
(`lib/assistant/parky/look.ts`, drawn in `components/assistant/parky/looks.tsx`). Every Parky on
the page reads the same look from `useParkyLook` (`lib/assistant/parky/use-parky-look.ts`); the server
answers none, so the prerendered page and the first paint agree.

| Season (`seasonOn`, browser calendar)  | Hat in the wheel's place                      |
| -------------------------------------- | --------------------------------------------- |
| `halloween`, 1–31 October              | a jack-o'-lantern                             |
| `christmas`, 1–26 December             | a little tree with baubles and a star on top  |
| `newyear`, 31 December and 1 January   | a party hat with gold dots and a pompom       |
| `winter`, 2 January to end of February | a red woolly hat with a white pompom, a scarf |

The weather comes from the park's nowcast, which the page has already loaded: `useParkyWeather`
reads it from React Query's cache with a disabled query, so it costs no request. `weatherLook`
takes the most striking state: `storm` (WMO 95–99), `snow`, `rain` (drizzle included), `windy`
(gusts from 50 km/h or wind from 35), `fog`, `hot` (from 28 °C), `cold` (below 5 °C). Rain and a
storm put an umbrella in his right hand, beyond the wheel, with drops bouncing off it; a storm adds
a cloud with a flashing bolt; snow falls as flakes; the cold and snow bring the scarf; wind blows
gusts past him; fog drifts in front of his lower half, below the mouth; heat brings the sun and a
drop of sweat. The pieces sit on their own anchors (hat, middle, right hand, around him), so a
season and a weather combine and none reaches the eyes or the tree's star.

The face works as without an outfit. Where an act and an outfit compete, one table decides
(`SETS_ASIDE`, read by `outfitFor`): the nightcap and the lit wheel send the season's hat away for
their length; a ride and the dizziness after it fold the umbrella, and so does anything in his
hands (reading, the clipboard, the book of a lookup, the magnifying glass, the snow globe, the
snowman, the fan, the clapping). A new act that uses his hands gets a row there.

While a context holds, `showyPool` adds tickets to the showy pool and never takes one away: at
Halloween a little ghost rises behind him (`ghost`), at Christmas he shakes a snow globe
(`snowglobe`), at New Year fireworks go off over his head (`fireworks`), in winter or in snow he
builds a snowman beside him (`snowman`: three snowballs, coal eyes and buttons, the carrot nose
last, a tiny Ferris wheel for a hat, then it melts), in rain he twirls the umbrella (`brolly`), in
the cold he shivers with chattering teeth (`shiver`), in heat he fans himself (`fan`) and the
sunglasses get two more tickets. While one of the page's park's shows is on (from its start for
`SHOW_RUN_MIN`, 30 minutes, since the API sends no end; `showRunning`, set by `useParkyLive` through
`setParkyShow` and checked again with every poll), `applause` gets two tickets. A scene that reaches beyond him (the snowman to the left, the
fireworks above) only plays where it fits on screen (`sceneFits`), as a ride does. Without motion
every piece stands still and each scene shows finished.

`?parky=` tries a look anywhere: a season, a weather or both (`?parky=christmas,rain`).

## In the homepage hero

On the homepage from a 1024 px window Parky stands in the hero, bigger, beside a speech bubble that
opens the window; his corner is empty while he is there, and he hops between the two as the hero
scrolls away and back (`parkyDock`, `parkyDockHop`). He is calm there and makes no entrance. The
whole of it is in [homepage hero → Parky in the hero](homepage-hero.md#parky-in-the-hero-desktop).

## How Parky arrives

Each time a page loads, the button makes an entrance (`pageEntrance`, `lib/assistant/entrance.ts`),
drawn from five, or the one `?parky=<entrance>` asks for: it scurries in from the right with speed lines and
spins in the air, drops from above and lands in a puff of dust, rolls in and wobbles dizzily,
peeks in from the edge at a tilt before hopping in, or pops up out of nothing in a burst of
sparkles. After a client navigation (the button stays), a closed window or under reduced motion
it only fades in. Only the session's first line is an entrance's own; later loads arrive without
one, and only when the visitor's own plans have no line for it.
`ENTRANCE_MS` holds each length, which the stylesheet reads as `--parky-enter`; the launcher waits
that long before Parky has landed and speaks, by a timer, because `animationend` never reached
React's handler on the home page.

## What Parky says

Every chat opens with one of five greetings (`greeting1`–`greeting5`) and three questions to tap,
drawn from eight on any page (`SUGGESTION_KEYS.site`) and seven about "here" on a park's page
(`SUGGESTION_KEYS.park`), each one Parky can look up. Both sets are drawn at once
(`lib/assistant/opener.ts`) and kept in `sessionStorage`, so a reload or a closed and reopened
window shows the chat as it was; "new chat" draws again, never with the same greeting twice in a
row.

Where this browser holds the visitor's plans, the chat opens with them instead (`yours.ts` below):
a planned day today (`greetingToday`), yesterday (`greetingAfter`), in the next 14 days
(`greetingSoon`, „Hey, am Donnerstag ist Parktag: Efteling 🎡 Deinen Plan hab ich dabei.“), three
or more within 30 days (`greetingTrip`), or, on a later visit within 30 days, the park the last
chat was about (`greetingBack`). Its own questions come first (`YOURS_CHIPS`, `suggestMy*`, whole
questions about „mein Parktag“, so they read right without the greeting) and the drawn ones fill
up to three. The greeting the window shows goes with the chat's first question as `opener`, so
Parky reads „ja“ or „super!“ as the answer to it.

Under Parky's name the window shows a status line (`AssistantSubtitle`): the next planned day
(`subtitleNext`, „Als Nächstes: Efteling, Do., 19. Nov.“), else who he is („Dein Park-Buddy“).
How he talks about himself everywhere is [Buddy, not assistant](parky-character.md#buddy-not-assistant).

`AssistantTeaser` draws a speech bubble beside the closed button, its tail on Parky's mouth: the
bubble's right edge and bottom are reckoned from the button's size (56 px, 64 px from `sm`) and
its corner offset. These lines go in it, from the `assistant` namespace:

- **The visit's one line**: 8 s after the button shows (`TEASER_SCHEDULE_MS`), one line a
  session that nobody asked for. The bubble covers part of the page, so once is enough: a bored or
  woken line, the weather's and the live waits' spend the same one (`countReaction`). Which line
  fills the slot is one list,
  `lineSources` in `lib/assistant/parky/lines.ts`, best first; the first source with a line for
  the page speaks, so a park whose statistics are too thin for a fact falls through to the next:

  | Source       | When                                                                  | Lines                                                                                                           |
  | ------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
  | `yours`      | first slot, the visitor's own plans in this browser (`?parky=yours`)  | `yoursToday`, `yoursAfter`, `yoursTomorrow`, `yoursSoon`, `yoursTrip`, `yoursRidden`, `yoursBack`, `yoursAlert` |
  | `entrance`   | first slot, after an entrance, a beat after landing                   | `entranceScurry`, `entranceDrop`, `entranceRoll`, `entrancePeek`, `entrancePop`                                 |
  | `live`       | a park's page, once a park a session, level with the weather          | `liveWalkOn1`–`3`, `liveQueue1`–`3`, `liveFull1`–`3`, `liveClosed1`–`3`, `liveShow1`–`3`                        |
  | `clock`      | a park's page, once a park a session, in the clock's windows          | `clockRopeDrop1`–`3`, `clockClosing1`–`3`                                                                       |
  | `holiday`    | first slot, on one of Parky's holidays                                | `holidayHalloween`, `holidayChristmas`, `holidayNewYear`                                                        |
  | `fact`       | last slot, on a park's page or the homepage (`?parky=fact`: any slot) | `factLongest1`–`3`, `factGap1`–`2`, `factQuietest1`–`3`, `factBusiest1`–`3`, `factAverage1`–`3`                 |
  | `park`       | a park's page, on `PARK_EGG_CHANCE` (40 %) or `?parky=egg`            | `parkLine1`–`6`, `parkQueue1`–`3`, `parkRopeDrop1`–`2`, `parkClosing1`–`2`, `parkFood1`–`2`                     |
  | `invitation` | always                                                                | `teaser1`–`teaser13`                                                                                            |

  `yours` reads what the browser keeps (`yoursMoments`, `lib/assistant/parky/yours.ts`), best
  first: a planned day today, yesterday, tomorrow, in 2 to 14 days, three or more planned days
  within 30 days, a count of rides ticked off that stands on 10, 25, 50 or 100, the last chat's park
  on a later visit within 30 days (`lib/assistant/last-park.ts`, `parkfan_parky_last_park` in local
  storage), a ride alert. Each planned day is measured against its park's own today. German lines
  name the park without an article, as the planner keeps none.

  A new kind of scheduled line goes into that list at its rank. One that falls due over another
  line, while Parky sleeps or while a search is open tries again 5 s later. `?parky=live`,
  `?parky=clock` and `?parky=fact` put their source first in whichever slot comes, past its
  once-a-session rule; `?parky=show` does the same for `live` and says the show line whenever the
  park has a show still to start today, however far off. Forced, `live` counts any open queue as long and `clock` drops its windows,
  so an open park shows the line and it may overstate the moment; a park before opening has no live
  line even then. Two rules settle a tie: `live` comes before
  `clock` (what the queues say now is the more useful news, and the clock takes the next slot),
  and `live` is level with the weather's line: a park gets one line a session about how it is
  right now (`parkNewsKey`, `news:<park path>` in `countAnswer`), from whichever comes first.

- **Live waits** (`lib/assistant/parky/live.ts`, `useParkyLive`): read from the live poll the
  park's page runs anyway (`parkLiveQueryKey`, React Query's cache, no request of its own). The
  headliners are the park's favourite in `PARK_FAVOURITES` and the first five top attractions of
  the `/stats` the page has loaded (`headlinersOf`). The slot's line is the first of these that
  holds (`liveMoment`, limits in `LIVE_LIMITS`):

  | The page says                                       | Act                    | Lines             |
  | --------------------------------------------------- | ---------------------- | ----------------- |
  | shut today (closed, no hours for today on the page) | `doze` or `read`       | `liveClosed1`–`3` |
  | a headliner open at 10 minutes or less              | `airtime`              | `liveWalkOn1`–`3` |
  | the park's crowd level is very high or extreme      | `squashed` mood, 2.4 s | `liveFull1`–`3`   |
  | the longest open queue is over 60 minutes           | `grumpy`               | `liveQueue1`–`3`  |
  | a show starts in 15 to 30 minutes                   | `applause`             | `liveShow1`–`3`   |

  The show times are today's showtimes in the live poll's `shows` (ISO instants with the park's
  offset, kept across the polls that leave the block out), a show reading `CLOSED` left out;
  `SHOW_SOON_MIN` holds the window. `liveShow3` points at the bell on the show for a reminder.
  Clapping, Parky stands in a spotlight cone between the edges of a red curtain, with a few
  sparkles (`ParkySpotlight`).

  While the page stays open, each poll is compared with the last (`liveChange`). A headliner that
  goes down gets a `startle` and `liveDown1`–`3`, which point at the bell on the ride for its
  reopen alert; a headliner's queue that drops by 20 minutes or more, to half or less, gets a
  `hop` and `liveDrop1`–`3` ("Psst, Taron is down to 20 minutes."). Each of the two has its line
  once a session, against `REACTIONS_PER_SESSION`, never over another line. A moment that newly
  holds (a walk-on, a queue over an hour, a full park) plays its act without a line. An act without
  its line plays at most every `LIVE_ACT_GAP_MS` (4 minutes). Without known headliners every ride
  counts.

- **The park's clock** (`lib/assistant/parky/clock.ts`): the park's hours are the page's
  `AmusementPark` structured data (`openingHoursSpecification`, in park time), its zone that of the
  live data. In the hour before today's opening Parky stretches or hops for rope drop
  (`clockRopeDrop1`–`3`); in the last half hour before closing, also for a day that runs past
  midnight, he lets off the `fireworks` (`clockClosing1`–`3`); `CLOCK_WINDOWS_MIN` holds both.
  While the clock has its line for a park, the park line leaves out `parkRopeDrop1`–`2` and
  `parkClosing1`–`2` (`CLOCK_PARK_KEYS`).

- **Facts** (`parkyFacts`, `lib/assistant/parky/facts.ts`): every sentence a park's two-year
  aggregate supports (`deriveParkStatsFindings`): the longest queue and its typical wait, how much
  longer it is than the park's typical queue (from 10 minutes), the quietest weekdays, the busiest
  months, the typical wait. Waits on the five-minute grid and never under five, days and months
  named as the park header names them. On a park's page the facts are about that park, from the
  `/stats` it has loaded anyway; on the homepage about one of `PARK_FAVOURITES` at random, one
  CDN-cached `/stats` request when the slot falls due. The fact list is open for hand-written facts
  from the API, merged in as further `{ key, values }`. Parky reads (`read`) after a fact.
- **Reactions**, read from the same `parkyBoredom`: a bored line (`teaserBored1`–`4`) after the
  first yawn, a woken line (`teaserWoke1`–`3`) once somebody wakes Parky, while the visit's one
  unasked line is still unspent (`REACTIONS_PER_SESSION`, 1).
- **Easter eggs** (`lib/assistant/parky/easter-eggs.ts`): on Halloween, at Christmas and at New Year
  the first invitation is the day's own line (`holidayHalloween`, `holidayChristmas`,
  `holidayNewYear`, by the browser's calendar). On a park's own page, when its slot draws it, Parky
  says one of the park lines (with `{park}` and `{ride}`) and then plays the act it goes with: a
  ride after `parkLine1`–`6`, a whistle in the queue, a stretch before rope drop, a yawn at
  closing time, heart eyes for the churros (`PARK_LINES` in `assistant-teaser.tsx`). The ride is
  the park's favourite in `PARK_FAVOURITES` (16 parks, keyed by geo path), else from its own data:
  the name from the page's `AmusementPark` structured data, the ride the coaster with the longest
  waits in the `/stats` the page loads anyway (through its React Query cache, so no request of its
  own), else its top attraction (`topCoaster`). The Konami code typed anywhere buys a free ride
  with its own line (`secretKonami`).
- **The park's weather** (`useParkyWeather`): on a park's page with a weather look, once per park
  per session (`parkNewsKey`, shared with the live line) and 12 s after the page settles, never over
  another line, Parky plays the weather's act (`WEATHER_ACT`) and says a `weather` line
  (`weatherRain1`–`3`, `weatherStorm1`–`2`, `weatherSnow1`–`3`, `weatherCold1`–`3`,
  `weatherWindy1`–`2`, `weatherFog1`–`2`, `weatherHot1`–`3`, with `{park}` and `{temp}` in the
  visitor's unit). It spends the visit's one unasked line and stays away once lines are muted.
  With a fine pointer, the pointer resting on Parky's nose (between and just under the eyes) makes
  it squint at it, both pupils turned in; circling it fast, two turns inside 1.5 s, makes it dizzy
  (`useGaze`, `components/assistant/parky/use-gaze.ts`, the `dizzy` act through its own cue).
- **Answers** (`lib/assistant/parky/reactions.ts`): Parky answers what the visitor does, heard through
  `onSiteEvent`, which every `trackSiteEvent` call reaches whether or not the page counts, so no
  component is wired twice. Each answer is an act every time and a line once a session per kind
  (`answeredWithLine`, `countAnswer`):

  | The visitor                               | Act                                                  | Lines              |
  | ----------------------------------------- | ---------------------------------------------------- | ------------------ |
  | opens the trip planner (`planner_opened`) | `plan`: ticks off a checklist on a clipboard         | `plannerOpen1`–`4` |
  | finishes the wizard, or re-plans the day  | `cheer`: happy squint, a grin, confetti, two hops    | `planReady1`–`3`   |
  | adds a favourite                          | `love`: heart eyes, hearts floating up               | `favourite1`–`4`   |
  | sets a wait time alert, or follows a show | `bell`: a bell rings over its head                   | `alert1`–`3`       |
  | switches to dark                          | `nightcap`: a nightcap in place of the wheel, a yawn | `themeDark1`–`3`   |
  | switches to light                         | `shades`: sunglasses slide down from the hat         | `themeLight1`–`3`  |
  | installs the app (`pwa_installed`)        | `cheer`                                              | `install1`–`2`     |

  The act plays at once, the line 600 ms later, by when a dialog the action opened has locked the
  page. A search found nothing gets no line, only a question mark over the searching Parky.

Every line stays 7 s, or until a search or a modal dialog opens (`usePageLocked`, Radix's
`data-scroll-locked` on `<body>`): the bubble would cover the palette's list, the field's results
or the dialog's buttons (on a phone, the planner wizard's Back and Next). An answer that falls due then
waits and is said once they close, unless that takes longer than 15 s. Opening Parky ends the invitations and reactions for the session
(`stopTeasers`, `lib/assistant/teaser-store.ts`); closing a line by its ✕ („Sprechblasen
ausblenden“) ends every line, easter eggs included (`muteLines`).

The bubble also keeps out of the visitor's way (`lib/assistant/parky/bubble-room.ts`). While a
planner is at work, the day planner's panel open (`data-planner-open`) or the trip planner on
screen (`data-trip-planner`), the visit's line waits and an answer to what the visitor did plays
its act without its line. And it never stands over a control: each line is first laid out in an
unseen twin of the bubble, and if any of nine points across it, 8 px around included, lies over a
button, a tab, a field or a link styled as a button (`coversControl`), the line is not said; the
scheduled one tries again 5 s later.

## Parky's page

`/[locale]/parky` (`app/[locale]/parky/`) is a hub that shows what Parky does. Each of its three
chapters pairs a screenshot of the real widget on a phone with a few questions somebody could ask:
the wait times chat, a planned day, and Parky searching along. A stage plays five of Parky's acts
on a loop while they are on screen, and a sixth tile keeps the rest a secret; below it a picker
dresses every Parky on the page in a season and a weather (`ParkyLookPicker`, through
`previewParkyLook`), with a Parky that plays the acts the look brings. After that come what
happens to the questions, a FAQ and the next steps. The texts are in the `parkyPage` namespace,
read on the server only.

The page invites the visitor (`assistantGate.invite()`): for the rest of the session Parky shows
whatever the rollout share says, as long as the admin's switch is on. Its button opens the window
through `openParky()` (`lib/assistant/open.ts`), which the launcher hears and counts as
`assistant_opened` with source `page`. While the gate is undecided the button waits, and once it
says off, a line says Parky is resting instead (`assistantGate.getStatus()`).

The screenshots (`public/media/parky/<locale>/{chat,plan,search}.webp`) come from
`scripts/capture-parky-shots.mjs`. The script lays two fixture chats into the browser's session,
passes the challenge with a stand-in session and photographs the window on an iPhone 17 (`scripts/lib/phone-device.mjs`) in
the dark theme. Run it again after the widget changes visibly.

## Tracking

Our own statistic (`trackSiteEvent`, labels in `lib/admin/site-analytics.ts`): `assistant_shown`
(the button on screen, once per page view, with the entrance it made or `none`),
`assistant_opened` (with `source`: the button, a line, Parky's page, `language` after his
language switch, or `interview` from a planner's button), `assistant_line_shown`,
`assistant_line_clicked` and `assistant_line_closed` (each with the line's kind as `line`: invitation,
entrance, bored, woke, holiday, park, fact, secret, weather, live, clock, or the answer's planner, plan, favourite, alert, theme
or install), `assistant_closed` (questions while open), `assistant_question` (suggestion, typed, a reply chip
or the interview button, never the text; `first` for a chat's first, `position` for a chip, 1 the
model's likeliest), `assistant_greeting` (once per chat, the greeting's kind: today, yesterday,
tomorrow, soon, trip, back or plain), `assistant_replies_shown` (how many chips, and after what:
`interview`, `plan_change` or `answer`), `assistant_interview_started` (trip or day, from the
planner or the chat, its `region`, `none` for a park day or a region not settled yet),
`assistant_interview_step` (each step with `outcome` answered or skipped, and the region),
`assistant_interview_ended` (done or left, the steps answered, `plan` whether the core stood, the
region; the helpers are `interviewRegion`, `interviewPlanStood`, `interviewEnded`),
`assistant_plan_changed` (trip or day, one event per kind of change, the route and the buffer among
them, never its content), `assistant_change_undone` (undone, or changed since; `via` the receipt's
button or the chat), `assistant_answer` (result and number of lookups), `assistant_rated`,
`assistant_feedback_sent` (whether with an e-mail, never the e-mail) and
`assistant_challenge_failed`. Planner writes count as `plan_item_added` with source `assistant`,
the planner opening as `planner_opened` with source `assistant`.

## Checks

`pnpm test:assistant` covers the stream reader, the link checks, the rollout decision, the post
text and its sections for a question, the action checks (a link carried out as the path it was checked as, the planner's modes, zones
and block lengths, only the six locales and nothing riding along with a switch), where a switch
leads (the page's hreflang alternate, a respelled segment, never off the site or into a third
language) and the reopen after it, the boredom stages on a fake clock and sooner late in the evening, the opener's draw, and the
easter eggs:
a page's park path and park page, the facts a park's findings support, which source fills a slot and how its ties fall, the live waits' moments and changes and the rate of their acts, the park's clock across zones and midnight, the coaster picked from a ranking, the park's name from structured
data, the holidays, the Konami code and muting, and which scrolls throw Parky: a reading swipe, one
late frame, a briskly turned wheel or one turned bit by bit, the scrollbar pulled slowly, the space
bar, a jump and a scripted scroll do not; a hard flick, a wheel rolled hard, the scrollbar pulled
quickly and a held key do, the same distance by wheel and not by finger, and once he has let go the
same throw again or the other way throws him at once.

`pnpm test:parky-look` covers the outfits: the seasons at their edges, the weather states and
their order, what each kind of act puts aside, the showy pool only growing, where a scene fits,
and the `?parky=` look switch.

`pnpm test:assistant-context` covers what the browser tells Parky and lets him change: the plan
snapshot (from today on, nearest first, the caps, the printed starts and own minutes, the day open
in the planner always in full, the other days by park and date, nothing when empty), the trip
planner's bridge and remembered trip (a bare hub never erases it, a bad record costs itself), the
trips snapshot, Parky's trip undo (and that it leaves a trip the visitor changed since), the new
action checks (a trip change, replies, a move to a time, a filed trip's height, the interview's
state), the interview store and the button's first question, the hub link resolved, the
reorder, Parky's undo (and that it leaves a day the visitor changed since), and the checks of every planner edit (ids that are no ids dropped, an
optional field that fails left out, nothing riding along) and of a reserved trip (each park
checked, each park and day once, at most 16, filed in one write), the reminders' snapshot, the slugs they
resolve to, their action checks and what a failed removal shows, the favourites' snapshot and checks, and Parky's break:
its action check, the refusal code and length, and the end kept across a reload.
