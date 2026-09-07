'use client';

/**
 * The three panels about the park as a whole: the overview, the crowd, and the weather.
 *
 * Every figure in here is one the worker actually publishes. Two that a park HUD would normally
 * carry are missing on purpose and the panels say so rather than drawing a zero:
 *
 * - **a park rating** — `DayLedger.rating` exists in the world model and nothing computes it;
 *   `management` is a scaffold. A rating invented from guest happiness would be a number with a
 *   name it had not earned.
 * - **income and expenses per day** — the same ledger, written with zeros by `core/module.ts` on
 *   the day rollover and filled in by nobody. Cash and the shops' takings are real and are what
 *   the overview shows instead.
 */

import { CloudRain, Droplets, Sun, Thermometer, Users, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PanelBodyProps } from '../api';
import { count, decimal, money, moneyWhole, percent, clockTime } from '../format';
import { useTelemetry, useTelemetrySnapshot } from '../hooks';
import { DataRow, EmptyNote, Figure, FigureTile, Meter, Section, StackBar } from '../parts';
import { HUD_WELL } from '../surface';
import type { GameStringKey, Translate } from '../../i18n';
import type { UiRuntime } from '../runtime';
import type { ParkTelemetry } from '../telemetry';

/** One colour per behaviour, so the bar and the legend agree without a lookup table on screen. */
const CROWD_COLOURS: Record<string, string> = {
  arriving: 'bg-[oklch(0.72_0.11_241)]',
  walking: 'bg-[oklch(0.62_0.13_241)]',
  idle: 'bg-white/35',
  sitting: 'bg-white/25',
  queuing: 'bg-(--game-warning)',
  riding: 'bg-[oklch(0.82_0.15_155)]',
  buying: 'bg-[oklch(0.82_0.16_190)]',
  leaving: 'bg-white/20',
  lost: 'bg-(--game-danger)',
};

function crowdLabel(t: Translate, state: string): string {
  const key = `crowd.${state}` as GameStringKey;
  const label = t(key);
  return label === key ? state : label;
}

function happinessTone(value: number) {
  if (value < 0) return 'neutral' as const;
  if (value >= 65) return 'good' as const;
  if (value >= 40) return 'warn' as const;
  return 'bad' as const;
}

// ── Park overview ─────────────────────────────────────────────────────────────────────────
export function ParkPanel({ t, locale, ui }: PanelBodyProps) {
  const runtime = ui as UiRuntime;
  const s = useTelemetrySnapshot(runtime);
  const totals = s.totals;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-1.5">
        <FigureTile label={t('hud.guests')} value={count(totals.guests, locale)} />
        <FigureTile
          label={t('park.happiness')}
          value={totals.happiness < 0 ? '–' : `${Math.round(totals.happiness)}`}
          tone={happinessTone(totals.happiness)}
        />
        <FigureTile label={t('hud.cash')} value={moneyWhole(totals.cash, locale)} />
        <FigureTile label={t('park.takings')} value={money(totals.takingsToday, locale)} />
      </div>

      <Section label={t('park.crowd')}>
        {s.crowd.length === 0 ? (
          <EmptyNote>{t('park.noCrowd')}</EmptyNote>
        ) : (
          <>
            <StackBar
              segments={s.crowd.map((c) => ({
                key: c.state,
                value: c.count,
                className: CROWD_COLOURS[c.state] ?? 'bg-white/30',
                label: crowdLabel(t, c.state),
              }))}
            />
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {s.crowd.slice(0, 5).map((c) => (
                <span key={c.state} className="inline-flex items-center gap-1.5 text-[11px]">
                  <span
                    className={cn('size-2 rounded-[3px]', CROWD_COLOURS[c.state] ?? 'bg-white/30')}
                  />
                  <span className="text-white/55">{crowdLabel(t, c.state)}</span>
                  <span className="font-medium text-white/85 tabular-nums">{c.count}</span>
                </span>
              ))}
            </div>
          </>
        )}
      </Section>

      <Section label={t('panel.rides')}>
        <Meter
          fraction={totals.rides > 0 ? totals.ridesOpen / totals.rides : 0}
          value={`${totals.ridesOpen} / ${totals.rides}`}
          label={t('park.ridesRunning')}
          tone={totals.ridesDown > 0 ? 'warn' : 'good'}
        />
        <DataRow label={t('park.queueing')} value={count(totals.queued, locale)} />
        <DataRow label={t('park.riding')} value={count(totals.riding, locale)} />
        <DataRow
          label={t('park.ridersToday')}
          value={count(Math.round(totals.ridersToday), locale)}
        />
        <DataRow
          label={t('park.throughput')}
          value={count(Math.round(totals.throughputHour), locale)}
          hint={t('park.throughput.hint')}
        />
        {totals.ridesDown > 0 ? (
          <DataRow label={t('park.ridesDown')} value={totals.ridesDown} tone="bad" />
        ) : null}
      </Section>

      <Section label={t('panel.shops')}>
        <Meter
          fraction={totals.shops > 0 ? totals.shopsOpen / totals.shops : 0}
          value={`${totals.shopsOpen} / ${totals.shops}`}
          label={t('park.shopsOpen')}
        />
        <DataRow label={t('park.atTheCounter')} value={count(totals.shopQueue, locale)} />
      </Section>

      <Section label={t('park.network')}>
        <DataRow label={t('park.pathNodes')} value={count(totals.pathNodes, locale)} />
        <DataRow
          label={t('park.pathIslands')}
          value={totals.pathIslands}
          tone={totals.pathIslands > 1 ? 'warn' : 'neutral'}
          hint={totals.pathIslands > 1 ? t('park.pathIslands.hint') : undefined}
        />
        {totals.trains > 0 ? (
          <DataRow label={t('park.trains')} value={`${totals.trains} · ${totals.trainCars}`} />
        ) : null}
      </Section>

      {!s.live ? <EmptyNote>{t('park.noSim')}</EmptyNote> : null}
    </div>
  );
}

// ── Crowd ─────────────────────────────────────────────────────────────────────────────────
export function GuestsPanel({ t, locale, ui }: PanelBodyProps) {
  const runtime = ui as UiRuntime;
  const s = useTelemetrySnapshot(runtime);
  const totals = s.totals;

  return (
    <div className="flex flex-col gap-3">
      <div className={cn(HUD_WELL, 'flex items-center gap-3 px-3 py-2.5')}>
        <Users className="size-5 shrink-0 text-white/45" />
        <Figure label={t('park.inThePark')} value={count(totals.guests, locale)} />
        <div className="ml-auto w-28">
          <Meter
            label={t('park.happiness')}
            value={totals.happiness < 0 ? '–' : `${Math.round(totals.happiness)}`}
            fraction={totals.happiness < 0 ? 0 : totals.happiness / 100}
            tone={happinessTone(totals.happiness)}
          />
        </div>
      </div>

      <Section label={t('park.crowd')}>
        {s.crowd.length === 0 ? (
          <EmptyNote>{t('park.noCrowd')}</EmptyNote>
        ) : (
          <div className="flex flex-col gap-1">
            {s.crowd.map((c) => (
              <div key={c.state} className="flex items-center gap-2">
                <span
                  className={cn('size-2 rounded-[3px]', CROWD_COLOURS[c.state] ?? 'bg-white/30')}
                />
                <span className="min-w-0 flex-1 truncate text-xs text-white/70">
                  {crowdLabel(t, c.state)}
                </span>
                <span className="text-xs font-medium text-white/90 tabular-nums">{c.count}</span>
                <span className="w-10 text-right text-[10px] text-white/40 tabular-nums">
                  {percent(totals.guests > 0 ? c.count / totals.guests : 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section label={t('guests.thoughts')}>
        {s.thoughts.length === 0 ? (
          <EmptyNote>{t('guests.noThoughts')}</EmptyNote>
        ) : (
          <ul className="flex flex-col gap-1">
            {s.thoughts.map((th) => (
              <li
                key={th.seq}
                className="flex items-start gap-2 rounded-lg bg-white/[0.03] px-2 py-1.5"
              >
                <span
                  className={cn(
                    'mt-1 size-1.5 shrink-0 rounded-full',
                    th.mood < 0 ? 'bg-(--game-danger)' : 'bg-[oklch(0.82_0.15_155)]'
                  )}
                />
                <span className="min-w-0 flex-1 text-[11px] leading-snug text-white/75">
                  {th.text}
                </span>
                <span className="shrink-0 text-[10px] text-white/35 tabular-nums">
                  {clockTime(th.minute)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

// ── Weather ───────────────────────────────────────────────────────────────────────────────
const selectWeather = (s: ParkTelemetry) => ({
  season: s.season,
  weather: s.weather,
  temperatureC: Math.round(s.temperatureC * 10) / 10,
  windMs: Math.round(s.windMs * 10) / 10,
  cloud: Math.round(s.cloud * 100),
  wetness: Math.round(s.wetness * 100),
  precipitation: s.precipitation,
  night: Math.round(s.night * 100),
  minute: Math.floor(s.minute),
  day: s.day,
});

export function WeatherPanel({ t, locale, ui }: PanelBodyProps) {
  const runtime = ui as UiRuntime;
  const w = useTelemetry(runtime, selectWeather, shallowWeather);
  const handle = runtime.handle();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={cn(HUD_WELL, 'px-2 py-1 text-xs font-medium text-white/85')}>
          {t(`season.${w.season}` as GameStringKey)}
        </span>
        <span className={cn(HUD_WELL, 'px-2 py-1 text-xs font-medium text-white/85')}>
          {t(`weather.${w.weather}` as GameStringKey)}
        </span>
        <span className="ml-auto text-lg font-semibold text-white/90 tabular-nums">
          {decimal(w.temperatureC, locale, 1)} °C
        </span>
      </div>

      <Section>
        <IconRow icon={<Thermometer className="size-3.5" />} label={t('weather.temperature')}>
          {decimal(w.temperatureC, locale, 1)} °C
        </IconRow>
        <IconRow icon={<Wind className="size-3.5" />} label={t('weather.wind')}>
          {decimal(w.windMs, locale, 1)} m/s
        </IconRow>
        <IconRow icon={<Sun className="size-3.5" />} label={t('weather.cloud')}>
          {w.cloud} %
        </IconRow>
        <IconRow icon={<Droplets className="size-3.5" />} label={t('weather.wetness')}>
          {w.wetness} %
        </IconRow>
        <IconRow icon={<CloudRain className="size-3.5" />} label={t('weather.falling')}>
          {t(`weather.precip.${w.precipitation}` as GameStringKey)}
        </IconRow>
      </Section>

      <Section label={t('weather.timeOfDay')}>
        <DayStrip minute={w.minute} />
        <div className="mt-2 flex items-center gap-2">
          <span className="w-11 text-xs font-semibold text-white/85 tabular-nums">
            {clockTime(w.minute)}
          </span>
          <input
            type="range"
            min={0}
            max={1439}
            step={5}
            value={w.minute}
            aria-label={t('weather.timeOfDay')}
            onChange={(ev) => handle?.setTimeOfDay(Number(ev.target.value))}
            className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-[var(--game-accent)]"
          />
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-white/45">{t('weather.scrubNote')}</p>
      </Section>
    </div>
  );
}

function shallowWeather(a: ReturnType<typeof selectWeather>, b: ReturnType<typeof selectWeather>) {
  return (
    a.season === b.season &&
    a.weather === b.weather &&
    a.temperatureC === b.temperatureC &&
    a.windMs === b.windMs &&
    a.cloud === b.cloud &&
    a.wetness === b.wetness &&
    a.precipitation === b.precipitation &&
    a.night === b.night &&
    a.minute === b.minute &&
    a.day === b.day
  );
}

function IconRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-white/35">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-xs text-white/55">{label}</span>
      <span className="text-xs font-medium text-white/90 tabular-nums">{children}</span>
    </div>
  );
}

/**
 * The day as a strip, with a marker where the clock is.
 *
 * Drawn from the minute rather than from the sun's elevation, because it has to show the whole
 * day at once and the sun is only ever at one point of it. The bands are the same four
 * `dayPart()` returns.
 */
export function DayStrip({ minute, className }: { minute: number; className?: string }) {
  const position = (((minute % 1440) + 1440) % 1440) / 1440;
  return (
    <div className={cn('relative h-1.5 w-full overflow-hidden rounded-full', className)}>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.22_0.05_265)_0%,oklch(0.22_0.05_265)_21%,oklch(0.55_0.12_60)_33%,oklch(0.75_0.09_230)_45%,oklch(0.78_0.08_230)_66%,oklch(0.6_0.14_45)_80%,oklch(0.22_0.05_265)_92%,oklch(0.22_0.05_265)_100%)]" />
      <span
        className="absolute top-0 h-full w-[3px] -translate-x-1/2 rounded-full bg-white shadow-[0_0_6px_rgb(255_255_255/0.8)]"
        style={{ left: `${position * 100}%` }}
      />
    </div>
  );
}
