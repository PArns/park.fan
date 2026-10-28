# Writing to the media database

Every write to the media database is a commit to this repository, opened as a pull request. This
page covers the admin media browser (`/admin/media`), the session pull request every save joins,
uploads, moving and retagging, unique roles, and the other ways in: the field screen, visitor
contributions and the blog editor. The read side is [media database](media-database.md); the sidecar
format is [`public/media/README.md`](../../public/media/README.md).

## Why writes are pull requests

The database is the repository and Vercel's filesystem is read-only, so the admin commits to a
branch and opens a draft PR, the same mechanism as the blog editor. For copyright and attribution
data, reviewable and revertible beats writing in place. Sidecars written by the admin go through
`lib/media/sidecar.mjs`, the normalizer the generator uses, so a UI-saved file and a hand-authored
one are byte-identical and the diff stays readable.

Saving needs a GitHub token in `BLOG_EDITOR_GITHUB_TOKEN` (or `GITHUB_TOKEN`, read by
`lib/admin/github.ts`). Without it the admin still renders and edits; only saving fails, and says so.
A fine-grained PAT scoped to this repository with **Contents: read & write** and **Pull requests:
read & write** is enough (`Metadata: read-only` is added automatically); a classic PAT needs the
whole `repo` scope. Setup notes are in `.env.example`.

## One session, one pull request

A **session** is the branch starting with `media/session-` and the pull request opened for it. Every
save joins it, so retagging a shoot is twelve commits in one reviewable PR. The state lives in git,
not the browser: a reload, a second tab and another machine land in the same place. The banner at
the top of the browser reads `GET /api/admin/media/session`; it shows the PR's log lines and the
files the branch touches (`pulls.listFiles`), because only the file list cannot be wrong about what
is in a shared PR. Merging or closing the PR ends the session and the next save opens a new one;
**Start a new pull request** in the banner sends `newSession: true` with the next commit.

Finding the right PR is the whole mechanism. `resolveSession` (`lib/admin/media-session.ts`, shared
by the commit endpoint, the banner and the capture backlog) tells four states apart:

| State                                | How it got there                                  | Verdict            |
| ------------------------------------ | ------------------------------------------------- | ------------------ |
| open PR with the prefix              | the normal case                                   | **that is it**     |
| branch exists, never had a PR        | commits landed, opening the PR failed (the `207`) | **adopt it**       |
| branch exists, its PR was **merged** | shipped; GitHub kept the head branch              | spent, start fresh |
| branch exists, its PR was **closed** | somebody said no                                  | spent, start fresh |

Looking only at open PRs misses the second row and opens a PR per image; adopting unconditionally
would commit onto a merged branch, whose PR diff is everything `main` gained since, inverted. The
open scan does not filter by base (a retargeted session PR is still the session), and the branch is
checked by head ref with `state: 'all'`, since merged and closed PRs are what the open list cannot
see. A failed lookup is an **error, not "no session"**: the endpoint refuses the save, because
committing blind is what opens the duplicate. `pnpm test:media-session` covers it against a stubbed
GitHub; every way this can be wrong shows the same symptom, a PR per image.

Two traps in the commit endpoint (`app/api/admin/media/commit/route.ts`):

- An operation without a sidecar payload has its sidecar rebuilt from the **build-time manifest**,
  which describes `main`. Writing that back would undo an edit made earlier in the session, so a
  rebuilt sidecar is written only when the path is not already on the branch. Operations with a
  payload send the complete sidecar and are always written.
- A sidecar path carries **no extension**, so replacing a `.png` with a `.jpg` in place leaves old and
  new sidecar at the same path. The move cleanup removes `from.sidecar` only when the two paths
  differ; deleting it unconditionally threw away the sidecar just written and dropped the image from
  the database.

## The browser: `/admin/media`

A searchable, filterable grid over the whole database, with a folder rail by collection, park or tag
(`_components/folder-rail.tsx`, `_lib/folders.ts`; every folder is a filter, nothing moves a file).
The quick filters are the maintenance backlog: rights unknown, no park, low resolution, no focal
point, no alt text, and **Zu prüfen** (`review: true`).

### The editor

A dialog (`_components/media-detail.tsx`) with a pinned header and footer and a scrolling body; from
`lg` up the picture and the fields scroll independently, so the metadata stays beside the picture it
describes. Fields are grouped by the question they answer (what it shows · how it is used · tags ·
words · rights). Every sidecar field is editable, plus moving an image to another collection.

Edits stay in memory until **Save** opens or extends the session PR: the header carries an
**unsaved** badge, Save is disabled while the draft matches the row, and closing a dirty draft (X,
Escape, backdrop) asks first. Escape closes the catalog picker before the editor. Saving reports back
in the dialog ("Uploaded and saved", the PR link and its summary line), and the footer says what Save
is about to write before it is pressed.

**The focal-point editor** (`focus-editor.tsx`, `focus-previews.tsx`) previews the result in the
**real** cards: `AttractionCard`, `ParkCard`, `BlogPostCardView`, `ParkBackground`, never look-alike
boxes. They share one grid with a pinned 220 px photo track and `grid-template-rows: subgrid`; with a
template per card the photo track absorbs the slack, the box comes out taller than wide, and the
preview shows the focal point having no effect.

**Replacing the file** (the low-resolution upgrade path) is the bar above the previews: the current
resolution and a drop zone that swaps the bytes while the id, the sidecar and every reference stay.
The whole bar takes a drop; a multi-file drop is refused rather than silently using the first. The
grid labels the images that need it (`1024×768 · replace`). A dropped file is **staged, not sent**: it
shows as pending (thumbnail, `1200×900 → 4000×3000`, size) and goes out with the next Save, in the
same operation as the other edits, so alt text and focal point can be set for the new picture, which
the previews already show. Two mechanics to keep: the zone is a `div` with an explicit click, **not**
a `<label>` around the input (a drop on a label activates its control and tore the panel down
mid-drop), and `dragleave` checks `relatedTarget`, or the highlight flickers over the zone's children.

**Replacing from the grid.** A file dropped on a tile takes the same path without opening the
editor: `pickReplacement` (`_lib/replace-drop.ts`, shared with the bar) refuses multi-file drops and
non-images, the tile shows the new picture as "New file · not saved", and a bar above the grid sends
every staged tile with one Save, one `replace` request per tile (several originals in one body
exceed the host's request limit), all joining the session PR. These operations carry no sidecar
payload, so alt text, focus and tags stay. Touch screens have no drag events; the editor is the way
there.

### Uploading

Drag and drop, then the batch is walked one photo at a time (`upload-walkthrough.tsx`): one photo
large enough to judge, its EXIF findings, the ride shortlist as buttons, and the focal point set by
clicking the picture, the one moment every photo is in front of someone. `← → S` walk it. Nothing is
written before the review step. Thirty table rows had the park and ride filled in and everything that
needs looking at the picture left for a pass that never came.

1. `/api/admin/media/analyze` reads each file's EXIF and answers where it was taken. Nothing is stored.
2. `/api/admin/media/commit` writes each photo into the session PR.

**Every file goes up in its own request** (`app/admin/_lib/upload-transport.ts`). Vercel rejects
bodies over ~4.5 MB and base64 adds a third, so a batch in one body could not commit three photos;
`next start` has no such limit, which is why local tests passed. Commits run sequentially, so the
first opens the session PR and the rest join it, and an oversized original is shrunk client-side.
`analyze` receives only the first megabyte of an oversized file, since EXIF sits in the APP1 segment
right after the header. Shrinking re-encodes through a canvas and **strips EXIF**, so it runs after
`analyze` has read the original, and GPS and capture date are written into the sidecar explicitly.

What GPS fills in is measured, against the 55 photos that carried both a GPS tag and a known ride:

| Question              | Nearest match is right | So the admin…                      |
| --------------------- | ---------------------- | ---------------------------------- |
| which park?           | **89 %**               | fills it in (parks are km apart)   |
| which ride?           | **55 %**               | offers a distance-ranked shortlist |
| ride in top 3 / 5 / 8 | 78 % / 87 % / **95 %** | one click, never auto-assigned     |

Auto-picking the nearest ride would mislabel nearly half of every batch while looking reviewed. Park
and ride stay editable. GPS also cross-checks existing images (a photo assigned to `europa-park`
whose coordinates land in Kaatsheuvel is flagged) but never rewrites an assignment.

## Retagging is safe; moving is the edit to be careful with

| Edit in the admin             | URL         | `?v=`     | Blog references                                                           |
| ----------------------------- | ----------- | --------- | ------------------------------------------------------------------------- |
| park, ride, roles, tags, text | unchanged   | unchanged | unaffected                                                                |
| focal point                   | unchanged   | **new**   | fine: rendered through `versionedPath`, so the re-cut crops are picked up |
| **move / rename**             | **changes** | —         | rewritten in the same PR                                                  |

The content version is `sha1(file bytes + focus)`, so assigning a park does not change it. What does
change is where the image shows up: a screenshot tagged with a park appears in that park's gallery
and in `getParkImages`.

A move through the admin repoints every blog reference to the old path in the same pull request,
sources and crops, body and frontmatter (`lib/admin/media-references.ts`), finding the posts through
the build-time bodies manifest so it costs no API calls. A move made by hand outside the admin is
caught by `pnpm generate:media`'s dangling-path warning, and by `pnpm check:media-urls` against a
running site. `pnpm test:media-references` pins the rewrite; its failure modes are both silent:
too little leaves a broken image, too much repoints a different picture (`taron-queue.jpg` starts
with `taron`, so the pattern needs a boundary).

## A unique role moves when another photo claims it

`ride-card` is one photo per ride and `park-background` one per park. Ticking `ride-card` on a new
photo used to leave it on the old one too; the generator warned and `getRideImage` kept showing the
old photo. Now a save that claims a unique role takes it from the image that held it, in the same
PR (`handOverUniqueRoles`, `lib/admin/media-unique-roles.ts`, called from the commit endpoint). The
holder is looked up in the build-time manifest and among the sidecars the open session already
changed (the branch's version wins), and its sidecar is rewritten from the branch, never from the
manifest, changing only the role line. The keys mirror the generator's `auditRoles`: a card claims
its ride and every `alsoRides` slug. The PR log records what moved; when rewriting the holder fails,
the photo is still saved and the response carries a `warning`.

In the UI the role is its own switch, **Als Ride-Bild setzen** (`RideCardToggle`), in the detail panel
and in the upload walkthrough under the ride choice. It shows the current card as a thumbnail and
says it will be replaced; within one upload batch it moves between photos of the same ride.
`pnpm test:media-unique-roles`.

## Other ways in

- **The field screen** (`/admin/capture`, see [admin](admin.md#field-capture-admincapture)) commits
  through the same session with what a phone in front of a ride knows for certain (park, ride, area,
  capture date, credit, `photo`, `ride` or `park`, `day`/`night` when the park's clock is
  unambiguous) and `review: true`. The alt text, caption, subject and weather tags and usually the
  focal point are the evening's work, found again through **Zu prüfen**. `review` is a field, not a
  tag, only `true` is written, and it is not part of the content version (signing a photo off must
  not invalidate its cached renditions); `pnpm test:media` pins the asymmetry. The browser reads
  `main`, so a photo appears there only after its PR is merged and deployed.
- **Visitor contributions.** `MediaUpload` takes an optional `seed` (files plus per-file presets, a
  batch credit and `stripMetadata`), which is how `/admin/contributions` hands approved photos over:
  same walkthrough, same commit, with park, ride, caption and credit filled in. `onDone` reports
  which files landed as `<collection>/<name>`. See [contribute → into the media
  database](contribute.md#into-the-media-database).
- **The blog editor.** An image pasted or dropped into a post is committed by
  `/api/admin/blog-editor/save` in the post's own PR, **with a starter sidecar**
  (`lib/admin/blog-image-sidecar.ts`) carrying the alt text and caption the markdown already holds,
  from every filled locale. What it leaves unset and why is in the authoring contract. An existing
  sidecar is never overwritten. `pnpm test:blog-image-sidecar` pins the markdown parsing, whose
  failure mode is silence: no match means an empty sidecar and the author's alt text lost.

## Related

- [Media database](media-database.md): the read side, caching, HTTP API
- [Admin](admin.md): the admin shell, the field screen
