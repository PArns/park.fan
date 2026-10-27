# 1. Substance: the tells that are about what you say

Chapter 1 of the [writing rules](README.md): significance, evidence, verdicts, self-reference,
summaries, sentences that claim nothing, invented detail and gaps. Read it before writing a post,
a guide or a news item; §1.2 and §1.8 apply to every text that states a fact.

## 1.1 Never inflate significance

Across thousands of flagged Wikipedia articles the most consistent sign is that generated text
reads like promotional copy: it reaches for legacy, symbolism and broader trends where a person
states a fact and moves on.

- `Taron steht wie kaum eine andere Bahn für …` → `Taron hat 2016 eröffnet und läuft 1,25 km.`
- `spielt eine zentrale Rolle im Parkerlebnis` → `ist die einzige Bahn mit zwei Launches`
- `marks a pivotal moment for the park` → `was the park's first new coaster since 2009`
- `unterstreicht die Bedeutung von`, `stands as a testament to` → cut the sentence
- `hinterlässt einen bleibenden Eindruck` → say what a rider actually notices

**Canned notability** is the newer form: `vielfach ausgezeichnet`, `preisgekrönt`, `in zahlreichen
Medien`, `award-winning`, `consistently ranked among`. An award has a name and a year, or it is
not in the sentence. Nothing on this site "reflects a broader trend": a queue is a number of
minutes, and a park is a place with opening hours.

## 1.2 Every claim carries its evidence, or it goes

A superlative without a number or a source next to it is cut, not softened:
`der beste Woodie Europas` → `54 Minuten Median, damit die längste Schlange im Park`.

- **Vague authority** (`Studien zeigen`, `Experten sind sich einig`, `Branchenberichte`,
  `viele Beobachter`, `renowned for`): name the study, the expert or the report, or delete the
  sentence. It is one of the loudest tells there is.
- **Thin data is stated as thin**: `an vier gemessenen Tagen im Februar`, not a rounded average
  with the confidence of a full month.
- **An opinion needs an owner.** `Enthusiasten lieben die rohe Natur`, `gilt als eine der
intensivsten`, `is widely regarded as` hand a taste to a crowd nobody can ask (in September 2026
  the German glossary said `Enthusiasten` 49 times in 32,000 words, the German posts 5 times in
  94,000). Name who said it (a poll with its year, a reviewer with a link, the manufacturer's
  brochure), say it yourself under the byline, or describe what happens in the seat.
  `check:prose` flags it.
- **Our own guide is not the evidence.** `so steht es in unserem Guide zum Park`, `as our guide
says` cite nobody a reader can check. Name the park or the operator that said it, and link our
  guide where the reader wants more.

Where the evidence comes from:

- **Researched, not remembered.** Every year, name, price and figure comes from a page opened for
  this post, on the day of the PR; our own figures come from the API through a widget (§5.4). A
  translation takes the facts of the German file and opens nothing new. For prices, opening hours,
  events, the fast pass and travel the park's own page comes first; where another source
  disagrees, the park's page wins and the PR names the conflict.
- **A claim the park did not make itself needs two independent sources**: an accident, a lawsuit,
  a record the RCDB does not list, a visitor count from anyone but the park or its operator. A
  history chapter gives the visitor count where it has that source and says nothing about it where
  it does not. Another theme-park blog is never a source, and trade press without the park's
  confirmation is not stated as confirmed. What cannot be sourced is cut, not hedged:
  `voraussichtlich`, `angeblich` and `Gerüchten zufolge` do not stand in for a source.
- **A spec is stated, not attributed.** Height, length, speed, manufacturer, opening year, number
  of trains and minimum height are facts with a link in the source list:
  `Der Hyper Coaster ist 61 Meter hoch, die Strecke rund 1.366 Meter lang.`, not
  `Laut Six Flags ist die Bahn 61 Meter hoch.` The same goes for a table header. A sentence names
  its source only for a claim one source alone carries that blames a side, a cause, a quote, a
  forecast or a legal claim, and where two sources disagree; what two independent sources report
  about an event is stated as what happened (§5.0). Ride figures come from the RCDB, with the
  park's figure beside it where it differs
  ([the rule](../rules/a-ride-figure-comes-from-the-rcdb.md)).
- **Silence is silence.** A park rulebook that says nothing about glass bottles has not allowed
  them: `In der Parkordnung steht nichts zu Glas`, never the permission it did not give.
- **Do not price what is not sold.** `ResortPass Silver für 325 €`, three words before
  `verkauft der Europa-Park derzeit nicht`, hands the reader a price they cannot pay.
- **Nobody else's words.** A competitor's text is a hint that a topic exists, never a sentence to
  copy or paraphrase. A press release's adjectives (`ikonisch`) stay in the press release.
- **Words with a legal meaning keep it.** `Werktag`, Italian `feriale` and Spanish `día laborable`
  include Saturday ([the rule](../rules/werktags-is-monday-to-saturday.md), checked as
  `werktag-meaning`).

## 1.3 Have a verdict

Both-sides hedging with no conclusion (`einerseits … andererseits`, `es kommt darauf an`,
`may vary`) is what a model writes when it has no opinion. The byline is a person. If the answer is
"it depends", say what it depends on and which way you would go.

## 1.4 No self-reference, no structure announcements

The text never talks about itself, its chapters, its thesis or how it is organised.

- `Kommen wir nun zu`, `In diesem Abschnitt`, `Und jetzt der Grund, warum dieses Kapitel hier
steht` → delete and write the paragraph
- `Hier steht, wie …`, `Unten stehen zuerst die Termine` → say it, or name the table it is in
  (§3.3 rule 18)
- `die These dieses Artikels` → name the claim
- `Es ist wichtig zu beachten, dass X` → `X`; the sentence existing shows the importance
- `Als langjähriger Freizeitpark-Fan …`, `As a long-time coaster fan, I …` → the byline says who
  writes
- `Das ist die nützlichste Information des ganzen Beitrags`, `the most useful line in this guide`
  → the post grading its own sentences. Put the fact where it is found first. `check:prose` fails
  on the shape in all six languages.
- `Wer davon noch nichts wusste, soll es nicht erst an der Warteschlange erfahren.` → the author
  explaining why a section exists; the section being there is the explanation.

## 1.5 No summary blocks

`Zusammenfassend lässt sich sagen`, `Abschließend`, `Insgesamt`, `Fazit`, `In conclusion`,
`Overall`, `Key takeaways`. A closing section that repeats what the reader just read is a
scientific-paper convention generated text applies to everything. Our posts end on a fact or on
the signature.

**The take-home section** is the same block with a byline: `## Was ich dir für Staffordshire
mitgebe`, `What I'd take away from Staffordshire`, `Ce que je retiens de Soltau`. Three guides
closed that way in October 2026, and each restated the post and ended on a maxim. The reader of a
guide stops after the FAQ or after the part they came for; end on the FAQ and the signature.
`check:prose` warns on the heading in six languages.

## 1.6 No "challenges and future outlook"

`Trotz dieser Erfolge steht der Park vor mehreren Herausforderungen …` followed by vague
optimism. A real problem is named with a date and a number; otherwise there is no paragraph.

The news version is the **send-off**: `Man darf gespannt sein.`, `Es bleibt spannend.`,
`The future looks bright.` It ends on a mood because the facts ran out. End on the last fact, or on
what is not yet known and who could say (§1.8).

## 1.7 The sentence that claims nothing

This is the heart of it, and the reason the word lists in §3 are the least important part of the
rulebook. Generated prose is **fluent and empty**: every sentence is well-formed, the paragraph
flows, and afterwards the reader cannot name one thing they now know. No word is wrong; a fact is
missing, so word-level editing cannot fix it. Two tests:

- **The deletion test.** Cut the sentence. If the paragraph lost no information, it was filler. A
  text where more than a third of the sentences survive deletion is not a text.
- **The transplant test.** Would the sentence sit unchanged in an article about another park,
  product or industry? Then it says nothing about this one: `Ein Besuch will gut geplant sein.`
  fits every park, museum and airport in Europe.

The shapes it comes in:

- **Pseudo-wisdom**: `Am Ende des Tages kommt es auf die richtige Balance an.`,
  `The key is finding balance.` Delete; there is no shorter version.
- **Empty contrast**: `Es geht nicht um die Wartezeit, es geht um das Erlebnis.` with "Erlebnis"
  undefined. Delete the first half, then define the second or cut it.
- **Vague intensifier**: `spielt eine maßgebliche Rolle`, `has a significant impact`. Put the
  number there or drop the sentence.
- **Manufactured stakes**: `Das Thema gewinnt zunehmend an Bedeutung.`,
  `Something real is happening here.` Say what changed, when and by how much.
- **Tautology**: `Wie voll es ist, hängt vom Andrang ab.`, `Wait times vary by day.` Only worth
  writing with the next clause attached.
- **The empty opener** (WortLiga lists twenty German ones): `Seit jeher …`, `In der heutigen
Zeit …`, `Mehr denn je ist es entscheidend, dass …`, `Die Zahlen sprechen für sich`. The sentence
  after it would have been fine alone.

**Hedges are the same failure in a smaller package** (`in gewisser Weise`, `im Grunde`,
`letztlich`, `tendenziell`, `durchaus`, `in many ways`, `arguably`, `it could be argued`). From a person a hedge marks real uncertainty; from a model it apologises
for a claim it did not check. Name what is uncertain instead: not `die Zahl ist tendenziell höher`
but `die Zahl steht auf 13 gemessenen Tagen`. One hedge is often honest; the tell is the
**stack** (`kann unter Umständen möglicherweise`, `could potentially`), which `check:prose` flags.

**Business verbs promise motion and deliver none** (`optimieren`, `ermöglichen`, `leverage`,
`unlock`; the full lists are in §3). Each has a plain twin that says more: `utilize` → `use`,
`ermöglicht dir, X zu tun` → `du kannst X tun`, `optimiert deinen Parktag` →
`spart dir vierzig Minuten Anstehen`. **Abstract nouns as subjects** fail the same way
(`die Vielfalt`, `das Erlebnis`, `die Welt der Freizeitparks`, `landscape`, `journey`): a ride, a
queue, a park and a visitor can be the subject of a sentence; `die Vielfalt` cannot do anything.

## 1.8 Never invent what somebody had to live, count or say

Generated text fills a gap with a plausible detail, and a plausible detail is the most expensive
lie a post can tell because the reader cannot see it. Fabricated specificity is worse than honest
vagueness.

- **No invented first-person experience.** `Ich bin X2 dreimal gefahren` is written when it
  happened, never to make a paragraph feel lived. A post written without a visit says where its
  knowledge comes from.
- **No hypothetical dressed as a memory.** A scenario says it is one:
  `Angenommen, du stehst um zehn am Eingang`.
- **No invented number.** A figure has a source or a measurement next to it (§1.2); an estimate
  says it is one.
- **No invented comparison.** `vierzehn Überschläge auf der Fläche einer Turnhalle` measured
  nothing. A comparison is a figure and needs the same source.
- **No invented or tidied quote.** Somebody's words stay theirs, translated faithfully, marked as
  translated and linked to where they were said
  ([a quote names its source](../rules/a-quote-names-its-source.md)). Reported speech is fine; a
  sentence in quotation marks that nobody said is not.

What cannot be checked is left out. A gap in a news post that the reader needs becomes a sentence
saying what is not known (`Six Flags hat nicht bekannt gegeben, ob X2 abgerissen wird`), and that
sentence is information; a gap the reader does not need is left out (§1.9).

**Placeholder text** (`[Park Name]`, `2026-xx-xx`, `XX Minuten`, `TBD`, `(Add link here)`) is an
error in every file `check:prose` reads.

## 1.9 A gap has an owner

The generated version of the sentence above is the **disclaimer that names nobody**: `Genaue
Angaben sind nicht öffentlich dokumentiert.`, `Basierend auf den verfügbaren Informationen …`,
`While specific details are limited …`. The difference from ours is one word, who:
`Six Flags hat nicht bekannt gegeben, ob …` names the party that is silent, and a reader can go and
ask.

**What somebody withholds was not said.** The owner of a gap gets the verb for what they did,
which is nothing:

- `Ob es Verletzte oder Festnahmen gab, haben Polizei und Walibi bisher nicht gesagt.` →
  `Die Polizei hat … Zahlen zu Verletzten oder Festnahmen aber bisher nicht bekannt gegeben.`
- `Welche das sind, sagen beide Berichte nicht.` → `Welche das sind, nennt keiner der Berichte.`
- `Was sie ausgelöst hat, weiß der Sender nicht.` → `Was sie ausgelöst hat, ist bis jetzt
unbekannt.` (the original handed everybody's ignorance to one broadcaster)

English has the same habit in `The park hasn't said whether …`: write `hasn't announced`,
`hasn't published` or `it isn't known yet`.

**A gap that changes nothing for the reader is left out**: „wenn nix angekündigt ist, brauchen wir
das auch nicht erwähnen“ (Patrick). A visitor planning the last evenings needs the dates and the
rules at the gate, not a list of announcements that have not happened. Name a gap where the reader
would otherwise assume the opposite, once (§2.19).

`check:prose` warns (`withheld-as-said`) on `hat/haben … bisher/noch nicht gesagt` (not for `wir`
or `ich`), `sagen beide Berichte nicht`, `weiß der Sender nicht`, `dem Sender nicht bekannt`,
English `hasn't said whether/what/when …`, `the reports don't say`, and the perfect of _say_ with a
negation in the other four. Whether a gap matters is the critic's call.
