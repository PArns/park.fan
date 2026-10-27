# The code index is generated from the doc comments, and kept current in the same pull request (REQUIREMENT)

[`docs/code-index/`](../code-index/README.md) lists every exported component, hook, function,
constant and type in `app/`, `components/`, `lib/`, `i18n/`, `types/` and `proxy.ts`: one page per
directory, one line per export, each with the first sentence of the export's doc comment.
`scripts/generate-code-index.mjs` writes it from the source.

- **Look before you write.** Before adding a component, hook or helper, search the index page of the
  directory it would live in (and `lib/utils` for helpers).
- **Every exported component, hook, function and class has a doc comment**: a `/** … */` block
  directly above the export, one sentence saying what it is for, never how it does it. That
  sentence is the index entry, so it has to stand on its own. A second sentence only for a
  constraint a caller has to know ("Client only."). A `.tsx` file exporting one family of components
  (`Dialog`, `DialogContent`, `DialogHeader`) may describe them once in a header comment at the top
  of the file. What else a comment may say: [a comment says why, once](a-comment-says-why-once.md).
- **Regenerate in the same pull request.** After adding, renaming, moving or removing an export, or
  changing its doc comment, run `pnpm generate:code-index` and commit `docs/code-index/`.
- **Never edit `docs/code-index/` by hand.** To change an entry, change the comment in the code.
  When two pull requests conflict on a page, run `pnpm generate:code-index` on the merged tree.

## Why it is generated

A hand-kept list of components goes stale the week it is written, and a stale list sends a session
to a component that was renamed and lets it miss the one that was added. The doc comments are
already where a reader looks, so the index reads them. When the index was first generated
(2026-10-06), 471 exports had no description at all, and jscpd found 44 exact clones, several of
them a second copy of a helper the author could not find.

**One page per directory, and no counts**, so two pull requests touching different directories
never edit the same file, and a page changes only in the section whose code changed. A count in the
README would put every pull request on the same line.

## What it reads

- Files tracked by git or new and not ignored (`git ls-files --cached --others --exclude-standard`),
  so a file created a minute ago is indexed before `git add`, and gitignored build output never is.
- Not indexed: `*.generated.ts`, `lib/media/manifest*` and `*.d.ts` (generated data).
- Syntax only, no type checker (about 3 s). A capitalised function in a `.tsx` file is a component,
  `use…` is a hook.
- A comment counts when it sits directly above the declaration: a `/** … */` block or a run of `//`
  lines. Lint directives and section banners do not.
- A route file's `default`, `generateMetadata`, `GET` and the other names Next.js asks for count as
  described: the route path printed above them says what they are.

## Check

`pnpm check:code-index` fails while a page is stale; CI runs it as the job `code-index-drift`
(`.github/workflows/checks.yml`). `node scripts/generate-code-index.mjs --missing <path-prefix>`
lists the exports in a directory that nobody has described yet.
