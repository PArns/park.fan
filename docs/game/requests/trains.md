# `trains` — requests

**Written by the integrator, not by the module's builder.** That agent died before it wrote this
file, which left `manifest.ts` pointing at a "§1 has the patch" that did not exist. Everything below
is archaeology on the module's own source, not a record of what its author wanted, and it is marked
so nobody mistakes the two. Where the code names a limitation in its own words, the words are
quoted rather than paraphrased.

## 1. `trainStyleSchema` describes a box, and a train is not a box

`core/pack-schema.ts` gives a train style four numbers and a colour:

```ts
export const trainStyleSchema = z.object({
  id: z.string(),
  car: visual.extend({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive().default(1.2),
    seats: z.number().int().positive().default(4),
  }),
  color: color.optional(),
});
```

Nine of a `TrainProfile`'s fields are therefore inferred, and `manifest.ts` writes down each
inference with its justification — the mass from the car length at 300 kg/m, the drag area from
width × height, the rolling resistance from whether the track style's supports are timber, the
restraint from the ride's own comfort limits, the nose from the supports again, the dwell from the
seat count. Those derivations are good: they read the SHAPE of the content and never its id, which
is the axis the module would otherwise fail its gate on, and the restraint rule in particular is a
statement about what a ride does to a body rather than a lookup table.

What they are not is authorable. A pack that wants a five-across trolley on a wooden coaster, or a
vest restraint, or a heavier car than 300 kg/m implies, has to write a whole `trainProfiles`
override — the escape hatch the module built for itself and validates by hand, "because
`core/pack-schema.ts` is not this module's to edit".

**The ask:** grow `trainStyleSchema` by the fields the profile actually needs, all optional so every
existing pack keeps validating and every derivation stays the default:

```ts
  car: visual.extend({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive().default(1.2),
    seats: z.number().int().positive().default(4),
    seatsPerRow: z.number().int().positive().optional(),
    mass: z.number().positive().optional(),          // kg per car
    dragArea: z.number().positive().optional(),      // m²
    rollingResistance: z.number().positive().optional(),
    restraint: z.enum(['lap', 'shoulder', 'vest', 'none']).optional(),
    nose: z.enum(['wedge', 'round', 'blunt']).optional(),
  }),
  dwellSeconds: z.number().positive().optional(),
  livery: z.object({ body: color, trim: color, chassis: color, seat: color }).partial().optional(),
```

Then `trainProfiles` stops being the only way to say an ordinary thing, and the hand-rolled
validator in `manifest.ts` can go.

## 2. A coaster is `kind: 'coaster'`, a guest only looks for `kind: 'ride'`

`track/index.ts` claims `kinds: ['coaster']`; `rides/index.ts` claims `kinds: ['ride']`;
`guests/sim.ts` builds a ride venue in `rebuildVenues()` from `entity.kind === 'ride'` and from
nothing else. **So no guest in this game can ride a coaster.** The bridge that `rides` and `guests`
built between them — `join`/`place`/`board`/`leave`/`lastRefusal`, deliberately the same five verbs
on both sides — has no counterpart on the coaster side, and `trains`' own `cycleSeconds()` and
`ridersPerHour` are computed, published on `FleetStatus`, and read by nothing in the repository.

This has been invisible because the demo park has no coaster in it (its `track` plot is 58 × 48 m
and the smallest bundled layout does not fit — see the open issue in `STATUS.json`), so the gap has
never cost a frame. It is not a small ask and it is not this module's alone: somebody has to decide
whether a coaster's queue is `rides`' model with a different geometry source, or a sixth verb set
on `trains`. The honest recommendation is the former — one queue model in the park, `trains` supplies
`cycleSeconds` and the seat count where `rides` reads a `cycleMinutes` from a manifest.

## 3. Nothing consumes the analytic throughput, and it is the one number that has to be analytic

`statusOf()` computes dispatches per hour as `3600 / cycleSeconds × trains` rather than counting
them, and says why in its own comment: a counted figure "would be wrong by whatever `clock.speed`
is", because a train integrates in RIDE seconds at a fixed 20 Hz while the rest of the sim
integrates in park minutes. At speed 100 a coaster genuinely completes fewer cycles per park hour
than reality, and `TrainsSimApi.cycleSeconds()` exists so a manager panel can report the real
figure instead of the observed one. `management` is a scaffold; when it is written, that is the
number it must read, and reading `dispatches` instead is a bug that will look like a balance problem.

## 4. The block system has never been photographed

`blocks.ts` is real — `planBlocks`, `blockAt`, `nextBlock`, `distanceAhead`, 86 checks in the
selftest — and no frame in this project shows two trains on one circuit with one of them held at a
block brake. That needs a park with a coaster in it running more than one train, which is item 2 of
`docs/game/requests/demo-park.md` territory rather than this module's. Until then the module's own
report says the feature is tested and unphotographed, which is the honest state.

## 5. Where two rides share a train style on different track, the first one wins

`main.ts`'s `metricsFor()` takes the gauge and the rail radius from the TRACK style of the ride the
car belongs to — correct, because a car's wheels have to sit on the rails that are actually there —
and resolves it through `roster.find((c) => c.profile === profileKey)`, i.e. the first car in roster
order. Two rides sharing one train style across two track styles (1.1, 1.2 and 1.3 m gauges ship in
the bundled packs) therefore draw one of them wrong. The module names this as a real limitation in
its own docblock. The fix is per-ride metrics rather than per-profile metrics and it is inside this
folder; it is written here because it is the kind of thing that gets rediscovered as a rendering bug.
