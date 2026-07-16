# park.fan Frontend

Theme park wait times and statistics frontend for **[api.park.fan](https://api.park.fan)**.
**Technology Stack:** Next.js 16 (App Router), React 19, TypeScript.
**Routing:** This project uses **`proxy.ts`** for routing and i18n middleware, **not** a standard `middleware.ts`.
Multilingual (EN/DE/NL/FR/ES/IT), Server Components by default. All detailed documentation lives in **`docs/`** - start at **[docs/README.md](docs/README.md)**.
**Park page loading priority (REQUIREMENT):** the best-travel-time data (best-days calendar + historical stats) must **always load last** — live status, wait times and all weather queries load first. Enforced via `useLoadLast` (`lib/hooks/use-load-last.ts`); see [system-overview](docs/architecture/system-overview.md#4-park-page-loading-priority-requirement).
**Reuse existing components (REQUIREMENT):** always reuse existing components (e.g. `ParkStatusBadge`, `CrowdLevelBadge`, `Badge`, `ParkCard`) instead of re-implementing UI inline — keeps styling/colors consistent. Only build new when nothing suitable exists. See [conventions](docs/development/conventions.md#11-reuse-existing-components).
**three.js animations (REQUIREMENT):** research the real-world reference **first**, then implement; and **verify every animation from all camera perspectives** (coaster player: Front, Follow, Onboard) across the whole timeline and both day/night themes via the headless render harness before shipping — a green build is not enough. See [conventions](docs/development/conventions.md#12-threejs-animations-research-first-then-verify-from-every-perspective-requirement).
**Localized blog gallery captions:** a gallery's `captions.json` is the base/fallback; add a sibling `captions.<locale>.json` (same image-filename keys, entry-by-entry override, falls back to the base) to translate its captions per language. Surfaced via `BLOG_GALLERY_FOLDERS_L10N` in the generated manifest; see the [blog authoring guide](content/blog/README.md#gallery).

---

## Documentation (links)

| Topic           | Doc                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Docs home**   | [docs/README.md](docs/README.md)                                                                                                                                                                                                                                                                                                                                                     |
| Architecture    | [system-overview](docs/architecture/system-overview.md) · [routing-urls](docs/architecture/routing-and-urls.md) · [caching](docs/architecture/caching-strategy.md) · [API integration](docs/architecture/api-integration.md)                                                                                                                                                         |
| Development     | [setup](docs/development/setup.md) · [scripts](docs/development/scripts.md) · [datetime](docs/development/datetime-handling.md) · [assets](docs/development/assets.md) · [flags](docs/development/flags-and-debug.md) · [conventions](docs/development/conventions.md) · [impeccable](docs/development/impeccable.md) · [notes for sessions](docs/development/notes-for-sessions.md) |
| Design          | [design system](docs/design/design-system.md)                                                                                                                                                                                                                                                                                                                                        |
| i18n            | [internationalization](docs/i18n/internationalization.md) · [translations](docs/i18n/translations.md) · [pluralization](docs/i18n/pluralization.md)                                                                                                                                                                                                                                  |
| Features        | [glossary](docs/features/glossary.md)                                                                                                                                                                                                                                                                                                                                                |
| API & backend   | [backend integration](docs/api/backend-integration.md) · [calendar status](docs/api/calendar-status-closed.md)                                                                                                                                                                                                                                                                       |
| SEO             | [SEO analysis](docs/seo/analysis.md) · [featured parks](docs/seo/featured-parks.md) · [sitemaps](docs/seo/sitemaps.md)                                                                                                                                                                                                                                                               |
| Troubleshooting | [common issues](docs/troubleshooting/common-issues.md)                                                                                                                                                                                                                                                                                                                               |
| Other           | [changelog](docs/changelog.md)                                                                                                                                                                                                                                                                                                                                                       |

---

## External

- [API docs](https://api.park.fan/api)
- [Live site](https://park.fan)
- [Backend repo (v4.api.park.fan)](https://github.com/park-fan/v4.api.park.fan)
