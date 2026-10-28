# Homepage announcement band

The full-width band with a countdown that the homepage shows for a dated event (a season opening, a
launch). Open it before writing or scheduling an announcement.

`AnnounceSection` (`components/home/announce-section.tsx`, rendered by `app/[locale]/page.tsx`) reads
`content/home/announce.<locale>.md` through `getMarkdownContent()` (`lib/markdown.ts`, a path relative
to `content/`, `null` when the file is missing).

| Frontmatter         | Use                                                                                |
| ------------------- | ---------------------------------------------------------------------------------- |
| `countdownTo`       | the moment the flip clock (`FlipClockLazy`) counts down to; without it, no band    |
| `startAt`, `endAt`  | the window the band shows in, checked against the server's cached "now"            |
| `background`        | the photo behind the band, a path under `public/` (a leading `/public` is dropped) |
| `title`, `subtitle` | the band's heading lines                                                           |

The body is Markdown, rendered with glossary links (`GlossaryInject`); `[b]…[/b]` is read as bold.
The band renders nothing outside the `startAt`/`endAt` window or without `countdownTo`. Files exist
for en, de, nl, fr and es; Italian has none, so `/it` shows no band. How the photo is delivered:
[images](../development/assets.md#delivery-backgroundimageloader).
