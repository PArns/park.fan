# Park-Statistiken & Peak-Time — Status & Vorschläge

Stand: 2026-06-01 · Branch: `claude/nice-brown-g66xy`

Dieses Dokument beschreibt, wie **Historische Wartezeit-Statistiken** und die
**Stoßzeit (Peak Hour)** auf den Park-Detailseiten aktuell zusammengesetzt
werden, was gut funktioniert, und wo ein dedizierter Endpoint Sinn ergibt.

---

## 1. Historische Wartezeit-Statistiken

Sichtbar als Block „Historische Wartezeit-Statistiken" auf der Park-Seite mit
Top-Attraktionen, Crowd-Level pro Monat und pro Wochentag (Screenshot in
[`docs/changelog.md`](../changelog.md) bzw. Live unter `/parks/.../<park>`).

### 1.1 Status quo

Es gibt bereits einen **dedizierten Backend-Endpoint**:

```
GET https://api.park.fan/v1/parks/{continent}/{country}/{city}/{parkSlug}/stats?years=2
```

- **Fetch:** `lib/api/stats.ts:10–25` (`getParkHistoricalStats`)
- **Aufruf-Stelle (Park-Page, RSC):** `app/[locale]/parks/[continent]/[country]/[city]/[park]/page.tsx:359–366`
- **Caching:** `next: { revalidate: 86400 }` (24 h) — die Daten ändern sich
  ohnehin nur einmal pro Tag (nachts gebatcht im Backend).
- **Response-Typ:** `ParkHistoricalStats` in `lib/api/types.ts:1075–1085`
  ```ts
  {
    byMonth: MonthStat[];          // 1..12  + avgCrowdScore + p50 + p90 + sampleDays
    byDayOfWeek: DayOfWeekStat[];  // 0..6   + avgCrowdScore + p50 + p90 + sampleDays
    topAttractions: TopAttractionStat[];
    meta: { parkSlug, dataFrom, dataTo, totalSampleDays }
  }
  ```

### 1.2 Was die Frontend-Komponente macht

`components/parks/park-stats-section.tsx`:

- **Zeigt nichts**, wenn `meta.totalSampleDays < 30` — Datenbasis zu dünn
  (`park-stats-section.tsx:35`).
- **Berechnet `years`** clientseitig aus `dataTo - dataFrom`
  (`park-stats-section.tsx:37–40`). Wirkt redundant; `meta.years` (oder
  `meta.windowMonths`) wäre sauberer und sparen wir uns die Math-Round-Magie.
- **Mappt `avgCrowdScore` (Number) → `CrowdLevel` (Enum)** clientseitig mit
  hartkodierten Schwellen (`park-stats-section.tsx:16–23`):
  ```
  ≤1.5  very_low
  ≤2.5  low
  ≤3.5  moderate   → UI: "NORMAL"
  ≤4.5  high       → UI: "HOCH"
  ≤5.5  very_high  → UI: "SEHR HOCH"
  >5.5  extreme
  ```
  Die exakt gleichen Schwellen leben auch im Live-Crowd-Level (siehe Abschnitt 2)
  und im Backend für Heatmaps. **Drift-Risiko**, weil drei Quellen.

### 1.3 Bewertung

| Punkt | Aktuell | Ideal |
| --- | --- | --- |
| Dedizierter Endpoint? | ✅ ja | ✅ ja |
| Server-Aggregation? | ✅ ja (Backend rechnet) | ✅ ja |
| Cache-Strategy | ✅ 24 h ISR | ✅ |
| Crowd-Level-Mapping | ⚠️ clientseitig dupliziert | Backend liefert Level direkt |
| `years`-Anzeige | ⚠️ clientseitig errechnet | Backend liefert es |
| Hot-Path-Latenz | ⚠️ Aggregation bei Cache-Miss | Materialized View / Snapshot-Tabelle |

### 1.4 Was wir verbessern wollen

1. **`avgCrowdLevel: CrowdLevel`** im Response ergänzen — Schwellen leben nur
   noch im Backend. Frontend kann das hartkodierte `CROWD_SCORE_TO_LEVEL`
   löschen. (`avgCrowdScore` bleibt drin, falls jemand sortieren will.)
2. **`meta.windowYears` / `meta.windowMonths`** mitliefern, statt clientseitig
   aus `dataFrom`/`dataTo` zu schätzen.
3. **Materialized View** für `byMonth` / `byDayOfWeek` / `topAttractions`
   pro Park, nightly aktualisiert. Endpoint liest dann nur noch eine
   vorberechnete Zeile → < 50 ms p99 auch bei Cache-Miss.
4. **Konsistenz-Test** Backend ↔ Frontend: die `CrowdLevel`-Enum gehört einmalig
   in `lib/api/types.ts` (gibt es schon — gut), und das Backend muss exakt
   dieselben Strings liefern.

---

## 2. Peak Time (Stoßzeit „heute")

Sichtbar in der Park-Status-Card als „Stoßzeit 14:30 · in 1h 30m".

### 2.1 Status quo

**Kein dedizierter Endpoint** — der Wert kommt als Feld auf dem allgemeinen
Park-Endpoint mit:

```
GET https://api.park.fan/v1/parks/{continent}/{country}/{city}/{park}
```

- **Fetch SSR:** `lib/api/parks.ts:23` (`getPark`) — Server Component beim
  Render der Park-Page.
- **Fetch Live:** `lib/hooks/use-live-park-data.ts:29,44` — Client-Hook polled
  alle **5 Minuten** über den Next.js-Passthrough
  `app/api/parks/[...path]/route.ts:19`.
- **Response-Felder:** `analytics.statistics` in `lib/api/types.ts:307–317`
  ```ts
  {
    avgWaitTime, avgWaitToday,
    peakHour: string | null,   // "HH:MM" lokal ODER ISO 8601
    peakWaitToday: number,     // in Minuten
    crowdLevel: CrowdLevel,
    ...
  }
  ```

### 2.2 Was die Frontend-Komponente macht

`components/parks/park-status.tsx:211–238`:

- Parst `peakHour` (heuristisch: enthält `T` → ISO, sonst `HH:MM` +
  `park.timezone` via `fromZonedTime`).
- Rendert lokalisiert via `<LocalTime>`.
- `<PeakHourBadge>` (`components/parks/peak-hour-badge.tsx:15–43`) ist ein
  Client-Countdown, der jede Sekunde aktualisiert und sich selbst entfernt,
  wenn `diffMs <= 0`.

### 2.3 Bewertung

| Punkt | Aktuell | Bemerkung |
| --- | --- | --- |
| Format `peakHour` | ⚠️ mal `HH:MM`, mal ISO | Frontend muss raten — sollte sich ändern |
| TZ-Handling | ⚠️ Frontend baut Datum mit Park-TZ | Backend könnte ISO mit TZ liefern |
| Eigener Endpoint? | ❌ nein | Aber auch nicht nötig — siehe unten |
| Polling | 5 min Client + 5 min SSR | OK für „heute" |

### 2.4 Empfehlung: **kein** eigener Endpoint für Peak Time

Gründe:

1. **Peak Time ist immer in der Park-Status-Card mit drin** — würde nie
   getrennt geladen, also kein Latenz-Vorteil.
2. **Es ist ein einzelner Wert pro Park** — Caching und Aggregation sind nicht
   schwerer als für die anderen `statistics.*`-Felder.
3. **Live-Daten polled ohnehin** den ganzen Park-Endpoint.

Was wir **stattdessen** verbessern sollten:

1. **`peakHour` immer als ISO 8601 mit Offset** (`2026-06-01T14:30:00+02:00`).
   Heuristik im Frontend (`park-status.tsx:220–230`) löschen.
2. **`peakHourSource`** als Diagnose-Feld (`"prediction" | "historical" | "live"`),
   damit wir später ein „Vorhersage / Beobachtung"-Label rendern können.
3. **Confidence-Wert** (`peakConfidence: 0..1`), damit wir die Badge bei
   schwacher Datenbasis ausblenden oder als „Schätzung" markieren.

---

## 3. TL;DR

- **Historische Stats:** Dedizierter Endpoint existiert schon und ist
  richtig (server-side aggregiert, 24 h gecached). **Verbessern**, indem
  Backend `avgCrowdLevel` + `meta.windowYears` mitliefert, damit das
  Mapping nicht in zwei Repos doppelt lebt.
- **Peak Time:** **Kein** eigener Endpoint nötig — Feld auf dem Park-Endpoint
  reicht. **Verbessern**, indem `peakHour` als ISO mit TZ-Offset geliefert
  wird und Confidence/Quelle dazukommen.

## 4. Referenzen

- Frontend-Fetcher: `lib/api/stats.ts`, `lib/api/parks.ts`
- Komponenten: `components/parks/park-stats-section.tsx`,
  `components/parks/park-status.tsx`, `components/parks/peak-hour-badge.tsx`
- Typen: `lib/api/types.ts:307–317` (Peak), `:1051–1085` (Historical)
- Backend-Repo: <https://github.com/park-fan/v4.api.park.fan>
