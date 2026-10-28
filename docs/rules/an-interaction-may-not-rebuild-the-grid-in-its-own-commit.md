# An interaction may not rebuild the grid in the commit that answers it (REQUIREMENT)

A control's own state stays urgent; everything derived from it reads a `useDeferredValue` copy. A
control on the park page sets state a hundred glass cards read, and INP charges the tap for every
millisecond up to the paint that answers it. Where the deferred copies live:

- **Search**: `useDeferredValue(searchQuery)` in `lib/hooks/use-attraction-filter.ts` (was ~700 ms
  per keystroke).
- **Filter pills**: every filter state in the same hook (the five pills, the off-season switch, the
  sort, the rider height) has a deferred copy (was 392 ms in Cloudflare's field data).
- **Tabs**: `deferredTab = useDeferredValue(activeTab)` in `components/parks/tabs-with-hash.tsx`
  (was 300–380 ms per switch). Every panel is `forceMount`ed and hidden by `deferredTab`
  (`panelProps`), and a panel body renders only once `deferredTab` names it.
- **The live poll**: `LiveParkData` renders the cards from `useDeferredValue(livePark)`.

How to apply it:

- **Do not use `startTransition` on the control's own state.** That defers the lit pill and the
  `aria-pressed` with the grid, and those are what has to paint on the tap.
- **Read a deferred set as a set.** The filter values come from one update, so a render sees all the
  old ones or all the new ones, never "open now" without "gets you wet".
- **What describes the grid reads the deferred value, what drives a control reads the live one.**
  The empty state's "show closed attractions too" links and the `isNarrowing` that hides the
  rope-drop advice lag with the list.
- **A Radix panel switch is part of the commit.** `TabsContent` mounts and unmounts its panel on the
  urgent value, and Radix's `Presence` reads `getComputedStyle` in a layout effect. So the tab's
  highlight and `aria-selected` follow `activeTab`, the panel follows `deferredTab`, the ride list is
  only ever hidden, never unmounted, and `data-state` on the panels is ours (`panelProps`).
- **Panel bodies are `memo` boundaries** (`RestaurantsPanelBody`, `ShowsPanelBody`, `MemoParkMap`,
  `MemoWeatherCard`, `MemoAttractionFilterPanel` with `useCallback` toggles), so the urgent render
  does not re-render what the panel being left holds.
- **A heavy subscriber to the live query moves behind the deferred value** rather than getting its
  own subscription.

## Why

**The handler is never the cost**: it is a `setState` at 0–2 ms. The cost is what the new state
forces before the next paint: every land whose set changed reconciles, the rope-drop block mounts or
unmounts, and each card brings two `next/image` layers, an SVG path and about ten `useTranslations`
calls. Deferring moves that render out of the tap; the long task stays, after the paint.

- Islands of Adventure, the "Open" pill over 84 cards, 4× CPU: 128–200 ms → 48–64 ms, with the
  presentation phase carrying 95 % of the interaction.
- Six Flags Great Adventure, a tab tap at 4× CPU measured 410 ms of mousedown handler while the
  panel still mounted on the urgent value: unmounting the ride list's 1,457 nodes inside the tap.
  Radix flipping `data-state` restyled the ride list's 1,312 elements (297 ms), because Tailwind's
  `group-data-*` variants compile to `:is(:where(.group)[data-state=…] *)`. After all three fixes:
  Weather 1,056–1,328 → 216–336 ms, Attractions 608–1,104 → 112–208 ms.
- **React Query cannot defer a poll itself.** `useQuery` reads its cache through
  `useSyncExternalStore`, which renders synchronously in one task. The mount refetch lands a few
  seconds after hydration, exactly when a visitor starts tapping, and a tap during that task waits
  for all of it. With the deferred copy, Phantasialand at 4× CPU: longest task after the poll
  279–371 → 74–120 ms, blocking time 266–332 → 24–91 ms.

## Check

`pnpm measure:inp` (`scripts/measure-inp.mjs`) against `pnpm build && pnpm start`, never `next dev`:
390 px, `hasTouch`, CPU throttled through CDP, reading `PerformanceObserver` `event` entries
**inside the page** rather than timing the click from the test. The entry's split into input delay,
processing and presentation says whether a fix moved the render out of the tap or only made it
shorter. More measurements: [no `:has()` in a stylesheet](no-has-selector-in-the-stylesheet.md).
