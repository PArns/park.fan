# park.fan Coaster — Decisions

Routine decisions taken without asking, with the assumption behind each. Newest at the bottom.
A decision is reversible by editing the code it names; it is written down so the next session does
not re-litigate it.

| #   | Decision                                                                                                                                                                 | Assumption / reason                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Route is `app/game/**`, outside `app/[locale]`, excluded from the proxy matcher                                                                                          | The brief says "reachable at `/game`". The repo's only precedent for an unprefixed route is `/admin` and `/dev`, both excluded in `proxy.ts`. A localized `/de/game` would need 6× metadata, hreflang and the routed-messages map for a page that is one canvas.                                                                     |
| 2   | Feature root is `lib/game/**`                                                                                                                                            | No `src/` in the repo; engines live under `lib/` (`lib/three`, `lib/planner`). One folder keeps the blast radius auditable with a single `git diff --stat lib/game`.                                                                                                                                                                 |
| 3   | No Havok                                                                                                                                                                 | Trains run on an arclength-parameterised spline with an energy model; guests walk a path graph; nothing needs rigid bodies. Havok is WASM, 2 MB, non-deterministic across platforms, and would have to live in the worker where the render thread cannot see it anyway. Splash/foam/particles are visual and run on the main thread. |
| 4   | Right-handed Babylon scene (`scene.useRightHandedSystem = true`), metres, +Y up                                                                                          | The brief fixes the units; glTF is right-handed, so loaded kit assets need no mirroring. Every module's maths assumes it; `docs/game/ARCHITECTURE.md` §2.                                                                                                                                                                            |
| 5   | Two content packs are bundled as JSON modules, not fetched                                                                                                               | "Never block boot on a fetch". `core-classic` and `neon-lagoon` manifests are imported inside the game chunk. Extra packs can still be fetched from `public/game/packs/*.json` through `registry.loadPackFromUrl()`.                                                                                                                 |
| 6   | Simulation clock: 1 real second = 1 park minute at speed 1; speeds 1/2/3/5 in the HUD, 100 in the soak harness; 20 Hz fixed tick                                         | Planet-Coaster-class pacing; 20 Hz at 100× means one tick advances 5 park minutes, which the guest AI tolerates because movement is arclength-based, not per-frame.                                                                                                                                                                  |
| 7   | Game UI strings in `lib/game/i18n/`, EN + DE complete, NL/FR/ES/IT fall back to EN                                                                                       | See `INTEGRATION.md` §3. A game vocabulary of ~300 strings translated six ways by a machine would violate the "no text may read as AI-generated" rule; two languages written with care beat six written badly. The other four are a follow-up.                                                                                       |
| 8   | The HUD is dark-only                                                                                                                                                     | Glass over a rendered world reads as glass only against a dark HUD; the light theme would put white panels over a night scene. Same call `/admin` made.                                                                                                                                                                              |
| 9   | Quality presets `low/medium/high/ultra`, picked from `navigator.gpu`, `hardwareConcurrency`, `devicePixelRatio` and a 2 s frame-time probe; overridable with `?quality=` | The brief: degrade, never crash. Mobile (`pointer: coarse` + narrow viewport) gets `low` and a one-line notice in the HUD, not a blocking dialog.                                                                                                                                                                                    |
| 10  | Saves: IndexedDB database `parkfan-coaster`, store `saves`, JSON world + version; export is the same JSON                                                                | Round-trip determinism is asserted by `scripts/test-game-save-roundtrip.mjs`: `serialize(load(serialize(w))) === serialize(w)`.                                                                                                                                                                                                      |
| 11  | Terrain heights travel as `Float32Array` inside the worker protocol and as base64 in JSON saves                                                                          | A 256×256 heightmap is 262 KB as floats and ~350 KB as base64, against 1.4 MB as a JSON number array.                                                                                                                                                                                                                                |
| 12  | The build-tool command stack lives on the main thread; the worker only ever receives applied commands                                                                    | Undo/redo is a UI concern and must be instant; the worker applies `command` messages in tick order, so determinism holds as long as the command log is part of the save (it is).                                                                                                                                                     |
| 13  | Kit assets: procedural fallback is the **default in this repository**; fetched CC0 assets are an upgrade                                                                 | `scripts/fetch-game-assets.mjs` downloads Poly Haven / ambientCG / Kenney / Quaternius / KayKit files into the gitignored `public/game/assets/`. When a file is missing the module logs once and draws procedural geometry. The showcases and the harness therefore work on a fresh clone with no network.                           |
| 14  | Fan-out uses the Agent tool with one builder per module and one critic per round, coordinated from this session; scores go to `docs/game/STATUS.json`                    | The brief asks for it ("ultracode"). Each builder is told the folder it owns and is refused anything outside it; the integrator (this session) is the only writer of `lib/game/core`, `app/game` and shared files.                                                                                                                   |
| 15  | Mobile: the game loads on phones with the `low` preset and touch camera controls, but the build tools are desktop-first                                                  | The brief asks for an honest warning rather than a white screen; a full touch build UI is not in scope for round one.                                                                                                                                                                                                                |
| 16  | Babylon `@babylonjs/core` 9.25.0, `@babylonjs/loaders` (glTF), `@babylonjs/gui` (world-space labels only)                                                                | Latest 9.x on 2026-09-05. `@babylonjs/materials` is not used: water, terrain and glass are custom `ShaderMaterial`/`NodeMaterial`-free GLSL+WGSL-compatible materials via `CustomMaterial`/`PBRCustomMaterial` where possible so WebGPU and WebGL2 share one source.                                                                 |

**D-019 — `app/api/game/**` is not built yet, and the flag stays off.**
The brief calls blueprint sharing optional and flag-gated, and the game is fully playable without
it: IndexedDB saves plus JSON export/import need no server at all. What it would take to do
properly is the reason it is not a side quest — a `POST` that accepts a blueprint is a **public
write endpoint**, and this repo already knows what one costs. `/contribute` is behind a Turnstile
challenge whose **action and hostname** are checked rather than just `success: true`, because a
token solved on one form is otherwise a vending machine for another (CLAUDE.md → the admin rule).
A sharing endpoint needs that, plus a size cap, a shape validation that never executes what it
parses (a blueprint is a recorded command list), a rate limit, and a decision about who can delete
what. Shipping a version without them because the flag defaults to off would put an unauthenticated
blob upload one environment variable away from being live.
_What it would look like:_ `POST /api/game/blueprints` and `GET /api/game/blueprints/[id]`, storage
in Vercel Blob (already a dependency, no new runtime service), Turnstile with its own
`TURNSTILE_ACTIONS` entry, a zod-validated command list capped at a few hundred KB, and 404 on
every verb while `GAME_SHARING_ENABLED` is false. _Reversed by:_ somebody wanting the feature
enough to review that surface.

**D-020 — The live-park seed adapter is deferred on the same grounds, minus the security half.**
It is optional, flag-gated (`GAME_LIVE_SEED_ENABLED`), and must never block boot — so it is a
command sent _after_ `world:ready`, never an await in the boot path. The reason it is not built yet
is ordering rather than risk: seeding a park from real park.fan data means placing rides, paths and
shops, and the modules that own those are still being written. Building the adapter against
placeholder modules would mean writing it twice.

**D-021 — Wetness and seasonal tint stay a runtime material modulation; no `MaterialPluginBase` yet.**
The `environment` module asked for one, correctly: a scene-level `wetness` uniform in a plugin
registered against every PBR material is the only way to get puddles in the cavities of a path, a
sheen that follows the normal map, or water pooling by curvature. What it costs is the reason it is
not in this change — the shader has to be written **twice**, in GLSL and in WGSL, because the engine
boots WebGPU wherever the browser has it, and a mistake in it takes every material in the game down
at once rather than one of them.

What ships instead is honest about being less: `surfaces.ts` captures each material's own
`albedoColor`/`roughness` the first time it sees it and writes a modulation of the captured values
back, reversibly. It is a multiply, not a shader, and it says so. The two `metadata` conventions in
ARCHITECTURE §4 replace the name-matching fallback that would otherwise have decided a
`treehouse-roof` is foliage. _Reversed by:_ somebody wanting per-pixel wet and willing to write and
verify both shader languages against the render harness.

**D-022 — The camera's pose is not world state, and `/game` opens on a framing rather than a leftover.**
`ARCHITECTURE.md` §4 gave the camera module `modules.camera` ("last view"). It could not have
worked: `world.modules` is serialised by `serializeWorld()` in the **worker**, from the worker's
copy, and the camera exists only on the main thread — a pose written there would be read by nothing
and saved by nothing, while looking exactly like a working feature. It also should not work: a pose
changes on every mouse move, so routing it through a command to satisfy the one-writer rule would
put dozens of entries a second into `world.log` for something no simulation reads, and a save is
shared, so loading somebody else's park would teleport the reader to wherever that person's mouse
was. The view lives in `localStorage`, keyed by world name and seed, and is skipped whenever
`?harness=1`, `?showcase=` or `?cam=` is present so a restored pose can never make two harness runs
disagree. `api.pose()`/`api.setPose()` stay public, so `persistence` can put a view in a save slot
if it ever wants one. The table row is corrected.

The second half is what that left behind: with nothing remembered, the module adopted whatever
`core/renderer.ts` had set — 93.7 m up at 33.75° down, `horizonRow` −138, i.e. a park that opens
with the horizon off the top of the frame and no sky in it. No screenshot in the project could show
it, because the harness always applies a preset. `main()` now applies `overview` when there is
nothing to restore. _Reversed by:_ a `persistence` slot that wants the view in the save file after
all, which is an addition rather than a move.

**D-023 — The clock is solar time, the park is open five hours after sunset, and the fix is deferred rather than dismissed.**
`core/sun.ts` is astronomically correct for 50° N on day-of-year 91 (1 April): the elevation crosses
zero between 18:00 (+3.30°) and 18:30 (−1.49°). What nobody wrote down is that it treats **solar
time as clock time**. A real park at that latitude runs on CEST with solar noon near 13:20 local and
sunset near 20:20; this one's sun sets at 18:20 while `guests` keeps the gates open until 23:00 with
70 % of peak attendance still inside at 19:00. Five of fourteen operating hours are after dark, and
that is the reason three separate module critiques describe the same flat, dark 18:30 frame — at
18:30 the sun is already below the horizon. The exposure pinning measured across the day (ten of
seventeen sampled hours at `EXPOSURE_MAX`, from 18:00 to 06:00) is downstream of it: between 17:30
and 18:30 the sun runs 1.326 → 0.392 → 0.019 because it is setting, and no metering curve holds a
real sunset under a ceiling.

The fix is a timezone offset in `sunAngles` — +80 to +100 minutes puts sunset at 19:40–20:00 and
leaves two or three dark hours instead of five. It is **not** done here, and the reason is blast
radius rather than doubt: every report and critique under `docs/game/` quotes 18:30 numbers, and
landing it silently would make a dozen documents wrong at once. It wants its own change, with the
affected frames re-shot in the same commit. _Reversed by:_ somebody doing exactly that, or by a
decision that the park should close at dusk instead, which is the other honest answer and is a
gameplay decision rather than a rendering one.

**D-024 — The `ui` builder owns `lib/game/i18n/` as well, and it is the only module that owns two folders.**
The builder brief's one-folder rule exists to keep two agents off one file, and it has held for
thirteen modules. `i18n` is the case it does not fit: the string table has exactly one consumer that
renders, the chrome, and every other module was told to petition for keys through
`docs/game/requests/<module>.md`. That queue never moved — thirteen reports, no key requests, and a
117-key table that has not grown since core wrote it — because a builder drawing 3D geometry has
nothing to say to it. Handing it to whoever draws the interface removes the petition step for the
one agent that actually needs keys, and leaves the rule intact everywhere else: `i18n` still has a
single owner, it is just not its own agent. What does not change is who may edit it — a module that
needs a string still asks, and now it asks `ui`. _Reversed by:_ a second surface that renders text
outside the HUD (a world-space sign, a tutorial overlay owned by `scenarios`), at which point the
table wants an owner that is neither of them.

**D-025 — A walk is weighed in metres, a party has one purse, and wandering is what is left rather than a competitor.**
Two findings sat open against D-006, the time compression: 124 riders in a park day across machines
rated for 2,136 an hour, and a shop counter whose queue read 0 at every sample. Both were filed as
"there is nothing to be done until the park minute changes". Measured rather than reasoned about
— `pnpm game:day-budget` runs the real `SimRuntime` for a park day and samples the guest state
histogram every park hour — the park was delivering **0.45 interactions per visitor** and **85 % of
the population was standing IDLE at 10:00**. Three things were wrong and none of them is the clock.

**The walk penalty imported the compression into a preference.** `scoreVenue` divided a venue's
worth by `1 + minutes/9`, where `minutes` is the distance over a pace of 1.0–1.5 m per PARK minute
— so a kiosk forty metres away is a thirty-two-minute walk and loses by a factor of 4.6. Against
what? A path node two metres off carrying a flat `+0.11` for being somewhere to wander to. At 200
of 255 hunger, past its own `urgentAt`, a burger van forty metres away scored about 0.065 and the
path node 0.071. The distance is what a person weighs when they look across a plaza and it does not
change when the clock does, so the term is `1 + distance/WALK_TOLERANCE` now, swept and flat-topped
between 60 and 90 m.

**A party has one purse and it is the leader's.** Only a leader plans, so the scorer and
`shops.find()` were already reading the leader's wallet when they decided the family was going for
food — and then every follower paid for itself at the counter. A child carries 200–900 cents, which
is pocket money; it arrived at a 650-cent burger van with 420 in hand and was turned away. That is
5,824 price refusals against 1,652 sales in a measured day, each one a person who walked somewhere
for nothing. `purseOf()` is four call sites and the archetype comments already assumed it: the
`family` entry says "a parent buys for the children too" in as many words.

**Wandering is a second tier, not a candidate.** A `wander` or a `sight` answers no need, so its
score is a flat constant while a need's is a product of terms each below 1 — it cannot be outranked
on that arithmetic, only floored out. `decide` now scores both tiers and takes the fallback one only
when nothing real cleared `FLOOR`.

Measured on the demo park, one day, seed 1, all three together: **0.45 → 1.25 interactions per
visitor**, rides 66 → 275, purchases 805 → 1,974, idle at 10:00 **85 % → 11 %**, and the dominant
refusal moves from `price` (906, then 5,824 once guests started trying) to `full` (653) and `balk`
(237) — a park whose counters are too small for its crowd, which is a thing a player can fix.
`test:game-save-roundtrip`, `test:game-soak` and `test:game-shops` stay green. What this does NOT
do is settle D-006: a guest still crosses the park in a park hour, ride queues still peak at single
digits, and the 275 riders are an eighth of one machine's rated hour. _Reversed by:_ a decision to
change the compression itself, which would make `WALK_TOLERANCE` a number to re-sweep rather than a
number to delete.

**D-026 — Boredom is not something a gift shop can fix, and the walk to the fairground is the whole visit.**
Two findings from the same measurement as D-025, both about why a park with four machines rated for
2,136 riders an hour delivers 291 a day.

The small one is a modelling error and is fixed here. `souvenirs` answered the `happiness` need —
the need whose own name is "Boredom" and whose pack-declared thought is "I want to ride something."
So a bored guest thirty metres from a gift shop and a hundred and ninety from the nearest machine
cured it by buying a keyring. It has its own `souvenir` need now, declared in `core-classic` beside
the others, which is a pack edit and no code change. Worth being precise about what that bought:
**275 → 291 rides**, six per cent. It is right and it is not the lever.

The lever is the walk, and it is D-006 rather than anything in `guests`. The demo park's four flat
rides stand at (83–108, −58…−33) and the crowd is on a main street running north from the gate at
(0, 180): about **190 m**, which at 1.25 m per park minute is a **152-minute walk** against a median
stay of 330 park minutes. One round trip to the fairground is the visit. Measured rather than
argued — tripling the archetype pace (6.0 m per park minute, the same on-screen speed a ×3 slower
clock would give) and changing nothing else:

|                          | today  | pace ×3 |
| ------------------------ | ------ | ------- |
| interactions per visitor | 1.25   | 4.85    |
| riders in a day          | 291    | 3,218   |
| busiest machine          | 101    | 980     |
| ride utilisation         | 5–14 % | 12–29 % |

So the paired change is real and its size is now known: `MINUTES_PER_TICK_AT_SPEED_1` from 1/20 to
1/60 with archetype speeds ×3, which leaves a guest at 2.0 m/s on screen exactly as today and makes
a park day 42 real minutes at speed 1 instead of 14. It is **not** landed here, for the same reason
D-023 is not: it moves every number written in park minutes — `--step` counts in the harness docs,
`game-soak.mjs`'s hard-coded `speed / 20`, this script's own, ride cycle times, shop service — and
three builders are screenshotting against the current constants as this is written. It wants its own
change, with the harness arithmetic read off the constant instead of duplicating it, and the affected
frames re-shot in the same commit. _Reversed by:_ a decision that the park should be smaller instead,
which is the other honest answer and is a demo-park change rather than a clock one.
