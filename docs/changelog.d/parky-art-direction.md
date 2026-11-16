### Parky wird leiser, wo man liest, und sagt etwas, wo man entscheidet

In den 30 Tagen bis zum 2026-11-16 zeigte Parky 14.174 ungefragte Sprüche, 19 wurden geklickt. Auf
dem Wartezeiten-Kalender, der Seite mit den meisten Parky-Aufrufen (4.720), öffneten ihn zehn
Leute. Er stand neben den Daten, statt etwas zu ihnen zu sagen. Diese Version dreht das um.

**Leiser.** Den Auftritt (Huschen, Fallen, Rollen, Spähen, Aufploppen) macht Parky nur noch beim
ersten Seitenaufruf einer Sitzung (`pageEntrance`, `parkfan:parky-entered`); danach blendet er
nur ein. Auf Guides, News und Glossar bleiben seine Tricks, die Fahrten und die Airtime, die über
seine Ecke in den Text steigen, fallen dort weg (`quiet`, `quietShowy`).

**Parkys Tipp im Kalender.** Der Tagesdialog des Wartezeiten-Kalenders zeigt oben einen Satz von
Parky zum Tag, den die API von Claude aus dem Kalender rund um den Tag schreiben lässt
(`…/parky-tip`, zwölf Stunden in Redis, sechs im CDN), dazu sein Urteil als Stempel: „Top-Tag!“,
„Geht so“, „Lieber nicht“. Das Urteil kommt aus der Andrangsstufe, nicht vom Modell. Ein Druck
auf die Karte schließt den Dialog und gibt Parky den Tipp als Frage mit. Nur wo Parky für den
Besucher freigeschaltet ist und nur von park.fans eigenen Seiten (`isForecastRelayPath`).

**Der Stempel.** `ParkyStamp` drückt Parkys Urteil als Gummistempel auf: „Walk-on!“ auf einer
Fahrt, die live höchstens so lange wartet wie Parkys eigene Walk-on-Grenze (`LIVE_LIMITS`), „Kaum
was los!“ auf einem geöffneten Park mit sehr niedrigem Andrang, und das Urteil im Kalender. Parky
schaut über die Oberkante und hält sich mit beiden Händen daran fest, etwa halb so breit wie ein
kurzes Etikett; der Stempel kommt einmal mit Schwung und unter reduzierter Bewegung gar nicht. Auf den Karten fragt ein Druck Parky nach der Fahrt oder dem Park. Auf der
Seite einer Fahrt steht er neben der Live-Wartezeit in „Wartezeit jetzt“ (`RideNowPanel`): dort
„Walk-on!“ wie auf der Karte und „Jetzt hin!“, wenn die gezeigte Wartezeit höchstens halb so lang
ist wie das Übliche zu dieser Stunde darunter (`rideStampVerdict`). Die Karten in der Liste
stempeln nur den Walk-on.

**Parky in leeren Zuständen.** 404, Fehlerseite, leere Favoriten, Suche ohne Treffer und die
Wartungsseite zeigen statt eines Icons einen stillen Parky (`ParkyPose`: verlaufen mit der Karte
falsch herum, schwindlig, verliebt, mit der Lupe, schlafend) und einen Satz von ihm. Außer bei der
Wartung fragt „Frag Parky“ ihn nach der Lage, die 404 mit dem gesuchten Pfad, die Suche mit dem
Suchbegriff.

**„Parky sagt“ in Posts.** Ein Callout `> [!PARKY]` setzt einen Tipp in Parkys Stimme als
Glaskarte mit stillem Parky in einen Post, mit „Frag Parky dazu“. Er steht in den elf
meistgelesenen Guides und News, in allen sechs Sprachen, ohne neues `updatedAt`. Syntax und Regeln
in `content/blog/README.md`.

**Parky auf den Share-Bildern.** Jedes OG-Bild trägt Parky neben dem Schriftzug, das von `/parky`
ihn groß (`OgParky`, `lib/og/parky-mark.tsx`, `forSatori` macht aus `oklch()` Hex).

**Gezählt.** Alles, was Parky eine Frage mitgibt, öffnet ihn mit `source` `stamp`, `tip` oder
`empty` und schickt die Frage als `context`. Neu ist `assistant_link_clicked`: ob jemand einem Link
in Parkys Antwort folgt, mit dem Seitentyp des Ziels.
