### Südkalifornien, Japan und Paris sind live

Neben Orlando antworten drei weitere Reiseregionen mit Hub, elf Monatsseiten, Best-Time-Seiten und
Reiseplaner: Südkalifornien (`/de/kalifornien`, `/en/california`, `/fr/californie`), Japan
(`/de/japan`, `/fr/japon`, `/it/giappone`) und Paris (`/paris` in jeder Sprache). Der Schalter ist
`live: true` in `lib/trip-regions/regions/`; Routen, Rewrites, Edge-Fenster, Sitemap mit hreflang,
OG-Karten, das Planen-Band im Header, „Mehr“, die Startseite, die Suche, Parky und die
Reiseplaner-Kachel auf den Seiten ihrer Parks lesen das Register
([Reiseregionen](../features/trip-regions.md)). Was jede Region eigen hat, steht in ihrem Ticket;
Südkalifornien bekommt den Hub mit einer Best-Time-Seite für die Region und den Reiseführer
„Disneyland, Universal und San Diego auf einer Reise“ in sechs Sprachen, den das Band am Ende des
Hubs verlinkt (`regionGuide`).

- **IndexNow:** der feste Teil von `/api/cron/indexnow` meldet Hub und Best-Time-Seiten jeder
  Live-Region in sechs Sprachen (`tripRegionLandingPaths` in `lib/trip-regions/paths.ts`), 78
  Adressen; vorher fehlte auch Orlando.
- **`llms.txt`** führt unter „Start here“ je Live-Region den Hub mit seinem Namen und seiner Zeile
  aus `tripRegions.<slug>.nav` (`calendar`, `calendarHint`).
- **Prüfungen aus dem Register:** `check:landing-pages` und `check:semantic-html` lesen die Seiten
  der Live-Regionen aus `scripts/lib/trip-region-pages.mjs` (Hub und jede Best-Time-Seite auf
  Deutsch und Englisch, der nächste Monat auf Deutsch) statt Orlandos Adressen von Hand: 30 Seiten
  je Prüfung statt sieben und vier. Die Anatomie-Regel nennt „die Hubs der Reiseregionen und ihre Best-Time-Seiten“
  ([Regel](../rules/a-landing-page-has-one-anatomy.md)).
- `test:trip-regions` erwartet die vier Regionen live; die Tests, die eine Region ohne Hub
  brauchten, nehmen einen Slug außerhalb des Registers.
