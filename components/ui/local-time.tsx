'use client';

import { useLocale } from 'next-intl';

interface LocalTimeProps {
  /** ISO 8601 date string */
  time: string;
  /** Timezone for display (defaults to park timezone) */
  timeZone?: string;
  /** Time format options */
  format?: Intl.DateTimeFormatOptions;
  /** Fallback text if time is invalid */
  fallback?: string;
}

/**
 * Client component for displaying times in user's local format
 * Prevents hydration mismatches and respects user's 12h/24h preference
 * Wraps output in semantic <time> tag with datetime attribute for SEO
 */
export function LocalTime({
  time,
  timeZone,
  format = { hour: '2-digit', minute: '2-digit' },
  fallback = '—',
}: LocalTimeProps) {
  const locale = useLocale();

  const date = new Date(time);

  // Check for invalid date
  if (isNaN(date.getTime())) {
    return <>{fallback}</>;
  }

  let formattedTime: string;

  try {
    // Format the string first
    formattedTime = date.toLocaleTimeString(locale, {
      ...format,
      timeZone,
    });
  } catch {
    // Fallback if formatting fails (e.g. invalid timezone)
    return <>{fallback}</>;
  }

  // Convert time to ISO 8601 format for datetime attribute
  // Use the original time string if it's already in ISO format, otherwise convert
  let datetimeValue: string;
  try {
    // If the input time string is already in ISO 8601 format, use it directly
    // Otherwise, convert the Date object to ISO string
    if (time.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      // Already in ISO format, use as-is
      datetimeValue = time;
    } else {
      // Convert to ISO string (always uses UTC, which is fine for datetime attribute)
      datetimeValue = date.toISOString();
    }
  } catch {
    // Fallback to ISO string if conversion fails
    datetimeValue = date.toISOString();
  }

  return <time dateTime={datetimeValue}>{formattedTime}</time>;
}

/**
 * Display a time range (e.g., opening hours)
 * Uses semantic <time> tags via LocalTime component
 */
export function LocalTimeRange({
  start,
  end,
  timeZone,
  separator = ' - ',
}: {
  start: string;
  end: string;
  timeZone?: string;
  separator?: string;
}) {
  return (
    <>
      <LocalTime time={start} timeZone={timeZone} />
      {separator}
      <LocalTime time={end} timeZone={timeZone} />
    </>
  );
}
