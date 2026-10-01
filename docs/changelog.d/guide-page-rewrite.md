### „So funktioniert park.fan“: kürzer, für Besucher statt über Interna

- `app/[locale]/how-park-fan-works/content/<locale>.tsx` in allen sechs Sprachen überarbeitet.
  Raus sind die Schwellen der Auslastungsstufen (60, 89, 110, 150, 200 %), die drei Regeln, nach
  denen eine Stunde im Stundenprofil zur Spalte wird, die Kette Mehrheit, Median, Mittelwert für
  widersprüchliche Quellen, die Begründung der Reihenfolge der Nachtjobs, die 330
  Beobachtungstage vor einer Saisonangabe, die Umstiegsformel im Planer-Kapitel, der Absatz über
  Messtage im Statistik-Abschnitt und die meisten Beispielzeilen im Rundgang über die Parkseite.
- Das Kapitel „Vier Besuche“ ist gestrichen, seine Schritte wiederholten meist die Kapitel 01
  bis 05. Was nur dort stand, steht jetzt im Wegweiser (neue Kachel „Körpergröße“, Nahansicht im
  Park, Favoriten auf der Startseite, Parkführer im Blog). Zehn Kapitel statt elf,
  `HOWTO_CHAPTERS` in `lib/howto/chapters.ts` entsprechend; `pnpm test:hub-chapters` grün.
- Zwei Aussagen widersprachen sich: Kapitel 04 nannte Gelderland als bestimmenden
  Ferieneintrag des Phantasialands, der Rundgang Nordrhein-Westfalen. Beides war ein Stand von
  verschiedenen Tagen; jetzt steht dort, dass beide im Kalender vorkommen.
- Deutscher Fließtext von rund 4.000 auf rund 2.200 Wörter.
- Doku: [the guide page](../features/how-park-fan-works.md).
