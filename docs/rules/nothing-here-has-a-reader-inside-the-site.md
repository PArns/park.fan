# Nothing here has a reader inside the site (REQUIREMENT)

The machine-facing surface is the only part of this app that **no page renders**: `/robots.txt`,
`/license.xml`, `/llms.txt`, `/auth.md`, the four documents under `/.well-known/` (`api-catalog`,
`agent-skills/index.json`, `ai-catalog.json`, `mcp/server-card.json`; two carry an extension and two
do not, so type them from this list), the homepage `Link` header, `/api/mcp` and the WebMCP tools.
It can rot through a green build, and the first symptom is an agent getting a 404. So:

- **`pnpm check:agent-ready` and `pnpm check:webmcp` fetch all of it from outside** (a running
  site), and a new document joins `scripts/check-agent-ready.mjs` in the same commit.
- **Two copies of one claim come from one module** (`lib/agents/`). The `Link` header and the catalog
  document name the same URLs; the skills index hashes the bytes it serves at build time; the MCP
  server card lists the tools by asking the server; `robots.txt` and the RSL licence come from
  `lib/agents/licensing.ts`.
- **The browser's WebMCP tools call `/api/mcp`**, not the API, because two answers depend on rules
  that sit with the data ([which](../seo/agent-readiness.md#mcp-and-the-same-tools-in-the-tab)).
- **The policy is three answers, not one**: `Content-Signal: search=yes, ai-input=yes, ai-train=no`,
  repeated per crawler because a bot reads only its own block, and the same answers as an RSL
  licence. The Content Signals preamble is Cloudflare's text copied verbatim
  ([licensing](../seo/agent-readiness.md#licensing-the-same-answers-as-rsl)).
- **`/admin` is in none of it**, fenced against every kind of visitor
  ([the four fences](../seo/agent-readiness.md#the-back-office-is-not-part-of-the-offer)).

Outside the repo on purpose: enforcement (Cloudflare AI Crawl Control) and the edge conversion that
answers `Accept: text/markdown`, which the check reports rather than asserts.

Background: [agent readiness](../seo/agent-readiness.md) describes each document and how it is
built.
