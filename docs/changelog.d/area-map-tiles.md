### Die Karte der Hotelgegenden zeigt Straßen und Parks, und jeder Schritt beginnt oben

Die Karte im Hotel-Schritt war eine Skizze auf leerem Grund: Kreise und Dreiecke, aber keine
Straße, kein Wasser, nichts, woran man Disney, Universal oder den International Drive erkennt.
Jetzt liegen die Marken auf den Kacheln von CARTO (`cartoTileUrl`, hell `rastertiles/voyager`,
dunkel `dark_all`), wie auf den Parkseiten. Orlando steht am Desktop in etwa 370 × 420 px neben den
Karten, bei Zoom 11,5 sind die I-4 und die Flächen der Parks zu sehen; Tokio nutzt die ganze Breite
mit Zoom 12. Die Karte steht still (kein Ziehen, kein Zoom, keine Animation), ein Klick auf einen
Kreis wählt die Gegend wie ihre Karte. Leaflet lädt erst mit dem Schritt (`area-map-tiles.tsx`,
`next/dynamic` ohne Server-Render), der Platz ist vorher reserviert (`mapBoxSize`).
`declutterMap` hält die Marken auseinander und setzt die Kürzel frei, `pnpm test:wizard-choices`
prüft das für Orlando und Tokio. Die gezeichnete Skizze (`layoutSchematicMap`) ist entfernt.

Ein neuer Schritt des Assistenten öffnete an der Stelle, an der der vorige gescrollt war, nach
Hotel, Route oder Tickets also halb unten. Jetzt springt der Inhalt des Dialogs bei Weiter, Zurück,
Überspringen, einem Sprung in der Schrittleiste und einem Antwort-Chip vor dem Zeichnen nach oben,
ohne Animation, und erst dann geht der Fokus auf Parkys Frage.

`tripPlanner.route.stayShort` war in 2.22.0 mit den toten Optionsschlüsseln gelöscht worden, obwohl
das Finale, der Kopf des Ergebnisses und die Städte darin ihn lesen; Japan und Paris zeigten den
Schlüssel statt „Osaka 4 Nächte“. Er ist in allen sechs Sprachen zurück.
