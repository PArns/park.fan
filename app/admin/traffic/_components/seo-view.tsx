'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  Copy,
  ExternalLink,
  FileQuestion,
  MapPinOff,
  Pencil,
  Radar,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  breakdownValueLabel,
  deltaOf,
  formatChange,
  formatCount,
  formatShare,
  pageTypeLabel,
  pathEditorHref,
  trafficQuery,
  TRAFFIC_RANGES,
} from '@/lib/admin/site-analytics';
import type {
  SeoLandingPage,
  SeoLandingPagesResponse,
  SeoNotFoundResponse,
  SeoTrendPage,
  SeoTrendsResponse,
  SeoUncoveredResponse,
} from '@/lib/api/admin-site-analytics';
import { DeltaChip } from '../../_ui/charts';
import { Segmented } from '../../_ui/controls';
import {
  AdminPage,
  Chip,
  EmptyState,
  ErrorState,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonRows,
} from '../../_ui/primitives';
import { useToast } from '../../_ui/toast';
import { useTrafficData, useTrafficFilters, type TrafficFilters } from '../_lib/use-traffic';
import { TrafficFilterBar } from './filter-bar';

/** Rows shown before the rest waits behind a button. */
const SHOWN = 12;

/** The two links every page row carries: the public page, and for a park or ride its editor. */
function PageLinks({ path }: { path: string }) {
  const editor = pathEditorHref(path);
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <a
        href={path}
        target="_blank"
        rel="noreferrer noopener"
        title="Auf park.fan öffnen"
        aria-label="Auf park.fan öffnen"
        className="text-muted-foreground hover:text-primary flex h-6 w-6 items-center justify-center rounded"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
      {editor && (
        <Link
          href={editor}
          title="Im Editor öffnen"
          aria-label="Im Editor öffnen"
          className="text-muted-foreground hover:text-primary flex h-6 w-6 items-center justify-center rounded"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      )}
    </span>
  );
}

/** A path that is cut at its start when it is long, so the end that names the page stays. */
function PathText({ path }: { path: string }) {
  return (
    <bdi className="block truncate text-left [direction:rtl]">
      {/* A left-to-right mark, or the leading slash jumps to the end. */}
      {'‎'}
      {path}
    </bdi>
  );
}

/** A show-more switch for a list that is longer than {@link SHOWN}. */
function MoreButton({
  total,
  open,
  onToggle,
}: {
  total: number;
  open: boolean;
  onToggle: () => void;
}) {
  if (total <= SHOWN) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-primary border-border/50 w-full border-t px-4 py-2.5 text-left text-xs hover:underline max-sm:min-h-11"
    >
      {open ? 'weniger zeigen' : `${total - SHOWN} weitere zeigen`}
    </button>
  );
}

/**
 * The pages visits began on for one channel, with the visits against the window before, the
 * bounce rate and which engines or assistants sent them. Search engines and AI assistants are the
 * same table with another channel, because the question is the same: which pages do they find.
 */
function LandingPagesPanel({
  channel,
  title,
  hint,
  icon,
  filters,
}: {
  channel: 'search' | 'ai';
  title: string;
  hint: string;
  icon: typeof Radar;
  filters: TrafficFilters;
}) {
  const [open, setOpen] = useState(false);
  const { data, error, refetch } = useTrafficData<SeoLandingPagesResponse>(
    'seo/landing-pages',
    filters,
    { channel, limit: 50 }
  );
  const rows: SeoLandingPage[] = data?.items ?? [];
  const shown = open ? rows : rows.slice(0, SHOWN);

  return (
    <Panel>
      <PanelHeader icon={icon} title={title} hint={hint} />
      {!data && error ? (
        <ErrorState message={`${title}: ${error.message}`} onRetry={() => void refetch()} />
      ) : !data ? (
        <SkeletonRows rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={icon}
          title="Noch keine Besuche"
          description="Aus diesem Kanal ist im Zeitraum niemand eingestiegen. Mit einem längeren Zeitraum oder weniger Filtern zeigt sich mehr."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm tabular-nums">
              <thead className="text-muted-foreground text-[11px] tracking-wide uppercase">
                <tr className="border-border/50 border-b">
                  <th className="py-2 pl-4 text-left font-medium">Seite</th>
                  <th className="px-3 py-2 text-right font-medium">Besuche</th>
                  <th className="px-3 py-2 text-right font-medium">Veränderung</th>
                  <th className="px-3 py-2 text-right font-medium">Absprung</th>
                  <th className="py-2 pr-4 pl-3 text-left font-medium">Quellen</th>
                </tr>
              </thead>
              <tbody className="divide-border/40 divide-y">
                {shown.map((row) => (
                  <tr key={row.path}>
                    <td className="max-w-[22rem] py-2 pl-4">
                      <span className="flex items-center gap-2">
                        <span className="min-w-0 flex-1">
                          <PathText path={row.path} />
                          <span className="text-muted-foreground block text-xs">
                            {pageTypeLabel(row.pageType)}
                          </span>
                        </span>
                        <PageLinks path={row.path} />
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {formatCount(row.visits)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="inline-flex items-center justify-end gap-2">
                        <span className="text-muted-foreground text-xs">
                          {formatChange(row.change)}
                        </span>
                        <DeltaChip
                          delta={deltaOf(row.visits, row.previous)}
                          title={`Davor: ${formatCount(row.previous)}`}
                        />
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">{formatShare(row.bounceRate)}</td>
                    <td className="text-muted-foreground py-2 pr-4 pl-3 text-xs">
                      {row.sources
                        .slice(0, 3)
                        .map((source) => `${source.value} ${formatCount(source.visits)}`)
                        .join(' · ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <MoreButton total={rows.length} open={open} onToggle={() => setOpen((value) => !value)} />
        </>
      )}
    </Panel>
  );
}

/** A list of pages whose visits moved most, with how much. */
function TrendList({
  title,
  hint,
  icon: Icon,
  rows,
  tone,
}: {
  title: string;
  hint: string;
  icon: typeof TrendingUp;
  rows: SeoTrendPage[];
  tone: 'up' | 'down';
}) {
  return (
    <Panel>
      <PanelHeader icon={Icon} title={title} hint={hint} />
      {rows.length === 0 ? (
        <PanelBody>
          <p className="text-muted-foreground py-4 text-center text-sm">
            Nichts, das über das Rauschen hinausgeht.
          </p>
        </PanelBody>
      ) : (
        <ul className="divide-border/40 divide-y">
          {rows.map((row) => (
            <li key={row.path} className="flex items-center gap-3 px-4 py-2 text-sm tabular-nums">
              <span className="min-w-0 flex-1">
                <PathText path={row.path} />
              </span>
              <PageLinks path={row.path} />
              <span className="text-muted-foreground w-24 shrink-0 text-right text-xs">
                {formatCount(row.previous)} → {formatCount(row.visits)}
              </span>
              <span
                className={`w-14 shrink-0 text-right font-semibold ${tone === 'up' ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {formatChange(row.change)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** Rising and falling pages side by side. */
function TrendsPanels({ filters }: { filters: TrafficFilters }) {
  const { data, error, refetch } = useTrafficData<SeoTrendsResponse>('seo/trends', filters, {
    channel: 'search',
  });
  if (!data) {
    return error ? (
      <Panel>
        <ErrorState message={`Verläufe: ${error.message}`} onRetry={() => void refetch()} />
      </Panel>
    ) : (
      <Panel>
        <SkeletonRows rows={5} />
      </Panel>
    );
  }
  return (
    <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
      <TrendList
        title="Steigende Seiten"
        hint="Mehr Besuche aus der Suche als im Zeitraum davor"
        icon={TrendingUp}
        rows={data.rising}
        tone="up"
      />
      <TrendList
        title="Fallende Seiten"
        hint="Weniger Besuche aus der Suche als im Zeitraum davor"
        icon={TrendingDown}
        rows={data.falling}
        tone="down"
      />
    </div>
  );
}

/**
 * Addresses people asked for that do not exist, with the pages and sites that sent them: a dead
 * link is fixed at its source or answered with a redirect. A path can be copied, and every row opens
 * the address itself, to see what a visitor sees.
 */
function NotFoundPanel({ filters }: { filters: TrafficFilters }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const { data, error, refetch } = useTrafficData<SeoNotFoundResponse>('seo/not-found', filters);
  const rows = data?.items ?? [];
  const shown = open ? rows : rows.slice(0, SHOWN);

  const copy = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      toast.push({ title: 'Pfad kopiert', description: path, tone: 'success' });
    } catch {
      toast.push({ title: 'Kopieren ging nicht', description: path, tone: 'error' });
    }
  };

  return (
    <Panel>
      <PanelHeader
        icon={FileQuestion}
        title="Nicht gefunden (404)"
        hint="Adressen, die es nicht gibt, und woher die Besuche kamen. Ein Link, der falsch ist, wird an der Quelle korrigiert, sonst bekommt die Adresse eine Weiterleitung."
      />
      {!data && error ? (
        <ErrorState message={`404: ${error.message}`} onRetry={() => void refetch()} />
      ) : !data ? (
        <SkeletonRows rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="Keine 404-Aufrufe"
          description="Im Zeitraum hat niemand eine Adresse aufgerufen, die es nicht gibt."
        />
      ) : (
        <>
          <ul className="divide-border/40 divide-y">
            {shown.map((row) => (
              <li key={row.path} className="space-y-1 px-4 py-2.5 text-sm">
                <div className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 font-mono text-xs">
                    <PathText path={row.path} />
                  </span>
                  <button
                    type="button"
                    onClick={() => void copy(row.path)}
                    title="Pfad kopieren"
                    aria-label="Pfad kopieren"
                    className="text-muted-foreground hover:text-primary flex h-6 w-6 items-center justify-center rounded"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <a
                    href={row.path}
                    target="_blank"
                    rel="noreferrer noopener"
                    title="Adresse öffnen"
                    aria-label="Adresse öffnen"
                    className="text-muted-foreground hover:text-primary flex h-6 w-6 items-center justify-center rounded"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <span className="w-12 shrink-0 text-right font-semibold tabular-nums">
                    {formatCount(row.views)}
                  </span>
                </div>
                {row.referrers.length > 0 && (
                  <p className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    <span>Von:</span>
                    {row.referrers.slice(0, 4).map((referrer) => (
                      <span key={referrer.value} className="tabular-nums">
                        {referrer.value} {formatCount(referrer.views)}
                      </span>
                    ))}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <MoreButton total={rows.length} open={open} onToggle={() => setOpen((value) => !value)} />
        </>
      )}
    </Panel>
  );
}

/**
 * Parks and rides that no search visit reached in the window: a page nobody finds is the first
 * candidate for a better text, a link from a guide or a look at its title.
 */
function UncoveredPanel({ filters }: { filters: TrafficFilters }) {
  const [kind, setKind] = useState<'park' | 'attraction'>('park');
  const [open, setOpen] = useState(false);
  const { data, error, refetch } = useTrafficData<SeoUncoveredResponse>('seo/uncovered', filters, {
    kind,
  });
  const rows = data?.items ?? [];
  const shown = open ? rows : rows.slice(0, SHOWN);

  return (
    <Panel>
      <PanelHeader
        icon={MapPinOff}
        title="Ohne Besuch aus der Suche"
        hint="Seiten, auf die in diesem Zeitraum kein einziger Besuch aus einer Suchmaschine kam."
        action={
          <Segmented
            label="Art"
            value={kind}
            onChange={(value) => {
              setKind(value);
              setOpen(false);
            }}
            options={[
              { value: 'park', label: 'Parks' },
              { value: 'attraction', label: 'Fahrgeschäfte' },
            ]}
          />
        }
      />
      {!data && error ? (
        <ErrorState message={`Ohne Suchbesuch: ${error.message}`} onRetry={() => void refetch()} />
      ) : !data ? (
        <SkeletonRows rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={MapPinOff}
          title="Alle haben Besuch"
          description="Jede Seite dieser Art hatte im Zeitraum mindestens einen Besuch aus der Suche."
        />
      ) : (
        <>
          <ul className="divide-border/40 divide-y">
            {shown.map((row) => (
              <li key={row.url} className="flex items-center gap-3 px-4 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-medium">{row.name}</span>
                <Chip tone="muted">{kind === 'park' ? 'Park' : 'Fahrgeschäft'}</Chip>
                <a
                  href={`/de${row.url}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  title="Auf park.fan öffnen"
                  aria-label={`${row.name} auf park.fan öffnen`}
                  className="text-muted-foreground hover:text-primary flex h-6 w-6 items-center justify-center rounded"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <Link
                  href={`/admin/go?path=${encodeURIComponent(`/de${row.url}`)}`}
                  className="text-muted-foreground hover:text-primary hidden shrink-0 text-xs sm:block"
                >
                  Editor
                </Link>
              </li>
            ))}
          </ul>
          <MoreButton total={rows.length} open={open} onToggle={() => setOpen((value) => !value)} />
        </>
      )}
    </Panel>
  );
}

/**
 * `/admin/traffic/seo`: what search engines and AI assistants send, from the site's own counter.
 * Which pages they land on and how that changed, which pages rise and fall, which addresses are
 * dead, and which parks and rides nobody finds. Every row opens the page on park.fan, and a park or
 * ride its editor. The window, language and filters are in the address, as on the Traffic page.
 */
export function SeoView() {
  const filters = useTrafficFilters();
  const windowLabel = TRAFFIC_RANGES.find((range) => range.days === filters.days)?.label;

  return (
    <AdminPage width="wide">
      <Panel>
        <PanelHeader
          icon={Radar}
          title="SEO"
          hint="Besuche aus Suchmaschinen und KI-Assistenten: wohin sie führen, was steigt, was fällt, was ins Leere läuft. Der Kanal kommt aus der Herkunft des ersten Aufrufs."
          action={
            <Link
              href={`/admin/traffic?${trafficQuery(filters)}`}
              className="text-primary flex items-center gap-1 text-xs hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Traffic
            </Link>
          }
        />
        <div className="border-border/50 flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
          <TrafficFilterBar filters={filters} hint={false} />
          <p className="text-muted-foreground text-xs">{windowLabel}</p>
        </div>
        <p className="text-muted-foreground px-4 py-3 text-xs">
          „Veränderung“ vergleicht mit dem Zeitraum gleicher Länge davor. Besuche mit Do Not Track,
          Global Privacy Control oder Opt-out fehlen, die Zahlen sind eher zu niedrig als zu hoch.
        </p>
      </Panel>

      <LandingPagesPanel
        channel="search"
        title="Einstiegsseiten aus der Suche"
        hint="Wo Besuche aus Suchmaschinen beginnen, mit den Engines dahinter"
        icon={Radar}
        filters={filters}
      />
      <TrendsPanels filters={filters} />
      <LandingPagesPanel
        channel="ai"
        title="Einstiegsseiten aus KI-Assistenten"
        hint={`Besuche, die ${breakdownValueLabel('channel', 'ai')} schicken, etwa ChatGPT, Perplexity, Gemini oder Claude`}
        icon={Bot}
        filters={filters}
      />
      <NotFoundPanel filters={filters} />
      <UncoveredPanel filters={filters} />
    </AdminPage>
  );
}
