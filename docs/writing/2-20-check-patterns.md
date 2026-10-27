# 2.20 The patterns `check:prose` knows by name

The last section of chapter 2 of the [writing rules](README.md): every sentence pattern
`pnpm check:prose` reports under a rule name, what it looks for, where it fires and in which
languages. Open it when the critic (§7.2) or the check cites a rule name, when you read a finished
guide the way a reader does, or before adding a rule.

The patterns came from the critic's reviews of guides that had passed `check:prose` and still read
as machine-written (twelve park guides on 2026-10-13, the older guides, the thank-you post, the
guides of 2026-10-22, the 2026 wait-time report and the Walibi news of 2026-10-25). Each is a shape
a writer may use once; the tell is the series. **Every rule here is a warning**, so a published
post never turns `main` red. The critic cites them as `check:prose: <rule>`. The code is
`SLOP_RULES` in `scripts/prose-slop-patterns.mjs` (each rule's `section`, `locales` and `min`), and
`pnpm test:prose-rules` holds a positive and a negative case per rule.

Each entry reads: number and rule name (where it fires; the languages it checks). A language a
rule does not check is left to the critic, not skipped by accident. "Captions" means the rule also
runs on every `alt` and `caption` in the media sidecars and warns at the first hit; the others need
a paragraph or a neighbouring block. Numbers 21, 39 and 67 are not rules: 21 is the date that
opens a line, an error under §4.4; 39 is the caption pass; 67 (an example from the rulebook copied
into a post) fired on the wording the rulebook recommends and was dropped.

Two more named warnings live with the rule they enforce: `news-outlet-attribution` (§5.0) and
`withheld-as-said` (§1.9).

## The rules

- **#1 `origin-refrain`** (2 closing sentences; de en). The same sentence about where the data came from closes several sections. `Eine Seite von Universal, die das bestätigt, konnten wir nicht abrufen.`
- **#2 `heading-triple`** (3 headings; all six). Headings that are a chain of three, often after `X:`. `Express Pass: Pakete, Preise, Zeitfenster`
- **#3 `name-colon-subheading`** (4 headings; all six). A run of `Name: epithet` subheadings (§4.3). `Hugin und Munin: das Duell`
- **#4 `handoff-object-first`** (2 paragraphs; de en). A paragraph ends on a sentence that hands the reader to another document, with the object put first. `Den Preis für deinen Tag nennt der Park im Buchungsablauf.` Also `, die nennt …`, and the app, the desk or the hotline as the object put first.
- **#5 `indirect-question-subject`** (2 sentences; de en). An indirect question as the subject in front of `steht in`. `Welcher Preis für deinen Tag gilt, steht im Kalender des Ticketshops.`
- **#6 `widget-announcement`** (2 paragraphs; all six). A paragraph ending in a colon directly above a widget fence, in changing words (§2.7 catches only identical lines). `Wie die Warteschlangen über den Tag wachsen:`
- **#7 `conditional-opener-series`** (11 per post, or 3 in a paragraph; de en). `Wer …, …` / `If you …` opening sentence after sentence. `Wer mit Kindern unter 120 cm kommt, … Wer ohne Auto kommt, …`
- **#8 `catalog-connector-series`** (6 sentences; de en). `Dazu kommt`, `Und es gibt`, `There's also`, `Then there's` as the way to add the next item. `Dazu kommt Luna, 2023 eröffnet.` Also `Danach kommt` and `Knapp dahinter`.
- **#9 `attribution-opener-series`** (3 in a chapter; de en). `Laut Park`, `Der Park nennt`, `The park says` opening sentences within one chapter. `The park calls Katun …` Also `According to <Park>`.
- **#10 `travel-imperative-close`** (2 paragraphs; de en). An imperative about the trip closing a paragraph. `Prüfe sie dort, bevor du fährst.`
- **#11 `tautological-because`** (1 sentence; de en). The same verb in the main clause and in the `weil` clause. `Ein zweiter Tag lohnt sich vor allem mit Kindern, weil sich Futuropolis dann den ganzen Tag lohnt.`
- **#12 `excerpt-announces-post`** (1 sentence; de en). The excerpt or the description announces the post (§1.4) where it should say something. `Hier steht, an welchen Tagen …`
- **#13 `count-announcement-opener`** (2 paragraphs; de en). A paragraph opens on a short sentence that counts what follows (§2.16). `Drei Bahnen stehen im Bereich.`
- **#14 `data-caveat-close`** (1 paragraph; de en). A paragraph about a number of measured days ends on the reservation. `das ist zu wenig für eine Aussage`
- **#15 `double-attribution`** (1 pair; all six). Two sentences in a row carry the same attribution formula. `nach Parkangabe … Laut Park …`
- **#16 `range-before-enumeration`** (1 range; all six). A range whose two ends the next sentences list again. `Die Annual Passes kosten zwischen 64 und 299 £.` over a list of passes
- **#17 `definition-before-glossary`** (1 paragraph; all six). A definition in the paragraph above a glossary widget for the same term. `Rope Drop heißt, dass du …` above `glossary-widget`
- **#18 `source-silence-close`** (3 sentences; all six). What the source does not say, as the end of a sentence (§1.9). `nennt der Park nicht`
- **#19 `widget-caption-after`** (1 paragraph; de en). A paragraph under a widget that says what the widget shows. `In der Tabelle steht für jede Bahn …`
- **#20 `table-summary-before`** (1 paragraph; de en). A paragraph above a table or widget that says what the table shows. `Die Tabelle fasst zusammen, …`
- **#22 `bet-opener`** (1 sentence; all six). The first paragraph opens on a wager. `X ist eine Wette darauf, dass …`
- **#23 `mirrored-good-bad`** (1 paragraph; de en, captions). One paragraph holds both halves of a mirrored pair. `ist gut, wenn …` and `ist schlecht, wenn …`
- **#24 `appended-reason`** (2 sentences; all six, captions). A clause tacked on to the end of a sentence to name the reason. `, und das ist der Grund`
- **#25 `appended-advice`** (2 sentences; de en fr it, captions). A clause tacked on to the end of a sentence to hand out advice. `, was man sich überlegen sollte`
- **#26 `link-sentence-close`** (3 closing paragraphs; 2 for `steht in unserem [Guide]` or for two paragraphs closing on a pair of our pages joined by `und`; 1 paragraph made only of pointers to `/parks/`, `/compare` or `ref:`; 4 chapters closing on a bare link; any link sentence that appears twice; all six). A reference sentence with an internal link closes paragraph after paragraph. `… steht im [Winter-Guide](/blog/…).` Counts any internal `/blog/` or `/news/` link.
- **#27 `widget-announced-twice`** (2 sentences, or 1 pick line; all six). The widget is announced in words each time, or the choice is announced before it. `Das Widget zeigt …`
- **#28 `how-teaser`** (2 sentences; de en nl fr, captions). A `Wie …` clause that promises an answer and gives it in the next breath. `Wie voll es wird, zeigte sich am Samstag.`
- **#29 `bold-step-labels`** (3 paragraphs in a row; all six). Paragraphs in a row that open on a bold step word. `**Zuerst** …`
- **#30 `own-post-as-proof`** (2 sentences; all six). Our own post cited as the evidence for a claim. `wie in unserem Beitrag steht` Also `wie in unserem [Beitrag](/blog/…)`.
- **#31 `advice-who-series`** (4 sentences; de en nl). `Wer X, fährt Y` as the shape of the advice, sentence after sentence. `Wer früh kommt, fährt zuerst Taron.`
- **#32 `not-found-close`** (2 paragraphs; de en). A paragraph closing on what the author did not find. `nicht gefunden`
- **#33 `day-night-mirror`** (2 sentences; de en nl es it, captions). The first or last sentence of a paragraph sets day against evening. `Tagsüber … abends …`
- **#34 `looks-different-colon`** (2 sentences; all six, captions). `X looks different:` as the lead-in to a colon. `sieht anders aus:` Also `funktioniert anders:`.
- **#35 `riddle-title-fraction`** (1 title or heading; de en fr es it). A title or heading that teases with a fraction. `zur Hälfte`
- **#36 `question-catalog-opener`** (1 sentence; all six). A sentence that lists three things the reader wants to know before the trip. `will vorher wissen, ob …, ob … und ob …`
- **#37 `empty-faq-answer`** (2 answers; de en nl es it). The answer under a question heading says nothing: a few words with no figure, or `verschieden`. `Das ist verschieden.` (a bare yes or no is an answer)
- **#38 `bold-maxim`** (1 sentence; all six). A whole short sentence set in bold at the edge of a paragraph, with no figure and no link. `**Wer früh kommt, wartet kürzer.**`
- **#40 `origin-circle`** (1 formula, or 4 and 3 per 1,000; all six). The start of the story brought back to close a circle, or the same beginning told again and again. `wo das alles angefangen hat` six times in 850 words The count of `angefangen`, `begann`, `started` is German and English only.
- **#41 `thanks-either-or`** (1 sentence; all six). A thank-you that takes in every reader with `ob … oder …`. `Danke euch allen, ob ihr … aufgemacht habt oder jeden Morgen …`
- **#42 `imagined-reader-tour`** (1 paragraph; all six). `Manche …, andere …`: readers the author imagines, each handed a feature link, or a hedged third one. `Manche sitzen … auf dem Sofa …, andere planen … Ein paar stehen vielleicht in Orlando` Counts links to pages of this site, not `ref:` links, so `Manche Bahnen öffnen um zehn, andere mittags` is no imagined reader.
- **#43 `feeling-close`** (3 paragraphs; de en). Paragraphs that end on the author's own feeling. `Damit hätte ich nie gerechnet.`
- **#44 `disappoint-teaser`** (1 sentence; all six). The disappointment announced before its reason (§2.16). `und da muss ich enttäuschen`
- **#45 `bridge-apposition`** (1 sentence; de en). `…, genau die X, in denen …` hung on a finished sentence to reach the next paragraph. `drei Wochen, genau die Wochen, in denen es Herbst geworden ist`
- **#46 `contact-form-phrase`** (1 sentence; all six). The lines of every contact form. `Feedback ist immer willkommen`
- **#47 `filler-adverb-pileup`** (4, and 4 per 1,000 words; de en). One filler adverb again and again (§2.18): `gerade`, `inzwischen`, `eigentlich`, `wirklich`. `gerade` five times in 850 words Also `deutlich`, `klar`, `clearly`.
- **#48 `faq-echo`** (2 answers; all six). An FAQ answer copies the running text or the excerpt: half its words sit in a shared run of eight, or one sentence of 12+ words matches a body sentence almost word for word. An answer of one sentence with one figure may repeat it (§5.4). `Die Höhe gilt für den höchsten Punkt der Strecke über dem Boden, die Fallhöhe für die längste Abfahrt.` in text and FAQ Fires on a copied passage, not on a shared figure (§5.4).
- **#49 `faq-table-echo`** (1 answer; all six). An FAQ answer reads out a table column: five of its figures from three rows or more, and three quarters of all its figures; dates and numbers in names do not count. `the One Shot at Mirabilandia at €5.90, the One Shot at Thorpe Park at £6 …`
- **#50 `table-cells-in-prose`** (1 paragraph (first and last row: 2); all six). The paragraph above a table names four cells of one column, an intro names the first and the last row, or the paragraph above a list names three of its entries; a paragraph with a count the table lacks is a summary and stays. `Quick Pass, Express Ticket, Speedy Pass, Fastrack und Premier Access` over the „Name“ column
- **#51 `fact-refrain`** (3 sections; all six). A figure with the three words after it in three sections (excerpt and chapters; FAQ, dates and measurements left out). `an allen 365 Tagen im Jahr` in excerpt, intro and chapter
- **#52 `preposition-name-opener`** (1 paragraph or run; all six). `Im/Bei <Name>`, `At/In/For <Name>` opening most sentences of a paragraph, three paragraphs in a row, or a fifth of all paragraphs; the name must be a park or ride the post links, and the FAQ is left out. `Im PortAventura Park … Im Gardaland … Bei Walibi Belgium …` A park and the town in its link path count as one name (`In Rust` = `Im Europa-Park`).
- **#53 `origin-tour`** (1 paragraph or run; all six). `Aus Italien …`, `From Spain …` opening sentence after sentence, outside the travel chapter. `Aus Italien hält der Eurocity-Express … Aus Spanien fliegst du …` Quiet inside the travel chapter, which has one subheading per country.
- **#54 `recomputed-difference`** (1 sentence; all six). A comparative whose figure is the difference of two figures in the same paragraph or table. `Der Ultimate ist also 3 € billiger` after 80 € and 83 € Also the conclusion without a comparative (`der zweite Tag also 60 bis 67,50 €`).
- **#55 `verdict-opener`** (2 sections; de en). A section opening on a scoreboard line or a short superlative. `Paris wins on shows`
- **#56 `among-them-series`** (4 per post; all six). `darunter`, `among them`, `tra cui` in front of a list of names, again and again. `among them Balder, Helix, Valkyria and …`
- **#57 `closing-refrain`** (3 paragraphs; all six). Paragraphs closing on the same words, or on what one need not buy or cannot book. `braucht dafür keinen Pass` The last-words refrain needs no wordlist; the negation half is German and English.
- **#58 `cost-per-duration`** (1 sentence; de en). A price set against the length of the ride. `für die gut zwei Minuten Fahrt nennt der Park Kosten von 50 Millionen Euro` Fires on a budget in millions next to the ride's length in the same or the next sentence.
- **#59 `mirrored-park-intro`** (1 pair; all six). Two paragraphs in a row open on `<Park> in <Ort> … eröffnet`. `Der Europa-Park in Rust hat am 12. Juli 1975 eröffnet …` / `Das Efteling in Kaatsheuvel …`
- **#60 `appended-source`** (2 sentences; de en, captions). The source tacked on to the end of a sentence. `…, so steht es auf seiner Website.`
- **#61 `never-had-like-it`** (1 sentence; all six, captions). Novelty claimed instead of named. `Efteling has never had a ride like it.`
- **#62 `verdict-close-series`** (3 chapters; de en nl). Chapters that end on the author's pick. `… würde ich das Abendticket des Europa-Parks nehmen.`
- **#63 `spec-sheet-chain`** (1 paragraph, or 3 builder sentences; all six). A paragraph of sentences that each pair a manufacturer with a year, or the builder formula again and again; a history chapter needs five. `Taron von Intamin fährt seit 2016 …` Fires on the sentence formula, not on the figures: a spec list is a required fact, never a series.
- **#64 `weather-caveat`** (1 sentence; all six, captions). The bad-weather caveat that fits every ride in every park. `Bei extremem Wetter kann in beiden Parks jede Bahn im Freien … schließen.`
- **#65 `pair-ellipsis`** (6 pairs, or 1 percentage; de en). The second half of a comparison without its verb, or a bare percentage. `…, im Europa-Park an 16 Prozent`
- **#66 `publish-day-snapshot`** (1 sentence; de en). The post's own `date` with a time of day, outside a `Stand …` stamp (§3.3, rule 15). `am 22. Oktober um 22 Uhr`
- **#68 `brochure-span`** (1 sentence; de en, captions). A `von … bis …` range with no figure in it. `von der spanischen Finca bis zum Leuchtturm aus Neuengland`
- **#69 `record-triple`** (3 sentences; de en). Three superlatives as a formula, or `all three records`; a post about records is left out. `holds all three records`
- **#70 `name-history-series`** (3 sentences; de en). The history of a ride's name, ride after ride. `Bis 2004 hieß sie Wild Wild West`
- **#71 `since-template`** (4, and 3 per 1,000 words; de en). `ist/fährt/hält seit …`, `has held … since`. `has held all three Dutch records since 2002`
- **#72 `same-park-template`** (3 sentences; all six). `im selben Park`, `in the same park` as the hinge of a catalogue. `The longest is Katun in the same park` Also `, ebenfalls im <Park>`.
- **#73 `calls-it-superlative`** (2 sentences; de en). The park's own superlative, passed on. `Europa-Park calls it the launch coaster with the most inversions in the world`
- **#74 `superlative-mirror`** (4 sections; de en). Cheapest and dearest with the same frame in four or more sections; a single pair is information. `Am günstigsten ist der 20. Januar, am teuersten Silvester.`
- **#75 `section-formula`** (3 sections; all six). The same five words in three subsections. `den zweiten Besuch machst du`
- **#76 `opener-skeleton-series`** (3 paragraphs; all six). Paragraphs opening on the same frame with the names swapped. `Im <Park> stehst du an <Bahn> am längsten an.` `im`, `in`, `bei`, `at`, `au`, `à`, `nel`, `bij` count as one slot.
- **#77 `negation-reveal`** (1; de en). `ist keine X. Es ist Y` (§2.1). `ist keine Achterbahn. Es ist …`
- **#78 `from-to-mirror`** (1 sentence; de en, captions). `von … zu … und von … zu …` in one sentence. `von Rust zum Bahnhof und von Ringsheim zum Park`
- **#79 `queue-comparison-close`** (3 paragraphs; de en). Paragraphs closing on how much shorter you queue. `… stehst du dort halb so lange an.`
- **#80 `dash-explained-twice`** (2 sentences; de en). What the widget's dash means, explained again. `Ein Strich heißt …` Only when both explanations carry the same figures.
- **#81 `park-to-park`** (1 sentence; all six, captions). `von Park zu Park` with a verb of varying. `unterscheidet sich von Park zu Park` Also `je nach Tag unterschiedlich`.
- **#82 `caption-echo`** (1 caption; all six). A measurement in a caption repeated in the body next to the same subject. `Mitfahren darf man dort ab 90 Zentimetern.`
- **#83 `research-stamp`** (1 sentence; all six). The day somebody looked, in running text or the source list (§3.3, rules 15 and 21); a stamp over a table stays. `(Stand 25. September 2026) 35 Restaurants` A range of the data (`vom … bis …`) is left alone.
- **#84 `price-not-sold`** (1 sentence or cell; all six). An amount next to the not-on-sale formula (§1.2); a ticket kept off one date, or an unsold item named after the priced ones, is a fact and stays. `ResortPass in Silber für 325 €, in Gold für 495 €, derzeit nicht im Verkauf`
- **#85 `ref-link-opener-series`** (4 sentences in a paragraph, or 5 across two; all six). Ride after ride opening on its own `[Name](ref:…)` link. `[Silver Star](ref:…) ist … [Wodan](ref:…) ist eine Holzachterbahn … [Voltron Nevera](ref:…) wird …` A bold `**Name**` opener counts too.
- **#86 `title-heading`** (1 heading; all six). A `##`/`###` heading that repeats the post's title. `## Die schnellsten Achterbahnen Europas` under that title
- **#87 `chapter-pointer-opener`** (2 chapters; de en). A chapter that opens by sending the reader to another of our posts. `Für Babys … gibt es einen eigenen [Guide …](/blog/…)`
- **#88 `gap-above-widget`** (1 sentence; all six). Above a widget or table, a sentence says what is missing below (§2.19). `deshalb fehlt der Kärnan unten`
- **#89 `same-model-series`** (2 sentences; all six). The pedigree of a ride's model, again and again. `dasselbe Modell wie Hyperion`
- **#90 `elliptic-record`** (1 sentence; de en). `In <Land> ist es [Bahn]`: which record is left to the reader. `In Belgien ist es [Kondaa](ref:…)`
- **#91 `opening-date-close`** (2 paragraphs; de en). Paragraphs that end on the month and year a ride opened. `Valkyria hat im August 2018 eröffnet.`
- **#92 `negated-measure-close`** (1 paragraph; de en). A paragraph that ends on a negated figure. `Schneller als 85 km/h fährt sie nicht.`
- **#93 `once-each-chain`** (5 sentences; de en). `gilt (je) einmal` as the shape of every pass in the post. `Bronze gilt je einmal an …`
- **#94 `queue-there-series`** (4 sentences; de en). `die Warteschlange dort` as a refrain. `dann ist die Warteschlange dort kürzer`
- **#95 `bare-sum-close`** (1 paragraph; de en). A paragraph that ends on a sum and lets the reader draw the conclusion. `Alle elf Einzelpässe zusammen kosten 83 €.`
- **#96 `name-triple-echo`** (1 paragraph; all six). The same three names three times in one paragraph. `Shambhala, Dragon Khan, Furius Baco` ×3
- **#97 `x-against-x`** (1 sentence; all six, captions). `Wochenende gegen Wochenende`: a calque of English `X against X` (§2.19). `Wochenende gegen Wochenende und Ferien gegen Ferien`
- **#98 `list-source-colon`** (1 paragraph; de en). A list announced by whose list it is (§1.2: a spec is stated, not attributed). `Nach Disneys Liste:`
- **#99 `widget-one-liner`** (3 of one widget type; all six). A one-sentence paragraph above a widget, three times for the same widget. `In Blackpool … bleibt die Wartezeit … fast gleich.` over `hourly-profile-widget`
- **#100 `where-month-cause`** (1 sentence; de en). A cause hinted by a relative clause instead of stated. `Im Thorpe Park, wo im Oktober die Fright Nights laufen, war der Oktober …`
- **#101 `heading-and-orphan`** (1 heading; de en). A heading `X und Y` whose chapter never gets to Y. `## Wo du in den Niederlanden und Belgien …` without the Netherlands
- **#102 `next-year-close`** (1 chapter; de en). A chapter that ends on a guess about next year (`ob`, `wenn`, `dürfte`, `if`, `might`); the FAQ may ask it. `Ob es 2027 wieder so kommt, zeigen erst die nächsten Herbstferien.`
- **#103 `weekday-formula`** (3 sentences; de en). The weekday of a date as a clause of its own: `fiel auf einen`, `war ein`, `, ein Samstag,`. `In Spanien war der Nationalfeiertag am 12. Oktober ein Montag`
- **#104 `count-superlative-refrain`** (5 of one pair; de en). The same count and superlative as a refrain through the post. `einer der fünf vollsten Tage` ×13
- **#105 `who-so-close`** (1 paragraph; de en). A paragraph that ends on `Wer …, … also …`: the figures restated as advice with a `so` that claims a proof. `Wer im Efteling also zwischen Drache und Geisterschiff schwankt, verliert mit keinem von beiden Zeit.`
- **#106 `round-robin-connector`** (2 sentences; de en). Parks taken in turn: `war … dran`, `kam … an die Reihe`, `next up was`. `Danach war der Heide Park dran.`
- **#107 `rank-place-series`** (2 places; de en). Each novelty given its place in its park's list; an award's place and a table are not counted. `stehen dort seitdem auf Platz drei und vier`
- **#108 `count-and-arrive`** (1 sentence; de en, captions). A sum staged for an impersonal `man`: `Zählt man …, kommt man auf`. `Zählt man die Ferientage zusammen, kommt man auf 31.`
- **#109 `contrast-connector-series`** (2 sentences; de en). A sentence that opens on a place and sets it against the last one with `dagegen`, `on the other hand`. `In PortAventura ist die Warteschlange … dagegen …`
- **#110 `not-x-close`** (2 sentences; de en). A sentence that ends on `, not X.` / `, nicht X.`; a day or a duration after the `not` is advice and does not count. `we count minutes, not costumes.`
- **#111 `heading-question-anaphora`** (4 headings; all six). Four `##` headings open on the same question word (`Was`, `What`, `Wat`, `Ce que`, `Qué`, `Cosa` …) and end without a question mark. `## Was über den Abend bekannt ist` A heading ending in `?` is the reader's question and never counts; at three headings the rule fired on 33 posts, because three indirect questions are often the visitor's questions §5.0 asks for.
- **#112 `neither-nor-refrain`** (2 paragraphs, or 1 pair; all six). Paragraphs that close on `weder … noch` / `neither … nor`, or two sentences in a row that open on `Weder` / `Neither`. `wissen … weder Omroep Flevoland noch NOS oder VRT.`
- **#113 `distancing-formula`** (1 sentence; de en nl fr). A press office's formula under a person's byline. `Von Gewalt distanzieren wir uns` Spanish and Italian are left to the critic: the plain sentence (`nehmen wir klar Abstand davon`) translates with the same verb.

## Where a rule gives way to a template

Three rules meet a rule the templates impose and give way to it. A guide has a travel chapter with
one subheading per country, so #53 is quiet inside it. An FAQ answer is read alone and may repeat
one fact (§5.4), so #48 fires on a copied passage, not on a shared figure. Minimum heights and
coaster specs are required facts, so a spec list is never a series and #63 fires on the sentence
formula only.

## Decided against a rule

Some patterns the critic reported were kept away from the check:

- **They clash with a rule the templates set.** Narration over a widget and the echo of a widget
  (the text explains what the widget shows); a capacity figure next to a ranking, the
  minimum-height series and the triple of specs (specs are required facts); headings as a series
  of questions (chapters follow the reader's questions); an FAQ that shares names with a paragraph
  (an answer is read alone).
- **A script cannot tell good from bad.** Four different words for "such as" in one post, the
  owner or founding year at the end of a paragraph, two links to the same guide, five sentences
  opening on `Für`, the excerpt's key term in a table cell and an FAQ answer, a park's name and its
  town in turn.
- **Only a reader sees it**: the topic sentence over a list, the same fact in two chapters, an echo
  under the table, a sentence that repeats the last one, the mirrored biography, a place pair
  mirrored at a paragraph end, the author's verdict echoing the source, an implication drawn from
  visits per ride, a country section that sums up a table, opening hours in a price comparison, a
  series of figures with no conclusion, an award next to a wait time, a cause given only by the
  heading.
- **Covered by a neighbour.** A chapter of one or two sentences is §4.3's rule; the excerpt
  sentence repeated in the text and the same figure with its unit in two paragraphs are what
  `fact-refrain` (#51) counts once they reach three sections.

## What stays with the critic

The part no pattern can see, in every language:

- **Refrain.** The core statement stands in the excerpt, the chapter, the running text and the FAQ
  in the same words. Say it where it is found first (§5.4).
- **Repeated reservation.** The same gap in the data admitted in several chapters. Name it once,
  where the reader would otherwise draw a wrong conclusion (§2.19).
- **Echo.** A sentence repeats the figures of the table directly above it.
- **Implication by juxtaposition.** Numbers under a table meant to suggest a cause the text never
  states. State the cause with its source, or leave the numbers out.
- **Invented everyday comparison and the wink in brackets.** A comparison with a queue at the
  baker's that nobody measured (§1.8); a parenthesis that nudges the reader (`(ja, wirklich)`).
- **Riddle apposition.** A person or thing introduced as a puzzle before it is named
  (`gehörte dem, dem …, Maximus Müller`).
- **The one-line punch.** A paragraph ending on a sentence of fewer than seven words that sounds
  like a verdict and carries no fact.
- **A summary that repeats facts from the park sections** (§1.5).
- **A comparison that restates the numbers** of the same paragraph in words.
- **A question answered across a heading.** A chapter ends on a doubt
  (`lange war ich mir nicht sicher, ob das überhaupt jemand annimmt`) and the next opens on its
  answer (`Inzwischen weiß ich es.`): §2.12 with a heading in between.
- **The tautological apposition.** `Nighttime Spectacular, ein Nachtspektakel`.
- **The sentence that says the last one again** in other words.
- **The theme sentence over a list.** `Bei den Tickets gibt es einiges zu beachten.` Let the list
  start without it.
- **The capacity maxim.** `Wer viel fahren will, braucht Zeit.`, dressed up with a ride's hourly
  capacity.
- **The heading that promises more than its chapter**, or a chapter that does not answer its
  heading (a section „Rekorde nach Ländern“ whose sentence about Taron names no record).
- **Two sums that are not comparable, side by side.** A resort's seven million visitors next to a
  park's 5.78 million visits. Say what each counts.
- **The restriction in the wrong place.** `Außerhalb von Salou fährt die schnellste Achterbahn
Spaniens …` says that Spain's fastest is not in Salou.
- **The riddle year.** `seit 2017 mit elf Metern pro Sekunde`: name what changed in 2017, or leave
  the year out.
- **The vague placeholder for a fact the post has.** `ausgewählte Attraktionen`, when the source
  names them two sentences later.
