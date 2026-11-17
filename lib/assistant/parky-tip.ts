import { routing } from '@/i18n/routing';
import type { CrowdLevel } from '@/lib/api/types';

/** Parky's verdict on a calendar day, from its crowd level (the API decides, not the model). */
export type ParkyTipVerdict = 'good' | 'meh' | 'bad';

/** The API's own table (`VERDICTS` in `src/assistant/parky-tip.service.ts`); the two move together. */
const VERDICT_BY_LEVEL: Partial<Record<CrowdLevel | 'closed', ParkyTipVerdict>> = {
  very_low: 'good',
  low: 'good',
  moderate: 'meh',
  high: 'bad',
  very_high: 'bad',
  extreme: 'bad',
};

/** Parky's tip for one day of a park's crowd calendar: the API's `…/parky-tip`. */
export interface ParkyDayTip {
  date: string;
  verdict: ParkyTipVerdict;
  /**
   * The day's crowd level the sentence was written for; the API writes a new one when the forecast
   * moves the day. Optional while an API without it may answer.
   */
  crowdLevel?: CrowdLevel;
  /** One sentence in Parky's voice, written for this park, day and language. */
  text: string;
  promptVersion: number;
}

/** The API answers days from today up to its calendar's horizon, park time. */
const HORIZON_DAYS = 92;
const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** `value` as a real `YYYY-MM-DD` day at UTC midnight, or null. */
function dayAt(value: string | null): number | null {
  if (!value || !DATE_RE.test(value)) return null;
  const at = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(at) || new Date(at).toISOString().slice(0, 10) !== value ? null : at;
}

/**
 * Whether the relay may ask for a tip on `date` in `locale`, written for the park's `today`: all
 * three land in the CDN's cache key, so only a real day from yesterday (a park west of UTC) to the
 * horizon, a today within a day of UTC's, and one of the site's six languages. `today` is in the
 * key because the sentence counts from it ("morgen", "am Samstag"): at the park's midnight the
 * dialog asks a new URL instead of reading yesterday's "morgen". Only the API knows the park's
 * today, so the relay hands it on and the API refuses one that is not (`mayKeepNoTip`).
 */
export function isServableTipRequest(
  date: string | null,
  today: string | null,
  locale: string | null,
  now: number
): boolean {
  if (!locale || !(routing.locales as readonly string[]).includes(locale)) return false;
  const at = dayAt(date);
  const parkToday = dayAt(today);
  if (at === null || parkToday === null) return false;
  const utcToday = Math.floor(now / DAY_MS) * DAY_MS;
  return (
    Math.abs(parkToday - utcToday) <= DAY_MS &&
    at >= parkToday &&
    at <= utcToday + HORIZON_DAYS * DAY_MS
  );
}

/**
 * Whether the relay may keep the API's 204 for its minutes, read off the API's `Cache-Control`. The
 * API says `no-store` where `today` is not the park's: a browser clock past the park's midnight
 * would otherwise keep „nothing to say" under the URL of a day that has not begun there. An API
 * that says `no-store` for every 204 only costs a relay call per dialog.
 */
export function mayKeepNoTip(cacheControl: string | null): boolean {
  return !/\bno-store\b/i.test(cacheControl ?? '');
}

/**
 * The verdict the API gives a day rated `level`, or null where it writes no tip (`closed`,
 * `unknown`, no level): nothing to ask for, and nothing a tip could contradict.
 */
export function tipVerdictFor(
  level: CrowdLevel | 'closed' | null | undefined
): ParkyTipVerdict | null {
  return (level && VERDICT_BY_LEVEL[level]) ?? null;
}

/**
 * Whether a tip may stand above the crowd panel that shows `level` for the same day. The calendar
 * month and the tip are cached for different windows, so once the forecast moves overnight one of
 * them still has the old day: a „lieber nicht“ over „sehr niedrig“ is worse than no tip. A tip that
 * names the level it was written for must name the panel's: a sentence about a „hoch“ day reads
 * wrong over „extrem“ though both say „lieber nicht“. Without one, the verdicts must match.
 */
export function tipAgreesWithLevel(
  tip: Pick<ParkyDayTip, 'verdict' | 'crowdLevel'>,
  level: CrowdLevel | 'closed' | null | undefined
): boolean {
  const shown = tipVerdictFor(level);
  if (!shown) return true;
  return tip.crowdLevel ? tip.crowdLevel === level : shown === tip.verdict;
}

/**
 * Whether a relayed body is a tip this site can show. A `crowdLevel`, where one is sent, must be a
 * level with that verdict: a tip whose own two fields disagree is not shown.
 */
export function isParkyDayTip(value: unknown): value is ParkyDayTip {
  const tip = value as Partial<ParkyDayTip> | null;
  return (
    !!tip &&
    typeof tip.text === 'string' &&
    tip.text.trim().length > 0 &&
    (tip.verdict === 'good' || tip.verdict === 'meh' || tip.verdict === 'bad') &&
    (tip.crowdLevel === undefined || tipVerdictFor(tip.crowdLevel) === tip.verdict)
  );
}
