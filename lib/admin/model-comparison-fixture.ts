import type {
  ModelCell,
  ModelCellLive,
  ModelCellOffline,
  ModelCellState,
  ModelComparisonDay,
  ModelComparisonDayOptions,
  ModelComparisonQuestion,
  ModelComparisonReport,
} from '@/lib/api/admin-model-comparison';
import { dayMae } from '@/lib/admin/model-comparison';

/**
 * Sample payloads for the admin model comparison, opened with `?beispiel=1`. The verdicts and
 * notes are the offline benchmark from the approved mockup and the day curves are the real
 * archive rows for Europa-Park on 2026-10-10; the two `live` blocks are made up to show the
 * interval drawing before two weeks of live data exist, and the ride without measurements is made
 * up to show the empty state.
 */

const RULE = { minDays: 14, minParks: 10 };

function cell(
  state: ModelCellState,
  note: string,
  extra: {
    live?: ModelCellLive;
    offline?: ModelCellOffline;
    expectedBy?: [string, string];
    visible?: boolean;
  } = {}
): ModelCell {
  const checks: ModelCell['checks'] = {
    today: { offline: 'open', live: 'open', visible: true },
    better: { offline: 'yes', live: 'running', visible: extra.visible ?? true },
    worse: { offline: 'no', live: 'open', visible: false },
    unclear: { offline: 'no', live: 'open', visible: false },
    pending: { offline: 'running', live: 'open', visible: false },
  }[state] as ModelCell['checks'];
  return {
    state,
    note,
    checks,
    live: extra.live ?? null,
    offline: extra.offline ?? null,
    expectedBy: extra.expectedBy ? { date: extra.expectedBy[0], label: extra.expectedBy[1] } : null,
  };
}

const TONIGHT: [string, string] = ['2026-10-12', 'heute Nacht, spätestens 01:00 Uhr'];
const EVENING: [string, string] = ['2026-10-11', 'heute ca. 19:00 Uhr'];
const SHADOW: [string, string] = [
  '2026-10-24',
  'Live-Bestätigung: Schatten läuft seit 10.10., frühestens ca. 24.10.',
];
const ARCHIVE: [string, string] = ['2026-10-26', 'mit dem Live-Archiv, ca. 26.10.'];

const MIN = { unit: 'min', lowerIsBetter: true } as const;
const BENCHMARK = 'Offline-Benchmark';

const QUESTIONS: ModelComparisonQuestion[] = [
  {
    id: 'live-15m',
    group: 'live',
    label: 'Wartezeit in 15 Minuten',
    sub: 'Fahrgeschäft-Karte',
    leadLabel: '15 Minuten voraus',
    servedModel: 'pcn',
    metric: MIN,
    cells: {
      persist: cell(
        'better',
        'Ist auf 15 Minuten nicht zu schlagen. Heute zeigt PCN in der ersten Stunde ohnehin fast genau diesen Wert.',
        { visible: false }
      ),
      pcn: cell(
        'today',
        'Heute in der App. In der ersten Stunde stark zur aktuellen Wartezeit hin gemischt.'
      ),
      chronos: cell(
        'worse',
        '0,26 Minuten schlechter als die aktuelle Wartezeit (sicher). Gemessen an 33 Tagen Februar bis Oktober, 30 Parks.',
        { offline: { diff: 0.26, source: BENCHMARK, period: 'Februar bis Oktober 2026' } }
      ),
      h5: cell(
        'worse',
        'Ein Tagesprofil kennt die Lage von jetzt nicht und liegt kurzfristig klar hinten.'
      ),
      fm: cell('pending', 'Messung läuft heute.', { expectedBy: TONIGHT }),
    },
  },
  {
    id: 'live-30-120m',
    group: 'live',
    label: 'Wartezeit in 30 bis 120 Minuten',
    sub: '„Was jetzt fahren?“',
    leadLabel: '30 Minuten bis 2 Stunden voraus',
    servedModel: 'pcn',
    metric: MIN,
    cells: {
      persist: cell('unclear', 'Bei 30 Minuten noch knapp brauchbar, danach fällt sie zurück.'),
      pcn: cell('today', 'Heute in der App.'),
      chronos: cell(
        'better',
        'Besser als die aktuelle Wartezeit: 30 min −0,42, 60 min −1,26, 120 min −2,27 Minuten Fehler, alle sicher. Gegen PCN direkt noch nicht gemessen, das liefert das Live-Archiv ab dem Deploy.',
        {
          offline: { diff: -1.26, source: BENCHMARK, period: 'Februar bis Oktober 2026' },
          expectedBy: ARCHIVE,
          visible: true,
        }
      ),
      h5: cell('worse', 'Liegt hier 2 bis 4 Minuten hinter Chronos-2.'),
      tfth5: cell('worse', 'Liegt hier 1,9 bis 3,8 Minuten hinter Chronos-2.'),
      fm: cell('pending', 'Messung läuft heute.', { expectedBy: TONIGHT }),
    },
  },
  {
    id: 'today-2-8h',
    group: 'today',
    label: 'Heute, 2 bis 8 Stunden später',
    sub: 'Park-Seite, Tagesverlauf',
    leadLabel: '2 bis 8 Stunden voraus',
    servedModel: 'pcn',
    metric: MIN,
    cells: {
      persist: cell('worse', 'Ab 4 Stunden um 3 Minuten schlechter.'),
      pcn: cell('today', 'Heute in der App (bis 12 Stunden).'),
      tfth5: cell(
        'unclear',
        'Im Herbst besser als die einfachen Werte (−0,3 Minuten), über das ganze Jahr noch nicht bestätigt.',
        { offline: { diff: -0.3, source: BENCHMARK, period: 'September bis Oktober 2026' } }
      ),
      chronos: cell('pending', 'Für diesen Abstand noch nicht ausgewertet.', {
        expectedBy: ARCHIVE,
      }),
      fm: cell('pending', 'Messung läuft heute.', { expectedBy: TONIGHT }),
    },
  },
  {
    id: 'planner-0-1d',
    group: 'planner',
    label: 'Geplanter Tag ist heute oder morgen',
    sub: '15-Minuten-Slots',
    leadLabel: 'am selben Tag oder 1 Tag voraus',
    servedModel: 'served',
    metric: MIN,
    cells: {
      served: cell('today', 'Heute in der App: Stundenwerte, kein 15-Minuten-Verlauf.'),
      h5: cell('unclear', 'Etwa gleichauf mit dem, was wir heute zeigen.'),
      tfth5: cell(
        'better',
        'Besser: −0,3 Minuten über alle Fahrgeschäfte, bei vollen Fahrgeschäften −1,4 Minuten (sicher, hält übers ganze Jahr).',
        {
          offline: { diff: -0.3, source: BENCHMARK, period: 'Oktober 2025 bis Oktober 2026' },
          live: {
            diff: -0.41,
            ciLow: -1.12,
            ciHigh: 0.3,
            days: 2,
            parks: 31,
            n: 18_450,
            modelMae: 9.8,
            referenceMae: 10.21,
            since: '2026-10-10',
          },
          expectedBy: SHADOW,
        }
      ),
      chronos: cell(
        'pending',
        'Der erste Lauf hatte nur Donnerstage als Starttag. Neuer Lauf mit allen Wochentagen läuft.',
        { expectedBy: EVENING }
      ),
      wkd: cell('unclear', 'Messlatte.'),
      fm: cell('pending', 'Messung läuft heute.', { expectedBy: TONIGHT }),
    },
  },
  {
    id: 'planner-2-5d',
    group: 'planner',
    label: 'Geplanter Tag ist in 2 bis 5 Tagen',
    sub: '15-Minuten-Slots',
    leadLabel: '2 bis 5 Tage voraus',
    servedModel: 'served',
    metric: MIN,
    cells: {
      served: cell(
        'today',
        'Heute in der App. Ab 3 Tagen schlechter als der einfache Wochentag-Durchschnitt.'
      ),
      h5: cell(
        'better',
        'Besser als heute und besser als der Wochentag-Durchschnitt (−0,14 Minuten, bei jedem Abstand sicher).',
        {
          offline: { diff: -0.14, source: BENCHMARK, period: 'Oktober 2025 bis Oktober 2026' },
          live: {
            diff: -0.22,
            ciLow: -0.61,
            ciHigh: 0.17,
            days: 2,
            parks: 31,
            n: 9_870,
            modelMae: 11.4,
            referenceMae: 11.62,
            since: '2026-10-10',
          },
          expectedBy: SHADOW,
        }
      ),
      tfth5: cell(
        'unclear',
        'Nur bei vollen Fahrgeschäften und nur bis 2 Tage sicher besser. Ab 3 Tagen nicht mehr.'
      ),
      chronos: cell('pending', 'Neuer Lauf mit allen Wochentagen läuft.', { expectedBy: EVENING }),
      wkd: cell(
        'better',
        'Schon dieser einfache Wert ist ab 3 Tagen besser als das, was wir heute zeigen.'
      ),
      fm: cell('pending', 'Messung läuft heute.', { expectedBy: TONIGHT }),
    },
  },
  {
    id: 'planner-6-60d',
    group: 'planner',
    label: 'Geplanter Tag ist in 6 Tagen bis 2 Monaten',
    sub: '15-Minuten-Slots',
    leadLabel: '6 Tage bis 2 Monate voraus',
    servedModel: 'served',
    metric: MIN,
    cells: {
      served: cell('today', 'Heute in der App, schlechter als der Wochentag-Durchschnitt.'),
      h5: cell(
        'better',
        'Besser als heute. Aber kein Modell ist hier sicher besser als einfache Durchschnittswerte.'
      ),
      tfth5: cell(
        'worse',
        'Bei 30 Tagen sogar schlechter (+0,42 Minuten bei vollen Fahrgeschäften).',
        { offline: { diff: 0.42, source: BENCHMARK, period: 'Oktober 2025 bis Oktober 2026' } }
      ),
      wkd: cell('better', 'Besser als heute.'),
    },
  },
  {
    id: 'planner-best-time',
    group: 'planner',
    label: 'Beste Besuchszeit',
    sub: '„Wann fahre ich am besten?“',
    leadLabel: 'bis 6 Wochen voraus',
    servedModel: 'served',
    metric: MIN,
    cells: {
      served: cell('today', 'Heute in der App.'),
      h5: cell(
        'better',
        'Weniger verschenkte Wartezeit: −0,35 bis −0,42 Minuten gegenüber dem Wochentag-Durchschnitt, sicher.',
        { expectedBy: ['2026-10-24', 'Live-Bestätigung: frühestens ca. 24.10.'] }
      ),
      chronos: cell('pending', 'Wird mit dem neuen Lauf ausgewertet.', { expectedBy: EVENING }),
    },
  },
  {
    id: 'calendar-peak',
    group: 'calendar',
    label: 'Wie hoch wird die Tagesspitze?',
    sub: 'Kalender und „Beste Tage“, Tagesspitze der Hauptattraktionen',
    leadLabel: '1 Tag bis 2 Monate voraus',
    servedModel: 'tft',
    metric: MIN,
    cells: {
      tft: cell(
        'today',
        'Heute im Kalender bis 60 Tage. Verliert leicht gegen den Wochentag-Durchschnitt, nicht sicher.'
      ),
      catboost: cell('worse', 'Als Tagesniveau macht CatBoost die Prognose schlechter.'),
      wkd: cell('unclear', 'Leicht besser als TFT, aber nicht sicher.'),
    },
  },
  {
    id: 'cal_rank',
    group: 'calendar',
    label: 'Welcher Tag ist voller?',
    sub: 'Kalender und „Beste Tage“, Reihenfolge der Tage eines Parks',
    leadLabel: '0 bis 21 Tage voraus; Anteil falsch geordneter Tagespaare',
    servedModel: 'tft',
    metric: { unit: 'rate', lowerIsBetter: true },
    cells: {
      tft: cell(
        'today',
        'Heute im Kalender. Ordnet die Tage sicher besser als einfache Werte (2,6 Prozentpunkte weniger falsch geordnete Tagespaare), der einzige Kalender-Gewinn.'
      ),
      catboost: cell('worse', 'Schlechter als TFT.'),
      wkd: cell('worse', 'Schlechter als TFT.', {
        live: {
          diff: 2.64,
          ciLow: 0.9,
          ciHigh: 4.31,
          days: 2,
          parks: 31,
          n: 1_240,
          modelMae: 33.8,
          referenceMae: 31.16,
          since: '2026-10-10',
        },
      }),
    },
  },
];

function summarize(questions: ModelComparisonQuestion[]): ModelComparisonReport['summary'] {
  const summary = { better: 0, pending: 0, unclear: 0, worse: 0 };
  for (const question of questions) {
    for (const { state } of Object.values(question.cells)) {
      if (state !== 'today') summary[state]++;
    }
  }
  return summary;
}

/** The matrix as `GET /api/admin/model-comparison` would send it. */
export const FIXTURE_REPORT: ModelComparisonReport = {
  generatedAt: '2026-10-11T08:00:00.000Z',
  window: { days: 28, firstDate: '2026-10-10', lastDate: '2026-10-11' },
  rule: RULE,
  models: [
    {
      id: 'persist',
      label: 'Aktuelle Wartezeit',
      oneLiner: 'Was gerade angezeigt wird, einfach weitergeschrieben.',
    },
    {
      id: 'pcn',
      label: 'PCN',
      oneLiner: 'Unser Live-Modell für die nächsten 12 Stunden. Heute in der App.',
    },
    {
      id: 'served',
      label: 'Tagesplaner heute',
      oneLiner:
        'Typischer Stundenverlauf, hochgerechnet auf das erwartete Tagesniveau. Heute in der App.',
    },
    {
      id: 'h5',
      label: 'H5-Profil',
      oneLiner:
        'Typischer Verlauf in 15-Minuten-Schritten, ausgerichtet an Öffnung und Schließung.',
    },
    {
      id: 'tfth5',
      label: 'H5 + TFT-Niveau',
      oneLiner: 'H5-Verlauf, aber bei vollen Fahrgeschäften auf die TFT-Tagesprognose skaliert.',
    },
    {
      id: 'chronos',
      label: 'Chronos-2',
      oneLiner:
        'Fertig trainiertes KI-Modell von Amazon, bekommt Öffnungszeiten, Ferien und Feiertage.',
    },
    {
      id: 'tft',
      label: 'TFT',
      oneLiner: 'Unser Tagesmodell für die nächsten 60 Tage. Heute im Kalender.',
    },
    {
      id: 'catboost',
      label: 'CatBoost',
      oneLiner: 'Unser ältestes Modell, liefert Stundenwerte und das Tagesniveau ab Tag 61.',
    },
    {
      id: 'wkd',
      label: 'Wochentag-Durchschnitt',
      oneLiner:
        'Was an diesem Wochentag in den letzten Wochen typisch war. Die Messlatte, die jedes Modell schlagen muss.',
    },
    {
      id: 'fm',
      label: 'Toto 2.0 / TiRex',
      oneLiner: 'Zwei weitere fertig trainierte KI-Modelle. Messung läuft heute.',
    },
  ],
  groups: [
    { id: 'live', label: 'Live in der App' },
    { id: 'today', label: 'Heute' },
    { id: 'planner', label: 'Tagesplaner' },
    { id: 'calendar', label: 'Kalender' },
  ],
  questions: QUESTIONS,
  summary: summarize(QUESTIONS),
};

const PARK = { id: 'fixture-europa-park', name: 'Europa-Park', timezone: 'Europe/Berlin' };

// Archive rows captured 06:05 local; truth is the last reading per quarter hour, null = not running.
// `served` is hourly in production and is spread over its four quarters here.
const _ = null;
const DAY_ROWS: Record<
  string,
  {
    name: string;
    isHeadliner?: boolean;
    truth: (number | null)[];
    series: Record<string, number[]>;
  }
> = {
  'fixture-voltron': {
    name: 'Voltron Nevera',
    truth: [
      25,
      35,
      50,
      _,
      _,
      55,
      55,
      _,
      80,
      80,
      80,
      80,
      80,
      80,
      80,
      _,
      65,
      60,
      70,
      _,
      60,
      _,
      60,
      65,
      70,
      60,
      _,
      60,
      55,
      _,
      75,
      _,
      70,
      45,
      60,
      60,
    ],
    series: {
      served: [40, 40, 45, 40, 35, 35, 45, 50, 45, 50],
      h5: [
        25, 35, 45, 40, 43, 46, 48, 48, 49, 50, 49, 48, 47, 46, 44, 43, 42, 41, 39, 38, 37, 36, 35,
        36, 37, 37, 37, 37, 36, 35, 35, 35, 35, 33, 30, 33,
      ],
      tfth5: [
        25, 35, 45, 40, 55, 59, 61, 62, 63, 64, 63, 62, 60, 58, 57, 55, 54, 52, 50, 49, 47, 46, 45,
        46, 47, 48, 48, 47, 46, 45, 45, 45, 45, 42, 38, 42,
      ],
      peak: [
        50, 50, 50, 50, 65, 65, 65, 65, 65, 65, 65, 65, 55, 55, 55, 55, 50, 50, 50, 50, 50, 50, 50,
        50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50,
      ],
    },
  },
  'fixture-silver-star': {
    name: 'Silver Star',
    truth: [
      10, 20, 30, 45, 45, 45, 45, 45, 45, 55, 55, 50, 50, 50, 50, 45, 45, 50, 45, 40, 40, 50, 45,
      45, 45, 50, 45, 45, 45, 45, 45, 45, 50, 45, 40, 40,
    ],
    series: {
      served: [30, 30, 30, 30, 25, 25, 35, 35, 35, 35],
      h5: [
        15, 25, 35, 40, 35, 38, 39, 38, 37, 36, 34, 33, 32, 31, 29, 28, 27, 26, 25, 25, 25, 25, 26,
        27, 28, 29, 29, 28, 27, 26, 25, 26, 25, 23, 28, 25,
      ],
      peak: [
        35, 35, 35, 35, 50, 50, 50, 50, 50, 50, 50, 50, 40, 40, 40, 40, 35, 35, 35, 35, 35, 35, 35,
        35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35,
      ],
    },
  },
  'fixture-blue-fire': {
    name: 'Blue Fire',
    truth: [
      _,
      _,
      _,
      _,
      35,
      _,
      60,
      _,
      50,
      _,
      _,
      _,
      _,
      _,
      _,
      _,
      60,
      55,
      50,
      40,
      45,
      _,
      _,
      _,
      70,
      _,
      _,
      _,
      _,
      _,
      _,
      _,
      45,
      40,
      _,
      _,
    ],
    series: {
      served: [20, 25, 25, 30, 30, 25, 35, 40, 35, 30],
      h5: [
        5, 10, 15, 25, 27, 34, 38, 40, 42, 44, 44, 41, 39, 36, 34, 33, 32, 31, 31, 32, 33, 34, 36,
        37, 38, 39, 39, 36, 34, 31, 29, 28, 20, 23, 18, 13,
      ],
      tfth5: [
        5, 10, 15, 25, 37, 46, 52, 55, 58, 60, 60, 56, 53, 49, 47, 45, 44, 42, 42, 44, 45, 47, 49,
        50, 52, 54, 53, 49, 46, 43, 40, 38, 27, 31, 24, 17,
      ],
      peak: [
        20, 20, 20, 20, 50, 50, 50, 50, 60, 60, 60, 60, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50,
        50, 50, 50, 50, 50, 50, 50, 50, 50, 40, 40, 40, 40,
      ],
    },
  },
  'fixture-no-measurements': {
    name: 'Beispiel ohne Messwerte',
    isHeadliner: false,
    truth: Array.from({ length: 36 }, () => null),
    series: { served: [10, 10, 15, 15, 15, 15, 15, 10, 10, 10] },
  },
};

const SERIES_LABELS: Record<string, string> = {
  served: 'Tagesplaner heute',
  h5: 'H5-Profil',
  tfth5: 'H5 + TFT-Niveau',
  peak: 'Alt-Profil skaliert',
};

const ORIGINS = [
  { id: 'morning', label: 'Morgens am Tag selbst' },
  { id: 'd1', label: 'Am Vortag' },
  { id: 'd3', label: '3 Tage vorher' },
  { id: 'd7', label: '7 Tage vorher' },
];

const SLOTS = Array.from({ length: 36 }, (_, index) => {
  const hour = 9 + Math.floor(index / 4);
  return `${String(hour).padStart(2, '0')}:${String((index % 4) * 15).padStart(2, '0')}`;
});

/** The selectors as `GET /api/admin/model-comparison/day/options` would send them. */
export const FIXTURE_DAY_OPTIONS: ModelComparisonDayOptions = {
  date: '2026-10-10',
  dates: ['2026-10-10'],
  parks: [
    {
      ...PARK,
      city: 'Rust',
      country: 'Deutschland',
      rides: Object.entries(DAY_ROWS).map(([id, row]) => ({
        id,
        name: row.name,
        isHeadliner: row.isHeadliner ?? true,
      })),
    },
  ],
  origins: ORIGINS,
  suggested: { date: '2026-10-10', parkId: PARK.id, attractionId: 'fixture-voltron' },
};

/**
 * One replayed day as `GET /api/admin/model-comparison/day` would send it. Only the morning
 * origin was archived for the sample, so every other origin comes back without series.
 */
export function fixtureDay(attractionId: string, originId: string): ModelComparisonDay {
  const row = DAY_ROWS[attractionId] ?? DAY_ROWS['fixture-voltron'];
  const id = DAY_ROWS[attractionId] ? attractionId : 'fixture-voltron';
  const origin = ORIGINS.find((entry) => entry.id === originId) ?? ORIGINS[0];
  const archived = origin.id === 'morning';
  const series = archived
    ? Object.entries(row.series).map(([model, values]) => ({
        model,
        label: SERIES_LABELS[model] ?? model,
        values:
          model === 'served' ? SLOTS.map((_, index) => values[Math.floor(index / 4)]) : values,
      }))
    : [];
  const scores = series
    .flatMap((entry) => {
      const score = dayMae(entry.values, row.truth);
      return score ? [{ model: entry.model, label: entry.label, ...score }] : [];
    })
    .sort((a, b) => a.mae - b.mae);
  return {
    park: PARK,
    ride: { id, name: row.name },
    date: '2026-10-10',
    origin: {
      ...origin,
      at: archived ? '2026-10-10T04:05:00.000Z' : null,
      localLabel: archived ? '10.10. um 06:05 Uhr' : '',
    },
    openingHours: { open: '09:00', close: '18:00' },
    slots: SLOTS,
    truth: row.truth,
    truthCoverage: row.truth.filter((value) => value !== null).length / row.truth.length,
    series,
    scores,
  };
}
