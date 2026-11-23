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

/** A run of days that one cell draws: `length` days from `start`, and what the cell says of them. */
export interface WeatherRun {
  start: number;
  length: number;
  /** One day's weather as it is; a run of averages as their envelope (`weatherRuns`). */
  weather: DayWeatherData | undefined;
}

/**
 * Days of averages as one label: the lowest of their lower quartiles to the highest of their upper
 * ones, or where a day has no range, the lowest to the highest mean high. In °C, rendered in either
 * unit, so the label stays honest in °F too.
 */
function envelope(days: readonly DayWeatherData[]): DayWeatherData {
  const highs = days.map((d) => d.tempMax ?? NaN);
  const ranged = days.every((d) => d.tempMaxP25 != null && d.tempMaxP75 != null);
  return {
    basis: 'climate_normal',
    tempMax: highs.reduce((a, b) => a + b, 0) / highs.length,
    tempMaxP25: ranged ? Math.min(...days.map((d) => d.tempMaxP25!)) : Math.min(...highs),
    tempMaxP75: ranged ? Math.max(...days.map((d) => d.tempMaxP75!)) : Math.max(...highs),
  };
}

/**
 * The cells a row of days draws. Past the forecast the average over past years changes by a degree
 * in weeks, so a row of seven „Ø 8°–12°“ says one thing seven times: consecutive days of averages
 * share one cell, labelled with their envelope. A forecast day, a day without weather and a day
 * `breakAt` names (a calendar's week, so a run never crosses what the row pages by) start a cell
 * of their own.
 */
export function weatherRuns(
  days: readonly (DayWeatherData | undefined)[],
  breakAt: (index: number) => boolean = () => false
): WeatherRun[] {
  const runs: Array<{ start: number; length: number }> = [];
  days.forEach((weather, index) => {
    const last = runs[runs.length - 1];
    const joins =
      last !== undefined &&
      !breakAt(index) &&
      isClimateNormal(weather) &&
      weather?.tempMax != null &&
      isClimateNormal(days[last.start]) &&
      days[last.start]?.tempMax != null;
    if (joins) last.length += 1;
    else runs.push({ start: index, length: 1 });
  });
  return runs.map(({ start, length }) => ({
    start,
    length,
    weather:
      length === 1 ? days[start] : envelope(days.slice(start, start + length) as DayWeatherData[]),
  }));
}
