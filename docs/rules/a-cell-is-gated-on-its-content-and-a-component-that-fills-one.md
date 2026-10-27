# A cell is gated on its content, and a component that fills one may not return `null` — nor one line (REQUIREMENT)

When a grid counts its columns from a condition one level above the component that fills a cell, the
two must ask the same question. **Make the component total**, or **export the predicate** it uses
itself so the count and the cell share it; never add a third condition at the call site, which is a
second copy of the card's logic free to drift.

- **Total**: `ropeDropCardVariant()` (`lib/utils/rope-drop.ts`) resolves every rope-drop
  recommendation to one of three panels, and `RopeDropCard` returns `React.ReactElement`, so the next
  `return null` is a compiler error.
- **Not one line either.** Filling half a card with a single muted note beside a full chart is the
  same bug one size smaller. The "no need to rush" note is a **footer inside the stand-in panel**
  (`parkHasRecommendations` is a footer detail, never a branch), and the ride gets its readings.
- **Moving a sentence changes what it claims**, because its neighbours change. A note that read
  „die Wartezeiten bleiben über den Tag überschaubar (ca. {openWait} Min. zur Öffnung)" survives
  alone and not above three tiles that measured the queue. The footer keeps only what its branch
  knows, `worth === false` plus the contrast to recommended rides.
- **What a stand-in panel may say is a measurement, not a design.** It prints the quietest weekday
  only where the week was measured (`quietestWeekdays` drops a thinly measured day; „no weekday
  stands out" may only be printed where the whole week was measured), and no invented reason for the
  missing recommendation: that threshold lives in the backend and this repo cannot cite it.
- **One colour rank, in every place a number appears.** The tiles carry the rank as the legend's
  own swatch rather than tinted digits (`text-primary` is 3.47 : 1 on the light card, below the 4.5 an
  18 px 600-weight figure owes).
- **A boundary that must be seen is a line, not a wash.** `bg-primary/25` over the `bg-muted/40`
  track computes to 1.32 : 1 in light and 1.40 : 1 in dark, and no third tone clears 3 : 1 against
  both the track and the solid segment. The Voll boundary is a solid `bg-primary` top rule (3.36 : 1
  light, 5.24 : 1 dark).
- **An achromatic number belongs to no rank.** `text-muted-foreground` is grey, so it cannot name the
  Voll value; the row gets its own caption (the Voll swatch plus „Zahlen: Voll").

## Why

The ride page's „Beste Besuchszeit planen" grid counted its columns from
`attraction.ropeDrop && typicalWaits?.displayable` while `RopeDropCard` answered `null` for its
negative case, so hundreds of ride pages showed an empty half, and the one-line note that filled it
next sat alone in half a card, its „überschaubar" contradicted by the measured peak on a share of
them. The counts
are in [ride page](../design/ride-page.md#beste-besuchszeit-planen); why the colour rank is a swatch
and not a label over each bar is in
[one colour rank](../design/ride-page.md#one-colour-rank-and-a-line-for-a-boundary).

## Check

`pnpm test:typical-waits`.
