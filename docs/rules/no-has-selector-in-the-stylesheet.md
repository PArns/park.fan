# No `:has()` in a stylesheet a page loads (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

**No `:has()` rule may be active on a public page.** That covers `app/globals.css`, any CSS a page
imports, Tailwind variants that compile to `:has()` (the `has-*`, `group-has-*`, `peer-has-*` and
`not-has-*` families, and arbitrary variants spelling `&:has(…)`), and selectors assembled into an
inline `<style>`. `pnpm check:no-has` checks the sources and runs in CI; `pnpm build` ends by
checking the CSS it emitted. The one exception is the admin blog editor's own stylesheet
(`app/admin/blog-editor/_components/editor-canvas.css`), which loads with the editor only.

## What it cost

Search Console, 2026-09-23: "INP issue: longer than 200 ms (mobile)", 361 park-page URLs, group
INP 203 ms, example URL Six Flags Great Adventure. Traced on that page against
`pnpm build && pnpm start`, 390 px, touch, 4× CPU throttle:

- **Any DOM change restyled the whole document.** One character changed inside one ride card cost
  400–500 ms of forced style recalculation, against 0–1 ms on a synthetic page of the same size.
  The invalidation trace names the cause on every run: `StyleRecalc — Affected by :has() — HTML`.
  With any `:has()` rule active, Chrome restyles `<html>` after a DOM mutation anywhere on the page,
  and on these pages a restyle of `<html>` recalculates every element (2,700 on the park page).
- **Each of the thirteen rules was enough on its own.** Deleting all of them through the CSSOM took
  the probe to 0 ms; keeping any single one of them brought it back to 70–90 ms at 1× CPU. The one
  rule that did not was already behind `@media (pointer: fine)` and so inactive on a phone.
- **Every tap paid it**, because every React commit mutates the DOM. The same taps with the rules
  stripped in the page: typing in the ride search 792 → 64 ms, the favourite star 776 → 200 ms,
  opening the filter sheet 1,352 → 736 ms.

The fix, measured with `pnpm measure:inp` against two production builds of the same commit
(before: 39f6279; after: this change, which also carries the tab-panel and store fixes below), same
machine, 4× CPU, 390 px, four runs before and three after, range and median per tap:

| Tap                           | Before                 | After            |
| ----------------------------- | ---------------------- | ---------------- |
| Style probe (one text change) | 459–603 ms             | 1–2 ms           |
| Search: type                  | 624–992 (892) ms       | 88–96 (88) ms    |
| Favourite star                | 760–1,056 (792) ms     | 232–272 (248) ms |
| Tab: Weather                  | 1,056–1,328 (1,224) ms | 216–336 (224) ms |
| Tab: Restaurants              | 680–944 (728) ms       | 208–256 (216) ms |
| Tab: Attractions              | 608–1,104 (692) ms     | 112–208 (168) ms |
| Filter sheet: first pill      | 776–1,264 (928) ms     | 160–232 (184) ms |
| Filter sheet: open            | 1,368–1,856 (1,624) ms | 680–872 (784) ms |
| Filter sheet: close           | 624–928 (644) ms       | 384–592 (496) ms |
| **Median of all taps**        | **712 ms**             | **208 ms**       |

The FAQ toggle moved within the noise (144–184 before, 168–248 after). A lab run at 4× on this
machine is harsher than the field's 75th percentile, so read the ratio, not the absolute values.

**Still open: the filter sheet.** Opening it costs 556–698 ms of processing at 4× CPU, nearly all of it
Radix's scroll lock (`react-remove-scroll`, which every modal Radix dialog uses) inserts a
`<style>` element, and Chrome re-analyses the whole 440 KB stylesheet for it (329 ms), then locks
the viewport's overflow, which relays out the whole page (639 ms, forced by the focus move). Closing
pays the same in reverse. Only visitors who open the sheet pay it; a fix is a sheet that does not
lock the page this way (non-modal with its own `overscroll-behavior: contain`, or `inert` on the
page behind it), which changes how the sheet behaves and is its own change.

Why a restyle of `<html>` reaches every element on these pages and not on a synthetic page with the
same stylesheet is **not** settled. It needs both the real DOM and the real CSS; removing any one
rule group, the fonts, the inline styles or the `<html>` attributes did not stop it. Until somebody
finds it, treat anything that restyles `<html>` as a full-document restyle: an attribute or class
on `<html>` (`dark`, `data-temp-unit`, `data-planner-open`, `data-scroll-locked`) belongs to a
user action, never to something that runs per render or per frame.

## What replaced each rule

| Was                                                                | Now                                                                                                                                                                                                       |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `html:has(body[data-scroll-locked])` (globals.css)                 | `ScrollLockGutter` copies the attribute from `<body>` to `<html>` with one `MutationObserver`; the rule is `html[data-scroll-locked]`. The observer runs before paint, so the gutter lands with the lock. |
| Button padding beside an icon (shadcn's `has-[>svg]`)              | `Button` sets `data-with-icon` from its children (`hasIconChild`: an `<svg>`, a lucide icon, a component named `…Icon`); `buttonLinkProps({ withIcon: true })` for a link that spreads the props.         |
| `CardHeader` widening for a `CardAction`                           | The call site passes `grid-cols-[1fr_auto]` (`GlossaryTermCard`).                                                                                                                                         |
| Slider head ring on keyboard focus (rider height, alert threshold) | The head is rendered after the `<input>` and reads `peer-focus-visible`; it takes no pointer events, so the invisible input stays the target.                                                             |
| Hero pills fade while the search has focus                         | `peer/hero-search` on the search, `peer-focus-within/hero-search` on the pills (`app/[locale]/page.tsx`).                                                                                                 |
| Planner show marks dim while a block is hovered                    | A delegated `pointerover`/`pointerleave` pair on the grid toggles `data-block-hover` (a DOM attribute, no state); the marks read `group-data-[block-hover]/grid`.                                         |
| `/news` hides a day with no note for the chosen park               | The day carries `data-parks`, a space-separated list, and the rule matches it with `~=`.                                                                                                                  |
| Tiptap canvas rules (globals.css)                                  | Moved to `editor-canvas.css`, imported by the editor.                                                                                                                                                     |

## Writing one of these

- **Ask the element, not its parent.** A sibling that comes later can read an earlier one with
  `peer-*`; a parent can carry an attribute that JS or React sets; a call site knows what it put
  inside a component.
- **Tailwind reads comments.** A complete class in a doc comment or in a tracked text file is a rule
  in the global stylesheet, even if no element ever carries it. Write about a variant without a
  utility after it (`group-has-[…]`, not the whole class). `pnpm check:no-has` flags the complete
  form anywhere, and flags the literal `:has(` in CSS and app code outside comments.
- **A Playwright locator is not a stylesheet.** `scripts/` may use `:has()` in locators.

## Layout reads in a store

The same trace found the planner's width store reading `window.innerWidth` in `getSnapshot`
(`lib/planner/panel-width.ts`). React calls `getSnapshot` during every render of a subscriber and
again after its commit, and `innerWidth` forces style and layout whenever the document is dirty —
which, right after a commit, it always is. The edge tab subscribes on every page, and each of its
renders paid 317–522 ms at 4× CPU. The store now reads the width when the first listener subscribes
and on `resize`. **A `getSnapshot` reads no layout**: no `innerWidth`/`innerHeight`, `scrollY`,
`getBoundingClientRect()`, `offset*` or `client*`. Read it in the event that changes it and return
the cached value.

## Measure it

`pnpm measure:inp` (`scripts/measure-inp.mjs`) against `pnpm build && pnpm start` at `localhost`.
It prints the style probe first — what one text change in one card costs in forced style and layout
— and then each tap's Event Timing entry split into input delay, processing and presentation. A probe
in the hundreds of milliseconds means a change anywhere restyles the whole document again.
