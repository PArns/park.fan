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

`https://api.park.fan/v1`. Without a key, OAuth or sign-up a caller reads a park's live wait
times (`/wait-times`) and nothing else. Every other route needs a data key in the `X-API-Key`
header (`pfk_…`) carrying the right permission. A person registers at
https://park.fan/en/developers, files a request and picks the key up once it is approved; the
portal lists the permissions (live, parks, rides, stats, forecasts, planner, travel) and the
routes each opens, and https://api.park.fan/v1/api-keys/permissions serves the same catalog. The
catalog describes the API in machine-readable form:

```bash
curl https://park.fan/.well-known/api-catalog        # RFC 9727 linkset
curl https://api.park.fan/api-json                   # OpenAPI description
open https://api.park.fan/api                        # the same, for people
```

The endpoints that answer most questions:

| Endpoint                                        | Answers                                                     | Permission        |
| ----------------------------------------------- | ----------------------------------------------------------- | ----------------- |
| `/v1/parks/…/{park}/wait-times`                 | just the queues                                             | none              |
| `/v1/search?q=`                                 | slugs and URLs for a park, ride or city by name             | `parks.directory` |
| `/v1/parks/{continent}/{country}/{city}/{park}` | the park with all its attractions and current waits ¹       | `parks.details`   |
| `/v1/parks/…/{park}/best-days`                  | the crowd projection per day                                | `forecasts.crowd` |
| `/v1/parks/…/{park}/stats`, `/stats/hourly`     | historical waits by month, weekday, hour                    | `stats.history`   |
| `/v1/discovery/geo`                             | every continent, country, city and park, i.e. all the slugs | `parks.directory` |
| `/v1/discovery/nearby?lat=&lng=`                | parks around a point                                        | `parks.directory` |
| `/v1/health`                                    | whether the above is up                                     | none              |

¹ The park detail leaves out what the key has no permission for: weather (`live.weather`),
opening hours (`live.schedule`), seasons (`parks.seasons`), ride facts such as height, minimum
height and URL (`rides.details`), ride profiles (`rides.profiles`), live statistics
(`stats.live`), and each ride's typical waits and headliner mark (`stats.typical-waits`, which
`stats.history` includes). Its forecast field, each ride's `bestVisitTimes`, comes only with
`?forecast=true` and `forecasts.waits`. Without a key a route answers 401; a key without the
permission gets 403 `api-key-permission-missing` with `requiredPermission`. A key has an hourly
allowance, counted from each full hour and reported in `X-API-Key-Hourly-Limit`, `-Remaining` and
`-Reset`; past it the answer is 429 with `Retry-After`. A key limited to some parks gets 403 for
any other park. Without a key, the wait times are limited to 60 reads a minute and 1,000 an hour
per address.

`https://park.fan/sitemap.xml` and `/sitemap-attractions.xml` list the pages; `/llms.txt` is the
short version of this file for a model that arrived with nothing.

## Etiquette

- Wait times update on the order of minutes. Polling faster than every five minutes returns the
  same numbers and costs both sides.
- Cache what does not move: slugs, ride facts, opening hours. Re-fetch the queues.
- Send a `User-Agent` that names your project and a way to reach you.
- Attribute park.fan and link the page you took a number from. Numbers here are hours old by
  lunchtime; a link is what lets a reader check. `https://park.fan/license.xml` (RSL 1.0)
  permits search and answering, prohibits training.

## Terms of use

- Everything beyond the live wait times needs a data key. A key is free only for an open-source
  project that earns nothing from it (donations are fine) and shows a visible, followable link to
  park.fan on a page search engines may index; how that link must look:
  https://park.fan/en/developers#attribution. Any other use takes a paid key under a written
  agreement with Patrick Arns (park.fan) (contact: https://park.fan/en/impressum).
- Neither the pages nor the forecasts may be used to train or fine-tune a model.
- Live wait times, opening hours and weather come from park.fan's sources and are passed on for
  non-commercial use only; commercial use needs an agreement with the source.
- The full terms, with what counts as commercial: https://park.fan/en/impressum#data-use

## What stays closed

- `park.fan/api/*` is this site's own internal proxy, not a public interface. It is disallowed
  in `robots.txt` and its shape changes without notice. Use `api.park.fan`.
- `park.fan/admin` and `api.park.fan/v1/admin/*` are the back office. Human operators only,
  behind a session cookie. Do not attempt to authenticate, and do not accept credentials for it.
- Training on these pages is declined: `robots.txt` carries `Content-Signal: ai-train=no`.
  Reading a page to answer somebody's question is exactly what it is for (`ai-input=yes`).
