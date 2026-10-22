# blog.md — the writing rules for every text on park.fan

This is the base rulebook for **prose a reader sees**, in every language and on every surface:
blog posts, UI strings in `messages/*.json`, `alt` and `caption` in the media sidecars, meta
titles and descriptions, glossary definitions, the guide page, landing bands, empty states,
error messages, push notification bodies, the feeds. If a human eye lands on it, it is covered.

It exists because of one hard requirement in [`CLAUDE.md`](../CLAUDE.md): **no text on this site
may read as AI-generated.** Not as a matter of taste. A reader who smells a language model stops
trusting the numbers next to it, and the numbers are the entire product.

**What slop is.** Merriam-Webster made it the word of 2025: "digital content of low quality that is
produced usually in quantity by means of artificial intelligence". For prose, Wikipedia's field
guide names the mechanism: a model "tends to regress to the mean; that is, the result tends toward
the most statistically likely result that applies to the widest variety of cases", and so "their
output will often tend toward advertisement-like writing, or like the prose of a travel guide". A
theme-park site is a travel guide. Every rule below is a way of putting back the specific fact
that the average sentence replaced.

The rules below are derived from the field guides that professional editors actually use to spot
generated text — Wikipedia's [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
and its German counterpart [Anzeichen für KI-generierte Inhalte](https://de.wikipedia.org/wiki/Wikipedia:Anzeichen_f%C3%BCr_KI-generierte_Inhalte),
plus the linguistics behind them (see [Sources](#sources)). Research was done for **German and
English first**, because German is our source language and the other five are derived from it.

Related, and narrower:

- [Blog authoring guide](../content/blog/README.md) — frontmatter, `ref:` links, live widgets,
  and the post-specific rules (never type a wait time into a post).
- [`public/media/README.md`](../public/media/README.md) — the sidecar format for `alt`/`caption`.
- [Translation system](i18n/translations.md) — how message keys get added and validated.

---

## 0. Read this before you start deleting words

Two caveats, both from the people who wrote the field guides, and both matter:

**Detectors do not work, and neither do you.** GPTZero and its kind have non-trivial error rates,
and humans asked to sort AI text from human text perform at close to chance. So this document is
a **writing** guide, not a detection guide. Never accuse a text of being generated because it
trips one item here. A single sign is noise; a text is only in trouble when several land at once.

**Some signs are strong enough on their own.** The humanizer skill (see Sources) splits its list
in two, and we follow it. A **strong** tell is fixed on sight: the aphoristic closer (§2.8),
`nicht X, sondern Y` at the edge of a section (§2.1), an honesty or authenticity claim (§3.3), an
invented detail or a placeholder (§1.8), a disclaimer that names nobody (§1.9), a heading that
asks and then gives an order (§5.6). The em dash (§4.1) is banned as house style, not as a tell:
the model this site is written with dropped from 12.9 to 0.05 per 1,000 words between two
versions (Arize, September 2026).
Everything else is **weak**: a transition word, a triad,
a short sentence, a rhetorical question. A weak tell matters only when several sit in the same
passage.

**Over-correction is its own failure mode.** These are ineffective indicators — do not mangle a
text to dodge them:

| Not a tell                        | Why                                                                                                                                                                                            |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Perfect grammar                   | Plenty of people write clean prose. Do not add errors to look human.                                                                                                                           |
| Formal or "academic" register     | The correlation is with _specific words_, not with formality as such.                                                                                                                          |
| A transition word                 | `Außerdem` / `Additionally` once is normal writing. It is the mechanical repetition that reads generated.                                                                                      |
| One em dash in an English text    | Measured: humans average 3.23 per 1,000 words, GPT-5.4 answers with 1.43. It is the weakest tell on this page. (We still ban it, for the reason in §4.1 — house style, not a detection claim.) |
| A three-part list                 | One per section is rhetoric. Three per section is a tic.                                                                                                                                       |
| Mixed casual and formal registers | That is how a lot of people write, especially in a technical field.                                                                                                                            |

The rule of thumb underneath everything else: **generated prose is confident, even, and empty.**
Human prose has uneven paragraph lengths, an opinion, a number it had to go and look up, and at
least one thing the writer noticed that nobody asked for.

### 0.1 What has to stay when the slop goes

Almost everything below is a list of things to take out. Applied alone, it takes the jokes out
with the slop, and the post ends up correct and flat. On 2026-09-22 a full pass over every post
came back exactly that dry, and Patrick's answer was „die Beiträge sollen sich mit Humor lesen,
nicht langweilig“. So four things are goals of their own, and a pass that removes one of them has
over-corrected: the bar, humour, voice and length.

**The bar.** A post is done when a person enjoys reading it and every number in it is right. A
green `pnpm check:prose` is the floor, not the finish.

**Humour.** About one smile every three or four paragraphs of a post, most of them in the intro and
at the start of a chapter, and inside a paragraph rather than at its end: the wink budget of §2.17
counts last sentences only. What works here: understatement, an everyday comparison that claims no
measurement, self-irony, the reader's real situation, a callback to something earlier in the post.
Two lines to calibrate against: „eher ein Hörspiel mit Selbstbedienung“ and „ungefähr so
verbindlich wie ein Neujahrsvorsatz“. A heading may be funny as long as it still names what is
under it (§4.3). What stays banned is the joke the rules below name: the pun for its own sake, the
exclamation mark, the emoji, the maxim at the end of a section (§2.8), the wink at the end of
every paragraph (§2.17), a comparison that pretends to be a measurement (§1.8). Keep the joke that carries a fact; cut the
one that only decorates.

Humour has a place, and not every text has one. A news post about an accident, an injury, a
lawsuit or a death carries none. UI strings, meta descriptions, `alt` texts and commit messages have
no humour target; a caption may carry one joke (§5.2). A joke does not survive translation word for
word: each locale writes its own or keeps the fact plainly (§6).

**Voice.** First person where Patrick did or thinks something, `du` for the reader, a verdict where
the reader wants one (§1.3). The two German posts to read for tone, not to copy chapter by
chapter: `content/blog/de/toverland-troy-wartezeiten-tipps.md` and
`content/blog/de/phantasialand-tipps.md`.

**Length.** Patrick does not want short posts („Blogbeiträge bitte nicht zu kurz halten“,
2026-10-04). Counted with `wc -w` over the German file below the frontmatter, the way the PR's
`Länge:` line reports it; a table or a widget counts, which is why one added to reach the floor is
padding like any other:

| Post type                                     | Floor        |
| --------------------------------------------- | ------------ |
| Single-park guide                             | ~4,000 words |
| Overview, ranking, multi-park or season guide | ~3,500 words |
| Behind the scenes, posts about park.fan       | ~1,500 words |
| News                                          | ~400 words   |

The floor applies when the ticket does not mention it, and an update to an existing post has none.
Length comes from facts the reader needs: a number, a name, a date, a widget, a ride the post
skipped. It never comes from a second pass over the same facts (§5.4), an intro to the intro or a
closing summary (§1.5). When the material runs out, nobody pads: the PR says `Länge: <n> Wörter,
Untergrenze <n>, es fehlt: <was>` and Patrick decides. The critic (§7.2) rewrites a weak sentence
rather than cutting it, so a review never pushes a post under its floor.

---

## 1. Substance — the tells that are about what you say

### 1.1 Never inflate significance

The single most consistent observation across thousands of flagged Wikipedia articles: generated
text reads like promotional copy. It reaches for legacy, symbolism and broader trends where a
person would state a fact and move on.

| Don't                                         | Do                                            |
| --------------------------------------------- | --------------------------------------------- |
| `Taron steht wie kaum eine andere Bahn für …` | `Taron hat 2016 eröffnet und läuft 1,25 km.`  |
| `spielt eine zentrale Rolle im Parkerlebnis`  | `ist die einzige Bahn mit zwei Launches`      |
| `unterstreicht die Bedeutung von`             | cut the sentence                              |
| `marks a pivotal moment for the park`         | `was the park's first new coaster since 2009` |
| `stands as a testament to`                    | cut                                           |
| `hinterlässt einen bleibenden Eindruck`       | say what a rider actually notices             |

**Canned notability** is the 2025 form of it. Wikipedia lists `independent coverage`,
`trade publications` and `cited/featured/profiled in` as phrases that "hit readers over the head
with claims of notability". Ours would be `vielfach ausgezeichnet`, `preisgekrönt`, `in zahlreichen
Medien`, `award-winning`, `consistently ranked among`. An award has a name and a year, or it is not
in the sentence.

Nothing on this site "reflects a broader trend". A ride is a ride, a queue is a number of
minutes, and a park is a place with opening hours.

### 1.2 Every claim carries its evidence, or it goes

A superlative without a number or a source next to it is cut. Not softened — cut.

- `der beste Woodie Europas` → `54 Minuten Median, damit die längste Schlange im Park`
- `renowned for its atmosphere` → say who says so, or drop it
- `Studien zeigen`, `Experten sind sich einig`, `Branchenberichte`, `viele Beobachter` → name the
  study, the expert, the report, or delete the sentence. Vague authority is a weasel construction
  and it is one of the loudest tells there is.
- Thin data is stated as thin: `an vier gemessenen Tagen im Februar`, not a rounded average
  presented with the confidence of a full month.
- **An opinion needs an owner.** `Enthusiasten lieben die rohe Natur`, `gilt als eine der
intensivsten`, `enthusiasts prize ejector airtime`, `is widely regarded as` hand a taste to a
  crowd nobody can ask. Wikipedia calls it a vague attribution of opinion; on this site it is the
  glossary's favourite sentence: on 2026-09-30 the German file said `Enthusiasten` 49 times in
  32,000 words, the German posts 5 times in 94,000. Name who said it (a poll with its year, a
  reviewer with a link, the manufacturer's own brochure), say it yourself under the byline, or
  describe what happens in the seat and let the reader decide whether they would like it.
  `pnpm check:prose` flags the pattern.
- **Our own guide is not the evidence.** `so steht es in unserem Guide zum Park`, `as our guide to
the park says`: a claim that cites our earlier post cites nobody a reader can check. Name the park
  or the operator who said it, and link our guide where the reader wants more. The rain guide said
  it in all six languages until 2026-10-06; `pnpm check:prose` flags the shipped forms.

Where the evidence comes from:

- **Researched, not remembered.** Every year, name, price and figure comes from a page opened for
  this post, on the day of the PR; our own figures come from the API through a widget (§5.4). A
  translation takes the facts of the German file and opens nothing new. Patrick's words: „richtig recherchiert, nicht irgendeinen BS aus
  deinem Memory“. For prices, opening hours, events, the fast pass and travel the park's own page
  comes first; when it disagrees with another source, the park's page wins and the PR names the
  conflict.
- **A claim the park did not make itself needs two independent sources:** an accident, a
  lawsuit, a record the RCDB does not list, a visitor count from anyone but the park or its
  operator. A history chapter gives the visitor count where it has that source, and says nothing
  about it where it does not. Another theme-park blog is never a source, and trade press without the
  park's confirmation is not stated as confirmed. What cannot be sourced is cut, not hedged:
  `voraussichtlich`, `angeblich` and `Gerüchten zufolge` do not stand in for a source.
- **A spec is stated, not attributed.** Height, length, speed, manufacturer, opening year, number
  of trains and minimum height are facts with a link in the source list, not news with a speaker
  (Patrick, 2026-10-13). Not `Laut Six Flags ist die Bahn 61 Meter hoch. Die Strecke ist laut RCDB
rund 1.366 Meter lang.` but `Der Hyper Coaster ist 61 Meter hoch, die Strecke rund 1.366 Meter
lang.` The same goes for a table header. A sentence names its source for an event (an accident,
  an injury, its cause), a quote, a forecast, or when two sources disagree. Ride figures come from
  the RCDB; where the park's own figure differs (Silver Star: 130 km/h by the park, 127 by the
  RCDB), both stand in the sentence with their owners, because parks round and measure in different
  places ([the rule](rules/a-ride-figure-comes-from-the-rcdb.md)).
- **Silence is silence.** A park rulebook that says nothing about glass bottles has not allowed
  them. Write `In der Parkordnung steht nichts zu Glas`, never the permission it did not give.
- **Do not price what is not sold.** `ResortPass Silver für 325 €`, three words before `verkauft der
Europa-Park derzeit nicht`, hands the reader a price they cannot pay.
- **Nobody else's words.** A competitor's text is a hint that a topic exists, never a sentence to
  copy or paraphrase. A press release's adjectives stay in the press release: `ikonisch` in a
  park's statement is paraphrased, not quoted into the post.
- **Words with a legal meaning keep it.** `Werktag` is Monday to Saturday, and so is the Italian
  `feriale` ([the rule](rules/werktags-is-monday-to-saturday.md)). Monday to Friday is `Mo–Fr`,
  `Montag bis Freitag` or `unter der Woche`. A post that needs the word for Monday to Friday
  defines it once, where it first uses it (`Werktage, also Montag bis Freitag ohne Feiertag`), or
  sets it against the weekend in the same sentence. The Spanish `día laborable` includes Saturday
  too and is checked like the other two; the French `jour ouvré` is Monday to Friday and right.

### 1.3 Have a verdict

Both-sides hedging with no conclusion (`einerseits … andererseits`, `es kommt darauf an`,
`may vary`) is what a model produces when it has no opinion. The byline is a person. If the
answer is "it depends", say what it depends on and then say which way you would go.

### 1.4 No self-reference, no structure announcements

The text never talks about itself, its chapters, its thesis, or how it is organised.

- `Und jetzt der Grund, warum dieses Kapitel hier steht` → just write the paragraph
- `Kommen wir nun zu`, `In diesem Abschnitt` → delete
- `Hier steht, wie …`, `Was hier steht`, `Unten stehen zuerst die Termine` → say it, or name the
  table it is in (§3.3, rule 18)
- `die These dieses Artikels` → name the claim instead
- `Es ist wichtig zu beachten, dass X` → `X`. The importance is shown by the sentence existing.
- `Als langjähriger Freizeitpark-Fan …`, `As a long-time coaster fan, I …` → the byline already
  says who writes. Say the thing.
- `Das ist für Reisende aus Mitteleuropa die nützlichste Information des ganzen Beitrags`, `the
most useful line in this guide` → the post grading its own sentences. Put the fact where it is
  found first and let it carry itself. It stood in the Alton Towers guide of 2026-10-11 in six
  languages; `pnpm check:prose` fails on the shape in all six.
- `Wer davon noch nichts wusste, soll es nicht erst an der Warteschlange erfahren.` → the author
  explaining why a section exists. The section is there; that is the explanation.

### 1.5 No summary blocks

`Zusammenfassend lässt sich sagen`, `Abschließend`, `Insgesamt`, `Fazit`, `In conclusion`,
`Overall`, `In summary`, `Key takeaways`. A closing section that repeats what the reader just
read is a scientific-paper convention that generated text applies to everything. Our posts end on
a fact or on the signature.

**The take-home section** is the same block with a byline: `## Was ich dir für Staffordshire
mitgebe`, `What I'd take away from Staffordshire`, `Ce que je retiens de Soltau`. Three guides
closed that way on 2026-10-11, and every one restated the post and ended on a maxim (`Dass
vierzehn Überschläge in Reihe möglich sind, war 2013 eine Frage, die sich noch niemand gestellt
hatte.`, which is also wrong). The reader of a guide stops after the FAQ or after the part they
came for; nothing in such a section is new to them. End on the FAQ and the signature. `pnpm
check:prose` warns on the heading in six languages.

### 1.6 No "challenges and future outlook"

`Trotz dieser Erfolge steht der Park vor mehreren Herausforderungen …` followed by vague
optimism. If there is a real problem, name it with a date and a number; otherwise there is no
paragraph here.

The news version is the **send-off**: `Man darf gespannt sein.`, `Es bleibt spannend.`, `The future
looks bright.`, `Exciting times ahead.` It ends a post on a mood because the facts ran out. End on
the last fact, or on what is not yet known and who could say (§1.8).

### 1.7 The sentence that claims nothing

This is the heart of it, and the reason the vocabulary lists in §3 are the least important part
of this document. Generated prose is **fluent and empty**: every sentence is well-formed, the
paragraph flows, and afterwards the reader cannot name one thing they now know. Word-level
editing cannot fix that, because there is no wrong word — there is a missing fact.

Two tests, both mechanical, both faster than arguing about style:

- **The deletion test.** Cut the sentence. Did the paragraph lose information? If not, it was
  filler — and a text where more than a third of the sentences survive deletion is not a text.
- **The transplant test.** Would the sentence sit unchanged in an article about a different park,
  a different product, a different industry? Then it says nothing about this one. `Ein Besuch
will gut geplant sein.` fits every park, every museum and every airport in Europe.

The five shapes it comes in:

| Shape                   | Looks like                                                                                | What to do                                           |
| ----------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Pseudo-wisdom**       | `Am Ende des Tages kommt es auf die richtige Balance an.` · `The key is finding balance.` | Delete. There is no shorter version.                 |
| **Empty contrast**      | `Es geht nicht um die Wartezeit, es geht um das Erlebnis.` where "Erlebnis" is undefined  | Delete the first half, then define the second or cut |
| **Vague intensifier**   | `spielt eine maßgebliche Rolle` · `has a significant impact` · `sehr wichtig`             | Put the number there, or drop the sentence           |
| **Manufactured stakes** | `Das Thema gewinnt zunehmend an Bedeutung.` · `Something real is happening here.`         | Say what changed, when, by how much                  |
| **Tautology**           | `Wie voll es ist, hängt vom Andrang ab.` · `Wait times vary by day.`                      | Only worth writing with the next clause attached     |

Twenty German openers of this kind are catalogued by WortLiga, and every one of them fits: `Seit
jeher …`, `In der heutigen Zeit …`, `Es ist allgemein bekannt, dass …`, `Studien zeigen, dass …`,
`Mehr denn je ist es entscheidend, dass …`, `Die Zahlen sprechen für sich`, `Ein nicht
unerheblicher Teil …`, `Die Tendenz ist steigend`. What they share is that the sentence after
them would have been fine on its own.

**Hedges are the same failure in a smaller package.** `in gewisser Weise`, `im Grunde`,
`letztlich`, `tendenziell`, `durchaus`, `in many ways`, `arguably`, `it could be argued`. Written
by a person, a hedge marks real uncertainty and belongs in the sentence. Written by a model, it
is an apology for a claim it did not check. Ours name what is uncertain instead: not `die Zahl
ist tendenziell höher` but `die Zahl steht auf 13 gemessenen Tagen`. One hedge is often honest;
the tell is the **stack**: `kann unter Umständen möglicherweise`, `könnte eventuell`, `could
potentially`, `might arguably`. `pnpm check:prose` flags the stacks, not the single word.

**Business verbs promise motion and deliver none.** `optimieren`, `ermöglichen`, `begleiten`,
`abholen`, `revolutionieren`, `transformieren`, `skalieren`, and in English `leverage`, `unlock`,
`empower`, `streamline`, `navigate`, `elevate`, `utilize`. Each has a plain twin that says more:
`utilize` → `use`, `ermöglicht dir, X zu tun` → `du kannst X tun`, `optimiert deinen Parktag` →
`spart dir vierzig Minuten Anstehen`.

**And so do abstract nouns used as subjects.** `Effizienz`, `Komplexität`, `Innovation`,
`Qualität`, `Vielfalt`, `das Erlebnis`, plus the spatial family this industry loves — `die Welt
der Freizeitparks`, `Landschaft`, `Reise`, `Ökosystem`, `landscape`, `journey`, `space`,
`ecosystem`, `tapestry`. A ride, a queue, a park and a visitor can all be the subject of a
sentence; `die Vielfalt` cannot do anything.

### 1.8 Never invent what somebody had to live, count or say

Generated text fills a gap with a plausible detail, and a plausible detail is the most expensive
lie a post can tell, because the reader has no way to see it. The anti-ai-slop-writing ruleset
(see Sources) puts it plainly: fabricated specificity is worse than honest vagueness.

- **No invented first-person experience.** The byline is Patrick. `Ich bin X2 dreimal gefahren`
  is written when it happened, never to make a paragraph feel lived. A post written without a
  visit says where its knowledge comes from.
- **No hypothetical dressed as a memory.** A scenario says it is one: `Angenommen, du stehst um
zehn am Eingang`.
- **No invented number.** A figure has a source or a measurement next to it (§1.2), and an
  estimate says it is one.
- **No invented comparison.** `vierzehn Überschläge auf der Fläche einer Turnhalle` measured
  nothing: nobody had compared the footprint of the Smiler with a sports hall. A comparison is
  as much a figure as a number and needs the same source.
- **No invented or tidied quote.** Somebody's words stay theirs, translated faithfully, marked as
  translated and linked to where they were said
  ([a quote names its source](rules/a-quote-names-its-source.md)). Reported speech is fine; a
  sentence in quotation marks that nobody said is not.

What cannot be checked is left out. A gap in a news post becomes a sentence saying what is not
known (`Six Flags sagt nicht, ob X2 abgerissen wird`), and that sentence is information.

The same rule forbids **placeholder text**: `[Park Name]`, `2026-xx-xx`, `XX Minuten`, `TBD`,
`(Add link here)`. `pnpm check:prose` fails on them in every file it reads.

### 1.9 A gap has an owner

The generated version of the sentence above is the **disclaimer that names nobody**: `Genaue
Angaben sind nicht öffentlich dokumentiert.`, `Basierend auf den verfügbaren Informationen …`,
`While specific details are limited …`, `not widely disclosed`. Wikipedia lists disclaimers about
knowledge cutoffs and source availability among the signs of a chatbot's answer. The difference
from ours is one word: who. `Six Flags sagt nicht, ob …` names the party that is silent, and a
reader can go and ask. `nicht öffentlich dokumentiert` names nobody and cannot be checked.

---

## 2. Sentence shape — the tells that survive a vocabulary pass

Swapping banned words is the easy half. What actually marks a text as generated is its rhythm,
and rhythm survives find-and-replace. Every item here is measurable in a finished text.

### 2.1 Negative parallelism

The most recognisable cadence in both languages.

- German: `nicht nur X, sondern auch Y` · `es geht nicht um X, sondern um Y` ·
  `X ist kein Y, sondern ein Z`
- English: `not just X, but Y` · `it isn't X — it's Y` · `Y rather than X`
- Dutch `niet alleen … maar ook`, French `non seulement … mais aussi` and `ce n'est pas …, c'est …`,
  Spanish `no solo … sino`, Italian `non solo … ma anche` and `non è …, è …`, and the tourism
  formula of every language: `Non è un hotel, è un'esperienza.`

Advice is not a reframe: `Donnerstag, Freitag oder Sonntag, nicht Samstag` and `Nimm dir eine
Stunde, nicht zwanzig Minuten` tell the reader what to do and stay.

In 2026 the English shape has moved from `not just X but Y` to the **contrast reframe**, `It isn't
a queue, it's a waiting room`, which Arize counted as one of the six habits of the model this site
is written with. Same fix: say the second half and drop the first.

Two or three in a long post is normal writing. Eight is a machine. Budget: **at most one per
1,000 words**, and never as the opening or closing sentence of a section, where it does the most
damage. Check with `grep -c "sondern"`.

### 2.2 The rule of three

`kompakt, begehrt und anstrengend`. `sowohl … als auch … und`. Three adjectives, three bullet
points, three chapters, three examples. Models reach for triads to make a superficial analysis
look complete. **One per section is fine; two is already a pattern.** Where a list has three
items because reality has three items, keep it — the tell is the triad used as rhythm.

### 2.3 Participial clauses

Instruction-tuned models use present participial clauses at **2 to 5 times** the human rate
(Reinhart et al., PNAS 2025). In German, the Partizip I as an adverbial is rarer still and reads
translated:

- ❌ `Der Park öffnete um 10 Uhr, damit den Andrang verteilend.`
- ❌ `…, hervorhebend, wie gut die Bahn ausgelastet ist.`
- ❌ `…, ensuring visitors can plan ahead.` · `…, highlighting the park's popularity.`
- ✅ Two sentences, or a `weil`/`sodass` clause, or nothing.

Grep for `end,` at the end of a German clause and for `, ensuring` / `, highlighting` /
`, reflecting` / `, showcasing` / `, contributing to` in English.

**The tail.** The commonest form of it is a clause hung on a finished sentence to say what the
fact _does_: `…, making it the tallest in Europe`, `…, creating a moment of weightlessness`. German
has no participle for it and uses `was`: `…, was den Nervenkitzel des Manövers erheblich
steigert`, `…, was den Typ zu einem der markantesten Achterbahntypen macht`. The other four have
their own (`, ce qui rend`, `, créant`, `, lo que convierte`, `, creando`, `, il che rende`,
`, wat … creëert`). The tail almost always carries an evaluation the sentence before it could not
support, which is why it reads as a sales pitch even in a definition.

Measured on 2026-09-30: 1 tail in the 95,000 words of the English posts, **39** in the 38,000 words
of the English glossary, and the same share in its five translations (fr 40 terms, es 35, it 29,
nl 17, de 12). Budget: one per 1,000 words. End the sentence, or make the effect its own sentence
with a subject: `Der Zug hängt dabei zwei Sekunden kopfüber.`

### 2.4 Nominal style

The same study finds nominalisations at 1.5–2× the human rate. German makes this easy to do by
accident: `die Durchführung einer Optimierung der Wartezeitenberechnung`. Use verbs.
`Die Wartezeit wird jetzt anders berechnet.`

### 2.5 Copula avoidance

Models dodge plain `ist`/`is`, reaching for `stellt … dar`, `fungiert als`, `dient als`,
`serves as`, `boasts`, `features`, `functions as`, `holds the distinction of being`. Human
Wikipedia prose, measured over 25 years, uses the plain forms far more. So do we.

`Troy ist eine Holzachterbahn.` Not `Troy stellt eine Holzachterbahn dar.`

### 2.6 Consistent terminology, not elegant variation

Older models were penalised for repetition and learned to rotate synonyms: `Wartezeit` →
`Anstehzeit` → `Queue-Dauer` → `Wartedauer` in four consecutive sentences. Pick the term the
product uses and repeat it. Repeating a noun is not a style error; rotating it is a tell.

### 2.7 Vary the shape

- **Paragraph length must be uneven.** A two-line paragraph next to an eight-line one is what
  real writing looks like. Uniform blocks are a generation artefact.
- **Vary sentence openings.** Three paragraphs starting with `Und` or `Das ist` reads like
  autocomplete.
- **Do not pivot every paragraph on a colon.** `Behauptung: Erläuterung` is a fine list
  introducer and an exhausting paragraph rhythm. The pivot that reads generated withholds:
  `Acht davon sind Überlebende: Piratenfiguren aus der alten Anlage`, `Ganz harmlos ist die
Saison seit diesem Jahr nicht mehr: …`, `2027 geht es früher los: …`. The clause before the
  colon is a trailer for the sentence after it. Say the sentence: `Acht Piratenfiguren aus der
alten Anlage von 1987 sind restauriert worden und sitzen heute in einem Rettungsboot.` Measured
  on 2026-09-30: 11 such pivots per 100 sentences across the German posts, 16 to 21 in the three
  busiest. `pnpm check:prose` counts them per sentence and warns above 15; a colon that
  introduces a list, a date stamp (`Stand:`) or sits inside a name (`Guardians of the Galaxy:
Cosmic Rewind`) is not counted, and French colons after a no-break space are. After the pass of
  2026-09-30 the medians were 6.5 (de) to 12 (fr) per 100.
- **Do not stack transitions.** `Darüber hinaus`, `Zusätzlich`, `Außerdem`, `Ferner`,
  `Additionally` — one is normal, one per paragraph is mechanical.
- **Do not build every paragraph from the same parts.** Topic sentence, explanation, example,
  transition, four paragraphs in a row, is the template showing through. Start one with the
  number, let one be a single sentence, let one stop without a bridge to the next.
- **Do not introduce two widgets with the same line.** `Wie die Bahnen im Gebäude heute stehen:`
  stood above two widgets of the rain guide, and the six park sections opened with the same
  `<Park> in <Ort> hat <Jahr> eröffnet`. A widget with a heading of its own needs no line in front
  of it. `pnpm check:prose` warns when one paragraph ending on a colon occurs twice in a post (a
  date stamp like `Stand 6. Oktober 2026:` is exempt).

### 2.8 The aphoristic closer

The tell that survives every other pass, and the one that has shipped here most often: a short,
symmetrical, abstract sentence parked at the end of a post, a section or a landing band,
restating what was just said as a maxim. It carries no information. It exists to sound like an
ending.

Real examples that shipped and had to be pulled:

| Shipped                                          | Why it fails                                                |
| ------------------------------------------------ | ----------------------------------------------------------- |
| `Sie ist nicht die Antwort. Sie ist die Frage.`  | Antithesis, and a queue turned into philosophy              |
| `Such dir einen Park und lies eine Zahl.`        | Two imperatives with a symmetrical beat, no new information |
| `Das ist die ganze Geschichte in einer Tabelle.` | Restates the section                                        |

**The test:** cover the last sentence and re-read. If only a _feeling of closure_ is lost, it was
decoration. Three endings that work: the concrete next action with its specifics; a fact not yet
stated (a caveat, a number, a date); or nothing at all — a section is allowed to just stop.

### 2.9 What still separates the two, now that the obvious tells are gone

The Economist ran its own journalism through ChatGPT, Claude, Gemini and Grok and compared 1.2
million words across 55,940 sentences against its writers, CNN, the NYT, the Washington Post and
novels from 1950 to 2022. The em dash came out even. What did not:

- **Latinate and scientific vocabulary** where a plain word exists: `signifikant`, `Parameter`,
  `Methodik`, `Interdependenz`, `Reindustrialisierung`. German has the same split — `nutzen` over
  `zur Anwendung bringen`, `Wartezeit` over `Wartezeit-Parameter`.
- **Nominalisation and long words**, which §2.4 already bans. This is the second finding pointing
  at it, from a different corpus.
- **Sparse punctuation**, and this one is counter-intuitive: model prose uses **fewer** commas,
  fewer semicolons and almost no parentheses. The correction is not "add commas" but "write the
  aside you would have written" — the parenthesis is missing because the thought is missing.
- **Long sentences inside dense paragraphs**, with `und`/`and` doing the joining where a full
  stop belongs.
- **`nicht X, sondern Y`** — the same construction as §2.1, found independently.

Two of those are countable, and worth counting on a finished text:

| Metric                                    | How                              | Signal            | Our German posts     | Our English posts    |
| ----------------------------------------- | -------------------------------- | ----------------- | -------------------- | -------------------- |
| **Sentence-length variance** (burstiness) | `stdev(sentence lengths) / mean` | under 0.4 is flat | **0.57** (0.43–1.25) | **0.59** (0.41–1.37) |
| **Commas per 100 words**                  | `count(',') / words × 100`       | thin under ~4     | **8.2**              | **6.4**              |

Both are supporting signals, never verdicts: a short reference text can be flat for good reasons,
and under 40 sentences one merged sentence moves the figure across the line, so the check only
warns on posts that long.
But a long post under 0.4 is a post where every sentence came out the same length, and that is
worth a read-aloud pass before it ships. `pnpm check:prose` prints both (§7).

Measured on 2026-09-30, after the pass over every post. Until that day the script cut every
German date in two (`27. | September`) and counted the halves as sentences, which is why the German
figure once read 0.71; and it counted the source list at the end of a post as one sentence of a
hundred words, which pushed every locale's mean to about 1.0. Neither was the prose.

### 2.10 Staccato

Three very short sentences in a row: `Die Bahn ist zu. Für immer. Das war's.` It reads like an
advert, and it is what a model writes when it wants punch; the anti-ai-slop-writing ruleset calls
it parataxis and bans it. One short sentence after a long one is rhythm. Three in a row is a tic.
Connect them with what relates them: `weil`, `aber`, `sodass`, a comma. Not a semicolon in German
or French, where practitioners list the academic semicolon as a tell of its own; the Economist's
finding that models use _fewer_ of them (§2.9) was measured on English.

`pnpm check:prose` flags three sentences of five words or fewer in a row inside one paragraph.
Lists and quotations are left out, because a list item is not a sentence and a quotation keeps
its speaker's rhythm. Its first run on 2026-09-30 found the Dutch and French versions of a joke in
the Halloween guide and three rhetorical questions in a row in the Italian stroller post. Both are
for a person to judge.

### 2.11 The passive that hides who did it

German news writing uses the passive for good reasons: `Die Bahn wurde 2002 eröffnet` needs no
actor. The tell is the passive that leaves out an actor the text knows: `Es wurde entschieden,
die Bahn zu schließen` when Six Flags decided, `Es wird berichtet` when AP reported. Name who did
it.

In anything legal the hidden actor is worse than a style fault, because it turns one side's
claim into a fact. `Die Verletzungen wurden durch die Bahn verursacht` is a verdict nobody has
reached; `Die Kläger führen die Verletzungen auf die Bahn zurück` is the report
([a quote names its source](rules/a-quote-names-its-source.md)).

### 2.12 The question set-up

`Das Ergebnis? Ein voller Park.` · `The reason? …` A question the text answers itself one word
later is a slide transition, not a question. stop-slop bans every sentence that opens with a
question word, which is too blunt for German, where `Wann` and `Wie` open plenty of honest
sentences. We ban the set-up. Ask a question only where the reader would ask it; three rhetorical
questions in a row are a triad (§2.2). `pnpm check:prose` flags `Das Ergebnis?`, `Der Grund?`,
`Die Antwort?`, `Der Haken?` and their English twins, and a heading that asks and answers in one
line (`Sind 70 Minuten viel? Kommt drauf an, ob Dienstag ist`) as a candidate.

The set-up also comes folded into one sentence: `Offen bleibt, welche Bahnen an so einem Tag noch
lohnen, und das sind zuerst die im Gebäude.` Nothing was open; the sentence answers itself after
the comma. Write the answer: `An so einem Tag lohnen sich in der Regel die überdachten
Attraktionen.` `pnpm check:prose` flags `Offen bleibt, welche …, und das …` and its five twins
(`What's left open is which …, and`, `Reste à savoir quelles …, et`); `Reste à savoir si la
question est recevable.` stays open and is not a hit.

### 2.13 Things that talk, and the product as protagonist

**A queue shows nothing, a number says nothing, and a calendar knows nothing.** `Was die
Warteschlangen gerade jetzt anzeigen`, `Welche Tage die ruhigsten sind, zeigt der Kalender`, `weil
die Daten sagen, dass ich ihn nicht brauche`, `Was verrät die Wartezeit-Historie wirklich?`, `die
Karte verschweigt das nicht`, `the data says`, `the numbers tell a different story`. Each hands a
person's verb (sagen, zeigen, verraten, wissen, verschweigen, schweigen, lügen) to an object, so that the
sentence sounds like a scene instead of a statement. Write what is there and where: `Die
aktuellen Wartezeiten stehen auf der Parkseite, alle fünf Minuten neu.` `Im Kalender sind die
ruhigsten Tage grün.` `Nach unseren Messungen brauche ich ihn nicht.` A display or a board that
literally shows a figure is fine (`Am Eingang stehen 70 Minuten`, §3.3), and so is a legend, one of
our own tables or widgets, or a UI element that marks something on screen (`Der blaue Kegel zeigt, wohin du schaust`, `Die
Rahmenfarbe zeigt den Andrang an`); the queue itself never announces anything.

Data and time do it too: `Die Daten belegen das nicht`, `ein anderes Jahr verteilt das anders`,
`les données ne le prouvent pas`. Say who cannot prove it (`Belegen kann ich das mit diesen Zahlen
nicht`) and what another year may bring (`2027 kann das ganz anders aussehen`).

The travel-guide version is **false agency**: `Der Park lädt zum Verweilen ein`, `Die Bahn sorgt
für Nervenkitzel`, `the ride promises`, `delivers thrills`. Say what a visitor does or gets.
`pnpm check:prose` flags both families.

**The product as protagonist** is the same move with our own software as the subject:

`Der Planer kennt die Öffnungszeit`, `Der Planer fragt zwei Dinge`, `Der Planer liest das als`,
`ist dem Planer lieber`, `der Planer erfindet keine`: 27 times on the planner page. A feature
written as a character that knows, asks, prefers and refuses turns an explanation into a
portrait of the software. Say what the reader sees or does, or what the number is: `Ein Block
rastet auf fünf Minuten ein`, `Du gibst an, wie groß die kleinste Person ist`.

The planner page read 8.8 per 1,000 words; `pnpm check:prose` warns above 6. The two compass posts
are over it as well.

**A document does no sums.** `Eines davon rechnet durch, was passiert, wenn der Ententeich
verschwindet` closed the excerpt of a news post on 2026-10-01, in all six languages. The report it
meant examines the effects of filling in a pond; it does no arithmetic, and the verb turned one
line of a tender into a cliffhanger. The same move with a page or a tool as the subject: `Der
Europa-Park-Guide rechnet das nach`, `Der Tagesplaner rechnet den Tag durch`, `rekent de widget
hierboven dagelijks uit`, `the planner works out whether the day adds up`. Say who did the sums
(`habe ich nachgerechnet`, `rechnen wir`) or what the document examines and where the result is.
`rechnet … durch` and the five translations of _calculates what happens if_ (`works out what
happens`, `rekent uit wat er`, `calcule ce qui se passe`, `calcula qué pasa`, `calcola cosa
succede`) are an error in `pnpm check:prose`; a guide, page, calendar, widget, report or the planner
as the subject of `rechnen`, `calculate` or `work out` is a warning. A forecast model computing a
forecast is arithmetic and stays (`Das Modell rechnet diesen Tag stundengenau`), and so does a
person (`ich habe das durchgerechnet`).

### 2.14 Saying what it does not do

A negation is information when the reader expected the opposite: `Für den Hansa-Park kommt nie
eine Zahl an`. A text that keeps answering objections nobody raised (`Die Antworten markieren und
blenden nichts aus`, `Ein Verbot ist das nicht, und eine Freigabe auch nicht`, `Eine Regel über
den frühen Morgen steckt darin nicht`) argues with a reader who has not said anything. Say what
happens instead.

The German posts sit at a median of 1.2 negations per 100 words; the planner page read 2.8. The
check warns above 2.

The loudest form is the **pledge about a gap**: `Wir wissen dort nicht, welche Bahnen unter Dach
liegen, und füllen die Lücke nicht mit Annahmen.`, `Die Lücke liegt in unserer Datenbank und hat
mit den Parks nichts zu tun.` Nobody asked us to guess, and the reader did not need the gap at all
(§2.19). `pnpm check:prose` flags it in six languages.

### 2.15 The definition colon

`Typisch heißt: …`, `„Knapp“ bedeutet: …`. One definition is useful. Four on one page are a
glossary written as prose. Put the meaning into the sentence that uses the word, or link the
glossary term. The check warns above two per text.

### 2.16 The teaser

A sentence that tells the reader how to feel about the next one: `Dann wurde es kurios.`, `Und
dann das Wichtigste.`, `Interessanter ist, was rundherum steht.`, `Die Zahlen dazu sind fast schon
komisch.`, `Here's where it gets interesting.`, `The best part?` It is the self-reference of §1.4
one level down: not the text announcing its structure, but a paragraph announcing its own payoff.
A person who has something odd to report reports it, and the reader decides whether it is odd.

The colon version is the **set-up label**: `Das Beste:`, `Kurz gesagt:`, `Der Clou:`, `Die gute
Nachricht:`, `Pro-Tipp:`, `Spoiler:`, `Pro tip:`, `Bottom line:`, `Here's why:`. A heading made of
two words and a colon, in the middle of a paragraph.

The counting version is the **count announcement**: `Drei Einschränkungen gehören dazu.`, `Zwei
Einordnungen aus unseren Guides.`, `Three limitations come with it.` A sentence that says how many
caveats follow is a heading in disguise. Start with the first caveat. `pnpm check:prose` warns on a
sentence of up to seven words that counts caveats, notes or remarks; `Drei Dinge noch:` in front of
a list is the same habit in five posts and left to the review pass.

The expectation version is the **expectation teaser**: `und keine davon ist die, die man
erwartet`, `die Unterschiede sind größer, als die Preise vermuten lassen`, `than you might think`,
`plus long qu'on ne le pense`. It tells the reader they are about to be surprised, which is the
reader's call, and in the Alton Towers guide of 2026-10-11 it was also untrue: the list it
introduced held Nemesis Reborn, the ride everybody expects. `pnpm check:prose` warns on the shape
in six languages. The ordinal version of the count announcement (`Ein zweiter Grund kommt dazu.`,
`There's a second reason.`) is counted with the others.

Cut the teaser and start with the fact. If the fact is not remarkable without the announcement,
the announcement was covering for it. `pnpm check:prose` flags the common forms in German and
English; the quieter ones (`Die Schienen waren das Problem.`, `Das Voletarium fällt aus der
Reihe.`) are fine when the next sentence explains them at once and a tell when every paragraph
opens that way. On 2026-09-30, 27 % of the German paragraphs of three or more sentences opened on
a sentence of eight words or fewer.

### 2.17 The wink

The aphoristic closer of §2.8 has a sibling that does not sound like a maxim, and so gets past
the test for one: the **wry last line** of a paragraph. `Wer Holzachterbahnen mag, merkt das ab
dem ersten Drop, und sein Rücken spätestens in der ersten Kurve.` `Ein Möbelhaus mit Probesitzen,
nur eben für Achterbahnen.` `(Irgendwer muss die Churros ja frittieren.)` Each is fine alone. The
tell is the rate: in the German posts on 2026-09-30, 23 % of all paragraphs of three or more
sentences ended on a short sentence after a long one, and in the three busiest posts a third of
them did. A text that winks at the end of every paragraph is performing a personality.

Three shapes carry most of it and are worth grepping for:

| Shape                     | Looks like                                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **The appended verdict**  | `…, und genau das ist die Aussage.` · `…, und das ist vermutlich Absicht.` · `…, and that's the point.`              |
| **No X, no Y, just Z**    | `Kein Bildschirm, kein Projektor, seit 1952 einfach Mechanik.` · `No animatronics, no soundtrack, just …`            |
| **The verbless fragment** | `Elf Papierkörbe mit Sprachausgabe.` · `Zweiter Zugwechsel in sechzehn Jahren, für eine Bahn, die 43 Jahre alt ist.` |

Budget: one wink per section, and never two paragraphs in a row. Keep the one that is funniest or
that carries a fact the paragraph did not; turn the rest into the fact they were decorating, or
stop the paragraph a sentence earlier. `pnpm check:prose` flags the first two shapes; the third
and the rate are for the review pass (§7.2).

A long catalogue section (a dozen rides under one heading) may carry one per five paragraphs. The
verbless fragment means the wry line that closes a paragraph; a spec fragment (`Mindestgröße 100
Zentimeter.`, `Zwei Züge zu je zwanzig Plätzen.`) is information and stays.

### 2.18 The register of the model that writes here

The vocabulary lists in §3 were built from GPT-era studies. This site is written with Claude, and
each model has its own idiolect (Rudnicka & Juzek 2026). Arize measured six habits in Claude's
prose in September 2026 and named them. Four are covered elsewhere: signposts are the teaser
(§2.16), contrast reframes §2.1, gotcha framing the question set-up (§2.12), and verdict
intensifiers (`the honest answer is`, `die ehrliche Antwort`) the honesty family (§3.3). The other
two:

- **Salience flags**: telling the reader that something matters instead of showing why. `This
matters.`, `Das ist wichtig, weil …`, `a fact worth internalising`, `deserves a moment`.
- **Stock metaphors**: `load-bearing`, `earns its keep`, `earns its place`, `der Knackpunkt`,
  `die Falle ist`, `verdient sich seinen Platz`, `tragende Rolle`.
- Two adverbs that are fine alone and a tic in bulk: `quietly`, `genuinely` (`still`, `wirklich`).

The same rules govern commit messages and PR bodies (CLAUDE.md). An edit summary that reads
`refined for clarity and consistency while preserving the structure` is the Wikipedia example of
a generated one; say what changed.

### 2.19 The database instead of the park

A post written from a query result keeps the query's words. The rain guide of 2026-10-06 was
built that way, and Patrick read its excerpt three times without understanding it:

> An Regentagen sind die Headliner in zwölf von zwölf ausgewerteten Parks kürzer besetzt als an
> trockenen Tagen gleicher Art, im Movie Park fast ein Drittel, im Disneyland Paris kaum. Dazu die
> Bahnen im Gebäude von Europa-Park, Phantasialand, Efteling, Movie Park, Plopsaland und Heide
> Park, die Reiseplanung und die häufigsten Fragen.

Every phrase in it is a habit with a name, and the body had all of them again:

| Habit                                      | Shipped                                                                                                                                                                         | Write                                                                                                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Our schema as vocabulary**               | `Einträge`, `bei jedem hat der Park einen Wert`, `38 von 39 Einträgen führen einen Wert`, `Jede Attraktion kann drei Werte tragen`                                              | `Attraktionen`, `überdacht`, `im Freien`. A reader has never seen our table.                                                                                                     |
| **The field name read aloud**              | `Bahnen im Gebäude`, 30 times: the enum `indoor`                                                                                                                                | the word the reader searches and the UI shows: `überdacht`, `Indoor-Bahn`, `in der Halle`                                                                                        |
| **The gap reported instead of left out**   | `Bei neun der 37 wissen wir es noch nicht: …`, a list of nine parks without data, a column „Noch ohne Angabe“, `Wo ein Strich steht, fehlt uns die Angabe.`                     | leave it out. Name a gap only where the reader would otherwise draw a wrong conclusion, once.                                                                                    |
| **A comparison against an unnamed bucket** | `trockene Tage gleicher Art`, `Tage derselben Gruppe`, `Gruppen aus Monat, Wochenende oder Feiertag und Schulferien`                                                            | say what is compared, with an example: `Einen verregneten Ferien-Samstag im Juli vergleichen wir mit trockenen Wochenend- und Feiertagen im Juli, die auch in den Ferien lagen.` |
| **A verb that does not fit its noun**      | `die Headliner sind kürzer besetzt`, `die Headliner lagen unter dem Niveau trockener Tage`, `Der Regen stammt aus den Tageswerten`, `Mystery Castle fällt im Inneren des Turms` | the wait is shorter, the rainfall figures come from Open-Meteo, the gondola falls                                                                                                |
| **A genitive chain**                       | `der Durchschnitt der gemessenen Wartezeiten über die Headliner des Parks, auf fünf Minuten gerundet`                                                                           | `wie lange man an seinen Headlinern im Schnitt anstand`                                                                                                                          |
| **A circular definition**                  | `Als Headliner führen wir die Bahnen, die nach der Historie der Wartezeiten dazugehören.`                                                                                       | `Headliner sind die Bahnen, an denen in einem Park am längsten angestanden wird.`                                                                                                |
| **A calque**                               | `Ein verregneter Samstag steht gegen trockene Wochenendtage` (_stands against_)                                                                                                 | `vergleichen wir mit`                                                                                                                                                            |
| **The elliptical series**                  | `im Movie Park fast ein Drittel, im Disneyland Paris kaum`: shorter by what, or what is a third?                                                                                | `im Movie Park um fast ein Drittel kürzer`                                                                                                                                       |
| **`X von X`**                              | `in zwölf von zwölf ausgewerteten Parks`                                                                                                                                        | `in allen zwölf Parks` (§3.3, rule 13)                                                                                                                                           |

The test is the reader's question. Somebody looking for a park on a rainy Saturday asks which
rides are under a roof and whether it is emptier; a sentence that answers neither and is about
our records goes. The same test settles the SEO question, because the reader's words are the
search words: nobody types „Freizeitpark Bahnen im Gebäude“, and „überdachte Attraktionen“ is
what the park page's filter says.

`pnpm check:prose` counts the schema words per post in six languages and warns above four per
1,000 words (the rain guide read 18 in German; no other German post reached two), warns on
`gleicher Art`, `derselben Gruppe`, `of the same kind` and `van hetzelfde soort`, and fails on
`kürzer besetzt` and on `X von X` in all six languages. The genitive chain, the circular
definition, the calque and the gap reported where it changes nothing are for the review pass.

### 2.20 Twenty patterns the check did not know (2026-10-13)

_Patterns 1 to 21 came from the twelve open guides, 22 to 39 from the critic's pass over the 27 older ones (PR #928) the same evening, 40 to 47 from its two passes over the thank-you post of 2026-10-19 (PR #946), 48 to 82 from the critic's findings over the seven guides of 2026-10-22 (PAR-984 to PAR-990)._

On 2026-10-13 the critic of §7.2 read twelve park guides that had all passed `pnpm check:prose`
and marked every one of them as machine-written. The patterns below came up in several guides,
and the sentences are the ones it quoted. Each is a shape a writer may use once; the tell is the
series. `pnpm check:prose` warns on all of them and fails on none, so a published post never turns
`main` red. The rule names are what the critic cites as `check:prose: <rule>`; the code is
`scripts/prose-slop-patterns.mjs`, the cases are `pnpm test:prose-rules`.

| #   | Rule                         | The pattern                                                                                                                                                                                                                                   | Quoted                                                                                                                   | Fires at                                    |
| --- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| 1   | `origin-refrain`             | The same sentence about where the data came from closes several sections.                                                                                                                                                                     | `Eine Seite von Universal, die das bestätigt, konnten wir nicht abrufen.` · `fehlt die Angabe bei 48 von 55`             | 2 closing sentences                         |
| 2   | `heading-triple`             | Headings that are a chain of three, often after `X:`.                                                                                                                                                                                         | `Express Pass: Pakete, Preise, Zeitfenster` · `Mindestgrößen, Begleitperson, Metalldetektor`                             | 3 headings                                  |
| 3   | `name-colon-subheading`      | A run of `Name: epithet` subheadings (§4.3).                                                                                                                                                                                                  | `Hugin und Munin: das Duell` · `Vikingløp: Kopf voraus`                                                                  | 4 headings                                  |
| 4   | `handoff-object-first`       | A paragraph ends on a sentence that hands the reader to another document, with the object put first.                                                                                                                                          | `Den Preis für deinen Tag nennt der Park im Buchungsablauf.` · `Der Winter-Überblick vergleicht das mit anderen Parks.`  | 2 paragraphs                                |
| 5   | `indirect-question-subject`  | An indirect question as the subject in front of `steht in`.                                                                                                                                                                                   | `Welcher Preis für deinen Tag gilt, steht im Kalender des Ticketshops.`                                                  | 2 sentences                                 |
| 6   | `widget-announcement`        | A paragraph ending in a colon directly above a widget fence, in changing words (§2.7 catches only identical lines).                                                                                                                           | `Wie die Warteschlangen über den Tag wachsen:` · `Die ruhigsten kommenden Tage:`                                         | 2 paragraphs                                |
| 7   | `conditional-opener-series`  | `Wer …, …` / `If you …` opening sentence after sentence.                                                                                                                                                                                      | `Wer mit Kindern unter 120 cm kommt, … Wer ohne Auto kommt, …`                                                           | 11 per post, or 3 in a paragraph            |
| 8   | `catalog-connector-series`   | `Dazu kommt`, `Und es gibt`, `There's also`, `Then there's` as the way to add the next item.                                                                                                                                                  | `Dazu kommt Luna, 2023 eröffnet.` · `Und es gibt die Lisebergbanan.`                                                     | 6 sentences                                 |
| 9   | `attribution-opener-series`  | `Laut Park`, `Der Park nennt`, `The park says` opening sentences within one chapter.                                                                                                                                                          | `The park calls Katun …` · `The park says 110 km/h`                                                                      | 3 in a chapter                              |
| 10  | `travel-imperative-close`    | An imperative about the trip closing a paragraph.                                                                                                                                                                                             | `Prüfe sie dort, bevor du fährst.` · `Check the calendar before you travel.`                                             | 2 paragraphs                                |
| 11  | `tautological-because`       | The same verb in the main clause and in the `weil` clause.                                                                                                                                                                                    | `Ein zweiter Tag lohnt sich vor allem mit Kindern, weil sich Futuropolis dann den ganzen Tag lohnt.`                     | 1 sentence                                  |
| 12  | `excerpt-announces-post`     | The excerpt or the description announces the post (§1.4) where it should say something.                                                                                                                                                       | `Hier steht, an welchen Tagen …` · `Dieser Beitrag zählt auf, …` · `This guide covers …`                                 | 1 sentence                                  |
| 13  | `count-announcement-opener`  | A paragraph opens on a short sentence that counts what follows (§2.16).                                                                                                                                                                       | `Drei Bahnen stehen im Bereich.` · `Es gibt drei Pakete.`                                                                | 2 paragraphs                                |
| 14  | `data-caveat-close`          | A paragraph about a number of measured days ends on the reservation.                                                                                                                                                                          | `das ist zu wenig für eine Aussage` · `too few to say anything`                                                          | 1 paragraph                                 |
| 15  | `double-attribution`         | Two sentences in a row carry the same attribution formula.                                                                                                                                                                                    | `nach Parkangabe … Laut Park …`                                                                                          | 1 pair                                      |
| 16  | `range-before-enumeration`   | A range whose two ends the next sentences list again.                                                                                                                                                                                         | `Die Annual Passes kosten zwischen 64 und 299 £.` over a list of passes                                                  | 1 range                                     |
| 17  | `definition-before-glossary` | A definition in the paragraph above a glossary widget for the same term.                                                                                                                                                                      | `Rope Drop heißt, dass du …` above `glossary-widget`                                                                     | 1 paragraph                                 |
| 18  | `source-silence-close`       | What the source does not say, as the end of a sentence (§1.9).                                                                                                                                                                                | `nennt der Park nicht` · `, nicht auf der Seite des Parks`                                                               | 3 sentences                                 |
| 19  | `widget-caption-after`       | A paragraph under a widget that says what the widget shows.                                                                                                                                                                                   | `In der Tabelle steht für jede Bahn …` · `Im Kalender stehen …`                                                          | 1 paragraph                                 |
| 20  | `table-summary-before`       | A paragraph above a table or widget that says what the table shows.                                                                                                                                                                           | `Die Tabelle fasst zusammen, …` · `The table lists …`                                                                    | 1 paragraph                                 |
| 22  | `bet-opener`                 | The first paragraph opens on a wager.                                                                                                                                                                                                         | `X ist eine Wette darauf, dass …` · `is a bet`                                                                           | 1 sentence                                  |
| 23  | `mirrored-good-bad`          | One paragraph holds both halves of a mirrored pair.                                                                                                                                                                                           | `ist gut, wenn …` and `ist schlecht, wenn …`                                                                             | 1 paragraph                                 |
| 24  | `appended-reason`            | A clause tacked on to the end of a sentence to name the reason.                                                                                                                                                                               | `, und das ist der Grund` · `, which is exactly the reason`                                                              | 2 sentences                                 |
| 25  | `appended-advice`            | A clause tacked on to the end of a sentence to hand out advice.                                                                                                                                                                               | `, was man sich überlegen sollte` · `, which is worth thinking about`                                                    | 2 sentences                                 |
| 26  | `link-sentence-close`        | A reference sentence with an internal link closes paragraph after paragraph.                                                                                                                                                                  | `… steht im [Winter-Guide](/blog/…).` four times, one link sentence twice, or four chapters closing on a bare link       | 4 paragraphs, or any repeat                 |
| 27  | `widget-announced-twice`     | The widget is announced in words each time, or the choice is announced before it.                                                                                                                                                             | `Das Widget zeigt …` · `Aus diesen sechs Bahnen würde ich …`                                                             | 2 sentences, or 1 pick line                 |
| 28  | `how-teaser`                 | A `Wie …` clause that promises an answer and gives it in the next breath.                                                                                                                                                                     | `Wie voll es wird, zeigte sich am Samstag.` · `Just how full it gets became clear.`                                      | 2 sentences                                 |
| 29  | `bold-step-labels`           | Paragraphs in a row that open on a bold step word.                                                                                                                                                                                            | `**Zuerst** …` · `**Dann** …` · `**Zum Schluss** …`                                                                      | 3 paragraphs in a row                       |
| 30  | `own-post-as-proof`          | Our own post cited as the evidence for a claim.                                                                                                                                                                                               | `wie in unserem Beitrag steht` · `as our guide says`                                                                     | 2 sentences                                 |
| 31  | `advice-who-series`          | `Wer X, fährt Y` as the shape of the advice, sentence after sentence.                                                                                                                                                                         | `Wer früh kommt, fährt zuerst Taron.` · `If you arrive early, go to Taron.`                                              | 4 sentences                                 |
| 32  | `not-found-close`            | A paragraph closing on what the author did not find.                                                                                                                                                                                          | `nicht gefunden` · `nicht ablesen` · `couldn't find`                                                                     | 2 paragraphs                                |
| 33  | `day-night-mirror`           | The first or last sentence of a paragraph sets day against evening.                                                                                                                                                                           | `Tagsüber … abends …` · `By day … in the evening …`                                                                      | 2 sentences                                 |
| 34  | `looks-different-colon`      | `X looks different:` as the lead-in to a colon.                                                                                                                                                                                               | `sieht anders aus:` · `is another matter:` · `es otra historia:`                                                         | 2 sentences                                 |
| 35  | `riddle-title-fraction`      | A title or heading that teases with a fraction.                                                                                                                                                                                               | `zur Hälfte` · `half of` · `à moitié` · `per metà`                                                                       | 1 title or heading                          |
| 36  | `question-catalog-opener`    | A sentence that lists three things the reader wants to know before the trip.                                                                                                                                                                  | `will vorher wissen, ob …, ob … und ob …`                                                                                | 1 sentence                                  |
| 37  | `empty-faq-answer`           | The answer under a question heading says nothing: a few words with no figure, or `verschieden`.                                                                                                                                               | `Das ist verschieden.` · `It varies.` · `Depende.` (a bare yes or no is an answer)                                       | 2 answers                                   |
| 38  | `bold-maxim`                 | A whole short sentence set in bold at the edge of a paragraph, with no figure and no link.                                                                                                                                                    | `**Wer früh kommt, wartet kürzer.**`                                                                                     | 1 sentence                                  |
| 40  | `origin-circle`              | The start of the story brought back to close a circle, or the same beginning told again and again.                                                                                                                                            | `wo das alles angefangen hat` · `where it all began` · `angefangen` six times in 850 words                               | 1 formula, or 4 and 3 per 1,000             |
| 41  | `thanks-either-or`           | A thank-you that takes in every reader with `ob … oder …`.                                                                                                                                                                                    | `Danke euch allen, ob ihr … aufgemacht habt oder jeden Morgen …` · `Thank you all, whether you … or …`                   | 1 sentence                                  |
| 42  | `imagined-reader-tour`       | `Manche …, andere …`: readers the author imagines, each handed a feature link, or a hedged third one.                                                                                                                                         | `Manche sitzen … auf dem Sofa …, andere planen … Ein paar stehen vielleicht in Orlando`                                  | 1 paragraph                                 |
| 43  | `feeling-close`              | Paragraphs that end on the author's own feeling.                                                                                                                                                                                              | `Damit hätte ich nie gerechnet.` · `hat mich gefreut` · `Für sie baue ich jeden Abend …`                                 | 3 paragraphs                                |
| 44  | `disappoint-teaser`          | The disappointment announced before its reason (§2.16).                                                                                                                                                                                       | `und da muss ich enttäuschen` · `I have to disappoint you`                                                               | 1 sentence                                  |
| 45  | `bridge-apposition`          | `…, genau die X, in denen …` hung on a finished sentence to reach the next paragraph.                                                                                                                                                         | `drei Wochen, genau die Wochen, in denen es Herbst geworden ist`                                                         | 1 sentence                                  |
| 46  | `contact-form-phrase`        | The lines of every contact form.                                                                                                                                                                                                              | `Feedback ist immer willkommen` · `Jede Nachricht lese ich selbst.` · `öfter …, als ich zugeben möchte`                  | 1 sentence                                  |
| 47  | `filler-adverb-pileup`       | One filler adverb again and again (§2.18): `gerade`, `inzwischen`, `eigentlich`, `wirklich`.                                                                                                                                                  | `gerade` five times in 850 words                                                                                         | 4, and 4 per 1,000 words                    |
| 48  | `faq-echo`                   | An FAQ answer copies the running text or the excerpt: half its words sit in a shared run of eight, or one sentence of 12+ words matches a body sentence almost word for word. An answer of one sentence with one figure may repeat it (§5.4). | `Die Höhe gilt für den höchsten Punkt der Strecke über dem Boden, die Fallhöhe für die längste Abfahrt.` in text and FAQ | 2 answers                                   |
| 49  | `faq-table-echo`             | An FAQ answer reads out a table column: five of its figures from three rows or more, and three quarters of all its figures; dates and numbers in names do not count.                                                                          | `the One Shot at Mirabilandia at €5.90, the One Shot at Thorpe Park at £6 …`                                             | 1 answer                                    |
| 50  | `table-cells-in-prose`       | The paragraph above a table names four cells of one column, an intro names the first and the last row, or the paragraph above a list names three of its entries; a paragraph with a count the table lacks is a summary and stays.             | `Quick Pass, Express Ticket, Speedy Pass, Fastrack und Premier Access` over the „Name“ column                            | 1 paragraph (first and last row: 2)         |
| 51  | `fact-refrain`               | A figure with the three words after it in three sections (excerpt and chapters; FAQ, dates and measurements left out).                                                                                                                        | `an allen 365 Tagen im Jahr` in excerpt, intro and chapter                                                               | 3 sections                                  |
| 52  | `preposition-name-opener`    | `Im/Bei <Name>`, `At/In/For <Name>` opening most sentences of a paragraph, three paragraphs in a row, or a fifth of all paragraphs; the name must be a park or ride the post links, and the FAQ is left out.                                  | `Im PortAventura Park … Im Gardaland … Bei Walibi Belgium …` · `At Europa-Park … At Efteling …`                          | 1 paragraph or run                          |
| 53  | `origin-tour`                | `Aus Italien …`, `From Spain …` opening sentence after sentence, outside the travel chapter.                                                                                                                                                  | `Aus Italien hält der Eurocity-Express … Aus Spanien fliegst du …`                                                       | 1 paragraph or run                          |
| 54  | `recomputed-difference`      | A comparative whose figure is the difference of two figures in the same paragraph or table.                                                                                                                                                   | `Der Ultimate ist also 3 € billiger` after 80 € and 83 €                                                                 | 1 sentence                                  |
| 55  | `verdict-opener`             | A section opening on a scoreboard line or a short superlative.                                                                                                                                                                                | `Paris wins on shows` · `Der Parc Astérix hat die meisten Ticketarten.`                                                  | 2 sections                                  |
| 56  | `among-them-series`          | `darunter`, `among them`, `tra cui` in front of a list of names, again and again.                                                                                                                                                             | `among them Balder, Helix, Valkyria and …`                                                                               | 4 per post                                  |
| 57  | `closing-refrain`            | Paragraphs closing on the same words, or on what one need not buy or cannot book.                                                                                                                                                             | `braucht dafür keinen Pass` · `, und reservieren lässt sich keiner.`                                                     | 3 paragraphs                                |
| 58  | `cost-per-duration`          | A price set against the length of the ride.                                                                                                                                                                                                   | `für die gut zwei Minuten Fahrt nennt der Park Kosten von 50 Millionen Euro`                                             | 1 sentence                                  |
| 59  | `mirrored-park-intro`        | Two paragraphs in a row open on `<Park> in <Ort> … eröffnet`.                                                                                                                                                                                 | `Der Europa-Park in Rust hat am 12. Juli 1975 eröffnet …` / `Das Efteling in Kaatsheuvel …`                              | 1 pair                                      |
| 60  | `appended-source`            | The source tacked on to the end of a sentence.                                                                                                                                                                                                | `…, so steht es auf seiner Website.`                                                                                     | 2 sentences                                 |
| 61  | `never-had-like-it`          | Novelty claimed instead of named.                                                                                                                                                                                                             | `Efteling has never had a ride like it.`                                                                                 | 1 sentence                                  |
| 62  | `verdict-close-series`       | Chapters that end on the author's pick.                                                                                                                                                                                                       | `… würde ich das Abendticket des Europa-Parks nehmen.`                                                                   | 3 chapters                                  |
| 63  | `spec-sheet-chain`           | A paragraph of sentences that each pair a manufacturer with a year, or the builder formula again and again; a history chapter needs five.                                                                                                     | `Taron von Intamin fährt seit 2016 …` · `Gebaut hat sie …`                                                               | 1 paragraph, or 3 builder sentences         |
| 64  | `weather-caveat`             | The bad-weather caveat that fits every ride in every park.                                                                                                                                                                                    | `Bei extremem Wetter kann in beiden Parks jede Bahn im Freien … schließen.`                                              | 1 sentence                                  |
| 65  | `pair-ellipsis`              | The second half of a comparison without its verb, or a bare percentage.                                                                                                                                                                       | `…, im Europa-Park an 16 Prozent` · `with Sundays at 36 per cent`                                                        | 6 pairs, or 1 percentage                    |
| 66  | `publish-day-snapshot`       | The post's own `date` with a time of day, outside a `Stand …` stamp (§3.3, rule 15).                                                                                                                                                          | `am 22. Oktober um 22 Uhr`                                                                                               | 1 sentence                                  |
| 68  | `brochure-span`              | A `von … bis …` range with no figure in it.                                                                                                                                                                                                   | `von der spanischen Finca bis zum Leuchtturm aus Neuengland`                                                             | 1 sentence                                  |
| 69  | `record-triple`              | Three superlatives as a formula, or `all three records`; a post about records is left out.                                                                                                                                                    | `holds all three records`                                                                                                | 3 sentences                                 |
| 70  | `name-history-series`        | The history of a ride's name, ride after ride.                                                                                                                                                                                                | `Bis 2004 hieß sie Wild Wild West` · `benannt ist sie nach …`                                                            | 3 sentences                                 |
| 71  | `since-template`             | `ist/fährt/hält seit …`, `has held … since`.                                                                                                                                                                                                  | `has held all three Dutch records since 2002`                                                                            | 4, and 3 per 1,000 words                    |
| 72  | `same-park-template`         | `im selben Park`, `in the same park` as the hinge of a catalogue.                                                                                                                                                                             | `The longest is Katun in the same park`                                                                                  | 3 sentences                                 |
| 73  | `calls-it-superlative`       | The park's own superlative, passed on.                                                                                                                                                                                                        | `Europa-Park calls it the launch coaster with the most inversions in the world`                                          | 2 sentences                                 |
| 74  | `superlative-mirror`         | Cheapest and dearest with the same frame in four or more sections; a single pair is information.                                                                                                                                              | `Am günstigsten ist der 20. Januar, am teuersten Silvester.`                                                             | 4 sections                                  |
| 75  | `section-formula`            | The same five words in three subsections.                                                                                                                                                                                                     | `den zweiten Besuch machst du`                                                                                           | 3 sections                                  |
| 76  | `opener-skeleton-series`     | Paragraphs opening on the same frame with the names swapped.                                                                                                                                                                                  | `Im <Park> stehst du an <Bahn> am längsten an.`                                                                          | 3 paragraphs                                |
| 77  | `negation-reveal`            | `ist keine X. Es ist Y` (§2.1).                                                                                                                                                                                                               | `ist keine Achterbahn. Es ist …`                                                                                         | 1                                           |
| 78  | `from-to-mirror`             | `von … zu … und von … zu …` in one sentence.                                                                                                                                                                                                  | `von Rust zum Bahnhof und von Ringsheim zum Park`                                                                        | 1 sentence                                  |
| 79  | `queue-comparison-close`     | Paragraphs closing on how much shorter you queue.                                                                                                                                                                                             | `… stehst du dort halb so lange an.`                                                                                     | 3 paragraphs                                |
| 80  | `dash-explained-twice`       | What the widget's dash means, explained again.                                                                                                                                                                                                | `Ein Strich heißt …` · `steht ein Strich`                                                                                | 2 sentences                                 |
| 81  | `park-to-park`               | `von Park zu Park` with a verb of varying.                                                                                                                                                                                                    | `unterscheidet sich von Park zu Park` · `varies from park to park`                                                       | 1 sentence                                  |
| 82  | `caption-echo`               | A measurement in a caption repeated in the body next to the same subject.                                                                                                                                                                     | `Mitfahren darf man dort ab 90 Zentimetern.`                                                                             | 1 caption                                   |
| 83  | `research-stamp`             | The day somebody looked, in running text or the source list (§3.3, rules 15 and 21); a stamp over a table stays.                                                                                                                              | `(Stand 25. September 2026) 35 Restaurants` · `as of 25 September 2026` · `au 25 septembre 2026`                         | 1 sentence                                  |
| 84  | `price-not-sold`             | An amount next to the not-on-sale formula (§1.2); a ticket kept off one date, or an unsold item named after the priced ones, is a fact and stays.                                                                                             | `ResortPass in Silber für 325 €, in Gold für 495 €, derzeit nicht im Verkauf`                                            | 1 sentence or cell                          |
| 85  | `ref-link-opener-series`     | Ride after ride opening on its own `[Name](ref:…)` link.                                                                                                                                                                                      | `[Silver Star](ref:…) ist … [Wodan](ref:…) ist eine Holzachterbahn … [Voltron Nevera](ref:…) wird …`                     | 4 sentences in a paragraph, or 5 across two |

Rules 2, 3 and 6 need no wordlist, and 15 to 18 carry a short formula per language, so all six
locales are checked. Rules 1, 4, 5, 7 to 14, 19 and 20 have German and English wordlists; in nl, fr,
es and it they are left to the critic. Of rules 22 to 38 the ones whose formula is short enough to
quote in every language cover all six (22, 24, 26, 27, 29, 30, 34, 36), 25 and 28 the four the
critic's comment lists, 31 German, English and Dutch, 33 all but French, 35 all but Dutch and 37 all
but French. Rules 23 and 32 are German and English. Rule 38 reads German capitals as nouns, so it
checks for a proper name only in the other languages. In the numbers above, 26 counts any internal
`/blog/` or `/news/` link; a link sentence that appears twice fires it at once.

Of rules 40 to 47, 41, 42, 44 and 46 cover all six languages, and so does the circle formula of 40;
its count of `angefangen`, `begann`, `started` is German and English, like 43, 45 and 47. Rule 42
counts links to pages of this site, not `ref:` links, so `Manche Bahnen öffnen um zehn, andere
mittags` with two rides linked is not an imagined reader. On the corpus of 2026-10-19 the eight
rules fired on the six translations of the thank-you post they came from and on one other post,
the German compass post with `gerade` eight times in 1,200 words.

Captions (rule 39) are the opposite case. `check:prose` already ran the vocabulary rules and the
series check of §5.2 over every `alt` and `caption` in the sidecars, but none of the sentence
patterns. A caption is one sentence, so a series is out of reach; instead rules 23, 24, 25, 28, 33
and 34 run on each caption and alt text and warn at the first hit. The others need a paragraph or a
neighbouring block and are left to the critic.

Rule 67 (an example from this file copied into a post) was tried and dropped: it fired on the
wording this file recommends. Of rules 48 to 82, those that need no wordlist cover all six languages (48 to 53, 56, the
last-words half of 57, 59, 61, the manufacturer chain of 63, 64, 72, 75, 76, 81, 82); 62 covers
German, English and Dutch; the rest are German and English. 60, 61, 64, 68, 78 and 81 also run on
every caption and alt text. Rule 4 now also catches `, die nennt …` and the app, the desk and the
hotline as the object put first; 8 catches `Danach kommt` and `Knapp dahinter`; 9 catches
`According to <Park>`; 26 fires at three paragraphs, at two for `steht in unserem [Guide]`, and at
one for a paragraph made only of pointers to `/parks/`, `/compare` or `ref:`; 47 counts `deutlich`,
`klar` and `clearly`. Since the final critic run of 2026-10-22, 26 also fires when two
paragraphs close on a pair of our own pages joined by `und` (`Auf unseren Seiten [A] und [B] …`);
54 catches the conclusion without a comparative (`der zweite Tag also 60 bis 67,50 €`); a sentence
about our method instead of the park (`berücksichtigen wir`, `we take into account`) is a §2.19
warning; and `werktag-meaning` reads Spanish `día laborable` too.

Three of those rules meet a rule the templates impose, and give way to it. A guide has a travel
chapter with one subheading per country, so 53 is quiet inside it. An FAQ answer is read alone and
may repeat one fact (§5.4), so 48 fires on a copied passage, not on a shared figure. The minimum
heights and the specs of every coaster are required facts, so a spec list is never a series; 63
fires on the sentence formula, not on the figures.

Some patterns from the same tickets were decided against a rule, and stay with the critic:

- **They clash with a rule the templates set.** Narration over a widget and the echo of a widget
  (PAR-986 #7, PAR-987 #14): the text explains what the widget shows. A capacity figure next to a
  ranking (PAR-987 #16), the minimum-height series and the triple of specs (PAR-987 #17, PAR-989):
  specs are required facts. Headings as a series of questions (PAR-987 #18): chapters follow the
  reader's questions. An FAQ that shares names with a paragraph (PAR-987 #15): an answer is read
  alone.
- **A script cannot tell good from bad.** Four different words for "such as" in one post (PAR-986
  #14), the owner or founding year at the end of a paragraph (PAR-987 #1), two links to the same
  guide (PAR-987 #5), five sentences opening on `Für` (PAR-984), the key term of the excerpt in a
  table cell and an FAQ answer (PAR-984), the park's name and its town in turn (PAR-985 #2, needs
  each park's town).
- **Only a reader sees it**, as the tickets say: the topic sentence over a list (PAR-986 #18,
  PAR-985 #11), the same fact in two chapters (PAR-986 #19), a price for something not sold, an
  echo under the table and a sentence that repeats the last one (PAR-984), the mirrored biography
  (PAR-985 #9), a place pair mirrored at a paragraph end, the author's verdict echoing the source
  and an implication from visits per ride (PAR-988), the country section that sums up a table
  (PAR-989), opening hours in a price comparison (PAR-990 #11), a series of figures with no
  conclusion, an award next to a wait time, the capacity maxim and a cause given only by the
  heading (PAR-987 #6, #11, #13, #20).
- **Covered by a neighbour.** The chapter of one or two sentences (PAR-989) is §4.3's rule for a
  reader; the excerpt sentence repeated in the text and the same figure with its unit in two
  paragraphs (PAR-989) are what `fact-refrain` counts once they reach three sections, and below that
  they are the critic's.

What stays with the critic in every language is the part no pattern can see:

- **Refrain.** The core statement stands in the excerpt, the chapter, the running text and the
  FAQ in the same words. Say it where it is found first (§5.4, each fact once).
- **Repeated reservation.** The same gap in the data is admitted in several chapters. Name it once,
  where the reader would otherwise draw a wrong conclusion (§2.19).
- **Echo.** A sentence repeats the figures of the table directly above it.
- **Implication by juxtaposition.** Numbers under a table are meant to suggest a cause the text
  never states. State the cause with its source, or leave the numbers out.
- **Invented comparison from everyday life and the wink in brackets.** A parenthesis that
  nudges the reader (`(ja, wirklich)`) and a comparison with a queue at the baker's that nobody
  measured (§1.8).
- **Riddle apposition.** A person or thing introduced as a puzzle (`gehörte dem, dem …, Maximus
Müller`) before it is named.
- **The one-line punch.** A paragraph that ends on a sentence of fewer than seven words that
  sounds like a verdict.
- **A summary that repeats facts from the park sections.** The closing chapter says again what
  the chapters above already said (§1.5).
- **A comparison that restates the numbers.** The sentence says in words what the figures in the
  same paragraph already show.
- **A question answered across a heading.** A chapter ends on a doubt (`lange war ich mir nicht
sicher, ob das überhaupt jemand annimmt`) and the next opens on its answer (`Inzwischen weiß ich
es.`): the question set-up of §2.12, with a heading in between.
- **The tautological apposition.** `Nighttime Spectacular, ein Nachtspektakel`: the name translated
  and set beside itself as if it explained something.
- **The sentence that says the last one again**, in other words, one line later.
- **The theme sentence over a list.** `Bei den Tickets gibt es einiges zu beachten.` above a list of
  ticket rules. Let the list start without it.
- **The capacity maxim.** `Wer viel fahren will, braucht Zeit.`, dressed up with a ride's hourly
  capacity.

A date that opens a line and renders as a numbered list (`1. November`) is the twenty-first
finding of that day. It was already an error (§4.4); the cure is a no-break space between the day
and the month.

---

## 3. Vocabulary

These lists are **dated**, and that is the point. `delve` dominated 2023–2024 and dropped off
sharply in 2025; the mid-2025 set narrowed to `emphasizing`, `enhance`, `highlighting`,
`showcasing`. Words move. Re-check the sources once a year rather than treating the table as
permanent, and never rely on vocabulary alone — §1 and §2 do the real work.

### 3.1 German

| Category                         | Watch for                                                                                                                                                                                                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Significance inflation           | `spielt eine wichtige/entscheidende Rolle`, `unterstreicht die Bedeutung`, `steht als Zeugnis`, `Wendepunkt`, `Schlüsselmoment`, `tief verwurzelt`, `prägt maßgeblich`, `hinterlässt bleibenden Eindruck`                                                                           |
| Ad copy                          | `atemberaubend`, `beeindruckend`, `unbedingt sehen`, `echtes Highlight`, `reiche Geschichte`, `reiches kulturelles Erbe`, `eingebettet`, `im Herzen von`, `vielfältig`, `nahtlos`, `maßgeschneidert`, `essenziell`, `umfassend`, `ganzheitlich`, `Gamechanger`, `das nächste Level` |
| Editorial commentary             | `es ist wichtig zu beachten/betonen`, `es ist entscheidend`, `bemerkenswert ist`, `an dieser Stelle sei erwähnt`, `denken Sie daran`                                                                                                                                                |
| Time-filler openings             | `in der heutigen Zeit`, `im digitalen Zeitalter`, `in der heutigen schnelllebigen Welt`, `mehr denn je`, `immer mehr Menschen`                                                                                                                                                      |
| Summary formulas                 | `zusammenfassend lässt sich sagen`, `abschließend`, `insgesamt`, `Fazit`                                                                                                                                                                                                            |
| Mechanical connectives           | `darüber hinaus`, `zusätzlich`, `ferner`, `andererseits` (as a paragraph habit); as a sentence opener also `des Weiteren`, `interessanterweise`, `bemerkenswerterweise`, `letztendlich`, which `pnpm check:prose` flags                                                             |
| Stock phrases                    | `hier kommt X ins Spiel`, `ohne Umschweife`, `schnall dich an`, `das nächste Level`, `was viele nicht wissen`                                                                                                                                                                       |
| Volume adverbs                   | `wirklich`, `absolut`, `unglaublich`, `extrem`: stop-slop cuts every adverb; we cut the ones that only turn the volume up and keep the ones that carry a fact (`fast`, `kaum`, `erst`, `nur`)                                                                                       |
| Credential openers               | `Als langjähriger Fan …`, `Als leidenschaftlicher Achterbahnfahrer …` (§1.4)                                                                                                                                                                                                        |
| Vague authority                  | `Branchenberichte`, `Experten sind sich einig`, `viele Beobachter`, `Studien zeigen` (unsourced)                                                                                                                                                                                    |
| Model verbs                      | `eintauchen` / `Lassen Sie uns eintauchen`, `beleuchten`, `aufzeigen`, `hervorheben`, `gewährleisten`                                                                                                                                                                               |
| Hedging into mush                | `kann` used to soften every claim — count them, models over-use it badly                                                                                                                                                                                                            |
| Business verbs                   | `optimieren`, `ermöglichen`, `begleiten`, `abholen`, `revolutionieren`, `transformieren`, `skalieren` — see §1.7, each has a plain twin                                                                                                                                             |
| Gesture nouns                    | `die Welt der …`, `Landschaft`, `Reise`, `Ökosystem`, `Raum`, plus abstract subjects: `Effizienz`, `Komplexität`, `Innovation`, `Vielfalt`, `das Erlebnis`                                                                                                                          |
| Pseudo-wisdom                    | `am Ende des Tages`, `der Schlüssel liegt in`, `es kommt auf die richtige Balance an`, `die Zahlen sprechen für sich`, `die Tendenz ist steigend`, `ein nicht unerheblicher Teil`                                                                                                   |
| Latinate where German has a word | `signifikant` → `deutlich`, `Parameter` → `Wert`, `Methodik` → `Verfahren`, `partizipieren` → `mitmachen` (Economist 2026: still the strongest single marker)                                                                                                                       |
| Emphasis verbs and nouns         | `betonen`, `hervorheben`, `Bedeutung`, `Notwendigkeit`, `zunehmend`, `erheblich`, `innovativ`: the "emphasize" family is over-used by models in 24 of 34 languages (Juzek 2026)                                                                                                     |
| Wikipedia's German extras        | `integraler Bestandteil`, `vielfältige Möglichkeiten`, `umfassender Leitfaden`, `bleibendes Vermächtnis`, `unerschütterlich`, `fasziniert weiterhin`, `festigt seinen Ruf`                                                                                                          |

### 3.2 English

| Category               | Watch for                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core AI vocabulary     | `additionally` (sentence-initial), `align with`, `boasts`, `bolstered`, `crucial`, `deep dive`, `delve`, `emphasizing`, `enduring`, `enhance`, `fostering`, `garner`, `highlight` (verb), `interplay`, `intricate`, `key` (adj), `landscape` (abstract), `meticulous`, `pivotal`, `robust`, `showcase`, `tapestry`, `testament`, `underscore`, `valuable`, `vibrant`, `multifaceted`, `transformative`, `unprecedented`, `aforementioned`, `spearhead`, `encompass`, `endeavor`, `synergy`, `in essence`, `thought leader` |
| Puffery                | `nestled`, `in the heart of`, `breathtaking`, `must-see`, `rich history`, `diverse array`, `groundbreaking`, `renowned`, `commitment to`, `natural beauty`                                                                                                                                                                                                                                                                                                                                                                 |
| Significance inflation | `stands as a testament`, `plays a vital role`, `underscores its importance`, `reflects broader`, `marking a pivotal moment`, `evolving landscape`, `indelible mark`, `deeply rooted`                                                                                                                                                                                                                                                                                                                                       |
| Editorial commentary   | `it's important to note`, `worth noting`, `no discussion would be complete without`                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Summary formulas       | `in conclusion`, `overall`, `in summary`, `key takeaways`                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Vague authority        | `industry reports`, `experts argue`, `observers have noted`, `some critics argue`, `several sources`                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Outline conclusions    | `despite its … faces several challenges`, `future outlook`, `challenges and legacy`                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Business verbs         | `leverage`, `unlock`, `empower`, `streamline`, `navigate`, `elevate`, `utilize`, `facilitate`, `foster`, `ignite`, `unleash`                                                                                                                                                                                                                                                                                                                                                                                               |
| Gesture nouns          | `landscape`, `journey`, `space`, `realm`, `ecosystem`, `tapestry`, `beacon`, `roadmap`, `the world of …`                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Pseudo-wisdom          | `at the end of the day`, `the key is`, `when the dust settles`, `something real is happening`, `the stakes couldn't be higher`                                                                                                                                                                                                                                                                                                                                                                                             |
| Hedges                 | `in many ways`, `at some level`, `arguably`, `it could be argued`, `while it is true`                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Recyclable framing     | `a useful way to think about it is`, `the key idea is`, `picture this`, `let's dive in`, `here's the kicker`                                                                                                                                                                                                                                                                                                                                                                                                               |
| Stock phrases          | `when it comes to`, `comes into play`, `this is where X comes in`, `whether you're an X or a Y`, `here's the thing`, `without further ado`, `in a nutshell`, `buckle up`, `to the next level`, `bridge the gap`, `move the needle`, `at its core`, `in the realm of`, `rest assured`, `it goes without saying`, `game-changer`                                                                                                                                                                                             |
| Mechanical openers     | sentence-initial `Moreover`, `Furthermore`, `Additionally`, `Interestingly`, `Notably`, `Importantly`, `Indeed`, `Certainly`, `Absolutely`                                                                                                                                                                                                                                                                                                                                                                                 |

`paramount` and `commence` are on the anti-ai-slop-writing list and not on ours: on this site one
is a film studio and the other is French for "begins", and both matched dozens of legitimate
sentences on the first run.

### 3.3 Ours, and non-negotiable

Twenty-three house rules that are not in anybody's research. They came out of real reviews of shipped
text:

1. **Never `ehrlich`, in any form.** No `ehrlich gesagt`, no `der ehrlichste Woodie`, no
   `um ehrlich zu sein`, no `honest` framing at all. It is the clearest tell we have found on our
   own copy. Honesty is demonstrated, not announced. The neighbouring register goes with it:
   `Fairness-Hinweis in eigener Sache`, `Kein Werbeflyer. Versprochen.`, `ohne SEO-Sermon`,
   and the phrases that perform precision instead of having it:

   | Don't write                           | Write instead                            |
   | ------------------------------------- | ---------------------------------------- |
   | `der ehrlichste Woodie Europas`       | say what makes it good, with a number    |
   | `Fairness-Hinweis in eigener Sache`   | `Eine Einschränkung dazu:`               |
   | `Was sie unbestreitbar ist:`          | `Eines ist sie auf jeden Fall:`          |
   | `bezahlte Vorfahrt`                   | `sich an der Warteschlange vorbeikaufen` |
   | `ein weiterer Datenpunkt`             | `noch eine Zahl`                         |
   | `in Wartezeit-Währung`                | `da stehst du am längsten an`            |
   | `ein weltweit erstmalig gebauter Typ` | `den es sonst nirgends gibt`             |
   | `Es ist ein schönes Muster.`          | cut, or say what it produced             |

2. **Never narrate the sign at the entrance.** `das Schild`, `the sign`, `het bord`,
   `le panneau`, `el cartel`, `il cartello`. It is a stage direction, and it multiplies: it once
   stood in a hero caption, a scale legend, a screen-reader summary, a chapter paragraph and a
   companion post, six locales deep. Write `Am Eingang stehen 70 Minuten.`, `Mehr steht am
Eingang nicht.`, `At the entrance it says 70 minutes.` The posted time as a measured value is
   not the prop: a section that compares posted and actual waits may name the board it analyses.
3. **No coined metaphor-currencies.** `Wartezeit-Währung`, `Lebenszeit-Konto`, `Datenpunkt` as a
   noun of art. One ordinary figure of speech per section is plenty.
4. **Copy must not describe the page's own layout.** `Links steht … rechts …` is wrong on every
   phone, where the panels stack. Vertical order is usually safe (`weiter unten auf der
Parkseite`); horizontal order almost never is; `daneben` only when the two things share a row
   at every breakpoint.
5. **Im Deutschen heißt es `Warteschlange`, nie `Schlange`.** The product's word, used the same
   way everywhere (§2.6): `die Warteschlange`, `die Single-Rider-Warteschlange`, `anstehen` for the
   verb (`Schlange stehen` becomes `anstehen`, never `Warteschlange stehen`). The only exception is
   a proper name that means the animal: `Schlange von Midgard`. Compounds count
   (`Mittagsschlange` → `Warteschlange am Mittag`), a shape does not (`schlangenartig`).
   `in der Warteschlange stehen` is correct German; for the verb alone, `anstehen` reads better.
   255 uses were changed on 2026-09-30; `pnpm check:prose` fails on a new one.
6. **Our data is not announced as real.** `echte Wartezeiten`, `echte Messungen`, `real wait-time
data`, `données réelles`, `datos reales`, `dati reali`: the same move as rule 1, a quality
   claimed instead of shown. Say where the numbers come from and since when: `gemessene
Wartezeiten seit Dezember 2025`, `measured every five minutes`. `real` stays where it contrasts
   with something that is not (`die tatsächliche Wartezeit` against the forecast in R²).
7. **Never `die Antwort auf`.** Nor `the answer to`, `het antwoord op`, `la réponse à`,
   `la respuesta a`, `la risposta a`. The phrase announces an answer instead of giving it: write
   the answer. It was a stock-phrase warning on the morning of 2026-10-02 and an error by the
   afternoon; `pnpm check:prose` fails on it in every language and on every surface.
8. **Never `nennen eine`.** `35 von 40 Attraktionen nennen eine Mindestgröße` hands a person's
   verb to a ride (§2.13): a ride names nothing, the park sets a limit and it applies at the
   entrance. Write where it applies: `Bei 35 von 40 Attraktionen gilt eine Mindestgröße.` It stood
   in four strings of the „Mit Kindern“ page and on the park page's card that links to it; the PO
   put it on the list on 2026-10-03. `pnpm check:prose` fails on `nennen eine` and on the Dutch
   calque `noemen een` on every surface. Only the plural: `RCDB noemt een dive loop` is a source
   naming a figure. French, Spanish, Italian and English wrote the same habit with verbs that have
   plain uses too (`indiquent une`, `indican una`, `post a`); those strings were rewritten, and the
   verbs stay off the list.
9. **Never `misst sich selbst`, `bewertet sich selbst` or `benotet sich selbst`.** Nor `grades
itself`, `beoordeelt zichzelf`, `se note lui-même`, `se autoevalúa`, `si dà i voti`. A model
   grades nothing; we compare its forecasts with the measured waits and publish the error. Write
   that: `Am Tag darauf wird jede Prognose mit der gemessenen Wartezeit verglichen, und die
durchschnittliche Abweichung in Minuten steht öffentlich auf dieser Seite.` It stood in the
   Fancast tagline in all six languages until Patrick put it on the list on 2026-10-04.
   `pnpm check:prose` fails on every inflection and on words between (`benotet sich dabei
öffentlich selbst`), on every surface; `gemessen an sich selbst` is an idiom and stays.
10. **Never `ob der Tag aufgeht`.** Nor `ob der Tag so aufgeht`, `geht der Tag auf`, or the
    translations it picked up: `whether the day adds up`, `of de dag klopt`, `si la journée tient
debout`, `si el día cuadra`, `se la giornata regge`. The image says nothing anyone could check.
    Say what fits and by when: `ob alle vor Parkschluss drankommen`, `ob du deine acht Bahnen bis
Parkschluss schaffst`. It stood in the planner's lead, the landing page's pointer to the planner
    and the planner launch post in all six languages until Patrick put it on the list on 2026-10-04.
    `pnpm check:prose` fails on it in every language and on every surface. A sum stays: `a day that
adds up to a lot of empty seats`, `el segundo día sale por 60 €`.
11. **Never `eine Zahl zeigen`, and never a number that does something.** Nor `zeigt dir eine
Zahl`, `nennt eine Zahl`, `spuckt eine Zahl aus`, `die Zahl zeigt`, `die Zahlen sagen`,
    `die Zahl steht für` / `dafür`, `diese Zahl verrät`, or the translations: `shows a number`,
    `the number shows`, `this figure stands for`, `toont een getal`, `dit getal staat voor`,
    `affiche un chiffre`, `ce chiffre montre`, `muestra un número`, `esta cifra dice`,
    `mostra un numero`, `questo numero dice`. The first says a number exists and not which one;
    the second hands the reader's conclusion to the number. Name the figure and say what follows
    from it: `zeigt die vorhergesagte Wartezeit`, `im Schnitt 23 Prozent mehr als an einem
Wochenendtag, also war der Dienstag voller`. Patrick put both on the list on 2026-10-04.
    `pnpm check:prose` fails on them in every language and on every surface. A place stays
    (`die Zahl steht im Diagramm`), and so does `a number of` in all its forms.
12. **Never `die Quelle` without a name, and never the day you opened the pages.** Nor `mit der
Quelle, aus der es stammt`, `wie die Quelle sie nennt`, `nennt die Quelle keinen Hersteller`,
    `laut Quelle`, `es nennt`, or `Alle Seiten habe ich am 5. Oktober 2026 aufgerufen` and `Die
Website ließ sich am 5. Oktober nicht aufrufen`. The translations shipped with them: `the way the
source gives them`, `with the source it came from`, `I opened every page on`, `zoals de bron ze
geeft`, `heb ik op … bekeken`, `tels que la source les donne`, `J’ai consulté toutes ces pages
le`, `tal como los da la fuente`, `Consulté todas las páginas el`, `come li dà la fonte`, `le ho
aperte il`. A reader cannot look up `die Quelle`; the post links every page, so name whose page
    it is: `wie Park oder Hersteller sie angeben`, `mehr als die Hälfte nennt keinen Hersteller`.
    The access date is a bibliography's `abgerufen am` moved into the text, and with it the
    author's routine. Say what the parks have done, in the present (`haben noch keine Neuheit für
2027 bestätigt`), and leave the day to `updatedAt` or to a `Stand 5. Oktober 2026` over a table
    (rule 15). All of
    it stood in the 2027 novelties post in six languages until Patrick put it on the list on
    2026-10-05. `pnpm check:prose` fails on both in every language, in posts and news only: in the
    admin a `Quelle` is the upstream feed. A named source stays (`Six Flags nennt sie die
höchste`), so does a source as the object (`Six Flags nennt keine Quelle`), `nennt es`, and the
    source line of a `[!QUOTE]`, which is a citation and may carry `abgerufen am`. `selon la
source` and `según la fuente` mean "depending on the source" as often as "according to" and
    are not matched. The research sentence without a page in it (`habe ich am 5. Oktober keine
Neuheit gefunden`) is the same habit and is left to the review pass.
13. **Never `zwölf von zwölf`.** Nor `twelve of twelve`, `twaalf van de twaalf`, `douze sur
douze`, `doce de doce`, `dodici su dodici`. Counting a number against itself performs a
    completeness that `in allen zwölf Parks` states. It opened the excerpt of the rain guide in
    German, English and Dutch until Patrick put it on the list on 2026-10-06. `pnpm check:prose`
    fails on a number word followed by itself; `21 von 44`, a French `20 sur 20` and `two rows of
two` stay.
14. **Never `kürzer besetzt`.** Nor `länger besetzt` or the Dutch calque `korter bezet`. A ride is
    not besetzt; the wait at it is shorter (`An Regentagen sind die Wartezeiten kürzer`). Same
    excerpt, same day, and the same class as the other verbs that do not fit their noun (§2.19).
    `pnpm check:prose` fails on it on every surface.
15. **Never pin a non-event to the post's own date.** `Einen Zwischenstand hat es auf seiner
Website bis zum 7. Oktober nicht genannt.` stood in a news post dated 7 October, in six
    languages (`by 7 October it hadn’t published a running count`). The date is the morning of
    the research, and the sentence reports what the author found missing then; Patrick's verdict
    on 2026-10-07 was that nobody writes like that. The post's `date` already says when. Say the
    state in the present, with whoever owns it (`Wie viele schon zusammen sind, sagt das Netzwerk
bisher nicht.`), or leave the gap out when the reader does not need it (§2.19). The
    recommendation rule 12 used to give, `haben bis zum 5. Oktober keine Neuheit bestätigt`, is
    the same shape and was changed the same day. `pnpm check:prose` warns, in posts and news in
    six languages, on a sentence that names the post's own `date` or `updatedAt` after `bis zum`,
    `by`, `tot`, `au`, `hasta el` or `al` and carries a negation; a stamp over a table (`Stand 6.
Oktober 2026:`) is left alone. Besides the post it was found in, twelve sentences in ten
    posts carried it that day, among them the 2027 novelties post in all six languages. The
    positive version is the same habit: `Stand 28. September 2026 sind es 196 gemessene Tage`,
    `Gezählt habe ich das am 4. Oktober 2026`, `am 22. Oktober um 22 Uhr` in running text is a
    snapshot of the research morning. Give the figure in the present, or put it in a table under
    a `Stand …` stamp. `pnpm check:prose` warns on the stamp in six languages (`research-stamp`,
    §2.20). Taking a stamp out must leave a sentence that is still true next month: `für
Oktober steht noch kein Tag darin` was true with its stamp and false three weeks later. A figure
    that keeps moving gets the range of the data instead (`auf 61 Messtagen bis Ende September
2026`), which is a fact about the data and not about the morning somebody looked.
16. **A post speaks for park.fan when it points to another post.** `Wie es zu dem Bürgerbegehren
kam …, habe ich am 1. Oktober aufgeschrieben.` linked the earlier news post as if it were
    the author's notebook. The byline is a person; the archive is the site's: `steht in unserem
Beitrag vom 1. Oktober`, with the link on the words that name the topic (`[Bürgerbegehren
gegen die Erweiterung](/news/…)`), not on a date. First person stays where the author did
    something (`Ich habe die Petition unterschrieben`). Patrick put it on the list on
    2026-10-07. `pnpm check:prose` warns on a first-person writing verb (`habe ich …
aufgeschrieben`, `I wrote`, `heb ik … geschreven`, `je l’ai écrit`, `lo conté`, `l’ho
raccontato`) in a sentence that links a post under `/blog/` or `/news/`; that day it found
    fourteen in ten posts besides the one it came from, most of them in the Efteling and
    Phantasialand guides.
17. **Never `der Park ist ruhig`, and never a flat wait.** Nor `der Park ist deshalb nicht
ruhig`, `die Wartezeiten sind nicht ruhig`, `die Wartezeiten sind flach`, `Phantasialand und
Heide Park bleiben dazwischen flach`, `Das Efteling liegt beim Wochentag flach` or `in der kein
Park ruhig blieb`. Nobody talks about a park that way. A park has no mood and a wait has no
    shape: say how long the wait is, or that it barely changes (`bleibt bis zum Abend fast
gleich`, `unterscheiden sich die Wochentage kaum`). A curve may be flat (`Die Tageskurve ist
flach`). The first stood in the planner's empty day (PAR-740), `Die Störung liegt bei uns, der
Park ist deshalb nicht ruhig`, where it also denied a reading nobody had: an empty planner shows
    no curve, not a short wait, and `Der Fehler liegt bei uns.` says all of it. The others stood in
    two posts in all six languages until Patrick put it on the list on 2026-10-07.
    `pnpm check:prose` fails on it in German on every surface, with `ruhig`, `flach`,
    `entspannt`, `gemütlich`, `gelassen`, `still` and `friedlich`, in main clauses, questions
    and subordinate clauses, and on a park name only as a `ref:` link. `am ruhigsten` and
    `ruhiger` compare days and stay, so do `Im Park ist es morgens ruhig` (the park is a place
    there) and `liegt ruhig` (a location). The other five languages call a park `quiet`,
    `rustig`, `calme`, `tranquilo` or `tranquillo` in plain speech, so they fail only on the
    shipped denial (`not simply quiet`, `niet zomaar rustig`, `pas simplement calme`, `no está
simplemente tranquilo`, `non è semplicemente tranquillo`) and on a park that is flat (`is
flat`, `ligt vlak`, `est plat`, `es plano`, `è piatto`).
18. **Never `hier steht`.** Not `Hier steht, wie lang man an 225 gemessenen Tagen angestanden
hat`, not `Was hier steht, ist live`, not `Bei dem Median, der hier steht`, not `[die ganze
Geschichte steht hier](…)` and not `Unten stehen zuerst die Termine`. The text points at itself
    as the place where something is written (§1.4) instead of writing it. Say the thing (`An 225
gemessenen Tagen stand man an den meisten Bahnen nur wenige Minuten an`), name the table it
    is in (`in der Tabelle darunter`, `Die ruhigsten Tage der nächsten Wochen im Europa-Park:`),
    or put the link on the words that say what is behind it (`[wie es dazu kam](…)`). A place is
    named, not pointed at: `das seit 1956 im Park steht`, `Im Hansa-Park steht dort oft
zusätzlich ein Alter`. Patrick put it on the list on 2026-10-08, after the excerpt of the
    Plopsaland guide; that day it and its kin stood in twenty German sentences across thirteen
    posts, on the best-time page, in a caption and in a planner string, and the translations
    had carried it as `What’s in there is live`, `Wat hier staat`, `Hier lees je`, `Ce qui
s’affiche ici`, `Lo que ves aquí`, `Quello che c’è qui` and
    `[the details are here](…)`. `pnpm check:prose` fails on `hier steht` in any position, on
    `steht hier` before a comma, a colon or the end of a link label, on `hier findest du` and on
    a sentence that opens with `Unten steht` (a figure after it, as in `Unten stehen 96
Attraktionen`, or a `Ganz` before it, as in a ranking, stays), on every surface. The other
    five languages fail on the shapes listed above; their `Below is` stays a reading job, because
    the guide and planner pages introduce a demo you can drag with it.
19. **Never `unterschiedliche Preise nennen` without the prices.** `Suchergebnisse aus drei
Jahrzehnten, die alle denselben Park meinen und unterschiedliche Preise nennen` says that a
    difference exists and gives none of it. Give the figure that holds (`Ein Ticket mit festem
Datum kostet 2026 online ab 36 Euro.`), or both figures and whose they are (`Die Ticketseite
nennt dafür an zwei Stellen verschiedene Preise, 229,99 $ und 274,99 $`). A rule that has no
    single figure says what happens instead: `Widersprechen sich die Quellen, entscheidet die
Mehrheit`, not `Melden die Quellen unterschiedliche Zahlen`. Patrick put it on the list on
    2026-10-08, from the same guide, which had carried it into all five translations (`all
quoting different prices`, `verschillende prijzen noemen`, `annoncent des prix différents`,
    `dan precios distintos`, `riportano prezzi diversi`). `pnpm check:prose` fails, in six
    languages and on every surface, on a verb of naming with `unterschiedliche`, `verschiedene`,
    `abweichende` or `andere` and a noun for figures (`Preise`, `Zahlen`, `Höhen`, `Termine` and
    their twins), and in German on `die Angaben gehen auseinander`, when neither that sentence
    nor the next holds a figure. A year is not a figure.
20. **A launch coaster does not `anwerfen` its trains.** `Sky Scream wirft seine Züge dreimal
an` stood in a Plopsaland caption. A motor is angeworfen; a train is abgeschossen or
    beschleunigt, and the thing itself is der Abschuss: `Erst nach dem dritten Abschuss kommt der
Zug von Sky Scream über den 45 Meter hohen Top Hat.` Patrick put it on the list on
    2026-10-08. `pnpm check:prose` fails on `anwerfen` and `anschmeißen` with a train, a car or
    the riders as the object, so `den Motor anwerfen` stays. German only: `launch`, `lanceert`,
    `lance`, `lanza` and `lancia` are the right words.
21. **Never the research diary.** Not `Abgerufen wurde alles am 9. Oktober 2026.`, not a table
    column headed `Quelle, abgerufen am 9.10.2026`, not `Preise fehlen, weil die gelesenen Seiten
sie nirgends nennen`, `Auf den abgerufenen Seiten nennt der Park keine Mindestgröße` or `Die
Parkordnung haben wir nicht gelesen`. Rule 12 banned the first-person version; the food guide
    and the toddler guide of 2026-10-08/09 wrote the same thing in the passive, as an adjective and
    as a table header, about forty times across six languages (`retrieved 9 Oct 2026`, `op de
geraadpleegde pagina's`, `pages consultées`, `páginas consultadas`, `pagine consultate`). The
    reader asks what the park allows; which pages we opened, and on which day, is our notebook.
    Say what the park says and where (`Auf seiner Website nennt der Park keine Mindestgröße`,
    `In der Parkordnung steht nichts zu Glas`), and link the page. The source list carries the
    links without a date; `updatedAt` dates the post, and a table that needs a date gets a
    `Stand …` stamp above it (rule 12). A gap the reader does not need goes (§2.19), and so does
    the sentence that explains why we did not look. Patrick put it on the list on 2026-10-09.
    `pnpm check:prose` fails in posts and news on every form of `abgerufen` and on `aufgerufen
am`, on `die gelesenen Seiten` and its kin, on `haben wir nicht gelesen`, and on their twins in
    the other five languages, including in tables and source lists. The source line of a
    `[!QUOTE]` is a citation and keeps its date.
22. **Never a tally that drops its noun.** `Sechs von fünfzehn Parks erlauben eigenes Essen
ausdrücklich, vier regeln nur den Ort, fünf schweigen.` opened the excerpt of the food guide
    in six languages (`four only say where to eat it, five say nothing`, `vier regelen alleen
waar je het opeet, vijf zwijgen erover`, `cinq n'en disent rien`, `cinco callan`, `cinque
tacciono`). The noun is said once and then dropped; each bare number gets a verb of its own;
    the middle verb is our table's category read aloud (`nur Ortsregel`, §2.19), and the last is
    a person's (§2.13). The reader has to hold fifteen parks in their head and add up three
    groups they cannot see. Give one count with its parks, or name the parks and let the reader
    count: `Heide Park, Efteling, Toverland, Walibi Holland, Futuroscope und Disneyland Paris
erlauben eigenes Essen ausdrücklich.` A number or a document does not `schweigen` either:
    `In der Parkordnung steht nichts zu eigenem Essen`, `Die Mitteilung nennt keinen Hersteller`.
    A company that declines to answer may (`Merlin schweigt zu den Gründen`). Patrick put it on
    the list on 2026-10-09 with the words „solche Floskeln will ich verhindern“. `pnpm
check:prose` fails on a sentence with two or more clauses that open on a bare number word
    and a verb (`, vier regeln`, `, five say`, `, quatre fixent`, `, cuatro solo fijan`, `,
quattro fissano`, `, vier regelen`), on a number word followed by a verb of silence (`fünf
schweigen`, `five say nothing`, `cinq n'en disent rien`), and on a document that keeps quiet
    (`schweigt die Mitteilung`, `the terms stay silent`, `les conditions se taisent`), on every
    surface. The copula is left out (`zehn sind Stationen, drei sind Labyrinthe` says what each
    group is), and so is a count followed by its noun (`drei Shows, vier Labyrinthe`).
23. **Never read the data aloud without a reason.** A paragraph that recites what a tool, a table,
    our database or our changelog holds, value after value, is a log with full stops, not a post.
    The first German draft of the thank-you post of 2026-10-19 opened on a sentence explaining what
    the Google Search Console is, then `Dazwischen lagen 4.500, 5.000, 5.500 und 6.000, sechs
Abzeichen in drei Wochen. Von 4.000 auf 5.000 hat es zwölf Tage gedauert, von 5.000 auf 6.000
nur noch fünf und von 6.000 auf 7.000 vier.`, then which clicks the tool does not count, and
    further down a paragraph listing how many posts, guides and news items had appeared in the same
    weeks and which features had shipped on which day. Every figure was right, and none of them
    said what the post was about. Patrick's verdict on the opening was „reines Aufzählen“, and on
    the whole draft „nicht persönlich, nicht schön, nicht nach einem wirklichen Herzensprojekt,
    sondern nur nach Aufzählung von Fakten“. A figure belongs in a sentence when the reader would
    ask for it or when the point of the paragraph rests on it. Give that one, say what it means to
    the reader or to the person writing, and leave the values in between, the averages derived
    from them, the tool's counting rules and the release notes of the same weeks where they are.
    Reading aloud has a reason when the reader needs the sequence itself, every step of it: opening
    hours, the dates of a season, the order of a process, a price list. Then it is a list or a
    table (§4.4), and the sentence next to it does not read it out a second time (the echo in
    §2.20). This is §2.19 one step further: there the query's words reach the text, here its rows
    do. Patrick put it on the list on 2026-10-19. `pnpm check:prose` has no rule for it; it is for
    the review pass and the critic (§7.2).

### 3.4 Travel-guide copy, in all six languages

Wikipedia's line about "the prose of a travel guide" is the one that applies to us most, so the
tourism register gets its own list. `pnpm check:prose` warns on every one of these:

| Locale | Watch for                                                                                                                                                                                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| de     | `Nervenkitzel pur`, `pures Adrenalin`, `für Groß und Klein`, `für die ganze Familie`, `unvergesslich`, `ein echtes Highlight`, `Geheimtipp`, `Kronjuwel`, `Wow-Effekt`, `tauche ein`, `lass dich verzaubern`, `kommt jeder auf seine Kosten`, `liegt in der Luft` |
| en     | `thrill-seekers`, `something for everyone`, `fun for the whole family`, `hidden gem`, `must-see`, `unforgettable`, `breathtaking`, `iconic`, `world-class`, `bustling`, `gleaming`, `towering`, `palpable`, `look no further`, `bucket list`                      |
| nl     | `onvergetelijk`, `een echte aanrader`, `voor jong en oud`, `voor het hele gezin`, `voor ieder wat wils`, `verborgen parel`, `adembenemend`, `laat je betoveren`, `kloppend hart`                                                                                  |
| fr     | `incontournable`, `inoubliable`, `à couper le souffle`, `pour toute la famille`, `petits et grands`, `au cœur de`, `plongez`, `laissez-vous emporter`, `à ne pas manquer`                                                                                         |
| es     | `imprescindible`, `inolvidable`, `no te pierdas`, `sumérgete`, `para toda la familia`, `hay para todos los gustos`, `joya escondida`, `de visita obligada`, `déjate llevar`                                                                                       |
| it     | `imperdibile`, `indimenticabile`, `immergiti`, `per tutta la famiglia`, `grandi e piccini`, `ce n'è per tutti i gusti`, `gemma nascosta`, `mozzafiato`, `tappa obbligata`                                                                                         |

The **genre glitch** belongs here too: a sensory advert sentence inside a factual paragraph
(`Der Duft gebrannter Mandeln liegt in der Luft`, `the air is thick with anticipation`). And the
two openers every language has: the false range (`Von rasanten Achterbahnen bis hin zu
gemütlichen Familienfahrten`) and the whether-opener (`Egal, ob du …`, `Of je nu …`, `Que vous
soyez …`, `Ya seas …`, `Che tu sia …`). A French UI string that translates _headliner_ as
`incontournable` is a judgement call; `attraction phare` says the same without the brochure.

### 3.5 Dutch, French, Spanish and Italian

No field guide exists for these four at the depth of the German and English ones. The lists
below follow the same classes and are candidates, not verdicts:

| Locale | Watch for                                                                                                                                                |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| nl     | `het is belangrijk om op te merken`, `in een snel veranderende wereld`, `de kracht van`, `naadloos`, `baanbrekend`, sentence-initial `Bovendien`         |
| fr     | `il convient de souligner`, `dans un monde où`, `à l'ère du numérique`, `tirer parti de`, `mettre en avant`, sentence-initial `En outre`, `Qui plus est` |
| es     | `es importante destacar`, `vale la pena señalar`, `en última instancia`, `profundizar en`, `embarcarse en`, `sin duda`                                   |
| it     | `è importante sottolineare`, `vale la pena ricordare`, `una testimonianza di`, `epocale`, `vero e proprio` in bulk                                       |

Italian schools teach avoiding repetition, so rotating synonyms (§2.6) is partly a native habit
there: do not over-correct it.

---

## 4. Typography and formatting

Formatting is where generated text is most obvious, because a chatbot's output is Markdown shaped
by a system prompt that tells it to use headings, bullets and bold.

### 4.1 The em dash

**No `—` in reader-facing prose, in any language.** In German it is simply the wrong character:
German typography uses the Halbgeviertstrich `–` with spaces, never the Geviertstrich. In
English an em dash is legitimate punctuation, and we still leave it out, because our voice does
without it and one banned character is easier to check than a per-text budget. Reach for a comma,
a colon or a full stop. An em dash almost always marks a sentence that wanted to be two.

Two exceptions, both narrow: the `— Patrick` signature at the end of a post, and ranges or
compounds that take an unspaced en dash (`90–140 cm`, `Venlo–Eindhoven`, `2007 – Ithaka`).

Swapping the character does not swap the habit. German takes the spaced `–` for a parenthesis,
and that is correct typography; a `–` that pivots a clause in every other paragraph is the same
move as the em dash it replaced. The German posts averaged under one per 1,000 words on
2026-09-30, which is fine.

This applies to UI strings too, where `MAE — um wie viele Minuten …` should be
`MAE: um wie viele Minuten …`; the catalogs have been at zero since 2026-09-30 (§7.1).

**Be honest about why.** As a detector this one is spent. Measured over eight published essays,
human writers average **3.23 em dashes per 1,000 words** (range 0.33–17.12); GPT-4.1 answers with
10.62 and Claude Opus 4.6 with 9.09, but GPT-5.4 with **1.43**, i.e. well under the humans
(Freeburg 2026). The Economist rewrote 1.2 million words of its own journalism through four
models and reached the same conclusion: only one of them still out-dashes its writers. So a text
full of em dashes is a text with a habit, not proof of anything, and a text with none proves less
still. We keep the ban because German typography settles it anyway and because a banned character
is the one rule in this document a grep can decide.

**And a rule in a prompt is not a rule in the output.** The same paper asked the models to stop:
told explicitly not to use em dashes, GPT-4.1 still produced 3.86 per 1,000 words and DeepSeek V3
1.57 — the structural impulse outlives the instruction. Which is why this is checked at the file
and not requested at the keyboard.

### 4.2 Bold

Bold marks proper nouns, numbers and the one sentence a reader must not miss. It does not mark
`**Begriff**: Erklärung` at the head of every bullet — that layout is copied straight out of a
chat window and is one of the most recognisable formatting tells in existence. A blog post that
needs more than a dozen bold runs is a post that has not decided what matters.

### 4.3 Headings

- A heading is not a summary of the paragraph under it, and it never contains a colon-plus-hook.
  The shapes to refuse, all of them SEO-template furniture that models reproduce by default:
  `<Thema>: So gelingt <Ergebnis>`, `Alles, was du über X wissen musst`, `X: Der ultimative
Guide`, `<Zahl> Tipps, die du kennen solltest`, `Von X zu Y – wie man Z wählt`. A heading names
  what is under it: `Wann Taron am kürzesten ist`.
- **A heading is not a slogan.** Two halves around a comma that mirror each other (`Parks ohne
Zahlen, Tage ohne Wetter`, `Der Park macht um neun auf, die Bahn um zehn`) or a comparison where
  a name belongs (`Ein Block pro Bahn, so hoch wie ihre Schlange`) is an advert's line. All three
  were written for the planner page and read as clever; none of them says what the chapter
  explains. Name it: `Blöcke und Umstiege`, `Bahnen, die später öffnen als der Park`. `pnpm
check:prose` flags both shapes.
- **A heading names what the reader gets, not what our records say.** `Wie die Hallen in unseren
Daten stehen`, `Parks, für die wir keine Hallen kennen` and `Die sechs Parks nebeneinander` were
  three headings of one guide. `Überdachte Bahnen auf der Parkseite finden`, `Toverland` and `Die
neun Parks im Vergleich` say what is under them in the words people search for. `pnpm check:prose`
  warns on a heading with `in unseren Daten` and its twins.
- **A title is a sentence a person would say, with its verb.** `Alton Towers: Die Bahnen dürfen
nicht über die Bäume` dropped the infinitive after the modal, the way speech does (`Ich muss
nach Hause`). In a title the reader has to guess the missing verb, and with it what the post is
  about; Patrick's first reaction on 2026-10-11 was the question „Die Bahnen dürfen nicht über
  die Bäume?“. Say the whole thing (`Alton Towers: Achterbahnen unter den Baumkronen`). `pnpm
check:prose` warns on a German modal followed by a prepositional phrase and no verb in a title
  or heading.
- Do not fragment a text into a heading every three sentences. A section with two sentences under
  it should be a paragraph.
- No title case in German. Sentence case, always.
- Do not skip levels (`##` then `####`), and never repeat the post title as an `##` heading.
- Every chapter heading on this site is drawn by one component; see
  [design system → chapter headings](design/design-system.md#chapter-headings).
- **A title and a heading carry no figure that moves.** The rule next door — never type a wait time
  into a post (§5.4) — is about the body; this one is about the line a reader sees first and the
  line a search result shows. A title is the one string that is quoted into the listing card, the
  RSS item, the `<title>`, the breadcrumb and the shared link, and none of those re-render when the
  number behind them changes. A counted figure belongs in the paragraph that also carries its
  source and its date, where a later edit fixes one sentence instead of every surface at once.

  Measured on 2026-09-22: `Hansa-Park: 214 Tage am Stück geöffnet, …` shipped as a title. 214 is the
  season's opening-day count, read out of the calendar feed that morning; the park can add or drop
  a day at any time, and the post would have gone on claiming the old number in six places. It
  became `Hansa-Park: Der Kärnan fährt 127 km/h, und die Saison hat keinen Schließtag` — a ride spec
  does not move, and "no closed day" stays true whether the season has 212 days or 216. The count
  stayed in the body, attributed to the park's own plan.

  The test: would this line still be true in a year, or after one ordinary data change? A dated
  figure (`Saison 2026`, `23. Mai 2026`) is fine — it says when it was true. A live or counted one
  (`214 Öffnungstage`, `Ø 34 Min.`, `82 Attraktionen`, `1,4 Millionen Gäste`) is not.

### 4.4 Lists

Prose is the default. A list is for things that are genuinely a set: opening hours, height
limits, steps in an order. Turning an argument into five bullets is what a model does when it
does not know how to connect two thoughts. And a list whose every item has the same grammatical
shape reads generated even when its content is fine.

**A date never opens a line.** CommonMark lets a line that starts with `1.` interrupt a
paragraph, so a German paragraph hard-wrapped before `1. November` renders the rest of it as a
numbered list. Prettier then rewrites the list, and it renumbers the items: in the Adventure in
Batavia post `Winterzauber vom 28. November` became `2. November`, and the post said so in public
from 2026-10-08 to 2026-10-11. The Alton Towers guide had the same break in an FAQ answer. Wrap
the line before the day number, or keep `zum 1. November` on one line. `pnpm check:prose` fails on
a line that opens with a German day and month. The same goes for any number followed by a full
stop (`3. Platz`, `2. Zug`) in a paragraph and for translators: no line of running text starts with
one.

### 4.5 Emoji, quotes, separators

- **No emoji as formatting** — never in front of a heading or a bullet.
- **German quotes are `„…“`**, English `"…"`. A German quote closed with the straight `"` is a
  paste artefact, and mixing curly and straight quotes in one text is a tell Wikipedia lists on its
  own. `pnpm check:prose` fails on `„…"`; it found four in three posts and eleven in the legal
  pages on 2026-09-30.
- **No `---` thematic breaks** between sections of a post. The heading is the break.
- Watch for chat-export debris in anything pasted in: `contentReference`, `oaicite`,
  `turn0search0`, `[cite: 1]`, `:::writing`, `【…】`. If one of these reaches a file, the text was
  pasted, not written.
- **One ellipsis per post at most**, and only where a thought really trails off. `[…]` marking a
  cut inside a quote does not count.
- **One exclamation mark per 1,000 words** in a post. Enthusiasm comes from the words. A line that
  carries its own (`Ah, fresh meat!`) still counts against the budget, and a person decides
  whether it stays.
- **Plain-text fields carry no Markdown and no em dash.** `title`, `excerpt`, `seo.title`,
  `seo.description` and the cover's `alt` and `caption` leave the page as plain text: the card,
  the feed item, the `<title>`, the search snippet. `**fett**` arrives there as asterisks.
  `pnpm check:prose` fails on either.

---

## 5. Surface-specific rules

The general rules apply everywhere. These are the additions per surface.

### 5.0 News posts (`category: news`)

- **`date` is the day the post goes live** (merge day, Europe/Berlin), not the day it was written. Set the PR's day; if the PR merges on a later day, correct `date` before the merge.
- **All six languages ship in the same pull request**, for news as for every other post ([the rule](rules/a-post-ships-in-six-languages-in-one-pull-request.md)). Write the German first and derive the other five from it (§6), with the same `translationKey`, `date`, `parkLinks`, `rideLinks` and `coverImage.src`. A later `[!CORRECTION]` goes into all six as well.
- **The title carries one fact, in at most 60 characters.** Not `<Park>: <Fakt>, und <Pointe>` (a park-name prefix, a colon, a comma, „und", a trailing gag): seven of the first eight news titles had that shape, and it is what reads as generated. No list of three news items and no punchline in a subordinate clause. The park name is in the title when it is the subject. Two news titles in the same week may not share a shape, and the same goes for `seo.title`. For the tone, not for copying: „HalloWeekends in Cedar Point: Neues Diablo-Labyrinth", „Traumatica im Europa-Park wird zehn Jahre alt". Read every title aloud before delivering: newspaper headline, or line from an advert?
- **No cover image twice among news posts** ([media database](rules/media-database.md)). Check before writing: `grep -rh -A1 '^coverImage:' content/blog/de/*.md | grep src | sort | uniq -c`. If the photo is taken, pick another from `public/media/<park-slug>/` or `public/media/halloween-2026/`; if there is none, the post goes out without a cover, and the site draws its brand fallback there ([`BlogCoverFallback`](features/blog-cover-fallback.md)). The same image twice is worse than none. A photo whose caption says it is from another park is allowed only when there is nothing else and no other news post carries it.
- A direct quote is a `> [!QUOTE]` block with a linked source line, and a lawsuit or an injury is attributed in every sentence ([a quote names its source](rules/a-quote-names-its-source.md)).
- **The first sentence carries the news**: what happened, to what, when. No scene-setting paragraph in front of it.
- **Then the visitor's questions, in the order a visitor asks them**: what exactly, from when to when, what it costs, what the ticket covers, for whom, what is new about it, how to get there, when it is quieter. Context and links to the guides come after.
- **The core of the story fits one sentence a visitor would say to a friend**, with the park's name in it. The title and the excerpt are written from that sentence, not from the ticket's title.
- **Exact verbs for a gap.** `Einen Grund nennt die Mitteilung nicht`, not `steht … nicht`; the document is named, and so is the gap (§1.9).
- **The end is a `Quellen:` line with links and no dates, then `— Patrick`.** A news post has no `updatedAt`, its tags start with `news`, and `seo.description` stays under 155 characters.
- **About 400 words** (§0.1). A story that cannot fill them with sourced facts is not padded: it waits for more facts, or the PR carries the `Länge:` line of §0.1 and Patrick decides.
- **No bridge sentence copied from the last post.** `Welche Tage in … die ruhigsten sind, zeigt der Kalender.` and `Was Movie Park, Plopsaland, Walibi und Toverland in diesem Herbst machen, steht im Halloween-Überblick.` stood in five news posts in one week. A widget needs no sentence introducing it; a link to the overview goes where a reader would want it: next to the prices, or at the first comparison with another park.
- **"Shape" means the named template**, `<Park>: <Fakt>, und <Pointe>`. Four plain subject-verb headlines in one week are fine. `pnpm check:prose` flags a news title over 60 characters and the template.
- **No send-off** (§1.6): the post ends on its last fact or on the sources.

### 5.1 UI strings (`messages/*.json`)

Roughly 1,850 keys per locale, on every page, read a hundred times more often than any blog post.

- **A label is a label.** `Entdecken`, not `Entdecke jetzt die Welt der Freizeitparks`. No
  marketing verb where a noun does the job.
- **No promise the app cannot keep.** `KI-gestützte Vorhersagen` is a description;
  `Die smarteste Art, deinen Parktag zu planen` is a slogan, and a slogan in a UI string is the
  clearest way to make a product feel machine-written.
- **Empty states and errors say what happened and what to do**, in one sentence, with no apology
  performance and no exclamation mark. `Für diesen Park liegen keine Wartezeiten vor.` plus the
  reason.
- **The number goes in the string, the adjective does not.** `Ø 34 Min.` beats `relativ kurz`.
- German UI copy uses **du**, consistently, and the same term for the same thing everywhere —
  `Wartezeit` is never `Anstehzeit` two screens later.
- **No chat register.** `Gerne!`, `Selbstverständlich!`, `Großartige Frage!`, `Of course!` — a
  product does not perform enthusiasm at somebody reading a wait time. An exclamation mark in a
  UI string is nearly always this, and `pnpm check:prose` counts them.
- New keys are added and validated per [translations](i18n/translations.md); `pnpm
validate:translations` keeps the six catalogs in sync, but it says nothing about whether the
  German sentence is any good.

**The FAQ answers were the worst of it, and they are the most public prose we have.** They ship
as `FAQPage` JSON-LD and as the visible FAQ band on the homepage in six languages. The park-level
ones were exemplary from the start (`seo.faq.waitTimesA` is four placeholders and a pointer). The
homepage set read like this until it was rewritten, and the table stays as the record of what
the register looks like:

| Shipped                                                                       | What is wrong                                                               |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `Ja! park.fan bietet einen detaillierten Crowd-Kalender …`                    | Chat warmth, and "detailliert" is not a fact                                |
| `Absolut! park.fan ist vollständig responsive und funktioniert perfekt auf …` | Two unbacked superlatives and an implementation word a visitor does not use |
| `Unser Ziel ist es, jedem … den bestmöglichen Service zu bieten.`             | Survives the deletion test (§1.7) with nothing lost                         |
| `deine zentrale Plattform für …`                                              | Positioning, not an answer                                                  |
| `… und viele mehr`                                                            | Vague expansion; give the count and link the list                           |

They now answer the way the park-level ones do: the number, the source, the link
(`liveDataA` names its three sources and says how disagreeing numbers are reconciled). One
leftover to watch: five of the seven answers open on `Ja.`, which is right for a yes/no question
and a tell the day a sixth one is added the same way. An answer never opens by repeating its
question (`Wann ist der Park am leersten? Der Park ist am leersten, wenn …`); `pnpm check:prose`
compares each `…Q` key with the first sentence of its `…A` twin.

### 5.2 `alt` and `caption` (media sidecars)

Two different jobs, and the second is not a longer version of the first. The sidecar format is
in [`public/media/README.md`](../public/media/README.md#the-sidecar); the writing rules are here.

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
  information. Never `Bild von` / `image of` — the screen reader already said that.
- **`caption`** is printed under the photo for somebody who _can_ see it, so restating the alt
  wastes the line. Say where, when, what happened, or a fact worth knowing. It may be dry, it may
  be a joke, it may be one clause long.
- The tells here are **structural and only visible across a set**: the same skeleton in every
  entry (subject, participle clause, `dahinter …`), an exhaustive inventory of everything in
  frame, decorative adjectives (`bathed in`, `against a summer sky`, `nestled`), and six captions
  in a row opening with the ride's name. Vary the shape between neighbours deliberately.
- **One joke is a caption; a series of jokes is a template.** The seven performer photos of the
  Halloween guide carried seven punchlines with the same beat: `Der Einzige mit Rhythmusgefühl an
dem Abend. Und der ist tot.`, `Clown plus Kettensäge: was soll da schon schiefgehen?`, `Der
steht da schon eine Weile. Und ja: er wartet auf dich.` The nine set photos did the same
  (`„Us vs You“. Kleiner Spoiler: du bist in der Unterzahl.`). Keep the best one or two per
  series and let the rest say where the photo was taken, what the figure is, or nothing. `pnpm
check:prose` counts quips per collection directory (a colon into a lowercase fragment, a short
  second sentence, a one-word label sentence first, a question, a `nicht X, sondern Y`) and warns
  when more than 40 % of a series of five or more are quips.
- A queue series is not an essay: `man wartet nicht auf eine Bahn, man besichtigt ein Gehege`
  and `die das Warten in Story verwandeln, nicht in totes Stehen` are §2.1 in a caption.
- Six locales are six sentences, not one sentence translated five times.

### 5.3 Meta titles, descriptions and template copy

This is the highest-stakes surface on the site and the one nobody re-reads, because it is
generated: 210 parks, 42,756 attraction URLs, 5,820 calendar URLs (27,984 before the span cuts of
2026-08-28 and 2026-09-01), six locales. **One templated
sentence is not one text — it is tens of thousands of near-identical pages**, which is precisely
what Google's spam policy calls scaled content abuse, whoever or whatever wrote it.

So a template is worth keeping only when it carries **per-entity facts** — the name, the park, the number,
the date — and not adjectives that would be true of any of the 212. `Wartezeiten für {ride} im
{park}: aktuelle Werte, typische Zeiten nach Wochentag.` is fine. `Erlebe die faszinierende Welt
von {ride}` is forty-two thousand pages of the same sentence.

The FAQ and structured-data blocks are prose too, and they are the most quotable text on the
strongest pages we have. Read them like body copy.

### 5.4 Blog posts

Everything above, plus two things specific to a post: never type a wait time into a post, and a
sentence next to a widget must not name a figure the widget renders
([a wait time is never typed into a post](rules/a-wait-time-is-never-typed-into-a-post.md)).
Frontmatter, `ref:` links and widget fences are in the
[blog authoring guide](../content/blog/README.md). And articles matter: it is **das** Efteling,
like `das Toverland` and `das Phantasialand` (`zum Efteling`, `im Efteling`, never `der Efteling`
or `zur Efteling`).

**The excerpt and the meta description are the search snippet.** They carry the finding in full
sentences and in the words people search for, never the post's table of contents: `Dazu die
Bahnen im Gebäude von …, die Reiseplanung und die häufigsten Fragen.` became `Überdacht sind im
Toverland 21 von 44 Attraktionen, im Phantasialand 14 von 40 und in Walibi Holland keine.`
`pnpm check:prose` warns on `häufigsten Fragen`, `FAQ`, `Reiseplanung` and their twins in either
field.

**The excerpt is written last, three sentences at most, one claim each.** No count sentence, no
three facts chained with commas and `und`, no word from our database (`API`, `Einträge`, `führt
einen Wert`, §2.19), and no sentence the reader cannot say in one breath. The PR quotes it on an
`Auszug:` line, and the PO reads that line aloud before the merge.

**One finding per sentence, and read it aloud.** The excerpt is the line most people read and
nobody re-reads, and it is where the week of 2026-10-05 went wrong most often: `Das Legoland
Deutschland baut für Kinder von zwei bis zwölf, und an keiner der neun Headliner-Bahnen spart ein
früher Start genug Zeit für einen Rope-Drop-Tipp.`, `Der Express Unlimited gilt nur in den Studios
und den Islands of Adventure, der einfache Express kostet dort 119,99 bis 319,99 Dollar, und die
Mindestgröße der großen Bahnen liegt zwischen 1,22 und 1,38 Metern.` and the tally of rule 22.
Three findings in one sentence, joined by commas and `und`, is a sentence nobody can say in one
breath. Two short sentences that each answer the reader's question beat one that answers three;
the rest of the findings are what the post is for.

**A guide across many parks says each fact once.** The food guide of 2026-10-09 listed the same
parks in its intro, its table, a section per park, a section `Was die Hausordnungen gemeinsam
haben`, a packing section and eight FAQ answers, so that every park name stood in it a dozen
times and the article numbers of each rulebook (`Ziffer 3.12`, `Artikel 17`) stood in the running
text. The table answers the question for every park; a section per park adds what does not fit
in a cell, in the reader's words; a closing section that walks the parks again is a summary block
(§1.5). The article number belongs in the link, not in the sentence. FAQ answers may repeat a
fact, because they are read alone (below), but they give the answer and the parks, not a second
copy of the body. A length floor is reached with facts the reader needs, never with a second pass
over the same ones.

**A catalogue is sorted one way.** The Alton Towers guide listed its rides twice: a chapter
`Fünf Mal war dieser Park der Erste` with six rides (one of them a record, not a first) and a
chapter `Die übrigen Bahnen` with the rest, so that a reader looking for Wicker Man had to know
whether it counted as a first. Sort rides by where they stand in the park, one subheading per
area, and put the first or the record into the ride's own paragraph. A heading that counts
(`Fünf Mal …`) must match what is under it, and a count is the first thing to go wrong when a
section is edited.

**An FAQ answer stands alone.** It is read without the post around it, in a search result or an
answer engine, so it never points elsewhere: `Zeitraum und Schwellenwerte stehen im Abschnitt ganz
oben.` and `die Tabelle weiter oben schlüsselt es nach Monaten auf` became the period, the
threshold and the two months that matter. On 2026-10-06 about forty answers in older guides still
pointed to `weiter oben` or `the table above`; they are for the review pass, not the check.

Because it stands alone, an answer of one sentence that carries one figure may repeat the body's
sentence word for word: `Eine Tageskarte kostet online ab 39 €, an der Kasse 64 €.` is the answer,
and a reworded copy would only be worse. What it may not do is copy a paragraph, or read a table
row out again (`faq-echo`, `faq-table-echo` in §2.20).

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
9. History, with years and visitor numbers from pages opened for the post. Every guide has one
   (Patrick, 2026-10-14).
10. The FAQ, the signature, then the source list. Nothing but those two comes after the FAQ. (A
    news post ends the other way round: the `Quellen:` line, then the signature, §5.0.)

A park whose story is the hook may open with its history; the PR says why the order changed.
A title passes when Patrick would understand it without knowing the post.

**A corrected fact in a guide moves `updatedAt` and gets no box.** `[!CORRECTION]` is for news only
([a news correction is shown](rules/a-news-correction-is-shown-never-silent.md)); a wording fix
moves nothing ([`updatedAt` is for new content](rules/updated-at-is-for-new-content.md)).

### 5.5 Machine-facing text

`llms.txt`, the agent skills, the MCP tool descriptions and the feed metadata are read by people
too, when something breaks. Same rules, minus the voice: short, factual, no puffery, no
significance claims.

### 5.6 A heading and the line under it

A section on the homepage opened like this, in six languages:

> **Mit Kindern** · Welche Bahnen darf mein Kind fahren? Nach Körpergröße nachsehen
>
> Jeder Park nennt pro Bahn eine Mindestgröße. Für diese Parks steht auf einer Seite, was ein
> Kind bei welcher Größe fahren darf, in den Stufen, die der Park selbst vorgibt.
>
> (card) Welche Bahn ab welcher Größe.

Six tells in four lines, and each one is on the list below.

1. **A question, then an order.** `…? Nach Körpergröße nachsehen` is a button label glued to a
   question. A heading is one sentence or one noun phrase. This one is strong enough on its own,
   and `pnpm check:prose` fails on it in every language: a German infinitive at the end, or a
   call-to-action verb up front (`Check by height`, `Kijk het na`, `À vérifier`, `Comprobarlo`,
   `Da controllare`).
2. **The reader's voice.** `mein Kind` is the search box talking. The site says `du`, and a heading
   in the first person imitates the query it wants to rank for.
3. **The dek repeats the heading.** Kind, Bahn, fahren and Größe twice, and the card a third
   time. The line under a heading says what the heading does not.
4. **Copy that describes the site.** `steht auf einer Seite` tells the reader where something is
   instead of what it is.
5. **The truism opener.** `Jeder Park nennt pro Bahn eine Mindestgröße` is true of every park and
   known to every parent. Cut it and nothing is missing (§1.7).
6. **The tacked-on qualifier.** `…, in den Stufen, die der Park selbst vorgibt` arrives after the
   sentence has ended, to fend off an objection.

Tells 2 to 6 are weak and turn up alone in good copy too, so the check counts them per group of
strings (a heading and its siblings in `messages/*.json`) and warns when two meet. Rewritten, the
block says one thing in each line:

> **Mit Kindern** · Ab welcher Größe dein Kind mitfahren darf
>
> Für jeden dieser Parks: alle Bahnen, sortiert nach der Mindestgröße, die der Park angibt.

The card line goes, or carries a figure the heading does not (how many rides at that park have a
height limit).

### 5.7 The glossary (`content/glossary/*.ts`)

274 terms in six languages, 1,600 URLs in the sitemap, and every `glossary-widget` fence in a post
prints a definition verbatim. On 2026-09-30 it was the one surface where the whole of §1 and §2
could be found in a single paragraph:

> Suspended Coasters sind seltener als Inverted Coasters, bieten aber ein einzigartiges Erlebnis.
> Die Schwingbewegung lässt selbst moderate Kurven dramatisch wirken, und das Gefühl des Fliegens
> erzeugt eine spannende Exposition. […] manche Enthusiasten lieben sie für ihre rohe,
> unvorhersagbare Natur, während andere sie weniger mögen.

Measured against the posts in the same language, per 1,000 words:

| Pattern                                                   | English glossary | English posts |
| --------------------------------------------------------- | ---------------- | ------------- |
| participial tail (`, making`, `, creating`, …)            | 1.0              | 0.01          |
| `sensation`, `visceral`, `exhilarating`                   | 1.5              | 0             |
| `signature`, `hallmark`, `centerpiece`, `showpiece`       | 0.7              | 0.02          |
| `dramatic`, `spectacular`, `intense`, `intensity`         | 1.4              | 0.02          |
| `enthusiast(s)`, mostly as the owner of an opinion (§1.2) | 1.4              | 0.06          |

The German file, translated from the English one, carries the same shapes plus translation debris
(`dank ihrer starken Schaukästen` for _showpiece_, `Whip-Sensation`, `navigiert durch Kurven`).

A definition is reference text, so it gets a stricter version of the rules, not a looser one:

- **What it is, how it works, one example with a place and a year.** `Ein Top Hat steigt senkrecht
auf und fällt auf der anderen Seite senkrecht ab. Red Force in Ferrari Land (2017) hat einen.` That is the whole job.
- **No feeling the reader has not had.** `einzigartiges Erlebnis`, `spannende Exposition`,
  `ein unverwechselbares Gefühl` describe nothing; the physics does (`der Zug hängt am Scheitel
zwei Sekunden kopfüber`, `negative G-Kräfte heben dich aus dem Sitz`).
- **No tail** (§2.3), **no crowd opinion** (§1.2), **no significance** (`einer der markantesten
Achterbahntypen des letzten Jahrzehnts`, `das dramatische Herzstück`).
- **Write each locale from the facts, not from the English sentence** (§6). A German definition
  that reads `Hersteller … werden für ihre robuste Technik und ihren extremen Nervenkitzel
geschätzt` has kept the English skeleton and lost the German reader.
- A changed definition changes `GLOSSARY_CONTENT_HASH` and `GLOSSARY_CONTENT_DATE`
  (`lib/glossary/content-date.ts`); `pnpm check:glossary-content-date` prints the new hash.

`pnpm check:prose` scans the glossary per term and reports each rule with the term ids.

### 5.8 The public changelog (`content/changelog/`)

English only, and every sentence in it is about us, so the honesty family is an error there, as in
a catalog string. A list item never opens on bold: 2.12.0 shipped sixteen items shaped
`- **A short claim.** The explanation`, the layout §4.2 names, because the collection's README
showed it as the template. `title` and `summary` are plain-text fields (§4.5). A release note picks
what a visitor would notice and says it with the number behind it; which changes belong in one at
all is [a version is a unit of communication](rules/a-version-is-a-unit-of-communication.md).
`pnpm check:changelog` runs the changelog half of `pnpm check:prose` in CI.

### 5.9 Commits, pull requests, tickets and comments

Nobody outside reads these, and Patrick reads all of them. The same rules apply, plus these:

- **Commit messages, PR titles and PR bodies are English; Linear tickets and comments are
  German.** A commit reads `PAR-<n>: <what changed>`, a news PR `News: <what happened>`.
- **Say what changed, not how carefully.** `refined for clarity and consistency while preserving
the structure` is Wikipedia's example of a generated edit summary (§2.18). The text grows with
  the change, not with the diligence: a small fix gets three sentences and the commands that were
  run. The review is one line (`Review: <model>, <n> passes, <n> fixed, <n> noted`), not a
  chronicle, and the reasoning stands once, in the PR, not again in the closing comment.
- **The shape of a commit**: a subject line under 72 characters, a blank line, then a body wrapped
  at about 72 that says what changed and why, in a few sentences; the commands that were run go
  last, one per line. For example:

  ```text
  PAR-992: Werktag means Monday to Friday nowhere it shouldn't

  „Werktag“ includes Saturday. Where a post used it for Monday to Friday,
  the sentence now says so, or the post defines the word once where it
  first uses it. The Italian „feriali“ got the same pass.

  pnpm check:prose
  pnpm check:blog-updated-at
  ```

- **One thought per sentence, subject, verb, object.** No inversion for effect, no maxim, no
  colon punchline, no rhetorical question, no chain of dashes. Not `Ein Band, das nach einem
Quantil benannt ist, ist damit noch keines` but `Das Band heißt p90, enthält aber nicht das
90-%-Quantil.`
- **A number instead of an image.** Not `die Achse fällt auf ihre 16 px zusammen` but `Die Achse
ist 16 px hoch.`
- **Code does not see, know or want.** Not `der Schalter sieht das Fenster` but `die Media Query
prüft jetzt auch die Höhe` (§2.13 for software).
- **German text keeps the English technical term** and never coins a German one: `Assertion`, not
  `Zusicherung`; `Run`, not `Durchgang`; `Checkbox`, not `Kästchen`; `Symptom`, not `Fehlerbild`;
  `pointer: coarse`, not `Grobzeiger`. Having to invent a German word is the sign to use the
  English one. The board's own words (Claim, Übergabe, Rückfrage, Fehlversuch, Beifang,
  Worker-Log, Triage) are never varied (§2.6).
- **New German orthography everywhere**: `dass`, `muss`, `passt`, `Prozess`. `pnpm check:prose`
  fails on the old spellings in every German text it reads, except proper names (`Schloß Dankern`)
  and quotes; commits and Linear it cannot read, so that part is the writer's.
- **A ticket title says what holds afterwards**, or, for a bug, what was observed with its number
  (`X zeigt Y, obwohl Z`). The body is Kontext, Akzeptanzkriterien, Definition of Done and
  Nicht-Ziele; no summary of the summary. A ticket that changes a prose rule quotes the sentences
  that caused it.
- **An option put to Patrick is understood on the first read**: the situation in two sentences,
  then one line per option.
- **A comment in code says why, once** ([the rule](rules/a-comment-says-why-once.md)). A testable
  claim in a test comment becomes an assertion.

---

## 6. German is the source; the other five are derived

German is written first and the other locales come from it, in the same pull request and with
the same `updatedAt` ([a post ships in six languages in one pull request](rules/a-post-ships-in-six-languages-in-one-pull-request.md)).
Two failure modes follow.

**Mirror translation.** A sentence carried across word for word keeps German word order and
German sentence length, and reads translated in all five targets. Write each locale as its own
sentence. Where a language wants a different order, let it have one.

**Language-specific typography, applied per language.** The em-dash ban is universal here, but
the rest is not:

| Locale | Quotes      | Notes                                                                                  |
| ------ | ----------- | -------------------------------------------------------------------------------------- |
| de     | `„…“`       | Halbgeviertstrich `–` with spaces; `du`; no title case; decimal comma, `.` thousands   |
| en     | `"…"`       | No em dash (§4.1); decimal point, `,` thousands                                        |
| nl     | `“…”`       | `je`; **never** the German `„` — 28 of them had been carried over; watch compounds too |
| fr     | `« … »`     | Non-breaking space before `?` `!` `:` `;` and inside the guillemets                    |
| es     | `«…»`/`"…"` | Opening `¿` and `¡` are not optional                                                   |
| it     | `«…»`/`“…”` | Both are correct; pick one **per post** — five of ours use guillemets, seven don't     |

**What stays identical, and what does not.** The same in all six files: `translationKey`, `date`,
`time`, `mode`, `featured`, `category`, `parkLinks`, `rideLinks`, `coverImage.src` and
`coverImage.credit`, the chapters in the same order, the widget fences and the `ref:` links.
Written per language: `title`, `excerpt`, `seo.*`, the cover's `alt` and `caption`, and the tags,
in the same order. The facts are the same in all six, none added and none dropped, and the five
derived texts land within about a quarter of the German word count. A link to another post points to
that post's slug in the same language. A slug made only of names is the same in all six; a slug
with German words in it gets its own per language. A `[!QUOTE]` stays in the language it was said
in, with a translation note ([blog authoring guide](../content/blog/README.md)).

**A fix goes into all six.** A sentence a rule or the critic caught in German is changed in every
locale, also where the check did not fire on the translation: the same habit usually survived the
translation in other words. The critic reads German and English; in Dutch, French, Spanish and
Italian the spots are found from its findings.

**UI strings follow the same direction.** A key is written in `messages/de.json` first and ships
in all six catalogs in the same PR. The failure is the German string carried into the other five
because the key has to exist there: `pnpm validate:translations` compares only the keys, and
`pnpm check:untranslated` is what catches the German value.

English needs its own pass rather than a translation: the English tell list (§3.2) is much
better documented than the German one, and a German sentence rendered literally into English
often lands squarely on it (`stellt dar` → `serves as`). Contractions are normal English
(`don't`, `it's`); a post that writes `do not` and `it is` throughout reads translated.

Measured on 2026-09-30, that was most of them: 16 of the 22 English posts carried two
contractions or fewer, `efteling-disney-of-the-netherlands.md` none against 78 full forms, and
the English guide page none against 65. The three that read naturally (`phantasialand`,
`the-art-of-waiting`, `halloween-theme-parks`) sit between 60 and 85 % contracted. A full form
stays where it carries stress (`it **is** open on Mondays`) or in the legal pages; everywhere
else, contract. `pnpm check:prose` warns when fewer than a quarter of the forms in an English
text of 500 words or more are contracted. It does not check the glossary, where a reference
register is fine.

This is a rule about sounding translated, not about sounding human. Contractions stopped being a
human marker in 2026: the same cohort of models contracts at anywhere from 1,200 to over 30,000
per million words (Rudnicka & Juzek 2026), and `it isn't X, it's Y` is now a model shape (§2.1).
Contract where English speakers do; do not contract to look human. The 25 % is a floor, not a
target: a post where every natural contraction is taken lands between 90 and 95 %, and that is
fine, because the forms left (`what it is`, `how far it is`) cannot contract.

---

## 7. The check before you publish

Read the finished text out loud. Anywhere the rhythm turns metronomic, break it: a short
sentence, a dropped connective, an aside. Then run the check:

```bash
pnpm check:prose              # no network, no running site
pnpm check:prose --strict     # warnings count as failures
pnpm check:prose --verbose    # every hit, not the first forty
pnpm check:prose --rule=faq-echo   # every occurrence of one rule, in every file
```

`scripts/check-prose.mjs` is the executable half of this document and holds the same lists, the
way `attractionIsOutOfSeason()` is the SQL twin of the season rule: change one half and you
change both. It walks the posts, the six message catalogs, every media sidecar, the glossary
(per term), the content pages and the hero copy in their `page.tsx`, the homepage announcement,
the changelog (§5.8; `--only=changelog` for that surface alone), the three agent skills and
`/llms.txt`; for `Warteschlange` alone also every string in the tracked `.ts` and `.tsx` files
under `app/`, `components/` and `lib/`, where the menus keep their chapter lists. It splits its
output the way a regex can actually be trusted to:

- **Errors** are rules with no legitimate exception: a `—` in a post body or in German or Dutch
  prose, a growing em-dash count in a catalog, an honesty claim or chat register in a string that
  can only be about us, placeholder text, `Schlange` for `Warteschlange`, a German quote closed
  with a straight `"`, `die Antwort auf` in any of its six languages, `nennen eine` and its
  Dutch twin, a model that grades itself in any of its six languages, `ob der Tag aufgeht` and its
  five translations, `zwölf von zwölf`, `kürzer besetzt`, `der Park ist ruhig` with its
  flat waits, `hier steht` and its kin, `unterschiedliche Preise nennen` with no price in sight,
  a train that is angeworfen, the research diary (`abgerufen am`, `die gelesenen Seiten`) and a
  tally that drops its noun (`vier regeln nur den Ort, fünf schweigen`) (§3.3), a post that rates
  its own information (§1.4), a German date that opens a line (§4.4) and a German spelling from
  before 1996 (`daß`, `muß`, `Prozeß`, §5.9).
- **Warnings** are budgets and signals a person decides on. `eerlijke prijzen` in a paragraph
  about a restaurant means _fair_ prices and stays; the same word in a UI string does not.

The catalogs get a **ratchet** rather than a verdict, because they predate the rule: the
per-locale em-dash counts in §7.1 are written into the script as a baseline that may fall and
never rise. That is what keeps a green check honest instead of hiding the debt.

It found something on its first run. `blog.intro` — the tagline under the hero on `/blog`, in
all six languages — opened with `Ehrliche Reiseberichte` / `Honest trip reports` / `Resoconti
onesti`, against a ban that had been in `CLAUDE.md` the whole time and had never been applied to
anything but posts. The word is gone; the sentence after it, which _shows_ the same thing
("Geschrieben von Menschen, die anstehen, damit du es nicht musst"), was already doing the work.

The greps below are what the script runs, spelled out for a one-off look at a single file:

```bash
# 1. Em dashes in reader-facing prose (expect: only the "— Patrick" signature)
grep -rn "—" content/blog/de content/blog/en
grep -n "—" messages/*.json                       # UI strings, see §7.1

# 2. Negative parallelism budget (target: <= 1 per 1000 words)
for f in content/blog/de/*.md; do printf '%-45s %4d words  sondern=%d\n' \
  "$(basename "$f")" "$(wc -w <"$f")" "$(grep -o 'sondern' "$f" | wc -l)"; done

# 3. Banned house words
grep -rniE "ehrlich|das schild|the sign|het bord|le panneau|el cartel|il cartello" \
  content/blog --include="*.md" --exclude=README.md

# 4. Participial clauses
grep -rnE "[a-zäöüß]{5,}end," content/blog/de
grep -rniE ", (ensuring|highlighting|reflecting|showcasing|underscoring|contributing to)" content/blog/en

# 5. Summary formulas and editorial commentary
grep -rniE "zusammenfassend|abschließend lässt|insgesamt lässt|es ist wichtig zu (beachten|betonen)" content/blog/de
grep -rniE "in conclusion|overall,|it'?s important to note|worth noting" content/blog/en

# 6. Vocabulary sweep (spot-check, not a gate)
grep -rniE "atemberaubend|nahtlos|maßgeschneidert|essenziell|ganzheitlich|eintauchen" content/blog/de
grep -rniE "\b(delve|boasts|vibrant|nestled|pivotal|showcase|testament|underscore|tapestry)\b" content/blog/en

# 7. Mechanical openers and question set-ups (§2.7, §2.12)
grep -rnE "(^|[.!?] )(Darüber hinaus|Des Weiteren|Interessanterweise|Letztendlich|Das Ergebnis\?|Der Grund\?)" content/blog/de
```

The heading and dek tells (§5.6), the product as protagonist (§2.13), the negation budget (§2.14),
the definition colons (§2.15), staccato (§2.10), the ellipsis and exclamation budgets (§4.5), a
`[!QUOTE]` without a source line, Markdown in a plain-text field, the participial tail in six
languages (§2.3), colon pivots (§2.7), English without contractions (§6), quip series in a caption
collection (§5.2), an FAQ answer that repeats its question (§5.1), things that talk, false
agency and a document that does the sums (§2.13), crowd opinions (§1.2) and travel-guide copy
(§3.4) in all six languages, `Werktag` and `feriali` without the span they mean (§1.2), and a news title over 60 characters or in the
`<Park>: <Fakt>, und <Pointe>` shape (§5.0) are counted by the script itself; a grep cannot see
paragraphs.

What it still cannot see is the wink at the end of a paragraph (§2.17), the quiet teaser
(§2.16), whether a sentence claims anything at all (§1.7), and whether the post agrees with
itself (§7.2). That is the review pass.

### 7.1 Measured state

On **2026-09-30**, after the pass over every text (posts, glossary, catalogs, captions, the
landing pages, the guide page, the changelog and the skills):

| Surface                        | Measured                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| Blog posts                     | 142 (de 27, the other five 23 each). Non-signature em dashes: **0**. Errors: **0**.               |
| Sentence-length variance       | de 0.57, en 0.59, nl 0.58, fr, es and it 0.60. Lowest single post 0.40.                           |
| Commas per 100 words           | de 8.2, en 6.4, nl 6.4, fr 7.7, es 6.7, it 6.7.                                                   |
| Colon pivots per 100 sentences | Medians de 6.5, nl 7.8, es 9.6, en 10.3, it 11.4, fr 12.1. Every post under 15.                   |
| English contractions           | Lowest post 60 %, median 94 %. None under the 25 % floor; that morning 16 of 22 had two or fewer. |
| `Schlange` for `Warteschlange` | **0** (255 changed that day).                                                                     |
| Em dashes in `messages/*.json` | **0** in all six catalogs; the ratchet in the script is at zero.                                  |

Two notes on reading the output. `content/blog/README.md` matches most of the banned-word
patterns because it documents them, which is why the script skips READMEs. And the Spanish Walibi
post's `cartel «Speed Zone»` is a sign with a name painted on it, inside an image caption, which
is the thing itself and not the prop §3.3 bans. A check produces candidates, not verdicts.

### 7.2 The review pass

`pnpm check:prose` settles what a regex can. The rest needs a second read, and Flavio Copes' point
(see Sources) is that it works best as a **separate pass with its own instruction**, run on the
finished text instead of folded into writing it. A session that wrote a post runs it before
handing the post over, with this instruction:

> Review the finished text against docs/blog.md. Keep every fact, number, source, quote and the
> structure. Fix only the patterns the rules name. List each change with the rule it answers.

- The pass produces **proposals**. A change that makes a sentence worse is dropped, whatever rule
  it cites.
- It does not flatten the voice. A first-person opinion, a deliberately short paragraph and a joke
  stay.
- It does not check facts, and it cannot supply a missing one. Sources, quotes and anything legal
  are their own step ([a quote names its source](rules/a-quote-names-its-source.md)).
- A correction that comes back becomes a rule here, with the example that caused it. A rule that
  keeps producing worse sentences is changed or dropped. That is how every section above started.

The pass gets a second instruction, run as its own read, because the Alton Towers guide of
2026-10-11 passed `pnpm check:prose` without a single hit and still contradicted itself four
times: the walk from the car park took 10 to 28 minutes in one section and 15 to 25 in the next,
an FAQ answer denied children under 140 cm any of the seven big rides although two of them start
at 120 cm, `Fünf Mal war dieser Park der Erste` stood over six rides, and the Heide Park had
`ebenfalls vier` firsts where the post had counted five.

> Read the finished text once for agreement only. List every figure, date, price, height and
> count that occurs more than once, and every heading that counts, and check each occurrence
> against the others and against the source list. List every claim about where something is in
> the park and name the source that places it there. Change nothing; report each conflict with
> both lines.

Each conflict is settled against the source, then the duplicate goes (§5.4, each fact once). A
place in the park (`liegt am weitesten vom Eingang`, `hinter der ersten Kuppe`) needs a source
like any other claim; the park map and the area list on Wikipedia are sources, a guess from the
order of a list is not.

The critic is a third read, run last and by a fresh agent that has not seen the text or any
earlier finding. It marks what a reader who spots machine text would mark, and since 2026-10-13 it
also grades the check itself. The order, word for word:

> Du bist der Kritiker. Du hast diesen Text nicht geschrieben und kennst keinen Entwurf davon.
> Du suchst nur eins: Sätze, die ein Leser, der KI-Texte erkennt, als maschinengeschrieben
> erkennen würde. Datei(en): <pfad>. Regelwerk: docs/blog.md, lies §0 bis §2 und §4.3 vor dem Text.
>
> Lies Titel, Auszug und Text einmal ganz wie ein Leser, dann Absatz für Absatz. Markiere jeden
> Satz, der
>
> - unverändert in einem Beitrag über einen anderen Park stehen könnte (Transplantationstest),
> - nach dem Streichen nichts fehlen lässt (Streichtest),
> - Werte, Zahlen oder Neuerungen vorliest, ohne dass der Leser jeden einzelnen braucht (§3.3,
>   Regel 23),
> - wie ein Merksatz, eine Pointe ohne Fakt, eine Werbezeile, eine Ankündigung oder ein Rätsel klingt,
> - zu einem Muster gehört, das sich durch den Text zieht: gleiche Absatzenden, gleiche
>   Satzanfänge, Doppelpunkt-Pivots, Dreierketten, Zwinker-Sätze, Dinge, die reden,
> - zu einem der Muster gehört, die nur der Kritiker sieht (§2.20): Refrain (die Kernaussage steht
>   in Auszug, Kapitel, Fließtext und FAQ), wiederholter Vorbehalt (dieselbe Datenlücke in mehreren
>   Kapiteln eingeräumt), Echo (ein Satz wiederholt die Tabelle direkt darüber), Andeutung durch
>   Nebeneinanderstellen (Zahlen unter einer Tabelle sollen eine nicht ausgesprochene Ursache
>   nahelegen), Alltagsvergleich, der eine Messung vortäuscht, oder Zwinker-Klammer, Rätsel-Apposition („gehörte dem,
>   dem …, Maximus Müller“), Pointe unter sieben Wörtern ohne Fakt am Absatzende, Zusammenfassung, die Fakten
>   aus den Park-Abschnitten wiederholt, Vergleich, der Zahlen aus demselben Absatz noch einmal in
>   Worten sagt, Frage-Antwort über eine Überschrift hinweg (ein Kapitel endet auf einem Zweifel,
>   das nächste beginnt mit der Antwort).
>
> Auch wenn keine Regel in docs/blog.md das Muster beim Namen nennt. Fakten, Aufbau und
> Rechtschreibung prüfst du nicht, dafür gibt es andere Prüfungen.
>
> Einen Witz, der einen Fakt trägt, markierst du nicht; ein Lächeln alle drei bis vier Absätze
> ist gewollt (docs/blog.md §0.1).
>
> Zu jedem markierten Satz schreibst du eine bessere Fassung, die denselben Fakt trägt und sich
> besser liest, mit Witz, wo er passt (docs/blog.md §0.1). Kürzen ist kein Ziel. „streichen“
> schlägst du nur vor, wenn der Satz einen Fakt aus demselben Text wiederholt oder den Streichtest
> besteht, also nichts trägt; dann nennst du die Stelle, an der der Fakt schon steht.
>
> Danach beurteilst du den Prosa-Check: führe `node scripts/check-prose.mjs --verbose --file=<pfad>`
> aus und lies, was er zu dieser Datei meldet. Markiere je Befund, ob der Check ihn gefunden hat,
> und jede Meldung des Checks, die danebenliegt.
>
> Antworte nur so, ohne Text davor oder danach:
> URTEIL: KEIN SLOP | SLOP
>
> - "<wörtliches Zitat>" — <warum, ein Satz> — <bessere Fassung, oder "streichen: steht schon in <Stelle>"> — check:prose: <Regelname> | fehlt
>
> Bei KEIN SLOP ohne Liste.
> PROSA-CHECK: <n> von <m> Befunden gefunden · Fehlmeldungen: <"Zitat" — Regel — warum falsch> oder keine
> Ein Muster, für das check:prose keine Regel hat, zusätzlich als
> NEUE REGEL: <Muster> — <Beispiel aus dem Text> — <wie ein Skript es erkennen könnte, oder "nur Kritiker">.
> Ändere nichts, committe nichts, schreibe nichts nach Linear.

`<Regelname>` is the first word of the check's message, a rule from §2.20 (`widget-announcement`)
or the name of an older one. A pattern the critic marks and the check misses becomes a ticket
"Prosa-Regel: …", a message the check gives and the critic finds wrong one "Prosa-Regel falsch: …".
The first run of this order, over the twelve guides, found 0 of 87 findings and no false alarms.

How the critic is used:

- **The critic rewrites, it does not shorten.** Every finding comes with a better sentence that
  carries the same fact, and the writer takes it or writes a better one still. A post may be
  rewritten as far as it needs; it is not cut down to pass. A sentence goes only when it repeats a
  fact that already stands elsewhere in the post, or carries none (the deletion test of §1.7).
  Patrick on 2026-10-22: „nicht sinnlos kürzen“.
- **Two rounds at most.** What it still marks after the second is rewritten once more by the
  writer, plainly, with the fact kept. The critic is never the reason a post does not ship, and
  never the reason it falls under its length floor (§0.1).
- **German before the translation, English after it.** The other four take the critic's findings
  over from those two (§6).
- **A rewrite adds no fact and drops none**, except a repeat. A verdict the critic proposed is not
  a fact either; a Gardaland fast-pass verdict that nobody had checked was caught that way.
- **It does not take the voice out** (§0.1). A joke that carries a fact stays, and so does the one
  wink a section may have (§2.17). A post that makes nobody smile after the rounds has lost
  something the rounds were not asked to remove.
- **A miss is reported in Linear and fixed in the repo.** A pattern the check should have seen
  goes into a ticket „Prosa-Regel: …“ in Triage, or into the PR body where the writer opens no
  tickets; the rule itself is written here and in the script, never only in the ticket.
  A new rule in `scripts/prose-slop-patterns.mjs` starts as a warning, carries a positive and a
  negative case in `pnpm test:prose-rules`, and its PR reports how often it fires over
  `content/blog/` on current `main`. Run the check from current `main`: twelve guide branches once
  passed on a stale copy of the script and failed 21 times after the merge.

**What the PR carries**, so the PO can check it before merging:

```text
Länge: <n> Wörter (de, wc -w), Untergrenze <n>
Auszug: <the excerpt, verbatim>
Quellen-Check: <n> Fakten, <n> Quellen, gestrichen <n>
Prosa-Review: <n> Änderungen
Stimmigkeit: <n> Konflikte, alle gelöst
Kritiker: de <KEIN SLOP | SLOP, <n> umgeschrieben> nach <n> Runde(n), en … · check:prose fand <n> von <m>
```

Every warning `pnpm check:prose` gives on a file the PR touches is fixed or justified in one line
of the PR; errors are zero.

---

## Sources

Field guides:

- Wikipedia, [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) — the
  WikiProject AI Cleanup field guide, and the backbone of §1–§4.
- Wikipedia, [Anzeichen für KI-generierte Inhalte](https://de.wikipedia.org/wiki/Wikipedia:Anzeichen_f%C3%BCr_KI-generierte_Inhalte) — the
  German counterpart, with the German-specific notes on Partizip I, Trikolon and connectives.
- The Economist, [How to spot AI writing](https://www.economist.com/culture/2026/07/30/how-to-spot-ai-writing)
  (July 2026) — 1.2 M words, 55,940 sentences, its own journalism rewritten by four models. The
  source for §2.9.
- The New York Times Magazine, [Why Does A.I. Write Like … That?](https://www.nytimes.com/2025/12/03/magazine/chatbot-writing-style.html) (Dec 2025).
- a16z crypto, [The habits of AI writing — and what to do about them](https://a16zcrypto.com/posts/article/ai-writing-hallmarks-for-founders/) —
  an editor's taxonomy: pseudo-profundity, empty contrasts, gesture words, the transplant test
  behind §1.7.

Linguistics:

- Reinhart et al., [Do LLMs write like humans? Variation in grammatical and rhetorical styles](https://www.pnas.org/doi/10.1073/pnas.2422455122),
  PNAS 122(8), 2025 ([free preprint](https://arxiv.org/abs/2410.16107)) — participial clauses at
  2–5×, nominalisations at 1.5–2×, `that`-clause subjects at 2.6× the human rate.
- Kobak et al., [Delving into LLM-assisted writing in biomedical publications through excess vocabulary](https://www.science.org/doi/10.1126/sciadv.adt3813),
  Science Advances 11(27), 2025 ([free full text](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12219543/)) —
  15M abstracts; the 2023–2024 excess words are style verbs and adjectives, not content nouns.
- Freeburg, [The Last Fingerprint: How Markdown Training Shapes LLM Prose](https://arxiv.org/abs/2603.27006),
  2026 — the em dash numbers in §0 and §4.1, including the finding that an explicit instruction
  not to use them only halves the rate.
- Juzek & Ward, [Why Does ChatGPT "Delve" So Much?](https://arxiv.org/abs/2412.11385), ACL 2025 —
  where the lexical over-representation comes from.
- Russell, Karpinska & Iyyer, [People who frequently use ChatGPT for writing tasks are accurate and robust detectors of AI-generated text](https://aclanthology.org/2025.acl-long.267/),
  ACL 2025 — the reason the checks here are qualitative and not a classifier.

German practice:

- [ContentConsultants: KI-Texte erkennen](https://www.contentconsultants.de/ki-texte-erkennen-warum-man-texte-besser-selbst-schreibt/),
  [mindtwo: Typische ChatGPT-Phrasen](https://marketing.mindtwo.de/blog/typische-chatgpt-phrasen-ki-content-entlarven-und-optimieren),
  [eology: Merkmale von ChatGPT-typischen Texten](https://www.eology.de/news/merkmale-von-chatgpt-typischen-texten-beim-ai-roundtable),
  [shribe: KI-Floskeln](https://shribe.de/ki-floskeln/),
  [WortLiga: 20 Top-KI-Floskeln](https://wortliga.de/20-top-ki-floskeln-im-januar-2025/) (the
  German opener list in §1.7).

Definitions and the model that writes here:

- Merriam-Webster, [Word of the Year 2025: slop](https://www.merriam-webster.com/wordplay/word-of-the-year).
- Arize, [Anthropic says it fixed Claude's writing](https://arize.com/blog/anthropic-says-it-fixed-claudes-writing/)
  (September 2026): six measured habits (salience flags, verdict intensifiers, signposts,
  contrast reframes, stock metaphors, gotcha framing) and the em-dash rate across two versions.
  The source of §2.18 and of the contrast reframe in §2.1.
- Rudnicka & Juzek, [Beyond "AI Language": the case for the idiolectal nature of LLM output](https://arxiv.org/abs/2608.06589)
  (August 2026): each model has its own style; contraction rates within one 2026 cohort range from
  1,200 to over 30,000 per million words (§6).
- Juzek, [AI-associated lexical shifts across 34 languages](https://arxiv.org/abs/2605.25358)
  (May 2026): "emphasize"-type verbs over-used in 24 of 34 languages (§3.1).
- Paech et al., [Antislop](https://arxiv.org/abs/2510.15061) (2025): some patterns appear over
  1,000 times as often in model output as in human text.

Anti-slop rulesets:

- jalaalrd, [anti-ai-slop-writing](https://github.com/jalaalrd/anti-ai-slop-writing) (MIT,
  directive v2, April 2026): the source of §1.8, §2.10, §2.11, the credential opener in §1.4, the
  budgets and the plain-text rule in §4.5, and the vocabulary and stock phrases added to §3 on
  2026-09-30.
- blader, [humanizer](https://github.com/blader/humanizer) and hardikpandya,
  [stop-slop](https://github.com/hardikpandya/stop-slop): the colon set-ups in §2.16, the stacked
  qualifier in §1.7, false agency in §2.13 and the send-off in §1.6 were taken from them on
  2026-09-30.
- Flavio Copes, [Why I use anti-slop skills](https://flaviocopes.com/anti-slop/) (updated
  29 September 2026): the separate review pass in §7.2, the strong-versus-weak split from
  humanizer (§0), stop-slop's question-word rule behind §2.12, and "open with the useful point"
  in §5.0.

Considered and left out, because they fit a chat answer or English, not our posts: stop-slop's
ban on every adverb and on every sentence starting with a question word (narrowed to §2.12 and the
volume adverbs in §3.1), anti-ai-slop-writing's ban on the passive (narrowed to §2.11), its budget
of one em dash per 500 words (ours is zero), "keep paragraphs short" (ours must be uneven, §2.7),
and the lists of first words by model, which describe chat replies. deslop's rules are about code
and belong in the conventions, not here.

Adjacent standards:

- Google Search Central, [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
  and [guidance on AI-generated content](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content) —
  the scaled-content-abuse framing behind §5.3.
- WebAIM, [Alternative text](https://webaim.org/techniques/alttext/) — the alt-versus-caption
  split in §5.2.
