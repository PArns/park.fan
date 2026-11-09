'use client';

import {
  Brain,
  CalendarRange,
  Database,
  History,
  ImageIcon,
  ListChecks,
  MapPin,
  Radio,
  Server,
  Sparkles,
  Timer,
  TrendingUp,
} from 'lucide-react';
import {
  CONNECTIONS_PCT,
  CPU_LOAD_PCT,
  FEED_STALE_MINUTES,
  STORAGE_PCT,
  WEATHER_DAYS_AHEAD,
  durationLabel,
  levelAbove,
  levelBelow,
  componentTone,
  openFailures,
  type AdminHealth,
  type HealthAreaId,
} from '@/lib/admin/health';
import { figureDelta, formatCount } from '@/lib/admin/site-analytics';
import type { TrafficOverview } from '@/lib/api/admin-site-analytics';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { getNumberFormat } from '@/lib/utils/intl-format';
import type { AdminOverview } from '../_lib/types';
import type { AdminHealthData } from '../_lib/use-admin-health';
import { formatUptime } from '../_lib/format';
import { CATEGORICAL, DeltaChip, Sparkline } from '../_ui/charts';
import {
  dailyBuckets,
  MeterRow,
  Meters,
  SegmentBar,
  ShareTrack,
  StatCard,
  TickStrip,
  type StatTone,
} from '../_ui/metrics';

const oneDecimal = getNumberFormat('de-DE', { maximumFractionDigits: 1 });

/** A card's label turns amber or red with its area; fine and unknown stay quiet. */
function cardTone(health: AdminHealth, id: HealthAreaId): StatTone {
  const tone = health.areas.find((area) => area.id === id)?.tone;
  return tone === 'bad' ? 'bad' : tone === 'warn' ? 'warn' : 'neutral';
}

/**
 * The figures of the day: the site's visitors now and today, the wait-time feed, the host, the
 * database, the queues, the models and the photo inbox. Each card leads to the page it comes
 * from, and its label takes the colour of that area's verdict.
 */
export function TodayFigures({
  health,
  data,
  traffic,
  canModerate,
}: {
  health: AdminHealth;
  data: AdminHealthData;
  traffic: TrafficOverview | undefined;
  canModerate: boolean;
}) {
  const { system, queues, ml, contributions } = data;
  const fresh = system?.freshness;
  const host = system?.host;
  const weatherDays =
    fresh?.weatherStaleHours == null ? null : Math.round(-fresh.weatherStaleHours / 24);
  const perMinute = traffic?.realtime.perMinute.map((minute) => minute.pageviews) ?? [];
  const lastHalfHour = perMinute.reduce((sum, value) => sum + value, 0);
  const pageviewDelta = traffic
    ? figureDelta(traffic.totals.pageviews, traffic.previous?.pageviews ?? null)
    : null;
  const failures = queues?.queues.reduce((sum, queue) => sum + openFailures(queue), 0) ?? 0;
  const servedModels = ml?.components.filter((c) => c.role === 'served') ?? [];
  const runningModels = ml?.components.filter((c) => componentTone(c.status) === 'ok') ?? [];
  const pending = contributions?.pending ?? [];
  const pendingPhotos = pending.reduce((sum, s) => sum + s.photos, 0);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        href="/admin/traffic"
        icon={TrendingUp}
        label="Besucher heute"
        value={traffic?.totals.visitors == null ? '–' : formatCount(traffic.totals.visitors)}
        unit={
          pageviewDelta && (
            <DeltaChip
              delta={pageviewDelta}
              title="Aufrufe gegenüber gestern bis zur selben Stunde"
            />
          )
        }
        note={
          traffic &&
          `${formatCount(traffic.totals.pageviews ?? 0)} Aufrufe · ${formatCount(traffic.totals.visits)} Besuche, UTC-Tag`
        }
        loading={!traffic}
      >
        <Sparkline
          values={traffic?.series.map((point) => point.visitors ?? point.visits) ?? []}
          color={CATEGORICAL[0]}
          className="h-9 w-full"
        />
      </StatCard>

      <StatCard
        href="/admin/traffic/live"
        icon={Radio}
        label="Gerade auf park.fan"
        tone={traffic && traffic.realtime.activeVisitors > 0 ? 'live' : 'neutral'}
        value={traffic ? formatCount(traffic.realtime.activeVisitors) : '–'}
        unit="aktiv"
        note={`${formatCount(lastHalfHour)} Aufrufe in der letzten halben Stunde`}
        loading={!traffic}
      >
        <TickStrip values={perMinute} />
      </StatCard>

      <StatCard
        href="/admin/system"
        icon={Timer}
        label="Wartezeiten"
        tone={cardTone(health, 'feeds')}
        value={fresh ? formatCount(fresh.queueRowsLastHour) : '–'}
        unit="Zeilen pro Stunde"
        note={
          fresh &&
          (fresh.queueStaleMinutes == null
            ? 'Noch keine Zeile geschrieben'
            : `Neueste vor ${durationLabel(fresh.queueStaleMinutes)}`)
        }
        loading={!system}
      >
        {fresh && (
          <Meters>
            <MeterRow
              label="Alter"
              percent={
                ((fresh.queueStaleMinutes ?? FEED_STALE_MINUTES.bad) / FEED_STALE_MINUTES.bad) * 100
              }
              tone={levelAbove(fresh.queueStaleMinutes, FEED_STALE_MINUTES)}
              reading={
                fresh.queueStaleMinutes == null ? '–' : durationLabel(fresh.queueStaleMinutes)
              }
            />
            <MeterRow
              label="Wetter"
              // The table holds about 16 days ahead, so a full bar is a full forecast.
              percent={((weatherDays ?? 0) / 16) * 100}
              tone={levelBelow(weatherDays, WEATHER_DAYS_AHEAD)}
              reading={weatherDays == null ? '–' : `${formatCount(weatherDays)} Tage`}
            />
          </Meters>
        )}
      </StatCard>

      <StatCard
        href="/admin/system"
        icon={Server}
        label="Server"
        tone={cardTone(health, 'server')}
        value={host?.cpu.loadPct == null ? '–' : formatCount(host.cpu.loadPct)}
        unit="% Last"
        note={
          host &&
          [
            `${formatCount(host.cpu.cores)} Kerne`,
            host.cpu.temperatureC == null ? null : `${formatCount(host.cpu.temperatureC)} °C`,
            `läuft seit ${formatUptime(host.uptimeHours)}`,
          ]
            .filter(Boolean)
            .join(' · ')
        }
        loading={!system}
      >
        {host && (
          <Meters>
            <MeterRow
              label="CPU"
              percent={host.cpu.loadPct ?? 0}
              tone={levelAbove(host.cpu.loadPct, CPU_LOAD_PCT)}
              reading={`${formatCount(host.cpu.loadPct ?? 0)} %`}
            />
            <MeterRow
              label="RAM"
              percent={host.memory.usedPct}
              tone={levelAbove(host.memory.usedPct, STORAGE_PCT)}
              reading={`${formatCount(Math.round(host.memory.usedPct))} %`}
            />
            {'usedPct' in host.disk && (
              <MeterRow
                label="Disk"
                percent={host.disk.usedPct}
                tone={levelAbove(host.disk.usedPct, STORAGE_PCT)}
                reading={`${formatCount(Math.round(host.disk.usedPct))} %`}
              />
            )}
          </Meters>
        )}
      </StatCard>

      <StatCard
        href="/admin/system"
        icon={Database}
        label="Datenbank"
        value={system ? oneDecimal.format(system.postgres.dbSizeGB) : '–'}
        unit="GB"
        note={
          system &&
          [
            system.postgres.cacheHitPct == null
              ? null
              : `Cache ${oneDecimal.format(system.postgres.cacheHitPct)} %`,
            `${formatCount(system.redis.keys)} Redis-Schlüssel`,
          ]
            .filter(Boolean)
            .join(' · ')
        }
        loading={!system}
      >
        {system && (
          <Meters>
            <MeterRow
              label="Verb."
              percent={system.postgres.connectionsPct ?? 0}
              tone={levelAbove(system.postgres.connectionsPct, CONNECTIONS_PCT)}
              reading={`${formatCount(system.postgres.connections)}/${formatCount(system.postgres.maxConnections)}`}
            />
            {system.redis.maxMemoryMB != null && (
              <MeterRow
                label="Redis"
                percent={(system.redis.usedMemoryMB / system.redis.maxMemoryMB) * 100}
                tone={levelAbove(
                  (system.redis.usedMemoryMB / system.redis.maxMemoryMB) * 100,
                  STORAGE_PCT
                )}
                reading={`${oneDecimal.format(system.redis.usedMemoryMB / 1024)} GB`}
              />
            )}
          </Meters>
        )}
      </StatCard>

      <StatCard
        href="/admin/queues"
        icon={ListChecks}
        label="Queues"
        tone={cardTone(health, 'queues')}
        value={queues ? formatCount(queues.queues.length) : '–'}
        unit="Queues"
        note={
          queues &&
          `${failures === 0 ? 'Keine offenen Fehler' : `${formatCount(failures)} offene Fehler`} · ${formatCount(
            queues.queues.reduce((sum, q) => sum + q.delayed, 0)
          )} geplant`
        }
        loading={!queues}
      >
        {queues && (
          <SegmentBar
            segments={queues.queues.map((queue) => {
              const open = openFailures(queue);
              return {
                key: queue.name,
                tone: open > 0 ? 'bad' : 'ok',
                title: open > 0 ? `${queue.name}: ${formatCount(open)} fehlgeschlagen` : queue.name,
              };
            })}
          />
        )}
      </StatCard>

      <StatCard
        href="/admin/ml"
        icon={Brain}
        label="Modelle"
        tone={cardTone(health, 'models')}
        value={ml ? formatCount(runningModels.length) : '–'}
        unit={ml && `von ${formatCount(ml.components.length)} laufen`}
        note={
          ml &&
          `${formatCount(servedModels.length)} in der App · Vergleich: ${formatCount(ml.matrixSummary.better)} besser, ${formatCount(ml.matrixSummary.worse)} schlechter`
        }
        loading={!ml}
      >
        {ml && (
          <SegmentBar
            segments={ml.components.map((component) => ({
              key: component.id,
              tone: componentTone(component.status),
              title: `${component.name}: ${component.status}`,
            }))}
          />
        )}
      </StatCard>

      {canModerate && (
        <StatCard
          href="/admin/contributions"
          icon={ImageIcon}
          label="Einsendungen"
          tone={pending.length > 0 ? 'warn' : 'neutral'}
          value={formatCount(pending.length)}
          unit={pending.length === 1 ? 'wartet' : 'warten'}
          note={
            pending.length === 0
              ? 'Alles moderiert'
              : `${formatCount(pendingPhotos)} ${pendingPhotos === 1 ? 'Foto' : 'Fotos'} von ${pending
                  .slice(0, 2)
                  .map((s) => s.name)
                  .join(', ')}${pending.length > 2 ? ' und weiteren' : ''}`
          }
          loading={!contributions}
        >
          {pending.length > 0 && (
            <SegmentBar
              segments={pending.map((submission) => ({
                key: submission.id,
                tone: 'warn',
                title: `${submission.name}: ${formatCount(submission.photos)} Fotos`,
              }))}
            />
          )}
        </StatCard>
      )}
    </div>
  );
}

/**
 * The catalogue's state: the editors' own work of the last 30 days, and what share of parks and
 * rides somebody has corrected, given a ride profile or a season.
 */
export function CatalogFigures({ overview }: { overview: AdminOverview | undefined }) {
  const now = useMinuteNow();
  const loading = !overview;
  const parks = overview?.parks;
  const rides = overview?.attractions;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        href="/admin/history"
        icon={History}
        label="Kuratierungen"
        value={overview ? formatCount(overview.curations.last30Days) : '–'}
        unit="in 30 Tagen"
        note="Korrekturen, Saisons und ausgelöste Jobs"
        loading={loading}
      >
        {overview && now !== null && (
          <Sparkline
            values={dailyBuckets(overview.curations.perDay, 30, now)}
            className="h-9 w-full"
          />
        )}
      </StatCard>

      <StatCard
        href="/admin/parks?curated=none"
        icon={MapPin}
        label="Parks kuratiert"
        value={parks ? formatCount(parks.curated) : '–'}
        unit={parks && `von ${formatCount(parks.total)}`}
        note={parks && `${formatCount(parks.total - parks.curated)} hat noch niemand angefasst`}
        loading={loading}
      >
        {parks && <ShareTrack value={parks.curated} of={parks.total} />}
      </StatCard>

      <StatCard
        href="/admin/parks"
        icon={Sparkles}
        label="Ride-Profile"
        value={rides ? formatCount(rides.withRideProfile) : '–'}
        unit={rides && `von ${formatCount(rides.total)} Bahnen`}
        note={
          rides &&
          (rides.seasonalWithoutMonths > 0
            ? `${formatCount(rides.seasonalWithoutMonths)} saisonal markiert, ohne Monate`
            : `${formatCount(rides.curated)} Bahnen mit kuratiertem Feld`)
        }
        tone={rides && rides.seasonalWithoutMonths > 0 ? 'warn' : 'neutral'}
        loading={loading}
      >
        {rides && <ShareTrack value={rides.withRideProfile} of={rides.total} tone="good" />}
      </StatCard>

      <StatCard
        href="/admin/seasons"
        icon={CalendarRange}
        label="Saisons"
        value={overview ? formatCount(overview.seasons.running) : '–'}
        unit="laufen heute"
        note={
          overview &&
          `${formatCount(overview.seasons.upcoming)} kommen · ${formatCount(overview.parks.withSeasons)} von ${formatCount(overview.parks.total)} Parks erfasst`
        }
        loading={loading}
      >
        {parks && <ShareTrack value={parks.withSeasons} of={parks.total} tone="warn" />}
      </StatCard>
    </div>
  );
}
