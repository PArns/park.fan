### Startseite: Foto über die volle Breite, die Frage darauf und darunter kurze Anstellzeiten als Karten

Der Hero stand als zwei Glasplatten über dem Parkfoto: links Schlagzeile, Suche mit vier Parks und zwei Beiträgen, rechts eine Weltkarte mit zwölf Länder-Chips. Jetzt steht das Foto frei über die volle Breite, unter dem Header, mit drei Verläufen in der Hintergrundfarbe der Seite (`HeroBackground`). Auf seinem unteren Rand stehen Badge, Schlagzeile (80 px ab 1280 px, 40 px am Handy), Intro und ein Suchfeld mit Rand und Lupe in der Markenfarbe; die Bildunterschrift steht oben rechts in der Ecke.

Über den unteren Fotorand ragt `HeroRail` um 176 px: fünf Karten ab 1024 px, drei ab 640 px, am Handy eine Reihe zum Wischen. Sie zeigen die Bahnen in der Nähe, deren Schlange gerade deutlich kürzer ist als sonst („Kurze Anstellzeiten in deiner Nähe“, `shortWaits` aus `/v1/discovery/nearby`): eigenes Foto der Bahn, „35 Min kürzer“, die Wartezeit als größte Zahl und ein Balken jetzt gegen sonst in der Farbe der Wartezeit. Ohne kurze Schlangen zeigen dieselben Karten die Parks in der Nähe mit Ø-Wartezeit und Andrang, im Park die Bahnen des Parks, ohne Standort die beliebtesten Parks, jetzt mit Foto (`/api/parks/popular` hängt es an). Alle Zustände haben denselben Kartenkasten, das Skelett wird ohne Verschiebung zur Antwort. Bei 1440 × 900 stehen Schlagzeile, Suche und die Zahlen der Karten auf dem ersten Bildschirm.

- **Suche**: Die Liste unter dem Feld ist im Ruhezustand zu und öffnet sich beim Fokus (`HeroInlineSearchPanel`), am Handy öffnet das Feld wie bisher die Palette. Die Liste der vier Parks und die beiden Beiträge („Neueste News“, „Neuester Guide“) unter dem Feld entfallen samt `HeroPhoneList`, `HeroReadingGroup`, `getHeroReading` und `pnpm check:hero-search-rest`.
- **Weltkarte**: `HeroWorldPanel` und seine Teile entfallen, mit ihnen `lib/geo/world-map-data.ts` (38 KB) und `scripts/generate-hero-world-map.mjs`.
- **Parks in deiner Nähe**: Die eigene Sektion weiter unten entfällt; die Nähe steht in den Hero-Karten, der Standort-Knopf (`HomeLocationRow`) darunter. Der Standort-Hinweis (`LocationBanner`) erscheint nur noch ab `md`. „Parks in der Nähe“ heißt auf Deutsch überall „Parks in deiner Nähe“.
- **Textspalte**: Sie reserviert ab `md` ihre Höhe (`md:min-h-[22.5rem]`, gemessen 357 px in allen sechs Sprachen ab 1024 px), damit halb geladenes HTML die Schlagzeile nicht verschiebt.

#### Die Suche öffnet sich mit `/` statt mit ⌘K oder Strg K

Strg K und ⌘K belegt der Browser für sein eigenes Suchfeld. `/` öffnet die Palette jetzt auf jeder Seite, wenn kein Feld den Fokus hat (`isSearchShortcut` in `lib/utils/page-focus.ts`), auch mit Shift, weil eine deutsche Tastatur den Schrägstrich so tippt. In einem Feld bleibt `/` ein Zeichen. Die Tipp-Kürzel der Hero-Suche, der Parkseite und des Wörterbuchs prüfen einheitlich `isPageTypedKey` und lassen `/` der Suche. Die Hinweise im Header zeigen `/`, der ⌘K-Hinweis im Suchdialog entfällt.

#### Admin: Die Punkte und Zahlen der Seitenleiste stehen in einer Spalte

Ein Eintrag mit Untermenü (ML-Zentrale, Traffic, Parky) hielt rechts 32 px für seinen Pfeil frei, jeder andere 10 px, also stand sein Punkt 22 px weiter links als die übrigen. `SidebarLink` gibt jetzt jedem Eintrag außerhalb der eingeklappten Leiste dieselben 32 px (`pr-8`), Untereinträge eingeschlossen; die Option `trailingSpace` entfällt.
