import { routing } from '@/i18n/routing';

/** Parky's verdict on a calendar day, from its crowd level (the API decides, not the model). */
export type ParkyTipVerdict = 'good' | 'meh' | 'bad';

/** Parky's tip for one day of a park's crowd calendar: the API's `…/parky-tip`. */
export interface ParkyDayTip {
  date: string;
  verdict: ParkyTipVerdict;
  /** One sentence in Parky's voice, written for this park, day and language. */
  text: string;
  promptVersion: number;
}

/** The API answers days from today up to its calendar's horizon, park time. */
const HORIZON_DAYS = 92;
const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Whether the relay may ask for a tip on `date` in `locale`: both land in the CDN's cache key, so
 * only a real day from yesterday (a park west of UTC) to the horizon, in one of the site's six
 * languages.
 */
export function isServableTipRequest(
  date: string | null,
  locale: string | null,
  now: number
): boolean {
  if (!date || !DATE_RE.test(date)) return false;
  if (!locale || !(routing.locales as readonly string[]).includes(locale)) return false;
  const at = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(at) || new Date(at).toISOString().slice(0, 10) !== date) return false;
  const today = Math.floor(now / DAY_MS) * DAY_MS;
  return at >= today - DAY_MS && at <= today + HORIZON_DAYS * DAY_MS;
}

/** Whether a relayed body is a tip this site can show. */
export function isParkyDayTip(value: unknown): value is ParkyDayTip {
  const tip = value as Partial<ParkyDayTip> | null;
  return (
    !!tip &&
    typeof tip.text === 'string' &&
    tip.text.trim().length > 0 &&
    (tip.verdict === 'good' || tip.verdict === 'meh' || tip.verdict === 'bad')
  );
}
