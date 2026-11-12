### Beste Reisezeit für Orlando, Disney World und Universal Orlando

Drei neue Hub-Seiten unter `/orlando/<best-time-Segment>` (alle sieben Headliner-Parks) und
`…/disney-world`, `…/universal-orlando`, serverseitig gerendert aus `/v1/trip-regions/orlando/when`
und `/school-breaks`. Oben die drei ruhigsten 10-Tage-Reisen des Titeljahres mit „Diese Tage
planen“ in den Orlando-Planer, darunter eine Wochenleiste mit echter `<table>`, zwölf Monatszeilen
(Wartezeit, Events mit Status, Schulferien in Orlando und Europa, Klimanormal, Öffnungszeiten,
Partyabende, Hurrikansaison), die besten und schlechtesten Wochen und Links in den Planer innerhalb
der Ferien jedes Bundeslands, Noords und Englands. Das Jahr im Titel springt im September um.
Sitemap ohne `<lastmod>`, eine Stunde Edge-Fenster, eigene OG-Karte; die globale Seite „Beste
Reisezeit“ verlinkt die drei ([Orlando best time](../features/orlando-best-time.md)). `pnpm test:orlando-best-time`
prüft Zeitraum, Monatszeilen, Ferienläufe und Wochen.
