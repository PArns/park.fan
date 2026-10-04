# Landing pages — one concept for every page an audience lands on

> **Status:** decided 2026-10-04 (Patrick). Build tickets: PAR-676 and its sub-issues.
> **Scope:** the editorial pages a visitor arrives on from search, the header or a link, and the
> per-park audience pages. Not the homepage (it stays its own design), not the data pages of a
> park, ride or region, not a blog article.

Every landing page so far was built on its own, and it shows. An inventory of the code and of
screenshots at 390 and 1440 px on 2026-10-04 counted **eight hero implementations for twelve
pages**, H1 sizes from 30 to 96 px on a desktop, four spacing systems, three closing-CTA
components (one of them copied twice), a left text edge that jumps between 96, 224 and 288 px, and
not one hub page with an action in its first screen. This page fixes the frame: what kinds of
landing page exist, what each one consists of, what it measures, and what it must lead to.

It does not decide **which** audience gets a page. That stays where it was decided:
[personas-and-scenarios.md §5](personas-and-scenarios.md#5-landing-page-pilot-order) (a persona
page only where the product meets the need and no page addresses it) and
[dedicated-landing-pages.md §2](../seo/dedicated-landing-pages.md#2-what-decides-the-content-subtraction-not-addition)
(a new URL only where it server-renders something no other URL does).

## 1. Three kinds of landing page

| Kind                   | What it is                                    | Pages today                                                                                                     | Head                                                                   |
| ---------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Hub**                | a topic or an audience across all parks       | best time to visit, trip planner, how park.fan works, Fancast, blog index                                       | `LandingHero`: full-bleed photo                                        |
| **Park audience page** | one audience × one park, under the park's URL | with kids (`/mit-kindern`), average wait times (`/durchschnittliche-wartezeiten`); later the next persona pages | the park chrome as today: `ParkTitleHeader` + `ParkHeaderCard`         |
| **Tool page**          | the page is a tool, a list or a form          | developers, contribute, news index, glossary index                                                              | `LandingHero variant="compact"`: no photo, the same type and left edge |

The homepage is none of these and keeps its own hero. A new landing page picks one of the three
kinds before it is built; a fourth kind is a change to this page first.

Decided for tool pages: the **compact** head, not the photo hero. On developers and news the
content is the page (links, a filterable list), and a full-screen photo would push it one screen
down.

## 2. The anatomy

Every hub runs the same sequence. Park audience pages and tool pages run the parts that apply,
in the same order.

1. **Head** — kicker, H1, lead; on hubs optionally three stats and one aside card (the guide's
   `WaitSign`), and **exactly one primary action** (§4).
2. **Intro** — one to three paragraphs (`Lead`, `P`), full section width as today.
3. **Chapters** — `SectionShell` with `ChapterHeading`; numbered only where the sequence always
   renders ([a chapter opens the same way everywhere](../rules/a-chapter-opens-the-same-way-everywhere.md)).
   No bare `<h2>` anywhere on a landing page (developers, glossary and the planner body have them
   today).
4. **FAQ** — `FaqList`, which also emits the `FAQPage` beside the rendered array. Optional.
5. **Next step** — one component, `LandingNextSteps`: one to three destinations, the first being
   the page's primary action again. It replaces `ClosingBand` (guide), `FancastCta` (best time)
   and the two copies of `NextStep` (park audience pages). Fancast and the planner have none today.

## 3. What it measures

| Property        | Hub                                                                                 | Park audience page / tool page                                         |
| --------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| H1              | `text-4xl sm:text-6xl` (36 / 60 px)                                                 | `text-3xl sm:text-4xl` (30 / 36 px)                                    |
| Kicker          | `PARK.FAN · <TOPIC>` on every page                                                  | same                                                                   |
| Left text edge  | the `container` edge, the same on all three kinds                                   | same; a narrower content column starts at that edge, it is not centred |
| Vertical rhythm | `space-y-16 sm:space-y-24` between chapters                                         | same                                                                   |
| Hero height     | `min-h-[78vh]` as `Hero` today; `HERO_FLOW_INTO_PULL` stays below the phone `pb-48` | compact head: content height only                                      |

Fancast's `text-6xl sm:text-8xl` and the glossary's 30 px are the two outliers this moves.
The kicker, tagline, stats labels and the "scroll" label come from the messages, not from the
per-page `PAGE_HEADERS` / `SCROLL_LABELS` tables in five page files (Spanish already says
„Desplazar" on one page and „Desliza" on another).

## 4. Every page names one action

A landing page exists to send a visitor somewhere the product does the work. Each page names
that place once, in the head (hubs) and again as the first next step.

| Page                  | Persona (personas-and-scenarios.md) | Primary action                           | Today                                    |
| --------------------- | ----------------------------------- | ---------------------------------------- | ---------------------------------------- |
| best time to visit    | P1, P2, P4, P5 (scenario S-A)       | the trip planner                         | no planner link at all                   |
| trip planner          | P1 (S-B)                            | start a plan (the tool on the same page) | 1,278 px down on a desktop               |
| how park.fan works    | P4                                  | open a park                              | only in the closing band, ~7,000 px down |
| Fancast               | P2                                  | a park's crowd calendar                  | none                                     |
| blog index            | readers                             | — (the list is the action)               | —                                        |
| with kids             | P1                                  | plan the day for this height (exists)    | exists                                   |
| average wait times    | P2 / P6                             | the trip planner for this park           | missing; the concept named it            |
| developers            | developers, agents                  | the API reference                        | link card further down                   |
| contribute            | photo contributors                  | upload photos (exists)                   | exists                                   |
| news index / glossary | readers / P4                        | the park filter / the search (exists)    | exists                                   |

## 5. Rules this builds on

Nothing here overrides a standing rule; the build tickets have to keep all of these.

- One chapter header component, numbers that never skip, phone spacing as `max-sm:` additions —
  [a chapter opens the same way everywhere](../rules/a-chapter-opens-the-same-way-everywhere.md),
  [design-system.md](../design/design-system.md).
- The hero sits under the 48 px header with `-mt-12`, one of the four places that height is
  written; `pnpm check:header-reach` covers the hero pages —
  [the header is 48 px](../rules/the-header-is-48-px-and-its-height-is-written-down-in-four.md).
- A streamed section reserves its height — [rule](../rules/a-streamed-section-owes-the-page-its-height.md).
- The guide page renders real production cards with real dated values —
  [rule](../rules/the-guide-page-teaches-the-real-cards-with-the-rides-real.md).
- Reuse before building — [rule](../rules/reuse-existing-components.md): `LandingHero` is the
  existing `Hero` with a compact variant, an aside slot and an action slot, not a new component
  next to it. `GuideHero` folds into it.
- Six locales in the same PR, no text that reads as AI-generated —
  [rule](../rules/no-text-may-read-as-ai-generated.md).

## 6. Build order

| #       | Ticket                                                                                                                                                                                          | Depends on  |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| PAR-677 | `LandingHero` (compact variant, aside and action slots; `GuideHero` folded in) and `LandingNextSteps`; head copy and the scroll label into the messages                                         | —           |
| PAR-678 | Hubs onto the anatomy: best time, trip planner, how it works, Fancast, blog index, with their primary actions; Fancast's H1 to the hub size                                                     | PAR-677     |
| PAR-679 | Tool pages onto the compact head: developers, contribute, news index, glossary index                                                                                                            | PAR-677     |
| PAR-680 | Park audience pages: one `LandingNextSteps` instead of two `NextStep` copies, the planner action on average wait times                                                                          | PAR-677     |
| PAR-681 | A rule page for the anatomy under `docs/rules/` and a check that every landing page has one H1, the head component of its kind, one primary action, and an `FAQPage` only beside a rendered FAQ | PAR-678–680 |

Each step is a visible layout change and goes to Patrick with screenshots (light and dark,
360 and 1440 px) before merge.

## 7. What this does not settle

- **Which audience comes next.** P5 (grandparents) is blocked on the accessibility and intensity
  data (G1). P6 (search drive-by) needs a conversion step on the park page, not a page (PAR-375).
  P2 needs the comparison he can drive first.
- **The homepage.** Its hero and story chapters stay as they are; it only links the hubs.
- **Copy.** The table in §4 names destinations, not wording; the button text is written in the
  build tickets under the prose rules.
