# park.fan Frontend – Documentation

**park.fan** is the frontend for the [api.park.fan](https://api.park.fan) backend API. The app displays real-time wait times, ML predictions, park analytics, and comprehensive theme park information – multilingual (DE/EN/NL/FR/ES) and responsive.

---

## Quick Navigation

| Section | Description |
|---------|-------------|
| [Architecture](architecture/system-overview.md) | System overview, routing, caching, API integration |
| [Development](development/setup.md) | Setup, scripts, commands |
| [Design System](design/design-system.md) | Theme, components, badges, utility classes |
| [Internationalization](i18n/internationalization.md) | Locales, translations, SEO |
| [API & Backend](api/backend-integration.md) | Backend connection, endpoints, types |
| [SEO](seo/analysis.md) | SEO analysis and recommendations |
| [Troubleshooting](troubleshooting/common-issues.md) | Common issues and solutions |

---

## Documentation Index

### Architecture

| Doc | Description |
|-----|-------------|
| [System Overview](architecture/system-overview.md) | Components, data flow, routing table, key directories |
| [Routing & URLs](architecture/routing-and-urls.md) | Geo routes, API→frontend URL conversion, redirects, prefetch |
| [Caching Strategy](architecture/caching-strategy.md) | ISR revalidate times, API cache, headers |
| [API Integration](architecture/api-integration.md) | High-level API usage and rules |

### Development

| Doc | Description |
|-----|-------------|
| [Setup](development/setup.md) | Prerequisites, install, run, build, commands |
| [Scripts](development/scripts.md) | Build scripts, translation crawler, validation |
| [Date & Time Handling](development/datetime-handling.md) | Park timezone, "today", date-only (YYYY-MM-DD) |
| [Assets, Images & Content](development/assets.md) | Park/attraction images, hero/attraction manifests, content markdown |
| [Flags & Debug](development/flags-and-debug.md) | Vercel Toolbar, debug-geo-mode, adding flags |
| [Conventions](development/conventions.md) | Key rules (URLs, i18n, search, favorites, no secrets, etc.) |
| [Notes for Sessions](development/notes-for-sessions.md) | Reminders for AI/human sessions |

### Design

| Doc | Description |
|-----|-------------|
| [Design System](design/design-system.md) | CSS variables, glassmorphism, badges, spacing |

### Internationalization (i18n)

| Doc | Description |
|-----|-------------|
| [Internationalization](i18n/internationalization.md) | Locales, route prefix, namespaces, "Normal" display |
| [Translation System](i18n/translations.md) | Adding keys, helpers, validation, crawler, CI |
| [Pluralization](i18n/pluralization.md) | ICU plurals, `formatWaitTime`, migration |

### API & Backend

| Doc | Description |
|-----|-------------|
| [Backend Integration](api/backend-integration.md) | Endpoints, client modules, URL conversion |
| [Calendar Status](api/calendar-status-closed.md) | UNKNOWN vs CLOSED (API contract for frontend) |

### SEO

| Doc | Description |
|-----|-------------|
| [SEO Analysis](seo/analysis.md) | Current status, optimizations, checklist |

### Troubleshooting

| Doc | Description |
|-----|-------------|
| [Common Issues](troubleshooting/common-issues.md) | 404s, translations, search, timezone, a11y |

### Other

| Doc | Description |
|-----|-------------|
| [Changelog](changelog.md) | Recent updates (404 prevention, prefetch, P50) |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | TypeScript 5.x, React 19 |
| **Styling** | TailwindCSS 4, shadcn/ui |
| **i18n** | next-intl |
| **Theme** | next-themes (Light/Dark) |
| **Charts** | Recharts |

---

## Project Structure

```
park.fan/
├── app/                    # App Router
│   ├── [locale]/           # i18n routes (en, de, nl, fr, es)
│   │   ├── parks/          # Geo: Continent → Country → City → Park → Attraction
│   │   ├── search/         # Search page
│   │   ├── datenschutz/    # Privacy policy
│   │   └── impressum/      # Imprint
│   └── api/                # API routes (proxy, OG, favorites, …)
├── components/             # Layout, parks, common, search, ui, seo, faq, home, shows
├── content/home/           # Markdown announcements (announce.[locale].md)
├── lib/                    # API client, utils, hooks, i18n helpers, analytics
├── i18n/                   # Config, routing, request, navigation
├── messages/               # Translations (en, de, nl, fr, es)
├── scripts/                # Build scripts, crawler, validation
├── flags.ts                # Vercel flags (debug-geo-mode)
├── proxy.ts                # Next.js 16 i18n proxy
└── docs/                   # This documentation
```

---

## Related Resources

- **API documentation:** [https://api.park.fan/api](https://api.park.fan/api)
- **Live frontend:** [https://park.fan](https://park.fan)
- **Backend repo:** [v4.api.park.fan](https://github.com/park-fan/v4.api.park.fan) (analog docs structure)
- **P50 crowd levels (backend):** [docs/analytics/p50-crowd-levels.md](https://github.com/park-fan/v4.api.park.fan/blob/main/docs/analytics/p50-crowd-levels.md)
