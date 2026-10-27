# Glossary

The theme park glossary: over 300 terms in six languages with localized URLs, an overview and a
page per term, a 3-D player for coaster figures, search, structured data, links to and from ride
profiles, and auto-linking in blog posts. Open this page before adding or renaming a term or
changing the glossary pages.

## Files

| Layer                               | Files                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------- |
| Term data (ids, categories, slugs)  | `lib/glossary/data.ts`                                                    |
| Types, categories and their order   | `lib/glossary/types.ts`, `lib/glossary/categories.ts`                     |
| Loader (cached)                     | `lib/glossary/translations.ts` (`getGlossaryTerms`)                       |
| Per-locale definitions              | `content/glossary/{en,de,fr,it,nl,es}.ts`                                 |
| URL segments                        | `lib/glossary/segments.ts` (`GLOSSARY_SEGMENTS`)                          |
| Review date for sitemap and JSON-LD | `lib/glossary/content-date.ts`                                            |
| Overview and term pages             | `app/[locale]/glossary/page.tsx`, `app/[locale]/glossary/[term]/page.tsx` |
| Components                          | `components/glossary/`                                                    |
| Structured data                     | `components/seo/glossary-structured-data.tsx`                             |
| Search API                          | `app/api/glossary-search/route.ts`                                        |
| Term id list for the API            | `app/api/glossary-term-ids/route.ts`                                      |
| Client data (generated)             | `scripts/generate-client-glossary.mjs` → `lib/glossary/client-data/`      |

## Localized URLs

The route folder is `app/[locale]/glossary/[term]/`; the localized segments are served by
`rewrites()` in `next.config.ts`, no next-intl `pathnames`.

| Locale | Segment         |
| ------ | --------------- |
| en     | `/glossary`     |
| de     | `/glossar`      |
| fr     | `/glossaire`    |
| it     | `/glossario`    |
| nl     | `/woordenlijst` |
| es     | `/glosario`     |

The locale switcher (`components/common/locale-switcher.tsx`) follows the page's
`link[rel="alternate"][hreflang]` and keeps only the pathname, so switching works on localhost and in
production and lands on the term's slug in the other language.

## Adding or changing a term

1. **`lib/glossary/data.ts`**: a `GlossaryTermData` entry with a stable `id`, a `category` and
   `slugs` for all six locales (URL-safe ASCII; German folds umlauts, Spanish drops accents).
2. **`content/glossary/<locale>.ts`**, all six: a `GlossaryTermTranslation` with `name`,
   `shortDefinition`, `definition` and optional `relatedTermIds`, `aliases` (matched by
   auto-linking) and `alternateNames` (shown on the term page).
3. Bump `GLOSSARY_CONTENT_DATE` and `GLOSSARY_CONTENT_HASH` in `lib/glossary/content-date.ts`;
   `pnpm check:glossary-content-date` (run in CI) fails when the content changed without them and
   prints the new hash.
4. `pnpm check:glossary-slugs` checks that every slug is URL-safe, present in all six locales and
   unique per locale, and that every category in use is in `GLOSSARY_CATEGORY_ORDER` (a term in a
   missing category renders nowhere).

A `definition` is plain prose, paragraphs separated by `\n\n` (each becomes a `<p>`). The one markup
it may carry is an inline Markdown link (`GLOSSARY_LINK_SOURCE`, `lib/glossary/rich-text.ts`);
`glossaryPlainText` reduces links to their labels for JSON-LD and meta descriptions.

**Renaming or removing a term id** breaks ride profiles that reference it; see
[keeping term ids honest](#keeping-term-ids-honest).

## Pages

Both pages are built from the parts the blog and news pages use. The one thing of their own is
`GlossaryBackground`: a park photo from the hero pool (one per day per deploy, server-picked for LCP)
behind the head only, washed toward the page background and faded out where the content starts.

- **Overview** is a tool page ([landing pages](../product/landing-pages.md)): the compact
  `LandingHero`, the listings' search field (`LISTING_SEARCH_INPUT_CLASS`) with the 3-D filter beside
  it, and the category pills (`filterPillClass`, „Alle" first, a count in each). Every category opens
  with `ChapterHeading`, its icon from `GLOSSARY_CATEGORY_ICONS` as watermark and the term count as
  badge, unnumbered because the filter drops groups.
- **Term cards** (`GlossaryTermCard`) take the stream's surface (`LISTING_CARD_CLASS`): name, short
  definition, a 3-D badge, and the number of curated rides featuring the term on the card's floor.
- **Type-to-search**: a printable key with nothing focused moves into the search; Escape clears it
  ([a keyboard shortcut waits for an unfocused page](../rules/a-keyboard-shortcut-waits-for-an-unfocused-page.md)).
- **Term page** is laid out like a blog article: breadcrumb, the category as kicker (`HeadKicker`,
  linking to its chapter on the overview), the name as a `font-black` H1, the short definition as the
  lead, the alternate names. Under it the 3-D player, the definition, the Fancast link for model
  terms, the rides and the blog posts as chapters (`GlossaryTermRides`, `GlossaryTermPosts`, both
  slots of `GlossaryTermDetail`), and the way back. Related terms stand in a sticky `SidebarCard`
  from 1024 px of page width, under the text below that.
- **Term page tail**: the shared `PageBottomSections` (Nearby → Favorites → Featured Parks), set off
  by a rule and a `bg-muted/30` tint (`border-y`) that continues into `FavoritesSection`'s band, so
  the tail reads as one region without stacked padding.

`GlossaryTermPosts` lists the posts that embed the term's `glossary-widget` (prose auto-links do not
count; `extractGlossaryRefs` in `lib/blog/derive.mjs`) and renders nothing for terms no post covers.

## Search

`GET /api/glossary-search?q=…&locale=…` (at least 3 characters, at most 5 results). The search
palette sends it as a query of its own beside the park and ride search and shows a glossary group;
see [site search](site-search.md#in-the-palette).

## SEO

- **Overview**: `DefinedTermSet` JSON-LD with every term as `hasDefinedTerm`, `inLanguage` and a
  localized description.
- **Term page**: `DefinedTerm` JSON-LD with `inDefinedTermSet`, `termCode`, `inLanguage`; hreflang
  alternates with each locale's own slug.
- **Sitemap**: six overview URLs and every term × locale URL, with `lastModified` from
  `GLOSSARY_CONTENT_DATE`: the glossary is prerendered from files in this repo, so its date is written
  down rather than observed like park pages'.
- **IndexNow**: the six overview URLs are pushed with the other hub pages
  (`app/api/cron/indexnow/route.ts`).

## Ride ↔ Glossary link

Rides and terms are linked in **both directions** through the API's curated `rideProfile`, which
stores **glossary term ids only**; this app owns the glossary and resolves them. The rule (ride order,
repeats intentional) is [ride and glossary link](../rules/ride-and-glossary-link.md); the data shape,
measurements and how profiles are curated are in the backend's
[`docs/frontend/ride-glossary-link.md`](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/ride-glossary-link.md).

| Direction        | Where                                     | Component                                           |
| ---------------- | ----------------------------------------- | --------------------------------------------------- |
| ride → glossary  | ride page, chapter `#ride-profile`        | `components/parks/ride-profile-section.tsx`         |
| ride → glossary  | ride page header, jump to `#ride-profile` | `components/parks/ride-profile-teaser.tsx`          |
| glossary → rides | term page, in the definition column       | `components/glossary/glossary-term-rides.tsx`       |
| glossary → rides | overview, ride count on each term card    | `getRideCountsByTerm` (`/v1/glossary/terms/counts`) |

- **One resolver.** `resolveRideProfile` (`lib/glossary/ride-profile.ts`) turns the profile's ids into
  names, links and rail metadata for both the section and the header teaser, so their figure counts
  cannot disagree; `rideProfileRenders` is the predicate the page asks before it offers the
  `#ride-profile` jump. The data arrives with the ride (`rideProfile`), so it is in the static shell.
- **`RideProfileSection`** shows maker and year, kind (ride-type terms as `Badge` chips; the
  manufacturer links only when the glossary covers that builder), then the layout as a rail read left
  to right in ride order (`RideLayoutRail`, `components/parks/ride-layout-rail.tsx`; Voltron Nevera
  really does run two corkscrews back to back). Each figure is coloured by its effect class from
  `lib/glossary/element-kinds.ts` (launch, airtime, inversion, turn, brake; anything else neutral)
  through the `--color-element-*` tokens. The 3-D viewer (`CoasterPlayer`) opens in place, and the
  three.js chunk loads only on the first tap of a figure.
- **`GlossaryTermRides`** fetches `/v1/glossary/terms/:id/attractions?sort=popularity`
  (`getAttractionsForTerm`, `lib/api/glossary-rides.ts`, 7 days), groups by park and renders nothing
  when no ride carries the term, which is most of the glossary. It opens a chapter like every other
  one (`ChapterHeading`, ride count as badge): the top three rides as stream cards, the rest as chips
  grouped by park. The ranking is the API's (see the backend doc). `typicalPeakWait` is absent, not
  `null`, for a ride without a baseline (the API strips null keys), and such a ride is never shown as
  0 minutes: only rides with a figure qualify for the top three.

An id this app has no term for is **dropped**, not rendered raw: the API may carry an id before the
glossary entry lands here.

### Keeping term ids honest

This app is the only place a term id is defined. `GET /api/glossary-term-ids` lists every id that
resolves to a page (`getGlossaryTerms('en')`, an hour at the edge). The API reads it in two places:
it checks a term id when a ride profile or a park's fast-pass term is written
(`GlossaryTermIdsService`, skipped when this app is unreachable), and a daily 06:30 job runs
`GET /v1/admin/ride-profile-term-audit` against every stored id, so a rename shows in the API's log
the next morning. A renamed or removed term still silently shortens every ride layout that used it
until somebody fixes the rows; the backend doc has the SQL to find them.
`scripts/export-glossary-term-ids.mjs` still prints the list but has no consumer.

## The 3-D player

`components/glossary/coaster-player.tsx` and `coaster-player-scene.tsx` drive the scene in
`lib/three/coaster/` (`elements.ts` holds the figures). Every change is verified with the headless
harness the [three.js rule](../rules/threejs-animations.md) requires: it drives the real scene module
in Chromium and writes a contact sheet per element, one row per camera (front, follow, onboard), one
column per timeline position, in both themes.

```bash
node scripts/render-coaster-elements.mjs                 # all elements
node scripts/render-coaster-elements.mjs launch top-hat  # just these
OUT=/tmp/sheets SAMPLES=0.9,0.95,1 node scripts/render-coaster-elements.mjs
```

It uses the container's pre-installed Chromium (`/opt/pw-browsers/chromium`, override with
`CHROMIUM_PATH`); never run `playwright install`.

**`pace`: elements whose speed is the point.** The curve is arc-length parameterised, so linear
progress means constant speed. An element may supply `pace(t)` to remap progress when the speed change
is the element: a launch accelerating out of the station, a train hanging at the apex of a scorpion
tail, a drop track standing still before the floor lets go. It must be monotonic from 0 to 1. Prefer
ease-in; an ease-out compresses the end of the run and bunches the cars there.

## In blog posts

Blog bodies use glossary terms two ways (`components/blog/blog-content.tsx`):

- **Auto-linking**: known terms and aliases are linked on first occurrence (`GlossaryInject`,
  `GlossaryInjectTerm`); the matcher is built once per locale and cached in a `WeakMap`
  (`lib/glossary/parse-segments.ts`). Client-side term links (`GlossaryTermLink`) load the generated
  per-locale data lazily after first paint (`lib/glossary/client-data-loader.ts`).
- **Glossary widget**: a fence pulls a term's name and full definition from the dataset, so no text
  is copied:

      ```glossary-widget slug=hyper-coaster
      ```

  `slug` takes the localized slug or the stable `id` (slug first), so one reference works across
  translations. `BlogGlossaryWidget` renders the name, the definition, alternate names and a link to
  the term page; an unknown reference renders `blog.widget.termNotFound`. Ride links in the
  definition get a live chip (`lib/blog/glossary-ride-href.ts`, `pnpm test:glossary-ride-href`).
