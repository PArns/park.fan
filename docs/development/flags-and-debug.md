# Flags and debug parameters

The build-time feature flag, and the two URL parameters that simulate a visitor in a park
(`?sim=`) or a park in an unusual state (`?state=`). Open it before adding a feature toggle or
when testing in-park features from a desk.

## Build-time flags

| Variable                   | Default | Effect                                                                                                                                                                                                                            |
| -------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_DIRECT=1` | off     | The browser sends nearby, favorites, trips and push straight to api.park.fan instead of the `/api/*` relays. The API must allow the origin first ([the rule](../rules/a-request-no-cache-can-share-goes-to-the-api-directly.md)). |

`NEXT_PUBLIC_ASSISTANT=off` is the exception to "default off": it is an emergency switch for
Parky, whose real switch and rollout share live in the admin and are read in the browser after the
first paint, so no server markup depends on them. `?assistant=on` shows Parky for the session
([assistant](../features/assistant.md#rollout)).

A flag is a `NEXT_PUBLIC_*` env var, default off, read into a constant so the unused branch
tree-shakes out and Server and Client Components read the same value. To add one: create
`lib/config/features.ts` for the constant, list the variable in `.env.example`, and gate on the
constant.

**No per-request flag systems.** The header, the footer, the parks menu and the planner launcher
render in `app/[locale]/layout.tsx`, the layout of every prerendered route. A per-request flag (the
Flags SDK) reads headers and cookies and would turn all of them dynamic, so anything in the layout
can only be gated at build time. Debug overrides go through the URL parameters below.

## `?sim=`: a visitor in a park

Shows the homepage's **in-park** view (headliners, live waits, seasonal handling) without standing
in a park. Append to any page:

| Value                   | Effect                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `?sim=in_park`          | standing in the default park, Phantasialand                                                                                    |
| `?sim=efteling` etc.    | a preset: `phantasialand`, `efteling`, `europapark`, `disneylandparis`, `disneylandanaheim`, `magickingdom`                    |
| `?sim=50.79,6.87`       | arbitrary `lat,lng`                                                                                                            |
| `?sim=compass`          | the in-park compass demo, Phantasialand laid out around the device ([below](#the-compass-demo-works-in-production-simcompass)) |
| `?sim=compass:<preset>` | the same with another preset; the two American ones are open while Europe sleeps                                               |

Nothing is fabricated: `/api/nearby` replaces the request's coordinates with the chosen point, so
the real backend returns a real `in_park` answer with real `isHeadliner` and `isCurrentlyInSeason`.
`useNearbyParks` (`lib/hooks/use-nearby-parks.ts`) forwards the parameter, runs without GPS and
bypasses the localStorage cache so simulated and real results never mix.

**Off in production only.** `isSimulationEnabled()` (`lib/nearby-simulation.ts`, with the presets
and `resolveSimLocation`) reads `VERCEL_ENV` (previews run with `NODE_ENV=production`, so that
cannot tell them apart) and falls back to `NODE_ENV` off Vercel: on in `next dev` and on preview
deployments.

### The compass demo works in production (`?sim=compass`)

The compass is only worth testing on a real phone with a magnetometer, where a preview URL is not
always at hand, so this one value needs no gate: it overrides nothing on the server.
`resolveSimLocation()` does not know it and `/api/nearby` ignores it. `ParkCompassSlot` asks
`/api/nearby` for the preset's coordinates itself, a request any visitor may make, and draws that
park's real answer as a labelled demo („Demo: Phantasialand um dich herum").

With a location fix every ride is moved so that the preset's standing point lies where the device
is (`relocate()` in `lib/utils/compass.ts`, in metres east and north, so distances and bearings
survive). The park is put down once and then stays; later fixes move the reader through it. A
phone's first fix is usually a Wi-Fi or cell estimate tens or hundreds of metres out, so while the
fix is worse than 25 m (`DEMO_SETTLED_M`, `components/home/park-compass.tsx`) each clearly better
one (a fifth tighter) puts the park down again, and the first fix within 25 m pins it. Without a
fix the reader stands on the preset point and the banner offers „Standort nutzen"; „Demo beenden"
is the same page without `?sim`. The hero's own nearby request stays on the real position
(`useHomeNearbyParks` treats a compass value as no simulation, via `resolveCompassDemo()`).

## `?state=`: a park in an unusual state

Patches the park payload into states almost no park is in when you look: `?state=` on any park
page, scenarios combined with commas (`?state=warning,holiday,neighbors,busy`).

| Scenario    | Patches in                                                         |
| ----------- | ------------------------------------------------------------------ |
| `warning`   | a severe DWD-shaped weather warning, German text with `*En` fields |
| `extreme`   | an extreme weather warning                                         |
| `holiday`   | a public holiday on today's schedule                               |
| `school`    | a school holiday on today's schedule                               |
| `bridge`    | a bridge day                                                       |
| `neighbors` | school breaks from four regions in three neighbouring countries    |
| `busy`      | a very high crowd level, 55 min average and 110 min peak wait      |
| `closed`    | park status and today's schedule `CLOSED`                          |
| `rain`      | rain in the nowcast                                                |
| `all`       | everything that can coexist (not `closed`, not `rain`)             |

Unlike `?sim=` this makes the page say things that are not true, so it has two fences:
`isSimulationEnabled()` (off in production) and the `ParkSimulationNotice` band the page shows
while a scenario is active. The parser is `parseParkSimulation()` (`lib/parks/park-simulation.ts`);
an unknown value degrades to the real park. Weather is part of the live poll, so `/api/parks/[…]`
applies the same scenarios to its snapshot and `useLiveParkData` forwards the parameter; such a
response is `no-store`.

Analytics events skip a visit with either parameter ([analytics](analytics.md#filters-and-the-rain-plan)).
