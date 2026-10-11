import type { MlOverview } from '@/lib/api/admin-ml-overview';

/**
 * The sample overview the ML page shows with `?beispiel=1`: the decisions and the operating data
 * of the approved mockup, as production stood on 2026-10-11 at 20:20 UTC. The matrix counters are
 * that day's `/admin/ml/vergleich` summary.
 */
export const FIXTURE_OVERVIEW: MlOverview = {
  generatedAt: '2026-10-11T20:20:00Z',
  decisions: [
    {
      id: 'planner-h5',
      title: 'Tagesplaner auf 15-Minuten-Slots umstellen (H5-Profil)',
      detail:
        'Offline besser als heute bei jedem Abstand. TFT-Niveau nur für volle Fahrgeschäfte bis 2 Tage.',
      state: 'waiting_live',
      progress: { liveDays: 1, liveParks: 10, needDays: 14, needParks: 10 },
      earliest: { date: '2026-10-24', label: 'frühestens 24.10.' },
      cells: [
        { questionId: 'planner-d0', modelId: 'h5' },
        { questionId: 'planner-d1', modelId: 'h5' },
      ],
    },
    {
      id: 'live-chronos',
      title: 'Live-Wartezeit 30 bis 120 Minuten: Chronos-2 statt PCN',
      detail: 'Offline 0,4 bis 2,3 Minuten besser. Schatten läuft seit heute 19:05.',
      state: 'waiting_live',
      progress: { liveDays: 0, liveParks: 0, needDays: 14, needParks: 10 },
      earliest: { date: '2026-10-26', label: 'frühestens 26.10.' },
      cells: [
        { questionId: 'live-30', modelId: 'chronos2' },
        { questionId: 'live-120', modelId: 'chronos2' },
      ],
    },
    {
      id: 'planner-chronos',
      title: 'Tagesplaner 1 bis 7 Tage: Chronos-2 zusätzlich prüfen',
      detail:
        'Offline besser als H5 bei 0, 1, 2 und 6 Tagen, nie schlechter. Nicht für „beste Besuchszeit“. Schatten startet morgen 06:00.',
      state: 'waiting_live',
      progress: { liveDays: 0, liveParks: 0, needDays: 14, needParks: 10 },
      earliest: { date: '2026-10-26', label: 'frühestens 26.10.' },
      cells: [{ questionId: 'planner-d7', modelId: 'chronos2' }],
    },
    {
      id: 'calendar-tft-headliners',
      title: 'Kalender: TFT nur noch für volle Fahrgeschäfte',
      detail: 'TFT verliert im Kalender leicht gegen den Wochentag-Durchschnitt, nicht sicher.',
      state: 'open',
      progress: null,
      earliest: null,
      cells: [{ questionId: 'calendar-d30', modelId: 'tft' }],
    },
    {
      id: 'catboost-daily-off',
      title: 'CatBoost-Tagesniveau abschalten',
      detail:
        'Macht die Prognose offline schlechter. Erst abschalten, wenn der Ersatz live bestätigt ist.',
      state: 'later',
      progress: null,
      earliest: { date: '2026-10-31', label: 'nicht vor Ende Oktober' },
      cells: [],
    },
    {
      id: 'shape-off',
      title: 'Shape-Service abschalten',
      detail:
        'Liefert der App nichts, kein messbarer Vorteil. Abschalten spart nur Rechenzeit, verbessert nichts sichtbar.',
      state: 'owner',
      progress: null,
      earliest: { date: '2026-10-11', label: 'jederzeit' },
      cells: [],
    },
  ],
  matrixSummary: { better: 0, pending: 17, unclear: 16, worse: 11 },
  components: [
    {
      id: 'pcn',
      name: 'PCN',
      delivers: 'Live-Wartezeiten bis 12 Stunden',
      role: 'served',
      lastRunAt: '2026-10-11T20:16:00Z',
      expected: 'alle 15 Min.',
      status: 'ok',
      note: null,
    },
    {
      id: 'tft',
      name: 'TFT',
      delivers: 'Kalender und Tagesniveau, 1 bis 60 Tage',
      role: 'served',
      lastRunAt: '2026-10-11T03:11:00Z',
      expected: 'täglich 03:00',
      status: 'ok',
      note: null,
    },
    {
      id: 'catboost',
      name: 'CatBoost',
      delivers: 'Stundenwerte jenseits 12 h, Tagesniveau ab Tag 61',
      role: 'served',
      lastRunAt: '2026-10-11T07:11:00Z',
      expected: 'täglich 06:00',
      status: 'ok',
      note: 'Version v20261011_0600',
    },
    {
      id: 'chronos2',
      name: 'Chronos-2',
      delivers: 'Live 30–120 Min., Tagesplaner 0–7 Tage',
      role: 'shadow',
      lastRunAt: '2026-10-11T20:05:00Z',
      expected: 'stündlich',
      status: 'warming',
      note: 'Historie wird geladen',
    },
    {
      id: 'h5',
      name: 'H5-Profile',
      delivers: '15-Minuten-Verlauf für den Tagesplaner',
      role: 'shadow',
      lastRunAt: '2026-10-11T20:05:00Z',
      expected: 'stündlich',
      status: 'ok',
      note: null,
    },
    {
      id: 'shape',
      name: 'Shape',
      delivers: 'nichts in der App',
      role: 'shadow',
      lastRunAt: '2026-10-11T09:37:00Z',
      expected: 'täglich 09:00',
      status: 'ok',
      note: null,
    },
    {
      id: 'forward-archive',
      name: 'Forward-Archiv',
      delivers: 'speichert alle Prognosen für den Vergleich',
      role: 'measurement',
      lastRunAt: '2026-10-11T20:05:00Z',
      expected: 'stündlich :05',
      status: 'ok',
      note: null,
    },
    {
      id: 'scoring',
      name: 'Bewertung',
      delivers: 'rechnet die Matrix gegen echte Wartezeiten',
      role: 'measurement',
      lastRunAt: '2026-10-10',
      expected: 'täglich 12:00',
      status: 'ok',
      note: null,
    },
  ],
};
