# Bahnprofil Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the ride ↔ glossary link work and look like it means something: fix the prefix bug that empties every term page, silence two console errors, and turn the ride profile from a flat list into a track rail with a shared 3-D viewer.

**Architecture:** Term resolution moves into one shared helper (`resolveRideProfile`) so the hero teaser and the profile section can never disagree on what a ride contains. The rail is the only new client component; it owns selection state and mounts `CoasterPlayer` lazily, so three.js is fetched on the first tap rather than on every coaster page. Everything else stays a Server Component.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, next-intl.

## Global Constraints

- **Element order is meaningful and repeats are intentional.** Never dedupe or sort `profile.elements` (CLAUDE.md).
- **Reuse before building.** `GlassCard`, `Badge`, `SectionHeading`, `CoasterPlayer`, `AttractionMetaBadges` already exist (CLAUDE.md §Reuse existing components).
- **`typicalPeakWait` arrives ABSENT, not null.** The API's global `ExcludeNullInterceptor` deletes null-valued keys from every response. Type it `typicalPeakWait?: number | null` and branch on absence. Rendering `0` would read as "never a queue". Measured: 6 of 92 rides under `launch` have no baseline.
- **A term can have fewer than three rides.** `celestial-spin` has exactly one. The highlight strip must lay out at one and two entries.
- **All six locales, every time:** `de`, `en`, `es`, `fr`, `it`, `nl`. A missing key throws in next-intl.
- **Glossary URLs carry their own locale segment.** Use plain `next/link` with `prefetch={false}` for glossary hrefs (see the comment at the top of `ride-profile-section.tsx`), and `@/i18n/navigation`'s `Link` for park/ride hrefs.
- **Verification is `pnpm lint` and `pnpm exec tsc --noEmit`.** There is no test suite. Run `pnpm prebuild` once in a fresh worktree first, or tsc reports phantom missing modules for generated files.

---

### Task 1: Fix the API layer

The bug that started this: `/glossary/terms/…` 404s because every other module in the repo calls `/v1/…`. Both functions swallow it and return empty, so `GlossaryTermRides` renders nothing.

**Files:**
- Modify: `lib/api/glossary-rides.ts`
- Modify: `lib/api/types.ts` (`TermAttraction`)

**Interfaces:**
- Produces: `getAttractionsForTerm(termId: string, sort?: 'park' | 'popularity'): Promise<TermAttraction[]>`, `getRideCountsByTerm(): Promise<Record<string, number>>`, and `TermAttraction` widened with `typicalPeakWait?: number | null` and `isHeadliner?: boolean`.

- [ ] **Step 1: Widen the type**

In `lib/api/types.ts`, add to the `TermAttraction` interface after `openedYear: number | null;`:

```ts
  /**
   * Typical peak wait in minutes — the API's P90 over 548 days, not a live
   * reading. OPTIONAL, not just nullable: the API strips null-valued keys from
   * every response, so a ride without a baseline omits this field entirely.
   */
  typicalPeakWait?: number | null;
  /** Whether the API classes this ride as one of its park's headliners. */
  isHeadliner?: boolean;
```

- [ ] **Step 2: Fix the prefix and add the sort parameter**

In `lib/api/glossary-rides.ts`, replace the body of `getAttractionsForTerm` with:

```ts
export async function getAttractionsForTerm(
  termId: string,
  sort: 'park' | 'popularity' = 'park'
): Promise<TermAttraction[]> {
  try {
    const res = await api.get<TermAttractionsResponse>(
      `/v1/glossary/terms/${encodeURIComponent(termId)}/attractions`,
      {
        params: { sort },
        next: { revalidate: REVALIDATE, tags: ['glossary-rides'] },
      }
    );
    return res?.data ?? [];
  } catch {
    return [];
  }
}
```

and in `getRideCountsByTerm` change `'/glossary/terms/counts'` to `'/v1/glossary/terms/counts'`.

- [ ] **Step 3: Verify against the real API**

```bash
curl -s "https://api.park.fan/v1/glossary/terms/launch/attractions?sort=popularity&limit=3" \
  | python3 -m json.tool | head -20
```

Expected: `total` around 92 and the first entries carrying `typicalPeakWait`. If the endpoint 404s, PR #138 on `v4.api.park.fan` has not been merged and deployed yet — `sort` is simply ignored by the old version, and the rest of this plan still works with park ordering.

- [ ] **Step 4: Verify types**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add lib/api/glossary-rides.ts lib/api/types.ts
git commit -m "fix(glossary): call the term endpoints under /v1 so rides actually load"
```

---

### Task 2: Silence the two console errors

**Files:**
- Modify: `components/layout/header.tsx:101`
- Modify: `app/[locale]/layout.tsx:167`

**Interfaces:** none — no exported surface changes.

- [ ] **Step 1: Reproduce both**

Run `pnpm dev`, open any ride page, and confirm in the browser console:
1. a hydration mismatch naming `data-startupbar-shifted` on `<header>`
2. "Encountered a script tag while rendering React component" pointing at `app/[locale]/layout.tsx`

- [ ] **Step 2: Suppress the startupbar mismatch**

The loader (`components/common/startup-bar.tsx`) is a deliberate `async` tag in the server HTML — startupbar.co verifies the installation by fetching the page. It runs before hydration and writes `data-startupbar-shifted`, `data-startupbar-original-top` and `style="top:36px"` onto every `top: 0` element. React then compares its server HTML against an already-mutated DOM.

In `components/layout/header.tsx`, add the attribute to the `<header>` element opening tag, above the existing `className`:

```tsx
      /* The startupbar loader (see components/common/startup-bar.tsx) shifts every
         `top: 0` element down by 36 px BEFORE React hydrates, writing inline `top`
         and two data attributes onto this tag. React must not treat that as a
         mismatch — the shift is supposed to survive, and React does not revert it. */
      suppressHydrationWarning
```

- [ ] **Step 3: Check the other two `top: 0` elements**

The loader sweeps every `fixed`/`sticky` element at `top: 0`, so `components/layout/language-banner.tsx:116` and `components/parks/park-background.tsx:46` are candidates too. Add the same attribute **only where a mismatch actually appears in the console** — `language-banner.tsx` is `'use client'` and may not server-render at all depending on its mount guard. Do not add it speculatively: `suppressHydrationWarning` hides real bugs on the element it is applied to.

- [ ] **Step 4: Fix the inline script**

React 19 warns because a raw `<script>` in the component tree never executes on a client render. `next/script` handles this: inline content is supported (an `id` is **required**), and `beforeInteractive` is "injected into the initial HTML from the server" and "always injected inside the `head`". That runs the script *earlier* than today's placement in `<body>`, so the no-flash guarantee gets stronger.

In `app/[locale]/layout.tsx`, replace the raw `<script dangerouslySetInnerHTML={{...}} />` at line 167 with:

```tsx
        <Script
          id="temp-unit-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var m=document.cookie.match(/(?:^|; )temp_unit=([CF])/);var u=m&&m[1];if(!u){var r;try{r=new Intl.Locale(navigator.language).region}catch(e){r=(navigator.language||'').split('-')[1]}u=['US','MM','LR','BS','KY','PW'].indexOf((r||'').toUpperCase())>-1?'F':'C'}document.documentElement.setAttribute('data-temp-unit',u)}catch(e){document.documentElement.setAttribute('data-temp-unit','C')}})();",
          }}
        />
```

`Script` is already imported in this file (it is used for Umami below).

- [ ] **Step 5: Verify the fix did not reintroduce the flash**

This is the one that matters: the script exists to set `data-temp-unit` before first paint. In the browser, with a `temp_unit=F` cookie set, hard-reload a park page and watch the weather card. Expected: Fahrenheit from the first painted frame, no visible switch from °C. Then confirm in DevTools that `<html>` carries `data-temp-unit` and the script tag sits in `<head>`.

- [ ] **Step 6: Confirm both console errors are gone**

Reload a ride page. Expected: no hydration warning, no script-tag warning.

- [ ] **Step 7: Commit**

```bash
git add components/layout/header.tsx app/[locale]/layout.tsx
git commit -m "fix(layout): stop the startupbar and temp-unit scripts tripping React warnings"
```

---

### Task 3: Foundations — element kinds, shared resolution, colour tokens

Pure data and styling, no UI yet. Splitting this out keeps Tasks 4 and 5 reviewable on their own.

**Files:**
- Create: `lib/glossary/element-kinds.ts`
- Create: `lib/glossary/ride-profile.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Produces:
  - `type ElementKind = 'launch' | 'airtime' | 'inversion' | 'turn' | 'brake' | 'other'`
  - `getElementKind(termId: string): ElementKind`
  - `interface ResolvedElement { id: string; name: string; href: string; shortDefinition: string; kind: ElementKind; playerElement: string | null }`
  - `interface ResolvedRideProfile { elements: ResolvedElement[]; types: { id: string; name: string; href: string }[]; manufacturerHref: string | null }`
  - `resolveRideProfile(profile: RideProfile, locale: Locale): Promise<ResolvedRideProfile>`
- Consumed by Tasks 4 and 5.

- [ ] **Step 1: Write the kind map**

Create `lib/glossary/element-kinds.ts`:

```ts
/**
 * What a track figure DOES to you, for colouring the layout rail.
 *
 * Deliberately not part of the API model: this is presentation. The API stores
 * glossary term ids and nothing about how a figure feels.
 *
 * Only ids that actually appear in a ride profile's `elements` need an entry —
 * anything unlisted falls back to `other` and renders neutral, which is the
 * right outcome for concept terms (airtime, hangtime, g-force) that describe a
 * sensation rather than a piece of track.
 */
export type ElementKind =
  | 'launch'
  | 'airtime'
  | 'inversion'
  | 'turn'
  | 'brake'
  | 'other';

const KINDS: Record<string, ElementKind> = {
  // — anything that accelerates or drops you —
  launch: 'launch',
  'swing-launch': 'launch',
  lifthill: 'launch',
  'vertical-lift': 'launch',
  'first-drop': 'launch',
  'beyond-vertical-drop': 'launch',
  'dive-drop': 'launch',
  'drop-track': 'launch',
  predrop: 'launch',
  'scorpion-tail': 'launch',

  // — hills that lift you out of the seat —
  'airtime-hill': 'airtime',
  camelback: 'airtime',
  bunnyhop: 'airtime',
  's-hill': 'airtime',
  'double-down': 'airtime',
  'quad-down': 'airtime',
  'wave-turn': 'airtime',
  'stengel-dive': 'airtime',

  // — anything that puts you upside down —
  'vertical-loop': 'inversion',
  corkscrew: 'inversion',
  immelmann: 'inversion',
  'dive-loop': 'inversion',
  'zero-g-roll': 'inversion',
  'zero-g-stall': 'inversion',
  'zero-g-winder': 'inversion',
  'heartline-roll': 'inversion',
  'inline-twist': 'inversion',
  'barrel-roll-drop': 'inversion',
  'banana-roll': 'inversion',
  'cobra-roll': 'inversion',
  batwing: 'inversion',
  sidewinder: 'inversion',
  'pretzel-loop': 'inversion',
  'pretzel-knot': 'inversion',
  'norwegian-loop': 'inversion',
  'sea-serpent': 'inversion',
  butterfly: 'inversion',
  bowtie: 'inversion',
  cutback: 'inversion',
  'flat-spin': 'inversion',
  'top-hat': 'inversion',
  'inclined-loop': 'inversion',
  'non-inverting-loop': 'inversion',
  'interlocking-loops': 'inversion',
  'step-up-under-flip': 'inversion',
  'twisted-horseshoe-roll': 'inversion',
  'celestial-spin': 'inversion',
  stall: 'inversion',

  // — direction changes —
  helix: 'turn',
  overbank: 'turn',
  'outerbanked-turn': 'turn',
  'raven-turn': 'turn',
  horseshoe: 'turn',
  'high-five': 'turn',
  'treble-clef': 'turn',
  turntable: 'turn',
  'switch-track': 'turn',

  // — slowing down —
  'brake-run': 'brake',
  'block-brake': 'brake',
  'trim-brake': 'brake',
  mcbr: 'brake',
  'anti-rollback': 'brake',
  splashdown: 'brake',
};

export function getElementKind(termId: string): ElementKind {
  return KINDS[termId] ?? 'other';
}
```

- [ ] **Step 2: Write the shared resolver**

Create `lib/glossary/ride-profile.ts`. This is the single source of truth for "what does this profile actually resolve to" — without it the hero can claim "9 Figuren" while the section renders seven, because unknown term ids are dropped:

```ts
import { getGlossaryTerms } from '@/lib/glossary/translations';
import { buildGlossaryTermHref } from '@/lib/glossary/segments';
import { hasCoasterElement } from '@/lib/three/coaster/elements';
import { getElementKind, type ElementKind } from './element-kinds';
import type { Locale } from '@/i18n/config';
import type { RideProfile } from '@/lib/api/types';

export interface ResolvedElement {
  id: string;
  name: string;
  href: string;
  shortDefinition: string;
  kind: ElementKind;
  /** Coaster-element id for the 3-D player, or null when the term has none. */
  playerElement: string | null;
}

export interface ResolvedTypeTerm {
  id: string;
  name: string;
  href: string;
}

export interface ResolvedRideProfile {
  elements: ResolvedElement[];
  types: ResolvedTypeTerm[];
  manufacturerHref: string | null;
}

/**
 * Resolves a curated profile's glossary term ids to names, links and rail
 * metadata.
 *
 * The API is free to be seeded with a term before the glossary entry lands
 * here, so an id this app does not know is dropped rather than rendered raw.
 * Element ORDER and REPEATS are preserved — the list is the layout walkthrough,
 * and two corkscrews in a row must read as two steps.
 */
export async function resolveRideProfile(
  profile: RideProfile,
  locale: Locale
): Promise<ResolvedRideProfile> {
  const terms = await getGlossaryTerms(locale);
  const byId = new Map(terms.map((term) => [term.id, term]));

  const elements: ResolvedElement[] = [];
  for (const id of profile.elements) {
    const term = byId.get(id);
    if (!term) continue;
    const player = term.player?.element;
    elements.push({
      id,
      name: term.name,
      href: buildGlossaryTermHref(locale, term.slug),
      shortDefinition: term.shortDefinition,
      kind: getElementKind(id),
      playerElement: player && hasCoasterElement(player) ? player : null,
    });
  }

  const types: ResolvedTypeTerm[] = [];
  for (const id of profile.types) {
    const term = byId.get(id);
    if (!term) continue;
    types.push({
      id,
      name: term.name,
      href: buildGlossaryTermHref(locale, term.slug),
    });
  }

  const manufacturerTerm = profile.manufacturerTermId
    ? byId.get(profile.manufacturerTermId)
    : undefined;

  return {
    elements,
    types,
    manufacturerHref: manufacturerTerm
      ? buildGlossaryTermHref(locale, manufacturerTerm.slug)
      : null,
  };
}
```

- [ ] **Step 3: Register the colour tokens**

In `app/globals.css`, add to the `@theme inline` block directly after the `--color-crowd-*` lines (currently ending at line 64), following the exact pattern already used there:

```css
  --color-element-launch: var(--element-launch);
  --color-element-airtime: var(--element-airtime);
  --color-element-inversion: var(--element-inversion);
  --color-element-turn: var(--element-turn);
  --color-element-brake: var(--element-brake);
```

Then define the values themselves alongside the existing `--crowd-*` definitions in `:root` and `.dark`. Match the surrounding OKLch style and keep both themes legible on the glass card:

```css
  /* :root */
  --element-launch: oklch(0.646 0.174 45.2);
  --element-airtime: oklch(0.628 0.137 241.275);
  --element-inversion: oklch(0.596 0.184 315.6);
  --element-turn: oklch(0.646 0.132 195.4);
  --element-brake: oklch(0.554 0.021 240.1);
```

```css
  /* .dark — lifted for contrast against the navy background */
  --element-launch: oklch(0.735 0.161 47.6);
  --element-airtime: oklch(0.712 0.132 240.8);
  --element-inversion: oklch(0.702 0.166 316.4);
  --element-turn: oklch(0.735 0.118 194.9);
  --element-brake: oklch(0.658 0.019 240.3);
```

Locate the existing `--crowd-*` blocks first and insert next to them rather than at the top of the file — this repo groups tokens by family.

- [ ] **Step 4: Verify**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: both exit 0. Nothing renders yet; this task only adds the foundations.

- [ ] **Step 5: Commit**

```bash
git add lib/glossary/element-kinds.ts lib/glossary/ride-profile.ts app/globals.css
git commit -m "feat(glossary): classify track figures by what they do to you"
```

---

### Task 4: The layout rail and its 3-D viewer

The centrepiece. Replaces the nine flat rows with a track the figures sit on, and a viewer that opens in place instead of sending people to the glossary.

**Files:**
- Create: `components/parks/ride-layout-rail.tsx`
- Modify: `components/parks/ride-profile-section.tsx`
- Modify: `messages/{de,en,es,fr,it,nl}.json`

**Interfaces:**
- Consumes: `ResolvedRideProfile` and `ResolvedElement` from Task 3, `CoasterPlayer` + `CoasterPlayerLabels` from `components/glossary/coaster-player`.
- Produces: `<RideLayoutRail elements={ResolvedElement[]} playerLabels={CoasterPlayerLabels} labels={{ hint, has3d, openGlossary, viewerTitle }} />`

- [ ] **Step 1: Add the translation keys**

To each of the six `messages/*.json` files, under `attraction.rideProfile`, add `openGlossary` and `viewerTitle` alongside the existing keys. German:

```json
      "openGlossary": "Im Glossar nachlesen",
      "viewerTitle": "3-D-Ansicht: {name}"
```

English:

```json
      "openGlossary": "Read up in the glossary",
      "viewerTitle": "3-D view: {name}"
```

Dutch: `"Naslaan in het glossarium"` / `"3D-weergave: {name}"`.
French: `"Consulter le glossaire"` / `"Vue 3D : {name}"`.
Spanish: `"Consultar en el glosario"` / `"Vista 3D: {name}"`.
Italian: `"Consulta il glossario"` / `"Vista 3D: {name}"`.

Also update `elementsHint` in each file — the current German text says "tippe eine Figur an, um zu sehen, was sie ist", which now undersells it. German: `"In Fahrreihenfolge – tippe eine Figur an, um sie in 3-D zu sehen."` English: `"In ride order — tap a figure to see it in 3-D."` Translate the same sense into the remaining four.

- [ ] **Step 2: Build the rail**

Create `components/parks/ride-layout-rail.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Rotate3d } from 'lucide-react';
import { CoasterPlayer, type CoasterPlayerLabels } from '@/components/glossary/coaster-player';
import { cn } from '@/lib/utils';
import type { ResolvedElement } from '@/lib/glossary/ride-profile';
import type { ElementKind } from '@/lib/glossary/element-kinds';

/** Rail colours per kind. Registered in globals.css via `@theme inline`. */
const KIND_CLASS: Record<ElementKind, { dot: string; text: string }> = {
  launch: { dot: 'bg-element-launch', text: 'text-element-launch' },
  airtime: { dot: 'bg-element-airtime', text: 'text-element-airtime' },
  inversion: { dot: 'bg-element-inversion', text: 'text-element-inversion' },
  turn: { dot: 'bg-element-turn', text: 'text-element-turn' },
  brake: { dot: 'bg-element-brake', text: 'text-element-brake' },
  other: { dot: 'bg-muted-foreground', text: 'text-muted-foreground' },
};

interface RideLayoutRailProps {
  elements: ResolvedElement[];
  playerLabels: CoasterPlayerLabels;
  labels: { hint: string; has3d: string; openGlossary: string; viewerTitle: string };
}

export function RideLayoutRail({ elements, playerLabels, labels }: RideLayoutRailProps) {
  // Null until the first tap: `next/dynamic` fetches the three.js chunk when
  // CoasterPlayer MOUNTS, so rendering it eagerly would pull the whole engine
  // onto every coaster page just because a profile exists.
  const [selected, setSelected] = useState<number | null>(null);
  const active = selected === null ? null : elements[selected];

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{labels.hint}</p>

      {/* Horizontal on every size: the rail IS the ride, and wrapping it into
          rows would break the left-to-right reading of the layout. */}
      <ol className="-mx-1 flex snap-x snap-mandatory gap-0 overflow-x-auto px-1 pb-2">
        {elements.map((element, index) => {
          const isActive = index === selected;
          const colour = KIND_CLASS[element.kind];
          return (
            <li key={`${element.id}-${index}`} className="relative shrink-0 snap-start">
              {/* The connecting track, drawn behind the dot. Not on the first item. */}
              {index > 0 && (
                <span aria-hidden className="bg-border absolute top-3 -left-1/2 h-0.5 w-full" />
              )}
              <button
                type="button"
                onClick={() => setSelected(isActive ? null : index)}
                aria-pressed={isActive}
                className="group relative flex w-24 flex-col items-center gap-1.5 px-1 py-1 text-center"
              >
                <span
                  className={cn(
                    'relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white transition-transform',
                    colour.dot,
                    isActive && 'ring-primary/40 scale-125 ring-2 ring-offset-2',
                    !element.playerElement && 'opacity-60'
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    'text-[11px] leading-tight font-medium',
                    isActive ? colour.text : 'text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  {element.name}
                </span>
                {element.playerElement && (
                  <Rotate3d className={cn('h-3 w-3', colour.text)} aria-label={labels.has3d} />
                )}
              </button>
            </li>
          );
        })}
      </ol>

      {active && (
        <div className="border-border/60 bg-background/40 space-y-3 rounded-xl border p-4">
          {active.playerElement ? (
            <CoasterPlayer element={active.playerElement} labels={playerLabels} />
          ) : null}
          <div>
            <h4 className={cn('text-sm font-semibold', KIND_CLASS[active.kind].text)}>
              {active.name}
            </h4>
            <p className="text-muted-foreground mt-1 text-sm">{active.shortDefinition}</p>
          </div>
          <Link
            href={active.href}
            prefetch={false}
            className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            {labels.openGlossary}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Rewrite the section around it**

In `components/parks/ride-profile-section.tsx`: keep it a Server Component, drop the local `resolve` helper in favour of `resolveRideProfile`, switch `GlassCard` to `variant="strong"` (the card sits over a hero photo and `/60` is not readable over bright image areas), move the manufacturer/opened/inversions block **above** the rail, and render `<RideLayoutRail />` where the `<ol>` used to be.

Build `playerLabels` exactly as `app/[locale]/glossary/[term]/page.tsx:145-157` does — the same nine keys under `glossary.player`, with `t.raw('player.keys')` for the map.

Keep the existing early return: `if (elements.length === 0 && types.length === 0 && !hasFacts) return null;`

- [ ] **Step 4: Verify in the browser**

Run `pnpm dev` and open a ride with a rich profile (`/de/parks/europe/germany/bruehl/phantasialand/taron`). Check:
- the rail reads left to right in ride order, with repeats shown twice
- at 390 px the rail scrolls horizontally and the card does not overflow the viewport
- the three.js chunk is NOT requested until the first tap (DevTools → Network, filter `three`)
- a figure without 3-D opens the panel with definition and glossary link, no empty player
- light and dark both legible

- [ ] **Step 5: Verify types and lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add components/parks/ride-layout-rail.tsx components/parks/ride-profile-section.tsx messages
git commit -m "feat(attraction): turn the ride profile into a layout rail with a 3-D viewer"
```

---

### Task 5: Hero facts and the jump link

**Files:**
- Create: `components/parks/ride-profile-teaser.tsx`
- Modify: `app/[locale]/parks/[continent]/[country]/[city]/[park]/[attraction]/page.tsx`
- Modify: `messages/{de,en,es,fr,it,nl}.json`

**Interfaces:**
- Consumes: `resolveRideProfile` from Task 3.
- Produces: `<RideProfileTeaser profile={RideProfile} locale={Locale} />`

- [ ] **Step 1: Add the translation keys**

Under `attraction.rideProfile` in all six files, add a figure-count line with plural forms. German:

```json
      "figureCount": "{count, plural, one {# Figur} other {# Figuren}}"
```

English: `"{count, plural, one {# figure} other {# figures}}"`. Dutch `figuur`/`figuren`, French `figure`/`figures`, Spanish `figura`/`figuras`, Italian `figura`/`figure`. See `docs/i18n/pluralization.md` for the repo's conventions.

- [ ] **Step 2: Build the teaser**

Create `components/parks/ride-profile-teaser.tsx`:

```tsx
import { getTranslations } from 'next-intl/server';
import { Wrench, CalendarDays, RefreshCcw, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { resolveRideProfile } from '@/lib/glossary/ride-profile';
import type { Locale } from '@/i18n/config';
import type { RideProfile } from '@/lib/api/types';

interface RideProfileTeaserProps {
  profile: RideProfile;
  locale: Locale;
}

/**
 * The ride's identifying facts, lifted into the page header.
 *
 * Year and inversions are `sm:` and up only. The header already carries the
 * park, the distance, the land and the height limit, and on a 390 px screen
 * every extra badge is another line pushed in front of the live wait time —
 * which is what people came for. The full set sits two thumb-lengths below in
 * the profile itself.
 */
export async function RideProfileTeaser({ profile, locale }: RideProfileTeaserProps) {
  const t = await getTranslations('attraction.rideProfile');
  // Resolved, NOT `profile.elements.length`: ids this app has no glossary term
  // for are dropped downstream, so the raw length would promise nine figures
  // where the rail renders seven.
  const { elements } = await resolveRideProfile(profile, locale);

  const hasFacts =
    Boolean(profile.manufacturer) || profile.openedYear !== null || profile.inversions !== null;
  if (!hasFacts && elements.length === 0) return null;

  return (
    <>
      {profile.manufacturer && (
        <Badge variant="outline" className="gap-1">
          <Wrench className="h-3 w-3 shrink-0" aria-hidden="true" />
          {profile.manufacturer}
        </Badge>
      )}
      {profile.openedYear !== null && (
        <Badge variant="outline" className="hidden gap-1 tabular-nums sm:inline-flex">
          <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
          {profile.openedYear}
        </Badge>
      )}
      {profile.inversions !== null && (
        <Badge variant="outline" className="hidden gap-1 tabular-nums sm:inline-flex">
          <RefreshCcw className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t('inversions')}: {profile.inversions}
        </Badge>
      )}
      {elements.length > 0 && (
        <a
          href="#ride-profile"
          className="text-primary hover:bg-primary/10 ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium transition-colors"
        >
          {t('figureCount', { count: elements.length })}
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </>
  );
}
```

It returns a fragment rather than its own wrapper so its badges share the parent flex row with `AttractionMetaBadges` and wrap as one group.

- [ ] **Step 3: Split the hero into two tiers**

In the attraction page, the current single `<div className="text-foreground flex flex-wrap items-center gap-3">` mixes a navigation link, a live distance, a category label and an outbound reference at equal weight. Split it: leave park link, `ParkDistance`, land badge and `SeasonalBadge` in the first row, then add a second row below it holding `AttractionMetaBadges` and `<RideProfileTeaser />`:

```tsx
                  {(hasMetaBadges || attraction.rideProfile) && (
                    <div className="border-border/40 mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                      <AttractionMetaBadges
                        minimumHeight={attraction.minimumHeight}
                        maximumHeight={attraction.maximumHeight}
                        mayGetWet={attraction.mayGetWet}
                        rcdbId={attraction.rcdbId}
                      />
                      {attraction.rideProfile && (
                        <RideProfileTeaser
                          profile={attraction.rideProfile}
                          locale={locale as Locale}
                        />
                      )}
                    </div>
                  )}
```

`hasMetaBadges` mirrors the `hasAny` condition inside `AttractionMetaBadges` (`minimumHeight != null || maximumHeight != null || mayGetWet || rcdbId`); without it a ride with neither metadata nor profile renders a bare divider line.

- [ ] **Step 4: Make the anchor land correctly**

On the `RideProfileSection` wrapper further down the same file, add the id and scroll offset:

```tsx
            <div id="ride-profile" className="mt-10 scroll-mt-24">
```

`scroll-mt-24` is the repo's established anchor offset (`components/marketing/editorial-ui.tsx:112`); without it the heading lands under the sticky header.

- [ ] **Step 5: Verify in the browser**

At 390 px and at desktop width on `/de/parks/europe/germany/bruehl/phantasialand/taron`:
- mobile shows manufacturer and min-height plus the button; year and inversions are hidden
- the button scrolls to the profile with the heading fully visible below the header
- an attraction with no profile and no metadata renders no divider

- [ ] **Step 6: Verify types and lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: both exit 0.

- [ ] **Step 7: Commit**

```bash
git add components/parks/ride-profile-teaser.tsx "app/[locale]/parks/[continent]/[country]/[city]/[park]/[attraction]/page.tsx" messages
git commit -m "feat(attraction): lift the ride facts into the hero with a jump to the profile"
```

---

### Task 6: Highlight the notable rides on a glossary term

**Files:**
- Modify: `components/glossary/glossary-term-rides.tsx`
- Modify: `app/[locale]/glossary/[term]/page.tsx`
- Modify: `messages/{de,en,es,fr,it,nl}.json`

**Interfaces:**
- Consumes: `getAttractionsForTerm(termId, 'popularity')` from Task 1.

- [ ] **Step 1: Add the translation keys**

Under `glossary.rides` in all six files. German:

```json
      "topTitle": "Die größten Bahnen",
      "typicalWait": "typisch bis {minutes} Min.",
      "allTitle": "Alle Bahnen",
      "anchorLabel": "Bahnen mit dieser Figur"
```

English: `"The biggest rides"` / `"typically up to {minutes} min"` / `"All rides"` / `"Rides featuring this figure"`. Translate the same sense into the remaining four.

- [ ] **Step 2: Fetch by popularity and split the list**

In `glossary-term-rides.tsx`, change the fetch to `getAttractionsForTerm(termId, 'popularity')`, then take the first three entries **that have a `typicalPeakWait`** as the highlight strip and render the rest grouped by park as today.

Guard on the field being present, not truthy — it arrives absent, and `0` would be a real (if unlikely) value:

```tsx
const ranked = rides.filter((ride) => ride.typicalPeakWait != null);
const top = ranked.slice(0, 3);
```

Render the strip only when `top.length > 0`, in a `grid gap-3 sm:grid-cols-2 lg:grid-cols-3` — a grid, not a fixed three-column row, so the one-ride case (`celestial-spin`) and the two-ride case do not leave holes.

Each card shows ride name, park name and `typicalWait`. Since the whole list now comes back ranked rather than alphabetically, the grouped section below must sort by park name in TypeScript before grouping, or the groups arrive in ranking order and read as random.

- [ ] **Step 3: Add the anchor**

Give the section `id="rides"` and `scroll-mt-24` so the overview badge from Task 7 can link straight to it.

- [ ] **Step 4: Verify in the browser**

Open `/de/glossar/abschuss`. Expected: the strip leads with Journey to the Center of the Earth, Hagrid's and TRON with their typical waits, the full list below is grouped by park in alphabetical order, and `/de/glossar/celestial-spin` shows a single card without a gap. Confirm `#rides` scrolls correctly.

- [ ] **Step 5: Verify types and lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add components/glossary/glossary-term-rides.tsx "app/[locale]/glossary/[term]/page.tsx" messages
git commit -m "feat(glossary): lead a term's ride list with its biggest rides"
```

---

### Task 7: Ride counts on the glossary overview

Puts the previously unused `getRideCountsByTerm` to work.

**Files:**
- Modify: `app/[locale]/glossary/page.tsx`
- Modify: `components/glossary/glossary-overview-client.tsx`
- Modify: `components/glossary/glossary-term-card.tsx`
- Modify: `messages/{de,en,es,fr,it,nl}.json`

- [ ] **Step 1: Add the translation key**

Under `glossary` in all six files. German: `"rideCount": "{count, plural, one {# Bahn} other {# Bahnen}}"`. English: `"{count, plural, one {# ride} other {# rides}}"`. Dutch `baan`/`banen`, French `attraction`/`attractions`, Spanish `atracción`/`atracciones`, Italian `attrazione`/`attrazioni`.

- [ ] **Step 2: Fetch the counts**

In `app/[locale]/glossary/page.tsx` (the `GlossaryPage` component at line 75, which already awaits `getGlossaryTerms`), also `await getRideCountsByTerm()` and pass it to `GlossaryOverviewClient` as `rideCounts`.

The function already fails soft to `{}`, so a slow or down API costs the badges, not the page.

- [ ] **Step 3: Thread it through to the card**

`glossary-overview-client.tsx` takes `rideCounts: Record<string, number>` and passes `rideCount={rideCounts[term.id]}` plus the localized label to each `GlossaryTermCard`.

In `glossary-term-card.tsx`, render the count in the existing `CardAction` next to the 3-D badge when `rideCount` is set and greater than zero. The card is already wrapped in a `<Link>` to the term page — **do not nest an `<a>` inside it**, which is invalid HTML and breaks the outer link. Point the card's own href at `…/${term.slug}#rides` when a count exists so the click lands on the ride list.

- [ ] **Step 4: Verify in the browser**

Open `/de/glossar`. Expected: terms like Abschuss and Airtime Hill carry a count badge, concept terms without rides carry none, and clicking a badged card lands on the ride list rather than the top of the term page.

- [ ] **Step 5: Verify types and lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add "app/[locale]/glossary/page.tsx" components/glossary/glossary-overview-client.tsx components/glossary/glossary-term-card.tsx messages
git commit -m "feat(glossary): badge overview terms with how many rides feature them"
```

---

## Out of Scope

- Pre-rendered figure thumbnails. Rejected during brainstorming: a build asset pipeline for ~40 figures × 2 themes.
- New three.js geometry. The existing player is mounted in a second place; no new animation is created, so the render-harness requirement in CLAUDE.md does not apply.
- Backend changes. `sort=popularity` ships in `v4.api.park.fan` PR #138.
