# The code index is generated from the doc comments, and kept current in the same pull request (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning and the procedure.

[`docs/code-index/`](../code-index/README.md) lists every exported component, hook, function,
constant and type in `app/`, `components/`, `lib/`, `i18n/`, `types/` and `proxy.ts`: one page per
directory, one line per export, each with the first sentence of the export's doc comment.
`scripts/generate-code-index.mjs` writes it from the source.

## The rule

- **Look before you write.** Before adding a component, hook or helper, search the index page of the
  directory it would live in (and `lib/utils` for helpers). This is the lookup half of
  [reuse existing components](reuse-existing-components.md).
- **Every exported component, hook, function and class has a doc comment.** A `/** … */` block
  directly above the export: one sentence saying what it is for, never how it does it. That
  sentence is the index entry, so it has to stand on its own, and it must not re-tell the body,
  which is the part that changes. A second sentence only for a constraint a caller has to know
  ("Client only."). A `.tsx` file exporting one family of components (`Dialog`, `DialogContent`,
  `DialogHeader`) may describe them once in a header comment at the top of the file. What else a
  comment may and may not say: [a comment says why, once](a-comment-says-why-once.md).
- **Regenerate in the same pull request.** After adding, renaming, moving or removing an export, or
  changing its doc comment, run `pnpm generate:code-index` and commit `docs/code-index/`.
  `pnpm check:code-index` fails while a page is stale; CI runs it as the job `code-index-drift`.
- **Never edit `docs/code-index/` by hand.** To change an entry, change the comment in the code.

`node scripts/generate-code-index.mjs --missing <path-prefix>` lists the exports in a directory
that nobody has described yet. A route file's `default`, `generateMetadata`, `GET` and the other
names Next.js asks for count as described: the route path printed above them says what they are.

## Why it is generated

A hand-kept list of components goes stale the week it is written, and a stale list is worse than
none: it sends a session to a component that was renamed and lets it miss the one that was added.
The doc comments are already where a reader looks, and the repo writes them for its own reasons, so
the index reads them rather than asking anybody to say the same thing twice.

When the index was first generated on 2026-10-06, 646 exported components, hooks and functions had
no description at all; after counting route exports and component families as above, 471 were
left, and that pull request wrote them. In the same audit jscpd found 44 exact clones across the
code (2.1 % of the lines), several of them a second copy of a helper the author could not find.

## Why one page per directory, and no counts in the README

Two open pull requests regenerate the index independently. With one page per directory, a pull
request that changes `components/parks` rewrites one section of `components-parks.md`, and a pull
request in `lib/planner` never touches that file. The README lists only the pages, so it changes
when a directory appears, not when an export does. A count of described exports in the README
would put every pull request on the same line, which is the merge conflict the changelog fragments
in `docs/changelog.d/` were introduced to avoid.

When two pull requests do meet on one page, resolve the conflict by running
`pnpm generate:code-index` on the merged tree, never by hand.

## What it reads, and what it leaves out

- Files tracked by git or new and not ignored (`git ls-files --cached --others --exclude-standard`),
  so a file created a minute ago is indexed before `git add`, and gitignored build output never is.
- Not indexed: `*.generated.ts`, `lib/media/manifest*` and `*.d.ts`. They are generated data.
- Syntax only, no type checker, so it runs in about 3 s. The kind of an export comes from its
  syntax: a capitalised function in a `.tsx` file is a component, `use…` is a hook.
- A comment counts when it sits directly above the declaration: a `/** … */` block or a run of `//`
  lines. Lint directives and section banners (`// ===== Component =====`) do not.
