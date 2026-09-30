/**
 * The three ride figures the park map's popup shows, as `/api/parks/<geo>/<park>/ride-stats`
 * answers them. Each is absent when the ride has no such figure: the API strips null keys, and the
 * proxy leaves a ride out altogether when it has none of the three.
 */
export interface RideFigures {
  /** Top speed in km/h. */
  topSpeedKmh?: number;
  /** Highest point in metres. */
  heightM?: number;
  /** Ride duration in seconds. */
  durationSeconds?: number;
}
