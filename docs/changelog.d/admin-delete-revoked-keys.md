### Widerrufene API-Keys lassen sich im Admin löschen

Ein widerrufener Daten-Key blieb für immer in der Liste unter `/admin/api-keys`, mit nichts als
seinem Statistik-Knopf. Jetzt trägt seine Zeile den Papierkorb, wo bei einem aktiven Key der
Widerruf sitzt („… löschen“), hinter einem `ConfirmDialog`; `POST /v1/admin/api-keys/:id/delete`
entfernt den Key mit seiner Statistik, die Zeile verschwindet mit dem nächsten Laden der Liste. Die
API lehnt einen aktiven Key mit 409 ab, ein Key wird also immer erst widerrufen; unter „Änderungen“
bleibt er verzeichnet (`api-key.delete`). Die drei Zeilenaktionen teilen sich in
`app/admin/api-keys/page.tsx` einen Aufruf mit Toast statt drei Kopien
([Admin](../features/admin.md#data-api-keys-adminapi-keys)).
