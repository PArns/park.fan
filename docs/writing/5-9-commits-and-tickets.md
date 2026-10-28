# 5.9 Commits, pull requests, tickets and comments

Part of chapter 5 of the [writing rules](README.md): how commit messages, PR titles and bodies,
Linear tickets and code comments are written. Open it before committing, opening a PR or filing a
ticket. Nobody outside reads these, and Patrick reads all of them; the general rules (§1 to §4)
apply, plus these.

- **Commit messages, PR titles and PR bodies are English; Linear tickets and comments are
  German.** A commit reads `PAR-<n>: <what changed>`, a news PR `News: <what happened>`.
- **Say what changed, not how carefully.** `refined for clarity and consistency while preserving
the structure` is Wikipedia's example of a generated edit summary. The text grows with the
  change, not with the diligence: a small fix gets three sentences and the commands that were run.
  The review is one line (`Review: <model>, <n> passes, <n> fixed, <n> noted`), not a chronicle,
  and the reasoning stands once, in the PR, not again in the closing comment.
- **The shape of a commit**: a subject line under 72 characters, a blank line, then a body wrapped
  at about 72 that says what changed and why in a few sentences; the commands that were run go
  last, one per line:

  ```text
  PAR-992: Werktag means Monday to Friday nowhere it shouldn't

  „Werktag“ includes Saturday. Where a post used it for Monday to Friday,
  the sentence now says so, or the post defines the word once where it
  first uses it. The Italian „feriali“ got the same pass.

  pnpm check:prose
  pnpm check:blog-updated-at
  ```

- **One thought per sentence, subject, verb, object.** No inversion for effect, no maxim, no colon
  punchline, no rhetorical question, no chain of dashes. Not `Ein Band, das nach einem Quantil
benannt ist, ist damit noch keines` but `Das Band heißt p90, enthält aber nicht das
90-%-Quantil.`
- **A number instead of an image.** Not `die Achse fällt auf ihre 16 px zusammen` but
  `Die Achse ist 16 px hoch.`
- **Code does not see, know or want** (§2.13). Not `der Schalter sieht das Fenster` but
  `die Media Query prüft jetzt auch die Höhe`.
- **German text keeps the English technical term** and never coins a German one: `Assertion`, not
  `Zusicherung`; `Run`, not `Durchgang`; `Checkbox`, not `Kästchen`; `pointer: coarse`, not
  `Grobzeiger`. Having to invent a German word is the sign to use the English one. The board's own
  words (Claim, Übergabe, Rückfrage, Fehlversuch, Beifang, Worker-Log, Triage) are never varied
  (§2.6).
- **New German orthography everywhere**: `dass`, `muss`, `passt`, `Prozess`. `check:prose` fails on
  the old spellings (`old-orthography`) in every German text it reads, except proper names
  (`Schloß Dankern`) and quotes; commits and Linear it cannot read, so that part is the writer's.
- **A ticket title says what holds afterwards**, or, for a bug, what was observed with its number
  (`X zeigt Y, obwohl Z`). The body is Kontext, Akzeptanzkriterien, Definition of Done and
  Nicht-Ziele, with no summary of the summary. A ticket that changes a prose rule quotes the
  sentences that caused it.
- **An option put to Patrick is understood on the first read**: the situation in two sentences,
  then one line per option.
- **A comment in code says why, once** ([the rule](../rules/a-comment-says-why-once.md)). A testable
  claim in a test comment becomes an assertion.
