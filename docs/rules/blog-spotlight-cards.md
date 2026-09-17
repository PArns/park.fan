# Blog spotlight cards

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

`ParkCard`/`AttractionCard` lay out via `row-span-3` + `grid-template-rows: subgrid`, so the row template must sit **on the card itself**, never on a shared wrapper that also holds the heading — `auto` tracks collapse against the panels' `-mb-4`/`-mt-4` and slice the title and wait time. Use `grid [grid-template-rows:auto_2rem_auto] sm:[grid-template-rows:auto_minmax(220px,1fr)_auto]`; the `2rem` absorbs that overlap once the photo is hidden below `sm`, and `minmax(220px,1fr)` keeps image-less cards full height.
