# Agent readiness

What park.fan says to software that arrives with a question rather than an index (robots policy,
licence, `llms.txt`, the API catalog, skills, MCP, WebMCP) and how each document is built. Open it
before changing anything under `lib/agents/`, `app/.well-known/` or `app/robots.txt/`. The standing
rule is [nothing here has a reader inside the site](../rules/nothing-here-has-a-reader-inside-the-site.md):
no page renders any of this, so `pnpm check:agent-ready` and `pnpm check:webmcp` fetch it from
outside (both need a running site), and a new document joins `scripts/check-agent-ready.mjs` in
the same commit.

| Path                                   | What it is                                                                                        | Built by                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `/robots.txt`                          | crawl rules, per-crawler AI policy, Content Signals, `License`, `Agentmap`, the four sitemaps     | `app/robots.txt/route.ts`                         |
| `/license.xml`                         | the same policy as an RSL licence                                                                 | `app/license.xml/route.ts`                        |
| `/llms.txt`                            | the site in one page, for a model that has only the hostname ([llmstxt.org](https://llmstxt.org)) | `app/llms.txt/route.ts`                           |
| `/auth.md`                             | how to authenticate: you do not                                                                   | `app/auth.md/route.ts`                            |
| `/.well-known/api-catalog`             | the public API as a linkset ([RFC 9727](https://www.rfc-editor.org/rfc/rfc9727))                  | `lib/agents/api-catalog.ts`                       |
| `Link:` on the homepage                | a pointer to that catalog ([RFC 8288](https://www.rfc-editor.org/rfc/rfc8288))                    | `HOMEPAGE_LINK_HEADER`, `next.config.ts`          |
| `/.well-known/agent-skills/index.json` | three skills with SHA-256 digests (Agent Skills Discovery v0.2.0)                                 | `lib/agents/skills.ts`                            |
| `/.well-known/ai-catalog.json`         | the capability manifest ([ARD](https://agenticresourcediscovery.org/))                            | `lib/agents/catalog.ts`                           |
| `/.well-known/mcp/server-card.json`    | where the MCP server is (SEP-1649)                                                                | `lib/agents/mcp-server-card.ts`                   |
| `/api/mcp`                             | the MCP server: three read-only tools                                                             | `app/api/mcp/route.ts`, `lib/agents/mcp-tools.ts` |
| `navigator.modelContext`               | the same three tools plus navigation, in the tab (WebMCP)                                         | `components/agents/webmcp-tools.tsx`              |

Where the MCP server and the API are listed for discovery: [MCP registry listing](mcp-registry-listing.md).

## The policy: three questions, not one

`robots.txt` is a route handler rather than Next's `MetadataRoute.Robots` because `Content-Signal`
and `Agentmap` are not in Next's vocabulary.

```
Content-Signal: search=yes, ai-input=yes, ai-train=no
```

- **search**: may a crawler list park.fan? Yes.
- **ai-input**: may an assistant read a page to answer someone's question? Yes; a wait time is
  worth knowing at the moment somebody asks.
- **ai-train**: may the pages become weights? No; the numbers are hours old by lunchtime, and a
  model that memorised them would be confidently wrong.

The per-bot blocks repeat these answers in the form each operator reads, because a bot reads only
its own `User-agent` block. Training crawlers (`TRAINING_CRAWLERS`: `GPTBot`, `ClaudeBot`, `CCBot`,
`Google-Extended`, `Applebot-Extended`, …) get `Disallow: /`; crawlers that fetch because a person
is waiting (`ANSWER_CRAWLERS`: `OAI-SearchBot`, `ChatGPT-User`, `Claude-User`, `Claude-SearchBot`,
`PerplexityBot`, …) get what a search engine gets. This is Cloudflare's own Search / Agent /
Training split; enforcement lives in Cloudflare AI Crawl Control, not in this repo.

## Licensing: the same answers as RSL

`Content-Signal` is read by crawlers that parse robots.txt; RSL by licensing tooling. Both come
from one module, `lib/agents/licensing.ts`, so the licence cannot contradict itself:
`<permits type="usage">search ai-input</permits>`, `<prohibits type="usage">ai-train</prohibits>`,
`<payment type="attribution" />` (the price is a credit: name park.fan and link the page the
number came from).

- **The preamble above the first `Content-Signal` is Cloudflare's Content Signals Policy, copied
  verbatim**, including the sentence that makes a restriction an express reservation of rights
  under Article 4 of the EU copyright directive. A reworded legal notice is a different notice.
- **`License:` in robots.txt** (RSL §4.4).
- **`Link: …; rel="license"` on every localized page** (RSL §4.5), riding on the
  `Content-Language` rules in `next.config.ts`, and on nothing else (`/_next` and the API are not
  what is licensed). It is the one header here that is not homepage-only: the audience for a
  licence is the crawler that skipped robots.txt. On the homepage the value carries the catalog
  links **and** the licence in one string, because Next resolves a repeated header key
  last-match-wins and the homepage rules come last.

## The back office is not part of the offer

`/admin` is fenced four times, each against a different visitor: `Disallow: /admin` and
`/api/admin/` in robots.txt; `X-Robots-Tag: noindex, nofollow, noarchive` on `/admin`,
`/admin/:path*` and `/api/admin/:path*` (`next.config.ts`; the JSON routes render no meta tag);
the admin layout's `robots: { index: false }`; and the WebMCP navigation tool, which refuses
`/admin` and `/dev` (the only fence an agent could otherwise walk through). `/auth.md`, `llms.txt`
and the `park-fan-data` skill say the same in prose: no client registration, no token endpoint,
no attempt at the admin login.

## The API catalog and the homepage `Link` header

`app/.well-known/api-catalog/route.ts` serves one linkset entry anchored at
`https://api.park.fan/v1`: `service-desc` (the OpenAPI JSON at `/api-json`), `service-doc` (the
Swagger UI at `/api`) and `status` (`/v1/health`), relations from RFC 8631. Content type
`application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"`, `force-static`,
and a HEAD returns the same headers (RFC 9727 §2).

The homepage advertises it in both forms the homepage exists in, `/` and the six locale roots.
Before editing that header:

- **Two rules, not one.** `/:locale(en|de|…)` matches the locale root only. The `Content-Language`
  rules end in `:path*` and match every page; copying that shape would put ~250 bytes on every
  page.
- **ASCII only.** Node rejects a header value outside Latin-1: an em dash in one title threw
  `ERR_INVALID_CHAR` and turned the homepage into a 500.
- **Document and header come from one module** (`lib/agents/api-catalog.ts`), so a URL cannot be
  fixed in one and forgotten in the other.

Only park.fan serves a catalog; a well-known URI is asked of the host the client already holds, so
giving api.park.fan one is a backend change.

## Skills

`park-wait-times`, `plan-a-park-visit` and `park-fan-data`: what is the queue doing, which day
should I go, where do I get this as data. The prose is `content/agent-skills/<name>/SKILL.md`,
served verbatim, and the index's SHA-256 of each file is computed from the bytes at build time,
never written down beside it. There is deliberately no skill about the admin UI.

## MCP, and the same tools in the tab

`/api/mcp` is a hand-written, stateless Streamable HTTP server (no session id; `initialize`
returns capabilities only). `GET` answers 405, because it would open a server-to-client stream
this server never writes to. The tools are read-only:

| Tool                  | Answers                                              |
| --------------------- | ---------------------------------------------------- |
| `search_theme_parks`  | a name → the park, ride or city, with its page URL   |
| `get_park_wait_times` | every ride's current queue and status, longest first |
| `get_park_best_days`  | the crowd forecast per day, for picking a date       |

`components/agents/webmcp-tools.tsx` registers the same three through `navigator.modelContext` and
executes them by calling `/api/mcp`, plus `open_park_fan_page`, which navigates the tab.
Descriptions and schemas come from `lib/agents/tool-descriptors.ts` for both surfaces. The browser
tools call the server rather than the API because two answers depend on rules that sit with the
data:

- **A park with no wait-time source** answers `waitTimesAvailable: false` with a sentence, via
  `noLiveWaitTimesReason()` ([parks we cannot read](../rules/parks-we-cannot-read.md)).
  `pnpm check:agent-ready` asserts it against the live Hansa-Park payload; a new tool that returns
  wait times is added to that assertion.
- **A ride out of season** is reported by `effectiveStatus`, never the raw `status`
  ([a ride out of season is closed](../rules/a-ride-out-of-season-is-closed-and-is-not-one-of-the-parks.md)).

## Checking it

```bash
pnpm check:agent-ready     # every document, the headers, the feeds, the MCP handshake and the tools
pnpm check:webmcp          # the browser tools, in Chromium with a stubbed modelContext

curl -sI https://park.fan/en | grep -i '^link'
curl -s -X POST https://park.fan/api/mcp -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

[isitagentready.com](https://isitagentready.com) scans the same surface from outside
(`curl -X POST https://isitagentready.com/api/scan -H 'Content-Type: application/json' -d '{"url":"https://park.fan"}'`).
What its result means:

- **Markdown negotiation passes without code here**: Cloudflare converts the HTML for
  `Accept: text/markdown` at the edge. `pnpm check:agent-ready` reports it rather than asserting
  it, since it is false on localhost by design.
- **Not implemented on purpose:** Web Bot Auth (park.fan operates no bot) and pay per crawl (a
  dashboard setting and a business decision).
- **Red on purpose:** DNS-AID wants SVCB/HTTPS records under `_agents.park.fan` (a DNS change),
  and A2A wants `/.well-known/agent-card.json` for an agent park.fan does not run.
