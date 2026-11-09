### Umbaupausen im Wartezeiten-Kalender, im Tagesplaner und auf den Ride-Karten

Die gepflegten Umbaufenster einer Bahn (`worksPeriods`, bei Efteling wöchentlich aus dem
Wartungskalender des Parks) standen bisher nur als Badge „Umbaupause“ an einer Bahn, die heute in
einem Fenster liegt. Jetzt erscheinen sie an drei weiteren Stellen.

**Wartezeiten-Kalender:** Ein Tag, an dem ein Fenster eine Bahn schließt, trägt neben dem Status ein
orangefarbenes `Construction`-Icon; der Hover nennt die Bahnen mit ihren Daten, der Tagesdialog
listet sie unter „Wegen Umbau geschlossen“. An einem geschlossenen Tag gibt es kein Icon. Die
Legende führt das Icon nur bei einem Park mit Fenster. `leanParkForCalendarShell` behält dafür
`worksPeriods`, aber nur an den Bahnen, an denen die API das Feld schickt (bei Efteling 9 von 37).

**Tagesplaner:** `/plan/day` lässt eine Bahn in einem Fenster weg und sagt nicht, warum. Die
Proxy-Route liest jetzt parallel den Park-Payload (denselben Data-Cache-Eintrag wie die Parkseite)
und hängt `ridesInWorks` an: die Bahnen, die ein Fenster am geplanten Tag schließt und die der Plan
nicht führt. Das Kontextband zeigt dafür einen Chip mit der Zahl, Hover oder Tippen listet Bahnen
und Daten. Ein geplanter Block für eine solche Bahn bekam bisher die angenommenen 5 Minuten, in die
der Optimierer einen Halt legen konnte; jetzt ist er `missing: 'works'`, ohne Zahl, mit
„Umbaupause“ und einem Icon, dessen Hover das Fenster nennt. Scheitert der Park-Abruf, fehlt nur die
Liste, nie der Plan.

**Ride-Karten und Fahrgeschäftsseite:** `WorksPeriodBadge` liest die ganze Liste. Liegt heute kein
Fenster an, aber eines vor der Bahn, steht „Umbaupause ab 16. Jan.“ in blasserem Orange. Hover oder
Tippen auf das Badge listet das laufende und alle folgenden Fenster mit Daten; auf der Karte führt
das Tippen nicht auf die Fahrgeschäftsseite.

Die Tipp-Logik des Auslastungs-Tooltips steckt jetzt in `TapTooltip`
(`components/common/tap-tooltip.tsx`), das `CrowdScaleTooltip` und die neuen Tooltips teilen. Die
Hilfen `worksPeriodsOf`, `worksPeriodOn`, `nextWorksPeriod`, `ridesInWorksOn` und
`worksWindowLabel` liegen in `lib/utils/works-period.ts`, das Datumsformat als `formatParkDay` in
`lib/utils/park-day.ts`. Neue Schlüssel unter `parks.worksPeriod` in allen sechs Sprachen; der
Planer-Chunk lädt den Unterbereich mit. Tests: 6 neue Fälle in `pnpm test:works-period`, 6 in
`pnpm test:planner-estimate`, 2 in `pnpm test:calendar-park-projection`.
