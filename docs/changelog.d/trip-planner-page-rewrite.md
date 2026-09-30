### Tagesplaner-Seite: der Text beschreibt, was man mit dem Planer macht, nicht wie er rechnet

- `app/[locale]/trip-planner/content/<locale>.tsx` in allen sechs Sprachen neu geschrieben. Der
  Artikel erklärte die Innereien: die Umstiegsformel (Luftlinie, drei Minuten Ausstieg, zwei
  Drittel Umweg), die vier Sortierregeln in ihrer Rangfolge, die Zwei-Stunden-Grenze einer
  vorgeschlagenen Pause und warum eine hochgerechnete Show um 19 Uhr auf einer Zeitleiste fehlt,
  die um 18 Uhr endet. Jetzt steht dort, was ein Besucher sieht und tun kann.
- Sechs Kapitel statt acht (Deutsch) bzw. sieben (die anderen fünf): Blöcke und Umstiege mit der
  Demo, woher die Wartezeiten kommen, Mindestgröße und Wasserbahnen, Öffnungszeiten mit Shows
  und Pausen, die beiden Sortier-Knöpfe mit dem Assistenten für zu volle Tage, und der Tag im
  Park (abhaken, Benachrichtigungen, wo der Plan liegt). Neu erwähnt sind der Assistent, zwei
  Tage nebeneinander, eigene Blöcke, Warnungen bei geschlossenen Bahnen und der geteilte Link.
- Das Kapitel „Gruppe“ gab es nur auf Deutsch; jetzt steht es in allen sechs Sprachen. Deutscher
  Fließtext von rund 1.450 auf rund 820 Wörter.
- `CHAPTER_COUNT` in `scripts/check-planner.mjs` von 7 auf 6. Mit dem achten deutschen Kapitel
  war die Prüfung „die Seite erklärt sich in 7 Kapiteln“ auf `/de/tagesplaner` schon rot.
- Doku: [trip planner → the page explains itself](../features/trip-planner.md#the-page-explains-itself-with-the-planners-own-components).
