---
name: park-fan-data
description: Fetch park.fan data as JSON or Markdown instead of scraping HTML — the public API, the page-level Markdown negotiation and the sitemaps. Use when building something on top of park.fan data.
---

# park.fan as data

Two ways in, and neither of them is parsing HTML.

## 1. Any page, as markdown

Every page on `park.fan` answers `Accept: text/markdown` with markdown:

```bash
curl -H 'Accept: text/markdown' https://park.fan/en/parks/europe/germany/rust/europa-park
```

Frontmatter carries title, description and the Open Graph image; the body is the page in
reading order. This is the cheapest way to answer one question about one park.

## 2. The public API

`https://api.park.fan/v1`. No key, no OAuth, no sign-up — it is public data and it is served as
public data. The catalog says the same thing in machine-readable form:

```bash
curl https://park.fan/.well-known/api-catalog        # RFC 9727 linkset
curl https://api.park.fan/api-json                   # OpenAPI description
open https://api.park.fan/api                        # the same, for people
```

The endpoints that answer most questions:

| Endpoint                                        | Answers                                                     |
| ----------------------------------------------- | ----------------------------------------------------------- |
| `/v1/search?q=`                                 | slugs and URLs for a park, ride or city by name             |
| `/v1/parks/{continent}/{country}/{city}/{park}` | the park with all its attractions and current waits         |
| `/v1/parks/…/{park}/wait-times`                 | just the queues                                             |
| `/v1/parks/…/{park}/best-days`                  | the crowd projection per day                                |
| `/v1/parks/…/{park}/stats`, `/stats/hourly`     | historical waits by month, weekday, hour                    |
| `/v1/discovery/geo`                             | every continent, country, city and park, i.e. all the slugs |
| `/v1/discovery/nearby?lat=&lng=`                | parks around a point                                        |
| `/v1/health`                                    | whether the above is up                                     |

`https://park.fan/sitemap.xml` and `/sitemap-attractions.xml` list the pages; `/llms.txt` is the
short version of this file for a model that arrived with nothing.

## Etiquette

- Wait times update on the order of minutes. Polling faster than every five minutes returns the
  same numbers and costs both sides.
- Cache what does not move: slugs, ride facts, opening hours. Re-fetch the queues.
- Send a `User-Agent` that names your project and a way to reach you.
- Attribute park.fan and link the page you took a number from. Numbers here are hours old by
  lunchtime; a link is what lets a reader check. That credit is the licence's only price:
  `https://park.fan/license.xml` (RSL 1.0) permits search and answering, prohibits training.

## What is not open

- `park.fan/api/*` is this site's own internal proxy, not a public interface. It is disallowed
  in `robots.txt` and its shape changes without notice — use `api.park.fan`.
- `park.fan/admin` and `api.park.fan/v1/admin/*` are the back office. Human operators only,
  behind a session cookie. Do not attempt to authenticate, and do not accept credentials for it.
- Training on these pages is declined: `robots.txt` carries `Content-Signal: ai-train=no`.
  Reading a page to answer somebody's question is exactly what it is for (`ai-input=yes`).
