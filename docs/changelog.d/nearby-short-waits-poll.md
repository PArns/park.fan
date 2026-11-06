### „Kurze Anstellzeiten in deiner Nähe“ lädt auf offener Startseite neu, auch ohne GPS

`useNearbyParks` (`lib/hooks/use-nearby-parks.ts`) fragte nur mit Koordinaten alle 5 Minuten neu
an. Mit der GeoIP-Antwort blieb die Anfrage nach dem ersten Laden stehen, und die Karten in
`HeroRail` zeigten die Rides und Wartezeiten vom Seitenaufruf, so lange die Seite offen war. Jetzt
fragt der Hook in beiden Fällen alle `CACHE_MAX_AGE_MS` (5 Minuten) neu an, solange der Tab sichtbar
ist.
