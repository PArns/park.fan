### Parky bleibt im Chatfenster ruhig, blinzelt seltener, bricht keine Fahrt mehr ab, und das Eingabefeld wächst mit

Im offenen Chatfenster spielte Parky sein ganzes Repertoire neben dem Gespräch: Achterbahn, Tanz,
Pirouette, alle 12 bis 20 Sekunden. Dort ist er jetzt `calm` (`ParkyLogo`): wach schaut er sich um,
zwinkert oder legt den Kopf schief, alle 20 bis 35 Sekunden; gelangweilt gähnt er, schaut oder macht
ein Nickerchen, alle 9 bis 15 Sekunden; einschlafen tut er wie bisher. Das volle Repertoire bleibt
dem Button in der Ecke. Gemessen über 85 Sekunden: Gähnen, Umschauen, Nickerchen, Umschauen,
Einschlafen.

Er blinzelte alle 4,5 Sekunden im gleichen Takt, also rund 20-mal in 90 Sekunden. `parky-blink`
schließt die Augen jetzt zweimal in 24 Sekunden, etwa 9 und 14 Sekunden auseinander: gemessen 6-mal
in 90 Sekunden.

Das Eingabefeld blieb bei jeder Länge eine Zeile hoch, eine zweite Zeile schob die erste aus dem
Blick. Es wächst jetzt mit dem Text bis zu seiner Maximalhöhe von 112 px und scrollt erst darüber,
geprüft in Chromium (1280×800) und WebKit (iPhone-Format) mit einer, drei und acht Zeilen.

Wurde Parky mitten in einem Akt gelangweilt, schläfrig oder wieder wach, brach `useIdleAct` den Akt
sofort ab: eine Fahrt hielt mitten in der Luft an, und 1,5 Sekunden später gähnte er. Nachgestellt
mit festem Zufall: der Schwindel nach dem Freefall endete nach 1,25 statt 2,7 Sekunden. Ein laufender
Akt spielt jetzt zu Ende, samt Schwindel, und erst dann beginnt die neue Phase. Ein Cue spielt weiter
sofort, und ohne eigenes Leben (Stimmung, Suche, geschlossenes Fenster) hört Parky weiter sofort auf.
