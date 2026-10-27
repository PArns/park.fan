<div align="center">

# 🎢 park.fan

**Live wait times, crowd calendars and forecasts for theme parks, in six languages.**

[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/hosted_on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

**[park.fan](https://park.fan)** · **[API](https://api.park.fan/api)** · **[Developer docs](docs/README.md)**

</div>

---

## On the site

|                        |                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| 🏰 **Park pages**      | The current wait at every ride, which rides are down, opening hours, weather and warnings.             |
| 📅 **Crowd calendar**  | How busy each day is expected to be, months ahead, with the quietest days marked.                      |
| 🗓️ **Trip planner**    | Pick the rides for one day; the planner orders them by the forecast and says when the day won't fit.   |
| 🎢 **Ride pages**      | Typical and busy waits by hour and weekday, track figures, the ride's history.                         |
| 🔔 **Alerts**          | A push message when a ride's wait drops below your limit, or when a show you follow is about to start. |
| ⚖️ **Compare**         | Two to four parks side by side.                                                                        |
| 📰 **Guides and news** | Park guides and news, written in German and published in all six languages.                            |
| 📖 **Glossary**        | Ride types and park terms, each linked to the rides that have them.                                    |
| 🔮 **Fancast**         | The forecasting model, and how far off it turned out to be.                                            |

English · Deutsch · Nederlands · Français · Español · Italiano

---

## Development

Needs **Node.js 24** (`nvm use`) and **pnpm 11** (`corepack enable`). No secrets are needed: by
default the app reads the live API at `https://api.park.fan` (`NEXT_PUBLIC_API_URL` overrides it).

```bash
pnpm install
cp .env.example .env.local   # optional
pnpm dev                     # http://localhost:3000
```

| Command                     | What it does                                                           |
| --------------------------- | ---------------------------------------------------------------------- |
| `pnpm dev`                  | Dev server (Turbopack)                                                 |
| `pnpm build && pnpm start`  | Production build; measure performance here, not on `next dev`          |
| `pnpm lint` · `pnpm format` | ESLint (a warning fails it) · Prettier                                 |
| `pnpm typecheck`            | Runs the generators, then `tsc`                                        |
| `pnpm check:prose`          | The machine-checkable half of the writing rules, for posts and UI text |

Every other script is described in [docs/development/scripts.md](docs/development/scripts.md).

### Stack

Next.js 16 (App Router) with routing and i18n in [`proxy.ts`](proxy.ts) instead of a
`middleware.ts`, React 19 Server Components, TypeScript, Tailwind CSS 4 with shadcn/ui,
next-intl, TanStack Query for the live data and three.js for the coaster scenes. Hosted on Vercel
behind Cloudflare. All park data comes from the [park.fan API](https://github.com/PArns/v4.api.park.fan).

### Where things are

| Path                  | Contents                                                                 |
| --------------------- | ------------------------------------------------------------------------ |
| `app/[locale]/`       | Pages: parks (continent → country → city → park → ride), planner, blog … |
| `app/api/`            | Route handlers: relays to the API, OG images, MCP, cron jobs             |
| `components/`, `lib/` | UI components; API clients, hooks and helpers                            |
| `messages/`           | UI strings in six languages                                              |
| `content/`            | Guides and news (Markdown), glossary texts, the public changelog         |
| `public/media/`       | The image database: photos with their sidecar metadata                   |
| `scripts/`            | Generators, checks and measurements behind the `pnpm` scripts            |
| `docs/`               | Developer documentation                                                  |

### Documentation

| Start here                                    | For                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| [CLAUDE.md](CLAUDE.md)                        | Coding sessions: what applies to every change, and where each rule lives |
| [docs/README.md](docs/README.md)              | Map of all documentation                                                 |
| [docs/rules/README.md](docs/rules/README.md)  | The standing rules, one line each                                        |
| [docs/code-index/](docs/code-index/README.md) | Every exported component, hook and helper (generated)                    |

---

<div align="center">

Made for theme park fans by [arns.dev](https://arns.dev) · data sources are listed in the
[API's README](https://github.com/PArns/v4.api.park.fan#-data-sources)

</div>
