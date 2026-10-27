# Background images

How background photos are sized and delivered, and how code looks a park's or ride's photo up.
Every image lives in the media database
(`public/media/<collection>/` plus a `<name>.json` sidecar): [media database](../features/media-database.md)
covers sidecars, roles, focal points, crops, caching and the HTTP API, and
[`public/media/README.md`](../../public/media/README.md) is the authoring contract.

## Source size: 2048 px on the long edge

Most photos are still 1024 px, and on a wide screen the source, not the encoder, limits sharpness:
`sizes="115vw"` on a 3440 px ultrawide asks for a ~3956 px paint, a ~3.9× stretch of a 1024 px
image. On the Disneyland photo at that width, 1024 px at q75 cost 80 KB and looked soft; **2048 px
at q50 cost 95 KB and was much sharper**. A 2048 px source also keeps the structured-data crops at
1200 px or wider. Beyond 2048 px buys nothing: nothing is delivered above it, and each cold
optimizer transform decodes a bigger JPEG. `/admin/media` flags every source below the target (the
"Low resolution" filter, `LOW_RES_LONG_EDGE` in `app/api/admin/media/route.ts`).

## Delivery: `backgroundImageLoader`

Every full-bleed background (homepage hero, glossary, park and ride pages, the
[announcement band](../features/homepage-announcement.md))
renders through `backgroundImageLoader` (`lib/utils/image-loader.ts`) instead of Next's default
loader:

- **Quality follows the paint width.** The optimizer never enlarges, so the requested width is
  really "how far will this be stretched", and artifacts magnify by the same factor: `≤1080` →
  q50 (a phone, painted ~1:1), `≤1920` → q60 (a 1440–1600 px desktop, ~40 % fewer bytes than q75
  with no visible difference), wider → q75 (ultrawide and 2× screens, where q50 smears). Every
  quality used must be listed in `next.config.ts` `images.qualities`.
- **The width is clamped to 1920 px** (`MAX_USEFUL_WIDTH`). w=2560 and w=3840 return the same
  pixels as 1920 from the largest source in the tree, so they were three cache entries for one
  rendition. It is deliberately not 1080: that would cap every background at today's 1024 px
  sources and block the 2048 px upgrade.

`BACKGROUND_BLUR_DATA_URL` (`lib/utils/image-placeholder.ts`) is the shared `placeholder="blur"`
for the same set.

## Looking a photo up

`lib/utils/park-assets.ts` resolves through the media manifest and never touches the file system:
`getParkBackgroundImage(parkSlug)`, `getAttractionBackgroundImage(parkSlug, attractionSlug)`,
`getParkImageSet` / `getAttractionImageSet` (the 16:9 / 4:3 / 1:1 crops for structured data),
`getCardImageMap()` and `getCardObjectPosition()`. Every path carries `?v=<content hash>`. A ride's
photo is found by its sidecar, never by file name. Where a photo is painted, its focal point drives
`object-position` and the crop offsets ([media database](../features/media-database.md)).
