### Planen steht im Menü an dritter Stelle, „Mehr" immer zuletzt

Die Leiste lautet jetzt Guides, News, Planen, Parks entdecken, Favoriten und „Mehr", davor wie
bisher der Chip des nahen Parks. Bisher stand Planen zwischen „Mehr" und den Favoriten am Ende. Eine
Liste gibt beiden Menüs die Reihenfolge (`MENU_ORDER` in `components/layout/header.tsx`): Leiste und
Telefonmenü füllen je einen Eintrag pro Schlüssel, und der Typ der Liste lässt keine zu, die nicht
auf „Mehr" endet. Im Telefonmenü folgen auf Guides und News jetzt Planen, Parks entdecken,
Startseite und zuletzt die drei Hubs aus „Mehr"; die Favoriten bleiben dort über der Liste.

„Mehr" zeigt die vier Reise-Regionen nicht mehr als breite Fotostreifen. Das Planen-Band verlinkt
dieselben Hub-URLs (`tripRegionPath`), also geht kein interner Link verloren. Weg sind
`MoreMenuRegion` und die Regionen in `getMoreMenu` (`lib/navigation/more-menu.ts`), die
Kalenderzeilen am Ende des Telefonmenüs (dieselben URLs wie die Regionen unter „Planen") und
`calendarLabel` in `PlannerMenuRegion`. „Mehr" hat damit wieder seine drei Spalten und ist bei 1440 px
591 px hoch. Gemessen auf `/fr/parks/europe/germany`: Die Zeile bleibt in jeder Breite einzeilig, mit
82 px Luft bei 1024 und 96 px bei 1280 und 1440, wie vorher
([Header-Navigation](../features/header-navigation.md#the-bar)).
