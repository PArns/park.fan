### Parkseite: Der Link zum Andrangskalender liegt nicht mehr auf der News-Leiste

`ParkTitleHeader` (`components/parks/park-title-header.tsx`) setzte seine `children` hinter die
News-Leiste (`note`). Die Leiste reicht mit `-mb-6` bis an die Unterkante der Titelkarte, also
begann der Link zum Andrangskalender 12 px über ihrem unteren Rand und lag auf ihr. Das traf jeden
Park mit einer News der letzten 30 Tage, etwa Phantasialand. Ohne News lief der Link auf dem Handy
über das Fenster mit dem Besuchs-Guide, das auf dieselbe Weise bis an die Kante reicht. Die
`children` stehen jetzt in der Textspalte unter dem Planer-Button, und die Leiste ist das letzte
Element der Karte. Kalender, Statistik und „Mit Kindern“ haben kein Fenster und keine Leiste; dort
steht der Link wie bisher unter dem Button.

Geprüft mit `next dev` auf Phantasialand bei 1440 px und 390 px: Der Link steht unter „Tag im
Phantasialand planen“, das Fenster reicht bis an die Leiste, und die Leiste schließt die Karte ab.
