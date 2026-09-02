# Design System

## Overview

The park.fan frontend uses Tailwind CSS v4 with CSS custom properties (oklch), shadcn/ui components, and a glassmorphism-style theme. All color tokens are defined in `app/globals.css`.

---

## Brand Palette

| Name          | Hex       | oklch                        | Usage                                          |
| ------------- | --------- | ---------------------------- | ---------------------------------------------- |
| **Blue**      | `#2191D3` | `oklch(0.628 0.137 241.275)` | `--primary`, `--ring`, buttons, focus, borders |
| **Navy**      | `#293B47` | `oklch(0.342 0.031 238.086)` | Reserved (dark bg candidate)                   |
| **Green**     | `#51CC64` | `oklch(0.752 0.181 146.391)` | Close to `--status-operating`                  |
| **Off-white** | `#FCFCFC` | `oklch(0.991 0 0)`           | `--primary-foreground`, text on primary        |

### Applying brand blue in Tailwind

Because `--color-primary` is registered in `@theme inline`, all Tailwind color utilities are available with opacity modifier support:

```
bg-primary          bg-primary/15       bg-primary/30
text-primary        border-primary/40   ring-primary/20
shadow-primary/10
```

---

## CSS Variables (`app/globals.css`)

### Base Colors

| Variable               | Light mode                      | Dark mode                       |
| ---------------------- | ------------------------------- | ------------------------------- |
| `--background`         | `oklch(1 0 0)` (white)          | `oklch(0.145 0 0)` (near-black) |
| `--foreground`         | `oklch(0.145 0 0)`              | `oklch(0.985 0 0)`              |
| `--card`               | `oklch(1 0 0)`                  | `oklch(0.205 0 0)`              |
| `--primary`            | `oklch(0.628 0.137 241.275)` 🔵 | `oklch(0.628 0.137 241.275)` 🔵 |
| `--primary-foreground` | `oklch(0.991 0 0)`              | `oklch(0.991 0 0)`              |
| `--ring`               | `oklch(0.628 0.137 241.275)` 🔵 | `oklch(0.628 0.137 241.275)` 🔵 |
| `--muted-foreground`   | `oklch(0.556 0 0)`              | `oklch(0.708 0 0)`              |

### Status Colors

Registered in `@theme inline` as `--color-status-*` → Tailwind generates `bg-status-*`, `text-status-*`, `border-status-*` with `/opacity` support.

| Variable                 | Light                           | Dark                            |
| ------------------------ | ------------------------------- | ------------------------------- |
| `--status-operating`     | `oklch(0.53 0.21 142.136)` 🟢   | `oklch(0.792 0.209 151.711)` 🟢 |
| `--status-down`          | `oklch(0.705 0.213 47.604)` 🟠  | `oklch(0.78 0.188 56.113)` 🟠   |
| `--status-closed`        | `oklch(0.556 0 0)` ⚫           | `oklch(0.708 0 0)` ⚫           |
| `--status-refurbishment` | `oklch(0.623 0.214 259.815)` 🔵 | `oklch(0.707 0.165 254.624)` 🔵 |

### Crowd Level Colors

Registered in `@theme inline` as `--color-crowd-*` → same Tailwind utility generation as status.

| Variable            | Light                          | Dark (brighter)        |
| ------------------- | ------------------------------ | ---------------------- |
| `--crowd-very-low`  | `oklch(0.52 0.14 192)` teal    | `oklch(0.76 0.16 192)` |
| `--crowd-low`       | `oklch(0.65 0.19 158)` emerald | `oklch(0.84 0.16 158)` |
| `--crowd-moderate`  | `oklch(0.68 0.18 142)` green   | `oklch(0.84 0.15 142)` |
| `--crowd-high`      | `oklch(0.68 0.18 55)` orange   | `oklch(0.82 0.16 55)`  |
| `--crowd-very-high` | `oklch(0.58 0.22 15)` rose     | `oklch(0.78 0.18 15)`  |
| `--crowd-extreme`   | `oklch(0.52 0.22 27)` red      | `oklch(0.72 0.2 27)`   |

### Semantic Colors

Manual `@layer utilities` (not in `@theme inline`, no opacity modifier):

- `--success` / `--success-foreground`
- `--error` / `--error-foreground`
- `--warning` / `--warning-foreground`
- `--trend-up`, `--trend-down`, `--trend-stable`

---

## Theme: dark by default, light on request

park.fan is a **dark site**. `ThemeProvider` runs `defaultTheme="dark"` with `enableSystem={false}`,
so every visitor gets dark on every device and light is something they opt into. Following the OS
would make the site dark for some people and light for others by accident, which is the opposite
of having a default — and it is why the old three-way light/dark/system menu is gone. A browser
still holding `system` from that menu is moved to dark on its next visit (`ThemeToggle`), stray
class included: next-themes writes `system` onto `<html>` as if it were a theme name, and adding
`dark` does not take it back off.

`viewport.themeColor` is a single value for the same reason. It used to be a `prefers-color-scheme`
pair, which would now tint the browser chrome by something that has nothing to do with what the
page looks like.

The switch itself splits motion the way the rest of the codebase does: **CSS owns the state** (the
knob's position is a class, so a failed GSAP chunk still visibly switches), **GSAP owns the
flourish** — the icon spins through the change and the incoming theme opens out of the switch as a
disc that covers the viewport before the colours flip, then lifts off the newly themed page
(`lib/theme/theme-wipe.ts`). While it covers, the park.fan lockup sits in the middle of it — the
one moment the whole viewport belongs to us. It is centred on the VIEWPORT, not on the disc, whose
centre is the switch up in the corner, and it is capped with `clamp()` so it stays the same size
on a 2560 screen as on a 1680 one. The artwork is the variant for the INCOMING theme (`-dark` is
the light-ink file), and all four files are already in the header on every page, so it comes out
of the cache rather than fetching mid-animation.

Measured end to end: overlay up at 4 ms, theme flips at 569 ms, overlay gone at 1160 ms — the
lockup is fully legible for roughly 400 ms of that. The disc is a scaled element, not an animated `clip-path`: a transform
composites on the GPU and interpolates as a plain number, a `circle()` radius inside a `clip-path`
string does neither. Under `prefers-reduced-motion`, or if the import fails, the theme still
changes — `apply` is called exactly once on every path through that module.

---

## Pointer depth on the cards

`CardPointerFx` (mounted once per page) gives every `[data-card-fx]` card two things on hover: the
photo drifts a few pixels **against** the pointer, and a soft highlight follows it across the card.
The drift is the whole idea — moving the picture while the frosted panels hold still is what makes
them read as floating above it rather than printed on it, and it is the one part CSS cannot do,
because it needs the pointer's position.

Three constraints it works under:

- **Never a transform on the card.** The card carries the two `backdrop-filter` panels; a transform
  on it would make it a backdrop root for as long as the pointer was inside, and the glass would go
  flat exactly while somebody is looking at it. The drift goes on the `<img>` inside
  `CardPhotoFrame`, which filters nothing. Tailwind's own `hover:-translate-y-1` on the card is
  safe — v4 compiles it to the standalone `translate` property, which Chromium does not treat as a
  backdrop root (measured: the panel's backdrop detail holds at 26.96 → 26.84).
- **One delegated listener**, not one per card, and the per-frame work is bound only while a card
  is actually hovered. It is mounted in the locale layout, so cards behave the same on the
  homepage, the geo pages, a park's attraction grid and the blog index.
- **The way home goes through the same `quickTo` setters.** `quickTo` keeps one persistent tween
  per property and holds its last target; a separate `gsap.to(img, {x: 0, y: 0})` does not replace
  it, so both write every frame, the return looks right, and the instant it finishes the quickTo
  re-asserts the old offset. That was the photo snapping back a beat after the pointer left —
  and snapping differently depending on which edge you left by, because the held value is wherever
  the pointer last was.
- **The drift is derived from the photo's headroom, per axis.** `(PHOTO_SCALE - 1) / 2` of each
  dimension is 12.1 px across but only 6.0 px down on the real card, so a flat 7 px drift pushed
  the picture past its own top edge and exposed the bleed layer underneath — reflection and all.
  It uses 85 % of the measured room now, which stays correct at any card size.
- **No blend mode on the highlight.** `mix-blend-mode: overlay` looked richer and _was the entire
  cost of the feature_.

| sweeping one card, median frame | 1× CPU  | 4× CPU  |
| ------------------------------- | ------- | ------- |
| drift + highlight, blended      | 43.6 ms | 44.3 ms |
| drift + highlight, no blend     | 38.3 ms | 35.4 ms |
| drift only                      | 38.9 ms | 34.0 ms |
| neither (baseline)              | 39.4 ms | 36.2 ms |

Without the blend mode the whole effect sits inside the baseline's noise. **Measure this from
inside the page** if you touch it: driving the pointer with Playwright's `mouse.move` puts a CDP
round trip between frames and invented a 20 ms regression that was not there.

## The blog card is a row on phones

`ParkCard`, `AttractionCard` and `BlogPostCardView` are the same object: a photo with two sheets of
frosted glass over it, and below `sm` all three drop the photo so the card collapses onto its
panels. For a park that leaves a name, a status badge and a wait time, which is the card's whole
content. For a post it leaves the two panels and nothing between them — and the `-mb-4`/`-mt-4`
they use to lay over the picture then overlap **each other** by 32 px, so the last line of the
excerpt is painted over by the panel below it. About 200 px of card, for a title and a date, with
the cover the post was picked for hidden and the excerpt cut off mid-sentence.

So below `sm` the card is not rendered at all. `BlogPostRow` is:

|        | phone                                          | `sm` and up                                                 |
| ------ | ---------------------------------------------- | ----------------------------------------------------------- |
| markup | `BlogPostRow` (`sm:hidden`)                    | the panelled card (`hidden sm:grid`)                        |
| cover  | 96 × 64 thumbnail                              | full photo row, 240/360 px                                  |
| text   | category, title (3 lines), date · reading time | category, title, excerpt, then date · reading time · author |

It is the same component the `compact` variant already was — the list beside the homepage's lead
post. The thumbnail takes the card's `objectPosition`, so a focal point tuned in the admin holds at
96 × 64 too.

**And it has no variants of its own.** The first version had two: a border and a three-line title
where the row replaced a card, an `-mx-2` bleed and two lines where it sat in a list, reading time
only in the first. On the homepage those two meet — below `lg` the lead post is a row and so are
the four under it — and the lead came out inset by 8 px, boxed, and carrying a reading time its
neighbours did not have. One row, one look; what the surrounding list wants is the list's business.

**The gap belongs to the same decision.** The grids that hold these cards were spaced for cards
(`gap-4` to `gap-6`); at that distance a column of rows reads as a stack of separate blocks rather
than one list. They go to `gap-2` below `sm` and keep their own spacing from `sm` up —
`BlogPostGrid`, `BlogRelatedPosts`, the park/ride and glossary sections, and both halves of
`LatestBlogSection`'s `lead`, whose two gaps have to agree or the lead post detaches from its list.

**Two markups, not one responsive tree.** The panels' glass is a block of inline styles
(`background`, `backdropFilter`, the two inset shadows), and no breakpoint can switch an inline
style off — expressing it as CSS a media query could reach would mean moving the park and ride
cards' panels with it.

**The hidden card must not preload a cover nobody sees.** Both photo layers claim `96px` for the
phone segment of their `sizes` (`FEATURE_SIZES` / `CARD_SIZES`), which is what the row beside them
actually paints. Left at `100vw`, a card marked `priority` — the first one in `BlogPostGrid` —
preloaded a full-width cover for a `display:none` element on exactly the connection that could
least afford it. Matching the row's `sizes` also means both elements pick the same srcset
candidate, i.e. one request, not two.

### The article page's own phone budget

Same page, one screen down. Measured on a 390 px phone before this:

|                            | before                                                      | after        |
| -------------------------- | ----------------------------------------------------------- | ------------ |
| banner                     | 642 px, of which **128 px** is empty photo above the kicker | 578 px       |
| space above the breadcrumb | 32 px, around a 30 px pill                                  | 16 px        |
| table of contents          | **998 px** between the breadcrumb and the first sentence    | not rendered |
| article's first word at    | 782 px                                                      | 698 px       |

The banner's `pt-32` is clearance for the 48 px header floating over the cover, and it framed
nothing: the banner is content-driven there (642 px against a 490 px `min-h`), so the padding was
height. It halves to `pt-20 pb-10` below `sm` and keeps `pt-32 pb-20` above.

The table of contents is `hidden lg:block` now. In the sidebar it is navigation; on a phone it is a
full screen of chapter links a reader has to scroll past to reach the article, on every post. The
two panels under it in that `<aside>` were already `hidden lg:block`, so nothing else was lost —
but a phone reader now has no way to jump between chapters, which is the trade to revisit if the
posts get longer. The markup still ships (it is `display:none`, not removed), so the anchors stay
in the HTML.

### Full-bleed heroes flow into the page on phones

Five pages open on a full-bleed photo header — `relative isolate -mt-12 flex min-h-[Nvh] items-end
overflow-hidden` — and on a phone every one of them spent the whole first screen on one picture and
a title. The picture is not the problem; losing the screen to the empty half of it is. So below
`sm` the headline moves to the **top** and the page pulls its own first section up over the lower
part of the photo. **The image keeps every pixel of its height** — in fact it usually gets taller,
because the hero's mobile bottom padding grows.

| page             | header                           | first content, 390 px |
| ---------------- | -------------------------------- | --------------------- |
| guide            | `min-h-[86vh]`, `GuideHero`      | 782 → **550**         |
| Fancast          | `min-h-[78vh]`, shared `Hero`    | 722 → **533**         |
| best travel time | `min-h-[78vh]`, shared `Hero`    | 714 → **553**         |
| blog index       | `min-h-[78vh]`, shared `Hero`    | 658 → **482**         |
| blog article     | `min-h-[58vh]`, `BlogPostBanner` | 594 → **554**         |

The shared `Hero` takes it as a `flowInto` prop, because it is used by three pages; `GuideHero` and
`BlogPostBanner` are one page each and carry it directly. Desktop is untouched everywhere — the
alignment, the padding and the pull are all `sm`-gated, and the section after each hero still starts
exactly at the hero's bottom edge.

Three things it has to do, and each fixed something real:

- **The tint has to move with the headline.** The existing fade runs _upward_ (`to-background/20`
  at the top) because the text used to sit at the bottom. At the top the headline would land on the
  one part of the photo that is barely tinted, so `flowInto` adds the mirror of that fade over the
  top third, phones only, leaving the middle of the picture a picture.
- **The overlap is safe by construction, not by measurement.** `HERO_FLOW_INTO_PULL` (`-mt-44`,
  176 px) pairs with the hero's own mobile `pb-48` (192 px) and **the padding must stay larger than
  the pull**. The hero is `max(78vh, content + padding)` tall and the pull is measured from its
  bottom edge, so a long headline grows the hero and carries the pulled-up section down with it —
  192 − 176 = 16 px of clearance, in every language at every width. Hand-tuned it was wrong
  immediately: at 360 px the German tagline ran **10 px past** the first card while French had
  117 px to spare. Measured after the fix, the minimum across six locales × 320/360/390/430 px is
  16 px and never negative.
- **The scroll cue goes.** It points at content that is already on screen. (The article banner never
  had one.)

The section doing the pulling needs `relative` — the hero is `isolate`, and without it the content
renders under the photo.

## Chapter headings

One component opens every chapter on the site: `ChapterHeading`
(`components/common/chapter-heading.tsx`). An oversized translucent glyph on the left, an optional
kicker, the title, and the rule that closes it.

| Surface                        | Renders it through                        | Glyph                       |
| ------------------------------ | ----------------------------------------- | --------------------------- |
| Guide page, Fancast, best-time | `SectionShell` (`marketing/editorial-ui`) | chapter number, `size="lg"` |
| Blog post `##`                 | `blog-content.tsx` h2 renderer            | chapter number              |
| Ride page chapters             | `PageSection` → `SectionHeading`          | section icon                |
| Park page chapters             | `ChapterHeading` directly                 | section icon                |

Before this there were five. A park page carried `text-xl font-semibold` with an icon, `text-xl
font-bold` with an icon, a `text-2xl` frosted pill, a bare `<h2 class="text-xl font-bold">` and
`GlassSectionTitle`, and nothing in the page told a reader which of them opened a chapter and
which labelled a card inside one. `GlassSectionTitle` is still in use and is not a chapter header:
it labels a band _inside_ a page — the homepage favourites, the nearby-parks list and its
skeleton.

Three things the component decides, so a call site cannot get them wrong:

- **The number, where there is one, must not skip.** A blog post's chapter numbers come from
  `extractToc(markdown)`, not from a counter incremented while rendering: the body is split into
  one `<ReactMarkdown>` per widget fence, so a render-time counter restarts at every widget and
  numbers one post 01, 02, 01, 02. Park and ride chapters get **no** number at all for the same
  reason — `NearbyParksSection` renders nothing for 48 % of parks and the school-holiday warning
  for 6 of 27, so a fixed sequence would arrive at the reader with gaps in it.
- **An icon standing in for the number is drawn at `/25`, not `/15`.** The numeral is a solid
  glyph and still reads at 15 % opacity; a hairline Lucide icon at the same value disappears.
- **`frosted` is a full-width band, not a `w-fit` pill.** Park and ride pages render over an
  arbitrary background photo, and a watermark glyph over the bright part of one is unreadable. The
  band is `rounded-t-xl` and the heading's own `border-b` closes it, so the rule doubles as the
  band's lower edge.

The heading's height moves when a title wraps, which on the park page happens per locale and per
breakpoint. Both streamed chapters therefore render **the real heading** in their loading state —
`ParkBestDaysHeader` and `ParkStatsHeader` are their own files precisely so the placeholder can
mount them, with only the data-dependent hint line replaced by a `Skeleton`. A sized grey box in
their place left the mobile header 66–120 px short and the whole grid below absorbed the
difference. See [system-overview](../architecture/system-overview.md#5-a-streamed-section-owes-the-page-its-height-requirement).

`SectionHeading`'s `plain` variant is untouched and is still the right choice **inside** a card
(the rope-drop panel, the typical-waits block, a city row on a country page) — a chapter header
nested in a chapter's own content is what the split is for.

---

## Section reveals

`.pk-reveal` is a scroll-driven CSS animation (`animation-timeline: view()`), not the older
`<Reveal>` component. `<Reveal>` renders `opacity-0` and needs an IntersectionObserver to bring it
back, so with JavaScript blocked its content stays invisible; a `view()` timeline degrades the
other way — a browser without support just shows the section. It fills `backwards`, so nothing
lingers afterwards.

It only goes on sections that contain **no glass**. During the entry range the transform is real,
and any `backdrop-filter` underneath would flatten for the length of the reveal — which is why the
ML-stats and live-activity sections are deliberately left out (both nest `GlassCard`s), and card
grids get their pointer effects instead.

---

## Badge Pattern

**All badges use the soft pattern** — semi-transparent background + colored text, works in light and dark mode without separate overrides:

```tsx
// Status badge
'bg-status-operating/15 text-status-operating';
'bg-status-down/15 text-status-down';
'bg-status-closed/15 text-status-closed';
'bg-status-refurbishment/15 text-status-refurbishment';

// Crowd badge
'bg-crowd-very-low/15 text-crowd-very-low';
'bg-crowd-low/15 text-crowd-low';
// ... etc.
```

Components: `CrowdLevelBadge` (`components/parks/crowd-level-badge.tsx`), `ParkStatusBadge` (`components/parks/park-status-badge.tsx`).

> **`--status-operating` is pinned at lightness 0.53 for contrast, not for looks.** It is
> routinely used as small text ("N offen", live wait labels), and at 0.55 it measured 4.39:1 on
> white — every one of those strings missed AA by a hair. 0.53 is 4.74:1 and reads as the same
> green. Do not lighten it back without re-measuring the small-text cases.

---

## Glassmorphism Utilities (`@layer utilities`)

| Class                | Background         | Border      | Blur               |
| -------------------- | ------------------ | ----------- | ------------------ |
| `.glass-light`       | `bg-background/40` | `border/30` | `backdrop-blur-sm` |
| `.glass`             | `bg-background/60` | `border/40` | `backdrop-blur-md` |
| `.glass-strong`      | `bg-background/80` | `border/50` | `backdrop-blur-lg` |
| `.glass-heavy`       | `bg-background/90` | `border/60` | `backdrop-blur-xl` |
| `.glass-card`        | `bg-card/60`       | `border/40` | `backdrop-blur-md` |
| `.glass-card-strong` | `bg-card/80`       | `border/50` | `backdrop-blur-lg` |

---

## Search Dialog

The `CommandDialog` in `components/ui/command.tsx` uses brand blue throughout:

- **Outer border**: `border-primary/30`
- **Shadow ring**: `0_0_0_1px_rgba(33,145,211,0.2)` + blue top highlight
- **Input area**: `border-b border-primary/20 bg-primary/[3%]`
- **Footer**: `border-t border-primary/20 bg-primary/[3%]`
- **Selected item**: `bg-primary/15`

---

## Header geometry

The bar is **48 px** (`h-12` on `<header>`, plus the 1 px border it draws itself, so 49 px in the
document). It used to be 56 px and read heavier than anything in it deserved.

Four numbers have to move together, and three of them live outside the header file:

| Where                                                                                                    | What                                                                                     |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `components/layout/header.tsx`                                                                           | `h-12` on `<header>`; the inner container is `h-full`, never a second copy of the number |
| `app/[locale]/layout.tsx`                                                                                | the `<Suspense>` fallback that reserves the bar while the client `Header` streams in     |
| `app/[locale]/page.tsx`, `components/blog/blog-post-banner.tsx`, `components/marketing/editorial-ui.tsx` | `-mt-12` — the three heroes the header floats over                                       |

Get the fallback wrong and every page starts with a shift of the difference; get a `-mt-` wrong and
the hero leaves a gap or eats the bar.

### What sits in it

| Element                     | Height | Of the bar |
| --------------------------- | -----: | ---------: |
| logo lockup (`BrandLockup`) |  24 px |       50 % |
| search field, `lg` and up   |  32 px |       67 % |
| search button, below `lg`   |  36 px |       75 % |
| locale switcher             |  32 px |       67 % |
| burger, below `md`          |  36 px |       75 % |
| theme toggle                |  28 px |       58 % |
| nav links (text)            |  20 px |       42 % |

Sizes come off the button scale in `components/ui/button.tsx` (`sm` 32 / default 36 / `lg` 40), not
out of the air. The old bar put the **largest** of them — a 40 px search field, the `lg` size — in
the smallest row in the app, at 71 % of a 56 px bar; the field is `sm` now and the bar keeps 8 px of
air above and below it. `.touch-target` (44 px) is the floor for anything that is only a tap target;
the two 36 px controls below `lg` are the same box as each other, which they were not before (40
against 36).

For the outside view: Material 3's small top app bar is 64 dp, and the general advice for a
**sticky** bar is to stay under about 60 px on desktop and 50 on mobile, since it costs that much
of every viewport for the whole visit. 48 px sits under both, and the reference bars that look
calm — Tailwind's own site, shadcn/ui — run a ~24 px lockup in a 56–64 px bar, i.e. the mark takes
40–50 % of the row. Ours took 64 %.

### One lockup, two copies

On a hero page the header renders the lockup **twice**: parked in the corner while the bar is
transparent, in the flex flow once it solidifies. The two cross-fade while sliding onto each other,
and that only reads as one object moving if they are congruent.

They were not. The bar carried `h-7 md:h-9` + `h-5 md:h-6` + `gap-0.5`, the corner `h-6` + `h-5` +
`gap-1`, so the handoff measured `logoScale = 24/36 = 0.667` and ran a 1.5× scale under the slide.
A single factor cannot reconcile a pin:wordmark ratio of 36:24 against 24:20, so the copies never
met: measured at 1440, 98.1 px wide against 82.7 px at the top and 147.2 px against 122.2 px once
solid. They were 0.5 px apart vertically as well, because the in-flow copy was centred on a
hard-coded `h-14` box while the corner copy was centred on the header's 55 px content box.

Both render `components/layout/brand-lockup.tsx` now — pin 26 px, wordmark 19 px, `gap-2`, defined
once. `logoScale` resolves to 1.000 and the handoff is a pure translate; sampled per animation
frame, the two boxes agree to 0.0 px on all four edges the whole way across. The scale stays in the
formula as the safety net it was meant to be, with nothing left to correct.

### A height is the mark's height

Those numbers used to describe a box the mark sat somewhere inside. `logo-small.svg` was a 144×144
**square** with the pin filling 86.3 % of its height and 62.5 % of its width; `parkfan.svg` a
2304×657 box with the wordmark on 78.1 % of the height. So `h-6` painted a **20.7 px** pin and
`h-5` a **15.6 px** wordmark: a lockup covering 43 % of a 48 px bar while every number in the
component said 50 %, and a fifth of the device pixels the layout had already reserved going to
transparent artwork. On a 1× display that is what the difference between a mark and a smudge is
made of — and it is invisible from the call site, which is the reason it survived.

The viewBox of all four files is the **measured ink box** now (rendered at 6000 px, alpha walked,
`fill = 100.00 %`, offset 0.00), so a height means what it says:

| | aspect | header |
| --- | --- | --- |
| pin (`logo-small*.svg`) | 0.7248 | 26 px → 18.8 px wide |
| wordmark (`parkfan*.svg`) | 4.2080 | 19 px → 80.0 px wide |

The 1.37 between them is the ratio the padded files actually rendered (20.7 : 15.6 = 1.32), so the
lockup keeps its proportions and only stops being small.

The gap moved with it. It was `gap-1` plus the ~4.5 px of empty artwork the pin carried on its
right — an optical ~8.5 px that scaled with the pin's height and that no call site could see. It is
`gap-2` in the header, and the same margin is written down where the other three consumers used to
inherit it: `lib/theme/theme-wipe.ts` (which had `gap:0` precisely because the file carried one),
the coaster player's watermark and the footer. Those three keep the size they had — only the header
grew.

Cropping the artwork does **not** by itself make anything sharper: 20.7 px of ink is 20.7 px of ink
whatever box is drawn around it. It is what lets the size be raised without a magic number at every
call site, and it is why `pnpm check:icons` had to be re-run: the generator measures ink, so the
icons are geometrically unchanged, but it now rasterizes the source at a different resolution to do
it and the placement moves by a fraction of a pixel.

### The footer's pin is cut from the lockup

The footer draws the **detailed** pin — the orbit and the three bars, the mark the OG images and
the maintenance page show — and until Sep 2026 it drew it as a 1563×1116 PNG wrapped in an `<svg>`,
77 KB per colourway. Nothing looked wrong at the 32 and 48 px it is asked for, which is exactly how
it lasted: a raster with enough resolution for today's largest call site fails silently the first
time somebody draws it bigger.

`scripts/generate-brand-pin.mjs` cuts it out of `logo-big*.svg` instead — **6.2 KB** each, −142 KB
across the pair. It is generated rather than hand-exported for the reason the icon set is: the pin
is one drawing that would otherwise be stored twice, and a re-exported lockup would leave the copy
behind with nothing failing. `pnpm check:brand-pin` is what notices.

The split needs no heuristic. Affinity names the halves — `<g id="park.fan">` is the wordmark,
`<g id="Icon">` the pin — so the wordmark goes by id, and `_Linear1` (its green dot, referenced
nowhere else) goes with it. Everything else stays exactly where it is, enclosing transforms
included; the one computed value is the `viewBox`, and it is the measured ink box, so the footer's
`h-8 md:h-12` means 32 and 48 px of mark. The proof that it is the same drawing is the aspect:
**0.8201** against the raster's **0.8202**.

The `.png` twins are deliberately untouched and keep the old padded geometry, which is what
`lib/og/brand-mark.tsx` and `lib/three/park-scene.ts` have hard-coded.

---

## Interactive Utilities

- `.interactive-card` – `hover:border-primary/50 transition-all hover:shadow-lg`
- `.touch-target` – `min-h-[44px] min-w-[44px]`

---

## Related

- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Glass UI Crenspire](https://glass-ui.crenspire.com) — additional glass components in `components/ui/glass/`
