### Der Wartezeiten-Kalender zeigt die Saisons eines Parks

Ein Tag, an dem eine kuratierte Saison des Parks läuft, trägt neben dem Status-Wort das Symbol ihrer
Art: Halloween einen Geist, Weihnachten eine Tanne, eine Wintersaison eine Schneeflocke,
Sommernächte einen Mond, eine Sonderveranstaltung Funken. `opening`, `closure` und `maintenance`
markieren keinen Tag, denn das zeigen schon die offenen und geschlossenen Tage und der Wartungs-Chip.
Eine Saison mit einzelnen `dates` steht nur an diesen Tagen, eine abgesagte an keinem. Läuft eine
Saison mehr als den halben Monat oder ist sie nur `expected`, steht das Symbol ohne Chip in der
Farbe der Zeile, damit ein Monat Wintertraum die Andrangsfarben nicht überdeckt. Die Seite liest die
Saisons des gezeigten Monats mit dem Monat als Fenster, weil die Liste des Parks erst heute beginnt,
und rechnet `seasonDaysOfMonth` (`lib/parks/park-season-days.ts`) einmal auf dem Server: Kachel,
Tagesdialog und Legende lesen denselben Datensatz, und die Legende nennt nur die Symbole des Monats.
Der Tagesdialog nennt die Saison mit Namen, Status, wenn er nicht `confirmed` ist, eigenem Ticket
und Uhrzeiten, in derselben Zeile wie die Saison-Karte des Parks (`SeasonHeadline`).
`SEASON_KIND_ICON` (`components/parks/season-kind-icon.tsx`) ist die eine Zuordnung von Art zu
Symbol; die neue Art `winter` hat ihr Label in sechs Sprachen. Die Event-Bahnen der Hub-Seiten lesen
dieselbe Regel (`isSeasonEvent`), und `get_park_best_days` nennt je Tag die Saisons
([Wartezeiten-Kalender](../features/crowd-calendar.md)).
