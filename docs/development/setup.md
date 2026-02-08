# Development Setup

## Prerequisites

- **Node.js:** v20+
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

Prebuild runs `generate-build-info.mjs`, `generate-hero-images`, and `generate-attraction-images` automatically.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Fix lint errors |
| `pnpm format` | Format with Prettier |
| `pnpm format:check` | Check formatting |
| `pnpm validate:translations` | Validate translation keys |
| `pnpm crawl:translations` | Translation crawler (static) |
| `pnpm crawl:translations:live` | Translation crawler (live server) |

## Related

- [Scripts](scripts.md)
- [Date & Time Handling](datetime-handling.md)
- [Assets, Images & Content](assets.md)
- [Flags & Debug](flags-and-debug.md)
- [API Integration](../architecture/api-integration.md)
