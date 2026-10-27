# Parks without wait times: every surface

What each surface of the site shows for a park whose wait times cannot be read
(`liveWaitTimes.available: false`, Hansa-Park today), where the snippet guard sits, and
what it does not fix. Open it when a new surface shows a wait, a count or a crowd badge.
The rule — never derive it, read it through `hasReadableWaitTimes()`, strip on listing
surfaces — is [parks we cannot read](../rules/parks-we-cannot-read.md); the field, what
the API withholds and how a park is added are the backend's
[live-wait-times contract](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/live-wait-times-availability.md).

## Where it lands

| Surface                                                   | Behaviour                                                                                                                                                                                            |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Park page                                                 | `<NoLiveWaitTimesNotice scope="park">` above the ride tabs                                                                                                                                           |
| Ride page                                                 | `<NoLiveWaitTimesNotice scope="ride">` under the header card, above the chapters                                                                                                                     |
| `ParkStatus` (`detailed` / `card` / `hero`)               | wait, peak, occupancy and open-count cards dropped                                                                                                                                                   |
| `ParkTodayPanel`, `ParkStatsSection`, `LiveDataFreshness` | wait-derived lines left out                                                                                                                                                                          |
| `LandSection`                                             | "82 attractions" instead of "0/82 operating"                                                                                                                                                         |
| Ride cards, `RideNowPanel`                                | `UNKNOWN` status and `unknown` crowd, both already supported                                                                                                                                         |
| Crowd badges                                              | no special case: the API sends `unknown` → "Keine Prognose"                                                                                                                                          |
| `/api/parks/live`, nearby, favourites                     | `crowdLevel` / `averageWaitTime` / `operatingAttractions` stripped at the projection boundary (`stripUnreadableWaitStats`, `lib/api/discovery.ts`, `lib/api/favorites.ts`); `totalAttractions` stays |
| Ride alerts (`RideAlertDialog`)                           | the reopen option is not drawn (`reopenAvailable`); the API refuses alerts for such a park                                                                                                           |
| Trip planner live layer (`lib/planner/live.ts`)           | no live waits merged into the plan                                                                                                                                                                   |
| Day planner (`/plan/day`)                                 | `ridesUnavailable.reason: no_wait_time_source`, worded from the park's own reason (`lib/planner/unavailable.ts`) as an answer, not a gap                                                             |

Why the listing surfaces strip instead of carrying the flag is in the rule. Cards already lay
out around the fields being absent (as during a poll), so no card needed a branch.

## The snippet guard (`data-nosnippet`)

The notice is the most quotable prose on the site's strongest page, so its root carries
`data-nosnippet` (`GlassNotice`, `components/parks/glass-notice.tsx`, which
`NoLiveWaitTimesNotice` and `WorksPeriodNote` render on). The text stays crawled, ranked
and visible; it only cannot become the search snippet, and Google falls back to the meta
description. Checked 2026-08-30: Google rendered the meta description verbatim for
"Hansa-Park Wartezeiten", so the guard is prevention.

Which elements Google honours it on, and why not `noindex`, is in the rule. Beyond
that: the attribute is boolean (`data-nosnippet="true"` is fine), structured data inside
stays usable, and it must not be toggled from JavaScript — the notice is server-rendered
and fixed.

**Not fixed by it:** the title (`seo.parks.titleTemplate`, "{park} Wartezeiten LIVE") and
the FAQ's `waitTimesNoDataA` ("Die Live-Wartezeiten … stehen oben") still promise live
wait times for such a park. Changing the title is a ranking decision on the biggest page.
