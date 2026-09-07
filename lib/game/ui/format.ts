/**
 * Number and time formatting for the HUD. Pure, node-runnable, covered by `selftest.mjs`.
 *
 * Two rules run through all of it.
 *
 * **Money is whole cents everywhere in this game** (ARCHITECTURE §2), so every function here takes
 * cents and no caller ever divides by 100 on its own — that division done in nine places is how a
 * price ends up rendered as `2.5` in one panel and `€2.50` in another.
 *
 * **A figure in the HUD is read at a glance and re-read a second later**, so everything is
 * tabular and nothing changes width when it changes value: the formatters pad rather than let the
 * layout reflow, and the components that draw them carry `tabular-nums`. A cash counter that
 * shifts its neighbours every time a guest buys a drink is the thing this avoids.
 */

/** `540` → `09:00`. Park minutes since midnight; the fractional part is dropped, never rounded. */
export function clockTime(minute: number): string {
  const total = ((Math.floor(minute) % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * Cents to a currency string.
 *
 * Whole euros lose the decimals — a park's cash is read as a magnitude and `€2,500,000.00` is
 * four characters of noise — and anything with cents in it keeps both, because a €2.50 drink
 * rendered as `€3` is a different price.
 */
export function money(cents: number, locale: string): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
}

/** Cents to a currency string with no decimals ever. For a running total in the top bar. */
export function moneyWhole(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Math.round(cents / 100));
}

/** `1240` → `1,240`, in the reader's locale. */
export function count(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

/** `0.63` → `63 %`. Clamped, because a ratio of 1.02 in a meter is a rendering bug on screen. */
export function percent(ratio: number): string {
  const clamped = Math.max(0, Math.min(1, ratio));
  return `${Math.round(clamped * 100)} %`;
}

/** One decimal, for a temperature or a wind speed. */
export function decimal(value: number, locale: string, digits = 1): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/**
 * How full a queue's ride is running, 0..1, for a meter.
 *
 * Capped at one machine's worth of people waiting per five loads: past that the bar is pinned and
 * the number beside it is what carries the information. A meter with no ceiling is a meter that
 * spends the whole park's life in its first eighth.
 */
export function queuePressure(queue: number, capacity: number): number {
  if (capacity <= 0) return queue > 0 ? 1 : 0;
  return Math.max(0, Math.min(1, queue / (capacity * 5)));
}

/** A 0..10 content rating (excitement, fear, nausea) as a 0..1 meter value. */
export function ratingFraction(value: number): number {
  return Math.max(0, Math.min(1, value / 10));
}

/**
 * The four parts of a park day, from the minute alone.
 *
 * Used for the tint of the clock's day strip. Deliberately not derived from the sun's elevation:
 * the strip is a map of the whole day and has to be drawn for minutes the sun is not at.
 */
export function dayPart(minute: number): 'night' | 'dawn' | 'day' | 'dusk' {
  const m = ((minute % 1440) + 1440) % 1440;
  if (m < 5 * 60 || m >= 22 * 60) return 'night';
  if (m < 8 * 60) return 'dawn';
  if (m < 19 * 60) return 'day';
  return 'dusk';
}

/** Park minutes since a stamp, for a log line. Handles the day rollover. */
export function minutesSince(
  then: { day: number; minute: number },
  now: { day: number; minute: number }
): number {
  return (now.day - then.day) * 1440 + (now.minute - then.minute);
}

/**
 * A log line's age, as a park-clock time plus how long ago it was.
 *
 * The clock time alone is ambiguous over a day boundary and "12 min ago" alone loses the thing a
 * player actually navigates by, which is when in the park's day it happened.
 */
export function logAge(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${String(m % 60).padStart(2, '0')}`;
}
