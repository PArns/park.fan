### Startseite: Park-Chips über kurzen Anstellzeiten, Öffnungszeit und Winterpause auf den Parkkarten

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
und blendet am rechten Rand aus. Neue Texte brauchen die Chips nicht: „Ø {minutes} Min.“
(`search.avgWaitShort`), der Status und die Andrangsstufe für Screenreader liegen schon in allen
sechs Sprachen vor. Die Chips haben einen feinen Rand (`border-foreground/25`), damit ihre Kante nicht im Foto
verschwindet.

Zeigt die Kartenreihe Parks, weil alles zu ist, sagt die Karte jetzt genauer, wann der Park öffnet.
Öffnet er heute noch, steht das grün und mit Uhrzeit da: „Öffnet in 5:27 Stunden (08:00 Uhr)“
(`nearby.opensTodayAt`, neu in allen sechs Sprachen, die Klammer bricht nicht um). Ist die nächste
Öffnung eine Woche oder mehr entfernt, zeigt die Karte die Pause wie das Panel der Parkseite
(`ParkBreakPanel`): „Winterpause“ oder „Saisonpause“ mit Icon, „Öffnet wieder am 25. März“, die
Wochen als gelbe Pille und den gelben Rand. Die Regel ist dieselbe: `parkBreakOf` ruft jetzt
`parkBreakUntil` (`lib/utils/park-break.ts`), das die Karte über `useHeroStatusLabels` direkt
fragt, weil die Nearby-Antwort nur den Typ von heute und die nächste Öffnung kennt. Breitengrade
schickt sie keine; ihre Parks liegen um den Besucher herum, also entscheidet seine Position über die
Winterpause, ohne Position ist jede Pause „Saisonpause“. Icon, Label, Pille und Rand stehen für Panel
und Karte in `components/parks/park-break-style.ts`, der Wochen-Countdown in
`formatBreakCountdown`. `parkBreak` geht dafür auf der Startseite an den Browser. Alle übrigen
„Öffnet …“-Texte dürfen zwei Zeilen nehmen; „Öffnet Samstag, 10:00 U…“ war bei 1280 px
abgeschnitten. Am 24. November um 10:30 UTC zeigte Los Angeles vier Parks grün mit Uhrzeit, Hamburg
Hansa-Park in der Winterpause bis zum 25. März (in 18 Wochen). `pnpm test:park-break` hat zwei Fälle
mehr (21).

Das Badge „40 Min kürzer“ auf den Bahnkarten hat einen Blur (`backdrop-blur-md`): Seine Füllung ist
zu 60 % deckend, und das Foto dahinter ist unruhig.
