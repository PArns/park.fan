### Die Wochenansicht des Reiseplans sagt, was ihre Blöcke und Zahlen sind

In der Wochenansicht (`components/trip-regions/planner/plan-week-view.tsx`) stand über den meisten
Parkblöcken ein blauer gestrichelter Block ohne Text, und im Parkblock stand „50 Min.“ ohne zu sagen,
welche Zahl das ist. Die Bedeutung des blauen Blocks stand nur im `title`, den auf dem Telefon
niemand sieht.

- **Früher Einlass:** Der Streifen schreibt jetzt „Früher Einlass“ und „ab 08:30“
  (`tripPlanner.week.earlyAt`, neu in sechs Sprachen), auf einer Zeile nur so viel vom Wort, wie
  neben der Zeit Platz hat. Ist er zu niedrig für eine Zeile, steht die Zeile im Parkblock. Er ist
  jetzt ein Knopf wie der Parkblock: Antippen öffnet den Tag, dessen Blatt den Einlass des Hotels
  nennt. Der Tooltip bleibt. Extended Evening Hours tragen ihren Namen ebenso.
- **Die Minuten** sind die Spitzenwartezeit des Parks an dem Tag (`shownWaitOn`: der Mittelwert der
  Tagesspitzen seiner großen Bahnen, auf 5 Minuten gerundet, in den Tagen der Prognose so, wie sie
  der Kalender des Parks zeigt). Der Block schreibt sie mit den Worten der Tageskarte,
  „Spitze etwa 50 Min.“ (`tripPlanner.result.card.peak`).
- **Die Zeiten:** Darunter die Öffnungszeit des Parks bis zum Schluss für Tagesgäste, mit
  `formatGridHours` auf der Uhr des Parks („09–21“). An einem Tag mit zwei Parks teilt die Spalte
  den Tag in der Mitte; jeder Block nennt trotzdem die Zeiten seines Parks
  (`TripBlockSpan.openMin` und `closeMin` in `lib/trip-regions/plan-week.ts`).
- **Legende:** Unter dem Raster steht die Andrangsskala und ein Eintrag für jede Markierung ohne
  eigene Worte, nur für das, was die Seite zeigt: früher Einlass, Extended Evening Hours und die
  Stunden, die ein Hotelwechsel am Morgen kostet (`WeekKey`). Sie ist `ParkCalendarLegend`, deren
  `extraSignals` jetzt eine eigene Markierung tragen dürfen (`CalendarLegendKey`, `mark` an
  `DaySignalKey`); `showCrowd` lässt die Skala weg, wo kein Block eine Farbe hat.
