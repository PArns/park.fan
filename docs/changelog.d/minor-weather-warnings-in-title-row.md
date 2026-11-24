### Geringe Wetterwarnungen stehen in der Zeile „Heute im Park“ und klappen erst auf Klick auf

Eine amtliche Warnung der Stufe „Gering“ (DWD und MeteoAlarm: `severity: "Minor"`, etwa Frost über
Nacht) stand als eigener Streifen über der Kopfkarte jeder Parkseite: 126 px hoch auf dem Desktop,
150 px auf dem Handy, und sie kam erst nach dem Mount, schob die Seite also nach dem ersten Paint
nach unten. Jetzt steht sie als eine Zeile im Titelstreifen der Karte, so wie schon der
Regen-Hinweis: `MinorWarningToggle` zeigt die Überschrift der Warnung („Amtliche WARNUNG vor FROST“,
mit „+1“ für jede weitere), ein Klick öffnet sie unter der Zeile, gleich mit Text und Hinweis.
Warnungen ab „Mäßig“ bleiben der Streifen oben.

`useParkWeatherWarnings` liest die Warnungen aus der geteilten Nowcast-Abfrage, filtert auf die
Öffnungszeiten und trennt nach `isMinorWarning`; eine Warnung ohne Stufe zählt nicht als gering.
`WeatherWarningBanner` zeigt nur noch die Warnungen, die es bekommt. Die Pille des Regen-Hinweises
und die neue sind ein `TitleRowToggle`. Die Überschrift einer Warnung ist im Streifen ein `h2` und
unter der Zeile ein `h3`; das `h3` direkt unter dem `h1` ließ `pnpm check:semantic-html` heute auf
drei Seiten scheitern (Wartezeiten-Kalender von Europa-Park, Statistik- und Kinderseite von
Phantasialand).
