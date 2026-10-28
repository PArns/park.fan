# A blog card is a row on phones (REQUIREMENT)

Below `sm` a blog card is not rendered at all: `BlogPostRow` is (`sm:hidden` / `hidden sm:grid`).
`ParkCard` makes the same split with its own four-line row (`data-park-card-row`). Both are **two
markups, not one responsive tree**, because the panels' glass is inline styles and no breakpoint
switches an inline style off.

- **`BlogPostRow` has no variants of its own.** Where a lead post and the list under it are all rows,
  variants made the lead come out inset, boxed and carrying a reading time its neighbours lacked.
- **The hidden card does not preload a cover nobody sees**: its photo layers claim the row's size for
  the phone segment of `sizes`, so a `priority` card does not preload a full-width cover for a
  `display:none` element.
- **The grid's gap is part of the row**: grids spaced for cards drop to `gap-2` below `sm`, and both
  halves of `LatestBlogSection`'s `lead` agree.
- **A full-bleed hero's overlap is safe by construction.** With `flowInto`, a phone's headline moves
  to the top and the next section is pulled up over the photo by `HERO_FLOW_INTO_PULL`
  (`components/marketing/editorial-ui.tsx`, `-mt-44`), which must stay smaller than the hero's mobile
  `pb-48`: the hero is `max(78vh, content + padding)`, so a long headline grows it and carries the
  pulled section down. `LandingHero` and `BlogPostBanner` take it.

## Why

Below `sm` the cards drop their photo, and a post card then said a title and a date in about 200 px;
the heroes spent a phone's whole first screen on one picture. A hand-tuned pull ran the German
tagline past the first card at 360 px.

Background, with the measurements:
[cards and heroes](../design/cards-and-heroes.md#cards-become-rows-on-a-phone).
