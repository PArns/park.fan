# 5. Surfaces: news posts and blog posts

Part of chapter 5 of the [writing rules](README.md), the additions per surface: §5.0 for news posts
and §5.4 for every post, guides included. The general rules (§1 to §4) apply on top. The other
surfaces are in [5-site-copy.md](5-site-copy.md) (§5.1 to §5.3, §5.5 to §5.8) and
[5-9-commits-and-tickets.md](5-9-commits-and-tickets.md). Post syntax is in the
[blog authoring guide](../../content/blog/README.md).

## 5.0 News posts (`category: news`)

**Dates and languages**

- **`date` is the day the post goes live** (merge day, Europe/Berlin), not the day it was written.
  If the PR merges on a later day, correct `date` before the merge. `time` and the scheduling gate
  are in the [blog authoring guide](../../content/blog/README.md#2-frontmatter).
- **All six languages ship in the same pull request**
  ([the rule](../rules/a-post-ships-in-six-languages-in-one-pull-request.md)): German first, the
  other five derived from it (§6), with the same `translationKey`, `date`, `time`, `parkLinks`,
  `rideLinks` and `coverImage.src`. A later `[!UPDATE]` or `[!CORRECTION]` goes into all six too.

**Title, excerpt and cover**

- **The title carries one fact, in at most 60 characters.** Not `<Park>: <Fakt>, und <Pointe>` (a
  park-name prefix, a colon, a comma, „und", a trailing gag): seven of the first eight news titles
  had that shape, and it is what reads as generated. No list of three news items and no punchline
  in a subordinate clause. The park name is in the title when it is the subject. Two news titles in
  the same week may not share that template, and the same goes for `seo.title`; four plain
  subject-verb headlines in one week are fine. For the tone: „HalloWeekends in Cedar Point: Neues
  Diablo-Labyrinth", „Traumatica im Europa-Park wird zehn Jahre alt". Read every title aloud:
  newspaper headline, or line from an advert? `check:prose` warns on a title over 60 characters and
  on the template.
- **The core of the story fits one sentence a visitor would say to a friend**, with the park's name
  in it. Title and excerpt are written from that sentence, not from the ticket's title.
- **No cover image twice among news posts**; the check and the fallback are in
  [news is set apart from the articles](../rules/news-is-set-apart-from-the-articles.md#a-news-cover-image-is-used-once).

**The body**

- **The first sentence carries the news**: what happened, to what, when. No scene-setting
  paragraph in front of it.
- **Then the visitor's questions, in the order a visitor asks them**: what exactly, from when to
  when, what it costs, what the ticket covers, for whom, what is new about it, how to get there,
  when it is quieter. Context and links to the guides come after.
- **We write the news; we do not copy it out.** („Entweder schreiben wir die News oder schreiben
  sie ab! Dann brauchen wir keine eigene.“, Patrick.) An incident too is told in the post's own
  sentences, in the order it happened. The outlets it relies on stand once in the first paragraph
  and again in the `Quellen:` line, not in every sentence. What two independent sources carry is
  stated plainly. A sentence names its outlet only for a claim one source alone makes that blames a
  side, where sources contradict each other (both, with their owners), for a quote, and for a legal
  claim, which stays attributed in every sentence
  ([a quote names its source](../rules/a-quote-names-its-source.md)). Shipped:
  `Die Polizei kam in den Park, berichtet Omroep Flevoland. Auf den Videos versuchen Beamte demnach
… Laut NOS wollten sie …` Write: `Die Polizei kam mit vielen Beamten in den Park. Die Beamten
brachten die Gruppen auseinander.`
- `check:prose` warns (`news-outlet-attribution`) when a quarter or more of a news post's paragraph
  sentences, and at least eight, carry an outlet (`laut <Name>`, `berichtet`, `schreibt`,
  `heißt es bei`, `nach Angaben von`, `zufolge`, `demnach`, `according to`, `<Name> reports/says`,
  `volgens`, `selon`, `según`, `secondo` and kin), or when four do in one paragraph. A sentence
  about a lawsuit, a court or an investigation, a sentence that opens a quote with a colon and the
  `Quellen:` line do not count. The German draft of the Walibi post read 16 of 57; the published
  version 4 of 50.
- **A plain verb, not the drastic detail.** `mit Hunden und Schlagstöcken` came out of the same
  post as „zu reißerisch“. A detail of force, injury or damage stays only when it changes what
  happened or what a visitor should do.
- **A direct quote** is a `> [!QUOTE]` block with a linked source line
  ([a quote names its source](../rules/a-quote-names-its-source.md)).
- **Exact verbs for a gap.** `Einen Grund nennt die Mitteilung nicht`, not `steht … nicht`; what
  the police or the park withholds they `haben bisher nicht bekannt gegeben`, and an open cause
  `ist bis jetzt unbekannt` (§1.9). A gap that changes nothing for the visitor is left out.
- **No bridge sentence copied from the last post.** `Welche Tage in … die ruhigsten sind, zeigt der
Kalender.` stood in five news posts in one week. A widget needs no sentence introducing it; a
  link to the overview goes where a reader wants it, next to the prices or at the first comparison
  with another park.
- **About 400 words** (§0.1). A story that cannot fill them with sourced facts is not padded: it
  waits for more facts, or the PR carries the `Länge:` line and Patrick decides.

**The end**

- **A `Quellen:` line with links and no dates, and no signature.** No send-off before it (§1.6).
- A news post has no `updatedAt`, its tags start with `news`, and `seo.description` stays under
  155 characters. Later developments and corrections:
  [a news update opens the post](../rules/a-news-update-opens-the-post.md),
  [a news correction is shown](../rules/a-news-correction-is-shown-never-silent.md).

## 5.4 Blog posts

Everything above §5 applies, plus: **never type a wait time into a post**, and a sentence next to
a widget must not name a figure the widget renders
([the rule](../rules/a-wait-time-is-never-typed-into-a-post.md)). Articles matter: it is **das**
Efteling, like `das Toverland` and `das Phantasialand` (`zum Efteling`, `im Efteling`, never
`der Efteling` or `zur Efteling`).

**The excerpt and the meta description are the search snippet.** They carry the finding, in full
sentences and the words people search for, never the post's table of contents:
`Dazu die Bahnen im Gebäude von …, die Reiseplanung und die häufigsten Fragen.` became
`Überdacht sind im Toverland 21 von 44 Attraktionen, im Phantasialand 14 von 40 und in Walibi
Holland keine.` `check:prose` warns on `häufigsten Fragen`, `FAQ`, `Reiseplanung` and their twins
in either field.

**The excerpt is written last: three sentences at most, one finding each.** No count sentence, no
word from our database (`API`, `Einträge`, `führt einen Wert`, §2.19), no three facts chained with
commas and `und`, and no sentence the reader cannot say in one breath:
`Der Express Unlimited gilt nur in den Studios und den Islands of Adventure, der einfache Express
kostet dort 119,99 bis 319,99 Dollar, und die Mindestgröße der großen Bahnen liegt zwischen 1,22 und
1,38 Metern.` answers three questions at once. Two short sentences that each answer the reader's
question beat it; the other findings are what the post is for. The PR quotes the excerpt on an
`Auszug:` line, and the PO reads it aloud before the merge.

**A guide across many parks says each fact once.** The food guide of October 2026 listed the same
parks in its intro, its table, a section per park, a section on what the rulebooks share, a packing
section and eight FAQ answers, with the article numbers of each rulebook (`Ziffer 3.12`) in the
running text. The table answers the question for every park; a section per park adds what does not
fit in a cell, in the reader's words; a closing section that walks the parks again is a summary
block (§1.5). An article number belongs in the link, not in the sentence. A length floor is reached
with facts the reader needs, never with a second pass over the same ones.

**A catalogue is sorted one way.** The Alton Towers guide listed its rides twice, in a chapter of
firsts and a chapter of the rest, so a reader looking for Wicker Man had to know whether it counted
as a first. Sort rides by where they stand in the park, one subheading per area, and put the first
or the record into the ride's own paragraph. A heading that counts (`Fünf Mal …`) must match what is
under it; a count is the first thing to go wrong when a section is edited.

**An FAQ answer stands alone.** It is read without the post, in a search result or an answer
engine, so it never points elsewhere: `Zeitraum und Schwellenwerte stehen im Abschnitt ganz oben.`
and `die Tabelle weiter oben schlüsselt es nach Monaten auf` become the period, the threshold and
the two months that matter. Older guides still carry answers that point to `weiter oben` or
`the table above`; they are for the review pass. Because it stands alone, an answer of one sentence
with one figure may repeat the body's sentence word for word
(`Eine Tageskarte kostet online ab 39 €, an der Kasse 64 €.`); it may not copy a paragraph or read
a table row out again (`faq-echo`, `faq-table-echo`, §2.20).

**A single-park guide has one default order of chapters**, so a reader who has read one finds
their way in the next:

1. An intro of two or three paragraphs.
2. The rides, by area of the park, one subheading per area. A record or a first goes into the
   ride's own paragraph, the minimum heights into a list.
3. How full it gets: the widgets and rope drop.
4. When to go.
5. The fast pass.
6. A day in the park.
7. Tickets, parking, getting there and food, one subheading each.
8. Hotels.
9. History, with years and visitor numbers from pages opened for the post. Every guide has one.
10. The FAQ, the signature, then the source list. Nothing but those two comes after the FAQ.

A park whose story is the hook may open with its history; the PR says why the order changed. A
title passes when Patrick would understand it without knowing the post.

**A corrected fact in a guide moves `updatedAt` and gets no box.** `[!CORRECTION]` is for news
only ([the rule](../rules/a-news-correction-is-shown-never-silent.md)); a wording fix moves nothing
([`updatedAt` is for new content](../rules/updated-at-is-for-new-content.md)).
