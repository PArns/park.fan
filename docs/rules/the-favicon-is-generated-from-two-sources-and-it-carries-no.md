# The favicon is generated from two sources, and it carries no wordmark (REQUIREMENT)

- **Every icon is a full-bleed tile with the pin and no wordmark.** A transparent icon does not
  choose its background; a tile does, so the icon looks the same in a tab, a bookmark bar, a home
  screen and both of Google's result modes.
- **The split between the two sources is the smallest size any surface may draw a file at.** The
  detailed pin stops reading below ~24 px, so everything Google may use as a favicon takes the
  simple pin (`public/logo-small-dark.svg`): `app/favicon.ico`, `public/icon.svg` **and**
  `public/apple-touch-icon.png`, because Google reads `apple-touch-icon` as a favicon candidate and is
  free to scale it to 16 px. The app icons (the manifest's 192, 512 and maskable 512) take the
  detailed pin and move together.
- **The detailed source is the lockup**, `public/logo-big-dark.svg`, whose wordmark the generator
  clips off, not `logo-dark.svg`: that pin is itself generated from the lockup
  (`scripts/generate-brand-pin.mjs`), and the icon set would then depend on two generators agreeing.
- **The set is generated, never hand-exported**: `pnpm generate:icons` writes all six files, and
  the ink box and the wordmark's position are measured by rendering and walking the alpha channel,
  never typed.
- **Only `app/layout.tsx` may declare `icons`.** Metadata does not merge across segments: the nearest
  declaring segment replaces the whole object, and `icon: '/favicon.ico'` in `app/[locale]/layout.tsx`
  once dropped the SVG favicon from every page (the same trap as the
  [feed's `alternates`](a-feed-nobody-links-to-is-a-file-with-a-url.md)).
- **The `.ico`'s frame list is what the markup promises**: Next reports the largest frame as
  `sizes`, so with 16 and 32 only it claimed `48x48` and handed Google 32 to upscale. The frames are
  16/32/48/96.
- **Keep the URLs stable.** Google recrawls a favicon on its own schedule, days to weeks.

## Why

Google composes the icon beside a result at 16 CSS px. The set that shipped before put the whole
lockup in it: „park.fan" took a quarter of the artwork's height (~4 px of cap height). Both pins are
an outline with a hole for a head, so on a transparent ground they have no figure of their own: the
light colourway is #293B47 and Google's dark result page is #202124, which is why the reported
screenshot showed a smudge. Three different artworks sat in the set and nothing compared them.

## Check

`pnpm check:icons` fails when a committed file no longer matches its source. Background:
[the favicon](../seo/favicon.md) lists the files, who reads each, and how to edit the sources.
