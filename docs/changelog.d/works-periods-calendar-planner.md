### Wartungsfenster im Wartezeiten-Kalender, im Tagesplaner und auf den Ride-Karten, und sie heißen „Wartung“

Die gepflegten Fenster, in denen eine Bahn planmäßig zu ist (`worksPeriods`, bei Efteling
wöchentlich aus dem Wartungskalender des Parks), standen bisher nur als Badge „Umbaupause“ an einer
Bahn, die heute in einem Fenster liegt. Jetzt erscheinen sie an drei weiteren Stellen, auch wenn
mehrere Bahnen gleichzeitig zu sind (bei Efteling vom 4. Januar 2027 an vier).

**Der Begriff ist jetzt Wartung.** Ein Fenster kann ein Tag Wartung sein (Baron 1898 am 8. Dezember)
oder ein Winter Umbau; „Umbaupause“ behauptete für jeden Tag einen Umbau. `parks.worksPeriod` sagt
in allen sechs Sprachen Wartung (Maintenance, Onderhoud, Maintenance, Mantenimiento,
Manutenzione), dasselbe Wort wie der Live-Status `REFURBISHMENT`. Der hieß auf Englisch noch
„Refurbishment“ und auf Französisch „Rénovation“ und heißt dort jetzt wie in den anderen vier
Sprachen „Maintenance“ (`parks.status`, `attractions.status`, Kurzform `attractions.queue.status`
„Maint.“). Die Fenster tragen den Schraubenschlüssel des Live-Status in Orange (`WorksIcon`) statt
des Baustellen-Schilds. Der Planer-Satz für einen Tag ohne fahrende Bahn sagt „in Wartung“ statt
„im Umbau“.

**Wartezeiten-Kalender:** Ein Tag, an dem ein Fenster Bahnen schließt, trägt neben dem Status einen
Chip mit Schraubenschlüssel und Anzahl, auf dem Grund der Seite, damit er auf einer orangen
„Hoch“-Kachel so gut lesbar ist wie auf einer grünen. Der Hover nennt die Bahnen nach Namen und bis
wann („Piraña · bis 25. März“, das Jahr nur, wo es wechselt). Der Chip steht in der Statuszeile,
damit keine Zelle höher wird, als `calendarGridReservation` vorhält. Der Tagesdialog listet dieselben
Bahnen unter „Wegen Wartung geschlossen“; ein Headliner darunter steht in der Prognose mit „Wartung“
statt der Wartezeit, die die Kalender-API für ihn noch schickt. An einem geschlossenen Tag gibt es
keinen Chip; die Legende führt das Icon nur bei einem Park mit Fenster. `leanParkForCalendarShell`
behält `worksPeriods` nur an den Bahnen, an denen die API das Feld schickt (bei Efteling 9 von 37).

**Tagesplaner:** `/plan/day` lässt eine Bahn in einem Fenster weg und sagt nicht, warum. Die
Proxy-Route liest jetzt parallel den Park-Payload (denselben Data-Cache-Eintrag wie die Parkseite)
und hängt `ridesInWorks` an: die Bahnen, die ein Fenster am geplanten Tag schließt und die der Plan
nicht führt. Das Kontextband zeigt einen Chip „4 Bahnen in Wartung“ (auf dem Handy nur Icon und
Zahl), Hover oder Tippen listet Bahnen und Enddatum. Ein geplanter Block für eine solche Bahn bekam
bisher die angenommenen 5 Minuten, in die der Optimierer einen Halt legen konnte; jetzt ist er
`missing: 'works'`, ohne Zahl, und seine zweite Zeile sagt „11:00 · In Wartung bis 25. März“ statt
„11:00–11:00“. Scheitert der Park-Abruf, fehlt nur die Liste, nie der Plan.

**Ride-Karten und Fahrgeschäftsseite:** `WorksPeriodBadge` liest die ganze Liste. Läuft ein Fenster,
steht „In Wartung bis 4. Dez.“ (mit geschätztem Ende „bis ca.“), liegt eines vor der Bahn,
„Wartung ab 4. Jan.“ oder „Wartung am 8. Dez.“ in blasserem Orange. Hover oder Tippen listet das
laufende und alle folgenden Fenster als Zeitraum („16.–27. November 2026“, über `formatRange`).
Läuft ein Fenster und meldet der Feed `REFURBISHMENT`, entfällt das Status-Badge „In Wartung“ auf
der Karte, weil das Wartungs-Badge dasselbe mit Enddatum sagt. Auf der Karte führt das Tippen auf
das Badge nicht auf die Fahrgeschäftsseite.

Die Tipp-Logik des Auslastungs-Tooltips steckt jetzt in `TapTooltip`
(`components/common/tap-tooltip.tsx`), das `CrowdScaleTooltip` und die neuen Tooltips teilen. Die
Hilfen `worksPeriodsOf`, `worksPeriodOn`, `nextWorksPeriod`, `ridesInWorksOn`, `worksWindowLabel`,
`worksEndLabel`, `worksRunningLabel` und `worksUpcomingLabel` liegen in
`lib/utils/works-period.ts`, `formatParkDay` und `formatParkDayRange` in `lib/utils/park-day.ts`
(Italienisch polstert CLDR den Tag im Zeitraum, „04 gennaio“; die Null fällt weg). Italienisch
elidiert über ein ICU-`select` („dall’8“, „all’11“); der Planer-Chunk lädt `parks.worksPeriod`
mit. Der Admin heißt das Feld weiter „Umbaupause“, weil die API die Gruppe so benennt. Tests: 10
neue Fälle in `pnpm test:works-period`, 6 in `pnpm test:planner-estimate`, 2 in
`pnpm test:calendar-park-projection`.
