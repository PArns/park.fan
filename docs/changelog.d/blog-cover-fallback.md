### Beiträge ohne Titelbild zeigen Logo und Verlauf statt einer leeren Stelle

- Neue Komponente `BlogCoverFallback` (`components/blog/blog-cover-fallback.tsx`): dunkler Grund
  mit vier Lichtern in den Logofarben, darauf der Pin aus `logo-dark.svg`. Sie steht überall, wo
  sonst das Titelbild steht: Artikelkopf, Blog-Karte, Handy-Zeile, `NewsList`, `/news`-Übersicht,
  News- und Blog-Panel im Header und der Toast für neue Beiträge. Vorher hatte jede dieser Stellen
  ihren eigenen Ersatz (blasse Fläche, grauer Verlauf, Zeitungs-Icon) oder gar keinen, und eine
  News ohne Bild war in der Liste eine Zeile ohne Vorschaubild zwischen Zeilen mit Bild.
- Der Farbton (blau, grün, türkis) hängt am Slug (`coverFallbackHue`), damit zwei solche Beiträge
  nebeneinander nicht dasselbe Bild zeigen.
- Alles Visuelle steht in `.blog-cover-fallback` in `app/globals.css`, der Pin als `::after`. Pro
  Beitrag bleibt ein `<span>` mit zwei Datenattributen: 119 B HTML und 137 B RSC, gegenüber 775 und
  841 B für `<img>` plus Inline-Verlauf. Das zählt, weil die Header-Panels auf jeder Seite verborgen
  mitgerendert werden.
- Ein festes 1200×630-Bild war der erste Versuch und passte nirgends: Im Artikelkopf lag der Pin
  hinter dem Anreißer, in der Karte blieb zwischen den Glasflächen nur seine Spitze, bei 88 px war
  er nicht mehr zu erkennen. Deshalb setzt der Einsatzort den Pin (`mark`: `side` rechts neben der
  Überschrift ab `lg`, sonst `center`). In der Karte liegt der Grund unter der ganzen Karte und der
  Pin im Fotostreifen, wie bei `CardPhotoFrame`; eine Karte ohne Bild öffnet ihren Fotostreifen
  jetzt wie jede andere (240 px).
- Doku: [blog cover fallback](../features/blog-cover-fallback.md).
