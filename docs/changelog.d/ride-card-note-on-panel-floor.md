### „Öffnet um" steht auf allen Bahnkarten einer Reihe auf derselben Höhe

Die Notiz unter den Badges (`OutageNote`, `RideOpensAtNote`) folgte bisher direkt auf die letzte Badge-Zeile. Hatte eine Karte eine Badge-Zeile weniger als ihre Nachbarn, stand ihre Box höher, und die Reihe zeigte die Boxen versetzt. Das obere Panel der `AttractionCard` ist jetzt eine Flex-Spalte, die Notiz sitzt mit `mt-auto` an seinem Boden, und die 9 px Abstand zu den Badges sind Padding statt Margin. Bei Phantasialand vor der Öffnung lagen die Boxen in zwei von drei Reihen bis zu 30 px auseinander, jetzt in keiner. Die Phone-Zeile bleibt, wie sie war.

`RideStatusBlock` füllt seine Box mit 20 statt 10 % der Tonfarbe, in beiden Tönen (`idle`, `outage`), auf der Karte wie auf der Bahnseite. Auf dem Glas-Panel über einem Foto war die Box vorher kaum vom Panel zu unterscheiden.
