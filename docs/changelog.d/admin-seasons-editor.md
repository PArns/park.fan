### Saisons lassen sich im Admin anlegen und bearbeiten, und eine App darf auf Wunsch schreiben

`/admin/seasons` war eine Liste, deren Zeilen in den Park führten. Jetzt filtert sie nach Jahr, Art,
Status, Reiseregion, Park und „Läuft heute“, die Filter stehen in der Adresse, und „Neue Saison“
legt eine Saison an, auch ohne vorher den Park zu öffnen. Eine Zeile öffnet dasselbe Formular wie
der Tab „Saisons“ im Park (`SeasonEditor`, nach `app/admin/seasons/_components/` umgezogen): jetzt
mit den betroffenen Fahrgeschäften, „Zuletzt an der Quelle geprüft“ und Uhrzeitfeldern. Die Termine stehen als Raster aller Monate des Zeitraums, bis zu drei nebeneinander, ein gewählter
Tag als ruhige Pille (`DayCalendar` in `app/admin/_ui/day-calendar.tsx`, auf den Monatsrastern des
Planers); „Alle“, „Keine“, „Wochenenden“, „Fr–So“, ganze Wochentage, Umschalt-Klick und eine
eingefügte Liste (`2026-10-03` oder `3.10.2026`) ersparen die Einzelklicks. Kind-Icons und
Status-Farben sind die der Parkseite (`SeasonKindIcon`, `SEASON_STATUS_TONE`). Das Formular prüft vor dem Speichern, was die API prüft
(`seasonProblems` in `app/admin/_lib/seasons.ts`), schickt beim Bearbeiten nur die geänderten Felder
und `null` für geleerte (`seasonPatch`) und zeigt eine 400 der API über den Knöpfen. Wer nur lesen
darf, sieht das Formular gesperrt. Die Art „Winter“ (`winter`) steht neben „Weihnachten“ zur Wahl.

Saisons und Tickets stehen in der Seitenleiste unter „Reiseplaner“, nicht mehr unter
„Kuratieren“. Park-Auswahl und Mehrfachauswahl teilen sich `useParkCatalog` und
`MultiSearchSelect` mit den API-Keys und den Weiterleitungen.

Die Freigabeseite für MCP-Apps bietet der Redaktion „Schreiben erlauben“ (`admin:write`) und dem
Inhaber zusätzlich „Inhaber-Rechte“ (`admin:owner`, mit Warnung: zusammenführen, stilllegen,
API-Keys), voreingestellt auf das, worum die App bittet, gedeckelt durch die eigene Rolle. Überschrift,
Rollenzeile und „Ändern kann die App …“ folgen der Wahl, die als `scope` im Approve-Body geht. Der
Token-Dialog unter „Mein Konto“ hat dieselbe Wahl, die Token-Liste markiert schreibende Tokens
(`grantableScopes`, `describeScopeRole` in `lib/admin/mcp.ts`)
([Admin](../features/admin.md#seasons), [Freigabeseite](../features/admin.md#the-consent-page-adminoauthconsentrequestid)).
