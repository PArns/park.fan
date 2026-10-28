# Brand Context

> Auto-loaded by the blog sub-skills. Last updated: 2026-10-27.
>
> Audience, positioning and scope for the blog skills: what the repo does not say elsewhere. The
> writing rules live in [docs/writing/](docs/writing/README.md) and win over anything here; this
> page links to them instead of restating them.

## Audience

- Primary: people planning a day or a short trip to a theme park, mostly in Europe and mostly
  German-speaking (German is the source language, five locales are derived from it). Families and
  couples going to Phantasialand, Europa-Park, Efteling, Toverland and their neighbours.
- Secondary: coaster and park enthusiasts who know the rides and come for the data: typical
  waits per hour, ride specs, history, new attractions.
- Expertise: mixed. A first-time visitor and someone with an annual pass read the same guide.
- Active problems:
  - Which day and which month is quiet enough to be worth the trip
  - How long the queues for the headliners get, and when in the day they are shortest
  - Whether the fast pass is worth its price at this park
  - Whether rope drop pays off, and which ride to run to first
  - Tickets, parking, getting there, food and hotels without opening five tabs
- Common misconceptions:
  - The time posted at the entrance is the time you will stand in line
  - Arriving early always pays off, at every park and every ride
  - A rainy day empties the park
  - School holidays are full and every other weekday is empty

## Positioning

- Official entity name: park.fan
- Homepage: https://park.fan
- Logo: `public/logo-big.svg` (dark theme: `public/logo-big-dark.svg`), square mark `public/icon.svg`
- sameAs profiles: none for the organisation yet (`ORGANIZATION_SAME_AS` in
  `components/seo/structured-data.tsx` is empty on purpose). Author: https://arns.dev,
  https://github.com/PArns
- Wikidata Q-ID: none
- Mission: live wait times and crowd forecasts, so a day in the park goes to rides instead of
  railings.
- Distinctive POV: a tip on park.fan rests on a figure and its source, not on what fans repeat to
  each other, and where we have no figure we say whose gap it is
  ([§1.9](docs/writing/1-substance.md#19-a-gap-has-an-owner)). Humour is a goal of its own, next to the numbers
  ([§0.1](docs/writing/README.md#01-what-has-to-stay-when-the-slop-goes)).
- What we are NOT: a ticket shop, a deals site, a park's marketing channel or a rumour mill. Not a
  travel brochure either, so no sentence that would fit any park.
- Competitors:
  - queue-times.com: global live waits and history, and one of our data sources (credited in the
    footer). We add a crowd forecast about six months ahead, typical waits per ride and hour, and
    long guides in six languages.
  - wartezeiten.app: German live wait times. We add the best-days calendar, the trip planner, ride
    pages with the typical wait for this hour, and guides that explain the numbers.

## Editorial Rules

Pointers into the rules, one line each; the rule pages decide.

### Always do

- Back every figure, spec and claim with its source
  ([§1.2](docs/writing/1-substance.md#12-every-claim-carries-its-evidence-or-it-goes))
- Show live numbers through widgets ([the rule](docs/rules/a-wait-time-is-never-typed-into-a-post.md))
- Give a verdict where the reader wants one ([§1.3](docs/writing/1-substance.md#13-have-a-verdict))
- Ship every post in six languages in one PR
  ([the rule](docs/rules/a-post-ships-in-six-languages-in-one-pull-request.md))
- Meet the length floor with facts ([§0.1](docs/writing/README.md#01-what-has-to-stay-when-the-slop-goes))
- Show corrections in news openly ([the rule](docs/rules/a-news-correction-is-shown-never-silent.md))

### Never do

- Read as AI-generated ([the writing rules](docs/writing/README.md), `pnpm check:prose`)
- Invent a detail, a quote or an experience ([§1.8](docs/writing/1-substance.md#18-never-invent-what-somebody-had-to-live-count-or-say))
- Put a figure that moves into a title or heading ([§4.3](docs/writing/4-typography.md#43-headings))
- Close with a summary block or a send-off ([§1.5](docs/writing/1-substance.md#15-no-summary-blocks), [§1.6](docs/writing/1-substance.md#16-no-challenges-and-future-outlook))
- Use a Creative Commons photo ([the rule](docs/rules/no-creative-commons-photos.md))
- Joke in a news post about an accident, an injury, a lawsuit or a death
  ([§0.1](docs/writing/README.md#01-what-has-to-stay-when-the-slop-goes))

### Taboo phrases

Kept in one place: [§3](docs/writing/3-vocabulary.md), above all the house rules
([§3.3](docs/writing/3-vocabulary.md#33-ours-and-non-negotiable)) and travel-guide copy
([§3.4](docs/writing/3-vocabulary.md#34-travel-guide-copy-in-all-six-languages)); no em dash
([§4.1](docs/writing/4-typography.md#41-the-em-dash)).

### Required disclosures

- Sources: every post ends with its source list ([§5.4](docs/writing/5-posts-and-news.md#54-blog-posts),
  news: [§5.0](docs/writing/5-posts-and-news.md#50-news-posts-category-news))
- Press trip or free ticket: say so in the post when a park paid for the visit or the ticket
- Affiliate links: mark each one as such where it appears

## Topic Scope

- In scope: park guides, when-to-go and crowd analysis from our own data, new attractions,
  park news, trip reports, behind the scenes of park.fan
- Partial scope: industry topics (ride manufacturers, accidents, lawsuits) only with a park or
  visitor angle, attributed in every sentence ([the rule](docs/rules/a-quote-names-its-source.md))
- Out of scope: anything without a park, a ride or a visit in it
- Recurring formats: the categories in `content/blog/categories.json`: Guides, News, New
  attractions, Trip reports, Behind the scenes, park.fan
