# Assets, Images & Content

## Park and attraction images

**All images now live in the media database** — one filesystem-backed store at
`public/media/<collection>/`, with a `<name>.json` sidecar per image. See
[media database](../features/media-database.md) for the whole picture and
[`public/media/README.md`](../../public/media/README.md) for the authoring contract.

What used to be documented here — the `public/images/parks/[parkSlug]/` layout, the
generated `lib/attraction-images.ts` and `lib/hero-images*.ts`, and the
`generate:hero-images` / `generate:attraction-images` scripts — is gone. A ride's
photo is no longer found by filename; the sidecar names the ride, which is what
fixed `toverland/maximus-blitzbahn.jpeg` never resolving for the slug
`maximus-blitz-bahn`.

### Source size: aim for 2048px on the long edge

Most photos are still **1024px**, and on wide screens that source — not the encoder —
is the binding limit on sharpness. `sizes="115vw"` on a 3440px ultrawide asks for a
~3956px paint width, i.e. a ~3.9× stretch of a 1024px image. Measured on the
Disneyland photo at that paint width: 1024px @ q75 costs 80 KB and still looks soft,
while **2048px @ q50 costs 95 KB and is dramatically sharper**. So when replacing or
adding a background, prefer a 2048px source — it also keeps the structured-data crops
≥1200px wide.

Going beyond 2048px buys nothing: nothing is delivered above it, and it only makes
each cold optimizer transform decode a bigger JPEG.

The admin browser flags every source below this target (`/admin/media`, the
"Low resolution" filter), so the upgrade backlog is visible rather than folkloric.

### Delivery (`lib/utils/image-loader.ts`)

Every full-bleed background — homepage hero, glossary, park/attraction pages, the
announce section — renders through the shared **`backgroundImageLoader`** rather than
the default optimizer URL builder. It does two things:

- **Bands the quality by how wide the rendition will be painted.** The optimizer
  resizes with `withoutEnlargement`, so the delivered rendition is capped by the
  source and the _requested_ width is really "how far will this get stretched" — and
  compression artifacts are magnified by that same factor. Hence `≤1080 → q50`
  (mobile, painted ~1:1), `≤1920 → q60` (a 1440–1600px desktop, ~1.9× stretch, ~−40%
  bytes against q75 with no visible difference), `>1920 → q75` (ultrawide and 2×
  retina, 2.5×+ stretch — q50 visibly smears fine detail there).
- **Clamps the requested width to 1920px.** w=2560 and w=3840 can only return the
  same pixels as w=1920 even from the largest source in the tree, so they were three
  cache entries for one rendition. The clamp changes no pixel and no byte at a given
  quality; it just stops that split, which matters for a hero photo that re-picks on
  every shell regeneration. It is deliberately **not** lowered to 1080 to match
  today's 1024px photos — that would cap every background at 1024px forever and block
  the bigger-source fix above.

`BACKGROUND_BLUR_DATA_URL` (`lib/utils/image-placeholder.ts`) is the shared
`placeholder="blur"` gradient for the same set.

### Framing: one focal point, every surface

`object-fit: cover` has to throw pixels away whenever a photo is painted at an aspect
ratio that is not its own — which is nearly always. An image's `focus` point in the
media database drives the CSS `object-position` on cards (`CardPhoto`), park and
attraction backgrounds (`ParkBackground`) and the hero, **and** the offset the
build-time 16:9 / 4:3 / 1:1 crops are cut at. Set it once in `/admin/media` and every
rendition follows.

Defaults where no focal point is set are unchanged: cards and the scrolling park
strip anchor to the top, the fixed backdrop and blog covers centre.

### Runtime lookup

**`lib/utils/park-assets.ts`** keeps its exported signatures but no longer touches the
filesystem — it resolves through the manifest:

- **`getParkBackgroundImage(parkSlug)`** / **`getAttractionBackgroundImage(park, ride)`**
- **`getParkImageSet` / `getAttractionImageSet`** — the aspect-ratio sets for
  structured data, read from the crops the manifest recorded at build time.

Every path it returns carries `?v=<content hash>`; see the caching section of the
[media database](../features/media-database.md#4-caching) doc for why.

### Hero images

`@/lib/media/hero` — **the client-safe module**. It reads a generated ~21 KB slice
rather than the full catalog, because the rotation and its caption run in Client
Components. Importing `@/lib/media` from one of those ships ~107 KB to every visitor.

---

## Content and markdown

### Homepage announcements

Locale-specific markdown files in **`content/home/`**:

- `announce.en.md`, `announce.de.md`, `announce.nl.md`, `announce.fr.md`, `announce.es.md`

Each file can have YAML frontmatter and body. **`components/home/announce-section.tsx`** loads:

```ts
getMarkdownContent(`home/announce.${locale}.md`);
```

and renders the body with `react-markdown`. Used on the homepage to show a single announcement block.

### Markdown helper

**`lib/markdown.ts`**:

- **`getMarkdownContent<T>(relativePath)`** – Reads file from `content/` directory, parses with `gray-matter`, returns `{ frontmatter, content }` or `null` if missing/error.
- Path is relative to `content/` (e.g. `home/announce.en.md`). Do **not** include the `content/` prefix.

---

## Related

- [Media database](../features/media-database.md) – sidecars, roles, tags, focal points, search, the HTTP API
- [Scripts](scripts.md) – `generate:media`, `generate:image-crops`
- [Backend Integration](../api/backend-integration.md) – App API Routes (OG, park backgrounds)
