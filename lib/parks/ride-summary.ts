import type { ParkAttraction } from '@/lib/api/types';
import { getListFormat, weekdayName } from '@/lib/utils/intl-format';
import { formatPeakDate, quietestWeekdays } from '@/lib/utils/typical-waits';
import { formatDuration } from '@/lib/utils/temperature';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { stripNewPrefix } from '@/lib/utils';

/**
 * The ride page's data card, as data: which sentences this ride has facts for, and the figures the
 * card sets apart. Pure and synchronous, so the card, its gate and the test ask the same function.
 *
 * Every input is day-stable: the curated ride facts and the precomputed aggregates the park
 * payload carries (`typicalWaits`, `ropeDrop`). Nothing reads `status`, `queues`, `statistics` or
 * a clock, so the text is the same at noon and at 3 a.m. and the card cannot mismatch on hydration
 * (it never hydrates). Waits are on the five-minute grid, like every wait the site shows.
 */

/** One sentence: a key under `attraction.dataCard` and its ICU values. */
export interface RideSummarySentence {
  key:
    | 'identity'
    | 'place'
    | 'height'
    | 'stats'
    | 'queues'
    | 'typical'
    | 'quietDay'
    | 'record'
    | 'ropeDrop'
    | 'evening';
  values: Record<string, string | number>;
}

/** One fragment of the stats sentence, under `attraction.dataCard.stat`. */
export interface RideSummaryStat {
  key: 'speed' | 'height' | 'length' | 'inversions' | 'duration';
  values: Record<string, string | number>;
}

/** A figure the card shows large. `unit` says how the renderer draws `value`. */
export interface RideSummaryMetric {
  key: 'typicalPeak' | 'record' | 'topSpeed' | 'opened' | 'minHeight' | 'inversions';
  value: number;
  unit: 'minutes' | 'kmh' | 'year' | 'cm' | 'count';
  /** A dated figure's date, already formatted. */
  note?: string;
}

/** The measurements the sentences refer to by tag (`<minHeight></minHeight>`), in metric. */
export interface RideSummaryFigures {
  minHeightCm?: number;
  maxHeightCm?: number;
  speedKmh?: number;
  heightM?: number;
  lengthM?: number;
}

export interface RideSummary {
  sentences: RideSummarySentence[];
  /** Empty unless the ride has a profile with at least one measurement. */
  stats: RideSummaryStat[];
  metrics: RideSummaryMetric[];
  figures: RideSummaryFigures;
}

/** The ride's first ride-type term, already resolved to a name in the reader's language. */
export interface RideSummaryType {
  name: string;
  href: string;
}

/** The card shows at most this many large figures: two rows of two on a phone. */
const MAX_METRICS = 4;

/**
 * Below this many large figures the column is dropped and the text takes the card's width, since
 * one figure beside a paragraph is a cell filled with one line.
 */
export const MIN_METRICS = 2;

/**
 * English needs „an" before a vowel sound; the other five locales ignore the value. A first letter
 * is the whole test: none of the glossary's ride-type names opens on a silent h or a „you" sound.
 */
function startsWithVowel(text: string): 'yes' | 'no' {
  return /^[aeiou]/i.test(text) ? 'yes' : 'no';
}

/**
 * A wait on the five-minute grid, or null where it rounds to nothing: „about 0 minutes" is not a
 * sentence anyone needs.
 */
function positiveWait(value: number | null | undefined): number | null {
  if (value == null) return null;
  const rounded = roundWaitTo5(value);
  return rounded > 0 ? rounded : null;
}

/**
 * The facts present, joined into one ICU select value (`type_maker_year`), so each language words
 * every combination itself instead of gluing optional clauses together.
 */
function shape(parts: [string, boolean][]): string {
  return parts
    .filter(([, on]) => on)
    .map(([name]) => name)
    .join('_');
}

/**
 * The data card's content for one ride.
 *
 * @param typeTerm the profile's first ride type, resolved through the glossary, or null.
 * @param locale for weekday names, list joins and the record's date.
 */
export function buildRideSummary(
  attraction: ParkAttraction,
  typeTerm: RideSummaryType | null,
  locale: string
): RideSummary {
  const ride = stripNewPrefix(attraction.name);
  const profile = attraction.rideProfile ?? null;
  const sentences: RideSummarySentence[] = [];
  const metrics: RideSummaryMetric[] = [];
  const figures: RideSummaryFigures = {};

  // `!= null` throughout: the API strips null-valued keys, so unknown arrives as missing.
  const maker = profile?.manufacturer || null;
  const year = profile?.openedYear ?? null;
  const identity = shape([
    ['type', typeTerm != null],
    ['maker', maker != null],
    ['year', year != null],
  ]);
  if (identity) {
    sentences.push({
      key: 'identity',
      values: {
        ride,
        shape: identity,
        typeName: typeTerm?.name ?? '',
        vowel: startsWithVowel(typeTerm?.name ?? ''),
        maker: maker ?? '',
        // A string: ICU formats a bare number, and 2017 would read „2.017" in four locales.
        year: year != null ? String(year) : '',
      },
    });
  }

  const exposure =
    attraction.indoorOutdoor === 'indoor'
      ? 'indoor'
      : attraction.indoorOutdoor === 'outdoor'
        ? 'outdoor'
        : attraction.indoorOutdoor === 'covered_queue'
          ? 'covered'
          : null;
  const place = shape([
    ['land', Boolean(attraction.land)],
    [exposure ?? '', exposure != null],
  ]);
  if (place) {
    sentences.push({
      key: 'place',
      // After the identity sentence the ride is „it", so its name does not open two in a row.
      values: { ride, shape: place, land: attraction.land ?? '', lead: identity ? 'it' : 'name' },
    });
  }

  if (attraction.minimumHeight != null) figures.minHeightCm = attraction.minimumHeight;
  if (attraction.maximumHeight != null) figures.maxHeightCm = attraction.maximumHeight;
  const height = shape([
    ['min', attraction.minimumHeight != null],
    ['max', attraction.maximumHeight != null],
  ]);
  if (height) sentences.push({ key: 'height', values: { shape: height } });

  const stats: RideSummaryStat[] = [];
  const measured = profile?.stats ?? null;
  if (measured?.topSpeedKmh != null) {
    figures.speedKmh = measured.topSpeedKmh;
    stats.push({ key: 'speed', values: {} });
  }
  if (measured?.heightM != null) {
    figures.heightM = measured.heightM;
    stats.push({ key: 'height', values: {} });
  }
  if (measured?.lengthM != null) {
    figures.lengthM = measured.lengthM;
    stats.push({ key: 'length', values: {} });
  }
  if (profile?.inversions != null) {
    stats.push({ key: 'inversions', values: { count: profile.inversions } });
  }
  if (measured?.durationSeconds != null) {
    stats.push({ key: 'duration', values: { duration: formatDuration(measured.durationSeconds) } });
  }
  if (stats.length > 0) sentences.push({ key: 'stats', values: { ride } });

  const queues = shape([
    ['single', attraction.hasSingleRider === true],
    ['virtual', attraction.hasVirtualLine === true],
  ]);
  if (queues) sentences.push({ key: 'queues', values: { shape: queues } });

  const typical = attraction.typicalWaits?.displayable ? attraction.typicalWaits : null;
  const weekday = positiveWait(typical?.weekday.typical);
  const weekend = positiveWait(typical?.weekend.typical);
  if (typical && (weekday != null || weekend != null)) {
    const busyRaw = Math.max(typical.weekday.busy ?? 0, typical.weekend.busy ?? 0);
    const busy = roundWaitTo5(busyRaw);
    // The busy clause only when it says more than the typical figures already do.
    const hasBusy = busy > Math.max(weekday ?? 0, weekend ?? 0);
    const split =
      weekday != null && weekend != null ? (weekday === weekend ? 'same' : 'split') : null;
    sentences.push({
      key: 'typical',
      values: {
        shape: split ?? (weekday != null ? 'weekday' : 'weekend'),
        days: typical.windowDays,
        weekday: weekday ?? 0,
        weekend: weekend ?? 0,
        busy,
        hasBusy: hasBusy ? 'yes' : 'no',
      },
    });

    const quiet = quietestWeekdays(typical, roundWaitTo5);
    if (quiet.verdict === 'days' && quiet.typical > 0) {
      sentences.push({
        key: 'quietDay',
        values: {
          count: quiet.days.length,
          days: getListFormat(locale, { type: 'conjunction' }).format(
            quiet.days.map((d) => weekdayName(d, locale))
          ),
          minutes: quiet.typical,
        },
      });
    } else if (quiet.verdict === 'flat') {
      sentences.push({ key: 'quietDay', values: { count: 0, days: '', minutes: 0 } });
    }

    const record = positiveWait(typical.peak?.value);
    if (typical.peak && record != null) {
      const date = formatPeakDate(typical.peak.date, locale);
      sentences.push({ key: 'record', values: { minutes: record, date } });
      if (weekday != null) metrics.push({ key: 'typicalPeak', value: weekday, unit: 'minutes' });
      metrics.push({ key: 'record', value: record, unit: 'minutes', note: date });
    } else if (weekday != null) {
      metrics.push({ key: 'typicalPeak', value: weekday, unit: 'minutes' });
    }
  }

  // Only the two verdicts the rope-drop card turns into a recommendation; a „no" says nothing
  // about the ride that the typical figures above have not already said.
  const ropeDrop = attraction.ropeDrop ?? null;
  if (ropeDrop?.worth) {
    const open = positiveWait(ropeDrop.openWait);
    const peak = positiveWait(ropeDrop.busyPeak);
    if (open != null && peak != null && peak > open) {
      sentences.push({ key: 'ropeDrop', values: { open, peak } });
    }
  } else if (ropeDrop?.endOfDayWorth) {
    const minutes = positiveWait(ropeDrop.bestSlotWait);
    if (minutes != null) sentences.push({ key: 'evening', values: { minutes } });
  }

  if (figures.speedKmh != null)
    metrics.push({ key: 'topSpeed', value: figures.speedKmh, unit: 'kmh' });
  if (year != null) metrics.push({ key: 'opened', value: year, unit: 'year' });
  if (figures.minHeightCm != null) {
    metrics.push({ key: 'minHeight', value: figures.minHeightCm, unit: 'cm' });
  }
  if (profile?.inversions != null && profile.inversions > 0) {
    metrics.push({ key: 'inversions', value: profile.inversions, unit: 'count' });
  }

  return {
    sentences,
    stats,
    metrics: metrics.length >= MIN_METRICS ? metrics.slice(0, MAX_METRICS) : [],
    figures,
  };
}

/**
 * Whether the data card renders: three sentences, or two beside a column of figures. Fewer is a
 * card holding one line about a ride whose badges already say it. Exported so the page's gate and
 * the card ask the same question.
 */
export function rideSummaryRenders(summary: RideSummary): boolean {
  return (
    summary.sentences.length >= 3 || (summary.sentences.length >= 2 && summary.metrics.length > 0)
  );
}
