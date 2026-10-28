# The header is 48 px (REQUIREMENT)

The bar's height is `h-12` on `<header>` (`components/layout/header.tsx`; the inner container is
`h-full`, never a second copy of the number) and `-mt-12` on the three heroes it floats over: the
homepage (`app/[locale]/page.tsx`), `BlogPostBanner` and `LandingHero`
(`components/marketing/editorial-ui.tsx`). A change to the bar changes all of them, and two more
places that read the number without reserving it: the planner sheet's large detent
(`--planner-sheet-large` in `app/globals.css`, 3rem below the top on a window at least 50rem tall)
and the photo
credit under the bar (`BACKDROP_CREDIT_POSITION`, `top-[calc(3rem+6px)]`,
`components/media/photo-credit.tsx`). The header renders in the first HTML, so nothing reserves it
while it streams ([the chrome is in the first HTML](the-chrome-is-in-the-first-html-in-reading-order.md)).

## Heights come off the button scale

- Control heights come from the scale in `components/ui/button.tsx`
  ([touch targets](../design/touch-targets.md#the-button-scale-has-one-phone-height)), not out of
  the air.
- Below `sm` the scale grows to **44 px**. The bar is the one documented exception, because 44 in 48
  is the same mistake one size worse: `LocaleSwitcher` (`max-sm:h-8`), the `sm` branch of
  `search-bar.tsx` (`max-sm:h-9 max-sm:w-9`), the burger and `PlannerHeaderButton`
  (`max-sm:size-9`) cancel it at their own call site and say why. Cancel it nowhere else without a
  reason. A bigger phone control here means a taller bar, not a bigger button.

## Width: the bar asks its own width, and has none to spare

- **Its breakpoints ask the bar's width, not the window's**: `@container` on the `<header>`,
  `@min-[1024px]:` and `@min-[1280px]:` inside it. The trip planner's panel insets the page without
  the window changing, so `lg:`/`xl:` read a width the bar does not have. The container is the
  header, not the inner row, because the corner logo (`absolute left-6`) would resolve against the
  row. The planner caps its panel so at least `PAGE_MIN_PX` (`lib/planner/panel-width.ts`) of page
  remains.
- **The width budget is about 25 px at 360 px**, the same in all six languages, and 320 px (the
  narrowest viewport in the logs) decides the last pixels. So the °C/°F control is one fixed-width
  button showing the active unit, and below a 640 px bar the three preferences live in the burger
  sheet; there is no room for a fourth. The breakdown is in
  [header bar → the width budget](../design/header.md#the-width-budget).

## The lockup

- **One component rendered twice, never two class lists.** On a hero page the header parks a copy of
  `BrandLockup` (`components/layout/brand-lockup.tsx`) in the corner and one in the flow and
  cross-fades them while sliding one onto the other; that reads as one object only if they are
  congruent, so the handoff is a pure translate.
- **A height is the mark's height.** The four lockup SVGs' viewBoxes are their measured ink box, so
  pin 26 px and wordmark 19 px are what a reader sees. `logo-big*.svg` is not cropped (it is the
  lockup `generate-icons` reads). `logo.svg` and `logo-dark.svg` (the footer's detailed pin) are cut
  from the lockup by `scripts/generate-brand-pin.mjs`. Measurements:
  [header bar → one lockup, two copies](../design/header.md#one-lockup-two-copies).

## The two states may not decide whether the navigation exists

Over a hero the bar is transparent until the page scrolls, and in both states the nav row, search
and burger are visible, clickable, tabbable and in the accessibility tree. The scrim is its own
absolutely positioned layer (a `background/85` gradient), cross-faded on `opacity` against the solid
layer, never a second class list on one element and never a `backdrop-filter` or transform on the
`<header>` itself. The floating bar's ink is `foreground/90` (`headerNavInk`), because muted ink
falls to about 3.3 : 1 over a dark photo. No `transition-delay` on the solid state: it is one
property shared with the hover rule and would delay every entry's hover.

## Why

`isTransparent` once hid the nav with `opacity-0 pointer-events-none`, `aria-hidden` and
`tabIndex={-1}` until 50 px of scroll on all six hero pages, so the menu was unclickable and out of
the accessibility tree with nothing on screen saying so.

## Check

`pnpm check:header-reach` (against a running site): six hero pages × 360/1440 px × light/dark at
scroll 0, the first nav link or the burger visible, clickable, outside any `aria-hidden`, reached by
Tab, and its ink at least 4.5 : 1 against the painted bar. `pnpm check:brand-pin` fails when the
footer's pin drifts from the lockup. Background:
[header](../design/header.md) has the element
table and the measurements.
