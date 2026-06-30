# User photo contributions

Lets visitors upload their own park & ride photos (drag & drop, multiple files),
assign each set to a **park or attraction**, and submit it into a **moderation
queue**. Protected by **Cloudflare Turnstile**. Page lives at `/[locale]/contribute`.

> Status: **prototype**. The flow works end-to-end in local dev with a filesystem
> storage driver. Before production, switch storage to R2/Blob and move uploads to a
> direct-to-storage pattern (see [Production hardening](#production-hardening)).

## Pieces

| Concern                                            | File                                          |
| -------------------------------------------------- | --------------------------------------------- |
| Page (hero + rights notice + form)                 | `app/[locale]/contribute/page.tsx`            |
| Reusable CTA banner (homepage / park / ride pages) | `components/contribute/contribute-banner.tsx` |
| Rights / "what we do with your photos" notice      | `components/contribute/rights-notice.tsx`     |
| Form orchestrator (client)                         | `components/contribute/contribute-form.tsx`   |
| Drag & drop multi-upload + previews                | `components/contribute/photo-dropzone.tsx`    |
| Ride/park picker (cmdk + `/api/search`)            | `components/contribute/entity-picker.tsx`     |
| Turnstile widget                                   | `components/contribute/turnstile-widget.tsx`  |
| API route (verify → validate → store → queue)      | `app/api/contribute/route.ts`                 |
| Turnstile server verify                            | `lib/contribute/turnstile.ts`                 |
| Storage adapter (local / Vercel Blob / R2 notes)   | `lib/contribute/storage.ts`                   |
| Moderation-queue store                             | `lib/contribute/submissions.ts`               |
| Limits, accepted formats                           | `lib/contribute/config.ts`                    |
| Zod schemas + record types                         | `lib/contribute/types.ts`                     |
| i18n                                               | `contribute` namespace in `messages/*.json`   |

## Flow

1. User drags photos in → client validates type/size/count, shows previews.
2. User picks the park/ride via the live-search combobox (reuses `/api/search`).
3. User adds an optional caption/credit and **must tick the consent checkbox**
   (upload is gated on it) → solves the Turnstile challenge.
4. `POST /api/contribute` (multipart): verify Turnstile → validate metadata (zod) →
   validate each file → store bytes via the adapter → append a `pending` record.
5. Nothing is shown publicly until a human flips the record to `approved`.

## Where to store the photos (cheaply)

- **Cloudflare R2 — recommended.** S3-compatible, ~$0.015/GB-month and **zero egress
  fees**, so serving high-res photos is effectively free bandwidth. park.fan already
  sits behind Cloudflare (Turnstile + the API tunnel), so R2 + Cloudflare CDN is the
  cheapest way to serve a popular gallery.
- **Vercel Blob** — zero-config on Vercel, simplest setup, but bandwidth is billed so
  it gets pricier than R2 at scale. Activate with `STORAGE_DRIVER=vercel-blob`.
- **Local FS** (`STORAGE_DRIVER=local`, default) — dev only; Vercel's runtime FS is
  ephemeral/read-only.

### Metadata

Each submission is a small record (`SubmissionRecord` in `lib/contribute/types.ts`):
id, timestamp, `status`, the assigned entity, caption, credit, and the stored image
refs (key/url/size/type). The prototype appends these as JSONL to `.data/` as a
**moderation queue**. In production, write them to a real datastore you can query and
update — an endpoint on `api.park.fan`, Vercel Postgres/Neon, or Turso/SQLite.

## Production hardening

- **Direct-to-storage uploads.** Vercel functions cap request bodies at ~4.5 MB; a
  24 MP JPEG exceeds that. Hand the browser a short-lived upload target and PUT the
  bytes straight to storage:
  - Vercel Blob: `@vercel/blob/client` `upload()` + a server `handleUpload()`.
  - R2/S3: a presigned PUT URL (`@aws-sdk/s3-request-presigner`).
    The server then only verifies Turnstile, issues the token, and records metadata.
- **Set `TURNSTILE_SECRET_KEY`** in production — the verifier hard-fails without it.
- **Moderate before publish** (already the default — records start `pending`).
- Consider server-side re-encode/strip EXIF (GPS!) with `sharp` on approval.

## Legal note (rights)

We ask for a **licence**, not a copyright assignment. Under German/EU law the
copyright (Urheberrecht) itself **cannot be transferred** — only usage rights
(Nutzungsrechte) can be granted. So the consent text has the user keep their
copyright and grant park.fan a broad, non-exclusive licence, and requires them to
confirm they actually own/took the photo. See `contribute.rights` / `contribute.form.consentLabel`.

## Env

See `.env.example`: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`,
`STORAGE_DRIVER`, `BLOB_READ_WRITE_TOKEN`.
