# A landing page has one anatomy (REQUIREMENT)

Every landing page is one of three kinds, and the kind decides the head. A fourth kind is a change to
the concept page ([landing pages](../product/landing-pages.md)) first. The homepage is none of these
and keeps its own hero.

| Kind               | Pages                                                                          | Head                                                  |
| ------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Hub                | best time to visit, trip planner, how park.fan works, Fancast, blog            | `LandingHero` (`data-landing-hero="hub"`)             |
| Tool page          | contribute, news index, compare, glossary index, changelog                     | `LandingHero variant="compact"` (`="compact"`)        |
| Park audience page | `/mit-kindern`, `/durchschnittliche-wartezeiten`, the persona pages after them | the park chrome: `ParkTitleHeader` + `ParkHeaderCard` |

The sequence is head, intro, chapters, FAQ, next step, in that order. Hubs run all five; the other
two kinds run the parts that apply, without reordering them.

- **One `<h1>`**, the one in the head, counted in the rendered DOM after hydration.
- **One primary action on a hub**, in the hero's action slot (`data-landing-action`). The blog index
  has none, because the list is the action. The same destination comes back as the first entry of
  `LandingNextSteps`.
- **Chapters open with `ChapterHeading`**, directly or through `SectionShell`
  ([a chapter opens the same way everywhere](a-chapter-opens-the-same-way-everywhere.md)).
- **No bare `<h2>`.** An `<h2>` stands in a `ChapterHeading` (`data-chapter-heading`), inside a
  card, or in the `LandingNextSteps` band (`data-landing-next`). A card is `Card`
  (`data-slot="card"`), `GlassCard` (`data-glass-card`), or a hand-built box whose root says
  `data-card` (`ParkHeaderCard`, `ContributeBanner`, `PreferredSourcePrompt`, `RightsNotice`). A
  heading inside a chapter that is not a card is an `<h3>`. The one other `<h2>` is a stream group's
  date label (the day on `/news`, the month on blog listings, inside `[data-stream-group]`).
- **`FAQPage` only beside a rendered FAQ.** `FaqList` emits the structured data from the array it
  renders and marks its list `data-faq-list`. Structured data has to describe what the page shows.
- **One closing step**, `LandingNextSteps`, one to three destinations.

`PageBottomSections` (nearby, favourites, popular parks, under the blog and news indexes, every post
and every glossary term) opens each block with `ChapterHeading`, watermark variant, unnumbered, and so
do its skeletons and empty states. The homepage passes `heading="tile"` (favourites, popular parks)
or `nested` (nearby, whose chapter `NearbyChapter` already opens).

## Check

`pnpm check:landing-pages` (`scripts/check-landing-pages.mjs`) loads the German URL of every page
above (except the English-only changelog) and the English URL of each hub in Chromium, waits for hydration and asserts each point, one
line per page, exit 1 on any ✗. The kind of each URL is written in the script, not read off the page,
so a page that lost its head fails instead of passing as another kind; a new landing page joins that
table in the same pull request. The script's `OPEN` list (printed, not failed) is for an `<h2>`
waiting on a design decision; it is empty, and nothing joins it to get a page green. It needs a
running site: `pnpm build && pnpm start -p <port>`, then
`pnpm check:landing-pages --base=http://localhost:<port>`.
