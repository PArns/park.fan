# The favicon

The icon Google draws next to a search result, and everything that shares it: the browser tab,
the bookmark bar, an iOS home screen, an Android launcher, a link unfurl.

It is **generated**, never hand-exported — `pnpm generate:icons`
([`scripts/generate-icons.mjs`](../../scripts/generate-icons.mjs)) cuts the whole set from the
brand files. `pnpm check:icons` fails if the committed files no longer match their source.

---

## What was wrong

Reported from a `google.de` result for „Phantasialand Wartezeiten": the icon beside the result
was an unreadable smudge. Four separate faults, each sufficient on its own.

### 1. Google was handed 32 px and told it was 48

`app/favicon.ico` contained two frames, 16×16 and 32×32. The `<link>` Next writes for the file
convention reports the **largest frame in the file** as its `sizes`, and it read `48x48` — so the
markup promised 48 and the bytes delivered 32, upscaled. Google's own guidance asks for something
larger than 48×48.

### 2. The wordmark was inside the icon

`icon-192.png`, `icon-512.png` and `apple-touch-icon.png` carried the full lockup: the pin **plus**
„park.fan" underneath. The wordmark took about a quarter of the artwork's height, so at the 16 CSS
px Google draws it is roughly 4 px of cap height. It could never be read, and it cost the pin a
quarter of the canvas on top.

### 3. The mark had no ground of its own

The pin is an **outline** with a hole for a head. Both colourways depend on what is behind them:
the light one is drawn in #293B47, and Google's dark result page is #202124. Composited there, the
pin body is invisible and only the blue detail inside survives — which is exactly what the
screenshot showed.

A transparent icon does not get to choose its background. A full-bleed tile does, and then the icon
looks the same on every surface that ever composites it.

### 4. The SVG favicon was never served

`app/[locale]/layout.tsx` declared `icons: { icon: '/favicon.ico', apple: … }`. Metadata fields do
not merge across segments — **the nearest segment that declares `icons` replaces the whole
object** — so the file-convention `app/icon.svg` was dropped from every page on the site. The live
`<head>` carried two `favicon.ico` links and no SVG. Nothing warns about this; the same trap is
documented for `alternates` in [blog feeds](blog-feeds.md).

The file it suppressed was stale anyway: a third artwork, out of step with both the header lockup
and the favicon.

---

## What ships now

Two sources, and the split is about pixels.

The **detailed pin** is the site's mark: the footer, the OG images, the Organization logo in
structured data and the maintenance page all show it, and it is the better drawing. Measured at
every size it will actually be composed at, it stops working below about 24 px — the orbit cuts
through the pin's white ring and the three bars merge into one green-blue smear, so at 16 and
20 px the silhouette is no longer a pin. That range is exactly where a search result and a browser
tab live.

So the two files drawn at 16–32 px carry the **simple castle pin** — the same mark `BrandLockup`
renders in the header — and everything drawn at 180 px or more carries the detailed one.

|                 |                                                                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Simple source   | `public/logo-small-dark.svg` — the pin the header renders                                                                                                  |
| Detailed source | `public/logo-big-dark.svg` — **not** `logo-dark.svg`, which is a 1563×1116 PNG in an SVG wrapper and weighs 77 KB; only `logo-big-dark.svg` is real vector |
| Ground          | `#293B47`, the manifest's `background_color` and the navy both pins' light colourways are drawn in                                                         |
| Inset           | 3 % per edge (18 % for the maskable icon)                                                                                                                  |
| Corner radius   | 18 % where the icon is composited as-is; square where the OS applies its own mask                                                                          |
| Wordmark        | none — `logo-big-dark.svg` carries one, and it is clipped off (see below)                                                                                  |

A white pin on navy reads at 16 px in both of Google's modes, which is the whole point: on the
light page the tile is the contrast, on the dark page the pin is.

**One risk the split does not remove.** Google reads `apple-touch-icon` as a favicon candidate too
and documents no priority between it and `rel="icon"`. If it ever picks the 180 px file and scales
it down itself, the search result is back to a smear. The fix then is to move `apple-touch-icon`
to the simple source — one line in the generator — not to redraw anything.

### The files

| File                                         | Source   | Who reads it                                                                                                                                                                                       |
| -------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/favicon.ico` (16 / 32 / 48 / 96)        | simple   | **Google** — it does not support SVG favicons, so this file decides what the search result shows. Also every browser's tab and bookmark bar                                                        |
| `public/icon.svg`                            | simple   | Browsers that prefer a vector favicon — drawn in the tab at 16 px                                                                                                                                  |
| `public/apple-touch-icon.png` (180)          | detailed | iOS home screen. Square: iOS masks the corners itself, and rounding an already-rounded corner leaves transparent slivers                                                                           |
| `public/icon-192.png`, `public/icon-512.png` | detailed | The web app manifest, `purpose: "any"`                                                                                                                                                             |
| `public/icon-maskable-512.png`               | detailed | The manifest's `purpose: "maskable"` — a separate file, not a second `purpose` on the 512, because an adaptive launcher may keep only the central 80 % circle and that would cut the pin's tip off |

### Where they are declared

One place: `app/layout.tsx`. `app/favicon.ico` is emitted by the file convention; only what the
convention cannot express (the SVG, the Apple touch icon) is declared in metadata, and **no other
segment may declare `icons`** — see fault 4.

Rendered `<head>`, every route, every locale:

```html
<link rel="icon" href="/favicon.ico?favicon.<hash>.ico" sizes="96x96" type="image/x-icon" />
<link rel="icon" href="/icon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

---

## Editing it

Change the source, then run the generator — not the other way round:

```bash
pnpm generate:icons   # rewrites all six files from the two sources
pnpm check:icons      # fails if a committed file no longer matches
```

Two numbers in the script are measured rather than typed, and should stay that way. The **ink
bounding box** is found by rendering the source and walking its alpha channel: the pin sits inside
a 144×144 viewBox at 62.5 % width and 86 % height, so scaling the viewBox instead would leave a
seventh of the icon empty on every edge, and a re-export at different margins would silently shrink
the favicon. The `.ico` frame list is what the `<link>`'s `sizes` reports, so adding a frame changes
what the markup claims.

Two things the generator deliberately strips from the source: `serif:*` attributes (Serif/Affinity
export cruft, and a hard XML parse error once the wrapper carrying `xmlns:serif` is replaced) and
the exporter's `fill:none` artboard rect, which paints nothing but is the full 144×144 box and would
make the measured ink bbox meaningless.

### One caveat on the PNGs

`app/favicon.ico` is served under a content-hashed query (`/favicon.ico?favicon.<hash>.ico`), so a
new one reaches a returning visitor immediately, and `/icon.svg` is a URL this site never served
before. The three PNGs are different: `/apple-touch-icon.png`, `/icon-192.png` and `/icon-512.png`
keep their URLs — Google asks for a stable favicon URL and reads `apple-touch-icon` as a candidate —
and `next.config.ts` serves root-level brand PNGs `max-age=31536000, immutable`. A browser that
already holds one keeps it. That only shows on a home-screen shortcut or an installed PWA, and the
path Google reads is not affected; if it ever needs forcing, the lever is the cache rule in
`next.config.ts`, not a renamed file.

## One more thing Google needs

**The URL must stay stable.** Google recrawls a favicon on its own schedule — days to weeks — so the
new icon will not appear in results immediately, and moving the file later costs that wait again.
There is one favicon per hostname; `park.fan` and any subdomain are separate.

## Related

- [SEO analysis](analysis.md)
- [Design system](../design/design-system.md)
- [Google: Define a favicon to show in search results](https://developers.google.com/search/docs/appearance/favicon-in-search)
