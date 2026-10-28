# Touch targets

How a control reaches a 44 px tap target on a phone: the button scale's phone tier, the
pseudo-element for everything that is not a `<Button>`, and where targets may sit below 44 px.
Open it before sizing any tappable element.

## The button scale has one phone height

`components/ui/button.tsx` has three desk heights, 32 (`sm`) / 36 (default) / 40 (`lg`), and **one**
phone height: below `sm`, `sm`, `default`, `icon` and `icon-sm` all resolve to **44 px**
(`max-sm:h-11`, `max-sm:size-11`). `lg` and `icon-lg` stay at 40; they are used where there is room,
and raising them would only move the hero search field. `sm` vs `default` vs `lg` is a density
decision and a finger has no density; horizontal padding still steps.

44 was already written down twice and applied nowhere public: `CONTROL_HEIGHT = 'h-11 sm:h-9'` in
`app/admin/_ui/controls.tsx` (the smallest target a thumb hits reliably) and `.touch-target` in
`globals.css`, which no element uses. A grep over `components/` and `app/[locale]` for
`min-h-11|h-11|touch-manipulation` returned no control, so most touch findings in the mobile audits
were the scale's fault, not the component's.

Cancel the tier only where a row's height is itself a requirement, with `max-sm:` at the call site
and a comment naming it. The one such place is the [header bar](header.md#what-sits-in-it).
`Badge` is deliberately outside the tier: badges are labels, and growing every status chip would
move layout that placeholders reserve. Controls that are not `<Button>` (the glossary filter pills,
the blog tag cloud) are still open.

## The target grows, the box does not

A tap target that is not a `<Button>` reaches 44 px through a **centred pseudo-element**, never
through `min-h-11`/`min-w-11` on the element. `min-h-11` is right only where the element's own box
may be 44 px (a link in the footer's stack, `footerLinkClass`; a full-width CTA). Everywhere else a
parent positions the box, and growing it moves what it holds. The shared class string is
`PHONE_HIT_AREA` (`lib/utils/touch-target.ts`): `relative`, then a `max-sm:after:` box of
44 × max(100 %, 44) px centred on the element. It must not go on an `absolute` or `fixed` element,
and not on list rows, where targets would overlap.

`FavoriteStar` is the case that proved it: it sits on every park, ride, show and restaurant card.
`ParkCard` and `AttractionCard` put it in a 34 px circle with `h-full w-full`; a
`max-sm:min-h-11 max-sm:min-w-11` overrode that, the 44 px button kept the circle's top-left corner,
and the star came to rest 6 px right and 6 px down of its ring on 12 of 12 homepage cards and 19 of
19 on a park page. On show and restaurant cards the wrapper is anchored top-right, so the same
28 px pushed the star 14 px into the card. With the pseudo-element every star is centred to 0.0 px
and the reach `elementFromPoint` finds grew (43 × 44 px in the circle, against 37 × 44 before),
because it is centred on the star rather than hanging off one corner.

Two things to check when using it:

- **The reach is clipped by any `overflow-hidden` ancestor.** In a card's corner a finger gets the
  pseudo-element minus what reaches past the card (41 × 30 px in `BreadcrumbNav`, 31 × 44 on a show
  card whose neighbour clips it). Still several times the bare control. Where the box shrinks back,
  say so: `ParkFavoriteButton` beside the park `<h1>` went 44 → 24 px wide and gave the title 20 px.
- **Check what the reach now lies over.** `LocationBanner`'s close button is `absolute top-2
right-2` in a toast; its grown box went 53 px inward over the headline's last 16 px, and a tap at
  the end of a headline line dismissed the banner. With the pseudo-element on a 24 px button the
  _target_ still reached 43 px in, so the card's padding has to clear the target, not the box:
  `max-sm:pr-11`. Measured over six locales × 320/360/390 px, the column edge now hits the `<h2>` in
  all 18; three of them wrap one more line, and the toast is `fixed`, so nothing moves.

**Neighbouring targets meet, they do not overlap**: where two overlap, the later element in the DOM
takes the tap. A ride card's corner holds up to three 30 px circles (bell, ridden, star) 3 px apart
(`GLASS_CIRCLE_ROW`), each with a 33 × 40 px target (`GLASS_CIRCLE_HIT_AREA` in
`components/common/glass-circle.tsx`), the circle plus the gap, so the targets tile the row. That
row is the one place below the 44 px floor, a product decision (PAR-719): three controls share the
first line of a 360 px row with the ride's name and wait, and the name is what the row is for. The
targets still clear WCAG 2.5.8's 24 px.

The same split is written out, with its reason, in `components/common/breadcrumb-nav.tsx` (a
`min-h-11` grew the crumb row ~24 px after paint: 0.0227 CLS), `components/planner/planner-block.tsx`
(a block may be 20 px tall and its box must not lie about the duration) and
`components/planner/planner-flyout.tsx`.
