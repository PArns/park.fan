### Die Entwicklerseite ist weg, und unter dem letzten Band steht kein dunkler Streifen mehr

`/developers` gibt es nicht mehr. Alle sechs Sprachversionen leiten mit 308 auf die API-Referenz unter `api.park.fan/api` weiter, und die Seite steht weder in der Sitemap noch im Footer.

Auf der besten Reisezeit, bei Fancast, im Tagesplaner und auf „So funktioniert park.fan“ hatte der Block um das Schlussband „Nächste Schritte“ noch 56 px (ab `sm` 80 px) Innenabstand nach unten. Zwischen Band und Footer stand dadurch ein leerer dunkler Streifen. Das Band schließt jetzt direkt an den Footer an.

`pnpm check:prose` schlägt jetzt auch fehl, wenn etwas „eine Zahl zeigt“ oder eine Zahl selbst etwas tut („die Zahl zeigt“, „die Zahl steht dafür“), in allen sechs Sprachen.
