### „Walk-on“ nur noch bis fünf Minuten, und park.fan-Links öffnen die iPhone-App

#### Eine gemeldete 13 heißt „13 Min“

Disney und Efteling melden 13 Minuten als ihr Zeichen für „ohne Anstehen“, und `isWalkOnWait`
(`lib/utils/wait-time.ts`) zählte das als Walk-on. Eine Karte sagte dann „Walk-on“ neben „jetzt
13 Min“, und das ist Park-Jargon, den ein Besucher nicht kennt. Jetzt ist ein Walk-on nur eine
Wartezeit von höchstens fünf Minuten (`WALK_ON_MAX_MINUTES`), überall: Karten, Hero-Rail,
Parkys Stempel und seine Live-Zeile (`LIVE_LIMITS.walkOn` war 10 und ist jetzt dieselbe Grenze).
Eine 13 bleibt die 13, die der Park meldet (`roundWaitTo5`), und bekommt die Farbe einer 15
(`waitTimeCrowdTier` gibt `low`). `pnpm test:typical-waits` und `pnpm test:assistant` prüfen 5,
6, 10 und 13.

#### `/.well-known/apple-app-site-association`

Ein park.fan-Link öffnete die App nie. Die Datei (`lib/apple-app-site-association.ts`) nennt die
Seiten, für die die App einen Bildschirm hat, mit und ohne Sprachpräfix, und schließt API, Admin,
Konto, Login, Rankings, Markenseiten, Listen-Seiten und geteilte Reisepläne vorher aus.
`application/json`, ohne Umleitung, ohne Sprachpräfix. `pnpm test:app-site-association` liest
sie so, wie iOS sie liest. Hintergrund:
[Universal Links](../architecture/routing-and-urls.md#universal-links-for-the-ios-app).
