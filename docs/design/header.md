# Header bar

The geometry of the site header: its height and where else that number is written, what sits in
the 48 px row and its width budget at 360 px, the preferences that move into the burger sheet on a
phone, the bar's two states over a hero, and the lockup drawn in it. The rule is
[the header is 48 px](../rules/the-header-is-48-px.md); this
page is the background. The menus and panels the bar opens are in
[header navigation](../features/header-navigation.md).

## Height

The bar is `h-12` on `<header>` (`components/layout/header.tsx`): 48 px border-box, the 1 px bottom
border included, so the content box is 47 px. The inner row is `h-full`, never a second `h-12`, so
the in-flow logo centres on the same box as the corner copy. It was 56 px and read heavier than
anything in it.

| Where                                                                                                    | What                                                |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `components/layout/header.tsx`                                                                           | `h-12` on `<header>`                                |
| `app/[locale]/page.tsx`, `components/blog/blog-post-banner.tsx`, `components/marketing/editorial-ui.tsx` | `-mt-12` on the three heroes it floats over         |
| `app/globals.css` (`--planner-sheet-large`)                                                              | the planner's phone sheet stops 3rem below the top  |
| `components/media/photo-credit.tsx` (`BACKDROP_CREDIT_POSITION`)                                         | a backdrop photo's credit at `top-[calc(3rem+6px)]` |

A wrong `-mt-` leaves a gap above a hero or eats the bar. The header renders in the first HTML
([the chrome is in the first HTML](../rules/the-chrome-is-in-the-first-html-in-reading-order.md)),
so no `<Suspense>` fallback reserves it any more.

For scale: Material 3's small top app bar is 64 dp, and a sticky bar is usually kept under ~60 px
on desktop and ~50 on a phone because it costs that much of every viewport for the whole visit.

## What sits in it

| Element                     | Height | Of the bar |
| --------------------------- | -----: | ---------: |
| logo lockup (`BrandLockup`) |  26 px |       55 % |
| search field, `lg` and up   |  32 px |       67 % |
| search button, below `lg`   |  36 px |       75 % |
| locale switcher             |  32 px |       67 % |
| burger, below `md`          |  36 px |       75 % |
| planner button, phone       |  36 px |       75 % |
| theme toggle                |  28 px |       58 % |
| °C/°F toggle                |  28 px |       58 % |
| nav links (text)            |  20 px |       42 % |

Control heights come off the button scale in `components/ui/button.tsx` (`sm` 32 / default 36 /
`lg` 40). The old bar put the largest, a 40 px `lg` search field, in a 56 px row (71 %).

**The bar opts out of the scale's phone tier.** Below `sm`, `sm`/`default`/`icon`/`icon-sm` grow to
44 px ([touch targets](touch-targets.md#the-button-scale-has-one-phone-height)), which would be
92 % of this row. So the controls here cancel it at their call site with a comment:
`locale-switcher.tsx` (`max-sm:h-8`), the `sm` branch of `search-bar.tsx`
(`max-sm:h-9 max-sm:w-9`), the burger in `header.tsx` and `planner-header-button.tsx`
(`max-sm:size-9`).
`temperature-unit-toggle.tsx` is not a `<Button>` and never grows. Making the 32 px switcher and
28 px theme toggle larger on a phone is a question about the bar's height, not the button.

**Breakpoints ask the bar's width.** `@container` sits on `<header>` (not on the
`container mx-auto` row, which would become the containing block of the `absolute left-6` corner
logo), and the switches inside use `@min-[1024px]:` / `@min-[1280px]:` / `@max-[640px]:`. The trip
planner's panel insets the page without the window changing: with a 448 px panel on a 1440 px
window the bar was 992 px wide while `lg:`/`xl:` still read 1440, and its children (1087.9 px)
slid up to 95.9 px under the panel in German, 171.1 in French, +389.7 at 1024. `container-type:
inline-size` does not imply `contain: paint`, so the header does not become a backdrop root. The
other half is `PAGE_MIN_PX = 360` (`lib/planner/panel-width.ts`): the panel never leaves less than
360 px of page. Measured after, at 1440/1280/1024/900/768 × de and fr: 0.0 px overhang.

## The width budget

The height is written down; the width was not. At **360 px** the row carried 303 px of content in
328 px (lockup 107, search 36, locale 56, theme 48, burger 36, 20 px of gaps), the same within 6 px
in all six languages because nothing in it is prose. That 25 px of slack shaped the °C/°F control,
which moved here from the weather card (where it reached park pages only):

- **One button showing the active unit**, 28 px (24 on a phone), `h-7` and the theme switch's ring
  so the two read as a pair. A `°C | °F` pill is 54 px and a bare text button 21.5 + 4 px of gap;
  neither fits. It looks the same above `sm` rather than growing a second markup.
- **Its width does not depend on the unit.** Sized by its label, `°F` was narrower than `°C` and the
  button shrank under the finger that pressed it, sliding its neighbours. `min-w-7 max-sm:min-w-6`
  with `px-1` fixes the box; measured across toggles, 0.0 px of movement.
- **Its label is CSS**: it renders both units with `.u-metric` / `.u-imperial` and
  `html[data-temp-unit]` picks one ([client-only preference](../rules/a-client-only-preference-may-not-decide-server-rendered-markup.md)).

The 28 px came from three places, none a control's height:

| Change                                                        | Where                                           | Saves |
| ------------------------------------------------------------- | ----------------------------------------------- | ----: |
| the locale code beside the flag, below `sm` (`max-sm:hidden`) | `components/common/locale-switcher.tsx`         | 22 px |
| the gaps between the action groups (`max-sm:gap-1`)           | `components/layout/header.tsx`                  |  8 px |
| the button's phone tier (`max-sm:min-w-6`)                    | `components/common/temperature-unit-toggle.tsx` |  4 px |

After: 301 px used at 360, 27 px of slack in every language. **320 px** (the narrowest viewport in
the logs) is why the last two rows exist: the bar was already 15 px over its box there, swallowed by
the container's `px-4`; the button alone took it to 26 over and the document to 330 px. It is 13
over now, inside the padding, and the document equals the viewport from 320 to 768.

A second copy of the three preference controls used to float in a frosted pill at `right-6` on
hero pages; PAR-170 removed it, because with the nav visible from the first screen line it lay
across the burger (240–336 px against 308–344 at 360).

## On a phone the preferences live in the menu

Below a **640 px bar** (`@max-[640px]:hidden`) the locale switcher, theme switch and °C/°F button
leave the bar (PAR-434). They are the first row of the burger sheet, the same three components, in
a `role="group"` with `aria-label` (no visible label beside the 44 px close button; `pr-12` keeps
them clear of it). The sheet exists only below a 1024 px bar and a portal cannot ask the header's
container anything, so between 640 and 1023 px the three are in both places; two conditions that
could disagree might leave them in neither. The locale list is `z-[80]`, above the sheet's `z-[70]`.

In their place the bar carries the planner's way in, `PlannerHeaderButton` (a 36 px calendar icon
beside the burger), because the planner's edge tab is not drawn on `planner-phone`
([trip planner](../features/trip-planner/panel.md#ways-in)). Measured on
`/parks/europe/germany` in de and fr: lockup 107, search 36, planner 36, burger 36, 0.0 px over the
content box at 320, 360 and 390 px, where it had been 12.8 px over at 320. The phone row has ~100 px
of slack now; the question for the next control is whether it is navigation (the bar) or a
preference (the sheet).

## Two states, one navigation

On the six pages that open on a full-bleed hero (homepage, Fancast, best-travel-time hub, the
guide, the blog index, a blog article) the bar floats transparent until 50 px of scroll. It used to
hide the navigation in that state (`opacity-0 pointer-events-none`, `aria-hidden` on the `<nav>`,
`tabIndex={-1}`, panels refusing to open): not clickable, not tabbable, not in the accessibility
tree, 24 of 24 measured combinations. Now the state changes only the ground and the ink:

- **The scrim is its own layer**: a `from-background/85` gradient, flat over the bar's 48 px and
  fading out 32 px below it, beside the material layer (`bg-background/80 backdrop-blur-md`). Two
  layers because a gradient is `background-image` and does not interpolate; they cross-fade on
  `opacity`. Neither may become a `backdrop-filter` or a transform on `<header>` itself: that makes
  it a backdrop root and flattens the menu band's blur.
- **The ink switches with the state.** `--muted-foreground` is 4.73 : 1 on the background, so 15 %
  of a dark photo through the scrim puts it at 3.3 : 1. While floating, the nav uses
  `foreground/90` (worst measured 13.31 : 1). The layers' sum runs 85 % → ~65 % → 80 % across the
  cross-fade, never far from the 80 % the solid bar gives, so the ink switches without a delay. A
  `delay-300` would have delayed every nav entry's hover too (`transition-delay` is one property),
  and a timer in state is a `setState` in an effect, which the lint rule refuses.

The header's GSAP stagger (`use-header-reveal.ts`) went with the old state: it reversed a
`fromTo(y: -10 → 0)` on the way back up, which left a visible row 10 px high from then on.
`pnpm check:header-reach` asserts the result at scroll 0 on all six pages × 360/1440 × both themes.

## One lockup, two copies

On a hero page the header renders the lockup twice: in the corner while transparent, in the flex
row once solid, cross-fading while one slides onto the other. That reads as one object only if
the two are congruent, so both render `BrandLockup` (`components/layout/brand-lockup.tsx`: pin
26 px, wordmark 19 px, `gap-2`). Two class sets (`h-7 md:h-9` + `h-5 md:h-6` against `h-6` + `h-5`)
made the handoff animate a 1.5× scale that no single factor could reconcile; now `logoScale` is
1.000 and per-frame sampling puts the boxes 0.0 px apart.

**A height is the mark's height.** The four SVGs (`logo-small*.svg`, `parkfan*.svg`) were exports
with the artboard margin baked in: `h-6` painted a 20.7 px pin and `h-5` a 15.6 px wordmark, a
lockup on 43 % of the bar while the classes said 50 %. Their `viewBox` is now the measured ink box
(rendered at 6000 px, alpha walked), so the pin has aspect 0.7248 (26 px → 18.8 px wide) and the
wordmark 4.2080 (19 px → 80.0 px). Cropping sharpens nothing by itself; it lets the size be set
without a magic number per call site. The other consumers (`lib/theme/theme-wipe.ts`, the coaster
player's watermark, the footer) write the same gap explicitly and kept their size. The homepage
hero draws its own larger mark from the detailed `logo.svg`. `logo-big*.svg` is **not** cropped:
`generate-icons` finds the wordmark in it by the widest empty row band.

## The footer's pin

The footer draws the detailed pin (orbit and three bars) at `h-8 md:h-12` from `public/logo.svg` /
`logo-dark.svg`. Those were a 1563×1116 PNG in an SVG wrapper, 77 KB each, and looked fine at
32/48 px, which is how a raster lasts until somebody draws it bigger. `pnpm generate:brand-pin`
cuts them from `logo-big*.svg` (6.2 KB each): the exporter names the halves `<g id="park.fan">`
(wordmark, dropped with its `_Linear1` gradient) and `<g id="Icon">`, and the `viewBox` is the
measured ink box (aspect 0.8201 against the raster's 0.8202). `pnpm check:brand-pin` fails when a
re-exported lockup leaves the pin behind. The `.png` twins keep the old padded geometry, which
`lib/og/brand-mark.tsx` hard-codes. Icons: [favicon](../seo/favicon.md).
