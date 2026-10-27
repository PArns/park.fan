# The chrome is in the first HTML, in reading order (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

**`Header` and `Footer` render outside any `<Suspense>`** in `app/[locale]/layout.tsx`, so the
served HTML reads skip link, `<header>` with the main `<nav>`, `<main>`, `<footer>`, in that
order, with none of them inside a `<div hidden>`. The same goes for anything else that states the
site's structure: breadcrumbs, a page's chapter list, the footer's link groups.

## What it cost

Both used to sit in a boundary each, `fallback={<div className="h-12" />}` and `fallback={null}`,
with a comment saying the layout's client components were dynamic under Cache Components. Cache
Components is off (`next.config.ts`), and with no PPR a boundary defers nothing on a prerendered
route: the render waits for it anyway, and React then sorts its content to the end of the byte
stream and grafts it in with a `$RC()` script ([a streamed section owes the page its
height](a-streamed-section-owes-the-page-its-height.md) found the same on the glossary).

Production, 2026-10-27, `/de/blog/europa-park-oder-phantasialand`, 1,364,773 bytes as served:

| What                                    | Byte offset | Where                       |
| --------------------------------------- | ----------: | --------------------------- |
| what stood where the header goes        |      13,622 | `<div class="h-12"></div>`  |
| `<main>`                                |      13,655 | in the shell                |
| `</main>`                               |     504,245 |                             |
| site `<header>`, main `<nav>`, 99 links |     505,991 | in `<div hidden id="S:0">`  |
| site `<footer>`, 45 links               |     736,771 | in `<div hidden id="S:14">` |

Google runs the script and indexes the rearranged DOM. A crawler that reads the HTML as served does
not: GPTBot, ClaudeBot, PerplexityBot and Common Crawl run no JavaScript, and Bing reads the served
document before it renders. For them the site's navigation was hidden content behind the article,
on a site that publishes `llms.txt` and an MCP endpoint for exactly those readers
([agent readiness](../seo/agent-readiness.md)).

Without the boundaries the same page, against `next dev`, reads the skip link at byte 13,721, the
`<header>` at 13,744, `<main>` at 122,942 and the site `<footer>` directly after `</main>`. The bar
needs no reservation any more, which took one of the places the header's 48 px was written down
([the header is 48 px](the-header-is-48-px-and-its-height-is-written-down-in-four.md)).

## How to apply it

- A layout or page component that names the site's parts stays out of `<Suspense>`. If it ever
  has to wait for data, make the data synchronous or cached (the geo menu is a cached discovery
  read, the blog menu reads the generated manifest), never wrap the component.
- What may stay in a boundary is what renders nothing a crawler needs: `NavigationProgress`
  (it reads `useSearchParams`, which needs one on a static route), `WebVitalsReporter`,
  `LanguageBanner` and the rest of the first boundary in the locale layout.
- An error in a component without a boundary fails the page instead of falling back to client
  rendering. That is the trade: the header and footer are static markup with no fetch of their own.

## Check

`pnpm check:semantic-html` (`scripts/check-semantic-html.mjs`) reads every page type's HTML as
served and fails when the site `<header>` stands after `<main>`, the site `<footer>` before
`</main>`, or either inside a `<div hidden id="S:…">`. By hand:

```bash
curl -s localhost:3000/de/blog/europa-park-oder-phantasialand -o /tmp/p.html
grep -bo '<header\|<main\|</main>\|<footer\|hidden id="S:' /tmp/p.html | head
```

The page around it: [semantic HTML](../seo/semantic-html.md).
