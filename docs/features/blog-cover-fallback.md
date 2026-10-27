# Blog cover fallback

What a post or news item without `coverImage` shows wherever a cover would go, and a park without a
photo in the parks menu: `BlogCoverFallback` (`components/blog/blog-cover-fallback.tsx`), the brand's
dark ground (`#0F1E28` → `#13293A`) with four lights in the logo's colours and the detailed pin
(`logo-dark.svg`) on top. Open this page before adding a new cover slot or changing the fallback.

## Where it renders

| Surface                                  | File                                      | `mark`                 |
| ---------------------------------------- | ----------------------------------------- | ---------------------- |
| Article banner                           | `components/blog/blog-post-banner.tsx`    | `side`                 |
| Blog card, under the glass               | `components/blog/blog-post-card-view.tsx` | `none`                 |
| Blog card, photo strip                   | same                                      | `center`, `ground` off |
| Phone row (`BlogPostRow`)                | same                                      | `center`               |
| News lists (`NewsList`, `NewsRow`)       | `components/blog/news-list.tsx`           | `center`               |
| `/blog` and `/news` streams, search hits | `components/blog/post-stream.tsx`         | `center`               |
| Most-read rows                           | `components/blog/most-read-row.tsx`       | `center`               |
| Header news panel, lead and rows         | `components/layout/news-menu-panel.tsx`   | `center`               |
| Header blog panel, lead and rows         | `components/layout/blog-menu-panel.tsx`   | `center`               |
| Parks menu, a counted park with no photo | `components/layout/parks-menu-panel.tsx`  | `center`               |
| New-posts toast, lead and fan            | `components/blog/new-posts-toast.tsx`     | `center`               |

Not here: the OG card (`lib/og/blog-og.tsx`) already draws a branded card with the title for a post
without a cover, and JSON-LD and the feed point at that card. There is no raster version of the
fallback.

## Why it is CSS and not an image file

A single 1200 × 630 picture with `object-fit: cover` fit no slot: in the banner the pin sat behind the
teaser, in the card only the pin's tip showed between the glass panels, and in an 88 px row it was too
small to recognise. So the component is a box the slot sizes, and `mark` says where the pin goes:

- `center`: the middle of the box, 64 % of its height.
- `side`: the banner, right of the headline column (`right 8% center`, 56 % of the height), only from
  `lg` (64rem) up; below that the headline runs full width, and on a phone the lower banner is under
  the section that pulls up into it (`HERO_FLOW_INTO_PULL`).
- `none`: the ground alone.

The card needs two pieces. Its ground covers the whole card so the frosted panels have something to
blur, and the pin goes into the photo strip between the panels, where a cover's `CardPhotoFrame` goes
([card photos are two layers](../rules/card-photos-are-two-layers.md)); a second ground in the strip
would not line up with the first, hence `ground={false}`. A coverless card opens its photo row like any
other, so cards in a grid keep one height.

Everything visual lives in `.blog-cover-fallback` in `app/globals.css`: the gradient layers, the three
hues, and the pin as a `::after` background image. An instance is one `<span>` with data attributes,
119 bytes of HTML and 137 of RSC payload, against 775 and 841 for an `<img>` plus an inline gradient;
the header panels are rendered, hidden, into every page, and a background image is not fetched while
its panel is `display: none`. The selectors are attribute selectors, never `:has()`
([rule](../rules/no-has-selector-in-the-stylesheet.md)).

## The hue

`coverFallbackHue(slug)` hashes the slug (FNV-1a) into `blue`, `green` or `cyan`, which swaps the four
lights, so two coverless news items side by side are not the same picture twice (which the
[media database rule](../rules/media-database.md) counts as worse than none). Lists carry the slug;
menus and the toast carry the post's path, and `slugFromPostPath` takes its last segment. A post
therefore has one hue across the banner, lists and menus of a locale; across locales the slug, and so
the hue, may differ. The ground is the same in both themes, as a photo would be.
