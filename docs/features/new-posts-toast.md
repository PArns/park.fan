# New-posts toast

A returning visitor who has not seen the newest blog posts gets one toast about them. A first
visit never does. Linear: PAR-444.

| Piece                                   | Job                                                                   |
| --------------------------------------- | --------------------------------------------------------------------- |
| `app/api/blog-latest/[locale]/route.ts` | Static JSON per locale: the six newest posts plus the toast's strings |
| `lib/blog/new-posts.ts`                 | Client-safe: the stored record, and which posts count as unseen       |
| `components/blog/new-posts-watcher.tsx` | Mounted in the locale layout; checks once per session                 |
| `components/blog/new-posts-toast.tsx`   | The toast itself, loaded only when there is something to show         |

## What it costs a page

Nothing in the payload. The layout renders `<NewPostsWatcher enabled={showBlog} />`, a few hundred
bytes of client code that does nothing until 2.5 s after mount. Then, once per browser session
(`sessionStorage['pf:blog-seen-checked']`), it fetches `/api/blog-latest/<locale>`. That file is
built from the blog manifest, so it only changes with a deployment, and it is served with
`max-age=600, s-maxage=3600`.

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
  that is up when the visitor navigates into the blog disappears.

Accepted gap: a post back-dated to before the last visit is never announced.

Only publication order counts. `updatedAt` does not make a post new, and `featured` does not move
it to the front.

## Layout

- **Phones** (below `sm`): full width with a 12 px gutter, above the home indicator
  (`env(safe-area-inset-bottom)`), with a handle. Swipe down to dismiss. The location banner uses
  the same strip on the homepage; the toast measures `[data-location-banner]` and sits above it.
- **From `sm`**: 400 px card in the bottom-left corner, swipe left to dismiss. Bottom right is the
  location banner, the right edge is the planner tab.
- Auto-dismiss after 12 s. The bar along the bottom edge is the countdown (a Web Animation), and it
  pauses on hover, on focus and while the tab is hidden.
- More than one new post: up to two sheets peek out behind the card, and a footer row links to
  `/blog`.
- `prefers-reduced-motion`: a fade instead of the spring, no pulsing dot, no image zoom.
- Escape closes it. The close button is 24 px drawn and 44 px to a finger (the same
  pseudo-element pattern as the location banner).

Analytics: `blog_toast_opened`, no properties, when the post link is followed.

## Testing it by hand

In the browser console on any page:

```js
localStorage.setItem('pf:blog-seen', JSON.stringify({ newest: '2000-01-01', keys: [] }));
sessionStorage.removeItem('pf:blog-seen-checked');
location.reload();
```

That announces all six posts. `localStorage.removeItem('pf:blog-seen')` simulates a first visit.
