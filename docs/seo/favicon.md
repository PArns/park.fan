# The favicon

The icon Google draws next to a search result and everything that shares it (browser tab, bookmark
bar, iOS home screen, Android launcher, link unfurl): which file comes from which source, where it
is declared, and how to regenerate it. Open it before touching the brand SVGs, the icon files or
`icons` metadata. Why two sources, why no wordmark and why a full-bleed tile is the standing rule:
[the favicon is generated from two sources](../rules/the-favicon-is-generated-from-two-sources-and-it-carries-no.md).

How the manifest is used to install the site as an app: [PWA install](../features/pwa-install.md).

The whole set is generated, never hand-exported: `pnpm generate:icons`
([`scripts/generate-icons.mjs`](../../scripts/generate-icons.mjs)) writes all six files, and
`pnpm check:icons` fails when a committed file no longer matches its source.

## Sources

|                 |                                                                                                                                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Simple source   | `public/logo-small-dark.svg`, the pin the header renders                                                                                                                                                                      |
| Detailed source | `public/logo-big-dark.svg`, the lockup, whose wordmark the generator clips off. Not `logo-dark.svg`: that pin is itself generated from the lockup by `scripts/generate-brand-pin.mjs`, and two generators would have to agree |
| Ground          | `#293B47` (`TILE`), the manifest's `background_color`                                                                                                                                                                         |
| Inset           | 3 % per edge (`INSET`); 18 % for the maskable icon (`MASKABLE_INSET`)                                                                                                                                                         |
| Corner radius   | 18 % (`RADIUS`) where the icon is composited as-is; square where the OS applies its own mask                                                                                                                                  |

Below about 24 px the detailed pin's orbit cuts through its white ring and the three bars merge
into one smear, so at 16 and 20 px it no longer reads as a pin; where the split falls is the rule.

## The files

| File                                         | Source   | Who reads it                                                                                                                                         |
| -------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/favicon.ico` (16 / 32 / 48 / 96)        | simple   | **Google** (it does not use SVG favicons, so this file decides the search result), every browser's tab and bookmark bar                              |
| `public/icon.svg`                            | simple   | browsers that prefer a vector favicon, drawn at 16 px                                                                                                |
| `public/apple-touch-icon.png` (180)          | simple   | iOS home screen, and a favicon candidate Google may scale to 16 px. Square: iOS masks the corners itself                                             |
| `public/icon-192.png`, `public/icon-512.png` | detailed | the web app manifest (`app/manifest.ts`), `purpose: "any"`                                                                                           |
| `public/icon-maskable-512.png`               | detailed | the manifest's `purpose: "maskable"`, a file of its own because an adaptive launcher may keep only the central 80 % circle and cut the pin's tip off |

**Declared in one place: `app/layout.tsx`.** `app/favicon.ico` comes from the file convention; only
what the convention cannot express (`/icon.svg`, `/apple-touch-icon.png`) is in `metadata.icons`.
No other segment may declare `icons`: the nearest declaring segment replaces the whole object, and
`icon: '/favicon.ico'` in `app/[locale]/layout.tsx` once dropped the SVG favicon from every page.
The rendered `<head>`, every route and locale:

```html
<link rel="icon" href="/favicon.ico?favicon.<hash>.ico" sizes="96x96" type="image/x-icon" />
<link rel="icon" href="/icon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

The `.ico`'s frame list is what the `<link>` reports as `sizes` (Next writes the largest frame), so
adding or removing a frame changes what the markup claims.

## Editing it

Change the source, then run the generator, never the other way round:

```bash
pnpm generate:icons   # rewrites all six files from the two sources
pnpm check:icons      # fails if a committed file no longer matches
```

- **The ink box is measured, not typed.** The generator renders each source and walks its alpha
  channel, so the icon does not depend on the margins an export carries. A sub-pixel shift in that
  measurement (a re-cropped source) turns `check:icons` red on all three simple-pin files; that is
  the check working, and regenerating is the fix.
- **The wordmark is found the same way**: the widest fully empty row band, taken as a separator
  only when it spans at least 4 % of the ink height, splits pin from wordmark, and the mark is
  clipped to what is above it.
- **Stripped from the source:** `serif:*` attributes (Serif/Affinity export residue, a hard XML
  parse error once the wrapper carrying `xmlns:serif` is replaced) and the exporter's `fill:none`
  artboard rect, which would make the measured ink box the whole canvas.

## Caching and stable URLs

`app/favicon.ico` is served under a content-hashed query, so a new one reaches returning visitors
at once. `/icon.svg` and the three PNGs keep their URLs and are served
`max-age=31536000, immutable` (the `/:file*.svg` and `/:file.png` rules in `next.config.ts`), so a
browser that holds one keeps it. That shows only on a home-screen shortcut or an installed PWA; if
it ever needs forcing, change the cache rule, not the file name. Google asks for a stable favicon
URL and recrawls it on its own schedule (days to weeks), and every move costs that wait again.
There is one favicon per hostname.

Google's guidance: [Define a favicon to show in search results](https://developers.google.com/search/docs/appearance/favicon-in-search).
