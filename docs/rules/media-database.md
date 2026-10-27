# Media database (REQUIREMENT)

Every image (park, ride, blog, diagram) lives in **one** filesystem-backed database at
`public/media/<collection>/`, with a `<name>.json` sidecar per image. **A collection is storage, the
sidecar is the index**: nothing queries by folder, so a Halloween photo of Troy in
`toverland-halloween` still answers `getRideImages('toverland', 'troy')`. Never infer park, ride or
role from a filename or folder.

- **Import the slice you need.** `@/lib/media` is structure and search, and the 107 KB catalog;
  `@/lib/media/text` is the localized `alt` and `caption` (37 KB, only where text is rendered).
  **`@/lib/media/hero`, `@/lib/media/credit` and `@/lib/media/attribution` are the only client-safe
  imports**; `@/lib/media` in a Client Component ships the catalog.
- **`focus` is one point per image** and drives both the CSS `object-position` on every card and
  background and the offset the build-time 16:9 / 4:3 / 1:1 crops are cut at. Image URLs carry
  `?v=<content hash>`, because moving a focal point rewrites a crop's bytes at an unchanged URL
  (`images.localPatterns` in `next.config.ts` permits the query).
- **A photo that is not ours records who took it, under what licence and where from**:
  `credit.author`, `credit.license`, `credit.source`, `credit.sourceUrl` in the sidecar, never a line
  of prose elsewhere. It is never a Creative Commons photo
  ([no Creative Commons photos](no-creative-commons-photos.md)). `getCreditLine()`
  (`lib/media/credit.ts`) is the one formatter (`© <author> (<licence>)`); a licence the enum does not
  know becomes `unknown` with a warning (`normalizeSidecar()`), which files the image under rights
  unestablished.
- **The credit sits on the picture**, not in a source list. `needsAttribution()` is true for any
  author outside `OWN_PHOTO_AUTHORS`; `<PhotoCredit>` (`components/media/photo-credit.tsx`) puts the
  line in the image's corner and needs a `relative` ancestor (`BlogPostBanner` is the example). Given
  a `src` it finds the credit itself: `pnpm generate:media` writes `lib/media/manifest-attribution.ts`
  (every path a credited photo is served under) and `getPhotoAttribution(src)` reads it, so a Client
  Component holding only a path still credits the photo. A new photo surface adds
  `<PhotoCredit src={…} />` beside its `<Image>`; inside a link it is plain text. A thumbnail beside
  a text row, a blurred or faded backdrop and the OG card carry none, and own shoots stay quiet.

## Why

A folder is where a file was put, not what it shows: a Halloween photo of Troy is a Troy photo, and a
lookup by folder misses it. Importing `@/lib/media` into a Client Component ships the whole catalog.
A credit somewhere other than on the picture is a credit nobody sees next to the work it names.

## Check

`pnpm generate:media` (in `prebuild`) validates the sidecars and fails on a `cc-by*` licence.
Authoring contract: [public/media/README.md](../../public/media/README.md); the mechanism:
[media database](../features/media-database.md).
