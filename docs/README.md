# park.fan Frontend – Documentation

**park.fan** is the frontend for the [api.park.fan](https://api.park.fan) backend API. The app displays real-time wait times, ML predictions, park analytics, and comprehensive theme park information – multilingual (DE/EN/NL/FR/ES/IT) and responsive.

---

## Quick Navigation

| Section                                              | Description                                        |
| ---------------------------------------------------- | -------------------------------------------------- |
| [Architecture](architecture/system-overview.md)      | System overview, routing, caching, API integration |
| [Development](development/setup.md)                  | Setup, scripts, commands                           |
| [Design System](design/design-system.md)             | Theme, components, badges, utility classes         |
| [Internationalization](i18n/internationalization.md) | Locales, translations, SEO                         |
| [API & Backend](api/backend-integration.md)          | Backend connection, endpoints, types               |
| [SEO](seo/analysis.md)                               | SEO analysis and recommendations                   |
| [Troubleshooting](troubleshooting/common-issues.md)  | Common issues and solutions                        |

---

## Documentation Index

### Architecture

| Doc                                                  | Description                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| [System Overview](architecture/system-overview.md)   | Components, data flow, routing table, key directories        |
| [Routing & URLs](architecture/routing-and-urls.md)   | Geo routes, API→frontend URL conversion, redirects, prefetch |
| [Caching Strategy](architecture/caching-strategy.md) | ISR revalidate times, API cache, headers                     |
| [API Integration](architecture/api-integration.md)   | High-level API usage and rules                               |
| [API budget per page](architecture/api-budget.md)    | Requests each route makes, what every payload is read for    |

### Development

| Doc                                                       | Description                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------- |
| [Setup](development/setup.md)                             | Prerequisites, install, run, build, commands                        |
| [Scripts](development/scripts.md)                         | Build scripts, translation crawler, validation                      |
| [Date & Time Handling](development/datetime-handling.md)  | Park timezone, "today", date-only (YYYY-MM-DD)                      |
| [Assets, Images & Content](development/assets.md)         | Park/attraction images, hero/attraction manifests, content markdown |
| [Flags & Debug](development/flags-and-debug.md)           | Build-time feature flags, `?sim=` geo simulation                    |
| [Conventions](development/conventions.md)                 | Key rules (URLs, i18n, search, favorites, no secrets, etc.)         |
| [Analytics (Umami)](development/analytics.md)             | Event budget (every property is billed), unique-visitor definition  |
| [impeccable (Design Tooling)](development/impeccable.md)  | Anti-pattern detector (preview CI) + `/impeccable live` annotation  |
| [Vercel Comment Sync](development/vercel-comment-sync.md) | Preview comments → PR comment (webhook relay + GitHub Action)       |
| [Notes for Sessions](development/notes-for-sessions.md)   | Reminders for AI/human sessions                                     |

### Design

| Doc                                      | Description                                   |
| ---------------------------------------- | --------------------------------------------- |
| [Design System](design/design-system.md) | CSS variables, glassmorphism, badges, spacing |

### Internationalization (i18n)

| Doc                                                  | Description                                         |
| ---------------------------------------------------- | --------------------------------------------------- |
| [Internationalization](i18n/internationalization.md) | Locales, route prefix, namespaces, "Normal" display |
| [Translation System](i18n/translations.md)           | Adding keys, helpers, validation, crawler, CI       |
| [Pluralization](i18n/pluralization.md)               | ICU plurals, `formatWaitTime`, migration            |

### API & Backend

| Doc                                                         | Description                                   |
| ----------------------------------------------------------- | --------------------------------------------- |
| [Backend Integration](api/backend-integration.md)           | Endpoints, client modules, URL conversion     |
| [Calendar Status](api/calendar-status-closed.md)            | UNKNOWN vs CLOSED (API contract for frontend) |
| [Seasonal attractions](api/seasonal-attractions.md)         | Rides that cannot open today, and the counter |
| [Parks without wait times](api/parks-without-wait-times.md) | Parks with no readable source at all          |
| [Backend Wishlist](api/backend-wishlist.md)                 | Requested API changes (SEO & performance)     |

### SEO

| Doc                                                 | Description                                                                                                                |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [SEO Analysis](seo/analysis.md)                     | Current status, optimizations, checklist                                                                                   |
| [Agent readiness](seo/agent-readiness.md)           | What the site tells machines: robots policy, llms.txt, API catalog, skills, MCP, WebMCP                                    |
| [Blog feeds](seo/blog-feeds.md)                     | The six RSS feeds: autodiscovery, full-text items, enclosures, WebSub                                                      |
| [Favicon](seo/favicon.md)                           | The icon in the search result: one generated set, why the wordmark is out and the tile is in                               |
| [MCP registry listing](seo/mcp-registry-listing.md) | Publishing the MCP server and the API where agents look for them: registry `server.json`, awesome-mcp-servers, public-apis |

### Troubleshooting

| Doc                                               | Description                                |
| ------------------------------------------------- | ------------------------------------------ |
| [Common Issues](troubleshooting/common-issues.md) | 404s, translations, search, timezone, a11y |

### Features

| Doc                                                            | Description                                                                                                         |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [Admin](features/admin.md)                                     | The curation surface: cookie sessions, roles, the descriptor-driven curated-field editor, seasons, two write models |
| [Media Database](features/media-database.md)                   | One FS-backed image database: sidecars, roles, tags, focal points, search, the HTTP API and the admin browser       |
| [Glossary System](features/glossary.md)                        | Term data, translations, localized URLs, search, sitemap                                                            |
| [Header Navigation](features/header-navigation.md)             | The bar's five entries, the parks and blog panels, what is in the HTML vs fetched, and the SEO reasoning            |
| [Homepage Hero](features/homepage-hero.md)                     | Live counts, in-place vs palette search, nearby bubbles, the world-map panel and its generated path data            |
| [Weather Day Chart](features/weather-day-chart.md)             | The hourly chart's park-hours time axis, its tick tiers, the in-visit annotations and the 143 px box                |
| [Attraction Filter Panel](features/attraction-filter-panel.md) | The park page's search + rider-height + off-season band, and how the three filters compose                          |
| [The Guide Page](features/how-park-fan-works.md)               | What `/{locale}/{howto-segment}` teaches, why every block is a production component, and the claims it may make     |

### Product

| Doc                                                                   | Description                                                                              |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [Personas & Scenarios](product/personas-and-scenarios.md)             | Six personas, visit-lifecycle scenarios, gap backlog (G1–G9)                             |
| [Attraction Metadata Sources](product/attraction-metadata-sources.md) | G1 research: where to get min-height/indoor/accessibility data, licenses, recommendation |

### Other

| Doc                       | Description                                    |
| ------------------------- | ---------------------------------------------- |
| [Changelog](changelog.md) | Recent updates (404 prevention, prefetch, P50) |

---

## Tech Stack

| Category      | Technology                                     |
| ------------- | ---------------------------------------------- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language**  | TypeScript 6.x, React 19                       |
| **Styling**   | TailwindCSS 4, shadcn/ui                       |
| **i18n**      | next-intl                                      |
| **Theme**     | next-themes (Light/Dark)                       |
| **Charts**    | Custom SVG (`Sparkline` & friends)             |

---

## Project Structure

```
park.fan/
├── app/                    # App Router
│   ├── [locale]/           # i18n routes (en, de, fr, it, nl, es)
│   │   ├── parks/          # Geo: Continent → Country → City → Park → Attraction
│   │   ├── glossary/       # Glossary overview + [term] detail pages
│   │   ├── search/         # Search page
│   │   ├── datenschutz/    # Privacy policy
│   │   └── impressum/      # Imprint
│   └── api/                # API routes (proxy, OG, favorites, glossary-search, …)
├── components/             # Layout, parks, common, search, ui, seo, faq, home, shows, glossary
├── content/home/           # Markdown announcements (announce.[locale].md)
├── content/glossary/       # Glossary translations (en/de/fr/it/nl/es.ts)
├── lib/glossary/           # Glossary types, data, loader functions
├── lib/                    # API client, utils, hooks, i18n helpers, analytics
├── i18n/                   # Config, routing, request, navigation
├── messages/               # Translations (en, de, fr, it, nl, es)
├── scripts/                # Build scripts, crawler, validation
├── lib/config/features.ts  # Build-time feature flags (NEXT_PUBLIC_*)
├── proxy.ts                # Next.js 16 i18n proxy
└── docs/                   # This documentation
```

---

## Related Resources

- **API documentation:** [https://api.park.fan/api](https://api.park.fan/api)
- **Live frontend:** [https://park.fan](https://park.fan)
- **Backend repo:** [v4.api.park.fan](https://github.com/park-fan/v4.api.park.fan) (analog docs structure)
- **Crowd levels (backend):** [docs/analytics/crowd-levels.md](https://github.com/park-fan/v4.api.park.fan/blob/main/docs/analytics/crowd-levels.md)
