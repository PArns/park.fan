# Requests from the `track` builder to core

Nothing here blocks the module. Every item is worked around today and the workaround is named, so
the integrator can see what it costs and what to delete when the change lands.

## 1. A `trackElements` category in the pack schema — this is the module's grading criterion

The brief says a new coaster element must come from a manifest entry rather than from code. It
does — but the manifest is `lib/game/track/elements.ts`, this module's own file, because
`core/pack-schema.ts` has `trackStyles` (rails, ties, spine, supports, colour) and no category for
element geometry. The style half is already data-driven off the registry; the element half is not,
and a pack cannot ship a "dive drop" today.

The seam is in place and wired both ways:

- `registerTrackElement(def)` registers at runtime and is exposed on the main handle as
  `api.elements()`; `selftest.mjs` registers one and builds a layout with it.
- `registerTrackElementsFromPack(manifest)` already reads a `trackElements` array off any manifest
  that carries one. On the two bundled packs it is a no-op, because nothing produces the field.

```ts
// core/pack-schema.ts
const trackElementOp = z.object({
  op: z.enum(['straight', 'turn', 'pitch', 'bank', 'roll', 'crest', 'loop', 'spin', 'hill', 'ramp']),
  // Values are numbers or expressions over the element's parameters: "$height", "max(1, $h/2)".
  args: z.record(z.string(), z.union([z.number(), z.string()])),
});

export const trackElementSchema = z.object({
  id: z.string(),
  name: localized,
  category: z.enum(['station','lift','drop','straight','turn','hill','inversion','brake','special']),
  params: z.record(
    z.string(),
    z.object({ default: z.number(), min: z.number().optional(), max: z.number().optional(), unit: z.string().optional() })
  ).default({}),
  ops: z.array(trackElementOp).min(1),
  drive: z
    .object({
      kind: z.enum(['station', 'lift', 'launch', 'brake', 'block', 'transport']),
      speed: z.union([z.number(), z.string()]).optional(),
    })
    .optional(),
});
// … trackElements: z.array(trackElementSchema).default([]) in packManifestSchema
// … 'trackElements' in Registry's category list
```

Two notes for whoever writes it. The op set is deliberately small — it is an instruction set, and
the file that dispatches on it (`ops.ts`) is the only `switch` in the module. And the argument
expressions are evaluated by `expr.ts`, a forty-line recursive-descent parser over
`+ - * / % ( ) $param` and eight named functions — **not** `Function()`, because
`registry.loadPackFromUrl` accepts a manifest from a URL and handing that to the JavaScript
compiler turns a pack into an execution surface.

**Workaround today:** the nineteen elements live in this module's `elements.ts`, which is data with
no logic in it, plus the two registration functions above.

## 2. Physics numbers on `trainStyleSchema` — three fields, all currently constants here

`resolveTrain()` needs a mass, a drag area, a rolling resistance and a heartline height, and
`trainStyleSchema` carries none of them. They are derived here from what the pack does say:

| Number             | Derived from today                                                             |
| ------------------ | ------------------------------------------------------------------------------ |
| `massPerCar`       | `300 kg × car.length` — 900 kg for a 3 m car                                    |
| `dragArea` (C_d·A) | `0.9 × width × height + 0.05 × cars × width`                                    |
| `rollingResistance`| `0.024` when the TRACK style's `supports` is `timber`, `0.019` otherwise        |
| heartline height   | the constant `HEARTLINE_HEIGHT = 1.1` in `types.ts`                             |

The last one is the one that will bite. The heartline is the axis the track rolls around and the
line the physics integrates, so an **inverted** coaster — riders hanging below the rails — is a
negative number, and there is no way to express that today: a `trainStyles` entry for a suspended
train would be drawn and simulated as if the riders sat on top of the rails.

```ts
// trainStyleSchema.car, all optional with the defaults above
mass: z.number().positive().optional(),          // kg, empty, per car
dragArea: z.number().positive().optional(),      // C_d · A for the whole train, m²
rollingResistance: z.number().min(0).max(0.1).optional(),
heartline: z.number().optional(),                // metres above the rail plane; negative = suspended
```

The 0.019 is not a guess from the middle of a table: it is calibrated against Wodan at
Europa-Park — 40 m of lift, 1050 m of track, arriving at a brake run about 10 m up, so ~30 m of
head over 1050 m, which is 0.28 m/s² of average deceleration. The first pass used 0.030 and could
not get a 32 m wooden coaster round 850 m of its own track.

## 3. Run `lib/game/track/selftest.mjs` in `pnpm test:game` (package.json)

The same request the `paths` and `scenery` builders made, for the same reason: the checks that
matter here are invisible in a screenshot. 95 of them — that a circle's curvature is 1/R, that a
frictionless 40 m drop arrives at √(2gh), that a fully banked circle has zero lateral g and pulls
sec(φ) vertically, that a 10 m hill peaks at 10.00 m, that a corkscrew exits on the heading it
entered, that no index in a vertex buffer is out of range, and that none of the three layouts
floats a footing or drops below its own comfort limits.

```jsonc
// package.json
"test:game-track": "node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/track/selftest.mjs",
// … and add it to "test:game"
```

## 4. i18n keys for element names — small

`TrackElementDef.name` is plain English (`Vertical loop`, `Corkscrew`, `Chain lift`). The brief
allows that until the keys land, and a build bar will want them. Suggested `game.track.element.<id>`
in `lib/game/i18n`, with the manifest holding the key rather than the string — the same shape the
`paths` builder asked for.

## 5. Nothing else

Three things that could have been requests are not, because core already has them:

- `track:` is already in `FORWARDED_PREFIXES` (`core/sim-runtime.ts`), so `track:changed` reaches
  the main thread from the worker.
- `MainContext.lights` and `SimContext.module` are enough for the shadow wiring and for `trains`
  to reach the spline; nothing had to be looked up by name.
- The `coaster` entity kind is claimed through `GameModule.kinds`, which core already dispatches
  on, so a `demo-park` that drops a `coaster` entity with a `TrackData` in `entity.data` gets a
  built, drawn and simulated coaster with no further wiring.

## What `trains` will need from this module (already exposed)

Written down here so the `trains` builder does not have to read the source to find it. Main thread
(`ctx.module<TrackMainApi>('track')`) and worker (`ctx.module<TrackSimApi>('track')`) both answer:

```ts
ids(): string[]
spline(id): TrackSpline          // pointAt(s), tangentAt(s), curvatureAt(s), rollAt(s), length()
frameAt(id, s): TrackFrame       // { p, tangent, up, right } — the rolled frame, heartline-centred
length(id): number               // one lap on a circuit
closed(id): boolean
drives(id): DriveSection[]       // { kind, from, to, speed } for station | lift | launch | brake | block | transport
physics(id): TrackPhysics        // per-station v, t, gVert, gLat, gLong, jerk, rollRate + the verdict
```

Two things worth knowing before consuming them. **The spline is the heartline**, about 1.1 m above
the rail plane, so a car's rendered origin is `frameAt(s).p − 1.1 · up` and a rider's position is
the spline itself. And **`physics()` is a full-train, one-lap validation run, not a live state**:
it says what the layout does to a full train dispatched from rest, which is what a stats readout
and a "will it make it" check want, and not where a train is now.
