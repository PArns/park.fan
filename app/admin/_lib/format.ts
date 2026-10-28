import { formatDistanceToNow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { getDateTimeFormat } from '@/lib/utils/intl-format';

/**
 * A display name with the first letter of each part capitalised, fixed on the way out rather than
 * in the account. Only first letters change, so `McMahon` does not become `Mcmahon`.
 */
export function formatDisplayName(name: string): string {
  return name.replace(
    /(^|[\s-])(\p{Ll})/gu,
    (_, lead: string, first: string) => lead + first.toUpperCase()
  );
}

/** Formats an uptime given in hours as `3d 4h` from one day up, otherwise as `5h 12m`. */
export function formatUptime(hours: number) {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

/** A timestamp as a German calendar day for admin lists, `—` when there is none. */
export function formatDay(value: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return getDateTimeFormat('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    parsed
  );
}

/** An ISO time as the admin says it, in German and relative to now: `vor 3 Stunden`. */
export function formatAgo(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: de });
}

/** Returns the text colour class for a model's MAE: green below 10, amber below 15, red above. */
export function maeColor(mae: number) {
  if (mae < 10) return 'text-emerald-400';
  if (mae < 15) return 'text-amber-400';
  return 'text-red-400';
}
