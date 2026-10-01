### Das Backstage-Menü zeigt, wann ein Beitrag zuletzt neue Inhalte bekam, und „rechnet durch“ ist ein Prosa-Fehler

- Das Blog-Panel im Header (`getBlogMenu`, `lib/navigation/blog-menu.ts`) sortiert nach letzter
  Änderung (`listArticlesByRecency`, `lastTouched`) und druckt jetzt auch diesen Tag, als
  „Aktualisiert 30. Sept. 2026“ (`navigation.updatedOn`, sechs Sprachen) oder als
  Veröffentlichungsdatum. Vorher stand unter der Änderungs-Reihenfolge das Veröffentlichungsdatum,
  am 01.10. auf Deutsch in der Folge 24. Jul, 17. Jul, 28. Sep. `pnpm test:news-split` prüft
  Reihenfolge und gedruckten Tag in allen sechs Sprachen.
- `updatedAt` bewegt sich nur noch bei neuen Inhalten (neue Termine, Parks, Zahlen, ein
  korrigierter Fakt), nie bei einem Formulierungs- oder Prosa-Durchgang
  (`docs/rules/updated-at-is-for-new-content.md`). Eine Änderung vom 25.09. hatte das Feld auf 89
  Beiträgen gesetzt; es ist aus allen 90 Beiträgen außer dem Halloween-Guide entfernt (sechs
  Sprachen), damit stimmen Menü, Startseite, `dateModified` und `<lastmod>` wieder.
- `scripts/check-prose.mjs`: neuer Fehler „a document that does the sums“ für `rechnet … durch` und
  die fünf Übersetzungen von „rechnet durch, was passiert, wenn“ (`works out what happens`,
  `rekent uit wat er`, `calcule ce qui se passe`, `calcula qué pasa`, `calcola cosa succede`), dazu
  die Warnung „things that calculate“ für einen Guide, eine Seite, einen Kalender, ein Widget, ein
  Gutachten oder den Planer als Subjekt von rechnen. Regel in `docs/blog.md` §2.13. Der Lauf fand
  8 Fehler und 17 Warnungen; alle Stellen sind in den betroffenen Sprachen umgeschrieben, darunter
  Titel, SEO-Beschreibung und Einleitung des Tagesplaner-Beitrags, `planner.page.lead`,
  `fancast.description` und die Touringplan-Definition im Glossar (`GLOSSARY_CONTENT_DATE`
  2026-10-01).
