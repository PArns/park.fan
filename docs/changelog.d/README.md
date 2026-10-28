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

`pnpm release:cut` folds the fragments into `docs/changelog.md` and deletes them. Who cuts, when,
and the whole procedure:
[a version is a unit of communication](../rules/a-version-is-a-unit-of-communication.md#cutting-a-version-one-pull-request).

## Why

Every pull request used to put its section on top of `docs/changelog.md`, so any two open at the
same time edited the same lines: 54 of the 309 commits on main in September 2026 touched that file.
The backend works the same way (`docs/changelog.d/PAR-<n>.md`, `pnpm changelog:merge`).
