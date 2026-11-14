### Der Admin zeigt den Reiseplaner und die Regionen-Hubs unter Traffic

Neben „Tagesplaner“ steht unter Traffic „Reiseplaner“ (`/admin/traffic/trip-planner`,
`TripPlannerView`): die Aufrufe der Hubs, Monatsseiten und besten Reisezeit je Region, aus drei
`breakdown`-Abfragen nach Seitentyp, die Region aus dem Pfad gelesen (`tripRegionBySegment`); der
Ablauf von „Begonnen“ bis „Behalten“ mit seinen Quoten, die Regionen nebeneinander, die Anfragen,
die „Wann“-Suchen, Tickets und Kauf-Links und die Hotels, umschaltbar auf eine Region. Die Zahlen
kommen aus der neuen API-Route `GET /v1/admin/analytics/trip-planner`, die dasselbe antwortet wie das
MCP-Werkzeug `trip_planner_report`, nur ohne die zusammengefassten kleinen Werte. Die Palette findet
die Seite unter „reiseplaner“, „hub“, „wann“ und den Regionen
([Site-Statistik](../features/site-analytics.md)).
