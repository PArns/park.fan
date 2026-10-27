# A chapter opens the same way everywhere (REQUIREMENT)

One component draws every chapter header on the site: `ChapterHeading`
(`components/common/chapter-heading.tsx`), an oversized translucent glyph, an optional kicker, the
title and the rule that closes it (`variant="tile"` is the homepage story's form of the same thing).

Each surface reaches it through its own wrapper (`SectionShell`, the blog's h2 renderer,
`PageSection`, `ChapterPanel`, the `PageBottomSections` headings); the table, and what belongs
inside a card instead (`SectionHeading`'s `plain` variant), are in
[chapter headings](../design/chapter-headings.md).

Three decisions sit in the component so a call site cannot get them wrong:

- **A number must not skip.** A post's chapter numbers come from `extractToc(markdown)`
  (`lib/blog/toc.ts`), never from a counter incremented while rendering: the body is split into one
  `<ReactMarkdown>` per widget fence, so a render-time counter restarts at each one. Park and ride
  chapters carry **no** number, since some of their chapters render nothing for many parks and a
  fixed sequence would arrive with gaps.
- **An icon standing in for the number is drawn at `/25`, not `/15`.** A solid numeral survives
  15 %; a hairline Lucide icon disappears.
- **`frosted` is a full-width band, not a `w-fit` pill**, because park and ride pages sit on an
  arbitrary photo and a watermark over its bright part is unreadable.

A streamed chapter's placeholder renders the **real** heading, because its height moves when a title
wraps, per locale and per breakpoint: `ParkBestDaysHeader` and `ParkStatsHeader` are their own files
so the placeholder can mount them with only the data-dependent hint as a `Skeleton`.

## Why

There were five chapter headers, three of them on one park page (`text-xl font-semibold` with an
icon, `text-xl font-bold` with an icon, a `text-2xl` frosted pill, a bare `<h2>`,
`GlassSectionTitle`), and nothing told a reader which opened a chapter and which labelled a card.
