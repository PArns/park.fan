### Reiseplaner, Hub und Parky: jede Kopie an einer Stelle

Eine Durchsicht des Reiseplaners, der Hubs, der Best-Time-Seiten und von Parkys Szenen nach
[einer Stelle für jede Logik](../rules/dry-one-place-for-each-piece-of-logic.md). Was zweimal
geschrieben stand, hat jetzt eine Stelle; an Bild und Verhalten ändert sich nichts.

- **Tagesblatt und Zeitraumblatt** des Planers (`PlanDaySheet`, das Blatt eines Zeitraums in
  `plan-when-result.tsx`) teilen sich `PlanSheetContent` (`plan-sheet.tsx`): Seite je Breite, Kopf,
  ×, scrollender Körper. Das × des Planers ist `PlanSheetClose`, die Klasse seiner Auswahl- und
  Datumsfelder `PLAN_FIELD` (sieben Kopien in `plan-find.tsx` und `plan-route.tsx`), die
  Wochentagszeile der beiden Monatsraster `PlanWeekdayHead`, die Leiste über der Antwort
  `ACTION_BAND` (dreimal in `plan-result.tsx`). Plan, Kalender und Zeitraumsuche teilen ihre
  Cache-Regeln und ihr Entprellen (`use-trip-plan.ts`).
- **`findLeg`** stand in `hub-data.ts` und in `plan.ts`; es bleibt die in `hub-data.ts`, neben
  `legMinutes`, das `plan-parks.tsx` jetzt statt einer eigenen Summe nutzt.
- **Datumsrechnung:** der Tag davor auf der Best-Time-Seite und der Tag danach in der `.ics` sind
  `addDays`, Monatsanfang und -ende `tripMonthRange` (`monthKey` liegt jetzt in `paths.ts`),
  `formatHubDate`, Parkys Datumszeilen (`yours.ts`) und `formatPlanDay` im Planer-Menü laufen über
  `formatParkDay`.
- **Links und Metadaten:** „Diese Reise planen“ im Hub baut sein Ziel mit `plannerHrefOn`, die Seiten
  `/trip-planner` und `/parky` ihre Open-Graph-Daten mit `buildOpenGraphMetadata`.
- **Parky:** Kabinen und Speichen eines Riesenrads rechnen `cabinsOnRim` und `wheelSpokes` in
  `drawing.ts` (Hut, Traumrad, Pier-Rad), Orlando- und Pausenszene stehen im Rahmen von
  `HolidaySceneSvg`. `useAssistantActions` sucht eine Vorstellung an einer Stelle (`showLineAt`).

36 Dateien, 485 Zeilen gelöscht, 403 geschrieben.
