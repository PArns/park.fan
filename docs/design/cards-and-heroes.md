# Cards and heroes

The glass cards (park, ride, blog post), how they react to the pointer, how they become rows on a
phone, and the full-bleed heroes and landing-page heads around them. Open it before changing a
card, a card grid or a page head. Rules applied here:
[a blog card is a row on phones](../rules/a-blog-card-is-a-row-on-phones.md),
[card photos are two layers](../rules/card-photos-are-two-layers.md) and
[a landing page has one anatomy](../rules/a-landing-page-has-one-anatomy.md).

`ParkCard`, `AttractionCard` and `BlogPostCardView` are one object: a photo under two sheets of
frosted glass. The photo's framing (the strip between the panels, `CardPhotoFrame`) is in
[media database](../features/media-database.md).

## Pointer depth

`CardPointerFx` (`components/parks/card-pointer-fx.tsx`, mounted once in the locale layout) gives
every `[data-card-fx]` card two things on a real hover (`(hover: hover) and (pointer: fine)`): the
photo drifts a few pixels **against** the pointer, and a soft highlight (`.pk-card-fx::after`)
follows it. The drift is what makes the panels read as floating above the picture, and it is the
part CSS cannot do.

- **Never a transform on the card.** The card holds the two `backdrop-filter` panels; a transform
  makes it a backdrop root and the glass goes flat exactly while someone looks at it. The drift
  goes on the `<img>` inside `CardPhotoFrame`. Tailwind's `hover:-translate-y-1` on the card is
  safe: v4 compiles it to the standalone `translate` property, which Chromium does not treat as a
  backdrop root (panel detail 26.96 → 26.84, measured).
- **One delegated listener**, bound per frame only while a card is hovered.
- **The way home goes through the same `quickTo` setters.** `quickTo` keeps one tween per property
  and holds its last target; a separate `gsap.to(img, {x: 0, y: 0})` let both write every frame,
  and the photo snapped back to the pointer's last offset a beat after leaving.
- **The drift comes from the photo's headroom, per axis**: `(PHOTO_SCALE - 1) / 2` of each
  dimension (`PHOTO_SCALE` 1.05) is 12.1 px across but 6.0 px down on a real card, so a flat 7 px
  exposed the bleed layer under the photo. It uses 85 % of the room (`DRIFT_FRACTION`).
- **No blend mode on the highlight.** `mix-blend-mode: overlay` was the entire cost of the feature:

| sweeping one card, median frame | 1× CPU  | 4× CPU  |
| ------------------------------- | ------- | ------- |
| drift + highlight, blended      | 43.6 ms | 44.3 ms |
| drift + highlight, no blend     | 38.3 ms | 35.4 ms |
| drift only                      | 38.9 ms | 34.0 ms |
| neither (baseline)              | 39.4 ms | 36.2 ms |

Measure from inside the page: Playwright's `mouse.move` puts a CDP round trip between frames and
invented a 20 ms regression that was not there.

## Cards become rows on a phone

Below `sm` all three cards drop the photo. A post card then kept only its two panels, whose
`-mb-4`/`-mt-4` overlapped each other by 32 px over the excerpt, ~200 px for a title and a date. A
park card kept its content but in 146 px, one per row (nine on the Germany page). So below `sm`
neither card renders: a row does.

### The blog card row

| `BlogPostRow` (phone, `sm:hidden`)                 | panelled card (`hidden sm:grid`)                            |
| -------------------------------------------------- | ----------------------------------------------------------- |
| 96 × 64 thumbnail with the card's `objectPosition` | full photo row, 240/360 px                                  |
| category, title (3 lines), date · reading time     | category, title, excerpt, then date · reading time · author |

`BlogPostRow` is the `compact` variant the homepage's lead column already used, and it has **no
variants of its own**: a first version had a boxed three-line form where it replaced a card and a
bled two-line form in a list, and on the homepage (where below `lg` the lead post and the four
under it are all rows) the lead came out inset 8 px, boxed, with a reading time its neighbours
lacked.

### The park card row

`ParkCard` renders a row (`data-park-card-row`, `sm:hidden`) and the panelled card (`hidden
sm:grid`) inside the same `Link`, so every caller and grid gets it without a change:

| line     | content                                                       | height |
| -------- | ------------------------------------------------------------- | ------ |
| 1        | name, one line with an ellipsis; favourite star at the right  | 18 px  |
| 2        | city, country · distance                                      | 16 px  |
| 3        | `ParkStatusBadge`, `CrowdLevelBadge` (`min-h-[22px]`)         | 22 px  |
| 4        | `ParkCardScheduleFooter compact`, then "nearest open" as text | 16 px  |
| together | with the gaps, 8 px padding and a 1 px border                 | 100 px |

Four fixed lines, not three with the time beside the badges: beside „Geöffnet" and „Sehr niedrig"
the time does not fit at 360 px, and a line that wraps for some parks gave one list rows of
different heights. The badge line reserves 22 px because on region pages the badges arrive with
the client batch call. "Nearest open" is text because three badges wrap at 390 px. The thumbnail is
64 × 40 (the blog's 96 px would leave the badge line 204 px of the 228 two badges need) and appears
only when the park has a photo. `ParkCardNearbySkeleton` draws the same four lines.

### What both rows need

The first three are [the rule](../rules/a-blog-card-is-a-row-on-phones.md); here is where each
lives.

- **Two markups**: the panels' glass is inline styles (`background`, `backdropFilter`, two inset
  shadows).
- **The phone segment of `sizes`**: `96px` in `FEATURE_SIZES` / `CARD_SIZES`, `64px` in
  `CARD_PHOTO_SIZES`. Matching the row also makes both markups pick one srcset candidate.
- **The `gap-2` grids**: `BlogRelatedPosts`, the park, ride and glossary sections, and both halves
  of `LatestBlogSection`'s `lead`, whose gaps must agree or the lead detaches from its list. Card
  gaps (`gap-4`–`gap-6`) read as a stack of blocks.
- **A row grid drops the card track.** Park grids keep `[grid-auto-rows:auto_1fr_auto]` from `sm`
  up and switch to `max-sm:auto-rows-auto` below (as the ride list in `LandSection` does): in one
  column a `1fr` track sizes every row to the tallest, so one park with a third badge gave every
  row 40 px of empty space.

## Full-bleed heroes on a phone

Six page heads open on a full-bleed photo (`relative isolate -mt-12 flex min-h-[Nvh]
overflow-hidden`): `LandingHero` on the guide, Fancast, the best-travel-time hub, the trip planner
and the blog index (78vh), and `BlogPostBanner` on an article (58vh, 66vh from `sm`). On a phone
each spent the whole first screen on one picture and a title. With `flowInto`, below `sm` the
headline moves to the **top** and the page pulls its first section up over the lower photo; the
image keeps every pixel and usually grows. First content at 390 px: guide 782 → 550 (on its
former 86vh hero), Fancast 722 → 533, best time 714 → 553, blog index 658 → 482, article
594 → 554. Desktop is unchanged; all of it is `sm`-gated.

- **The tint moves with the headline.** The fade runs upward because text used to sit at the
  bottom, so `flowInto` adds its mirror over the top third, phones only.
- **The overlap is safe by construction** ([the rule](../rules/a-blog-card-is-a-row-on-phones.md)):
  `HERO_FLOW_INTO_PULL` (`-mt-44`, 176 px) against the hero's mobile `pb-48` (192 px), the pull
  measured from the hero's bottom. Hand-tuned, the German tagline ran 10 px past the first
  card at 360 px while French had 117 px to spare; by construction the minimum over six locales ×
  320/360/390/430 px is 16 px. The pulled section needs `relative`, or it renders under the
  `isolate` hero. `HERO_CREDIT_POSITION` moves the photo credit above the pulled section.
- **No scroll cue on a phone**: it points at content already on screen.

**The article page** pays the same bill one screen down. `BlogPostBanner`'s `pt-32` clears the
floating header and framed nothing on a phone (the banner is content-driven there), so it is
`pt-20` below `sm`. The table of contents is `hidden lg:block`: in a sidebar it navigates, on a
phone it was **998 px** of chapter links before the first sentence. The trade, still open, is that
a phone reader cannot jump between chapters (the markup still ships, so anchors stay in the HTML).

## Landing-page heads and next steps

`LandingHero` and `LandingNextSteps` (`components/marketing/editorial-ui.tsx`) are the two ends of
every landing page ([concept](../product/landing-pages.md)). The hub head is the photo hero above
(`pt-32`, H1 `text-4xl sm:text-6xl`, `data-landing-hero="hub"`); `variant="compact"` for tool pages
has no photo, no scroll cue and no minimum height, stays in flow under the sticky header without
`-mt-12` and starts `pt-8 sm:pt-12` (H1 `text-3xl sm:text-4xl`, `data-landing-hero="compact"`).
Both take an `aside` (a second column from `lg`, nothing below; the guide's `WaitSign`) and an
`action`, the page's one primary button. Kicker, tagline, stat labels and the scroll label are
messages (`landing.*`). `LandingNextSteps` takes one to three destinations, the first as the
primary button, as a full-width band (hubs) or with `surface="chapter"` as a frosted chapter (park
audience pages).
