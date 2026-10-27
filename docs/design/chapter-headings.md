# Chapter headings

How a chapter opens on every page: the one component, where each surface reaches it, the variants,
and the phone sizes. Open it before adding a section heading anywhere. The rule is
[a chapter opens the same way everywhere](../rules/a-chapter-opens-the-same-way-everywhere.md).

`ChapterHeading` (`components/common/chapter-heading.tsx`) draws an oversized translucent glyph on
the left (a chapter number or the section's icon), an optional kicker, the title, an optional hint
or action, and the `border-b` rule that closes it. It marks itself `data-chapter-heading`, which
[`pnpm check:landing-pages`](../rules/a-landing-page-has-one-anatomy.md) reads.

| Surface                        | Reaches it through                                                                  | Glyph                       |
| ------------------------------ | ----------------------------------------------------------------------------------- | --------------------------- |
| Guide page, Fancast, best time | `SectionShell` (`components/marketing/editorial-ui.tsx`)                            | chapter number, `size="lg"` |
| Blog post `##`                 | the h2 renderer in `components/blog/blog-content.tsx`                               | chapter number              |
| Ride page chapters             | `PageSection` → `SectionHeading`; `ChapterHeading` directly for the history chapter | section icon                |
| Park page chapters             | `ChapterHeading`, mostly through `ChapterPanel`                                     | section icon                |
| `PageBottomSections`           | `NearbyHeading`, `FavoritesHeading`, `FeaturedParksHeading`                         | section icon                |

Under blog, news, glossary pages and every post, the three bottom blocks (nearby, favourites,
popular parks) use the watermark variant, unnumbered, and so do their skeletons and empty states.
The homepage stands them among its `tile` chapters.

`GlassSectionTitle` is not a chapter header; its one use is the nearby-parks list on the homepage,
an `<h3>` inside `NearbyChapter`, which opens that chapter itself. `SectionHeading`'s `plain`
variant (`as="h3"`) is what belongs **inside** a card: the rope-drop panel, the typical-waits block,
a city row on a country page.

## Variants

- **`variant="watermark"`** (default): the glyph at `text-primary/15` for a number, `/25` for an
  icon ([why](../rules/a-chapter-opens-the-same-way-everywhere.md)).
- **`variant="tile"`**: the homepage's chapters, the icon in a gradient plate (48 px on a phone,
  68 px from `sm`) with a pill kicker, because a `/25` icon cannot carry a chapter's identity alone.
- **`frosted`**: a full-width glass band (`TILE_GLASS`, `rounded-xl`), for park and ride pages
  over a photo.
- **`size="lg"`**: the editorial pages' larger title and numeral.

## Numbers

A number must not skip ([the rule](../rules/a-chapter-opens-the-same-way-everywhere.md)). What
that prevents: a render-time counter in a post restarts at each widget (01, 02, 01, 02); on park pages
`NearbyParksSection` renders nothing for 48 % of parks and the school-holiday warning shows for 6
of 27, so a fixed sequence would reach the reader with gaps.

## A streamed chapter renders its real heading

The requirement is in [the rule](../rules/a-chapter-opens-the-same-way-everywhere.md). A sized grey
box in place of `ParkBestDaysHeader` / `ParkStatsHeader` left the mobile header 66–120 px short and
the grid below absorbed the difference
([a streamed section owes the page its height](../rules/a-streamed-section-owes-the-page-its-height.md)).

## Phone sizes

Below `sm` the heading and the gap above it are one step smaller. A park page stacks 14
chapters, a ride page 7, the homepage 20, and at 390 px a two-line `text-2xl` title under a 40 px
glyph took 105 px. On a phone: the `md` title is `text-xl`, the watermark icon 28 px (the title's
line box, so a one-line heading is as tall as its text), the numeral `text-3xl`, the frosted band
`pt-2.5 pb-3`, the tile's plate 48 px and its title `text-2xl`. A chapter's top margin is `mt-6`
below `sm` and `mt-10` above, in all three places that set it: `ChapterPanel`, `PageSection`,
`AttractionHistoryPanel`. The panel body keeps `p-4`: `p-3` would save a fifth of what the heading
saves and put every panel's content 4 px from its border.

**Write the phone step as a `max-sm:` class added to the desktop value** (`mt-10 max-sm:mt-6`),
never a base value with an `sm:` over it. Call sites override the heading's spacing through
`className` (`ChapterPanel` passes `mb-0`, the trip planner `mb-5 pb-4`, the guide `mb-8 pb-5`),
and `twMerge` drops only the unprefixed class it conflicts with: a first draft wrote
`mb-4 sm:mb-6`, `mb-0` removed the `mb-4`, and every glued panel on a desktop kept a 24 px gap
between its band and its body. For the same reason the bottom margin has no phone step.
`ChapterPanel`'s `bodyPadding="none"` exists for the same trap: a `p-0` from the call site left the
`@min-[768px]/page:p-6` container variant in place (`pnpm test:chapter-panel-padding`).
