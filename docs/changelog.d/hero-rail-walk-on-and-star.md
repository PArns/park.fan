### Startseite: „Walk-on“ auf den Karten mit kurzer Anstellzeit, und jede Karte hat einen Stern

Eine Bahn mit 5 Minuten oder weniger, oder mit den 13 Minuten, die Disney und Efteling für „direkt
einsteigen“ ausschreiben, zeigt in der Kartenreihe des Hero jetzt „Walk-on“ statt der Zahl, in der
Walk-on-Farbe. Die Schrift richtet sich nach der Kartenbreite (`15cqi`, höchstens `text-3xl`):
Bei 1024 px stehen fünf Karten nebeneinander, und das französische „Sans attente“ brauchte in
`text-3xl` 189 px, wo die Karte 148 px hat. Unten bleibt „jetzt 0 Min · sonst 20 Min“, und diese Zeile liest ein Screenreader bei
einem Walk-on jetzt vor, weil die Zahl oben fehlt. Die Regel steht einmal in
`isWalkOnWait` (`lib/utils/wait-time.ts`): `waitTimeCrowdTier` und Parkys `isWalkOn`, der seine
eigene Grenze von 10 Minuten behält, rufen sie auf. Neu ist `nearby.shortWaits.walkOn` in allen
sechs Sprachen.

Jede Karte der Reihe, Bahn wie Park, hat vor dem Namen jetzt `FavoriteStar`: gefüllt, solange sie
ein Favorit ist, sonst leer, wie auf den Park- und Bahnkarten. Der Stern ersetzt den gelben Stern,
der bisher einen Headliner markierte, denn ein gefüllter Stern heißt jetzt Favorit.
