# The admin blog editor

`/admin/blog-editor`: a WYSIWYG editor for the posts under `content/blog/`, which saves by opening
a draft pull request against this repository. Open this page before changing the editor, its API
routes or its translate button, or before telling an author what a save does. What a post may
contain is the [blog authoring guide](../../content/blog/README.md), how it is written the
[writing rules](../writing/README.md); the editor checks neither.

| Piece                                              | Job                                                                                 |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `app/admin/blog-editor/page.tsx`                   | Reads authors and categories (`_lib/initial-data.ts`), ships an English-only bundle |
| `app/admin/blog-editor/editor-client.tsx`          | The workspace: one draft per locale, save, load, translate, delete                  |
| `_components/`, `_extensions/`                     | TipTap canvas, toolbars, slash menu, pickers, the `.md` source view                 |
| `_lib/widgets.ts`                                  | The widget catalogue every toolbar, menu and preview reads                          |
| `_lib/types.ts`                                    | Form state ↔ frontmatter (`toFrontmatter`, `fromFrontmatter`)                       |
| `_lib/draft-autosave.ts`, `_lib/pending-images.ts` | Crash snapshot; staged image uploads                                                |
| `app/api/admin/blog-editor/*`                      | `posts`, `posts/[key]`, `save`, `delete`, `translate`, `images`, `resolve-ref`      |
| `lib/admin/github.ts`                              | Target repository, base branch, token, `forkFromBase`                               |

Every route opens with `denyUnlessAdmin(req)`, which needs the `author` role or higher
([admin authentication](admin.md#authentication)). The admin is untranslated; the page passes only
the few `parks` and `common` messages its reused badges need.

## What it edits

One draft per locale (`LocaleDraft`: frontmatter form, body, slug), English as the default source
locale. The form holds `title`, `excerpt`, `date`, `updatedAt`, `author`, `mode`, `featured`,
`category`, `tags`, `coverImage` (`src`, `alt`, `credit`) and `seo` (`title`, `description`,
`keywords`). The body is edited in TipTap or as raw markdown; widget fences, `ref:` links, callouts
and embeds get live previews (`resolve-ref` resolves a `ref:` to name, location and live status; the
image picker lists the media database through `images`). New authors and categories can be created
or edited inline and land in the same pull request.

**Known limits, all of them silent:**

- **Saving an existing post drops every frontmatter field the form does not hold.**
  `fromFrontmatter` reads only the fields above and `buildPostFile` writes only what
  `toFrontmatter` returns, so `time` (every news post), `parkLinks`, `rideLinks`,
  `coverImage.caption`, `gallery`, `seo.ogImage`, `seo.canonical` and `seo.noindex` vanish from the
  file. On 2026-10-27, 546 of 602 post files carried `parkLinks` and 270 a `time`. Read the pull
  request's diff and restore them by hand.
- **There is no `translationKey` field.** A loaded post keeps its key; a new post gets none, and the
  manifest then keys a post by its slug. The translate button gives every locale its own slug
  (`slugify` of the translated title), so a new post saved from here is six unrelated posts until a
  key is added in the pull request
  ([six languages in one pull request](../rules/a-post-ships-in-six-languages-in-one-pull-request.md)).
- **The post list is the running deployment's.** `posts` and `posts/[key]` read `content/blog` off
  the deployment's filesystem, so a post in an open pull request is not there, and a save branches
  from the base branch's head, not from what was loaded.

## How it saves

`POST /api/admin/blog-editor/save` sends every locale that has content (`isDraftFilled`):

1. A branch at the head of the base branch (`forkFromBase`): `blog/<slug>-<YYYY-MM-DD>`, or
   `blog/edit-<slug>-<YYYY-MM-DD>` for a loaded post. The name carries only the day, so a second
   save of the same post on the same day fails with "Could not create branch"; delete or merge the
   first branch, or save under another slug.
2. One commit per locale to `content/blog/<locale>/<slug>.md` (gray-matter's YAML). A renamed slug
   deletes the old file. New authors become `content/blog/authors/<key>.md`; new and edited
   categories are merged into `content/blog/categories.json`.
3. One commit per staged image that the post still references, to `public/media/<post-slug>/…`,
   each with a starter sidecar; what that sidecar holds is in [writing to the media
   database](media-database-writes.md). Images go up only with the save, the pull request being the
   only durable write.
4. A **draft** pull request titled `Blog: <title>` or `Update: <title>`, listing what it wrote.

`delete` works the same way: a `blog/delete-<key>-<date>` branch that removes each locale's file,
and a draft pull request. Nothing reaches `main` before somebody merges, and nothing is live before
the next production deploy ([deploys](../development/deploys.md)).

The target is `GITHUB_REPOSITORY` (default `PArns/park.fan`) and `BLOG_EDITOR_BASE_BRANCH` (default
`main`), written with `BLOG_EDITOR_GITHUB_TOKEN`, falling back to `GITHUB_TOKEN`; without a token
every write answers 500 with that hint. The token's scopes are in `.env.example`; the media admin
uses the same token ([environment variables](../development/setup.md#environment-variables)).

**What is checked before a save:** the source locale needs a title, author, excerpt, body and slug
(the save bar says which is missing); the route refuses a slug or locale outside `BLOG_SLUG_RE` /
`BLOG_LOCALE_RE` (`lib/admin/blog-paths.ts`), a locale without title, excerpt, author, date or body,
an image path outside `/media/…` with a raster or SVG extension, and an image over 4 MB of base64.
Nothing runs the repository's own checks (format, `pnpm check:blog-updated-at`, `pnpm check:prose`);
the pull request's CI does.

**Autosave.** The drafts, the post being edited and the active locales are snapshotted to
`localStorage['parkfan-blog-editor-draft']` 800 ms after the last change and offered back on the
next visit; a successful save clears it. Staged images, new authors and new categories are not in
the snapshot: a restored draft still references the image paths, which no save will commit.

**Deep link.** `?post=<translationKey>` opens that post; the park and ride editors link to it
(`app/admin/_ui/entity-posts.tsx`).

## Translate

`POST /api/admin/blog-editor/translate` sends the source locale's frontmatter and body to the
Anthropic Messages API and fills one target locale with the answer: `title`, `excerpt`, `body` and,
when the model returns them, `seo.title` and `seo.description`. Everything else is copied from the
source draft (date, author, category, tags, cover, `updatedAt`), and the slug becomes
`slugify(title)`. The prompt tells the model to keep markdown, widget fences, `ref:` cards and embed
lines verbatim and proper nouns untranslated. A translation is a first draft: the writing rules'
[translation chapter](../writing/6-translation.md) still applies, and the review happens in the pull
request.

- Key: `BLOG_EDITOR_ANTHROPIC_API_KEY`, falling back to `ANTHROPIC_API_KEY`; without either the
  route answers 500 with that hint.
- Model: `BLOG_EDITOR_TRANSLATE_MODEL`, default `claude-sonnet-4-5`, read once when the module loads.
- `max_tokens` is 8192. An answer that is not the expected JSON, or lacks title, excerpt or body,
  is a 502 with the first 600 characters of what came back; a long post cut off by the limit ends
  there.

The editor's own stylesheet is the one place a `:has()` selector is allowed
([the rule](../rules/no-has-selector-in-the-stylesheet.md)).
