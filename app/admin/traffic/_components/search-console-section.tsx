'use client';

import { useState } from 'react';
import { ExternalLink, Loader2, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  IMPORT_WAIT_MS,
  NO_COMPARISON,
  SEARCH_CONSOLE_IMPORT_PATH,
  SEARCH_CONSOLE_METRICS,
  SEARCH_CONSOLE_SETUP_DOC,
  coverageNote,
  defaultSearchConsoleInterval,
  formatSearchConsole,
  importFinished,
  plotSearchConsole,
  searchConsoleChip,
  searchConsoleFigure,
  searchConsoleInterval,
  searchConsoleIntervals,
  searchConsoleState,
  seriesPartial,
} from '@/lib/admin/search-console';
import { formatCount } from '@/lib/admin/site-analytics';
import { INTERVAL_LABEL, formatRangeSpan } from '@/lib/admin/traffic-range';
import type {
  SearchConsolePagesResponse,
  SearchConsoleSeriesResponse,
  SearchConsoleStatus,
} from '@/lib/api/admin-search-console';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { useCan } from '../../_app/session';
import { AdminApiError, adminFetch } from '../../_lib/api';
import { formatAgo } from '../../_lib/format';
import { CATEGORICAL, DeltaChip, SeriesChart } from '../../_ui/charts';
import { Segmented } from '../../_ui/controls';
import {
  Chip,
  ErrorState,
  Notice,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonRows,
  Tile,
} from '../../_ui/primitives';
import { useToast } from '../../_ui/toast';
import {
  useSearchConsoleData,
  useSearchConsoleStatus,
  type ImportWait,
} from '../_lib/use-search-console';
import type { TrafficFilterActions, TrafficFilters } from '../_lib/use-traffic';
import { SearchConsolePagesPanel, SearchConsoleQueriesPanel } from './search-console-tables';

const TITLE = 'Google Search Console';
const HINT =
  'Was Google über park.fan meldet: wie oft die Seiten in der Suche erscheinen, wie oft jemand klickt und auf welchem Platz.';

/**
 * What the section says while the import is off: where the credentials come from and what is
 * missing. `lastError` says why when the variables are set but the key or the property is unusable.
 */
function SetupHint({ lastError }: { lastError: string | null }) {
  return (
    <Panel>
      <PanelHeader icon={Search} title={TITLE} hint={HINT} />
      <PanelBody className="space-y-3 text-sm">
        {lastError ? (
          <>
            <p className="text-muted-foreground max-w-prose">
              Der Import bleibt aus, obwohl{' '}
              <code className="font-mono text-xs">GSC_SERVICE_ACCOUNT_JSON</code> und{' '}
              <code className="font-mono text-xs">GSC_SITE_URL</code> gesetzt sind. Die API sagt
              warum:
            </p>
            <Notice>
              <span className="break-words">{lastError}</span>
            </Notice>
          </>
        ) : (
          <p className="text-muted-foreground max-w-prose">
            Der Import ist noch nicht eingerichtet. Er liest die Search Console mit einem
            Google-Dienstkonto, das in der Property als Nutzer eingetragen ist. Auf der API fehlen
            dafür <code className="font-mono text-xs">GSC_SERVICE_ACCOUNT_JSON</code> und{' '}
            <code className="font-mono text-xs">GSC_SITE_URL</code>.
          </p>
        )}
        <a
          href={SEARCH_CONSOLE_SETUP_DOC}
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary inline-flex items-center gap-1 text-xs underline underline-offset-2 max-sm:min-h-9 max-sm:items-center"
        >
          Die Schritte der Einrichtung <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </PanelBody>
    </Panel>
  );
}

/** The status line: whether it is connected, when it last ran, what is stored, and what failed. */
function StatusLine({ status }: { status: SearchConsoleStatus }) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        <Chip tone="success">Verbunden</Chip>
        {status.siteUrl && <code className="font-mono">{status.siteUrl}</code>}
        <span title={status.lastImportAt ?? undefined}>
          {status.lastImportAt
            ? `Letzter Import ${formatAgo(status.lastImportAt)}`
            : 'Noch kein Import'}
        </span>
        {status.coverage && (
          <span className="tabular-nums">
            Daten vom {formatRangeSpan(status.coverage)} · {formatCount(status.rows)} Zeilen
          </span>
        )}
      </p>
      {status.lastError && (
        <Notice>
          <span className="font-medium">Der letzte Import ist fehlgeschlagen.</span>{' '}
          <span className="break-words">{status.lastError}</span>
        </Notice>
      )}
    </div>
  );
}

/** The four headline figures of the window, each with its change against the window before. */
function TotalsTiles({ data }: { data: SearchConsolePagesResponse }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {SEARCH_CONSOLE_METRICS.map((metric) => {
        const value = searchConsoleFigure(data.totals, metric.key);
        const chip = searchConsoleChip(metric.key, data.totals, data.previous);
        return (
          <Tile key={metric.key} className="space-y-1.5">
            <p
              className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase"
              title={metric.hint}
            >
              {metric.label}
            </p>
            <span className="block text-3xl font-bold tabular-nums">
              {formatSearchConsole(metric.key, value)}
            </span>
            {value === null ? (
              <p className="text-muted-foreground text-xs">Keine Impressionen</p>
            ) : data.previous === null ? (
              <p className="text-muted-foreground text-xs" title={NO_COMPARISON}>
                Kein Vergleich
              </p>
            ) : chip ? (
              <DeltaChip
                delta={chip.delta}
                label={chip.label}
                title={chip.title}
                lowerIsBetter={metric.lowerIsBetter}
              />
            ) : (
              <p className="text-muted-foreground text-xs">Davor nicht gemessen</p>
            )}
          </Tile>
        );
      })}
    </div>
  );
}

/**
 * The four figures over time, each on a chart of its own: clicks and impressions differ by a factor
 * of thirty and more, a click rate is a share and a position counts places, so one axis would flatten
 * all but one of them.
 */
function SeriesCharts({
  filters,
  coverageTo,
  version,
}: {
  filters: TrafficFilters & TrafficFilterActions;
  coverageTo: string | null;
  version: string | null;
}) {
  const interval = searchConsoleInterval(filters.activeInterval);
  const steps = searchConsoleIntervals(filters.window.days);
  const { data, error, refetch } = useSearchConsoleData<SearchConsoleSeriesResponse>(
    'series',
    { range: filters.range, locale: filters.locale, interval },
    undefined,
    version
  );

  if (!data) {
    return error ? (
      <ErrorState message={`Verlauf: ${error.message}`} onRetry={() => void refetch()} />
    ) : (
      <SkeletonRows rows={4} />
    );
  }

  const days = data.series.map((point) => point.day);
  const partial = seriesPartial(data.series, data.interval, data, coverageTo);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wide uppercase">Verlauf</h3>
        {steps.length > 1 && (
          <Segmented
            label="Schritt der Kurven"
            value={interval}
            onChange={(step) =>
              filters.setInterval(
                step === defaultSearchConsoleInterval(filters.window.days) ? null : step
              )
            }
            options={steps.map((step) => ({ value: step, label: INTERVAL_LABEL[step] }))}
          />
        )}
      </div>
      {data.series.length < 2 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          Im Zeitraum liegen zu wenige Werte für eine Kurve. Ein längerer Zeitraum oder ein feinerer
          Schritt zeigt mehr.
        </p>
      ) : (
        <div className="grid gap-x-6 gap-y-4 md:grid-cols-2 [&>*]:min-w-0">
          {SEARCH_CONSOLE_METRICS.map((metric) => (
            <div key={metric.key}>
              <p
                className="text-muted-foreground mb-1 flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase"
                title={metric.hint}
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full"
                  style={{ background: CATEGORICAL[metric.slot] }}
                />
                {metric.label}
                {metric.lowerIsBetter && (
                  <span className="tracking-normal normal-case">(kleiner ist besser)</span>
                )}
              </p>
              <SeriesChart
                chrome={false}
                gutter={56}
                unit={metric.unit}
                interval={data.interval}
                height={150}
                days={days}
                partial={partial}
                label={`${metric.label} je Zeitraum, ${data.from} bis ${data.to}`}
                series={[
                  {
                    key: metric.key,
                    label: metric.label,
                    color: CATEGORICAL[metric.slot],
                    values: data.series.map((point) => plotSearchConsole(point, metric.key)),
                  },
                ]}
              />
            </div>
          ))}
        </div>
      )}
      {partial.some(Boolean) && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <span
            aria-hidden="true"
            className="bg-muted-foreground/15 inline-block h-3 w-5 rounded-sm"
          />
          Schattiert: der Zeitraum ist nur zum Teil im Fenster oder noch nicht ganz von Google
          gemeldet und nicht mit einem ganzen vergleichbar.
        </p>
      )}
    </div>
  );
}

/**
 * The status of the import, the window's figures against the window before and the four series.
 * Before anything is stored it says so instead of drawing zeros.
 */
function Overview({
  filters,
  status,
  running,
  starting,
  onImport,
  canImport,
}: {
  filters: TrafficFilters & TrafficFilterActions;
  status: SearchConsoleStatus;
  running: boolean;
  starting: boolean;
  onImport: () => void;
  canImport: boolean;
}) {
  const ready = searchConsoleState(status) === 'ready';
  // The pages read counts everything Google reported; the queries read leaves out the queries Google
  // anonymises, so its totals would sit below the charts.
  const totals = useSearchConsoleData<SearchConsolePagesResponse>(
    'pages',
    { range: filters.range, locale: filters.locale },
    { limit: 1 },
    status.lastImportAt
  );
  const gap = coverageNote(filters.window, status.coverage);
  const busy = running || starting;

  return (
    <Panel>
      <PanelHeader
        icon={Search}
        title={TITLE}
        hint={HINT}
        action={
          canImport && (
            <Button
              size="sm"
              variant="outline"
              onClick={onImport}
              disabled={busy}
              aria-label={running ? 'Import läuft' : 'Jetzt importieren'}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="max-sm:sr-only">
                {running ? 'Import läuft' : 'Jetzt importieren'}
              </span>
            </Button>
          )
        }
      />
      <PanelBody className="space-y-4">
        <StatusLine status={status} />
        {!ready ? (
          <p className="text-muted-foreground max-w-prose text-sm">
            Noch ist nichts gespeichert. Der erste Import holt die letzten 16 Monate und braucht
            einige Minuten.
          </p>
        ) : (
          <>
            {gap && <p className="text-muted-foreground text-xs">{gap}</p>}
            {filters.filters.length > 0 && (
              <p className="text-muted-foreground text-xs">
                Die Filter oben gelten für den eigenen Zähler. Die Zahlen von Google folgen nur dem
                Zeitraum und der Sprache.
              </p>
            )}
            {totals.data ? (
              <TotalsTiles data={totals.data} />
            ) : totals.error ? (
              <ErrorState
                message={`Search Console: ${totals.error.message}`}
                onRetry={() => void totals.refetch()}
              />
            ) : (
              <SkeletonRows rows={2} />
            )}
            <SeriesCharts
              filters={filters}
              coverageTo={status.coverage?.to ?? null}
              version={status.lastImportAt}
            />
          </>
        )}
      </PanelBody>
    </Panel>
  );
}

/**
 * The Search Console section of the SEO page: the status of the import with a button for an editor
 * to run it now, the window's figures, their course, and the queries and pages behind them. A row
 * of either table narrows the other one, and both are in the address. Without credentials the
 * section is one hint that says what is missing.
 */
export function SearchConsoleSection({
  filters,
}: {
  filters: TrafficFilters & TrafficFilterActions;
}) {
  const toast = useToast();
  const canImport = useCan('editor');
  const [wait, setWait] = useState<ImportWait | null>(null);
  const [starting, setStarting] = useState(false);
  const status = useSearchConsoleStatus(wait);
  const now = useMinuteNow(wait !== null);

  if (!status.data) {
    return (
      <Panel>
        <PanelHeader icon={Search} title={TITLE} hint={HINT} />
        {status.error ? (
          <ErrorState
            message={`Search Console: ${status.error.message}`}
            onRetry={() => void status.refetch()}
          />
        ) : (
          <SkeletonRows rows={4} />
        )}
      </Panel>
    );
  }

  const current = status.data;
  if (searchConsoleState(current) === 'off') return <SetupHint lastError={current.lastError} />;

  // Until the status changes: the API reports no "running" flag, a new last import or error is the end.
  const running =
    wait !== null && now !== null && now < wait.until && !importFinished(wait.mark, current);

  async function requestImport() {
    setStarting(true);
    try {
      await adminFetch(SEARCH_CONSOLE_IMPORT_PATH, { method: 'POST' });
      setWait({
        mark: { lastImportAt: current.lastImportAt, lastError: current.lastError },
        until: Date.now() + IMPORT_WAIT_MS,
      });
      toast.push({
        title: 'Import angestoßen',
        description: 'Die Zahlen erscheinen, sobald der Import durch ist.',
        tone: 'success',
      });
    } catch (err) {
      // 409: the API says the module is off, so the status the page holds is out of date.
      const off = err instanceof AdminApiError && err.status === 409;
      if (off) void status.refetch();
      toast.push({
        title: 'Import nicht gestartet',
        description: off
          ? 'Die Search Console ist auf der API nicht eingerichtet.'
          : err instanceof Error
            ? err.message
            : undefined,
        tone: 'error',
      });
    } finally {
      setStarting(false);
    }
  }

  const ready = searchConsoleState(current) === 'ready';
  return (
    <>
      <Overview
        filters={filters}
        status={current}
        running={running}
        starting={starting}
        canImport={canImport}
        onImport={() => void requestImport()}
      />
      {ready && (
        <>
          <SearchConsoleQueriesPanel filters={filters} version={current.lastImportAt} />
          <SearchConsolePagesPanel filters={filters} version={current.lastImportAt} />
        </>
      )}
    </>
  );
}
