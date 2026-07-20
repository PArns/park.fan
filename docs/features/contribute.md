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

| Concern                                           | File                                          |
| ------------------------------------------------- | --------------------------------------------- |
| Public page (hero + gallery + rights + form)      | `app/[locale]/contribute/page.tsx`            |
| Form orchestrator (start → upload → finalize)     | `components/contribute/contribute-form.tsx`   |
| Drag & drop multi-upload + previews               | `components/contribute/photo-dropzone.tsx`    |
| Ride/park picker (cmdk + `/api/search`)           | `components/contribute/entity-picker.tsx`     |
| Turnstile widget                                  | `components/contribute/turnstile-widget.tsx`  |
| Rights / "what we do with your photos" notice     | `components/contribute/rights-notice.tsx`     |
| Example gallery                                   | `components/contribute/example-gallery.tsx`   |
| Reusable CTA banner (parks/rides link here)       | `components/contribute/contribute-banner.tsx` |
| Begin (Turnstile + signed ticket)                 | `app/api/contribute/start/route.ts`           |
| Proxy one photo to the private Blob store         | `app/api/contribute/file/route.ts`            |
| Finalize (write moderation record)                | `app/api/contribute/finalize/route.ts`        |
| Client-side downscale (fit the body limit)        | `components/contribute/compress.ts`           |
| Turnstile server verify                           | `lib/contribute/turnstile.ts`                 |
| HMAC ticket                                       | `lib/contribute/ticket.ts`                    |
| Storage driver resolution                         | `lib/contribute/driver.ts`                    |
| Server-side image store (Blob `put` / local FS)   | `lib/contribute/storage.ts`                   |
| Submissions repository (list/get/update/delete)   | `lib/contribute/submissions.ts`               |
| Prefill helpers (park/ride → /contribute)         | `lib/contribute/prefill.ts`                   |
| Admin moderation page                             | `app/admin/contributions/page.tsx`            |
| Admin APIs (list / patch / delete / file preview) | `app/api/admin/contributions/**`              |
| i18n                                              | `contribute` namespace in `messages/*.json`   |

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
5. A moderator reviews it in `/admin/contributions` and approves/rejects/edits/deletes.

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

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` — Turnstile.
- `BLOB_READ_WRITE_TOKEN` (+ `BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY`) — auto-set
  when a Vercel Blob store is linked. For **local dev** uploads, `vercel env pull`.
- `STORAGE_DRIVER` — force `local`/`vercel-blob` (otherwise auto).
- `CONTRIBUTE_TICKET_SECRET` — optional; signs upload tickets (falls back to the Blob token).

Admin moderation reuses the existing admin pass (`x-admin-pass`).
