### `/app` stellt die iPhone-App mit ihren Bildschirmen vor, in sechs Sprachen und indexiert

Die Seite war eine Hilfeseite auf Deutsch und Englisch nach dem Muster des Impressums, mit
`noindex`. Jetzt ist sie ein Hub (`LandingHero` über dem Wintertraum-Foto des Phantasialands): fünf
Kapitel zu Kalender und Planer, dem Park, Sperrbildschirm und Mitteilungen, Parky und dem Rest,
jedes neben einer echten Aufnahme der App in einem gezeichneten Telefon, dann die Hilfe (was du
brauchst, vier Fragen, Kontakt, Impressum), die Support-URL im App Store bleibt. Die Texte stehen in
`appPage` in allen sechs Katalogen, `appSupport` und `content/de.tsx`, `content/en.tsx` sind weg.
Die Seite steht in der Sitemap und in `pnpm check:landing-pages`.

Die Aufnahmen liegen in der Mediendatenbank unter `public/media/app/<sprache>/<szene>.webp`, je
1080 px breit, 55 bis 125 KB, mit dem `alt` im Sidecar. Heute sind es die Szenen 04, 05, 07 und 09
aus dem Store-Kit; 01, 02, 03, 06 und 08 erscheinen, sobald ihre zwei Dateien im Ordner liegen.
`PhoneShot` und `ShotRow` nehmen dafür `size`: eine Aufnahme des ganzen Bildschirms mit eigener
Statusleiste, über die kein Balken gezeichnet wird.

Solange die App nicht im App Store ist, sagt der Kopf „Im Beta-Test über TestFlight, bald im App
Store“ und hat keinen Button. `APP_STORE_ID` und `TESTFLIGHT_URL` in `app/[locale]/app/page.tsx`
schalten den Button und Safaris Smart App Banner ein.
