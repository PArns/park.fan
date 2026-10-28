# Umami event budget (REQUIREMENT)

Umami Cloud bills **every event property as another event**, so a five-property event costs six
pageviews, and the plan (100k a month) is spent by properties, not traffic. Before adding an event or
a property:

- **Never send what Umami already has**: URL, referrer, `navigator.language`. So no `locale`, no
  `path`.
- **Never send what a sibling property implies**: an `in_park` flag repeated `type === 'in_park'`, a
  `hasQuery` flag repeated `queryLength > 0`.
- **Price an event that fires on load by its property count on every pageview.**
- **Keep `data-exclude-hash="true"` on the script tag** (`app/[locale]/layout.tsx`): the tracker
  patches `replaceState` and bills a changed hash as a fresh pageview, which the park tabs and the
  calendar month stepper both write.

Events live in `lib/analytics/umami.ts`. Background: [analytics](../development/analytics.md) has the
event inventory and how to add one.
