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

/** A run of days that one cell draws: `length` days from `start`, with the first day's weather. */
export interface WeatherRun<T extends DayWeatherData = DayWeatherData> {
  start: number;
  length: number;
  weather: T | undefined;
}

/** What a day of a run reads as: its rounded range, or its rounded high where it has no range. */
function normalKey(weather: DayWeatherData): string {
  return weather.tempMaxP25 != null && weather.tempMaxP75 != null
    ? `${Math.round(weather.tempMaxP25)}:${Math.round(weather.tempMaxP75)}`
    : `${Math.round(weather.tempMax ?? NaN)}`;
}

/**
 * The days a row of cells draws, consecutive days that read the same joined: past the forecast the
 * average over past years changes by a degree in weeks, so a row of seven „Ø 8°–12°“ says one thing
 * seven times. Only averages join, and only where both read alike in °C; a forecast day, a day
 * without weather and a day `breakAt` says starts a run of its own (a calendar's week, so a run never
 * crosses what the row pages by).
 */
export function weatherRuns<T extends DayWeatherData>(
  days: readonly (T | undefined)[],
  breakAt: (index: number) => boolean = () => false
): WeatherRun<T>[] {
  const runs: WeatherRun<T>[] = [];
  days.forEach((weather, index) => {
    const last = runs[runs.length - 1];
    const previous = last ? days[last.start] : undefined;
    if (
      last &&
      !breakAt(index) &&
      isClimateNormal(weather) &&
      isClimateNormal(previous) &&
      weather?.tempMax != null &&
      previous?.tempMax != null &&
      normalKey(weather) === normalKey(previous)
    ) {
      last.length += 1;
    } else {
      runs.push({ start: index, length: 1, weather });
    }
  });
  return runs;
}
