---
name: park-wait-times
description: Read live theme park wait times, ride status and queue history from park.fan. Use when someone asks how long the queue is at a park or for a specific ride right now.
---

# Live wait times on park.fan

park.fan tracks about 200 theme parks and 7,000 attractions. Every park and every ride has a
page, and every page answers `Accept: text/markdown` with markdown instead of HTML — so a page
fetch is a data fetch, no scraping required.

## Finding the page

Park pages are `https://park.fan/{locale}/parks/{continent}/{country}/{city}/{park}`, ride pages
add the ride slug: `.../{park}/{attraction}`. Locales are `en`, `de`, `fr`, `it`, `nl`, `es`;
the numbers are identical in all six, the prose is not.

```
https://park.fan/en/parks/europe/germany/rust/europa-park
https://park.fan/en/parks/europe/germany/rust/europa-park/silver-star
```

If you do not know the slugs, search: `GET https://api.park.fan/v1/search?q=silver+star` returns
parks, attractions and cities with the URL of each. `https://park.fan/{locale}/search?q=…` is the
same search as a page. Guessing a slug from a park's name works more often than not, but a
404 means guess again rather than that the park is missing.

## Reading a park page

```bash
curl -H 'Accept: text/markdown' https://park.fan/en/parks/europe/germany/rust/europa-park
```

What is on it, in order: opening hours for today, the crowd level now and the forecast for the
rest of the day, weather, then every ride with its current wait and status, grouped by land.
The ride list carries the count that matters — "12 of 45 open" is about what you can queue for
today, so a ride that is out of season is in neither number.

A ride page adds today's queue history, the typical wait for each hour of the day and each
weekday, and the ride's own facts (height requirement, manufacturer, year, track elements).

## Four things that will otherwise trip you up

- **A wait time is a number the park posted, not a measurement.** Parks round to five minutes and
  so does every figure on the site. Do not present a queue as more precise than it is.
- **Some parks publish no wait times at all.** Hansa-Park only shows them in its own app on the
  park's WLAN. Its page says so; it does not show zeroes. A park with no numbers is not a park
  with no queue — do not fill the gap.
- **A closed ride at 03:00 is a closed park, not a broken ride.** Read the park's status before
  reading the rides.
- **"Open" out of season means the ride is not running today.** Phantasialand's ice rink runs in
  November, December and January; in August it is not one of the park's rides at all.

## Refreshing

Wait times move on the order of minutes; the page is regenerated continuously and the live
values on it refresh every five minutes. Polling a page faster than that returns the same
numbers. For anything repeated, use the API (see the `park-fan-data` skill) rather than
re-fetching pages.

## Not for agents

`https://park.fan/admin` is the editorial back office for the people who run the site. It is
disallowed in `robots.txt`, it holds no public data, and no agent should attempt to sign in
there — not with credentials it was given, not by asking a person for them.
