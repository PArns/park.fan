### Saisons stehen auch an den Monaten jenseits des Kalenders

Der Monatskalender reicht nur so weit wie der veröffentlichte Spielplan: Bei Movie Park Germany endet
`scheduleCoverage.to` am 5. Januar 2027, und das Halloween Horror Festival im Oktober 2027 stand
nirgends auf der Seite. Jetzt tragen die Monats-Chips des Kalenders und die zwölf Zeilen der
Jahresvorschau die Symbole der Saisons, die im Monat laufen, höchstens drei und leise
(`SeasonMonthMarks`), nach derselben Regel wie die Kacheln (`seasonDaysOfMonth`, `seasonsInMonth`):
eine Saison mit `dates` nur an diesen Tagen, eine abgesagte nie, geschlossene Tage nur dort, wo der
Status bekannt ist, und eine nur `expected` gedämpft. Die Symbole sind ein Bild, das die Saisons des
Monats beim Namen nennt. Die Seite holt die Saisons einmal für alle Monate des Index
(`parkCalendarMonthsShown`) statt nur für den gezeigten Monat; die Jahresvorschau liest die Liste der
Saison-Karte, also keine Anfrage pro Chip
([Wartezeiten-Kalender](../features/crowd-calendar.md)).
