# Conventions & Key Rules

Project-wide rules to follow when working on the codebase.

---

## 1. URLs from API

Use **`convertApiUrlToFrontendUrl(apiUrl)`** from `lib/utils/url-utils.ts` when you have an API URL (e.g. `park.url`, `attraction.url`). When you only have geo data, use **`buildParkUrl()`** / **`buildAttractionUrlFromGeo()`**.

→ [Routing & URLs](../architecture/routing-and-urls.md)

---

## 2. Park "today" and dates

Derive "today" from the **park timezone** (e.g. `formatInTimeZone(new Date(), park.timezone, 'yyyy-MM-dd')`). Never use server date alone for schedule or calendar. Compare schedule/calendar dates as `YYYY-MM-DD` strings; do not use `new Date(dateStr)` for business logic.

→ [Date & Time Handling](datetime-handling.md)

---

## 3. Translations

All user-facing text lives in **`messages/*.json`**. Use type-safe helpers for dynamic keys (e.g. `translateCountry`, `translateContinent`). Add new keys to **all** locale files.

→ [Translation System](../i18n/translations.md), [Internationalization](../i18n/internationalization.md)

---

## 4. Client components

Use **`'use client'`** only when necessary (e.g. theme toggle, locale switcher, search bar, providers). Prefer Server Components.

---

## 5. Search

Use the **`/api/search`** proxy from the client, not direct API calls (CORS). Minimum 3 characters for search.

→ [Backend Integration](../api/backend-integration.md)

---

## 6. Favorites

Favorites are stored in a **cookie** (client) and enriched via **`/api/favorites`** (backend). Do not store secrets in the cookie.

→ [Backend Integration – Favorites](../api/backend-integration.md#favorites)

---

## 7. Experiments and debug

Use the **build-time feature flags** in `lib/config/features.ts` (`NEXT_PUBLIC_*` env vars, default OFF) and the **`?sim=` nearby-simulation** param for geo/debug overrides. Do not add scattered ad-hoc env toggles or per-session flag systems.

→ [Flags & Debug](flags-and-debug.md)

---

## 8. Crowd level "moderate"

API uses P50 baseline; it returns **`moderate`** for a typical day. We display it as **"Normal"** (green) in all locales.

→ [Backend Integration – Crowd Levels](../api/backend-integration.md#crowd-levels-p50--normal)

---

## 9. Calendar day status

- **OPERATING** → show opening/closing times
- **CLOSED** → "Closed" (no time range)
- **UNKNOWN** → "Opening hours not yet available" (not "Closed")

→ [Calendar Status](../api/calendar-status-closed.md)

---

## 10. No secrets in repo

API keys and other secrets only in **`.env.local`**. Never document or commit secrets.

---

## 11. Reuse existing components

**Always reuse existing components** instead of re-implementing UI inline. Before writing a badge,
card, status indicator, etc., check for an existing component (e.g. `ParkStatusBadge`,
`CrowdLevelBadge`, `Badge`, `ParkCard`). This keeps styling/colors and behavior consistent across
the app. Only create a new component when nothing suitable exists.

---

## 12. three.js animations: research first, then verify from every perspective (REQUIREMENT)

Any three.js animation (the glossary coaster player, the homepage hero, future 3-D scenes) must be
built **research-first** and **verified from every camera perspective** before it ships:

1. **Research first, then implement.** Before modelling a real-world figure (a coaster element, a
   ride, a building), look up what it actually looks like — reference photos/POVs, the manufacturer,
   the named element. Encode the _correct_ geometry; do not approximate from memory. Note the source
   in a code comment when it is non-obvious (e.g. the celestial spin is a Mack dual-track element).
2. **Test from ALL perspectives.** Every animated figure must be checked in **each** camera mode it
   exposes — for the coaster player that is **Front, Follow _and_ Onboard** — across the full
   timeline (entry → element → exit) and in **both day and night** themes. A figure that looks right
   head-on but self-intersects, leans, or clips in another view is **not** done.
3. **Verify visually, not just by building.** `tsc`/`eslint`/`build` passing is necessary but not
   sufficient. Use the headless render harness (Chrome + SwiftShader + Puppeteer contact sheets, see
   `docs/development/notes-for-sessions.md`) to actually _look_ at the frames before committing.
4. **Geometry sanity.** Track must not pass through itself in a way that reads as wrong, figures must
   be centered in the frontal frame unless intentionally offset, loops should read cleanly (use a
   small depth offset so entry/exit cross over–under rather than intersecting), and the train must
   sit on the rails (no z-fighting).

→ Coaster engine: `lib/three/coaster/` (`kit.ts`, `elements.ts`, `scene.ts`)

---

## 13. Never build an `Intl` formatter per item

`new Intl.DateTimeFormat(...)` (and `date.toLocaleTimeString(locale, opts)`, which builds one
internally) is expensive — it resolves locale data and compiles a pattern, far more work than the
`format()` call that follows. Building one per list item or per render adds up fast: the wait-time
sparklines alone formatted 4 axis ticks x ~100 cards, all re-rendering together on the shared
minute clock.

Use the cached factories in **`lib/utils/intl-format.ts`** instead — `getDateTimeFormat`,
`getNumberFormat`, `formatTime`. Same arguments return the same instance, so repeated formatting
costs a map lookup. Constructing a formatter directly is only fine when it happens once per module
or is already hoisted out of the loop.

---

## 14. Never `asChild` a client element from a server component

A Radix `asChild` trigger (`TooltipTrigger`, `HoverCardTrigger`, `Button asChild`, …) hands its
child to `Slot`, which requires a **single React element**. From a **server** component, a client
component like `next/link` arrives as a **lazy client reference**, not an element. `Slot` unwraps a
lazy child only while its payload is still _pending_ — once any earlier instance of that component
on the page has resolved the chunk, the payload is settled and `Slot` throws
`Primitive.button failed to slot onto its children`, taking the whole client tree into the error
boundary.

This fails **intermittently and by page length**, which makes it very easy to misdiagnose: a long
blog post resolves the chunk before the first tooltip renders and crashes every time; the same
content cut in half looks perfectly fine.

```tsx
// ✗ server component
<TooltipTrigger asChild>
  <Link href={href}>{text}</Link>
</TooltipTrigger>

// ✓ move the wrapper into a client component ('use client'), or drop asChild:
<Link href={href} className={cn(buttonVariants({ variant: 'outline' }))}>
  {text}
</Link>
```

Slotting a **host** element (`<a>`, `<button>`, `<span>`) from a server component is fine — those
are never lazy. See `components/glossary/glossary-inject-term.tsx` and
`components/blog/blog-section-header.tsx`.

---

## Related

- [Setup](setup.md)
- [Troubleshooting](../troubleshooting/common-issues.md)
