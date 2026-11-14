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

#### Parky als Buddy statt Assistent

Parky heißt überall, wo er beschrieben wird, so, wie er im Chat schon klang: dein Park-Buddy, im
Englischen „he“ statt „it“, und er plant mit dir statt für dich
([Buddy, not assistant](../features/parky-character.md#buddy-not-assistant)).

- **Wortlaut in sechs Sprachen:** Launcher und jeder „Parky fragen“-Knopf heißen „Mit Parky
  schreiben“, der Reiter „Chat“, der Platzhalter „Nachricht an Parky …“. Der Hinweis unter dem
  Eingabefeld sagt „Parky ist eine KI und kann sich irren. Seine Antworten sind ohne Gewähr.“ Die
  Parky-Seite: H1 „Parky kommt mit in den Park“, SEO-Titel „Parky: Wartezeiten und Tagesplan im
  KI-Chat“, Kicker „KI-Chat“, eine FAQ dazu, was er sich merkt. Das ✕ einer Sprechblase heißt
  „Sprechblasen ausblenden“, weil es alle ausblendet.
- **Was der Browser weiß, sagt er nebenbei:** eine neue Quelle `yours`
  (`lib/assistant/parky/yours.ts`) liest geplante Tage, eine Reise, abgehakte Bahnen, einen Alarm
  und den Park des letzten Chats; sie nimmt die erste und einzige ungefragte Zeile eines Besuchs
  („Noch 5 Tage, dann Efteling. Ich zähl mit.“). Der Chat beginnt mit dem nächsten geplanten Tag und
  passenden Fragen, und die Begrüßung geht mit der ersten Frage als `opener` an die API. Unter dem
  Namen steht „Als Nächstes: Efteling, Do., 19. Nov.“.
- **Letzter Park:** `parkfan_parky_last_park` im lokalen Speicher, Name und Zeit des Parks, um den
  es im letzten Chat ging; ein späterer Besuch innerhalb von 30 Tagen greift ihn auf.
- **Eine Sprechblase je Besuch:** statt zwei geplanter Zeilen und bis zu drei Reaktionen sagt Parky
  ungefragt nur noch eine Zeile pro Sitzung. Sie wartet, solange der Tagesplaner offen oder der
  Reiseplaner zu sehen ist, und erscheint nie über einem Knopf: ein unsichtbarer Zwilling der Blase
  misst vorher, ob neun Punkte über einem Bedienelement liegen (`bubble-room.ts`).
- **Datenschutz:** die gefahrenen Bahnen, die jede Frage schon trug, stehen jetzt in der Erklärung,
  dazu die Begrüßung und der letzte Park; der Abschnitt heißt „Parky, der KI-Chat“.
