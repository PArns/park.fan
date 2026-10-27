# park.fan Frontend

Theme park wait times, crowd calendars and forecasts, in six locales (en, de, nl, fr, es, it).
Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4. Every park figure comes from
[api.park.fan](https://api.park.fan); its repo is `PArns/v4.api.park.fan`, often checked out next to
this one. **Routing and i18n run through `proxy.ts`, not `middleware.ts`.** Server Components by
default.

## Find what your task needs

This file is a router. Read the rules for your area first, then the background you need.

- **Page payload, caching, `revalidate`, streaming, CLS, INP, translations reaching the client** →
  [rules](docs/rules/README.md#architecture-and-payload) · [architecture](docs/README.md#architecture),
  [cost](docs/README.md#cost-and-performance)
- **Wait times, seasons, closed rides, a park with no source, an API route** →
  [rules](docs/rules/README.md#data-and-api) · [API and backend](docs/README.md#api-and-backend)
- **Trip planner, header menu, admin, weather chart, guide page, glossary, blog/news, most read** →
  [rules](docs/rules/README.md#features) · [features](docs/README.md#features)
- **Layout, a component, a breakpoint, the header, a card, an animation, three.js** →
  [rules](docs/rules/README.md#design-and-layout) · [design](docs/README.md#design)
- **Sitemaps, feeds, favicon, robots and agents, analytics, semantic markup** →
  [rules](docs/rules/README.md#seo-and-the-machine-facing-surface) · [SEO](docs/README.md#seo)
- **A post, a news item, a UI string, alt text, a commit message** →
  [rules](docs/rules/README.md#content-and-media) · [writing rules](docs/writing/README.md)
- **Finding an existing component, hook or helper** → [code index](docs/code-index/README.md)

[docs/README.md](docs/README.md) maps every doc; [docs/rules/README.md](docs/rules/README.md) lists
every standing rule in one line.

## Applies to every change

- **[DRY](docs/rules/dry-one-place-for-each-piece-of-logic.md):** one place for each piece of logic,
  constant, regex, formatter or class string; extend what exists, extract a second copy.
- **[Reuse components](docs/rules/reuse-existing-components.md)** (`ParkStatusBadge`,
  `CrowdLevelBadge`, `Badge`, `ParkCard` …); look them up in the [code index](docs/code-index/README.md).
- **[Code index](docs/rules/the-code-index-is-generated-from-the-doc-comments.md):** every export
  carries a `/** … */` comment; after changing exports or their comments run
  `pnpm generate:code-index` (CI: `pnpm check:code-index`).
- **[A comment says why, once](docs/rules/a-comment-says-why-once.md):** never what the next line
  does, history, ticket numbers, dates or measurements.
- **[No text may read as AI-generated](docs/rules/no-text-may-read-as-ai-generated.md):** every
  string a person reads, commit messages and PR bodies included. `pnpm check:prose` plus the review
  pass in [docs/writing/7-review.md](docs/writing/7-review.md).
- **[Six locales in one pull request](docs/rules/a-post-ships-in-six-languages-in-one-pull-request.md):**
  a UI string, post, guide or news item ships in all six, no follow-up ticket.
- **[Changelog fragments](docs/rules/a-version-is-a-unit-of-communication.md):** a pull request
  writes `docs/changelog.d/PAR-<n>.md`, never `docs/changelog.md`, the `package.json` version or
  `content/changelog/`.
- **Before pushing:** `pnpm lint` and `pnpm format:check` (Prettier also formats Markdown), plus
  the checks the rule for your area names. Measure performance against `pnpm build && pnpm start`,
  never `next dev`.

## Keeping the docs in shape

- **This file is indexed, not grown.** A new rule is a new file in `docs/rules/` plus one line in
  [docs/rules/README.md](docs/rules/README.md); new background goes into the page that owns the
  subject (or a new file) plus one line in [docs/README.md](docs/README.md). Never prose here.
- **One fact, one place.** A rule file owns its rule; a feature doc owns the mechanism; the
  backend's `docs/frontend/*.md` owns each API contract. Everywhere else links.
- **One subject per page.** When a page starts covering a second subject, split it and index the
  parts.
- **No to-do lists in the repo.** Open work is a Linear issue (team PAR).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
