# A keyboard shortcut waits for an unfocused page (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

**A page-wide `keydown` listener acts only when nothing is focused, never on Space, and exists
once per page.** The guard, as `hero-inline-search-panel.tsx` has it:

```ts
const active = document.activeElement;
if (active && active !== document.body && active !== document.documentElement) return;
if (e.metaKey || e.ctrlKey || e.altKey) return;
if (e.key.length !== 1 || e.key === ' ') return;
```

A focused link, pill, tab or menu is a control the visitor moved to. With the older guard, which
only exempted inputs, Space on a focused pill moved focus to the search field before the pill could
activate, Space to scroll jumped the page to the field, and a letter meant for a menu's first-letter
navigation or a screen reader's quick keys landed in the search. The park page's type-to-search
(`use-attraction-filter.ts`) and the search trigger's `autoFocusOnType` (`search-bar.tsx`) had it.

**Escape belongs to the thing that has focus.** A global Escape listener that clears a filter also
clears it when the visitor closes a dialog or a popover above it. `use-attraction-filter.ts` clears
the ride filter only when the field itself or nothing is focused.

**Once per page.** A component that can render twice on a page (the hero search on the hero and
further down, `primary={false}`) registers the listener only in its primary instance. With two,
whichever mounted first took the keystroke, and after a reload scrolled down that was the field
2,000 px below the hero.
