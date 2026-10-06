'use client';

import { useLocale } from 'next-intl';
import { formatTime } from '@/lib/utils/intl-format';

interface LocalTimeProps {
  /** ISO 8601 date string */
  time: string;
  /** Timezone for display (defaults to park timezone) */
  timeZone?: string;
  format?: Intl.DateTimeFormatOptions;
  /** Fallback text if time is invalid */
  fallback?: string;
}

/**
 * A time in the reader's own 12/24 h format, rendered on the client to avoid a hydration mismatch,
 * inside a `<time datetime>`.
 */
export function LocalTime({
  time,
  timeZone,
  format = { hour: '2-digit', minute: '2-digit' },
  fallback = '—',
}: LocalTimeProps) {
  const locale = useLocale();

  const date = new Date(time);

  if (isNaN(date.getTime())) {
    return <>{fallback}</>;
  }

  let formattedTime: string;

  try {
    formattedTime = formatTime(date, locale, {
      ...format,
      timeZone,
    });
  } catch {
    // Fallback if formatting fails (e.g. invalid timezone)
    return <>{fallback}</>;
  }

  let datetimeValue: string;
  try {
    if (time.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      datetimeValue = time;
    } else {
      // `toISOString` is UTC, which a datetime attribute accepts.
      datetimeValue = date.toISOString();
    }
  } catch {
    datetimeValue = date.toISOString();
  }

  return <time dateTime={datetimeValue}>{formattedTime}</time>;
}

/** A time range such as opening hours, as two `LocalTime`s. */
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
