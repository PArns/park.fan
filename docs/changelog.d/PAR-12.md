### Planer: jede Fahrt kostet fünf Minuten, als benannte Annahme

`RIDE_DURATION_MIN` (`lib/planner/day-grid.ts`) ersetzt die private 3 Minuten aus `leg.ts` und gilt für jede Fahrt gleich. Sie steckt im Übergang zwischen zwei Stopps, damit Suche, Leg-Pille und `fits = start < closeMin` dieselben Minuten lesen, und einmal am Tagesende für den letzten Stopp. Auf dem Rechenbeispiel steigt die Untergrenze des Übergangs von 8 auf 10 und die Obergrenze von 9 auf 11 Minuten. Die Blockhöhe bleibt die Warteschlange, und es gibt keinen neuen Text: die Pille nennt den Übergang schon geschätzt.
