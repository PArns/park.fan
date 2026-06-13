---
title: 'Editor Feature Test — All Chips, All Variants'
translationKey: editor-feature-test
date: '2026-06-09'
updatedAt: '2026-06-09'
author: patrick
mode: draft
featured: false
excerpt: >-
  A scratch post that exercises every park.fan editor chip — ref variants,
  spotlights, widgets, embeds, images, lists, tables — so we can click through
  the inspector side by side and verify each editing flow.
tags:
  - meta
  - test
  - editor
category: news
coverImage:
  src: /blog/images/welcome-cover.svg
  alt: 'park.fan editor — chip test post'
  credit: 'park.fan'
seo:
  title: 'Editor Feature Test'
  description: 'Sandbox post used to drive every editor chip in the admin.'
---

# Editor feature test

The post you're reading exists so we can sit next to each other and click
through every chip the editor can produce. Each section below lights up a
different bit of the WYSIWYG layer. Click the chip → the right-hand
**Properties** panel should flip to the matching editor.

## Inline ref variants (parks)

Three variants of the same park, side by side: [Phantasialand](ref:phantasialand?info),
the [bare](ref:phantasialand?bare) variant which has no annotation, and the
[full](ref:phantasialand?full) variant which hoists into a block card. Click any
of them — the Variant pills in the panel should switch between INFO / BARE /
FULL without dragging the other two along.

## Inline ref variants (rides)

[Taron](ref:phantasialand/taron?info) inline with location. Compare against
the bare form: [Taron](ref:phantasialand/taron?bare). And a different ride —
[Black Mamba](ref:phantasialand/black-mamba?info) — to make sure
disambiguation works when two chips reference the same park.

## Spotlight cards (?full)

These render as block-level cards thanks to the `?full` option. They should
each open the variant editor on click.

[Phantasialand](ref:phantasialand?full)

[Black Mamba](ref:phantasialand/black-mamba?full)

[Voltron Nevera](ref:europa-park/voltron-nevera-powered-by-rimac?full)

## Plain links

External: <https://arns.dev>. Mailto: <mailto:hello@park.fan>. Internal:
[the how-to page](/howto). And a YouTube link wrapped in markdown so it
stays inline: [the trailer](https://www.youtube.com/watch?v=dQw4w9WgXcQ).
Each of these should open the **Link** editor with the href field
pre-filled.

## Embeds (bare URL on its own line)

https://www.youtube.com/watch?v=dQw4w9WgXcQ

https://www.instagram.com/p/CzAbCdEfGhI/

https://suno.com/song/1b686ccc-85d3-465c-b69a-7eac1dbd5acb

## Images

A center-aligned image with caption and alt:

![park.fan banner | A festive park.fan cover image | center](/blog/images/welcome-cover.svg)

And a small right-aligned one inline with prose:

![Phantasialand Taron coaster | Taron on a quiet morning | right](/images/parks/phantasialand/taron.jpg)

## Widgets — single-slug

The classic park-info widgets. Each one should open as a "Widget" selection
in the panel with a single **Park slug** field.

```park-widget
slug: phantasialand
```

```weather-widget
slug: phantasialand
```

```map-widget
slug: phantasialand
```

```best-days-widget
slug: phantasialand
```

```stats-widget
slug: phantasialand
```

## Widget — attraction (two slugs)

The attraction widget takes both a park slug and a ride slug — the panel
should show two input fields.

```attraction-widget
parkSlug: phantasialand
slug: black-mamba
```

## Widget — gallery

Folder + heading:

```gallery-widget
folder: /blog/images/europa-park-voltron
heading: Phantasialand in pictures
```

## Widget — glossary

Pulls in the full definition of a glossary term:

```glossary-widget
slug: crowd-level
```

## Glossary auto-highlight in prose

Prose that mentions **wait time**, the **crowd level**, the **posted wait
time** and the **virtual queue** should auto-highlight matching glossary
terms when rendered on the published page. In the editor they stay as plain
prose — that's expected.

## Structural blocks

### Bullet list

- First item
- Second item with **bold** and _italic_
- Third item with `inline code`

### Numbered list

1. Open the Properties panel
2. Click a chip in the editor
3. Watch the inspector flip to the matching form

### Quote

> The whole point of this post is that every chip should be one click away
> from being editable. If anything below this line doesn't open the
> inspector on click, that's the bug.

### Divider

---

### Table

A `primary`-themed table — the header row should render tinted in both the
editor canvas and the published post. Click into a cell to get the table
menu with the palette picker.

<!--tbl-theme: primary-->

| Block kind        | Chip selector            | Inspector form        |
| ----------------- | ------------------------ | --------------------- |
| `?info` / `?bare` | `.ref-preview-badge`     | Ref variant + replace |
| `?full`           | `.ref-preview-spotlight` | Same variant editor   |
| `*-widget`        | `.widget-preview`        | Widget attrs form     |
| plain `<a>`       | `a[href]`                | Hyperlink href editor |

### Code block

```ts
// Not a widget — a real code block, should NOT open the widget editor.
console.log('hello from the editor');
```

### Callouts

GitHub-alert syntax — each renders as a coloured box in both the editor
canvas and the published post:

> [!NOTE]
> Useful context the reader shouldn't skip.

> [!TIP]
> Ride Taron first thing in the morning — the queue triples by 11:00.

> [!WARNING]
> Wait times in this post are historical; check the live page before you go.

And a plain quote for contrast, which must stay a quote:

> Theme parks are the closest thing we have to time machines.

## Wrap-up

If you got through this post and every chip lit up the right inspector
form, the editing surface is ready to ship for real posts. If anything
felt off, that's our next regression test.
