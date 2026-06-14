# Backend-Bug: Park-Auslastung `current` und `comparedToTypical` nutzen unterschiedliche Basen

> Betrifft: `GET /v1/parks/{path}` → `analytics.occupancy`
> Backend-Repo: `PArns/v4.api.park.fan`, `src/analytics/analytics.service.ts`
> (`AnalyticsService.getBatchParkOccupancy()`)

## Symptom

Auf der Park-Seite zeigt die „Auslastung"-Karte z. B. **204 %** als aktuelle
Auslastung, darunter aber **„42 % höher vs. typisch"**. Das ist in sich
widersprüchlich: Wenn `current` eine Prozentangabe relativ zum typischen Wert
wäre, müsste „vs. typisch" `current − 100 = 104 %` sein — nicht 42 %.

## Ursache

`current` und `comparedToTypical` werden aus **unterschiedlichen Basen** berechnet:

```ts
// "current" (die 204 %): per-Ride-P90-Ratio, über die Rides aggregiert
const occupancyPercentage =
  perRideRatios !== null
    ? perRideRatios.ratioP90 * 100          // ← genutzt, wenn Per-Ride-Daten existieren
    : (currentPeakWait / baseline) * 100;

// "comparedToTypical" (die 42 %): Park-Peak-Wait gegen den P50-Baseline
const diff = currentPeakWait - baseline;     // baseline = P50-Median
const comparedToTypical = (diff / baseline) * 100;
```

- `current` = **per-Ride-P90-Aggregat** (`ratioP90 * 100`)
- `comparedToTypical` = **Park-Level** (`(currentPeakWait − P50) / P50 * 100`)

Da die beiden Felder verschiedene Nenner verwenden (per-Ride-P90 vs. Park-P50),
passen 204 % und 42 % nicht zusammen.

### Zusätzlich: irreführender Feldname

`baseline90thPercentile` speichert tatsächlich den **P50-Baseline**-Wert
(`baseline90thPercentile: Math.round(baseline)`, wobei `baseline` der P50-Median
ist) — der Name suggeriert fälschlich das 90. Perzentil.

## Vorschlag zur Behebung (Backend)

`current` und `comparedToTypical` sollten **dieselbe Basis** verwenden, damit die
Anzeige konsistent ist. Optionen:

1. `current` ebenfalls park-level gegen P50 rechnen
   (`(currentPeakWait / P50) * 100`), sodass `comparedToTypical = current − 100`
   gilt — **oder**
2. `comparedToTypical` aus derselben per-Ride-P90-Ratio ableiten, die `current`
   verwendet.

Außerdem das Feld `baseline90thPercentile` entweder korrekt mit dem 90.-Perzentil
befüllen **oder** in `baselineP50` / `baselineTypical` umbenennen.

## Frontend-Status

Kein Frontend-Bug: `components/parks/park-status.tsx` zeigt beide Felder
unverändert an (`occupancy.current` und `occupancy.comparedToTypical`). Sobald das
Backend die Basen angleicht, stimmt die Anzeige automatisch. (Der Progress-Balken
ist bereits auf 0–100 % geklemmt, damit Werte > 100 % nicht aus der Spur laufen.)
