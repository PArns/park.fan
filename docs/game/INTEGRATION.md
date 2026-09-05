# park.fan Coaster — integration contract

What this repository already is, and the one line of justification for every convention the game
adopts or departs from. Written **before** any game code, and re-read before any change that
touches a shared file.

The rule this document exists to enforce: **the game is a guest in this codebase.** It brings no
second stack, no second design system, no second Tailwind config, no second lint setup. Where the
repo has an opinion, the game takes it. Where the repo has none, the game states its own here.

---

## 1. Inventory

| Question | Answer in this repo | Where |
| --- | --- | --- |
| Framework | Next.js **16.3.3**, **App Router** | `package.json`, `app/` |
| React | 19.2.8 | `package.json` |
| TypeScript | **6.0.3**, `strict: true`, `noEmit`, `moduleResolution: bundler`, `isolatedModules` | `tsconfig.json` |
| Path alias | **`@/*` → `./*`** (one alias, repo root). No `src/`. | `tsconfig.json` |
| Package manager | **pnpm 11.16.0**, Node ≥ 24 (`.nvmrc` = 24) | `package.json`, `.nvmrc` |
| Bundler | **Turbopack** (`next build --turbo`); webpack only for `analyze` / `build:webpack` | `package.json` |
| Styling | **Tailwind v4** via `@tailwindcss/postcss`. No `tailwind.config.*` — tokens live in `@theme inline` inside `app/globals.css`, automatic content detection. | `postcss.config.mjs`, `app/globals.css` |
| Component kit | **shadcn/ui, new-york, neutral base, CSS variables**, `lucide-react` icons | `components.json`, `components/ui/` |
| Class helper | `cn()` = `twMerge(clsx(...))` | `lib/utils.ts` |
| Glass language | `GlassCard` + exported recipes `HEAVY_GLASS` / `TILE_GLASS` / `PANEL_FLAT` | `components/common/glass-card.tsx` |
| Control heights | `buttonVariants` — 32 / 36 / 40 desk, **44 on phones** (`max-sm:`) | `components/ui/button.tsx` |
| Chapter headers | One component for the whole site: `ChapterHeading` | `components/common/chapter-heading.tsx` |
| Server state | **TanStack Query v5** (`staleTime` 5 min, `refetchOnWindowFocus: false`) | `lib/providers.tsx` |
| Client state | React state + context (`GeolocationProvider`, `TemperatureUnitProvider`). **No Redux/Zustand/Jotai.** | `lib/contexts/` |
| Theme | `next-themes`, **dark by default**, `.dark` class variant | `app/[locale]/layout.tsx`, `app/globals.css` |
| Fonts | `Geist` via `next/font/google` → `--font-geist-sans`; `--font-mono` is aliased to it | `app/[locale]/layout.tsx` |
| i18n | **next-intl v4**, 6 locales `en de fr it nl es`, messages **routed not bundled** (`RouteMessages` + `i18n/route-namespaces.generated.ts`) | `i18n/` |
| Middleware | **`proxy.ts`**, not `middleware.ts`. Matcher excludes `api`, `admin`, `dev`, `_next`, `_vercel`, dotted files. | `proxy.ts` |
| Lint | ESLint 10 flat config, `eslint-config-next` core-web-vitals + typescript. Unused vars = **warn**, `^_` exempt. | `eslint.config.mjs` |
| Format | Prettier — `singleQuote`, `semi`, `printWidth: 100`, `trailingComma: es5`, `tabWidth: 2`, `prettier-plugin-tailwindcss` | `.prettierrc` |
| Tests | **No test runner.** Node's own `--experimental-strip-types` scripts, one `pnpm test:<thing>` per unit. Browser checks are Playwright **scripts**, not a Playwright project. | `package.json`, `scripts/` |
| CI | GitHub Actions runs only the non-blocking `impeccable` design detector + a Vercel comment sync. The gate is `pnpm release:check` + `next build`. | `.github/workflows/` |
| Deploy | Vercel. `vercel.json` holds only crons. Caching is expressed as `CDN-Cache-Control` rules in `next.config.ts`. | `vercel.json`, `next.config.ts` |
| `public/` | Flat, plus `public/media/**` (the media database, sidecar-indexed) and `public/textures/`. | `public/` |
| Existing 3D | **three.js 0.184** already ships — the glossary coaster player (`lib/three/coaster`, `components/glossary/coaster-player.tsx`), loaded `next/dynamic({ ssr: false })`. | `lib/three/` |

---

## 2. Conventions the game adopts

One line each. No exceptions taken.

1. **App Router**, server components by default; `'use client'` only where the DOM or a hook needs it.
2. **`@/` alias for every cross-folder import.** No relative `../../..` out of a module.
3. **TypeScript strict.** No `any` in module public APIs; `unknown` + a narrowing guard instead.
4. **Tailwind v4 tokens only** — colours come from `var(--…)` names already in `@theme inline`; the game adds new tokens by *extending* that block, never by forking it or shipping a second config.
5. **shadcn/ui primitives** (`Button`, `Badge`, `Card`, `Tabs`, `Tooltip`, `Popover`, `ScrollArea`, `Separator`, `Dialog`, `Sheet`, `Skeleton`) for every DOM control the HUD needs.
6. **`GlassCard` / `HEAVY_GLASS` / `TILE_GLASS`** are the game's panel material. The HUD does not invent a fill.
7. **`cn()`** for every conditional class.
8. **`lucide-react`** for every icon.
9. **Button size scale** — no hand-written control heights; `size="sm" | "default" | "icon"` and the phone tier comes free.
10. **`ChapterHeading`** for any headed section the game renders in DOM.
11. **TanStack Query** for anything fetched over HTTP (the optional live-park seed adapter). The engine's own state is *not* server state and does not go through Query.
12. **Prettier + ESLint as configured.** `pnpm lint` and `pnpm format:check` must stay green; `_`-prefixed args for deliberate unused.
13. **Node `--experimental-strip-types` test scripts** with a `pnpm test:game-*` name, matching `scripts/test-*.mjs`.
14. **Playwright as a script**, matching `scripts/render-coaster-elements.mjs` and `scripts/measure-cls.mjs` — not a new test framework.
15. **`next/dynamic({ ssr: false })` for the 3D chunk**, exactly the shape `components/glossary/coaster-player.tsx` already uses, including a loading fallback that reserves the real height (CLS requirement).
16. **Dark theme is the design.** The game does not ship a light variant of the 3D world; the HUD inherits `.dark`.
17. **`public/` is flat-ish and versioned** — game assets go under `public/game/**` with the same "a file has provenance" discipline the media database applies.
18. **Docs live in `docs/`** with a `docs/README.md` link, same as every other feature.

---

## 3. Deviations, each with its reason

| Deviation | Reason |
| --- | --- |
| **Feature root is `app/game/_game/**`, not `src/features/park-coaster/**`.** | This repo has no `src/` and no `features/`. The established convention for a top-level, non-localized route that owns private code is `app/admin/_app`, `app/admin/_lib`, `app/admin/_ui` — an underscore-prefixed private folder inside the route. `_game/` is that convention with one folder per subsystem inside it. Blast radius is *smaller* than the brief asks for: the feature folder and the route folder are the same tree. |
| **`/game` is not under `app/[locale]`.** | Same reason `app/admin` is not: the game is not localized at launch, and putting it there drags in `RouteMessages`, an entry in the generated namespace map, and a `pnpm check:client-messages` failure whenever that map goes stale. It renders its own `<html>` like the admin does. The HUD's strings live in `_game/ui/strings.ts`, a plain typed record, ready to become a namespace later. |
| **One-token edit to `proxy.ts`.** | `game` is added to the middleware matcher's negative lookahead beside `admin` and `dev`. Without it next-intl redirects `/game` → `/en/game`, which does not exist. This is the same additive entry `admin` and `dev` already have. |
| **Babylon.js 9.25 added alongside three.js 0.184.** | The brief specifies Babylon; the repo's three.js is the glossary coaster player and the park hero scene, both shipping and both out of scope. Two engines never load on the same route — three.js is behind `next/dynamic` on `/[locale]/glossary/*` and the homepage, Babylon behind `next/dynamic` on `/game`. Neither reaches the shared chunk. |
| **No Havok.** | The brief names it as a chunk-isolation constraint, not a requirement. Coaster motion here is an energy-integrated model on an arclength-parameterized spline (the brief's own wording), which a rigid-body solver would fight, not help. Guests navigate a path graph, not a physics world. Adding a ~1.5 MB WASM for props that never tumble is cost without a customer. Revisit if crash debris or ragdolls become a feature. See `DECISIONS.md` D-004. |
| **No new test framework.** | The repo has none. Game unit tests are `node --experimental-strip-types` scripts under the existing `scripts/` + `pnpm test:*` naming. |
| **No `tailwind.config` and no content globs added.** | Tailwind v4 in this repo has no config file at all — content detection is automatic and `app/game/**` is inside it. The brief's "additive Tailwind content globs" allowance is not needed. |
| **`next.config.ts` gets two additive keys.** | `experimental.optimizePackageImports` is *not* extended (Babylon is dynamically imported and does not benefit), but `@babylonjs/*` is added to `serverExternalPackages`-adjacent guards only if the build demands it. Any edit is listed in `DECISIONS.md` with its measured before/after. |
| **No `app/api/game/**` at launch.** | Blueprint sharing is feature-flagged and off. The game is fully playable with zero network calls after the route's own chunks land. |

---

## 4. The blast-radius ledger

Every file outside `app/game/**` and `docs/game/**` this feature is allowed to touch, and why.
Anything not on this list is a bug in the change.

| File | Change | Status |
| --- | --- | --- |
| `package.json` | `+ @babylonjs/core, /materials, /loaders, /gui` (deps); `+ pnpm test:game-*`, `+ pnpm verify:game`, `+ pnpm fetch:game-assets` (scripts) | additive |
| `pnpm-lock.yaml` | consequence of the above | additive |
| `proxy.ts` | `game` in the matcher's negative lookahead | additive, one token |
| `next.config.ts` | `Cache-Control` for `/game/assets/**` only | additive |
| `docs/README.md` | one row linking `docs/game/` | additive |
| `.gitignore` | `public/game/assets/` (fetched, not vendored) + harness output dirs | additive |
| `scripts/` | new files only, no edits to existing scripts | additive |

No edits to `app/[locale]/**`, `components/**`, `lib/**`, `i18n/**`, `messages/**`, `app/globals.css`.
The HUD imports from `components/ui/*` and `components/common/*`; it does not change them.

> **`app/globals.css` is the one that looks tempting and is not allowed.** Game-only tokens live in
> `app/game/_game/ui/game-tokens.css`, imported by `app/game/layout.tsx`, defined with `@theme` so
> they extend the same token space rather than fork it. A token the *site* would also want is a
> separate PR against `globals.css`, not a line smuggled in with a game.

---

## 5. Route shape

```
app/game/
  layout.tsx          server — own <html lang>, dark class, Geist, game-tokens.css
  page.tsx            server — metadata, robots, SEO copy, <noscript>, loading shell
  game-client.tsx     'use client' — next/dynamic(() => import('./_game/boot/stage'), { ssr: false })
  error.tsx           route-level error boundary (engine crash → readable page, not a white screen)
  _game/              the feature root; one folder per subsystem
```

`page.tsx` never imports anything from `_game/` except types. `game-client.tsx` is the only
module that can reach the engine, and it reaches it through exactly one dynamic import.

Nothing under `_game/` touches `window`, `document` or `navigator` **at module scope** — every
browser global is read inside a function that only the client stage calls. `pnpm test:game-ssr-safety`
greps for the violation because a build can be green and the rule still broken (the module is only
imported on the client, so SSR never evaluates it — until somebody imports it from a server file).

---

## 6. Budgets this integration is measured against

| Budget | Number | How it is proven |
| --- | --- | --- |
| Shared/vendor chunk growth on non-`/game` routes | **0 bytes** | `ANALYZE=true pnpm analyze` before/after, both numbers in `STATUS.json` |
| `/game` first-load JS before the engine chunk | ≤ 120 KB brotli | analyzer |
| LCP / CLS regression on any other route | none | `pnpm measure:cls --late` on the routes the CLS rule names |
| `next build` | clean, no new warnings | CI |
| `pnpm lint`, `pnpm format:check` | green | CI |
