### Die Filter der Ride-Liste ziehen in einen Dialog, die erste Bahn steht 281 px höher

Das Filter-Panel über der Ride-Liste der Parkseite war ab `sm` 331 px hoch (403 px bei 768 px
Breite) und stand zwischen den Kacheln und der ersten Bahn. Benutzt wurde es kaum: 88
`attraction_filter_used` auf 8.749 Aufrufe von Parkseiten vom 26. Oktober bis 24. November, dazu 42
getippte Suchen nach einer Bahn.

`AttractionFilterPanel` ist jetzt auf jeder Breite die 50-px-Leiste, die bisher nur das Handy hatte:
Suche, „Filter“ mit der Zahl der gesetzten Filter, ein Chip je gesetztem Filter, „Stand“ und am Ende
„Wartezeit-Alarme“. Der Alarm-Button zieht aus der Headliner-Überschrift in die Leiste, weil 14 der
16 Alarme im selben Zeitraum über die Glocke einer Karte gesetzt wurden; `LandSection` verliert
seinen `action`-Slot. Höhe, Pills und Reihenfolge stehen in einem Dialog mit `DialogHero`, der auch
das Bottom-Sheet des Handys ersetzt. Sein Fuß nennt die Zahl der Bahnen, die die Liste gerade zeigt
(„33 Attraktionen anzeigen“, `shownAttractionCount`), und „Alle zurücksetzen“ stellt über
`resetFilters` alles außer der Suche zurück.

Das Öffnen des Dialogs zählt das neue Event `attraction_filters_opened` mit dem Park als Entität.
Neben `attraction_filter_used` sagt es, wie viele nachsehen und wie viele davon etwas setzen. Die
Texte `filterSection.resetAll` und `filterSection.showResults` gibt es in allen sechs Sprachen,
`filterSection.searchLabel` fällt weg.
