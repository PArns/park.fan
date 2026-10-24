### SEO: Guides auf Park- und Bahnseiten sichtbar, Glossar-Bahnlisten vollständig, Suchwörter in Kalender- und Kinderseiten-Titeln, eine H1 auf der Startseite

`GlossaryTermRides` zeigte nach drei Highlights und zwölf Bahnen nur „… und N weitere“ als Text ohne Link. Bei der Holzachterbahn waren damit 43 von 58 Bahnen von ihrer eigenen Begriffsseite aus nicht erreichbar. Der Rest steht jetzt eingeklappt in einem `<details>` und ist im vorgerenderten HTML verlinkt. Die Überschrift der Liste hängt an der Kategorie des Begriffs (`glossary.rides.titles.*`): Bahntyp, Hersteller, Figur oder Attraktionsart statt bei jedem Begriff „Bahnen mit dieser Figur“. 152 der 274 Begriffe listen Bahnen.

Der Titel des Wartezeiten-Kalenders nennt die Wörter, mit denen ein Monat gesucht wird: „Crowd Calendar“, „affluence“, „drukte“, „afluencia“, „affluenza“ und auf Deutsch „Öffnungszeiten“, die der Kalender seit 2.16.0 je Tag zeigt. `fitWithin` hat dafür drei Stufen, die dritte (`metaTitleBare`) ist der bisherige Kurztitel und hält lange Parknamen unter 60 Zeichen. Nachgerechnet für alle 211 Parks in sechs Sprachen mit September als längstem Monat: kein Titel über 60 Zeichen. Die H1 bleibt „Wartezeiten im …“.

Die Seite „Mit Kindern“ nennt die Mindestgröße in Titel und H1 (`Europa-Park mit Kindern: Mindestgröße je Fahrt`, H1 `Europa-Park – Mindestgrößen für Kinder`), das Wort, mit dem die Frage gesucht wird.

Der Suspense-Fallback des Startseiten-Heros rendert seine Überschrift als `<p>` mit derselben Box (`HeroWithNearby` mit `isFallback`). Bis der Stream sie austauscht, stehen beide Kopien im Dokument, und das Roh-HTML trug zwei gleiche `<h1>`.

`docs/product/personas-and-scenarios.md` ist für G1 (`indoorOutdoor`, Regenfilter), G4 (Installieren-Button), G6 (`/compare`) und die Zeilen zu P2 und P6 auf den Stand vom 22.10. gebracht.

Die Parkseite zeigt unter den drei Beitragskarten jetzt jeden Beitrag, dessen eigene Konfiguration den Park nennt (`parkLinks`, `relatedParks`) und der im Raster keinen Platz mehr hat, als kompakte Zeilen auf der Karte, auf der auch die News stehen („Weitere Guides“, `getRankedPostsForPark` in `lib/blog/backlinks.ts`). Vorher entschied bei gleichem Score das Datum über die drei Plätze: der Jahreskarten-Guide stand auf keiner seiner vier Parkseiten, der Schulferien-Guide auf keiner seiner sechs. `BOXED_ROW_CLASS` und `ROW_LABEL_CLASS` kommen aus `news-row.tsx`, damit beide Zeilen gleich aussehen.

Der Halloween- und der Winter-Guide nennen ihre 14 Parks in `parkLinks`, in allen sechs Sprachen dieselbe Liste. Ohne sie lagen sie als bloße Erwähnung hinter jedem konfigurierten Beitrag; gemessen stand der Halloween-Guide auf 2 von 14 Parkseiten, im Movie Park während des Halloween Horror Festivals nicht. `docs/rules/parkride-page-and-blog-link.md` behauptete „auf allen zehn Parkseiten“ und ist korrigiert.

Auf einer Bahnseite mit Single-Rider-Schlange verlinkt die FAQ-Antwort den Single-Rider-Guide, mit fertigem Sprachpfad (`getPathname`). Das JSON-LD behält die reine Antwort. Die FAQ-Einträge tragen dafür einen festen `key`, der Guide kommt aus `getGuideForTopic` (`lib/blog/country-guide.ts`, neben den Länder-Guides).
