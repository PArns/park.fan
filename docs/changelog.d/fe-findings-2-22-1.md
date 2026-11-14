### Bearbeitete Tage leuchten kurz auf, Parkys Änderung lässt sich im Plan zurücknehmen, und Bahnen lassen sich an Saisons binden oder für sie pausieren

#### Reiseplaner

- **Leuchten:** Nach einem Tausch, einem Verschieben, einem frei gemachten Tag, einem Park auf
  einem freien Tag oder einer übernommenen Idee leuchten die Tage, auf denen jetzt etwas anderes
  liegt, einmal kurz auf, in allen drei Ansichten (`PlanDayGlow`, `editGlowDays` in
  `lib/trip-regions/plan.ts`), nach „Rückgängig“ dieselben Tage noch einmal. Das Leuchten beginnt
  erst, wenn der neue Plan da ist; solange der alte gedimmt wartet, leuchtet nichts. Ein Ring in
  der Primärfarbe, nach innen gezeichnet, weil Karten und Spalten nach außen abschneiden. Mit
  Bewegung schwillt er an und blendet aus (1,8 s), bei `prefers-reduced-motion` steht er sofort
  und blendet nur aus.
- **Parkys Änderung im Plan:** Ändert Parky im Chat die Reise (`change_trip`), während der Planer
  auf dem Schirm ist, ist das jetzt eine Bearbeitung wie ein Druck auf einen Knopf
  (`tripPlannerBridge.applyChange`): Das Statusband sagt „Parky hat die Reisedaten geändert.“ (je
  nach Art der Änderung, zehn Fassungen in sechs Sprachen) und bietet „Rückgängig“, das sie
  zurücknimmt, ohne die Bearbeitungen davor zu verlieren. Vorher setzte die Änderung den Verlauf
  zurück, und zurücknehmen ließ sie sich nur im Chat. `trip_undo` zählt sie als `what: parky`.

#### Saisons

- **Nicht während einer Saison:** Eine Bahn, die das ganze Jahr läuft und für eine Saison schließt
  (River Quest und Phenies während Wintertraum), zeigt an den Tagen der Saison „Pausiert während
  Wintertraum · 14. Nov. – 24. Jan.“ mit dem Symbol der Saison (`SeasonalBadge`, aus
  `pausedBySeason` der API). Weil die API auch die nächste oder die letzte Saison schickt, prüft
  die Karte den Tag des Parks selbst (`seasonRunsOn`); außerhalb der Saison steht kein Badge.
- **Admin, Fahrgeschäft → Stammdaten → Kuratierte Felder → Saison:** neu „An Saison gebunden“, die
  laufenden und kommenden Saisons des Parks, die Bahnen binden (Halloween, Weihnachten, Winter,
  Sommernächte, Sonderevent, nicht abgesagt), je mit Symbol, Name, Zeitraum, Status und „—“, „Nur
  während“ oder „Nicht während“. Die Wahl schreibt `attractionIds` oder `pausedAttractionIds` der
  Saison und nimmt die Bahn aus der anderen Liste, dieselben Listen, die das Saisonformular
  bearbeitet; der Name öffnet das Formular. Hat die Bahn kuratierte Monate oder ein kuratiertes
  „Nein“, sagt ein Hinweis, dass sie Vorrang vor der Bindung haben, mit „Monate zurücksetzen“.
  Phantasialands „Ice skate hire“ hat Januar, November und Dezember kuratiert; ohne den Hinweis
  hätte die Bindung an Wintertraum nichts geändert, ohne dass es jemand sieht.
- **Admin, Saisonformular:** neben „Betrifft“ die zweite Liste „Pausiert während der Saison“,
  derselbe Picker. Eine Bahn in beiden Listen nennt das Formular, bevor die API sie ablehnt.
- **Admin, Fahrgeschäfte eines Parks:** Eine gebundene oder pausierte Bahn nennt ihre Saison mit
  Symbol und Zeitraum unter ihren Angaben, sobald die Liste der API `boundSeason` und
  `pausedBySeason` mitschickt. Bisher stand dort nur „saisonal“, ohne Monate.
