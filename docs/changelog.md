# Changelog / Recent Updates

Short log of notable changes; details live in the linked docs.

**No pull request writes here.** A pull request writes its section as a fragment,
`docs/changelog.d/PAR-<n>.md` ([format](changelog.d/README.md)), so two of them never edit the same
lines. When the PO cuts a version, `pnpm release:cut` folds the fragments in under the version's
heading, and the same pull request writes the public entry in `content/changelog/<version>.md`.
`pnpm check:changelog` fails on an `## Unreleased` section here and on a cut done by half. Rules:
[a-version-is-a-unit-of-communication.md](rules/a-version-is-a-unit-of-communication.md).

---

## 2.15.0 (2026-10-06) – Shows im Tagesplaner, der ruhigste Tag je Favorit und die App im Footer

Geschnitten am 2026-10-06 aus 61 Fragmenten in `docs/changelog.d/`. Der öffentliche Eintrag ist `content/changelog/2.15.0.md`. Neueste Abschnitte zuerst.

### Planer: nach einer Show wird weder Ausgang noch Fahrt gerechnet, und eine Show ohne Koordinaten hat überall dieselbe Untergrenze

`transferBetween()` (`lib/planner/leg.ts`) addierte `EXIT_MIN` und die Fahrtzeit auch dann, wenn das Leg an einer Show oder einem freien Block begann. Jetzt gilt der Aufschlag nur noch, wenn das Leg an einer Bahn beginnt (`TransferEnds`, `isBlockEntry`). Ein Block ohne Position hat keinen Weg: nach ihm gilt 0 Min Untergrenze und Obergrenze, vor ihm bleibt es bei `EXIT_MIN` + Fahrtzeit (8 Min Untergrenze, ebenfalls 8 Min Obergrenze). Optimizer, `clashCount()` und Leg-Chip lesen damit dieselbe Zahl.

Gemessen am Paar Show ohne Koordinaten → Bahn: Untergrenze 8 → 0 Min, Obergrenze 11 → 0 Min. Show mit Position 1,5 km entfernt → Bahn: Untergrenze 25 → 17 Min, Obergrenze 49 → 41 Min. Bahn → Bahn bleibt bei 10 / 11 Min.

### `HourlyForecastItem.confidence` ist `number | null`

Die API liefert `hourlyForecast[].confidence` seit Backend-PR #408 als `null`, wenn der Slot mehr als 24 h nach der Antwort liegt. `HourlyForecastItem.confidence` in `lib/api/types.ts` stand auf `number`. Der Typ ist jetzt `number | null`, der Kommentar nennt die 24-h-Grenze. Kein Leser im Frontend, das Verhalten ändert sich nicht.

### Eine Abweichung in `lib/media/**` fällt in der CI auf

`lib/media/manifest-parks.ts` war über Wochen von seinem Generator abgewichen, ohne dass etwas rot
wurde (PAR-667). `.github/workflows/checks.yml` hat jetzt den Job `media-drift`: Er führt
`pnpm generate:media` aus (1,6 s, der Rest von `prebuild` bleibt draußen: Crops 27,0 s, OG-Karten
3,4 s) und danach `git diff --exit-code -- lib/media`. Bei einer Abweichung nennt er die Dateien per
`git diff --stat`. Der Job ist ein eigener Check und kein Teil von `lint-and-format`, damit eine
Umbenennung upstream keinen fremden PR blockiert. Ist `api.park.fan` nicht erreichbar, endet er mit
einer Warnung statt mit einem Grün, das nichts gemessen hat.

### Tagesplaner: der Weg zu einer Show und von ihr weg zählt in die Rechnung

Eine eingeplante Show mit Koordinaten (`PlanDayShow.latitude`/`longitude`, auf Europa-Park 40 von 40 Shows am 2026-10-10) geht in dieselbe Wegrechnung ein wie eine Bahn. `lib/planner/leg.ts` liest die Position über `entryPlace()` und rechnet mit `transferBetween()` wie zwischen zwei Bahnen. Die Leg-Chips im Raster (`planner-day-grid.tsx`), `clashCount()` und der Optimizer (`clearFixed()`, `isExecutable()` in `optimize.ts`) benutzen für Shows mit Koordinaten dieselbe Zahl. Der Optimizer plant gegen die Obergrenze, der Check gegen die Untergrenze.

Gemessen an einem Tag mit fünf Headlinern à 55 Minuten und einer Show um 09:00, die 1,5 km von den Bahnen entfernt liegt: Die erste Bahn danach startet um 10:15 statt um 09:30 (44 Minuten Obergrenze: 3 Ausgang, 5 Fahrt, 36 Weg). Der Tag, der ohne Weg alle fünf Bahnen aufnahm, nimmt jetzt vier auf, und der Fit-Assistent öffnet sich.

Eine Show ohne Koordinaten verhält sich unverändert. `pnpm test:planner-fit` deckt beide Fälle ab (14a bis 14f).

### Die Entwicklerseite ist weg, und unter dem letzten Band steht kein dunkler Streifen mehr

`/developers` gibt es nicht mehr. Alle sechs Sprachversionen leiten mit 308 auf die API-Referenz unter `api.park.fan/api` weiter, und die Seite steht weder in der Sitemap noch im Footer.

Auf der besten Reisezeit, bei Fancast, im Tagesplaner und auf „So funktioniert park.fan“ hatte der Block um das Schlussband „Nächste Schritte“ noch 56 px (ab `sm` 80 px) Innenabstand nach unten. Zwischen Band und Footer stand dadurch ein leerer dunkler Streifen. Das Band schließt jetzt direkt an den Footer an.

`pnpm check:prose` schlägt jetzt auch fehl, wenn etwas „eine Zahl zeigt“ oder eine Zahl selbst etwas tut („die Zahl zeigt“, „die Zahl steht dafür“), in allen sechs Sprachen.

### Die Monatstabelle schneidet auf dem Handy keine Zahl mehr ab

In `ParkStatsCrowdCard` (der `stats-widget show=months` im Blog, die Monats- und Wochentagstabellen auf der Parkseite) sind Monatsname, Badge und Werte alle `shrink-0`. Eine Zeile mit „SEHR NIEDRIG“ und „Spitze“ braucht bis zu 351 px, die Liste ist bei 320 px Fensterbreite 246 px breit, bei 360 px 286 und bei 390 px 316. Die Zeile lief aus der Zelle, und das `overflow-hidden` des Panels schnitt den Spitzenwert ab: im Europa-Park-Guide bei 360 px auf Deutsch um 48 px, bei 320 px in allen sechs Sprachen alle elf Zeilen, die längste um 54 bis 88 px.

Die Liste ist jetzt selbst ein Container, und die Zeile richtet sich nach deren Breite statt nach der des Fensters. Unter 22rem stehen die Werte in einer zweiten Zeile unter dem Badge, „Typisch“ erscheint ab 30rem statt ab `sm:`, die Zahl der Messtage ab 34rem statt ab 768 px Seitenbreite. Auf der Parkseite liegen ab 640 px zwei dieser Listen nebeneinander, dort stand „Typisch“ vorher in einer 263 px breiten Liste. Gemessen mit Playwright gegen `pnpm build && pnpm start`: im Guide bei 320, 360 und 390 px in allen sechs Sprachen 0 überstehende Zeilen (vorher 11, 2 bis 5 und 0 bis 2), auf der Parkseite von 360 bis 1920 px ebenfalls 0.

### „ob der Tag aufgeht“ ist ein Fehler in `pnpm check:prose`

`scripts/check-prose.mjs` meldet „ob der Tag (so) aufgeht“, „geht der Tag auf“ und die fünf Übersetzungen, die die Floskel mitgenommen hatte (`whether the day adds up`, `of de dag klopt`/`uitkomt`, `si la journée tient debout`, `si el día cuadra`/`sale`, `se la giornata regge`/`sta in piedi`), als Fehler auf jeder Oberfläche (`DAY_WORKS_OUT` in `hardRules()`); `docs/blog.md` §3.3 führt sie als Regel 9. Der erste Lauf fand 18 Fehler: `planner.page.lead` und `landing.bestTime.next.body` in allen sechs Katalogen, dazu Beschreibung und Einleitung des Tagesplaner-Beitrags in sechs Sprachen. Sie sagen jetzt, was der Planer zeigt: ob alle Bahnen vor Parkschluss drankommen. Danach 0 Fehler und 18 Warnungen wie vorher. Summen bleiben frei (`a day that adds up to a lot of empty seats`, `el segundo día sale por 60 €`).

### Meine Favoriten: die Seite steht ab dem ersten HTML in der Höhe der Liste

`/favorites` war vorgerendert und kannte das Cookie nicht. Das erste HTML zeigte deshalb den Kasten des leeren Zustands (136 px), nach der Hydration kam ein Skelett mit drei Karten ohne die Zeile „ruhigster Tag“ darunter, ohne den Standorthinweis und mit einem 24-px-Balken statt der 28-px-Überschrift, dann die Karten über einen `LazyMount`-Platzhalter mit 244-px-Zeilen. Mit drei Parks wuchs der Bereich auf dem Handy 136 → 436 → 616 px, und die Anleitung darunter und der Footer sprangen jedes Mal mit.

Die Seite liest das Cookie jetzt auf dem Server (`parseFavoritesCookie`, `countFavorites` in `lib/utils/favorites.ts`) und rendert pro Anfrage. `FavoritesSection` bekommt die Zahlen als `initialCounts` und zeichnet schon im ersten HTML das Skelett in der Größe der Liste. Das Skelett trägt die echte Gruppenüberschrift, den Standorthinweis und auf `/favorites` je Park die 28-px-Zeile, und `LazyMount` mountet dort sofort. Gemessen 616 px auf dem Handy und 562 px auf dem Desktop, im ersten HTML wie nach dem Laden. `measure-cls.mjs` schickt die `--cookie`-Werte jetzt auch mit den eigenen Anfragen des Replays, sonst misst es eine Seite, die das Cookie nie gesehen hat.

`pnpm measure:cls --late` mit Heide Park, Phantasialand und Europa-Park, y=0: Handy 0,4214 → 0, Desktop 0,1902 → 0. Offen bleibt die Wette des Skeletts auf das Foto: Eine Liste nur aus Parks ohne Foto schrumpft auf dem Desktop einmal um 221 px (Heide Park allein: 0,0728).

### Mitmachen: Schritt 4 hält den Platz für die Turnstile-Prüfung

Auf `/de/contribute` war der Container von `TurnstileWidget` im ersten HTML leer. Das Turnstile-Skript setzt sein 300 × 65 px großes iframe erst nach der Hydration ein, auf der Grundlinie der Zeile sind das 72 px, und Schritt 4 wuchs mit Abstand um 84 px. Der Absenden-Block und der Footer rutschten bei etwa 1,7 s nach unten. `ContributeForm` gibt dem Widget jetzt `min-h-[72px]`; gemessen gleich im Fehler-, Test- und Challenge-Zustand bei 360, 390 und 1440 px.

`pnpm measure:cls --late`: Handy bei y=2404 von 0,0124 auf 0, Desktop bei y=1569 von 0,0038 auf 0,0019 (der Rest ist eine frühe 20-px-Verschiebung bei 70 ms, die mit Turnstile nichts zu tun hat). Auf dem Stand vor PAR-688, als die Seite länger war, lag dieselbe Verschiebung bei 0,0837 (Handy, y=3015) und 0,0466 (Desktop, y=1612).

### So funktioniert park.fan: die Parkseiten-Anatomie hält die Höhe ihrer Karten

Kapitel 06 der Anleitung (`ParkAnatomy`) wuchs nach der Hydration um 696 px auf dem Handy und 714 px auf dem Desktop, weil vier Demos vor dem Mount nichts zeichnen: `WeatherWarningBanner` wartet auf `useMounted`, `WeatherNowcastBanner` auf die Minutenuhr, `ParkPurchasesCard` auf `useBrowserNow`, und in `ParkTimeInfo` kommt das Countdown-Badge erst mit der Uhr. Die Boxen sind jetzt an den echten Karten gemessen reserviert, bei 360 bis 1440 px in allen sechs Sprachen gleich: Unwetterwarnung 394 px, Regenradar 148 px unter `sm` und 117 px ab `sm`, Skip-the-line-Preise 101 und 149 px, Kopfbereich 316 px. Ab 17:00 UTC hat der Fixture-Park geschlossen, dann bleiben unter dem Kopfbereich 30 px leer. In `AttractionCard` war der Platzhalter der Zeilen „Beste Zeit" und „Rope Drop" `h-3.5` statt der 16 px einer `text-xs`-Zeile, jetzt `h-4`.

Dazu Kapitel 03: Das Skelett von `ParkHourlyProfileCard` stand in 22-px-Abständen, die Tabelle hat einen 28-px-Kopf mit 1 px Linie und 32 px je Bahn, dazu die Fußnote. Das Skelett zeichnet jetzt genau diese Zeilen und hält die Fußnote unsichtbar mit drei Ziffern für die Messtage. Die Karte wuchs auf dem Handy um 135 px, jetzt um 0.

`pnpm measure:cls --late` auf `/de/so-funktioniert-park-fan`: Handy bei y=15328 von 0,9882 auf 0,0118, Desktop bei y=12444 von 0,5507 auf 0,0070.

### „misst sich selbst“ und „bewertet sich selbst“ sind verboten

`scripts/check-prose.mjs` meldet ein Modell, das sich selbst bewertet, als Fehler auf jeder Oberfläche (`SELF_GRADING`, `docs/blog.md` §3.3, Regel 9). Im Deutschen jede Beugung von `messen`, `bewerten` und `benoten` vor `sich … selbst`, mit bis zu drei Wörtern zwischen Verb und `sich` und zwei zwischen `sich` und `selbst`, aber ohne Satzzeichen; dazu die Umstellung `sich selbst bewertet`. `gemessen an sich selbst` bleibt erlaubt. Die anderen fünf Sprachen nur mit ihrem Reflexivpronomen oder der Form, die ausgeliefert war: `measures/grades/rates itself`, `meet/beoordeelt zichzelf`, `se note/se mesure/s'évalue lui-même`, `se autoevalúa`, `se mide a sí mismo`, `si dà i voti`, `si misura da solo`. Der erste Lauf fand 6 Treffer, alle die Unterzeile der Fancast-Seite in sechs Sprachen („und benotet sich dabei öffentlich selbst“). Sie sagt jetzt, was passiert: Am Tag darauf wird jede Prognose mit der gemessenen Wartezeit verglichen, und die durchschnittliche Abweichung in Minuten steht öffentlich auf der Seite. Danach 0 Fehler und 18 Warnungen wie vorher.

### Planer: eine Vorstellung lässt sich als eigener Eintrag einplanen

Der Button „Show einplanen“ (`PlannerShowPicker`, neben „Eigener Block“) listet die Showtimes des Tages, so wie das Raster sie zeichnet, Projektionen mit `~`. Eine gewählte Vorstellung wird als Block mit `showSlug` abgelegt (`addShowEntry`): 30 Minuten, Icon `show`, Startzeit gleich Vorstellung. Der Eintrag ist an die Vorstellung gebunden und nicht ziehbar, nicht nudge- und nicht resizebar; `moveEntry`, `setCustomBlock` und `shiftFrom` lassen ihn liegen, der Optimizer behandelt ihn wie jeden `custom`-Block, und die Fit-Hilfe bietet ihn nicht als Hebel an. Ändern heißt löschen und eine andere Vorstellung wählen. Freie Blöcke mit Icon `show` bleiben unverändert. Die Laufwegsrechnung liest `showSlug` erst in PAR-102.

### Nähe, Favoriten und Beliebte Parks öffnen mit `ChapterHeading`

Die drei Blöcke von `PageBottomSections` unter Blog, News, Artikeln und Glossarbegriffen hatten jeder eine eigene Überschrift: die Glas-Pille `GlassSectionTitle` bei Nähe und Favoriten, ein nacktes `<h2 class="text-xl">` mit Stern bei den beliebten Parks. Alle drei öffnen jetzt mit `ChapterHeading` ohne Nummer, Variante `watermark` wie die Kapitel dieser Seiten, mit dem bisherigen Icon (`MapPin`, `Star`) und dem Einleitungssatz als `hint`. Die Platzhalter rendern dieselbe Überschrift: `NearbyHeading`, `FavoritesHeading` und `FeaturedParksHeading` stehen im Skeleton, im Leerzustand und in der fertigen Liste. Das Skeleton der beliebten Parks zeigt dafür den echten Titel statt grauer Balken; die Texte löst `getFeaturedParksLabels()` vor der Suspense-Grenze auf. Das Skeleton der Nähe-Karte reserviert außerdem den „Mehr anzeigen"-Button, den die Liste unter 768 px Seitenbreite unter zwei Karten zeigt: Am Handy wuchs der Block beim Laden um 80 px (CLS 0,083 am Blog-Index), jetzt um 20 px, die ein zweizeiliger Titel mehr braucht (0,012). Steht man in einem Park, öffnet die Nähe-Ansicht mit `ChapterHeading frosted`, weil sie über dem Parkfoto liegt.

Auf der Startseite stehen Favoriten und Beliebte Parks mit `heading="tile"` zwischen den anderen Kapitel-Kacheln. Die Nähe-Karte bekommt `nested`: `NearbyChapter` öffnet dieses Kapitel schon, die Pille der Karte bleibt und ist dort jetzt ein `<h3>`.

`pnpm check:landing-pages`: Die `OPEN`-Liste ist leer. Die Tagesüberschriften der News-Zeitleiste tragen `data-news-day` und gelten als erlaubter Ort für ein `<h2>`, weil sie eine Zeitleiste gliedern und keine Kapitel sind.

### Favoriten: unter jedem Lieblingspark steht sein ruhigster Tag der nächsten 14 Tage

`FavoriteParkQuietestDay` (`components/parks/favorite-park-quietest-day.tsx`) hängt unter jede Parkkarte auf `/favorites` eine Zeile mit Datum und `CrowdLevelBadge`. Gewählt wird in `quietestOpenDay` (`lib/utils/quietest-day.ts`) der offene Tag mit dem niedrigsten `predictedCrowdLevel` im Fenster heute bis heute + 13 in der Zeitzone des Parks; geschlossene und unbewertete Tage zählen nicht, bei Gleichstand gewinnt der frühere. Die Daten kommen aus `useParkBestDaysCalendar`, also hinter `useLoadLast` und aus demselben Query-Cache wie die Parkseite, ohne neues Backend-Feld. Ein leerer Kasten von 28 px hält die Höhe, bis die Antwort da ist; ein Park ohne bewertbaren Tag zeigt keinen Text, der Kasten bleibt, damit nach dem Laden nichts springt. Startseite und andere Bänder bleiben unverändert (`standalone`). `pnpm test:quietest-day` deckt Fenster, Gleichstand, geschlossene Tage und Jahreswechsel ab (11 Fälle).

### Das Ziel des Planer-Griffs sitzt auf dem Griff statt 22 px daneben

`components/planner/planner-block.tsx`: das 44-px-`::after` des Griffs hatte keine waagerechte Kante und begann bei `left: 22px`. Auf einem Mindestblock hatte die linke Griffhälfte nur 28 px Trefferhöhe, und die Zugleiste war 66 px breit statt 44. `after:left-0` setzt das Ziel auf den Button. `check:planner` zählt jetzt je Spalte (x +6, +25, +40) die Trefferzeilen des Griffs und verlangt dieselbe Höhe in allen drei und keine Zeile bei x +50.

### `hourlyForecast` hat einen eigenen Typ statt `ForecastItem`

`lib/api/types.ts` typisierte `hourlyForecast` als `ForecastItem[]`, die Form der externen Prognose mit `confidencePercentage` und `source`. Die API liefert dort `predictedTime`, `predictedWaitTime`, `confidence`, `uncertaintyMinutes` und `trend` (72 Einträge für Black Mamba, geprüft am Payload vom 2026-10-04). `HourlyForecastItem` nennt diese fünf Felder, `lib/api/favorites.ts` nutzt denselben Typ statt einer eigenen Deklaration, `ForecastItem` bleibt der Typ von `forecasts`. Kein Laufzeitverhalten ändert sich.

### `pnpm check:landing-pages` prüft den Aufbau der Landingpages

Neue Regel `docs/rules/a-landing-page-has-one-anatomy.md` und ein Check dazu, `scripts/check-landing-pages.mjs`. Er lädt die deutsche URL aller elf Seiten aus `docs/product/landing-pages.md` §1 und die englische jedes Hubs, wartet die Hydration ab und prüft je Seite: genau eine `<h1>`, den Kopf ihrer Art (`data-landing-hero="hub"`, `"compact"` oder keinen auf den Park-Unterseiten), genau eine `[data-landing-action]` im Hero eines Hubs (keine auf dem Blog-Index), ein `FAQPage` nur neben einer gerenderten `FaqList` (`data-faq-list`) und kein `<h2>` in `<main>` außerhalb von `ChapterHeading`, einer Karte oder `LandingNextSteps`. Dafür tragen `ChapterHeading`, `GlassCard`, `LandingNextSteps` und `FaqList` jetzt ein Datenattribut, handgebaute Karten (`ParkHeaderCard`, `ContributeBanner`, `PreferredSourcePrompt`, `RightsNotice`) `data-card`.

Der erste Lauf fand acht von 16 Seiten rot. Behoben: Die Beispielgalerie auf Mitmachen öffnet mit `ChapterHeading` ohne Nummer statt mit einem eigenen `<h2>`, und die Überschrift „Wie genau unsere Vorhersagen sind" in `MLStatsSection` ist auf Fancast ein `<h3>`, weil sie im Kapitel 01 steht. Offen und im Check als `open` ausgegeben, weil sie eine Gestaltungsentscheidung brauchen: die drei `<h2>` von `PageBottomSections` unter Blog und News und die Tagesüberschriften der News-Zeitleiste.

### Die Hub-Seiten nennen ihren nächsten Schritt im Kopf

Jeder Hub hat jetzt im ersten Bildschirm genau einen primären Button (`LandingHero` mit `action`, Texte unter `landing.<seite>.action`):

- Beste Reisezeit: „Zum Tagesplaner", auf die Seite des Tagesplaners.
- Tagesplaner: „Einen Tag planen", ein Sprung auf derselben Seite zu `#plan`. Das Ziel ist der Einstieg, der gerade zu sehen ist: ohne Plan der Abschnitt „Noch nichts geplant" mit dem Button „Neuen Tag planen", mit Plänen die Button-Zeile über der Liste. Einen zweiten Weg in den Planer gibt es nicht.
- So funktioniert's: „Park aussuchen", auf `/parks`. Bisher stand der Weg zu einem Park nur im Abschlussband, rund 7.000 px tiefer.
- Fancast: „Crowd-Kalender für deinen Park", auf Kapitel 05 der besten Reisezeit (`#parks`). Fancast nennt keinen einzelnen Park, und dieses Kapitel erklärt den Kalender und listet die Parks, auf denen er steht.
- Blog: kein Button, die Liste ist die Seite.

Fancast und der Tagesplaner schließen jetzt mit `LandingNextSteps` (Fancast: Crowd-Kalender, Alle Parks, So funktioniert's; Tagesplaner: Einen Tag planen, Beste Reisezeit, Alle Parks). Auf der besten Reisezeit steht der Tagesplaner im Abschluss jetzt an erster Stelle, Fancast an zweiter; Titel und Text des Bands kommen aus `landing.bestTime.next` statt aus den sechs Inhaltsdateien.

Der Kicker heißt auf jedem Hub `PARK.FAN · <THEMA>`: Tagesplaner und Blog hatten kein Präfix (`landing.planner.kicker`, `landing.blog.kicker`; `planner.page.kicker` ist entfallen). Die beste Reisezeit hieß im Kicker auf Englisch, Französisch, Italienisch, Niederländisch und Spanisch so wie der Tagesplaner („trip planner", „planificateur de visite" …) und heißt jetzt „trip planning", „préparer sa visite", „organizzare la visita", „reisplanning" und „preparar la visita".

Kapitelabstand `space-y-16 sm:space-y-24` jetzt auch auf Fancast (vorher `space-y-20 sm:space-y-28`) und im Artikel des Tagesplaners (vorher `space-y-14 sm:space-y-16`). Die beiden `<h2>` im Kopf des Tagesplaners („Noch nichts geplant" und „Geplante Tage") laufen über `ChapterHeading`, ohne Nummer, weil sie je nach Zustand fehlen.

### Werkzeugseiten bekommen den kompakten Kopf

Entwickler, Mitmachen, News und Glossar beginnen jetzt mit `LandingHero variant="compact"`: Kicker `park.fan · …` (neu unter `landing.<seite>.kicker` in allen sechs Sprachen), die bisherige H1 und der bisherige Einleitungssatz. Die H1 misst auf allen vier Seiten 30 px auf dem Handy und 36 px ab `sm` und beginnt an der `container`-Kante, bei 1440 px also bei x=96 statt bei 288 (Entwickler) oder 224 (News). Die Inhaltsspalten behalten ihre Breite, sind aber nicht mehr zentriert, sondern beginnen an derselben Kante.

Entwickler: Der Kopf führt mit einem Button zur API-Referenz, der Link, der bisher erst als erste Karte im ersten Abschnitt kam. Die vier `<h2>` mit `text-xl font-semibold` laufen über `ChapterHeading`, ohne Nummer.

Mitmachen: Die Fotokarte mit dem schwarzen Verlauf, der auch im hellen Design schwarz blieb, ist weg, und mit ihr das Europa-Park-Hintergrundbild. In die Beispielgalerie ist es nicht gewandert, denn die zeigt Fotos der Art, um die die Seite bittet. Der Button „Fotos hochladen" springt weiter zu `#upload`, jetzt mit `scroll-mt-24` unter dem Header statt `scroll-mt-8`.

News: Megafon-Symbol und `BlogSectionHeader` sind ersetzt, die Zahl der Meldungen steht als kleine Zeile unter der Einleitung. Einen Button gibt es nicht, der Parkfilter direkt darunter ist das Bedienelement der Seite.

Glossar: Titel und Einleitung sind aus dem Glas-Panel in den Kopf gewandert, den jetzt die Server-Seite rendert; im Panel bleiben Suche und Filter. Die Pill-Brotkrume über dem Panel entfällt (die `BreadcrumbList` im strukturierten Datensatz bleibt). Damit der Kopf auf dem Hintergrundfoto lesbar ist, legt `GlossaryBackground headTint` oben eine Tönung in Hintergrundfarbe darüber, hell im hellen und dunkel im dunklen Design. Die Kategorieüberschriften laufen über `ChapterHeading`, ohne Nummer, weil der Filter Gruppen ausblendet.

### Die Seite „Durchschnittliche Wartezeiten“ führt zuerst in den Tagesplaner

Wer auf der Statistikseite eines Parks unten ankommt, bekam bisher die Live-Seite und den Kalender angeboten, aber nicht den Planer, für den die Seite laut Konzept (docs/product/landing-pages.md §4) da ist. Der erste Schritt in `LandingNextSteps` ist jetzt „Tag im Phantasialand planen“: derselbe `ParkPlannerLink` wie im Parkkopf, als Knopf der Zeile gezeichnet, mit demselben Text (`parks.planDayCta`) und derselben `planner_opened`-Quelle `park-header`. Ein Klick öffnet das Planer-Panel direkt im Assistenten für diesen Park, ein Klick mit Modifier den Planer in einem neuen Tab. Kein neues Umami-Event, kein neuer Text, `revalidate` der Seite unverändert bei 86400.

### Ein Kopf und ein nächster Schritt für alle Landingpages

`components/marketing/editorial-ui.tsx`: Der bisherige `Hero` heißt jetzt `LandingHero` und ist die einzige Kopf-Komponente der Hub-Seiten. Neu sind `variant="compact"` (kein Foto, kein Scroll-Hinweis, keine Mindesthöhe, H1 `text-3xl sm:text-4xl`, bleibt ohne `-mt-12` unter dem 48-px-Header), ein `aside`, das ab `lg` als zweite Spalte steht und darunter wegfällt, und ein `action` für genau einen primären Button unter der Unterzeile. Die H1 der Hubs ist überall `text-4xl sm:text-6xl`; das trifft Fancast, das bisher mit `text-6xl sm:text-8xl` lief. Jeder Kopf trägt `data-landing-hero="hub"` oder `"compact"`.

`GuideHero` aus `app/[locale]/how-park-fan-works/_chrome.tsx` ist gelöscht. Die Anleitung nutzt `LandingHero` mit dem `WaitSign` als `aside` und übernimmt dabei die gemeinsamen Werte: 78vh statt 86vh, `pt-32` statt `pt-28` und die schwächere Tönung des gemeinsamen Kopfs. Die Überschrift oben auf dem Handy, die gespiegelte Tönung und `pb-48` gegen `HERO_FLOW_INTO_PULL` bleiben.

`LandingNextSteps` ersetzt vier Bausteine: `ClosingBand` (Anleitung), `FancastCta` (beste Reisezeit, die Datei `_best-time-ui.tsx` ist weg) und die beiden `NextStep`-Kopien auf „Mit Kindern" und „Durchschnittliche Wartezeiten". Ein bis drei Ziele, das erste als primärer `Button`, die übrigen als Outline, alle über `buttonLinkProps` statt eigener Klassen. Auf den Parkseiten steht der Block mit `surface="chapter"` als Kapitel mit `ChapterHeading` und `GlassCard`. Ziele und Texte sind unverändert. Auf der Reisezeit-Seite stand die Fancast-Karte mitten zwischen Kapitel 05 und den FAQ; als Abschluss steht sie jetzt hinter den FAQ, wie es die Anatomie vorsieht.

Kicker, Unterzeile und Kennzahlen der Köpfe von Anleitung, Fancast und bester Reisezeit kommen aus `messages/*.json` (`landing.*`) statt aus `PAGE_HEADERS` in den Seiten. Das Scroll-Label ist ein Schlüssel für alle fünf Seiten (`landing.scroll`); Spanisch sagt jetzt überall „Desliza", Niederländisch „Scroll" (die Anleitung hatte „Desplazar" und „Scrollen").

### Standort-Banner auf dem Handy kleiner

Der Standort-Toast unten auf der Startseite war unter `sm` 202–252 px hoch, 26–32 % eines 780 px hohen Bildschirms, und lag über dem Suchfeld des Hero. Unter `sm` fällt jetzt das Icon-Kästchen weg, der Text ist die kurze Fassung `nearby.bannerBodyShort` (sechs Sprachen, dieselbe Zusage in halb so vielen Worten), und das Padding ist enger. Gemessen über sechs Sprachen bei 320, 360 und 390 px: 147–181 px, 19–23 %. Button und Schließen-Knopf behalten ihre 44 px, ab `sm` ist der Toast unverändert.

### `pnpm check:planner` ist wieder grün: 395/395 statt 390/393

Drei Zusicherungen waren auf `main` rot, und keine davon beschrieb einen Fehler an der Seite.

Zwei hingen an der Benachrichtigungs-Berechtigung. Der Headless-Shell, den `chromium.launch()`
startet, antwortet auf dieselbe Frage zweimal verschieden: `navigator.permissions.query` meldet
`granted`, `Notification.permission` meldet `denied` — und zwar auch dann, wenn
`grantPermissions(['notifications'])` die Berechtigung ausdrücklich erteilt hat. Nur das volle
Chromium (`channel: 'chromium'`) lässt beide übereinstimmen. `usePushSubscription` liest den Wert,
der `denied` sagt, also zeigte der Prüflauf im Schritt „konfigurierter Deploy" den blockierten
Hinweis statt des Schalters. Der Schritt setzt `Notification.permission` jetzt per `addInitScript`
auf `default`, so wie der An-/Aus-Durchlauf 650 Zeilen weiter oben es schon tat, und **liest den
Wert danach zurück**: zwei neue Zeilen, je eine in Schritt 2 und 3, damit ein Schritt nie wieder
einen Zustand behauptet und einen anderen messen kann.

Die dritte war Reacts Dev-Warnung `Encountered a script tag while rendering React component`. Sie
betrifft die fünf `<script>`-Tags des Root-Layouts — `temp_unit`, drei JSON-LD-Blöcke und
next-themes —, die React bei einem Client-Render des Layout-Teilbaums neu anlegt, gemessen mit
einem `MutationObserver` auf dem Einfügezeitpunkt (389 ms, Warnung bei 197 ms). React meldet den
Teilbaum **einmal**, nicht einmal je Tag: wird einer der fünf zum `<template>`, bleibt die Zahl bei

1. Die Warnung kann deshalb keinen neuen Fall anzeigen und keinen abwesenden ausschließen, und sie
   existiert ausschließlich in `react-dom-client.development.js`. Sie wird jetzt erlassen — mit einem
   Zähler in der Bilanz, nicht stillschweigend.

### Glossar: „Trim Brake" bekommt einen 3-D-Player

Der Begriff `trim-brake` zeigt jetzt den Coaster-Player (`lib/three/coaster/elements.ts`, Eintrag `trimBrake`). Der Zug fährt nach einer Abfahrt auf einen Hügel, trifft auf der Kuppe auf die roten Bremssättel und verliert dort rund zwei Drittel seiner Geschwindigkeit, steht aber nie still und wird nicht gehalten. Das unterscheidet ihn vom Block Brake mit ebener Strecke, Stillstand und Haltephase. Die Bremsstrecke nutzt den `brake`-Baustein aus dem Scene-Builder, die Zeitleiste die vorhandenen Marken `approach`, `brake` und `leave`; neue Strings gibt es nicht.

### Startseite ohne framer-motion, solange kein Countdown läuft

`AnnounceSection` ist eine Server Component und lud `FlipClock` per `next/dynamic`. In einer Server Component splittet Next damit nichts (`node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`), also lud jede Startseite den framer-motion-Chunk, obwohl der Countdown seit dem 28. März vorbei ist. Der dynamische Import sitzt jetzt in `components/home/flip-clock-lazy.tsx`, einem Client-Modul. JS auf `/en` im Produktions-Build, 390 px: 373 → 333 KB brotli, 1.360 → 1.217 KB roh.

**`cookies-next` raus.** Die Bibliothek lag mit 15 KB minifiziertem JS auf jeder Seite, für zwei Aufrufe im Browser (Favoriten und Temperatureinheit). `lib/utils/browser-cookie.ts` liest und schreibt mit derselben Kodierung, alte Cookies bleiben lesbar (in Chromium gegen `cookie.serialize` geprüft). Je Seite 4 KB brotli und 18 KB roh weniger; `/en` jetzt 329 KB brotli, `/en/parks` 251 KB.

### Meta-Descriptions der Beiträge auf 155 Zeichen, Glossar schneidet am Satzende

- **Blog:** 137 von 228 Beiträgen trugen ein `seo.description` über 160 Zeichen, das längste 268, und Google schnitt jedes davon mitten im Satz ab. Neu geschrieben sind alle 160 über 155 Zeichen (en 27, de 28, fr 29, nl 24, it 25, es 27), mit denselben Fakten. `updatedAt` bleibt, weil es eine Formulierung ist und kein neuer Inhalt.
- **Glossar:** Die Description eines Begriffs war der erste Absatz der Definition, bei 152 Zeichen hart abgeschnitten („It comes in two kinds:…"). `fitSentences()` in `lib/utils/metadata.ts` nimmt jetzt so viele ganze Sätze, wie passen, und kürzt erst, wenn schon der erste Satz zu lang ist. Abkürzungen wie „z. B." oder „Dr." beenden keinen Satz. 405 von 548 Descriptions auf Englisch und Deutsch enden dadurch anders.
- **Prüfung:** `pnpm test:meta-descriptions` prüft beides; die Grenze steht auch in `content/blog/README.md`.

### 404-Seiten mit eigenem Kopf, Ride-Schema mit `@id` und `geo`, Breadcrumb auf `/developers`, Autorenfoto über den Optimizer

- **404-Kopf:** `app/[locale]/not-found.tsx` und die neue Catch-all-Route setzen `notFoundMetadata()` (`lib/seo/not-found-metadata.ts`): Titel und Beschreibung aus `notFound`, `noindex, follow`, kein Canonical und kein hreflang (`alternates: null`). Vorher erbte die Seite Titel, Canonical `/en` und `index, follow` vom Layout.
- **Unbekannte Pfade:** `app/[locale]/[...rest]/page.tsx` wirft `notFound()`, damit `/en/gibt-es-nicht` die Locale-404 mit Header, Footer und Links bekommt statt der nackten `app/not-found.tsx`. Status bleibt 404, keine echte Route wird verdeckt.
- **Ride-Schema:** `AttractionStructuredData` setzt `@id` (die Ride-URL, wie im `containsPlace` der Parkseite), `geo` aus den Koordinaten der Bahn und `@id` des Parks in `containedInPlace`.
- **`/developers`:** BreadcrumbList, wie auf Fancast.
- **Autorenfoto:** Banner und Autorenprofil laden `/authors/patrick-arns.webp` (76 KB) über `/_next/image` (`avatarUrl()` in `lib/utils/image-loader.ts`, w=96 bzw. w=256).

### Interne Links zwischen Guides, Halloween-Beiträgen und Reisezeit-Seite, `WebApplication` für den Tagesplaner

Aus der Cluster-Analyse des SEO-Laufs vom 3. Oktober, in allen sechs Sprachen, ohne `updatedAt` zu bewegen:

- **Reisezeit-Seite:** Zwölf Park-Guides sowie „Sind 70 Minuten lang?" und der Tagesplaner-Beitrag verlinken jetzt `/best-time-to-visit` (vorher nur der Movie-Park-Guide). Die Seite selbst verlinkt unter „Der ruhigste Tag je Park" die Guides der Parks, die ihre Tabelle zeigt (`getGuideForPark`, neuer Key `bestTime.quietestByPark.guidesLead`).
- **Rangliste Deutschland:** Die Guides zu Europa-Park, Phantasialand, Heide Park, Hansa-Park und Movie Park verlinken „Die besten Freizeitparks in Deutschland 2026".
- **Halloween:** Der Europa-Überblick verlinkt den USA-Überblick und die News zu Cedar Point und Gardaland. Die Gardaland-News verlinkt den Europa-Überblick, die Cedar-Point-News den USA-Überblick.
- **Tagesplaner:** `/trip-planner` trägt neben der BreadcrumbList ein `WebApplication` (`WebApplicationStructuredData` in `components/seo/structured-data.tsx`): kostenlos, im Browser, Herausgeber `#organization`.

### Sammel-Guides mit `parkLinks` sind kein Park-Guide mehr

`getGuideForPark` (`lib/blog/backlinks.ts`) nahm als Guide eines Parks den Guide, dessen erster `parkLinks`-Eintrag der Park ist, und ging davon aus, dass Sammel-Guides keine `parkLinks` tragen. Die Deutschland-Rangliste (7 Einträge, erster `europa-park`) und Halloween in den USA (6, erster `universal-studios-florida`) tun das seit dem 3. Oktober, und die Europa-Park-Seite öffnete ihren Blog-Teil mit der Rangliste statt mit dem Europa-Park-Guide. Ein Guide mit mehr als `MAX_PRIMER_PARK_LINKS` (3) Einträgen ist jetzt niemandes Guide; die Park-Guides haben 1–2. `pnpm test:park-guide` war auf `main` rot und prüft die beiden Sammel-Guides jetzt mit.

### Artikel-Schema mit Zeitzone und `@id`, „20000 km entfernt" raus aus dem Dokumenttext

- **Artikel-Schema:** `components/seo/blog-structured-data.tsx` schreibt `datePublished` und `dateModified` jetzt für jeden Beitrag mit Berliner Offset (`2026-10-03T00:00:00+02:00`), bisher nur für News. `publisher` trägt `@id` `https://park.fan/#organization`, derselbe Knoten wie auf jeder Seite, und der Autor `@id` `https://park.fan/#person-<key>`.
- **Breiten-Reservierung ohne Text:** `ParkDistance` reserviert die Breite des Entfernungs-Badges mit einer unsichtbaren Kopie, die bisher „20000 km entfernt" als Text ins Server-HTML jeder Park- und Ride-Seite schrieb. `DistanceBadge` hat dafür jetzt `sizer`: das Label kommt per `content: attr(data-label)`. Die Box ist gleich breit (360 px, Phantasialand: de 148,6, es 175,4, it 167, en 130,1 px, vorher wie nachher), der Text steht nicht mehr im Dokument.

### Drei Befunde aus dem SEO-Lauf vom 3. Oktober

- **Stadt-Breadcrumb:** Das `BreadcrumbList`-JSON-LD der Mehrpark-Stadtseiten trug als letztes `item` `…/germany/[object Object]`, weil `app/[locale]/parks/[continent]/[country]/[city]/page.tsx` das City-Objekt der API in die URL schrieb statt `citySlug`. Betroffen waren 103 Städte in 6 Sprachen.
- **`/search` ist `noindex`:** Ohne Query besteht die Seite aus einem Suchfeld und einer Hinweiszeile. Sie ist jetzt in jeder Form `noindex, follow` und steht nicht mehr in `sitemap.xml` (6 URLs weniger). `docs/seo/sitemaps.md` ist angepasst.
- **Planer-Fotos über den Optimizer:** `planner-block.tsx` und `planner-panel-photo.tsx` malten `/media/*.jpg` roh als `background-image`, auf `/en/trip-planner` sechs Dateien mit 155–218 KB. Beide gehen jetzt über `backgroundPhotoUrl()` (`lib/utils/image-loader.ts`, w=828, q50).

### Die Länderseite Deutschland verlinkt den Ranking-Guide

`lib/blog/country-guide.ts` ordnet einem Land per `translationKey` einen Guide zu, bisher `germany` dem Beitrag `best-theme-parks-germany`. Die Länderseite zeigt ihn als kompakte `BlogPostCard` über der Städteliste, in der Sprache des Besuchers oder in der englischen Fassung. Für jedes andere Land und für eine Sprache ohne veröffentlichten Beitrag rendert die Seite nichts. Der Beitrag selbst steht in allen sechs Sprachen im Blog: eine Rangliste für Achterbahnfans, eine für Familien und der Median je Park aus `park-comparison-widget`.

### Stadtseiten mit mehreren Parks haben einen Intro-Satz wie die Länderseiten

`components/parks/city-summary-section.tsx` rendert auf `/parks/[continent]/[country]/[city]` serverseitig einen Satz mit Stadt, Parkzahl und Park-Liste (`Intl.ListFormat`, `explore.citySummary.intro` in sechs Sprachen). Die Daten kommen aus `getCitiesWithParks`, den die Seite schon lädt, es gibt keinen neuen API-Call. Betroffen sind 103 Mehrpark-Städte in 6 Sprachen, also 618 Seiten, die bisher nur Titel und Parkzahl hatten. Einpark-Städte leiten weiter per 308 auf den Park.

### Park page: one sentence under "Crowds now"

`ParkTodayPanel` prints a short sentence under the "Crowds now" badge, written from the same crowd level the badge shows ("Busy, expect longer waits."). It reads the value the server render already holds, so the sentence is in the first HTML. Six locales, no new data source; a park with no level, a closed park and the `unknown` level show no sentence.

### Planer: jede Fahrt kostet fünf Minuten, als benannte Annahme

`RIDE_DURATION_MIN` (`lib/planner/day-grid.ts`) ersetzt die private 3 Minuten aus `leg.ts` und gilt für jede Fahrt gleich. Sie steckt im Übergang zwischen zwei Stopps, damit Suche, Leg-Pille und `fits = start < closeMin` dieselben Minuten lesen, und einmal am Tagesende für den letzten Stopp. Auf dem Rechenbeispiel steigt die Untergrenze des Übergangs von 8 auf 10 und die Obergrenze von 9 auf 11 Minuten. Die Blockhöhe bleibt die Warteschlange, und es gibt keinen neuen Text: die Pille nennt den Übergang schon geschätzt.

### check:planner prüft das kurze Desktop-Fenster bei 1440×480

`scripts/check-planner.mjs`: Der Pointer-Term in `PLANNER_PHONE_QUERY` und in `@variant planner-phone` hatte keine Zusicherung. Wer ihn aus einer der beiden Hälften entfernte, ließ alle Querformat-Passes grün, weil die mit `hasTouch` laufen. Ein neuer Pass öffnet den Planer bei 1440×480 ohne `hasTouch` und prüft fünf Dinge: das Fenster antwortet `pointer: fine`, das Panel ist ein 448×480-Seitenpanel bei x=992, es setzt weder Overlay noch Scroll-Sperre noch `data-aria-hidden`, es trägt `border-left` statt `border-top`, und der Griff ist nicht sichtbar. Gegenprobe gegen den Dev-Server: ohne den Term in `PLANNER_PHONE_QUERY` werden 4 von 10 Zusicherungen des Passes rot, ohne ihn in `planner-phone` 2 von 10, ohne ihn in beiden CSS-Varianten 3 von 10. Außerdem ist das Feld `handle` aus `landscapeRoom` entfernt: Playwright machte den DOM-Knoten zu einem String, und niemand las ihn. Kein Verhaltenswechsel im Planer.

### Admin: „Redis komplett zurücksetzen“ heißt jetzt „Park-Cache zurücksetzen und neu aufbauen“

`app/admin/actions/page.tsx`: Label und Beschreibung der Aktion `cache/reset` passen zum Backend nach PAR-636. Der Endpunkt löscht nur noch die Park-Cache-Patterns wie „Cache leeren“ und stößt den Rebuild an; Queues, Sitzungen und Rate-Limits bleiben erhalten. Vorher stand dort „FLUSHALL“.

### Der Fit-Assistent pinnt die gedrückte Bahn, und „die Antwort auf" ist ein Fehler im Prosa-Check

`components/planner/add-to-planner-button.tsx`, `lib/planner/add-ride-fit.ts`: Öffnet ein Druck auf „In den Plan" den `PlannerFitAssistant`, ist die gedrückte Bahn jetzt vorab gepinnt (`requestedRideChoice`, als `initialChoice`). Vorher stand sie ungepinnt in der Liste, und im Testtag aus `pnpm test:planner-fit` Abschnitt 13 gab der vorgeschlagene Plan genau diese Bahn auf. Der Pin ist ein normaler Pin und lässt sich in der Zeile lösen. Ein zweiter Druck auf dieselbe Bahn wird unter demselben Schlüssel `a:<slug>` gepinnt.

`scripts/check-prose.mjs`: „die Antwort auf" und die fünf Gegenstücke (`the answer to`, `het antwoord op`, `la réponse à`, `la respuesta a`, `la risposta a`) sind keine Warnung „stock phrase (§3)" mehr, sondern ein Fehler auf jeder Oberfläche. `docs/blog.md` §3.3 hat dafür Hausregel 7; die Floskel-Tabellen in §3.1, §3.2 und §3.5 nennen sie nicht mehr. Das Repo hat danach 0 Fehler.

### Admin: die History zeigt `park.verify`-Einträge als Prüfung, ohne Zurücknehmen

Seit v4 #366 trägt jeder History-Eintrag `kind: "change" | "verification"`. Ein `park.verify`-Eintrag
hat `before` mit den geprüften Werten und `after: null`. `HistoryList` (`app/admin/_ui/history-list.tsx`)
zeigte ihn bisher als rohen Action-Namen ohne Werte. Jetzt heißt er „Park geprüft“, trägt den Chip
„Prüfung“, listet die Werte aus `before` und davor „geprüft gegen“ die Quelle. Für `kind: "verification"`
gibt es nie einen Zurücknehmen-Button, das Backend antwortet darauf mit 400. Der Filter auf
`/admin/history` hat eine Option „Park geprüft“.

### Admin: der Fastpass-Tab heißt Merkmale und kennt Virtual Line, Single Rider, Indoor/Outdoor und Typ

Der Tab auf der Parkseite (`attraction-features-editor.tsx`, vorher `fast-pass-editor.tsx`) hat fünf
Chips statt einer festen Fastpass-Spalte: Fast Pass, Virtual Line, Single Rider, Indoor/Outdoor und
Typ (`attractionKind`). Die beiden Selects lesen ihre Optionen aus `GET /v1/admin/content/fields`.
Der Sammel-Save schickt je Bahn nur die Felder, die sich geändert haben, mit Begründung und Quelle
wie bisher. Die Tab-URL ist jetzt `?tab=features`.

### Die Planer-Seite sagt im Lead, dass der Tagesplaner kostenlos ist

`messages/*.json`, Schlüssel `planner.page.lead`, in allen sechs Sprachen: Der letzte Satz hieß „Alles liegt in deinem Browser, kein Konto nötig.“ und nennt jetzt zusätzlich, dass der Planer nichts kostet. Der Lead steht im Hero und in der Seitenbeschreibung der Tagesplaner-Seite, es kommt keine neue Fläche und kein neuer Key dazu. `pnpm check:client-messages` unverändert grün, `pnpm check:prose` unverändert bei 12 Warnungen, 0 Fehlern.

### Glossar: Die Drehscheibe läuft als 3-D-Animation

Der Begriff „Turntable" hat jetzt einen Coaster-Player (`lib/three/coaster/elements.ts`, Eintrag `turntable`). Der Zug fährt auf eine Scheibe mit 2,9 Einheiten Radius, steht dort still, dreht sich in 28 % der Laufzeit um 180° und fährt auf demselben Gleis zurück. Referenz ist die Drehscheibe der Voltron Nevera im Europa-Park. `createCoasterScene` kennt dafür das Feld `turntable`: Die Scheibe trägt eigene Schienen und 24 Randmarken, die Wagen drehen sich als ein Körper um die Scheibenmitte, Follow- und Onboard-Kamera drehen mit.

### Glossar: „Block Brake" bekommt einen 3-D-Player

Der Begriff `block-brake` zeigt jetzt den Coaster-Player (`lib/three/coaster/elements.ts`, Eintrag `blockBrake`). Der Zug rollt nach einer Abfahrt in eine ebene Bremsstrecke, bremst bis zum Stillstand, steht 10 % der Laufzeit und wird dann in den nächsten Hügel freigegeben. Die Bremsstrecke ist neu im Scene-Builder: rote Bremssättel (`brake` im Element) links und rechts der Mitte, anders als die weißen Stator-Finnen der Launch-Strecke. Die Zeitleiste trägt drei neue Marken (`brake`, `hold`, `release`) in allen sechs Sprachen.

### check:planner bewacht, dass die Aktionsleiste im Drag zurücktritt

`scripts/check-planner.mjs` hält auf einem 360 × 568 px Handy einen Touch-Drag an und fragt `elementFromPoint` an der Mitte des Ghosts. Die Aktionsleiste deckt dort die Mitte (Scroller 231 px), mit `standBack` ist sie `hidden` und der Ghost liegt oben; mit zurückgedrehtem `standBack` antwortet ein `p` in der Aktionsleiste und die Zusicherung wird rot. Der Ghost trägt dafür `data-planner-ghost`.

### `check:planner` fährt echte Zieh-Gesten im Tagesplaner

`scripts/check-planner.mjs` prüfte den Rastschritt nur als Funktion (`snapTo`) und die Ebene des Ghost-Blocks nur als Klasse. Drei Fälle fahren jetzt die Geste im Browser. Ein Mauszug von 62 px (Rohminute +51,67) landet von 585 auf 635 Min., also auf der nächsten Fünf. Ein Fingerzug von 95 px (Rohminute +52,78) landet von 650 auf 705 Min. Mitten im Mauszug hat der Ghost `zIndex` 40 und der gezogene Block 30, gelesen aus `getComputedStyle`. Jeder Fall meldet die gemessene Minute. Lauf gegen `pnpm build && pnpm start`: 385 von 385 Checks grün.

### Eine Entwicklerseite unter `/developers` listet die API und die Agent-Dokumente

`app/[locale]/developers/page.tsx` ist die lesbare Vorderseite von `lib/agents/`: die API-Referenz, die OpenAPI-Beschreibung, `/.well-known/api-catalog`, `llms.txt`, `agent-skills/index.json`, das Capability-Manifest, die MCP-Server-Card, `license.xml` und die drei MCP-Tools von `/api/mcp`. Jede URL kommt aus dem Modul, das sie ausliefert, nur die Texte sind übersetzt (`developers` in allen sechs Sprachen). Die Seite ruft nichts ab, hat keine Client-Komponente und keinen Eintrag in `ROUTE_MESSAGE_NAMESPACES` über `[]` hinaus. Erreichbar über den Footer (Gruppe Tools), in der Sitemap mit sechs Alternates und mit dem Edge-Cache der anderen statischen Seiten.

### Der Footer bietet die Installation als App an

`InstallAppButton` (`components/common/install-app-button.tsx`) steht im Footer unter dem Google-Button und zeichnet nichts, solange der Browser nichts anbietet. Chromium reicht `beforeinstallprompt` weiter, der Button öffnet dann den Installationsdialog des Browsers. Safari auf iOS und iPadOS hat kein Event, dort klappt der Button einen Hinweis zu „Teilen“ und „Zum Home-Bildschirm“ auf. Das Event fängt `lib/pwa/install-store.ts` beim Laden des Moduls ab und gibt es über `useSyncExternalStore` weiter, damit ein früh gefeuertes Event nicht verloren geht. Ein Klick auf das Kreuz blendet den Hinweis 30 Tage aus (`install-hint-dismissed` in `localStorage`). Eine installierte App (`display-mode: standalone`) sieht ihn nie. Drei neue Schlüssel unter `footer.install` in allen sechs Sprachen.

### Blog: die erste Karte lädt ihr Cover nur noch einmal

Auf `/de/blog` hat die erste Karte (`priority`) ihr Cover zweimal geladen, einmal für die Zeile
unter `sm` und einmal für die Karte, weil beide eager sind und die versteckte Ebene trotzdem lädt.
Eine `priority`-Karte gibt jetzt ihr `sizes` an die Zeile weiter (`blog-post-card-view.tsx`), alle
drei `<img>` wählen dieselbe URL. Gemessen gegen `pnpm build && pnpm start`: Desktop 1440 px
einmal 640 statt 640 + 96, bei DPR 2 einmal 1080 statt 1080 + 256; Handy 390 px bei DPR 1 einmal
256 (3.836 B) statt 96 + 256 (4.888 B). Lazy-Karten bleiben unverändert.

### Das Admin zeigt bei den Parkduplikaten, welches Paar geprüft werden muss

`app/admin/duplicates/page.tsx` las aus `GET /v1/admin/duplicate-parks` nur `total` und die Paare ohne `safe` und `reviewReason`; die Suche meldete „N Paar(e) gefunden." und sonst nichts. Jetzt trägt `DuplicateParkPair` beide Felder. Jede Zeile der Trefferliste hat einen Chip „sicher" oder „prüfen", ein Paar zum Prüfen zeigt darunter den `reviewReason` des Backends. Das gilt auch für den Zweig `attractionsAgree` aus PAR-310: dort nennt der Grund die Entfernung und ab 10 km den Aufruf von `correct-location` vor dem Merge. Die Zusammenfassung nennt `safe` und `needsReview` neben `total`. Trägt man über „Ids übernehmen" oder von Hand ein Paar ein, das die letzte Suche als „prüfen" gemeldet hat, zeigt der Bestätigungsschritt des manuellen Merges den Grund in einem gelben Kasten über dem Button.

### Planer: ein iPhone SE im Querformat zeigt die Zeitachse

Bei 568 × 320 blieb das Planer-Sheet gestapelt, weil das Querformat-Layout erst ab 40rem galt. Kopfzeile, Kontextband, Ride-Suche, Headliner, Optimize und Summary brauchten 303 px des 308 px hohen Sheets, die Achse war auf dem Bildschirm 3 px hoch. `planner-landscape` (`app/globals.css`) und `PLANNER_LANDSCAPE_QUERY` gelten jetzt ab 35.5rem, die linke Spalte ist unter 40rem 16rem breit. Gemessen bei 568 × 320: Achse 252 px hoch und ganz im Sheet, 312 px breit, nichts darüber. 844 × 390 und 390 × 844 sind unverändert. `check:planner` prüft 568 × 320 mit einem eigenen Run.

### Die drei Kacheln der Rope-Drop-Karte bleiben auch auf Französisch, Italienisch und Spanisch einzeilig

Oberhalb der Stapel-Schwelle von 380 px Zeilenbreite hat eine Kachel in `StatTiles` 93 px Platz für Icon und Beschriftung. Drei Beschriftungen waren breiter und brachen um, die drei Werte standen dann auf zwei Höhen: „Vous économisez" (114 px), „Picco del giorno" (105,5 px) und „En la apertura" (94,3 px). Sie heißen jetzt „Vous gagnez", „Al picco" und „Al abrir". Die breiteste Beschriftung in allen sechs Sprachen ist jetzt 88,4 px breit. Gemessen auf Guide- und Ride-Seite bei 1024 px und zwischen 381 und 454 px Zeilenbreite: keine Beschriftung bricht um, die Werte stehen auf einer Linie. Die Schwelle bleibt bei 380 px.

### Die Planer-Doku nennt den Schalter beim Namen, und der Wizard begründet seine Breiten-Klasse

`docs/features/trip-planner.md` beschrieb den Skalen-Schalter als reine Breite (`(width < 40rem)`) und nannte `sm:hidden`, `max-sm:after:h-11` und `sm:right-[var(--planner-inset,0px)]`. Im Code stehen dort `planner-wide:hidden`, `planner-phone:after:h-11` und `planner-wide:right-[…]`. Der Absatz nennt jetzt `PLANNER_PHONE_QUERY` mit beiden Termen, `planner-wide` als Gegenstück und den Grund, warum nur der Höhen-Term `(pointer: coarse)` fragt. In `planner-wizard.tsx` steht an `max-sm:min-h-9` der Chips für die Körpergröße jetzt, warum sie auf der Breite bleiben: 36 px neben 44-px-Kalenderzellen bei 844 × 390, Wizard ausdrücklich nicht Teil von PAR-76. Kein sichtbares Verhalten ändert sich.

### Der Planer liest die Kurve einer Bahn nach Mitternacht nur noch einmal

`estimateFor` in `lib/planner/estimate.ts` suchte an einem Tag, der nach Mitternacht endet, die Wartezeit einer Bahn zweimal: erst an der Stunde der Achse (24, 25), dann an der Uhrzeit (0, 1). Die API liefert in `hours[].hour` die entfaltete Stunde, gemessen am 2026-09-14 (Parc Astérix und Walibi Rhône-Alpes, 19 → 1, Stunden 19 bis 25) und am 2026-10-02 (Cedar Point, 11 → 0, Stunden 11 bis 24). Die zweite Suche ist entfernt. `scripts/test-planner-estimate.mjs` prüft die Stunden 24 und 25 und schlägt fehl, wenn die Suche wieder auf die Uhrzeit zurückfällt. Für Besucher ändert sich nichts.

### Der Überhang des Planer-Griffs ist dokumentiert statt gekappt

`components/planner/planner-block.tsx`: Das 44-px-Ziel des Griffs bleibt mittig verankert und überhängt einen Mindestblock weiterhin um (44 − 30) / 2 = 7 px je Seite. Was das kostet, steht jetzt an der Stelle, die den Überhang setzt: bei 390×844 mit `hasTouch` und zwei freien Blöcken 1,8 px auseinander landen **5,2 px** davon im Block darüber, und weil beide `<li>` denselben `z-index` tragen, verschiebt ein Druck dort den kurzen Block, statt den langen auszuwählen. Gekappt wird nicht — bei der Raumhöhe des Blocks wäre das Ziel 28 px, und der Griff ist die einzige Bedienung, die ein so kurzer Block hat; ein Anker nach unten verschöbe alle 14 px auf den Nachbarn darunter, statt sie 7 und 7 zu teilen.

Dazu die Geometrie, die vorher nirgends stand: das `::after` setzt keine waagerechte Kante, also löst `left` sich auf die statische Position in einem zentrierenden Button auf — 22 px. Gemessen liegt der Button auf x +0…+44 und das Ziel auf x +22…+66. `check:planner` probt deshalb rechts von x +44 und trägt das im Namen seiner Zusicherung.

Kein Verhaltenswechsel: keine Klasse geändert, kein Pixel verschoben.

### Die Parkkarte zeichnet ihren Favoriten-Kreis mit `GlassCircle`

`components/parks/park-card.tsx` trug den 34-px-Glaskreis hinter dem Favoriten-Stern als eigene Kopie: dieselben Klassen und dieselben drei Variablen `--pk-fav-bg`, `--pk-fav-border`, `--pk-fav-shadow` wie `components/common/glass-circle.tsx`. Eine Änderung an `GlassCircle` kam deshalb nur auf den Ride-Karten an. `GlassCircle` nimmt jetzt ein `className` für die Platzierung, und die Parkkarte rendert es mit `absolute top-3 right-3 z-[4]`. Gemessen auf `/en/parks/europe/germany` bei 1280 px, hell und dunkel: Abstand 12 px oben und rechts, 34 × 34 px, `z-index: 4`, Hintergrund, Rand und Schatten gleich wie vorher. Die Screenshots der Karte sind vorher und nachher byte-gleich.

### Escape im Menüband lässt den Fokus in einem Feld der Seite stehen

Ein Menüband im Header öffnet auch per Hover. Stand der Zeiger auf einem Auslöser, während jemand im Ride-Filter einer Parkseite tippte, leerte Escape den Filter und zog den Fokus im selben Tastendruck in den Header. `useMenuTrigger` setzt den Fokus jetzt nur noch auf den Auslöser zurück, wenn er im Band oder nirgendwo (`<body>`) stand. Escape schließt das Band weiterhin in jedem Fall.

### Die Alarm-Zeilen im Favoritenband zeigen die Schwelle wieder ganz

`components/layout/favorites-menu-rows.tsx`, `components/layout/favorites-menu-alerts.tsx`: Die Textspalte einer Alarm-Zeile ist bei 1024 und 1280 px 112 px breit, weil der Entfernen-Button 44 px kostet. Der Untertitel „Phantasialand · unter 30 Min." braucht 165 px und wurde vor der Zahl abgeschnitten, zwei Alarme im selben Park waren so nicht zu unterscheiden. `Row` hat jetzt ein Feld `subtitleValue`, das in derselben Zeile hinter dem Untertitel steht, aber außerhalb seines `truncate`. Die Alarm-Gruppe legt dort die Schwelle und die Uhrzeit einer Show-Erinnerung ab, gekürzt wird nur noch der Parkname. „Jeweils nächste Vorstellung" ist kein Wert und kürzt weiter wie bisher. Kartenbreite und Zeilenhöhe bleiben gleich. Gemessen bei 1024/1280/1920 × de/fr gegen `next dev`: die Schwelle ist in allen 24 Zeilen vollständig sichtbar (vorher in 14 von 24 abgeschnitten), jede Zeile ist weiterhin 52 px hoch.

### Der Planer-Reiter weicht einem Menüband aus, das unter ihn reicht

`components/planner/planner-edge-tab.tsx`, `components/layout/menu-band.tsx`, `lib/hooks/use-menu-band-over-edge-tab.ts`: Der Reiter des Tagesplaners hängt `fixed` auf `z-[60]` am rechten Rand des Headers und lag damit über dem Menüband. Bei 1024 und 1280 px endet die Spalte des Bandes 16 px vor dem Rand, und mit acht Alarmen im Favoritenband lagen drei Entfernen-Buttons (x = 1232–1264) zu 14 von 32 px unter dem Reiter (x = 1250–1280); `elementFromPoint` bei 80 % der Buttonbreite traf in zwei Fällen den Reiter. Ein offenes `MenuBand` misst jetzt einmal beim Öffnen, ob seine Spalte näher an den Rand reicht, als der Reiter breit ist, und meldet sich dann bei einem kleinen Store. Der Reiter wird währenddessen über 300 ms `invisible opacity-0`, außer mitten in einem Resize. Bei 1440 und 1920 px endet die Spalte 96 bzw. 208 px vor dem Rand, dort bleibt der Reiter sichtbar. Gemessen gegen `pnpm build && pnpm start` bei 1024/1280/1440/1920 × de/fr: 0 verdeckte Buttons in allen acht Fällen (vorher 3 bei 1024 und 1280), nach dem Schließen steht der Reiter an derselben Stelle. Der zweite Teil des Tickets, die französische Navigationszeile bei 1024 px (1058 statt 1024), war auf `origin/main` schon behoben: `scrollWidth` 1024, 0 px Überhang im Header in allen acht Fällen.

### „In den Plan" legt keine Bahn mehr hinter Parkschluss, sondern öffnet den Assistenten

`components/planner/add-to-planner-button.tsx`, `lib/planner/add-ride-fit.ts`: Der Knopf auf der Bahnseite fragt vor dem Schreiben `noRoomForRide`, das mit `fitWishes`, `fitBlocks` und `needsFitHelp` dieselbe Prüfung macht wie die Optimieren-Knöpfe. Hat der Tag keinen Platz mehr für die Bahn, wird nichts angelegt und `PlannerFitAssistant` geht auf, mit der Bahn im Titel (`planner.fit.titleFor`, sechs Sprachen). Vorher ergaben acht Drücke um 20:10 Parkzeit `20:15 · 21:15 · 22:15 · 23:15 · 24:15 · 25:00 · 25:00 · 25:00`. Bricht man ab, bleibt der Tag unverändert. Ein zweiter Druck auf dieselbe Bahn zählt als eigene Fahrt. Nach dem Bestätigen steht unter dem Knopf eine Ergebniszeile mit „Rückgängig", das den Tag von vorher zurückschreibt. Ohne Tagesdaten, an einem vergangenen Tag und in Parks ohne lesbare Wartezeiten legt der Knopf die Bahn wie bisher an. Assistent und Prüfung werden erst beim Druck geladen. `pnpm test:planner-fit` Abschnitt 12, acht Fälle.

### Der Größenregler steht auch im „Mit Kindern“-Block der Parkseite, und „nennen eine“ ist verboten

`ParkKidsLink` zeigt unter dem Link zur Kinder-Seite den Größenregler ein zweites Mal (`ParkKidsHeightFilter`). Es ist derselbe Filter wie im Panel über der Liste und keine Kopie: `TabsWithHash` reicht den Zustand aus `useAttractionFilter` über `ParkHeightFilterContext` weiter, und die Parkseite übergibt `ClosedRidesList` und `ParkKidsLink` dafür als Slot `belowTabs`. Das DOM bleibt, wie es war. Auf dem Handy liegt der Regler des Panels hinter dem „Filter“-Button (PAR-430), und wer bis zum Kinder-Block gescrollt hatte, fand dort nur einen Link. Ein Button „Zur Liste der Attraktionen“ wechselt auf den Tab und scrollt zur gefilterten Liste.

Der Regler liegt unter der Liste, die er filtert, also ändert jeder Schritt die Höhe über dem Daumen. Safari macht kein Scroll-Anchoring: In Chromium mit `overflow-anchor: none` stand der Block auf Phantasialand bei 390 px nach dem ersten Schritt 4.180 px weiter oben. Der erste Schritt startet deshalb einen Halt: Der Block merkt sich seine Lage, und ein `ResizeObserver` auf `<body>` scrollt nach jeder Größenänderung um das zurück, was er sich bewegt hat, noch vor dem Malen. Über vier Schritte bewegt er sich so um 0,0 px, mit und ohne Anchoring. Der Halt endet mit der nächsten Eingabe außerhalb des Reglers oder einem Scrollen, das nicht vom Block kam. CLS auf der Phantasialand-Seite, A/B im selben Stand: Handy 0,0001 / 0,0948, Desktop 0,0091 / 1,6426 gegen 1,6481 vorher (der Desktop-Wert bei y=7477 ist vorbestehend).

`scripts/check-prose.mjs` meldet „nennen eine“ und das niederländische „noemen een“ als Fehler auf jeder Oberfläche (`docs/blog.md` §3.3, Regel 8). Der erste Lauf fand 8 Treffer, je vier Strings der Kinder-Seite auf Deutsch und Niederländisch. Dort steht jetzt „Bei 35 von 40 Attraktionen gilt eine Mindestgröße“; Englisch, Französisch, Spanisch und Italienisch hatten dieselbe Gewohnheit mit anderen Verben und sind mit umgeschrieben. Danach 0 Fehler und 12 Warnungen wie vorher.

### „die Antwort auf" steht auf der Liste der Floskeln

`scripts/check-prose.mjs` meldet „die Antwort auf" und die fünf Gegenstücke (`the answer to`, `het antwoord op`, `la réponse à`, `la respuesta a`, `la risposta a`) als Warnung „stock phrase (§3)"; `docs/blog.md` §3.1, §3.2 und §3.5 nennen sie in den Tabellen. Der erste Lauf über das ganze Repo fand 6 Treffer, alle derselbe Satz der Fancast-Seite in sechs Sprachen („die Antwort auf ‚lohnt es sich, früh da zu sein?'"). Er sagt jetzt, was die Karte beantwortet: „ob es sich lohnt, früh da zu sein". Danach 12 Warnungen wie vorher, 0 Fehler.

## 2.14.0 (2026-10-02) – Welcher Park an welchem Tag, und eine geschlossene Bahn behält ihre Seite

Geschnitten am 2026-10-02 aus 33 Fragmenten in `docs/changelog.d/`. Der öffentliche Eintrag ist `content/changelog/2.14.0.md`. Neueste Abschnitte zuerst.

### Tagesplaner: Early Entry legt Headliner vor die Parköffnung

`lib/planner/day-grid.ts` kennt jetzt `DayGrid.earlyEntryOpenMin`, das Gegenstück zu
`closeMin`/`closeSlackMin` auf der Öffnungsseite. Es ist nur gesetzt, wenn der Park
`hasEarlyEntry` trägt, `earlyEntryMinutesPeak` nennt und der Besucher für den Tag Early Entry
bestätigt hat (`context.earlyEntry`, die Eingabe kommt mit PAR-200). Dann dürfen die Headliner
des Parks ab `openMin − earlyEntryMinutesPeak` liegen (`rideFloor`, `opensEarly`), alle anderen
Bahnen weiter erst ab `openMin`. Die Achse beginnt 30 Minuten vor der frühen Öffnung, und
`PlannerGridGround` zeichnet das Fenster über dem Öffnungsband. Ein Block darin trägt die Annahme
von 5 Minuten mit `missing: 'early-entry'`, ohne Crowd-Farbe und mit `~`. Ohne bestätigte Early
Entry ist das Raster Feld für Feld und der Optimizer-Plan Minute für Minute derselbe wie vorher
(Tests in `test:planner-grid`, `test:planner-optimize`, `test:planner-fit`). Im Fixture mit 5
Headlinern zu je 70 Minuten an einem Sechs-Stunden-Tag passt mit 60 Minuten Early Entry einer mehr.

Die Antwort aus dem Wizard (`PlannerDayPrefs.earlyEntry`, PAR-200) fließt in `planner-day-column.tsx` über `withEarlyEntry()` in `day.context`, damit das Fenster auf der Seite tatsächlich erscheint.

### Blog: alle sechs Sprachen in einem PR, und ein Check für `updatedAt`

Blog, Guides und News kommen in allen sechs Sprachen im selben PR, ebenso jedes spätere Update. Die
Regel hat jetzt eine eigene Seite, `docs/rules/a-post-ships-in-six-languages-in-one-pull-request.md`;
`docs/blog.md` §5.0 und §6, `content/blog/README.md` und `CLAUDE.md` verweisen darauf. Der alte Satz
„A guide waits for the German to be approved“ ist gestrichen.

Neu ist `pnpm check:blog-updated-at` (`scripts/check-blog-updated-at.mjs`), in `checks.yml` und im
`prebuild` neben `check:untranslated`. Er gruppiert `content/blog/` nach `translationKey` und
schlägt fehl, wenn einer Gruppe eine der sechs Sprachen fehlt oder ihre Fassungen verschiedene
`updatedAt` tragen. Auf `main` vor
diesem PR fand er 2 von 33 Gruppen: den Halloween-Guide (Deutsch 2026-09-30, die anderen fünf
2026-09-25 ohne Alton Towers und PortAventura) und den Parc-Astérix-Guide (nur Französisch mit
`updatedAt`). Beide sind im selben PR nachgezogen, danach 0 von 33.

### Die Top-10-Liste nennt Bereich und Bauart einer Fahrt

- `ParkStatsAttractionsCard` zeigt `land` und `attractionType` aus `/stats` als zweite Zeile unter
  dem Fahrtnamen, getrennt durch einen Punkt. Eine Fahrt ohne beide Werte bekommt keine Zeile.
- Die Zeile ist 14 px hoch, der Name rückt von 20 auf 18 px Zeilenhöhe, das Padding fällt weg: jede
  Reihe bleibt 33 px hoch (Efteling, 360 und 1440 px, vorher wie nachher), das Skeleton passt weiter.
- Screenreader lesen „Bereich:“ und „Bauart:“ davor, mit den vorhandenen Strings
  `parks.stats.rideWaitsLand` / `rideWaitsType` aus allen sechs Sprachen.

### Der Planer-Wizard fragt nach Early Entry, wo der Park es anbietet

Der Schritt „Wer kommt mit" im `PlannerWizard` (`components/planner/planner-wizard.tsx`) zeigt einen
vierten Schalter „Wir haben Early Entry", aber nur, wenn `/plan/day` für den Park
`context.hasEarlyEntry: true` liefert (kuratiert seit PAR-197). Ist `earlyEntryMinutesPeak` gesetzt,
nennt der Hinweis die Minuten. Die Antwort steht als `earlyEntry: true` in `PlannerDayPrefs` des
Tages, läuft durch denselben Merge in `setDayPrefs` und denselben Parser in `store.ts` wie Größe und
„trocken bleiben" und ist keine Angabe über die Gruppe (`hasPartyPrefs` bleibt unverändert). Am
2026-10-02 trägt noch kein Park das Flag, also ändert sich bis zur Kuratierung kein Pixel. Die
Platzierung vor der Öffnung kommt mit PAR-199. Drei neue Texte unter `planner.wizard.earlyEntry`
in allen sechs Sprachen, neun neue Fälle in `pnpm test:planner-actions` (90 statt 81).

### „Parks in der Nähe" steht im ersten HTML statt nachgestreamt

`components/parks/park-page-shell.tsx`: `NearbyParksSection` sitzt nicht mehr in `<Suspense fallback={null}>`, sondern wird direkt gerendert. Ihr Fetch hat ein eigenes `revalidate` von einer Woche, das `force-dynamic` nicht überschreibt; die Boundary wartete also auf einen Data-Cache-Treffer. Jetzt ist die Sektion bei Parks mit Nachbarn von Anfang an in voller Höhe da, bei Parks ohne Nachbarn (48 %) fehlt sie wie bisher. Gemessen mit `pnpm measure:cls --late --scroll=3192` auf der Kalenderseite, Desktop: Phantasialand 0.2472 vorher, 0.0058 nachher; Liseberg (keine Nachbarn) 0.0001 vorher und nachher. TTFB im warmen Zustand 19.9 ms vorher, 19.5 ms nachher.

### Skip-the-Line-Karte ist auf dem Handy kompakter, die Headliner stehen über dem Fall

`ParkPurchasesCard` (`components/parks/park-purchases-card.tsx`) hat unter `sm` weniger Padding
(`p-3` statt `p-6`), einen kleineren Abstand unter dem Titel und Zeilen mit `py-0.5` statt `py-1.5`.
Der Abstand zum Panel „Heute im Park“ ist dort 16 statt 32 px. Alle Zeilen und Preise bleiben.
Magic Kingdom bei 360×780: Karte 151 statt 217 px hoch, die erste Headliner-Zeile liegt bei y=750
statt y=832 und damit ganz über dem Fall. Ab `sm` und auf Parks ohne die Karte ändert sich nichts.

### Der Probelauf unter /admin/duplicates nennt die Zeilen, die der Merge löscht

`app/admin/duplicates/page.tsx` liest jetzt `droppedCurations` aus der Antwort des Probelaufs (`DroppedCuration`: `table`, `from`, `row`). Trägt sie Einträge, erscheint unter der Vorschau ein Block „Verlust“ mit dem vollständigen Inhalt jeder Zeile, damit sich die Kuratierung von Hand zurückschreiben lässt. Bei `from: 'winner'` steht dabei, dass die Zeile der Bahn verloren geht, die bleibt. Fehlt das Feld oder ist es leer, bleibt die Darstellung unverändert. Die Admin-Oberfläche ist einsprachig Deutsch, es kommen keine Strings in `messages/` dazu.

### check:planner prüft die Trefferfläche des Griffs auch an einem Block unter 44 px

Die Zusicherung „die Trefferfläche des Griffs ist 44 px hoch“ tastete 21 px über und unter der Griffmitte ab. Der Griff sitzt im ersten Block des Tages, dessen Höhe von der erwarteten Wartezeit aus `/plan/day` abhängt (61 px um 08:15 UTC, 34 px um 08:5x, derselbe Commit). Unter 44 px überdeckt der Nachbarblock den Überhang des Ziels, der untere Punkt lag im Nachbarn und der Check wurde rot, ohne dass sich am Griff etwas geändert hatte. Die Abtastung bleibt bei ±21 px, zählt aber einen Treffer auf einem Nachbarblock nicht mehr als Fehlschlag (`scripts/check-planner.mjs`). Ein Treffer auf leerem Raster oder ein vom Vorfahren abgeschnittener Überhang bleibt rot. Ein Block unter 44 px ist der dokumentierte Normalfall.

### Das Planer-Sheet respektiert `prefers-reduced-motion` auch auf dem Handy

`SheetContent` hat die Einstellung nie gelesen: Gemessen bei 390 px mit `reducedMotion: 'reduce'` lief am Planer-Sheet weiter `animation-name: enter` über 0,4 s, eine Animation am Element. `components/planner/planner-flyout.tsx` setzt jetzt `motion-reduce:animate-none motion-reduce:transition-none`, das Sheet steht also sofort da und rastet ohne Übergang ein. Der Burger im Header nutzt dieselbe Komponente und bleibt unverändert.

Der Blur der Sheet-Kante hält die Animation durch: Die Energie der Kantenverläufe in einem Streifen unter dem Sheet-Kopf liegt in 14 Frames der verlangsamten Öffnung zwischen 0,84 und 1,01 (Ruhe 0,84, ohne `backdrop-filter` 3,44), beim Schließen zwischen 0,75 und 1,03.

### Ein alter `#calendar`-Deep-Link kostet die Parkseite nicht mehr mit

`#calendar` und `#calendar-YYYY-MM` sind seit dem Umzug des Kalenders auf eine eigene Seite nur noch
Weiterleitungen. Die lag in `useTabHashRouting` hinter `isMounted`, das ein Effect per
`startTransition` setzt — also frühestens zwei Commits nach der Hydration. Die Client-Queries der
Parkseite hängen hinter keinem solchen Gatter: drei von ihnen kamen durch, bevor die Weiterleitung
fiel, und die Kalenderseite holte dieselben Endpunkte danach erneut.

`CalendarHashRedirect` leitet jetzt aus einem Inline-Script weiter, nach dem Muster von
`HeroEntranceGate` und aus demselben Grund: geparst läuft es, während das Dokument noch gelesen
wird, vor den Chunks, die React laden. Gemessen mit `node scripts/measure-api-calls.mjs --only park`
am 2026-10-01 gegen `pnpm build && next start`: **12 Calls / 121,9 KB auf 9 Calls / 92,8 KB**, und
damit auf den Wert, den die Kalenderseite direkt aufgerufen kostet — byte- und callgleich.
Weggefallen sind `weather/nowcast`, der Park-Payload und `/api/nearby`, jeder davon einmal.

Das Monatsfenster rechnet das Script selbst, in der Zeitzone des Parks: „jetzt" serverseitig
einzubacken würde den Wert auf den Render-Zeitpunkt einer prerenderten Seite einfrieren. Der
Weiterleitungszweig in `useTabHashRouting` bleibt, weil das Script nur beim Dokument-Load greift —
eine Client-Navigation mit `#calendar` und jedes spätere `hashchange` laufen weiter über den Hook.

### Trip-Planer: welcher Park an welchem Tag

Ein Assistent auf der Planer-Seite schlägt aus der Crowd-Prognose einen Park pro Tag vor: Länderblöcke, ein freier Reisetag beim Länderwechsel, ein zweiter Tag bei hoher Auslastung, `unknown` zuletzt. „Annehmen“ legt die Tage mit `PlannerDay.reserved` an. Siehe [Trip-Planer](features/trip-planner.md#which-park-on-which-day).

### Kartenpopups zeigen Topspeed, Höhe und Fahrzeit

`AttractionMarkers` (`components/parks/park-map-markers.tsx`) hängt an das Popup einer Attraktion bis zu
drei Zeilen: Topspeed, Höhe und Fahrzeit, je nur dann, wenn die Zahl vorhanden ist. Auf Phantasialand
haben 8 von 40 Attraktionen mindestens eine. Die Werte kommen nicht aus dem Server-Render der
Parkseite (dort fehlt `rideProfile`, 3,61 KB), sondern aus `/api/parks/<geo>/<park>/ride-stats`: 694 B
roh, 338 B gzip. `ParkMap` fragt erst an, wenn der Karten-Tab offen ist; eine Parkseite ohne Karte
macht den Aufruf nicht. Die drei Beschriftungen stehen in allen sechs Sprachen unter
`parks.mapMarkers`.

### Admin-Medien: Sammlungsbaum zählt jedes Bild einmal, der Editor ordnet weitere Sammlungen zu

`app/admin/media/_components/folder-rail.tsx`: Der Sammlungsbaum klappt je Elternknoten ein und aus (Chevron, `data-folder-toggle`). `lib/media/index.ts`: `listCollectionNodes()` liefert jeden Knoten samt Elternpfaden und den Bildern darunter, ein Bild je Knoten nur einmal. Vorher summierte der Browser die Kinder, ein Bild unter `toverland` und `toverland/halloween` zählte am Elternknoten doppelt. Der Zähler gleicht jetzt `searchMedia({ collection })` (Test in `pnpm test:media`).

`media-detail.tsx`: Der Bild-Editor zeigt „Weitere Sammlungen“ als Chips (Mehrfachauswahl, neuer Pfad per Eingabefeld, `parseCollectionPath`). Gespeichert wird als `update` mit `sidecar.collections` in die Session-PR-Stufung. Ordner, Dateiname und URL bleiben unverändert.

### Admin: „Als Ride-Bild setzen" verschiebt die Rolle, statt sie zu verdoppeln

- Ein zweites Foto mit `ride-card` nahm dem alten die Rolle nicht weg. Der Generator warnte über
  zwei Karten, und `getRideImage` zeigte weiter das alte Foto. So blieb die erste Einsendung zu
  Voltron unsichtbar, obwohl sie beim Übernehmen als Ride-Bild markiert war.
- Der Commit-Endpunkt (`/api/admin/media/commit`) nimmt eine eindeutige Rolle (`ride-card` pro
  Ride, `park-background` pro Park) jetzt im selben Pull Request dem bisherigen Halter weg
  (`handOverUniqueRoles` in `lib/admin/media-unique-roles.ts`). Gesucht wird im Manifest und in
  den Sidecars der offenen Media-Session; umgeschrieben wird die Datei vom Branch, nur die
  Rollen-Zeile ändert sich. Der PR-Log nennt beide Bilder.
- In der Detailansicht der Mediengalerie und im Upload-Walkthrough ist das Ride-Bild ein eigener
  Schalter (`RideCardToggle`) mit dem aktuellen Ride-Bild als Vorschaubild. Im Walkthrough steht
  er direkt unter der Ride-Auswahl statt unter den Tags.
- Daten: `europa-park/voltron-nevera-powered-by-rimac` gibt `ride-card` ab und bleibt Hero-Bild.
  Damit ist das eingesandte Foto `…-461ea7` das Ride-Bild von Voltron, und der Build meldet keine
  doppelte Karte mehr.
- `pnpm test:media-unique-roles`: 13 Fälle, darunter der Voltron-Fall mit byte-gleichem Sidecar.
- Doku: [media database → a unique role moves](../features/media-database.md#a-unique-role-moves-when-another-photo-claims-it).

### Admin-Medien: Bild per Drag & Drop direkt auf der Raster-Kachel ersetzen

Eine Bilddatei, die auf eine Kachel im Raster von `/admin/media` gezogen wird, ersetzt das Bild, ohne dass der Editor geöffnet werden muss. Die Kachel zeigt beim Drüberziehen „Drop to replace", danach das neue Bild mit dem Hinweis „New file · not saved". Ein Balken über dem Raster speichert alle vorgemerkten Kacheln mit einem Request je Kachel (ein gemeinsamer Body mit mehreren Originalen überschreitet das Request-Limit) als `replace`-Operation in der Session-PR; nichts wird vorher geschrieben. Mehrere Dateien auf einmal und Nicht-Bilder werden mit einer Meldung abgewiesen (`pickReplacement`, jetzt auch vom Editor genutzt). Die `replace`-Operation trägt kein Sidecar, der Server baut es aus dem Manifest, Alt-Texte, Fokuspunkt und Tags bleiben unverändert.

### Medien: ein Sidecar-Feld `collections` legt ein Bild in mehrere Sammlungen

Eine Sammlung war bisher der Ordnerpfad, ein Bild konnte also nur in einer liegen. Das Sidecar kennt jetzt `collections: string[]` mit Pfaden wie `toverland/halloween`, `/` trennt die Baumebenen. Der Ordner bleibt die Standardsammlung: ohne Feld liegt ein Bild nur dort, und das Manifest bleibt für alle bestehenden Sidecars byteweise gleich.

`getCollection()`, `searchMedia({ collection })` und `/api/media?collection=` liefern ein Bild unter jeder seiner Sammlungen, `/api/media` zusätzlich als `collections` je Bild. `normalizeSidecar` kürzt Schrägstriche am Rand, entfernt Doppelte und meldet einen Pfad, der keine Slug-Segmente ist. `pnpm test:media` prüft ein Bild mit zwei Sammlungen und eines ohne Feld (12 neue Fälle).

### Der Schließen-Knopf jedes Sheets ist im Querformat 44 px groß

`components/ui/sheet.tsx`: Die vier Klassen des Schließen-Knopfs (`top-2`, `right-2`, `size-11`, `rounded-md`) hängen jetzt an `planner-phone:` statt an `max-sm:`. Ein Handy im Querformat (844×390, Grobzeiger) ist 844 px breit, `max-sm:` griff dort nicht, und der Knopf blieb bei 16 px. Gemessen mit `getBoundingClientRect` am Burger-Sheet der Kopfzeile: 844×390 mit Grobzeiger vorher 16×16, nachher 44×44. 360×740 bleibt 44×44, bei feinem Zeiger (700×900, 800×420) bleibt der Knopf 16×16.

### Admin: eingesandte Fotos in die Mediengalerie übernehmen, und ein Hinweis auf neue Einsendungen

- Auf `/admin/contributions` hat jedes Foto einer Einsendung ein Häkchen, vorausgewählt sind alle
  noch nicht übernommenen. „N Fotos in die Mediengalerie" öffnet den Upload-Walkthrough aus
  `/admin/media` (`MediaUpload`, neu mit `seed`), vorbefüllt mit Park, Ride, Caption und Credit
  der Einsendung. Fokuspunkt, Rollen und Alt-Text setzt man dort wie bei jedem anderen Foto, der
  Commit landet im offenen Media-Pull-Request.
- Der alte Hover-Knopf (`AdoptIntoMedia`) schrieb den Credit als `credit.name`. Das Sidecar kennt
  nur `credit.author`, der Name des Fotografen ging also verloren. Jetzt: `author` nur, wenn der
  Besucher einen Namen angegeben hat, dazu `license: all-rights-reserved` und
  `source: contribution`. Ohne Namen gibt es keine Credit-Zeile und keinen Fallback auf
  `OWN_PHOTO_AUTHOR`.
- Übernommene Fotos werden neu kodiert (`withoutMetadata` in `app/admin/_lib/upload-transport.ts`),
  damit kein EXIF eines Besuchers unter `public/media/` landet: GPS, Kamera-Seriennummer,
  Besitzername. Die Drehung eines Hochkantfotos bleibt erhalten, im Test kam ein 1024×768 mit
  Orientation 6 als 768×1024 heraus. GPS steht auch nicht im Sidecar, das Aufnahmedatum schon.
- Die Einsendung merkt sich pro Foto, wohin es ging (`StoredImageRecord.adopted`: Media-ID,
  Pull Request, Zeitpunkt), zeigt „In Galerie" mit Link auf den PR und wird dabei freigegeben.
  Der Dateiname ist fest (`<ride>-<id6>[-n]`), ein zweiter Versuch überschreibt statt zu doppeln.
- Der Upload-Walkthrough hat ein Feld für die Bildunterschrift. Der Commit schrieb `caption`
  schon immer, nur sehen konnte man sie vorher nirgends.
- Nach dem Login zeigt der Admin einen Toast, wenn seit dem letzten Hinweis neue Einsendungen
  eingegangen sind, mit „Ansehen" direkt in die Moderation (`NewContributionsNotice`, neuer
  Endpunkt `GET /api/admin/contributions/summary`). Gemerkt wird pro Browser in localStorage, ein
  Fokus auf den Tab nach mehr als fünf Minuten fragt erneut.
- Doku: [contribute → into the media database](../features/contribute.md#into-the-media-database).

### Das Backstage-Menü zeigt, wann ein Beitrag zuletzt neue Inhalte bekam, und „rechnet durch“ ist ein Prosa-Fehler

- Das Blog-Panel im Header (`getBlogMenu`, `lib/navigation/blog-menu.ts`) sortiert nach letzter
  Änderung (`listArticlesByRecency`, `lastTouched`) und druckt jetzt auch diesen Tag, als
  „Aktualisiert 30. Sept. 2026“ (`navigation.updatedOn`, sechs Sprachen) oder als
  Veröffentlichungsdatum. Vorher stand unter der Änderungs-Reihenfolge das Veröffentlichungsdatum,
  am 01.10. auf Deutsch in der Folge 24. Jul, 17. Jul, 28. Sep. `pnpm test:news-split` prüft
  Reihenfolge und gedruckten Tag in allen sechs Sprachen.
- `updatedAt` bewegt sich nur noch bei neuen Inhalten (neue Termine, Parks, Zahlen, ein
  korrigierter Fakt), nie bei einem Formulierungs- oder Prosa-Durchgang
  (`docs/rules/updated-at-is-for-new-content.md`). Eine Änderung vom 25.09. hatte das Feld auf 89
  Beiträgen gesetzt; es ist aus allen 90 Beiträgen außer dem Halloween-Guide entfernt (sechs
  Sprachen), damit stimmen Menü, Startseite, `dateModified` und `<lastmod>` wieder.
- `scripts/check-prose.mjs`: neuer Fehler „a document that does the sums“ für `rechnet … durch` und
  die fünf Übersetzungen von „rechnet durch, was passiert, wenn“ (`works out what happens`,
  `rekent uit wat er`, `calcule ce qui se passe`, `calcula qué pasa`, `calcola cosa succede`), dazu
  die Warnung „things that calculate“ für einen Guide, eine Seite, einen Kalender, ein Widget, ein
  Gutachten oder den Planer als Subjekt von rechnen. Regel in `docs/blog.md` §2.13. Der Lauf fand
  8 Fehler und 17 Warnungen; alle Stellen sind in den betroffenen Sprachen umgeschrieben, darunter
  Titel, SEO-Beschreibung und Einleitung des Tagesplaner-Beitrags, `planner.page.lead`,
  `fancast.description` und die Touringplan-Definition im Glossar (`GLOSSARY_CONTENT_DATE`
  2026-10-01).

### Rope-Drop-Badge und Headliner-Leiste runden auf das Fünf-Minuten-Raster

- `AttractionCard` reicht den Badges `RopeDropBadge` und `RopeDropEveningBadge` die Werte aus
  `ropeDropDisplayWaits`, dieselbe Stelle wie `RopeDropCard`. `RopeDropHeadliners` rundet `savings`
  mit `roundWaitDeltaTo5` und liest die Abend-Wartezeit aus `ropeDropDisplayWaits`.
- Sortierung und Gatter lesen weiter den Rohwert. Gemessen am 2026-10-01 über 210 Parks: 56 von 336
  `worth`-Empfehlungen (Badge-Hint und Headliner-Leiste) und 6 von 7 Abend-Empfehlungen
  (3 mal `openWait`, 4 mal Trough) standen neben dem Raster, jetzt 0.

### Parks in der Nähe fragt den Status nicht mehr alle 5 Minuten ab

`useParkNeighbors` (`lib/hooks/use-park-neighbors.ts`) lädt `/api/parks/near` einmal beim Laden und danach alle 30 Minuten, und nur solange `LiveNearbyParks` im Viewport steht und der Tab vorne ist. Kommt der Abschnitt mit einem Stand über 30 Minuten wieder ins Bild, folgt ein Request. Rückkehr in den Tab und Wiederverbindung lösen keinen Request mehr aus. Über 35 Minuten mit `page.clock` sank die Zahl der Requests von 5 auf 1 (Abschnitt außerhalb des Viewports) bzw. 2 (im Viewport). Der Tag im Park rechnet in `docs/rules/a-day-in-the-park-has-a-byte-budget.md` mit 18 statt 108 Requests, 9 KB statt 54 KB, gesamt 1.540 KB statt 1.594 KB.

### Ein geteilter Plan hält die Push-Zeile nicht mehr auf einer toten Trip-ID

`adoptSharedPlan` (`lib/planner/trip-share.ts`) verwarf das `replaced` von `syncTrip`. Fand das PUT den eigenen Trip des Betrachters abgelaufen und startete einen neuen, nannte die Subscription-Zeile auf dem Server weiter die alte ID, und der Schalter las beim nächsten Mount `off`. Der Auto-Sync-Callback, der die Zeile sonst neu schreibt, hängt am gemounteten Push-Schalter und läuft auf der Seite `/trip-planner/shared` nicht. Das Neuschreiben liegt jetzt in `lib/planner/push-repoint.ts` (`repointPushSubscription`, zusammen mit `postSubscription` aus dem Hook gezogen) und wird vom Hook und von `adoptSharedPlan` benutzt. Scheitert es, wird der neue Trip zurückgenommen und der Schalter steht auf `off`, wie bei einem abgelehnten Write. `pnpm test:trip-share` deckt die drei Fälle ab (Zeile neu geschrieben, Zeile abgelehnt, Trip überlebt das PUT), `pnpm test:push-arming` liest `postSubscription` jetzt aus dem neuen Modul.

### Ein Bahn-Link im Glossar-Widget zeigt die Live-Wartezeit

- `BlogGlossaryRideLink` löst einen Bahn-Link aus einer Glossar-Definition (`/de/parks/<kontinent>/<land>/<stadt>/<park>/<bahn>`)
  über `resolveAttraction` auf und rendert ihn mit `BlogAttractionLink`, demselben Chip wie ein `ref:`-Link: Wartezeit-Badge im Betrieb,
  Status-Badge sonst, live nachgeladen über `useLiveBlogRide`. Die Option `chip` lässt die Park-Angabe in Klammern weg, weil die Definition
  den Park meist schon nennt.
- Ein Park-Link (vier Segmente), eine unbekannte Bahn oder ein fehlgeschlagener Abruf bleibt der bisherige Anker. Die Glossar-Seite selbst
  übergibt kein `renderLink` und ändert sich nicht.
- Im Europa-Park-Guide tragen die drei Bahn-Links der Karte `swing-launch` jetzt je ein Badge (Toutatis, The Ride to Happiness, Schwur des Kärnan).
- `pnpm test:glossary-ride-href` pinnt, welche Links den Chip bekommen: ein Bahn-Pfad in allen sechs Sprachen, kein Park-Link, keine externe URL.

### Footer: „Beliebte Parks" zieht mit den Link-Spalten gleich

`components/layout/footer.tsx`: die vier Länder-Abschnitte waren handgeschriebene `<section>`-Blöcke mit rohem `<div>` als Überschrift, einer dritten Stilebene für die Länderzeile und Park-Links ohne Padding (20 px hohe Zeile). Sie laufen jetzt datengetrieben aus `popularParks` und nutzen `MenuSectionHeading` (Länderseite als `href`) und `footerLinkClass` mit `py-1` und `max-sm:min-h-11`, wie „Inhalte", „Werkzeuge" und „Rechtliches". Die Überschrift „Beliebte Parks" steht nur noch im `aria-label` der vier Listen. Die Links und ihre Reihenfolge bleiben gleich, ebenso die sechs Sprachen.

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

### Der Tagesplaner lädt erst, wenn ihn jemand öffnet

- `PlannerLauncher` bindet `PlannerFlyoutHost` über `next/dynamic` ein und holt den Chunk zusammen
  mit den `planner`-Texten, sobald das Panel gebraucht wird (Öffnen, ein gespeicherter Plan, eine
  Anfrage von außen; wer einen gespeicherten Plan hat, lädt ihn also weiter). Die Lasche am Fensterrand bleibt sofort da.
- Script-Bytes des ersten Aufrufs ohne gespeicherten Plan, zwei Builds, Cache aus, 360 px: Parkseite 569,3 → 512,3 KB
  (−57,0 KB), `/de/parks` 385,1 → 306,6 KB (−78,5 KB). CLS mit `pnpm measure:cls --late`
  unverändert (0,0002 mobil, 0,0091 Desktop).

### Der Live-Poll schickt kein `park` mehr je Attraktion

`app/api/parks/[...path]/route.ts` hängte jeder Attraktion `park: { slug }` an, damit `enrichAttractionsWithImages` das Foto findet, und schickte den Schlüssel danach mit. Kein Leser nutzt einen `park` ohne Name, Zeitzone oder Stadt, und der Merge hätte damit einen vollständigeren `park` überschrieben. Der Schlüssel fällt nach dem Lookup weg: Phantasialand, 40 Attraktionen, 41.432 auf 40.152 B roh, 4.693 auf 4.666 B brotli je Poll. Die übrigen fünf Felder bleiben, Begründung in `docs/rules/a-day-in-the-park-has-a-byte-budget.md`.

### Die Ride-Suche der Parkseite findet dauerhaft geschlossene Bahnen

- „x2“ im Suchfeld auf der Parkseite von Six Flags Magic Mountain lieferte „Keine Attraktionen
  gefunden“: Die Suche lief nur über das Live-Grid, und X2 steht dort seit der Stilllegung nicht
  mehr. `useAttractionFilter` durchsucht jetzt auch die geschlossenen Bahnen des Parks, mit den
  Fuse-Optionen des Grids und demselben verzögerten Suchbegriff (`closedRideMatches`). Ein Treffer
  steht unter den Live-Ergebnissen oder an Stelle des Leerzustands, mit Badge „Dauerhaft
  geschlossen“, Bereich und Monat der Schließung, und verlinkt die Seite der Bahn
  (`ClosedRideMatches`). Pills und Mindestgröße wirken darauf nicht.
- Die Liste baut der Server aus `closedAttractions` (`closedRidesForSearch`), mit dem Monat als
  fertigem Text; ein Park ohne geschlossene Bahn schickt nichts davon an den Client.
  `pnpm test:closed-ride` prüft sie mit.
- Ein Jahr nach der Schließung verschwindet die Bahn von selbst aus Liste und Suche der Parkseite
  (Backend: `CLOSED_RIDE_PARK_PAGE_DAYS`, `isOnParkPage()`); ihre Seite und ihr Sitemap-Eintrag
  bleiben, danach ist sie nur noch über ihre URL erreichbar. Die Stilllegungsliste im Admin zeigt
  „nach 1 Jahr von der Parkseite genommen“ und dann keinen Ausblenden-Knopf mehr.

### Beiträge ohne Titelbild zeigen Logo und Verlauf statt einer leeren Stelle

- Neue Komponente `BlogCoverFallback` (`components/blog/blog-cover-fallback.tsx`): dunkler Grund
  mit vier Lichtern in den Logofarben, darauf der Pin aus `logo-dark.svg`. Sie steht überall, wo
  sonst das Titelbild steht: Artikelkopf, Blog-Karte, Handy-Zeile, `NewsList`, `/news`-Übersicht,
  News- und Blog-Panel im Header und der Toast für neue Beiträge. Vorher hatte jede dieser Stellen
  ihren eigenen Ersatz (blasse Fläche, grauer Verlauf, Zeitungs-Icon) oder gar keinen, und eine
  News ohne Bild war in der Liste eine Zeile ohne Vorschaubild zwischen Zeilen mit Bild.
- Der Farbton (blau, grün, türkis) hängt am Slug (`coverFallbackHue`), damit zwei solche Beiträge
  nebeneinander nicht dasselbe Bild zeigen.
- Alles Visuelle steht in `.blog-cover-fallback` in `app/globals.css`, der Pin als `::after`. Pro
  Beitrag bleibt ein `<span>` mit zwei Datenattributen: 119 B HTML und 137 B RSC, gegenüber 775 und
  841 B für `<img>` plus Inline-Verlauf. Das zählt, weil die Header-Panels auf jeder Seite verborgen
  mitgerendert werden.
- Ein festes 1200×630-Bild war der erste Versuch und passte nirgends: Im Artikelkopf lag der Pin
  hinter dem Anreißer, in der Karte blieb zwischen den Glasflächen nur seine Spitze, bei 88 px war
  er nicht mehr zu erkennen. Deshalb setzt der Einsatzort den Pin (`mark`: `side` rechts neben der
  Überschrift ab `lg`, sonst `center`). In der Karte liegt der Grund unter der ganzen Karte und der
  Pin im Fotostreifen, wie bei `CardPhotoFrame`; eine Karte ohne Bild öffnet ihren Fotostreifen
  jetzt wie jede andere (240 px).
- Doku: [blog cover fallback](../features/blog-cover-fallback.md).

### Eine dauerhaft geschlossene Bahn behält ihre Seite, und ihr Park nennt sie

- X2 in Six Flags Magic Mountain wurde am 13.07.2026 stillgelegt, und ihre Seite antwortete seitdem
  404, während unser News-Artikel zur Schließung auf sie verlinkte und die Inline-Referenz darin
  „Geschlossen“ zeigte. Die Ride-Seite suchte die Bahn nur im Park-Payload, und dort fehlen
  stillgelegte Bahnen. Jetzt fragt sie bei diesem Fehlgriff den Detail-Endpunkt
  (`lib/parks/closed-ride.ts`). Eine Bahn mit `retiredKind: 'closed'` rendert `ClosedRidePage`: 200,
  indexierbar, eigener Titel und eigene Description („X2 in Six Flags Magic Mountain – dauerhaft
  geschlossen“, mit Datum, der Wochentags-Spitze vor der Schließung und dem Hersteller), der
  News-Artikel in der Sprache der Seite, die typischen Wartezeiten, das Bahnprofil und die Beiträge.
  Eine umklassifizierte Zeile (jetzt Show oder Restaurant) bleibt 404.
- Blog-Referenzen und ihre Hover-Karte zeigen „Dauerhaft geschlossen“
  (`ParkStatusBadge status="RETIRED"`, `closedPermanently` am `ResolvedAttraction`).
- Die Parkseite listet `closedAttractions` unter dem Ride-Grid (`ClosedRidesList`), getrennt von
  `attractions`, damit keine Zählung, kein Filter und kein Planer eine geschlossene Bahn mitzählt.
  Im Admin (Stilllegungen) lässt sich eine Bahn dort ausblenden; ihre Seite und ihr Sitemap-Eintrag
  bleiben.
- Braucht v4.api.park.fan PAR-607 zuerst. Regel:
  [a closed ride keeps its page](../rules/a-closed-ride-keeps-its-page.md); `pnpm test:closed-ride`.

### Byline im Beitrags-Header und auf Karten: „Patrick" statt „Patrick Arns"

- Autorendateien kennen ein optionales Feld `shortName` (`lib/blog/types.ts`). `BlogPostBanner` und
  `BlogPostCard` zeigen es als Byline, sonst den vollen `name`. `content/blog/authors/patrick.md`
  setzt `shortName: Patrick`.
- JSON-LD, Meta-Autor, RSS-Feed, Autorenseite, Avatar-`alt` und das `aria-label` des Autorenlinks
  behalten den vollen Namen.
- Der Blog-Editor reicht das Feld beim Anlegen und Bearbeiten eines Autors durch
  (`AuthorCreateModal`, `buildAuthorFile`), damit ein Speichern dort es nicht löscht.

### Changelog: 2.12.0 in sechs Zwischenversionen aufgeteilt

- Der öffentliche Eintrag 2.12.0 deckte fünf Wochen ab (16.08. bis 21.09.), vom Wetter-Chart über
  den Tagesplaner und die Wartezeit-Alarme bis zu den Statistikseiten. Jetzt sind es sechs
  rekonstruierte Einträge, 2.11.1 bis 2.11.6, je ein bis zwei Wochen und ein Thema, und ein echtes
  2.12.0 mit dem, was am 20. und 21.09. landete. Die Seite zeigt 37 Einträge statt 31.
- Die Nummern sind vergeben, nicht aus dem Code: `package.json` sprang am 27.08. mit #343 auf 2.12.0
  und blieb dort bis zum Schnitt am 21.09. (#531). Seitennotiz und
  `docs/rules/a-version-is-a-unit-of-communication.md` nennen den Lauf und den Grund.
- Jeder Punkt trägt das Datum seines Commits oder des internen Abschnitts. Neu dazugekommen, weil
  2.12.0 sie ausgelassen hatte: der Andrangskalender als eigene Seite (#343, #350), die Startseite
  „Was ist park.fan?“ (#368), der Vergleich zweier Kalendertage (#438), die Stundenkurve im
  Kalendertag (#472), die Unsicherheit der Prognose im Tagesdialog (#484), die gezeichnete
  Störungsschätzung (#478), `/favorites` im Footer (#493), die Footer-Spalten (#502), Google- und
  Apple-Maps-Links (#525), die Andrangsskala am Badge (#541), Umbaupause (PAR-288), Transport-Badge
  (#534), Countdown und Soll-Ist im Planer (#540, PAR-10), Bildnachweise (#524).
- Das Highlight-Bild der Ride-Seite wandert mit dem Punkt zu 2.11.4 (5.09.).
- Zwei Korrekturen aus dem Prosa-Review: „Today at this ride“ aus dem alten 2.12.0 steht in keinem
  englischen String, der Punkt beschreibt jetzt das Panel selbst. Und der Cache-Fehler vom 25.08.
  (#340) traf jede Ride-Seite, nicht nur Hagrid; 2.11.1 sagt das (35 statt 60 Minuten, 53 Minuten
  alt).

## 2.13.0 (2026-09-30) – Kompass im Park, News neben dem Blog, „Mit Kindern“ je Park

Geschnitten am 2026-09-30 und umfasst alles, was nach PAR-319 (PR #531, 2026-09-21) auf `main`
kam. Der öffentliche Eintrag ist `content/changelog/2.13.0.md`. Neueste Abschnitte zuerst.

### Changelog: im Footer verlinkt, Sprungliste, Historie ab Juni 2025, Regeln für den Schnitt

`/en/changelog` hatte keinen einzigen Link von einer anderen Seite und zeigte nur 2.12.0. Jetzt:

- **Footer:** „Changelog“ in der Spalte Inhalte, in allen sechs Sprachen, mit `hrefLang="en"` und
  dem Sprachhinweis im Label der fünf anderen (`footer.changelog`). Die Versionsnummer unter dem
  Copyright verlinkt auf den Eintrag ihrer Version (`changelogHref()` in
  `lib/changelog/paths.ts`).
- **Sprungliste:** `ChangelogIndex` listet jede Version mit Datum, nach Jahr gruppiert; ab `lg`
  eine eigene Spalte, die beim Scrollen stehen bleibt, darunter ein Raster unter der Einleitung.
  `<title>` ist „Changelog: versions and release dates | park.fan“ statt nur „Changelog“.
- **Historie (PAR-320):** 29 rekonstruierte Einträge von 0.2.0 (Juni 2025) bis 2.11.0, gruppiert wie
  ein Release: ein bis drei Wochen, ein Thema, nur Funktionen und sichtbare Fixes, kein Blog- oder
  News-Post. Versionen und Daten stammen aus den `package.json`-Bumps der Git-History bzw. aus den
  Überschriften dieses Logs; ein Eintrag über mehrere Bumps nennt den letzten in `through`
  (z. B. 2.7.11–2.7.14). Wo `package.json` wochenlang stehen blieb, sind Zwischenversionen
  vergeben: 2.8.2 und 2.8.3 (Mai) und 2.10.2 bis 2.10.5 (11. Juni bis 2. August), sonst hätte ein
  Eintrag zwei Monate umfasst. Die Seite sagt das unter der Einleitung. `reconstructed: true` zeigt
  ein Badge; jede Zahl ist im Commit oder Log-Abschnitt nachgelesen.
- **2.12.0 neu geschrieben:** alle 16 Stichpunkte begannen mit einem fett gesetzten Satz, genau
  das Layout, das `docs/blog.md` §4.2 als Chat-Muster nennt, und die README der Sammlung schrieb es
  vor. Dazu drei Starts aus der Periode, die der Eintrag nicht nannte: der Tagesplaner (#388,
  4.9.), die Wartezeit-Alarme (#423, 8.9.) und `/favorites` (#488, 16.9.), außerdem die
  Statistikseiten (#546, drei Minuten vor dem Schnitt gemergt). `pnpm check:prose` prüft
  `content/changelog/` jetzt mit (Fehler: Fettdruck am Anfang eines Listenpunkts, Gedankenstrich,
  Markdown in `title`/`summary`).
- **Regeln für den Schnitt:** `pnpm check:changelog` (auch in der CI) prüft Dateiname gegen
  Version, Datumsfolge, `package.json` gegen den neuesten veröffentlichten Eintrag und die
  Versionsüberschrift hier im Log. Dabei fiel auf, dass 2.12.0 hier nie eine Überschrift bekommen
  hatte; die steht jetzt.
- **Fragmente statt Abschnitten in dieser Datei:** Ein PR schreibt seinen Abschnitt ab jetzt als
  `docs/changelog.d/PAR-<n>.md`, wie das Backend seit PAR-257. 54 der 309 Commits auf `main` im
  September haben diese Datei angefasst, und dieser PR bekam hier innerhalb einer Stunde einen
  Konflikt mit #684. `pnpm release:cut <version> --title …` faltet die Fragmente beim Schnitt ein,
  löscht sie, setzt `package.json` und legt den öffentlichen Eintrag als Entwurf an.
  `check:changelog` lehnt jeden `## Unreleased`-Abschnitt hier und jedes Fragment ab, das der
  Schnitt nicht sauber einfalten könnte, und einen veröffentlichten Eintrag mit `TODO` aus dem
  Entwurf. `pnpm test:changelog-fragments` (22 Checks) führt einen ganzen Schnitt in einem
  Temp-Verzeichnis aus.

### „Warteschlange“ auch in der Kapitelliste des Menüs (#686)

- Das Header-Menü nannte Kapitel 04 der Beste-Zeit-Seite „Tricks für kurze Schlangen“, das Kapitel
  selbst heißt „Tricks für kurze Warteschlangen“. Das Label steht in `lib/best-time/chapters.ts`,
  eine Datei, die `check:prose` nie gelesen hat; ein Hinweis im Foto-Admin hatte dasselbe Wort.
- `check:prose` sucht „Schlange“ jetzt in jedem String der getrackten `.ts`- und `.tsx`-Dateien
  unter `app/`, `components/` und `lib/`, Kommentare vorher entfernt. Als eigene Fläche `source`
  läuft der Durchlauf bei `--only=changelog` nicht mit.

### The "more" menu lists what its three hubs hold, and the phone menu does too

„Mehr" was three cards of one line each, with the dictionary's twelve categories under the middle
one: from a 1280 px bar two thirds of the band were empty, below it the band was the three cards
alone (231 px, where the news, parks and blog bands open to 455–595 px at a 1024 px bar), and the
one list in it hung in the middle column. Each hub is now a column with its photo and its contents
— the dictionary's categories on the left, then the best-time hub's six chapters with a Fancast
card, then the guide's eleven chapters — at every bar width, 591 px in all six locales. The
chapters are fragment links on their hub, so they add no crawl target; their lists are the arrays
the pages render (`lib/howto/chapters.ts`, moved out of the six content modules, and the new
`lib/best-time/chapters.ts`), resolved in the layout with the photos (`lib/navigation/more-menu.ts`)
and pinned by `pnpm test:hub-chapters`. The footer row is pills; Fancast moved from it to its card.

On the phone the three hubs open like „Parks entdecken" (`SheetDisclosure`): „Übersicht" first,
then the categories or chapters. A link to the page already showing now closes the band as it
already closed the sheet, so a chapter clicked on its own hub no longer leaves the band over the
page. New strings: `navigation.fancastHint`, `navigation.overview`. The measurements — contrast of
the text on the photos, row alignment, label widths, byte cost — are in
[header navigation](features/header-navigation.md#three-hubs-each-with-what-it-holds-2026-09-30).

### Größenstufen je Park auf einer eigenen Seite: „Mit Kindern“

Der Größenfilter der Parkseite ist ein Schieberegler, also Zustand und kein Text. Die Zahlen dahinter
stehen jetzt unter einer eigenen URL: `/de/parks/…/mit-kindern`, in allen sechs Sprachen über einen
Rewrite auf dem englischen Routenordner `with-kids` (`mit-kindern`, `with-kids`, `met-kinderen`,
`avec-enfants`, `con-bambini`, `con-ninos`).

Die Seite hat eine Karte je Größe, bei der sich die Antwort des Parks ändert (seine eigenen
Mindestgrößen), mit der Zahl des Reglers („23 von 40“, dasselbe `canRideAtHeight`) und den Bahnen, die
genau ab dieser Größe dazukommen, jede mit Link auf ihre Ride-Seite. Vor der ersten Stufe stehen die
Attraktionen ohne veröffentlichte Mindestgröße, ausdrücklich ohne das Versprechen, dass sie für jede
Größe frei sind. Jede Stufe hat zwei Links: die Parkseite mit `?height=`, deren Regler dann auf dieser
Stufe startet, und „Tag für diese Größe planen“, der die Größe an den Wizard des Planers übergibt
(`lib/planner/page-height.ts`, wie beim Datum aus dem Kalender) und dabei auf den Chip darunter rundet.

**Gegatet auf die Entscheidung des PO vom 29.09.:** mindestens 20 Attraktionen mit `minimumHeight`
und mindestens die Hälfte aller Attraktionen des Parks, eine Konstante (`KIDS_PAGE_GATE`). Am
Zensus dieses Tages sind das 32 von 203 Parks, also 192 URLs (die 41 im Beschluss sind die Zahl für jede der beiden Bedingungen allein). Hansa-Park und Efteling bekommen keine
Seite. Die Parkseite verlinkt sie nur für Parks über der Grenze, die Sitemap ebenso, und die Route
liefert darunter 404. ISR mit Tagesfenster wie die Statistikseite. `pnpm test:park-kids`. Konzept:
[dedicated-landing-pages.md §12](seo/dedicated-landing-pages.md).

### Homepage and trip planner: copy without the quips

The homepage bands and the trip-planner page read as generated, and not because of single words:
nearly every lead ended on a joke or a simile („Die geht ganz ohne Anstehen“, „so dankbar wie eine
Stauprognose für den ersten Ferientag“, „ganz ohne flauen Magen“, „ungefähr eine Serienfolge pro
Bahn“, „Andere kaufen sich … einfach einen Express-Pass“, the child in the Taron queue who would
rather ride the teacups), plus `nicht X, sondern Y` turns and closing maxims (§2.1, §2.8 of
[blog.md](blog.md)). German was rewritten first, 69 keys in `home`, `homeStory`,
`seo.homepage.faq` and `planner` plus the planner article in
`app/[locale]/trip-planner/content/de.tsx`; the other five locales were written from it as their
own sentences.

Five statements were wrong and are fixed with it:

- The crowd calendar's orange and red were described as „a three-quarter-hour queue at every
  popular ride“. The colour is relative to a typical day in the same park
  (`CROWD_LEVEL_PERCENT_RANGE`), so the band now says that, with the consequence spelled out.
- The hero intro pointed at the world map, which is only drawn from 1280 px of page width.
- „Zu jedem Park gibt es den passenden Artikel“: many parks have none.
- The AI chapter said „instead of a crowd level per day“ under a calendar that shows one.
- The nearby chapter said the list is sorted by distance; open parks come first
  (`nearby-parks-list-view.tsx`).

`UI_EM_DASH_BASELINE.en` in `scripts/check-prose.mjs` drops from 30 to 27.

### Homepage on a phone: one band padding throughout, and a kicker that stands on its own

Below 768 px the park block under the hero (nearby, favourites, popular parks, open parks per
continent) had a different gap at every band edge, measured on `/de` at 390 px from the last
content of one band to the first of the next:

| Edge                        | before         | after    |
| --------------------------- | -------------- | -------- |
| hero photo → nearby heading | 0              | 64       |
| nearby → favourites         | 64 \| 32       | 64 \| 64 |
| favourites → popular parks  | 32 \| 48 (+12) | 64 \| 64 |
| popular parks → open parks  | 48 \| 64       | 64 \| 64 |

Every story chapter below already ran 64 | 64 (`STORY_SECTION`, 72 from `sm`).

- **`NearbyChapter`** gets a top padding below 768 px. It had none because `ThreeSteps` stands
  above it on a wide page, but `PHONE_LATER` moves the steps under the park lists on a phone, so
  the heading tile sat flush on the hero photo's lower edge. From 768 px up nothing changes.
- **`FavoritesSection`, `FavoritesEmptyState`, `FeaturedParksSlot` and `FeaturedParksSkeleton`**
  take a `className` for their band padding. The homepage passes `STORY_SECTION_Y` (new in
  `section-chrome.ts`) to each section and to its fallback; blog and glossary pages keep the
  tighter padding they had. On a wide homepage this is the same 72 | 72 as every other edge now
  (favourites ran 32, popular parks 48).
- **The popular-parks heading** loses its frosted pill: `bg-background/70` on `bg-background`,
  so on every page nobody saw the pill, only its `px-4`, which put the star 16 px right of the
  cards. The skeleton drops it the same way.
- **The nearby chapter's kicker** read „Schritt 1 in echt“ („Step 1, for real“), a pointer at
  `ThreeSteps` above it. On a phone the steps come after it, so the first thing under the hero
  was a „step 1“ nobody had met yet. It says „Dein Standort“ now, in all six locales.

### Park page: the location control moves onto the title card's address line

The park page's near-you row sat between the title card and „Heute im Park", outside both cards,
so on a phone its line of muted text stood on the park's photo. With location on and the visitor
elsewhere it read „Du bist 55,7 km vom Park entfernt", under a badge two lines up that already said
„55,7 km entfernt".

- **`ParkLocationLine`** is the park page's location control now, on the title card's address line
  after the distance badge: the button while nothing is decided, the way out after a block,
  „Standort aktiv" once the position is in, „Du bist im Park" in the park. One box at one fixed
  height in every state (44 px below `sm`, 32 px from `sm` up); below `lg` it is a line of its own,
  from `lg` it takes what is left beside the address and the distance.
- **`ParkInParkBlock`** renders only the rides around a visitor in the park, above the tabs, and
  nothing for everyone else. The row between the two cards is gone.
- After a block the line reads „Standort blockiert" (`location.blocked`, new in six locales) beside
  „So änderst du das": the homepage's sentence left about 70 px for itself on a 360 px phone. Beside
  Chrome's own `<geolocation>` button the text is left out below `sm`.
- `ParkDistance` takes `keepGap`: with no position coming, its empty box stays at every width when
  the location line follows it. Dropping it moved the line 160 px left at 1280 px (0.004 CLS).
- `useInParkBlock` is the decision both read; `nearby.parkPage.away` is gone from all six locales.

Rule: [location-is-asked-for-where-it-is-needed.md](rules/location-is-asked-for-where-it-is-needed.md).

### INP: no `:has()` in the stylesheet, and a tab tap that only moves the highlight

Search Console flagged 361 park pages on 2026-09-23 for INP over 200 ms on phones (group value
203 ms, example Six Flags Great Adventure). Traced on that page against a production build at
390 px and 4× CPU:

- **Every DOM change restyled the whole document.** With any `:has()` rule active, Chrome restyles
  `<html>` after a mutation anywhere on the page, and here that recalculates all ~2,700 elements:
  400–500 ms for one changed character in one ride card, paid by every React commit and so by
  every tap. The thirteen rules came from shadcn's Button and Card, the two range sliders, the
  homepage hero, the planner grid, the scroll-lock gutter in `globals.css` and the Tiptap editor.
  Each is replaced (`peer-*`, a data attribute set by React or by a delegated listener, a call-site
  class, `~=` on a word list); the editor's two rules moved to a stylesheet only the editor loads.
  `pnpm check:no-has` guards the sources in CI and `pnpm build` checks the CSS it emits.
- **A tab tap unmounted the ride list inside the tap.** Radix mounted and unmounted panels on the
  urgent tab value, so leaving the ride list removed 1,457 nodes in the tap's commit and its
  `Presence` forced a style pass there. Panels are `forceMount`ed and shown by the deferred tab now,
  `data-state` included (a flip on the urgent value restyled the ride list's 1,312 elements through
  Tailwind's `group-data-*` rules); the ride list is only hidden, and the panel bodies are `memo`
  boundaries, so the tap no longer re-renders the panel it is leaving.
- **The planner's width store read `window.innerWidth` in `getSnapshot`**, forcing style and layout
  in the middle of every render of the edge tab (317–522 ms). It reads the width on subscribe and
  on `resize` now.

A/B against two production builds, 4× CPU, 390 px: the median of 13 taps on the page went from
712 ms to 208 ms, typing in the ride search from 892 to 88 ms, the Weather tab from 1,224 to 224 ms.
The filter sheet still takes 680–872 ms to open, nearly all of it Radix's scroll lock, and is left
for a change of its own. `pnpm measure:inp` prints the style probe and every tap's Event Timing entry. Rule and numbers:
[no-has-selector-in-the-stylesheet.md](rules/no-has-selector-in-the-stylesheet.md), the tab panels in
[an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md](rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md).

### Kompass: erscheint auch, wenn der Hero im Bildschirm endet

Der Kompass kam bisher nur, solange sein Platz unter dem Hero unterhalb des Bildschirms lag.
Auf Englisch endet der Hero im Disneyland Anaheim bei 680 px („Welcome to Disneyland Park" hat
zwei Zeilen, die deutsche Begrüßung drei), also mitten im Bildschirm: Auf 390 × 844, 412 × 915
und 430 × 932 erschien der Kompass in fünf von sechs Sprachen nie. Ganz oben auf der Seite kommt
er jetzt immer. Das schiebt den Anschnitt des nächsten Kapitels aus dem Bild und kostet bis zu
0,30 Layout Shift, nur bei Aufrufen aus einem Park. Wer gescrollt hat, bleibt unberührt.
Messungen: [park-compass.md](features/park-compass.md#where-it-appears-and-when).

### Standort: fragen, wo er gebraucht wird, und nach einem Nein nicht mehr

Wie lange ein Ja zum Standort gilt, entscheidet der Browser. Wie oft wir fragen, entscheiden wir.
Gefragt wird auf der Startseite und den Parkseiten, denn nur dort braucht die Seite den genauen
Standort (In-Park-Erkennung, Bahnen in der Nähe). Blog, News und alle anderen Seiten fragen nie.

- **Wer früher schon Ja gesagt hat** (`pf_geo_optin`), bekommt auf Startseite und Parkseite direkt
  den Prompt des Browsers, ohne unser Banner davor. Safari auf dem iPhone vergisst ein Ja mit der
  Einstellung „Fragen" bei jedem Neuladen, Chromes „Nur dieses Mal" mit der Seite.
- **Wer noch nie geantwortet hat,** sieht auf der Startseite das Banner und auf der Parkseite die
  Zeile „Standort nutzen". Der Prompt kommt erst nach dem Tipp.
- **Nach einem Nein** (Banner geschlossen oder Prompt abgelehnt) kommt 30 Tage kein Banner und bis
  zum nächsten Ja kein direkter Prompt. Die Zeile auf der Parkseite behält ihren Knopf. Blockiert
  der Browser, zeigt keine Stelle mehr einen Knopf, der nichts tun kann. Das Umami-Event für eine
  Ablehnung zählt weiter nur eine Antwort auf der Seite.
- **Ein Nein lässt sich zurücknehmen.** Unter dem Einleitungssatz des Kapitels „Freizeitparks in
  deiner Nähe" steht eine feste Zeile: „Standort aktivieren", „Standort aktiv" oder bei Blockade
  „Standortzugriff ist im Browser blockiert" mit „So änderst du das" (Anleitung für Safari auf
  iPhone oder Mac, sonst für das Symbol links neben der Adresse). Die Zeile auf der Parkseite zeigt
  dasselbe. In Chrome ab Version 144 steht dort stattdessen Chromes eigener
  `<geolocation>`-Knopf, der eine Blockade direkt auf der Seite aufheben kann.
- **Weggeklickt ist nicht blockiert.** Wer in Chrome den Prompt nur schließt, behält den Knopf.
  Bisher stand dann bis zum Neuladen „blockiert" da. Das Umami-Event `nearby_permission_denied`
  zählt damit nur noch echte Blockaden.
- **Meldet der Browser `granted`,** liest jede Seite den Standort ohne Frage.
- **Die Parkkarte hat selbst gefragt,** beim Öffnen des Karten-Tabs und in jedem Blogartikel mit
  Karte. Chrome sperrt eine Seite nach drei ignorierten Anfragen für eine Woche. Die Karte nimmt
  den Standort jetzt aus dem Context.
- **Nach Ablauf von „Nur dieses Mal"** (Chrome, nach fünf Minuten im Hintergrund) kam beim
  Zurückwechseln in den Tab sofort ein Prompt. Die Hintergrund-Aktualisierung prüft jetzt vorher
  den Status. Eine temporäre Freigabe in Firefox aktualisiert weiter.

Details und Messungen:
[location-is-asked-for-where-it-is-needed.md](rules/location-is-asked-for-where-it-is-needed.md),
Test: `pnpm test:geolocation-permission`.

---

### Kompass: Umami zählt, ob er genutzt wird

Fünf Events, vier davon ohne Property: gesehen (`compass_viewed`) und Handy-Kompass aktiv
(`compass_heading_on`) je einmal pro Seitenaufruf, eine Bahn fixiert (`compass_ride_pinned`), zur
Bahn gewechselt (`compass_ride_opened`, mit `from`: Leiste oder Liste) und die Pille „Zum Kompass"
im Hero getippt (`compass_pill_clicked`). Nicht gezählt werden das Lösen einer Fixierung, jede
Drehung und Besuche mit `?sim=`, also die eigenen Tests.
Details: [analytics.md](development/analytics.md#the-in-park-compasss-five-events-sep-2026).

### Kompass nach Design-, Architektur- und Usability-Review

Drei Prüfer haben den Kompass unter dem Hero durchgesehen, das hier ist umgesetzt:

- **Blickrichtung:** Die Leiste nennt nur noch eine Bahn im Blickkegel (±30°), sonst die nächste.
  Sie wechselt erst, wenn die neue Bahn 0,3 s vorn bleibt. Vorher stand dort „Vor dir" für eine
  Bahn 116° daneben, und bei vier Bahnen innerhalb von 10° sprang die Leiste zehnmal in fünf
  Sekunden. Der Kompass rechnet jetzt nach geografisch Nord (Missweisung aus dem
  Weltmagnetfeldmodell, 2,2° in Paris, rund 11° in Anaheim). Ein hochkant gehaltenes Handy nimmt
  die Richtung seiner Rückseite.
- **Ohne Kompass** gibt es keine Pfeile mehr, die wie „hier lang" aussehen: Chips und Zeilen
  nennen die Himmelsrichtung („Richtung Südwesten"). Ein abgerissener Sensor fällt auf „Norden ist
  oben" zurück, statt einen eingefrorenen Pfeil zu zeigen. Auf dem iPhone steht dabei, was Safari
  fragen wird, und nach einer Ablehnung gibt es „Nochmal fragen".
- **Zifferblatt:** Die Gradzahlen und die Gradanzeige sind weg, das Zifferblatt ist größer. Die
  Punkte zeigen, was die Bahn macht: Wartezeit auf deckender Farbe (im hellen Theme vorher 2,1 bis
  3,2 : 1 Kontrast, jetzt 5,4 bis 7,9 : 1), Störung als oranger Ring mit Warnzeichen, geschlossen
  als kleiner leerer Ring. Jeder Punkt hat 44 px Tippfläche. Blau steht nur noch für dich und
  deinen Weg, Norden ist nicht mehr blau.
- **Leiste und Liste:** Die Leiste ist ein Link zur Bahn, eine Fixierung lässt sich mit ✕ lösen.
  In der Liste steht der Status als Text in der zweiten Zeile, die Namen werden nicht mehr auf
  70 px gekürzt. Beim Gehen sortiert sich die Liste erst um, wenn eine Bahn mindestens 15 m näher
  ist, und der Entfernungsring springt nicht mehr hin und her.
- **Kein Sprung beim Laden:** Der Kompass wird nur eingefügt, wenn seine Stelle unterhalb des
  Bildschirms liegt. Wer schon weitergescrollt hatte, bekam vorher eine Layout-Verschiebung von
  1,0, jetzt 0. Beim Drehen wird nur noch das neu gezeichnet, was sich dreht: 60 statt 45 Bilder
  pro Sekunde, ein Achtel der Style-Arbeit.

Die Demo kennt zwei amerikanische Parks (`?sim=compass:disneylandanaheim`,
`?sim=compass:magickingdom`). Die haben offen, wenn in Europa Nacht ist und jeder Punkt ein leerer
Ring wäre.

Bewusst nicht übernommen: die Lünette ganz zu entfernen und „Fixiert" in „Dein Ziel" umzubenennen.
Details: [park-compass.md](features/park-compass.md).

### Kompass: folgt dem Blick, Tippen fixiert, Pille im Hero

Die Leiste unter dem Kompass nennt jetzt immer die Bahn, in deren Richtung das Handy zeigt, und
wechselt sofort beim Drehen. Vorher wurde sie erst nach 8° Drehung neu bestimmt, und ein einziger
Tipp auf einen Punkt hielt sie für immer fest. Ein Tipp fixiert jetzt eine Bahn (Pinnadel am Punkt,
„Fixiert" in der Leiste), ein zweiter Tipp löst sie wieder. Im Hero steht, solange der Kompass auf
der Seite ist, die Pille „Zum Kompass" an der Stelle des News-Chips und scrollt hin. In der Demo
(`?sim=compass`) wird der Park erst dann fest abgelegt, wenn der Standort auf 25 m genau ist. Die
erste, grobe Ortung per WLAN hatte sonst alle Entfernungen um den Sprung zum GPS-Fix verschoben.
Details: [homepage-hero.md](features/homepage-hero.md#under-the-hero-the-headliners-on-a-compass).

### improvement: die Startseite auf dem Handy (PAR-435)

Unter 768 px Seitenbreite stehen die Park-Listen vor den erklärenden Kapiteln: Parks in der Nähe,
Favoriten, beliebte Parks und die offenen Parks je Kontinent. Die Kapitel folgen darunter in der
bisherigen Reihenfolge. Umgestellt wird per CSS `order` (`PHONE_LATER` in `app/[locale]/page.tsx`),
das DOM bleibt, wie es war. Jedes Kapitel zeigt auf dem Handy seine Überschrift und ein Exponat,
der Rest liegt hinter „Mehr anzeigen" (`MobileMore`, `components/common/mobile-more.tsx`) und
bleibt im HTML. `/de` misst 22.558 statt 27.905 px (34 statt 42 Bildschirme bei 390 × 664),
Desktop ist unverändert 18.846 px.

Mit der neuen Reihenfolge lagen zwei Layout-Shifts über den Kapiteln. Die Karten unter „Beliebte
Parks" hatten eine leere Badge-Zeile, bis der Live-Abruf kam (0 → 22 px je Karte), dafür gibt es
jetzt `reserveStatusRow` an `ParkCard`. `LiveActivitySkeleton` reservierte sechs statt fünf
Kontinente und je Karte 12 px zu wenig. An der Stelle „Beliebte Parks" misst `measure:cls --late`
jetzt 0,10 statt 0,34.

### Der Kompass sieht aus wie ein Kompass

Der Kompass unter dem Hero war eine flache Scheibe mit Strichen und sah aus wie jedes Radar. Jetzt
hat er eine Lünette mit Gradzahlen alle 30°, Strichen alle 5° und einem Dreieck für Norden. Das
Zifferblatt ist das Foto des Parks, verschwommen und abgedunkelt, darüber liegt eine blasse
Windrose. Wohin du schaust, leuchtet auf der Lünette ein Bogen, und dort steht auch die Gradzahl
(„100°"). Von dir zur Bahn in der Leiste unter dem Kompass führt eine gestrichelte Linie. Neben
den Punkten stehen jetzt die Namen der Bahnen, gekürzt („Big Thunder…") und mit einer feinen Linie
zum Punkt. Wo im Gedränge kein Platz ist, fällt ein Name weg; in Disneyland waren 8 von 10 Punkten
beschriftet. Das ganze Panel ist Glas über dem verschwommenen Parkfoto, wie die Glasflächen im
Rest der Seite, aber ohne `backdrop-filter`, weil sich hier ständig etwas dreht. Eine
geschlossene Bahn zeigt ihr Abzeichen in der Leiste unter dem Namen, damit der Name nicht mehr
abgeschnitten wird. Das Foto kostet 2,9 KB.
Details: [homepage-hero.md](features/homepage-hero.md#under-the-hero-the-headliners-on-a-compass).

### Kompass-Demo zum Testen: `?sim=compass`

Den Kompass unter dem Hero kann man jetzt auch zu Hause auf dem Handy ausprobieren, auf park.fan
selbst und nicht nur in einer Vorschau. `?sim=compass` legt Phantasialand mit seinen echten Wartezeiten um
den eigenen Standort, `?sim=compass:disneylandparis` (oder `efteling`, `europapark`) einen anderen
Park. Entfernungen und Richtungen bleiben dabei wie im Park, also dreht sich der Pfeil mit dem
Handy und die Bahnen kommen näher, wenn man in ihre Richtung geht. Der Park wird dafür einmal an
der ersten Position abgelegt und bleibt dort liegen. Ein gelber Hinweis über dem
Kompass sagt, dass es eine Demo ist; ohne Standortfreigabe steht man auf dem Punkt im Park und
kann die Freigabe dort mit „Standort nutzen" geben. Der Hero bleibt dabei unverändert.
Details: [flags-and-debug.md](development/flags-and-debug.md#the-compass-demo-works-in-production-simcompass).

### Startseite im Park: Kompass mit den Top-Attraktionen

Wer im Park steht, sieht unter dem Hero der Startseite einen Kompass. Norden ist oben, jede
Top-Attraktion ist ein Punkt in ihrer Richtung, je weiter weg, desto weiter außen, mit der
aktuellen Wartezeit in den Wartezeit-Farben. In der Mitte zeigt ein Pfeil mit Blickkegel, wohin
du schaust, und dreht sich mit dem Handy; auf dem iPhone nach einem Tipp auf „Kompass
einschalten". Die Leiste unter dem Kompass nennt die Bahn, die vor dir liegt (oder die
angetippte). Daneben stehen dieselben Bahnen als Liste mit Pfeil, Entfernung und Wartezeit. Ohne
Kompass (am Rechner) gibt es keinen Pfeil, nur deinen Punkt. Die Koordinaten der Bahnen liefert
eine neue, kleine Route (`/api/parks/…/positions`, 0,7 KB), weil die Antwort von `/api/nearby`
keine enthält.
Details: [homepage-hero.md](features/homepage-hero.md#under-the-hero-the-headliners-on-a-compass).

### fix: Foto-Aufnahme kennt die Fotos im offenen Pull Request

Nach einem Neuladen von `/admin/capture` standen alle heute fotografierten Bahnen wieder unter
„Fehlt noch", weil der Backlog nur `main` kannte und die Fotos bis zum Merge im Session-PR liegen.
Das nächste Foto derselben Bahn bekam außerdem wieder den Namen des ersten und hätte es im PR
überschrieben. Der Backlog liest jetzt die Dateiliste des offenen Session-PRs mit: Bahnen daraus
zählen als fotografiert und tragen „im PR", ihre Dateinamen gelten als belegt. Am offenen PR #627
in Phantasialand waren das 10 Bahnen und 12 Namen. Reservierte Namen gehen auf dem Handy auch
beim Neuladen der Liste und für Fotos in der Warteschlange nicht mehr verloren.
Details: [admin.md](features/admin.md#the-open-pull-request-counts).

### Startseite im Park: „Heute planen", „Zum Park", Öffnungszeiten, Wetter

Steht man in einem Park oder in dessen Nähe, zeigt der Hero der Startseite unter der Begrüßung
vier Felder. „Heute planen" öffnet den Assistenten des Tagesplaners mit diesem Park und dem
heutigen Tag, direkt bei „Wer kommt mit". Ist heute schon geplant, heißt der Knopf „Plan für
heute" und öffnet den Tag auf der Parkseite. Hat der Park heute zu oder schon geschlossen, heißt
er „Besuch planen" und fragt nach dem Datum. „Zum Park" führt zu den Wartezeiten und zeigt, wie
viele Attraktionen laufen. Dazu die Öffnungszeiten von heute (zum Wartezeiten-Kalender) und das
Wetter (zum Wetter-Kapitel). Den Link zum Park gab es im Park vorher gar nicht, weil die
`in_park`-Antwort keine Park-URL mitliefert; die Adresse kommt jetzt aus einer Bahn-URL. Der
allgemeine Einleitungstext fällt in dieser Variante weg.
Details: [homepage-hero.md](features/homepage-hero.md#in-a-park-or-next-to-one).

### fix: Foto-Aufnahme im Admin erkennt den Park wieder und folgt dem Standort sofort

`/admin/capture` fand nie einen Park, weil die `in_park`-Antwort von `/api/nearby` am Park
keine URL mitliefert (0 von 210 Parks) und der Hook genau die verlangte. Kontinent, Land und
Stadt kommen jetzt aus der URL einer Bahn in derselben Antwort, und wenn die Bahnliste leer ist,
aus einer zweiten Abfrage mit `radius=0`, deren Parks ihre URL tragen. Alle 210 Parks werden so
erkannt. Findet die erste Abfrage keinen Park, fragt ein späterer Fix nach 15 s erneut, und
„Neu orten" fragt sofort.

Bei aktivem Tab kommt wieder jeder GPS-Fix auf den Bildschirm, etwa einer pro Sekunde, und ein
gecachter Fix darf höchstens 15 s alt sein. Die 10-m-Schwelle und der 60-s-Cache aus PAR-341 sind
raus. Im Hintergrund bleibt die Ortung aus.
Details: [admin.md](features/admin.md#which-park-and-how-fast-the-position-follows).

### der Planer fragt, wenn der geplante Tag vorbei ist

Ein Klick auf den Planer (die Lasche am Rand, am Handy der Knopf im Kopf) öffnete immer den
zuletzt angesehenen Tag, nach einem Parkbesuch also den Tag, der schon vorbei ist. Jetzt fragt er
in diesem Fall erst: „Dein geplanter Tag ist vorbei", mit Park und Datum, und zwei Antworten.
„Neuen Tag planen" öffnet den Assistenten, auf einer Parkseite gleich mit diesem Park.
„Vergangenen Tag ansehen" öffnet den Tag wie bisher. Escape öffnet nichts. Wege, die einen Tag
schon nennen (ein Tag im Kalender, „Tag im … planen"), fragen nicht.
Details: [trip-planner.md](features/trip-planner.md#a-day-that-is-over-is-asked-about-not-opened).

### Tagesplaner am Handy: Suche in einer Zeile, Verschieben im 5-Minuten-Raster

In der Handy-Ansicht unter einer Maus (ein schmales Browserfenster) stand „Eigener Block" als
44 px hohe eigene Zeile unter dem Suchfeld, und die Trefferliste scrollte in einem Kasten, der selbst
scrollte. Bei 390 × 844 mit zehn geplanten Bahnen bekam die Suche 106 px, und keine einzige Bahn war
ganz zu sehen. Jetzt verhält sich die Suche dort wie am Handy mit Finger: eine Zeile mit „Eigener
Block" daneben, ein Klick ins Feld gibt der Suche das Sheet (12 Bahnen sichtbar), „Fertig" bringt den
Tag zurück. Die Achse wächst dabei von 429 auf 491 px.

Ein Block lässt sich am Handy jetzt in 5-Minuten-Schritten ziehen statt in halben Stunden. 90 px
Zug sind 50 Minuten, und kurze Züge bewegen den Block überhaupt erst: 18 px sind 10 Minuten, vorher
blieb er stehen. Die Knöpfe ±15 Minuten in der Aktionsleiste bleiben.
Details: [trip-planner.md](features/trip-planner.md).

### fix: das Planer-Sheet auf dem Handy ist so hoch wie der sichtbare Bereich

Das Sheet des Tagesplaners war so hoch wie der Layout-Viewport (`92svh`, `100svh`), auch wenn der
Browser gerade weniger davon zeigte: hineingezoomt, mit Tastatur oder in einem Browser, dessen
`svh` nicht zum Fenster passt. iOS schneidet den Rest oben ab, und damit verschwanden Griff und ×
(„wenn das nicht Standardhöhe ist, lässt sich der Planer nicht schließen"). In Chromium bei
390 × 844 und Zoom 1,3 waren 649 px sichtbar und das Sheet endete bei 844. Jetzt liest
`useSheetViewport()` die sichtbare Höhe aus `window.visualViewport`, alle drei Rastpunkte rechnen
damit, und das Sheet steht auf der Unterkante des sichtbaren Bereichs statt auf der des Layouts.
Ohne Zoom misst alles wie vorher.
Details: [trip-planner.md](features/trip-planner.md#the-phone-sheet-measured-against-an-iphone-screenshot-par-482).

### die Desktop-Leiste in der Reihenfolge des Handy-Menüs, mit dessen Icons

Die Leiste oben am Desktop steht jetzt so wie das Handy-Menü: Backstage, News, Parks entdecken,
„Mehr" (dort, wo das Handy-Menü Beste Reisezeit, Wörterbuch und So funktioniert's führt),
Tagesplaner; die Favoriten bleiben rechts. Jeder Eintrag trägt das Icon, das er im Handy-Menü hat,
„Mehr" drei Punkte. Alle sechs Sprachen bleiben einzeilig, Französisch mit 47 px Luft bei 1024 px.
Der Chip mit dem Park in der Nähe passte daneben nicht mehr: Unter 1280 px ist er jetzt nur noch
die Stecknadel, der Name steht im Tooltip; ab 1280 kommt der Name zurück.
Im Handy-Menü ist „Meine Alarme · Fancast" jetzt ein echter Fuß: außerhalb der scrollenden Liste,
direkt am unteren Rand. Und das Menü scrollt nicht mehr seitwärts: Wer Favoriten gespeichert hatte,
bekam darunter einen horizontalen Scrollbalken, weil deren Zeilen 8 px über die Spalte hinausragten.

### die News im Handy-Menü als kleine Karte, eine Achterbahn für „Parks entdecken"

Die neueste Meldung oben im Handy-Menü war ein Chip, und in der 300 px breiten Spalte blieben davon
drei Wörter der Schlagzeile übrig. Jetzt ist sie eine kleine Karte: Label und Datum, die
Schlagzeile in zwei Zeilen und zwei bis drei Zeilen des Teasers, in kleinerer Schrift als die
Menüeinträge. Im Hero der Startseite bleibt es der einzeilige Chip neben dem Badge. „Parks
entdecken" trägt im Handy-Menü eine Achterbahn statt eines Globus. Das Menü beginnt oben: die
Einstellungen stehen links neben dem X statt 80 px darunter, und die Zeile „Meine Alarme · Fancast"
steht immer am unteren Rand.

Nebenbei: In den Header-Panels (Backstage und News) und in `NewsList` griff keine Zeilenbegrenzung.
Jede stand als `line-clamp-N block` im Code, und `.block` steht im erzeugten CSS hinter
`.line-clamp-N` und setzt das `display` zurück, das die Begrenzung braucht. Gemessen an der neuen
Karte: 3 statt 2 Zeilen Schlagzeile, 5 statt 3 Zeilen Teaser. An allen acht Stellen ist das
`block` jetzt weg, `line-clamp` ist selbst blockartig.

### die neueste Meldung als Chip auf der Startseite und im Handy-Menü

Neben dem „Parks jetzt geöffnet"-Badge im Hero der Startseite steht die neueste News als Chip
(`LatestNewsChip`): das News-Label in der Akzentfarbe, die Schlagzeile, ein Pfeil. Auf dem Handy war
das bisher gar nicht zu sehen, bis man ans Ende der Seite scrollte, weil das Band unter dem Hero mit
seiner News-Zeile erst ab `lg` gezeichnet wird. Derselbe Chip steht oben im Handy-Menü. „Fotos
hochladen" ist dort raus; das Formular bleibt über das Banner jeder Park- und Ride-Seite und über
das „Mehr"-Panel am Desktop erreichbar. Die Einträge im Handy-Menü haben jetzt Icons, und ein Tipp
auf einen Link schließt das Menü auch dann, wenn er auf die gerade offene Seite führt. Im
News-Panel des Headers hat jede Meldung in der Zeitleiste rechts ihr Bild.

Details: [news is set apart](rules/news-is-set-apart-from-the-articles.md).

### Blog und News sind getrennt, News hat einen eigenen Menüeintrag

`/blog` listete News weiter mit: im Kartenraster des Index, als Zweig „News" im Kategoriebaum, über
Tags, die nur News tragen, auf der Autorenseite und im Vor/Zurück eines Artikels. Jetzt listet alles
unter `/blog` nur Artikel (`listArticles`), `/news` nur News, und `pnpm test:news-split` prüft das in
allen sechs Sprachen. Im Header steht News als eigener Eintrag neben „Backstage", mit einem Panel,
das anders aussieht als das des Blogs: eine Meldung mit Bild und Teaser, daneben die weiteren
Schlagzeilen auf einer Zeitleiste, jede mit ihrem Alter. Das Backstage-Panel verliert seinen
News-Streifen und die News-Pille. News auch im Handy-Menü, im Footer und in `llms.txt`.

Dazu SEO für News: `/news` hat eigene Metadaten (Titel „Freizeitpark-News: …", eigene
OG-Karte statt der kaputten `blog/news`), eigenes JSON-LD (`CollectionPage` mit `NewsArticle`-Liste)
und einen eigenen Eintrag in `sitemap.xml`. Ein News-Beitrag heißt im Titel „| News · park.fan"
statt „| Blog", sendet `NewsArticle` (PAR-471) und `article:section`. Das Publisher-Logo im
Beitrags-JSON-LD ist das PNG statt des SVG, das Google dort nicht liest (PAR-486). Der Feed
misst die Enclosure-Länge auch für Titelbilder, die auf einen Zuschnitt zeigen, und
`check:agent-ready` zählt die Beschreibung des Kanals nicht mehr als Item (PAR-478).

Details: [news is set apart](rules/news-is-set-apart-from-the-articles.md),
[news lives under `/news`](rules/news-live-under-news.md).

### fix: der Tagesplaner nennt die Shows wieder (PAR-521, Nachtrag)

Über einer Bahn stand von einer Show nur noch die Maske, man sah also nicht, welche Show läuft.
Jetzt schreibt der Block die Shows, die in ihn fallen, selbst hin: neben die Zeiten oder, bei
einem kurzen Block, zwischen Namen und Wartezeit, jeweils mit Uhrzeit. Der Name der Bahn behält
Vorrang, gekürzt wird die Show. In den Lücken zwischen zwei Bahnen stehen die Namen rechts neben
dem Umstiegs-Chip.

Details: [trip-planner.md](features/trip-planner.md).

### fix: der Tagesplaner auf dem Desktop wie auf dem Handy (PAR-482, Nachtrag)

Jede Desktop-Spalte hat wieder eine Bahnsuche, in einer Zeile mit „Eigener Block"; die Treffer
erscheinen beim Tippen und lassen sich anklicken oder auf die Achse ziehen. Der Fuß ist der des
Handys: „Tag optimieren" über die volle Breite, Rückgängig als Symbol, die Glocke oben in der
Kopfzeile statt einer eigenen Zeile unten. Eine Pause über einer Bahn gilt jetzt als Konflikt,
und der CTA bietet an, ihn aufzulösen („ein Konflikt weniger"). Der Fit-Assistent streicht
Wiederholungsfahrten vor Bahnen, die noch niemand gefahren ist, und „Anpassen" öffnet ihn wieder
mit der letzten Wahl. Eine Show-Linie, die durch eine Bahn oder einen Umstieg läuft, zeigt dort nur
noch die Masken statt einer Namensleiste über dem Block, und mit der Maus auf einem Block treten
alle Shows zurück. Ein leerer Tag zeigt den Drag-&-Drop-Hinweis als gut lesbare Karte, am Rechner
mit einer kleinen Animation: Eine Hand nimmt eine Bahn aus der Liste links, zieht sie über die
Kante des Planers und legt sie rechts auf die Zeitachse. Die Knöpfe
im Fuß sind gleich hoch, und im Planer blendet nichts mehr hart um: Show-Linien, der Ghost beim
Ziehen, die Drop-Linie und die gedimmten Zustände gleiten oder blenden weich.

Details: [trip-planner.md](features/trip-planner.md#the-phone-sheet-measured-against-an-iphone-screenshot-par-482).

### „Jetzt kürzer als später“: nächste Fahrt ohne Plan (PAR-419)

Wer im Park steht und keinen Plan hat, sieht auf der Parkseite („In deiner Nähe“) und auf der
Startseite (`InParkView`) bis zu drei Fahrten, deren Live-Wartezeit mindestens 10 Min. unter der
Prognose der nächsten zwei Stunden liegt („Jetzt 5 Min., ab 13:00 laut Prognose 30 Min.“). Die
Regel `suggestNextRides` (`lib/planner/next-best-ride.ts`) liest die Kurve aus `/plan/day`, zählt
eine Stunde erst ab der Ankunft (Laufzeit nach `leg.ts`), nie die Schließstunde, und lässt
geschlossene, außer Saison stehende und nicht lesbare Fahrten weg, ebenso solche, für die
jemand aus der Gruppe zu klein ist. Die Körpergröße kommt aus den Planer-Einstellungen des Tages.
`/plan/day` wird nur im Park geholt. Geprüft von
`pnpm test:next-best-ride` mit Fixtures aus drei echten Parks.

### Kapitelköpfe auf dem Handy eine Stufe kleiner (PAR-433)

Unter `sm` zeichnet `ChapterHeading` den Titel in `text-xl` statt `text-2xl`, das Icon mit 28 statt
40 px und das Band mit `pt-2.5 pb-3`. Die Startseiten-Variante (`tile`) hat eine 48-px-Plakette
und einen `text-2xl`-Titel. `ChapterPanel`, `PageSection` und `AttractionHistoryPanel` beginnen
mit 24 statt 40 px Abstand. Gemessen mit `pnpm measure:mobile-height` bei 390 × 664: Startseite
−798 px, Ride-Seite Taron −226 px, Statistik −92 px, Parkseite −84 px, Kalender −80 px. Ab `sm`
ist nichts anders (104 Kapitelköpfe auf zehn Seiten bei 1440 px mit identischen Werten). Die
Kapitel der Parkseite setzen ihren Abstand mit `mt-8` an der Aufrufstelle und sparen deshalb nur
den kleineren Kopf. Details in [design-system → chapter headings](design/design-system.md#chapter-headings).

### Park-Karten sind auf dem Handy eine Zeile (PAR-432)

Unter `sm` rendert `ParkCard` keine Karte mehr, sondern eine Zeile mit vier festen Zeilen: Name mit
Favoriten-Stern, Ort · Entfernung, `ParkStatusBadge` und `CrowdLevelBadge`, dann Schließ- oder
Öffnungszeit (`ParkCardScheduleFooter compact`). Hat der Park ein Foto, steht links ein Thumbnail
64 × 40 mit dem Fokuspunkt. „Nächster offen“ steht als Text hinter der Uhrzeit statt als drittes Badge. Die Zeile ist 100 px hoch, die Karte war 146 px. Gemessen mit
`measure:mobile-height` bei 390 × 664: Startseite 27.905 → 27.420 px, Deutschland 3.724 → 3.312 px,
Niederlande 2.706 → 2.522 px, Phantasialand 12.232 → 12.141 px. `measure:cls --late` auf der
Deutschland-Seite mobil, spät: 0,2322 → kein Wert mehr, weil die Badges mit dem Batch-Call kommen und
die Zeile ihnen eine Badge-Höhe reserviert. Alle Aufrufer ziehen ohne Änderung mit, der Desktop
bleibt gleich. `ParkCardNearbySkeleton` hat unter `sm` dieselbe Zeilenform, und die Raster der
Park-Karten lassen unter `sm` die `1fr`-Spur weg (`max-sm:auto-rows-auto`).

### Header und Brotkrümel auf dem Handy (PAR-434)

Unter einer 640 px breiten Leiste stehen Sprache, Theme und °C/°F nicht mehr im Header, sondern als
erste Zeile „Einstellungen" im Menü. Im Header bleiben Logo, Suche, Menü und neu ein
Kalender-Knopf für den Tagesplaner. Die senkrechte Lasche am rechten Rand wird auf dem Handy nicht
mehr gezeichnet, weil sie mit 24 × 102 px über Text und Karten lag. Beide Einstiege fragen dieselbe
Variante (`planner-phone`), es gibt also bei jeder Größe genau einen.

Der Brotkrümel zeigt auf dem Handy nur noch einen Link eine Ebene nach oben statt
„Startseite › … › Phantasialand". Auf Park- und Ride-Seite fällt die Zeile auf dem Handy ganz weg:
dort sind Land (und Stadt, wenn sie eine Seite hat) bzw. der Park in der Titelkarte verlinkt. Die
H1 steht dort bei 390 px jetzt bei y=105 statt 151, gemessen mit `pnpm measure:mobile-height`.

### improvement: der Footer auf dem Handy (PAR-437)

Der Footer war auf dem Handy 1.102 px hoch (390 × 664), 1,7 Bildschirme am Ende jeder Seite. 438 px
davon waren die drei Link-Spalten mit elf 44-px-Zeilen. Unter `sm` ist jede Spalte jetzt eine
zugeklappte Zeile, die ihre Links per Tipp aufklappt (`FooterLinkGroup`). Die Links bleiben dabei im
HTML, zugeklappt nur per `max-sm:hidden` ausgeblendet. Dazu knappere Abstände unter `sm`, und die
zweite „Arns.dev"-Zeile fällt dort weg, weil derselbe Link oben in der Marke steht. Ergebnis: 636 px
in de/en/nl/it, 660 px in fr/es. Ab `sm` ist der Footer unverändert, der Screenshot bei 1440 px ist
byte-gleich. Der 562-px-Block, der im DOM vor dem Footer steht, ist `ParkBackground`: `position:
fixed` hinter dem Seitenkopf, er belegt keine Höhe.

### fix: der Tagesplaner auf dem Handy (PAR-482)

Drei Meldungen, zwei davon ein einziger Fehler: iOS zoomt beim Tippen in ein Eingabefeld unter
16 px heran und nicht wieder heraus. Die Bahnsuche und der Name eines eigenen Blocks waren 14 px,
danach stand die Seite auf 1,14×, das fixierte Sheet lief rechts über den Rand und Griff und
Kopfzeile oben aus dem Bild. Jetzt rendert jedes Textfeld im Planer-Sheet auf Touch-Geräten mit
16 px (`[data-planner-sheet]` in `app/globals.css`). Dazu hat das Handy-Sheet wieder einen ×-Knopf,
rechts in der Park- und Datumszeile (PAR-483), weil ein Tipp auf den Griff das Sheet auf 100svh zog und dort
nur noch eine 90-px-Wischgeste herausführte.

Die Aktionsleiste eines ausgewählten Blocks ist auf dem Handy zwei statt vier Zeilen hoch (105 statt
210 px bei 390 px): Symbol als Dropdown, Löschen als Papierkorb in der Leiste, ein
Größensystem für alle Knöpfe (PAR-326), und ein ausgewählter Block wird über die Leiste gescrollt
(PAR-332). „Tag optimieren" steht jetzt direkt über der Gesamtwartezeit und ist ein gefüllter
Knopf mit der gemessenen Ersparnis, sobald die Optimierung etwas bringt (PAR-493). Die Headliner
stehen auf dem Handy in einer seitlich scrollbaren Reihe, der Hinweis unter der Suche verschwindet
nach der ersten Bahn. Die Achse wächst damit von 319 auf 366 px (390×844) und von 262 auf 311 px
(360×800). Und der Wizard sagt, wenn keine große Bahn zur Körpergröße oder zum
Trocken-Bleiben der Gruppe passt, statt „es fehlt keine große Bahn mehr" (PAR-484).

Der Griff oben am Handy-Sheet arbeitet jetzt wie bei einem iOS-Sheet: Das Sheet folgt beim Ziehen
dem Finger und rastet beim Loslassen auf halber Höhe, unter dem Header oder bildschirmfüllend ein;
ein Wisch nach unten aus der halben Höhe schließt es. Einrasten, Öffnen und Schließen laufen auf der
iOS-Kurve (400 ms). Bewegt wird über `bottom` und `height`, nie per `transform`, damit die Unschärfe
des Glas-Hintergrunds erhalten bleibt.

Die Griff-Zeile ist in die Kopfzeile gewandert: Der Griff liegt als schmale Leiste über Park und
Datum, das × steht rechts in dieser Zeile, die Glocke daneben. 61 statt 89 px. Bei
knapper Fensterhöhe (unter 800 px, also auf jedem iPhone in Safari) öffnet das Sheet bis 12 px unter
den oberen Rand und verdeckt den park.fan-Header.

Alle Bedienzeilen im Handy-Sheet (Park, Datum, Headliner-Pillen, die beiden Knöpfe darunter, die
Glocke) sind 32 statt 44 px hoch gezeichnet, die Trefferfläche bleibt 44 px über einen unsichtbaren
Überstand in Leerraum (`lib/planner/touch-target.ts`). Die Glocke steht jetzt rechts in der
Kopfzeile neben dem ×, „Headliner planen" steht in der Optimieren-Zeile als kurzer zweizeiliger
Text, und die Summenzeile ist eine schlanke Textzeile. Das Show-Band über der Achse fällt auf dem Handy
weg; sein Schalter sind dort die Theatermasken am Ende der Optimieren-Zeile. Die Headliner-Pillen sind
26 px hoch, „Tag optimieren" ohne Ersparnis ist getönt statt grau und nimmt immer die volle Breite;
Rückgängig ist auf dem Handy ein Symbol in derselben Zeile, und die Rückmeldung darunter entfällt dort
(außer als Warnung mit „Anpassen"). Ein Tipp in die Bahnsuche gibt ihr das
ganze Sheet (Achse und Fuß treten zur Seite), „Fertig" holt den Tag zurück. In Ruhe ist die Suche eine
Zeile: das 32-px-Feld und „Eigener Block" daneben, die Bahnliste gibt es erst im Suchmodus. Beides nur
mit Touch; ein schmales Fenster mit Maus behält die Liste zum Ziehen. „Ferien nebenan" ist auf dem Handy eine Palme, die Infozeile passt bei 360 px wieder in
eine Zeile. Kopfzeile 61 → 55 px, Band 96 → 70 px, Summenzeile 45 → 29 px; die Achse hat
bei 390×664 jetzt 347 px, bei 360×640 323 px.

Details: [trip-planner.md](features/trip-planner.md#the-phone-sheet-measured-against-an-iphone-screenshot-par-482).

### feat: Google-News-Sitemap unter `/sitemap-news.xml`

Neue Sitemap mit den News-Beiträgen der letzten zwei Tage, je Beitrag und Sprache ein `<url>` mit
`<news:news>` (Name `park.fan`, Sprache, Datum aus dem Frontmatter, Titel). Nur echte
Übersetzungen, höchstens 1000 Einträge, leer ohne News statt 404. Eingetragen in `robots.txt`,
geprüft von `pnpm test:news-sitemap` und `pnpm check:agent-ready`. Details:
[sitemaps](seo/sitemaps.md#the-news-sitemap).

### Ride-Karten sind auf dem Handy eine Zeile (PAR-431)

Unter `sm` rendert die Ride-Liste der Park-Seite (`LandSection`) jede `AttractionCard` als Zeile:
Name und Wartezeit oben, die Badges einzeilig darunter, kein unteres Panel. Die Zeile ist 72 px hoch,
die Karte war 121 px (Park zu) bis 318 px (Park offen). Gemessen mit `measure:mobile-height`:
Phantasialand-Liste 6.503 → 4.328 px, Magic Kingdom 12.053 → 4.136 px. Glocke und Stern behalten
ihre 34-px-Kreise mit 44-px-Trefferfläche. Die Prop heißt `phoneRow`, die anderen sieben
Einbettungen der Karte und der Desktop bleiben gleich. `LazyMount` reserviert für eine Spalte jetzt
80 px je Zeile (`phoneRowHeight`), das Tab-Skeleton hat dieselbe Zeilenform.

### feat: `/news` sieht nicht mehr aus wie der Blog

Die Übersicht `/news` war bis hier die Kategorieseite des Blogs an neuer URL: Kartenraster,
Kategoriebaum, Tag-Cloud. Jetzt ist sie ein Strom nach Tagen, neueste zuerst. Jeder Tag beginnt mit
Datum und Alter (`NewsAge`), jede Meldung trägt ihren Park als Link, den Titel, eine Zeile Teaser
und ein kleines Bild. Über dem Strom filtern Pillen nach Park (`?park=<slug>`), angeboten werden nur
Parks mit News. Die Seite bleibt statisch, der Filter läuft im Browser und die Canonical bleibt
`/news`.

Der einzelne Beitrag unter `/news/<slug>` bleibt, wie er war: Er liest sich wie ein Artikel, mit
Vollbild-Hero und Lesezeit. Ein eigener, schlanker Kopf für Beiträge war kurz Teil dieser Änderung
und ist auf Patricks Wunsch wieder raus.

Der Park einer Meldung ist der erste Eintrag in `parkLinks`, ohne Eintrag der bestbewertete Park,
den der Beitrag erwähnt (`getNewsParkRef`). Siehe `docs/rules/news-live-under-news.md`.

### fix: die Kachelreihe springt nicht mehr, wenn die Schrift nachlädt

„Wartezeiten-Kalender" passt in der Ersatzschrift („Geist Fallback") gerade noch in eine Zeile, in
Geist nicht. Beim Erstbesuch malte die Kachelreihe deshalb mit 132 px und wuchs auf 148 px, sobald
die Webfont da war (~440 ms), und mit `auto-rows-fr` jede Kachel mit ihr. Gemessen mit
zurückgehaltener Schrift: de und nl bei 390, 1280 und 1440 px, es bei 800 px. Jetzt hält jeder
Titel der Reihe zwei Zeilen (`[&_[data-tile-label]]:min-h-[2lh]` auf `ParkTileGrid`), der Titel
selbst bleibt unverändert, weil er auch der Linktext zur Kalenderseite ist. Kosten: 16 px mehr
Reihe, wo kein Titel umbricht (Englisch überall). Die Kachelreihe der Attraktionsseite nutzt
denselben Kachelinhalt, aber nicht dieses Grid, und bleibt wie sie ist.

### fix: „Andrang jetzt" und „Prognose heute" stehen immer untereinander

Die beiden Metriken lagen in einer `flex-wrap`-Reihe, ob sie nebeneinander passten, hing also an der
Breite der Werte. Die Prognose lädt als letztes (~4,4 s) und wird dabei von einem 80-px-Platzhalter
zu Badge plus Pfeil; auf Phantasialand bei 1280 px (beide „Sehr niedrig") brauchte das Paar 282 px
von 271 und brach dann um, die Karte darunter rutschte 16 px (CLS 0.027 bei y=0). Den Pfeil
wegzulassen hätte nicht gereicht: Auf Niederländisch ist allein die Beschriftung „PROGNOSE VANDAAG"
159 px breit. Jetzt stehen die beiden in jeder Breite untereinander, die Striche als Platzhalter
haben die 22 px Zeilenhöhe des Badges. Damit die Zelle die Karte nicht streckt (gestapelt 229 px
gegen 213 px der Headliner-Spalte), sind die Abstände enger: `gap-2` zwischen den Metriken, `gap-1`
und `leading-none` im Auslastungsblock. Jetzt 210 px.

### fix: der Toast für neue Beiträge meldet News auch im offenen Tab

Der Toast aus PAR-444 zählte News schon immer mit, fragte aber nur einmal pro
`sessionStorage`-Session nach. Die lebt so lange wie der Tab, und ein wiederhergestellter Tab oder
die installierte App behält sie tagelang: Nach einem News-Deploy brachte ein Reload keine Anfrage
und keinen Toast, nur ein neuer Tab. Im Browser nachgestellt, vorher und nachher.

Jetzt fragt der Watcher nach dem ersten Seitenaufruf, nach jeder clientseitigen Navigation und wenn
ein Tab wieder nach vorn kommt, höchstens einmal alle zehn Minuten über alle Tabs
(`claimCheck`, `localStorage['pf:blog-seen-checked-at']`). `/api/blog-latest` bleibt an der Edge
zehn Minuten statt einer Stunde frisch, weil Cloudflare niemand purgen kann und eine News in den
Stunden nach dem Deploy am meisten wert ist. Ein Toast, der beim Wechsel in den Blog verschwindet,
kommt beim Verlassen nicht wieder. Tests: `pnpm test:new-posts`. Doku:
[New-posts toast](features/new-posts-toast.md).

### fix: keine leere Mitte mehr in „Heute im Park"

Zwischen den vier Spalten und der Kachelreihe lag auf fast jedem Park ein 104 px hohes leeres Band
(135 px auf dem Handy). Es war die Reservierung für den Regen-/Unwetter-Streifen aus dem Nowcast,
der clientseitig geladen wird und ohne Platzhalter die Seite 2,5 s nach dem ersten Paint um 134 px
nach unten schob. Nur 11 von 210 Parks hatten an dem Tag, an dem sie eingebaut wurde, überhaupt eine
Warnung.

Die Warnung steht jetzt als eine Zeile in der Titelzeile des Panels, an der Stelle der
Wetterbeschreibung (`useNowcastAlert`, `NowcastAlertToggle`). Die Zeile ist auf jedem Park da und
bleibt mit und ohne Warnung 45 px hoch, also verschiebt eine spät ankommende Warnung nichts. Ein
Druck darauf klappt das volle Banner mit Zeitleiste darunter auf; eine Verschiebung direkt nach
einer Eingabe zählt nicht als CLS. Auf dem Handy machen Überschrift und Uhr der Warnung Platz,
sonst blieb von „Gewitter in ca. 25 Min." nur „Gewitter in c…". `WeatherNowcastBanner` rendert für
`/ui` und die Guide-Seite unverändert das ganze Banner. Regel:
[A streamed section owes the page its height](rules/a-streamed-section-owes-the-page-its-height.md).

### News stehen neben den Artikeln, nicht zwischen ihnen

Beiträge der Kategorie `news` laufen auf den Teaser-Flächen nicht mehr in derselben Liste wie die
Artikel. Startseite (Band unter dem Hero und Blog-Kapitel), Blog-Panel im Header-Menü sowie Park-
und Attraktionsseiten zeigen oben nur Artikel und darunter eine kleinere News-Zeile (`NewsRow`,
`NewsList`). Jede News zeigt ihr Alter („heute", „vor 3 Wochen"), die ersten sieben Tage in der
Akzentfarbe. Ausgeblendet wird wegen des Alters nichts. Das Header-Menü zeigt dafür fünf statt sechs
Artikel, damit das Panel nicht höher wird. Regel:
[News is set apart from the articles](rules/news-is-set-apart-from-the-articles.md).

### feat: Toast bei neuen Blog-Beiträgen seit dem letzten Besuch (PAR-444)

Wer wiederkommt und neue Beiträge verpasst hat, bekommt einmal einen Toast mit dem neuesten davon,
beim Erstbesuch nie. Die ganze Karte ist der Link auf den Beitrag (ein gestrecktes `::after`),
darüber liegen nur das X und „Alle ansehen“, das immer dasteht; „Und N weitere neue Beiträge“
erscheint nur, wenn es mehr als einen gibt. Auf dem Handy sitzt der Toast unten über dem
Home-Indicator und wird nach unten weggewischt, ab `sm` oben rechts 15 px unter dem Header, nach
rechts wegzuwischen, auf `z-40` unter den Menübändern des Headers, unter dem Sprach-Banner, falls
der offen ist, und neben dem offenen Planer-Panel. Nach 12 s schließt er sich, der Balken unten
ist der Countdown und hält bei Hover, Fokus und verstecktem Tab an.

Der Watcher im Locale-Layout fragt 2,5 s nach dem Laden und nur einmal pro Sitzung
`/api/blog-latest/<locale>` ab (statisches JSON aus dem Blog-Manifest, samt der Strings des
Toasts), die Toast-UI mit framer-motion wird nur geladen, wenn es etwas zu zeigen gibt. Keine Seite
trägt dafür etwas im RSC-Payload. Verglichen wird über Translation-Keys plus Datumsuntergrenze in
`localStorage`, nicht über einen Zeitstempel, weil `date` ein Tag ist. Neues Umami-Event
`blog_toast_opened` ohne Properties. Details:
[features/new-posts-toast.md](features/new-posts-toast.md).

### fix: die OG-Funktion trägt 18 MB Fotos statt 256

Der Deploy scheiterte an `The Vercel Function "api/og/[...path]" is 290.96mb uncompressed`, zum
zweiten Mal nach `2.11.0` und diesmal, ohne dass an der Route etwas geändert worden wäre. Lokal
nachgestellt über den Trace, den `next build` selbst schreibt
(`.next/server/app/api/og/[...path]/route.js.nft.json`, 1162 Dateien): **287,0 MB**, die Differenz
zu Vercels Zahl ist das Linux-Binary von sharp/libvips gegen das für darwin.

| im Bundle                              |    MB |
| -------------------------------------- | ----: |
| `public/media`, Quellen + Sidecars     | 109,3 |
| `public/media`, `-4x3`-Crops           |  56,8 |
| `public/media`, `-1x1`-Crops           |  46,5 |
| `public/media`, `-16x9`-Crops          |  43,8 |
| sharp, Next, `.next/server`, Blogtexte |  30,6 |

Die Karte malt davon **ein** Bild: ein 16:9-Foto hinter der Überschrift, `opacity: 0.4`, im Rahmen
1200 × 630. Der Rest lag im Bundle, weil der Lesezugriff dort verwurzelt war. Ein
`join(process.cwd(), 'public', <Variable>)` ist für den Tracer nicht auflösbar, und seine Antwort
darauf ist, das ganze Verzeichnis einzupacken, an dem der Pfad hängt – das steht seit `2.11.0` so
in `next.config.ts`, neu war nur, dass `public/media` seitdem auf 256 MB gewachsen ist. An der
Konfiguration ist dagegen nichts zu holen: `outputFileTracingIncludes`/`-Excludes` werden unter
`next build --turbo` nie angewendet, weil `collectBuildTraces` nie aufgerufen wird.

Der Hebel ist die Wurzel. Die OG-Funktion hat jetzt ein eigenes Asset-Verzeichnis, `og-assets/`,
geschrieben von `scripts/generate-og-assets.mjs` im `prebuild` und mit nichts darin außer dem, was
diese Karten malen: eine Fassung pro Medienfoto plus die beiden Marken-PNGs. Der Sweep ist damit
das Feature – das Verzeichnis **ist** die Liste dessen, was die Funktion trägt, und wächst nicht
mehr hinter dem Rücken von irgendwem.

Die Fassungen sind verkleinert und nicht kopiert. Die `-16x9`-Crops werden in der größten Größe
geschnitten, die in die Quelle passt: elf davon sind 4096 × 2304, im Schnitt 286 KB, und Satori
dekodiert das in voller Auflösung, um 1200 px zu malen. Auf Kartengröße sind es 117 KB im Schnitt,
94 der 157 landen exakt auf 1200 × 630, kleinere Quellen bleiben klein (`withoutEnlargement`). Der
Cache liegt content-adressiert unter `.next/cache/og-assets`, wie bei den Crops – kalt 2,1 s, warm
0,1 s.

`lib/og/brand-mark.tsx` liest die beiden PNGs aus demselben Verzeichnis und fällt für `next dev`
(kein `prebuild`, also kein `og-assets/`) auf `public/` zurück. Dieser Fallback nennt **pro Datei
einen literalen Pfad** statt einer Schleife, und das ist der ganze Punkt: `join(process.cwd(),
'public', 'logo-dark.png')` traciert auf genau diese eine Datei, `join(process.cwd(), 'public',
file)` auf alle.

Gemessen nach dem Umbau, gleicher Trace: **46,8 MB in 497 Dateien**, davon 17,9 MB `og-assets/` und
17,3 MB das sharp-Binary. Aus `public/` sind noch genau drei Dateien übrig – `world.svg` und die
zwei Marken-PNGs des Fallbacks, alle drei statisch benannt. Nachprüfbar mit
`pnpm measure:function-size` (neu, `scripts/measure-function-size.mjs`): ohne Argument alle 129
Funktionen nach Größe, mit einem Routen-Fragment die Aufschlüsselung nach Verzeichnis. Die Regel
dazu steht in
[a-runtime-file-read-ships-the-directory-it-is-rooted-at.md](rules/a-runtime-file-read-ships-the-directory-it-is-rooted-at.md).

Verifiziert wurde außerdem, dass die Karten noch aussehen wie vorher: `pnpm og:preview` rendert alle
15 Varianten mit 200 (Parkkarte 102 ms). Und ein A/B mit weggeschobenem `og-assets/` zeigt genau das
erwartete Bild – Foto weg, Logo noch da, weil der literale Fallback greift.

Dabei ist nebenbei herausgekommen, dass der **HTTP-Fallback in `ogBackgroundSrc` das Foto gar nicht
rettet**: die Karte rendert, aber ohne Bild. Die Quelle ist ein progressives JPEG
(`/media/phantasialand/background.jpg`, 1024 × 768, 185 KB, per `curl` sauber mit 200 erreichbar),
und Satori überspringt still, was es nicht dekodieren kann. Das ist kein Rückschritt aus diesem
Umbau, sondern war immer so – auch `next dev` hatte nie Crops, weil die git-ignoriert sind und im
`prebuild` entstehen. Der Fallback bleibt trotzdem stehen: eine Karte ohne Foto ist besser als ein
fehlgeschlagener Render. Wer ihn wirklich reparieren will, müsste die Quelle baseline kodieren –
eigene Aufgabe, hier nicht mitgemacht.

## 2.12.0 (2026-09-21) – Planer-Assistent, Ride-Seiten wie Parkseiten, das Menüband

Geschnitten mit PAR-319 (PR #531). Die Überschrift kam erst beim Schnitt von 2.13.0 dazu; bis
dahin standen die Abschnitte als `Unreleased` über 2.11.0. Der öffentliche Eintrag ist
`content/changelog/2.12.0.md`. Neueste Abschnitte zuerst.

### Eine öffentliche Changelog-Seite, und die Regel, wann eine Version geschnitten wird

Diese Datei hier ist das interne Log: deutsch, ein Abschnitt pro PR, mit Dateinamen und Messwerten.
Sie hatte seit `2.11.0 (2026-08-15)` **31** `## Unreleased`-Abschnitte, `package.json` stand bei
`2.12.0`, und gelesen hat das niemand außerhalb des Repos. Neu ist deshalb eine zweite, öffentliche
Sammlung unter `content/changelog/<version>.md`, englisch und von Hand aus den internen Abschnitten
geschrieben, gerendert auf `/en/changelog`. **Kein Parser zwischen beiden**: die interne Prosa
beschreibt Code, und wer sie ungefiltert veröffentlicht, hat eine Commit-Liste mit Absätzen.

Die Seite ist bewusst einsprachig. `generateStaticParams` liefert nur `en`, `dynamicParams` ist aus,
und die fünf anderen Schreibweisen plus das nackte `/changelog` sind 301er in `next.config.ts` –
dort und nicht im Proxy, weil `redirects()` aus `next.config` in Nexts Reihenfolge Schritt 2 ist und
der Proxy Schritt 3
([Beleg](https://nextjs.org/docs/app/api-reference/file-conventions/proxy#execution-order)). Ohne
sie würde `localePrefix: 'always'` einen deutschen Besucher auf `/de/changelog` schicken. Neue
Message-Keys gibt es keine: die Namespace-Delta der Route ist leer (`'/changelog': []`), also trägt
sie auch kein `<RouteMessages>`. In `app/sitemap.ts` steht genau eine URL ohne `alternates`, ihr
`lastmod` ist das Datum des neuesten Eintrags.

Zwei Stolpersteine, die im Code als Kommentar stehen: `@tailwindcss/typography` ist hier **nicht**
installiert, eine `prose`-Klasse also wirkungslos – die Markdown-Elemente werden einzeln abgebildet,
mit den Klassen aus `components/blog/blog-content.tsx`. Und ein unquotiertes `date: 2026-09-21` im
Frontmatter ist kein String, sondern ein `Date`; der erste Build ist daran in `sitemap.xml`
gescheitert, nicht auf der Seite. `toIsoDate()` normalisiert beide Formen.

Die Versions-Policy des PO (kein Bump pro Merge, MINOR für eine neue sichtbare Fähigkeit, PATCH für
ein Bündel Fixes, geschnitten wird vom PO) steht als Regelseite in
[a-version-is-a-unit-of-communication.md](rules/a-version-is-a-unit-of-communication.md), der
`CLAUDE.md`-Index bekommt eine Zeile. Der erste Eintrag ist `2.12.0`, kuratiert aus den 31
Abschnitten darunter, mit einem Highlight-Screenshot in der neuen Sammlung
`public/media/changelog/` (`tags: ["diagram"]`, kein `park`, kein `ride` – ein Bild der eigenen
Oberfläche ist keine Parkaufnahme). Autorenanleitung:
[content/changelog/README.md](../content/changelog/README.md).

### Jeder Park mit genug Messtagen hat jetzt eine eigene Statistikseite

Die Parkseite rendert die Live-Tabelle serverseitig, die historische Hälfte aber nicht: der
Statistik-Abschnitt wird bewusst client-seitig nachgeladen, und den typischen Tagesverlauf
(`ParkHourlyProfileCard`) zeichnete gar keine Parkroute. Genau diese Hälfte steht jetzt unter einer
eigenen URL — `/de/parks/…/durchschnittliche-wartezeiten`, in allen sechs Sprachen über einen
Rewrite auf dem englischen Routenordner `average-wait-times`, wie beim Kalender.

Die Seite zeigt Andrang nach Monat und Wochentag über zwei Jahre, die Bahnen nach typischer
Wartezeit (jede Zeile verlinkt ihre Ride-Seite), den typischen Tag Stunde für Stunde und einen
Methodik-Abschnitt, der die Zahl der gemessenen Öffnungstage dieses Parks nennt und „typisch" und
„Spitze" ins Wörterbuch verlinkt. Die Karten sind alle bestehende Komponenten, neu ist nur der
Methodik-Text. Die Parkseite selbst bleibt unverändert und bekommt einen Link.

**Gegatet auf `meta.displayable`:** 119 der 210 Parks im Katalog erfüllen das (gemessen am
21.09.), also 714 URLs statt 1.206. Die übrigen 91 würden Tabellen aus einer Handvoll Messtagen
zeigen, 222 davon aus gar keinem; sie liefern 404 und werden nirgends verlinkt. Sitemap, Parkseite
und Kalenderseite fragen dafür denselben datengecachten Eintrag ab: ein Upstream-Aufruf pro Park
und Tag, egal wie viele fragen.

Es ist die erste Park-Route, die **nicht** `force-dynamic` ist: nichts darauf ist live, der
Aggregat dahinter wird einmal täglich neu gerechnet, also ISR mit Tagesfenster. Ein
Crawler-Durchlauf über diese 714 URLs trifft damit einen Prerender statt einer Function. Was dafür
nötig ist, steht in
[an-isr-route-needs-both-halves.md](rules/an-isr-route-needs-both-halves.md) — `revalidate` allein
reicht nicht. Konzept und Messungen:
[dedicated-landing-pages.md](seo/dedicated-landing-pages.md).

### Die Parkkarte hing an OSMs eigenem Tile-Server

`tile.openstreetmap.org` ist für OSM selbst und für Renderer-Tests gedacht, nicht zum Einbetten in
eine produktive Drittanbieter-Seite — die [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)
sagt das ausdrücklich, und am 18.09. hat OSMs Edge das durchgesetzt: jede Kachel auf jeder Parkseite
und in jedem Blog-`map-widget` kam als „403 Access blocked" zurück, für alle Besucher. Die
Kartenkomponente (`components/parks/park-map.tsx`) zog ihre Kacheln direkt von dort; das
Admin-Katalog-Karte hatte das Problem nie, weil sie schon CARTOs kostenlose Basemap-CDN nutzt.
Beide `TileLayer` zeigen jetzt auf `basemaps.cartocdn.com`, mit Attribution für OpenStreetMap
**und** CARTO. Damit auch CARTOs eigene Fair-Use-Grenze nicht zum nächsten Blocker wird, liest
`cartoTileUrl()` (`lib/utils/carto-tile-url.ts`) jetzt `NEXT_PUBLIC_CARTO_MAP_KEY`: gesetzt, laufen
beide Karten über CARTOs authentifizierten Single-Host-Endpunkt mit höherem Limit; ungesetzt bleibt
der anonyme, subdomain-gesharded Endpunkt aus dem ersten Fix — genau das, was ein lokaler Checkout
ohne Key sieht. Details in
[map-tiles-are-carto-not-osms-own-tile-server.md](rules/map-tiles-are-carto-not-osms-own-tile-server.md).

### Das „Mehr"-Panel sieht aus wie ein Menü

Beste Reisezeit, Wörterbuch und So funktioniert's standen im Panel als Überschrift plus Absatz:
eine 16 px hohe Versalzeile trug den einzigen Link, die Zeile darunter lag außerhalb der
Trefferfläche, und in der Schiene stapelten sich drei solche Zeilen mit 458 px Leere darunter.
Jede Sektion ist jetzt eine Karte mit Icon-Kachel, Namen und Zeile, und die **ganze** Karte ist der
Link — dieselbe Form, die `BlogChapter` auf der Startseite zwei dieser drei Ziele schon gibt,
bis zu den Icons (`CalendarRange`, `BookOpen`, dazu `Compass` für den Guide).

Das Icon steht **über** dem Text, und das hat die Schiene entschieden, die es davor gab: daneben
blieben der 231 px breiten Karte 157 px für Titel und Zeile, der Hinweis lief auf drei Zeilen und
brach als „und Monate, Park / für Park". Darüber hat der Text die vollen 205 px, jeder Titel bleibt
einzeilig, jeder Hinweis zweizeilig; die Karte geht von 112,6 auf 137,5 px.

Der Hover ist der Rand und sonst nichts, aus drei Messungen an den gerenderten Pixeln:
`border-primary/40` liest 1,60 : 1 hell und 1,81 : 1 dunkel gegen die Karte, voll deckend dagegen
**3,46 : 1** und **5,31 : 1**. Ein Rand schuldet 3 : 1, ein 14-px-`font-semibold`-Label 4,5 — ein
`group-hover:text-primary` auf dem Titel liefe also genau beim Lesen auf 3,47 : 1. Die Fläche bleibt
mit: `bg-card/50` → `bg-card` mißt 19,76 → 19,80 : 1 unter dem Label, und ein sichtbarer Farbton
kostet stattdessen — `bg-primary/5` zog den 13-px-Hinweis auf 4,47 : 1.

Die drei Hub-URLs stehen unverändert im HTML jeder Seite; das Panel ist weiterhin `hidden` und nie
abgehängt. Blog und die vierte Kachel gehören nicht mehr hierher – siehe der Backstage-Eintrag
unten, der das Panel wieder auf drei Karten gebracht hat. Details in
[header-navigation.md](features/header-navigation.md#mehr-one-entry-for-everything-that-is-reading-material).

### „Backstage": der Blog ist wieder ein eigener Eintrag in der Leiste

Vier Einträge sind mit dem Sammel-Trigger „Mehr" aus der Navigationszeile verschwunden, weil sechs
davon auf Französisch bei 1024 px 23,7 px über ihre Box liefen. Einer der vier ist der stärkste
Einstiegspunkt der Seite, und hinter einem Sammeleintrag sah ihn nur, wer ihn aufklappte. Er steht
wieder in der Zeile, als vierter Eintrag zwischen „Tagesplaner" und „Mehr", und öffnet dasselbe
Panel wie vorher. Sein Label ist **„Backstage"**, unverändert in allen sechs Sprachen.

Gemessen an zwei eigenen Builds auf `/{locale}/parks/europe/germany`, gegen die Inhaltsbox der
Header-Zeile: der Eintrag kostet **101,8 px**, und der engste Fall, Französisch bei 1024 px
Container, behält danach **245 px** Luft (vorher 346,8). `document.scrollWidth` bleibt in allen vier
gemessenen Kombinationen gleich der Viewport-Breite.

Das „Mehr"-Panel verliert damit seine Blog-Sektion und die 256-px-Schiene, die nur existierte, um
neben dem Blog-Block zu stehen: übrig bleiben drei Spalten. Im Blog-Panel steht jetzt **eine**
Überschrift über beiden Spalten statt zweier für dieselbe Liste, und **jede Listenzeile trägt ihre
Kategorie** – das war die einzige Stelle der Seite, die Beiträge ohne sie auflistet. Das Feld dafür
lag nur am ersten Post an; die Zeile wird damit vierzeilig, also wächst ihr Vorschaubild von
112 × 70 auf 128 × 80. Details in
[header-navigation.md](features/header-navigation.md#backstage-comes-back-out-of-mehr).

---

### Planer im Querformat: das Chrome steht jetzt neben der Achse

Ein quer gehaltenes Handy bekam seit PAR-76 das Bottom-Sheet, den Griff und die 44-px-Ziele — und
trotzdem keinen Tag. Bei 844 × 390 stapeln sich Griff, Sheet-Kopf, Kontextband, Optimize-Zeile,
Headliner-Band, Summary und Push-Zeile zu **343 px in einem 359 px hohen Sheet**; von der Zeitachse
blieben **16 px**, verdeckt von der Optimize-Zeile. Zwei Stunden Tag sind 216 px, also gibt es keine
Reihenfolge dieser Zeilen, die über die Achse paßt.

Also stehen sie jetzt **daneben**: links eine 20 rem breite, scrollende Spalte mit dem Kontextband,
der Ride-Suche und allem, was man mit dem Tag machen kann — rechts die Achse mit **269 px**, zwei
Stunden und 29 Minuten. Der Schalter dafür ist `planner-landscape`, eine Verfeinerung von
`planner-phone` statt eines dritten Falls daneben.

Hoch- und Desktopformat bewegen sich um **keinen Pixel**, und das ist Bauart statt Vorsatz: die
zwei Wrapper, die die Reihe tragen, stehen sonst auf `display: contents` und zeichnen gar keine Box.
Gemessen vorher/nachher bei 390 × 844, 1440 × 900 und 1440 × 480 — Zeile für Zeile gleich.

`pnpm check:planner` sichert die Achsenhöhe im Querformat jetzt zu, statt sie zu drucken, und die
Überdeckungs-Zusicherung verlangt zusätzlich, daß die Achse ganz im Sheet liegt: `elementFromPoint`
antwortet außerhalb des Fensters `null`, also meldete eine unter die Sheet-Kante gelaufene Achse
bisher „nichts liegt darüber". Details in
[trip-planner.md](features/trip-planner.md#a-landscape-phone-is-a-row-because-the-chrome-is-taller-than-the-sheet).

---

### Planer: die Leg-Pille rechnet gegen die Lücke, die man sieht

Gemeldet aus PAR-169: seit der Optimierer auf den Erwartungswert taktet, stehen die Blöcke dicht,
und der Chip zwischen zweien wurde vom Block darunter angeschnitten. Gemessen an einem gepackten
Phantasialand-Tag: **9 von 9** bei 1440 px, 8 von 9 bei 390 px.

Zwei Ursachen. Die Pille hing in der Lücke zwischen **Schlangenende und nächstem Start** — das ist
nicht die Lücke auf dem Schirm, denn ein Block unter 16,7 Minuten wird trotzdem in einem Kasten
gezeichnet, in den eine Textzeile passt, und hängt damit nach unten hinein. Über 46 geplante
Park-Tage aus `/plan/day` (267 Legs): Abstand der Schlangen median 24 px, gezeichnete Lücke median
**16**, kleinste **12**. Und die Pille ist 21 px hoch, nicht die 18, die im Code standen.

Die Rechnung liegt jetzt in `lib/planner/leg-chip.ts`, die gezeichnete Kastenhöhe in `drawnBoxPx`
(dieselbe Funktion, mit der sich der Block selbst bemisst, inklusive der 40 px eines Blocks ohne
Zahl). Wo 21 px nicht passen, fallen Distanz und Slack weg und Minuten plus Urteil bleiben; die
kurze Pille ist **12 px**, weil ihr Umriss ein `ring-1 ring-inset` ist statt eines Rahmens — ein Ring
ist ein Schatten und kostet keine Höhe. Zwölf ist die kleinste Lücke, die ein geplanter Tag erzeugt,
also passt sie überall; 14 px hätten 12,7 % der Legs weiter angeschnitten.

Dritter Fund beim Messen: die Pille ist `inline-flex` und saß im Block-Wrapper auf der Grundlinie
einer Zeilenbox — bei `top: 10px` gezeichnet bei 18. Der Wrapper ist `flex`, ein Flex-Item hat keine
Grundlinie. Nachher **0 von 9** angeschnitten, sechs Sprachen, beide Breiten, hell und dunkel.

Nicht abgedeckt und benannt, wo der Code steht: ein Block **ohne Zahl** wird flach 40 px gezeichnet,
während die Spurenpackung 16,7 Minuten für ihn rechnet — dort ist die Lücke weiter negativ. Das ist
PAR-227 und älter als diese Änderung; die Messung oben hat Parks ohne lesbare Wartezeiten
ausgefiltert und gilt deshalb für Tage, in denen Zahlen stehen.

---

### Planer: der Fit-Assistent nimmt sich nicht selbst vom Schirm

Direkt nach dem Assistenten gemeldet: „wenn ich anfange, Bahnen abzuwählen, verschwindet die Liste
komplett". Im Wizard stimmte das wörtlich — der ganze Block hing an `headlinerConflict`, also hat
die Bahn, die den Tag passend gemacht hat, den Schirm mitgenommen, auf dem man ihn passend gemacht
hat. Im Dialog war es leiser und dieselbe Sache: die „fällt weg"-Markierungen gingen aus, in der
Kopfzeile änderte sich eine Zahl, und dass das Problem weg ist, stand nirgends.

Beide tragen jetzt einen **Zustand**: Krone-Rot mit Warnzeichen, solange etwas wegfällt, und
`status-operating`-Grün mit Haken plus „So passen alle 10 Bahnen in den Tag", sobald nichts mehr
wegfällt. Der Block im Wizard erscheint, solange der Tag zu kurz ist, und **bleibt**, sobald
irgendetwas beantwortet ist (`fitChoiceTouched`, abgeleitet statt gemerkt, damit ein Park- oder
Tageswechsel ihn nicht stehen lässt). Und Schritt eins bekommt einen dritten Satz: „an den Blöcken
liegt es nicht" ist richtig, solange der Tag zu kurz ist, und falsch in dem Moment, in dem jemand
ihn passend gemacht hat — genau dann wird er gelesen.

Neu in `pnpm check:planner`: abwählen bis es passt, und danach muss die Meldung grün sein und die
Liste vollständig dastehen (10 von 10). Dazu eine Quellprüfung, dass der Block des Wizards nicht
wieder allein am Konflikt hängt. Eine ältere Prüfung war nebenbei eine Prüfung über das Wetter:
welche Stellschraube oben steht, hängt an der Prognose des Tages, also ist der Block je nach Tag
gestrichen **oder** auf 30 Minuten gekürzt — beides ist die Stellschraube bei der Arbeit, gemessen
wird jetzt die Dauer.

---

### Planer: ein Tag, der nicht aufgeht, öffnet einen eigenen Assistenten

Gemeldet mit Screenshot: „Alle Headliner einplanen" am Samstag im Phantasialand, Taron steht um
**18:45** in einem Park, der um 18:00 schließt. Die App hat das gesagt — als Nebensatz in einer
grauen 11-px-Zeile unter den Knöpfen („eine passt nicht mehr in den Tag"), neben einem Block, der
aussah wie die neun darüber. Zu leise, und vor allem ohne etwas, womit man darauf antworten könnte.

**Jetzt öffnet sich ein Assistent** (`PlannerFitAssistant`), sobald ein Druck etwas weglassen
würde — bei beiden Knöpfen, und geschrieben wird erst am Ende. Drei Schritte:

- **Stellschrauben.** Was Platz schafft, ohne dass eine Bahn gestrichen wird. Jede Zeile ist ein
  gemessener Unterschied zwischen zwei Plänen, kein Ratschlag: `fitLevers` lässt den Optimierer pro
  freiem Block noch einmal laufen, einmal ohne ihn und einmal mit halber Pause, und bietet nur an,
  was wirklich eine Bahn bringt. Am 12.09. passen mit Mittagspause 9 von 10 und ohne sie **10 von
  10**, im Movie Park am 20.09. reichen dafür **30 statt 60 Minuten**; am 03.10. bringt es 9 statt
  8, und das sagt die Zeile dann auch. Kürzen wird vor Streichen angeboten, und wo Kürzen reicht,
  wird Streichen gar nicht erst vorgeschlagen.
- **Wichtigkeit.** Die ganze Liste in genau der Reihenfolge, in der der Optimierer aufgibt.
  Häkchen raus heißt „brauche ich nicht", Pin heißt „ganz nach oben" — und beides rechnet sofort
  gegen dieselbe Suche, die auf den Knopfdruck läuft. Am 03.10. fallen von allein Crazy Bats und
  River Quest weg; pinnt man die beiden, sind es Winja's Fear und Colorado Adventure.
- **Ergebnis.** Wie viele Bahnen, bis wann, wie viel Warten — und was wegfällt, **mit Namen**.

Zwei Regeln darunter. Eine angehakte Bahn wird **neu geplant statt hinter das Tor geparkt**, was
„welche fällt weg" von einer Restgröße zu einer Entscheidung macht; `optimizeDay` allein darf
niemandem einen Eintrag löschen, und das ist die eine Stelle, wo die Regel gelockert wird — nicht
hinter dem Rücken, sondern vor einer Liste, in der die Bahn benannt ist. Und die Reihenfolge des
Besuchers schlägt die Kuratierung des Parks: `isWanted` zählt eine in `priority` genannte Bahn als
eine, für die man da ist, also fällt eine gepinnte Nebenbahn nicht mehr vor einem ungepinnten
Headliner.

**Der Wizard hat dafür einen eigenen vierten Schritt.** „Headliner einplanen" war ein vierter
Schalter neben Mittagessen, Kindern und Wasserbahnen — drei Antworten über die Gruppe und eine, die
den ganzen Tag baut, mit einem Hinweis, der nebenbei zugeben musste, dass nicht alle passen. Jetzt
`park → date → setup → headliners`, mit derselben Konflikterkennung und denselben zwei Bausteinen
des Assistenten direkt darin; „Ohne Mittagessen" dort ist der Mittagsblock des Wizards, und
`finish` liest ihn aus der Antwort von `evaluateFit` zurück, statt ihn ein zweites Mal zu führen.

**Und der Block sagt es selbst.** Über `closeMin + closeSlackMin` steht „Liegt nach Parkschluss",
in der schraffierten Stunde davor „Kann schon nach Parkschluss liegen" — zwei Sätze, weil die API
eine Schließ*stunde* liefert und ein Park um 17:30 zumachen kann. Freie Blöcke bekommen keinen von
beiden. Die Ergebniszeile unter den Knöpfen ist die andere Hälfte: Wo etwas wegfällt, ist sie eine
umrandete Warnung mit einem **„Anpassen"**-Knopf zurück in den Assistenten.

Nachgemessen über 35 Park-Tage an sechs Parks: 5 Tage gehen nicht auf, 2 davon löst allein eine
Stellschraube. Neu: `pnpm test:planner-fit` (41 Prüfungen) und ein Durchlauf des Assistenten in
`pnpm check:planner`. Details:
[trip planner](features/trip-planner.md#where-it-cannot-choose-for-you-it-asks--and-it-asks-properly).

---

### Planer: der Tag endet, wenn der Park schließt, und der Headliner ist keine Restgröße

Drei Fehler mit einer gemeinsamen Wurzel, gemeldet an einem Samstag im Phantasialand.

**Der Tag war eine Stunde zu lang.** `PlanDayContext.closeHour` ist die Stunde, in die die
Schließzeit fällt, nicht die letzte offene Stunde — der Park macht um 18:00 zu, die API antwortet 18. `buildDayGrid` hat das andersherum gelesen und sechzig Minuten addiert, und der Optimierer hat
die geschenkte Stunde gefüllt: Winja's Fear um **18:15** angestellt, Feierabend 18:55. Über alle
Kalender der 213 Parks nachgemessen schließen **3.046 von 3.540 Betriebstagen (86,0 %) genau zur
vollen Stunde**, 486 um halb und 8 um dreiviertel. `DayGrid` trägt deshalb zwei Zahlen: `closeMin`
ist das belegbare Ende, hinter das die App von sich aus nichts legt, und `closeSlackMin` die
Stunde darüber, in der der Park offen sein _kann_ — gezeichnet, per Drag erreichbar, nie verplant.
Die Gegenrichtung gehört dazu: **anstellen darf man sich bis kurz vor Schluss**, also entscheidet
der **Start** und nicht das Ende, ob ein Stopp stattfindet. Eine 40-Minuten-Schlange um 17:45 ist
ein Slot, den man absichtlich nimmt.

**Der Headliner war die Restgröße.** Wenn zehn nicht in neun Stunden passen, ist „wie viele fallen
weg" eine andere Frage als „welche", und die zweite hat niemand gestellt: unter den Plänen mit
gleich vielen Ausfällen entschied die Warteminutensumme, und die wirft per Konstruktion die
teuerste Bahn raus — also die mit der längsten Schlange, also die, für die die Leute da sind. Am
12.09.2026 fielen **F.L.Y. und Taron** raus und beide Winja's blieben drin; bei neun angefragten
Bahnen fiel **Taron in neun von zehn Fällen**. Die Marge waren fünf Minuten (280 gegen 275) bei
einem Modellfehler von 14,3 Minuten für diese Vorlaufzeit. Es gibt jetzt eine vierte Overflow-Stufe
(`Candidate.dropWeight`), die den Rang aus der Tagesprognose nimmt — oder aus `priority`, der
Reihenfolge, die der Besucher selbst gesetzt hat. Und weil der Beam den Ausfall erst am letzten
Stopp sieht, entscheidet `peeled()` die **Menge vor der Reihenfolge**. Danach: neun von zehn
geplant, Taron und F.L.Y. dabei, verzichtet wird auf Colorado Adventure.

**Und wo die App nicht entscheiden kann, fragt sie.** `PlannerHeadlinerChoice` zeigt bei knappen
Tagen alle Headliner mit Häkchen (alle an), markiert die, die nicht mehr reinpassen, und nennt ihre
Spitzenwartezeit; wer nichts anfasst, bekommt die Antwort des Optimierers. Der Assistent fragt einen
Schritt früher, mit demselben Hinweis im Untertitel des Schalters. (Beides ist inzwischen durch
`PlannerFitAssistant` ersetzt, siehe den Eintrag darüber.)

Dazu vier Funde aus einem Review des Optimierers: der Überlauf-Zweig räumte feste Blöcke nicht aus
dem Weg (eine Bahn lag quer über dem Abendessen, und der Knopf meldete deshalb bei **jedem** Druck
„Der Tag ist umgestellt"), `nowFloor` deckelte gegen die Schließzeit und lieferte um 17:58 die
Antwort 17:45, Parks mit Schluss nach Mitternacht wurden mit der 23-Uhr-Kurve bepreist (gemeldete
680 gegen 630 gezeichnete Minuten), und Inkumbent und Plan verglichen unterschiedliche Mengen,
sobald `MAX_STOPS` schnitt — 26 Bahnen ließen den Tag bei jedem Druck neu würfeln. Details:
[trip planner](features/trip-planner.md#the-day-can-sort-itself-and-what-it-is-sorting-for-is-written-down).

---

### fix: der Favoritenstern sitzt wieder in seinem Ring

Auf dem Telefon hing der Stern aus dem Kreis, in den ihn die Karte gezeichnet hat — auf jeder
Park-, Bahn-, Show- und Restaurantkarte der Seite. Ursache war die 44-px-Touch-Stufe aus der
zweiten Mobile-Runde, die als `max-sm:min-h-11 max-sm:min-w-11` auf dem Knopf selbst saß.
`ParkCard` und `AttractionCard` geben ihm einen eigenen 34-px-Kreis und `h-full w-full`; der
44-px-Knopf behielt dessen linke obere Ecke, und der im Knopf zentrierte Stern landete 6 px weiter
rechts und 6 px tiefer als der Ring um ihn herum. Bei 390 px gemessen: Sternmitte 23 px vom rechten
Kartenrand und 35 px von oben, wo die Kreismitte bei 29/29 liegt, auf 12 von 12 Karten der
Startseite und 19 von 19 einer Parkseite. Show-, Restaurant- und In-Park-Karten hängen ihren
Wrapper stattdessen an dessen **rechter oberer** Ecke auf, dort gingen dieselben 28 px in die
Gegenrichtung und schoben den Stern 14 px in die Karte hinein: 31/31 statt der 17/17, die die
Position vorgibt.

Die Trefferfläche wächst jetzt über ein Pseudo-Element, die Box bleibt, wie die Aufrufstelle sie
gesetzt hat — dieselbe Trennung, die `BreadcrumbNav`, `PlannerBlock` und `PlannerFlyout` schon
jeweils einzeln begründet haben und die im Design-System bisher nirgends stand. Nachgemessen:
jeder Stern auf 0,0 px in seinem Ring (29/29 bzw. 17/17), und die Reichweite, die
`elementFromPoint` findet, liegt bei 43 × 44 px im Kreis und 44 × 44 px auf einer
Restaurantkarte gegen 37 × 44 vorher. Sie ist größer geworden, weil sie um den Stern zentriert ist
statt an einer seiner Ecken zu hängen. Im Titelkopf der Parkseite schrumpft die Box von 44 auf
24 px, was der `<h1>` daneben 20 px mehr gibt (248 → 268 px bei 390 px) und vertikal nichts bewegt.

#### Nachtrag: der Schließen-Knopf des Standort-Banners

Zweiter Fall derselben Regel, und er zeigt ihre andere Hälfte: eine gewachsene Trefferfläche muss
auch daraufhin geprüft werden, worüber sie jetzt liegt. Der Knopf hängt `absolute top-2 right-2` in
einem Toast, die zusätzlichen 20 px gingen also nach innen — 53 px in eine Karte hinein, deren
Textspalte 37 px vor dieser Kante endet. Er lag damit über den letzten 16 px der Überschrift, und
`elementFromPoint` am rechten Rand der Spalte lieferte den Schließen-Knopf: ein Tipp ans Ende einer
Überschriftszeile hat den Banner geschlossen. Das Glyph saß bei 31/31 statt 21/21. Der Kommentar
darüber hat beides bestritten („the card's `pr-9` already keeps the text clear of it, and the glyph
does not move"), was erklärt, warum es niemandem aufgefallen ist: das `pr-9` war für den 24-px-Knopf
geschrieben und nie gegen den 44-px-Knopf nachgerechnet.

Die Box zu reparieren ist dort nur die halbe Arbeit. Ein Pseudo-Element um einen 24-px-Knopf in
einer 8-px-Ecke reicht 43 px hinein, also lag mit `pr-9` allein die _Fläche_ weiterhin über den
letzten 6 px der Textspalte — derselbe Tipp, dasselbe Ergebnis, nur im Layout nicht mehr sichtbar.
Das Padding der Karte muss die Fläche freihalten und nicht die Box: `max-sm:pr-11`. Gemessen über
sechs Sprachen × 320/360/390 px wechseln alle 18 Fälle an diesem Punkt von `CLOSE-BTN` auf `H2`, die
Box geht von 44 auf 24 px, das Glyph von 31/31 auf 21/21, die Reichweite bleibt 44 × 44 und der
Hauptknopf ist in keinem Fall verdeckt. Die acht Pixel werden in Textbreite bezahlt und ergeben in
3 dieser 18 Fälle eine Zeile mehr (es bei 320 und 360, en bei 390, je +16,5 px Karte); der Toast ist
`fixed`, seine Höhe verschiebt auf der Seite also nichts.

Siehe [Design System](design/design-system.md#the-target-grows-the-box-does-not).

---

### feat: the ride page opens the way its park page does

A ride page and its park page are one click apart over the same photograph, and they opened as two
different objects. The park's fold is a title card and then one header card: „Heute im Park" on
top, the chapter row as its footer band, every cell saying what is behind it right now. The ride's
was a title card on a second grade of glass, a gap, and four rounded tiles carrying an icon and a
label and nothing else — over a live wait time that did not appear until the first chapter heading
had gone by, on the page people arrive at from a search for „Taron Wartezeit".

**„Heute an dieser Bahn" is the park's panel, one page type over.** Same header strip with the live
dot and the clock, same hairline-ruled columns, same captions. What it collects was already on the
page in four places metres apart: the live wait with its trend, today's range and peak, the day's
recommended slots and the typical/busy pair — plus the park's own status and opening hours, which a
ride page never stated at all.

**The chapter row keeps the park's hairlines and gains hints.** `RideNavTiles` is the park's tile
row, still jump links and not tabs: switching a `Tabs` here would take the typical-wait table, the
30-day history, the ride profile and the FAQ out of the served HTML of 42,756 attraction URLs,
which is most of what a ride page is for. The hints ride on the query the panel above it already
runs, by the same key, so the row costs no request. Its two chapter titles come in as props —
`useTranslations('seo.faq.attraction')` in a Client Component would ship that namespace and
`attraction.rideProfile` with it to every one of those URLs, for two strings the server already
holds. `pnpm generate:route-namespaces` produces no diff.

**The 30-day history is a chapter now, drawn in the crowd calendar's language.** The two grids on a
park's own pages used to explain the same colours twice: the park's tinted tiles with a four-signal
bar against a white card with one coloured border and one corner icon picked by priority, so a
Friday in the summer holidays that was also a public holiday next door showed a third of what it
knew. The ride cell is `ParkCalendarDay`'s anatomy with the queue curve on the floor of the tile —
which is what a ride day has and a park day does not, and the reason the component still exists.
One `yMax` across the grid, or a flat twenty-minute Tuesday is drawn as dramatically as a
hundred-minute Saturday. Week rows are weekday-aligned from `lg` up, where the grid ran seven per
row from today backwards before and put a different weekday in every column each month. The legend
is the park's own `ParkCalendarLegend` instead of a hand-built badge row.

**The chapter stopped waiting for its data before it could have a heading.** The old skeleton hid
the whole thing, title included, behind a grey box; the heading and the legend need no data and are
in the served HTML now, and only the grid's box is reserved. That box's height is a formula rather
than four hand-measured pixel values whose comment already said they would have to be re-measured:
`lib/parks/attraction-history-geometry.ts` derives the week rows from the weekday the 31-day window
starts on — five, or six for two weekdays in seven — with today read in the **park's** timezone,
since a Florida park is still on yesterday's date for six hours after midnight in Berlin.
`pnpm test:attraction-history-geometry` covers all seven weekdays, a year boundary, a leap day and
a DST Sunday.

Deleted with it: `ride-section-nav.tsx`, `attraction-live-panel.tsx` and
`attraction-history-sections-skeleton.tsx`.

See [design system → the ride page is the park page's anatomy](design/design-system.md#the-ride-page-is-the-park-pages-anatomy).

---

### feat: Größenfilter auf der Parkseite, und ein Panel für die drei Filter

Wer mit Kind in einen Park fährt, hat eine Frage vor allen anderen: was darf es fahren. Die Antwort
stand längst auf jeder Karte („Ab 120 cm"), aber nur einzeln – 40 Karten durchsehen und im Kopf
mitzählen.

**Der Filter kommt nur, wenn der Park Mindestgrößen liefert.** Rund ein Drittel des Katalogs hat
dazu nichts hinterlegt, und ein Regler, dessen jede Position dieselben 40 Bahnen zeigt, ist
schlechter als keiner. Die Skala kommt aus dem Park selbst: zwei Schritte unter der kleinsten Grenze
(dort muss eine Position stehen, die nichts freigibt) bis zur größten, mit den Grenzen des Parks als
Markierungen auf der Schiene. `maximumHeight` filtert mit, streckt die Schiene aber nicht – die
Werte sind meist die Sicherheitsobergrenze einer Achterbahn, im Phantasialand 140, 145, 195, 200 und
205 cm, und ein Drittel der Schiene für „zu groß für eine Achterbahn" wäre verschenkt.

Ein Regler statt drei Knöpfen, obwohl sich das Ergebnis nur an den Grenzen des Parks ändert: niemand
kennt die Größe seines Kindes als eine von drei Zahlen, sondern als 118. Eine Bahn ohne hinterlegte
Grenze bleibt sichtbar – niemand hat etwas aufgeschrieben, das ist kein Verbot.

**Suche, Größe und Saison stehen jetzt in einem Panel** mit eigenem Header. Vorher schwebte das
Suchfeld per `md:absolute` über dem Parkfoto neben der Rope-Drop-Karte und lag auf dem Telefon als
vollbreiter Kasten über dem ersten Land; der Saison-Schalter saß daneben in einer nackten Flex-Zeile.
Nichts sagte, dass das ein Satz Bedienelemente über einer Liste ist, und für ein drittes war kein
Platz.

Drei Zellen mit je einer Überschrift, je 60 px hoch, durch eine Haarlinie getrennt, links im Panel
statt über die ganze Breite gezogen. Der Größenfilter braucht drei Zeilen, die anderen beiden je
eine Zeile Bedienelement, und in einer Reihe ohne Überschriften stand der Saison-Schalter deshalb
mitten in der Differenz. Unter `md` teilen sich Suche und Saison eine Zeile und der Regler nimmt die
zweite: 275 px statt 373 px.

**Der Regler sah aus, als wäre schon etwas gewählt.** Der Griff lag auf der kleinsten Grenze des
Parks, mit gefüllter Schiene dahinter, also auf einem Wert, den niemand ausgesucht hatte. Jetzt liegt
er am linken Ende, hohl, ohne Füllung, daneben steht „Alle Größen" und unter der Schiene „Größe
wählen". Ein Klick genau auf die Ruheposition setzt den Wert, den das Feld schon hat, also feuert
`change` nicht: `onPointerDown` schaltet den Filter deshalb ein.

**Die Suche greift an der Saison vorbei, an der Größe nicht.** Die Saison ist eine Eigenschaft der
Bahn, nach der niemand gefragt hat. Eine Körpergröße ist eine Aussage über die Person in der
Schlange: Ein Kind mit 105 cm wird nicht größer, weil jemand „Taron" tippt. Ist die Liste deshalb
leer, benennt sich der Filter im Leerzustand selbst.

Das Panel rendert in beiden Zweigen von `tabs-with-hash.tsx` – vor und nach dem Mount dasselbe
Bauteil statt eines `h-9`-Platzhalters, der seine Höhe ein zweites Mal aufschreiben müsste.
Regeln als reine Funktionen in `lib/utils/rider-height.ts` (`pnpm test:rider-height`), Details unter
[Attraction Filter Panel](features/attraction-filter-panel.md).

---

### Der °C/°F-Schalter steht jetzt neben dem Theme-Schalter

Die Einheit steuert Temperaturen im Wetter-Kalender, in Blogartikeln und auf dem Reisezeit-Hub – der
Schalter dafür saß in der Kopfzeile der Wetterkarte, also ausschließlich auf Parkseiten. Er steht
jetzt in der Kopfleiste, direkt neben Sprache und Theme, und damit auf jeder Seite.

**Die Leiste hat ein Breitenbudget, und es steht nirgends geschrieben.** Bei 360 px – der Breite,
die die meisten Android-Telefone melden – trägt die Zeile 303 px Inhalt in 328 px: Lockup 107,
Suchknopf 36, Sprachumschalter 56, Theme-Schalter 48, Burger 36, dazu 20 px Abstände. 25 px Luft, in
allen sechs Sprachen bis auf 6 px gleich, weil in dieser Zeile nichts Fließtext ist.

Daraus folgt die Form des Schalters. Eine zweigeteilte `°C | °F`-Pille ist 54 px breit und passt
nicht; ein nackter Textknopf passt mit Abstand ebenfalls nicht (21,5 + 4 gegen 25). Der Knopf zeigt
deshalb die **aktive** Einheit und wechselt beim Klick zur anderen: 28 px, auf dem Telefon 24, `h-7`
und derselbe Ring wie der Theme-Schalter daneben, damit die beiden als Paar lesbar sind. Oberhalb von
`sm` wären beide Segmente bezahlbar – bewusst nicht genommen, ein Steuerelement, das überall gleich
aussieht, ist besser als zwei Markups, die ineinander hydrieren.

**Seine Breite darf nicht davon abhängen, welche Einheit gerade gilt.** Nach dem Label bemessen tat
sie es: `°F` ist schmaler als `°C`, der Knopf schrumpfte also unter dem Finger, der ihn gerade
gedrückt hatte, und zog Theme-Schalter und Sprachflagge mit – in einer Zeile, in der jeder Pixel
verplant ist, und ausgerechnet bei dem Bedienelement, dessen ganze Aufgabe es ist, seine Beschriftung
zu wechseln. `min-w-7` bzw. `max-sm:min-w-6` mit `px-1` nagelt die Box auf 28 und 24: das Label ist
rund 13 px breit und damit ohne Belang, solange es unter der Box bleibt, und der Innenabstand ist
das, was passiert, wenn eine Leserschrift doch einmal darüber hinausgeht – dann wächst der Knopf,
statt abzuschneiden. Über einen Wechsel in beide Richtungen und auf beiden Stufen gemessen bewegen
sich die eigene Box und die Positionen der Nachbarn um **0,0 px**.

Und daraus folgt, woher der Platz kam: aus drei Stellen, keine davon die Höhe eines Bedienelements.
Das Länderkürzel im Sprachumschalter kostet 22 px Text und Abstand, direkt neben einer Flagge, die
dasselbe sagt, vor einem Dropdown, das Kürzel **und** Sprachnamen auflistet – unterhalb von `sm`
steht die Flagge nun allein. Die beiden Abstände zwischen den Aktionsgruppen geben 8 px her
(`max-sm:gap-1`), die Telefonstufe des Knopfes selbst noch einmal 4 (`max-sm:min-w-6`).

Nachgemessen bei 320/360/390 px × sechs Sprachen: 301 px belegt, bei 360 px also 27 px Luft – zwei
Pixel weniger belegt als vor dem Knopf – und in jeder Sprache dieselbe Zahl, wo sie sich vorher um
6 px unterschied. **Die beiden letzten Kürzungen gibt es wegen 320 px.** Das ist die schmalste
Breite, die noch in den Logs auftaucht, und die Leiste stand dort schon vorher 15 px über ihrem
Kasten – vom `px-4` des Containers geschluckt, also ohne Querscrollen und ohne dass es jemandem
aufgefallen wäre. Mit dem Knopf allein waren es 26 px und das Dokument 330 px breit auf einem 320-px-
Schirm. Jetzt sind es wieder 13, innerhalb des Paddings, und das Dokument ist von 320 bis 768 px
exakt so breit wie der Viewport. Die Ecken-Pille der Hero-Seiten trägt dieselben drei Bedienelemente,
endet bei jeder Breite 24 px vor dem rechten Rand und hält bei 320 px 42 px Abstand zum Eck-Logo.

Die Einheit selbst kommt weiterhin ohne React-State aus: der Knopf rendert `°C` **und** `°F` und
lässt `html[data-temp-unit]` eines davon zeigen – dieselben `.u-metric`/`.u-imperial`-Klassen, mit
denen jede server-gerenderte Temperatur arbeitet. Der Klick liest das Attribut vom Dokument statt aus
dem Context, kippt also per Definition das, was der Leser gerade sieht. Die drei Klassen der alten
Pille (`.u-unit-btn`, `.u-unit-c`, `.u-unit-f`) sind mit den Segmenten weggefallen. Details unter
[Design-System → Header-Geometrie](design/design-system.md#header-geometry).

---

### fix: Das Icon in der Google-Suche ist wieder lesbar

In einem `google.de`-Treffer für „Phantasialand Wartezeiten" stand neben dem Ergebnis ein Fleck.
Vier Fehler, jeder für sich ausreichend.

**Google bekam 32 px und die Auskunft, es seien 48.** `app/favicon.ico` enthielt zwei Frames, 16
und 32. Der `<link>`, den Next für die File-Convention schreibt, meldet den größten Frame der Datei
als `sizes` – und meldete `48x48`. Google fragt von sich aus nach etwas oberhalb von 48×48.

**Der Schriftzug steckte im Icon.** `icon-192.png`, `icon-512.png` und `apple-touch-icon.png` trugen
die volle Lockup mit „park.fan" unter dem Pin. Der Schriftzug belegte rund ein Viertel der Höhe, bei
16 CSS-Pixeln also etwa 4 px Versalhöhe – nicht lesbar, und er nahm der Bildmarke obendrein ein
Viertel der Fläche.

**Die Marke brachte keinen eigenen Grund mit.** Der Pin ist eine Kontur mit einem Loch als Kopf, und
beide Fassungen hängen davon ab, was dahinter liegt: die helle ist in #293B47 gezeichnet, Googles
dunkle Trefferseite ist #202124. Dort komponiert bleibt vom Pin nichts übrig, nur das blaue Innere.
Ein transparentes Icon sucht sich seinen Hintergrund nicht aus, eine vollflächige Kachel schon.

**Das SVG-Favicon wurde nie ausgeliefert.** `app/[locale]/layout.tsx` deklarierte
`icons: { icon: '/favicon.ico', … }`. Metadata-Felder verschmelzen nicht über Segmente hinweg – das
nächstgelegene Segment ersetzt das ganze Objekt –, also fiel die File-Convention `app/icon.svg` auf
jeder Seite der Site weg. Im Live-`<head>` standen zwei favicon.ico-Links und kein SVG. Dieselbe
Falle ist für `alternates` unter [Blog-Feeds](seo/blog-feeds.md) beschrieben. Die unterdrückte Datei
war ohnehin ein drittes, veraltetes Artwork.

Neu ist die Marke auf einer Kachel im Brand-Navy, 3 % Rand, 18 % Eckenradius dort, wo das Icon so
gezeigt wird, wie es kommt, und quadratisch dort, wo ein Betriebssystem seine eigene Maske
darüberlegt. Weißer Pin auf Navy liest sich bei 16 px in beiden Google-Modi – auf der hellen Seite
trägt die Kachel den Kontrast, auf der dunklen der Pin.

**Zwei Quellen, und die Grenze zwischen ihnen ist gemessen, nicht Geschmack.** Der Detail-Pin ist
die Marke der Site – Footer, OG-Bilder, Organization-Logo in den strukturierten Daten und
Wartungsseite zeigen ihn – und er ist die schönere Zeichnung. Unterhalb von etwa 24 px trägt er
nicht mehr: der Orbit schneidet durch den weißen Ring, die drei Balken laufen zu einem grün-blauen
Fleck zusammen, und bei 16 und 20 px ist die Silhouette kein Pin mehr. Genau dort zeichnen Google
und der Browser-Tab.

Die Grenze ist dabei nicht die Größe der Datei, sondern **die kleinste Größe, in der irgendeine
Oberfläche sie zeichnen darf**. Deshalb liegt auch `apple-touch-icon.png` auf dem Burg-Pin, obwohl
die Datei 180 px groß ist: Google liest `apple-touch-icon` als Favicon-Kandidaten und dokumentiert
keine Reihenfolge gegenüber `rel="icon"`, darf sie also greifen und selbst auf 16 px herunterrechnen
– genau der Fehler, wegen dem diese Änderung existiert. Auf der einfachen Quelle bleibt Google gar
kein Detail-Kandidat mehr, denn das Manifest ist keine Favicon-Quelle.

Den Detail-Pin behält das App-Icon: die 192er und 512er des Manifests und das maskable Icon, aus
`logo-big-dark.svg`. Nicht aus `logo-dark.svg`, darin steckt ein 1563×1116-PNG in einer SVG-Hülle,
deshalb wiegt die Datei 77 KB. Die drei wandern zusammen, weil ein Launcher, der zwischen 192 und
512 wählen darf, nicht je nach Wahl eine andere Marke bekommen soll.

Alle sechs Dateien schneidet jetzt `pnpm generate:icons`, `pnpm check:icons` schlägt an, sobald eine
davon nicht mehr zu ihrer Quelle passt. Vorher lagen im Set drei verschiedene Artworks nebeneinander
und nichts verglich sie. Zwei Werte werden gerendert und über den Alphakanal gemessen statt
eingetippt: die Ink-Bounding-Box – der Burg-Pin sitzt in einer 144×144-viewBox auf 62,5 % Breite und
86 % Höhe, ein Skalieren der viewBox ließe also an jeder Kante ein Siebtel des Icons leer – und die
Position des Schriftzugs. `logo-big-dark.svg` ist die Lockup und trägt „park.fan" unter dem Pin;
gesucht wird das breiteste vollständig leere Zeilenband, das erst ab 4 % der Ink-Höhe als Trenner
zählt, denn ein Pin hat nirgends eine derartige Lücke. Der Teil darüber ist die Marke und wird
**geclippt** – nicht optional, weil der Schriftzug bei einem formatfüllend skalierten Pin exakt an
dessen Unterkante beginnt und sonst in den unteren Streifen des Icons malen würde, statt aus der
viewBox zu fallen.

Deklariert wird das Set nur noch in `app/layout.tsx`. Kein anderes Segment darf `icons` setzen.
`/admin` ändert sich nicht, und die URLs bleiben, wo sie sind – Google crawlt ein Favicon nach
eigenem Takt, Tage bis Wochen, und ein Umzug kostet diese Wartezeit erneut. Details:
[Favicon](seo/favicon.md).

---

### feat: Fastpass an der Bahn, im Glossar und im Admin

Die API liefert pro Bahn ein kuratiertes `fastPass`-Objekt — `{ name, price, priceFrom, currency,
termId }`. Auf der Bahnseite und auf der Ride-Karte steht dafür jetzt ein Badge in der Faktenzeile,
zwischen den Größenbeschränkungen und dem, was die Bahn _ist_: ein Fastpass ist eine Aussage über
den Besuch, keine über die Bahn.

Der Text wird hier zusammengesetzt, nicht von der API übernommen. „12 €" und „€12" sind derselbe
Preis in zwei Sprachen, und nur diese Seite weiß, in welcher gelesen wird — `Intl.NumberFormat` mit
der Locale des Besuchers. Drei Fälle: `price` ist der Preis für genau diese Bahn („QuickPass: 12 €"),
`priceFrom` der Einstiegspreis des Parkprodukts („Fast Lane: ab 25 €", der Normalfall, weil fast
jeder Park einen Pass für den Besuch verkauft statt einen pro Bahn), und **`price === 0` heißt
kostenlos** — Europa-Parks VirtualLine ist im Eintritt enthalten. `if (price)` würde das
verschlucken; getestet wird auf `!= null`.

**Ein fehlendes `fastPass` heißt nicht „diese Bahn hat keinen."** Es deckt zwei Zustände ab, die die
API bewusst nicht trennt: niemand hat nachgesehen, oder jemand hat nachgesehen und der Park verkauft
keinen. Das Badge erscheint, wenn das Objekt da ist, und sonst gar nichts — ein „kein Fastpass" wäre
bei ~7000 Attraktionen meistens unsere eigene Buchführung als Aussage des Parks.

Neu im Glossar sind sechs Markenbegriffe (`quick-pass`, `virtual-line`, `fast-lane`, `speedy-pass`,
`fastrack`, `premier-access`), in allen sechs Sprachen. Der Name im Badge verlinkt dorthin, sobald
der Park eine `termId` trägt — in der Ride-Karte als Tooltip, weil die Karte selbst schon ein Link
ist.

Im Admin bekommt die Parkseite einen eigenen Tab: eine Tabelle aller Bahnen mit Ja/Nein/— und
Preisfeld, ein Speichern für den ganzen Park (`PATCH /parks/:id/attractions`). Der Grund ist die
Vorlage: Die Preisseite eines Parks listet zwölf Bahnen auf einmal, und vierzig Einzelspeicherungen
sind vierzig Revalidierungen für eine Entscheidung.

---

### fix: die Kachelreihe bleibt beim Wechsel zwischen Parkseite und Kalender stehen

Die sechs Einstiegskacheln stehen auf jeder Seite eines Parks, in derselben Reihenfolge und mit
denselben Live-Hinweisen, damit Parkseite → Kalender → Parkseite sich wie eine Seite anfühlt.
Genau das tat es nicht, und schuld war der Scroll. Der Kalender ist eine eigene Seite, ein Klick
auf seine Kachel also eine Navigation, und eine Navigation springt an den Seitenanfang. Wer die
Reihe hochgescrollt hatte, um sie zu lesen, verlor sie beim Hinweg und bekam sie beim Rückweg an
anderer Stelle wieder – und der Rückweg war der schlimmere Fall, weil der Hash-Router der
Parkseite die Reihe danach noch auf 100 px heranscrollte. Ein Klick kostete also einen Sprung
nach oben plus eine Animation zurück nach unten, in beide Richtungen, jedes Mal.

Die Position wird jetzt übergeben statt neu berechnet: die Kachel merkt sich, wo die Reihe im
Moment des Klicks im Bild stand, und die Reihe auf der Zielseite korrigiert sich auf denselben
Wert. Gemessen an Phantasialand, 1280 × 900, Reihe auf 220 px: Hinweg 220 px, Rückweg 218 px,
vorher 0 px Scroll-Position und ein Sprung von 740 px.

Das Stehenbleiben braucht **drei** Absagen, nicht eine, und jede gehört zu anderem Code.
`scroll={false}` ist die des Routers. `suppressScrollToTopFor()` ist die von `ScrollToTop`, das
es gibt, weil der Router-Handler immer dann aussteigt, wenn das oberste Element der neuen Seite
schon im Bild ist – bei unseren gestreamten Shells also praktisch immer, weshalb der Prop allein
messbar nichts tut. Und `hasTileRowHandoff()` ist die an `useTabHashRouting`, das sonst beim
Ankommen seinen Deep-Link-Scroll fährt; nur beim Ankommen, denn ein späterer `hashchange` (die
Show-Zeilen des Panels zielen auf `#map-show-<slug>`) ist jemand, der irgendwohin gebracht werden
will. Fehlt eine der drei, landet die Reihe wieder irgendwo.

Der Merkzettel liegt in einem Modulwert statt in `sessionStorage`, weil das App-Router-Navigationen
sind und das Modul sie überlebt; ein harter Aufruf findet nichts vor und verhält sich wie vorher.
Verbraucht wird er nicht, er verfällt – und das ist, was ihn Reacts doppelten Mount im
Entwicklungsmodus überstehen lässt: eine Fassung, die ihn im Cleanup löschte, stellte gar nichts
wieder her, weil StrictMode Setup, Cleanup, Setup fährt und der zweite Setup ein leeres Fach
vorfand.

`scrollWhenSettled` ist dafür aus `use-tab-hash-routing.ts` nach `lib/utils/` gezogen und nimmt
jetzt einen Zielversatz und den Schalter für die weiche erste Bewegung. Zwei Dinge sind dabei
besser geworden: der erste Scroll läuft synchron statt im nächsten Frame, was auf Parkseite →
Kalender 208 ms mit 22 px Versatz gespart hat, und Mausrad, Wischen oder eine Scroll-Taste
beenden die Korrekturphase sofort. Sechs Sekunden Nachführen sind sechs Sekunden, in denen jemand
etwas anderes lesen will.

Dazu, im selben Aufwasch: der Nowcast-Streifen im Kopfbereich hatte noch seine eigenen runden
Ecken und einen Rahmen ringsum, saß also als kleinere Box lose in einem Band, dessen Nachbarn
randlos sind. Er ist jetzt eckig wie der Warnstreifen darüber, und die Absage reicht bis zu
seinen beiden absolut positionierten Überlagerungen, die ihr `rounded-xl` sonst behalten und den
Panelhintergrund in allen vier Ecken durchscheinen lassen.

---

### feat: die Sitemap sagt jetzt, welche Seiten sich geändert haben

Von 42.756 Attraktions-URLs trug keine ein `<lastmod>`, im Hauptsitemap 1.662 von 3.480. Die
beiden anderen Tags helfen dabei nicht weiter: Google liest `changefreq` und `priority` gar
nicht. Für alles, was aus der API kommt, stand also nichts drin.

Der Grund war real. Die API führt keinen Zeitstempel je Datensatz: `/v1/sitemap/attractions`
antwortet `{url, slug}`, ein Park-Payload datiert nur seine Live-Messwerte. Das Datum wird
deshalb jetzt beobachtet statt behauptet. Ein täglicher Lauf um 05:30 UTC holt alle 212 Parks
frisch, bildet einen Fingerabdruck über die _stabile_ Hälfte jeder Park- und Fahrgeschäftsseite
und merkt sich ihn. Der Tag, an dem der Fingerabdruck sich ändert, ist der Tag, an dem die Seite
sich geändert hat.

Der Nutzen steckt in dem, was nicht im Fingerabdruck steht. Eine Parkseite ändert sich alle fünf
Minuten, also wäre „heute" auf allen 44.000 URLs jeden Tag korrekt und trotzdem wertlos: ein
Wert, der überall gleich ist, sagt nichts. Draußen bleiben deshalb `queues`, `status`,
`crowdLevel`, `statistics`, `typicalWaits`, `bestVisitTimes`, `ropeDrop`, `weather`, `schedule`
und `analytics`. Drin ist, was auf der Seite steht und stehen bleibt: Name, Land, Mindestgröße,
Ride-Profile mit ihren Glossarbegriffen, die kuratierten Parkangaben, die Fotos aus der
Mediendatenbank und die Artikel, die auf die Seite verlinken.

Zwei Fehlerfälle sind eigens behandelt, weil beide sonst unsichtbar wären. Ein Park, den die API
nicht beantwortet, behält seine bisherigen Daten – würde er herausfallen, käme er morgen als neu
zurück, und neu heißt geändert: aus einem Timeout würden 82 falsche Einladungen zum Neucrawlen.
Und eine Änderung am Fingerabdruck selbst macht die gespeicherten Hashes unvergleichbar, was
nicht dasselbe ist wie ein geänderter Katalog; der Abgleich übernimmt dann die neuen Hashes und
behält alle Daten. `pnpm test:content-changes` hält beides fest, dazu die Blindheit gegenüber
jedem Live-Feld, denn ein grüner Build zeigt davon nichts.

Gemessen beim ersten vollständigen Lauf: 7.100 von 7.126 Attraktions-URLs je Sprache haben ein
Datum, im Hauptsitemap 3.444 von 3.480 statt 1.662. Ohne Datum bleiben 36 URLs – Startseite,
Suche, fancast, contribute, Guide und Reisezeit-Hub in sechs Sprachen –, weil für die niemand
aufschreibt, wann sie sich zuletzt geändert haben.

Derselbe Schnappschuss räumt eine Etage weiter dasselbe Problem ab: der IndexNow-Cron hat jeden
Morgen alle rund 46.000 URLs eingereicht. Jetzt gehen die Katalogseiten raus, deren Datum
höchstens zwei Tage alt ist, dazu die kleine feste Auswahl und die Blogseiten. Montags läuft
weiterhin alles, damit ein Detektor, der aufhört zu detektieren, nicht dazu führt, dass hier
dauerhaft nichts mehr eingereicht wird. Mit `?dry=1` baut der Lauf die Liste und schickt sie
nicht ab.

Details: [Sitemaps](seo/sitemaps.md).

---

### die Seite beantwortet auch Fragen, die keine Person stellt

Ein Agent, der nur den Hostnamen hat, fand bisher robots.txt, zwei Sitemaps und sonst nichts.
Jetzt findet er `/llms.txt`, den API-Katalog nach RFC 9727 unter
`/.well-known/api-catalog` samt `Link`-Header auf der Startseite, drei Skills mit SHA-256-Digest
unter `/.well-known/agent-skills/`, das ARD-Manifest, die MCP-Server-Card und `/auth.md`. Alles
liegt in `lib/agents/`, alles wird von `pnpm check:agent-ready` von außen geprüft.

Dazu ein MCP-Server unter `/api/mcp` mit drei lesenden Werkzeugen (Suche, Wartezeiten eines
Parks, Prognose je Tag) und dieselben drei noch einmal im Tab über `navigator.modelContext`,
plus ein viertes, das den Tab navigiert. Die Browser-Werkzeuge rufen dabei den eigenen
MCP-Endpunkt auf, statt die API selbst zu lesen: die Regeln, an denen so eine Antwort hängt,
liegen serverseitig bei den Daten. Hansa-Park veröffentlicht seine Wartezeiten nur in der
eigenen App im Parkwlan, und sein Payload sieht aus wie ein Park, der nachts geschlossen ist –
Ø 0 Minuten über eine leere Menge. Das Werkzeug meldet dafür `waitTimesAvailable: false` und
einen Satz, keine Nullen; der Check hält das an genau diesem Park fest.

`robots.txt` kommt jetzt aus einem Route-Handler, weil drei der Zeilen in Nexts Generator nicht
vorkommen: `Content-Signal: search=yes, ai-input=yes, ai-train=no`, `License` und `Agentmap`.
Dieselbe Antwort steht noch einmal pro Crawler, weil ein Bot nur seinen eigenen Block liest – wer
Trainingsmaterial sammelt, bekommt `Disallow: /`, wer eine Seite holt, weil gerade jemand
wartet, bekommt was eine Suchmaschine bekommt. Das ist genau Cloudflares eigene Einteilung in
Search, Agent und Training.

Dieselben drei Antworten stehen ein zweites Mal als Lizenz unter `/license.xml` (RSL 1.0), weil
die Lizenzwerkzeuge kein robots.txt lesen: erlaubt sind Suche und Beantworten, Training nicht,
und der Preis ist eine Quellenangabe. Der Kommentarblock über der ersten `Content-Signal`-Zeile
ist Cloudflares Policy-Text wörtlich, samt des Satzes, der aus der Einschränkung einen
ausdrücklichen Rechtevorbehalt nach Artikel 4 der EU-Urheberrechtsrichtlinie macht. Umformuliert
wäre es ein anderer Rechtstext. Der `Link: …; rel="license"` hängt als einziger Header dieser
Sammlung an jeder Seite statt nur an der Startseite, denn wer eine Lizenz braucht, ist gerade
der Crawler, der die robots.txt übersprungen hat.

Und `/admin` steht in keinem dieser Dokumente. Es ist jetzt vierfach abgezäunt: in robots.txt,
über `X-Robots-Tag` am Response (die JSON-Routen unter `/api/admin` rendern kein Meta-Tag), über
die schon vorhandenen Layout-Metadaten und im Navigations-Werkzeug, das der einzige Zaun ist,
durch den ein Agent sonst gehen könnte.

Details: [Agent readiness](seo/agent-readiness.md)

---

### feat: die Wartezeitentabellen im Blog holen sich ihre Zahlen selbst

Vier Artikel trugen zweiundzwanzig handgepflegte Tabellen über sechs Sprachen:
Top-Ten eines Parks, Bahnen quer über Parks hinweg, Wochentage, und das
Stundenprofil des Europa-Parks als 8 × 10 Matrix, also achtzig Zahlen pro
Sprache. Sie waren längst auseinandergelaufen. Der Efteling-Artikel nannte
34 Minuten für Joris en de Draak, während die Parkseite bei 35 stand, und die
beiden Toverland-Tabellen desselben Artikels widersprachen sich um eine Minute,
weil sie eine Woche auseinander getippt worden waren. Auffallen konnte das
niemandem: eine veraltete Zahl in Markdown sieht aus wie eine frische.

Zwei neue Fences ersetzen sie. **`ride-waits-widget`** in zwei Formen – die
Rangliste eines Parks (`park=` + `top=`) oder eine benannte Liste über Parks
hinweg (`rides=`), semikolongetrennt, weil eine Bauart regelmäßig ein Komma
enthält. Bauart und Anzeigename bleiben im Artikel: das Layout einer Achterbahn
ändert sich zwischen zwei Seitenaufrufen nicht. Die Minuten stehen nirgends mehr
im Text. **`hourly-profile-widget`** zeichnet die Tagesform: eine Zeile je Bahn,
eine Spalte je Öffnungsstunde, die stärkste Stunde jeder Bahn fett. Beide Achsen
kommen aus den Daten, ein Park der um elf öffnet fängt bei elf an.

Dahinter liegt ein neuer, schlanker Endpunkt (`/stats/hourly`, ~2 KB für acht
Bahnen). Dieselbe Auskunft über den Attraktions-Endpunkt hätte 425 KB gekostet,
davon 45 % ein `schedule`, das niemand rendert – der Grund, warum diese Tabelle
bisher von Hand gepflegt wurde. Alle Stats-Tabellen laufen jetzt über
`useParkStatsQueries`, das Query-Key, Stale-Fenster und die Loads-Last-Regel an
einer Stelle hält; zwei Tabellen zum selben Park zahlen dadurch einmal.

Wo ein Satz neben einem Widget eine Zahl nannte, die das Widget selbst rendert,
ist jetzt die Form beschrieben statt der Wert („gut eine halbe Stunde", „ab
Mittag etwa die Hälfte"). Das bleibt wahr, während die Zahl wandert.

Details: [Blog-Widgets](../content/blog/README.md#6-live-widgets-code-fences) ·
[API-Budget](architecture/api-budget.md#blog-widgets-what-a-post-may-fetch)

### fix: die Parknamen waren abgeschnitten, der ruhigste Tag fehlte

Auf `/beste-reisezeit` las die Vergleichstabelle „Europa-P…", „Phantasia…",
„Disneylan…". `table-layout: auto` gibt die Breite dem breitesten
unumbrechbaren Inhalt, und das war „34 Min. · Voltron Nevera powered by Rimac";
mit `max-w-0` auf der Parkspalte gab genau die nach. Der Name ist aber das
Subjekt der Zeile, der Bahnname ein Detail einer Spalte – also schrumpft jetzt
der Bahnname, und der Park steht vollständig da, auch auf 640 px.

Daneben stand bei drei von sechs Parks ein Gedankenstrich, und zwar zu Recht
nach den alten Regeln und trotzdem falsch. Ein Wochentag, der viel seltener
gemessen wurde als die übrigen, beendete den Vergleich, statt aus ihm
herauszufallen – Movie Park hat 13 Montage gegen 23 Sonntage, aber die
verbleibenden vier Tage sagen etwas. Und ein Gleichstand galt als Unentschieden:
Disneyland Paris misst sonntags wie mittwochs 32 Minuten, was bedeutet, dass der
Park zwei ruhige Tage hat, nicht keinen. Die Zelle nennt jetzt beide. Über die
achtzehn Parks, die diese Tabelle je zeigt, gemessen: **12 von 18 gefüllt vorher,
17 von 18 danach**, und kein Park, der schon eine Antwort hatte, bekam eine
andere. Der eine verbliebene Strich steht bei Disney Adventure World, wo vier
Wochentage dieselben 39 Minuten messen – das ist ein Park ohne ruhigen Tag.

### feat: das Menü wird ein Band, mit Flaggen und Fotos

Das Panel war eine schmale Box mit einer Kontinent-Schiene, die eine
Länderliste gegen die nächste tauschte. Vier von fünf lagen dabei auf
`display:none` und das Ganze brauchte einen `activeContinent`. Über die
volle Containerbreite passen alle 28 Links nebeneinander: nichts zu
schalten, nichts versteckt, die ganze Geografie auf einen Blick. Die
Änderung hat also Zustand entfernt statt welchen hinzuzufügen.

Dazu Flaggen an jeder Länderzeile. Die Datei mit den SVGs gab es schon,
für den Sprachumschalter, und sie deckt 20 der 23 Länder ab; `CountryFlag`
schlägt darin nach und beschneidet auf eine feste 16×12-Box, weil die
viewBoxen von 5:3 bis 1000:700 reichen und eine Reihe unbeschnittener
Flaggen eine Reihe unterschiedlicher Breiten wäre. Saudi-Arabien, Malaysia
und Singapur bekommen ein neutrales Kürzel-Feld, vier Parks zusammen.
Emoji-Flaggen wären der kurze Weg gewesen und sind der Grund, warum diese
Datei überhaupt existiert: Windows liefert keine Flaggen-Glyphen, dort
steht dann „DE".

Fotos gibt es an zwei Stellen und aus zwei verschiedenen Gründen. Im
Blog-Panel tragen die vier neuesten Beiträge ihr eigenes Titelbild – die
Abdeckung liegt bei 7 von 7 und die 16:9-Zuschnitte existieren bereits. Im
Parks-Panel steht dagegen eine feste Spalte „Beliebte Parks" mit vier
Karten, denn die Mediendatenbank hält für **14 von 212 Parks** überhaupt
ein Bild: ein Thumbnail je Parkzeile wären neun Fotos und zweihundert leere
Kästen gewesen. Welche vier, entscheidet die Liste der Startseite
(`FEATURED_PARK_SLUGS`, je Sprache), geschnitten mit den Parks, die ein
Foto haben. Eine zweite kuratierte Liste wäre eine zweite Liste zum
Nachziehen, und die Frage, welche Parks eine deutschsprachige Leserin
sucht, ist dort schon einmal beantwortet worden, mit Besucherzahlen im
Kommentar. Aufgelöst wird das im Layout, weil `@/lib/media` der 107-KB-
Katalog ist und der Header eine Client-Komponente – über die Grenze gehen
vier URLs. Angefragt werden die Bilder erst beim Öffnen: drei
Foto-Requests auf einer normalen Parkseite, sieben nach dem Aufklappen.

Das Band ist Glas, nicht deckend: `bg-popover/95` plus `backdrop-blur-xl`
und der Ring, den `components/ui/popover.tsx` schon trägt. „Flach" schließt
den Pointer-Tilt und die geschichteten Glaskarten der Seiten aus, nicht den
Blur. Aber `/95` statt der `/80` der kleinen Popover: die sitzen über einer
Karte oder einem Rand, dieses hier über einer halben Parkseite, und bei
80 % lasen sich Überschrift, Status-Badges und ein Absatz Fließtext quer
durch das Menü.

Zwei Dinge, die dabei aufgefallen sind: das Band braucht `overflow-hidden`,
weil die Zeilen `-mx-2` tragen und bei exakt 1024 px – wo der Container so
breit ist wie der Viewport – die letzte Spalte 8 px überstand und dem
Dokument eine horizontale Scrollleiste gab. Und die Detailzeile hält ihre
Höhe, ob ein Land offen ist oder nicht; sie füllt sich unter dem Zeiger,
und ein Band, das beim Lesen die Größe ändert, wäre schlechter.

Gemessen, Parkseite, `de`: 4 → 46 crawlbare Links in der Hauptnavigation,
davon keiner auf Stadt- oder Parkebene; Seitengewicht 59,04 → 63,94 KB
brotli, also **+4,90 KB**, wovon rund 3,9 KB auf die 22 Flaggen entfallen;
CLS unverändert 0,0000 auf Mobil. Die Flaggen sind dekorativ
(`aria-hidden`) – sollte dieser Preis auf 35.000 Seiten irgendwann zu hoch
werden, verschiebt ein Rendern nach dem Mount sie in den geteilten
JS-Chunk.

See [header navigation](features/header-navigation.md).

---

### feat: the menu band settles in instead of appearing

Its columns lift into place on open, and the detail row settles again each time
it fills with a different country. Same split the header's own reveal uses: CSS
owns visibility, GSAP owns motion. The timeline animates `y` and never
`opacity`, because the panel is shown and hidden by a `hidden` class and a fade
needs its from-state written before the first frame — a from-state that lands
without its tween is a menu that opens empty.

The band is glass, and that decided the whole shape of this. A transform or an
opacity on the surface, or on any ancestor of it, makes it a backdrop root for
as long as the animation runs, so the blur would go flat exactly while somebody
watches it appear. Every target is a descendant of that surface instead.
Sampled mid-tween: `transform: none`, `opacity: 1`,
`backdrop-filter: blur(24px)` the whole way through.

The open restarts rather than reversing — opening a menu is a discrete event,
not a state being crossed back and forth the way the header's scroll threshold
is, and closing snaps, because a menu that lingers on the way out is a menu in
the way. The detail row's re-settle is deliberately shorter and flatter, 6 px
over 0.25 s against 10 px over 0.4 s: it fires on every country somebody rests
on, and a full flourish repeated down a column of 23 countries is the fidget
that got the header's reveal rewritten once already.

Zero GSAP requests on a plain page view, one on the first menu opened, and the
chunk is the one the header's reveal already uses. Under
`prefers-reduced-motion: reduce` the import never happens and no transform is
written. The tween clears its inline `transform` when it lands. CLS unchanged at
0.0000 on mobile — the band is out of flow, which is why it was positioned that
way in the first place.

See [header navigation](features/header-navigation.md#motion).

---

### fix: the menu's countries loaded once, if at all

Four things, and the first two turned out to be one.

**Passing over a country switched to it.** The detail row sits under the country
columns, so the way down to it leads over every country below the one you
wanted. Each of those rewrote the row, and it landed on whichever country
happened to be last — the row was effectively unreachable for the country
somebody actually meant. Entering a row only arms the switch now, and leaving
before 140 ms disarms it. Rest on a country and it commits; cross it and it
never fires. Focus is exempt, because a keyboard user lands on exactly the
country they chose.

**And that gesture is what stopped countries loading.** The effect discarded its
response on cleanup while leaving the key in `requested`, so skimming past a
country threw its answer away and the guard then refused to ask again: the row
sat on its skeleton for the rest of the session. The response is a cache write
keyed by country, correct whenever it lands, so nothing cancels it any more, and
a failed request drops its key instead of caching the failure. Measured over all
23 countries — hover one, move on before the answer lands, come back and rest:
**23 of 23 stayed empty before, 0 of 23 after.**

Both were invisible to the first round of checks because the test hovered the
same country twice, which never triggers the cleanup, and counted every
six-segment link in the header — including the photo rail, which links park
pages too. The reproduction now sweeps between two countries and measures below
`xl`, where the rail is hidden.

**Saudi Arabia, Malaysia and Singapore had no flag** and fell back to a chip with
their country code, which in a row of flags reads as something still loading.
All 23 draw a flag now. Malaysia's fourteen-point star and Singapore's five are
computed polygons; Saudi Arabia's shahada is a band rather than an approximation
of the calligraphy, because at 16×12 the inscription is under 2 px tall and comes
out an indistinct smudge whichever path you draw. The sword does the
identifying.

**The photo rail was two cards short of its column.** Six now instead of four —
nine parks carry a `park-background`, so this is the shelf being filled rather
than stretched.

Cost after all four: **+5.65 KB brotli per page** against `main` (was +4.90),
4 → 48 crawlable nav links, every one of the 46 distinct targets answering 200.

See [header navigation](features/header-navigation.md).

---

### feat: a header that leads somewhere, and stops before it dilutes

The bar had four links. "Parks entdecken" pointed at `/parks/europe` — past
the discovery index, into one of its five children — and the best-travel-time
hub was not linked at all, which the header found a way to be funny about: it
matches that route's localized segment so it can float transparent over the
hub's hero, so it could name the page and would not link it. Two translation
keys, `navigation.parks` and `navigation.continents`, had been sitting unused
in all six locales for the same reason.

Now: "Parks entdecken" goes to `/parks` and opens a panel, Blog opens one,
Beste Reisezeit is a link, Wörterbuch and Anleitung are unchanged.

The parks panel is three panes, and two of them are a different kind of thing
from the third. Continents and countries are server-rendered into every page
and always in the document — the four inactive country lists are
`display:none`, not unmounted, because a crawler does not hover and a panel
built on first interaction contributes nothing whatsoever to the link graph.
Cities and parks are fetched per opened country from
`/api/nav/geo/[continent]/[country]`.

That split is about links rather than bytes. Everything the bar renders is a
link on some 35,000 pages. 28 hub links concentrate internal weight on the
continent and country pages, which is the point of putting geography in a
header; the 144 cities and 212 parks under them are already reachable from
those hubs and from the sitemap, so shipping them would spread the same weight
over 356 more targets and buy no discovery at all.

The same reasoning shaped the blog panel, which is why it is small. The blog
holds 7 posts per locale in 3 categories, with 31 tags and one author. The
categories are in and the four newest posts are in; the tags are out. 31 tag
pages over 7 posts are mostly one post's teaser at a second URL, and a
template that runs on every page is the last place to promote them.

`SiteNavigationElement` markup joins the existing `Organization` and `WebSite`
data — the five bar entries and the five continent hubs, ten items, no more.
The 23 country links are in the rendered `<nav>`; a second copy in the head of
every page tells a crawler nothing the markup did not.

One bug fixed on the way, and it predates this. The nav appeared at `md` while
the search input waits for `lg`, so between 768 and 1023 px the row carried the
full navigation, a 256 px search button and no burger: 789 px of content in a
736 px box on `main`, which wrapped the German nav onto two lines and gave the
document a horizontal scrollbar. One breakpoint now — the trigger is icon-only
below `lg`, the nav starts where the input does, and under that width
everything is in the burger, where a native `<details>` opens the continents
with no JavaScript. Checked at 768/900/1024/1100/1280 in all six languages.

Measured, park page, `de`: 4 → 40 crawlable links in the main nav, none of them
city or park level; page weight 59.04 → 60.70 KB brotli, so **+1.66 KB**; layout
chrome messages 6066 → 6224 B; CLS unchanged at 0.0000 on mobile. The chrome
number is worth a second look — one `useTranslations('blog')` in a header
component briefly pulled the whole namespace into the set every page
serializes, 6066 B to 9047 B times six locales, for the single word
"Kategorien". It comes out of `navigation` instead.

See [header navigation](features/header-navigation.md).

---

### fix: the header, and the two logos that were never the same logo

The bar is 48 px instead of 56, the search field 32 instead of 40, and the logo
24 px everywhere instead of 28 on a phone and 36 on a desktop. It reads quieter,
which is what this started as.

The reason it also runs better is the second half. On a hero page the header
renders the lockup twice — one copy parked in the corner over the photo, one in
the flex flow — and cross-fades them while sliding one onto the other. The
comment above that code claimed the two coincide at the midpoint. They never
did: the bar copy was `h-7 md:h-9` + `h-5 md:h-6` + `gap-0.5` against the
corner's `h-6` + `h-5` + `gap-1`, so the handoff computed a scale of 0.667 and
animated a 1.5× blow-up under the slide. And no single factor could have saved
it, because 36:24 is not 24:20 — measured at 1440, the corner copy stayed 15 px
wider than the bar copy at the top and 25 px wider once solid. They also sat
0.5 px apart vertically, the in-flow copy being centred on a hard-coded `h-14`
box and the corner copy on the header's 55 px content box.

Both copies render one `BrandLockup` now, so the scale resolves to 1.000 and the
handoff is a plain translate. Sampled per animation frame, the two boxes agree
to 0.0 px on all four edges from start to finish.

Heights come off the button scale rather than out of the air. The old bar had
the largest control in the design system — the 40 px `lg` search field — in the
shortest row in the app; it is the 32 px `sm` size now, with 8 px of air above
and below it, and the two 36 px controls below `lg` (search, burger) are finally
the same box as each other instead of 40 against 36.

Four numbers had to move together: the bar itself, the `<Suspense>` fallback in
the locale layout that reserves it, and the `-mt-14` on the three heroes the
header floats over. `pnpm measure:cls --late` reads 0.0000 on mobile for the
homepage and the park page afterwards.

See [design system → header geometry](design/design-system.md#header-geometry).

---

### feat: the facts a park page could not state

A park page had a map, a forecast, a weather chart and no way to say where the
park is. None of the three upstream feeds carries an address, a website, a
ticket link or an opening year, so there was no column to correct and nothing
to show.

Eleven curated columns now cover it — website, tickets, Wikipedia, Instagram,
Facebook, YouTube, street, postcode, phone, opening year, area — and they
arrive as one `info` object on the park detail payload, absent entirely until
somebody has written at least one. Not on the listings: the card overlay
re-downloads its fields every five minutes and a postcode has no business in
that budget.

`ParkInfoCard` renders them as a Server Component, inline in the first HTML, so
it costs no layout shift and no client bytes. A park with nothing curated
renders nothing rather than an empty frame. The same values fill the gaps in
the page's `ThemePark` structured data, which until now claimed a locality and
a country and left the street, the phone number and every `sameAs` blank.

The admin editor needed nothing for the eleven fields themselves — it is
generated from the backend's descriptors — only two new control types: `url`,
with a button that opens the address because the one thing validation cannot
check is whether the link goes where it should, and `decimal`, so a park of
28.3 hectares does not become 28.

A URL is parsed rather than pattern-matched (`new URL()`, `http:` and `https:`
only). These values become `href`s on a public page, so a stored `javascript:`
URL would be cross-site scripting with an audit row naming the curator who
typed it.

The brand marks for the social links came out of `share-buttons.tsx`, where
they had been sitting privately, into `components/common/brand-icons.tsx`.
lucide-react dropped its brand set in v1; a second hand-copied path is how two
Facebook logos end up different sizes on one page.

---

### feat: the admin is a different application

The old admin was a password box, a text field and a POST. It shared the site's
layout, its i18n and its theme, and it could do exactly one thing per page. This
replaces it.

**It holds no secret.** The browser never sees a token: the session cookie is
httpOnly and `SameSite=Strict`, and `app/api/admin/[...path]` swaps it for a
bearer header server-side. Before this, the admin password lived in
`localStorage` and travelled in a header any script on the page could read.
The proxy also grew the verbs it was missing — it exported GET and POST and
called `response.json()` unconditionally, so every PATCH, DELETE and 204 the new
editors make would have failed.

**Everything is one surface.** ⌘K opens a command palette that searches parks,
rides, media and posts in the same list and goes straight to the editor. An
inspector panel slides in beside whatever is open, so a ride's field editor,
its photos, its ride profile and the blog posts that mention it are one screen
rather than four. Media assignment and blog editing write files, park and ride
data writes DB rows — two different write models, deliberately not disguised as
one: a curated field saves instantly and is undoable from the history list, a
media or post change opens a branch and a PR.

**The editors are generated from the API's field descriptors**, not hand-built.
Each field shows what the sync says, what a human said, which one wins and
whether it is an override — the same four facts for a park name, a ride's
maximum height and a season's month list. Adding a curated column upstream adds
its editor here with no frontend change.

The route is outside i18n (`proxy.ts` skips `/admin`), carries its own `<html>`,
its own QueryClientProvider and `robots: noindex`, and is dark whatever the site
theme is. Sign-in supports TOTP, forced password changes and a session list you
can revoke devices from.

Details: `docs/features/admin.md`.

### fix: seven layout shifts, two of which the harness had been unable to see

`pnpm measure:cls` diffs a page's first-paint layout against its settled one. That is good at
finding candidates and bad at two things, and both showed up here.

**It could not say what a browser would score.** CPU throttling was the stand-in, and it is a
coin toss: the same page under the same 4× throttle measured 0.000 and 0.088 in two consecutive
runs. `--late` replaces it. It fetches the document once, finds where React parked the resolved
Suspense content (`<div hidden id="S:1">` near the end of the body), and re-serves it through a
local proxy that flushes the shell immediately and the rest 1.5 s later — no throttling at all,
which is the shape of a cold start whose sub-request missed cache. Under that the glossary term
page scored 0.5425 desktop and 0.4872 mobile against Cloudflare's field value of 0.538, run after
run. `--scroll=<y>` parks the reader, because a shift only counts what is in view: the same page
reads 0.0000 from the top on a phone.

**It was browsing from 127.0.0.1.** `/api/nearby` had no public IP to geolocate, answered
`userLocation: {0, 0}` with an empty park list, and every run therefore settled on the card's
short "no parks near you" state. A placeholder had been tuned against that. `pnpm measure:cls`
sends a real `x-forwarded-for` now (`--ip=` to change it), the card settles on the six-card list
like it does for a visitor, and the short box turns out to cost +683 px desktop / +291 px mobile
on the homepage — its largest in-view shift. The six-card skeleton is back, in both the pre-mount
and the loading phase: mounting reveals nothing about where the visitor is, so those two have no
business being different heights.

What else moved, and no longer does:

- **The park header changed height while loading, whichever way it went.** `showCrowdToday`
  was true while the daily crowd query was unsettled and false once it settled without a value,
  so on a park nobody can rate — Phantasialand most mornings — the header went 63 → 142 → 63 px
  at 277 / 709 / 2474 ms. Gating it on the value instead just moved the jump to the other kind
  of park: 340 → 419 px at 2059 ms wherever a rating does arrive. Both inputs land after the
  first paint (`crowdToday.level` comes from the page's deliberately last query, `isOpenish`
  from `liveStatus ?? scheduledStatus ?? status`), so neither can decide whether a box exists.
  "Auslastung heute" is unconditional now, exactly like "Andrang jetzt" beside it, and holds a
  badge, a loading pill or an em dash in the same reserved box. Not the `unknown` badge for the
  empty case — that one reads "keine Prognose", and this metric measures the day rather than
  predicting it. Measured constant at 419.25 px (desktop) / 820.75 px (phone) across the whole
  18 s recording, on a park with a rating, one without, and one whose wait times cannot be read.
- **The glossary rides section.** `<Suspense fallback={null}>` on a prerendered route defers
  nothing: the project runs no PPR, so the prerender waits anyway and the resolved markup was
  already in the shipped `.html`, sorted to the end of the byte stream. All the boundary did was
  drop 396–1463 px into the column two seconds after paint and push the "back to dictionary"
  button — the element Cloudflare names — down with the rest of the page. Awaited inline now.
  Padding it was not an option: 115 of the 267 terms have no rides at all.
- **The favorites band, on the homepage, all five blog routes and every glossary term.**
  `next/dynamic` is `React.lazy` plus `<Suspense>`, so `loading: () => null` was a
  `fallback={null}` in disguise and the whole 232 px band arrived after the first paint. It
  reserves its empty state now, with the two lines held `invisible` until the cookie has been
  read, so a visitor who does have favorites is not told for a beat that they have none.
- **The coaster player's transport bar** appeared when the three.js scene booted, on the 42 term
  pages that carry one. 57 px, now mounted from the first render and disabled until ready.
- **Park-card placeholders were one height at every breakpoint.** `ParkCard` hides its photo row
  below `sm` and is less than half as tall there; the placeholder stayed at 360 px. On a phone
  the featured-parks grid therefore collapsed by 1284 px when the real cards landed. The
  placeholder is one shared component now, built from the card's measured rows: 100 px top panel,
  photo row 0 below `sm` and 220 px above, 45 px bottom panel.

Three of these were found by re-measuring this round's own diff, and two of them were damage it
had done itself. `--late` was serving the captured document under `/__cls_split`: the client
router re-resolved a different route than the HTML had been rendered for and threw React #418,
which re-renders the mismatched subtree on the client. Serving the page's own pathname fixes it,
and the run prints any console error it sees now — but the honest size of this one is smaller
than it first looked. Feeding the same bytes down both paths and diffing the results: the error
fires only on the five routes with a hero header, never on a glossary term, park or ride page,
the subtree React throws away is the header itself (a fixed 56 px in every case), and the scores
match to four decimal places either way. So the two numbers this change was supposed to rescue —
0.5425 / 0.4872 against Cloudflare's 0.538 — were never affected: they come from the glossary
term page, which threw nothing. A latent hazard removed, not a wrong result corrected. And reserving the coaster
player's transport row introduced a shift on devices without WebGL, where there had been none:
the placeholder drew the row, then `failed` took it away again. The row is unconditional now.

One thing was tried and put back, and one piece of it kept. `ParkCard` reserves its 220 px
picture band only when it has a `backgroundImage`, and 9 of 212 parks have one — so on desktop
the nearby list is 405–443 px too tall for a visitor outside DE/NL/BE/FR. Dropping the band
halves the total error across regions and turns every miss into growth rather than a collapse,
but it costs 465–502 px for a visitor inside them, and the homepage went 0.062 → 0.558 for it.
The band stays where the answer is unknown, with the numbers per client IP written into the
component so the other side can be picked deliberately. It is dropped where the data settles it:
the "busiest / quietest park" cards in the global statistics are the two ends of a wait-time
ranking, and none of the nine photo parks reach either end (Phantasialand, the best placed, is
10th), so those reserved 221 px per card for a picture that never comes.

Still open in the same section, and left alone because a constant cannot be right for it:
`AttractionCardSkeleton` reserves a flat `min-h-[420px]` at every width, against a measured
median of 146–238 px on a phone and 234–456 px on a desktop depending on whether the grid row
happens to contain a ride with a photo.

Left alone on purpose: the attraction grid that swaps in when `TabsWithHash` hydrates (+9187 px
mobile on Universal Studios Singapore) and `LazyMount`'s `rowHeight: 340`. Both are real — a
reader standing in the wrong band pays up to 1.0 for them — but the card height they would have
to reserve runs from 94 to 508 px inside a single park, and the swap exists to keep hydration off
a 1017 ms long task. Trading CLS for INP there needs its own round.

### feat: the weather day chart is built around the park's opening hours

The hourly chart gave the hours a visitor came for whatever share of the width they happened to
occupy. For the median park in the catalogue — 10 h of opening hours — that was 42 %, and the night
took the rest, which left room for three hour labels and two temperatures across the whole visit.

The time axis is piecewise linear now: an open hour is drawn four times as wide as a closed one, so
the median park's opening hours take 74 % of the box and an open hour is 7.4 % of the width instead
of 4.17 %. Both kinks sit exactly on the dashed borders of the opening-hours band, and those borders
now carry a door icon and the opening and closing time — a change of slope the eye cannot account
for reads as weather, so it has to land on a line that is already there and says what it is.

What the room buys: hour-by-hour ticks through the visit instead of every third hour, the
temperature on arrival and on leaving, and up to three more readings where the curve actually does
something (Douglas-Peucker with a tolerance that scales with the day's own range, so a day that just
warms up steadily gets nothing extra). Rain got a second reading too — the two wettest runs of
consecutive wet hours draw a rule along the baseline and tint their hour labels, because five 5 px
drizzle bars in a compressed night read as noise, and unlike a tooltip a drawn rule works on a
phone.

The 53 parks with no OPERATING row for today keep the chart they had, down to the every-third-hour
ticks: `buildDayScale` returns `null` and every formula reduces to the old one. The geometry moved
out of the component into `lib/utils/weather-chart-axis.ts` with 48 unit tests
(`pnpm test:weather-chart-axis`), the first of which is that identity.

Two defects fell out on the way. The axis was a flex row of 24 equal cells, ~13 px wide on a phone,
and German renders `"14 Uhr"` rather than `"14"` — so the labels wrapped and the chart came out
154.5 px against the 143 px the weather card reserves for it, in four of six locales, on every park
with weather. Every tick is out of flow and `whitespace-nowrap` now and it measures 143 px at every
width. And the `/ui` fixture built its opening hours with `setHours` in the runner's timezone while
telling the card `Europe/Berlin`, so the showcase's band sat two hours off — which nobody could have
noticed before the band was the thing the axis is built around.

Tick density is a container query on the chart itself rather than a viewport breakpoint: the
showcase renders this card three to a row, so a 355 px chart at a 1280 px viewport would otherwise
have been handed a desktop's worth of labels.

Details, numbers and the two accepted costs: [weather day chart](features/weather-day-chart.md).

### fix: four more blog widgets pointed at a park that had been renamed

`disney-magic-kingdom` was not the only one. The Toverland post carried `slug=toverland` on its
map, best-days, stats and weather widget, in all six locales — 24 widgets rendering
"Park „toverland" wurde nicht gefunden" since the API renamed the park to
`attractiepark-toverland`. The prose references in the same posts had been pulled along
(`ref:attractiepark-toverland/booster-bike` is already correct); the `slug=` attrs had not.

Nothing catches this. The build stays green, `generate:blog-manifest` only validates
`parkLinks`/`rideLinks`, and the API answers the old slug with a 301 — so the URL still works in a
browser while `resolvePark`, which looks the slug up exactly in the geo index, returns null.

So there is a checker now: `pnpm check:blog-slugs` resolves every widget `slug=`, every
`glossary-widget` term id and every `ref:`/`park:`/`attraction:` link target against the live geo
structure. Across the 42 posts that is 2160 references — 132 widget parks, 84 glossary terms, 1944
links — and after this fix all of them resolve. It was verified by putting the old slug back and
watching it fail.

`scripts/check-media-urls.mjs` pointed its sample pages at the old park URL too. Those still
answered, because the API's 308 is followed transparently, which is exactly what makes this class
of rename so quiet.

### fix: the blog's copy of the top-ten table gets its live column too

The stats widget renders the same `ParkStatsSection` as the park page, and on a blog post its live
column was effectively never there: nothing on such a page subscribes to `['park-live', …]` unless
the post happens to include a weather widget as well.

The data was already on the page. A post that names rides of a park fetches
`/api/parks/<geo>/<park>/wait-times` for its `ref:` references — 9 KB carrying park status plus
status and standby wait per slug, which is exactly what the column needs. `die-kunst-des-wartens`
makes eleven of those calls, one of them for the very park its stats widget shows, and the table
ignored all of it. `ParkStatsSection` now reads that cache as a second source, `enabled: false`
like the first one, so it still issues no request of its own.

The wait-times payload is queue rows and nothing else, so the `effectiveStatus` check the park page
does is not available on this path — a ride whose feed went quiet keeps the wait it last published.
The alternative on a blog post is no live column at all.

While testing it: `die-kunst-des-wartens` rendered "Park „disney-magic-kingdom" wurde nicht
gefunden" in all six locales. The API renamed that park to `magic-kingdom-park`; the widget was
never pulled along. Fixed, and it is what made the fallback testable — Magic Kingdom is open while
every European park in those posts is shut for the night.

### fix: the live column no longer disappears at opening time

The "now" column decided whether to exist by asking whether any of the ten rides in the table had a
wait time. That looked equivalent to "is there live data" and is not. Phantasialand at 09:37 has 14
rides open and every one of them is a carousel or a walk-through — no headliner in the top ten was
running yet, so the column was gone from a park that was very much operating, and would have popped
back in mid-session the moment Taron opened.

It is a question about the park, so the park answers it: the column is there when the park is
OPERATING, its wait times are readable, and a live snapshot has reached the section. A ride that is
closed while the park is open shows a dash, which is a fact about that ride rather than a reason to
drop the column for the other nine.

The minutes unit in that table was the string `min`, hardcoded, in all six locales — German reads
`Min.` and Dutch `min.`. It comes from `parks.overview.minutesUnit` now, the same key the
server-rendered wait overview has always used. The typical and peak columns carried the hardcoded
version long before the live column copied it; all three are localized now.

## 2.11.0 (2026-08-15) – Blog, ride pages, and the load-order work behind them

Two months of work since 2.10.1, released together. The blog went live and grew a link in both
directions with the park and ride pages; ride pages got a header, measurements and a way into the
glossary; every image moved into one media database with its own sidecar; and the park page had
passes on load order, ISR writes, re-renders and the Umami bill. Newest first.

### fix: the OG function was shipping 400 MB of photos

Deploys started failing on `The Vercel Function "api/og/[...path]" is 410.24mb uncompressed`, over
Vercel's 250 MB limit. Two things stacked up to get there.

`public/images/` was the photo tree from before the media database. Nothing has read it since; the
351 files left in it were all generated crops with no source images beside them, and a `git add -A`
swept 282 MB of them into a36bfd8e. They are deleted and the path is in `.gitignore` now —
`git checkout a36bfd8e -- public/images` brings them back if a photo in there turns out to be
wanted.

That alone would not have mattered if the function only carried what it paints. It does not:
`lib/og/background-photo.ts` reads its photo with `readFileSync(join(process.cwd(), 'public', …))`,
and the tracer's answer to a path it cannot resolve statically is to bundle the entire directory
that path is rooted at. So the OG function holds all of `/public` — every source image, every
sidecar, all three crop ratios — while no other route traces a single file from it. 130 MB now,
down from 425 MB, of which about 17 MB is the 16:9 crops the card actually reads.

The `outputFileTracingIncludes` entry naming those crops was not what put them there, and cannot be
used to trim the rest either: `next build --turbo` never calls `collectBuildTraces`, which is the
only place includes and excludes are applied, so under the build this project ships every key in
that map is inert. Reaching for `outputFileTracingExcludes` here does nothing — it was tried, the
crops it named stayed in the trace. Making the OG route lighter means changing how it reads its
photo, not configuring the tracer.

### the top-ten wait times now show what the ride is doing right now

"Typical 29 min / peak 34 min" is a comparison with nothing to compare against, so the ranking of
the longest waits is a table from `sm` up: rank, ride, **now**, typical, peak. The live number is
coloured on the shared wait-time scale (`WaitTimeValue`), so a 60 at a ride that typically runs 31
reads as the outlier it is. Below `sm` the table keeps the two columns it had — rank, ride and
peak, with the label moved from the row into a header.

The current values cost no request. `useLiveParkData` is already polling `['park-live', …]` for the
page, and the section subscribes to that key with `enabled: false`: React Query disables the fetch,
not the subscription, so the column updates with every 5-minute poll and the park page still makes
exactly one live call. Details and the two catches in
[api-budget](architecture/api-budget.md#reading-live-data-without-adding-a-request).

A closed ride keeps publishing `waitTime: 0` — River Quest and Black Mamba both did while the rest
of Phantasialand ran — so a wait is only taken from a ride that reads OPERATING. The status is
decided the way `AttractionCard` decides it, `effectiveStatus` before the queue row: a feed that
goes quiet mid-day leaves its STANDBY row on the last value it published, and reading that alone
would print a wait here for a ride whose own card on the same page says closed.

Whether the park has readable wait times at all is **not** derived from any of this. The park page
passes `hasReadableWaitTimes(park)` down, so a park that publishes wait times only inside its own
app has no "now" column whether it is midday or 03:00 — the live projection carries no
`liveWaitTimes` field, and inferring the answer from an empty payload is what
[parks without wait times](api/parks-without-wait-times.md) exists to forbid.

### the hero search placeholder no longer types

The homepage search field used to type park and ride names into its placeholder,
letter by letter, on a loop. That typewriter is gone: the field shows the
translated static placeholder from the first paint, on the homepage and the
howto pages alike (they share `HeroSearchInput`).

Gone with it: the `useTypewriter` state machine and `TypewriterPlaceholder` leaf
in `hero-search-input.tsx`, the `typewriter-blink` keyframes in `globals.css`,
and the `placeholderShown` property on `hero_search_clicked` — it only ever
reported which phrase was on screen, and without the typewriter every click
would have billed an extra Umami event to say "default". `useActiveOnScreen`
stays, the countdowns and charts still pause through it.

### fix: the ride measurements credit the right source again

The measurement display shipped against an importer that read the roller-coaster
database directly. That import is gone — their terms permit the link, not the
data — and the API now merges a hand-curated seed with a **Wikidata (CC0)**
import, curated values winning.

So `stats.source` is one of `curated`, `wikidata` or `mixed`, and `sourceId`
carries a Wikidata entity id **only when an imported value survived** the merge.
The display assumed a single source with an id always present, which in
production it never was: 26 of the 27 rides that currently state a measurement
are `curated` with no id at all, so every one of them rendered "Measurements:
RCDB" over numbers RCDB never supplied, linking to `rcdb.com/undefined.htm`.

- **The API resolves the credit now, and the page just renders it.**
  `stats.attribution` is `{ label, url }` or **null when every surviving number
  is hand-curated** ([v4.api.park.fan#150](https://github.com/PArns/v4.api.park.fan/pull/150)),
  so the rule and the URL shape live with the data instead of being rebuilt at
  the edge. The page shows the line when it is there and nothing when it is not.
  That is the whole condition — there is no `source` to interpret and no
  `wikidata.org/wiki/…` to assemble, which is what got this wrong twice.
- **`statsSource` takes the source name as `{source}`** rather than baking
  "Wikidata" into six translations, so a second source needs no locale change.
- **`RideStats` matches what the API sends** — three-value `source`, optional
  `sourceId`, plus `attribution`.
- **The grid drops the rows nothing can fill** — drop, elevation, steepest
  angle, g-force, capacity, riders per train, restraints, designer, builder,
  train builder — along with their translation keys in all six locales.

### cut the Umami event bill, and fix what "visitor" counts

The Hobby plan allows 100k events/month; early August was tracking toward
~112k, the second overrun. The cause was not traffic. Umami bills **every event
property as another event**, so the properties were ~70 % of the bill while the
pageviews — the only thing actually wanted here — were ~26 %.

- **`identifyVisitor()` removed.** Three session properties on _every_ session,
  which was the entire Session-data band (~25 % of usage). Two of them
  (`browser_language`, `site_locale`) restated what Umami already collects
  natively and what the URL path already says.
- **`web-vital-inp`: 9 properties → 4, and only non-`good` samples.** It fired
  on every pageview carrying an interaction at ten billed rows a time, the
  largest single line in the bill. A good INP is not something we act on, and
  the three delay numbers collapse to `phase`, the one that dominated — which
  is the whole decision the breakdown drives.
- **Derivable properties dropped everywhere**: `in_park` (it is
  `type === 'in_park'`), `geo_allowed` (`source === 'gps'`), `hasQuery`
  (`queryLength > 0`), `rating` (a threshold on `value`), `locale` (it is in the
  event's own URL), and `parkId` wherever a `parkName` already named the same
  park. `nearby_in_park_detected` is gone entirely — it restated
  `nearby_parks_loaded` with `type: 'in_park'` and spent four rows doing it.
- **Eight unused `track*` helpers deleted** (`hero_viewed`, the card/discovery
  clicks, `map_opened`, `calendar_date_selected`) — dead code that invited
  someone to re-add a three-property event firing on view.
- **`data-exclude-hash="true"`** stops a phantom-pageview leak: Umami's tracker
  patches `pushState` _and_ `replaceState` and treats a changed hash as a new
  URL, so every park-page tab switch and every calendar month step was billed
  as a full extra pageview and inflated Views against Visitors.
- **`data-domains` now lists `www.park.fan`** as well. The attribute is a hard
  gate on `window.location.hostname` — a host missing from it is silently
  absent from the stats, not merely mislabelled.
- **The known undercount is written down**, not fixed: `data-do-not-track` means
  DNT visitors send nothing at all, so the visitor number reads low by roughly
  3–8 %. It is a voluntary choice (Umami is cookieless, the privacy policy rests
  on Art. 6(1)(f) and never promises DNT) and was reviewed and kept.

New doc: [analytics](development/analytics.md) — the billing model, the two
rules for adding a property, and what Umami's "unique visitor" actually means
(hash of website ID, hostname, User-Agent and IP against a salt that rotates
**monthly**, so a visitor count spanning a month boundary is not deduplicated).

### park and ride pages link into the blog

The blog linked into the catalog from day one (`ref:europa-park`, spotlight
cards, widgets); the catalog never linked back. A reader on the Phantasialand
page had no way of knowing a 4.700-word guide to that park existed.

- **New section on every park page and every ride page** — "{park} im Blog" as
  a frosted panel next to its neighbours, "{ride} im Blog" as a `PageSection`
  chapter, both showing the three most relevant posts as the same
  `BlogPostCard` the blog index uses. Static content out of the generated
  manifest: no API call, no clock, so it neither competes with the live queries
  nor with the load-last best-travel-time data. Renders nothing when no post
  mentions the park/ride, and stays away in locales that have no blog surfaces
  yet.
- **Reverse index** (`lib/blog/backlinks.ts`) derived from the posts
  themselves: every park and ride a body references (`ref:`/`park:`/
  `attraction:` links and the widget fences, a ride counting for its parent
  park too) plus `relatedParks`/`relatedAttractions`. A round-up like the
  Halloween guide therefore appears on all ten park pages without anyone
  maintaining a list. References that carry the full `/parks/…` path only count
  for that park, so the Paris and Anaheim `disneyland-park` don't swap
  articles.
- **`parkLinks` / `rideLinks` frontmatter** for the cases the automatic result
  gets wrong: `false` keeps a post off those pages entirely, a list replaces the
  detection, and `rideLinks` also takes `parkSlug/*` ("every ride of that park
  this article links") so a park guide keeps its own rides without listing
  twelve of them. The two keys are independent — a guide is often right on the
  park page and far too broad on a dozen ride pages. Resolved per post rather
  than per locale, so a rewritten paragraph in one translation can't change
  which pages link the article; the manifest generator warns about invalid
  entries and about translations that disagree.
- **The blog manifest is three modules now**, because a 3-card section must not
  cost the park route a megabyte: `manifest.ts` keeps frontmatter plus the
  build-time derivations (reading time, `parkRefs`), `manifest-bodies.ts` holds
  the ~900 KB of markdown, `manifest-galleries.ts` the image listings. Listing
  surfaces import `lib/blog/listing.ts`, which never touches a body — that
  includes the **root layout**'s `hasPublishedPosts()`, so the bodies dropped
  out of every route's server bundle, not just the park pages'. Body-derived
  values are computed once at build time by the shared `lib/blog/derive.mjs`.
- **Curated the existing posts**: the Phantasialand guide now shows only on
  Phantasialand, the Toverland guide on Toverland and the Efteling (not on
  Liseberg because Balder came up once) and on `toverland/*` + Joris en de
  Draak, the launch story on Phantasialand + Movie Park and on Taron + Maus au
  Chocolat. The Halloween round-up and the queueing essay keep the automatic
  behaviour — every park and ride they name gets a real section in the text.
- **Listing lookups are memoised per process, not per request.** Everything in
  `lib/blog/listing.ts` derives from the manifest and reads no clock, so
  React's per-request `cache()` just rebuilt the same lists on every render of
  the root layout, the homepage and (now) every park and ride page. The lists
  are frozen, since they are shared across requests.

---

### fix: blog posts stop reporting a park and its rides as closed

The Phantasialand guide showed the park as open and **all twelve** coasters it
names as "Geschlossen", in the middle of an operating day.

Blog posts are fully statically generated, and every park/ride reference in
them was resolved **once, at build time**. Whatever the park's status happened
to be during that build — the middle of the night, for a post built overnight —
is what every reader saw afterwards, indefinitely. Nothing refreshed it.

- **The browser now lays live values over the build-time snapshot**, the same
  shell + client-overlay model the homepage, hub pages and featured cards
  already use. The prerendered HTML is unchanged, so SEO and no-JS readers
  still get a fully rendered card.
- **Batched per park, not per reference.** Park status/crowd/wait/hours come
  from the existing `useRegionParks` region call; ride status and waits from a
  new lean whole-park snapshot (`/api/parks/.../wait-times`, ~9 KB against
  ~95 KB for the full park payload). A post naming a dozen rides in one park
  costs **one** extra request.
- **The heavier per-ride payload stays lazy.** Today's average/peak and the
  card sparkline need the full attraction detail, so it's fetched only once a
  spotlight card scrolls into view or a hover preview opens — never on load.
- **One source for "now".** Status and wait always come from the 5-min batch,
  so a card's badge can no longer disagree with the inline badge beside it in
  the prose. The "closed park ⇒ closed rides" rule is applied on both sides.

**And the crash that would have hidden all of it on long posts.**
`/de/blog/die-kunst-des-wartens` was throwing
`Primitive.button failed to slot onto its children` and dropping its whole
client tree into the error boundary — so no hook on that post ran at all, live
overlay included.

`GlossaryInjectTerm` was a **server** component wrapping `next/link` in
`<TooltipTrigger asChild>`. Rendered from the server, the link reaches Radix's
`Slot` as a **lazy client reference**, and `Slot` only unwraps a lazy child
while its payload is still _pending_. Once any earlier `next/link` on the page
has resolved that chunk, the payload is settled, `Slot` sees a non-element and
throws. That's why it looked content-dependent: long posts resolve the chunk
before the first tooltip renders, short ones don't — halving the post made it
disappear, which is what sent the first search down the wrong path.

- `GlossaryInjectTerm` is now a client component, like its sibling
  `GlossaryTermLink` already was. Same markup, no lazy wrapper reaches the Slot,
  and nothing new ships — the tooltip and the link were already client code.
- **Every other server component with the same latent shape** — a `Link` slotted
  into `<Button asChild>` — was converted too: `BlogSectionHeader`,
  `GlossaryTermDetail`, `AnnounceSection`, the 404 page and the homepage hero.
  None had been observed to fire, but they were all one chunk-resolution order
  away from it.
- New **`buttonLinkProps`** (`components/ui/button.tsx`) is the shared way to
  render a button-shaped link: it returns exactly the props `<Button>` applies
  (`data-slot` / `data-variant` / `data-size` + the `buttonVariants` class
  string), so the rendered markup is byte-identical with no `Slot` in play.
  Verified by diffing the rendered `data-slot="button"` elements on `/de`,
  `/de/glossar/…` and `/de/blog/tag/…` before and after — same count, same
  classes, same attributes.

> **Rule:** never put a client-component element inside an `asChild` trigger
> from a **server** component. Either move the wrapper into a client component,
> or use `buttonLinkProps` / apply the variant classes directly. Slotting a
> _host_ element (`<a>`, `<button>`) from the server stays fine — those are
> never lazy.

See [caching-strategy](architecture/caching-strategy.md#minimizing-isr-writes-jun-2026).

---

### feat: a ride's measurements, in the visitor's units

The ride page can now say how fast, how long, how tall and how steep — the
numbers the API imports from RCDB (see the backend changelog). Top speed sits
in the header's facts band next to the inversions, because both answer "what
does it do to you"; the rest fill out the ride profile's fact grid: height,
drop, length, elevation change, steepest angle, ride time, g-force, capacity,
riders per train, restraints, and who designed, built and supplied the trains.
Every value renders only when RCDB has it, and the grid links back to the
record the numbers came from.

- **One unit system, one toggle.** The C/F choice now drives ride
  measurements too, not just weather: Fahrenheit means mph, feet and inches —
  **including the rider height** ("Ab 140 cm" becomes "From 55 in"). Rendered
  through `unit-display`, so both units are in the server HTML and CSS picks
  one before paint: no hydration flash, page stays cacheable.
- **Fixed: a badge that read "Inversions:" and nothing else.** The API strips
  null-valued keys from its responses, so an unknown value arrives as a
  _missing_ key — and `!== null` waves `undefined` straight through. The types
  now mark those fields optional as well as nullable, and the guards use
  `!= null`. The same bug was hiding on the glossary term page's year badge.
- **"All rides" on a glossary term page did not list all of them** — the three
  highlighted above are deliberately not repeated, so the heading sent people
  hunting for the ride they had just seen (Manta, on the flying-coaster page).
  It says "More rides" now.
- The glossary term page's ride section goes through `PageSection` like the
  ride page's chapters, so the two cannot drift apart again.

### fix: the ride header's facts say what they are

Follow-up to the header cleanup below. The facts band was a row of values with
no nouns on them: a wrench and "Intamin", a calendar and "2016", and "RCDB" —
readable if you already knew what each one meant, a guess otherwise, and the
`title` tooltips only helped the half of the audience with a mouse.

- **Every fact names itself:** "Manufacturer: Intamin", "Opened: 2016",
  "Inversions: 0".
- **The RCDB link names its destination** — "Taron on RCDB" instead of a bare
  acronym, so it reads as a way out of the page rather than a label. It moved
  out of `AttractionMetaBadges` (the rider-restriction set shared with the
  attraction cards) into its own `RcdbBadge`.
- **Order follows what you need to know:** the height limit that decides
  whether you may ride at all, then what the ride does (inversions), then what
  kind of ride it is, then who built it and when, then the outbound reference.
  The jump link stays pinned right.
- **The ride type is in the header now**, linked into the glossary like the
  type chips in the profile below — and a launch coaster with **more than one
  launch is called a Multi-Launch Coaster**. Nothing in the seed carries that
  distinction, but the layout does: `resolveRideProfile` counts the `launch`
  and `swing-launch` figures. It does that centrally so the header and the
  profile section can never disagree, and it counts element **ids**, not the
  `launch` element _kind_ — that kind groups lift hills and first drops too, so
  counting it would call every coaster with a lift and a drop a multi-launch.
- **"9 figures" is now "9 track elements"** (`Fahrfiguren`, `baanelementen`,
  `éléments du tracé` …), matching the label the profile section already used.
  In English "9 figures" reads as a nine-digit number.
- **The glossary link moved above the 3-D player**, joining the figure's name
  and definition — stranded under a five-second animation it was a footnote to
  a video nobody had finished.

### fix: the ride page header, and every section on it, reads like the park page

The ride header had grown a row at a time and no longer matched the park
header it sits under — and the intro paragraph below it was printed straight
onto the hero photo, where it was unreadable.

- **Header** now has the park header's anatomy: title row with the favourite
  star **in flow** (a long ride name wraps beside it instead of underneath it),
  a muted location line, one hairline-separated facts band, and the intro
  **inside** the glass card — the readability fix.
- **RCDB** is a Badge like its neighbours instead of grey text that read as a
  disabled label; builder and year carry a `title` so an icon-only fact is not
  a guess.
- **Every section has a heading with an icon.** The live wait time — the
  reason people open the page — was the only block without one. The 30-day
  "wait-time history" was the last bare heading. Card titles (rope drop,
  typical waits, today's chart, other queues) are now the same `plain` +
  `h3` heading instead of four sizes, so the page outline is chapter › card.
- **Chapter headings sit on a frosted pill** on the ride page, the same
  treatment the park page's section titles already used over hero imagery.
- **`PageSection`** is the new unit for a chapter: it owns the `<section>`, the
  heading **and** the spacing around it. `SectionHeading` alone only unified how
  a heading looks — every call site still hand-rolled its own `mt-10` and its
  own gap, which is how the live wait-time chapter ended up sitting a visible
  step lower than its neighbours (its refetch indicator added a reserved band
  on top of the heading's margin). All four ride-page chapters now measure the
  same 16 px from title to content.
- **The live refetch indicator** moved onto the "updated HH:MM" line inside the
  card, next to the timestamp it refreshes — it no longer reserves an empty
  band above the card, and it still cannot shift the layout (rendered always,
  just invisible when idle).
- **`SectionHeading`** gained `frosted`, `iconClassName`, ReactNode titles and
  a `badge` that is rendered as passed (it used to wrap its argument in a
  second `<Badge>`).
- **Ride profile:** a figure's name and definition now come **before** its 3-D
  animation — you tapped the figure to find out what it is, so reading the
  caption afterwards meant spending the animation guessing.

### feat: rides and the glossary now link to each other

A ride page could say "Black Mamba is an inverted coaster with four
inversions", but that was a dead end. Rides now carry a curated profile from
the API — track figures **in ride order**, ride type, builder, opening year —
stored as glossary term ids, so the link works both ways.

- **Ride page** gets a "Ride profile" chapter (`RideProfileSection`): the
  layout as a numbered walkthrough with every figure linking into the
  glossary, figures with a 3-D animation badged, plus type chips and the
  builder. Repeats are kept — Voltron Nevera really does hit two corkscrews
  back to back. Renders from the park response, so it is in the static shell.
- **Glossary term pages** get "Rides with this" (`GlossaryTermRides`), grouped
  by park, for figures, ride types _and_ manufacturers. Silent for the concept
  terms no ride references.
- **24 new glossary terms** across all 6 locales, added because the API seed
  needed them: launch, swing launch, vertical lift, drop track, scorpion tail,
  step-up under-flip, twisted horseshoe roll, double down, switch track,
  turntable, treble clef, indoor/family/motorbike/infinity coaster,
  interactive dark ride, madhouse, boat ride, shoot-the-chute, people mover,
  bumper cars, observation tower, Walt Disney Imagineering, Brogent. **262
  terms** total.
- **7 new 3-D animations** for the new figures, plus a `pace` hook on the
  coaster player so an element whose _speed_ is the point (a launch
  accelerating, a train stalling at a scorpion tail's overhang, a drop track
  standing dead still) can remap progress onto its curve.
- **`scripts/render-coaster-elements.mjs`** — the headless contact-sheet
  harness [conventions §12](development/conventions.md#12-threejs-animations-research-first-then-verify-from-every-perspective-requirement)
  has always required but that never existed as a checked-in tool. All 42
  elements verified through it.

→ [glossary](features/glossary.md#ride--glossary-link)

### fix: the bright blue hairline along the weather card's bottom edge

The weather card ended in a 1px, fully saturated sky-blue line across its whole bottom edge —
`#448ad1` against the `#1a324b` interior on a clear day, and the same untinted-gradient line in
every other scene and in light mode.

It was the glass overlay coming up one pixel short. `.weather-bg__glass` is deliberately
force-composited (`will-change: transform` + `translateZ(0)` + `backdrop-filter`, so the scene keeps
animating behind the blur on iOS/WebKit), which means its layer bounds get snapped to whole device
pixels — while `.weather-bg`'s sky gradient paints in the parent layer, all the way to the card's
fractional edge. The park page's card is 518.25px tall, so the snapped glass layer stopped a pixel
above the gradient and left that row untinted.

Fixed by giving the overlay `inset: -1px` instead of `inset: 0`; `.weather-bg` clips the overhang
with its own `overflow: hidden` + inherited `border-radius`, so the rounded corners are unchanged.
Verified at DPR 1/2/3, light and dark, across all seven scenes — no untinted row on any edge.

Worth knowing for anything layered over the weather scene: an `inset: 0` child of a composited
layer is not guaranteed to cover a fractionally-sized parent, so overlays that are supposed to tint
_everything_ need to overhang.

---

### fix: a single Back left the next page at the previous scroll offset

Clicking a blog card low on the homepage kept the homepage's scroll offset instead of opening the
post at the top. It needed one back/forward navigation anywhere earlier in the session to trigger,
which is why it looked specific to the lower blog cards: the links above the fold have the same
bug, but you are already at the top there, so nothing moves.

`ScrollToTop` classified back/forward navigations from a `popstate` listener, on the assumption
that `popstate` fires before the router commits the new route. It is the other way round — React
19 / the App Router commit from the `navigate` handling and `popstate` arrives _after_, so the
flag missed its own pop and then suppressed the **next** forward navigation. It now keys off
`history.pushState` (a forward navigation always pushes before the commit, a pop never pushes) and
scrolls only when the committed pathname is the one a push announced.

Back/forward still restores the previous position, and hash deep links (`…/europa-park#calendar`,
blog TOC, glossary anchors) still land on their target — those were the two behaviours the
`popstate` guard existed to protect.

Worth knowing for anything scroll-related: Next's own scroll handler bails out whenever the new
page's top element is already inside the viewport, which our streamed Suspense shells hit on
essentially every navigation. `ScrollToTop` is not a safety net, it is the only thing scrolling
these pages up — a wrong skip there is always visible.

The `history.pushState`/`replaceState` patch `NavigationProgress` carried now lives in
`lib/navigation/history-navigation.ts` and is shared, so the History API is wrapped once.

---

### perf: hero image loading, and why wide screens look soft

`backgroundImageLoader` used a single cutoff — `≤1080 → q50`, everything above → q75 — which lumped a
1440px desktop in with a 3440px ultrawide. It now **bands quality by how wide the rendition will
actually be painted**, and the middle band is the win: `≤1080 → q50` (mobile, unchanged), `≤1920 →
q60` (1440–1600px desktops, the most common desktop class), `>1920 → q75` (ultrawide and 2× retina,
unchanged). AVIF bytes for the 1440-class band, at Next's encoder settings:

| photo                                        | before (q75) | after (q60) |      |
| -------------------------------------------- | -----------: | ----------: | ---: |
| `walibi-holland/untamed`                     |       124 KB |       69 KB | −44% |
| `europa-park/wodan-timburcoaster`            |       140 KB |       85 KB | −39% |
| `phantasialand/taron`                        |        97 KB |       54 KB | −44% |
| `europa-park/silver-star`                    |        71 KB |       41 KB | −42% |
| `europa-park/madame-freudenreich-curiosites` |        79 KB |       41 KB | −48% |

(Measure these locally or with sharp, not against the deployed optimizer: `minimumCacheTTL` is a
year, so the Vercel image cache serves entries encoded by whatever the config was when they were
first requested — two "same" URLs can differ by 40%.)

The banding exists because the optimizer resizes with `withoutEnlargement`, so the delivered
rendition is capped by the source and the _requested_ width is really "how far will this get
stretched". Compression artifacts are magnified by that same factor, so a quality that is invisible
on mobile is not invisible at 3.9×. An earlier revision of this change put everything on q50 and made
ultrawide hero photos visibly blocky — that is what the bands fix.

Requested widths are also **clamped to 1920px**: w=2560 and w=3840 can only return the same pixels as
w=1920 even from the largest source in the tree, so they were three optimizer cache entries for one
rendition. No pixel and no byte changes at a given quality; it just stops that split, which matters
for a hero photo that re-picks on every shell regeneration.

**The real limit on wide screens is the source, not the encoder.** `sizes="115vw"` on a 3440px
ultrawide asks for a ~3956px paint width — a ~3.9× stretch of a 1024px photo, and almost every
background in the tree is 1024px. Measured on the Disneyland photo at that paint width: 1024px @ q75
costs 80 KB and still looks soft, while **2048px @ q50 costs 95 KB and is dramatically sharper**. New
and replaced backgrounds should therefore come in at 2048px; the loader's 1920px ceiling is set so
they deliver that detail without a code change. `disneyland-park/background.jpg` (the one 4032×3024 /
2.6 MB outlier) is downscaled to exactly that 2048px: sharper than the 1024px crowd on wide screens,
still ≥1200px for its structured-data crops, 2.2 MB lighter in the bundle, ~4× cheaper to decode.

The hero also gained the `placeholder="blur"` gradient the park backgrounds already had (now shared
via `lib/utils/image-placeholder.ts`), so it no longer flashes an empty `bg-background` slab.

Separately, the **in-park rotation** no longer fetches a park's whole photo set at once. Those layers
all sit in the viewport at full size, so `loading="lazy"` deferred nothing and Europa-Park fired 13
renditions (~250 KB) the moment the nearby lookup resolved. Only the outgoing / active / next layers
now mount an `<Image>`; the ken-burns animation moved to a permanently-mounted wrapper div so every
layer's animation clock still starts together and crossfades stay in phase.

→ [Assets – Delivery](development/assets.md#delivery-libutilsimage-loaderts)

---

### backend: park crowd levels now measure the park, not its busiest ride

No frontend code change, but the numbers on the park page move — worth knowing when a
screenshot from before this date disagrees with the live site.

The API's live park level used to be the P90 _across_ the per-headliner ratios, which over a
ten-ride headliner set is effectively the second-busiest ride. Phantasialand rendered **`high`**
while Taron and F.L.Y. both sat at 20 min against 45/40-min baselines. It is now a
baseline-weighted mean (`Σ current waits ÷ Σ their P50 baselines`) — the same afternoon reads
`low`. Expect quiet days to actually read quiet now; the badge ladder and colors are unchanged.

Three payload inconsistencies the page was rendering verbatim are also gone:
`analytics.occupancy.breakdown` now divides out to `occupancy.current` (it could show "25 min now
/ 30 min typical" beside "+23 % busier"), `statistics.avgWaitToday` can no longer exceed
`peakWaitToday`, and the calendar's per-day headliner figure is the same statistic on both sides
of today (past days were a daily average, future days a daily peak — a ~25 min step at the
today/tomorrow seam that read as "next week will be busier").

More surfaces now send **`unknown`** instead of a placeholder `moderate` — parks and rides
without a usable baseline. `CrowdLevelBadge` already renders it as "keine Prognose"; just don't
map it into the colored ladder anywhere new. This includes **`/v1/search` results' `load`**,
which used to fall back to `moderate`, and parks with no live sample at all, which used to
bottom out at `very_low`. Conversely, a ride reporting **0 min against a real baseline is a
walk-on** and now correctly rates `very_low` instead of `unknown` — so a 0 is a measurement,
not a gap.

→ [Backend Integration – Crowd Levels](api/backend-integration.md#crowd-levels-p50--normal),
[Crowd Levels (backend)](https://github.com/park-fan/v4.api.park.fan/blob/main/docs/analytics/crowd-levels.md)

---

### fix: late-load flicker sweep (homepage, park-page weather, search)

Fixes the remaining "flickers once or twice a few seconds after load" reports. Root causes were
found empirically (headless Chromium + MutationObserver/layout-shift tracing on the built app).

- **Park-page weather no longer double-jumps:** the hour-by-hour chart now reserves its space with
  a same-size placeholder (fixed `h-28` plot + axis row — deterministic, not a guessed height)
  while the hourly fetch is still in flight and a nowcast is already shown. Previously the section
  shifted once when the nowcast landed (~3 s) and again ~1 s later when the chart mounted
  (layout-shift 0.037); now it settles in a single step. This resolves the "known, deferred"
  weather-chart CLS note from the re-render sweep.
- **Search palette stops flashing while typing:** the main search and glossary queries use
  `placeholderData: keepPreviousData`, so a new debounced query updates results in place instead of
  results → skeleton → results (the cmdk list height stopped jumping between 176/331/420 px).
- **Nearby card no longer flashes the "enable location" prompt:** the card keyed its skeleton off
  `isLoading` (actively fetching), but the nearby query is gated behind the after-load idle window
  and the initial permission check — in those first seconds nothing is in flight, so the prompt
  rendered and was then replaced by skeleton → parks. It now uses `isPending` (no data yet).
- **Nearby consumers survive the GPS key change:** `useNearbyParks` `placeholderData` now prefers
  the previous query's in-memory data before falling back to the localStorage cache, so the header
  pill / hero variant / search-dialog nearby group no longer blank out when coords arrive
  mid-session and re-key the query.
- **In-park hero takeover can't flash the background:** the base hero image holds its fade-out
  until the first park image has actually loaded (`onLoad`-gated), and the stacked park layers are
  `loading="eager"` (they're `opacity-0`, so lazy heuristics must not defer them).

---

### perf: re-render sweep (map re-pan fix, memoized grids/markers)

Follow-up render-churn pass on top of the code-quality sweep; no user-facing behaviour changes
except the map fix, which removes an unwanted motion.

- **Park map no longer re-pans every minute (visible fix):** `center` is now `useMemo`'d on the
  primitive coords, so the shared `useMinuteNow` tick no longer hands `MapViewController` a fresh
  array that re-triggered `map.setView(…, { animate: true })` every 60 s. `AttractionMarkers` and
  `RestaurantMarkers` are `React.memo`'d (no time-relative content) so the minute tick only
  re-renders the show markers that actually need it.
- **Attraction grid stops re-rendering on every keystroke/focus:** `LandSection` is `React.memo`'d
  and `TabsWithHash` is `React.memo`'d — on a big park the 100+ glass cards now bail out on search
  input and on the 5-min poll's `isFetching` flip, and only re-render when the data really changes.
- **Calendar day memo restored:** `ParkCalendarDay.onSelect` now receives the date, so the grid
  passes the stable `setSelectedDate` setter instead of a per-day arrow that defeated the existing
  `memo` (all ~35 day cards used to re-render on any day click / today-poll).
- Known, deferred (need a server-side data seed, not a skeleton): the hour-by-hour weather chart and
  the daily-wait chart still expand on their client fetch/mount (CLS); reserving space cleanly
  requires seeding those queries server-side rather than a guessed skeleton height.

---

### refactor: code-quality sweep (dedup, component splits, client→server, repaint gates, stale docs)

Cross-cutting cleanup driven by a full-codebase audit; no user-facing behavior changes intended.

- **Dead code removed:** `BlogRelatedParks`, `ShowCountdown`, `GlossaryInjectLoader` (all imported
  nowhere).
- **Client → Server components:** `RopeDropCard` (only its embedded `ParkTime` islands hydrate now)
  and `AttractionTypicalWaitsDemo` dropped `'use client'`. NOT converted: `ParkBackground` — its
  `next/image` `loader` function prop cannot cross the server→client boundary.
- **Repaint/CPU gates (continues #219):** `weather-nowcast-banner` 1 s countdown now pauses
  offscreen/hidden (`useActiveOnScreen`); hero rotation, geolocation auto-refresh and the shared
  `useMinuteNow()` clock skip ticks while the tab is hidden; `park-map` and the former
  `useBrowserNow(60_000)` consumers (`park-time-info`, `peak-hour-badge`, `use-today-schedule`) now
  share ONE minute timer via `useMinuteNow()`/`useMinuteNowDate()` instead of private intervals.
- **Dedup:** new `lib/utils/crowd-level-styles.ts` is the single source for crowd-level →
  text/badge/outline/chip classes + the wait-time threshold ladder (`waitTimeCrowdTier`) + the
  level order — `CrowdLevelBadge`, `WaitTimeValue`, blog live-display, live ticker, best-days
  chips and both calendar components now derive from it. `scoreToCrowdLevel` moved to
  `crowd-analysis.ts` (was copy-pasted twice). Shared `<TodayWaitRange>` + `<TrendIcon>` replace
  byte-identical blocks in `attraction-live-panel` / `wait-time-info-card`. The hourly weather
  chart's two temperature palettes merged into one `TEMP_STOPS` table.
- **Best practices:** added `app/global-error.tsx` (branded last-resort boundary); attraction
  `generateMetadata` uses `catchNonFatal` (maintenance outages no longer masked as not-found);
  `components/ui/progress.tsx` dropped `forwardRef` (React 19 ref prop).
- **Large-component splits (behaviour-identical):** `search-dialog` 651→350 (data layer →
  `lib/hooks/use-search-results.ts`, rows → `search-result-items.tsx`), `tabs-with-hash` 631→328
  (`use-tab-hash-routing` + `use-attraction-filter` hooks, `park-tabs-list` + `off-season-toggle`
  components), `park-map` ~550→263 (`lib/utils/leaflet-icons.ts`, `use-park-map-geolocation` hook,
  `park-map-markers` components), and `nearby-parks-card` split into a state-router + view/analytics
  pieces.
- **More dedup:** merged the two near-identical `SectionHeader`/`SectionHeading` components into one
  (`variant="plain"` absorbs the old `SectionHeader`; former component deleted, 2 call sites
  migrated); new `GlassSectionTitle` replaces the frosted section-title pill copy-pasted 6× across
  `nearby-parks-card`/`favorites-section`; new `<LiveDot>` primitive replaces the pulse/ping "live"
  dot hand-rolled in the live ticker, ML badge, weather-card and training-status badge.
- **More repaint gates:** `weather-background`'s declarative CSS animations (clouds/stars/fog/flash)
  now pause via `animation-play-state` when the card scrolls offscreen (IntersectionObserver →
  `data-paused`, no scroll-time re-renders); the precipitation canvas was already gated.
- **Version:** `package.json` bumped 2.10.0 → 2.10.1 to match the latest released changelog entry
  (was lagging).
- **Stale docs/comments fixed:** removed the long-gone Vercel Toolbar/Flags + `debug-geo-mode`
  subsystem from 8 docs + `.env.example`; caching-strategy doc got a "superseded" note (PPR →
  force-dynamic reality); `cache-config.ts` comments now reference `PARK_REVALIDATE`/
  `ATTRACTION_REVALIDATE`; tech-stack table (TS 6.x, custom SVG charts, no recharts); scripts doc
  lists all prebuild generators.

---

### feat: header "Prognose heute" opens the day-detail dialog (+ day navigation, park-tz times)

The forecast cell in the park-header stats band is now clickable and opens the SAME
day-detail dialog the crowd calendar shows when clicking today (status & hours, live vs.
forecast split, headliner waits, hourly prediction chart, weather, holiday context).

- `ParkHeaderStats` reuses `ParkCalendarDayDetail` 1:1 — no new dialog UI. The full
  `CalendarDay` for today comes from a one-day `/calendar` fetch with the same query key +
  staleTime as the calendar grid's today-patch (shared React Query cache; opening the
  calendar tab later reuses it), deferred via `useLoadLast` so it never competes with the
  live/weather queries (loads-last rule).
- The cell value becomes a button (hover pill + chevron affordance, `aria-haspopup`,
  focus ring) only once today's data is cached — a click therefore always opens instantly;
  until then (or if the fetch fails) it renders static as before.
- **Day navigation in the dialog**: prev/next chevron buttons (and ←/→ keys) flip through
  days without leaving the dialog — from both entry points. The dialog retains the last
  shown day and dims (`aria-busy`) while the target day loads instead of unmounting. In the
  header each visited day is its own small cached one-day query; in the calendar grid,
  crossing a month boundary also navigates the grid month (hash stays in sync).
- **Park-timezone times everywhere**: the dialog and the calendar grid cells now render
  opening hours via `ParkTimeRange` (park-local time, viewer-local tooltip on hover) instead
  of `format(parseISO(...))`, which silently used the BROWSER timezone — for viewers outside
  the park's timezone the calendar showed shifted hours (e.g. 07:00–17:00 UTC instead of
  09:00–19:00 park time). `ParkCalendarDay`/`ParkCalendarDayDetail` gained a required
  `parkTimezone` prop.
- New translation keys `parks.dayDetail.openToday` / `prevDay` / `nextDay` in all 6 locales.
- **Fix: header holiday panel no longer swallows neighbouring school breaks.** The
  `useTodaySchedule` influencing filter dropped every neighbour entry whose NAME matched the
  local holiday — with generic school-break names ("Summer Holidays" in NRW _and_ HE/NI/RP/
  NL/BE) that erased whole countries from <HeaderHolidayPanel> (only "Belgien" survived)
  while the day-detail dialog listed them all. The name-echo suppression now applies only to
  non-school entries (a shared public holiday like Whit Monday is still told once, by the
  local badge); region-specific school breaks always show — header and dialog tell one story.
  The panel's region chips now also carry their country's flag emoji (🇩🇪 Hessen · 🇳🇱
  Niederlande · 🇧🇪 Belgien), matching the dialog's visual language.

### perf: page-wide re-render/flicker sweep (memory & repaint fixes)

Audit of all pages for state/effect patterns that forced unnecessary re-renders, repaints or
leaked resources — the source of intermittent visible flicker.

- **Geolocation context** (`lib/contexts/geolocation-context.tsx`): background auto-refresh
  (60 s in-park / 5 min) no longer pulses `loading` and preserves the `position` object
  identity when coords are unchanged; context `value` memoized. Previously every tick
  re-rendered all geo consumers (hero, nearby card, favorites, banner) 2× with a new
  context reference even when nothing changed.
- **Region/neighbor live overlays** (`use-region-parks`, `use-park-neighbors`): return a plain
  `Record` instead of a `Map` — React Query structural sharing now keeps the identity stable
  across equal polls, so hub/country/nearby card grids stop re-rendering every 5 min for
  byte-identical data.
- **Attraction page**: the "Updating…" refetch indicator now lives in a fixed-height slot
  (same pattern as the park page) — it used to insert/remove a row on every mount refetch,
  5-min poll and tab refocus, shifting the whole live card up/down (CLS).
- **Attraction grid sparklines** (`WaitTimeSparklineCard`): one shared minute clock
  (`lib/hooks/use-minute-now.ts`, `useSyncExternalStore`) replaces one 60 s interval PER
  card — dozens of staggered per-card repaints per minute become a single batched update.
- **Sparkline hover** (`components/parks/sparkline.tsx`): local `onMouseMove`/`onMouseLeave`
  instead of a global `window` listener per instance (~31 on the attraction history grid,
  each doing a forced layout read on every pointer move anywhere on the page).
- **Crowd calendar**: `keepPreviousData` on month navigation — the grid dims instead of
  flashing back to the full skeleton on every prev/next click.
- **Weather**: nowcast banner ticks 1 s only while a banner is visible (was: every second on
  every park page forever, even with no banner); night-scene star field is generated after
  mount (was: SSR/client hydration mismatch that re-created the subtree).
- **Nowcast countdown hydration error** (found via headless smoke test): the
  `typeof window ? Date.now() : 0` state seed in `NowcastUpdateCountdown` (and the nowcast
  banner clock) rendered an epoch-based countdown ("Update in 29738148:20") into any
  server-rendered nowcast — guaranteed hydration text mismatch, React regenerated the whole
  subtree on every load (visible on /howto). Now: deterministic 0 on both server and
  hydration render with a stable "--:--" placeholder; the real clock mounts in an effect.
- **Coaster player** (glossary): progress bar is driven imperatively via refs — `onTick`
  no longer calls `setState` ~60×/s; `pause()` now actually stops the RAF loop (it kept
  rendering at 60 fps while paused/off-screen, and each pause→play stacked an extra RAF
  chain); both three.js scenes release their WebGL context on dispose
  (`forceContextLoss()`) so remounts can't exhaust the browser's context cap.
- **ShowCountdown**: browser-clock only via `useBrowserNow` (was: `new Date()` state seed
  baking the server/build clock into SSR HTML → hydration mismatch on every load).
- **Favorites**: the favorites cookie is parsed once per change event (memoized by raw
  cookie value) instead of once per mounted star (O(stars) JSON.parse per toggle).
- **Blog images**: the build manifest now bakes intrinsic width/height (via sharp, EXIF-aware)
  into every gallery/inline image so the box is reserved before load — `width={0}/height={0}`
  reflowed the article on every image pop-in.
- Smaller: memoized context values (temperature unit, glossary inject, admin), memoized
  glossary term parsing, memoized stats/best-days derivations, stable keys in the live wait
  ticker, `holiday` object in `useTodaySchedule` memoized, blob-URL cleanup in the contribute
  photo dropzone no longer closes over the first render's empty list.

### perf: best-days seed streams instead of blocking park-page TTFB

Cold-start latency fix. The best-days SEO seed (`getBestDaysCalendarSeed`) was `await`ed on the
park page's render critical path, so a cold `/best-days` fetch (~0.4–1 s, occasionally slower than
the park snapshot fetch, or hitting the seed timeout) was added straight to first-byte — a
noticeable cold-start regression on `force-dynamic` park pages (no edge-cached HTML).

- `page.tsx`: the seed promise is created but **no longer awaited in the body**. It's consumed only
  inside `<Suspense>` boundaries — the FAQ JSON-LD (`FAQStructuredData` now takes the seed _promise_
  and awaits it itself) and a new streamed `SeededBestDays` server component for the best-days slot.
  The shell (H1, attraction overview, header, FAQ base + Q1) now flushes at **park-fetch speed** and
  the seeded best-days HTML + least-crowded JSON-LD stream into the same response — crawlers still
  receive them in the final document (verified: full-download HTML of a park with data contains the
  best-days text + the 9-question FAQPage incl. least-crowded).
- The visible FAQ Q7 (least crowded) is no longer server-seeded (that required the blocking await);
  it streams in from the client calendar fetch after mount, and the SEO signal lives in the streamed
  JSON-LD. Q0–Q6 + Q1 still render immediately from the park snapshot.
- `BEST_DAYS_SEED_TIMEOUT_MS` 800 ms → 3 s: off the critical path now, so a generous bound just
  lets the seed land in the streamed HTML more often; `after()` still warms the data cache on a miss.
- Measured (local prod build, real API): cold-park page TTFB is now gated by the park snapshot fetch
  (e.g. 0.42 s) instead of park + seed serialized; a park whose snapshot fetch is itself slow cold
  (~0.9 s) is unchanged (that's the park fetch, not the seed). No hydration errors; forecast intact.

### SEO: park best-days now read the precomputed /best-days endpoint

Follow-up to the "core content in first HTML" work, now that the backend ships the precomputed
best-days endpoint (PArns/v4.api.park.fan#94). The best-days section, crowd FAQ and header
"Prognose heute" forecast previously derived their data from the ~2.25 MB `/calendar` response
(≈98 % unused `influencingHolidays`, 10–20 s cold ML compute) guarded by a seed timeout.

- `lib/api/integrated-calendar.ts`: `getBestDaysCalendar` / `getBestDaysCalendarSeed` now fetch
  `GET /v1/parks/.../best-days` (a materialized Redis snapshot, ~15 KB, p99 < 300 ms). Dropped
  `unstable_cache` + `projectBestDaysCalendar` — the small body fits Next's fetch data cache
  directly (plain `next: { revalidate, tags: ['best-days:<slug>'] }`; the backend fires
  `revalidateTag` after each forecast warmup). Seed timeout is now a formality (800 ms).
- New `getBestDaysSnapshotFresh` + `/api/parks/.../best-days` proxy branch; `useParkBestDaysCalendar`
  (client) switched to it — no more `from`/`to` window (the endpoint returns the rolling today→+90d
  window), so `getCalendarWindow` / `lib/hooks/use-calendar-window.ts` are gone.
- The `/best-days` snapshot includes a stats-quality `byDayOfWeek` aggregate, so the **SSR seed now
  renders the proper "quietest weekdays" ranking + best weekend day** in the first HTML (previously
  the seed fell back to the calendar-derived approximation).
- `park-header-stats.tsx`: "today" for the forecast is derived from the browser clock in the park
  timezone (`date === todayStr`) — the lean endpoint deliberately omits the `isToday` flag (a baked
  flag goes stale in the CDN cache).
- The calendar **grid tab** still uses the full `/calendar` endpoint (it needs hours + weather per
  day); with the backend payload diet its default body is now ~50 KB instead of ~2.25 MB.
- Loading-priority REQUIREMENT untouched: the client best-days query stays `useLoadLast`-deferred.

### SEO: park pages ship their core content in the first HTML again

Competitor SERP analysis (July 2026, "phantasialand wartezeiten" & co.) found the park page's
initial HTML contained **no attraction names, no attraction links and no best-days text** — the
attractions tab mount-gated everything behind a skeleton, and the best-days/FAQ calendar content
was client-only. wartezeiten.app/queue-times serve exactly this content statically. Changes
(see [SEO analysis](seo/analysis.md)):

- **NEW `AttractionWaitOverview`** — the pre-mount/no-JS state of the attractions tab is now a
  server-rendered semantic list of EVERY attraction (name + link + snapshot wait/status),
  grouped by land, with the park-wide Ø/peak/operating summary and a visible "Datenstand"
  timestamp. The interactive cards replace it after mount; crawlers index 40 ride names + 40
  internal links per park instead of a pulse skeleton.
- **Best-days SSR seed** — `getBestDaysCalendarSeed` (timeout-guarded `getBestDaysCalendar`,
  month-aligned window, `after()` keeps a cold fill alive) lets the "Beste Reisezeit" section
  and the least-crowded FAQ render server-side when the (72 h SWR) cache is warm. The client queries
  stay `useLoadLast`-deferred — the loading-priority requirement is untouched (the seed is
  props, not a page query).
- **FAQ**: "Wann ist {park} am wenigsten los?" now also lands in the FAQPage **JSON-LD**
  (shared `getLeastCrowdedDays` derivation, so markup and visible answer can't diverge), and
  Q1 renders today's concrete opening hours server-side (force-dynamic page, per-request clock).
- Fixes: German evergreen opening-hours FAQ no longer reads "von das {park}"; attraction-page
  H1 text no longer concatenates as "Taron– Aktuelle Wartezeit"; the neighbouring-holidays
  header panel renders once (responsive classes) instead of twice in the HTML.
- Deliberately NOT changed: `PARK_REVALIDATE` stays 1 day — a shorter snapshot window would
  re-create the ISR/data-cache write volume documented in
  [caching-strategy](architecture/caching-strategy.md); freshness is signalled honestly via the
  rendered "Datenstand" instead.

### Hottest-parks banner: centered layout for a partial heat wave

The homepage heat banner ([`HottestParksSection`](../components/home/hottest-parks-section.tsx))
switched from a fixed 3-column grid to a **centered flex-wrap** row of fixed-width (`w-72`)
cards. When only 1–2 parks in DE/FR/IT/NL/BE cross the 35 °C threshold, the cards now stay
centered instead of left-aligning and leaving an empty trailing column. Three cards still fill
`max-w-4xl` exactly; the ≥ 35 °C visibility trigger is unchanged.

### Blog: German-first launch (welcome post live in DE only)

The rewritten founder-story welcome post goes **published for DE**; EN stays draft until the
translations are polished. To make a single-locale launch clean, blog visibility is now
**locale-scoped** (`hasPublishedPosts(locale?)` in `lib/blog/index.ts`):

- Header/footer nav, blog index, category/tag/author pages and the RSS feed exist **only in
  locales that actually list posts** — /de/blog is live while /en/blog & co. stay 404 instead
  of presenting an empty index.
- `buildPostAlternates` emits only **published** translations (draft URLs 404, hidden ones are
  unlisted — neither belongs in hreflang); the DE post self-canonicalizes with `x-default` on
  itself until translations exist.
- `app/sitemap.ts` blog section iterates only blog-live locales (incl. blog-scoped hreflang
  alternates for index/category/tag/author entries).

### SEO: hub + attraction pages join the sitemaps

SERP checks (July 2026) showed the missing long-tail surface: queue-times/wartezeiten.app rank
their per-ride pages for "taron wartezeit"-style queries and country overviews rank for
"freizeitparks deutschland" — page types park.fan HAS but kept out of the sitemap (old
crawl-budget decision, explicitly marked "revisit"). Changes — see
[sitemaps](seo/sitemaps.md):

- `app/sitemap.ts`: continent + country hubs and **multi-park** city hubs added (single-park
  cities 308 to their park and stay excluded).
- **NEW `/sitemap-attractions.xml`** (`app/sitemap-attractions.xml/route.ts`, daily ISR):
  ~5.8k attractions × 6 locales as lean `<loc>`-only entries (full alternates would approach
  the 50 MB sitemap limit; the pages carry hreflang themselves). Referenced from robots.txt.
- `lib/content-urls.ts` `getAttractionPaths`: variant filter now mirrors the attraction page
  exactly — numbered-suffix slugs are only dropped when the base slug exists in the same park
  (previously over-excluded legit slugs like `spindeln-nyhet-2026`); also fixes the IndexNow
  URL set.

---

### SEO: heal re-slugged geo URLs (google.de showed English/no German pages)

The API's umlaut transliteration change re-slugged German cities (`bruhl` → `bruehl`,
`gunzburg` → `guenzburg`), so every previously indexed Phantasialand + Legoland-Deutschland
URL (park, attractions, city hub) returned **404** — Google dropped the German flagship pages
and google.de fell back to English results; visit share skewed to the US. hreflang, canonicals,
sitemap alternates and `Content-Language` were verified correct — the missing piece was
redirects for the old URLs:

- **`findRelocatedParkRedirect`** (`lib/utils/redirect-utils.ts`) — generic safety net: the
  park slug is the stable key; if the API lookup for a park/attraction URL 404s but the slug
  exists elsewhere in the geo structure, the page issues a **308** to the canonical path.
  Runs only after a confirmed API miss, so it can never bounce a working URL. Heals any
  future city/country re-slug automatically. Wired into the park page and attraction page
  (body + `generateMetadata` canonical). Handles duplicate park slugs (`disneyland-park`
  exists in Paris **and** Anaheim) by preferring continent/country matches.
- **Static 301s** in `next.config.ts`, derived from the GSC coverage export (2026-07-06,
  2,388 known 404s) diffed against `/v1/discovery/geo`:
  - rule 6 relocated cities: `bruhl`→`bruehl`, `gunzburg`→`guenzburg`, `cocoyoc`→`oaxtepec`,
    `glendale`→`phoenix`, `valencia`→`santa-clarita`, `willis`→`spring`
  - rule 7 renamed parks: 6× `six-flags-hurricane-harbor-*`→`hurricane-harbor-*` (the three
    still-existing six-flags water parks are deliberately NOT matched), `universals-*`→
    `universal-*`, `toverland`→`attractiepark-toverland`, `lotte-world`→`lotte-world-adventure`,
    `disneys-animal-kingdom-theme-park`→`disney-animal-kingdom`, `adventure-island`→
    `adventure-island-tampa`, `universal-studios`@bull-creek→`universal-studios-hollywood`@LA,
    resort URLs `walt-disney-world`→Orlando hub, `disneyland-paris`→`disneyland-park`
  - rule 8 pre-`/parks` URL scheme: `/{locale}/{continent}/…` → `/{locale}/parks/{continent}/…`
  - rule 9 doubled locale prefixes (`/de/de/…`), rule 10 `/manifest.json` → `/manifest.webmanifest`
- **Cross-locale glossary slugs** (≈38 % of the sampled 404s, legacy of next-intl
  auto-alternates): the term page now resolves a slug from ANY locale via `findTermByAnySlug`
  and 308s to the locale-correct slug — e.g. `/nl/glossaire/harnais-epaules` →
  `/nl/woordenboek/schouderbeugels`-style chains end on real content instead of 404.
- Docs: [routing-and-urls](architecture/routing-and-urls.md#redirect-logic-404-prevention)
  examples updated to current slugs; [SEO analysis](seo/analysis.md) notes the incident.
- Known backend data bug (flagged, needs API fix): `universal-studios-hollywood` is listed
  under BOTH `bull-creek` and `los-angeles` in `/v1/discovery/geo` → duplicate sitemap
  entries and split signals.

---

### ISR writes: hourly homepage shell, client-live overlays, on-demand revalidation

Vercel ISR Write Units had climbed back to ~45–100k/day (614k for Jun 19 – Jul 2). Root cause:
the Jun 22 homepage change (static 5-min shell) — 6 locales × up to 288 regenerations/day ×
~600 KB HTML+RSC per write (units are billed **per 8 KB stored**) ≈ the whole bill. On top,
`getGeoStructure(300)` in the featured-parks slot re-wrote the ~114 KB geo Data-Cache entry
every 5 min **and pinned every route embedding the slot** (blog, glossary terms, howto) to a
5-min ISR window — a route's effective window is its **lowest** fetch revalidate. Fix — see
[caching-strategy](architecture/caching-strategy.md):

- `app/[locale]/page.tsx` — homepage `revalidate` **300 → 3600** (~12× fewer shell writes).
  The classic hero photo now re-picks per regeneration (~hourly rotation across visits).
- Every homepage-shell fetch raised to ≥ 3600 so none pins the route: `getGlobalStats` /
  `getGeoLiveStats` (defaults 600→3600), `getTickerData(3600)` seed (the `/api/analytics/ticker`
  proxy keeps its 600s cache for client polls), `lib/api/ml.ts` 1800→3600, featured slot
  `getGeoStructure()` → 24h default.
- The numbers that read as "live" overlay themselves client-side on the baked seed (the
  park/hub-page shell+overlay model): new `LiveContinentOpenCount` (via existing
  `useGeoLiveStats`), new `GlobalStatsLiveCounts` + `useGlobalStats` hook (no-store
  `/api/analytics/realtime`), and featured cards now prerender **status-free** with
  `FeaturedParkCardsLive` → `useRegionParks` overlay (same as hub grids). Fresher than the old
  baked 5-min snapshot, ~zero extra LCP cost (all below the fold, React Query already loaded).
- **NEW `/api/revalidate`** (POST, `Authorization: Bearer $REVALIDATE_SECRET`, body
  `{"tags":[...],"paths":[...]}`) — on-demand `revalidateTag`/`revalidatePath`, so the backend
  can push "data actually changed" instead of the frontend re-writing on a timer. See
  [backend-integration](api/backend-integration.md#on-demand-revalidation).

---

### "Hottest parks" heat banner on the homepage

A Saisonstart-style homepage section that surfaces the **3 hottest parks** in
**Germany, France, Italy, the Netherlands and Belgium** during a heat wave, each with a
park link and a temperature card (max temp + the heat-warning triangle). It is
**data-driven**: it renders only while at least one park that is **operating today** is
at/above the heat threshold (`HEAT_WARNING_THRESHOLD_C`, 35 °C) and **disappears
automatically** when the heat passes — no manual end date. Includes a °C/°F toggle and an
explanatory heat-tips paragraph; water parks (Rulantica) and off-season / seasonal-event
venues are excluded. See [hottest-parks-heat-banner](features/hottest-parks-heat-banner.md).

- `lib/api/weather-hottest.ts` (new) — `getHottestParks()` derives the biggest parks
  operating today in DE/FR/IT/NL/BE from the geo tree and ranks them by cached per-park
  nowcast (today's max temperature). Frontend aggregation; swappable for a backend endpoint.
- `components/home/hottest-parks-section.tsx` (new) — server component, reuses `<Temp>`,
  `TemperatureUnitToggle`, `getWeatherConfig`, `<HeatWarningBadge>` and country translation;
  renders `null` when no park qualifies.
- `app/[locale]/page.tsx` — section mounted after `AnnounceSection`, in `Suspense` with a
  `null` fallback (no skeleton flash for a usually-absent section).
- `messages/*.json` — `home.hottestParks.*` (all 6 locales).

---

### Heat warning threshold raised to 35 °C

The heat warning now triggers at **≥ 35 °C (95 °F)** (was > 30 °C). Single constant
`HEAT_WARNING_THRESHOLD_C` in `components/parks/heat-warning-badge.tsx` plus the tooltip
copy in `messages/*.json`. Severe-weather day warnings are unchanged.

---

### Heat warning badge on the weather card

Temperatures above **30 °C (86 °F)** now show a real road-sign style warning triangle — red
border, white background and a black "!" (SVG) — next to the affected temperature. It appears
next to the current temperature at the top of the weather card, on the peak-temperature label of
the hourly nowcast chart, and on every day in the bottom forecast strip whose max temperature
crosses the threshold. The threshold is checked on the Celsius source value, so it triggers
identically regardless of the user's °C/°F unit choice.

The same triangle also flags **severe-weather days** in the forecast strip — thunderstorms,
heavy rain (code 65/67/82 or ≥ 25 mm/day), heavy snowfall (code 75/86 or ≥ 10 cm/day) and
storm-force wind (≥ 60 km/h). When a day is both hot and severe, a single triangle carries a
tooltip that lists every reason.

- `components/parks/heat-warning-badge.tsx` (new) — `HeatWarningBadge` (SVG warning triangle) +
  `isHeatWarning()` helper and the shared `HEAT_WARNING_THRESHOLD_C` constant.
- `lib/utils/weather-utils.ts` — `getDayWeatherWarning()` classifies a forecast day as severe.
- `components/parks/weather-card.tsx` / `weather-forecast-strip.tsx` / `weather-hourly-chart.tsx`
  — render the badge.
- `messages/*.json` — `parks.weather.heatWarning` + `parks.weather.weatherWarning.*` tooltip
  labels (all 6 locales).

---

### Homepage sections server-rendered into the 5-min shell

The homepage's data sections — **Featured Parks** ("beliebte Parks"), **Global/Platform Stats** and
**"Parks open now"** — now render **server-side into the 5-min static shell** instead of fetching
their data client-side. This removes the React Query hooks (`use-global-stats`, `use-park-backgrounds`,
the homepage's `useGeoLiveStats`, and the featured-parks poll) and their no-store `/api/...`
round-trips from the home bundle — less client JS competing with the render-blocking CSS at first
paint, and the content now lands in the prerendered HTML (better LCP, SEO, no-JS). Data is at most
5 min stale: the section fetches (`getGlobalStats(300)` / `getGeoLiveStats(300)` /
`getGeoStructure(300)`) share the shell's revalidate window. See
[caching-strategy](architecture/caching-strategy.md).

- `components/home/global-stats-section.tsx` → `async` server component; park/ride backgrounds are
  resolved on the server (`lib/utils/park-assets`) instead of via the deleted `use-park-backgrounds`
  client mirror.
- `components/home/live-activity-{section,grid}.tsx` → per-continent open counts come from the server
  `getGeoLiveStats(300)` fetch (props), so the grid ships no client JS. `useGeoLiveStats` stays for the
  geo pages.
- `components/home/featured-parks-slot.tsx` → `FeaturedParksSlot` (full section) + `PopularParksGrid`
  (compact, howto pages) are now server components that render `extractFeaturedParks(getGeoStructure(300))`
  directly. The client poll returned that _same_ 300s-cached data, so server-rendering costs no
  freshness. Deleted `featured-parks-section-client.tsx` + the `/api/featured-parks/[locale]` route
  (its only caller was the poll). Applied across the homepage, blog context module, glossary term
  pages and the 6 howto pages.
- `lib/api/analytics.ts`: `getGlobalStats` / `getGeoLiveStats` take an optional `revalidate` (default
  600); the homepage passes **300** to pin them to the shell's window.

---

### No more scrollbar flicker when opening popups

Opening any Radix popup (language switcher dropdown, dialog, popover, command palette,
mobile sheet) made the whole page flicker horizontally: `react-remove-scroll` locks the
body and hides the vertical scrollbar while the popup is open, so on classic-scrollbar
systems (Windows/Linux) the content area — including the sticky header and `w-screen`
full-bleed sections — widened by the scrollbar's width and snapped back on close.

- **Fix** (`app/globals.css`): `html:has(body[data-scroll-locked]) { scrollbar-gutter: stable }`
  reserves the scrollbar's space **only while a popup is open**, so hiding the scrollbar no
  longer changes the page width. It is deliberately _not_ permanent — during normal scrolling
  the browser's native scrollbar renders as-is (correct theme colour, no forced always-visible
  bar). The `body[data-scroll-locked]` rule also zeroes the `margin-right`/`padding-right` that
  `react-remove-scroll` adds to compensate for the removed scrollbar — the reserved gutter
  already covers that, so otherwise it would shift the page the other way.
- No-op on overlay-scrollbar systems (e.g. macOS without "always show scrollbars"), which
  never had the flicker.
- **Dark scrollbar in dark mode** (`app/globals.css`): some platforms (notably macOS) colour
  the native scrollbar from the _OS_ appearance, not the page — and `color-scheme: dark`
  doesn't reliably override it — so a dark site on a light/auto macOS showed a light/white
  scrollbar. `.dark { scrollbar-color: … transparent }` now sets the colour explicitly
  (driven by the theme class, so it matches the chosen theme from the first paint). Light
  mode keeps the native scrollbar.

---

### Glassier popups (dropdowns & popovers)

Dropdown menus (e.g. the language switcher) and popovers were flat opaque boxes. They now
match the site's glass aesthetic: a translucent, `backdrop-blur-xl` surface
(`supports-[backdrop-filter]` keeps an opaque fallback), softer `rounded-xl` corners, a
richer `shadow-xl` with a subtle ring, and menu items get `rounded-md` + a color
transition on hover. Shared via `components/ui/dropdown-menu.tsx` +
`components/ui/popover.tsx`, so every dropdown/popover benefits.

---

### Park page load order: weather first, best travel time last

Two loading fixes on the park page, plus a stale-cache fix that made the hourly weather
day view randomly disappear.

- **Hourly day view sometimes missing (stale-day cache race)**: `/api/weather/hourly`
  used `forecast_days=1` ("today at upstream fetch time") behind two
  stale-while-revalidate cache layers (Next data cache `revalidate: 900` + CDN
  `s-maxage=900`). The Next data cache serves a stale entry (any age) while it
  revalidates in the background — so the first visitors after midnight could receive
  YESTERDAY's hours. `WeatherHourlyChart` hides data that isn't "today" in the park
  timezone, so the chart silently vanished on those pages and reappeared on reload.
  Fix: the client (`useWeatherHourly`) now sends the park-local date (browser clock,
  computed at fetch time) as `&date=`, and the route maps it to Open-Meteo
  `start_date`/`end_date`. Every cache key (CDN request URL + Next data-cache upstream
  URL) now rolls over with the park-local day, so a stale serve can never deliver the
  wrong day.
- **Weather loaded too late (nowcast→hourly waterfall)**: the hourly fetch was gated on
  the nowcast having arrived. It now starts in parallel on mount; only the _rendering_
  of the day view still requires a nowcast.
- **Best travel time ALWAYS loads last (requirement)**: the best-days calendar +
  historical stats are the page's largest/slowest requests (cold compute 10–20 s) and
  competed with the live/weather queries. New `useLoadLast` gate
  (`lib/hooks/use-load-last.ts`) defers `useParkBestDaysCalendar` +
  `useParkHistoricalStats` until every other React Query fetch on the page has settled
  (300 ms network-idle grace, 5 s safety timeout so the sections can't be starved).
  Consumers (`ParkBestDaysSection`, `ParkStatsSection`) now gate their skeletons on
  `isPending` instead of `isLoading` — a deferred (disabled) query is pending but not
  fetching, so `isLoading` would have flashed the empty fallback. Requirement
  documented in [system-overview](architecture/system-overview.md) and `CLAUDE.md`.

---

### Hourly day view in the weather card

Weather-app style detail view for today inside the park weather card: smoothed temperature
curve with min/max labels, rain bars per hour, a "now" marker (past hours dimmed) and
per-hour tooltips (time, temp, condition, precip, rain probability), plus an axis with
weather icons every 3 h. Shown only when the park has a live nowcast.

- **Data**: the backend exposes no hourly temperatures (daily weather + ~6 h nowcast only),
  so `/api/weather/hourly` proxies Open-Meteo — the backend's own upstream source, already
  attributed in the card. The proxy keeps requests first-party (no visitor IPs to a third
  party), validates `lat`/`lon`/`tz`, rounds coords to ~1 km and caches 15 min
  (`revalidate: 900` + `s-maxage=900`), so all visitors of a park share one upstream call.
  If/when the backend grows an hourly endpoint, only the route handler needs to change.
- **Types**: `WeatherHourlyPoint` / `WeatherHourlyToday` in `lib/api/types.ts`.
- **Hook**: `useWeatherHourly` (client-only, 15 min stale, 30 min refetch to roll the chart
  over to the new day after midnight); enabled only when a nowcast exists.
- **Component**: `components/parks/weather-hourly-chart.tsx`; hides itself when the data no
  longer belongs to "today" in the park timezone (midnight gap until the next refetch).
- **Park page**: passes `latitude`/`longitude`/`timezone` to `WeatherCard` (new optional
  props — other `WeatherCard` consumers are unaffected).
- **i18n**: `parks.weather.hourlyTitle` / `parks.weather.nowLabel` in all 6 locales.

---

### Rope-drop recommendations

Surfaces the API's precomputed rope-drop data (backend PR #67): is it worth arriving at park
opening for a headliner, and until when does the advantage last.

- **Types**: `RopeDropInfo` / `RopeDropHeadliner` in `lib/api/types.ts`; `ropeDrop` on
  `ParkAttraction` + `AttractionResponse`, `ropeDropHeadliners` on `ParkWithAttractions`.
  Only set for tier1/tier2 headliners in parks with a schedule — and present even when
  `worth: false`, so always check `worth`, not just existence.
- **Attraction cards**: `<RopeDropBadge>` (sunrise icon, emerald = high / teal = moderate)
  shown when `worth: true`, regardless of live status (the tip matters most pre-opening).
- **Attraction detail**: `<RopeDropCard>` — savings headline (open wait vs. day peak),
  advantage window as concrete park-local time via `rideByUtc` (offset fallback when null),
  quieter evening alternative via `bestSlotUtc` when the day's trough isn't at opening,
  weekend/weekday breakdown, low-confidence hint. Muted "no need to rush" note when
  `worth: false`.
- **Park page**: `<RopeDropHeadliners>` strip above the headliners section (chips linking to
  each attraction, minutes saved); data arrives pre-filtered/sorted from the API.
- **Inverse recommendation ("better later")**: when `worth: false` but the line is already long
  right at opening (≥30 min) and the day's trough sits ≥2 h later (`isEveningBetter` in
  `lib/utils/rope-drop.ts`), cards get an indigo moon badge and the detail page an
  "Better later than at opening" panel pointing at the typical trough time (`bestSlotUtc`).
- **Backend PR #69 fields**: `bestSlotWait` (expected wait at the trough), `endOfDayWorth` /
  `endOfDaySavings` (server-side "better later" verdict with pre-closing line-drain guard) —
  all optional in the frontend types. `isEveningBetter` prefers the server verdict and keeps
  the local heuristic as fallback for cached recommendations predating the fields. When
  `bestSlotWait` is present, the evening panel shows an opening/peak/evening stat trio and the
  badge hint + alternative lines say "typically only ~X min". `/v1/favorites` now also carries
  `ropeDrop`, so favorites cards light up without further frontend changes.
- **i18n**: `attractions.ropeDrop.*` + `parks.ropeDropSection.*` in all 6 locales.
- Rope-drop values are recomputed daily server-side — no extra polling; the fields ride along
  on the existing park/attraction responses.

---

## 2.10.1 (2026-06-10) – SEO review fixes

Full-code SEO review; fixed everything actionable. See [seo/analysis.md](seo/analysis.md).

- **robots.txt**: `Allow: /api/og/` so Google can crawl the OG images; stopped disallowing
  `/_next/` (Google renders pages and needs JS/CSS/optimized images).
- **Sitemap**: removed noindex legal pages (Search-Console conflict), added `/parks` and
  `/search`; blog entries/hreflang now only for locales with a real translation.
- **Blog EN-fallbacks** (`/de/blog/<en-slug>` etc.): canonical now points to the EN original;
  no longer advertised via hreflang, sitemap, or IndexNow.
- **Localized 404**: new `app/[locale]/not-found.tsx` (translated, inside the site chrome)
  instead of the bare English root fallback.
- **Icons**: real 180×180 `apple-touch-icon.png` (iOS ignores SVG), manifest icons with
  correct sizes (192/512 generated from `logo-big.png`; `logo.png` was 569×683).
- **HowTo page**: Article JSON-LD added.
- **Maintenance page**: auto-recovers via 15 s health poll — previously a reloaded
  `/maintenance` showed the outage screen forever.
- **`SITE_URL`** from `i18n/config.ts` is now the single base-URL source for canonicals,
  hreflang, JSON-LD and IndexNow (was hardcoded in ~25 places).

---

## 2.10.0 (2026-06-07) – ISR cost & cold-load overhaul

Park/attraction routes were the dominant Vercel ISR-write source (write-heavy, read-light), and
cold parks loaded slowly. Reworked the render split so the server shell stays SEO-complete and cheap
while everything live/heavy loads client-side with skeletons.

### Caching / cost

- **7-day shell TTL** for park + attraction (`PARK_MAX_AGE`/`ATTRACTION_MAX_AGE = 604800`), down from
  daily — ~7× fewer time-based ISR writes. Required lifting every nested `'use cache'` MIN
  (`getCurrentYear`, `getParkSlugIndex` + `getGeoStructure`, `getParksNearLocation`) off its 1-day
  floor; verified via `next build`'s per-route `revalidate` column.
- **Lean ISR snapshot** — `leanParkForShell` strips the heavy `statistics.history` sparkline series
  from the cached/serialized shell (the live no-store poll keeps it) → smaller size-weighted writes.
- **Attraction detail client-side** — `history`/`hourlyForecast` load via the CDN-cached
  `/api/parks/.../attractions/<slug>` route, off the ISR shell.

### Cold-load

- **Prebuild top ~20 popular parks** (`generateStaticParams`) so the highest-traffic parks are warm
  with full SEO HTML on preview + prod from the first request; long-tail + attractions stay on-demand.
  (Prebuilding all ~156 overran a fresh Vercel build — too many cold park-detail fetches.)
- **Prewarm cron** (`vercel.json`, every 6 h) warms the rest of the popular set in prod + recovers
  after eviction.

### Other

- Disabled operating-park hover prefetch (prefetching a park triggered an ISR write).
- Fixed the `/api/parks/.../attractions/<slug>` CDN cache header (was clobbered by the blanket
  `/api` no-store rule).

See [caching-strategy](architecture/caching-strategy.md).

---

## 2.9.1 (2026-06-06) – Post-PPR front-end weight trim

Follow-up to the Cache Components migration after RUM showed FCP slipping into "needs
improvement". Measured on the live homepage: ~444 KB gzip JS (24 chunks), one 28 KB-gzip
render-blocking stylesheet (not inlined), and a redundant font preload.

### Performance

- **Geist_Mono dropped** — `font-mono` is aliased to Geist Sans in `globals.css`, removing a
  ~30 KB render-blocking font preload on every route. Number-heavy live spots (nowcast
  countdown) keep fixed-width digits via `tabular-nums`.
- **framer-motion code-split** — the homepage `FlipClock` countdown is now a `next/dynamic`
  import, so framer-motion (~40 KB gzip) leaves the initial bundle and only loads when an
  announcement countdown is actually live.

### Known tradeoff

- The single render-blocking stylesheet (~28 KB gzip) is **not** inlined: `optimizeCss`
  (Beasties) is Webpack-only and we keep Turbopack for `next build` (build speed). Critical-CSS
  extraction also previously caused FOUC. `build:webpack` remains for an inlined-CSS build if
  ever needed.

### Follow-ups (both since done)

- ~~ML sparkline still pulls **recharts (~100 KB)** for one line~~ — done: migrated to the
  hand-rolled SVG in `components/home/ml-sparkline.tsx`; recharts removed from the dependencies.
- ~~Header `SearchCommand` ships **cmdk** on every page~~ — done: the palette is code-split via
  `next/dynamic` in `components/search/search-bar.tsx` and only loads on first open.

---

## 2.9.0 (2026-06-05) – Next.js 16 Cache Components (PPR)

Full migration to `cacheComponents: true` (Partial Prerendering). Pages now ship as a static,
edge-cached shell with the slow/live data streamed in via `<Suspense>` holes — the park page
serves `x-vercel-cache: PRERENDER` instead of dynamic SSR (TTFB drops from ~650 ms to the edge
cache). Details: [cache-components-migration](architecture/cache-components-migration.md).

### Caching

- All API fetchers moved to `'use cache'` + `cacheLife`/`cacheTag` (replaces `withServerCache`,
  `unstable_cache`, and `next: { revalidate }`). `lib/api/server-cache.ts` removed.
- The best-days calendar keeps `unstable_cache` for its **projected** result — the raw upstream
  response (~2.25 MB) exceeds Next's 2 MB fetch-cache cap, which would otherwise leave the
  `'use cache'` boundary uncached.
- Cached time helpers (`lib/utils/server-time.ts`); client-only `Date.now()`/`Math.random()`
  guarded behind Suspense or `typeof window`.

### Routing

- Park route gains `generateStaticParams` (top parks prebuilt, long tail on-demand ISR) — under
  Cache Components every dynamic route must enumerate ≥1 param, else `await params` in a
  param-less placeholder shell counts as uncached data outside `<Suspense>`.

### Fixes

- Non-existent parks/attractions now return **404**, not 500 — a throw across a `'use cache'`
  boundary bypasses the caller's `catch` and surfaced as a 500.
- **Skeleton fallbacks** for the deferred, client-rendered card time bits (park-card
  schedule/countdown, show-card showtimes, attraction-card best-time) — no layout shift.

### Performance

- Weather-background canvas animation pauses when off-screen (`IntersectionObserver`).
- `dns-prefetch` for the analytics origin (the only third-party the browser contacts).

## 2.8.0 (2026-04-25) – Codebase Refactoring

### Shared Hooks (`lib/hooks/use-mounted.ts`)

- **`useMounted()`** — returns `true` after hydration (replaces `useState + useEffect` pattern across 5 components).
- **`useBrowserTimezone()`** — returns browser timezone string after mount.
- **`useBrowserNow(intervalMs)`** — returns a `Date` refreshed every `intervalMs` ms; pass `null` for one-shot (no interval). Replaces `setInterval` in `PeakHourBadge` and `ParkTimeInfo`.

### FAQ Helpers (`lib/faq/`)

- **`lib/faq/attraction-faq.ts`** — `buildAttractionFaqItems()` extracts FAQ Q1–Q4 logic from `AttractionFaqSection` and `AttractionFaqStructuredData`.
- **`lib/faq/park-faq.ts`** — `buildParkFaqItems()` (Q1–Q6) and `getParkArticleForms()` shared by `ParkFAQSection` and `faq-structured-data`.

### Shared Sparkline (`components/parks/sparkline.tsx`)

- Generic `<Sparkline points[] formatTooltip />` component with global-mousemove tooltip (portal to `document.body`).
- `WaitTimeSparkline` and `HourlyP90Sparkline` are now thin wrappers.

### Duration Formatting (`lib/i18n/time.ts`)

- **`formatDuration(diffMs, t)`** — formats milliseconds as `"Xh Ym"` / `"Xh"` / `"Ym"`. Used in `PeakHourBadge` and `ParkTimeInfo`.

### Howto Page Split (`app/[locale]/howto/`)

- `page.tsx` — metadata shell only (~236 lines).
- `_howto-ui.tsx` — shared UI atoms: `Section`, `SubSection`, `DemoBadge`, `InfoBox`, `TipBox`, `PersonaCard`, `Li`.
- `_mock-components.tsx` — demo components: `MockParkHeader`, `MockAttractionCards`, etc.
- `_live-calendar.tsx` — async server component that fetches live Phantasialand calendar data.
- `content/[locale].tsx` — per-locale content (de/en/es/fr/it/nl).

### Dead Code Removed

- `components/search/hero-search-button.tsx` — unused
- `components/home/scroll-indicator.tsx` — unused
- `components/common/truncated-text.tsx` — unused
- Removed dead `FeaturedParksSection` async function from `featured-parks-section.tsx`
- Removed `'use client'` from `glossary-background.tsx` and `glossary-inject-term.tsx`

---

## 2.7.0 (2026-03-15) – Glossary System

### Complete Glossary Launch

- **90 terms** across 7 categories: wait-times, crowd-levels, park-operations, planning, attractions, coasters, coaster-elements
- All terms with full definitions in 6 languages (EN/DE/FR/IT/NL/ES) — multi-paragraph format (`\n\n` separator), locale-appropriate park references
- Localized URL segments: `/glossary`, `/glossar`, `/glossaire`, `/glossario`, `/woordenlijst`, `/glosario`

### Design & UX

- **Random hero background** on all glossary pages (`GlossaryBackground` component, no Ken Burns animation)
- **Glass UI**: unified glass panel on overview (breadcrumb above panel; title + description + search inside); glass cards on detail page
- **Type-to-search**: typing anywhere on overview focuses the search input; ESC clears + blurs
- **Category filter pills** with instant client-side filtering
- **Detail page**: 2-column layout, multi-paragraph definition rendering, primary-color back button
- **Homepage extras on detail pages**: `NearbyParksCard`, `FavoritesSection`, `FeaturedParksSection` below each term

### Navigation

- **Header**: removed "Startseite" from desktop nav; reordered to Parks entdecken → Glossar → Anleitung
- **Homepage hero**: added glossary link ("Wichtige Freizeitparkbegriffe") next to the howto link in all 6 locales
- **Howto page**: removed `max-w-4xl` constraint — now full container width like other pages

### SEO & Indexing

- Glossary added to sitemap: 6 overview pages (priority 0.7) + ~540 term pages (priority 0.5)
- IndexNow aligned to sitemap scope: home, howto, glossary overview, parks, attractions
- Improved `generateMetadata` on both overview and detail pages: keyword-rich titles, `overviewKeywords` meta tag, locale-specific `termTitleSuffix`
- Schema.org: `DefinedTermSet` + `DefinedTerm` with `inLanguage`, `termCode`, localized descriptions

### Bug Fixes

- **Language switcher 404**: now extracts pathname from hreflang `<link>` tags instead of using full production URL — works on localhost and production
- **Breadcrumb double-locale** (`/de/de/glossar`): fixed by removing locale prefix from breadcrumb URL (next-intl `Link` adds it automatically)

→ [Glossary System](features/glossary.md) · [Sitemaps](seo/sitemaps.md)

---

## 2.6.4 (2026-03-05) – SEO: Featured Parks, Split Sitemaps, ItemList

### Featured Parks Section (Homepage)

- New `FeaturedParksSection` component on homepage — 6 locale-specific park cards with live data (status, crowd level, wait times, opening hours).
- Parks resolved from existing `geoData` (no extra API call; `CACHE_TTL.geo = 120s`).
- Locale configs based on TEA 2024 attendance data + language-market wait-time search relevance.
- Translated country names via `tGeo('countries.*')`.
- Positioned after FavoritesSection — first "browse parks" content above the fold.

### Sitemap Split (Next.js-native via `generateSitemaps()`)

- Single `app/sitemap.ts` with `generateSitemaps()` — three sub-sitemaps: `/sitemap/0.xml` (home+parks), `/sitemap/1.xml` (attractions), `/sitemap/2.xml` (geo hub pages).
- Geo hub pages (continent/country/city) were completely missing from any sitemap before — now covered with correct priorities (0.6–0.8).
- Attraction variant slugs (e.g. `taron-2`) excluded — noindex pages pointing to canonical base slug.
- Single-park city pages excluded — they 301-redirect to the park page.
- `robots.txt` references single sitemap index `/sitemap.xml` (auto-generated by Next.js).

### ItemList Structured Data

- Added `ItemListStructuredData` to `/parks` overview page (continents). All listing levels now have ItemList schema.

### Docs

- New: [docs/seo/featured-parks.md](seo/featured-parks.md) — how to update park lists, slug collision notes, SEO rationale.
- New: [docs/seo/sitemaps.md](seo/sitemaps.md) — full sitemap strategy, priorities, exclusions.
- Updated: [docs/seo/analysis.md](seo/analysis.md) — completed items marked done, open items updated.

→ [SEO Analysis](seo/analysis.md) · [Featured Parks](seo/featured-parks.md) · [Sitemaps](seo/sitemaps.md)

---

## 2.5.12 (2026-02-08) – Docs vs Code alignment

- **URL helpers:** Added `getParkUrlFromAttractionUrl()` in `lib/utils/url-utils.ts`; use in `nearby-parks-card` instead of manual `split('/attractions/')`. Park URLs from API now always go through `convertApiUrlToFrontendUrl()`.
- **Translation helpers:** Replaced `t(\`countries.${slug}\`)`/`t(\`continents.${x}\`)`with`translateCountry`/`translateContinent`across geo pages (parks, continent, country, city, park, attraction). Missing keys are now logged via`logMissingTranslation`.

→ [Translation System](i18n/translations.md), [Routing & URLs](architecture/routing-and-urls.md), [Notes for Sessions](development/notes-for-sessions.md)

---

## 2.5.5 (2026-01-25) – 404 prevention

- Redirect logic for malformed URLs (e.g. missing city segment).
- Nearby Parks use `convertApiUrlToFrontendUrl(url)` instead of building from name fields.

→ [Routing & URLs](architecture/routing-and-urls.md), [Troubleshooting](troubleshooting/common-issues.md)

---

## 2.5.6 (2026-01-25) – Link prefetch

- Prefetch only when `status === 'OPERATING'` for park/attraction links.
- `prefetch={false}` for header/footer and discovery/geo cards.

→ [Routing & URLs – Link Prefetching](architecture/routing-and-urls.md#link-prefetching)

---

## P50 / "Normal" display

- API returns `moderate` for typical day (P50 baseline); frontend displays **"Normal"** (green) in all locales.

→ [Backend Integration – Crowd Levels](api/backend-integration.md#crowd-levels-p50--normal), [Backend crowd-levels doc](https://github.com/park-fan/v4.api.park.fan/blob/main/docs/analytics/crowd-levels.md)

---

## Related

- [README](README.md) – Doc index
- [Conventions](development/conventions.md) – Key rules
