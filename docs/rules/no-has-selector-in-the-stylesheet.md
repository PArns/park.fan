# No `:has()` in a stylesheet a page loads (REQUIREMENT)

**No `:has()` rule may be active on a public page.** That covers `app/globals.css`, any CSS a page
imports, Tailwind variants that compile to `:has()` (`has-*`, `group-has-*`, `peer-has-*`,
`not-has-*`, and arbitrary variants spelling `&:has(…)`), and selectors assembled into an inline
`<style>`. The one exception is the admin blog editor's own stylesheet
(`app/admin/blog-editor/_components/editor-canvas.css`), which loads with the editor only.

- **Ask the element, not its parent.** A sibling that comes later reads an earlier one with
  `peer-*`; a parent can carry an attribute that JS or React sets; a call site knows what it put
  inside a component.
- **Tailwind reads comments.** A complete class in a doc comment or a tracked text file is a rule in
  the global stylesheet. Write about a variant without a utility after it (`group-has-[…]`).
- **A Playwright locator is not a stylesheet**: `scripts/` may use `:has()` in locators.
- **Treat anything that restyles `<html>` as a full-document restyle.** An attribute or class on
  `<html>` (`dark`, `data-temp-unit`, `data-planner-open`, `data-scroll-locked`) belongs to a user
  action, never to something that runs per render or per frame.
- **A `getSnapshot` reads no layout**: no `innerWidth`/`innerHeight`, `scrollY`,
  `getBoundingClientRect()`, `offset*` or `client*`. React calls it during every render of a
  subscriber and after its commit, when the document is always dirty. Read it in the event that
  changes it and return the cached value (`lib/planner/panel-width.ts`: 317–522 ms per render of the
  planner's edge tab before).

What replaced each rule, as patterns to copy:

| Was                                                   | Now                                                                                                                                 |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `html:has(body[data-scroll-locked])`                  | `ScrollLockGutter` copies the attribute from `<body>` to `<html>` with a `MutationObserver`; the rule is `html[data-scroll-locked]` |
| Button padding beside an icon (shadcn's `has-[>svg]`) | `Button` sets `data-with-icon` (`hasIconChild`); `buttonLinkProps({ withIcon: true })` for a link spreading the props               |
| `CardHeader` widening for a `CardAction`              | the call site passes `grid-cols-[1fr_auto]` (`GlossaryTermCard`)                                                                    |
| Slider head ring on keyboard focus                    | the head is rendered after the `<input>` and reads `peer-focus-visible`                                                             |
| Hero search frame lights up while its field has focus | `group/hero-search` on the field's parent, `group-focus-within/hero-search:` on the frame (`HeroSearchFrame`)                       |
| Planner show marks dim while a block is hovered       | a delegated `pointerover`/`pointerleave` toggles `data-block-hover` on the grid; marks read `group-data-[block-hover]/grid`         |
| `/news` hides a day with no note for the chosen park  | the day carries `data-filter-keys` and the rule matches it with `~=`                                                                |

## Why

Search Console, 2026-09-23: "INP issue: longer than 200 ms (mobile)" on 361 park-page URLs. With any
`:has()` rule active, Chrome restyles `<html>` after a DOM mutation anywhere on the page
(`StyleRecalc — Affected by :has() — HTML` in the invalidation trace), and on these pages that
recalculates every element. One character changed inside one ride card cost 400–500 ms of forced
style at 4× CPU, against 0–1 ms on a synthetic page of the same size; each of the thirteen rules was
enough on its own. Every tap paid it, because every React commit mutates the DOM. Removing them
(with the tab-panel fixes in
[an interaction may not rebuild the grid](an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md)),
two production builds, 4× CPU, 390 px:

| Tap                           | Before (median)        | After (median)   |
| ----------------------------- | ---------------------- | ---------------- |
| Style probe (one text change) | 459–603 ms             | 1–2 ms           |
| Search: type                  | 624–992 (892) ms       | 88–96 (88) ms    |
| Favourite star                | 760–1,056 (792) ms     | 232–272 (248) ms |
| Tab: Weather                  | 1,056–1,328 (1,224) ms | 216–336 (224) ms |
| Filter sheet: open            | 1,368–1,856 (1,624) ms | 680–872 (784) ms |
| **Median of all taps**        | **712 ms**             | **208 ms**       |

Why a restyle of `<html>` reaches every element on these pages and not on a synthetic page with the
same stylesheet is not settled. The filter sheet's remaining cost turned out to be inherited values
Radix writes onto `<body>`: [a popup changes nothing the page inherits](a-popup-changes-nothing-the-page-inherits.md).

## Check

`pnpm check:no-has` (`scripts/check-no-has.mjs`, in CI) flags the complete Tailwind form anywhere and
the literal `:has(` in CSS and app code outside comments; `pnpm build` ends with
`check-no-has.mjs --built` on the emitted CSS. `pnpm measure:inp` (`scripts/measure-inp.mjs`)
against `pnpm build && pnpm start` at `localhost` prints the style probe first: a probe in the
hundreds of milliseconds means a change anywhere restyles the whole document again.
