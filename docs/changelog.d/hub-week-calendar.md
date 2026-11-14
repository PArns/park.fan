### Der Hub-Kalender zeigt eine Woche, auf den Kacheln des Wartezeiten-Kalenders

„Die nächsten 30 Tage“ auf den Hubs (Orlando, Südkalifornien, Japan, Paris) war eine Matrix aus 16
Parks und 30 Tagen, in jedem Feld nur die Spitzenwartezeit. Selbst bei 2000 px scrollte sie seitlich,
und aus der Wand ähnlicher Zahlen ließ sich nicht ablesen, welcher Tag besser ist. Jetzt zeigt der
Kalender sieben Tage auf einmal, ab dem heutigen Tag der Region („Sa., 14. – Fr., 20. Nov.“), mit ‹ ›
und ab `sm` einem Chip je Woche. Die Pfeiltasten blättern auf allen Bedienelementen, Pos1 und Ende
springen an die Enden. Eine Woche nach der ersten steht im Fragment (`#calendar-2026-11-28`), damit
ein Neuladen oder ein geteilter Link sie zeigt; das Datum findet seine Woche auch einen Tag später
(`hubWeeks`, `hubWeekFromFragment`).

Jedes Feld ist jetzt die Kachel des Wartezeiten-Kalenders. Ihr Darstellungsteil liegt als
`CalendarDayTile` (`components/parks/calendar-day-tile.tsx`) für beide Seiten; `ParkCalendarDay`
liest weiter den API-Tag und gibt nur weiter, was er zeigt. Das Markup des Parkkalenders ist
unverändert (die 11 Kacheln auf `/de/ui` und der Anleitung byte-gleich). Der Hub nutzt
`density="compact"`, 60 px hoch: Spitzenwartezeit, Andrang in Farbe und Wort, Öffnungszeiten der
Tagesgäste mit fettem Schluss und Eselsohr bei frühem Schluss, „Zeiten folgen“ ohne veröffentlichte
Zeiten, die Saison-Symbole, „Geschlossen“. Darauf der Ring (bester Park im Resort) und neu der Stern:
der ruhigste Tag der Woche je Park (`quietestDay`, niedrigste `headlinerWait`, bei Gleichstand der
längere Tag; kein Stern bei echtem Gleichstand, an einem Vorjahrestag oder über einer höheren
gedruckten Zahl). Über den Kacheln steht je Tag „Bester Park“ (`dayPick`: die kürzeste Schlange unter
den Picks der ersten Antwort, mit Resort-Filter der Pick dieses Resorts), die Sturmzeit und „Ferien &
Feiertage“. Ein Park, dessen ganzes Fenster dasselbe sagt (Saisonpause, noch keine Zeiten), ist eine
Zeile statt sieben Kacheln. Am Telefon folgt die Tagesliste derselben Woche, je Gruppe der erste Park
auf seiner Kachel, zwei nebeneinander.

Alle Tage des Fensters stehen im ausgelieferten HTML: Der Hub reicht das ganze Fenster an den Client,
statt die erste Woche zu rendern und den Rest über das Relay zu holen. Jede Spalte und jeder Listentag
trägt die Klasse ihrer Woche (`HUB_WEEK_CELL`, `HUB_WEEK_ITEM`), ein `data-week` zeigt sieben, und
die Zeilen sind memoisiert, sodass Blättern ein Attribut ändert. Das HTML von `/de/orlando` wächst
dafür um 11 KB Brotli (76,6 → 87,6 KB, `next dev`), und die Relay-Anfrage des Kalenders entfällt
([der Orlando-Hub](../features/orlando-hub.md)).
