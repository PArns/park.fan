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

**Der Stempel.** `ParkyStamp` drückt Parkys Urteil als Gummistempel auf, und nur dort, wo es mehr
sagt als die Zahl daneben. Parky schaut über die Oberkante und hält sich mit beiden Händen daran
fest, etwa halb so breit wie ein kurzes Etikett; der Stempel kommt einmal mit Schwung und unter
reduzierter Bewegung gar nicht. Ein Druck darauf fragt Parky nach der Fahrt oder dem Tag.

Auf der Parkseite trägt eine Fahrtkarte „Walk-on!“, wenn die Fahrt live höchstens so lange wartet
wie Parkys Walk-on-Grenze (`LIVE_LIMITS`) und sonst mindestens 20 Minuten hat (`baseline`,
`STAMP_MIN_USUAL`). `standoutRides` entscheidet das einmal für den ganzen Park: Stechen mehr als
drei Fahrten so heraus (`STANDOUT_MAX`), ist der Park einfach leer, das sagen die Andrang-Badges
schon, und keine Karte bekommt den Stempel. Er sitzt halb auf der Naht zwischen Foto und
Wartezeit-Panel, rechts unter den Knöpfen; die Badges lassen ihm die Ecke frei
(`PARKY_CORNER`), und das obere Panel ist dann mindestens 104 px hoch.

Auf der Seite einer Fahrt steht er neben der Live-Wartezeit in „Wartezeit jetzt“
(`RideNowPanel`), gemessen am Üblichen zu dieser Stunde darunter: „Walk-on!“, und „Jetzt hin!“,
wenn die gezeigte Wartezeit höchstens halb so lang ist (`rideStampVerdict`), beides nur bei
Fahrten, die um diese Uhrzeit sonst mindestens 20 Minuten haben. Dazu kommt das Urteil im
Kalender. Parkkarten haben keinen Stempel: Sehr wenig Andrang zeigt dort schon die Badge.

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
