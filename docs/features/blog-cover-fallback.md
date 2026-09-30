# Blog cover fallback

A blog post or news item without `coverImage` gets `BlogCoverFallback`
(`components/blog/blog-cover-fallback.tsx`) everywhere a cover would go: the brand's dark ground
(`#0F1E28` → `#13293A`) with four lights in the logo's colours, and the detailed pin
(`logo-dark.svg`) on top. It was picked from five proposals on 2026-09-30 ("A", the gradient).

Before it, each surface did something of its own with a missing cover: the banner drew a pale
`from-primary/15` wash, the card a grey `from-muted to-card` gradient, the toast a newspaper icon,
and every list and both header panels drew no thumbnail at all, so a coverless news item was a
differently shaped row than its neighbours.

## Where it renders

| Surface                           | File                                      | Box                       | `mark`                 |
| --------------------------------- | ----------------------------------------- | ------------------------- | ---------------------- |
| Article banner                    | `components/blog/blog-post-banner.tsx`    | full bleed, 58–66 vh      | `side`                 |
| Blog card, under the glass        | `components/blog/blog-post-card-view.tsx` | the whole card            | `none`                 |
| Blog card, photo strip            | same                                      | 240 px (360 px featured)  | `center`, `ground` off |
| Phone row (`BlogPostRow`)         | same                                      | 96 × 64                   | `center`               |
| News list (`NewsList`, `NewsRow`) | `components/blog/news-list.tsx`           | 112 × 70                  | `center`               |
| `/news` stream                    | `components/blog/news-index-page.tsx`     | 160 × 100 (96 × 60 phone) | `center`               |
| Header news panel, lead and rows  | `components/layout/news-menu-panel.tsx`   | 16:9 lead, 88 × 55 rows   | `center`               |
| Header blog panel, lead and rows  | `components/layout/blog-menu-panel.tsx`   | 16:9 lead, 128 × 80 rows  | `center`               |
| New-posts toast                   | `components/blog/new-posts-toast.tsx`     | 112 × 70                  | `center`               |

Not here: the OG card (`lib/og/blog-og.tsx`) already draws a branded card with the title for a post
without a cover, and JSON-LD and the feed point at that card. There is no raster version of the
fallback.

## Why it is CSS and not an image file

The first version was one 1200 × 630 picture, put into every slot with `object-fit: cover`. It fit
none of them: in the banner the pin sat behind the teaser, in the card (aspect ≈ 0.9, cropped from
the centre) only the pin's tip showed between the two glass panels, and in an 88 px row it was too
small to recognise. So the component is a box that the slot sizes, and `mark` says where the pin
goes:

- `center` — the middle of the box, 64 % of its height.
- `side` — the banner: right of the headline column (`right 8% center`, 56 % of the height), and
  only from `lg` (64rem) up. Below that the headline runs the full width, and on a phone the lower
  part of the banner is under the section that pulls up into it (`HERO_FLOW_INTO_PULL`).
- `none` — the ground alone.

The card is the one surface that needs two pieces. Its ground covers the whole card so the frosted
panels have something to blur, and the pin goes into the photo strip between the panels, where a
cover's `CardPhotoFrame` goes ([card photos are two layers](../rules/card-photos-are-two-layers.md)).
A second ground in the strip would not line up with the first at its edges, hence `ground={false}`.
A coverless card now opens its photo row like any other (240 px, 360 px featured), so cards in a
grid keep one height.

Everything visual lives in `.blog-cover-fallback` in `app/globals.css`: the six gradient layers, the
three hues, and the pin as a `::after` background image. An instance is one `<span>` with two data
attributes, 119 bytes of HTML and 137 of RSC payload. The same thing as an `<img>` plus an inline
gradient counts 775 and 841, and the header panels are rendered, hidden, into every page. A background
image is also not fetched while its panel is `display: none`. The selectors are attribute
selectors, never `:has()` ([rule](../rules/no-has-selector-in-the-stylesheet.md)).

## The hue

`coverFallbackHue(slug)` hashes the slug (FNV-1a) into `blue`, `green` or `cyan`, which swaps the
four lights. Two coverless news items next to each other would otherwise be the same picture twice,
which the [media database rule](../rules/media-database.md) counts as worse than none. The slug is
what every surface has: the lists carry it, the menus and the toast carry the post's path, and
`slugFromPostPath` takes its last segment. So a post has the same hue in the banner, the lists and
the menus of one locale. Across locales the slug differs, and so may the hue.

The ground is the same in both themes, as a photo would be.
