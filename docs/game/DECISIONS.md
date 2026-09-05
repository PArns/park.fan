# Decisions

Routine calls made without asking, each with the reason and what would reverse it.

---

**D-001 — Feature root is `app/game/_game/**`, not `src/features/park-coaster/**`.**
The repo has no `src/` and no `features/`. It *does* have `app/admin/_app|_lib|_ui`: a top-level
non-localized route that keeps its private code beside itself in underscore folders Next will not
route. `_game/` is that convention with one folder per subsystem. Blast radius ends up smaller than
the brief's own suggestion, because the feature folder and the route folder are one tree.
*Reversed by:* the repo growing a real `features/` convention.

**D-002 — `/game` sits outside `app/[locale]`, with its own `<html>`.**
Same reason `app/admin` does. Localizing it would pull in `RouteMessages`, a generated
namespace-map entry and a `check:client-messages` failure mode, for a surface that ships in one
language on day one. HUD strings live in `_game/ui/strings.ts` as a typed record keyed by locale,
so becoming a next-intl namespace later is a mechanical change, not a rewrite.
*Reversed by:* the game shipping in six languages.

**D-003 — One token added to `proxy.ts`'s matcher.**
`game` joins `api|admin|dev|_next|_vercel` in the negative lookahead. Without it next-intl redirects
`/game` to `/en/game`, which does not exist. This is the additive entry the brief allows and the
same one `admin` already has.

**D-004 — No Havok.**
The brief names Havok only as a chunk-isolation constraint. Coaster motion is an energy integration
along an arclength-parameterized spline — a rigid-body solver would fight that, not help it — and
guests navigate a path graph, not a physics world. A ~1.5 MB WASM download for props that never
tumble is cost with no customer. *Reversed by:* crash debris, ragdolls, or free-standing physics
props becoming a feature. The chunk-isolation rule still applies to anything we add.

**D-005 — Babylon.js 9.25.0, pinned exact, four packages.**
`@babylonjs/core`, `/materials`, `/loaders`, `/gui`. Exact rather than caret because a renderer's
patch releases move shader code, and a screenshot-graded feature that silently re-renders on a
`pnpm install` is a debugging session nobody budgeted. `/gui` is used **only** for world-space
labels and 3D gizmos, per the brief; every panel is React + Tailwind.

**D-006 — three.js stays where it is.**
The glossary coaster player and the park hero scene ship on three.js 0.184 and are out of scope.
The two engines never load on the same route — both are behind `next/dynamic({ ssr: false })` on
disjoint routes — so neither reaches a shared chunk. Rewriting a working, screenshot-verified
feature to unify engines is a change with real risk and no user-visible benefit.

**D-007 — The worker owns the world; the main thread owns a read-only view.**
The alternative (shared state via `SharedArrayBuffer`) needs COOP/COEP headers site-wide, which
would change the caching and embedding behaviour of every other park.fan route. Transferable
snapshot buffers cost one copy per tick — measured against the 6 ms budget — and cost the rest of
the site nothing.

**D-008 — Snapshots are `f32`, the sim is `f64`.**
Halves the transfer and is below the visible threshold at park scale. The sim never reads back from
a snapshot, so precision loss cannot accumulate.

**D-009 — Determinism is enforced by grep, not by discipline.**
`Math.random`, `Date.now`, `new Date()`, `performance.now()` and `Set`/`Map` iteration over
identity keys are banned inside the sim and checked by `pnpm test:game-determinism`. A rule written
down is not a rule applied — this repo's own CLAUDE.md says so about `revalidate` literals, and the
same failure mode applies here.

**D-010 — Manifest validation is strict zod, unknown keys are errors.**
`zod` is already a dependency. A typo'd key that silently becomes `undefined` is exactly the bug a
manifest format exists to prevent, so `.strict()` everywhere and a named error per rejected
definition.

**D-011 — Guests are struct-of-arrays; everything else is records.**
The readable shape wins by default. Guests are the one place where 2000 objects re-touched 20× a
second put a garbage collector inside a coaster launch, so they get typed arrays and a comment
saying why.

**D-012 — No new UI kit, no new state library.**
HUD panels are shadcn primitives on `HEAVY_GLASS`. Engine state reaches React through one
`useSyncExternalStore` over the snapshot store, throttled to 4 Hz. Adding Zustand for a store with
one writer would be a second state system in a repo that has none.

**D-013 — Assets are fetched by a pinned script into a gitignored folder.**
`public/game/assets/` is not committed. `scripts/fetch-game-assets.mjs` pins every URL and its
SHA-256, `docs/game/ASSETS.md` records source + licence per file, and **every consumer has a
procedural fallback that logs when it fires**. The game is playable with the asset folder empty —
that is the acceptance criterion, not a nice-to-have, because a network-flaky first load must not
be a white screen.

**D-014 — `world:ready` is the harness contract, and it fires in the degraded case too.**
If it only fired on a perfect boot, every screenshot of a broken state would be a timeout instead of
a picture of the bug.

**D-015 — Quality preset is auto-picked and stated.**
A phone gets `low` and one honest line of copy. Silently rendering a worse scene and letting a
critic score it is how a mobile fallback becomes an unreported regression.

**D-016 — The demo park is content, not code.**
"park.fan Resort" is a scenario manifest plus blueprints inside a pack. If the showcase needs an
escape hatch into a module, the registry is not finished.

**D-017 — The optional live-park adapter is mock-first and flag-off.**
`GAME_LIVE_SEED=0` by default. It reads park.fan's own public API through the existing
`lib/api` conventions when on, and a checked-in fixture when off. Boot never awaits it: it seeds a
park *after* `world:ready`, as a command, so a slow or failing fetch costs a notification and
nothing else.

**D-018 — Scores in `STATUS.json` are the critics' real numbers.**
Including the failed rounds. A gauntlet that only records passes measures nothing.
