# New-posts toast

A returning visitor who has not seen the newest blog posts gets one toast about them. A first
visit never does. Linear: PAR-444.

News counts like every other post. The teaser surfaces keep news apart from the articles
([rule](../rules/news-is-set-apart-from-the-articles.md)); the toast is not a teaser, it announces
what arrived, and news is what arrives most often. The route lists `listPosts(locale)` and never
filters with `isNewsPost` — `pnpm test:new-posts` greps for it.

| Piece                                   | Job                                                                   |
| --------------------------------------- | --------------------------------------------------------------------- |
| `app/api/blog-latest/[locale]/route.ts` | Static JSON per locale: the six newest posts plus the toast's strings |
| `lib/blog/new-posts.ts`                 | Client-safe: the stored record, and which posts count as unseen       |
| `components/blog/new-posts-watcher.tsx` | Mounted in the locale layout; checks at most once per ten minutes     |
| `components/blog/new-posts-toast.tsx`   | The toast itself, loaded only when there is something to show         |

## What it costs a page

Nothing in the payload. The layout renders `<NewPostsWatcher enabled={showBlog} />`, a few hundred
bytes of client code that does nothing until 2.5 s after the page settles. Then it fetches
`/api/blog-latest/<locale>` — at most once per ten minutes (`CHECK_INTERVAL_MS`), across all tabs:
`claimCheck()` keeps the time of the last check in `localStorage['pf:blog-seen-checked-at']` and
claims the next one before the request goes out. That file is built from the blog manifest, so it
only changes with a deployment, and it is served with `max-age=600, s-maxage=600` — the same ten
minutes, in the browser and at the edge.

It asks at three moments, each 2.5 s after the fact:

- the first page of a visit,
- every client-side navigation,
- a tab that comes back to the front (`visibilitychange`). A browser that restores its tabs on
  startup, or an installed app resumed from the background, loads no page, so this is the only
  moment such a visitor ever gives.

Until 2026-09-23 it asked **once per `sessionStorage` session**. That session lives as long as the
tab, and a restored tab or an installed app keeps it for days: a reload after a news post went live
asked nothing, only a new tab did. Reproduced in a browser before the fix (reload: no request, no
toast; new tab: toast) and pinned by `pnpm test:new-posts`.

Ten minutes at the edge rather than an hour, because nothing can purge Cloudflare and a news post
("from Saturday") is worth announcing mostly in the hours after it goes live. The file is static,
so a revalidation reaches no function.

The toast's strings come with that JSON rather than through `NextIntlClientProvider`. A
`useTranslations` in a component the layout mounts would put the namespace into
`LAYOUT_MESSAGE_NAMESPACES`, i.e. into every page's RSC payload, for a toast most page views never
show. The route reads them server-side with `getTranslations({ locale, namespace: 'blogToast' })`.
`moreOne`/`moreOther` go out raw (`t.raw`) and the browser fills in `{count}`.

The toast component imports framer-motion (~40 KB gzip) and is behind `next/dynamic`, so the chunk
loads only when the watcher has found something.

## What counts as new

A post's `date` is a day, not an instant, so the comparison cannot be a timestamp: a post dated
today and published this afternoon would be missed by this morning's visit. The record in
`localStorage['pf:blog-seen']` stores the posts instead:

```json
{ "newest": "2026-09-22", "keys": ["tagesplaner", "halloween-2026", "…"] }
```

`keys` are translation keys, so switching the language does not announce everything again.
A post is unseen when its key is not in `keys` **and** its `date` is not older than `newest`. The
date floor stops a post that only dropped out of the six (because newer ones arrived) from being
announced a second time.

- **No record** → first visit (or cleared storage, or storage that throws). Store the list, show
  nothing.
- **Record, nothing unseen** → store the list, show nothing.
- **Record, unseen posts** → store the list and show the toast. Stored before it is shown, so a
  reload does not repeat it.
- **On a `/blog` route** → store the list, show nothing: the posts are on screen already. A toast
  that is up when the visitor navigates into the blog disappears, and does not come back on the
  way out.

Accepted gap: a post back-dated to before the last visit is never announced. With news this is
the one to watch: a news post dated the day it was written and merged the next morning, after a
visitor already saw a post dated that morning, is never announced to them. Date a news post the day
it goes live.

Only publication order counts. `updatedAt` does not make a post new, and `featured` does not move
it to the front.

## Layout

- **Phones** (below `sm`): full width with a 12 px gutter, above the home indicator
  (`env(safe-area-inset-bottom)`), with a handle. Swipe down to dismiss. The location banner uses
  the same strip on the homepage; the toast measures `[data-location-banner]` and sits above it.
- **From `sm`**: 400 px card in the top-right corner, 15 px under the header, swipe right to
  dismiss. `z-40`, under the header's `z-50`, so a menu band opened from the bar covers the toast
  and not the other way round. When the language banner is up (`[data-language-banner]`, fixed
  under the header on `z-[60]`), the toast moves below it. With the planner panel open it moves
  left by `--planner-inset` (`planner-wide:`), the same inset the page is reflowed by. The stack
  sheets peek out below the card here, above it on a phone.
- Auto-dismiss after 12 s. The bar along the bottom edge is the countdown (a Web Animation), and it
  pauses on hover, on focus and while the tab is hidden.
- The whole card is the link to the post (a stretched `::after` on the post link). The close
  button and "see all" sit above it with `z-10`; a swipe that ends on the card does not open it.
- A footer row always links to `/blog`. With more than one new post it also says how many more,
  and up to two sheets peek out behind the card.
- `prefers-reduced-motion`: a fade instead of the spring, no pulsing dot, no image zoom.
- Escape closes it. The close button is 24 px drawn and 44 px to a finger (the same
  pseudo-element pattern as the location banner).

Analytics: `blog_toast_opened`, no properties, when the post link is followed.

## Testing it by hand

In the browser console on any page:

```js
localStorage.setItem('pf:blog-seen', JSON.stringify({ newest: '2000-01-01', keys: [] }));
localStorage.removeItem('pf:blog-seen-checked-at');
location.reload();
```

That announces all six posts. `localStorage.removeItem('pf:blog-seen')` simulates a first visit.
Removing `pf:blog-seen-checked-at` stands in for the ten minutes a real visitor waits between
checks; without it a second try inside that window asks nothing, which is correct.
