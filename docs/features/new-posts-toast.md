# New-posts toast

A returning visitor who has not seen the newest posts gets one toast about them; a first visit never
does. Open this page before changing when the toast asks, what counts as new, or how it looks.

News counts like every other post. The teaser surfaces keep news apart from the articles
([rule](../rules/news-is-set-apart-from-the-articles.md)), but the toast is not a teaser: it announces
what arrived, and news is what arrives most often. The route lists `listPosts(locale)` and never
filters with `isNewsPost`. `pnpm test:new-posts` pins what counts as new, the check interval, and
(by grep over watcher and route) that news is not filtered, no `sessionStorage` flag is read and a day
sorts by `time`.

| Piece                                   | Job                                                                   |
| --------------------------------------- | --------------------------------------------------------------------- |
| `app/api/blog-latest/[locale]/route.ts` | Static JSON per locale: the six newest posts plus the toast's strings |
| `lib/blog/new-posts.ts`                 | Client-safe: the stored record, which posts are unseen, the post kind |
| `components/blog/new-posts-watcher.tsx` | Mounted in the locale layout; decides when to ask                     |
| `components/blog/new-posts-toast.tsx`   | The toast, loaded with `next/dynamic` only when there is something    |

## What it costs a page

Nothing in the payload. The layout renders `<NewPostsWatcher enabled={showBlog} />`, a few hundred
bytes that do nothing until 2.5 s (`START_DELAY_MS`) after one of three moments: the first page of a
visit, every client-side navigation, and a tab coming back to the front (`visibilitychange`; a browser
restoring its tabs or an installed app resuming loads no page, so this is the only moment such a
visitor gives). Then it fetches `/api/blog-latest/<locale>`, at most once per ten minutes across all
tabs (`CHECK_INTERVAL_MS`): `claimCheck()` keeps the last check in
`localStorage['pf:blog-seen-checked-at']` and claims the next one before the request goes out. A
per-`sessionStorage` flag was tried and failed: a restored tab or installed app keeps its session for
days, so a reload after a news post went live asked nothing.

The file is built from the blog manifest, changes only with a deployment, and is served with
`max-age=600, s-maxage=600` (plus `stale-while-revalidate`): the same ten minutes in the browser and
at the edge. Ten rather than sixty because a deploy purges Cloudflare but not the browser, and a news
post is worth announcing mostly in its first hours.

The toast's strings come with that JSON rather than through `NextIntlClientProvider`: a
`useTranslations` in a component the layout mounts would put the `blogToast` namespace into every
page's RSC payload for a toast most page views never show. The route reads them with
`getTranslations({ locale, namespace: 'blogToast' })`; `moreOne`/`moreOther` go out raw (`t.raw`) and
the browser fills in `{count}`.

The toast animates with CSS alone: the entrance is a transition from `starting:` values, the exit the
same values set while `open` is false, and the swipe is pointer events writing the card's transform
(`SWIPE_DISTANCE` 64 px or `SWIPE_VELOCITY` 500 px/s dismisses, `DRAG_SLOP` 6 px keeps a tap a tap).
framer-motion was a 38 KB brotli chunk for those two jobs.

## What counts as new

A post's `date` is a day, not an instant, so the comparison cannot be a timestamp. The record in
`localStorage['pf:blog-seen']` stores the posts:

```json
{ "newest": "2026-09-22", "keys": ["tagesplaner", "halloween-2026", "…"] }
```

`keys` are translation keys, so switching language announces nothing again. A post is unseen when its
key is not in `keys` **and** its `date` is not older than `newest`; the date floor stops a post that
only dropped out of the six from being announced twice.

- **No record** (first visit, cleared or throwing storage): store the list, show nothing.
- **Record, nothing unseen**: store the list, show nothing.
- **Record, unseen posts**: store the list, then show the toast, so a reload does not repeat it.
- **On a `/blog` route**: store the list, show nothing, since the posts are on screen. A toast that is
  up when the visitor navigates into the blog disappears and does not come back.

Accepted gap: a post back-dated to before the last visit is never announced. Date a news post the day
it goes live.

Only publication order counts: `updatedAt` does not make a post new and `featured` does not move it
forward. Within a day the route sorts by the news posts' `time` through `newestPublishedFirst`
(`lib/blog/published-at.ts`), the comparator every listing uses, because the toast leads with the first
post; an article has no `time` and sorts behind the timed news of its day.

## What it calls the post

Every card is headed by what its post is, and "see all" follows the post the toast leads with, by its
category (`latestPostKind`, `lib/blog/new-posts.ts`):

| Category             | Eyebrow (de)                                                 | "See all" goes to |
| -------------------- | ------------------------------------------------------------ | ----------------- |
| `news`, `news/…`     | „News"                                                       | `/news`           |
| `guides`, `guides/…` | „Neuer Guide verfügbar"                                      | `/blog`           |
| anything else        | the label of its top-level category, e.g. „Neu auf park.fan" | `/blog`           |

The route sends the kind with each post, the top-level label (`categoryRoot`) and the strings
`blogToast.eyebrowNews`, `eyebrowGuide` and `eyebrow` (the last only heads a post without a category).
`/blog` lists no news, so a news toast must not link there. The meta line drops the category label
when it is the top-level one („News · heute" under „News"); a subcategory still shows. A payload cached
from before `kind` existed still heads a news post as news, by its `/news/` path (`kindOfLatestPost`).

## Layout

- **Phones** (below `sm`): full width with a 12 px gutter, above the home indicator
  (`env(safe-area-inset-bottom)`), with a handle; swipe down to dismiss. It measures
  `[data-location-banner]` and sits above the location banner.
- **From `sm`**: a 400 px card in the top-right corner under the header, swipe right to dismiss.
  `z-40`, under the header's `z-50`, so a menu band covers the toast. Under the language banner
  (`[data-language-banner]`) it moves below it; with the planner panel open it moves left by
  `--planner-inset` (`planner-wide:`).
- **Further posts fan out** under the card from `sm` as one-line cards (`FanCard`, each a link), as
  many as the window has room for (`fanFit`, `FAN_ROW`, `FAN_BOTTOM_GAP`, re-measured on resize), sliding
  out one after another once the card has landed (`FAN_DELAY_MS`, `FAN_STAGGER_MS`, `--fan-i`). Phones
  keep the single card and up to two sheets peeking behind it.
- A footer row links to the listing of the lead post's kind and says how many new posts are not on
  screen.
- Auto-dismiss after 12 s (`AUTO_DISMISS_MS`); the bar along the bottom edge is the countdown (a Web
  Animation) and pauses on hover, on focus and while the tab is hidden.
- The whole card links to the post (a stretched `::after`); the close button and "see all" sit above it
  with `z-10`, and a swipe that ends on the card does not open it.
- `prefers-reduced-motion`: a fade instead of the spring, no pulsing dot, no image zoom; the fan fades
  in without travel.
- Escape closes it. The close button is 24 px drawn and 44 px to a finger.
- A coverless post shows [`BlogCoverFallback`](blog-cover-fallback.md).

Analytics: `blog_toast_opened`, no properties, when the post link is followed.

## Testing it by hand

In the browser console on any page:

```js
localStorage.setItem('pf:blog-seen', JSON.stringify({ newest: '2000-01-01', keys: [] }));
localStorage.removeItem('pf:blog-seen-checked-at');
location.reload();
```

That announces all six posts. `localStorage.removeItem('pf:blog-seen')` simulates a first visit.
Removing `pf:blog-seen-checked-at` stands in for the ten minutes between checks; without it a second
try inside that window asks nothing, which is correct.
