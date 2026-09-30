# Changelog fragments

One file per pull request. Write your section here, **not** into `docs/changelog.md`.

```
docs/changelog.d/PAR-603.md
```

```markdown
### Der Footer verlinkt den Changelog, und die Versionsnummer springt zu ihrem Eintrag

Was sich geändert hat, warum es vorher falsch war, und die Zahl, die das belegt.
```

## The rules

- **File name:** `PAR-<n>.md` for a ticket. A second pull request on the same ticket before the
  next cut writes `PAR-<n>-2.md`; work without a ticket takes a kebab-case name
  (`more-menu-hub-chapters.md`). Two pull requests never write the same file, so git never has to
  merge them.
- **First line:** `### <title>`. The title is what the section is called in the log after the cut.
- **Below it:** the section, in the voice of the ones already in `docs/changelog.md`: German,
  technical, the component or file, and the measured number.
- **No `#` or `##` heading.** A fragment is one section; a subsection is `####`.
- **No line of only `-`, `=` or `*`.** Under a paragraph that is a heading, and telling the two apart
  takes a Markdown parser, so the check refuses both. Use a blank line.
- Inside a fenced code block, both are fine. The fence has to be closed.
- **Content-only pull requests** (a post, a news item, photos) need no fragment. A blog post is never
  a release item.

`pnpm check:changelog` runs in CI and refuses a fragment the cut could not fold in as it stands.

## At a cut

The PO decides when a version is cut and files a ticket `Release x.y.z`. The runner that takes it
runs

```bash
pnpm release:cut 2.14.0 --title "Kurzer Titel für das interne Log"
```

which folds every fragment here under `## 2.14.0 (<today>) – <title>` at the top of
`docs/changelog.md`, newest first by the commit that added it, deletes the files, sets `package.json`
to 2.14.0 and writes `content/changelog/2.14.0.md` as a draft. `--dry-run` prints all of it and
changes nothing. The public entry is written by hand from the folded sections; the rest of the
procedure is [a version is a unit of communication](../rules/a-version-is-a-unit-of-communication.md).

## Why

Every pull request used to put its section on top of `docs/changelog.md`, so any two open at the
same time edited the same lines. 54 of the 309 commits on main in September 2026 touched that file,
and the pull request that cut 2.13.0 had a conflict there with #684 within an hour of being opened.
The backend has used fragments since PAR-257 (`docs/changelog.d/PAR-<n>.md`, `pnpm
changelog:merge`), after seven of its merges on 15 and 16 September were sent back for a rebase whose
only conflict was its changelog.
