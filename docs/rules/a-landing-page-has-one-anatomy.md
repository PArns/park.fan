# A landing page has one anatomy (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

The concept, its inventory and the reasons are in
[docs/product/landing-pages.md](../product/landing-pages.md). This page is the part a build has
to keep, and what `pnpm check:landing-pages` asserts.

## The three kinds

Every landing page is one of three kinds, and the kind decides the head. A fourth kind is a change
to the concept page first.

| Kind               | Pages                                                                          | Head                                                  |
| ------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Hub                | best time to visit, trip planner, how park.fan works, Fancast, blog            | `LandingHero` (`data-landing-hero="hub"`)             |
| Tool page          | contribute, news index, glossary index                                         | `LandingHero variant="compact"` (`="compact"`)        |
| Park audience page | `/mit-kindern`, `/durchschnittliche-wartezeiten`, the persona pages after them | the park chrome: `ParkTitleHeader` + `ParkHeaderCard` |

The homepage is none of these and keeps its own hero.

## The sequence

Head, intro, chapters, FAQ, next step, in that order. Hubs run all five; the other two kinds run
the parts that apply, without reordering them.

- **One `<h1>`**, the one in the head. Counted in the rendered DOM after hydration, so a client
  component that adds one fails as well.
- **One primary action on a hub**, in the hero's action slot (`data-landing-action`). The blog
  index has none, because the list is the action. The same destination comes back as the first
  entry of `LandingNextSteps`.
- **Chapters open with `ChapterHeading`**, directly or through `SectionShell`
  ([a chapter opens the same way everywhere](a-chapter-opens-the-same-way-everywhere.md)).
- **No bare `<h2>`.** An `<h2>` on a landing page stands in a `ChapterHeading`
  (`data-chapter-heading`), inside a card, or in the `LandingNextSteps` band (`data-landing-next`).
  A card is `Card` (`data-slot="card"`), `GlassCard` (`data-glass-card`), or a box built by hand
  whose root says `data-card` (`ParkHeaderCard`, `ContributeBanner`, `PreferredSourcePrompt`,
  `RightsNotice`). A bold line set by hand is the thing the anatomy replaced: glossary and
  contribute each had their own. A heading inside a chapter that is not a card is an `<h3>`
  (the accuracy band of `MLStatsSection` on Fancast).
- **`FAQPage` only beside a rendered FAQ.** `FaqList` emits the structured data from the same
  array it renders and marks its list `data-faq-list`. Google wants structured data to describe
  what the page shows, so a `FAQPage` without the questions on the page is wrong, and a list
  without its `FAQPage` gives up the rich result.
- **One closing step**, `LandingNextSteps`, one to three destinations.

## The check

`pnpm check:landing-pages` (`scripts/check-landing-pages.mjs`) loads the German URL of every page
above and the English URL of each hub in Chromium, waits for hydration and asserts each point,
one line per page and exit 1 on any ✗:

```
✓ hub  /de/beste-reisezeit  h1 1, hub head, 1 action, FAQPage + FaqList
✗ hub  /de/fancast  2 <h1>, want 1
✗ tool /de/contribute  bare <h2> "Diese Parks und Rides warten auf deine Fotos"
```

The kind of each URL is written in the script, not read off the page, so a page that lost its
head fails instead of passing as another kind. A new landing page joins that table in the same
pull request.

The one `<h2>` that needs none of these homes is a **news day label** (`data-news-day` in the
news index): date headings structure a timeline; they are not chapters.

`PageBottomSections`, the module under the blog and news indexes (nearby, favourites, popular
parks; it also closes every post and glossary term), opens each of its three blocks with
`ChapterHeading`, watermark variant, unnumbered, and so do their skeletons and empty states. The
homepage stands the same three among its `tile` chapters and passes `heading="tile"` (favourites,
popular parks) or `nested` (nearby, whose chapter `NearbyChapter` already opens).

The script keeps an `OPEN` list, printed as `open` on every run rather than failed, for an `<h2>`
that waits for a design decision. It is empty. An entry leaves it when its headings are decided;
nothing new joins it to get a page green.

It needs a running site: `pnpm build && pnpm start -p <port>`, then
`pnpm check:landing-pages --base=http://localhost:<port>`.
