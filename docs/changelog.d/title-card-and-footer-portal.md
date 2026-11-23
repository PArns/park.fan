### Titelkarte und Footer: Kalender-Link, Guide-Fenster auf dem Handy, Entwicklerportal

#### Der Kalender-Link liegt nicht mehr auf der News-Leiste

`ParkTitleHeader` (`components/parks/park-title-header.tsx`) setzte seine `children` hinter die
News-Leiste (`note`). Die Leiste reicht mit `-mb-6` bis an die Unterkante der Titelkarte, also
begann der Link zum Andrangskalender 12 px über ihrem unteren Rand und lag auf ihr. Das traf jeden
Park mit einer News der letzten 30 Tage, etwa Phantasialand. Ohne News lief der Link auf dem Handy
über das Fenster mit dem Besuchs-Guide, das auf dieselbe Weise bis an die Kante reicht. Die
`children` stehen jetzt in der Textspalte unter dem Planer-Button, und die Leiste ist das letzte
Element der Karte. Kalender, Statistik und „Mit Kindern“ haben kein Fenster und keine Leiste; dort
steht der Link wie bisher unter dem Button.

#### Das Guide-Fenster ist auf dem Handy so hoch wie sein Text

Unter `lg` war das Fenster (`ParkHeaderWindow` in `components/parks/park-header-posts.tsx`)
mindestens 192 px hoch, davon 64 px Bild über dem Text. Jetzt ist es so hoch wie Kicker, Titel und
Lesezeit, das Bild füllt die ganze Zeile, und der Schatten läuft von links hinter den Titel statt
von unten. Auf der Park- und der Ride-Seite von Phantasialand und Taron sind es 130 px. Ab `lg`
bleibt das Fenster, wie es war. Der Titel war mit `line-clamp-3` gemeint, aber `block` hob die
Begrenzung auf; ohne `block` greift sie jetzt.

#### Das Entwicklerportal steht im Footer unter „Werkzeuge“

`components/layout/footer.tsx` führte den Link als eigene Zeile in der Markenspalte, unter dem
Google-Button. Jetzt ist er der letzte Eintrag der Gruppe „Werkzeuge“, mit derselben Linkklasse wie
die anderen, und die Markenspalte endet mit den Buttons.

Geprüft mit `next dev` bei 1440 px und 390 px, hell und dunkel, auf Phantasialand und Taron: Der
Kalender-Link steht unter dem Planer-Button, das Fenster reicht bis an die Leiste, und die Leiste
schließt die Karte ab. Den Footer bei 1440 px.
