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

The browser sends one question at a time with the chat's id. The history stays on the API, so
nobody can hand Parky made-up earlier answers.

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

## Answers are model output

`AssistantMessageText` renders them with `react-markdown`, without raw HTML and with only `p`,
`strong`, `em`, lists, `br` and `a`. A link stays a link only when `safeAssistantHref` accepts it
(a park.fan page, given the reader's locale) or it is Google Maps directions to coordinates
(`directionsHref`, new tab). Anything else, `javascript:` and `/\host` included, is shown as text.
The admin shows chats as plain text.

## Actions, cards and the position

The API sends an `action` event when Parky acts; `readAssistantAction` (`lib/assistant/actions.ts`)
checks it again and `useAssistantActions` carries it out through the site's own paths:

| Action              | What the widget does                                                       | Chip        |
| ------------------- | -------------------------------------------------------------------------- | ----------- |
| `card`              | draws a park or ride card with `ParkStatusBadge` and `CrowdLevelBadge`     |             |
| `navigate`          | `router.push` to the park.fan path in the reader's locale                  | Seite       |
| `planner_open_day`  | `openDay` in the planner store, `plannerUi.requestOpen('assistant')`       | Tagesplaner |
| `planner_add_rides` | `addRide(…, 'assistant')` per ride, then opens the day                     | Tagesplaner |
| `planner_add_block` | `addCustom(…, 'assistant')`, then opens the day                            | Tagesplaner |
| `planner_optimize`  | opens the day and `plannerUi.requestOptimize`: the day's optimise row runs | sortiert    |
| `request_location`  | shows the share card under the answer                                      |             |

`plannerUi.requestOptimize` is held until the day's `PlannerOptimizeActions` is on screen with its
data, which then presses its own button (`RunOnce`), fit assistant and undo included. On a phone
Parky's window closes after a page change or a planner action, so the result is visible.

The position is never read without a press: the share card calls the site's own geolocation
(`useGeolocation().refresh()`), so the same yes also brings the in-park markers and the compass on
the park's page. It goes to the API once, with the next question, and Parky keeps it nowhere.

## Chips and times

Every wait an answer names ("30 Min.", "30 minutes" …) is drawn as the site's `LiveWaitPill`
(`splitWaits`, `lib/assistant/wait-chips.ts`), and the cards use it for their waits. The chat
sends the browser's time zone, so every time the API hands the model is already in the reader's
clock; the cards format their instants with the browser's own clock too.

## Parky's face

`ParkyLogo` (`components/assistant/parky-logo.tsx`) draws Parky as an SVG; all its motion is CSS in
`app/globals.css` (`.parky-*`) and runs only without `prefers-reduced-motion`. While the chat works
it shows a mood: `thinking` with thought bubbles, `looking` into a book, `talking`. With nothing to
do (the closed button, the open window between answers) it has a life of its own, paced by one
store for the whole page, `parkyBoredom` (`lib/assistant/parky-boredom.ts`). Activity is a pointer
move or press, a key, the mouse wheel or a touch.

| Stage    | Quiet for | What Parky does                                                                                                |
| -------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| `awake`  | < 25 s    | every 12–20 s: hops, tilts, looks around, spins its hat, winks, wiggles, rolls its eyes, twirls, dances, reads |
| `bored`  | 25 s      | yawns, then every 5–9 s whistles, blows a gum bubble that pops, rolls its eyes, looks around, reads or naps    |
| `asleep` | 75 s      | eyes fall shut, it breathes slowly under rising Zs, the hat stops; activity wakes it with a "!"                |

Parky's hat is a Ferris wheel with eight coloured cabins, set into its head: the lowest cabin goes
behind the head, and the A-frame's right leg runs down the head's slope, so the wheel stands in it
rather than on top. The cabins are circles, so they need no counter-turn to hang straight while the
wheel spins, and a light edge under the rim keeps the wheel legible over any page. It rises about
7.5 of the drawing's 48 units above the face.

Button, bubble and window share one layer above everything else on the page, `PARKY_LAYER`
(`z-[10000]`, `components/assistant/parky-layer.ts`), over the header, the planner and the
navigation bar's `z-[9999]`. So that Parky and his hat, which rise over the window's top edge, keep
clear of the 48 px header rather than cover it, the window starts 88 px from the top on a phone and
caps its height at the screen minus 10rem on a desktop.

An easter egg can ask for an act from outside: `ParkyLogo`'s `cue` plays it at once. The coaster
ride is one: Parky sits in a red car and turns about the centre of a loop (`LOOP`), so the car's
wheels run round the rails drawn around it, upside down at the top, eyes wide and mouth open.

The store keeps one timer for the next stage, so a moving pointer costs a timestamp. Each act's
length is written once, in `ACT_MS`; the stylesheet reads it as `--parky-act`. Under reduced
motion the store answers `null` and Parky only shows its moods.

## How Parky arrives

The first time the button shows in a session, it makes an entrance (`sessionEntrance`,
`lib/assistant/entrance.ts`), drawn from five: it scurries in from the right with speed lines and
spins in the air, drops from above and lands in a puff of dust, rolls in and wobbles dizzily,
peeks in from the edge at a tilt before hopping in, or pops up out of nothing in a burst of
sparkles. After a reload, a closed window or under reduced motion the button only fades in.
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

`AssistantTeaser` draws a speech bubble beside the closed button, its tail on Parky's mouth: the
bubble's right edge and bottom are reckoned from the button's size (56 px, 64 px from `sm`) and
its corner offset. These lines go in it, from the `assistant` namespace:

- **Invitations** (`teaser1`–`teaser9`): 8 s after the button shows and again 90 s after that, at
  most two a session (`TEASER_SCHEDULE_MS`). After an entrance the first is the entrance's own
  line (`entranceScurry`, `entranceDrop`, `entranceRoll`, `entrancePeek`, `entrancePop`), said a
  beat after landing. One that falls due over another line or while Parky
  sleeps tries again 5 s later.
- **Reactions**, read from the same `parkyBoredom`: a bored line (`teaserBored1`–`4`) after the
  first yawn, a woken line (`teaserWoke1`–`3`) once somebody wakes Parky. At most
  `REACTIONS_PER_SESSION` (3).
- **Easter eggs** (`lib/assistant/easter-eggs.ts`): on Halloween, at Christmas and at New Year
  the first invitation is the day's own line (`holidayHalloween`, `holidayChristmas`,
  `holidayNewYear`, by the browser's calendar). On the page of a park in `PARK_EGGS` (16 parks,
  keyed by geo path, each with a ride park.fan lists) Parky names its favourite ride there 5 s
  after the page settles (`parkLine1`–`4`, with `{park}` and `{ride}`) and then rides a coaster;
  once per park and at most `PARK_LINES_PER_SESSION` (3) a session. The Konami code typed
  anywhere buys a free ride with its own line (`secretKonami`).

Every line stays 7 s. Opening Parky ends the invitations and reactions for the session
(`stopTeasers`, `lib/assistant/teaser-store.ts`); closing a line by its ✕ ends every line,
easter eggs included (`muteLines`).

## Tracking

Our own statistic (`trackSiteEvent`, labels in `lib/admin/site-analytics.ts`): `assistant_shown`
(the button on screen, once per page view, with the entrance it made or `none`),
`assistant_opened` (with `source`: the button or a line), `assistant_line_shown`,
`assistant_line_clicked` and `assistant_line_closed` (each with the line's kind as `line`: invitation,
entrance, bored, woke, holiday, park or secret), `assistant_closed` (questions while open), `assistant_question` (suggestion or typed, never the
text), `assistant_answer` (result and number of lookups), `assistant_rated`,
`assistant_feedback_sent` (whether with an e-mail, never the e-mail) and
`assistant_challenge_failed`. Planner writes count as `plan_item_added` with source `assistant`,
the planner opening as `planner_opened` with source `assistant`.

## Checks

`pnpm test:assistant` covers the stream reader, the link checks, the rollout decision, the post
text, the action checks, the boredom stages on a fake clock, the opener's draw, and the easter
eggs: a page's park path, the holidays, the Konami code and the park lines' limits.
