# Requests from the `paths` builder to core

Nothing here blocks the module. Each item is worked around today and the workaround is named, so
the integrator can see what it costs and what to delete when the change lands.

## 1. A `pathStyles` category in the pack schema — small, and it is the module's grading criterion

The brief says a new path style must come from a manifest entry rather than from code. It does —
but the manifest is `lib/game/paths/manifest.ts`, this module's own file, because
`core/pack-schema.ts` has no category for one. A pack cannot ship a path surface today.

The seam is already in place: `registerPathStyle(entry)` validates and registers at runtime
(`parsePathStyle` throws with the offending field, the same contract `parsePack` has), and the main
handle exposes it as `api.registerStyle`. Core only has to call it.

```ts
// core/pack-schema.ts
export const pathStyleSchema = z.object({
  id: z.string(),
  name: localized,
  surface: z.string(), // material recipe id
  kerb: z
    .object({ material: z.string(), width: z.number().positive(), height: z.number().positive() })
    .nullable()
    .default(null),
  widths: z.array(z.number().positive()).default([2, 4, 6, 8]),
  defaultWidth: z.number().positive().default(4),
  furniture: z.enum(['none', 'stanchion']).default('none'),
  crossGrain: z.boolean().default(false),
  wear: z.number().min(0).max(1).default(0.5),
});
// … pathStyles: z.array(pathStyleSchema).default([]) in packManifestSchema
// … 'pathStyles' in Registry's category list
```

The surface recipes themselves (`PATH_MATERIAL_MANIFEST`) could ride on the existing `materials`
category instead of a second list, but the fields do not line up: `materialSchema` has `tiling`
and a single `baseColor`, and a generated PBR surface needs a base, an accent, a joint colour, a
roughness range and a pattern name. Either extend `materialSchema` with an optional `procedural`
block or give path styles their own materials — the module does not care which, as long as it can
read them off the registry.

**Workaround today:** the six styles and ten recipes live in this module's manifest file, which is
data with no logic in it. `pnpm test:game` does not walk them (see §3); the showcase does, by
drawing all six in one frame.

## 2. i18n keys for the style names — small

`PathStyleDef.name` is plain English (`Concrete promenade`, `Timber boardwalk`). The brief allows
that until the keys land, and a build bar will want them. Suggested: `game.paths.style.<id>` in
`lib/game/i18n`, with the manifest holding the key rather than the string.

## 3. Run `lib/game/paths/selftest.mjs` in `pnpm test:game` (package.json)

Same request the `scenery` builder made, for the same reason: the checks that matter here are
invisible in a screenshot and vacuous in the demo park.

```jsonc
// package.json
"test:game-paths": "node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/paths/selftest.mjs",
"test:game": "… && pnpm test:game-paths && …",
```

It covers the extensibility gate (a style registered at runtime builds a path), the graph
invariants (components, entrance, reachable/unreachable), that `next()` actually walks a guest from
the gate to a queue head, determinism across two boots, the 20,000-queries-per-tick budget, and the
junction geometry. Four of its assertions were red when they were written, each on a real bug —
they are listed in the file's docblock.

## 4. The soak now measures reachability, and the demo park makes it vacuous — for the demo-park builder

`scripts/game-soak.mjs` no longer reports `unreachableQueues — not measured`: `reachable()` and
`entrance()` exist and the run is green. But the demo park has **no entities at all**, so the check
passes over an empty set. The moment a ride or a shop is placed there without a path to it, the
assertion goes red — correctly. Whoever lays out the demo park should lay a path network with it;
`api.create({ form, style, points, width })` on the main handle is one call per path.

Related: `entrance()` falls back to `(0, size × 0.33)` when no path exists, so the soak has a gate
to ask about rather than a null to special-case. That is a guess about where a park's gate is, and
it is only right because every park in this repo puts it on the +Z edge. A `world.meta.gate` (or a
scenario field) would make it a fact.

## 5. `MainContext` has no way to hand a diagnostic back to the harness — small, and it cost a round

`scripts/game-shot.mjs` can reach `__parkfan_game.scene()` but not a module's `api`, so "how long
did the textures take" and "how many junctions were found" are unanswerable from outside. This
module writes its stats onto `mesh.metadata.pathsStats` so a probe can read them off the scene,
which works and is a bit of a smuggling operation. A `harness.modules?: Record<string, unknown>`
exposing each handle's `api` would make it direct, and would help every critic pass.

## 6. Not a request, a warning for the next builder: face winding

The terrain module's `chunks.ts` documents that in this scene an up-facing triangle's
`cross(v1 - v0, v2 - v0)` points **down**. This module got it backwards and the whole first
screenshot pass rendered a park of thin dark kerb lines drawn on grass — every surface back-face
culled, with the right vertex count in the scene and no error anywhere. It is worth a line in
`ARCHITECTURE.md` §6 next to the budgets, because it is a five-minute fix that costs a round to
find and two modules have now hit it.
