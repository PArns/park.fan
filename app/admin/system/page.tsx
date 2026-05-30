'use client';

import {
  Activity,
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
import {
  ErrorPanel,
  KeyVal,
  LoadingPanel,
  Section,
  formatUptime,
  isDisk,
  statusDot,
} from '../_lib/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricBar } from '@/components/common/metric-bar';
import type { SystemHealthResponse } from '@/lib/api/admin';

export default function SystemPage() {
  const { data, error } = useAdminFetch<SystemHealthResponse>('/api/admin/system-health', true);

  if (error) return <ErrorPanel message={error} />;
  if (!data) return <LoadingPanel label="Loading system metrics…" />;

  const disk = data.host.disk;
  const diskValid = isDisk(disk);
  const maxLoad = data.host.cpu.cores;
  const pgOk = data.postgres.status === 'connected';
  const redisOk = data.redis.status === 'connected';
  const cpuTemp = data.host.cpu.temperatureC;
  const cpuTempClass =
    (cpuTemp ?? 0) >= 85 ? 'text-red-400' : (cpuTemp ?? 0) >= 70 ? 'text-amber-400' : 'text-foreground';
  const swap = data.host.swap;
  const fresh = data.freshness;
  // Wait-time ingestion: a stalled cron once ran 83 days unnoticed, so flag staleness loudly.
  const queueStale = fresh?.queueStaleMinutes ?? null;
  const queueClass =
    queueStale == null
      ? 'text-muted-foreground'
      : queueStale >= 60
        ? 'text-red-400'
        : queueStale >= 20
          ? 'text-amber-400'
          : 'text-emerald-400';
  // weather_data holds a ~16-day forecast, so MAX(date) is in the FUTURE: show how
  // many days ahead we have weather (healthy = positive; <= 0 means ingestion stalled).
  // Derived from the server-computed weatherStaleHours (negative for future dates) to
  // avoid an impure Date.now() during render.
  const weatherDate = fresh?.latestWeatherDate ?? null;
  const weatherDaysAhead =
    fresh?.weatherStaleHours != null ? Math.round(-fresh.weatherStaleHours / 24) : null;
  const weatherClass =
    weatherDaysAhead == null
      ? 'text-muted-foreground'
      : weatherDaysAhead <= 0
        ? 'text-red-400'
        : weatherDaysAhead < 7
          ? 'text-amber-400'
          : 'text-emerald-400';

  return (
    <>
      <Section icon={Server} title="Host">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                <Cpu className="h-3.5 w-3.5" /> CPU
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span
                    className={`text-3xl font-bold tabular-nums ${(data.host.cpu.loadPct ?? 0) >= 80 ? 'text-red-400' : (data.host.cpu.loadPct ?? 0) >= 60 ? 'text-amber-400' : 'text-foreground'}`}
                  >
                    {data.host.cpu.loadPct ?? '—'}%
                  </span>
                  <p className="text-muted-foreground mt-0.5 text-xs">Load</p>
                </div>
                <div>
                  <span
                    className={`flex items-center gap-1 text-3xl font-bold tabular-nums ${cpuTempClass}`}
                  >
                    <Thermometer className="h-5 w-5" />
                    {cpuTemp ?? '—'}
                    <span className="text-muted-foreground text-lg font-normal">°C</span>
                  </span>
                  <p className="text-muted-foreground mt-0.5 text-xs">Temp</p>
                </div>
              </div>
              <p className="text-muted-foreground truncate text-xs" title={data.host.cpu.model}>
                {data.host.cpu.cores} Cores · {data.host.cpu.model.split(' ').slice(0, 3).join(' ')}
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
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                <MemoryStick className="h-3.5 w-3.5" /> Memory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-3xl font-bold tabular-nums">
                  {data.host.memory.usedGB.toFixed(1)}
                  <span className="text-muted-foreground text-lg font-normal"> GB</span>
                </span>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  of {data.host.memory.totalGB.toFixed(1)} GB
                </p>
              </div>
              <MetricBar
                label="Usage"
                value={data.host.memory.usedGB}
                max={data.host.memory.totalGB}
                unit=" GB"
                pct={data.host.memory.usedPct}
              />
              {swap ? (
                <MetricBar
                  label={`Swap (${swap.usedGB.toFixed(1)} / ${swap.totalGB.toFixed(0)} GB)`}
                  value={swap.usedGB}
                  max={swap.totalGB}
                  unit=" GB"
                  pct={swap.usedPct}
                  thresholds={[50, 80]}
                />
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                <HardDrive className="h-3.5 w-3.5" /> Disk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {diskValid ? (
                <>
                  <div>
                    <span className="text-3xl font-bold tabular-nums">
                      {(disk.totalGB - disk.freeGB).toFixed(0)}
                      <span className="text-muted-foreground text-lg font-normal"> GB</span>
                    </span>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      of {disk.totalGB.toFixed(0)} GB · {disk.freeGB.toFixed(0)} GB free
                    </p>
                  </div>
                  <MetricBar
                    label="Used"
                    value={disk.totalGB - disk.freeGB}
                    max={disk.totalGB}
                    unit=" GB"
                    pct={disk.usedPct}
                    thresholds={[75, 90]}
                  />
                </>
              ) : (
                <p className="text-muted-foreground text-sm">N/A</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                <Clock className="h-3.5 w-3.5" /> Uptime
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <span className="text-3xl font-bold tabular-nums">
                {formatUptime(data.host.uptimeHours)}
              </span>
              <p className="text-muted-foreground text-xs">
                API v4 · {data.host.cpu.cores}-core server
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {data.gpu?.available && data.gpu.gpus?.length ? (
        <Section icon={Gauge} title="GPU">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.gpu.gpus.map((g) => {
              const temp = g.temperatureC ?? 0;
              const tempClass =
                temp >= 85 ? 'text-red-400' : temp >= 70 ? 'text-amber-400' : 'text-foreground';
              return (
                <Card key={g.index ?? g.name} className="border-border/60 sm:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                      <Gauge className="h-3.5 w-3.5" /> {g.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-3xl font-bold tabular-nums">
                          {g.utilizationGpuPct ?? '—'}
                          <span className="text-muted-foreground text-lg font-normal">%</span>
                        </span>
                        <p className="text-muted-foreground mt-0.5 text-xs">GPU load</p>
                      </div>
                      <div>
                        <span
                          className={`flex items-center gap-1 text-3xl font-bold tabular-nums ${tempClass}`}
                        >
                          <Thermometer className="h-5 w-5" />
                          {g.temperatureC ?? '—'}
                          <span className="text-muted-foreground text-lg font-normal">°C</span>
                        </span>
                        <p className="text-muted-foreground mt-0.5 text-xs">Temperature</p>
                      </div>
                    </div>
                    {g.memoryTotalMB ? (
                      <MetricBar
                        label="VRAM"
                        value={(g.memoryUsedMB ?? 0) / 1024}
                        max={g.memoryTotalMB / 1024}
                        unit=" GB"
                        pct={g.memoryUsedPct ?? undefined}
                        thresholds={[75, 90]}
                      />
                    ) : null}
                    <div className="grid grid-cols-2 gap-3 pt-1 text-sm">
                      <KeyVal
                        label="Power"
                        value={`${g.powerW?.toFixed(0) ?? '—'}${g.powerLimitW ? ` / ${g.powerLimitW.toFixed(0)}` : ''} W`}
                      />
                      <KeyVal label="Mem I/O" value={`${g.utilizationMemPct ?? '—'}%`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Section>
      ) : null}

      <Section icon={Database} title="Database & Cache">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Database className="text-primary h-4 w-4" /> PostgreSQL
                </span>
                <span className="flex items-center gap-1.5 text-sm font-normal">
                  {statusDot(pgOk)}
                  <span className={pgOk ? 'text-emerald-400' : 'text-red-400'}>
                    {pgOk ? 'Connected' : data.postgres.status}
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <MetricBar
                label={`Connections (active: ${data.postgres.activeQueries})`}
                value={data.postgres.connections}
                max={data.postgres.maxConnections}
                unit=""
                pct={data.postgres.connectionsPct ?? undefined}
                thresholds={[60, 80]}
              />
              <div className="grid grid-cols-2 gap-3 pt-1 text-sm">
                <KeyVal label="DB Size" value={`${data.postgres.dbSizeGB.toFixed(2)} GB`} />
                <KeyVal
                  label="Cache Hit"
                  value={`${data.postgres.cacheHitPct?.toFixed(1) ?? '—'}%`}
                  valueClass={
                    (data.postgres.cacheHitPct ?? 0) >= 99 ? 'text-emerald-400' : 'text-amber-400'
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Zap className="text-primary h-4 w-4" /> Redis
                </span>
                <span className="flex items-center gap-1.5 text-sm font-normal">
                  {statusDot(redisOk)}
                  <span className={redisOk ? 'text-emerald-400' : 'text-red-400'}>
                    {redisOk ? 'Connected' : data.redis.status}
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <MetricBar
                label="Memory"
                value={data.redis.usedMemoryMB}
                max={data.redis.maxMemoryMB ?? data.redis.usedMemoryMB * 2}
                unit=" MB"
                thresholds={[60, 80]}
              />
              <div className="grid grid-cols-3 gap-3 pt-1 text-sm">
                <KeyVal label="Keys" value={data.redis.keys.toLocaleString('en-GB')} />
                <KeyVal label="Clients" value={data.redis.connectedClients} />
                <KeyVal
                  label="Hit Rate"
                  value={`${data.redis.hitRatePct?.toFixed(1) ?? '—'}%`}
                  valueClass={
                    (data.redis.hitRatePct ?? 0) >= 80 ? 'text-emerald-400' : 'text-amber-400'
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      {fresh ? (
        <Section icon={Activity} title="Data Ingestion">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Waves className="text-primary h-4 w-4" /> Wait Times
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-normal">
                    {statusDot(queueStale != null && queueStale < 20)}
                    <span className={queueClass}>
                      {queueStale != null ? `${queueStale} min ago` : 'no data'}
                    </span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className={`text-3xl font-bold tabular-nums ${queueClass}`}>
                    {fresh.queueRowsLastHour.toLocaleString('en-GB')}
                  </span>
                  <p className="text-muted-foreground mt-0.5 text-xs">rows ingested · last hour</p>
                </div>
                <div className="grid grid-cols-1 gap-3 pt-1 text-sm">
                  <KeyVal
                    label="Latest data point"
                    value={
                      fresh.latestQueueTime
                        ? new Date(fresh.latestQueueTime).toLocaleString('en-GB')
                        : '—'
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <CloudSun className="text-primary h-4 w-4" /> Weather Forecast
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-normal">
                    {statusDot(weatherDaysAhead != null && weatherDaysAhead > 0)}
                    <span className={weatherClass}>
                      {weatherDaysAhead != null
                        ? weatherDaysAhead > 0
                          ? `+${weatherDaysAhead}d ahead`
                          : 'stalled'
                        : 'no data'}
                    </span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className={`text-3xl font-bold tabular-nums ${weatherClass}`}>
                    {weatherDaysAhead ?? '—'}
                    <span className="text-muted-foreground text-lg font-normal"> days</span>
                  </span>
                  <p className="text-muted-foreground mt-0.5 text-xs">forecast horizon</p>
                </div>
                <div className="grid grid-cols-1 gap-3 pt-1 text-sm">
                  <KeyVal label="Forecast until" value={weatherDate ?? '—'} />
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>
      ) : null}
    </>
  );
}
