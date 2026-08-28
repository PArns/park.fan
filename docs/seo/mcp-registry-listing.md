# Listing the MCP server and the API

Everything here is about **discovery**, not about capability: the MCP server at `/api/mcp` and the
OpenAPI at `api.park.fan/api-json` both shipped long ago and work. What they do not have is anybody
pointing at them. The SEO audit on 2026-08-28 measured the consequence: park.fan is `in_crawl: false`
in the Common Crawl web graph while queue-times.com, thrill-data.com, wartezeiten.app,
touringplans.com, themeparkinsider.com and coasterforce.com are all present, and exactly **one**
public listing exists anywhere — an AlternativeTo entry submitted by the site owner.

These four submissions were picked because they cost nothing to build. No feature is missing; the
work is filling in forms about software that already runs.

## Verify before advertising

The entries below claim things. They were checked on 2026-08-28, and should be re-checked before
submitting if this document has aged:

```bash
# 3 tools, described
curl -s -X POST https://park.fan/api/mcp -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools[].name'

# a real call, not just the list
curl -s -X POST https://park.fan/api/mcp -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_park_wait_times","arguments":{"park":"phantasialand"}}}'

# the edge case the whole surface is judged on: a park with no source must say so
curl -s -X POST https://park.fan/api/mcp -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_park_wait_times","arguments":{"park":"hansa-park"}}}' \
  | grep -q '"waitTimesAvailable": false' && echo ok
```

The Hansa-Park check is the one that matters. A directory entry promising wait-time data is a
promise about every park in it, and a park with no readable source aggregating to "Ø 0 min, all
rides running" would make the entry a lie for that park.

## 1. The official MCP Registry — do this one first

`registry.modelcontextprotocol.io` is **upstream of the others**: several directories index from it
rather than taking submissions directly, so one publish here is worth more than three forms.

`server.json` sits in the repository root and validates against the published schema
(`ajv validate -s server.schema.json -d server.json --spec=draft7 --strict=false` → `valid`).

The namespace is `fan.park`, the reverse-DNS form of the domain, which the registry requires for
domain-authenticated publishing — a GitHub-authenticated publish would have to be
`io.github.parns/…` instead, and names the person rather than the project.

Domain auth needs a TXT record **on the apex** of `park.fan`, not under a selector. The registry
follows SPF-style placement; a record at `_mcp-auth.park.fan` fails with a generic signature error
that says nothing about why.

```bash
brew install mcp-publisher            # or the release tarball
MY_DOMAIN="park.fan"

# macOS ships LibreSSL, which has no Ed25519 in genpkey. Use OpenSSL 3 explicitly,
# or take the ECDSA P-384 path, which LibreSSL does support.
/opt/homebrew/opt/openssl@3/bin/openssl genpkey -algorithm Ed25519 -out key.pem
PUBLIC_KEY="$(/opt/homebrew/opt/openssl@3/bin/openssl pkey -in key.pem -pubout -outform DER | tail -c 32 | base64)"
echo "${MY_DOMAIN}. IN TXT \"v=MCPv1; k=ed25519; p=${PUBLIC_KEY}\""
```

Publish the TXT record, then:

```bash
mcp-publisher login dns --domain=park.fan --private-key=key.pem
mcp-publisher validate
mcp-publisher publish
```

`key.pem` is a credential: keep it out of the repository. If it is ever rotated, **delete the old
TXT record** — a stale one is tried first and fails verification.

**No park count in any of these entries, deliberately.** The audit counted 212 parks from the
sitemap on 2026-08-28 and `/v1/discovery/geo` answered `parkCount: 213` the same afternoon. A
directory entry is written once and re-read for years; a number that moves inside a day does not
belong in one. The site's own `Organization` schema already says "200+ theme parks worldwide", so
the entries say the same.

`version` in `server.json` is the _server's_ version, not the site's. Bump it when the tool surface
changes (a tool added, removed, or its arguments changed), not on every deploy.

## 2. awesome-mcp-servers

`punkpeye/awesome-mcp-servers`, category **🚆 Travel & Transportation**, alphabetical: between
`pab1it0/tripadvisor-mcp` and `PeanutSplash/chelaile-mcp`.

Emoji per the repo's own legend: `📇` TypeScript/JavaScript codebase, `☁️` Cloud Service.

```markdown
- [PArns/park.fan](https://github.com/PArns/park.fan) 📇 ☁️ - Live wait times, ride status and crowd forecasts for 200+ theme parks, plus a 267-term glossary of coaster and park terminology. Hosted at https://park.fan/api/mcp (Streamable HTTP, no auth).
```

The repo has a documented fast path for agent-opened PRs: append `🤖🤖🤖` to the **PR title** to opt
in. Use it if a tool opens the PR; do not use it for a hand-written one.

## 3. public-apis

`public-apis/public-apis`, section **Entertainment**, alphabetical: between `NaMoMemes` and
`PotterDB`. Five columns, no Postman column in that table today.

```markdown
| [park.fan](https://api.park.fan/api) | Live theme park wait times, ride status, opening hours and crowd forecasts for 200+ parks | No | Yes | No |
```

**CORS is `No` and that is measured, not assumed:** a request to `api.park.fan` with an `Origin`
header comes back 200 with no `access-control-allow-*` header at all, so a browser cannot read it
cross-origin. public-apis notes that such an API is "only usable server side", which is honest and
fine — but the field must not say `Yes`. If cross-origin browser use is ever wanted, that is an API
change, not a listing change.

The repository is alive: 11 of the 15 most recently closed PRs were merged, the last on 2026-08-26.
It also states plainly that PRs which read as marketing are rejected, so the description stays
factual and the free, no-auth access is the reason it qualifies at all.

## 4. The three commercial directories

`mcp.so`, `glama.ai` and `smithery.ai` were checked on 2026-08-28 and list park.fan nowhere.

- **glama.ai** auto-indexes open-source servers from GitHub; a listing may appear on its own once
  the registry entry exists, and can then be claimed.
- **smithery.ai** takes a publish through its own CLI or dashboard and wants a publisher account.
- **mcp.so** has no documented public submission path; check its site for a submit link before
  spending time on it.

Do these **after** the registry, and only as far as they stay cheap. They are the tail of this list,
not the head.

## What to watch

The point of all four is one number: whether park.fan appears in the next Common Crawl release with
at least one referring host. Nothing here changes a ranking directly, and none of it is worth
repeating if that number does not move.
