# A Parky box hands the reader one move (REQUIREMENT)

A post's `> [!PARKY]` box is Parky telling the reader the one thing he would do with the passage just
above it: which ticket, which day, which ride first, what to pack. Syntax, voice and the stamp are in
the [blog authoring guide → Parky says](../../content/blog/README.md#parky-says).

- **Every guide carries one** where a passage ends in a decision the reader makes, and **no post
  carries more than two**, the second only in a long guide with a clearly separate spot (another
  chapter, another season). A box that restates the paragraph above it, or that only fills a slot, is
  worse than none: leaving a post without one is a normal outcome.
- **It adds the move, not a fact.** Every figure in it is one the post states or park.fan's data
  shows; no wait minutes are typed
  ([a wait time is never typed into a post](a-wait-time-is-never-typed-into-a-post.md)). It goes
  after the passage it acts on: never as the opener or a section's summary, never inside a list or a
  table, and not between two paragraphs that open with a bold lead-in (`**Saisonkarte.** …`), where
  `check:prose` then reads the second lead-in as a maxim.
- **A stamp is a yes on one thing.** `> [!PARKY] Abendticket reicht`: a verdict on one ticket, day,
  ride or time, at most 18 characters, no `!`, written in each locale's own words. A tip without a
  yes or no stays a plain box. A verdict that names the thing beats one more „Lohnt sich“.
- **A planner link where the move is planning.** The day planner (`/trip-planner`) only for a park
  whose waits park.fan measures; the trip planner (`/orlando#planner`, `/paris#planner`,
  `/california#planner`, `/japan#planner`) in the guides of those regions. The site respells both
  per locale; the link text is the post's own word for the planner. At most one link a box.
- **News carries one only while the reader can still act on it**: an event running or ahead,
  tickets on sale, a season ahead. Never in news about an accident, an injury, a death, an
  evacuation, a lawsuit, a closure, politics or a company sale, and never inside an `[!UPDATE]` box
  or a `[!CORRECTION]` note. The box adds no fact to the report and contradicts none.
- **A box is not new content.** Adding one sets no `updatedAt`
  ([`updatedAt` is for new content](updated-at-is-for-new-content.md)) and is no news update; it
  ships in all six locales at the same spot, stamped and plain in the same order.

## Why

In November 2026 the 60 guides had six Parky boxes between them, although almost every guide
ends a chapter in a decision Parky could take for the reader. The Quick Pass news got the first
stamped tips, and a pass over every guide added one where a chapter asked for it: 66 boxes, 29 of
them stamped, 24 with a planner link. Two things went wrong on the way and are why the rule names
them. The first draft of a box repeated the paragraph right above it, so it said nothing new. And a
box between two bold lead-ins in the Hansa-Park guide made `check:prose` flag the next lead-in as a
maxim in four languages.

## Check

`pnpm test:blog-parky` (part of `pnpm test:unit`) fails a post with more than two boxes, a
translation group whose six files disagree on their boxes (count, stamped or plain, in order), and a
marker line that `parseParkyStamp` would not draw as a stamp or that carries `!` or `¡`.
`pnpm check:prose` reads the box text like the rest of the post.
