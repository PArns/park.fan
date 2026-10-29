# The chrome is in the first HTML, in reading order (REQUIREMENT)

**`Header` and `Footer` render outside any `<Suspense>`** in `app/[locale]/layout.tsx`, so the served
HTML reads skip link, `<header>` with the main `<nav>`, `<main>`, `<footer>`, in that order, and none
of them inside a `<div hidden>`. The same goes for anything else that states the site's structure:
breadcrumbs, a page's chapter list, the footer's link groups.

- A component that names the site's parts stays out of `<Suspense>`. If it has to wait for data,
  make the data synchronous or cached (the geo menu is a cached discovery read, the blog menu reads
  the generated manifest); never wrap the component.
- What may stay in a boundary is what renders nothing a crawler needs: `NavigationProgress` (it
  reads `useSearchParams`, which needs one on a static route), `LanguageBanner` and the rest of the
  first boundary in the locale layout.
- The trade: an error in a component without a boundary fails the page instead of falling back to
  client rendering. The header and footer are static markup with no fetch of their own.

## Why

With no PPR (Cache Components is off in `next.config.ts`) a boundary defers nothing on a
prerendered route: the render waits for it anyway, and React then sorts its content to the end of
the byte stream and grafts it in with a `$RC()` script. Production, 2026-10-27,
`/de/blog/europa-park-oder-phantasialand`, 1,364,773 bytes: an empty `<div class="h-12">` stood
where the header goes at byte 13,622, `<main>` at 13,655, and the site `<header>` with its 99 links
at 505,991 inside `<div hidden id="S:0">`, after `</main>`; the footer likewise.

Google runs the script and indexes the rearranged DOM. GPTBot, ClaudeBot, PerplexityBot and Common
Crawl run no JavaScript, and Bing reads the served document before it renders. For them the site's
navigation was hidden content behind the article, on a site that publishes `llms.txt` and an MCP
endpoint for exactly those readers. Without the boundaries the header follows the skip link
directly, and the bar needs no height reservation any more.

## Check

`pnpm check:semantic-html` (`scripts/check-semantic-html.mjs`) reads every page type's HTML as
served and fails when the site `<header>` stands after `<main>`, the `<footer>` before `</main>`, or
either inside a `<div hidden id="S:…">`. By hand:

```bash
curl -s localhost:3000/de/blog/europa-park-oder-phantasialand -o /tmp/p.html
grep -bo '<header\|<main\|</main>\|<footer\|hidden id="S:' /tmp/p.html | head
```

Related: [the markup says what each part is](the-markup-says-what-each-part-is.md),
[semantic HTML](../seo/semantic-html.md).
