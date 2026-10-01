# User photo contributions

Lets visitors upload their own park & ride photos (drag & drop, multiple files),
assign each set to a **park or ride**, and submit it into a **moderation queue**.
Protected by **Cloudflare Turnstile**. Public page: `/[locale]/contribute`.
Moderation UI: `/admin/contributions`.

Photos are **proxied through our own server** to a **private** Vercel Blob store —
the browser never pushes to Blob directly and the store's write token never leaves
the server. To stay under Vercel's ~4.5 MB request-body limit, each photo is sent in
its own request and large originals are **downscaled client-side** first, so high-res
shots still come through. Nothing is shown publicly until a moderator approves it.

## Pieces

| Concern                                           | File                                                       |
| ------------------------------------------------- | ---------------------------------------------------------- |
| Public page (hero + gallery + rights + form)      | `app/[locale]/contribute/page.tsx`                         |
| Form orchestrator (start → upload → finalize)     | `components/contribute/contribute-form.tsx`                |
| Drag & drop multi-upload + previews               | `components/contribute/photo-dropzone.tsx`                 |
| Ride/park picker (cmdk + `/api/search`)           | `components/contribute/entity-picker.tsx`                  |
| Turnstile widget (shared with `/admin`)           | `components/common/turnstile-widget.tsx`                   |
| Rights / "what we do with your photos" notice     | `components/contribute/rights-notice.tsx`                  |
| Example gallery                                   | `components/contribute/example-gallery.tsx`                |
| Reusable CTA banner (parks/rides link here)       | `components/contribute/contribute-banner.tsx`              |
| Begin (Turnstile + signed ticket)                 | `app/api/contribute/start/route.ts`                        |
| Proxy one photo to the private Blob store         | `app/api/contribute/file/route.ts`                         |
| Finalize (write moderation record)                | `app/api/contribute/finalize/route.ts`                     |
| Client-side downscale (fit the body limit)        | `components/contribute/compress.ts`                        |
| Turnstile server verify (shared with `/admin`)    | `lib/security/turnstile.ts`                                |
| HMAC ticket                                       | `lib/contribute/ticket.ts`                                 |
| Storage driver resolution                         | `lib/contribute/driver.ts`                                 |
| Server-side image store (Blob `put` / local FS)   | `lib/contribute/storage.ts`                                |
| Submissions repository (list/get/update/delete)   | `lib/contribute/submissions.ts`                            |
| Prefill helpers (park/ride → /contribute)         | `lib/contribute/prefill.ts`                                |
| Admin moderation page                             | `app/admin/contributions/page.tsx`                         |
| Hand-over into the media database                 | `app/admin/contributions/_components/adopt-into-media.tsx` |
| "New submissions" toast after the login           | `app/admin/_app/new-contributions-notice.tsx`              |
| Admin APIs (list / patch / delete / file preview) | `app/api/admin/contributions/**`                           |
| Pending summary for the toast                     | `app/api/admin/contributions/summary/route.ts`             |
| i18n                                              | `contribute` namespace in `messages/*.json`                |

## Upload flow (server proxy)

1. User adds photos, picks the park/ride (live `/api/search`), adds optional
   caption/credit, **ticks consent** (upload is gated on it), and solves Turnstile.
2. `POST /api/contribute/start` → verifies Turnstile **once** (server-side), validates
   the assignment + consent, returns a short-lived **HMAC-signed ticket**
   (`lib/contribute/ticket.ts`) carrying the submission id, assignment and file budget.
3. For each photo: the browser downscales it if needed (`compress.ts`) and POSTs it —
   one file per request, each < 4.5 MB — to `POST /api/contribute/file`, which verifies
   the ticket and `put()`s the bytes into the **private** Blob store server-side
   (the write token never reaches the browser).
4. `POST /api/contribute/finalize` → verifies the ticket and writes ONE `pending`
   record referencing the stored blobs.
5. A moderator reviews it in `/admin/contributions` and approves/rejects/edits/deletes,
   and moves the photos worth keeping into the media database (below).

## Into the media database

Approving a submission publishes nothing by itself: the bytes stay in the private store. A photo
reaches a ride page by being moved into the [media database](media-database.md), which is the
repository, so moving means committing it into the open media pull request.

On the moderation card every photo not moved yet has a tick box, all of them ticked to start with.
**N Fotos in die Mediengalerie** downloads the ticked ones through the admin file route and opens
the media browser's own upload dialog (`MediaUpload`) with a `seed`: the files plus what the
submission already says. Park and ride come from the entity's page path and slug and win over
what the photo's GPS suggests; the caption goes into the German caption field; the credit is
written into every sidecar of the batch. The walkthrough then runs as for any upload, because the
focal point, the roles and the alt text need somebody to look at each picture. Unsaved edits to
caption and credit on the card are what gets written, and they are saved with the adoption.

Four rules in that hand-over:

- **The credit is the visitor's or nobody's.** `credit.author` is set only when the visitor gave a
  name, with `license: all-rights-reserved` (they keep the copyright, we hold the licence they
  granted) and `source: contribution`. Without a name there is no author, so `getCreditLine()`
  returns null and no credit is drawn. It is never filled with `OWN_PHOTO_AUTHOR`. The old hover
  button wrote `credit.name`, a key the sidecar does not have, and lost the name every time.
- **No visitor EXIF reaches `public/media/`.** A phone JPEG under the size cap used to be committed
  byte for byte, with its GPS fix, capture time, camera serial and sometimes the owner's name, in
  a file anyone can download. `withoutMetadata()` (`app/admin/_lib/upload-transport.ts`) re-encodes
  with `imageOrientation: 'from-image'`, so a portrait shot stays upright after its rotation tag is
  gone. The GPS fix is kept out of the sidecar as well; the capture date stays. The analysis still
  reads the original, so the ride shortlist works.
- **The file name is fixed:** `<entity slug>-<first six of the submission id>`, `-2`, `-3` after
  it by the photo's place in the submission. A second attempt after a failed commit overwrites
  what the first wrote instead of adding a copy.
- **The submission records where each photo went.** `StoredImageRecord.adopted` holds the media
  id, the pull request and the time; the card shows **In Galerie** with a link to the PR, and
  adopting approves the submission. The photo is live once that PR is merged, and the media
  browser finds it after the deploy, since it reads `main`.

## New submissions are announced after the login

`NewContributionsNotice`, mounted in the admin shell, asks
`GET /api/admin/contributions/summary` (pending submissions only, newest first, no image
references and no blob inventory) once the session stands, and again on a tab focus after five
minutes. Pending submissions newer than the last one this browser was told about become one toast
with **Ansehen**. "Told about" is a localStorage high-water mark, per browser, so a second moderator
gets their own notice; landing on `/admin/contributions` counts as being told. Accounts below
`author` do not ask, since the route would answer 403.

## Storage

Driver auto-selected by `lib/contribute/driver.ts`:

- **vercel-blob** (default when `BLOB_READ_WRITE_TOKEN` is set — i.e. any deploy with
  a linked Blob store): photos live under `contributions/<id>/…`; each submission's
  metadata is a JSON object at `submissions/<id>.json` in the same store.
- **local** (`STORAGE_DRIVER=local`, offline dev): images under `.uploads/`, metadata
  JSON under `.data/`. Vercel's runtime FS is ephemeral, so this is dev-only.

Cost note: Vercel Blob storage is cheap; **data transfer (serving)** is the cost
driver. If the gallery gets heavy traffic, Cloudflare R2 (zero egress) is cheaper —
swap the driver (the repository/finalize logic stays the same).

### Metadata / moderation queue

`SubmissionRecord` (`lib/contribute/types.ts`): id, timestamp, `status`
(`pending`/`approved`/`rejected`), the assigned entity, caption, credit, image refs
(url/key/size/type), userAgent. The repository (`lib/contribute/submissions.ts`)
exposes `list/get/update/delete`. At larger scale, point it at a real DB (an
`api.park.fan` endpoint, Postgres/Neon, Turso) — the call sites don't change.

## Linking from parks & rides

Every park and ride page renders `<ContributeBanner>` with a prefilled link built by
`buildContributeHref()`; the contribute page reads it back via `parseEntityFromParams()`
so the entity arrives pre-assigned.

## Legal note (rights)

We ask for a **licence**, not a copyright assignment. Under German/EU law the
copyright (Urheberrecht) itself **cannot be transferred** — only usage rights
(Nutzungsrechte) can be granted. The consent text keeps the user's copyright, grants
park.fan a broad non-exclusive licence, and requires them to confirm they own/took
the photo. Have the final wording reviewed by counsel; add a GDPR note for the stored
userAgent.

## Env

See `.env.example`:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` — Turnstile. The same
  pair now also gates the **admin login** (`/api/admin/session`), so an unset
  secret in production is no longer only a broken upload form — see
  [admin → Bot protection](admin.md#bot-protection-on-the-login).
- `BLOB_READ_WRITE_TOKEN` (+ `BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY`) — auto-set
  when a Vercel Blob store is linked. For **local dev** uploads, `vercel env pull`.
- `STORAGE_DRIVER` — force `local`/`vercel-blob` (otherwise auto).
- `CONTRIBUTE_TICKET_SECRET` — optional; signs upload tickets (falls back to the Blob token).

Admin moderation reuses the existing admin pass (`x-admin-pass`).
