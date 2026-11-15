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

#### Messpunkte für die nächste Runde

Ein Klick im Header ließ sich bisher nicht einem Menü zuordnen: Alles im Band zählte als `header`,
alles im Telefonmenü als `menu_sheet`. Jetzt trägt jedes Band seinen eigenen Block (`menu_guides`,
`menu_news`, `menu_planner`, `menu_parks`, `menu_favorites`, `menu_more`, aus `menuBlock` in
`lib/analytics/internal-link.ts`), und derselbe Eintrag im Telefonmenü trägt denselben. `header`
bleibt für die Links der Leiste selbst, `menu_sheet` für den Rest des Telefonmenüs. Die
Regionen-Stopps der Startseite zählen ihre Klicks als `trip_home`. Die Startseite setzt
`section_seen`-Marken an den Anfang jedes Stopps (`home_news` bis `home_end`), sodass sich wie bei
den Parkseiten ablesen lässt, wie weit sie gelesen wird. Die API nimmt die neuen Werte ohne Änderung
an ([Analytics](../development/analytics.md)).
