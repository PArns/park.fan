# park.fan Coaster — Content packs

Everything a player can place, ride, buy or theme is declared in a **pack**: a `pack.json`
manifest plus assets (glTF, KTX2, audio) or procedural definitions. Packs are registered through
`registry.registerPack(manifest)`; core never imports content. Adding a ride, a shop, a scenery
theme, a flat-ride rig or a scenario rule set is a manifest change and never a core edit — that is
a graded requirement, and `scripts/test-game-registry.mjs` proves it by registering a third,
synthetic pack and asserting the game lists its items.

Two packs ship: **`core-classic`** (a classic European park vocabulary) and **`neon-lagoon`** (a
night-time water park theme with a launch coaster and neon light rigs). They exist to prove the
format handles two different themes with no code path keyed on either id.

## Manifest (`pack.json`)

```jsonc
{
  "id": "core-classic",
  "version": 1,
  "name": { "en": "Classic", "de": "Klassik" },
  "requires": [],                     // other pack ids
  "themes": [ { "id": "classic-brick", "name": {...}, "palette": { "primary": "#b04a3c", ... }, "materials": ["brick-red", "slate"] } ],
  "materials": [ { "id": "brick-red", "pbr": { "albedo": "assets/…/brick_diff_1k.ktx2", "normal": "...", "orm": "..." }, "procedural": "brick", "tiling": 2 } ],
  "scenery": [ { "id": "lamp-victorian", "name": {...}, "category": "path-furniture", "mesh": "assets/kenney/lamp.glb", "procedural": "lamp", "footprint": [0.4, 0.4], "cost": 12000, "night": { "light": { "color": "#ffd9a0", "intensity": 8, "height": 3.2 } } } ],
  "foliage": [ { "id": "oak", "mesh": "...", "procedural": "tree-broadleaf", "lod": [30, 80, 200], "scatterable": true } ],
  "shops": [ { "id": "burger", "kind": "food", "name": {...}, "need": "hunger", "price": 650, "cost": 4000, "stock": "burger", "footprint": [4, 4], "throughput": 4, "mesh": "...", "procedural": "kiosk-a" } ],
  "rides": [
    { "id": "carousel", "kind": "flat", "name": {...}, "rig": "rig-carousel", "capacity": 24, "cycleMinutes": 3, "excitement": 2.1, "fear": 0.3, "nausea": 0.6, "cost": 180000, "upkeep": 800, "footprint": [12, 12], "power": 40 },
    { "id": "wooden-classic", "kind": "coaster", "name": {...}, "trackStyle": "wood", "trainStyle": "wood-6", "carsPerTrain": 6, "seatsPerCar": 4, "maxSpeed": 25, "liftSpeed": 3, "cost": 900000, "trackCostPerM": 1800, "power": 120 },
    { "id": "body-slide", "kind": "flume", "name": {...}, "flumeStyle": "body", "trackStyle": "fiberglass", "riderKind": "body", "cost": 120000, "trackCostPerM": 900, "water": 12 }
  ],
  "rigs": [ { "id": "rig-carousel", "parts": [ { "mesh": "...", "procedural": "carousel-base" }, { "procedural": "carousel-platform", "animate": { "yaw": { "curve": "ease-in-out", "revolutions": 6 } } } ] } ],
  "trackStyles": [ { "id": "wood", "rail": { "profile": "round", "radius": 0.06, "gauge": 1.2 }, "ties": { "every": 0.6 }, "supports": "timber" } ],
  "trainStyles": [ { "id": "wood-6", "car": { "length": 2.8, "width": 1.8, "mesh": "...", "procedural": "car-wood" } } ],
  "buildings": [ { "id": "wall-brick", "category": "wall", "size": [4, 4, 0.3], "material": "brick-red", "procedural": "wall" } ],
  "audio": [ { "id": "ambience-day", "src": "assets/…/park-day.ogg", "bus": "ambience", "loop": true } ],
  "icons": { "carousel": "lucide:ferris-wheel" },
  "scenarios": [ { "id": "sandbox", "name": {...}, "rules": { "cash": 100000000, "objectives": [] } } ]
}
```

Rules:

- Every item id is unique **within its pack**; the registry keys them `pack:id` (`core-classic:carousel`).
- Every mesh entry may carry both `mesh` (a file under `public/game/assets`) and `procedural` (a
  generator name registered by the owning module). The loader tries the file, falls back to the
  generator, and logs the fallback once. A pack with no files at all is valid.
- Names are `{ en, de, … }`; missing locales fall back to `en`.
- Money is in cents. Power in kW, water in m³/h. Footprints in metres.
- `kind` is what routes an item to a module (`flat` → `rides`, `coaster` → `track`+`trains`,
  `flume` → `flumes`). A pack may declare a new `kind` only if a module registered it
  (`registry.registerKind(kind, moduleId)`); unknown kinds are listed as unavailable, never crash.
- Validation is `zod` (already a dependency): `lib/game/core/pack-schema.ts`. A failing pack is
  rejected with the path of the bad field.

## Registry API (`lib/game/core/registry.ts`)

```ts
registerPack(manifest: PackManifest): void
loadPackFromUrl(url: string): Promise<void>
registerKind(kind: EntityKind, owner: string): void
registerProcedural(name: string, factory: (scene, item) => Mesh): void
packs(): PackManifest[]
items<T extends ItemCategory>(category: T, filter?: (item) => boolean): RegisteredItem<T>[]
item<T>(category: T, key: string): RegisteredItem<T> | undefined
theme(key): Theme | undefined
```

The registry is created once per thread; the worker registers the same manifests from the `init`
message so both sides answer the same question the same way.
