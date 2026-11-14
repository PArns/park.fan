### Der Reiseplan ist eine Folge von Tageskarten, und freie Tage schlagen Parks vor

Die Liste im Ergebnis heißt jetzt „Tage“, und jeder Parktag ist eine Karte (`PlanDayCard`, eine
Komponente für alle Regionen): das Parkfoto mit Datum, Andrangsstufe und „2. Tag“ bei Wiederholungen,
darunter die Spitzenwartezeit, der Weg ab Hotel und zwei Sätze, warum dieser Tag. Der erste ist der
wichtigste Grund der API, der zweite nennt den Zweitbesten in derselben Zahl wie die Karte
(`dayRunnerUp`, das Tages-Sheet liest dieselbe Funktion): „Am So., 13. Dez. wären es etwa 5 Min.
mehr.“ Zweitbester ist nur ein Tag, den der Plan hätte nehmen können: kein freier An- oder
Abreisetag und auf einer Reise durch mehrere Städte keiner in einer Stadt, die den Park nicht
erreicht (`usableAlternatives`). Chips zeigen Early Entry mit den Minuten, den Abend mit seiner
Uhrzeit und Warnungen wie „5. Parktag am Stück“. Für Festhalten, Tauschen und Parkys Hinweise hat die Karte zwei Plätze
(`actions`, `hint`). Bisher stand der Grund erst im Tages-Sheet.

Freie Tage (`days[].spare`, API 2.21.1) heißen „freier Tag“ und tragen eine Sonne; „Ruhetag“ mit
Bett bleibt für Tage, die die Ruhe-Regel des Besuchers setzt oder die er festhält. Mehrere am Stück
in einer Stadt sind eine Karte (`PlanSpareRun`) mit bis zu drei Parks: zuerst `spareDayParks` der
API, dann ein weiterer Tag eines geplanten Parks, den die Stadt erreicht. „Dazu“ nimmt den Park in
`parks` auf, hält ihn an dem Tag fest und plant neu (`addParkOnDate`, Ereignis
`trip_spare_filled`); Rückgängig nimmt Parks und Pins zurück. In der Woche bekommt ein freier Tag
kein Stundenraster mehr: allein eine Spalte von 56 px, mehrere am Stück ein Feld so breit wie
anderthalb Parktage (`weekColumns`). Bei der Japan-Reise vom 14. bis 30. Januar zeigte die Woche vom 21. bis 27. Januar vorher fünf leere Rasterspalten, jetzt eine schmale Spalte, Disneyland, das Feld
mit Fuji-Q Highland, Disneyland und eine schmale Spalte. Der Monat zeichnet die Sonne.

Kopf und Spitze sind neu gebaut: `PlanResultHead` mit „17 Tage · 6 Parktage · 8 Tage frei ·
2 Städte“ und der Routenleiste, `PlanPeakCard` statt der Zeile unter den Tagen, mit beiden Werten
als Balken in Primärblau. Japans Reisetag ist eine eigene Karte (`PlanMoveCard`), jede Stadt hat
einen Kopf mit Nächte-Stepper. Am Desktop stehen Spitze, Tickets und Behalten in einer Spalte von
340 px links. Details: [der Reiseplaner](../features/orlando-planner.md#from-simple-to-detailed).
