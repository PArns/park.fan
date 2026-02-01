import { parseISO, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import type {
  CalendarEvent,
  CalendarEventData,
  ScheduleItem,
  WeatherDay,
  HolidayItem,
  ParkDailyPrediction,
  Recommendation,
  CrowdLevel,
} from '@/lib/api/types';
import {
  CalendarDays,
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  Users,
  Star,
  PartyPopper,
  AlertCircle,
  CloudDrizzle,
  CloudSnow,
  CloudFog,
  Wind,
  Clock,
  Ban,
  Ticket,
  Clapperboard,
  type LucideIcon,
} from 'lucide-react';

/**
 * Helper to convert a date/string into a "Park Time" Date object.
 *
 * This effectively shifts the timestamp so that:
 * 2023-01-01T10:00:00 (Park Time) -> Sun Jan 01 2023 10:00:00 (Browser Local Time)
 *
 * This is necessary because react-big-calendar interprets Date objects in the
 * browser's local timezone. If we want to show "10:00 AM" in the calendar regardless
 * of where the user is, we must lie to the Date object so it *thinks* it is 10 AM locally.
 */
export function getParkTime(dateInput: string | Date, timezone: string): Date {
  // Format the date into the Park's timezone as a string "YYYY-MM-DDTHH:mm:ss"
  // behaving as if it's a local time string.
  // We explicitly use ISO format without Z to force the Date constructor to interpret as local.
  const parkTimeString = formatInTimeZone(dateInput, timezone, "yyyy-MM-dd'T'HH:mm:ss");

  // Parse this string as a local Date.
  // e.g. "2023-01-01T10:00:00" -> 10:00 AM Local Browser Time
  return new Date(parkTimeString);
}

/**
 * Transform schedule items to calendar events
 */
export function transformScheduleToEvents(
  schedule: ScheduleItem[],
  timezone: string
): CalendarEvent[] {
  return schedule.map((item, index) => {
    const date = parseISO(item.date);
    const zonedDate = toZonedTime(date, timezone);

    let title = '';
    let startTime = zonedDate;
    let endTime = zonedDate;
    let isAllDay = false;
    let icon = 'Clock';

    if (item.scheduleType === 'OPERATING' && item.openingTime && item.closingTime) {
      const openTime = parseISO(`${item.date}T${item.openingTime}`);
      const closeTime = parseISO(`${item.date}T${item.closingTime}`);

      startTime = toZonedTime(openTime, timezone);
      endTime = toZonedTime(closeTime, timezone);

      // Format hours to be more readable
      title = `${item.openingTime}-${item.closingTime}`;
      isAllDay = false; // Show as timed event
    } else {
      title = 'Closed';
      startTime = startOfDay(zonedDate);
      endTime = endOfDay(zonedDate);
      isAllDay = true;
      icon = 'Ban';
    }

    return {
      id: `schedule-${index}-${item.date}`,
      title,
      start: startTime,
      end: endTime,
      allDay: isAllDay,
      resource: {
        type: 'schedule',
        icon: icon,
        data: item,
        timezone,
        details: item.description || undefined,
      } as CalendarEventData,
    };
  });
}

/**
 * Transform weather forecasts to calendar events
 */
export function transformWeatherToEvents(weather: WeatherDay[], timezone: string): CalendarEvent[] {
  return weather.map((day, index) => {
    const date = parseISO(day.date);
    const zonedDate = toZonedTime(date, timezone);

    const tempMax = parseFloat(day.temperatureMax);
    const tempMin = parseFloat(day.temperatureMin);
    const avgTemp = Math.round((tempMax + tempMin) / 2);

    // Add weather emoji and description
    const weatherIcon = getWeatherIcon(day.weatherCode);

    // Add precipitation if present
    const precipitation = parseFloat(day.precipitationSum);
    const precipInfo = precipitation > 0 ? ` 🌧 ${Math.round(precipitation)}mm` : '';

    return {
      id: `weather-${index}-${day.date}`,
      title: `${avgTemp}°C${precipInfo}`,
      start: startOfDay(zonedDate),
      end: endOfDay(zonedDate),
      allDay: true,
      resource: {
        type: 'weather',
        icon: weatherIcon,
        data: day,
        timezone,
        details: `${day.weatherDescription} | ${day.temperatureMin}°C-${day.temperatureMax}°C${precipInfo}`,
      } as CalendarEventData,
    };
  });
}

export function transformHolidaysToEvents(
  holidays: HolidayItem[],
  timezone: string
): CalendarEvent[] {
  return holidays.map((holiday, index) => {
    const date = parseISO(holiday.date);
    const zonedDate = toZonedTime(date, timezone);

    return {
      id: `holiday-${index}-${holiday.date}`,
      title: `${holiday.localName || holiday.name}`,
      start: startOfDay(zonedDate),
      end: endOfDay(zonedDate),
      allDay: true,
      resource: {
        type: 'holiday',
        icon: 'PartyPopper',
        data: holiday,
        timezone,
        details: `${holiday.holidayType} - ${holiday.isNationwide ? 'Nationwide' : 'Regional'}`,
      } as CalendarEventData,
    };
  });
}

export function transformCrowdPredictionsToEvents(
  predictions: ParkDailyPrediction[],
  timezone: string
): CalendarEvent[] {
  return predictions.map((prediction, index) => {
    const date = parseISO(prediction.date);
    const zonedDate = toZonedTime(date, timezone);

    const crowdLabel = getCrowdLevelLabel(prediction.crowdLevel);
    const confidence = Math.round(prediction.confidencePercentage);

    return {
      id: `crowd-${index}-${prediction.date}`,
      title: `${crowdLabel} (${confidence}%)`,
      start: startOfDay(zonedDate),
      end: endOfDay(zonedDate),
      allDay: true,
      resource: {
        type: 'crowd',
        icon: 'Users',
        data: prediction,
        timezone,
        details: prediction.recommendation
          ? `Recommendation: ${getRecommendationLabel(prediction.recommendation)}`
          : undefined,
      } as CalendarEventData,
    };
  });
}

/**
 * Extract holidays directly from schedule items (fallback when holiday API fails)
 */
export function extractHolidaysFromSchedule(
  schedule: ScheduleItem[],
  timezone: string
): CalendarEvent[] {
  return schedule
    .filter((item) => item.isHoliday && item.holidayName)
    .map((item, index) => {
      const date = parseISO(item.date);
      const zonedDate = toZonedTime(date, timezone);

      return {
        id: `holiday-schedule-${index}-${item.date}`,
        title: `${item.holidayName}`,
        start: startOfDay(zonedDate),
        end: endOfDay(zonedDate),
        allDay: true,
        resource: {
          type: 'holiday',
          icon: 'PartyPopper',
          data: {
            date: item.date,
            name: item.holidayName!,
            localName: item.holidayName!,
            holidayType: 'public', // Default since we don't know from schedule
            countryCode: '',
            country: '', // Added missing prop
            region: '', // Added missing prop
            isNationwide: true,
          } as HolidayItem,
          timezone,
          details: 'Public Holiday',
        } as CalendarEventData,
      };
    });
}

/**
 * Merge calendar events by date
 */
export function mergeCalendarEvents(...eventArrays: CalendarEvent[][]): CalendarEvent[] {
  return eventArrays.flat().sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Get icon name for weather code
 */
export function getWeatherIcon(weatherCode: number): string {
  // WMO Weather codes
  // https://open-meteo.com/en/docs
  if (weatherCode === 0) return 'Sun'; // Clear sky
  if (weatherCode >= 1 && weatherCode <= 3) return 'Cloud'; // Partly cloudy
  if (weatherCode >= 45 && weatherCode <= 48) return 'CloudFog'; // Fog
  if (weatherCode >= 51 && weatherCode <= 57) return 'CloudDrizzle'; // Drizzle
  if (weatherCode >= 61 && weatherCode <= 67) return 'CloudRain'; // Rain
  if (weatherCode >= 71 && weatherCode <= 77) return 'CloudSnow'; // Snow
  if (weatherCode >= 80 && weatherCode <= 82) return 'CloudRain'; // Rain showers
  if (weatherCode >= 85 && weatherCode <= 86) return 'Snowflake'; // Snow showers
  if (weatherCode >= 95 && weatherCode <= 99) return 'CloudRain'; // Thunderstorm
  return 'Cloud'; // Default
}

/**
 * Get icon name for weather string code or number
 */
export function getWeatherIconFromCode(iconCode: string | number): string {
  if (typeof iconCode === 'number') {
    return getWeatherIcon(iconCode);
  }

  const iconMap: Record<string, string> = {
    'clear-day': 'Sun',
    'clear-night': 'Star',
    cloudy: 'Cloud',
    'partly-cloudy-day': 'Cloud',
    'partly-cloudy-night': 'Cloud',
    rain: 'CloudRain',
    drizzle: 'CloudDrizzle',
    snow: 'Snowflake',
    sleet: 'CloudSnow',
    wind: 'Wind',
    fog: 'CloudFog',
    thunderstorm: 'CloudRain',
  };

  return iconMap[iconCode] || 'Cloud';
}

/**
 * Get weather emoji for calendar display
 */
export function getWeatherEmoji(iconCode: string | number): string {
  // If it's a number (weather code), use the old logic
  if (typeof iconCode === 'number') {
    if (iconCode === 0) return '☀️'; // Clear sky
    if (iconCode >= 1 && iconCode <= 3) return '⛅'; // Partly cloudy
    if (iconCode >= 45 && iconCode <= 48) return '🌫️'; // Fog
    if (iconCode >= 51 && iconCode <= 57) return '🌦️'; // Drizzle
    if (iconCode >= 61 && iconCode <= 67) return '🌧️'; // Rain
    if (iconCode >= 71 && iconCode <= 77) return '🌨️'; // Snow
    if (iconCode >= 80 && iconCode <= 82) return '🌧️'; // Rain showers
    if (iconCode >= 85 && iconCode <= 86) return '❄️'; // Snow showers
    if (iconCode >= 95 && iconCode <= 99) return '⛈️'; // Thunderstorm
    return '☁️'; // Default
  }

  // If it's a string (icon code), use the mapping
  const emojiMap: Record<string, string> = {
    'clear-day': '☀️',
    'clear-night': '🌙',
    cloudy: '☁️',
    'partly-cloudy-day': '⛅',
    'partly-cloudy-night': '☁️',
    rain: '🌧️',
    drizzle: '🌦️',
    snow: '❄️',
    sleet: '🌨️',
    wind: '💨',
    fog: '🌫️',
    thunderstorm: '⛈️',
  };

  return emojiMap[iconCode] || '🌤️';
}

/**
 * Get icon component for event type
 */
export function getEventIcon(eventType: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    Sun,
    Cloud,
    CloudRain,
    CloudDrizzle,
    CloudSnow,
    CloudFog,
    Snowflake,
    Wind,
    CalendarDays,
    Users,
    Star,
    PartyPopper,
    AlertCircle,
    Clock,
    Ban,
    Ticket,
    Clapperboard,
  };

  return iconMap[eventType] || CalendarDays;
}

/**
/**
 * Get translation key for weather code
 */
export function getWeatherTranslationKey(weatherCode: number): string {
  if (weatherCode === 0) return 'clear';
  if (weatherCode === 1) return 'mainlyClear';
  if (weatherCode === 2) return 'partlyCloudy';
  if (weatherCode === 3) return 'overcast';
  if (weatherCode === 45 || weatherCode === 48) return 'fog';
  if (weatherCode >= 51 && weatherCode <= 55) return 'drizzle';
  if (weatherCode >= 56 && weatherCode <= 57) return 'freezingDrizzle';
  if (weatherCode >= 61 && weatherCode <= 65) return 'rain';
  if (weatherCode >= 66 && weatherCode <= 67) return 'freezingRain';
  if (weatherCode >= 71 && weatherCode <= 75) return 'snow';
  if (weatherCode === 77) return 'snowGrains';
  if (weatherCode >= 80 && weatherCode <= 82) return 'rainShowers';
  if (weatherCode >= 85 && weatherCode <= 86) return 'snowShowers';
  if (weatherCode >= 95 && weatherCode <= 99) return 'thunderstorm';

  return 'cloudy'; // Default fallback
}

/**
 * Get crowd level emoji
 */
export function getCrowdLevelEmoji(crowdLevel: CrowdLevel | 'closed'): string {
  const emojis: Record<string, string> = {
    very_low: '🟢',
    low: '🟢',
    moderate: '🟢',
    high: '🟠',
    very_high: '🔴',
    extreme: '🔴',
    closed: '🚫',
  };

  return emojis[crowdLevel] || '⚪';
}

/**
 * Get crowd level label
 */
export function getCrowdLevelLabel(crowdLevel: CrowdLevel | 'closed'): string {
  const labels: Record<string, string> = {
    very_low: 'Very Low',
    low: 'Low',
    moderate: 'Normal',
    high: 'High',
    very_high: 'Very High',
    extreme: 'Extreme',
    closed: 'Closed',
  };

  return labels[crowdLevel] || crowdLevel;
}

/**
 * Get recommendation label
 */
export function getRecommendationLabel(recommendation: Recommendation): string {
  const labels: Record<Recommendation, string> = {
    highly_recommended: 'Highly Recommended',
    recommended: 'Recommended',
    neutral: 'Neutral',
    avoid: 'Avoid',
    strongly_avoid: 'Strongly Avoid',
    closed: 'Closed',
  };

  return labels[recommendation];
}

/**
 * Get crowd level color class
 */
/* Same scale as badge/globals: teal → emerald → green; then orange → rose → red */
export function getCrowdLevelColor(crowdLevel: CrowdLevel | 'closed'): string {
  const colors: Record<string, string> = {
    very_low: 'bg-teal-100 dark:bg-teal-900/70 border-teal-400 dark:border-teal-500',
    low: 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-600',
    moderate: 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-600',
    high: 'bg-orange-100 dark:bg-orange-900/50 border-orange-300 dark:border-orange-600',
    very_high: 'bg-rose-100 dark:bg-rose-900/50 border-rose-300 dark:border-rose-600',
    extreme: 'bg-red-100 dark:bg-red-900/50 border-red-400 dark:border-red-600',
    closed: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600',
  };

  return colors[crowdLevel] || colors.moderate;
}

/**
 * Format event description for display
 */
export function formatEventDescription(event: CalendarEvent): string {
  const { resource } = event;

  switch (resource.type) {
    case 'schedule': {
      const schedule = resource.schedule || (resource.data as ScheduleItem);
      if (!schedule) return 'Schedule information unavailable';

      if (schedule.scheduleType === 'CLOSED') {
        return resource.details || schedule.description || 'Park is closed';
      }
      if (schedule.openingTime && schedule.closingTime) {
        return `Open: ${schedule.openingTime.substring(0, 5)} - ${schedule.closingTime.substring(0, 5)}`;
      }
      return 'Schedule information unavailable';
    }

    case 'weather': {
      if (resource.details) return resource.details;
      const weather = resource.weather || (resource.data as WeatherDay);
      if (!weather) return 'Weather information unavailable';

      let desc: string;
      let min: string | number;
      let max: string | number;

      if ('condition' in weather) {
        desc = weather.condition;
        min = weather.tempMin;
        max = weather.tempMax;
      } else {
        const w = weather as WeatherDay;
        desc = w.weatherDescription;
        min = w.temperatureMin;
        max = w.temperatureMax;
      }
      return `${desc} | ${min}°C - ${max}°C`;
    }

    case 'holiday': {
      const holiday = resource.holiday || (resource.data as HolidayItem);
      if (!holiday) return 'Holiday information unavailable';
      return `${holiday.name} (${holiday.isNationwide ? 'Nationwide' : 'Regional'})`;
    }

    case 'crowd': {
      // Handle formatted crowd object from park calendar components
      if (resource.crowd) {
        const crowd = resource.crowd;
        const level = getCrowdLevelLabel(crowd.crowdLevel);
        const confidence = Math.round(crowd.confidencePercentage);
        return `Expected crowd: ${level} (${confidence}% confidence)`;
      }

      const crowd = resource.data as ParkDailyPrediction;
      if (crowd) {
        const level = getCrowdLevelLabel(crowd.crowdLevel);
        const confidence = Math.round(crowd.confidencePercentage);
        return `Expected crowd: ${level} (${confidence}% confidence)`;
      }
      return 'Crowd prediction unavailable';
    }

    case 'recommendation': {
      const rec = resource.recommendation; // String
      if (rec) return rec;

      const recData = resource.data as ParkDailyPrediction;
      if (recData && recData.recommendation) {
        return getRecommendationLabel(recData.recommendation);
      }
      return 'No recommendation';
    }

    case 'show': {
      if (resource.show) {
        if (resource.show.endTime) {
          // Robust formatting using parsed dates
          const start = getParkTime(resource.show.time, resource.timezone || 'UTC');
          const end = getParkTime(resource.show.endTime, resource.timezone || 'UTC');
          // Since getParkTime returns a "Local" date that looks like Park Time, we just format "Local" HH:mm
          // However, formatEventDescription is sometimes used outside of the "shifted" context?
          // No, this is for display text.
          const startStr = start.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          const endStr = end.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          return `${resource.show.name}: ${startStr} - ${endStr}`;
        }
        const start = getParkTime(resource.show.time, resource.timezone || 'UTC');
        const startStr = start.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        return `${resource.show.name} at ${startStr}`;
      }
      return 'Show details unavailable';
    }

    default:
      return event.title;
  }
}
