# API discovery (RFC 9727)

Robots and sitemaps tell a crawler which **pages** exist. This is the other half: how an agent
that arrives with nothing but the hostname finds the **API** behind the site.

Two pieces, both served from park.fan:

1. `/.well-known/api-catalog` — the catalog document ([RFC 9727](https://www.rfc-editor.org/rfc/rfc9727)).
2. A `Link` header on the homepage pointing at it ([RFC 8288](https://www.rfc-editor.org/rfc/rfc8288),
   RFC 9727 §3).

Only park.fan. A well-known URI is asked of whichever host the client already holds, so
something handed an api.park.fan endpoint finds nothing — `https://api.park.fan/.well-known/api-catalog`
is a 404 today. Giving the backend a catalog of its own is a change in
[its repo](https://github.com/park-fan/v4.api.park.fan), not this one.

---

## The catalog document

`app/.well-known/api-catalog/route.ts`, built from `lib/api-catalog.ts`:

```json
{
  "linkset": [
    {
      "anchor": "https://api.park.fan/v1",
      "service-desc": [{ "href": "https://api.park.fan/api-json", "type": "application/json" }],
      "service-doc": [{ "href": "https://api.park.fan/api", "type": "text/html" }],
      "status": [{ "href": "https://api.park.fan/v1/health", "type": "application/json" }]
    }
  ]
}
```

One entry, because there is one API. `anchor` is the API itself; the relations come from
RFC 8631 — `service-desc` is the OpenAPI JSON that Swagger generates, `service-doc` the Swagger
UI, `status` the health endpoint. The `/api` routes sit outside the backend's `/v1` prefix, so
they are absolute URLs: nothing resolves them against the anchor.

Served as `application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"`. The
profile parameter is only a SHOULD in §4.2, but it is what tells a client that stumbled into
the document which kind of linkset it is holding. It is `force-static`: the body is a handful
of constants, so it is prerendered and served from the CDN rather than waking a function for
every probe. A HEAD comes back with the same headers, which §2 requires — the `Link` header on
that response is what a client gets instead of a body.

`.well-known` works as a route folder; Next lists it alongside `rss.xml` and `llms.txt`. It also
stays clear of the i18n proxy, whose matcher skips any path segment containing a dot, so the
catalog never gets a locale prefix bolted onto it.

## The Link header

Set in `next.config.ts`'s `headers()`, on the homepage in both forms it exists in: `/`, which
the proxy redirects to a locale, and the six locale roots. A client that follows the redirect
reads the headers off `/en`; one that does not still gets them off the 307.

```
Link: </.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json",
      <https://api.park.fan/api-json>; rel="service-desc"; type="application/json"; title="…",
      <https://api.park.fan/api>; rel="service-doc"; type="text/html"; title="…"
```

`api-catalog` is the relation that matters; the other two save an agent the round trip through
the catalog for the only API in it. Next adds its own `Link` header for font and image preloads
— a second header of the same name is fine, RFC 8288 §3 allows both repeated headers and a
comma-separated list.

Three things to know before editing any of this:

- **Two rules, not one.** `/:locale(en|de|…)` matches the locale root only. The `Content-Language`
  rules above it end in `:path*` and therefore match every page under a locale — copying that
  shape is how this would silently go site-wide.
- **ASCII only.** The header value is assembled from the same titles as the catalog document, and
  Node rejects a header value outside Latin-1. An em dash in one title threw `ERR_INVALID_CHAR`
  and turned the homepage into a 500, not into a page missing a header.
- **The document and the header come from one module.** Nothing renders a `Link` header, so a URL
  fixed in one place and forgotten in the other would keep pointing agents at a 404 with a green
  build.

## Checking it

```bash
curl -sI https://park.fan/en | grep -i '^link'
curl -s https://park.fan/.well-known/api-catalog
curl -sI https://park.fan/.well-known/api-catalog | grep -i '^link'
```

[isitagentready.com](https://isitagentready.com) scans both from the outside — `checks.discovery.apiCatalog`
and `checks.discoverability.linkHeaders`:

```bash
curl -X POST https://isitagentready.com/api/scan \
  -H 'Content-Type: application/json' -d '{"url":"https://park.fan"}'
```

It requests the catalog with `Accept: application/linkset+json, application/json` and counts the
entries in `linkset`; for the header it follows `/` to the locale homepage and reads the
relations off the final response.
