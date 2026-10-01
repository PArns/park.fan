/**
 * The three ride figures the park map's popup shows, as `/api/parks/<geo>/<park>/ride-stats`
 * answers them. Each is absent when the ride has no such figure: the API strips null keys, and
 * {@link pickRideFigures} leaves a ride out altogether when it has none of the three.
 */
export interface RideFigures {
  /** Top speed in km/h. */
  topSpeedKmh?: number;
  /** Highest point in metres. */
  heightM?: number;
  /** Ride duration in whole seconds. */
  durationSeconds?: number;
}

interface FigureSource {
  id: string;
  rideProfile?: {
    stats?: {
      topSpeedKmh?: number | null;
      heightM?: number | null;
      durationSeconds?: number | null;
    } | null;
  } | null;
}

/**
 * The figures per attraction id, for the rides that have at least one.
 *
 * A figure has to be a positive number to count: a 0 km/h top speed or a 0:00 ride is a
 * placeholder, not a measurement, and the popup would print it as one. The duration is rounded
 * to whole seconds because the popup formats it as `m:ss`.
 *
 * Pure and in its own module so a node test can import it (`scripts/test-ride-figures.mjs`);
 * the route file reaches the API client and cannot be loaded that way.
 */
export function pickRideFigures(attractions: FigureSource[]): Record<string, RideFigures> {
  const result: Record<string, RideFigures> = {};
  for (const a of attractions) {
    const s = a.rideProfile?.stats;
    if (!s) continue;
    const figures: RideFigures = {};
    if (typeof s.topSpeedKmh === 'number' && s.topSpeedKmh > 0) figures.topSpeedKmh = s.topSpeedKmh;
    if (typeof s.heightM === 'number' && s.heightM > 0) figures.heightM = s.heightM;
    if (typeof s.durationSeconds === 'number' && Math.round(s.durationSeconds) > 0)
      figures.durationSeconds = Math.round(s.durationSeconds);
    if (Object.keys(figures).length > 0) result[a.id] = figures;
  }
  return result;
}
