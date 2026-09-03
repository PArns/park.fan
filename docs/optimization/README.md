# Kosten-Optimierung — Stand und Einstieg

Einstiegspunkt für den Optimierungs-Track. **Wer hier neu ankommt, liest diese Datei zuerst
und dann `decisions.md`.**

- [baseline-profile.md](./baseline-profile.md) — die Messung vom 2026-09-01, gegen die alles
  verglichen wird.
- [decisions.md](./decisions.md) — ein Eintrag je akzeptierter, abgelehnter oder verschobener
  Änderung, mit der Messung, die sie begründet.

---

## Ergebnis der Runde vom 2026-09-03

Nach zwei PRs und drei Dashboard-Änderungen, gegen Produktion gemessen:

|                                                                                       | vorher                                  | nachher                                     |
| ------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------- |
| 308 auf ausgelaufene Monats-URL                                                       | `BYPASS`, jedes Mal 72.190 B aus Vercel | **HIT**                                     |
| 404                                                                                   | MISS                                    | **HIT**                                     |
| Geo-Hubs (`/de/parks/europe` …)                                                       | `DYNAMIC`                               | **HIT**                                     |
| Startseite, Blog, Feeds, Glossar, fancast, Guides, Rechtsseiten, Sitemaps, `llms.txt` | `DYNAMIC`, kein Fenster                 | **HIT**, Fenster im Repo                    |
| `/de/search`, `/admin`                                                                | kein Cache                              | **weiterhin kein Cache** (BYPASS / DYNAMIC) |

Der 308-Fix ist der einzige mit sofortiger Wirkung: auf der Kalender-Route sind ~36 % der
Requests solche Redirects, also **~5.600 Invocations und ~400 MB pro 12 h**, rund 40 % ihrer
Transferzeile, für Antworten, deren einzige Nutzlast ein `Location`-Header ist.

**Die HIT-Quote bewegt sich noch nicht, und das ist kein Widerspruch.** Direkt nach dem Deploy
gemessen: Rides 7 %, Kalender 12 % — unverändert. Eine URL wird erst zum HIT, wenn sie
**innerhalb** ihres Fensters ein zweites Mal angefragt wird, und das Crawl-Intervall einer
Ride-URL ist ~42 h. Der Cache füllt sich also über ein bis zwei Tage, nicht über eine Stunde.

**Der Frühindikator ist das `age`, nicht die Quote.** Höchstes beobachtetes `age` direkt nach
dem Deploy: 20.387 s (5,7 h) — Einträge aus der Zeit des 12-Stunden-TTL. Sobald ein `age`
über **43.200 s** auftaucht, ist ein Eintrag im 48-Stunden-Fenster entstanden und das neue
Fenster wirkt. Danach lohnt die Quote wieder.

Zu messen mit `./scripts/check-cdn-cache.sh hitrate`.

---

## Der Stand in einem Satz

Nach zwei Tagen Arbeit sind **die zwei teuersten Routen der Site unverändert teuer**, und das
ist kein Fehlschlag der umgesetzten Änderungen, sondern eine Folge davon, dass **keine von
ihnen auf die Zeile gezielt hat, die man im Vercel-CDN-Tab abliest**.

Gemessen am 2026-09-03 gegen Produktion:

| Route                                 | Requests / 24 h | Fast Data Transfer | Ø Antwort |
| ------------------------------------- | --------------: | -----------------: | --------: |
| `…/[park]/wait-time-calendar/[…date]` |            17 K |               1 GB |   58,9 kB |
| `…/[park]/[attraction]`               |            26 K |               1 GB |   44,5 kB |

Und die Zahl, die beide erklärt:

| Stichprobe aus der echten Sitemap | n   | Cloudflare HIT | Rest geht an Vercel |
| --------------------------------- | --- | -------------: | ------------------: |
| Ride-URLs                         | 40  |       **10 %** |            **90 %** |
| Kalender-URLs                     | 40  |       **12 %** |            **88 %** |

Neun von zehn Abrufen dieser beiden Routen erreichen Vercel und lösen dort einen vollen
`force-dynamic`-Render aus. Solange sich diese Quote nicht bewegt, bewegt sich die Rechnung
nicht — **jedes Byte, das man aus dem Payload schneidet, wirkt nur auf die 10 %, die man
ohnehin schon nicht bezahlt hätte.**

---

## Warum die Arbeit vom 01./02.09. dort nichts sichtbar macht

Fünf Änderungen sind gelandet. Keine davon konnte diese beiden CDN-Linien senken, und das
lässt sich je einzeln begründen:

| Änderung                                                   | Zielt auf                  | Warum im CDN-Tab dieser Routen unsichtbar                                                                      |
| ---------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `cache()` um `getParkByGeoPath` (`b986229`)                | CPU pro Invocation         | Spart einen Parse pro Request. Steht im **Compute**-Tab, nicht im CDN-Tab. Ändert weder Requests noch Bytes.   |
| Prewarm-Cron 6 → 1 Locale (`23cf578`)                      | Invocations                | Wärmt die **Park**-Route, nicht diese zwei.                                                                    |
| Kalender-Span `back: 12 → 3` (`ca75b9f`)                   | zukünftige Crawl-Nachfrage | Kürzt die **Sitemap**. Crawler halten die alten URLs noch wochenlang — und siehe unten, kurzfristig teurer.    |
| ISR-Uhr, 5.032 → 657 Regenerationen (`33030f5`, `c8aa96a`) | ISR-Writes                 | Betrifft **prerenderte** Seiten (Glossar, Blog, Hubs). Beide Routen hier sind `force-dynamic`, also nie dabei. |
| SWR auf `/calendar` (Backend)                              | Latenz                     | Ändert keine Byte- und keine Invocation-Zahl.                                                                  |

Das ist der wichtigste Punkt für jede neue Session: **die Änderungen waren richtig, die
Erwartung war falsch adressiert.** Wer die Wirkung des Memoize sehen will, muss in den
Compute-Tab (Active CPU pro Invocation) schauen, nicht in den CDN-Tab.

### Eine Änderung hat kurzfristig verschlechtert

Der Span-Schnitt hat **6.390 Kalender-URLs verwaist**. Die werden weiter gecrawlt und
antworten jetzt mit `308`. Gemessen am 2026-09-03, drei verschiedene Monats-URLs:

```
HTTP 308 · 72.235 B · KEIN content-encoding · cf-cache-status: BYPASS
```

Ein Redirect kostet also **72 kB unkomprimiert** gegen ~58 kB brotli für die Seite, die er
verweigert — das **1,24-fache**, und er wird von Cloudflare **nie** gecacht, geht also
garantiert und dauerhaft an Vercel. Der Schnitt bleibt richtig (die Anfragen enden
irgendwann), aber er hat den Wert des 308-Fixes vervielfacht.

### Das Caching-Panel im Vercel-CDN-Tab zeigt „nichts gecacht" — und das ist korrekt

17 K bzw. 26 K in einer einzigen Kategorie. Das ist **Vercels eigener** Cache
(`x-vercel-cache`), und beide Routen sind `export const dynamic = 'force-dynamic'`: es gibt
per Konstruktion nichts zu treffen. Das ist kein Defekt, sondern die Entscheidung aus
PR #147 — der Versuch, sie statisch zu machen (PR #118), hat 220–410 K ISR-Write-Units pro
Tag erzeugt. Siehe `docs/troubleshooting/isr-write-explosion.md`.

**Konsequenz:** Auf diesen beiden Routen kann nur **Cloudflare** cachen. Vercels Panel wird
immer 100 % Miss zeigen. Die Zahl, die zählt, ist `cf-cache-status`, und die steht in keinem
Vercel-Chart — sie steht oben in dieser Datei: 10 % und 12 %.

### Der Kalender: rund ein Drittel seiner Requests sind die 308er

Im Requests-Chart der Kalender-Route liegt die 3XX-Linie bei ~100 gegen ~200–250 gefüllte
2XX — 3XX ist dort die zweitgrößte Kategorie (auf der Ride-Route steht 3XX hinter 4XX und
beide sind flach). Das deckt sich mit der unabhängigen Auflösung aus der Egress-Identität vom
02.09.: **~36 % der Kalender-Invocations**.

Gerechnet auf die abgelesenen 17 K und 1 GB: **~5.600 Redirects × 72 kB ≈ 400 MB**, also
**~40 % der Transferzeile dieser Route** für Antworten, deren einzige Nutzlast ein
`Location`-Header sein sollte. Das ist der größte einzelne, sofort behebbare Posten auf der
ganzen Site — und er ist ein Dashboard-Feld (Hebel ① unten).

---

## Was tatsächlich funktioniert — und was daran noch fehlt

**Cloudflare cacht die HTML.** Das war lange die offene Frage und ist beantwortet: trotz
`Cache-Control: private, no-cache, no-store` vom Origin liefert der zweite Abruf derselben
URL `cf-cache-status: HIT`. Die Cache Rule aus PR #288 greift. Auch RSC-Antworten
(`text/x-component`) und 404er werden gecacht.

**`CDN-Cache-Control` kommt auf der Wire an.** Das ist die Verifikation, die der Kommentar in
`next.config.ts` ausdrücklich verlangt hat, und sie ist bestanden:

```
/de/…/wartezeiten-kalender/2026/10 → cdn-cache-control: public, s-maxage=86400, stale-while-revalidate=86400
/de/…/wartezeiten-kalender         → cdn-cache-control: public, s-maxage=3600,  stale-while-revalidate=3600
```

Damit ist der Weg frei, das Edge-TTL aus dem Dashboard in dieses Repo zu holen. **Was fehlt:
Ride- und Park-Seiten tragen den Header nicht** — sie hängen zu 100 % an der Dashboard-Regel.

**Was der Header heute nicht tut:** solange die Cloudflare-Regel auf „Ignore cache-control
header and use this TTL" steht, wird er ignoriert. Bewiesen am 308: der trägt
`cdn-cache-control: public, s-maxage=86400` **und ist trotzdem BYPASS**. Der Header ist
Vorbereitung, keine Wirkung.

### Am 2026-09-03 nachgezogen: der Präfix ist jetzt lückenlos

`next.config.ts` setzt `CDN-Cache-Control` jetzt für **jede** Seite unter `/*/parks/*`, nicht
mehr nur für den Kalender. Gegen `pnpm build && pnpm start` verifiziert:

| Pfad                           |        `s-maxage` | Begründung                                                          |
| ------------------------------ | ----------------: | ------------------------------------------------------------------- |
| Geo-Hubs (`/parks` … `/:city`) |        3600 (1 h) | prerendert, Live-Teile kommen per Client-Poll                       |
| Park-Seite                     |        3600 (1 h) | der Backend-Tag-Push bei Statusflips darf nicht ersticken           |
| **Ride-Seite**                 | **172800 (48 h)** | Crawl-Intervall ~42 h gegen ~6–12 h TTL — der Kern des Problems     |
| Kalender-Hub                   |        3600 (1 h) | rendert den _aktuellen_ Monat, darf keinen Monatswechsel überdauern |
| Kalender-Monat                 |      86400 (24 h) | bestand schon                                                       |
| `/de/blog`, `/api/*`           |       unverändert | keine Übergriffigkeit — gegengeprüft                                |

Das war **nicht** nur Bequemlichkeit: die Cloudflare-Regel matcht `/*/parks/*`. Hätte man sie
auf „use cache-control header if present" umgestellt, während die Geo-Hubs und die Park-Seite
keinen Header tragen, wären genau die schlagartig **gar nicht** mehr gecacht worden.

**Noch offen und erst nach dem Deploy prüfbar:** ob Vercel diese neuen Header genauso
durchreicht wie den des Kalenders. Für den Kalender ist es gegen Produktion bewiesen (der
Header steht in der Antwort, die durch Vercel _und_ Cloudflare gelaufen ist), für die neuen
Regeln steht die Bestätigung aus. `curl -sI` auf eine Ride-URL nach dem Deploy — **die
Cloudflare-Regel darf nicht umgestellt werden, bevor das bestätigt ist.**

---

## Die Rangfolge der offenen Hebel

Die ersten beiden liegen im **Cloudflare-Dashboard**. Kein Refactor in diesem Repo kommt in
ihre Nähe, und beide sind ein Formularfeld.

### Erledigt am 2026-09-03: die Regel steuert nichts mehr, der Header steuert alles

Die Regel heißt jetzt **„Frontend cache"** und hat keinen Pfad-Matcher mehr:

```
http.host eq "park.fan"
  and not starts_with(http.request.uri.path, "/api/")
  and not starts_with(http.request.uri.path, "/admin/")
```

| Einstellung                    | Wert                                                         |
| ------------------------------ | ------------------------------------------------------------ |
| Edge TTL                       | **Use cache-control header if present, bypass cache if not** |
| Status code TTL                | **308 → 12 h, 301 → 12 h, 404 → 1 h**                        |
| Serve stale while revalidating | **an**                                                       |

**Warum „bypass cache if not" ungefährlicher ist als es klingt** — und diese Session hat es
zuerst zu absolut formuliert: Cloudflare liest `Cloudflare-CDN-Cache-Control` → `CDN-Cache-Control`
→ **`Cache-Control`**. Der letzte ist ein Fallback, kein Ausschluss. Gemessen, bevor umgestellt
wurde:

| Was                                     | `Cache-Control`                       | Folge                     |
| --------------------------------------- | ------------------------------------- | ------------------------- |
| `/_next/static/*`, `/icon.svg`          | `public, max-age=31536000, immutable` | bleibt gecacht            |
| `/parks/*`                              | `no-store` **+ `CDN-Cache-Control`**  | gecacht, wie gewollt      |
| `/de/search`, `/contribute/thanks`      | `private, no-store`                   | bypass — richtig so       |
| prerenderte Seiten ohne eigenes Fenster | `public, max-age=0, must-revalidate`  | revalidiert, kein Schaden |

Dazu: **keine einzige `set-cookie`** auf `/de`, einer Ride-Seite oder `/admin` — nichts
Personalisiertes kann in den Cache geraten. Der `/admin`-Ausschluss ist trotzdem drin, als Zaun,
nicht als Reparatur. _(Er ist mit Schrägstrich geschrieben, `/admin/`, trifft also `/admin` selbst
nicht — unkritisch, weil diese Seite `max-age=0, must-revalidate` sendet und die Shell keine
Daten enthält, aber beim nächsten Anfassen der Regel gehört der Schrägstrich weg.)_

Seitdem entscheidet **allein dieses Repo**, was gecacht wird, und man sieht es im Diff.

#### Was mit den IP-abhängigen Routen ist (geprüft 2026-09-03)

Die naheliegende Sorge bei einem geteilten Cache: eine Seite, die nach der IP des Besuchers
rendert, wird einmal gerendert und dann allen ausgeliefert. Nachgesehen statt angenommen —
**es gibt keine solche Seite.**

Die IP wird an genau drei Stellen serverseitig gelesen, alle drei sind Route Handler unter
`/api/`, und `/api/` ist von der Cloudflare-Regel ausgeschlossen:

| Route                   | `Cache-Control`  | Cloudflare |
| ----------------------- | ---------------- | ---------- |
| `/api/nearby`           | `no-store`       | **BYPASS** |
| `/api/favorites`        | `no-store`       | **BYPASS** |
| `/api/contribute/start` | `no-store`       | —          |
| `/api/admin/session`    | (unter `/admin`) | —          |

Doppelt abgesichert also: der Pfad-Ausschluss **und** das `no-store` des Handlers.

**`NearbyParksSection` ist trotz des Namens keine Ausnahme.** Sie ist zwar eine Server
Component, bekommt aber `park.latitude`/`park.longitude` — die Koordinaten **des Parks**, nicht
des Besuchers (`park-page-shell.tsx:192`). „Parks in der Nähe dieses Parks" ist für jeden Leser
dieselbe Antwort und gehört in den Cache.

Alles Besucherabhängige läuft im Client, nach dem Mount: `useNearbyParks`, `useGeolocation`,
`use-distance-to`, `use-favorites`. Sie holen ihre Daten über die `no-store`-Routen oben, nie
über den Server-Render.

Die drei APIs mit einem Fenster (`/api/parks/live`, `/api/search`, `/api/weather/hourly`) sind
**parameterabhängig, nicht nutzerabhängig** — dieselben Query-Werte, dieselbe Antwort. Und
dazu passend: **keine `set-cookie`** auf einer HTML-Antwort (`proxy.ts:39` entfernt sie), also
kann auch von dort nichts Personalisiertes in den Cache geraten.

### Wie es vorher aussah (zur Einordnung)

Aus dem Dashboard abgelesen (Regel **„Park & Ride cache"**), damit sie niemand mehr raten muss:

```
http.host eq "park.fan"
  and http.request.uri.path wildcard r"/*/parks/*/*/*/*"
  and not starts_with(http.request.uri.path, "/api/")
```

| Einstellung                        | Ist-Wert                                          |
| ---------------------------------- | ------------------------------------------------- |
| Cache eligibility                  | Eligible for cache                                |
| Edge TTL                           | **Ignore cache-control header, TTL = 12 Stunden** |
| **Status code TTL**                | **nichts konfiguriert**                           |
| Vary                               | Normalize values                                  |
| **Serve stale while revalidating** | **nicht aktiviert**                               |
| Reihenfolge                        | Custom, nach „API caching – Frontend"             |

Vier Dinge folgen daraus, drei davon waren vorher Vermutung:

1. **Das Edge TTL ist 12 h.** Die Eingrenzung aus HIT-Altern stimmte. Gegen ein
   Ride-Crawl-Intervall von ~42 h liegt die HIT-Decke damit bei 12/(12+42) = **22 %**,
   gemessen sind es 10 %.
2. **Die Statuscode-TTL-Liste ist leer.** Deshalb ist der 308 nicht abgedeckt, fällt auf das
   `no-store` des Origin zurück und wird `BYPASS`. Das ist keine Nebenwirkung, das ist der
   ganze Grund.
3. **`stale-while-revalidate` wird heute nirgends ausgewertet.** Die Option ist aus, und
   „ignore cache-control" liest den Header ohnehin nicht. Die SWR-Werte, die dieses Repo
   mitschickt, sind bis dahin totes Gewicht — richtig, aber wirkungslos.
4. **Der Matcher verlangt vier Segmente nach `/parks/`.** `/de/parks/europe` und
   `/de/parks/europe/germany` fallen also gar nicht unter die Regel; sie sind deshalb
   `DYNAMIC`, nicht weil eine Einstellung fehlt. Die Header, die dieses Repo für die Geo-Hubs
   jetzt setzt, erreichen Cloudflare erst, wenn der Matcher sie einschließt.

_(Nebenbefund derselben Messung: `/de/parks/europe/germany/bruehl` — die Stadt-Ebene —
antwortet selbst mit `308`. Deshalb stehen `301` und `308` unten in einem Atemzug.)_

### Die Regel, wie sie aussehen sollte — in zwei Schritten

Der Matcher darf **einfacher** werden, nicht komplizierter. `/*/parks/*/*/*/*` verlangt vier
Segmente nach `/parks/`, um die Ride- und Park-Ebene zu treffen, und schließt dadurch die
Geo-Hubs aus, die sowieso gecacht gehören. Ein einziges Wildcard-Level tut dasselbe und mehr:

```
http.host eq "park.fan"
  and http.request.uri.path wildcard r"/*/parks/*"
  and not starts_with(http.request.uri.path, "/api/")
```

**Der `/api/`-Ausschluss muss bleiben.** Das erste `*` matcht jedes erste Segment, also auch
`api` — ohne die Zeile fängt die Regel `/api/parks/<geo>/<park>`, den Live-Poll, der alle fünf
Minuten frische Wartezeiten holen soll, und serviert ihn 12 Stunden alt. Genau davor warnt der
Kommentar in `next.config.ts`.

Die Reihenfolge der zwei Schritte ist nicht optional:

**Schritt 1 — jetzt, unabhängig von jedem Deploy, kein Risiko.**
Nur _eine_ Einstellung: **Status code TTL → `308` und `301`** ergänzen (TTL wie das Edge TTL,
12 h). Matcher und Edge TTL bleiben unangetastet. Damit hören die ~72 kB pro ausgelaufener
Monats-URL sofort auf. Erwartung: −5.000 Invocations und −353 MB pro 12 h.

**Schritt 2 — erst wenn PR #389 in Produktion ist und `scripts/check-cdn-cache.sh headers`
für alle Pfade einen Wert zeigt.** Dann drei Änderungen zusammen:

1. Matcher auf `/*/parks/*` vereinfachen (nimmt die Geo-Hubs mit auf).
2. Edge TTL → **„Use cache-control header if present, bypass cache if not"**.
3. **„Serve stale content while revalidating" einschalten** — sonst bleibt das
   `stale-while-revalidate` aus den Headern ungenutzt.

**Diese drei in der falschen Reihenfolge sind ein Rückschritt, kein Fortschritt:** stellt man
auf „use cache-control" um, solange Ride-, Park- und Hub-Seiten keinen Header tragen, fallen
sie auf ihr `no-store` zurück und werden **gar nicht** mehr gecacht — schlechter als die
heutigen 10 %.

Nach Schritt 2 ist der Statuscode-Eintrag aus Schritt 1 möglicherweise überflüssig, weil der
308 dann selbst ein `cdn-cache-control` trägt (die Monats-Regel in `next.config.ts` greift auf
ihm). Das ist eine Vermutung — nachmessen, nicht vorher entfernen.

### ① Statuscode-TTL für 308 und 301 auf der Parks-Cache-Rule

**Cloudflare → Caching → Cache Rules → die `/*/parks/*`-Regel → Edge TTL → Statuscode-TTL.**

Heute ist nur `200` mit einem TTL versehen; `308` fällt durch, Cloudflare sieht das
`no-store` des Origin und antwortet `BYPASS`. Sieben von sieben geprüften Proben (gestern)
plus drei von drei (heute) liefern ein konstantes, byte-identisches `Location` — den
Kalender-Hub des Parks. Das ist sicher cachebar.

Erwartung aus der Messung vom 02.09.: **−5.000 Invocations und −353 MB pro 12 h** auf der
Kalender-Route.

### ② Edge TTL nach Pfadfamilie, statt einer Zahl für `/*/parks/*`

Zwei Zahlen fehlen und beide stehen nur im Dashboard:

- ~~**Welches Edge TTL trägt die Regel?**~~ **Beantwortet: 12 Stunden.** Zu heben auf 48 h
  für die Ride-Familie — und dabei „Serve stale content while revalidating" einschalten, sonst
  bleibt das `stale-while-revalidate` aus den Headern ungenutzt.
- **Läuft Tiered Cache?** `decisions.md` (01.09.) sagt „Smart Tiered Cache aktiv". Smart
  Topology ist [auf allen Plänen inkl. Pro verfügbar](https://developers.cloudflare.com/cache/how-to/tiered-cache/);
  Generic Global ist Enterprise. Nicht von hier prüfbar — **alle Messungen dieser Session
  kamen aus einem einzigen Colo (`cf-ray …-IAD`)**, weil der Agent-Proxy dort sitzt. Der Test
  braucht zwei Regionen: dieselbe kalte URL binnen einer Minute; HIT beim zweiten Abruf aus
  einem anderen Colo = an.

Die Ride-Route ist der Fall, an dem die Zahl hängt: ihr Crawl-Intervall ist ~42 h, ihr Edge
TTL 12 h. **Der Cache kann sich nie füllen** — die theoretische Obergrenze liegt bei
12/(12+42) = 22 %, gemessen sind es 10 %. Bei 48–72 h steigt die Decke auf 53–63 %.

**Der ehrliche Preis:** nichts in diesem Repo und nichts im Backend kann Cloudflare purgen.
Eine kuratierte Korrektur an einer Bahn bleibt so lange unsichtbar, wie das TTL läuft.
Deshalb 48–72 h als erster Schritt und 7 Tage als Decke, nicht als Startwert. Wer das TTL
weiter heben will, baut vorher einen Cloudflare-Purge in `/api/revalidate` ein.

Umstellung der Regel auf „Use cache-control header if present" ist erst möglich, wenn **alle**
Seiten unter `/*/parks/*` einen `CDN-Cache-Control` tragen — sonst fallen die ohne Header auf
`no-store` zurück und werden schlagartig gar nicht mehr gecacht. Auf Pro ist Origin Cache
Control [immer an und nicht abschaltbar](https://developers.cloudflare.com/cache/concepts/cache-control/),
und Cloudflare liest [`Cloudflare-CDN-Cache-Control` > `CDN-Cache-Control` > `Cache-Control`](https://developers.cloudflare.com/cache/concepts/cdn-cache-control/).

### ③ Prerenderte Seiten sind `cf-cache-status: DYNAMIC`

Die Cache-Rule deckt nur `/*/parks/*`. Glossar, Blog, Startseite und Geo-Hubs verlassen bei
**jedem** Request Vercel — keine Invocations, reiner Egress, Decke ~7 GB/Monat.

### ④ Danach erst Code

Die Payload-Hebel aus `decisions.md` (Allow-Liste für `leanParkForShell`, der
`parks`-Namespace auf der Ride-Route mit gemessenen −5,7 kB brotli, der `hasDayCurve`-Flag
gegen ~92 % garantierte 404er) bleiben gültig. Sie wirken aber nur auf die Requests, die
Cloudflare durchlässt — **nach ① und ② sind das weniger, also ist ihr absoluter Wert danach
kleiner, nicht größer.** Reihenfolge einhalten.

---

## Fallen, die diese Session gekostet haben

- **Der CDN-Tab und der Compute-Tab messen verschiedene Dinge.** Eine CPU-Optimierung ist im
  CDN-Tab per Konstruktion unsichtbar. Vor „keine Verbesserung" prüfen, ob die Änderung
  überhaupt auf diese Zeile zielen konnte.
- **Ohne Cache-Buster misst man Cloudflare, nicht die App.** `?cb=$RANDOM` gehört an jede
  Payload-Messung — und _weg_ von jeder Cache-Verhaltens-Messung.
- **`--compressed` allein reicht nicht**, um die Wire-Größe zu beurteilen: der 308 ignoriert
  `Accept-Encoding` komplett und schickt 72 kB Klartext.
- **Sitemap-Kürzungen wirken erst mit Wochen Verzögerung** und in der Zwischenzeit gegen
  einen: verwaiste URLs werden weiter gecrawlt und kosten mehr als die Seite, die sie ersetzt.
- **Vercel-Logs sind aus dieser Umgebung nicht erreichbar** (keine `vercel` CLI, kein Token,
  Vercel-MCP ohne Team-Zugriff). Alles hier ist von außen per `curl` gemessen. Wer den
  Statuscode-Split der 17 K Kalender-Requests braucht, muss ihn im Dashboard ablesen.

## Offene Messfragen

Zum Nachmessen liegt **`scripts/check-cdn-cache.sh`** im Repo, in vier Modi (`headers`,
`cache`, `hitrate`, `redirect`). Er trennt die beiden Messarten, deren Verwechslung diese
Session gekostet hat: was der Origin **deklariert**, braucht einen Cache-Buster; was
Cloudflare **tut**, darf keinen haben, weil der zweite Abruf derselben URL die ganze Messung
ist.

| Frage                                            | Wie                                                                              |
| ------------------------------------------------ | -------------------------------------------------------------------------------- |
| Läuft Tiered Cache?                              | Dieselbe kalte URL binnen einer Minute aus zwei Regionen abrufen                 |
| Wie viele der 17 K Kalender-Requests sind 308er? | Vercel-Logs nach Statuscode, oder Cloudflare Path Analytics                      |
| User-Agent-Split des Sweeps                      | Cloudflare AI Crawl Control — entscheidet, ob Caching oder ein Block richtig ist |
