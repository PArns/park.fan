'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ExternalLink, FileText, Search } from 'lucide-react';
import {
  NO_COMPARISON,
  formatSearchConsoleRow,
  googleSearchHref,
  searchConsoleRowChange,
} from '@/lib/admin/search-console';
import { formatCount, formatDuration, formatShare } from '@/lib/admin/site-analytics';
import type {
  SearchConsoleChange,
  SearchConsolePage,
  SearchConsolePagesResponse,
  SearchConsoleQueriesResponse,
  SearchConsoleQuery,
  SearchConsoleSiteFigures,
} from '@/lib/api/admin-search-console';
import { cn } from '@/lib/utils';
import {
  EmptyState,
  ErrorState,
  Panel,
  PanelHeader,
  SkeletonRows,
  StartTruncated,
} from '../../_ui/primitives';
import { TextInput } from '../../_ui/controls';
import { useSearchConsoleData, useSearchConsoleDrill } from '../_lib/use-search-console';
import type { TrafficFilterActions, TrafficFilters } from '../_lib/use-traffic';
import { FilterChip } from './filter-bar';
import { MoreButton, useShowMore, PageLinks } from './list-parts';

/** Rows asked for from the API; the list shows a dozen and the rest waits behind a button. */
const ROWS_ASKED = 50;

const TONE_CLASS = {
  good: 'text-emerald-400',
  bad: 'text-red-400',
  flat: 'text-muted-foreground',
} as const;

const NO_POSITION = 'Ohne Impressionen davor oder jetzt gibt es keine Position zum Vergleichen.';
const NEW_ROW = 'Im Zeitraum davor gab es dazu keine Zeile.';

/**
 * How a row moved against the window before: the clicks as a count, the position in places, one
 * above the other in a table cell and side by side in the list on a phone (`inline`).
 */
function RowChange({
  change,
  comparable,
  inline = false,
}: {
  change: SearchConsoleChange | null;
  comparable: boolean;
  inline?: boolean;
}) {
  const row = searchConsoleRowChange(change);
  if (!row) {
    return (
      <span className="text-muted-foreground text-xs" title={comparable ? NEW_ROW : NO_COMPARISON}>
        –
      </span>
    );
  }
  return (
    <span className={cn('text-xs leading-tight', inline ? 'flex gap-x-3' : 'block')}>
      <span className={TONE_CLASS[row.clicksTone]}>{row.clicks} Klicks</span>
      {row.position === null ? (
        <span className={cn(!inline && 'block', 'text-muted-foreground')} title={NO_POSITION}>
          –
        </span>
      ) : (
        <span className={cn(!inline && 'block', TONE_CLASS[row.positionTone])}>
          {row.position} Plätze
        </span>
      )}
    </span>
  );
}

/** A narrowing of one list by a choice in the other, as a chip that takes itself off. */
function DrillStrip({ children }: { children: ReactNode }) {
  return (
    <div className="border-border/50 flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
      {children}
    </div>
  );
}

/** The four figures of a row as one line, for the list on a phone. */
function FigureLine({ row }: { row: SearchConsoleQuery | SearchConsolePage }) {
  const figures = formatSearchConsoleRow(row);
  return (
    <span className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
      <span className="text-foreground font-semibold">{figures.clicks} Klicks</span>
      <span>{figures.impressions} Impressionen</span>
      <span>CTR {figures.ctr}</span>
      <span>Position {figures.position}</span>
    </span>
  );
}

/** What the counter saw of the visits from a search engine that began on a page, or a dash. */
function siteFigures(site: SearchConsoleSiteFigures | null) {
  return {
    visits: site ? formatCount(site.visits) : '–',
    bounce: site ? formatShare(site.bounceRate) : '–',
    duration: site ? formatDuration(site.avgVisitSeconds) : '–',
  };
}

const NO_SITE_VISITS =
  'Aus einer Suchmaschine hat im Zeitraum kein Besuch auf dieser Seite begonnen.';

/** A button that narrows the other list to this row, pressed while it is the narrowing one. */
function DrillButton({
  selected,
  title,
  onClick,
  children,
}: {
  selected: boolean;
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      title={title}
      onClick={onClick}
      className={cn(
        'hover:text-primary block w-full min-w-0 text-left max-sm:min-h-9',
        selected && 'text-primary font-semibold'
      )}
    >
      {children}
    </button>
  );
}

const HEAD = 'px-3 py-2 text-right font-medium';

/** How long typing has to pause before the list is asked for again. */
const SEARCH_PAUSE_MS = 300;

/**
 * The search field above a list: the API looks through every row of the window, not only the ones
 * on screen. Reports the text once typing pauses.
 */
function RowSearch({
  label,
  placeholder,
  onSearch,
}: {
  label: string;
  placeholder: string;
  onSearch: (text: string) => void;
}) {
  const [text, setText] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => onSearch(text.trim()), SEARCH_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [text, onSearch]);
  return (
    <div className="border-border/50 border-b px-4 py-2.5">
      <div className="relative sm:max-w-sm">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
        <TextInput
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={placeholder}
          aria-label={label}
          className="h-8 pl-8 text-xs"
        />
      </div>
    </div>
  );
}

/** Rows asked for while searching: the most the API gives, since a search is a look for one row. */
const ROWS_SEARCHED = 200;

/** The `extra` of a list read: the drill-down filter, and the search text when there is one. */
function listExtra(filter: Record<string, string>, search: string) {
  return search ? { ...filter, search, limit: ROWS_SEARCHED } : { ...filter, limit: ROWS_ASKED };
}

/**
 * The biggest search queries by clicks. A query narrows the page list to the pages Google shows for
 * it; a chosen page narrows this list to the queries that lead to that page.
 */
export function SearchConsoleQueriesPanel({
  filters,
  version,
}: {
  filters: TrafficFilters & TrafficFilterActions;
  version: string | null;
}) {
  const drill = useSearchConsoleDrill();
  const [search, setSearch] = useState('');
  const { data, error, refetch, isPlaceholderData } =
    useSearchConsoleData<SearchConsoleQueriesResponse>(
      'queries',
      filters,
      listExtra(drill.page ? { page: drill.page } : {}, search),
      version
    );
  const rows = data?.items ?? [];
  const { shown, more } = useShowMore(rows);
  const comparable = data?.previous !== null;

  return (
    <Panel id="gsc-queries">
      <PanelHeader
        icon={Search}
        title="Suchanfragen"
        hint="Wonach gesucht wurde, bevor jemand auf park.fan geklickt hat. Google nennt seltene Anfragen nicht, die Liste ergibt deshalb weniger Klicks als die Summe oben. Ein Klick auf eine Anfrage zeigt darunter die Seiten dazu."
      />
      <RowSearch
        label="Suchanfragen durchsuchen"
        placeholder="Suchanfrage enthält…"
        onSearch={setSearch}
      />
      {drill.page && (
        <DrillStrip>
          <FilterChip
            label="Seite"
            value={drill.page}
            removeLabel={`Seitenfilter entfernen: ${drill.page}`}
            onRemove={drill.clearPage}
          />
          <span className="text-muted-foreground text-xs">
            Nur Anfragen, die zu dieser Seite führten
          </span>
        </DrillStrip>
      )}
      {!data && error ? (
        <ErrorState message={`Suchanfragen: ${error.message}`} onRetry={() => void refetch()} />
      ) : !data ? (
        <SkeletonRows rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Keine Suchanfragen"
          description={
            search
              ? `Keine Anfrage im Zeitraum enthält „${search}“.`
              : drill.page
                ? 'Google hat im Zeitraum keine Anfrage gemeldet, die zu dieser Seite führte. Mit einem längeren Zeitraum oder ohne den Seitenfilter zeigt sich mehr.'
                : 'Google hat im Zeitraum keine Anfragen gemeldet. Mit einem längeren Zeitraum oder einer anderen Sprache zeigt sich mehr.'
          }
        />
      ) : (
        <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
          <ul className="divide-border/40 divide-y md:hidden">
            {shown.map((row) => {
              const selected = drill.query === row.query;
              return (
                <li
                  key={row.query}
                  className={cn(
                    'space-y-1 px-4 py-3 text-sm tabular-nums',
                    selected && 'bg-primary/10'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate font-medium">
                      <DrillButton
                        selected={selected}
                        title="Seiten zu dieser Anfrage zeigen"
                        onClick={() => drill.toggleQuery(row.query)}
                      >
                        <span className="block truncate">{row.query}</span>
                      </DrillButton>
                    </span>
                    <GoogleLink query={row.query} />
                  </span>
                  <FigureLine row={row} />
                  <RowChange change={row.change} comparable={comparable} inline />
                </li>
              );
            })}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[44rem] text-sm tabular-nums">
              <thead className="text-muted-foreground text-[11px] tracking-wide uppercase">
                <tr className="border-border/50 border-b">
                  <th className="py-2 pl-4 text-left font-medium">Suchanfrage</th>
                  <th className={HEAD}>Klicks</th>
                  <th className={HEAD}>Impressionen</th>
                  <th className={HEAD} title="Klicks geteilt durch Impressionen">
                    CTR
                  </th>
                  <th className={HEAD} title="Durchschnittliche Platzierung, 1 ist ganz oben">
                    Position
                  </th>
                  <th className="py-2 pr-4 pl-3 text-right font-medium">Veränderung</th>
                </tr>
              </thead>
              <tbody className="divide-border/40 divide-y">
                {shown.map((row) => {
                  const selected = drill.query === row.query;
                  const figures = formatSearchConsoleRow(row);
                  return (
                    <tr key={row.query} className={cn(selected && 'bg-primary/10')}>
                      <td className="max-w-[24rem] py-2 pl-4">
                        <span className="flex items-center gap-2">
                          <span className="min-w-0 flex-1">
                            <DrillButton
                              selected={selected}
                              title="Seiten zu dieser Anfrage zeigen"
                              onClick={() => drill.toggleQuery(row.query)}
                            >
                              <span className="block truncate">{row.query}</span>
                            </DrillButton>
                          </span>
                          <GoogleLink query={row.query} />
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">{figures.clicks}</td>
                      <td className="px-3 py-2 text-right">{figures.impressions}</td>
                      <td className="px-3 py-2 text-right">{figures.ctr}</td>
                      <td className="px-3 py-2 text-right">{figures.position}</td>
                      <td className="py-2 pr-4 pl-3 text-right">
                        <RowChange change={row.change} comparable={comparable} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <MoreButton {...more} />
        </div>
      )}
    </Panel>
  );
}

/** The link that opens Google with this query, to see what a searcher sees. */
function GoogleLink({ query }: { query: string }) {
  return (
    <a
      href={googleSearchHref(query)}
      target="_blank"
      rel="noreferrer noopener"
      title="Bei Google suchen"
      aria-label={`„${query}“ bei Google suchen`}
      className="text-muted-foreground hover:text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded"
    >
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

/**
 * Our pages as Google reports them, beside the visits our own counter saw begin on each from a
 * search engine. A page narrows the query list above to its queries; a chosen query narrows this
 * list to the pages Google shows for it.
 */
export function SearchConsolePagesPanel({
  filters,
  version,
}: {
  filters: TrafficFilters & TrafficFilterActions;
  version: string | null;
}) {
  const drill = useSearchConsoleDrill();
  const [search, setSearch] = useState('');
  const { data, error, refetch, isPlaceholderData } =
    useSearchConsoleData<SearchConsolePagesResponse>(
      'pages',
      filters,
      listExtra(drill.query ? { query: drill.query } : {}, search),
      version
    );
  const rows = data?.items ?? [];
  const { shown, more } = useShowMore(rows);
  const comparable = data?.previous !== null;

  return (
    <Panel>
      <PanelHeader
        icon={FileText}
        title="Seiten in der Google-Suche"
        hint="Welche Seiten Google zeigt, daneben die Besuche aus der Suche, die unser eigener Zähler gesehen hat. Er lässt Do Not Track, Global Privacy Control und Opt-out aus, die Zahlen weichen deshalb ab. Ein Klick auf eine Seite zeigt ihre Suchanfragen."
      />
      <RowSearch label="Seiten durchsuchen" placeholder="Pfad enthält…" onSearch={setSearch} />
      {drill.query && (
        <DrillStrip>
          <FilterChip
            label="Suchanfrage"
            value={drill.query}
            removeLabel={`Anfragefilter entfernen: ${drill.query}`}
            onRemove={drill.clearQuery}
          />
          <span className="text-muted-foreground text-xs">
            Nur Seiten, die Google für diese Anfrage zeigt. Die Spalten des eigenen Zählers gelten
            für die ganze Seite.
          </span>
        </DrillStrip>
      )}
      {drill.page && (
        <p className="text-muted-foreground border-border/50 border-b px-4 py-2.5 text-xs">
          Die Suchanfragen zu{' '}
          <span className="text-foreground font-medium break-all">{drill.page}</span> stehen{' '}
          <a href="#gsc-queries" className="text-primary underline underline-offset-2">
            oben
          </a>
          .
        </p>
      )}
      {!data && error ? (
        <ErrorState message={`Seiten: ${error.message}`} onRetry={() => void refetch()} />
      ) : !data ? (
        <SkeletonRows rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Keine Seiten"
          description={
            search
              ? `Kein Pfad im Zeitraum enthält „${search}“.`
              : drill.query
                ? 'Google zeigt im Zeitraum keine Seite für diese Anfrage. Mit einem längeren Zeitraum oder ohne den Anfragefilter zeigt sich mehr.'
                : 'Google hat im Zeitraum keine Seiten gemeldet. Mit einem längeren Zeitraum oder einer anderen Sprache zeigt sich mehr.'
          }
        />
      ) : (
        <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
          <ul className="divide-border/40 divide-y md:hidden">
            {shown.map((row) => {
              const selected = drill.page === row.path;
              const site = siteFigures(row.site);
              return (
                <li
                  key={row.path}
                  className={cn(
                    'space-y-1 px-4 py-3 text-sm tabular-nums',
                    selected && 'bg-primary/10'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1">
                      <DrillButton
                        selected={selected}
                        title="Suchanfragen zu dieser Seite zeigen"
                        onClick={() => drill.togglePage(row.path)}
                      >
                        <StartTruncated>{row.path}</StartTruncated>
                      </DrillButton>
                    </span>
                    <PageLinks path={row.path} />
                  </span>
                  <FigureLine row={row} />
                  <RowChange change={row.change} comparable={comparable} inline />
                  <span
                    className="text-muted-foreground block text-xs"
                    title={row.site ? undefined : NO_SITE_VISITS}
                  >
                    Eigener Zähler: {site.visits} Besuche · Absprung {site.bounce} · Ø{' '}
                    {site.duration}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[60rem] text-sm tabular-nums">
              <thead className="text-muted-foreground text-[11px] tracking-wide uppercase">
                <tr>
                  <td />
                  <th
                    colSpan={5}
                    scope="colgroup"
                    className="border-border/40 border-b px-3 pt-2 pb-1 text-center font-medium"
                  >
                    Google
                  </th>
                  <th
                    colSpan={3}
                    scope="colgroup"
                    className="border-border/40 border-b px-3 pt-2 pb-1 text-center font-medium"
                  >
                    Eigener Zähler, aus der Suche
                  </th>
                </tr>
                <tr className="border-border/50 border-b">
                  <th className="py-2 pl-4 text-left font-medium">Seite</th>
                  <th className={HEAD}>Klicks</th>
                  <th className={HEAD}>Impressionen</th>
                  <th className={HEAD} title="Klicks geteilt durch Impressionen">
                    CTR
                  </th>
                  <th className={HEAD} title="Durchschnittliche Platzierung, 1 ist ganz oben">
                    Position
                  </th>
                  <th className={HEAD}>Veränderung</th>
                  <th
                    className={HEAD}
                    title="Besuche, die auf dieser Seite aus einer Suchmaschine begannen"
                  >
                    Besuche
                  </th>
                  <th className={HEAD}>Absprung</th>
                  <th className="py-2 pr-4 pl-3 text-right font-medium">Ø Dauer</th>
                </tr>
              </thead>
              <tbody className="divide-border/40 divide-y">
                {shown.map((row) => {
                  const selected = drill.page === row.path;
                  const figures = formatSearchConsoleRow(row);
                  const site = siteFigures(row.site);
                  const siteTitle = row.site ? undefined : NO_SITE_VISITS;
                  return (
                    <tr key={row.path} className={cn(selected && 'bg-primary/10')}>
                      <td className="max-w-[22rem] py-2 pl-4">
                        <span className="flex items-center gap-2">
                          <span className="min-w-0 flex-1">
                            <DrillButton
                              selected={selected}
                              title="Suchanfragen zu dieser Seite zeigen"
                              onClick={() => drill.togglePage(row.path)}
                            >
                              <StartTruncated>{row.path}</StartTruncated>
                            </DrillButton>
                          </span>
                          <PageLinks path={row.path} />
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">{figures.clicks}</td>
                      <td className="px-3 py-2 text-right">{figures.impressions}</td>
                      <td className="px-3 py-2 text-right">{figures.ctr}</td>
                      <td className="px-3 py-2 text-right">{figures.position}</td>
                      <td className="px-3 py-2 text-right">
                        <RowChange change={row.change} comparable={comparable} />
                      </td>
                      <td className="px-3 py-2 text-right" title={siteTitle}>
                        {site.visits}
                      </td>
                      <td className="px-3 py-2 text-right" title={siteTitle}>
                        {site.bounce}
                      </td>
                      <td className="py-2 pr-4 pl-3 text-right" title={siteTitle}>
                        {site.duration}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <MoreButton {...more} />
        </div>
      )}
    </Panel>
  );
}
