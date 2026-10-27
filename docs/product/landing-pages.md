# Landing pages

The concept behind every page an audience lands on from search, the header or a link: the three
kinds, what each measures, and the one action each page names. Open it before building or
restyling a hub, a tool page or a park audience page. Not the homepage (its own design), not the
data pages of a park, ride or region, not a blog article. What a build must keep, and what
`pnpm check:landing-pages` asserts, is the standing rule
[a landing page has one anatomy](../rules/a-landing-page-has-one-anatomy.md).

Decided 2026-10-04 (PAR-676, built in PAR-677–681). The reason: an inventory that day counted
eight hero implementations for twelve pages, H1 sizes from 30 to 96 px on a desktop, four spacing
systems, three closing-CTA components, a left text edge jumping between 96, 224 and 288 px, and no
hub with an action in its first screen.

Which audience gets a page is decided elsewhere:
[personas §5](personas-and-scenarios.md#5-landing-page-pilot-order) (a persona page only where the
product meets the need and no page addresses it) and
[park sub-pages](../seo/park-sub-pages.md#the-rule-a-new-url-must-server-render-what-no-other-url-does)
(a new URL only where it server-renders something no other URL does).

## 1. Three kinds of landing page

**Hub** (a topic or audience across all parks: best time to visit, trip planner, how park.fan
works, Fancast, blog index), **tool page** (the page is a tool, a list or a form: contribute, news
index, compare, glossary index, changelog) and **park audience page** (one audience × one park,
under the park's URL: with kids, average wait times). The table of pages and heads is in the
[rule](../rules/a-landing-page-has-one-anatomy.md); the head components are
`LandingHero` and `LandingHero variant="compact"` in `components/marketing/editorial-ui.tsx`, and
the park chrome (`ParkTitleHeader` + `ParkHeaderCard`).

A new landing page picks one of the three kinds before it is built; a fourth kind is a change to
this page first. Tool pages get the **compact** head, not the photo hero: on news the content is a
filterable list, and a full-screen photo would push it a screen down. The glossary index keeps a
faded park photo behind its compact head (`GlossaryBackground`, decided 2026-10-22): it takes no
height and is gone before the search.

## 2. The anatomy

Head, intro, chapters, FAQ, next step, in that order: hubs run all five, the other kinds the parts
that apply. The details (one `<h1>`, one primary action, `ChapterHeading`, no bare `<h2>`,
`FAQPage` only beside `FaqList`, `LandingNextSteps` as the one closing step) are the
[rule](../rules/a-landing-page-has-one-anatomy.md).

## 3. What it measures

| Property        | Hub                                                                                    | Park audience page / tool page                                         |
| --------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| H1              | `text-4xl sm:text-6xl` (36 / 60 px)                                                    | `text-3xl sm:text-4xl` (30 / 36 px)                                    |
| Kicker          | `park.fan · <topic>` from `landing.<page>.kicker` in the messages, set by `HeadKicker` | same                                                                   |
| Left text edge  | the `container` edge, the same on all three kinds                                      | same; a narrower content column starts at that edge, it is not centred |
| Vertical rhythm | `space-y-16 sm:space-y-24` between chapters                                            | same                                                                   |
| Hero height     | `min-h-[78vh]`, under the 48 px header with `-mt-12`                                   | compact head: content height only                                      |

The H1 sizes are `TITLE_CLASS` in `editorial-ui.tsx`. On the hubs that let content flow into the
hero on a phone, `HERO_FLOW_INTO_PULL` must stay below the hero's mobile `pb-48`
([a blog card is a row on phones](../rules/a-blog-card-is-a-row-on-phones.md)), and
`pnpm check:header-reach` covers the hero pages
([the header is 48 px](../rules/the-header-is-48-px.md)).

## 4. Every page names one action

A landing page exists to send a visitor where the product does the work. A hub names that place
once in its head (`LandingHero action`) and again as the first entry of `LandingNextSteps`.

| Page                  | Persona ([personas](personas-and-scenarios.md)) | Primary action                           |
| --------------------- | ----------------------------------------------- | ---------------------------------------- |
| best time to visit    | P1, P2, P4, P5 (scenario S-A)                   | the trip planner                         |
| trip planner          | P1 (S-B)                                        | start a plan (the tool on the same page) |
| how park.fan works    | P4                                              | open a park                              |
| Fancast               | P2                                              | a park's crowd calendar                  |
| blog index            | readers                                         | none: the list is the action             |
| with kids             | P1                                              | plan the day for this height             |
| average wait times    | P2, P6                                          | the trip planner for this park           |
| contribute            | photo contributors                              | upload photos                            |
| compare               | P2                                              | the comparison tool on the page          |
| news index / glossary | readers / P4                                    | the search, the park filter / the search |

The button text is written under the [prose rules](../rules/no-text-may-read-as-ai-generated.md);
this table names destinations, not wording. Which audience gets the next page is open: P5 waits
for accessibility and intensity data (G1), P2 for the features a page would sell.
