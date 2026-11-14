### check:prose findet, was vier Kritiker in den Regions-Guides angestrichen haben

Vier frische Kritiker (§7.2 in [7-review](../writing/7-review.md)) haben in den deutschen und
englischen Fassungen der vier Regions-Guides 276 Sätze als maschinell markiert, `check:prose` fand
davon keinen. Neun neue Regeln (#115 bis #123: Sätze, die mit dem eigenen Werkzeug beginnen oder
einen Absatz schließen, Serien von „Deshalb“/„So“, Verneinungen und Teasern am Absatzanfang, die
Dichte der Quellenformeln, Preise ohne Zahl, Objekt-vorn-Calques im Englischen und Bildunterschriften
mit Gründungs-Superlativ) und zehn erweiterte fangen jetzt 114 der 276 (41 %); jede mit dem Satz,
der sie ausgelöst hat, in [2-20-check-patterns](../writing/2-20-check-patterns.md). Über alle Inhalte
steigen die Warnungen von 29 auf 57, Fehler bleiben 0; zwei Regeln wurden auf dem Weg enger, nachdem
sie auf 24 und 21 Beiträgen ohne den Fehler anschlugen. „Tapestry of Happiness“ ist als Showtitel
kein KI-Wort mehr. `WATCH`, `TAILS` und `PRODUCT_SUBJECT` stehen jetzt in `prose-slop-patterns.mjs`,
damit die Tests sie erreichen (722 Fälle in `test:prose-rules`, vorher 582).
