# A popup changes nothing the page inherits (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

**The page wrapper declares `pointer-events: auto` and `--removed-body-scroll-bar-size: 0px`, and
neither declaration may go.** They are `PAGE_ROOT_STYLE` in `app/[locale]/layout.tsx`, an inline
style on the `<div>` that holds the header, `<main>` and the footer. An open Radix popup writes both
values onto `<body>`: its dismissable layer sets `pointer-events: none` inline, and
react-remove-scroll-bar, the scroll lock behind every modal `Dialog` and `Sheet` overlay and every
modal `DropdownMenu`, sets the custom property through `body[data-scroll-locked]`. Both are
inherited, so on `<body>` each of them restyles every element of the page, once when the popup
opens and again when it closes. Declared on the wrapper, the change stops there. The same holds for
our own code: nothing that runs per interaction sets an inherited property, custom properties
included, on `<html>` or `<body>`
([no-has-selector-in-the-stylesheet.md](no-has-selector-in-the-stylesheet.md) says the same of
attributes on `<html>`).

## What it cost

Search Console, 2026-10-18: "INP issue: longer than 200 ms (mobile)", 1,074 URLs, group INP
203 ms, example URL Phantasialand. Every visitor who opened the header's burger menu on a park page
paid it, and so did the attraction filter sheet and the ride alert dialog.

Each change on its own, made inside the Phantasialand page against `pnpm build && pnpm start`,
390 px, touch, 4× CPU, forced style and layout, median of five:

| Change                                                                     | Set        | Removed    |
| -------------------------------------------------------------------------- | ---------- | ---------- |
| `pointer-events: none` on `<body>`                                         | 208–254 ms | 235–287 ms |
| react-remove-scroll-bar's lock, with `--removed-body-scroll-bar-size`      | 409 ms     | 329 ms     |
| the same lock without the custom property (`overflow: hidden` and offsets) | 8–10 ms    | 9–11 ms    |
| inserting the library's `<style>` alone                                    | 8–15 ms    | 7–16 ms    |
| `pointer-events: none` on `<body>`, page wrapper declaring `auto`          | 2 ms       | 1 ms       |
| the lock with the variable, page wrapper declaring it inline               | 16 ms      | 13 ms      |

This also corrects the explanation
[no-has-selector-in-the-stylesheet.md](no-has-selector-in-the-stylesheet.md) gave for the filter
sheet: the inserted `<style>` and the overflow lock cost about 10 ms each; the two inherited values
were the cost.

The taps, Event Timing entries read inside the page, same set-up, median of three runs before
(the build of bc39ad7) and four after (this change, built):

| Tap                      | Before | After  |
| ------------------------ | ------ | ------ |
| Burger menu: open        | 728 ms | 352 ms |
| Burger menu: close       | 456 ms | 176 ms |
| Filter sheet: open       | 600 ms | 248 ms |
| Filter sheet: close      | 496 ms | 112 ms |
| Ride alert dialog: open  | 616 ms | 240 ms |
| Ride alert dialog: close | 384 ms | 88 ms  |

## Why inline

Both declarations first went into `app/globals.css` as a class on the wrapper. `pointer-events`
stopped there (1 ms), the custom property did not: the lock still cost 417 ms to set and 434 ms to
remove, with the class matching and `getComputedStyle` reading `0px` on the wrapper. The same
declaration as an inline style, in a `<style>` of its own, or rewritten into the built rule through
the CSSOM stopped it (1–3 ms); a `<style>` with an unrelated rule did not. Which cache in Chrome
keeps the declaration from the big stylesheet out of the comparison is not settled. Until somebody
finds it, a value that has to stop an inherited change on its way down is declared inline, and
measured.

## What was tried first

An overlay of our own for `Sheet` and `Dialog`, built on react-remove-scroll with
`removeScrollBar={false}`, so the custom property was never written. On its own it left
`pointer-events: none` in place, and with the wrapper's `pointer-events: auto` it measured no better
than the two declarations. It also lost something: Radix registers its overlay as a dismissable
surface, and the `Dialog` overlay stops a click's propagation so a dialog opened from a card's
`<Link>` does not navigate the card. React listens on a portal's container, `<body>`, so the stopped
click never reached Radix's listener on `document`, and a tap on the overlay no longer closed the
ride alert dialog. Two declarations on the wrapper fix every Radix layer at once and change no
component.

## What it changes

- While a popup is open, the page under it keeps `pointer-events: auto`. A `Sheet` or a `Dialog`
  covers the page with its overlay, which takes every tap outside the panel, so nothing changes
  there. A modal `DropdownMenu` has no overlay: a click outside the desktop locale switcher closes
  it and also lands on what is under the pointer, as a click outside a non-modal menu does.
- What is not inside the wrapper (Radix's portalled layers, the planner's edge tab) still inherits
  from `<body>`. Radix gives its own layers explicit values, and the rest is a few elements.

## Measure it

`pnpm measure:inp` against `pnpm build && pnpm start`: the first two taps open and close the burger
menu, and the filter sheet follows the tab row. With a popup open, setting
`--removed-body-scroll-bar-size` on `<body>` by hand and forcing a layout must cost a few
milliseconds, not hundreds: the computed value on the wrapper reads `0px` in both cases, so only the
timing says whether the declaration does its job.
