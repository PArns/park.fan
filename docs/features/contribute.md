# Photo contributions (`/contribute`)

Visitors upload their own park and ride photos at `/[locale]/contribute`, assign them to a park or
ride and submit them into a moderation queue at `/admin/contributions`; approved photos are moved
into the media database by hand. Open this page before changing the upload flow, its storage or the
moderation screen.

Photos are proxied through our own server into a **private** Vercel Blob store, so the store's write
token never reaches the browser. Each photo goes in its own request and large originals are
downscaled client-side first, to stay under Vercel's ~4.5 MB request-body limit. Nothing is public
until a moderator moves it into the [media database](media-database.md).

## Pieces

| Concern                                         | File                                                                  |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| Public page (hero, gallery, rights, form)       | `app/[locale]/contribute/page.tsx`                                    |
| Form orchestrator (start → upload → finalize)   | `components/contribute/contribute-form.tsx`                           |
| Drag and drop multi-upload with previews        | `components/contribute/photo-dropzone.tsx`                            |
| Ride/park picker (cmdk over `/api/search`)      | `components/contribute/entity-picker.tsx`                             |
| Rights notice                                   | `components/contribute/rights-notice.tsx`                             |
| Example gallery                                 | `components/contribute/example-gallery.tsx`                           |
| CTA banner on park and ride pages               | `components/contribute/contribute-banner.tsx`                         |
| Client-side downscale                           | `components/contribute/compress.ts`                                   |
| Limits shared by client and server              | `lib/contribute/config.ts` (`MAX_FILES` 10, 4 MB per file)            |
| Begin (Turnstile + signed ticket)               | `app/api/contribute/start/route.ts`                                   |
| Proxy one photo into the private store          | `app/api/contribute/file/route.ts`                                    |
| Finalize (write the moderation record)          | `app/api/contribute/finalize/route.ts`                                |
| Turnstile widget and server check (shared)      | `components/common/turnstile-widget.tsx`, `lib/security/turnstile.ts` |
| HMAC ticket                                     | `lib/contribute/ticket.ts`                                            |
| Storage driver, image store, submissions repo   | `lib/contribute/driver.ts`, `storage.ts`, `submissions.ts`            |
| Prefill (park/ride page → form)                 | `lib/contribute/prefill.ts`                                           |
| Moderation page                                 | `app/admin/contributions/page.tsx`                                    |
| Hand-over into the media database               | `app/admin/contributions/_components/adopt-into-media.tsx`            |
| "New submissions" toast after login             | `app/admin/_app/new-contributions-notice.tsx`                         |
| Admin APIs (list, patch, delete, file, summary) | `app/api/admin/contributions/**`                                      |
| Orphan cleanup (blobs without a record)         | `DELETE /api/admin/contributions/orphans`                             |
| Strings                                         | `contribute` namespace in `messages/*.json`                           |

## Upload flow

1. The visitor adds photos, picks the park or ride, adds an optional caption and credit, ticks
   consent (the upload is gated on it) and solves Turnstile.
2. `POST /api/contribute/start` verifies Turnstile once, validates assignment and consent, and returns
   a short-lived HMAC-signed ticket carrying the submission id, the assignment and the file budget.
3. Per photo, the browser downscales if needed and POSTs it (one file per request, at most
   `MAX_FILE_SIZE`) to `POST /api/contribute/file`, which checks the ticket and `put()`s the bytes into
   the private store.
4. `POST /api/contribute/finalize` checks the ticket and writes one `pending` record referencing the
   stored blobs (`SubmissionRecord`, `lib/contribute/types.ts`: status, entity, caption, credit,
   image refs, `userAgent`).
5. A moderator approves, rejects, edits or deletes it in `/admin/contributions` and moves the photos
   worth keeping into the media database.

Turnstile is the same widget and secret the admin login uses; the action and hostname checks and
what an unset secret does are in [admin → bot protection](admin.md#bot-protection-on-the-login).

## Into the media database

Approving publishes nothing: the bytes stay in the private store. A photo reaches a ride page by
being committed into the open media pull request
([writing to the media database](media-database-writes.md)).

On the moderation card every photo not moved yet has a tick box, all ticked by default. **N Fotos in
die Mediengalerie** downloads the ticked ones through the admin file route and opens the media
browser's upload dialog (`MediaUpload`) with a `seed`: park and ride from the entity's page path and
slug (they win over the GPS suggestion), the caption in the German caption field, the credit on every
sidecar of the batch. The walkthrough then runs as for any upload, because focal point, roles and alt
text need somebody to look at each picture. Unsaved caption and credit edits on the card are what
gets written, and they are saved with the adoption.

Four rules in the hand-over:

- **The credit is the visitor's or nobody's.** `credit.author` is set only when the visitor gave a
  name, with `license: all-rights-reserved` (they keep the copyright, we hold the licence granted)
  and `source: contribution`. Without a name there is no author, `getCreditLine()` returns null and no
  credit is drawn. It is never filled with one of `OWN_PHOTO_AUTHORS`.
- **No visitor EXIF reaches `public/media/`.** `withoutMetadata()` (`app/admin/_lib/upload-transport.ts`)
  re-encodes every file, with `imageOrientation: 'from-image'` so a portrait stays upright once its
  rotation tag is gone. A phone JPEG under the size cap used to be committed byte for byte with its
  GPS fix, capture time and camera serial. The GPS fix stays out of the sidecar as well; the capture
  date stays in. The analysis still reads the original, so the ride shortlist works.
- **The file name is fixed:** `<entity slug>-<first six of the submission id>`, then `-2`, `-3` by
  the photo's place in the submission, so a retry after a failed commit overwrites instead of adding
  a copy.
- **The submission records where each photo went.** `StoredImageRecord.adopted` holds the media id,
  the pull request and the time; the card shows **In Galerie** with a link to the PR, and adopting
  approves the submission. The photo is live once that PR is merged and deployed.

## New submissions are announced after login

`NewContributionsNotice`, mounted in the admin shell, asks `GET /api/admin/contributions/summary`
(pending submissions only, newest first, no image references) once the session stands and again on
tab focus after five minutes. Pending submissions newer than the last one this browser was told about
become one toast with **Ansehen**. "Told about" is a localStorage high-water mark per browser, so a
second moderator gets their own notice; opening `/admin/contributions` counts as being told. Accounts
below `author` do not ask, since the route would answer 403.

## Storage

`lib/contribute/driver.ts` picks the backend:

- **vercel-blob** (default when `BLOB_READ_WRITE_TOKEN` is set, i.e. any deploy with a linked Blob
  store): photos under `contributions/<id>/…`, each submission's record as JSON at
  `submissions/<id>.json` in the same store.
- **local** (`STORAGE_DRIVER=local`, offline dev): images under `.uploads/`, records under `.data/`.
  Vercel's runtime filesystem is ephemeral, so this is dev only.

Storage on Vercel Blob is cheap; serving traffic is the cost. The repository (`list/get/update/delete`
in `lib/contribute/submissions.ts`) and the storage driver are the two seams to swap if that changes
(R2 for egress, a database for the records).

## Linking from parks and rides

Park pages (`components/parks/park-page-shell.tsx`) and ride pages render `<ContributeBanner>` with a
link built by `buildContributeHref()`; the contribute page reads it back with
`parseEntityFromParams()` (`lib/contribute/prefill.ts`), so the entity arrives pre-assigned.

## Rights

We ask for a **licence**, not a copyright assignment: under German and EU law the copyright itself
cannot be transferred, only usage rights can be granted. The consent text keeps the visitor's
copyright, grants park.fan a broad non-exclusive licence and asks them to confirm they took the
photo. The privacy page (`app/[locale]/datenschutz/content/*.tsx`, „Fotos einsenden") describes the
storage and Turnstile; it does not mention the `userAgent` stored with each submission.

## Environment

See `.env.example`:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`: Turnstile, shared with the admin login,
  so an unset secret in production breaks both.
- `BLOB_READ_WRITE_TOKEN` (with `BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY`): set automatically when a
  Vercel Blob store is linked; `vercel env pull` for local uploads.
- `STORAGE_DRIVER`: force `local` or `vercel-blob` (otherwise automatic).
- `CONTRIBUTE_TICKET_SECRET`: optional ticket signing key; falls back to the Blob token.

The admin routes are gated by the admin session (`denyUnlessAdmin`, `author` and up), like every
other admin route.
