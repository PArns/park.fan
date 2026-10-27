# The public changelog

One file per released version, `<version>.md`, rendered at
[`/en/changelog`](https://park.fan/en/changelog). English only, on purpose: it is a
release note for people who follow the project, not a page the site is optimised for
in six languages.

**This is not `docs/changelog.md`.** That file is the internal log. It is German, it
names components, files and measurements, and it is written for whoever touches the
code next. Nothing parses it into this page, and nothing should: the two describe the
same releases for two different readers. An entry here is written from the internal
ones, by hand, and states what a visitor can now do.

**Only a version cut writes here.** A pull request that ships a feature writes its fragment,
`docs/changelog.d/PAR-<n>.md`, and stops there. The PO decides when a version is cut, its number
and its items, and files them as a ticket `Release x.y.z`; the runner that takes it runs
`pnpm release:cut`, which folds the fragments into `docs/changelog.md`, bumps `package.json` and
writes this file as a draft skeleton, and then writes the entry by hand. When a version is cut, what
counts as a PATCH or a MINOR, and who does what:
[`docs/rules/a-version-is-a-unit-of-communication.md`](../../docs/rules/a-version-is-a-unit-of-communication.md).

## The file

```
content/changelog/
  2.13.0.md
  2.12.0.md
  …
```

```yaml
---
version: '2.13.0'
date: '2026-09-30'
title: Inside a park the homepage points you at its rides, and news has a section of its own
summary: >
  One paragraph. What a visitor gets out of this release, in plain words, no Markdown.
mode: published
highlights:
  - image: changelog/2-12-0-ride-today-panel
---
## New

- A sentence that says what a visitor sees or can do now, where, and the number behind it.

## Improved

- …

## Fixed

- What was broken, said plainly. The heading already says it is fixed.
```

| Field           | Meaning                                                                                |
| --------------- | -------------------------------------------------------------------------------------- |
| `version`       | Semver. The file is named after it, and `package.json` carries the newest one.         |
| `date`          | `YYYY-MM-DD`, the day the cut merged (Europe/Berlin).                                  |
| `title`         | A sentence about the release. Never the version number again. Plain text.              |
| `summary`       | One paragraph, rendered above the sections. Plain text, no Markdown.                   |
| `mode`          | `draft` hides the entry while it is being written; anything else publishes.            |
| `highlights`    | Media database ids, rendered as figures under the summary. Optional.                   |
| `through`       | The last version this entry also covers, for a run of versions in one entry. Optional. |
| `reconstructed` | `true` for entries written after the fact from the commit history (PAR-320). Optional. |

Versions sort numerically, newest first, so the file name does not decide the order. Each entry is
reachable at `/en/changelog#v<version>`, which is where the footer's version number points.

`pnpm check:changelog` checks all of this, and the prose, before a pull request can merge.

## Screenshots

A highlight is a row in the media database like every other image, so it lives in
`public/media/changelog/` with a `<name>.json` sidecar beside it. The authoring rules
are [`public/media/README.md`](../../public/media/README.md); the release-specific part
is short:

- Name the file after the release and what it shows: `2-12-0-ride-page.webp`.
- `tags: ["diagram"]`, because a screenshot of our own interface is not a photograph.
- `credit`: author `park.fan`, licence `all-rights-reserved`.
- `alt` and `caption` in `en` only, since the page is English.
- No `park` and no `ride`. A screenshot showing a park page is a picture of the
  interface; claiming the park would put it on that park's own page.

Run `pnpm generate:media` after adding one.

## Writing

This collection's part of the writing rules is
[§5.8](../../docs/writing/5-site-copy.md#58-the-public-changelog-contentchangelog), on top of
everything in [`docs/writing/`](../../docs/writing/README.md); `pnpm check:prose --only=changelog`
enforces the half a machine can. Which changes belong in a release at all, and why a blog or news
post never does, is
[a version is a unit of communication](../../docs/rules/a-version-is-a-unit-of-communication.md).
A count that will move (parks, pages, terms) says when it was true.
