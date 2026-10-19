### `check:prose` kennt acht Muster aus dem Dankesbeitrag vom 19. Oktober

Der Kritiker (§7.2) hat den Dankesbeitrag „Aus einem Skript für mich ist eine Seite für euch geworden“ zweimal gelesen und Muster markiert, die `check:prose` nicht kannte (0 von 28 Befunden). Acht davon stehen jetzt als Regeln 40 bis 47 in `scripts/prose-slop-patterns.mjs` und in `docs/blog.md` §2.20, alle als Warnung:

- `origin-circle` (40): die Kreisformel `wo das alles angefangen hat` in sechs Sprachen, dazu `angefangen`, `begann`, `started` ab vier Sätzen und drei je 1.000 Wörter (de, en).
- `thanks-either-or` (41): `Danke euch allen, ob ihr … oder …` und die Gegenstücke in den anderen fünf Sprachen.
- `imagined-reader-tour` (42): `Manche …, andere …` mit zwei Links auf Seiten der Site oder einem dritten `ein paar … vielleicht`, in sechs Sprachen. `ref:`-Links zählen nicht.
- `feeling-close` (43): drei Absätze, die auf dem Gefühl des Autors enden (`Damit hätte ich nie gerechnet.`, `hat mich gefreut`), de und en.
- `disappoint-teaser` (44): `da muss ich enttäuschen` in sechs Sprachen.
- `bridge-apposition` (45): `…, genau die Wochen, in denen …` am Satzende, de und en.
- `contact-form-phrase` (46): `immer willkommen`, `lese ich selbst`, `als ich zugeben möchte` und die Gegenstücke in sechs Sprachen; `Les chiens sont les bienvenus` bleibt erlaubt.
- `filler-adverb-pileup` (47): `gerade`, `inzwischen`, `eigentlich`, `wirklich` (en: `actually`, `really`, `basically`, `literally`) ab vier Mal und vier je 1.000 Wörter.

Der neunte Befund, eine Frage am Kapitelende, die das nächste Kapitel beantwortet, steht als zehntes Muster in der Liste, die nur der Kritiker sieht, und in seinem Auftrag. Auf dem Korpus vom 19. Oktober schlagen die acht Regeln bei den sechs Fassungen des Dankesbeitrags an und bei einem weiteren Beitrag, dem deutschen Kompass-Beitrag mit acht Mal `gerade` in 1.200 Wörtern. Auf der Fassung des Dankesbeitrags vor dem Kritiker-Lauf schlagen alle acht an. `pnpm test:prose-rules`: 262 Fälle über 45 Regeln (vorher 227 über 37).
