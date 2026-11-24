### Fenster der Titelkarte, Saisonpause-Kasten und Reiseplaner-Kachel laufen weicher ins Glas aus

Ab `lg` blendete das Foto im Fenster (`ParkHeaderWindow` in
`components/parks/park-header-posts.tsx`) über eine gerade Rampe auf 22 % seiner Breite ein, bei
1440 px also auf 105 px. Anfang und Ende einer geraden Rampe liest das Auge als Kante, im hellen
Theme vor dem hellen Glas besonders deutlich. Dasselbe galt für die Szene in `ParkBreakPanel` (35 %)
und in `TripPlannerTile` (38 % ab `sm`, 30 % in der Zeile auf dem Handy, 28 % am Fuß des Banners).

Die neuen Utilities `photo-fade-left-<n>%` und `photo-fade-foot-<n>%` in `app/globals.css` folgen
mit zehn Stopps einer Smoothstep-Kurve. Die Kurve steht einmal in `photo-fade-mask`, die beiden
Utilities setzen nur Länge und Richtung. Längen: Fenster 36 %, Saisonpause-Kasten und Kachel ab `sm`
45 % (bei `lg` je 187 px statt 146 und 158 px), Kachel-Zeile 30 %, Banner-Fuß 28 %.

Für das Fenster gibt die Lücke neben dem Text den Platz: Die Textspalte verliert ihr `lg:pr-8`, das
Fenster wird um diese 2 rem breiter (`minmax(20rem,calc(40% + 2rem))`), und sein Text rückt mit
`lg:pl-24` statt `lg:pl-16` um dieselben 2 rem ein. Titel und Lesezeit stehen damit an derselben
Stelle und in derselben Breite wie vorher, der Verlauf ist bei 1440 px 184 px lang statt 105 px, bei
1024 px 147 px statt 83 px.

Der Kontrast am Zeilenanfang des Fenstertitels im hellen Theme sinkt bei 1440 px von 6,7 : 1 auf
5,1 : 1 und bleibt über 4,5 : 1. Die Lesezeit in `text-primary` hatte dort schon vorher nur 2,3 : 1,
jetzt 1,8 : 1. Kasten und Kachel tragen keinen Text über der Szene.

Geprüft mit `next dev`, hell und dunkel: das Fenster auf der Park-Seite von Efteling und der
Ride-Seite von Baron 1898 bei 1440 px und 1024 px, der Saisonpause-Kasten auf `/de/ui` bei 1440 px,
700 px und 390 px, die Kachel auf Magic Kingdom und seinem Andrangskalender bei 1440 px, 700 px und
390 px.
