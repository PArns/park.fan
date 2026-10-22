### SEO: Glossar-Bahnlisten vollständig, Kalender- und Kinderseiten mit den Suchwörtern im Titel, eine H1 auf der Startseite

`GlossaryTermRides` zeigte nach drei Highlights und zwölf Bahnen nur „… und N weitere“ als Text ohne Link. Bei der Holzachterbahn waren damit 43 von 58 Bahnen von ihrer eigenen Begriffsseite aus nicht erreichbar. Der Rest steht jetzt eingeklappt in einem `<details>` und ist im vorgerenderten HTML verlinkt. Die Überschrift der Liste hängt an der Kategorie des Begriffs (`glossary.rides.titles.*`): Bahntyp, Hersteller, Figur oder Attraktionsart statt bei jedem Begriff „Bahnen mit dieser Figur“. 152 der 274 Begriffe listen Bahnen.

Der Titel des Wartezeiten-Kalenders nennt die Wörter, mit denen ein Monat gesucht wird: „Crowd Calendar“, „affluence“, „drukte“, „afluencia“, „affluenza“ und auf Deutsch „Öffnungszeiten“, die der Kalender seit 2.16.0 je Tag zeigt. `fitWithin` hat dafür drei Stufen, die dritte (`metaTitleBare`) ist der bisherige Kurztitel und hält lange Parknamen unter 60 Zeichen. Nachgerechnet für alle 211 Parks in sechs Sprachen mit September als längstem Monat: kein Titel über 60 Zeichen. Die H1 bleibt „Wartezeiten im …“.

Die Seite „Mit Kindern“ nennt die Mindestgröße in Titel und H1 (`Europa-Park mit Kindern: Mindestgröße je Fahrt`, H1 `Europa-Park – Mindestgrößen für Kinder`), das Wort, mit dem die Frage gesucht wird.

Der Suspense-Fallback des Startseiten-Heros rendert seine Überschrift als `<p>` mit derselben Box (`HeroWithNearby` mit `isFallback`). Bis der Stream sie austauscht, stehen beide Kopien im Dokument, und das Roh-HTML trug zwei gleiche `<h1>`.

`docs/product/personas-and-scenarios.md` ist für G1 (`indoorOutdoor`, Regenfilter), G4 (Installieren-Button), G6 (`/compare`) und die Zeilen zu P2 und P6 auf den Stand vom 22.10. gebracht.
