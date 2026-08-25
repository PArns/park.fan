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

Both render `components/layout/brand-lockup.tsx` now — pin 24 px, wordmark 20 px, `gap-1`, defined
once. `logoScale` resolves to 1.000 and the handoff is a pure translate; sampled per animation
frame, the two boxes agree to 0.0 px on all four edges the whole way across. The scale stays in the
formula as the safety net it was meant to be, with nothing left to correct.

`logo-small.svg` is a 144×144 **square** with the pin drawn inside it, filling 86 % of the box
height and 62.5 % of its width. So 24 px of box is ~20.7 px of visible pin with ~4.5 px of empty
space on either side, and `gap-1` on top of that reads as a ~10.7 px optical gap — which is why the
lockup looks right at a gap that measures small.

---

## Interactive Utilities

- `.interactive-card` – `hover:border-primary/50 transition-all hover:shadow-lg`
- `.touch-target` – `min-h-[44px] min-w-[44px]`

---

## Related

- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Glass UI Crenspire](https://glass-ui.crenspire.com) — additional glass components in `components/ui/glass/`
