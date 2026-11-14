### Parky liest und ändert Reise und Tagesplan, schlägt Antworten vor und plant im Interview

Parky sah bisher nur die nächsten sechs Tage des Tagesplaners und den Reiseplaner gar nicht. Jetzt
trägt jede Frage alle geplanten Tage ab heute (den im Planer offenen und die nächsten acht ganz, mit
der eigenen Minute jedes Eintrags und dem Slug einer Show, die übrigen bis 60 nach Park und Datum)
und den Reiseplaner: die Reise, die auf dem Hub gerade zu sehen ist, und die zuletzt geplante Reise
je Region, die der Browser jetzt aufhebt (`parkfan_trip_<slug>`, nur die Query und die Gruppe, nie
auf dem Server). Der Planer meldet seinen Zustand über eine Brücke
(`lib/trip-regions/planner-bridge.ts`, ein Effekt in `use-plan-state.ts`, unabhängig von der
Reihenfolge seiner Schritte); Parkys Änderungen laufen durch dasselbe `update` wie ein Klick und
planen sichtbar neu ([Parky](../features/assistant.md#the-trip-planner)).

- **Belege mit Rückgängig:** Jede Änderung an Reise oder Tag steht unter der Antwort
  („Reiseplaner: Tage getauscht") mit „Rückgängig"; Parkys Undo nimmt nur zurück, was seither
  niemand geändert hat (`takeTripUndo`, `undoParkyChange`).
- **Antwortvorschläge:** bis zu vier Antworten, die das Modell selbst schreibt (`suggest_replies`),
  unter seiner neuesten Antwort, als Knöpfe auf der Seite des Besuchers, 44 px auf dem Handy
  (`AssistantReplies`); ein Tipp schickt den Text als Frage.
- **Interview:** von einfach zu ausführlich. Eine Reise braucht Region, Daten und Parks, dann steht
  der Plan, und Parky bietet den Rest als Antworten an (Gruppe und Größen, Tickets, Hotel, Tempo,
  ab in den Tagesplaner); ein Parktag Park, Tag und Wunschfahrten. Was jemand früher sagt, gilt
  sofort. Start im Reiseplaner („Plane mit Parky deine perfekte Reise"), auf einem leeren Tag im
  Tagesplaner („Plane mit Parky deinen perfekten Parktag") oder im Chat; die Leiste über dem Chat
  zeigt den Stand und beendet es, jede Antwort steht dann schon im Planer.
- **Links zum Hub** schreibt Parky jetzt als `/trip-regions/<slug>`; das Widget löst sie aus dem
  Register in das Segment der Sprache auf (`regionHubPath`).
- **Datenschutz:** die Parky-Absätze nennen Reiseplaner, gemerkte Reise, Interview und die neuen
  Ereignisse (`assistant_replies_shown`, `assistant_interview_*`, `assistant_plan_changed`,
  `assistant_change_undone`).
