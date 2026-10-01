### Admin: eingesandte Fotos in die Mediengalerie übernehmen, und ein Hinweis auf neue Einsendungen

- Auf `/admin/contributions` hat jedes Foto einer Einsendung ein Häkchen, vorausgewählt sind alle
  noch nicht übernommenen. „N Fotos in die Mediengalerie" öffnet den Upload-Walkthrough aus
  `/admin/media` (`MediaUpload`, neu mit `seed`), vorbefüllt mit Park, Ride, Caption und Credit
  der Einsendung. Fokuspunkt, Rollen und Alt-Text setzt man dort wie bei jedem anderen Foto, der
  Commit landet im offenen Media-Pull-Request.
- Der alte Hover-Knopf (`AdoptIntoMedia`) schrieb den Credit als `credit.name`. Das Sidecar kennt
  nur `credit.author`, der Name des Fotografen ging also verloren. Jetzt: `author` nur, wenn der
  Besucher einen Namen angegeben hat, dazu `license: all-rights-reserved` und
  `source: contribution`. Ohne Namen gibt es keine Credit-Zeile und keinen Fallback auf
  `OWN_PHOTO_AUTHOR`.
- Übernommene Fotos werden neu kodiert (`withoutMetadata` in `app/admin/_lib/upload-transport.ts`),
  damit kein EXIF eines Besuchers unter `public/media/` landet: GPS, Kamera-Seriennummer,
  Besitzername. Die Drehung eines Hochkantfotos bleibt erhalten, im Test kam ein 1024×768 mit
  Orientation 6 als 768×1024 heraus. GPS steht auch nicht im Sidecar, das Aufnahmedatum schon.
- Die Einsendung merkt sich pro Foto, wohin es ging (`StoredImageRecord.adopted`: Media-ID,
  Pull Request, Zeitpunkt), zeigt „In Galerie" mit Link auf den PR und wird dabei freigegeben.
  Der Dateiname ist fest (`<ride>-<id6>[-n]`), ein zweiter Versuch überschreibt statt zu doppeln.
- Der Upload-Walkthrough hat ein Feld für die Bildunterschrift. Der Commit schrieb `caption`
  schon immer, nur sehen konnte man sie vorher nirgends.
- Nach dem Login zeigt der Admin einen Toast, wenn seit dem letzten Hinweis neue Einsendungen
  eingegangen sind, mit „Ansehen" direkt in die Moderation (`NewContributionsNotice`, neuer
  Endpunkt `GET /api/admin/contributions/summary`). Gemerkt wird pro Browser in localStorage, ein
  Fokus auf den Tab nach mehr als fünf Minuten fragt erneut.
- Doku: [contribute → into the media database](../features/contribute.md#into-the-media-database).
