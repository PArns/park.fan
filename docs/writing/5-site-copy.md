# 5. Surfaces: UI strings, captions, meta copy, glossary and changelog

Part of chapter 5 of the [writing rules](README.md), the additions per surface for everything that
is not a post: UI strings and FAQ answers (§5.1), `alt` and `caption` (§5.2), meta and template
copy (§5.3), machine-facing text (§5.5), a heading and the line under it (§5.6), the glossary
(§5.7) and the public changelog (§5.8). Posts and news: [5-posts-and-news.md](5-posts-and-news.md);
commits and tickets: [5-9-commits-and-tickets.md](5-9-commits-and-tickets.md).

## 5.1 UI strings (`messages/*.json`)

More than 2,000 strings per locale, on every page, read far more often than any post.

- **A label is a label.** `Entdecken`, not `Entdecke jetzt die Welt der Freizeitparks`. No
  marketing verb where a noun does the job.
- **No promise the app cannot keep.** `KI-gestützte Vorhersagen` is a description;
  `Die smarteste Art, deinen Parktag zu planen` is a slogan, and a slogan in a UI string is the
  surest way to make a product feel machine-written.
- **Empty states and errors say what happened and what to do**, in one sentence, with no apology
  performance and no exclamation mark: `Für diesen Park liegen keine Wartezeiten vor.` plus the
  reason.
- **The number goes in the string, the adjective does not.** `Ø 34 Min.` beats `relativ kurz`.
- German UI copy uses **du**, consistently, and the same term for the same thing everywhere
  (§2.6).
- **No chat register.** `Gerne!`, `Selbstverständlich!`, `Großartige Frage!`, `Of course!`: a
  product does not perform enthusiasm at somebody reading a wait time. `check:prose` fails on chat
  register in a catalog string, and the honesty family (§3.3 rule 1) is an error here, because the
  subject of a UI string is always us.
- New keys are added per [translations](../i18n/translations.md) and ship in all six catalogs
  (§6). `pnpm validate:translations` keeps the keys in sync; it says nothing about whether the
  German sentence is any good.

**FAQ answers are the most public prose we have**: they ship as `FAQPage` JSON-LD and as the
visible FAQ band in six languages. Answer the way `seo.faq.*` does: the number, the source, the
link (`seo.homepage.faq.liveDataA` names its three sources and says how disagreeing numbers are
reconciled). The register the homepage set had before it was rewritten:

- `Ja! park.fan bietet einen detaillierten Crowd-Kalender …` (chat warmth; "detailliert" is not a
  fact)
- `Absolut! park.fan ist vollständig responsive und funktioniert perfekt auf …` (two unbacked
  superlatives and a word a visitor does not use)
- `Unser Ziel ist es, jedem … den bestmöglichen Service zu bieten.` (survives the deletion test,
  §1.7)
- `deine zentrale Plattform für …` (positioning, not an answer)
- `… und viele mehr` (vague expansion; give the count and link the list)

`Ja.` is right for a yes/no question and a tell when every answer opens on it. An answer never opens
by repeating its question (`Wann ist der Park am leersten? Der Park ist am leersten, wenn …`);
`check:prose` compares each `…Q` key with the first sentence of its `…A` twin.

## 5.2 `alt` and `caption` (media sidecars)

Two jobs, and the second is not a longer version of the first. The sidecar format is in
[public/media/README.md](../../public/media/README.md#the-sidecar).

```jsonc
// no
"alt":     "The wooden Trojan horse in Toverland's Ithaka area, guests queuing in
            front of it against an autumn sky."
"caption": "Troy: the wooden coaster by GCI in the Ithaka area."

// yes
"alt":     "Das hölzerne trojanische Pferd, davor die Warteschlange."
"caption": "Troy im Themenbereich Ithaka, eine Holzachterbahn von GCI."
```

- **`alt`** is for somebody who cannot see the picture: one short factual sentence, what is in
  frame, in the order it matters. No mood, no atmosphere, no colour adjectives that carry no
  information, never `Bild von` / `image of` (the screen reader already said so).
- **`caption`** is printed under the photo for somebody who can see it, so restating the alt wastes
  the line. Say where, when, what happened, or a fact worth knowing. It may be dry, a joke, or one
  clause long.
- The tells are **structural and visible only across a set**: the same skeleton in every entry
  (subject, participle clause, `dahinter …`), an inventory of everything in frame, decorative
  adjectives (`bathed in`, `against a summer sky`, `nestled`), six captions in a row opening with
  the ride's name. Vary the shape between neighbours deliberately.
- **One joke is a caption; a series of jokes is a template.** The seven performer photos of the
  Halloween guide carried seven punchlines on one beat (`Clown plus Kettensäge: was soll da schon
schiefgehen?`). Keep the best one or two per series and let the rest say where the photo was taken
  or what the figure is. `check:prose` counts quips per collection directory (a colon into a
  lowercase fragment, a short second sentence, a one-word label sentence first, a question, a
  `nicht X, sondern Y`) and warns when more than 40 % of a series of five or more are quips.
- A queue series is not an essay: `man wartet nicht auf eine Bahn, man besichtigt ein Gehege` is
  §2.1 in a caption.
- Six locales are six sentences, not one sentence translated five times.
- `alt` and `caption` are plain-text fields (§4.5). The vocabulary rules and some sentence
  patterns of §2.20 run on every sidecar text.

## 5.3 Meta titles, descriptions and template copy

The highest-stakes surface and the one nobody re-reads, because it is generated: every park,
attraction and calendar page in six locales (about 45,000 ride URLs alone,
[sitemaps](../seo/sitemaps.md)). **One templated sentence is not one text but tens of thousands of
near-identical pages**, which is what Google's spam policy calls scaled content abuse, whoever
wrote it. A template is worth keeping only when it carries **per-entity facts** (the name, the
park, the number, the date), not adjectives true of every park:
`Wartezeiten für {ride} im {park}: aktuelle Werte, typische Zeiten nach Wochentag.` is fine;
`Erlebe die faszinierende Welt von {ride}` is the same sentence on every ride page. The FAQ and
structured-data blocks are prose too, and the most quotable text on our strongest pages; read them
like body copy.

## 5.5 Machine-facing text

`llms.txt`, the agent skills, the MCP tool descriptions and the feed metadata are read by people
too, when something breaks. Same rules, minus the voice: short, factual, no puffery, no
significance claims. `check:prose` reads the three published agent skills and `/llms.txt`.

## 5.6 A heading and the line under it

A section on the homepage opened like this, in six languages:

> **Mit Kindern** · Welche Bahnen darf mein Kind fahren? Nach Körpergröße nachsehen
>
> Jeder Park nennt pro Bahn eine Mindestgröße. Für diese Parks steht auf einer Seite, was ein
> Kind bei welcher Größe fahren darf, in den Stufen, die der Park selbst vorgibt.
>
> (card) Welche Bahn ab welcher Größe.

Six tells in four lines:

1. **A question, then an order.** `…? Nach Körpergröße nachsehen` is a button label glued to a
   question. A heading is one sentence or one noun phrase. Strong enough alone: `check:prose`
   fails on it in every language (a German infinitive at the end, or a call-to-action verb up
   front: `Check by height`, `Kijk het na`, `À vérifier`, `Comprobarlo`, `Da controllare`).
2. **The reader's voice.** `mein Kind` is the search box talking. The site says `du`; a heading in
   the first person imitates the query it wants to rank for.
3. **The dek repeats the heading.** Kind, Bahn, fahren and Größe twice, and the card a third time.
   The line under a heading says what the heading does not.
4. **Copy that describes the site.** `steht auf einer Seite` says where something is instead of
   what it is.
5. **The truism opener.** `Jeder Park nennt pro Bahn eine Mindestgröße` is true of every park and
   known to every parent (§1.7).
6. **The tacked-on qualifier.** `…, in den Stufen, die der Park selbst vorgibt` arrives after the
   sentence has ended, to fend off an objection.

Tells 2 to 6 are weak and turn up alone in good copy, so the check counts them per group of strings
(a heading and its siblings in `messages/*.json`) and warns when two meet. Rewritten, each line
says one thing:

> **Mit Kindern** · Ab welcher Größe dein Kind mitfahren darf
>
> Für jeden dieser Parks: alle Bahnen, sortiert nach der Mindestgröße, die der Park angibt.

The card line goes, or carries a figure the heading does not (how many rides at that park have a
height limit).

## 5.7 The glossary (`content/glossary/*.ts`)

309 terms in six languages, each with its own URL, and every `glossary-widget` fence in a post
prints a definition verbatim. In September 2026 it was the one surface where all of §1 and §2
could be found in one paragraph:

> Suspended Coasters sind seltener als Inverted Coasters, bieten aber ein einzigartiges Erlebnis.
> Die Schwingbewegung lässt selbst moderate Kurven dramatisch wirken, und das Gefühl des Fliegens
> erzeugt eine spannende Exposition. […] manche Enthusiasten lieben sie für ihre rohe,
> unvorhersagbare Natur, während andere sie weniger mögen.

Per 1,000 words, the English glossary against the English posts: participial tails (`, making`,
`, creating`) 1.0 against 0.01; `sensation`, `visceral`, `exhilarating` 1.5 against 0; `dramatic`,
`spectacular`, `intense` 1.4 against 0.02; `enthusiast(s)` as the owner of an opinion 1.4 against
0.06. The German file, translated from the English, had the same shapes plus translation debris (`dank ihrer starken Schaukästen` for _showpiece_, `navigiert durch Kurven`). A definition is
reference text, so it gets a stricter version of the rules:

- **What it is, how it works, one example with a place and a year.** `Ein Top Hat steigt senkrecht
auf und fällt auf der anderen Seite senkrecht ab. Red Force in Ferrari Land (2017) hat einen.`
  That is the whole job.
- **No feeling the reader has not had.** `einzigartiges Erlebnis`, `spannende Exposition` describe
  nothing; the physics does (`der Zug hängt am Scheitel zwei Sekunden kopfüber`,
  `negative G-Kräfte heben dich aus dem Sitz`).
- **No tail** (§2.3), **no crowd opinion** (§1.2), **no significance**
  (`einer der markantesten Achterbahntypen des letzten Jahrzehnts`, `das dramatische Herzstück`).
- **Each locale is written from the facts, not from the English sentence** (§6).
  `Hersteller … werden für ihre robuste Technik und ihren extremen Nervenkitzel geschätzt` kept
  the English skeleton and lost the German reader.
- A changed definition changes `GLOSSARY_CONTENT_HASH` and `GLOSSARY_CONTENT_DATE`
  (`lib/glossary/content-date.ts`); `pnpm check:glossary-content-date` prints the new hash.

`check:prose` scans the glossary per term and reports each rule with the term ids. It applies no
contraction budget there; a reference register is fine.

## 5.8 The public changelog (`content/changelog/`)

English only, and every sentence in it is about us, so the honesty family is an error there, as in
a catalog string. A list item never opens on bold (the chat layout of §4.2; `check:prose` fails on
it), and `title` and `summary` are plain-text fields (§4.5). A release note picks what a visitor
would notice and says it with the number behind it; which changes belong in one at all is
[a version is a unit of communication](../rules/a-version-is-a-unit-of-communication.md). The
collection's own format is in [content/changelog/README.md](../../content/changelog/README.md).
`pnpm check:changelog` runs the changelog half of `check:prose` in CI.
