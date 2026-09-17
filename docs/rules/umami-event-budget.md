# Umami event budget (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

Umami Cloud bills **every event property as another event**, so a 5-property event costs 6× a pageview and the plan (100k/month) is blown by properties, not traffic. Before adding one: never send what Umami already has (URL, referrer, `navigator.language` → so no `locale`, no `path`) and never send what a sibling property implies (`in_park` was `type === 'in_park'`, `hasQuery` was `queryLength > 0`). Events firing on **load** cost their property count on every pageview — price them accordingly. Keep `data-exclude-hash="true"` on the script tag: the tracker patches `replaceState` and bills a changed hash as a fresh pageview, which the park tabs and the calendar month stepper both write. See [analytics](docs/development/analytics.md).
