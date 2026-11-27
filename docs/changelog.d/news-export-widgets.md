### Der News-Export für die App trägt jetzt auch Wetter, Karte, Parkvergleich, Glossar und Galerie

`lib/blog/news-blocks.ts` ließ fünf Widget-Fences aus, die App zeigte an ihrer Stelle nichts: 876
`glossary-widget`, 235 `park-comparison-widget`, 187 `weather-widget`, 126 `map-widget` und 44
`gallery-widget` über die sechs Sprachen. Jetzt werden daraus Blöcke eigener Typen: `weather`,
`map` und `park-comparison` nennen nur die Parks (Geo-Pfad und Slug), die App holt die Zahlen
selbst aus der API; `glossary` trägt Begriff, andere Namen, die ganze Definition und die
Glossarseite, `gallery` die Fotos wie ein `image`-Block. Eigene Typen statt neuer `widget`-Arten,
weil die App 1.0.1 eine unbekannte `widget`-Art als Link auf den Beitrag zeigt, den sie schon
anzeigt, einen unbekannten Typ aber überspringt. Ein Link, der seine Sprache schon nennt
(`/de/parks/…`, so schreibt das Glossar), bekommt keine zweite mehr. Die Galerie-Logik der Fence
liegt jetzt einmal in `lib/blog/gallery.ts` (`galleryWidgetImages`), für die Seite und den Export.
