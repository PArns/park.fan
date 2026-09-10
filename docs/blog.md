# blog.md — the writing rules for every text on park.fan

This is the base rulebook for **prose a reader sees**, in every language and on every surface:
blog posts, UI strings in `messages/*.json`, `alt` and `caption` in the media sidecars, meta
titles and descriptions, glossary definitions, the guide page, landing bands, empty states,
error messages, push notification bodies, the feeds. If a human eye lands on it, it is covered.

It exists because of one hard requirement in [`CLAUDE.md`](../CLAUDE.md): **no text on this site
may read as AI-generated.** Not as a matter of taste. A reader who smells a language model stops
trusting the numbers next to it, and the numbers are the entire product.

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

Two caveats, both from the people who wrote the field guides, and both load-bearing:

**Detectors do not work, and neither do you.** GPTZero and its kind have non-trivial error rates,
and humans asked to sort AI text from human text perform at close to chance. So this document is
a **writing** guide, not a detection guide. Never accuse a text of being generated because it
trips one item here. A single sign is noise; a text is only in trouble when several land at once.

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

### 1.5 No summary blocks

`Zusammenfassend lässt sich sagen`, `Abschließend`, `Insgesamt`, `Fazit`, `In conclusion`,
`Overall`, `In summary`, `Key takeaways`. A closing section that repeats what the reader just
read is a scientific-paper convention that generated text applies to everything. Our posts end on
a fact or on the signature.

### 1.6 No "challenges and future outlook"

`Trotz dieser Erfolge steht der Park vor mehreren Herausforderungen …` followed by vague
optimism. If there is a real problem, name it with a date and a number; otherwise there is no
paragraph here.

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
ist tendenziell höher` but `die Zahl steht auf 13 gemessenen Tagen`.

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

---

## 2. Sentence shape — the tells that survive a vocabulary pass

Swapping banned words is the easy half. What actually marks a text as generated is its rhythm,
and rhythm survives find-and-replace. Every item here is measurable in a finished text.

### 2.1 Negative parallelism

The most recognisable cadence in both languages.

- German: `nicht nur X, sondern auch Y` · `es geht nicht um X, sondern um Y` ·
  `X ist kein Y, sondern ein Z`
- English: `not just X, but Y` · `it isn't X — it's Y` · `Y rather than X`

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
  introducer and an exhausting paragraph rhythm.
- **Do not stack transitions.** `Darüber hinaus`, `Zusätzlich`, `Außerdem`, `Ferner`,
  `Additionally` — one is normal, one per paragraph is mechanical.

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
| **Sentence-length variance** (burstiness) | `stdev(sentence lengths) / mean` | under 0.4 is flat | **0.71** (0.50–1.19) | **1.01** (0.47–2.20) |
| **Commas per 100 words**                  | `count(',') / words × 100`       | thin under ~4     | **8.7**              | **6.1**              |

Both are supporting signals, never verdicts: a short reference text can be flat for good reasons.
But a long post under 0.4 is a post where every sentence came out the same length, and that is
worth a read-aloud pass before it ships. `pnpm check:prose` prints both (§7).

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
| Mechanical connectives           | `darüber hinaus`, `zusätzlich`, `ferner`, `andererseits` (as a paragraph habit)                                                                                                                                                                                                     |
| Vague authority                  | `Branchenberichte`, `Experten sind sich einig`, `viele Beobachter`, `Studien zeigen` (unsourced)                                                                                                                                                                                    |
| Model verbs                      | `eintauchen` / `Lassen Sie uns eintauchen`, `beleuchten`, `aufzeigen`, `hervorheben`, `gewährleisten`                                                                                                                                                                               |
| Hedging into mush                | `kann` used to soften every claim — count them, models over-use it badly                                                                                                                                                                                                            |
| Business verbs                   | `optimieren`, `ermöglichen`, `begleiten`, `abholen`, `revolutionieren`, `transformieren`, `skalieren` — see §1.7, each has a plain twin                                                                                                                                             |
| Gesture nouns                    | `die Welt der …`, `Landschaft`, `Reise`, `Ökosystem`, `Raum`, plus abstract subjects: `Effizienz`, `Komplexität`, `Innovation`, `Vielfalt`, `das Erlebnis`                                                                                                                          |
| Pseudo-wisdom                    | `am Ende des Tages`, `der Schlüssel liegt in`, `es kommt auf die richtige Balance an`, `die Zahlen sprechen für sich`, `die Tendenz ist steigend`, `ein nicht unerheblicher Teil`                                                                                                   |
| Latinate where German has a word | `signifikant` → `deutlich`, `Parameter` → `Wert`, `Methodik` → `Verfahren`, `partizipieren` → `mitmachen` (Economist 2026: still the strongest single marker)                                                                                                                       |

### 3.2 English

| Category               | Watch for                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core AI vocabulary     | `additionally` (sentence-initial), `align with`, `boasts`, `bolstered`, `crucial`, `deep dive`, `delve`, `emphasizing`, `enduring`, `enhance`, `fostering`, `garner`, `highlight` (verb), `interplay`, `intricate`, `key` (adj), `landscape` (abstract), `meticulous`, `pivotal`, `robust`, `showcase`, `tapestry`, `testament`, `underscore`, `valuable`, `vibrant` |
| Puffery                | `nestled`, `in the heart of`, `breathtaking`, `must-see`, `rich history`, `diverse array`, `groundbreaking`, `renowned`, `commitment to`, `natural beauty`                                                                                                                                                                                                           |
| Significance inflation | `stands as a testament`, `plays a vital role`, `underscores its importance`, `reflects broader`, `marking a pivotal moment`, `evolving landscape`, `indelible mark`, `deeply rooted`                                                                                                                                                                                 |
| Editorial commentary   | `it's important to note`, `worth noting`, `no discussion would be complete without`                                                                                                                                                                                                                                                                                  |
| Summary formulas       | `in conclusion`, `overall`, `in summary`, `key takeaways`                                                                                                                                                                                                                                                                                                            |
| Vague authority        | `industry reports`, `experts argue`, `observers have noted`, `some critics argue`, `several sources`                                                                                                                                                                                                                                                                 |
| Outline conclusions    | `despite its … faces several challenges`, `future outlook`, `challenges and legacy`                                                                                                                                                                                                                                                                                  |
| Business verbs         | `leverage`, `unlock`, `empower`, `streamline`, `navigate`, `elevate`, `utilize`, `facilitate`, `foster`, `ignite`, `unleash`                                                                                                                                                                                                                                         |
| Gesture nouns          | `landscape`, `journey`, `space`, `realm`, `ecosystem`, `tapestry`, `beacon`, `roadmap`, `the world of …`                                                                                                                                                                                                                                                             |
| Pseudo-wisdom          | `at the end of the day`, `the key is`, `when the dust settles`, `something real is happening`, `the stakes couldn't be higher`                                                                                                                                                                                                                                       |
| Hedges                 | `in many ways`, `at some level`, `arguably`, `it could be argued`, `while it is true`                                                                                                                                                                                                                                                                                |
| Recyclable framing     | `a useful way to think about it is`, `the key idea is`, `picture this`, `let's dive in`, `here's the kicker`                                                                                                                                                                                                                                                         |

### 3.3 Ours, and non-negotiable

Four house rules that predate this document and are not in anybody's research. They came out of
real reviews of shipped text:

1. **Never `ehrlich`, in any form.** No `ehrlich gesagt`, no `der ehrlichste Woodie`, no
   `um ehrlich zu sein`, no `honest` framing at all. It is the clearest tell we have found on our
   own copy. Honesty is demonstrated, not announced. The neighbouring register goes with it:
   `Fairness-Hinweis in eigener Sache`, `Kein Werbeflyer. Versprochen.`, `ohne SEO-Sermon`.
2. **Never narrate the sign at the entrance.** `das Schild`, `the sign`, `het bord`,
   `le panneau`, `el cartel`, `il cartello`. It is a stage direction, and it multiplies: it once
   stood in a hero caption, a scale legend, a screen-reader summary, a chapter paragraph and a
   companion post, six locales deep. Write `Am Eingang stehen 70 Minuten.`
3. **No coined metaphor-currencies.** `Wartezeit-Währung`, `Lebenszeit-Konto`, `Datenpunkt` as a
   noun of art. One ordinary figure of speech per section is plenty.
4. **Copy must not describe the page's own layout.** `Links steht … rechts …` is wrong on every
   phone, where the panels stack. Vertical order is usually safe (`weiter unten auf der
Parkseite`); horizontal order almost never is; `daneben` only when the two things share a row
   at every breakpoint.

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
- Do not fragment a text into a heading every three sentences. A section with two sentences under
  it should be a paragraph.
- No title case in German. Sentence case, always.
- Do not skip levels (`##` then `####`), and never repeat the post title as an `##` heading.
- Every chapter heading on this site is drawn by one component; see
  [design system → chapter headings](design/design-system.md#chapter-headings).

### 4.4 Lists

Prose is the default. A list is for things that are genuinely a set: opening hours, height
limits, steps in an order. Turning an argument into five bullets is what a model does when it
does not know how to connect two thoughts. And a list whose every item has the same grammatical
shape reads generated even when its content is fine.

### 4.5 Emoji, quotes, separators

- **No emoji as formatting** — never in front of a heading or a bullet.
- **German quotes are `„…"`**, English `"…"`. Straight quotes in body copy are a paste artefact.
- **No `---` thematic breaks** between sections of a post. The heading is the break.
- Watch for chat-export debris in anything pasted in: `contentReference`, `oaicite`,
  `turn0search0`, `[cite: 1]`, `:::writing`, `【…】`. If one of these reaches a file, the text was
  pasted, not written.

---

## 5. Surface-specific rules

The general rules apply everywhere. These are the additions per surface.

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

**The FAQ answers are the worst of it, and they are the most public prose we have.** The
park-level ones are exemplary — `seo.faq.waitTimesA` is four placeholders and a pointer, and
`seo.homepage.faq.liveDataA` names its three sources and says how the numbers are reconciled.
The rest of `seo.homepage.faq` is the register this document exists to keep out, and it ships as
`FAQPage` JSON-LD and as the visible FAQ band on the homepage in six languages:

| Shipped                                                                       | What is wrong                                                               |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `Ja! park.fan bietet einen detaillierten Crowd-Kalender …`                    | Chat warmth, and "detailliert" is not a fact                                |
| `Absolut! park.fan ist vollständig responsive und funktioniert perfekt auf …` | Two unbacked superlatives and an implementation word a visitor does not use |
| `Unser Ziel ist es, jedem … den bestmöglichen Service zu bieten.`             | Survives the deletion test (§1.7) with nothing lost                         |
| `deine zentrale Plattform für …`                                              | Positioning, not an answer                                                  |
| `… und viele mehr`                                                            | Vague expansion; give the count and link the list                           |

Rewrite them the way the park-level ones are written: the number, the source, the link. This is
open work, not something the check can do.

### 5.2 `alt` and `caption` (media sidecars)

Two different jobs, and the second is not a longer version of the first. Full format in
[`public/media/README.md`](../public/media/README.md#alt-and-caption--and-they-must-not-read-as-ai-written).

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
- Six locales are six sentences, not one sentence translated five times.

### 5.3 Meta titles, descriptions and template copy

This is the highest-stakes surface on the site and the one nobody re-reads, because it is
generated: 212 parks, 42,756 attraction URLs, 27,984 calendar URLs, six locales. **One templated
sentence is not one text — it is tens of thousands of near-identical pages**, which is precisely
what Google's spam policy calls scaled content abuse, whoever or whatever wrote it.

So a template earns its place by carrying **per-entity facts** — the name, the park, the number,
the date — and not adjectives that would be true of any of the 212. `Wartezeiten für {ride} im
{park}: aktuelle Werte, typische Zeiten nach Wochentag.` is fine. `Erlebe die faszinierende Welt
von {ride}` is forty-two thousand pages of the same sentence.

The FAQ and structured-data blocks are prose too, and they are the most quotable text on the
strongest pages we have. Read them like body copy.

### 5.4 Blog posts

Everything above, plus what is in the [blog authoring guide](../content/blog/README.md#8-writing-style-requirement):
never type a wait time into a post (use the widget fences), a sentence next to a widget must not
name a figure the widget renders, and articles matter — it is **das** Efteling, like
`das Toverland` and `das Phantasialand`.

Voice reference for German: `content/blog/de/phantasialand-tipps.md` and
`content/blog/de/toverland-troy-wartezeiten-tipps.md`.

### 5.5 Machine-facing text

`llms.txt`, the agent skills, the MCP tool descriptions and the feed metadata are read by people
too, when something breaks. Same rules, minus the voice: short, factual, no puffery, no
significance claims.

---

## 6. German is the source; the other five are derived

German is written first and the other locales come from it. Two failure modes follow.

**Mirror translation.** A sentence carried across word for word keeps German word order and
German sentence length, and reads translated in all five targets. Write each locale as its own
sentence. Where a language wants a different order, let it have one.

**Language-specific typography, applied per language.** The em-dash ban is universal here, but
the rest is not:

| Locale | Quotes      | Notes                                                                                |
| ------ | ----------- | ------------------------------------------------------------------------------------ |
| de     | `„…"`       | Halbgeviertstrich `–` with spaces; `du`; no title case; decimal comma, `.` thousands |
| en     | `"…"`       | No em dash (§4.1); decimal point, `,` thousands                                      |
| nl     | `“…”`       | `je`; **never** the German `„` — 28 of them had been carried over; watch compounds too |
| fr     | `« … »`     | Non-breaking space before `?` `!` `:` `;` and inside the guillemets                  |
| es     | `«…»`/`"…"` | Opening `¿` and `¡` are not optional                                                 |
| it     | `«…»`/`“…”` | Both are correct; pick one **per post** — five of ours use guillemets, seven don't    |

English needs its own pass rather than a translation: the English tell list (§3.2) is much
better documented than the German one, and a German sentence rendered literally into English
often lands squarely on it (`stellt dar` → `serves as`).

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
change both. It walks the posts, the six message catalogs and every media sidecar, and it splits
its output the way a regex can actually be trusted to:

- **Errors** are rules with no legitimate exception — a `—` in a post body, a growing em-dash
  count in a catalog, an honesty claim or chat register in a string that can only be about us.
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
```

### 7.1 Measured state, 2026-09-10

Where the repository actually stood when this file was written — the output of `pnpm check:prose`
on that day, not impressions:

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

Adjacent standards:

- Google Search Central, [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
  and [guidance on AI-generated content](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content) —
  the scaled-content-abuse framing behind §5.3.
- WebAIM, [Alternative text](https://webaim.org/techniques/alttext/) — the alt-versus-caption
  split in §5.2.
