### Audit: Admin-Login nur noch mit Turnstile, gedeckelte Batches und Zeiträume, Rundungs- und Datumsfehler

#### Sicherheit und Last

- `app/api/admin/[...path]` reicht `auth/login` nicht mehr ohne Sitzung durch. Der Proxy hängt `x-auth-key` an, und das Backend lässt bei diesem Schlüssel seine Turnstile-Prüfung aus, also kam ein Login über den Proxy ohne Challenge und ohne Drossel an. Angemeldet wird nur noch über `/api/admin/session`.
- `/api/mcp` nimmt höchstens 10 Einträge pro Batch und arbeitet sie nacheinander ab. Vorher lief jedes Element eines beliebig langen Arrays gleichzeitig, ungecacht und mit dem Drossel-Schlüssel.
- `/calendar?from=&to=` verlangt echte Daten in der richtigen Reihenfolge und höchstens 31 Tage (`isServableCalendarRange`, in `test:calendar`). Das Raster fragt einen Monat, der Tagesdialog einen Tag.
- `/api/contribute/file` zählt die Bilder einer Einreichung gegen `maxFiles` (`countImages`) und antwortet danach mit 429. `finalize` baut die Bild-URL aus dem Pfad (`contributionFileUrl`), statt die mitgeschickte zu speichern, und überschreibt einen vorhandenen Eintrag nicht mehr (409). Keine Fehlertexte des Blob-SDK mehr in den Antworten.
- `bearerUnauthorized` vergleicht das Secret zeitkonstant und ist der eine Wächter für Crons und `/api/revalidate`.
- `apiFetch` wiederholt nur noch während des Builds und bricht eine Server-Anfrage nach 15 s ab. Zur Laufzeit wurden aus einer 503 bis zu neun Anfragen pro Tab.
- Die Sitemap-Proben für Statistik- und Kinderseiten werfen bei einem API-Fehler, statt `false` zu melden. Ein Aussetzer beim Neubau hätte sonst rund 2.500 URLs für einen Tag entfernt; jetzt bleibt die letzte gute Sitemap stehen.

#### Zahlen und Daten

- Die Rope-Drop-Zeile der Karte druckt dieselbe gerundete Ersparnis wie das Badge daneben (23 → beide 25).
- Median und längster Ausfall laufen über `roundOutageMinutes`; ein Median von 2 Minuten stand als „0" da.
- `roundAverageWaitTo5` rundet selbst berechnete Durchschnitte ohne die Walk-on-Ausnahme: ein Park-Median von 12,8 wurde zu 13 und erschien als Disneys „13".
- Die Kachel „ruhigster Tag in N Tagen" zählt in Parktagen (`parkDayOf`, `daysBetween`), das 30-Tage-Fenster in `analyzeBestDays` ebenso (`addDays` aus `lib/utils/park-day.ts`, jetzt die einzige Kopie).
- Zwei `OPERATING`-Fenster an einem Tag werden auf den Wetterkacheln zu einer Spanne von der frühesten Öffnung bis zur letzten Schließung (`test:forecast-opening-hours`).
- „Öffnet in N Wochen" rundet statt aufzurunden; 7 Tage und eine Stunde sind eine Woche.
- `CROWD_LEVEL_PERCENT_RANGE`: `extreme` beginnt bei 201 %, wie `rideCrowdLevelForWait` rechnet.

#### Aufgeräumt

- `isBlogKey` in den Autor- und Kategorie-Dialogen, damit sie keinen Schlüssel mit Bindestrich am Ende mehr annehmen, den die Speicher-Route ablehnt. `SLUG_RE` und `COLLECTION_PATH_RE` kommen in den Medien-Routen aus `lib/media/sidecar.mjs`.
- Entfernt: `UserbackFeedback` und `@userback/widget`, `critters` samt `optimizeCss` (wirkt nur im Pages Router und legte alle CSS-Dateien in jede Funktion), vier ungenutzte `@tiptap`-Pakete und 26 Exporte ohne Importeur.
- Neu: `test:guards` für `adminGuardRefusal`, `bearerUnauthorized` und `isSlugPath`.
