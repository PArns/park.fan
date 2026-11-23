'use client';

import { useState } from 'react';
import { Loader2, RotateCcw, Snowflake, ThermometerSnowflake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  filterWeatherClosureRides,
  leadingProfile,
  weatherClosureState,
  type WeatherClosureFilter,
  type WeatherClosureReport,
  type WeatherClosureRide,
  type WeatherClosureState,
} from '@/lib/admin/weather-closure';
import { cn } from '@/lib/utils';
import { useCan } from '../_app/session';
import { adminFetch, useAdminQuery, useInvalidateAdmin } from '../_lib/api';
import { formatAgo } from '../_lib/format';
import { Segmented, TextInput } from '../_ui/controls';
import {
  AdminPage,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  PanelBody,
  PanelHeader,
  StatTile,
  Toolbar,
} from '../_ui/primitives';
import { PublicLink } from '../_ui/row-links';
import { useToast } from '../_ui/toast';

const KEY = ['admin', 'weather-closure'] as const;
const PATH = '/api/admin/weather-closure?minProbability=0.5';

const FILTERS: readonly { value: WeatherClosureFilter; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'shown', label: 'Auf der Seite' },
  { value: 'near', label: 'Knapp darunter' },
  { value: 'cold', label: 'Kälte' },
  { value: 'snow', label: 'Schnee' },
];

const STATE_BAR: Record<WeatherClosureState, string> = {
  shown: 'bg-emerald-500',
  near: 'bg-amber-500',
  below: 'bg-slate-500',
};

const STATE_TEXT: Record<WeatherClosureState, string> = {
  shown: 'text-emerald-400',
  near: 'text-amber-400',
  below: 'text-muted-foreground',
};

const percent = (share: number) => `${Math.round(share * 100)} %`;

/** The job trigger: queues the rebuild and says when to look again. */
function RebuildButton({ label = 'Jetzt neu berechnen' }: { label?: string }) {
  const canRun = useCan('editor');
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [busy, setBusy] = useState(false);

  async function rebuild() {
    setBusy(true);
    try {
      await adminFetch('/api/admin/weather-closure/rebuild', { method: 'POST' });
      toast.push({
        title: 'Neuberechnung läuft',
        description: 'Sie dauert ein paar Minuten (alle Parks). Danach die Seite neu laden.',
        tone: 'success',
      });
      invalidate(KEY);
    } catch (err) {
      toast.push({
        title: 'Neuberechnung nicht gestartet',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  if (!canRun) return null;
  return (
    <Button size="sm" variant="outline" onClick={rebuild} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
      {label}
    </Button>
  );
}

/** The probability as a bar against the site's bar, coloured by what the site does with it. */
function ProbabilityBar({
  probability,
  bar,
  state,
}: {
  probability: number;
  bar: number;
  state: WeatherClosureState;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative h-2 w-28 shrink-0 rounded-full bg-white/[0.06]"
        role="img"
        aria-label={`${percent(probability)}, Schwelle ${percent(bar)}`}
      >
        <div
          className={cn('h-full rounded-full', STATE_BAR[state])}
          style={{ width: `${Math.min(100, probability * 100)}%` }}
        />
        <span
          className="absolute -top-1 -bottom-1 w-px bg-white/60"
          style={{ left: `${bar * 100}%` }}
          aria-hidden
        />
      </div>
      <span className={cn('text-sm font-semibold tabular-nums', STATE_TEXT[state])}>
        {percent(probability)}
      </span>
    </div>
  );
}

function RideRow({ ride, bar }: { ride: WeatherClosureRide; bar: number }) {
  const state = weatherClosureState(ride);
  const lead = leadingProfile(ride);
  const threshold = ride.cold?.thresholdC;

  return (
    <div className="grid gap-x-4 gap-y-1.5 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <p className="text-muted-foreground truncate text-xs">{ride.parkName}</p>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-medium">{ride.attractionName}</span>
          <PublicLink href={`/de/parks/${ride.parkPath}/${ride.attractionSlug}`} />
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {ride.cold && (
            <Chip tone="primary">
              <ThermometerSnowflake className="h-3 w-3" />
              Kälte
            </Chip>
          )}
          {ride.snow && (
            <Chip tone="primary">
              <Snowflake className="h-3 w-3" />
              Schnee
            </Chip>
          )}
          {state === 'shown' && <Chip tone="success">Auf der Seite</Chip>}
          {state === 'near' && <Chip tone="warning">Knapp darunter</Chip>}
        </div>
      </div>

      <div className="text-muted-foreground space-y-0.5 text-xs tabular-nums lg:order-none">
        {typeof threshold === 'number' && (
          <p>
            Fährt meist ab <span className="text-foreground font-medium">{threshold} °C</span>
          </p>
        )}
        {lead && (
          <p>
            {lead.cause === 'cold' ? 'Zu in ' : 'Nach Schneefall zu in '}
            <span className="text-foreground font-medium">{percent(lead.profile.closedShare)}</span>
            {lead.cause === 'cold' ? ' der kalten Stunden' : ' der Stunden'} (sonst{' '}
            {percent(lead.profile.baselineShare)})
          </p>
        )}
        {lead && (
          <p>
            Grundlage: {lead.profile.days} {lead.profile.days === 1 ? 'Tag' : 'Tage'},{' '}
            {lead.profile.hours} Stunden
          </p>
        )}
      </div>

      <div className="sm:col-start-2 sm:row-start-1 sm:self-center lg:col-start-3">
        <ProbabilityBar probability={ride.bestProbability} bar={bar} state={state} />
      </div>
    </div>
  );
}

/**
 * Which rides close in the cold or after snow, as the weekly job learned it, and which of them the
 * site names on the ride's status. One button runs the job again.
 */
export default function WeatherClosurePage() {
  const report = useAdminQuery<WeatherClosureReport>(KEY, PATH);
  const [filter, setFilter] = useState<WeatherClosureFilter>('all');
  const [query, setQuery] = useState('');

  const data = report.data;
  const rides = data ? filterWeatherClosureRides(data.rides, filter, query) : [];

  return (
    <AdminPage width="wide">
      <Panel>
        <PanelHeader
          icon={ThermometerSnowflake}
          title="Kälte und Schnee"
          action={data?.generatedAt ? <RebuildButton /> : undefined}
        />
        <PanelBody className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Welche Bahnen schließen bei Kälte oder Schnee? park.fan lernt das wöchentlich aus einem
            Jahr Öffnungsstunden. Auf der Seite erscheint der Hinweis nur, wenn wir zu mindestens{' '}
            {percent(data?.bar.probability ?? 0.9)} sicher sind.
          </p>
          {data?.generatedAt && (
            <p className="text-muted-foreground text-xs">
              Zuletzt berechnet {formatAgo(data.generatedAt)} (
              {new Date(data.generatedAt).toLocaleString('de-DE', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
              ).
            </p>
          )}
        </PanelBody>
      </Panel>

      {report.isError ? (
        <ErrorState
          message={report.error?.message ?? 'Laden fehlgeschlagen'}
          onRetry={() => void report.refetch()}
        />
      ) : report.isLoading || !data ? (
        <LoadingState />
      ) : data.generatedAt === null ? (
        <Panel>
          <EmptyState
            icon={Snowflake}
            title="Noch nicht berechnet"
            description="Der Job ist noch nie gelaufen. Er rechnet alle Parks durch und braucht ein paar Minuten."
            action={<RebuildButton label="Job starten" />}
          />
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile
              label="Bahnen mit Profil"
              value={data.totals.rides.toLocaleString('de-DE')}
              sub="genug kalte oder verschneite Stunden zum Lernen"
            />
            <StatTile
              label="Auf der Seite"
              value={<span className="text-emerald-400">{data.totals.publishable}</span>}
              sub={`ab ${percent(data.bar.probability)} sicher`}
            />
            <StatTile
              label="Knapp darunter"
              value={<span className="text-amber-400">{data.totals.near}</span>}
              sub={`zwischen 75 und ${percent(data.bar.probability)}`}
            />
          </div>

          <Panel>
            <PanelHeader
              icon={Snowflake}
              title="Bahnen"
              hint="Ab 50 % Wahrscheinlichkeit, die sichersten zuerst. Der Strich im Balken ist die Schwelle der Seite."
              action={<Chip>{rides.length}</Chip>}
            />
            <Toolbar>
              <Segmented label="Filter" options={FILTERS} value={filter} onChange={setFilter} />
              <TextInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Park oder Bahn suchen"
                aria-label="Park oder Bahn suchen"
                className="sm:max-w-xs"
              />
            </Toolbar>
            <PanelBody>
              {rides.length === 0 ? (
                <EmptyState
                  icon={Snowflake}
                  title="Keine Bahn"
                  description="Mit diesem Filter und dieser Suche bleibt keine Bahn übrig."
                />
              ) : (
                <div className="space-y-1.5">
                  {rides.map((ride) => (
                    <RideRow key={ride.attractionId} ride={ride} bar={data.bar.probability} />
                  ))}
                </div>
              )}
            </PanelBody>
          </Panel>
        </>
      )}
    </AdminPage>
  );
}
