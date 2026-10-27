# Blog spotlight cards (REQUIREMENT)

`ParkCard` and `AttractionCard` lay out with `row-span-3` + `grid-template-rows: subgrid`, so a
widget that shows one in a post puts the row template **on the card's own wrapper**, never on a
shared wrapper that also holds the heading:

```
grid [grid-template-rows:auto_2rem_auto] sm:[grid-template-rows:auto_minmax(220px,1fr)_auto]
```

The `2rem` absorbs the panels' `-mb-4`/`-mt-4` overlap once the photo is hidden below `sm`, and
`minmax(220px,1fr)` keeps a card without an image full height. `blog-park-widget.tsx` and
`blog-attraction-widget.tsx` are the examples.

## Why

On a wrapper that also holds the heading, the `auto` tracks collapse against the panels' negative
margins and slice the card's title and wait time.
