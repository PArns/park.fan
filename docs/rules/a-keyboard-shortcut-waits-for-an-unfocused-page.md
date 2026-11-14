# A keyboard shortcut waits for an unfocused page (REQUIREMENT)

**A page-wide `keydown` listener acts only when nothing is focused, never on Space, and exists once
per page.** „Nothing focused" is asked of `nothingFocused()` (`lib/utils/page-focus.ts`) in every
such listener. A type-to-search listener takes its key through `isPageTypedKey(e)`, which adds no
modifier, one printable character, not Space and not `/`; `/` belongs to the site search
(`isSearchShortcut`), which opens on it from any page:

```ts
if (!isPageTypedKey(e)) return;
```

- **`/` is the one exception.** It opens the site search also while a link, button, pill or grid
  cell has focus, since none of them uses it: after a click on a hub's filter chip or a header menu
  link the shortcut did nothing until the visitor clicked the page. It still waits in a field, an
  editable element, a dialog, a menu or a listbox, where `/` is text or the control's own key
  (`isSearchShortcut`).
- **Escape belongs to the thing that has focus.** A global Escape that clears a filter also clears
  it when the visitor closes a dialog above it, so `useAttractionFilter` clears the ride filter only
  when its own field or nothing is focused.
- **Once per page.** A component that can render twice (the hero search on the hero and further
  down) registers the listener only in its hero instance (`onHero`). With two, whichever mounted
  first took the keystroke, which after a reload scrolled down was the field 2,000 px below.

The listeners that follow it: the park page's type-to-search (`lib/hooks/use-attraction-filter.ts`),
the search trigger (`components/search/search-bar.tsx`), the hero search and the glossary overview.

## Why

A focused link, pill, tab or menu is a control the visitor moved to. With the older guard, which
exempted only inputs, Space on a focused pill moved focus to the search field before the pill could
activate, Space to scroll jumped the page to the field, and a letter meant for a menu's first-letter
navigation or a screen reader's quick keys landed in the search.
