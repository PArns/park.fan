# Corporate identity

What park.fan looks and sounds like, and where each part of it lives. Open this page before you
make anything that carries the brand outside the site's own components: a social post, a Reel, a
slide, a print, a partner asset, a new OG card. Each subject is owned by the page or file linked
here; this page only says which one, plus the few usage rules that have no other home.

## Name

`park.fan`, lower case, with the dot, in running text and in every language
([BRAND.md](../../BRAND.md)). Not "Parkfan", "Park.fan" or "park fan". The site is one person's
project; the author is named in `lib/seo/schema-identity.ts`.

## Logo

Every logo file is in `public/`, as SVG and PNG, in a light-ground version and a `-dark` version
for dark grounds. Each SVG's viewBox is its ink box, so a height in CSS is the height a reader sees.

| File                                    | What it is                                                | Where it is used                                                                                                      |
| --------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `logo-big.svg`, `logo-big-dark.svg`     | the stacked logo: big pin above the wordmark              | the official logo ([BRAND.md](../../BRAND.md)), the maintenance page, the publisher logo in structured data (the PNG) |
| `logo.svg`, `logo-dark.svg`             | the big pin alone: bar chart, ring and castle             | OG cards (`lib/og/brand-mark.tsx`), social images and Reels                                                           |
| `logo-small.svg`, `logo-small-dark.svg` | the simplified pin for small sizes                        | the header lockup (`BrandPin` in `components/layout/brand-lockup.tsx`)                                                |
| `parkfan.svg`, `parkfan-dark.svg`       | the wordmark: navy or white "park", green dot, blue "fan" | the header lockup, OG cards, social images                                                                            |
| `icon.svg` and the generated icons      | the square mark                                           | favicon, app icons: [favicon](../seo/favicon.md)                                                                      |

The horizontal lockup is pin and wordmark centred on each other, the wordmark at about 0.73 of
the pin's height. The header sets it at 26 and 19 px with an 8 px gap; its size and place in the
bar are owned by [header](header.md) and [the 48 px header rule](../rules/the-header-is-48-px.md).

### Using the logo

- **Use the files as they are.** No recolouring, no filter that turns the lockup white, no
  outline, no redrawing. The wordmark's three colours and the pin's green bars and blue ring are
  the logo.
- **Light files on light grounds, `-dark` files on dark grounds.** On the blue-to-green brand
  gradient the blue "fan" and the ring lose their contrast, so there the light lockup sits on a
  white plate: a pill, padded a quarter of the pin's height above and below and half of it left
  and right, where the ends round off.
- **Whole pixels.** Width, height and position of the pin and the wordmark land on whole pixels,
  and the wordmark's height is even, so it centres exactly against the pin and inside a plate. A
  layout that centres with `top: 50%` and `translateY(-50%)` puts a logo on half a pixel; give
  it a fixed position or snap it.
- **Clear space.** Nothing overlaps the lockup or its plate: no headline, no track, no Parky.

## Colours

The brand colours (blue `#2191D3`, green `#51CC64`, navy `#293B47`, off-white `#FCFCFC`), the
status and crowd colours and the theme are owned by [tokens](tokens.md#brand). Every value lives
in `app/globals.css`, as oklch, and only there. The brand gradient runs from the blue to the green:
Parky's body (`blue` and `green` in `components/assistant/parky/drawing.ts`) and the
`from-primary to-status-operating` buttons. The site is
[dark by default](tokens.md#theme-dark-by-default); browser chrome and the app manifest use
`#0a0a0a` (`app/manifest.ts`, `themeColor` in `app/layout.tsx`).

## Type

Geist, loaded with `next/font` in `app/[locale]/layout.tsx` as `--font-geist-sans`. Headlines on
social images use its 900 weight. Typography of each surface is owned by the
[design system](design-system.md) pages.

## Parky

Parky is the brand's face: on the site, in the chat and on every social channel.

- Who he is, what he loves and can't stand, how he talks:
  [parky-character](../features/parky-character.md). Every line, act and picture of him is
  measured against it.
- His drawing: `components/assistant/parky/` (`parky-logo.tsx`, the palette in `drawing.ts`,
  props, looks and dreams), his motion in `app/parky.css`, his acts in
  `lib/assistant/parky/acts.ts`, his seasonal and weather looks in `lib/assistant/parky/look.ts`.
- The chat around him: [assistant](../features/assistant.md). His own page: `/parky`
  (`app/[locale]/parky/`).
- **Parky is rendered, never redrawn.** A picture of him for a post or a video comes out of the
  `ParkyLogo` component, frozen at a moment of one of his acts. A new prop (a snack, a drink) is
  drawn in the language of `props.tsx`: the same ink outline, stroke weight and palette.

## Voice and positioning

- Audience, positioning, what park.fan is not, competitors: [BRAND.md](../../BRAND.md).
- Voice settings: [VOICE.md](../../VOICE.md). The rules every string follows, and their check:
  [writing](../writing/README.md) (`pnpm check:prose`).

## Claim and song

- **Claim:** "Mehr Loopings, weniger Stehen." It is the title of the park.fan song. Hashtag:
  `#MehrLoopingsWenigerStehen`.
- **Song:** "Mehr Loopings, weniger Stehen" by parnzival, made with Suno on a Pro plan, which
  allows commercial use. The remastered version is the one in use; its page is
  [suno.com/song/5a74e65f-460f-48c2-a7b0-864509043a3d](https://suno.com/song/5a74e65f-460f-48c2-a7b0-864509043a3d);
  a post embeds it with `BlogSunoEmbed`. The audio files are not in this repository. Under a Reel
  runs a stretch of the chorus, and a post with it carries Meta's AI label, since the vocals are
  generated.

## Social profiles

- Instagram [@part_82](https://www.instagram.com/part_82/) and Facebook
  [park.fan.coasters](https://www.facebook.com/park.fan.coasters). The one list is
  `ORGANIZATION_PROFILES` in `lib/seo/schema-identity.ts`; the footer's follow row and the
  Organization's `sameAs` read it.
- The networks' marks: `components/common/brand-icons.tsx`.
- A link from a post carries `utm_source=instagram` or `utm_source=facebook`, so the visit counts
  as social: [site analytics](../features/site-analytics.md).

## Where the brand shows outside a page

| Surface                      | Owned by                                                       |
| ---------------------------- | -------------------------------------------------------------- |
| Link previews (OG cards)     | [og-images](../features/og-images.md), `lib/og/brand-mark.tsx` |
| Favicon and app icons        | [favicon](../seo/favicon.md)                                   |
| Installed app                | [pwa-install](../features/pwa-install.md), `app/manifest.ts`   |
| Publisher in structured data | `PUBLISHER_ORGANIZATION` in `lib/seo/schema-identity.ts`       |
| Blog cover without a photo   | [blog-cover-fallback](../features/blog-cover-fallback.md)      |
| Maintenance page             | [maintenance-page](../features/maintenance-page.md)            |
