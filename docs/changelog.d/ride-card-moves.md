### Admin: „Als Ride-Bild setzen" verschiebt die Rolle, statt sie zu verdoppeln

- Ein zweites Foto mit `ride-card` nahm dem alten die Rolle nicht weg. Der Generator warnte über
  zwei Karten, und `getRideImage` zeigte weiter das alte Foto. So blieb die erste Einsendung zu
  Voltron unsichtbar, obwohl sie beim Übernehmen als Ride-Bild markiert war.
- Der Commit-Endpunkt (`/api/admin/media/commit`) nimmt eine eindeutige Rolle (`ride-card` pro
  Ride, `park-background` pro Park) jetzt im selben Pull Request dem bisherigen Halter weg
  (`handOverUniqueRoles` in `lib/admin/media-unique-roles.ts`). Gesucht wird im Manifest und in
  den Sidecars der offenen Media-Session; umgeschrieben wird die Datei vom Branch, nur die
  Rollen-Zeile ändert sich. Der PR-Log nennt beide Bilder.
- In der Detailansicht der Mediengalerie und im Upload-Walkthrough ist das Ride-Bild ein eigener
  Schalter (`RideCardToggle`) mit dem aktuellen Ride-Bild als Vorschaubild. Im Walkthrough steht
  er direkt unter der Ride-Auswahl statt unter den Tags.
- Daten: `europa-park/voltron-nevera-powered-by-rimac` gibt `ride-card` ab und bleibt Hero-Bild.
  Damit ist das eingesandte Foto `…-461ea7` das Ride-Bild von Voltron, und der Build meldet keine
  doppelte Karte mehr.
- `pnpm test:media-unique-roles`: 13 Fälle, darunter der Voltron-Fall mit byte-gleichem Sidecar.
- Doku: [media database → a unique role moves](../features/media-database.md#a-unique-role-moves-when-another-photo-claims-it).
