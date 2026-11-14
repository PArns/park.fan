### Der Reiseplaner fragt als Assistent, eine Frage pro Bildschirm

Der Reiseplaner auf den Hubs fragte mit Zeilen und Bottom-Sheets auf dem Telefon und zwei Panels
mit Aufklappern am Desktop; Hotel, Ruhetage und Abende lagen in „Mehr Optionen“ als lange Liste aus
Radio-Gruppen. Jetzt öffnet „Reise planen“ einen Assistenten (`TripWizard`,
`components/trip-regions/wizard/`): ein Dialog über die ganze Höhe des Telefons, am Desktop eine
Bühne von 768 px in der Mitte. Parky stellt jede Frage in einer Sprechblase aus der Szene seiner
Region (`WizardGuideBand`, die Szene immer in 2 : 1, nie angeschnitten), darunter die Schrittleiste
und Karten statt Formularfeldern. Ab der Abreise zeigt ein Planstreifen in der Fußzeile den Plan, ein
Feld pro Tag in Andrangsfarbe, mit „6 Parktage, 8 frei · Spitze etwa 78 Min.“ und „Plan jetzt
zeigen“ (`PlanRibbon`). Nur die Daten sind Pflicht; jeder Schritt danach lässt sich überspringen oder
über die Schrittleiste anspringen. Am Ende steht das Finale „Dein Plan steht.“ mit den Polaroids der
geplanten Parks.

Welche Schritte eine Region bekommt, rechnet `lib/trip-regions/wizard-steps.ts` aus ihren Daten: Ein
Schritt mit einer einzigen Frage geht im Nachbarn auf. Orlando und Japan haben so je sechs
Schritte; Japans Abendfrage steht im Tempo, weil Tokyo Disney keine Hopper verkauft, und bei einem
Paris-Wochenende bis zwei Nächte geht das Hotel pro Stadt in die Route
(`pnpm test:wizard-steps`).

Die Daten bekommen eine Zeile mit Monats-Chips über dem Raster, und nach dem ersten Tipp fragt Parky
„Und wann fliegst du zurück?“. Die Parks sind Karten mit Foto und Tage-Stepper; ein Park, der an
allen Reisetagen zu hat, sagt das, bevor ihn jemand wählt. Hat die Reise mehr freie Tage als
Parktage oder mehr als drei am Stück, fragt der Schritt, was an ihnen passieren soll: weitere Parks,
mehr Tage in den Parks, freie Tage oder kürzer reisen (`lib/trip-regions/spare-days.ts`). Fallen
gewählte Parks aus dem Plan, sagt Parky welche, und der Schritt bietet Park am An- und Abreisetag,
nur diese Parks oder einen längeren Urlaub an. Die Tickets sind zwei Antwortkarten, „Noch nicht“ mit
der Ticketkarte des Plans und „Ja, schon gekauft“ mit dem Ticketschritt.

Geteilte Bauteile: `WizardToggle` zieht aus dem Tagesplaner nach `components/planner/`, daneben
die neue `WizardOptionCard` als die eine Optionskarte beider Assistenten, `PlannerStepRail` kann
Schritte vor dir erreichbar machen (`reachable`), und `useRegionScene` lädt die Szene einer Region.
Neue Ereignisse: `trip_wizard_step`, `trip_wizard_finished`, `trip_wizard_closed` und
`trip_spare_choice`; `trip_planner_started` kennt `landing` und `restart`, `trip_tickets_opened`
kennt `wizard` ([Assistent](../features/trip-planner/wizard.md#the-trip-planners-assistant)).
