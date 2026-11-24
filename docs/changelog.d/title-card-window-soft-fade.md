### Das Fenster der Titelkarte läuft weicher ins Glas aus

Ab `lg` blendete das Foto im Fenster (`ParkHeaderWindow` in
`components/parks/park-header-posts.tsx`) über eine gerade Rampe auf 22 % seiner Breite ein, bei
1440 px also auf 105 px. Anfang und Ende einer geraden Rampe liest das Auge als Kante, im hellen
Theme vor dem hellen Glas besonders deutlich. Die neue Utility `photo-fade-left` in
`app/globals.css` folgt mit zehn Stopps einer Smoothstep-Kurve und reicht bis 36 %.

Den Platz dafür gibt die Lücke neben dem Text: Die Textspalte verliert ihr `lg:pr-8`, das Fenster
wird um diese 2 rem breiter (`minmax(20rem,calc(40% + 2rem))`), und sein Text rückt mit `lg:pl-24`
statt `lg:pl-16` um dieselben 2 rem ein. Titel und Lesezeit stehen damit an derselben Stelle und in
derselben Breite wie vorher, der Verlauf ist bei 1440 px 184 px lang statt 105 px, bei 1024 px
147 px statt 83 px.

Der Kontrast am Zeilenanfang des Titels im hellen Theme sinkt bei 1440 px von 6,7 : 1 auf 5,1 : 1
und bleibt über 4,5 : 1. Die Lesezeit in `text-primary` hatte dort schon vorher nur 2,3 : 1, jetzt
1,8 : 1.

Geprüft mit `next dev` auf der Park-Seite von Efteling und der Ride-Seite von Baron 1898, bei
1440 px und 1024 px, hell und dunkel. Unter `lg` ändert sich nichts.
