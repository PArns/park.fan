# Umami event budget (REQUIREMENT)

**Umami is switched off.** The locale layout embeds no tracker and mounts no Web Vitals reporter,
so nothing reaches Umami; `trackEvent` stays and no-ops. The rule below holds again the day it is
embedded again ([analytics](../development/analytics.md)).

Umami Cloud bills **every event property as another event**, so a five-property event costs six
pageviews, and the plan (100k a month) is spent by properties, not traffic. That is why **a custom
event goes to our own counter** (`trackSiteEvent`, `lib/analytics/site-analytics.ts`), where a
property costs nothing, and Umami keeps only its pageviews and the two Web Vitals events. Before
sending anything to Umami at all, or adding a property to what it still gets:

- **Never send what Umami already has**: URL, referrer, `navigator.language`. So no `locale`, no
  `path`.
- **Never send what a sibling property implies**: an `in_park` flag repeated `type === 'in_park'`, a
  `hasQuery` flag repeated `queryLength > 0`.
- **Price an event that fires on load by its property count on every pageview.**
- **Keep `data-exclude-hash="true"` on the script tag** (`app/[locale]/layout.tsx`): the tracker
  patches `replaceState` and bills a changed hash as a fresh pageview, which the park tabs and the
  calendar month stepper both write.

What Umami still sends lives in `lib/analytics/umami.ts` and
`components/analytics/web-vitals-reporter.tsx`. Background: [analytics](../development/analytics.md)
has the inventory of both systems and how to add an event; [site analytics](../features/site-analytics.md)
is how our own counter works.
