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
 * The figures per attraction id, for the rides that have at least one. Only a positive number
 * counts (a 0 km/h top speed is a placeholder), and the duration is rounded to whole seconds for
 * `m:ss`. In its own module so `scripts/test-ride-figures.mjs` can import it without the API
 * client.
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
