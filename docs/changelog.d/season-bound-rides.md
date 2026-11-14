### Eine Bahn, die nur in einer Saison läuft, zeigt diese Saison

Phantasialands Eisbahn und Schlittschuhverleih gibt es nur während Wintertraum. Außerhalb davon
stand auf der Karte „Geschlossen“ mit „Außer Saison“, ohne zu sagen, wann. Die API bindet jetzt
eine Bahn an eine Saison, die sie in `attractionIds` nennt (Halloween, Weihnachten, Winter,
Sommernächte, Sonderveranstaltung), und schickt diese Saison als `boundSeason` mit.
`SeasonalBadge` zeigt dann das Symbol der Saisonart (`SeasonKindIcon`) und außerhalb der Saison
„Nur während Wintertraum · 20. Nov. – 18. Jan. 2027“, in sechs Sprachen (`parks.seasonal.onlyDuring`).
Den Zeitraum formatiert `formatSeasonRange` (`lib/parks/park-season-days.ts`), den die Saisonkarte
des Parks schon benutzte. Im Admin erklärt das Feld „Betrifft“ je nach Saisonart, was das Eintragen
einer Bahn bewirkt. Zählung, Filter und Planer brauchten nichts Neues: die Bahn kommt mit
`isCurrentlyInSeason: false` an ([saisonale Bahnen](../api/seasonal-attractions.md)).
