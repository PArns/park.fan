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

Über dem Plan steht „Deine Antworten“: ein Chip pro Schritt des Assistenten, aus seiner eigenen
Schrittliste, der ihn auf diesem Schritt öffnet (`WizardAnswers`, `tripPlannerUi.openStep`). Die
Knöpfe „Parks ändern“, „Route ändern“ und „Mehr Optionen“ unter dem Plan entfallen, ebenso
„Reisedaten wählen“ im leeren Ergebnis neben „Reise planen“ und das Ticket-Panel am Desktop: Tickets
trägt man im Ticketschritt ein.

Geteilte Bauteile: `WizardToggle` zieht aus dem Tagesplaner nach `components/planner/`, daneben
die neue `WizardOptionCard` als die eine Optionskarte beider Assistenten, `PlannerStepRail` kann
Schritte vor dir erreichbar machen (`reachable`), und `useRegionScene` lädt die Szene einer Region.
Neue Ereignisse: `trip_wizard_step`, `trip_wizard_finished`, `trip_wizard_closed` und
`trip_spare_choice`; `trip_planner_started` kennt `landing` und `restart`, `trip_tickets_opened`
kennt `wizard` ([Assistent](../features/trip-planner/wizard.md#the-trip-planners-assistant)).

#### Hotel, Route, Hotels, Tempo und Abende

Die Schritte nach Daten und Parks waren bisher eine Liste aus Radio-Gruppen und Checkboxen unter
„Mehr Optionen“ (`PlanOptions`) und vier native Auswahllisten in der Route (`plan-route.tsx`). Jetzt
ist jede Antwort eine Karte, ein Chip oder ein Stepper (`components/trip-regions/wizard/steps/`):

- **Hotel** (Orlando, Kalifornien): die Hotelarten als Kacheln, darunter die Gegenden als Karten
  mit Early Entry und den Wegen zu den Parks der Reise aus `travel.legs`, über einer schematischen
  Karte aus den Koordinaten der API, ohne Kacheln eines Kartendienstes.
- **Route** (Japan, Paris): Ankunft und Abreise als Karten, Stadt vor Flughafen, „Noch offen“
  gestrichelt; Charles de Gaulle heißt „Der Plan wählt das Hotel“. Die Städte stehen auf einer Linie
  mit Foto, Nächte-Stepper und der Fahrt dazwischen („Shinkansen, 3:30 Std.“). Städte zum
  Dazunehmen sind gestrichelte Knöpfe statt „Stadt wählen“.
- **Hotels** pro Stadt: `stayNote`, Karte und Gegend-Karten (Maihama: Tokyo Disneyland 10 Min. zu
  Fuß, Tokyo DisneySea 15 Min. Monorail, Happy Entry), Städte mit bis zu vier Gegenden als Chips,
  die Zeit für den Hotelwechsel als Segment. Parky fragt „Wo schläfst du in Tokio und Osaka?“.
- **Tempo**: drei Karten mit einer Woche als Muster, die eigene Grenze mit Stepper. Die Karte für
  einen Park am Anreisetag nennt den Tag: „Die Reise beginnt in Osaka. Universal Studios hat am
  Do., 14. Jan. bis 20:00 offen.“
- **Abende**: Abendvorschläge mit den Orten der Resorts als Chips, das Feuerwerk als zwei Kacheln,
  Resorts zusammenhalten, und Park-Hopping ohne Hopper als gesperrte Karte mit dem Urteil der API:
  „Mit Park Hopper kommt am Fr., 11. Dez. abends EPCOT dazu.“ und „Plan mit Park Hopper zeigen“.

`PlanOptions`, `PlanRoute`, `PlanRouteOptions` und `PlanRadioGroup` sind entfernt, mit den 22 Schlüsseln
unter `tripPlanner.options` und `tripPlanner.route`, die niemand mehr liest, und `hotelShort` und
`fireworksWantShort` der Regionen. Die
reine Logik (Muster, Wege, Karte, Tatsache am Reisetag) steht in
`lib/trip-regions/wizard-choices.ts` und läuft in `pnpm test:wizard-choices`. Ablauf und
Barrierefreiheit: [Assistent](../features/trip-planner/wizard.md#the-trip-planners-option-steps).

#### Den Plan am Tag bearbeiten, mit Rückgängig für jede Änderung

Jede Tageskarte hat unten drei Knöpfe: „Festhalten“ (gedrückt, solange der Tag fest ist),
„Tauschen“ und „Mehr“; jeder nennt Park und Datum in seinem Namen. „Tauschen“ öffnet einen
Tauschmodus an der Stelle der Tage (`PlanSwapMode`): oben das Band „Tokyo DisneySea tauschen. Wähle
einen Tag. Die Zahl ist die Spitze von Tokyo DisneySea dort.“, darunter jeder Tag derselben Stadt
mit der Minute des Parks an jenem Tag, nie dem Schnitt des Plans: „Tokyo DisneySea 105 Min. (+5)“,
bei einem Parktag dazu „Tokyo Disneyland dafür am Di.: 60 Min. (±0)“, bei einem freien Tag „Der
freie Tag wandert auf Di.“. Der ruhigste Tag ist markiert, ein kurzer Tag trägt „schließt 18:30“,
derselbe Park und ein geschlossener Tag sind gesperrt. Die Tauschliste im Tages-Sheet mit der
Änderung im Schnitt entfällt; sein „Tauschen“ öffnet denselben Modus. „Mehr“ legt den Park auf den
ruhigsten freien Tag seiner Stadt (mit der Zahl, oder „Kein freier Tag ist ruhiger“), macht den Tag
frei, nimmt den Park aus der Reise („Beide Tage werden frei.“) oder öffnet den Tagesplaner
(`DayActionsSheet`). Die Helfer `moveVisit`, `freeDay` und `removePark` stehen neben Pins und
Tausch in `lib/trip-regions/plan.ts`.

Das Statusband über dem Plan (`PlanEditStatus`, ersetzt die Edit-Leiste) sagt nach jeder Änderung,
was passiert ist („Tokyo DisneySea liegt jetzt am Mi., 20. Jan.“), dass die festen Tage bleiben, und
die Spitze jetzt oder was die Pins kosten. „Rückgängig“ nimmt jede Änderung zurück, nicht nur die
Pins: `usePlanState` hält den ganzen Zustand vor jeder Änderung. Neue Ereignisse: `trip_day_moved`,
`trip_day_freed`, `trip_park_removed` und `trip_undo` mit `what`.

#### Parkys Ideen

Die API rechnet die besten Einzeländerungen eines Plans (`GET /v1/trip-regions/:region/plan/ideas`,
dieselbe Query wie `/plan`, höchstens drei). Der Planer fragt sie, sobald der Plan auf dem Schirm
steht, über dasselbe Relay, und zeigt sie dreimal: als Karten „Parky hat 3 Ideen für deinen Plan“
über den Tagen (`IdeasStrip`), als Zeile unter dem Tag, den eine Idee ändert (`DayHint`), und im
Chat unter Parkys Antwort, wenn man „Im Chat“ drückt (`AssistantTripIdeaCard`). Jede Karte nennt die
Idee in einer Zeile („Tokyo Disneyland am Do., 28. Jan. statt am Fr., 22. Jan.“), die Minute des
Parks („etwa 55 statt 60 Min.“) und das passende Verb: Dazunehmen, Tauschen oder So planen. Ein Tipp
übernimmt die Idee über die Planer-Brücke als Änderung mit Rückgängig. Eine Idee, die eine Antwort
aus dem Assistenten bräche (Reisetage, Park-Hopping), zeigt der Planer nicht: Die API kann eine
gewählte Voreinstellung nicht von einer ungefragten unterscheiden. Das Finale sagt „Parky hat N Ideen
für deinen Plan“. Die reine Logik steht in `lib/trip-regions/plan-ideas.ts`
(`pnpm test:plan-ideas`); neue Ereignisse `trip_idea_shown`, `trip_idea_applied` und
`trip_idea_chat` ([Bearbeiten und Ideen](../features/orlando-planner.md#editing-a-plan)).

`TripEditFrom` nennt nur noch, was gesendet wird (parks left out, ticket problem, ticket card);
`trip_edit_opened` ist im Admin als „bis 2.21“ markiert. `pnpm check:planner --orlando` geht den
Weg durch den Assistenten statt durch „More options“ und prüft Festhalten, Rückgängig und den
Tauschmodus.
