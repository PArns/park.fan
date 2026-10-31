'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  ChartColumn,
  ChevronDown,
  Compass,
  ExternalLink,
  Eye,
  ListOrdered,
  LogIn,
  MonitorSmartphone,
  MousePointerClick,
  Pencil,
  Percent,
  ScanSearch,
  Search,
  Timer,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { analyticsPath } from '@/app/admin/traffic/_lib/use-traffic';
import { CATEGORICAL, DeltaChip, ShareBar, type SharePart } from '@/app/admin/_ui/charts';
import { Chip, type ChipTone } from '@/app/admin/_ui/primitives';
import { HAIRLINE_FILL, TILE_GLASS } from '@/components/common/glass-card';
import { ADMIN_MARKER_COOKIE } from '@/lib/admin/cookie';
import {
  SEARCH_CONSOLE_PAGE_PARAM,
  formatSearchConsoleRow,
  googleSearchHref,
  searchConsoleRowChange,
} from '@/lib/admin/search-console';
import {
  breakdownValueLabel,
  figureDelta,
  formatCount,
  formatDuration,
  formatShare,
  trafficQuery,
  type TrafficFilter,
} from '@/lib/admin/site-analytics';
import type {
  BreakdownDimension,
  BreakdownResponse,
  TrafficOverview,
} from '@/lib/api/admin-site-analytics';
import type {
  SearchConsolePage,
  SearchConsolePagesResponse,
  SearchConsoleQueriesResponse,
  SearchConsoleQuery,
} from '@/lib/api/admin-search-console';
import { writeCookie } from '@/lib/utils/browser-cookie';
import { cn } from '@/lib/utils';

/** The window the overlay reports: four whole weeks, so weekdays compare like with like. */
const DAYS = 28;
/** Queries listed under the figures. */
const TOP_QUERIES = 5;
/** Pages read to find this one: the search matches its subpages too, most clicks first. */
const PAGES_READ = 200;

/** What the overlay shows for one path, or why it shows nothing. */
type OverlayState =
  | { status: 'loading' }
  | { status: 'failed' }
  | {
      status: 'ready';
      from: string;
      to: string;
      page: SearchConsolePage | null;
      queries: SearchConsoleQuery[];
    };

/** The site statistic for one path, read when the overlay opens. */
type SiteState =
  | { status: 'loading' }
  | { status: 'failed' }
  | {
      status: 'ready';
      overview: TrafficOverview;
      channels: BreakdownResponse;
      devices: BreakdownResponse;
    };

/** The path as Search Console rows hold it: lower case, no trailing slash. */
function searchConsolePathOf(pathname: string): string {
  const lower = pathname.toLowerCase();
  return lower.length > 1 && lower.endsWith('/') ? lower.slice(0, -1) : lower;
}

/** A park or ride the admin can edit, as its editor links it. */
interface EditTarget {
  name: string;
  href: string;
}

/**
 * The park and the ride a park.fan page belongs to, by their admin ids. The page knows only its
 * path, so the park is found by its geo path among the parks whose name or slug matches, and the
 * ride by its slug among the park's rides (retired ones too). A sub-page segment that is no ride
 * (the calendar, the kids page) finds nothing and leaves the park alone.
 */
async function editTargets(path: string, signal: AbortSignal): Promise<EditTarget[]> {
  const [, , section, continent, country, city, parkSlug, rideSlug] = path.split('/');
  if (section !== 'parks' || !parkSlug) return [];
  const geoPath = `${continent}/${country}/${city}/${parkSlug}`;
  const { parks } = await readReport<{ parks: { id: string; name: string; path: string }[] }>(
    `/api/admin/content/parks?q=${encodeURIComponent(parkSlug)}&limit=50`,
    signal
  );
  const park = parks.find((candidate) => candidate.path === geoPath);
  if (!park) return [];
  const targets = [{ name: park.name, href: `/admin/parks/${park.id}` }];
  if (!rideSlug) return targets;
  const { attractions } = await readReport<{
    attractions: { id: string; name: string; slug: string }[];
  }>(`/api/admin/content/parks/${park.id}/attractions?includeRetired=true`, signal);
  const ride = attractions.find((candidate) => candidate.slug === rideSlug);
  return ride ? [{ name: ride.name, href: `/admin/attractions/${ride.id}` }, ...targets] : targets;
}

/** The overlay's window in all languages, held to one page. */
function windowOf(filter: TrafficFilter) {
  return { range: { kind: 'days', days: DAYS }, locale: null, filters: [filter] } as const;
}

/**
 * The site statistic's three reads for a path over the overlay's window: the page's views, the
 * visits that began on it with their bounce rate, the time on the page, where those visits came
 * from and on which devices the page was read. The channel list filters on the entry page, so it
 * counts visits that began here, not every visit that passed through.
 */
async function siteFigures(path: string, signal: AbortSignal) {
  const read = <T,>(endpoint: string, filter: TrafficFilter, extra?: Record<string, string>) =>
    readReport<T>(analyticsPath(endpoint, windowOf(filter), extra), signal);
  const breakdown = (dim: BreakdownDimension, filter: TrafficFilter) =>
    read<BreakdownResponse>('breakdown', filter, { dim, limit: '5' });
  const [overview, channels, devices] = await Promise.all([
    read<TrafficOverview>('overview', { dim: 'path', value: path }),
    breakdown('channel', { dim: 'entry', value: path }),
    breakdown('device', { dim: 'path', value: path }),
  ]);
  return { overview, channels, devices };
}

/** A breakdown as the parts of a share bar, in the order the API ranked them. */
function shareParts(breakdown: BreakdownResponse): SharePart[] {
  return breakdown.items.map((item, index) => ({
    key: item.value,
    label: breakdownValueLabel(breakdown.dim, item.value),
    value: item.views,
    color: CATEGORICAL[index % CATEGORICAL.length],
  }));
}

/** A refusal that means the session is gone, as opposed to a role without the right. */
class SignedOut extends Error {}

async function readReport<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, cache: 'no-store' });
  if (response.status === 401) throw new SignedOut();
  if (!response.ok) throw new Error(String(response.status));
  return (await response.json()) as T;
}

const CHANGE_TONE = { good: 'success', bad: 'danger', flat: 'muted' } as const satisfies Record<
  string,
  ChipTone
>;

/** One figure with its icon, label and, where there is one, its change. */
function Figure({
  icon: Icon,
  label,
  value,
  change,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: ReactNode;
}) {
  return (
    <div className={cn('rounded-lg px-2 py-1.5', HAIRLINE_FILL)}>
      <dt className="text-muted-foreground flex items-center gap-1 text-[10px] uppercase">
        <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm font-semibold">
        {value}
        {change}
      </dd>
    </div>
  );
}

/** A section's heading line: an icon, a name and what the figures are measured against. */
function SectionHeading({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 text-[11px] font-semibold">
      <Icon className="text-primary h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {children}
    </h3>
  );
}

/** A small labelled share bar, or nothing when the list is empty. */
function Shares({
  icon: Icon,
  label,
  breakdown,
}: {
  icon: LucideIcon;
  label: string;
  breakdown: BreakdownResponse;
}) {
  if (breakdown.items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground flex items-center gap-1 text-[10px] uppercase">
        <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
        {label}
      </p>
      <ShareBar parts={shareParts(breakdown)} />
    </div>
  );
}

/** The site statistic's figures for the page, or why there are none. */
function SiteFigures({ site }: { site: SiteState }) {
  if (site.status === 'loading') return <p className="text-muted-foreground">Lädt …</p>;
  if (site.status === 'failed') {
    return <p className="text-muted-foreground">Die eigene Statistik antwortet nicht.</p>;
  }
  const { totals, previous } = site.overview;
  const versus = `gegenüber den ${DAYS} Tagen davor`;
  const delta = (current: number | null, before: number | null | undefined) => {
    const change = figureDelta(current, before ?? null);
    return change ? <DeltaChip delta={change} title={versus} /> : undefined;
  };
  return (
    <>
      <dl className="grid grid-cols-2 gap-1.5">
        <Figure
          icon={Eye}
          label="Aufrufe"
          value={totals.pageviews === null ? '–' : formatCount(totals.pageviews)}
          change={delta(totals.pageviews, previous?.pageviews)}
        />
        <Figure
          icon={LogIn}
          label="Einstiege"
          value={formatCount(totals.visits)}
          change={delta(totals.visits, previous?.visits)}
        />
        <Figure
          icon={Undo2}
          label="Absprung"
          value={totals.visits > 0 ? formatShare(totals.bounceRate) : '–'}
        />
        <Figure
          icon={Timer}
          label="Ø auf der Seite"
          value={formatDuration(totals.avgTimeOnPageSeconds)}
        />
      </dl>
      <Shares icon={Compass} label="Einstiege kamen von" breakdown={site.channels} />
      <Shares icon={MonitorSmartphone} label="Aufrufe nach Gerät" breakdown={site.devices} />
    </>
  );
}

/**
 * Figures for the page on screen, for a signed-in admin. Collapsed it is one line with Google's
 * clicks, CTR and position over the last four weeks. Opened it adds the site statistic for the
 * same weeks (page views, visits that began here and their bounce rate, time on the page, where
 * those visits came from, devices), Google's four figures with their change against the four weeks
 * before, the queries that bring the page, and on a park or ride page the links into their
 * editors. A 401 clears the marker cookie and unmounts it; any other refusal of Google's reads
 * shows nothing.
 */
export function SearchConsoleOverlay({ onSignedOut }: { onSignedOut: () => void }) {
  const path = searchConsolePathOf(usePathname());
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<OverlayState>({ status: 'loading' });
  const [site, setSite] = useState<SiteState>({ status: 'loading' });
  const [targets, setTargets] = useState<EditTarget[]>([]);

  // Read when opened, not on every page view: a filter on one page reads the hourly rows.
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a new path starts a new read
    setSite({ status: 'loading' });
    siteFigures(path, controller.signal)
      .then((figures) => setSite({ status: 'ready', ...figures }))
      .catch(() => {
        if (!controller.signal.aborted) setSite({ status: 'failed' });
      });
    editTargets(path, controller.signal)
      .then(setTargets)
      .catch(() => setTargets([]));
    return () => controller.abort();
  }, [open, path]);

  useEffect(() => {
    const controller = new AbortController();
    const span = `days=${DAYS}`;
    const encoded = encodeURIComponent(path);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a new path starts a new read
    setState({ status: 'loading' });
    Promise.all([
      readReport<SearchConsolePagesResponse>(
        `/api/admin/search-console/pages?${span}&search=${encoded}&limit=${PAGES_READ}`,
        controller.signal
      ),
      readReport<SearchConsoleQueriesResponse>(
        `/api/admin/search-console/queries?${span}&page=${encoded}&limit=${TOP_QUERIES}`,
        controller.signal
      ),
    ])
      .then(([pages, queries]) =>
        setState({
          status: 'ready',
          from: pages.from,
          to: pages.to,
          page: pages.items.find((item) => item.path === path) ?? null,
          queries: queries.items,
        })
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof SignedOut) {
          writeCookie(ADMIN_MARKER_COOKIE, '', { maxAge: 0, sameSite: 'strict' });
          onSignedOut();
          return;
        }
        setState({ status: 'failed' });
      });
    return () => controller.abort();
  }, [path, onSignedOut]);

  if (state.status === 'failed') return null;

  const page = state.status === 'ready' ? state.page : null;
  const figures = page ? formatSearchConsoleRow(page) : null;
  const change = page ? searchConsoleRowChange(page.change) : null;
  const summary =
    state.status === 'loading'
      ? 'Google …'
      : figures
        ? `${figures.clicks} Klicks · ${figures.ctr} · Pos. ${figures.position}`
        : 'Nicht in Google';

  return (
    <aside
      aria-label="Zahlen zu dieser Seite"
      className={cn(
        'fixed bottom-4 left-4 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border text-xs shadow-lg',
        TILE_GLASS
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left tabular-nums"
      >
        <Search className="text-primary h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate font-medium">{summary}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn('h-3.5 w-3.5 shrink-0 transition-transform', !open && 'rotate-180')}
        />
      </button>
      {open && state.status === 'ready' && (
        <div className="max-h-[min(36rem,calc(100dvh-6rem))] space-y-4 overflow-y-auto border-t px-3 py-3 tabular-nums">
          <p className="text-muted-foreground">
            {state.from} bis {state.to}, gegen die {DAYS} Tage davor
          </p>

          <section className="space-y-2">
            <SectionHeading icon={ChartColumn}>park.fan-Statistik</SectionHeading>
            <SiteFigures site={site} />
          </section>

          <section className="space-y-2">
            <SectionHeading icon={Search}>Google-Suche</SectionHeading>
            {page && figures ? (
              <dl className="grid grid-cols-2 gap-1.5">
                <Figure
                  icon={MousePointerClick}
                  label="Klicks"
                  value={figures.clicks}
                  change={
                    change && <Chip tone={CHANGE_TONE[change.clicksTone]}>{change.clicks}</Chip>
                  }
                />
                <Figure icon={ScanSearch} label="Impressionen" value={figures.impressions} />
                <Figure icon={Percent} label="CTR" value={figures.ctr} />
                <Figure
                  icon={ListOrdered}
                  label="Position"
                  value={figures.position}
                  change={
                    change?.position != null && (
                      <Chip tone={CHANGE_TONE[change.positionTone]}>{change.position}</Chip>
                    )
                  }
                />
              </dl>
            ) : (
              <p>Google hat diese Seite im Zeitraum nicht gezeigt.</p>
            )}
            {state.queries.length > 0 && (
              <ol className="space-y-1">
                {state.queries.map((query) => {
                  const row = formatSearchConsoleRow(query);
                  return (
                    <li key={query.query} className="flex items-center gap-2">
                      <a
                        href={googleSearchHref(query.query)}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="hover:text-primary min-w-0 flex-1 truncate"
                        title="Bei Google suchen"
                      >
                        {query.query}
                      </a>
                      <span className="text-muted-foreground shrink-0">
                        {row.clicks} / {row.impressions} · {row.position}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {targets.map((target) => (
              <a
                key={target.href}
                href={target.href}
                className="text-primary inline-flex items-center gap-1 underline underline-offset-2"
              >
                <Pencil className="h-3 w-3" aria-hidden="true" /> {target.name} bearbeiten
              </a>
            ))}
            <a
              href={`/admin/traffic?${trafficQuery(windowOf({ dim: 'path', value: path }))}`}
              className="text-primary inline-flex items-center gap-1 underline underline-offset-2"
            >
              Statistik im Admin <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
            <a
              href={`/admin/traffic/seo?${SEARCH_CONSOLE_PAGE_PARAM}=${encodeURIComponent(path)}`}
              className="text-primary inline-flex items-center gap-1 underline underline-offset-2"
            >
              Suchdaten im Admin <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      )}
    </aside>
  );
}
