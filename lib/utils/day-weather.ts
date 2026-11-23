/**
 * A day's weather as the calendars draw it (`DayWeather`): the park calendar's weather block and a
 * trip calendar's park day alike. A `climate_normal` is the date's average over past years; its
 * `tempMaxP25` and `tempMaxP75` are the range half of such days' highs fell in.
 */
export interface DayWeatherData {
  basis?: 'forecast' | 'climate_normal';
  icon?: number;
  tempMin?: number;
  tempMax?: number;
  tempMaxP25?: number;
  tempMaxP75?: number;
}

/** The spread a detail panel spells out beside {@link DayWeatherData}: the lows' range and the rain. */
export interface ClimateSpreadData extends DayWeatherData {
  tempMinP25?: number;
  tempMinP75?: number;
  wetDayPercent?: number;
}

/** Whether a day's weather is the date's average over past years rather than its forecast. */
export function isClimateNormal(
  weather: Pick<DayWeatherData, 'basis'> | null | undefined
): boolean {
  return weather?.basis === 'climate_normal';
}
