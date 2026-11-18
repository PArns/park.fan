# Blog spotlight cards (REQUIREMENT)

`ParkCard` and `AttractionCard` lay out with `row-span-3` + `grid-template-rows: subgrid`, so a
card shown on its own (a post's widget, the cards under a post, a hover card, a demo) puts the row
template **on the card's own wrapper**, never on a shared wrapper that also holds the heading. The
template is `STANDALONE_CARD_ROWS_CLASS` from `components/parks/card-rows.ts`, never a copy:

```
grid [grid-template-rows:auto_2rem_auto] sm:[grid-template-rows:auto_minmax(220px,1fr)_auto]
```

The `2rem` absorbs the panels' `-mb-4`/`-mt-4` overlap once the photo is hidden below `sm`, and
`minmax(220px,1fr)` keeps a card without an image full height.

## Why

On a wrapper that also holds the heading, the `auto` tracks collapse against the panels' negative
margins and slice the card's title and wait time. A middle track narrower than `2rem` does the
same on a phone: the cards under a post and the hover cards had copied the template with `0px`,
and the bottom panel covered the status and crowd badges of every ride card.

## Check

`grep -rn "auto_0px_auto" components app` finds nothing, and every wrapper of a lone `ParkCard` or
`AttractionCard` imports `STANDALONE_CARD_ROWS_CLASS`. A phone-width screenshot of a post's ride
cards shows the badge line whole above the wait time.
