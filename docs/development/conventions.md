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

Use **Vercel Toolbar** and **Flags** (`flags.ts`, `app/.well-known/vercel/flags/route.ts`). Do not add custom env-based feature toggles.

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

## Related

- [Setup](setup.md)
- [Troubleshooting](../troubleshooting/common-issues.md)
