# Bahnprofil: Layout-Rail, Hero-Fakten und echtes Ride-Ranking

**Datum:** 2026-07-28
**Repos:** `park.fan` (Frontend), `v4.api.park.fan` (Backend)
**Worktrees:** `park.fan/.claude/worktrees/bahnprofil` (`worktree-bahnprofil`) ·
`v4.api.park.fan/.claude/worktrees/glossary-ride-ranking` (`feat/glossary-term-ride-ranking`)

## Ausgangslage

Der Ride-↔-Glossar-Link ist mit #252 gelandet. Drei Dinge daran stimmen nicht:

1. Auf den Glossar-Termseiten erscheint **keine** Liste von Bahnen, obwohl die Komponente
   verdrahtet ist.
2. Die Bahnprofil-Sektion auf der Ride-Seite liest sich als Inhaltsverzeichnis: neun
   gleichförmige Zeilen über einem Hero-Foto, kaum lesbar, ohne Gefühl für die Fahrt.
3. Die Ride-Seite wirft einen Hydration-Error.

Dazu zwei Wünsche: die Kernfakten (Hersteller, Baujahr, Inversionen) gehören sichtbar in
den Seitenkopf, und die Termseite soll die **wichtigsten** Bahnen zuerst zeigen statt
alphabetisch bei „Adventureland Resort" anzufangen.

## Untersuchungsergebnisse

### Warum keine Bahnen erscheinen

`lib/api/glossary-rides.ts` ruft `/glossary/terms/…` ohne das `/v1`-Präfix auf, das jedes
andere API-Modul im Repo benutzt. Gegen Produktion verifiziert:

```
/glossary/terms/launch/attractions      → 404
/v1/glossary/terms/launch/attractions   → 200, total: 92
/v1/glossary/terms/counts               → 200
```

Beide Funktionen fangen Fehler ab und geben `[]` zurück — der 404 wird also still
verschluckt und `GlossaryTermRides` rendert `null`. Die Komponente selbst ist korrekt.

`getRideCountsByTerm` wird derzeit von niemandem importiert.

### Warum der Hydration-Error auftritt

Der startupbar-Loader (`components/common/startup-bar.tsx:50`) steht als `async`-Script im
Server-HTML — bewusst, weil startupbar.co die Installation durch Abruf der Seite prüft. Er
läuft vor Reacts Hydration und schreibt `data-startupbar-shifted`,
`data-startupbar-original-top` und `style="top:36px"` direkt auf den `<header>`. React
vergleicht dann sein Server-HTML mit einem bereits veränderten DOM.

Betroffen ist jedes Element mit `top: 0`, das der Loader-Sweep verschiebt:
`header.tsx:101` (bestätigt), `park-background.tsx:46`, `language-banner.tsx:116`.

### Warum „Top nach Wartezeit" im Frontend nicht ging

`/v1/glossary/terms/{id}/attractions` sortiert nach Parkname, dann Ride-Name, und kennt nur
`limit`. Live-Wartezeit als Ranking wäre irreführend: `/v1/analytics/ticker` zeigt gerade
Beto Carrero und Epic Universe oben — schlicht, weil dort gerade offen ist. Um 3 Uhr nachts
stünde Taron auf 0 und fiele aus jeder Top-3, ohne dass sich an der Bahn etwas geändert
hätte. Wartezeit misst den Moment des Hinsehens, nicht die Bahn.

Die Datenbank hat aber das richtige Signal bereits: **`attraction_p90_baselines`** —
P90-Wartezeit je Attraktion über 548 Tage, mit `confidence` (`high`/`medium`/`low`),
`sampleCount`, `distinctDays` und `isHeadliner`, täglich per Cron berechnet. Das ist ein
stabiles Maß für „wie dick ist diese Bahn üblicherweise", unabhängig von der Tageszeit.

`HttpCacheInterceptor` setzt ausschließlich Cache-Header und führt keinen serverseitig
geschlüsselten Cache. Cloudflare nimmt den Query-String in den Cache-Key auf, ein neuer
`sort`-Parameter ist damit ein eigener Cache-Eintrag.

## Getroffene Entscheidungen

| Entscheidung                | Gewählt                                              | Begründung                                                                                  |
| --------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Darstellung der Fahrfiguren | Strecken-Rail + gemeinsamer 3-D-Viewer                | Liest sich als Fahrt statt als Liste; nutzt den vorhandenen `CoasterPlayer` wieder            |
| Rail-Farben                 | 5 Wirkungsklassen                                     | Man *sieht*, wo angeschoben wird und wo die Airtime sitzt                                     |
| Hero-Fakten                 | Gestaffelt (Mobil reduziert)                          | Der Kopf trägt schon Park, Distanz, Land, Höhe, RCDB — ungefiltert wären das vier Zeilen      |
| Kartenkontrast              | `GlassCard variant="strong"`                          | Vorhandene Variante, kein neuer Code; über unvorhersehbaren Fotos verlässlich                 |
| Ride-Ranking                | Neuer `sort`-Parameter im Backend, P90 über 548 Tage  | Das einzige stabile Signal; beantwortet die ursprüngliche Frage („die dicksten Bahnen") richtig |
| `getRideCountsByTerm`       | Als Zähler-Badge auf den Glossar-Karten verwerten     | Daten stimmen nach dem `/v1`-Fix                                                              |

## Backend (`v4.api.park.fan`)

### Sortier-Parameter

`GET /v1/glossary/terms/:termId/attractions` bekommt `sort`:

- `park` — **Default**, heutiges Verhalten, rückwärtskompatibel
- `popularity` — nach typischer Spitzenwartezeit

`RideProfileService.findAttractionsByTerm(termId, limit, sort)` erhält einen
`LEFT JOIN attraction_p90_baselines b ON b."attractionId" = profile."attractionId"` und
selektiert `b.p90Baseline`, `b.confidence`, `b.isHeadliner`.

Reihenfolge bei `popularity`:

1. Confidence-Bucket (`high` = 0, `medium` = 1, `low`/fehlend = 2) — eine Bahn mit fünf
   Messpunkten darf die Liste nicht anführen
2. `p90Baseline DESC NULLS LAST`
3. Parkname, Ride-Name als stabiler Tiebreak (deterministische Reihenfolge bei
   Gleichstand)

Der `LEFT JOIN` ist bewusst kein `INNER JOIN`: Bahnen ohne Baseline sinken nach unten,
verschwinden aber nicht aus der Liste. Die Gesamtzahl bleibt damit über beide Sortierungen
identisch — sonst zeigte der Zähler „151 Bahnen" und die Liste enthielte 96.

### DTO

`TermAttractionDto` bekommt zwei Felder:

- `typicalPeakWait: number | null` — gerundete P90-Minuten, `null` ohne Baseline
- `isHeadliner: boolean`

Damit kann das Frontend auf den hervorgehobenen Karten „typisch bis 75 min" zeigen — eine
Zahl, die stimmt, wenn man sie liest, und morgen noch stimmt.

### Tests

- `sort=park` liefert unverändert die alphabetische Reihenfolge (Regression)
- `sort=popularity` ordnet nach P90 absteigend
- Eine `low`-Confidence-Bahn mit hohem P90 landet hinter einer `high`-Confidence-Bahn mit
  niedrigerem P90
- Bahnen ohne Baseline erscheinen weiterhin, am Ende
- Unbekannter `sort`-Wert fällt auf `park` zurück statt zu werfen

## Frontend (`park.fan`)

### Bugfixes

- `lib/api/glossary-rides.ts` — `/v1`-Präfix an beiden Pfaden
- `suppressHydrationWarning` auf die Elemente, die der Loader vor der Hydration anfasst,
  je mit Kommentar auf `startup-bar.tsx`. Reacts dokumentierter Ausweg für „Fremdcode hat
  das DOM verändert"; die Verschiebung *soll* bestehen bleiben, React patcht sie ohnehin
  nicht zurück. Nur dort setzen, wo ein Mismatch nachweislich entstehen kann —
  `language-banner.tsx` ist `'use client'` und rendert je nach Mount-Guard serverseitig
  eventuell gar nicht.

### Hero-Kopf

Das Problem ist nicht die Dichte, sondern dass Navigationslink, Live-Distanz,
Kategorie-Label und Fremdlink in einer Reihe gleich wichtig aussehen. Zwei Ebenen, getrennt
durch `border-t border-border/40`:

```
Taron – Aktuelle Wartezeit                                ★
◎ Phantasialand   412 km   [Mystery]   [Saison]
──────────────────────────────────────────────────────────
⚒ Intamin  📅 2016  ↺ 0 Inv.  📏 Ab 140 cm  RCDB↗   9 Figuren ›
```

Oben „wo bin ich", unten „was ist das für ein Ding". Die zweite Ebene entfällt komplett,
wenn eine Attraktion weder Metadaten noch Profil hat. `9 Figuren ›` sitzt per `ml-auto`
rechts und ist als einziges Element getönt, weil es das einzige ist, das etwas tut — ein
Ankerlink auf `#ride-profile`.

Auf Mobil bleiben `⚒ Intamin` und `📏 140 cm` plus Button; Jahr und Inversionen sind
`hidden sm:inline-flex`. `AttractionMetaBadges` wandert unverändert in die zweite Ebene.

### Bahnprofil-Sektion

1. **Kopfzeile:** Hersteller · Modell / Eröffnet / Inversionen als Statleiste, darunter die
   Bahntyp-Chips. Wandert von unten nach oben, weil es der Rahmen der Fahrt ist, nicht ihr
   Nachtrag.
2. **Rail:** durchgehende Linie, ein Knoten je Figur in Fahrreihenfolge, Nummer + Kürzel +
   Wirkungs-Icon. Auf Mobil horizontal scrollbar mit Snap. Reihenfolge und Wiederholungen
   bleiben unangetastet.
3. **Detail-Panel:** ausgewählte Figur mit Name, `shortDefinition` und Glossar-Link, plus
   3-D-Player wenn vorhanden. Figuren ohne 3-D bekommen dasselbe Panel ohne Player, statt
   ins Leere zu klicken.

Der three.js-Chunk wird erst geladen, wenn eine Figur angetippt ist. `next/dynamic` lädt
beim Mount — ohne diese Bedingung zöge jede Coaster-Seite three.js nach, nur weil ein
Profil existiert.

### Glossar-Termseite

- Hervorgehobener Streifen mit den ersten drei Bahnen aus `sort=popularity`, je mit Park
  und „typisch bis N min"
- Darunter unverändert die vollständige, nach Park gruppierte Liste
- Anker `#rides`, damit der Zähler-Badge der Übersicht direkt dorthin springt

### Glossar-Übersicht

Die Seite holt `getRideCountsByTerm()` und reicht die Map über
`glossary-overview-client.tsx` an `glossary-term-card.tsx` durch; dort ein Zähler-Badge
neben dem 3-D-Symbol, das auf `…/<term>#rides` verlinkt.

### Neue Dateien

- `lib/glossary/element-kinds.ts` — 74 `coaster-elements`-Terme →
  `launch | airtime | inversion | turn | brake`, Unbekanntes neutral. Bewusst nicht im
  API-Modell: das ist Darstellung, keine Fachdatenlage.
- `lib/glossary/ride-profile.ts` — `resolveRideProfile(profile, locale)`: Terme → Namen,
  Links, Kurzdefinition, Wirkungsklasse, 3-D ja/nein. **Eine** Quelle für Teaser und
  Sektion; sonst zeigt der Kopf „9 Figuren", während die Sektion nach dem Verwerfen
  unbekannter Ids sieben rendert oder gar nicht erscheint.
- `components/parks/ride-profile-teaser.tsx` — Fakten-Badges + Ankerbutton
- `components/parks/ride-layout-rail.tsx` (`'use client'`) — Rail, Auswahl, Viewer-Slot

### Geänderte Dateien

- `lib/api/glossary-rides.ts` — `/v1`-Fix, `sort`-Parameter, neue DTO-Felder
- `attraction/page.tsx` — zwei Ebenen im Kopf, `id="ride-profile"` + `scroll-mt-24`
- `components/parks/ride-profile-section.tsx` — `variant="strong"`, Statleiste, Rail
- `components/glossary/glossary-term-rides.tsx` — Top-3-Streifen
- `components/glossary/glossary-term-card.tsx`, `glossary-overview-client.tsx`,
  `app/[locale]/glossary/page.tsx` — Zähler-Badge
- `components/layout/header.tsx` (+ ggf. `park-background.tsx`, `language-banner.tsx`)
- `app/globals.css` — `--color-element-*` in `@theme inline`, Muster von
  `--color-status-*` (Zeile 55-64)
- `messages/*.json` — neue Keys in EN/DE/NL/FR/ES/IT

## Wiederverwendung

`GlassCard`, `Badge`, `SectionHeading`, `CoasterPlayer`, `AttractionMetaBadges` werden
wiederverwendet, nicht nachgebaut (CLAUDE.md §Reuse existing components). `scroll-mt-24`
folgt `components/marketing/editorial-ui.tsx:112`.

## Nicht im Umfang

- Vorgerenderte Figuren-Thumbnails (verworfen: Build-Asset-Pipeline für ~40 Figuren × 2
  Themes)
- Neue three.js-Geometrie. Der bestehende Player wird nur an einer zweiten Stelle
  eingebunden, es entsteht keine neue Animation — die Render-Harness-Pflicht aus CLAUDE.md
  greift damit nicht.

## Verifikation

- Backend: `pnpm test` (Baseline 750 grün) plus die neuen Sortier-Tests
- Frontend: `pnpm lint` und `pnpm exec tsc --noEmit` (Baseline beide grün nach `prebuild`)
- Ride-Seite im Browser: Hydration-Error weg, Rail auf 390 px und Desktop, 3-D lädt erst
  auf Klick, hell und dunkel
- Termseite: Top-3-Streifen plausibel gegen die API-Antwort geprüft

## Offenes Risiko

Wie viele der kuratierten Bahnen tatsächlich eine P90-Baseline haben, lässt sich ohne
DB-Zugriff nicht sagen. Ist die Abdeckung dünn, sieht der Top-3-Streifen für seltene Figuren
leer oder willkürlich aus. Beim Umsetzen gegen die laufende API gegenprüfen; bleibt die
Abdeckung zu gering, fällt der Streifen auf `openedYear DESC` mit ehrlicher Überschrift
(„Neueste") zurück, statt eine Rangfolge zu behaupten, die die Daten nicht tragen.
