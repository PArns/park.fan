# Listing the MCP server and the API

How to get the MCP server (`/api/mcp`) and the public API (`api.park.fan/api-json`) listed where
agents and developers look for them: the official MCP Registry, awesome-mcp-servers, public-apis and
three commercial directories. Open it before submitting or updating a listing. Both services
already work ([agent readiness](agent-readiness.md)); what they lacked on 2026-08-28 was anybody
pointing at them: park.fan was `in_crawl: false` in the Common Crawl web graph while
queue-times.com, thrill-data.com, wartezeiten.app and others were present, with exactly one public
listing (AlternativeTo). On 2026-10-27 the MCP Registry, awesome-mcp-servers and public-apis still
listed no park.fan; the submissions are PAR-1126, and their state lives there, not here.

The measure of success is one number: whether park.fan appears in the next Common Crawl release
with at least one referring host. If it does not move, none of this is worth repeating.

## Verify before advertising

A listing promises wait-time data for every park in it, so re-check the server before submitting:

```bash
# the tools, described
curl -s -X POST https://park.fan/api/mcp -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools[].name'

# a real call
curl -s -X POST https://park.fan/api/mcp -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_park_wait_times","arguments":{"park":"phantasialand"}}}'

# a park with no source must say so, not report "0 min, all rides running"
curl -s -X POST https://park.fan/api/mcp -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_park_wait_times","arguments":{"park":"hansa-park"}}}' \
  | grep -q '"waitTimesAvailable": false' && echo ok
```

**No park count in any entry.** Counts drift: one afternoon the sitemap counted 212 parks while
`/v1/discovery/geo` answered 213, and on 2026-10-27 the catalogue held 209; an entry is written once
and read for years. Say "200+"
as the `Organization` schema does.

## 1. The official MCP Registry (first)

`registry.modelcontextprotocol.io` is upstream of several directories, so one publish there is
worth more than three forms. `server.json` in the repository root describes the server
(`fan.park/park-fan`, streamable HTTP at `https://park.fan/api/mcp`) and validates against the
schema it names. Its `version` is the **server's**: bump it when a tool is added, removed or its
arguments change, not per deploy.

The namespace `fan.park` is the reverse-DNS form of the domain, which domain-authenticated
publishing requires (a GitHub-authenticated publish would be `io.github.parns/…` and name a person).
Domain auth needs a TXT record **on the apex** of `park.fan`; a record at `_mcp-auth.park.fan`
fails with a generic signature error.

```bash
brew install mcp-publisher
# macOS LibreSSL has no Ed25519 in genpkey: use OpenSSL 3 (or the ECDSA P-384 path)
/opt/homebrew/opt/openssl@3/bin/openssl genpkey -algorithm Ed25519 -out key.pem
PUBLIC_KEY="$(/opt/homebrew/opt/openssl@3/bin/openssl pkey -in key.pem -pubout -outform DER | tail -c 32 | base64)"
echo "park.fan. IN TXT \"v=MCPv1; k=ed25519; p=${PUBLIC_KEY}\""
# publish the TXT record, then:
mcp-publisher login dns --domain=park.fan --private-key=key.pem
mcp-publisher validate
mcp-publisher publish
```

`key.pem` is a credential and stays out of the repository. After a key rotation, **delete the old
TXT record**: a stale one is tried first and fails verification.

## 2. awesome-mcp-servers

`punkpeye/awesome-mcp-servers`, category **Travel & Transportation**, alphabetical (between
`pab1it0/tripadvisor-mcp` and `PeanutSplash/chelaile-mcp` on 2026-08-28). Legend: `📇`
TypeScript/JavaScript, `☁️` cloud service.

```markdown
- [PArns/park.fan](https://github.com/PArns/park.fan) 📇 ☁️ - Live wait times, ride status and crowd forecasts for 200+ theme parks, plus a glossary of coaster and park terminology. Hosted at https://park.fan/api/mcp (Streamable HTTP, no auth).
```

The repository's fast path for agent-opened PRs is `🤖🤖🤖` at the end of the PR title; use it
only when a tool opens the PR.

## 3. public-apis

`public-apis/public-apis`, section **Entertainment**, alphabetical (between `NaMoMemes` and
`PotterDB`). It rejects PRs that read as marketing, so the description stays factual.

```markdown
| [park.fan](https://api.park.fan/api) | Live theme park wait times, ride status, opening hours and crowd forecasts for 200+ parks | No | Yes | No |
```

**CORS is `No`, measured:** a request to `api.park.fan` with an `Origin` header returns no
`access-control-allow-*` header, so a browser cannot read it cross-origin. Changing that is an API
change, not a listing change.

## 4. Commercial directories (last, and only while cheap)

`mcp.so`, `glama.ai` and `smithery.ai` listed park.fan nowhere on 2026-08-28. glama.ai auto-indexes
open-source servers from GitHub and may pick up the registry entry by itself (then claim it);
smithery.ai publishes through its own CLI or dashboard with a publisher account; mcp.so had no
documented submission path.
