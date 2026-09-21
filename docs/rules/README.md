# Standing rules

One file per rule. The repo's [`CLAUDE.md`](../../CLAUDE.md) is the index: it carries each rule in a
single line with the identifiers needed to grep for it, and links to the file here that holds the
reasoning, the measurements and the counter-examples.

**Open the one file your task needs.** These were six grouped pages until 2026-09-17, and a ticket
about the header menu loaded 34 KB to reach 11 KB of it. A new rule gets its own file and a line in
`CLAUDE.md` — never an appendix to a neighbouring page.

## Architecture and payload

_Page payload, caching, `revalidate`, streaming, CLS, translations reaching the client._

- [Park page loading priority (REQUIREMENT)](park-page-loading-priority.md)
- [A streamed section owes the page its height (REQUIREMENT)](a-streamed-section-owes-the-page-its-height.md)
- [An interaction may not rebuild the grid in the commit that answers it (REQUIREMENT)](an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md)
- [API budget per page (REQUIREMENT)](api-budget-per-page.md)
- [The page render is the bigger half of the API budget, and it was never audited (ANTI-PATTERN)](the-page-render-is-the-bigger-half-of-the-api-budget-and-it.md)
- [A `revalidate` at a call site is somebody else's page (REQUIREMENT)](a-revalidate-at-a-call-site-is-somebody-elses-page.md)
- [A redirect thrown from a render carries the layout as its body (REQUIREMENT)](a-redirect-thrown-from-a-render-carries-the-layout-as-its-body.md)
- [An ISR route needs both halves, and one of them is an empty `generateStaticParams` (REQUIREMENT)](an-isr-route-needs-both-halves.md)
- [A runtime file read ships the whole directory it is rooted at (REQUIREMENT)](a-runtime-file-read-ships-the-directory-it-is-rooted-at.md)
- [Translations are routed, not bundled (REQUIREMENT)](translations-are-routed-not-bundled.md)

## Data and API

_Wait times, seasons, a park with no source._

- [Parks we cannot read (REQUIREMENT)](parks-we-cannot-read.md)
- [A ride out of season is closed, and is not one of the park's rides today (REQUIREMENT)](a-ride-out-of-season-is-closed-and-is-not-one-of-the-parks.md)

## Features

_Trip planner, header menu, admin, weather chart, guide page, glossary, blog manifest._

- [The planner's day ends when the park closes, and a headliner is not a residual (REQUIREMENT)](the-planners-day-ends-when-the-park-closes-and-a-headliner-is.md)
- [A day that does not fit opens an assistant, not a footnote (REQUIREMENT)](a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md)
- [Weather day chart is built around the park's hours (REQUIREMENT)](weather-day-chart-is-built-around-the-parks-hours.md)
- [The admin holds no credential (REQUIREMENT)](the-admin-holds-no-credential.md)
- [The header menu is three kinds of content, and the split is about the link graph (REQUIREMENT)](the-header-menu-is-three-kinds-of-content-and-the-split-is.md)
- [The guide page teaches the real cards with the ride's real numbers (REQUIREMENT)](the-guide-page-teaches-the-real-cards-with-the-rides-real.md)
- [Ride ↔ Glossary link](ride-and-glossary-link.md)
- [Blog manifest is split (REQUIREMENT)](blog-manifest-is-split.md)

## Design and layout

_Layout, a component, a breakpoint, the header, a card, three.js._

- [A chapter opens the same way everywhere (REQUIREMENT)](a-chapter-opens-the-same-way-everywhere.md)
- [A client-only preference may not decide server-rendered markup (REQUIREMENT)](a-client-only-preference-may-not-decide-server-rendered-markup.md)
- [A cell is gated on its content, and a component that fills one may not return `null` — nor one line (REQUIREMENT)](a-cell-is-gated-on-its-content-and-a-component-that-fills-one.md)
- [Reuse existing components (REQUIREMENT)](reuse-existing-components.md)
- [The header is 48 px, and its height is written down in four places (REQUIREMENT)](the-header-is-48-px-and-its-height-is-written-down-in-four.md)
- [three.js animations (REQUIREMENT)](threejs-animations.md)
- [The quietest weekday may be two days, and a thin day drops out rather than ending the vote (REQUIREMENT)](the-quietest-weekday-may-be-two-days-and-a-thin-day-drops-out.md)
- [Blog spotlight cards](blog-spotlight-cards.md)
- [A blog card is a row on phones (REQUIREMENT)](a-blog-card-is-a-row-on-phones.md)
- [Map tiles are CARTO, never OSM's own tile server (REQUIREMENT)](map-tiles-are-carto-not-osms-own-tile-server.md)

## SEO and the machine-facing surface

_Sitemaps, feeds, favicon, robots and agents, analytics._

- [The favicon is generated from two sources, and it carries no wordmark (REQUIREMENT)](the-favicon-is-generated-from-two-sources-and-it-carries-no.md)
- [Nothing here has a reader inside the site (REQUIREMENT)](nothing-here-has-a-reader-inside-the-site.md)
- [A `<lastmod>` is observed, never stamped (REQUIREMENT)](a-lastmod-is-observed-never-stamped.md)
- [A feed nobody links to is a file with a URL (REQUIREMENT)](a-feed-nobody-links-to-is-a-file-with-a-url.md)
- [Umami event budget (REQUIREMENT)](umami-event-budget.md)

## Content and media

_A blog post, UI strings, images, captions._

- [No text may read as AI-generated (REQUIREMENT)](no-text-may-read-as-ai-generated.md)
- [Blog writing style (REQUIREMENT)](blog-writing-style.md)
- [A wait time is never typed into a post (REQUIREMENT)](a-wait-time-is-never-typed-into-a-post.md)
- [Park/Ride page ↔ blog link](parkride-page-and-blog-link.md)
- [Media database (REQUIREMENT)](media-database.md)
- [One photo can index two rides (`alsoRides`)](one-photo-can-index-two-rides-alsorides.md)
- [Card photos are two layers (REQUIREMENT)](card-photos-are-two-layers.md)
- [Localized blog gallery captions](localized-blog-gallery-captions.md)
- [A version is a unit of communication, not a build artifact (REQUIREMENT)](a-version-is-a-unit-of-communication.md)
