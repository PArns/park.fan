### Umbaupausen im Wartezeiten-Kalender, im Tagesplaner und auf den Ride-Karten

Die gepflegten Umbaufenster einer Bahn (`worksPeriods`, bei Efteling wöchentlich aus dem
Wartungskalender des Parks) standen bisher nur als Badge „Umbaupause“ an einer Bahn, die heute in
einem Fenster liegt. Jetzt erscheinen sie an drei weiteren Stellen, auch wenn mehrere Bahnen
gleichzeitig zu sind (bei Efteling vom 4. Januar 2027 an vier).

**Wartezeiten-Kalender:** Ein Tag, an dem ein Fenster Bahnen schließt, trägt neben dem Status einen
Chip mit `Construction`-Icon und Anzahl („🚧 4“), auf dem Grund der Seite, damit er auf einer
orangen „Hoch“-Kachel so gut lesbar ist wie auf einer grünen. Der Hover nennt die Bahnen nach Namen
und bis wann („Piraña · bis 25. März“, das Jahr nur, wo es wechselt). Der Chip steht in der
Statuszeile, damit keine Zelle höher wird, als `calendarGridReservation` vorhält. Der Tagesdialog
listet dieselben Bahnen unter „Wegen Umbau geschlossen“; ein Headliner darunter steht in der
Prognose mit „Umbaupause“ statt der Wartezeit, die die Kalender-API für ihn noch schickt. An einem
geschlossenen Tag gibt es keinen Chip; die Legende führt das Icon nur bei einem Park mit Fenster.
`leanParkForCalendarShell` behält `worksPeriods` nur an den Bahnen, an denen die API das Feld
schickt (bei Efteling 9 von 37).

**Tagesplaner:** `/plan/day` lässt eine Bahn in einem Fenster weg und sagt nicht, warum. Die
Proxy-Route liest jetzt parallel den Park-Payload (denselben Data-Cache-Eintrag wie die Parkseite)
und hängt `ridesInWorks` an: die Bahnen, die ein Fenster am geplanten Tag schließt und die der Plan
nicht führt. Das Kontextband zeigt einen Chip „4 Bahnen in Umbaupause“ (auf dem Handy „🚧 4“),
Hover oder Tippen listet Bahnen und Enddatum. Ein geplanter Block für eine solche Bahn bekam bisher
die angenommenen 5 Minuten, in die der Optimierer einen Halt legen konnte; jetzt ist er
`missing: 'works'`, ohne Zahl, und seine zweite Zeile sagt „11:00 · Umbaupause bis 25. März“ statt
„11:00–11:00“. Scheitert der Park-Abruf, fehlt nur die Liste, nie der Plan.

**Ride-Karten und Fahrgeschäftsseite:** `WorksPeriodBadge` liest die ganze Liste. Läuft ein Fenster,
steht „Umbaupause bis 4. Dez.“ (mit geschätztem Ende „bis ca.“), liegt eines vor der Bahn,
„Umbaupause ab 4. Jan.“ oder „am 8. Dez.“ in blasserem Orange. Hover oder Tippen listet das laufende
und alle folgenden Fenster als Zeitraum („16.–27. November 2026“, über `formatRange`). Läuft ein
Fenster und meldet der Feed `REFURBISHMENT`, entfällt das Status-Badge „In Wartung“ auf der Karte,
weil das Umbau-Badge dasselbe mit Enddatum sagt. Auf der Karte führt das Tippen auf das Badge nicht
auf die Fahrgeschäftsseite.

Die Tipp-Logik des Auslastungs-Tooltips steckt jetzt in `TapTooltip`
(`components/common/tap-tooltip.tsx`), das `CrowdScaleTooltip` und die neuen Tooltips teilen. Die
Hilfen `worksPeriodsOf`, `worksPeriodOn`, `nextWorksPeriod`, `ridesInWorksOn`, `worksWindowLabel`,
`worksEndLabel`, `worksRunningLabel` und `worksUpcomingLabel` liegen in
`lib/utils/works-period.ts`, `formatParkDay` und `formatParkDayRange` in `lib/utils/park-day.ts`
(Italienisch polstert CLDR den Tag im Zeitraum, „04 gennaio“; die Null fällt weg). Neue Schlüssel
unter `parks.worksPeriod` in allen sechs Sprachen, Italienisch mit Elision über ein ICU-`select`
(„dall’8“, „all’11“); der Planer-Chunk lädt den Unterbereich mit. Tests: 10 neue Fälle in
`pnpm test:works-period`, 6 in `pnpm test:planner-estimate`, 2 in
`pnpm test:calendar-park-projection`.
