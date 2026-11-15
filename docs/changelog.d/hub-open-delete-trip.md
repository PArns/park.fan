### Die Kapitel der Reise-Hubs sind immer offen, und eine Reise lässt sich löschen

#### Offene Kapitel

Auf den vier Hubs (Orlando, Südkalifornien, Japan, Paris) und ihren Monatsseiten klappte sich mit
einem Plan der Kalender in „Kalender für alle 16 Parks, Tag für Tag“ und die Resorts in eine Zeile
mit ihren Namen ein (`HubPlanFold` in `components/trip-regions/hub/hub-trip-state.tsx`). Jetzt sind
alle Kapitel in beiden Zuständen offen, ohne Knopf zum Ein- und Ausklappen: Mit einem Plan steht
„Deine Reise“ als Kapitel 01 oben, Kalender, Resorts, beste Reisezeit und Fragen folgen darunter wie
auf der Landingpage. Weil sich nach der Hydration nur noch Kapitel 01 ändert, verschiebt der Wechsel
in den Planzustand nichts darunter. Die Fragen behalten ihr Akkordeon pro Frage; ein Kapitel-Fold
lag um sie nie. `HubPlanFold`, die Zusammenfassung der Resorts und `tripHub.howItWorks.calendarFold`
in sechs Sprachen sind entfernt ([Orlando-Hub](../features/orlando-hub.md#two-states)).

#### Reise löschen

„Reise löschen“ steht am Ende der Zeile „Dein Plan für … ist in diesem Browser gespeichert.“ im Kopf
des Hubs und unter „In den Tagesplaner übernehmen“, „In den Kalender“ und „Link kopieren“ im
Ergebnis (`PlanDelete`, `components/trip-regions/planner/plan-delete.tsx`). Die Rückfrage steht an
Ort und Stelle statt der Zeile, ohne `confirm()` des Browsers: „Diese Reise löschen? Deine Daten,
Parks und Änderungen werden auf diesem Gerät entfernt.“ mit „Löschen“ und „Behalten“. „Löschen“
leert alle sieben Ablagen der Reise dieser Region (`clearTrip` in `lib/trip-regions/trip-clear.ts`):
die Abfrage in der Adresszeile mit Daten, Parks, Pins und Tickets, die Bearbeitungen samt
„Rückgängig“ im Planer, die gespeicherte Reise mit Parkys Reisegruppe (`parkfan_trip_<region>`), die
beantworteten Fragen des Assistenten, die Antwort auf „Schon Tickets?“, Parkys laufendes
Reise-Interview und seine letzte Änderung. Die Adresse wird der nackte Pfad des Hubs, sodass
`restorableTrip` beim Neuladen nichts zurückholt; die Reisen anderer Regionen bleiben. Acht
Sekunden lang sagt der Kopf „Deine Reise vom … ist gelöscht.“ mit „Rückgängig“ (`PlanDeleteStatus`,
in der Zelle der Notiz, damit ihr Ende nichts verschiebt), danach ist die Kopie im Speicher weg.
Neues Ereignis `trip_deleted` mit `from` (head, result), mit Beschriftung im Admin.

„Neue Reise planen“ leert die Reise jetzt mit demselben `clearTrip`. Bisher setzte es den Plan über
Parkys Brücke zurück (`tripPlannerBridge.apply(region, '')`), und jede Option, die dabei
verschwand, zählte als `trip_option_changed` mit `by: parky`. Ein Leeren zählt jetzt keine Option;
die gespeicherte Reise und die Antworten des Assistenten gehen mit, sodass ein Neuladen keine alte Reise
zurückbringt. `pnpm test:trip-clear` prüft die Ablagen, die andere Region und das Rückgängig
([Reiseplaner](../features/orlando-planner.md#keeping-a-plan)).

#### Glas für den zweiten Knopf im Kopf

„Neue Reise planen“ und „Zum Kalender“ im Kopf der Hubs waren `outline`-Knöpfe: im hellen Thema ein
deckender weißer Kasten, im dunklen ein Haarstrich auf fast durchsichtigem Grund, über dem Foto in
beiden Fällen flach. Die neue `Button`-Variante `glass` (`components/ui/button.tsx`) legt das Glas
des Hero (`HEAVY_GLASS`, Füllung und `backdrop-blur-xl`) mit einem hellen Rand darüber. Sie gilt
nur auf Fotos: Auf einer schlichten Seite verschwindet der helle Rand im Hintergrund, dort bleibt
`outline` ([Tokens](../design/tokens.md#glass)). Im Deutschen heißt die Zeile darunter jetzt „Dein
Plan für … ist in diesem Browser gespeichert.“ statt „gemerkt“.

#### Im Wochenkalender zählt der ruhigste Tag je Park

Der Wochenkalender in Kapitel 02 beantwortete, welcher Park eines Resorts an einem Tag der beste ist:
ein Ring um den Park mit der kürzesten Schlange im Resort und darüber die Zeile „Bester Park“. Wer
alle Parks einmal besuchen will, braucht die andere Richtung: welcher Tag der Woche für jeden Park
der leerste ist. Ring und Zeile sind weg, samt `dayPick`, `resortHasChoice`, `bestAtResort` und
den Texten `pickRow`, `pickRowGroup`, `cellBest`, `more`, `earlyElsewhere`, `today` und
`legend.ring` in sechs Sprachen. Der ruhigste Tag jedes Parks (`quietestDay`, dieselbe Regel wie
bisher für den Stern: niedrigste `headlinerWait`, bei Gleichstand der längere Tag, nichts bei einem
echten Gleichstand oder einem Vorjahrestag) trägt jetzt den Ring in Textfarbe (`HUB_CELL_BEST`) und
den Stern, und neben dem Parknamen steht er mit Wartezeit („★ Mi., 18. · 30 Min“, `QuietestNote`).
Auf dem Telefon ersetzt dasselbe Raster die Tagesliste, die pro Resort nur den besten Park zeigte:
eine Karte je Resort mit den Daten der Woche und je Park sieben 44-px-Kacheln
(`CalendarDayTile` mit der neuen Dichte `mini`). Legende und Unterzeile sagen es: „Bei jedem Park ist
sein ruhigster Tag der Woche markiert“. Die Antwort im Kopf („Bester Park je Resort“) und die Frage
in der H1 („Welcher Park an welchem Tag?“) bleiben: Sie stammen nicht aus der entfernten Zeile, und
die H1 trägt den Suchbegriff der Seite.
