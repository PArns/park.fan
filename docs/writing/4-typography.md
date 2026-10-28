# 4. Typography and formatting

Chapter 4 of the [writing rules](README.md): the em dash, bold, headings and titles, lists, quotes,
emoji and the plain-text fields. Read §4.3 before writing any heading or title, and §4.1 and §4.5
before writing anything that leaves the page as plain text.

Formatting is where generated text is most obvious, because a chatbot's output is Markdown shaped
by a system prompt that tells it to use headings, bullets and bold.

## 4.1 The em dash

**No `—` in reader-facing prose, in any language.** In German it is simply the wrong character:
German typography uses the spaced Halbgeviertstrich `–`. In English it is legitimate punctuation,
and we still leave it out, because our voice does without it and one banned character is easier to
check than a budget. Reach for a comma, a colon or a full stop; an em dash almost always marks a
sentence that wanted to be two.

Two narrow exceptions: the `— Patrick` signature at the end of a post that is not news, and ranges
or compounds with an unspaced en dash (`90–140 cm`, `Venlo–Eindhoven`, `2007 – Ithaka`).

Swapping the character does not swap the habit. A spaced `–` for a parenthesis is correct German;
a `–` that pivots a clause in every other paragraph is the em dash under another name.

UI strings follow the same rule (`MAE — um wie viele Minuten …` → `MAE: um wie viele Minuten …`).
`check:prose` fails on an em dash in a post body, a plain-text field, a sidecar text, a changelog
entry and in German or Dutch page prose, and on any em dash in the message catalogs
(`UI_EM_DASH_BASELINE` is zero in all six).

**Why, honestly.** As a detector the em dash is spent: human writers average 3.23 per 1,000 words,
GPT-5.4 answers with 1.43, and the model this site is written with dropped from 12.9 to 0.05
between two versions. A text full of them has a habit; a text with none proves nothing. We keep the
ban because German typography settles it anyway and a banned character is the one rule a grep can
decide. And a rule in a prompt is not a rule in the output: told explicitly not to use em dashes,
GPT-4.1 still produced 3.86 per 1,000 words (Freeburg 2026). That is why it is checked at the file,
not requested at the keyboard.

## 4.2 Bold

Bold marks proper nouns, numbers and the one sentence a reader must not miss. It does not mark
`**Begriff**: Erklärung` at the head of every bullet; that layout comes straight out of a chat
window and is one of the most recognisable formatting tells there is. A post that needs more than a
dozen bold runs has not decided what matters.

## 4.3 Headings

- **A heading names what is under it** (`Wann Taron am kürzesten ist`). It is not a summary of the
  paragraph below and never a colon plus hook. Refuse the SEO-template furniture models reproduce
  by default: `<Thema>: So gelingt <Ergebnis>`, `Alles, was du über X wissen musst`,
  `X: Der ultimative Guide`, `<Zahl> Tipps, die du kennen solltest`,
  `Von X zu Y – wie man Z wählt`.
- **A heading is not a slogan.** Two mirrored halves around a comma (`Parks ohne Zahlen, Tage ohne
Wetter`, `Der Park macht um neun auf, die Bahn um zehn`) or a comparison where a name belongs
  (`Ein Block pro Bahn, so hoch wie ihre Schlange`) is an advert's line. Name the chapter:
  `Blöcke und Umstiege`, `Bahnen, die später öffnen als der Park`. `check:prose` warns on both
  shapes.
- **A heading names what the reader gets, not what our records say.** `Wie die Hallen in unseren
Daten stehen` → `Überdachte Bahnen auf der Parkseite finden`; `Die sechs Parks nebeneinander` →
  `Die neun Parks im Vergleich`. The reader's words are the search words. `check:prose` warns on
  `in unseren Daten` and its twins.
- **A title is a sentence a person would say, with its verb.** `Alton Towers: Die Bahnen dürfen
nicht über die Bäume` drops the infinitive after the modal, as speech does, and leaves the reader
  guessing what the post is about. Say the whole thing:
  `Alton Towers: Achterbahnen unter den Baumkronen`. `check:prose` warns on a German modal followed
  by a prepositional phrase and no verb in a title or heading.
- **A title and a heading carry no figure that moves.** A title is quoted into the listing card,
  the feed item, the `<title>`, the breadcrumb and the shared link, and none of them re-render when
  the number behind it changes. `Hansa-Park: 214 Tage am Stück geöffnet, …` shipped as a title with
  the season's opening-day count, which the park can change any day; it became
  `Hansa-Park: Der Kärnan fährt 127 km/h, und die Saison hat keinen Schließtag`. The test: would
  the line still be true in a year, or after one ordinary data change? A dated figure
  (`Saison 2026`, `23. Mai 2026`) is fine; a live or counted one (`214 Öffnungstage`,
  `Ø 34 Min.`, `82 Attraktionen`, `1,4 Millionen Gäste`) belongs in the paragraph that carries its
  source and date. The body's twin of this rule is the wait time never typed into a post (§5.4).
- A section with two sentences under it is a paragraph; do not fragment a text into a heading
  every three sentences.
- No title case in German: sentence case, always.
- Do not skip levels (`##` then `####`), and never repeat the post's title as a `##` heading.
- Every chapter heading on the site is drawn by one component:
  [chapter headings](../design/chapter-headings.md).

## 4.4 Lists

Prose is the default. A list is for things that are genuinely a set: opening hours, height limits,
steps in an order. Turning an argument into five bullets is what a model does when it cannot
connect two thoughts, and a list whose every item has the same grammatical shape reads generated
even when the content is fine.

**A date never opens a line.** CommonMark lets a line that starts with `1.` interrupt a paragraph,
so a German paragraph hard-wrapped before `1. November` renders the rest as a numbered list, and
Prettier then renumbers it: `Winterzauber vom 28. November` was published as `2. November` for
three days. Wrap the line before the day number, or keep `zum 1. November` together (a no-break
space between day and month also works). `check:prose` fails on a line that opens with a German day
and month. No line of running text starts with any number followed by a full stop (`3. Platz`,
`2. Zug`), in any language.

## 4.5 Emoji, quotes, separators

- **No emoji as formatting**, never in front of a heading or a bullet.
- **German quotes are `„…“`**, English `"…"` (the other four: §6). A German quote closed with a
  straight `"` is a paste artefact, and mixing curly and straight quotes is a tell of its own.
  `check:prose` fails on `„…"`.
- **No `---` thematic breaks** between sections of a post; the heading is the break. (The `---`
  that may open the source chapter at the end is not one.)
- **Chat-export debris** in anything pasted: `contentReference`, `oaicite`, `turn0search0`,
  `[cite: 1]`, `:::writing`, `【…】`. If one reaches a file, the text was pasted, not written.
- **One ellipsis per post at most**, and only where a thought really trails off. `[…]` marking a
  cut in a quote does not count.
- **One exclamation mark per 1,000 words** in a post. Enthusiasm comes from the words. A line that
  carries its own (`Ah, fresh meat!`) still counts, and a person decides whether it stays.
- **Plain-text fields carry no Markdown and no em dash.** `title`, `excerpt`, `seo.title`,
  `seo.description` and the cover's `alt` and `caption` leave the page as plain text (the card, the
  feed item, the `<title>`, the search snippet), where `**fett**` arrives as asterisks.
  `check:prose` fails on either.
