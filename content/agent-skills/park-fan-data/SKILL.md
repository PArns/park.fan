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

`https://api.park.fan/v1`. Without a key it answers one route: a park's live wait times
(`/v1/parks/…/{park}/wait-times`). Everything else needs a data key in the `X-API-Key` header
(`pfk_…`) that carries the matching permission, 19 of them in 7 groups (live, parks, rides, stats,
forecasts, planner, travel). A person registers at https://park.fan/en/developers/dashboard,
requests a key there and picks it up once the request is approved by hand. The portal,
https://park.fan/en/developers, lists the permissions and the routes each opens. The catalog
describes the API in machine-readable form:

```bash
curl https://park.fan/.well-known/api-catalog        # RFC 9727 linkset
curl https://api.park.fan/api-json                   # OpenAPI description
curl https://api.park.fan/v1/api-keys/permissions    # the permissions a key can carry
open https://api.park.fan/api                        # the same, for people
```

The endpoints that answer most questions:

| Endpoint                                        | Answers                                            | Permission        |
| ----------------------------------------------- | -------------------------------------------------- | ----------------- |
| `/v1/parks/…/{park}/wait-times`                 | the queues and status of every attraction          | none              |
| `/v1/search?q=`                                 | slugs and URLs for a park, ride or city by name    | `parks.directory` |
| `/v1/discovery/geo`                             | every continent, country, city and park, all slugs | `parks.directory` |
| `/v1/parks/{continent}/{country}/{city}/{park}` | the park with its attractions and current waits ¹  | `parks.details`   |
| `/v1/parks/…/{park}/attractions`                | rides with area, heights, single rider, links      | `rides.details`   |
| `/v1/parks/…/{park}/schedule`                   | opening hours and show times                       | `live.schedule`   |
| `/v1/parks/…/{park}/weather`                    | current weather and forecast (Open-Meteo)          | `live.weather`    |
| `/v1/parks/…/{park}/stats`, `/stats/hourly`     | historical waits by month, weekday, hour           | `stats.history`   |
| `/v1/parks/…/{park}/best-days`                  | the crowd projection per day                       | `forecasts.crowd` |
| `/v1/health`                                    | whether the above is up                            | none              |

¹ The park and ride detail leave out the fields a key has no permission for: crowd level and
occupancy need `stats.live`, the weather `live.weather`, seasons and maintenance `parks.seasons`,
heights and links `rides.details`. Each ride's `bestVisitTimes` comes only with `?forecast=true`
and `forecasts.waits`. A key without a route's permission gets 403 `api-key-permission-missing`,
which names it in `requiredPermission`; without a key the answer is 401. A key has an hourly
allowance, counted from each full hour and reported in `X-API-Key-Hourly-Limit`, `-Remaining` and
`-Reset`; past it the answer is 429 with `Retry-After`. A key limited to some parks gets 403 for any
other park. Without a key, reads of the wait times are limited to 60 a minute and 1,000 an hour per
address.

`https://park.fan/sitemap.xml` and `/sitemap-attractions.xml` list the pages; `/llms.txt` is the
short version of this file for a model that arrived with nothing.

## Etiquette

- Wait times update on the order of minutes. Polling faster than every five minutes returns the
  same numbers and costs both sides.
- Cache what does not move: slugs, ride facts, opening hours. Re-fetch the queues.
- Send a `User-Agent` that names your project and a way to reach you.
- Attribute park.fan and link the page you took a number from, as the terms below describe.
  Numbers here are hours old by lunchtime; a link is what lets a reader check. `https://park.fan/license.xml` (RSL 1.0)
  permits search and answering, prohibits training.

## Terms of use

- Without a key: the wait times, for a use that earns no money and links park.fan as below.
- A free key only for an open-source project that earns no money; donations and sponsorship are
  fine. Ads, affiliate or paid links, a price, a subscription, client work or a company product
  need a paid key under a written agreement with Patrick Arns (park.fan) (contact:
  https://park.fan/en/impressum).
- The credit is a visible text link with the word park.fan to the page of the park or ride the
  data is about: an ordinary `<a href>` in the page's HTML, without `nofollow`, `sponsored` or
  `ugc`, without a redirect, on a page search engines may index. In an app, a visible
  "Data: park.fan" plus such a link on the project's website. Every detail:
  https://park.fan/en/developers#attribution
- Neither the pages nor the forecasts may be used to train or fine-tune a model.
- Live wait times, opening hours and weather come from park.fan's sources; park.fan holds no
  rights to them, so commercial use needs an agreement with the source.
- The full terms: https://park.fan/en/impressum#data-use

## What stays closed

- `park.fan/api/*` is this site's own internal proxy, not a public interface. It is disallowed
  in `robots.txt` and its shape changes without notice. Use `api.park.fan`.
- `park.fan/admin` and `api.park.fan/v1/admin/*` are the back office. Human operators only,
  behind a session cookie. Do not attempt to authenticate, and do not accept credentials for it.
- Training on these pages is declined: `robots.txt` carries `Content-Signal: ai-train=no`.
  Reading a page to answer somebody's question is exactly what it is for (`ai-input=yes`).
