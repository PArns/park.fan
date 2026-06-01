# Park-Statistiken & Peak-Time — Status, Anforderungen, Endpoint-Design

Stand: 2026-06-01 · Frontend-Branch: `claude/nice-brown-g66xy` · Backend-Repo: <https://github.com/park-fan/v4.api.park.fan>

Dieses Dokument beschreibt:

1. **Wie es heute funktioniert** — Datenfluss, Endpoints, clientseitige Logik.
2. **Was wir brauchen** — fachliche Anforderungen aus der UI.
3. **Wie die Endpoints aussehen sollen** — konkrete Schemas.
4. **Optimierungen** — Caching, Materialized Views, Konsistenz.

---

## 1. Aktueller Stand

### 1.1 Historische Wartezeit-Statistiken (Block „Historische Wartezeit-Statistiken")

UI zeigt:

- Subtitle: „Basierend auf **159 Tagen** aufgezeichneter Daten · **Letzte 2 Jahre**"
- Top-Attraktionen-Liste (Typisch p50 / Spitze p90 in Minuten)
- Crowd-Level pro Monat (`NORMAL` / `HOCH` / `SEHR HOCH` …) mit p50/p90
- Crowd-Level pro Wochentag mit p50/p90

**Endpoint (existiert bereits):**

```
GET https://api.park.fan/v1/parks/{continent}/{country}/{city}/{parkSlug}/stats?years=2
```

**Fetch:**

| Datei | Zeilen | Was |
| --- | --- | --- |
| `lib/api/stats.ts` | 10–25 | `getParkHistoricalStats(...)`, `next: { revalidate: 86400 }` |
| `app/[locale]/parks/[continent]/[country]/[city]/[park]/page.tsx` | 359–366 | RSC-Aufruf beim Park-Page-Render |

**Response heute** (`lib/api/types.ts:1075–1085`):

```ts
{
  byMonth: { month: 1..12, avgCrowdScore: number, avgWaitP50, avgWaitP90, sampleDays }[],
  byDayOfWeek: { dayOfWeek: 0..6, avgCrowdScore: number, avgWaitP50, avgWaitP90, sampleDays }[],
  topAttractions: { attractionSlug, attractionName, avgWaitP50, avgWaitP90, sampleDays }[],
  meta: { parkSlug, dataFrom: ISO, dataTo: ISO, totalSampleDays }
}
```

**Clientseitige Logik** (`components/parks/park-stats-section.tsx`):

- Render-Gate: `meta.totalSampleDays < 30` → komplette Section unsichtbar (Zeile 35).
- `years = round((dataTo - dataFrom) / 1 Jahr in ms)` (Zeilen 37–40) — wird im Subtitle als „Letzte X Jahre" angezeigt.
- **`avgCrowdScore` (Number) → `CrowdLevel` (Enum)** clientseitig (Zeilen 16–23):

  | Score | CrowdLevel | UI (DE) |
  | --- | --- | --- |
  | ≤ 1.5 | `very_low` | sehr niedrig |
  | ≤ 2.5 | `low` | niedrig |
  | ≤ 3.5 | `moderate` | NORMAL |
  | ≤ 4.5 | `high` | HOCH |
  | ≤ 5.5 | `very_high` | SEHR HOCH |
  | > 5.5 | `extreme` | extrem |

- Wochentage werden ab Montag sortiert (`(dayOfWeek - 1 + 7) % 7`) und mit `Intl.DateTimeFormat` lokalisiert.

### 1.2 Peak Time „heute" (Stoßzeit in der Park-Status-Card)

UI zeigt: „Spitze heute · 85 min · Stoßzeit 14:30 · in 1h 30m"

**Kein dedizierter Endpoint** — Peak-Daten liegen als Felder im allgemeinen Park-Endpoint:

```
GET https://api.park.fan/v1/parks/{continent}/{country}/{city}/{parkSlug}
```

**Fetch:**

| Datei | Zeilen | Was |
| --- | --- | --- |
| `lib/api/parks.ts` | 23 | `getPark(...)` — SSR auf Park-Page |
| `app/api/parks/[...path]/route.ts` | 19 | Next.js-Passthrough für Client |
| `lib/hooks/use-live-park-data.ts` | 29, 44 | Client-Poll alle **5 min** |

**Response-Felder** (`lib/api/types.ts:307–317`, `analytics.statistics`):

```ts
{
  avgWaitTime, avgWaitToday,
  peakHour: string | null,   // "HH:MM" lokal ODER ISO 8601 — inkonsistent
  peakWaitToday: number,     // Minuten
  crowdLevel: CrowdLevel,
  totalAttractions, operatingAttractions, closedAttractions,
  timestamp
}
```

**Clientseitige Logik** (`components/parks/park-status.tsx:211–238`):

- Heuristik: `peakHour.includes('T')` → ISO, sonst `HH:MM` + `park.timezone` via `fromZonedTime`.
- `<LocalTime>` rendert lokalisiert.
- `<PeakHourBadge>` (`components/parks/peak-hour-badge.tsx:15–43`) ist ein 1-Sekunden-Countdown, der sich entfernt, wenn `diffMs <= 0`.

---

## 2. Was wir fachlich brauchen

Aus der UI abgeleitet, ohne aktuelle Implementierung vorauszusetzen:

1. **Aggregierte historische Statistiken pro Park** für einen konfigurierbaren Zeitraum (z. B. 1 / 2 / 5 Jahre):
   - Durchschnittlicher Andrang pro **Monat** und pro **Wochentag** (jeweils Crowd-Level + Typisch/Spitze).
   - **Top-Attraktionen** nach Wartezeit (Typisch + Spitze).
   - **Datenbasis-Metadaten** (Sample-Tage, Zeitfenster, „X Jahre").
2. **Heute-Vorhersage** pro Park:
   - Erwartete Spitzen-Wartezeit (Minuten).
   - Erwartete Stoßzeit (Uhrzeit / Timestamp).
   - Optional: Confidence + Quelle (Vorhersage vs. live-laufender Tag).
3. **Konsistente Crowd-Level-Klassifikation** über alle Endpoints (`/parks/.../stats`, `/parks/.../`, Heatmaps, Discovery), damit Frontend nie raten muss.
4. **Stabile Zeit-/TZ-Formate** — eindeutig ISO 8601 mit Offset oder eindeutig `HH:MM` + Park-TZ, nicht gemischt.
5. **Render-Gate-Information** vom Backend, nicht aus dem Frontend hartkodiert (heute: `totalSampleDays < 30` ⇒ Section aus). Backend sollte sagen, ob die Daten zeigbar sind.

---

## 3. Endpoint-Design (Soll)

### 3.1 `GET /v1/parks/{slug}/stats` — historische Aggregate

Bestehender Pfad, erweiterte Response. **Backwards-compatible** (nur Felder ergänzen, alte beibehalten).

**Query-Parameter:**

| Name | Typ | Default | Beschreibung |
| --- | --- | --- | --- |
| `years` | int (1..5) | 2 | Größe des Look-back-Fensters |
| `topN` | int (1..50) | 10 | Anzahl Top-Attraktionen |
| `minSampleDays` | int | 30 | Backend setzt `meta.displayable=false`, wenn unterschritten |

**Response (vorgeschlagen):**

```ts
{
  meta: {
    parkSlug: string,
    dataFrom: string,        // ISO 8601, Park-TZ
    dataTo: string,          // ISO 8601, Park-TZ
    totalSampleDays: number,
    windowYears: number,     // NEU — was im Subtitle angezeigt wird
    displayable: boolean,    // NEU — true wenn Datenbasis ausreicht
    generatedAt: string,     // NEU — wann das Aggregat berechnet wurde (für Debug)
    schemaVersion: 2         // NEU — damit Frontend-Branches sauber migrierbar sind
  },
  byMonth: {
    month: 1..12,
    avgCrowdScore: number,         // wird beibehalten (für Sortierung/Tooltips)
    avgCrowdLevel: CrowdLevel,     // NEU — Backend mappt, Frontend rendert nur
    avgWaitP50: number,
    avgWaitP90: number,
    sampleDays: number
  }[],
  byDayOfWeek: {
    dayOfWeek: 0..6,               // 0 = Sonntag (ISO-Konvention dokumentieren!)
    avgCrowdScore: number,
    avgCrowdLevel: CrowdLevel,     // NEU
    avgWaitP50: number,
    avgWaitP90: number,
    sampleDays: number
  }[],
  topAttractions: {
    attractionSlug: string,
    attractionName: string,        // pre-localized? Nein — Frontend übersetzt nicht, also Backend liefert kanonischen Namen
    avgWaitP50: number,
    avgWaitP90: number,
    sampleDays: number,
    rank: number                   // NEU — explizit, statt Array-Index zu verwenden
  }[]
}
```

**Konsequenzen im Frontend:**

- `CROWD_SCORE_TO_LEVEL` in `park-stats-section.tsx:16–23` **löschen**.
- `years`-Berechnung in `park-stats-section.tsx:37–40` durch `stats.meta.windowYears` ersetzen.
- Render-Gate `totalSampleDays < 30` durch `!stats.meta.displayable` ersetzen.

### 3.2 `GET /v1/parks/{slug}` — Live + Peak-Vorhersage (bestehender Endpoint, erweitert)

**Kein eigener Peak-Endpoint** — Peak-Felder bleiben am Park-Objekt, weil sie immer zusammen mit den anderen Live-Statistiken gerendert werden und ein extra Round-Trip nichts spart.

**Geänderte/neue Felder in `analytics.statistics`:**

```ts
{
  // bestehend
  avgWaitTime, avgWaitToday, peakWaitToday,
  crowdLevel: CrowdLevel,
  totalAttractions, operatingAttractions, closedAttractions,
  timestamp,

  // GEÄNDERT
  peakHour: string | null,         // immer ISO 8601 mit Offset, z. B. "2026-06-01T14:30:00+02:00"

  // NEU
  peakHourLocal: string | null,    // "14:30" — bereits in Park-TZ, für Anzeige ohne erneute Konvertierung
  peakHourConfidence: number,      // 0..1, 0 = keine Aussage möglich
  peakHourSource: "prediction" | "observed_today" | "historical_fallback"
}
```

**Konsequenzen im Frontend:**

- Heuristik `peakHour.includes('T')` in `park-status.tsx:220–230` **löschen**.
- `<PeakHourBadge>` kann Confidence/Source nutzen, um z. B. „≈ 14:30" bei niedriger Confidence zu rendern.

### 3.3 `CrowdLevel`-Enum — kanonische Definition

Schon vorhanden in `lib/api/types.ts`. **Verbindlich machen:**

```ts
type CrowdLevel =
  | "very_low" | "low" | "moderate"
  | "high" | "very_high" | "extreme";
```

Schwellen `avgCrowdScore → CrowdLevel` **leben ausschließlich im Backend**, werden im Backend-Repo dokumentiert (z. B. `docs/crowd-level.md`), und das Frontend übernimmt sie nirgendwo nochmal.

---

## 4. Caching & Performance

### 4.1 Aktuell

| Endpoint | Cache | Quelle |
| --- | --- | --- |
| `/v1/parks/.../stats` | 24 h (Next ISR) | `lib/api/stats.ts:18` |
| `/v1/parks/...` (SSR) | 5 min | Park-Page |
| `/v1/parks/...` (Live-Hook) | Poll 5 min | `use-live-park-data.ts:44` |

### 4.2 Soll-Optimierungen

1. **Materialized View / Snapshot-Tabelle** im Backend für `/stats`:
   - Nightly Job berechnet `byMonth` / `byDayOfWeek` / `topAttractions` pro Park und schreibt eine Zeile.
   - Endpoint liest nur diese Zeile → p99 < 50 ms auch bei Cache-Miss.
   - Heute (vermutlich) On-the-fly-Aggregation über 2 Jahre Wartezeit-Rows = teuer auf Cold Cache.
2. **`Cache-Control` + `ETag`** vom Backend:
   - `Cache-Control: public, max-age=300, s-maxage=86400, stale-while-revalidate=604800` für `/stats`.
   - Frontend kann dann `revalidate: 86400` beibehalten, profitiert aber zusätzlich am CDN.
3. **Conditional Requests** (`If-None-Match`):
   - Spart Bandbreite bei Re-Validation; `/stats`-Responses sind ~ KB-Größenordnung, aber bei vielen Parks summiert es sich.
4. **`peakHour` separat invalidieren**:
   - Live-Hook polled aktuell den gesamten Park-Endpoint alle 5 min, nur damit ggf. `peakHour` aktualisiert wird.
   - Falls Backend das hergibt: `peakHour`-Updates per SSE oder leichtgewichtigem `/v1/parks/{slug}/live` (nur Statistik-Subobjekt). **Nicht zwingend** — erst, wenn Bandbreite/Kosten ein Thema werden.
5. **Schema-Versionierung** (`meta.schemaVersion`): erlaubt fließende Migration, ohne Branches zu blockieren.

---

## 5. Migrationsplan

1. **Backend** liefert neue Felder additiv (`avgCrowdLevel`, `windowYears`, `displayable`, `peakHourLocal`, `peakHourConfidence`, `peakHourSource`, `peakHour` immer als ISO). Alte Felder bleiben.
2. **Frontend** liest neue Felder, behält Fallbacks auf die alten für eine Übergangsphase.
3. Sobald Backend deployed ist: clientseitige Mappings (`CROWD_SCORE_TO_LEVEL`, `years`-Math, `peakHour`-Heuristik) **entfernen**.
4. Nach 2–4 Wochen Bake-Time: alte Felder (`avgCrowdScore` als Pflicht, `peakHour` als `HH:MM`) im Backend deprecaten.

---

## 6. TL;DR

- **`/v1/parks/.../stats`** existiert, ist richtig platziert, braucht aber `avgCrowdLevel`, `windowYears`, `displayable` damit das Frontend keine eigene Klassifikation mehr macht.
- **Peak Time** braucht **keinen** eigenen Endpoint — Felder bleiben auf `/v1/parks/...`, aber `peakHour` muss ein einheitliches Format (ISO 8601 mit Offset) haben, plus `peakHourLocal`, Confidence und Quelle.
- **Schwellen für `CrowdLevel` leben nur im Backend.** Frontend rendert, klassifiziert nicht.
- **Performance:** Materialized View für `/stats`, CDN-Cache-Header, optional ein `/live`-Subobjekt für Peak-Updates.

---

## 7. Referenzen

| Topic | Datei |
| --- | --- |
| Stats-Fetcher | `lib/api/stats.ts` |
| Stats-Komponente | `components/parks/park-stats-section.tsx` |
| Park-Fetcher | `lib/api/parks.ts` |
| Live-Poll | `lib/hooks/use-live-park-data.ts` |
| Park-Status / Peak-Anzeige | `components/parks/park-status.tsx` |
| Peak-Countdown | `components/parks/peak-hour-badge.tsx` |
| Typen (Peak) | `lib/api/types.ts:307–317` |
| Typen (Historical) | `lib/api/types.ts:1051–1085` |
| Backend-Repo | <https://github.com/park-fan/v4.api.park.fan> |
