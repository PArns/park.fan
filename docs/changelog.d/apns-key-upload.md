### Admin: der APNs-Schlüssel für Push an die iOS-App wird hochgeladen

Neue Seite `/admin/push` („Push (iOS)“ unter Betrieb, nur für Owner). Der Owner zieht Apples
`AuthKey_<Key-ID>.p8` auf die Seite, die API speichert den Schlüssel verschlüsselt und nutzt ihn
ab der nächsten Mitteilung, ohne Umgebungsvariable und ohne Neustart. Die Key ID liest die API aus
dem Dateinamen, Team ID und Bundle-ID sind mit denen der App vorbelegt. Oben steht der Status: Key
ID, Team ID, Bundle-ID, Fingerabdruck, wer wann hochgeladen hat, und Apples Antwort für Produktion
und Sandbox als Satz mit Farbe. „Erneut prüfen“ fragt Apple noch einmal, ohne ein Gerät zu
erreichen, „Testmitteilung senden“ schickt eine Mitteilung an eines der 50 zuletzt angemeldeten
Geräte, „Schlüssel entfernen“ löscht ihn nach Rückfrage.

Der Inhalt der Datei liegt nur in einem Ref, nie im State oder im DOM, und wird vor der Antwort
verworfen. Ein Zertifikat (`.p12`, `.cer`) und eine Datei über 4096 Bytes lehnt die Seite ab, bevor
sie gelesen wird. Antwortet die API mit 404, weil sie die Routen noch nicht hat, sagt die Seite
das, statt einen Fehler zu zeigen. `lib/admin/apns.ts` hält die Formen und die Prüfungen,
`pnpm test:admin-apns` prüft sie in 5 Fällen. Die Seite beschreibt
[der Admin](../features/admin.md#push-ios-adminpush).
