### Code-Index, drei neue Regeln und ein Aufräumdurchgang über die ganze Codebase

`docs/code-index/` listet jeden exportierten Baustein aus `app/`, `components/`, `lib/`, `i18n/`, `types/` und `proxy.ts` mit dem ersten Satz seines Doc-Kommentars, eine Seite pro Verzeichnis. `scripts/generate-code-index.mjs` schreibt ihn aus dem Quelltext (`pnpm generate:code-index`, rund 3 s), `pnpm check:code-index` schlägt bei einer veralteten Seite fehl und läuft in CI als eigener Job `code-index-drift`. Beim ersten Lauf hatten 646 Komponenten, Hooks und Funktionen keine Beschreibung, jetzt ist es eine (`leanParkForAttractionShell` in `lib/api/parks.ts`, den ein offener Pull-Request ändert). Die Seiten tragen keine Zählzeile, damit zwei Pull-Requests im selben Verzeichnis nicht auf derselben Zeile kollidieren.

Drei neue Regeln stehen in `CLAUDE.md` und unter `docs/rules/`: DRY (`dry-one-place-for-each-piece-of-logic.md`), der Code-Index (`the-code-index-is-generated-from-the-doc-comments.md`) und Kommentare (`a-comment-says-why-once.md`).

#### Kommentare

Ein Kommentar sagt jetzt, warum, in ein bis drei Sätzen, und verweist auf die Regelseite, die die Messungen trägt. Entfernt wurden Kommentare, die die nächste Zeile nacherzählen, JSX-Abschnittslabels, Trennbanner, Ticketnummern, Daten, Messwerte und Geschichten über frühere Fassungen. Von 210.028 Zeilen in `app/`, `components/`, `lib/`, `i18n/` und `proxy.ts` waren am 2026-10-06 39.473 Kommentar (18,8 %), jetzt sind es 23.149 von 187.084 (12,4 %). Kommentare mit Ticket, Datum oder Historie sanken von 680 auf 69, JSX-Labels von 135 auf 2, Banner von 191 auf 1. Jeder Commit dieser Art ist gegen seinen Vorgänger auf gleichen Token-Strom ohne Kommentare geprüft. Dabei wurden auch rund zwei Dutzend Kommentare korrigiert, die dem Code widersprachen.

#### Fehler, die beim Aufräumen aufgefallen sind

- Die Wettervorschau auf `/it` zeigte englische Wochentage: eine von fünf Kopien der date-fns-Sprachtabelle hatte kein Italienisch. Alle fünf lesen jetzt `dateFnsLocale()`.
- Der Tagesdialog im Kalender schrieb auf `/en` „Tuesday, 10. November 2026". Der Titel kommt jetzt aus `getDateTimeFormat`.
- Die Stundenköpfe des Tagesprofils formatierten eine UTC-Zeit ohne Zeitzone: 9 Uhr stand in Berlin als „10 Uhr", in Los Angeles als „1 AM", und der Client widersprach dem Server-Render.
- Die Startseite gruppierte die Gesamtwartezeit ohne Locale, und eine lokale Kopie von `formatCompact` schrieb auf Deutsch „1.2M". Beide nehmen jetzt die Seitensprache.
- Im Tagesplaner ignorierten das Flyout auf dem Telefon und die Passt-Prüfung im Wizard die Early-Entry-Antwort, weil beide eine Kopie der Tagesableitung ohne `withEarlyEntry` trugen.
- Das Trend-Delta auf der Ride-Seite rundet über `roundWaitDeltaTo5`.
- Blog-OG-Bilder schickten `Cache-Control: max-age=0`, Park- und Glossar-Karten 30 Tage. Blog und Glossar zeichnen jetzt dieselbe Karte (`lib/og/text-card.tsx`) mit denselben Headern.

#### Sicherheit

`/api/parks-list` ist entfernt: Die Route hatte keinen Aufrufer, war anonym erreichbar und schickte jede Anfrage mit `x-auth-key` an die API. Der Analytics-Proxy leitet keine Query-Parameter mehr weiter, vorher war jedes `?x=…` ein eigener Upstream-Aufruf mit Schlüssel, am 60-s-Fenster vorbei.

#### Duplikate und toter Code

jscpd fand 44 exakte Klone (2,1 % der Zeilen). Zusammengeführt sind unter anderem der Push- und Trip-Relay (`lib/api/relay.ts`), `getApiBaseUrl` (vorher vier gleiche Kopien und ein Dutzend Inline-Konstanten), die Sitemap-Helfer, die Glossar-Segmente (drei Kopien), die Kuratierfelder im Admin, die Admin-Rollen (drei Kopien, jetzt `lib/admin/roles.ts`), die GitHub-Helfer des Blog-Editors, die Planer-Spannen (`spansFor`, fünf Kopien) und die Spurgeometrie (`laneBox`). Wo `Intl`-Formatter im Render gebaut wurden, kommen sie jetzt aus `lib/utils/intl-format.ts`, gegen die alte Ausgabe in sechs Sprachen und mehreren Zeitzonen verglichen. `FavoriteStar` liest den Favoriten-Store über `useSyncExternalStore` statt per Effekt, das spart pro Karte einen Commit beim Mounten. Ungenutzte Exporte sind gelöscht oder nicht mehr exportiert.
