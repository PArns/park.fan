'use client';

import {
  Activity,
  BarChart3,
  Clock,
  CloudSun,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  MemoryStick,
  Server,
  Thermometer,
  Waves,
  Zap,
} from 'lucide-react';
import { useAdminFetch } from '../_lib/admin-context';
import { ADMIN_PATHS } from '../_lib/api';
import {
  CHIP_TEMP_C,
  CPU_LOAD_PCT,
  FEED_STALE_MINUTES,
  WEATHER_DAYS_AHEAD,
  cpuTempThreshold,
  levelAbove,
  levelBelow,
  type HealthTone,
  type Threshold,
} from '@/lib/admin/health';
import { HEALTH_TEXT } from '../_ui/metrics';
import { formatDay, formatUptime } from '../_lib/format';
import { getNumberFormat } from '@/lib/utils/intl-format';
import { MetricBar } from '@/components/common/metric-bar';
import type { HostDisk, SiteAnalyticsHealth, SystemHealthResponse } from '@/lib/api/admin';
import {
  AdminPage,
  ErrorState,
  LoadingState,
  Meta,
  Panel,
  PanelBody,
  PanelHeader,
  StatusDot,
  Tile,
} from '../_ui/primitives';

const CHIP_LABELS: Record<string, string> = {
  coretemp: 'CPU · coretemp',
  k10temp: 'CPU · k10temp',
  zenpower: 'CPU · zenpower',
  nvme: 'NVMe SSD',
  acpitz: 'ACPI Thermal',
  iwlwifi: 'Wi-Fi',
  iwlwifi_1: 'Wi-Fi',
};
const CPU_CHIP = /coretemp|k10temp|zenpower|cpu/i;
function chipLabel(chip: string): string {
  if (CHIP_LABELS[chip]) return CHIP_LABELS[chip];
  if (chip.startsWith('r816')) return 'Ethernet';
  return chip;
}
/** A reading's colour: amber and red by the overview's thresholds, `okClass` while it is fine. */
function readingClass(tone: HealthTone, okClass = 'text-emerald-400'): string {
  return tone === 'ok' ? okClass : HEALTH_TEXT[tone];
}
function sensorTempClass(t: number, threshold: Threshold): string {
  return readingClass(levelAbove(t, threshold));
}
/** A figure with a fixed number of decimals, German style: `16,5`. */
function decimal(value: number, digits: number): string {
  return getNumberFormat('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
function isDisk(d: HostDisk | { error: string }): d is HostDisk {
  return 'usedPct' in d;
}

/** When the last window was written, in UTC like the figures of the statistic. */
const WRITTEN_AT = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});

/** Today's and yesterday's drop counts by reason, biggest first; nothing dropped says so. */
function DropCounts({
  today,
  yesterday,
}: {
  today: SiteAnalyticsHealth['dropsToday'];
  yesterday: SiteAnalyticsHealth['dropsYesterday'];
}) {
  const reasons = [...new Set([...Object.keys(today), ...Object.keys(yesterday)])].sort(
    (a, b) => (today[b] ?? 0) + (yesterday[b] ?? 0) - ((today[a] ?? 0) + (yesterday[a] ?? 0))
  );
  if (reasons.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Heute und gestern wurde nichts verworfen.</p>
    );
  }
  return (
    <table className="w-full text-sm tabular-nums">
      <thead className="text-muted-foreground text-xs">
        <tr>
          <th className="py-1 text-left font-medium">Grund</th>
          <th className="py-1 text-right font-medium">Heute</th>
          <th className="py-1 text-right font-medium">Gestern</th>
        </tr>
      </thead>
      <tbody className="divide-border/40 divide-y">
        {reasons.map((reason) => (
          <tr key={reason}>
            <td className="py-1 font-mono text-xs">{reason}</td>
            <td className="py-1 text-right">{(today[reason] ?? 0).toLocaleString('de-DE')}</td>
            <td className="py-1 text-right">{(yesterday[reason] ?? 0).toLocaleString('de-DE')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function SystemPage() {
  const { data, error } = useAdminFetch<SystemHealthResponse>(ADMIN_PATHS.systemHealth);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState label="Systemwerte werden geladen…" />;

  const disk = data.host.disk;
  const diskValid = isDisk(disk);
  const maxLoad = data.host.cpu.cores;
  const pgOk = data.postgres.status === 'connected';
  const redisOk = data.redis.status === 'connected';
  const cpuTemp = data.host.cpu.temperatureC;
  const cpuThreshold = cpuTempThreshold(data.host.cpu);
  const cpuTempClass = readingClass(levelAbove(cpuTemp ?? 0, cpuThreshold), 'text-foreground');
  const swap = data.host.swap;
  const fresh = data.freshness;
  const stats = data.siteAnalytics;
  // Wait-time ingestion: a stalled cron can go unnoticed for months, so staleness is loud.
  const queueStale = fresh?.queueStaleMinutes ?? null;
  const queueClass = readingClass(levelAbove(queueStale, FEED_STALE_MINUTES));
  // weather_data holds a ~16-day forecast, so MAX(date) is in the FUTURE: show how
  // many days ahead we have weather (healthy = positive; <= 0 means ingestion stalled).
  // Derived from the server-computed weatherStaleHours (negative for future dates) to
  // avoid an impure Date.now() during render.
  const weatherDate = fresh?.latestWeatherDate ?? null;
  const weatherDaysAhead =
    fresh?.weatherStaleHours != null ? Math.round(-fresh.weatherStaleHours / 24) : null;
  const weatherClass = readingClass(levelBelow(weatherDaysAhead, WEATHER_DAYS_AHEAD));
  // All hwmon sensors, grouped by chip (CPU first, then NVMe, then the rest) and
  // sorted within a group (package/composite first, then by core/sensor number).
  const sensors = data.host.sensors ?? [];
  const sensorGroups = sensors.reduce<Record<string, typeof sensors>>((acc, s) => {
    (acc[s.chip] ??= []).push(s);
    return acc;
  }, {});
  const chipRank = (c: string) => (CPU_CHIP.test(c) ? 0 : /nvme/i.test(c) ? 1 : 2);
  const sensorEntries = Object.entries(sensorGroups).sort(
    (a, b) => chipRank(a[0]) - chipRank(b[0]) || a[0].localeCompare(b[0])
  );
  for (const [, list] of sensorEntries) {
    list.sort((a, b) => {
      const pa = /package|tctl|tdie|composite/i.test(a.label) ? 0 : 1;
      const pb = /package|tctl|tdie|composite/i.test(b.label) ? 0 : 1;
      return (
        pa - pb || Number(a.label.match(/\d+/)?.[0] ?? 0) - Number(b.label.match(/\d+/)?.[0] ?? 0)
      );
    });
  }

  return (
    <AdminPage width="wide">
      <Panel>
        <PanelHeader icon={Server} title="Server" />
        <PanelBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tile icon={Cpu} title="CPU" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span
                  className={`text-[1.75rem] leading-tight font-semibold tracking-tight tabular-nums ${readingClass(levelAbove(data.host.cpu.loadPct ?? 0, CPU_LOAD_PCT), 'text-foreground')}`}
                >
                  {data.host.cpu.loadPct ?? '—'}%
                </span>
                <p className="text-muted-foreground mt-0.5 text-xs">Last</p>
              </div>
              <div title={`Gelb ab ${cpuThreshold.warn} °C, rot ab ${cpuThreshold.bad} °C`}>
                <span
                  className={`flex items-center gap-1 text-[1.75rem] leading-tight font-semibold tracking-tight tabular-nums ${cpuTempClass}`}
                >
                  <Thermometer className="h-5 w-5" />
                  {cpuTemp ?? '—'}
                  <span className="text-muted-foreground text-lg font-normal">°C</span>
                </span>
                <p className="text-muted-foreground mt-0.5 text-xs">Temperatur</p>
              </div>
            </div>
            <p className="text-muted-foreground truncate text-xs" title={data.host.cpu.model}>
              {data.host.cpu.cores} Kerne · {data.host.cpu.model.split(' ').slice(0, 3).join(' ')}
            </p>
            <div className="space-y-1.5">
              <MetricBar
                label="1m"
                value={data.host.cpu.load['1m']}
                max={maxLoad}
                unit=""
                thresholds={[60, 80]}
              />
              <MetricBar
                label="5m"
                value={data.host.cpu.load['5m']}
                max={maxLoad}
                unit=""
                thresholds={[60, 80]}
              />
              <MetricBar
                label="15m"
                value={data.host.cpu.load['15m']}
                max={maxLoad}
                unit=""
                thresholds={[60, 80]}
              />
            </div>
          </Tile>

          <Tile icon={MemoryStick} title="Arbeitsspeicher" className="space-y-3">
            <div>
              <span className="text-[1.75rem] leading-tight font-semibold tracking-tight tabular-nums">
                {decimal(data.host.memory.usedGB, 1)}
                <span className="text-muted-foreground text-lg font-normal"> GB</span>
              </span>
              <p className="text-muted-foreground mt-0.5 text-xs">
                von {decimal(data.host.memory.totalGB, 1)} GB
              </p>
            </div>
            <MetricBar
              label="Belegt"
              value={data.host.memory.usedGB}
              max={data.host.memory.totalGB}
              unit=" GB"
              pct={data.host.memory.usedPct}
            />
            {swap ? (
              <MetricBar
                label={`Swap (${decimal(swap.usedGB, 1)} / ${decimal(swap.totalGB, 0)} GB)`}
                value={swap.usedGB}
                max={swap.totalGB}
                unit=" GB"
                pct={swap.usedPct}
                thresholds={[50, 80]}
              />
            ) : null}
          </Tile>

          <Tile icon={HardDrive} title="Festplatte" className="space-y-3">
            {diskValid ? (
              <>
                <div>
                  <span className="text-[1.75rem] leading-tight font-semibold tracking-tight tabular-nums">
                    {decimal(disk.totalGB - disk.freeGB, 0)}
                    <span className="text-muted-foreground text-lg font-normal"> GB</span>
                  </span>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    von {decimal(disk.totalGB, 0)} GB · {decimal(disk.freeGB, 0)} GB frei
                  </p>
                </div>
                <MetricBar
                  label="Belegt"
                  value={disk.totalGB - disk.freeGB}
                  max={disk.totalGB}
                  unit=" GB"
                  pct={disk.usedPct}
                  thresholds={[75, 90]}
                />
              </>
            ) : (
              <p className="text-muted-foreground text-sm">nicht lesbar</p>
            )}
          </Tile>

          <Tile icon={Clock} title="Laufzeit">
            <div className="space-y-1">
              <span className="text-[1.75rem] leading-tight font-semibold tracking-tight tabular-nums">
                {formatUptime(data.host.uptimeHours)}
              </span>
              <p className="text-muted-foreground text-xs">API v4 · seit dem letzten Neustart</p>
            </div>
          </Tile>
        </PanelBody>
      </Panel>

      {fresh ? (
        <Panel>
          <PanelHeader icon={Activity} title="Datenzufuhr" />
          <PanelBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Tile
              icon={Waves}
              title="Wartezeiten"
              className="space-y-3"
              action={
                <span className="flex items-center gap-1.5 text-xs">
                  <StatusDot ok={queueStale != null && queueStale < 20} />
                  <span className={queueClass}>
                    {queueStale != null ? `vor ${queueStale} Min.` : 'keine Daten'}
                  </span>
                </span>
              }
            >
              <div>
                <span
                  className={`text-[1.75rem] leading-tight font-semibold tracking-tight tabular-nums ${queueClass}`}
                >
                  {fresh.queueRowsLastHour.toLocaleString('de-DE')}
                </span>
                <p className="text-muted-foreground mt-0.5 text-xs">Zeilen in der letzten Stunde</p>
              </div>
              <div className="grid grid-cols-1 gap-3 pt-1 text-sm">
                <Meta
                  label="Neueste Zeile"
                  value={
                    fresh.latestQueueTime
                      ? new Date(fresh.latestQueueTime).toLocaleString('de-DE')
                      : '—'
                  }
                />
              </div>
            </Tile>

            <Tile
              icon={CloudSun}
              title="Wettervorhersage"
              className="space-y-3"
              action={
                <span className="flex items-center gap-1.5 text-xs">
                  <StatusDot ok={weatherDaysAhead != null && weatherDaysAhead > 0} />
                  <span className={weatherClass}>
                    {weatherDaysAhead != null
                      ? weatherDaysAhead > 0
                        ? `${weatherDaysAhead} Tage voraus`
                        : 'steht'
                      : 'keine Daten'}
                  </span>
                </span>
              }
            >
              <div>
                <span
                  className={`text-[1.75rem] leading-tight font-semibold tracking-tight tabular-nums ${weatherClass}`}
                >
                  {weatherDaysAhead ?? '—'}
                  <span className="text-muted-foreground text-lg font-normal"> Tage</span>
                </span>
                <p className="text-muted-foreground mt-0.5 text-xs">reicht die Vorhersage</p>
              </div>
              <div className="grid grid-cols-1 gap-3 pt-1 text-sm">
                <Meta label="Vorhersage bis" value={formatDay(weatherDate)} />
              </div>
            </Tile>
          </PanelBody>
        </Panel>
      ) : null}

      {data.gpu?.available && data.gpu.gpus?.length ? (
        <Panel>
          <PanelHeader icon={Gauge} title="GPU" />
          <PanelBody className="space-y-3">
            {data.gpu.gpus.map((g) => {
              const temp = g.temperatureC ?? 0;
              const tempClass = readingClass(levelAbove(temp, CHIP_TEMP_C), 'text-foreground');
              const vramTotal = g.memoryTotalMB ? g.memoryTotalMB / 1024 : 0;
              const vramUsed = (g.memoryUsedMB ?? 0) / 1024;
              return (
                // 4 cards in the same grid as HOST so GPU lines up column-for-column.
                <div
                  key={g.index ?? g.name}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
                >
                  <Tile icon={Gauge} title="GPU-Last" className="space-y-3">
                    <div>
                      <span className="text-[1.75rem] leading-tight font-semibold tracking-tight tabular-nums">
                        {g.utilizationGpuPct ?? '—'}
                        <span className="text-muted-foreground text-lg font-normal">%</span>
                      </span>
                      <p className="text-muted-foreground mt-0.5 truncate text-xs" title={g.name}>
                        {g.name.replace(/^NVIDIA\s+/i, '')}
                      </p>
                    </div>
                    <MetricBar
                      label="Auslastung"
                      value={g.utilizationGpuPct ?? 0}
                      max={100}
                      unit="%"
                      thresholds={[70, 90]}
                    />
                  </Tile>

                  <Tile icon={Thermometer} title="Temperatur" className="space-y-3">
                    <div>
                      <span
                        className={`text-[1.75rem] leading-tight font-semibold tracking-tight tabular-nums ${tempClass}`}
                      >
                        {g.temperatureC ?? '—'}
                        <span className="text-muted-foreground text-lg font-normal"> °C</span>
                      </span>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Speicher-I/O {g.utilizationMemPct ?? '—'} %
                      </p>
                    </div>
                    <MetricBar
                      label="Temperatur"
                      value={temp}
                      max={100}
                      unit=" °C"
                      thresholds={[70, 85]}
                    />
                  </Tile>

                  <Tile icon={MemoryStick} title="VRAM" className="space-y-3">
                    <div>
                      <span className="text-[1.75rem] leading-tight font-semibold tracking-tight tabular-nums">
                        {decimal(vramUsed, 1)}
                        <span className="text-muted-foreground text-lg font-normal"> GB</span>
                      </span>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        von {decimal(vramTotal, 0)} GB
                      </p>
                    </div>
                    {vramTotal ? (
                      <MetricBar
                        label="Belegt"
                        value={vramUsed}
                        max={vramTotal}
                        unit=" GB"
                        pct={g.memoryUsedPct ?? undefined}
                        thresholds={[75, 90]}
                      />
                    ) : null}
                  </Tile>

                  <Tile icon={Zap} title="Leistung" className="space-y-3">
                    <div>
                      <span className="text-[1.75rem] leading-tight font-semibold tracking-tight tabular-nums">
                        {g.powerW == null ? '—' : decimal(g.powerW, 0)}
                        <span className="text-muted-foreground text-lg font-normal"> W</span>
                      </span>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Grenze {g.powerLimitW == null ? '—' : decimal(g.powerLimitW, 0)} W
                      </p>
                    </div>
                    {g.powerLimitW ? (
                      <MetricBar
                        label="Aufnahme"
                        value={g.powerW ?? 0}
                        max={g.powerLimitW}
                        unit=" W"
                        thresholds={[70, 90]}
                      />
                    ) : null}
                  </Tile>
                </div>
              );
            })}
          </PanelBody>
        </Panel>
      ) : null}

      {sensorEntries.length ? (
        <Panel>
          <PanelHeader icon={Thermometer} title="Sensoren" />
          <PanelBody className="grid grid-cols-1 gap-3">
            {sensorEntries.map(([chip, list]) => {
              const hot = Math.max(...list.map((s) => s.tempC));
              // Cores take the CPU's limits, or a core reads red where the overview does not.
              const threshold = CPU_CHIP.test(chip) ? cpuThreshold : CHIP_TEMP_C;
              return (
                <Tile
                  key={chip}
                  icon={Thermometer}
                  title={
                    <>
                      {chipLabel(chip)}
                      <span className="text-muted-foreground/60">
                        · {list.length} {list.length === 1 ? 'Sensor' : 'Sensoren'}
                      </span>
                    </>
                  }
                  action={
                    <span
                      className={`text-xs font-semibold tabular-nums ${sensorTempClass(hot, threshold)}`}
                    >
                      Spitze {hot} °C
                    </span>
                  }
                >
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                    {list.map((s, i) => (
                      <div
                        key={`${s.label}-${i}`}
                        className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5"
                      >
                        <p className="text-muted-foreground truncate text-xs" title={s.label}>
                          {s.label}
                        </p>
                        <p
                          className={`text-lg font-bold tabular-nums ${sensorTempClass(s.tempC, threshold)}`}
                        >
                          {s.tempC}
                          <span className="text-muted-foreground text-xs font-normal"> °C</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </Tile>
              );
            })}
          </PanelBody>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader icon={Database} title="Datenbank und Cache" />
        <PanelBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Tile
            icon={Database}
            title="PostgreSQL"
            className="space-y-3"
            action={
              <span className="flex items-center gap-1.5 text-xs">
                <StatusDot ok={pgOk} />
                <span className={pgOk ? 'text-emerald-400' : 'text-red-400'}>
                  {pgOk ? 'verbunden' : data.postgres.status}
                </span>
              </span>
            }
          >
            <MetricBar
              label={`Verbindungen (aktiv: ${data.postgres.activeQueries})`}
              value={data.postgres.connections}
              max={data.postgres.maxConnections}
              unit=""
              pct={data.postgres.connectionsPct ?? undefined}
              thresholds={[60, 80]}
            />
            <div className="grid grid-cols-2 gap-3 pt-1 text-sm">
              <Meta label="Größe" value={`${decimal(data.postgres.dbSizeGB, 2)} GB`} />
              <Meta
                label="Cache-Treffer"
                value={`${data.postgres.cacheHitPct == null ? '—' : decimal(data.postgres.cacheHitPct, 1)} %`}
                valueClassName={
                  (data.postgres.cacheHitPct ?? 0) >= 99 ? 'text-emerald-400' : 'text-amber-400'
                }
              />
            </div>
          </Tile>

          <Tile
            icon={Zap}
            title="Redis"
            className="space-y-3"
            action={
              <span className="flex items-center gap-1.5 text-xs">
                <StatusDot ok={redisOk} />
                <span className={redisOk ? 'text-emerald-400' : 'text-red-400'}>
                  {redisOk ? 'verbunden' : data.redis.status}
                </span>
              </span>
            }
          >
            <MetricBar
              label="Speicher"
              value={data.redis.usedMemoryMB}
              max={data.redis.maxMemoryMB ?? data.redis.usedMemoryMB * 2}
              unit=" MB"
              thresholds={[60, 80]}
            />
            <div className="grid grid-cols-3 gap-3 pt-1 text-sm">
              <Meta label="Schlüssel" value={data.redis.keys.toLocaleString('de-DE')} />
              <Meta label="Clients" value={data.redis.connectedClients} />
              <Meta
                label="Trefferquote"
                value={`${data.redis.hitRatePct == null ? '—' : decimal(data.redis.hitRatePct, 1)} %`}
                valueClassName={
                  (data.redis.hitRatePct ?? 0) >= 80 ? 'text-emerald-400' : 'text-amber-400'
                }
              />
            </div>
          </Tile>
        </PanelBody>
      </Panel>

      {stats ? (
        <Panel>
          <PanelHeader
            icon={BarChart3}
            title="Statistik"
            hint="Der eigene Zähler: was im Zwischenspeicher auf den nächsten Schreibvorgang wartet und was er verworfen hat"
            action={
              'error' in stats ? null : (
                <span className="flex items-center gap-1.5 text-xs">
                  <StatusDot ok={stats.healthy} />
                  <span className={stats.healthy ? 'text-emerald-400' : 'text-red-400'}>
                    {stats.healthy ? 'Läuft' : 'Hängt'}
                  </span>
                </span>
              )
            }
          />
          {'error' in stats ? (
            <PanelBody>
              <p className="text-muted-foreground text-sm">Nicht lesbar: {stats.error}</p>
            </PanelBody>
          ) : (
            <PanelBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Tile title="Wartet auf das Schreiben" className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Meta
                    label="Fenster"
                    value={`${stats.pendingWindows} (${stats.readyWindows} bereit)`}
                  />
                  <Meta
                    label="Das älteste"
                    value={
                      stats.oldestPendingMinutes === null
                        ? '–'
                        : `${stats.oldestPendingMinutes} min`
                    }
                    valueClassName={
                      (stats.oldestPendingMinutes ?? 0) > 15 ? 'text-amber-400' : undefined
                    }
                  />
                  <Meta
                    label="Aufgegeben"
                    value={stats.parkedWindows}
                    valueClassName={stats.parkedWindows > 0 ? 'text-red-400' : undefined}
                  />
                  <Meta label="Offene Besuche" value={stats.openVisits.toLocaleString('de-DE')} />
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Zuletzt geschrieben:{' '}
                  {stats.lastFlushAt
                    ? `${WRITTEN_AT.format(new Date(stats.lastFlushAt))} UTC`
                    : '–'}
                </p>
              </Tile>
              <Tile title="Verworfen und übergelaufen" className="space-y-2">
                <DropCounts today={stats.dropsToday} yesterday={stats.dropsYesterday} />
              </Tile>
            </PanelBody>
          )}
        </Panel>
      ) : null}
    </AdminPage>
  );
}
