# Development setup

How to get the frontend running locally and what `pnpm build` does before Next.js starts. Every
other command is in [scripts](scripts.md).

## Prerequisites

- **Node.js 24** or newer, pinned in `.nvmrc` and `package.json` `engines` (the version Vercel
  runs). `nvm use` switches to it.
- **pnpm**, the version in `package.json` `packageManager` (`corepack enable` provides it).

## Install and run

```bash
pnpm install
cp .env.example .env.local   # optional
pnpm dev                     # http://localhost:3000, Turbopack
```

Nothing has to be configured for basic development. The API defaults to `https://api.park.fan`
(`NEXT_PUBLIC_API_URL` points elsewhere); `API_AUTH_KEY` is optional and server-only.
`.env.example` documents every other variable (Umami, CARTO, Turnstile, the contribution store,
the admin's GitHub token, the Vercel and Cloudflare webhooks).

## Build

```bash
pnpm build
pnpm start
```

`pnpm build` runs `prebuild` first, then `next build --turbo`, then `check-no-has.mjs --built`
against the emitted CSS. `prebuild` runs, in order:

| Step                           | Writes / checks                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `generate-build-info.mjs`      | `build-info.json`                                                                                |
| `generate-message-chunks.mjs`  | the per-locale chunks a lazy boundary fetches                                                    |
| `check-client-messages.mjs`    | **fails** on a stale route-namespace map or a mis-wired route                                    |
| `check-untranslated.mjs`       | **fails** on German copied into another locale                                                   |
| `check-blog-updated-at.mjs`    | **fails** when a post's translations disagree on `updatedAt`                                     |
| `generate-client-glossary.mjs` | the client glossary data                                                                         |
| `generate-blog-manifest.mjs`   | the blog manifests                                                                               |
| `generate:most-read-seed`      | the most-read rankings as this build sees them (never fails; empty when the API does not answer) |
| `generate:image-crops`         | the 16:9 / 4:3 / 1:1 crops                                                                       |
| `generate:og-assets`           | `og-assets/`, the OG function's asset root                                                       |
| `generate:media`               | the media database manifests                                                                     |

The three checks fail the build on purpose: each guards something whose failure is otherwise
silent (raw message keys or a page in the wrong language, German on an English page, a
translation left behind). When `check-client-messages` fires, the fix is usually
`pnpm generate:route-namespaces`; see
[internationalization](../i18n/internationalization.md#which-namespaces-reach-the-client).

What each generator writes and which outputs are committed: [scripts](scripts.md#generators).
