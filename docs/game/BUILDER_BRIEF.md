# Builder brief — read before touching anything

You are one builder agent of park.fan Coaster. You own **one folder** and nothing else.

## Read first (in this order)

1. `docs/game/ARCHITECTURE.md` — threads, world model, module contract, protocol, folders
2. `lib/game/core/types.ts` — the actual TypeScript contract (`GameModule`, `MainContext`, `SimContext`, `MainHandle`, `SimHandle`, `SimFrameWriter`, `EnvironmentState`)
3. `docs/game/CONTENT_PACKS.md` + `lib/game/content/packs/*/pack.json` — what content exists
4. `docs/game/ART_BIBLE.md` — the look you are held to
5. `docs/game/INTEGRATION.md` §2 — repo conventions (Tailwind v4 tokens, `@/components/ui`, Prettier/ESLint)
6. `lib/game/core/host.ts` and `lib/game/core/renderer.ts` — how your module is created and what the scene already has (camera, sun, cascaded shadows, default pipeline)
7. An existing module as a worked example: `lib/game/terrain/` (index → dynamic import → main; sim DOM-free)

## Ownership

- You may create, edit and delete files **only inside your folder** `lib/game/<module>/`.
- You may **not** edit `lib/game/core/**`, `lib/game/modules.ts`, the packs, `app/**`, `package.json`, `next.config.ts`, or any other module's folder. If you need a change there, write it as a precise request in `docs/game/requests/<module>.md` (what, why, exact diff if you can) and **work around it in the meantime** (e.g. register your procedural generators from your own `main()` via `ctx.registry.registerProcedural`).
- Do not run `git` (no add/commit/stash/checkout), `pnpm install`, or start/stop the dev server. The integrator commits.
- A dev server is already running at `http://localhost:3000` (Turbopack HMR). Other builders are editing other folders at the same time; if `/game` shows a compile error in a file you do not own, wait 20 s and retry.

## Rules that a green build cannot enforce (`pnpm test:game-lint` checks some)

- **Deep Babylon imports only**: `import { X } from '@babylonjs/core/Path/to/x'`. Never `from '@babylonjs/core'`. Side-effect imports for scene components are your job (e.g. `import '@babylonjs/core/Materials/Textures/Loaders/envTextureLoader'`).
- **`index.ts` is loaded on the worker**: it may import types from Babylon (`import type`) but must reach Babylon code only through `await import('./main')`. Anything in a `sim*.ts` file must be DOM-free and Babylon-free.
- **Node strip-only TypeScript** in every file the sim can reach: no constructor parameter properties (`constructor(private x: T)`), no `enum`, no `namespace`. Assign fields in the body.
- **No `Math.random`**: use `ctx.rng` (a `Rng`, seeded per module). Determinism is a hard requirement.
- Money in integer cents; metres, +Y up, right-handed (`scene.useRightHandedSystem = true` is already set).
- Never touch `window`, `document`, `navigator` at module scope.
- No text a human sees may read as machine-written; UI strings go through `lib/game/i18n` — request keys via `docs/game/requests/<module>.md` and use the `t()` you are handed (ui module) or plain English in world-space labels until the keys land.
- No Frontier / Planet Coaster names, textures, icons or extracted assets. CC0 only. Fetched files under `public/game/assets/<vendor>/...` are optional: **procedural fallback is the default in this repo** and must look good on its own (real PBR, normal maps generated procedurally, no roughness-1.0 grey).

## Failure isolation

`main()` and `sim()` are wrapped in try/catch by core; a throw makes your module a stub. Do not rely on that: guard optional features yourself (a missing asset, a shader that will not compile on WebGL2) and log once with `console.warn('[game/<module>] …')`.

## Performance budget (whole game; you get a slice)

≥ 50 fps at 1080p on a mid-range laptop, ≤ 1200 draw calls in the demo park, ≤ 6 ms per sim tick across all modules. Thin instances for anything repeated, `freezeWorldMatrix()` for anything static, LOD for foliage/guests/props, never per-mesh raycasts on hover (use the octree / `scene.pick` with a predicate on a small set, or GPU picking).

## Verify — screenshots are mandatory, and you must look at them

```
node scripts/game-shot.mjs --showcase=<module> --cam=overview,close,ground --tod=09:00,18:30,23:00
node scripts/game-shot.mjs --cam=overview,close --tod=12:00,22:00          # the demo park
```

Output goes to `.game-render/<…>/`: PNGs and `report.json` (console errors, hydration warnings, fps, draw calls, tris, sim ms, chunk sizes). **Open the PNGs with the Read tool and judge them against the art bible.** Zero console errors is a gate. Headless Chromium uses SwiftShader, so fps there is meaningless — draw calls and triangle counts are what you budget with.

Your module must implement `showcase(ctx)` staging a representative scene of only your module (`/game?showcase=<id>`), and the camera presets `overview`, `close`, `ground` (core's fallback presets) must show something sensible in it — move the camera in your showcase if needed via `(ctx.scene as Scene).activeCamera`.

Run before you report: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "lib/game|app/game"` (must print nothing), `npx eslint lib/game/<module>`, `npx prettier --write lib/game/<module>`, `pnpm test:game`.

## Report

Write `docs/game/reports/<module>.md` with: what exists (public API, events, owned state), what you verified (which PNGs you looked at, what you saw, numbers from report.json), what is missing or weak (honest, ranked), and requests for core. Your final message to the integrator is that file's summary plus the PNG paths. Never inflate: a grey box is a grey box.
