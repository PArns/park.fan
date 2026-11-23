### Titelkarte und Footer: Kalender-Link, Guide-Fenster auf dem Handy, Icons im Footer

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

#### Der Footer: Icons vor jedem Link, Flaggen über den Ländern, das Entwicklerportal unter „Inhalte“

Die Linkgruppen „Inhalte“, „Werkzeuge“ und „Rechtliches“ in `components/layout/footer.tsx` waren
reine Textlisten, nur der Feed trug ein Icon. Jetzt steht vor jedem Link ein Icon in `text-primary`
vor dem gedämpften Label, wie in der Linkzeile des „Mehr“-Menüs (`MoreMenuLinks`). Jedes Ziel trägt
das Icon, das es in Header, Menüs und Sheet schon hat: Blog `Newspaper`, News `Megaphone`,
Wörterbuch `BookOpen`, Beste Reisezeit `CalendarRange`, Wartezeiten verstehen `Compass`, Fancast
`LineChart`, Tagesplaner `CalendarClock`, Reiseplaner `CalendarDays`, Favoriten `Star`, Alarme
`Bell`. Neu gewählt sind Parky `MessageCircle` (wie die Aktion auf `/parky`), Changelog `History`,
Entwicklerportal `CodeXml`, Impressum `Scale` und Datenschutz `Shield`. Die Parks und die
Datenquellen bleiben ohne Icon: Bei den Parks hätte jeder Eintrag dasselbe, und die Datenquellen
tragen schon das Zeichen für externe Links.

Unter `sm` ist jeder Footer-Link so hoch wie am Desktop, 28 px statt 44 px: Eine aufgeklappte
Gruppe mit neun Links las sich bei 44 px wie eine Liste von Lücken. Die Zeilen stehen ohne Abstand
untereinander, die Tippflächen grenzen also aneinander, ohne sich zu überlappen.
[Touch targets](../design/touch-targets.md#the-target-grows-the-box-does-not) nennt den Footer
jetzt neben den Kreisen der Ride-Karten als zweite Stelle unter 44 px.

Die vier Länderspalten der beliebten Parks tragen vor ihrer Überschrift die Flagge des Landes
(`CountryFlag`, wie im Parks-Menü). `MenuSectionHeading` hat dafür einen optionalen Platz `lead` vor
dem Label, innerhalb desselben Links.

Der Link zum Entwicklerportal stand als eigene Zeile in der Markenspalte unter dem Google-Button.
Jetzt steht er in „Inhalte“ hinter dem Changelog, und die Markenspalte endet mit den Buttons.

Geprüft mit `next dev` bei 1440 px und 390 px, hell und dunkel, auf Phantasialand und Taron: Der
Kalender-Link steht unter dem Planer-Button, das Fenster reicht bis an die Leiste, und die Leiste
schließt die Karte ab. Der Footer bei 1440 px hell und dunkel und bei 390 px mit aufgeklappten
Gruppen.
