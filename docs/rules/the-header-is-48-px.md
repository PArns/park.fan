# The header is 48 px (REQUIREMENT)

The bar's height is `h-12` on `<header>` (`components/layout/header.tsx`; the inner container is
`h-full`, never a second copy of the number) and `-mt-12` on the three heroes it floats over: the
homepage (`app/[locale]/page.tsx`), `BlogPostBanner` and `LandingHero`
(`components/marketing/editorial-ui.tsx`). A change to the bar changes all of them, and two more
places that read the number without reserving it: the planner sheet's large detent
(`--planner-sheet-large`, `calc(var(--planner-viewport) - 3rem)` in `app/globals.css`) and the photo
credit under the bar (`BACKDROP_CREDIT_POSITION`, `top-[calc(3rem+6px)]`,
`components/media/photo-credit.tsx`). The header renders in the first HTML, so nothing reserves it
while it streams ([the chrome is in the first HTML](the-chrome-is-in-the-first-html-in-reading-order.md)).

## Heights come off the button scale

- Control heights come from `components/ui/button.tsx` (`sm` 32 / default 36 / `lg` 40), not out of
  the air. The old 56 px bar held a 40 px `lg` search field, 71 % of its height.
- Below `sm` the scale's `sm`, `default`, `icon` and `icon-sm` resolve to **44 px**. The bar is the
  one documented exception, because 44 in 48 is the same mistake one size worse: `LocaleSwitcher`
  (`max-sm:h-8`), the `sm` branch of `search-bar.tsx` (`max-sm:h-9 max-sm:w-9`) and the burger
  (`max-sm:size-9`) cancel it at their own call site and say why. Cancel it nowhere else without a
  reason. A bigger phone control here means a taller bar, not a bigger button.

## Width: the bar asks its own width, and has none to spare

- **Its breakpoints ask the bar's width, not the window's**: `@container` on the `<header>`,
  `@min-[1024px]:` and `@min-[1280px]:` inside it. The trip planner's panel insets the page, so with
  a 448 px panel on a 1440 px window the bar is 992 px wide while `lg:`/`xl:` still read 1440 (the
  preference controls slid 96–390 px under the panel). The container is the header, not the inner
  row, because the corner logo (`absolute left-6`) would resolve against the row; `container-type`
  does not make the header a backdrop root. The planner caps its panel so at least `PAGE_MIN_PX`
  (360 px, `lib/planner/panel-width.ts`) of page remains.
- **The width budget is about 25 px at 360 px** (lockup 107, search 36, locale 56, theme 48, burger
  36, 20 of gaps, the same in all six languages). So the °C/°F control is one button showing the
  active unit, 28 px (24 on a phone), with a fixed width (`min-w-7 max-sm:min-w-6`) so it does not
  change width under the finger when `°F` replaces `°C`. 320 px is the narrowest viewport in the logs
  and decides the last pixels. There is no room for a fourth preference: below a 640 px bar the
  three preferences already live in the burger sheet (PAR-434).

## The lockup

- **One component rendered twice, never two class lists.** On a hero page the header parks a copy of
  `BrandLockup` (`components/layout/brand-lockup.tsx`) in the corner and one in the flow and
  cross-fades them while sliding one onto the other; that reads as one object only if they are
  congruent, so the handoff is a pure translate.
- **A height is the mark's height.** The four lockup SVGs' viewBoxes are their measured ink box, so
  pin 26 px and wordmark 19 px are what a reader sees. The padded exports had painted a 20.7 px pin
  for `h-6`. `logo-big*.svg` is not cropped (it is the lockup `generate-icons` reads). `logo.svg` and
  `logo-dark.svg` (the footer's detailed pin) are cut from the lockup by
  `scripts/generate-brand-pin.mjs`; the `.png` twins keep the old padded geometry that
  `lib/og/brand-mark.tsx` hard-codes.

## The two states may not decide whether the navigation exists

Over a hero the bar is transparent until the page scrolls, and in both states the nav row, search
and burger are visible, clickable, tabbable and in the accessibility tree. The scrim is its own
absolutely positioned layer (a `background/85` gradient), cross-faded on `opacity` against the solid
layer, never a second class list on one element and never a `backdrop-filter` or transform on the
`<header>` itself. The floating bar's ink is `foreground/90` (`headerNavInk`), because muted ink is
only 4.73 : 1 on the plain background and falls to about 3.3 : 1 over a dark photo. No
`transition-delay` on the solid state: it is one property shared with the hover rule and would delay
every entry's hover.

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
