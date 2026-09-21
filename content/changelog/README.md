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

When a version is cut, and what counts as a PATCH or a MINOR, is
[`docs/rules/a-version-is-a-unit-of-communication.md`](../../docs/rules/a-version-is-a-unit-of-communication.md).

## The file

```
content/changelog/
  2.12.0.md
  2.11.0.md
```

```yaml
---
version: '2.12.0'
date: '2026-09-21'
title: The day planner asks before it drops a ride
summary: >
  One paragraph. What a visitor gets out of this release, in plain words.
mode: published
highlights:
  - image: changelog/2-12-0-ride-page
---
## New

- **The name of the thing.** What it does now, in one or two sentences.

## Fixed

- **What was broken.** What it does instead.
```

| Field        | Meaning                                                                     |
| ------------ | --------------------------------------------------------------------------- |
| `version`    | Semver, as `package.json` carried it when the version was cut.              |
| `date`       | `YYYY-MM-DD`, the day it was cut.                                           |
| `title`      | A sentence about the release. Never the version number again.               |
| `summary`    | One paragraph, rendered above the sections.                                 |
| `mode`       | `draft` hides the entry while it is being written; anything else publishes. |
| `highlights` | Media database ids, rendered as figures under the summary. Optional.        |

Versions sort numerically, newest first, so the file name does not decide the order.

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

The rules in [`docs/blog.md`](../../docs/blog.md) apply here too. The ones this
collection gets wrong most easily:

- Say what changed, not that it is better. "The chart now labels every hour of the
  visit" beats "an improved chart experience".
- A number instead of an adjective, where there is a number.
- Blog posts never appear here. A post is content; the release is the product.
