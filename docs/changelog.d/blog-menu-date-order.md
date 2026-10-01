### Das Backstage-Menü sortiert wieder nach Datum, und „rechnet durch“ ist ein Prosa-Fehler

- Das Blog-Panel im Header (`getBlogMenu`, `lib/navigation/blog-menu.ts`) las
  `listArticlesByRecency`, die Reihenfolge der Startseite: `updatedAt` zuerst, `featured` oben. Jede
  Zeile im Panel druckt aber das Veröffentlichungsdatum, und am 01.10. stand dort auf Deutsch die
  Folge 24. Jul, 17. Jul, 28. Sep, 22. Sep, 20. Sep, weil zwei Juli-Guides am 30.09. und 01.10.
  bearbeitet worden waren. Neu: `listArticlesByDate` (`lib/blog/listing.ts`), nur Artikel, neueste zuerst nach
  `date`, `featured` ignoriert. `pnpm test:news-split` vergleicht die Daten der Zeilen in allen sechs
  Sprachen mit den neuesten Artikeln (vorher 6 von 61 Prüfungen rot, jetzt 61 grün).
- `scripts/check-prose.mjs`: neuer Fehler „a document that does the sums“ für `rechnet … durch` und
  die fünf Übersetzungen von „rechnet durch, was passiert, wenn“ (`works out what happens`,
  `rekent uit wat er`, `calcule ce qui se passe`, `calcula qué pasa`, `calcola cosa succede`), dazu
  die Warnung „things that calculate“ für einen Guide, eine Seite, einen Kalender, ein Widget, ein
  Gutachten oder den Planer als Subjekt von rechnen. Regel in `docs/blog.md` §2.13. Der Lauf fand
  8 Fehler und 17 Warnungen; alle Stellen sind in den betroffenen Sprachen umgeschrieben, darunter
  Titel, SEO-Beschreibung und Einleitung des Tagesplaner-Beitrags, `planner.page.lead`,
  `fancast.description` und die Touringplan-Definition im Glossar (`GLOSSARY_CONTENT_DATE`
  2026-10-01).
