'use client';

import { useCallback, useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ChartLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ModelComparisonDay,
  ModelComparisonDayOptions,
} from '@/lib/api/admin-model-comparison';
import {
  chartTop,
  formatFigure,
  headlinersFirst,
  hourTicks,
  LOW_TRUTH_COVERAGE,
  modelColors,
  resolveDaySelection,
  splitSegments,
  suggestedOptionsDate,
  truthCoverage,
  type DayChoice,
} from '@/lib/admin/model-comparison';
import { FIXTURE_DAY_OPTIONS, fixtureDay } from '@/lib/admin/model-comparison-fixture';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { adminKeys, useAdminQuery } from '../../../_lib/api';
import { Field, SearchSelect, Select, useFieldId } from '../../../_ui/controls';
import { EmptyState, ErrorState, LoadingState, Panel, PanelHeader } from '../../../_ui/primitives';

const OPTIONS_PATH = '/api/admin/model-comparison/day/options';
const DAY_PATH = '/api/admin/model-comparison/day';

/**
 * One stored day replayed: date, park, ride and forecast moment chosen from the options endpoint,
 * every model's curve against the measured wait, and each model's error on that day.
 */
export function DayComparison({ fixture, inApp }: { fixture: boolean; inApp: Set<string> }) {
  const [choice, setChoice] = useState<DayChoice>({ date: null, parkId: null, rideId: null });
  const [originId, setOriginId] = useState<string>('morning');

  // Unpicked, the options are asked for once without a date; when the backend suggests a day
  // other than the one it answered for, they are asked for again for that day.
  const baseQuery = useAdminQuery<ModelComparisonDayOptions>(
    adminKeys.raw(OPTIONS_PATH),
    fixture ? null : OPTIONS_PATH
  );
  const requestDate = choice.date ?? suggestedOptionsDate(baseQuery.data);
  const datedPath = !fixture && requestDate ? `${OPTIONS_PATH}?date=${requestDate}` : null;
  const datedQuery = useAdminQuery<ModelComparisonDayOptions>(
    adminKeys.raw(datedPath ?? 'day-options-undated'),
    datedPath,
    { placeholderData: (previous) => previous }
  );
  const optionsQuery = datedPath ? datedQuery : baseQuery;
  const options = fixture ? FIXTURE_DAY_OPTIONS : (optionsQuery.data ?? baseQuery.data);

  const selection = options ? resolveDaySelection(options, choice) : null;
  const activeDate = selection?.date ?? null;
  const park = selection?.park ?? null;
  const ride = selection?.ride ?? null;
  const rides = park ? headlinersFirst(park.rides) : [];
  const origin = options?.origins.find((o) => o.id === originId) ?? options?.origins[0] ?? null;

  // The parks and rides on hand must belong to the day being asked for: while a new day's
  // options load, the previous answer is still shown and would pair its rides with the new date.
  const optionsMatchDay = options?.date === activeDate;
  const dayPath =
    !fixture && optionsMatchDay && park && ride && activeDate && origin
      ? `${DAY_PATH}?${new URLSearchParams({
          parkId: park.id,
          date: activeDate,
          attractionId: ride.id,
          origin: origin.id,
        })}`
      : null;
  const dayQuery = useAdminQuery<ModelComparisonDay>(
    adminKeys.raw(dayPath ?? 'fixture-day'),
    dayPath
  );
  const day = fixture && ride && origin ? fixtureDay(ride.id, origin.id) : dayQuery.data;

  const ids = {
    date: useFieldId('day-date'),
    park: useFieldId('day-park'),
    ride: useFieldId('day-ride'),
    origin: useFieldId('day-origin'),
  };

  return (
    <Panel>
      <PanelHeader
        icon={ChartLine}
        title="Ein Tag zum Nachsehen"
        hint="Was jedes Modell für diesen Tag vorhergesagt hat, gegen die gemessene Wartezeit. Über die Kurven fahren oder mit den Pfeiltasten zeigt die Werte zur Uhrzeit."
      />
      {!fixture && !options && optionsQuery.isLoading ? (
        <LoadingState />
      ) : !fixture && optionsQuery.error && !options ? (
        <ErrorState message={optionsQuery.error.message} onRetry={() => optionsQuery.refetch()} />
      ) : !options || options.parks.length === 0 ? (
        <EmptyState
          icon={ChartLine}
          title="Noch kein gespeicherter Tag"
          description="Sobald das Archiv einen Tag mit Prognosen und echten Wartezeiten hat, lässt er sich hier auswählen."
        />
      ) : (
        <>
          {!fixture && optionsQuery.error && (
            <p className="px-4 pt-3 text-xs text-amber-400">
              Die Auswahl für diesen Tag ließ sich nicht laden ({optionsQuery.error.message}).{' '}
              <button type="button" className="underline" onClick={() => optionsQuery.refetch()}>
                Erneut versuchen
              </button>{' '}
              oder einen anderen Tag wählen.
            </p>
          )}
          <div className="border-border/50 grid gap-3 border-b px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Datum" htmlFor={ids.date}>
              <Select
                id={ids.date}
                value={activeDate}
                allowEmpty={false}
                // A new day keeps the park and ride when it still has them.
                onValueChange={(value) =>
                  value &&
                  setChoice({ date: value, parkId: park?.id ?? null, rideId: ride?.id ?? null })
                }
                options={options.dates.map((value) => ({ value, label: formatLongDate(value) }))}
              />
            </Field>
            <Field label="Park" htmlFor={ids.park}>
              <SearchSelect
                id={ids.park}
                fuzzy="park"
                value={park?.id ?? null}
                searchPlaceholder="Park suchen…"
                emptyLabel="Kein Park gefunden"
                onValueChange={(value) =>
                  setChoice({ date: activeDate, parkId: value, rideId: null })
                }
                options={options.parks.map((p) => ({
                  value: p.id,
                  label: p.name,
                  hint: [p.city, p.country].filter(Boolean).join(', ') || undefined,
                  keywords: [p.city, p.country],
                }))}
              />
            </Field>
            <Field label="Fahrgeschäft" htmlFor={ids.ride}>
              <SearchSelect
                id={ids.ride}
                fuzzy="attraction"
                value={ride?.id ?? null}
                searchPlaceholder="Fahrgeschäft suchen…"
                emptyLabel="Kein Fahrgeschäft gefunden"
                onValueChange={(value) =>
                  setChoice({ date: activeDate, parkId: park?.id ?? null, rideId: value })
                }
                options={rides.map((r) => ({
                  value: r.id,
                  label: r.name,
                  badge: r.isHeadliner ? 'Hauptattraktion' : undefined,
                }))}
              />
            </Field>
            <Field label="Prognosezeitpunkt" htmlFor={ids.origin}>
              <Select
                id={ids.origin}
                value={origin?.id ?? null}
                allowEmpty={false}
                onValueChange={(value) => value && setOriginId(value)}
                options={options.origins.map((o) => ({ value: o.id, label: o.label }))}
              />
            </Field>
          </div>
          {!fixture && dayQuery.isLoading ? (
            <LoadingState />
          ) : !fixture && dayQuery.error ? (
            <ErrorState message={dayQuery.error.message} onRetry={() => dayQuery.refetch()} />
          ) : day ? (
            <DayView day={day} inApp={inApp} />
          ) : null}
        </>
      )}
    </Panel>
  );
}

function formatLongDate(date: string): string {
  return getDateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

const DEFAULT_W = 640;
const MIN_W = 300;
const H = 280;
const PAD = { left: 36, right: 22, top: 24, bottom: 26 };

/**
 * The rendered width of an element, so the chart draws in real pixels: an 11 px label stays
 * 11 px on a phone, and the hour labels are thinned against the width they actually get.
 */
function useRenderedWidth(): [
  (element: HTMLDivElement | null) => (() => void) | void,
  number | null,
] {
  const [width, setWidth] = useState<number | null>(null);
  const ref = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

function DayView({ day, inApp }: { day: ModelComparisonDay; inApp: Set<string> }) {
  const [hover, setHover] = useState<number | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const [chartRef, renderedWidth] = useRenderedWidth();
  const W = Math.max(MIN_W, renderedWidth ?? DEFAULT_W);
  const count = day.slots.length;
  const colors = useMemo(() => modelColors(day.series.map((s) => s.model)), [day.series]);
  const scores = useMemo(() => new Map(day.scores.map((s) => [s.model, s])), [day.scores]);
  // The legend reads best first; a series the day could not score goes last.
  const series = useMemo(
    () =>
      [...day.series].sort(
        (a, b) =>
          (scores.get(a.model)?.mae ?? Number.POSITIVE_INFINITY) -
          (scores.get(b.model)?.mae ?? Number.POSITIVE_INFINITY)
      ),
    [day.series, scores]
  );
  const visible = series.filter((s) => !hidden.has(s.model));
  const top = chartTop([...day.truth, ...visible.flatMap((s) => s.values)]);
  const x = (index: number) =>
    PAD.left + (count > 1 ? index / (count - 1) : 0.5) * (W - PAD.left - PAD.right);
  const y = (value: number) => PAD.top + (1 - value / top) * (H - PAD.top - PAD.bottom);
  const ticks = hourTicks(day.slots, W - PAD.left - PAD.right);
  const hasForecast = day.series.some((s) => s.values.some((v) => v !== null));
  const coverage = truthCoverage(day);
  const hasTruth = coverage > 0 && day.truth.some((v) => v !== null);
  const truthAt = hover === null ? null : day.truth[hover];

  const pick = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * W;
    const ratio = (px - PAD.left) / (W - PAD.left - PAD.right);
    setHover(Math.max(0, Math.min(count - 1, Math.round(ratio * (count - 1)))));
  };

  const step = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, (current: number | null) => number> = {
      ArrowLeft: (current) => Math.max(0, (current ?? 1) - 1),
      ArrowRight: (current) => Math.min(count - 1, (current ?? -1) + 1),
      Home: () => 0,
      End: () => count - 1,
    };
    const move = moves[event.key];
    if (!move || count === 0) return;
    event.preventDefault();
    setHover(move);
  };

  const toggle = (model: string) =>
    setHidden((current) => {
      const next = new Set(current);
      if (!next.delete(model)) next.add(model);
      return next;
    });

  const minutes = (value: number | null | undefined) =>
    value === null || value === undefined ? '–' : `${Math.round(value)} Min.`;

  return (
    <>
      <div className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 px-4 pt-3 text-xs">
        <span>
          <span className="text-foreground font-medium">
            {day.park.name}, {day.ride.name}
          </span>
          , {formatLongDate(day.date)}
        </span>
        {day.openingHours && (
          <span>
            Geöffnet{' '}
            <b className="text-foreground font-medium tabular-nums">
              {day.openingHours.open} bis {day.openingHours.close} Uhr
            </b>
          </span>
        )}
        {day.origin.localLabel && (
          <span>
            Prognose gespeichert am{' '}
            <b className="text-foreground font-medium tabular-nums">{day.origin.localLabel}</b>{' '}
            (Ortszeit)
          </span>
        )}
        {hasTruth && (
          <span>
            Gemessen in{' '}
            <b className="text-foreground font-medium tabular-nums">
              {Math.round(coverage * 100)} %
            </b>{' '}
            der Viertelstunden
          </span>
        )}
      </div>

      {!hasTruth ? (
        <EmptyState
          icon={ChartLine}
          title="Keine Messwerte an diesem Tag"
          description="Für dieses Fahrgeschäft gibt es an diesem Tag keine Messwerte. Bitte ein anderes wählen."
        />
      ) : !hasForecast ? (
        <EmptyState
          icon={ChartLine}
          title="Für diesen Zeitpunkt ist keine Prognose gespeichert"
          description="Einen anderen Prognosezeitpunkt oder Tag wählen."
        />
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 px-2 pt-3 pb-3">
            {coverage < LOW_TRUTH_COVERAGE && (
              <p className="text-muted-foreground mx-2 mb-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs">
                Nur {Math.round(coverage * 100)} % der Viertelstunden haben einen Messwert. Der
                Vergleich stützt sich an diesem Tag auf wenige Messungen.
              </p>
            )}
            <div
              ref={chartRef}
              tabIndex={0}
              role="group"
              aria-label="Kurven des Tages, Pfeiltasten wählen die Uhrzeit"
              onKeyDown={step}
              className="focus-visible:ring-primary rounded-md outline-none focus-visible:ring-2"
            >
              <svg
                viewBox={`0 0 ${W} ${H}`}
                width={W}
                height={H}
                className="block w-full touch-pan-y select-none"
                role="img"
                aria-label={`Wartezeit-Verlauf ${day.ride.name}`}
                onPointerMove={pick}
                onPointerDown={pick}
                onPointerLeave={(event) => {
                  if (event.pointerType === 'mouse') setHover(null);
                }}
              >
                {Array.from({ length: top / 20 + 1 }, (_, i) => i * 20).map((value) => (
                  <g key={value}>
                    <line
                      x1={PAD.left}
                      x2={W - PAD.right}
                      y1={y(value)}
                      y2={y(value)}
                      className="stroke-border/60"
                      strokeWidth={1}
                    />
                    <text
                      x={PAD.left - 6}
                      y={y(value) + 4}
                      textAnchor="end"
                      className="fill-muted-foreground font-mono text-[11px]"
                    >
                      {value}
                    </text>
                  </g>
                ))}
                <text x={PAD.left} y={PAD.top - 12} className="fill-muted-foreground text-[11px]">
                  Minuten
                </text>
                {ticks.map((index) => (
                  <text
                    key={index}
                    x={x(index)}
                    y={H - 8}
                    textAnchor="middle"
                    className="fill-muted-foreground font-mono text-[11px]"
                  >
                    {day.slots[index]}
                  </text>
                ))}
                {visible.map((s) =>
                  splitSegments(s.values).map((segment, i) => (
                    <polyline
                      key={`${s.model}-${i}`}
                      fill="none"
                      strokeWidth={inApp.has(s.model) ? 1.75 : 2}
                      strokeDasharray={inApp.has(s.model) ? '5 4' : undefined}
                      strokeLinejoin="round"
                      className={colors.get(s.model)?.stroke}
                      points={segment.map(([i2, v]) => `${x(i2)},${y(v)}`).join(' ')}
                    />
                  ))
                )}
                {splitSegments(day.truth).map((segment, i) =>
                  segment.length > 1 ? (
                    <polyline
                      key={`truth-${i}`}
                      fill="none"
                      strokeWidth={3.5}
                      strokeLinejoin="round"
                      className="stroke-foreground"
                      points={segment.map(([i2, v]) => `${x(i2)},${y(v)}`).join(' ')}
                    />
                  ) : (
                    <circle
                      key={`truth-${i}`}
                      cx={x(segment[0][0])}
                      cy={y(segment[0][1])}
                      r={3.5}
                      className="fill-foreground"
                    />
                  )
                )}
                {hover !== null && (
                  <g>
                    <line
                      x1={x(hover)}
                      x2={x(hover)}
                      y1={PAD.top}
                      y2={H - PAD.bottom}
                      className="stroke-muted-foreground"
                      strokeDasharray="3 3"
                    />
                    {visible.map((s) => {
                      const value = s.values[hover];
                      if (value === null || value === undefined) return null;
                      return (
                        <circle
                          key={s.model}
                          cx={x(hover)}
                          cy={y(value)}
                          r={3.5}
                          strokeWidth={1.5}
                          className={cn('stroke-card', colors.get(s.model)?.fill)}
                        />
                      );
                    })}
                    {truthAt !== null && truthAt !== undefined && (
                      <circle
                        cx={x(hover)}
                        cy={y(truthAt)}
                        r={4.5}
                        strokeWidth={2}
                        className="fill-foreground stroke-card"
                      />
                    )}
                  </g>
                )}
              </svg>
            </div>
            <p className="sr-only" aria-live="polite">
              {hover === null
                ? ''
                : `${day.slots[hover]} Uhr, gemessen ${truthAt === null ? 'nichts' : minutes(truthAt)}`}
            </p>
          </div>

          <div className="border-border/50 border-t py-3 lg:border-t-0 lg:border-l">
            <div className="text-muted-foreground flex justify-between px-4 pb-1.5 text-xs">
              <span>Modell</span>
              <span className="tabular-nums">
                {hover === null ? 'daneben im Schnitt' : `um ${day.slots[hover]} Uhr`}
              </span>
            </div>
            <div className="grid min-h-10 grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-2 px-4 py-1.5 text-sm">
              <span className="bg-foreground h-1 w-[22px] rounded" aria-hidden="true" />
              <span>Gemessen</span>
              <span className="font-semibold tabular-nums">
                {hover === null ? '' : minutes(truthAt)}
              </span>
            </div>
            {series.map((s) => {
              const score = scores.get(s.model);
              const shown = !hidden.has(s.model);
              return (
                <button
                  key={s.model}
                  type="button"
                  aria-pressed={shown}
                  onClick={() => toggle(s.model)}
                  className={cn(
                    'grid min-h-10 w-full grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-2 px-4 py-1.5 text-left text-sm transition hover:bg-white/[0.03]',
                    !shown && 'opacity-40'
                  )}
                >
                  <svg viewBox="0 0 22 4" className="h-1 w-[22px]" aria-hidden="true">
                    <line
                      x1={0}
                      x2={22}
                      y1={2}
                      y2={2}
                      strokeWidth={inApp.has(s.model) ? 2 : 3}
                      strokeDasharray={inApp.has(s.model) ? '5 3' : undefined}
                      className={colors.get(s.model)?.stroke}
                    />
                  </svg>
                  <span className="min-w-0">
                    {s.label}
                    {inApp.has(s.model) && (
                      <span className="text-muted-foreground block text-[11px]">
                        heute in der App
                      </span>
                    )}
                  </span>
                  <span className="font-semibold whitespace-nowrap tabular-nums">
                    {hover === null
                      ? score
                        ? `${formatFigure(score.mae)} Min.`
                        : '–'
                      : minutes(s.values[hover])}
                  </span>
                </button>
              );
            })}
            <p className="text-muted-foreground px-4 pt-2 text-xs">
              Mittlere Abweichung
              {day.scores[0] ? ` über ${day.scores[0].n} Viertelstunden mit Messwert` : ''}. Ein
              Klick blendet eine Kurve aus. Ein einzelner Tag entscheidet nichts, er zeigt, wie die
              Zahlen in der Matrix zustande kommen.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
