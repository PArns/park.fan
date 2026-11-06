/** One day's hours as the park payload carries them (`schedule[]`, `nextSchedule`). */
interface OpeningWindow {
  scheduleType?: string | null;
  openingTime: string | null;
  closingTime: string | null;
}

/** The validity window of an official warning, ISO 8601; a missing end means open-ended. */
interface WarningWindow {
  onset?: string | null;
  expires?: string | null;
}

/**
 * The warnings that touch the park's opening hours. A frost warning from 22:00 to 09:00 matters to
 * nobody standing in the queue at 09:00, and on the park page it pushed the day's numbers down
 * all night. A park whose hours are unknown keeps every warning: hiding one there would be a guess.
 */
export function warningsInOpeningHours<W extends WarningWindow>(
  warnings: W[],
  park: { schedule?: OpeningWindow[] | null; nextSchedule?: OpeningWindow | null }
): W[] {
  const hours = [...(park.schedule ?? []), ...(park.nextSchedule ? [park.nextSchedule] : [])];
  const windows = hours.flatMap((day) =>
    day.scheduleType === 'OPERATING' && day.openingTime && day.closingTime
      ? [{ open: Date.parse(day.openingTime), close: Date.parse(day.closingTime) }]
      : []
  );
  if (windows.length === 0) return warnings;
  return warnings.filter((warning) => {
    const start = warning.onset ? Date.parse(warning.onset) : -Infinity;
    const end = warning.expires ? Date.parse(warning.expires) : Infinity;
    return windows.some(({ open, close }) => start < close && end > open);
  });
}
