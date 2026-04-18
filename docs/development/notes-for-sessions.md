# Notes for Future Sessions

Reminders and context for AI or human sessions working on the codebase.

---

1. **Server Components by default** – Use `'use client'` only when necessary (theme, locale switcher, search, providers).

2. **Accessibility** – The Vercel Toolbar a11y check may report "ARIA hidden element must not contain focusable" when Search or the mobile Sheet is open (Radix Dialog). Run audits with all modals closed, or treat as known Radix/Toolbar behavior.  
   → [Troubleshooting – ARIA hidden](../troubleshooting/common-issues.md#aria-hidden--focusable-element-warnings)

3. **API proxy** – Search and other client-callable endpoints go via `/api/*` to avoid CORS.

4. **Geo routes** – API uses `/continent/country/city/park`; frontend mirrors this; **city is required**. Redirect logic handles malformed URLs before 404.  
   → [Routing & URLs – Redirect logic](../architecture/routing-and-urls.md#redirect-logic-404-prevention)

5. **ML predictions** – Feature to surface prominently; data comes from the API.

6. **Admin** – Cloudflare-protected; no custom auth, only UI. Query param for API auth.

7. **Cache** – Respect API cache headers; frontend TTLs in `lib/api/cache-config.ts`.  
   → [Caching Strategy](../architecture/caching-strategy.md)

8. **Translations** – All UI strings from `messages/`; add keys to all locale files. Use `translateCountry` / `translateContinent` from `lib/i18n/helpers` for geo labels (logs missing keys).  
   → [Translation System](../i18n/translations.md)

9. **URLs from API** – Always use `convertApiUrlToFrontendUrl()` or `getParkUrlFromAttractionUrl()`; never manually construct from string splits.  
   → [Routing & URLs](../architecture/routing-and-urls.md)

10. **Flags / experiments** – Use Vercel Toolbar Flags Explorer and `flags.ts`; do not add env-based feature toggles.
    → [Flags & Debug](flags-and-debug.md)

11. **Locale switching** – Both `LocaleSwitcher` and `LanguageBanner` use hreflang `<link>` tags (from `generateMetadata`) to navigate, not naive `String.replace()`. This is critical for pages with localized URL segments (e.g. `/en/glossary` ↔ `/de/glossar`). The hreflang URL is parsed via `new URL(el.href).pathname` to strip the domain. Fallback regex replaces only the leading `/:locale/` segment. Never use bare `path.replace(`/${locale}`, ...)` for locale switching.
    → Flag for `en` locale = `FlagUS` (not `FlagGB`).

12. **Glossary** – 90 terms across 7 categories. Term data (slugs) in `lib/glossary/data.ts`; per-locale definitions in `content/glossary/XX.ts` — use `\n\n` to separate paragraphs in `definition` fields. Localized URLs (`/de/glossar/wartezeit`) handled via Next.js `rewrites()` in `next.config.ts` — file-system path stays `app/[locale]/glossary/[term]`. Add new terms to both `data.ts` and all 6 locale content files.
    → [Glossary System](../features/glossary.md)

13. **Seasonal attractions & shows** – The API returns three fields on `ParkAttraction`, `ParkShow`, `AttractionResponse`, and `SearchResultItem`:
    - `isSeasonal: boolean` — attraction/show is known to be seasonal
    - `seasonMonths: number[] | null` — months active (1–12); `null` = seasonal but months unknown
    - `isCurrentlyInSeason: boolean | null` — `false` = hide by default; `null` = don't hide (unknown months or not seasonal)

    **Filter logic** — hide when `isCurrentlyInSeason === false`; never hide when `null`.

    **Frontend behaviour:**
    - `SeasonalBadge` (`components/parks/seasonal-badge.tsx`) — shows ❄️ Winter / ☀️ Summer / 🍃 generic based on `seasonMonths`. Always rendered when `isSeasonal === true`; dimmed (`opacity-50`) when `isCurrentlyInSeason === false`.
    - `AttractionCard` + `ShowCard` — badge shown whenever `isSeasonal === true`.
    - Attraction detail page (`[attraction]/page.tsx`) — badge shown in the title meta row next to the land badge.
    - Search (`search-bar.tsx`) — small `🍃` Leaf icon when `isSeasonal && isCurrentlyInSeason === true`.
    - Park tabs (`tabs-with-hash.tsx`) — off-season items hidden by default (attractions + shows + headliners). A glass toggle button **"N außer Saison"** (with `EyeOff`/`Eye` icon, `backdrop-blur-md` glass style) appears next to the section heading when any off-season items exist; clicking it reveals them.
    - Park map (`park-map.tsx`) — off-season attractions and shows are excluded from markers by default (no toggle on the map, by design).

    **Translations** — keys `seasonal`, `seasonalWinter`, `seasonalSummer`, `offSeasonCount` added to all 6 locale files (`messages/`).

    **API population timing** — bootstrap job runs 90 s after server start, then daily cron at 02:30. Fields absent from API response = not yet populated, treat as non-seasonal.

14. **Redirects bei Routen-Änderungen** — Bei jeder Umbenennung oder Verschiebung einer Route (Park-Slug, Attraction-Slug, URL-Segment, Locale-Segment) **muss** ein permanenter Redirect (301/308) in `next.config.ts` unter `redirects()` angelegt werden. Ohne Redirect entstehen 404s, die Google im Index behält und die Crawl-Budget verschwenden.
    - Glossary-Locale-Segmente (`/de/glossar`, `/fr/glossaire` etc.) → Rewrites in `rewrites()`, Cross-Locale-Fehler → `redirects()`
    - Umbenannte Parks → `redirects()` mit `/:locale/parks/…` und `/parks/…` (ohne Locale, Middleware übernimmt Locale-Erkennung)
    - Neue Locale-Segmente → zu `localeSegments` in BEIDEN Blöcken (`redirects` + `rewrites`) hinzufügen
    - Kein Hardcoding von Locales in Redirect-Destinations (z.B. `/en/parks/…`); stattdessen ohne Locale-Prefix damit next-intl die Locale per Accept-Language erkennt
    → [Routing & URLs](../architecture/routing-and-urls.md)

---

## Related

- [Conventions](conventions.md)
- [Troubleshooting](../troubleshooting/common-issues.md)
