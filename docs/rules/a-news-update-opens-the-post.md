# A news update opens the post (REQUIREMENT)

The rule is for **news posts** (`category: news`) and for nothing else.

When something happens after a news post went live that changes what a reader should do (the ride
runs again, the park names a reopening date, an event is cancelled), the post gets a
`> [!UPDATE] YYYY-MM-DD` box **at the top of the body**, before the first paragraph, in all six
locales in the same pull request:

```md
> [!UPDATE] 2026-10-22
> Dønnervind is running again. Freizeitpark Plohn has taken the outage notice off its website.
```

- **The date goes on the marker line, ISO, and nowhere else.** `remark-callouts.ts` turns it into
  `data-callout-date`, and the box's label prints it in the reader's language: „Update vom 22. Oktober 2026“, "Update, 22 October 2026" (`blog.updateOn`). The text does not repeat it. A
  date that is not on the calendar is ignored (`parseUpdateMarker`), never thrown on.
- **The body below stays what was known on the post's date.** The update says what changed and
  names its source; the old paragraphs are not rewritten into the new state.
- **The listings show it.** The manifest records the newest update date (`updatedOn`, from
  `extractLatestUpdate` in `lib/blog/derive.mjs`), and every news listing draws `NewsUpdateBadge`
  in front of the headline: the header's news menu, `/news` and every `NewsRow`. Nothing else
  moves: news keeps its publication order, and it never gets an `updatedAt`.
- **A wrong fact is not an update.** That is a `[!CORRECTION]` at the end
  ([a news correction is shown, never silent](a-news-correction-is-shown-never-silent.md)).
- **A development big enough for its own headline is a new post**, not an update.

News posts carry no `— Patrick` signature. A news post is a report, not a column, and the
signature line pushed the end-of-post notes away from the text they belonged to.

## Why

On 21 October 2026 the post on Dønnervind being out of service went live; a day later the ride ran
again. The news went in as a `[!NOTE]` under the signature, labelled "NOTE", at the very bottom. A
reader who opened the post from the menu read four sections about an outage that was over before
reaching the line that said so, and a reader who had seen the first version had no way to tell from
the menu that anything had changed.
