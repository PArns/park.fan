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

## Tracking

Our own statistic (`trackSiteEvent`, labels in `lib/admin/site-analytics.ts`): `assistant_opened`,
`assistant_closed` (questions while open), `assistant_question` (suggestion or typed, never the
text), `assistant_answer` (result and number of lookups), `assistant_rated`,
`assistant_feedback_sent` (whether with an e-mail, never the e-mail) and
`assistant_challenge_failed`. Planner writes count as `plan_item_added` with source `assistant`,
the planner opening as `planner_opened` with source `assistant`.

## Checks

`pnpm test:assistant` covers the stream reader, the link checks, the rollout decision, the post
text and the action checks.
