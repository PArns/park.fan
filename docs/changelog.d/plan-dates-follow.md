### Der Datumskalender des Reiseplaners springt zu Daten, die Parky setzt

Legte Parky die Reise auf den 14. bis 30. Januar, blieb der Kalender unter „Reisedaten“ auf dem
Monat, in dem der Besucher zuletzt geblättert hatte, etwa Dezember. `PlanDates` merkt sich die
Ankunft, die es zuletzt gesehen hat (`seenFrom`): Kommen neue Daten von außen (Parky, ein geteilter
Link, „Rückgängig“) und liegt die Ankunft nicht im gezeigten Monat, zeigt der Kalender ihren Monat.
Ein Zeitraum, der im Kalender selbst über zwei Monate gewählt wird, lässt ihn beim Abreisemonat.
