# Nothing here has a reader inside the site (REQUIREMENT)

The machine-facing surface is the only part of this app that **no page renders**: `/robots.txt`,
`/license.xml`, `/llms.txt`, `/auth.md`, the four documents under `/.well-known/` (`api-catalog`,
`agent-skills/index.json`, `ai-catalog.json`, `mcp/server-card.json`; two carry an extension and two
do not, so type them from this list), the homepage `Link` header, `/api/mcp` and the WebMCP tools.
It can rot through a green build, and the first symptom is an agent getting a 404. So:

- **`pnpm check:agent-ready` and `pnpm check:webmcp` fetch all of it from outside** (a running
  site), and a new document joins `scripts/check-agent-ready.mjs` in the same commit.
- **Two copies of one claim come from one module** (`lib/agents/`). The `Link` header and the catalog
  document name the same URLs; the skills index publishes a SHA-256 of the bytes served, computed at
  build time from `content/agent-skills/<name>/SKILL.md` and never written down beside the file; the
  MCP server card lists the tools by asking the server; `robots.txt` and the RSL licence come from
  `lib/agents/licensing.ts`.
- **The browser's WebMCP tools call `/api/mcp`**, not the API, because two answers depend on rules
  that sit with the data: a park with no wait-time source answers `waitTimesAvailable: false` with a
  sentence (`noLiveWaitTimesReason()`, [parks we cannot read](parks-we-cannot-read.md)), and a ride
  out of season is reported by `effectiveStatus`, never the raw `status`.
- **The policy is three answers, not one**: `Content-Signal: search=yes, ai-input=yes, ai-train=no`,
  repeated per crawler because a bot reads only its own block, and the same answers as an RSL licence
  (`License:` in robots.txt, `Link: …; rel="license"` on every localized page). The Content Signals
  preamble is Cloudflare's text copied verbatim: a reworded legal notice is a different notice.
- **`/admin` is in none of it**, fenced four times against four visitors: robots.txt, an
  `X-Robots-Tag` on the response, the layout metadata, and the WebMCP navigation tool's refusal.

Outside the repo on purpose: enforcement (Cloudflare AI Crawl Control) and the edge conversion that
answers `Accept: text/markdown`, which the check reports rather than asserts.

Background: [agent readiness](../seo/agent-readiness.md) describes each document and how it is
built.
