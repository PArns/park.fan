# System Architecture

## Overview

The park.fan frontend is a **Next.js 16** App Router application with Server Components as the default. It consumes the REST API from [api.park.fan](https://api.park.fan) and presents wait times, ML predictions, park schedules, and analytics.

---

## Components

### 1. Next.js App (React 19)

- **App Router** with `[locale]` as root segment
- **Server Components** as default – only a few Client Components (`'use client'`) for Theme, Locale-Switcher, Search
- **ISR (Incremental Static Regeneration)** for geo pages and park details
- **API Routes** under `/api/*` for proxy (Search, Parks), OG images, Favorites, Nearby

### 2. lib/api – Type-Safe API Client

- **`client.ts`** – Base fetch with error handling
- **`types.ts`** – TypeScript types from API
- **`parks.ts`**, **`discovery.ts`**, **`search.ts`**, **`analytics.ts`** – domain API functions
- **`convertApiUrlToFrontendUrl()`** – API URL → frontend route conversion

### 3. Data Flow

1. **Page request** → Server Component loads data via `lib/api/*`
2. **API** → `https://api.park.fan/v1/...` (or `NEXT_PUBLIC_API_URL`)
3. **Rendering** → HTML with SEO, JSON-LD, meta tags
4. **Client** → Hydration, theme, search, favorites

---

## Routing Structure

| Route                                          | Description    | Revalidate |
| ---------------------------------------------- | -------------- | ---------- |
| `/[locale]`                                    | Homepage       | 60s        |
| `/[locale]/parks/[continent]`                  | Continents     | 1h         |
| `/[locale]/parks/[continent]/[country]`        | Countries      | 1h         |
| `/[locale]/parks/[continent]/[country]/[city]` | Cities         | 30min      |
| `/[locale]/parks/.../[park]`                   | Park detail    | 5min       |
| `/[locale]/parks/.../[park]/[attraction]`      | Attraction     | 5min       |
| `/[locale]/search`                             | Search         | Dynamic    |
| `/[locale]/datenschutz`                        | Privacy policy | Static     |
| `/[locale]/impressum`                          | Imprint        | Static     |

Details: [Routing & URLs](routing-and-urls.md)

---

## Key Directories

| Directory      | Purpose                              |
| -------------- | ------------------------------------ |
| `app/[locale]` | All localizable pages                |
| `app/api`      | API routes (Proxy, OG, Favorites, …) |
| `components/`  | Layout, Parks, Common, Search, UI    |
| `lib/api`      | API client, types, Discovery         |
| `lib/utils`    | URL, Redirect, Breadcrumb, Calendar  |
| `i18n/`        | Routing, config, request (next-intl) |
| `messages/`    | Translations (en, de, nl, fr, es)    |

---

## Related

- [Routing & URLs](routing-and-urls.md)
- [Caching Strategy](caching-strategy.md)
- [API Integration](api-integration.md)
