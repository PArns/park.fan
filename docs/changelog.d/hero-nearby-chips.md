### Startseite: Über kurzen Anstellzeiten stehen die fünf nächsten Parks als Chips mit ihrer Wartezeit

Zeigt die Kartenreihe im Hero Bahnen (kurze Anstellzeiten oder die Bahnen des Parks, in dem man
steht), stehen zwischen Suchfeld und Kartenreihe jetzt die fünf nächsten Parks als Chips
(`HeroNearbyChips`, `components/home/hero-nearby-chips.tsx`): ein Punkt in der Andrangsfarbe, der
Name und, solange der Park offen ist, die durchschnittliche Wartezeit („Ø 15 Min.“), sonst
„Geschlossen“ mit der nächsten Öffnung als Tooltip. Zeigt die Kartenreihe selbst Parks, blenden die
Chips aus, weil sie dieselben Parks noch einmal zeigen würden. Die Liste kommt aus
`useHeroBrowseParks`, in derselben Reihenfolge wie die Suchliste (offene Parks zuerst, dann nach
Entfernung), und kostet keinen eigenen Request. Die Abfrage der kurzen Anstellzeiten teilen sich
Kartenreihe und Chips über `nearbyShortWaits` (`lib/home/hero-browse.ts`).

Ob die Kartenreihe Bahnen zeigt, entscheidet erst die Nearby-Antwort nach dem Laden. Deshalb nimmt
die Zeile keinen Platz ein: Sie schwebt (`h-0`, absolut) in der Lücke unter dem Suchfeld über dem
leeren oberen Teil der 44 px hohen Überschriftenzeile der Kartenreihe und blendet ein und aus, ohne
etwas zu verschieben. Die Überschrift der Kartenreihe steht bei 1280 px in beiden Zuständen bei
557 px. Auf dem Handy sind die Chips 28 px hoch (8 px unter dem Feld, 10 px über der Überschrift),
ab `md` 32 px. Die Zeile hat die Breite der Kartenreihe, nicht die der 1024 px breiten Textspalte,
in die bei 1280 px nur vier Chips passten. Wo fünf nicht nebeneinander passen, scrollt sie seitwärts
und blendet am rechten Rand aus. Neue Texte gibt es keine: „Ø {minutes} Min.“
(`search.avgWaitShort`), der Status und die Andrangsstufe für Screenreader liegen schon in allen
sechs Sprachen vor.
