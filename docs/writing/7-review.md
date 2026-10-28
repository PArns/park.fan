# 7. The check before you publish

Chapter 7 of the [writing rules](README.md): `pnpm check:prose`, what it reads and decides, the
measured baselines its thresholds rest on (§7.1), and the review pass, the agreement read and the
critic that every post goes through before it is handed over (§7.2), with the lines the PR carries.

Read the finished text out loud. Where the rhythm turns metronomic, break it: a short sentence, a
dropped connective, an aside. Then run the check:

```bash
pnpm check:prose                       # no network, no running site
pnpm check:prose --strict              # warnings count as failures
pnpm check:prose --verbose             # every hit, not the first forty
pnpm check:prose --file=<path>[,…]     # report only files whose path contains it
pnpm check:prose --rule=faq-echo       # every occurrence of one rule, in every file
pnpm check:prose --only=changelog      # one surface: blog, catalogs, media, pages, changelog, source
```

`scripts/check-prose.mjs` (with `scripts/prose-slop-patterns.mjs`) is the executable half of these
pages and holds the same lists, the way `attractionIsOutOfSeason()` is the SQL twin of the season
rule: change one half and you change both. It reads the posts, the six message catalogs, every
media sidecar, the glossary (per term), the content pages and the hero copy in their `page.tsx`,
the homepage announcement, the changelog (§5.8), the three agent skills and `/llms.txt`; for
`Warteschlange` alone also every string in the tracked `.ts` and `.tsx` files under `app/`,
`components/` and `lib/`. READMEs are skipped, because they quote the banned words. The legal
pages get only the rules with no exception. It splits its output the way a regex can be trusted:

- **Errors** are rules with no legitimate exception: an em dash (§4.1); the honesty family and
  chat register where the subject is us (§3.3 rule 1, §5.1); placeholder text (§1.8); the house
  rules §3.3 marks as errors; a post that rates its own information (§1.4); a document that does
  the sums (§2.13); a heading that asks and then orders (§5.6); a German date that opens a line
  (§4.4); a German quote closed with `"` and Markdown in a plain-text field (§4.5); a `[!QUOTE]`
  without a source line; German spelling from before 1996 (§5.9).
- **Warnings** are budgets and signals a person decides on: `eerlijke prijzen` in a paragraph
  about a restaurant means _fair_ prices and stays; the same word in a UI string does not. Every
  rule of §2.20 is a warning.

Each section of these pages says what the script decides for its rule. What it cannot see is the
wink at the end of a paragraph (§2.17), the quiet teaser (§2.16), whether a sentence claims
anything at all (§1.7), and whether the post agrees with itself (§7.2). That is the review pass.

## 7.1 Measured state

The thresholds were set on **2026-09-30**, after a pass over every text (posts, glossary, catalogs,
captions, landing pages, the guide page, the changelog and the skills). That day the corpus read:

- sentence-length variance: de 0.57, en 0.59, nl 0.58, fr, es and it 0.60; lowest post 0.40
- commas per 100 words: de 8.2, en 6.4, nl 6.4, fr 7.7, es 6.7, it 6.7
- colon pivots per 100 sentences, medians: de 6.5, nl 7.8, es 9.6, en 10.3, it 11.4, fr 12.1;
  every post under 15
- English contractions: lowest post 60 %, median 94 %
- `Schlange` for `Warteschlange`: 0 (255 changed that day); em dashes in `messages/*.json`: 0 in
  all six, which is the ratchet (`UI_EM_DASH_BASELINE`) the script holds the catalogs to

A check produces candidates, not verdicts: the Spanish Walibi post's `cartel «Speed Zone»` is a
sign with a name painted on it, inside a caption, which is the thing itself and not the prop §3.3
rule 2 bans.

## 7.2 The review pass

`check:prose` settles what a regex can. The rest needs a second read, and it works best as a
**separate pass with its own instruction**, run on the finished text instead of folded into writing
it. A session that wrote a post runs it before handing the post over:

> Review the finished text against docs/writing/. Keep every fact, number, source, quote and the
> structure. Fix only the patterns the rules name. List each change with the rule it answers.

- The pass produces **proposals**. A change that makes a sentence worse is dropped, whatever rule
  it cites.
- It does not flatten the voice. A first-person opinion, a deliberately short paragraph and a joke
  stay.
- It does not check facts and cannot supply a missing one. Sources, quotes and anything legal are
  their own step ([a quote names its source](../rules/a-quote-names-its-source.md)).
- A correction that comes back becomes a rule here, with the example that caused it. A rule that
  keeps producing worse sentences is changed or dropped.

**The agreement read** is a second instruction, run as its own read, because a guide can pass
`check:prose` without a hit and still contradict itself: the Alton Towers guide gave the walk from
the car park as 10 to 28 minutes in one section and 15 to 25 in the next, denied children under
140 cm all seven big rides although two start at 120 cm, and put `Fünf Mal war dieser Park der
Erste` over six rides.

> Read the finished text once for agreement only. List every figure, date, price, height and
> count that occurs more than once, and every heading that counts, and check each occurrence
> against the others and against the source list. List every claim about where something is in
> the park and name the source that places it there. Change nothing; report each conflict with
> both lines.

Each conflict is settled against the source, then the duplicate goes (§5.4, each fact once). A
place in the park (`liegt am weitesten vom Eingang`, `hinter der ersten Kuppe`) needs a source like
any claim; the park map and Wikipedia's area list are sources, a guess from the order of a list is
not.

**The critic** is a third read, run last by a fresh agent that has seen neither the text nor any
earlier finding. It marks what a reader who spots machine text would mark, and it grades the check
itself. The order, word for word:

> Du bist der Kritiker. Du hast diesen Text nicht geschrieben und kennst keinen Entwurf davon.
> Du suchst nur eins: Sätze, die ein Leser, der KI-Texte erkennt, als maschinengeschrieben
> erkennen würde. Datei(en): <pfad>. Regelwerk: docs/writing/, lies README.md (§0),
> 1-substance.md, 2-sentence-shape.md, 2-20-check-patterns.md und §4.3 in 4-typography.md vor dem
> Text.
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
> - zu einem der Muster gehört, die nur der Kritiker sieht (§2.20, „What stays with the critic“).
>
> Auch wenn keine Regel in docs/writing/ das Muster beim Namen nennt. Fakten, Aufbau und
> Rechtschreibung prüfst du nicht, dafür gibt es andere Prüfungen.
>
> Einen Witz, der einen Fakt trägt, markierst du nicht; ein Lächeln alle drei bis vier Absätze
> ist gewollt (§0.1).
>
> Zu jedem markierten Satz schreibst du eine bessere Fassung, die denselben Fakt trägt und sich
> besser liest, mit Witz, wo er passt (§0.1). Kürzen ist kein Ziel. „streichen“ schlägst du nur
> vor, wenn der Satz einen Fakt aus demselben Text wiederholt oder den Streichtest besteht, also
> nichts trägt; dann nennst du die Stelle, an der der Fakt schon steht.
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

`<Regelname>` is the first word of the check's message: a rule of §2.20 (`widget-announcement`) or
the name of an older one. On its first run, over twelve guides that had passed the check, the
critic made 87 findings, of which the check had found none, and reported no false alarms.

How the critic is used:

- **It rewrites; it does not shorten.** Every finding comes with a better sentence that carries the
  same fact, and the writer takes it or writes a better one still. A sentence goes only when it
  repeats a fact that already stands in the post, or carries none (the deletion test of §1.7).
  Patrick: „nicht sinnlos kürzen“.
- **Two rounds at most.** What it still marks after the second is rewritten once more by the
  writer, plainly, with the fact kept. The critic is never the reason a post does not ship, nor the
  reason it falls under its length floor (§0.1).
- **German before the translation, English after it.** The other four take its findings over from
  those two (§6).
- **A rewrite adds no fact and drops none**, except a repeat. A verdict the critic proposes is not a
  fact either.
- **It does not take the voice out** (§0.1). A joke that carries a fact stays, and so does the one
  wink a section may have (§2.17). A post that makes nobody smile after the rounds has lost
  something the rounds were not asked to remove.
- **A miss is reported in Linear and fixed in the repo.** A pattern the check should have seen
  becomes a ticket „Prosa-Regel: …“ in Triage (or a line in the PR body where the writer opens no
  tickets); a message the critic finds wrong becomes „Prosa-Regel falsch: …“. The rule itself is
  written here and in the script, never only in the ticket. A new rule in
  `scripts/prose-slop-patterns.mjs` starts as a warning, carries a positive and a negative case in
  `pnpm test:prose-rules`, and its PR reports how often it fires over `content/blog/` on current
  `main`. Run the check from current `main`: twelve guide branches once passed on a stale copy of
  the script and failed 21 times after the merge.

**What the PR carries**, so the PO can check it before merging:

```text
Länge: <n> Wörter (de, wc -w), Untergrenze <n>
Auszug: <the excerpt, verbatim>
Quellen-Check: <n> Fakten, <n> Quellen, gestrichen <n>
Prosa-Review: <n> Änderungen
Stimmigkeit: <n> Konflikte, alle gelöst
Kritiker: de <KEIN SLOP | SLOP, <n> umgeschrieben> nach <n> Runde(n), en … · check:prose fand <n> von <m>
```

Every warning `check:prose` gives on a file the PR touches is fixed or justified in one line of the
PR; errors are zero.
