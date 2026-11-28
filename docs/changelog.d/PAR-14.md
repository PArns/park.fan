### Das Kapitel „Gemeldete Störungen“ erscheint auf der Ride-Seite

`AttractionDowntimeSection` las `attraction.downtime` aus dem Park-Payload, und der trägt das Feld
nicht: Die API liefert den Block nur im Attraktions-Detail. Auf keiner Ride-Seite erschien deshalb
etwas davon, weder die einzeilige Begründung noch die Zahlen, die die Gates inzwischen freigeben
(am 28. November zum Beispiel für Baron 1898, Seven Dwarfs Mine Train in Magic Kingdom und TRON
Lightcycle / Run). `getAttractionDowntime` (`lib/api/parks.ts`) holt den Block jetzt serverseitig
aus dem Detail mit `?days=1`, 3,5 statt 29,7 KB, einen Tag im Data Cache, parallel zu
`getRideRank`. Das Feld steht nicht mehr in `ParkAttraction`, damit niemand es dort wieder sucht.

#### Zahlen und Sätze gegen die API geprüft

- Der Satz unter dem Raster sagte „Rund 3.8 % der Zeit, in der die Bahn lief.“ Er nannte weder die
  Störungen noch den richtigen Nenner, und die Zahl stand in allen sechs Sprachen mit Punkt.
  `downShare` ist Störungszeit durch Störungs- plus Betriebszeit; der Satz sagt das jetzt („Gemeldete
  Störungen machten rund 3,8 % der Zeit aus, in der die Bahn lief oder als gestört gemeldet war.“),
  die Zahl formatiert `getNumberFormat` je Sprache.
- Die längste Störung nimmt die API nur über die Störungen mit beobachtetem Ende (49 bei Baron 1898),
  der Satz darunter nannte alle gemeldeten (53). Er nennt jetzt dieselbe Menge wie der Median.
- Die Dauer läuft über `formatSpanDuration`, weil sie in Betriebsminuten zählt und über einen Tag
  gehen kann; „25:00 Std.“ läse sich wie eine Uhrzeit.

#### Layout

- Das Raster saß im Standard-Padding des `ChapterPanel` und bekam dazu das eigene der Zellen, die
  Haarlinien endeten 24 px vor dem Rand. Jetzt `bodyPadding="none"`, wie bei den anderen Kapiteln mit
  `PanelGrid`.
- Zwischen `sm` und 1024 px Container stand die dritte Zahl allein in der zweiten Reihe neben einer
  leeren Zelle; sie geht dort über beide Spalten.
- Die einzeilige Begründung (die meisten Bahnen) stand als graue Schrift direkt auf dem Foto der
  Bahn und war nicht zu lesen. Sie sitzt jetzt auf demselben Glas wie die Kapitel (`TILE_GLASS`).

Geprüft in allen sechs Sprachen, 360 und 1440 px, hell und dunkel. Höhe und Lage des Kapitels sind
im HTML des Servers und nach dem Laden gleich (Baron 1898: 599 px am Telefon, 271 px am Desktop).
