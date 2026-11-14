### Parky bietet eine Idee für den Reiseplan von sich aus an

Bisher zeigte der Chat eine Ideenkarte nur, wenn man im Planer bei einer Idee „Im Chat“ drückte.
Jetzt legen Parkys Reise-Werkzeuge (`get_trip_plan`, `change_trip`) bis zu drei Ideen aus
`/plan/ideas` in ihr Ergebnis, und Parky kann eine davon als Karte unter seine Antwort legen: eine,
die mindestens 5 Minuten spart oder einen ausgelassenen Park unterbringt, und nie eine, die man
schon abgelehnt hat.

- **Karte:** Die API schickt `{ kind: 'idea', region, idea }`. `readIdeaCard` in
  `lib/assistant/actions.ts` baut die Idee Feld für Feld neu auf: eine bekannte Art
  (`PLAN_IDEA_KINDS`), eine Region, die live ist, die Änderung im Alphabet des Planers. Gezeichnet
  wird sie mit der vorhandenen `AssistantTripIdeaCard` unter der Antwort, wie nach „Im Chat“;
  `AssistantCardView` zeichnet sie nicht ein zweites Mal.
- **Worte:** Der Chat trägt keine Texte des Planers. Der Planer auf dem Schirm leiht sie ihm über
  `tripPlannerBridge.ideaCard` (`useIdeaCardBridge` in `PlanAnswerSection`); „Im Chat“ und die
  Brücke bauen die Karte mit derselben Funktion (`useIdeaCard`). Ohne Planer auf dem Schirm gibt
  es keine Karte, weil es nichts gäbe, worauf sie sich anwenden ließe.
- **Übernehmen:** Wie bisher über `tripPlannerBridge.applyIdea`, als Änderung, die die Statuszeile
  des Planers nennt und „Rückgängig“ zurücknimmt.
- **„Anderen Tag“:** Ein zweiter Knopf öffnet den Tauschmodus des Planers für den Park der Idee
  (`tripPlannerBridge.openSwap`). Auf dem Telefon schließt sich der Chat dabei, wie bei den anderen
  Aktionen, außer während eines Interviews.
