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

### 1.3 Have a verdict

Both-sides hedging with no conclusion (`einerseits … andererseits`, `es kommt darauf an`,
`may vary`) is what a model produces when it has no opinion. The byline is a person. If the
answer is "it depends", say what it depends on and then say which way you would go.

### 1.4 No self-reference, no structure announcements

The text never talks about itself, its chapters, its thesis, or how it is organised.

- `Und jetzt der Grund, warum dieses Kapitel hier steht` → just write the paragraph
- `Kommen wir nun zu`, `In diesem Abschnitt` → delete
- `die These dieses Artikels` → name the claim instead
- `Es ist wichtig zu beachten, dass X` → `X`. The importance is shown by the sentence existing.
- `Als langjähriger Freizeitpark-Fan …`, `As a long-time coaster fan, I …` → the byline already
  says who writes. Say the thing.

### 1.5 No summary blocks

`Zusammenfassend lässt sich sagen`, `Abschließend`, `Insgesamt`, `Fazit`, `In conclusion`,
`Overall`, `In summary`, `Key takeaways`. A closing section that repeats what the reader just
read is a scientific-paper convention that generated text applies to everything. Our posts end on
a fact or on the signature.

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

### 2.13 Things that talk, and the product as protagonist

**A queue shows nothing, a number says nothing, and a calendar knows nothing.** `Was die
Warteschlangen gerade jetzt anzeigen`, `Welche Tage die ruhigsten sind, zeigt der Kalender`, `weil
die Daten sagen, dass ich ihn nicht brauche`, `Was verrät die Wartezeit-Historie wirklich?`, `die
Karte verschweigt das nicht`, `the data says`, `the numbers tell a different story`. Each hands a
person's verb (sagen, zeigen, verraten, wissen, verschweigen, lügen) to an object, so that the
sentence sounds like a scene instead of a statement. Write what is there and where: `Die
aktuellen Wartezeiten stehen auf der Parkseite, alle fünf Minuten neu.` `Im Kalender sind die
ruhigsten Tage grün.` `Nach unseren Messungen brauche ich ihn nicht.` A display or a board that
literally shows a figure is fine (`Am Eingang stehen 70 Minuten`, §3.3), and so is a legend, one of
our own tables or widgets, or a UI element that marks something on screen (`Der blaue Kegel zeigt, wohin du schaust`, `Die
Rahmenfarbe zeigt den Andrang an`); the queue itself never announces anything.

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

### 2.14 Saying what it does not do

A negation is information when the reader expected the opposite: `Für den Hansa-Park kommt nie
eine Zahl an`. A text that keeps answering objections nobody raised (`Die Antworten markieren und
blenden nichts aus`, `Ein Verbot ist das nicht, und eine Freigabe auch nicht`, `Eine Regel über
den frühen Morgen steckt darin nicht`) argues with a reader who has not said anything. Say what
happens instead.

The German posts sit at a median of 1.2 negations per 100 words; the planner page read 2.8. The
check warns above 2.

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

Six house rules that are not in anybody's research. They came out of real reviews of shipped
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
`MAE: um wie viele Minuten …`. See the open backlog in §7.

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
- **The title carries one fact, in at most 60 characters.** Not `<Park>: <Fakt>, und <Pointe>` (a park-name prefix, a colon, a comma, „und", a trailing gag): seven of the first eight news titles had that shape, and it is what reads as generated. No list of three news items and no punchline in a subordinate clause. The park name is in the title when it is the subject. Two news titles in the same week may not share a shape, and the same goes for `seo.title`. For the tone, not for copying: „HalloWeekends in Cedar Point: Neues Diablo-Labyrinth", „Traumatica im Europa-Park wird zehn Jahre alt". Read every title aloud before delivering: newspaper headline, or line from an advert?
- **No cover image twice among news posts** ([media database](rules/media-database.md)). Check before writing: `grep -rh -A1 '^coverImage:' content/blog/de/*.md | grep src | sort | uniq -c`. If the photo is taken, pick another from `public/media/<park-slug>/` or `public/media/halloween-2026/`; if there is none, the post goes out without a cover. The same image twice is worse than none. A photo whose caption says it is from another park is allowed only when there is nothing else and no other news post carries it.
- A direct quote is a `> [!QUOTE]` block with a linked source line, and a lawsuit or an injury is attributed in every sentence ([a quote names its source](rules/a-quote-names-its-source.md)).
- **The first sentence carries the news**: what happened, to what, when. No scene-setting paragraph in front of it.
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

Voice reference for German: `content/blog/de/phantasialand-tipps.md` and
`content/blog/de/toverland-troy-wartezeiten-tipps.md`.

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

---

## 6. German is the source; the other five are derived

German is written first and the other locales come from it. Two failure modes follow.

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
```

`scripts/check-prose.mjs` is the executable half of this document and holds the same lists, the
way `attractionIsOutOfSeason()` is the SQL twin of the season rule: change one half and you
change both. It walks the posts, the six message catalogs, every media sidecar, the glossary
(per term), the content pages and the hero copy in their `page.tsx`, the homepage announcement,
the changelog, the three agent skills and `/llms.txt`; for `Warteschlange` alone also every
string in the tracked `.ts` and `.tsx` files under `app/`, `components/` and `lib/`, where the
menus keep their chapter lists. It splits its output the way a regex can actually be trusted to:

- **Errors** are rules with no legitimate exception: a `—` in a post body or in German or Dutch
  prose, a growing em-dash count in a catalog, an honesty claim or chat register in a string that
  can only be about us, placeholder text, `Schlange` for `Warteschlange`, a German quote closed
  with a straight `"`.
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
collection (§5.2), an FAQ answer that repeats its question (§5.1), things that talk and false
agency (§2.13), crowd opinions (§1.2) and travel-guide copy (§3.4) in all six languages, and a
news title over 60 characters or in the `<Park>: <Fakt>, und <Pointe>` shape (§5.0) are counted
by the script itself; a grep cannot see paragraphs.

What it still cannot see is the wink at the end of a paragraph (§2.17), the quiet teaser
(§2.16), and whether a sentence claims anything at all (§1.7). That is the review pass.

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

On **2026-09-10**, when this file was first written — the output of `pnpm check:prose` on that
day, not impressions:

| Surface                       | Measured                                                                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Blog posts, all six locales   | 12 each, 72 in total. Non-signature em dashes: **0**.                                                                       |
| Sentence-length variance      | de **0.71** (0.50–1.19), en 1.01, nl 1.00, fr 0.95, es 1.05, it 1.04. Nothing under 0.4.                                    |
| Commas per 100 words          | de **8.7**, en 6.1, nl 6.3, fr 7.0, es 6.0, it 6.2. Nothing thin.                                                           |
| `sondern` per German post     | 0–6 over 1,280–7,775 words. One post over budget: `willkommen-im-park-fan-blog.md` at 1.8/1k.                               |
| Media sidecars                | 144 files, 112 German + 112 English captions, avg 8.9 / 9.7 words, zero em dashes.                                          |
| English captions              | 26 of 112 open with `The` (23 %) — set-level repetition, worth varying on the next pass.                                    |
| Vocabulary in posts           | four hits total: `seamless` ×2, `meticulously`, `worth noting`, all English, all judgement calls.                           |
| **Honesty claim**             | **`blog.intro` in all six locales** — found by the check, fixed in the same change.                                         |
| **UI strings (`messages/*`)** | **217 strings across six locales contain `—`** (de 25, en 55, nl 39, fr 38, es 30, it 30), one unspaced (`weltweit—u. a.`). |
| **Exclamation marks**         | 36 strings across six locales, most of them in the homepage FAQ answers (§5.1).                                             |

The last two rows are real debt. §4.1 applies to UI copy and the catalogs predate the rule; the
em-dash count is ratcheted so it cannot grow, and lowering it touches all six locales at once,
which belongs in its own change. Nothing here should be read as "the catalogs are compliant".

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
