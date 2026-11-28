import { api, nullOnNotFound } from './client';
import type { WeatherHourly, WeatherHourlyToday } from './types';

/**
 * A park's hour-by-hour days from the API (today and up to fourteen more), uncached: the API keeps
 * the forecast for two hours and the relay's CDN window shares the answer, so a data cache of ours
 * would only add its own age to theirs. `null` on the API's 404 (no coordinates, or the upstream
 * down).
 */
export function getParkWeatherHourlyFresh(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<WeatherHourly | null> {
  return nullOnNotFound(
    api.get<WeatherHourly>(`/v1/parks/${continent}/${country}/${city}/${parkSlug}/weather/hourly`, {
      cache: 'no-store',
    })
  );
}

/**
 * One park-day of the API's hourly answer in the shape the day chart and the planner's weather rail
 * read, or `null` when the answer does not hold that day. Each hour keeps its wall-clock time and
 * drops the offset (`2026-11-28T14:00`), since the chart compares it as a string with the schedule
 * and the nowcast; a fall-back day lists its repeated hour twice, in order. An hour without a
 * daylight flag counts as day.
 */
export function hourlyDayPoints(hourly: WeatherHourly, date: string): WeatherHourlyToday | null {
  const day = hourly.days.find((d) => d.date === date);
  if (!day || day.hours.length === 0) return null;
  return {
    timezone: hourly.park.timezone,
    points: day.hours.map((hour) => ({
      time: hour.time.slice(0, 16),
      temperatureC: hour.temperatureC ?? null,
      precipitationMm: hour.precipitationMm ?? null,
      precipitationProbability: hour.precipitationProbability ?? null,
      weatherCode: hour.weatherCode ?? null,
      isDay: hour.isDay ?? true,
    })),
  };
}
