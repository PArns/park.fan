# A popup changes nothing the page inherits (REQUIREMENT)

**The page wrapper declares `pointer-events: auto` and `--removed-body-scroll-bar-size: 0px`, and
neither declaration may go.** They are `PAGE_ROOT_STYLE` in `app/[locale]/layout.tsx`, an inline
style on the `<div>` that holds the header, `<main>` and the footer. An open Radix popup writes both
values onto `<body>`: its dismissable layer sets `pointer-events: none` inline, and
react-remove-scroll-bar (the scroll lock behind every modal `Dialog`, `Sheet` and modal
`DropdownMenu`) sets the custom property through `body[data-scroll-locked]`. Both are inherited, so
on `<body>` each restyles every element of the page, once on open and once on close. Declared on the
wrapper, the change stops there.

- **Inline, not a class.** The same declarations as a class in `app/globals.css` stopped
  `pointer-events` but not the custom property (still 417 ms to set the lock), while an inline style
  stopped both. Which Chrome cache causes that is not settled; until it is, a value that has to stop
  an inherited change is declared inline, and measured.
- **The same holds for our own code**: nothing that runs per interaction sets an inherited property,
  custom properties included, on `<html>` or `<body>`
  ([no `:has()`](no-has-selector-in-the-stylesheet.md) says the same of attributes on `<html>`).
- **What it changes:** while a popup is open the page under it keeps `pointer-events: auto`. A
  `Sheet` or `Dialog` covers the page with its overlay, so nothing changes there; a click outside a
  modal `DropdownMenu` (the desktop locale switcher) closes it and also lands on what is under the
  pointer. What is not inside the wrapper (Radix's portalled layers, the planner's edge tab) still
  inherits from `<body>`.

## Why

Search Console, 2026-10-18: "INP issue: longer than 200 ms (mobile)", 1,074 URLs. Every visitor who
opened the burger menu on a park page paid it, and so did the filter sheet and the ride alert
dialog. On Phantasialand, 4× CPU, forced style and layout per change: `pointer-events: none` on
`<body>` 208–287 ms; the scroll lock with its custom property 329–409 ms, against 8–10 ms without
the property; with the wrapper declaring both, 1–16 ms. The taps:

| Tap                      | Before | After  |
| ------------------------ | ------ | ------ |
| Burger menu: open        | 728 ms | 352 ms |
| Burger menu: close       | 456 ms | 176 ms |
| Filter sheet: open       | 600 ms | 248 ms |
| Filter sheet: close      | 496 ms | 112 ms |
| Ride alert dialog: open  | 616 ms | 240 ms |
| Ride alert dialog: close | 384 ms | 88 ms  |

An overlay of our own built on react-remove-scroll with `removeScrollBar={false}` was tried first.
It measured no better, and it broke closing: the `Dialog` overlay stops a click's propagation (so a
dialog opened from a card's `<Link>` does not navigate the card), and with React listening on the
portal's container the stopped click never reached Radix's listener on `document`. Two declarations
on the wrapper fix every Radix layer at once and change no component.

## Check

`pnpm measure:inp` against `pnpm build && pnpm start`: the first two taps open and close the burger
menu. With a popup open, setting `--removed-body-scroll-bar-size` on `<body>` by hand and forcing a
layout must cost a few milliseconds, not hundreds. The computed value on the wrapper reads `0px`
either way, so only the timing says whether the declaration works.
