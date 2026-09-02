# Development Setup

## Prerequisites

- **Node.js:** v24+ (pinned via `.nvmrc` and `package.json` `engines`; matches Vercel). Run `nvm use` to switch.
- **pnpm:** Recommended package manager

## Installation

1. **Clone the repository:**

   ```bash
   git clone <repo-url>
   cd park.fan
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Environment:**
   Copy `.env.example` to `.env.local` and configure if needed. No secrets required for basic development – API defaults to `https://api.park.fan`.

## Running Locally

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Build

```bash
pnpm build
pnpm start
```

Prebuild runs `generate-build-info.mjs`, `generate-message-chunks.mjs`,
`check-client-messages.mjs`, `generate-client-glossary.mjs`, `generate-blog-manifest.mjs`,
`generate:image-crops` and `generate:media` automatically.

`check-client-messages.mjs` is the one that can **fail** the build. It guards the per-route
translation payload, whose failure mode is silent — raw message keys, or a page in the wrong
language — so a mis-wired route stops the build instead of reaching production. If it fires,
the message says which route and usually the fix is `pnpm generate:route-namespaces`. See
[internationalization](../i18n/internationalization.md#which-namespaces-reach-the-client). (`generate-hero-images` and `generate-attraction-images` are gone —
the media database replaced both; see [media database](../features/media-database.md).)

## Commands

| Command                        | Description                               |
| ------------------------------ | ----------------------------------------- |
| `pnpm dev`                     | Start dev server (Turbopack)              |
| `pnpm dev:live`                | Dev server for an impeccable live session |
| `pnpm build`                   | Production build                          |
| `pnpm start`                   | Run production build                      |
| `pnpm lint`                    | Run ESLint                                |
| `pnpm lint:fix`                | Fix lint errors                           |
| `pnpm format`                  | Format with Prettier                      |
| `pnpm format:check`            | Check formatting                          |
| `pnpm validate:translations`   | Validate translation keys                 |
| `pnpm check:untranslated`      | Find German left in the other locales     |
| `pnpm crawl:translations`      | Translation crawler (static)              |
| `pnpm crawl:translations:live` | Translation crawler (live server)         |
| `pnpm impeccable:detect`       | Design anti-pattern detector              |
| `pnpm impeccable:install`      | Activate impeccable design skills         |

## Related

- [Scripts](scripts.md)
- [impeccable (design tooling)](impeccable.md)
- [Date & Time Handling](datetime-handling.md)
- [Assets, Images & Content](assets.md)
- [Flags & Debug](flags-and-debug.md)
- [API Integration](../architecture/api-integration.md)
