# The park map

`ParkMap` (`components/parks/park-map.tsx`): a Leaflet map of one park with its rides, shows and
restaurants, the visitor's position and, inside the park, a list of what is nearest. It is the park
page's map tab and the blog's `map-widget`. Open this page before changing either, the markers or
how the map follows the visitor. Tiles are CARTO's, never OpenStreetMap's own server
([the rule](../rules/map-tiles-are-carto-not-osms-own-tile-server.md); `cartoTileUrl`,
`lib/utils/carto-tile-url.ts`, keyed by `NEXT_PUBLIC_CARTO_MAP_KEY` when set).

## Where it mounts

Leaflet touches `window` on import, so both callers load it with `next/dynamic` and `ssr: false`.

- **Map tab** (`components/parks/tabs-with-hash.tsx`): rendered only while the deferred tab is
  `map`, so a park page opened without the map downloads no Leaflet and asks for nothing. Only then
  does `useRideFigures` fetch the speed, height and duration the ride popups show
  (`/api/parks/<geo>/<park>/ride-stats`; [API budget](../architecture/api-budget.md#ride-figures-for-the-park-map-popups-on-the-map-tab-only)).
- **Blog widget** (`map-widget` fence, `components/blog/blog-map-widget.tsx`): the server fetches
  the full park, `BlogMapClient` mounts the map when an `IntersectionObserver` sees it about a screen
  and a half ahead, and a box of the map's height (`h-[65vh] md:h-[800px]`) holds the space until
  then. It passes no geo path, so its popups carry no ride figures.

A park without coordinates gets a "no map data" box instead of a map.

## Markers

`components/parks/park-map-markers.tsx`, icons from `lib/utils/leaflet-icons.ts`. Rides and shows
need coordinates and must not be out of season (`isCurrentlyInSeason !== false`,
[the season rule](../rules/a-ride-out-of-season-is-closed-and-is-not-one-of-the-parks.md));
restaurants need coordinates only. A show's popup counts down to its next performance on the shared
minute clock (`useMinuteNow`).

**`#map-show-<slug>`** opens the map on one show: `ParkTodayPanel`'s show rows link it,
`useTabHashRouting` switches to the map tab and passes the slug as `focusShowSlug`, and the map
centres on that show at zoom 19 with its popup open. A named show wins over the visitor's own
position.

## Following the visitor

The map never asks for location. `useParkMapGeolocation` (`lib/hooks/use-park-map-geolocation.ts`)
reads the site's geolocation context, which holds a position only once the visitor has granted it
([location is asked for where it is needed](../rules/location-is-asked-for-where-it-is-needed.md)).

- Within 1 km of the park's coordinates (`IN_PARK_THRESHOLD`) the visitor counts as in the park:
  the map centres on them at zoom 19, a panel lists the five nearest rides, shows and restaurants
  with the current wait or the next showtime, and `watchPosition` follows them, only while the
  permission is granted (a watch after a one-time grant ran out would prompt).
- Outside, the map centres on the park at zoom 17.
- `MapViewController` re-centres as the position moves until the visitor zooms by hand.
  `ZoomTracker` tells the two apart: Leaflet fires the same zoom events for `setView`, so a zoom the
  controller started is marked in `programmaticZoom` and does not count as the visitor taking over.

Zoom runs to 23 over tiles that stop at 19 (`maxNativeZoom`), so the last levels scale up the
level-19 tiles rather than asking for tiles that do not exist.
