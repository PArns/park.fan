### Eine laufende Störung steht in einem eigenen Block, auf der Karte wie auf der Ride-Seite

Bisher standen „Störung gemeldet seit …" und die Schätzung, wie lange so etwas meist dauert, als zwei bis vier graue Zeilen in 11 px unter den Badges. Auf der Karte brachen sie an den 92 px um, die rechts für Glocke und Stern frei bleiben, und lasen sich wie Kleingedrucktes.

`OutageNote` zeichnet jetzt einen getönten Block mit rundem Icon in der Farbe des Status-Badges: orange mit Warndreieck für eine gemeldete Störung (`down`), rot mit Pause-Symbol für eine Bahn, die nur still steht (`closed_gap`). Die erste Zeile ist fett, die Dauer bei offenem Park steht darunter, und `OutageEstimateNote` sitzt unter einer Haarlinie im selben Block. Die Texte sind unverändert. Auf der Karte reicht der Block unter den Kreisen bis 16 px vor den rechten Rand. In der Telefonzeile bleibt er innerhalb des Rands. Die Ride-Seite nutzt dieselbe Komponente mit `variant="full"`.

Die Schiene unter den beiden Balken ist jetzt weiß (`bg-white/70`, dunkel `bg-white/10`) statt `bg-muted/40`. Im getönten Block war die alte Schiene nicht zu sehen, gemessen 1,00 : 1 (dunkel) und 1,03 : 1 (hell) gegen den Block. Jetzt steht sie bei 1,08 bis 1,35 : 1 ab, und die blaue Füllung erreicht gegen sie 3,31 bis 3,93 : 1, auf der Karte wie auf der Ride-Seite. `formatStart` holt seinen Formatter jetzt aus `getDateTimeFormat`.
