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

#### Die Startseiten-Suche bietet die Reise-Regionen an

Öffnet man die Suche im Hero der Startseite, steht unter vier Parks in der Nähe eine Zeile „Reise
planen" mit Orlando, Südkalifornien, Japan und Paris; jede Region führt in ihren Reiseplaner
(`SearchTripRow`, `components/search/search-trip-row.tsx`). Ist kein Park in der Nähe bekannt und die
Liste zeigt die beliebten Parks, steht die Zeile oben. Auf dem Desktop nimmt sie den Platz des
fünften Parks ein, die Liste bleibt gleich hoch; auf dem Handy steht sie in der Palette, die das
Hero-Feld öffnet, nicht in der des Headers. Das Suchfeld selbst ist unverändert. Ein Klick zählt als
`search_browse_clicked` mit `item: trip_region`
([Seitensuche](../features/site-search.md#a-trip-regions-planner-comes-first)).

#### Die Reise-Regionen stehen auf der Startseite direkt unter den News

Statt vier einzelner Stopps weit unten (nach Rundgang, Parky und Favoriten) zeigt die Startseite
die Regionen jetzt in einem Stopp direkt unter den News: „Reiseplaner · Reise planen" mit den vier
Kacheln des Planen-Bands samt Parky-Szenen (`TripRegionsHomeStop`,
`components/trip-regions/trip-region-home-stop.tsx`, `RegionTile` aus
`components/layout/planner-menu-panel.tsx`). Die Szenen lädt `RegionSceneInView` erst nach dem Laden
und kurz bevor der Stopp in den Bildschirm kommt; die Kacheln haben feste Höhen. Unter jeder Kachel
steht der Lead ihres Hubs (`tripRegions.<slug>.hub.lead`), damit die Startseite weiter sagt, worum es
in der Region geht. Die Klicks zählen als `trip_home`, die Stelle als `home_trips`. Die alten
Stopps und ihre Texte (`tripRegions.<slug>.homeStory` in sechs Sprachen) sind entfernt; statt vier
Anfragen an die Regionen-Route liest der Stopp die Daten des Planen-Bands, die das Layout schon hat
([Startseite](../features/homepage.md)).

#### Titeltest auf Deutsch: Startseite und Andrangskalender

Ein Test nur für `de`, die anderen fünf Sprachen bleiben, wie sie sind. Vergleichsbasis ist der
2026-11-15 in der Search Console: „freizeitpark wartezeiten" stand auf Position 3,4 mit 0,4 % CTR,
„wartezeiten" auf 5,7 mit 0,2 %, „andrangskalender europa park" auf 5,3 mit 0,45 % CTR bei 1.779
Impressionen; die Anfragen mit „Auslastung" und „Andrang" standen auf 8 bis 9. Gesucht wird nach
„Auslastung", „Andrang" und „heute", nicht nach „Crowd-Prognosen".

- **Startseite, Titel** (`seo.home.title`, mit „ | park.fan" 59 Zeichen): vorher „Freizeitpark-Wartezeiten
  live & Crowd-Prognosen", jetzt „Freizeitpark-Wartezeiten live & Auslastung heute".
- **Startseite, Beschreibung** (`seo.home.description`, 159 Zeichen): vorher „Live-Wartezeiten aus
  über 200 Freizeitparks, alle fünf Minuten neu. Dazu ein Crowd-Kalender für die kommenden Tage und
  eine Prognose, die ihren Fehler offenlegt.", jetzt „Wie voll ist es heute im Europa-Park oder
  Phantasialand? Live-Wartezeiten aus über 200 Freizeitparks, alle fünf Minuten neu, und der Andrang
  der nächsten Tage."
- **Andrangskalender** (`parks.calendarPage`, `fitWithin` nimmt den ersten Titel unter 60 Zeichen):
  `metaTitle` vorher „{park}: Andrang & Öffnungszeiten im {month}", jetzt „{park}:
  Andrangskalender & Auslastung {month}"; `metaTitleShort` vorher „{park}: Andrang im {month}",
  jetzt „{park}: Andrangskalender {month}"; `metaTitleBare` bleibt „{park}: {month}". Beispiele:
  „Europa-Park: Andrangskalender & Auslastung November 2026" (56 Zeichen), „Phantasialand:
  Andrangskalender & Auslastung September 2026" (59); ab 16 Zeichen Parkname greift die kurze
  Form, etwa „Movie Park Germany: Andrangskalender November 2026".
