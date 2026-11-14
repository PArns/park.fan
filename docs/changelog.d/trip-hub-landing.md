### Die Hubs der Reiseregionen werden Landing Pages um den Reiseplaner

Orlando, Kalifornien, Japan und Paris stellen den Reiseplaner jetzt vor den Kalender. Ohne Plan
zeigt Kapitel 01 in vier Schritten mit Screenshots, wie der Planer arbeitet
(`components/trip-regions/hub/hub-how-it-works.tsx`), darunter Parky mit „Reise planen“ und
„Lieber im Chat“. Es folgen 02 der Kalender, 03 die Resorts mit Foto, zwei Sätzen, den Parks als
Links auf ihre Andrang-Kalender und einem Satz zum Übernachten (`hub-resorts.tsx`, ersetzt
`HubParkIndex`), 04 die beste Reisezeit, 05 die Fragen und ein Schlussband (`hub-final-cta.tsx`).
Screenshots und Resort-Fotos sind Regionsdaten (`hub.howItWorks`, `hub.resorts`, `hub.scene` in
`lib/trip-regions/regions/*.ts`), die Texte stehen unter `tripHub.howItWorks` und
`tripRegions.<slug>.hub.resorts` in sechs Sprachen.

Mit einem Plan in der Adresse oder einem gemerkten Plan aus diesem Browser heißt Kapitel 01 „Deine
Reise“ und zeigt das Ergebnis, der Kopf bietet „Zu deinem Plan“ und „Neue Reise planen“, Kalender
und Resorts klappen zu je einer Zeile ein (`HubTripProvider`, `lib/trip-regions/hub-trip.ts`). Ein
gemerkter Plan, der noch nicht vorbei ist, kommt bei einem Aufruf ohne Query zurück. Der Server
rendert immer die Landing Page. Jeder Knopf, der den Planer startet, geht über eine Stelle
(`startPlanner` in `hub-hero-action.tsx`) und öffnet den Assistenten mit `hero`, `landing` oder
`restart`.

Der Wochenansicht fehlten Fotos für die meisten Parks in Orlando: `tripPlannerPhotos` nimmt ohne
Parkhintergrund jetzt das erste Foto des Parks (Orlando 5 statt 0 von 16 Parks). Epic Universe und
Universal Studios Florida haben noch keins ([Hub](../features/orlando-hub.md)).
