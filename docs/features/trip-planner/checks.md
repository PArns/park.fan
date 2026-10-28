# Checking the planner

Which test covers what, and the traps in `scripts/check-planner.mjs`, the browser run. Open this
before adding a planner assertion or when `check:planner` behaves oddly.

## The commands

```bash
pnpm test:planner-actions      # plan operations, pure (incl. the now-floor fallback)
pnpm test:planner-assignment   # which park on which day, and the `reserved` field
pnpm test:planner-estimate     # what a block is expected to cost, and from which regime
pnpm test:planner-grid         # minutes → pixels, the axis, both scales
pnpm test:planner-leg          # the transfer verdict and the chip's placement
pnpm test:planner-optimize     # the engine, against brute force
pnpm test:planner-fit          # the fit assistant's model
pnpm test:planner-shows        # show window, projection clip, listing exemption
pnpm test:planner-park-time    # the zone rules
pnpm test:planner-weather-rail # the band down the edge of the day
pnpm test:planner-ride-drag    # the drag payload and its fallbacks
pnpm test:planner-month-grid   # the month matrix
pnpm test:planner-climatology  # the look-back note
pnpm test:planner-unavailable  # the empty-day sentence
pnpm test:planner-push-topics  # the topic narrowing
pnpm test:next-best-ride       # „Was jetzt?"
pnpm test:push-arming          # what "push is on" is allowed to mean
pnpm test:trip-sync            # the server copy of the plan
pnpm test:trip-share           # the shared-plan link
pnpm check:planner             # drives it in a browser — needs a running site
```

`check:planner` catches what the others cannot: whether the store rehydrates, the launcher appears,
the sheet opens on the right edge (the bottom on a phone), a tick survives a reload, and whether any
surface renders a raw message key. Before the browser starts it runs one static check: every
`quality` a planner image asks for must be in `next.config.ts`'s `images.qualities`
(`[50, 60, 75, 85, 90]`). Next 16 answers an unconfigured quality with a 400 from the optimizer, so
the picture is absent in production while `next dev` serves it with a warning nobody reads.

## The touch pass

The 390 × 844 pass asserts the grip's target really is 44 px (`elementFromPoint` at both ends,
since a bounding box cannot see a pseudo-element), that a drag with `pointerType: 'touch'` moves the
block, that the ±15 button is 44 px and moves a quarter hour, and that the axis keeps its 200 px
floor.

**That page is opened with `hasTouch`, and nothing it asserts means anything without it.** A
390 × 844 viewport alone is a mouse in a narrow window (`{coarse: false, fine: true, hover: true}`),
so everything that decides by pointer type — the snap step, the block body's `(pointer: fine)` gate,
every `hover:` style — answered the desktop way, and a grip check stayed green while a real coarse
pointer missed it by 22 px. A dispatched touch pointer is not a touch device: the event says touch,
`matchMedia` and CSS still say mouse. `isMobile` is deliberately left off (it adds the mobile
viewport meta and text autosizing, which move the numbers measured). The pass's first assertion
asks the browser what it is (`die Handy-Seite ist ein Grobzeiger`).

## Opening the panel is a step of its own

Every flow starts by opening the sheet, and two bare calls there used to end the whole run on a
throw (a rejected top-level `await` arrives as an `uncaughtException` on Node 24). The press is the
fragile half: `waitUntil: 'domcontentloaded'` resolves before React has wired the tab, so the press
can land on a button with no handler. `openSheet(page, where)` is the only way in:

- **The repeat is the mechanism, not the timeout**: a press that produced nothing is followed by
  `settleHydration` and another press, three at most.
- **A press that landed is read off `html[data-planner-open]`**, not off the sheet: the `planner`
  namespace is its own lazy chunk, and during that fetch a landed press has no sheet to show; a
  guard reading the sheet would press the toggle twice and close it.
- **Success waits for `[data-state="open"]`**, because a closing sheet stays visible for 300 ms.
  An attribute with no sheet after three waits is reported as a chunk that never arrived
  (`useLazyMessages` does not retry).

A failure is a named ❌ with the presses, and the call site leaves its own block
(`step: { … break step; }`) so the rest of the run executes. Successes are counted, not asserted:
`ℹ️ Planer N× geöffnet` rides with the balance and says whether the run reached the flows it reports
on — a bare `locator(LAUNCHER).click()` makes it untrue. `uncaughtException` and
`unhandledRejection` print the stack and the balance, and every exit goes through `exitAfterFlush`
(`process.exit()` does not wait for a write to a pipe). Other interactions inside an open sheet are
not hardened: a throw there still ends the run, with a balance.
