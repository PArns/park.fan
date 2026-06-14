# Backend-Anweisung: Shows & Headliner in die `nearby` / `in_park`-Antwort aufnehmen

> Ziel: Das Frontend soll auf der Startseite (Ansicht „Du bist im {Park}") neben
> den nächsten Attraktionen (`rides`) auch die **nächste Show** und die
> **Headliner** mit Entfernung anzeigen — **ohne** dafür einen zusätzlichen
> Park-Detail-Call zu machen. Beides soll direkt aus dem bestehenden
> `GET /v1/discovery/nearby`-Response (`type: "in_park"`) kommen.

## Aktueller Stand (Backend)

- Endpoint: `GET /v1/discovery/nearby` → `LocationController` (`src/location/location.controller.ts`),
  Logik in `src/location/location.service.ts`.
- `in_park`-Antwort heute:

```jsonc
{
  "type": "in_park",
  "userLocation": { "latitude": 50.8, "longitude": 6.87 },
  "data": {
    "park": { "id", "name", "slug", "distance", "status", "analytics", ... },
    "rides": [
      { "id", "name", "slug", "distance", "waitTime", "status", "analytics", "url" }
    ]
  }
}
```

- `rides` werden aus der `attractions`-Tabelle geladen und bekommen die Distanz
  zum User per Haversine (User-Koordinaten ↔ Attraktions-Koordinaten).
- Shows liegen in `src/shows` (Entity + Service) und tragen `latitude/longitude`
  sowie `showtimes`. Headliner werden heute nur am Park-Detail als
  `ropeDropHeadliners` (`ParkWithAttractions`) geliefert.

## Gewünschte Erweiterung

Die `in_park`-`data` um **zwei additive Felder** ergänzen (keine Breaking
Changes — bestehende Felder bleiben unverändert):

```jsonc
"data": {
  "park":  { ... },
  "rides": [ ... ],
  "shows": [ /* NEU */ ],
  "headliners": [ /* NEU */ ]
}
```

### 1. `shows: ShowWithDistanceDto[]`

Analog zu `rides`: alle Shows des Parks, mit Distanz zum User, nach Distanz
aufsteigend sortiert.

| Feld                  | Typ                          | Hinweis                                                            |
| --------------------- | ---------------------------- | ----------------------------------------------------------------- |
| `id`                  | `string`                     |                                                                   |
| `name`                | `string`                     |                                                                   |
| `slug`                | `string`                     |                                                                   |
| `distance`            | `number`                     | Meter, Haversine User ↔ Show-Koordinaten                          |
| `status`              | `string`                     | `OPERATING` / `CLOSED` / …                                        |
| `showtimes`           | `{ startTime: string }[]`    | **heutige** Showtimes, ISO 8601 **mit Offset** (z. B. `+02:00`)   |
| `url`                 | `string`                     | API-URL, z. B. `/v1/parks/<…>/shows/<slug>`                       |
| `isSeasonal`          | `boolean` (optional)         | wie bei Park-Detail                                                |
| `seasonMonths`        | `number[] \| null` (opt.)    | Monate 1–12; `null` = saisonal, Monate unbekannt                  |
| `isCurrentlyInSeason` | `boolean \| null` (opt.)     |                                                                   |

Umsetzung: Im `in_park`-Zweig des `LocationService` zusätzlich die Shows des
erkannten Parks laden (Show-Repository, `parkId = park.id`), Distanz wie bei den
Rides berechnen, heutige `showtimes` mitgeben, nach `distance` sortieren.
Off-Season-Shows können enthalten bleiben (Flags mitliefern) — das Frontend
entscheidet über die Darstellung.

> Das Frontend berechnet die „nächste Show" selbst aus `showtimes[].startTime`
> (nächster Eintrag in der Zukunft). Wichtig ist nur, dass die **heutigen**
> Showtimes mit korrektem Zeitzonen-Offset geliefert werden.

### 2. `headliners: HeadlinerWithDistanceDto[]`

Die Headliner des Parks (dieselben, die am Park-Detail als
`ropeDropHeadliners` bestimmt werden) — mit Distanz zum User, nach Distanz
aufsteigend sortiert.

| Feld         | Typ                       | Hinweis                                         |
| ------------ | ------------------------- | ----------------------------------------------- |
| `id`         | `string`                  |                                                 |
| `name`       | `string`                  |                                                 |
| `slug`       | `string`                  |                                                 |
| `distance`   | `number`                  | Meter, Haversine User ↔ Attraktions-Koordinaten |
| `status`     | `string`                  | `OPERATING` / `CLOSED` / …                      |
| `waitTime`   | `number \| null`          | aktuelle Wartezeit                              |
| `crowdLevel` | `string \| null` (opt.)   | falls vorhanden                                 |
| `url`        | `string`                  | API-URL der Attraktion                          |
| `worth`      | `boolean` (optional)      | aus Rope-Drop-Logik, falls vorhanden            |
| `minutesSaved` | `number` (optional)     | aus Rope-Drop-Logik, falls vorhanden            |

Umsetzung: Die vorhandene Headliner-/Rope-Drop-Bestimmung wiederverwenden, die
Treffer mit der bereits geladenen Rides-Distanz anreichern (gleiche
Attraktions-Koordinaten) und als eigenes Array zurückgeben. Headliner dürfen
sich mit `rides` überschneiden — das Frontend nutzt zwei getrennte Listen.

## Sonstiges

- **Additiv & rückwärtskompatibel**: Felder nur hinzufügen, nichts umbenennen.
- **Swagger/OpenAPI**: `ShowWithDistanceDto` und `HeadlinerWithDistanceDto`
  ergänzen und im `in_park`-Response-DTO referenzieren.
- **Tests**: `src/location/location.service.spec.ts` um Fälle für `shows`
  (inkl. heutiger Showtimes / Sortierung) und `headliners` erweitern.
- **Radius**: Shows/Headliner gehören zum erkannten Park — nicht über den
  Rides-Radius hinaus filtern, damit auch ein etwas weiter entfernter
  Showplatz/Headliner im Park enthalten ist.

## Frontend-Vertrag (zur Abstimmung)

Sobald die Felder live sind, konsumiert das Frontend sie 1:1 in
`types/nearby.ts` (`NearbyAttractionsData` → `shows`, `headliners`) und rendert
in `components/parks/nearby-parks-card.tsx` über der `rides`-Liste:
„Nächste Show" und die Headliner-Liste mit Entfernung.
