'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, ExternalLink, Pencil, Search } from 'lucide-react';
import { ADMIN_MARKER_COOKIE } from '@/lib/admin/cookie';
import {
  SEARCH_CONSOLE_PAGE_PARAM,
  formatSearchConsoleRow,
  googleSearchHref,
  searchConsoleRowChange,
} from '@/lib/admin/search-console';
import { formatCount, formatDuration, formatShare } from '@/lib/admin/site-analytics';
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

/** A refusal that means the session is gone, as opposed to a role without the right. */
class SignedOut extends Error {}

async function readReport<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, cache: 'no-store' });
  if (response.status === 401) throw new SignedOut();
  if (!response.ok) throw new Error(String(response.status));
  return (await response.json()) as T;
}

const TONE_CLASS = {
  good: 'text-emerald-500',
  bad: 'text-red-500',
  flat: 'text-muted-foreground',
} as const;

/**
 * Google's figures for the page on screen, for a signed-in admin: clicks, impressions, CTR and
 * position over the last four weeks against the four before, the visits our own counter saw begin
 * here from a search engine, the queries that bring the page, and on a park or ride page the links
 * into their editors. Collapsed to one line until opened. A 401 clears the marker cookie and unmounts it; any other refusal shows nothing.
 */
export function SearchConsoleOverlay({ onSignedOut }: { onSignedOut: () => void }) {
  const path = searchConsolePathOf(usePathname());
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<OverlayState>({ status: 'loading' });
  const [targets, setTargets] = useState<EditTarget[]>([]);

  // Read when opened, not on every page view: the lookup is two admin reads.
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
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
      aria-label="Google-Suche für diese Seite"
      className="bg-background/95 border-border fixed bottom-4 left-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-xl border text-xs shadow-lg backdrop-blur-md"
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left tabular-nums"
      >
        <Search className="text-primary h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0 flex-1 truncate font-medium">{summary}</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 shrink-0 transition-transform', !open && 'rotate-180')}
        />
      </button>
      {open && state.status === 'ready' && (
        <div className="border-border/60 space-y-3 border-t px-3 py-3 tabular-nums">
          <p className="text-muted-foreground">
            {state.from} bis {state.to}, gegen die {DAYS} Tage davor
          </p>
          {page && figures ? (
            <>
              <dl className="grid grid-cols-4 gap-2">
                {(
                  [
                    ['Klicks', figures.clicks],
                    ['Impr.', figures.impressions],
                    ['CTR', figures.ctr],
                    ['Position', figures.position],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground text-[10px] uppercase">{label}</dt>
                    <dd className="text-sm font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              {change && (
                <p className="flex gap-3">
                  <span className={TONE_CLASS[change.clicksTone]}>{change.clicks} Klicks</span>
                  {change.position !== null && (
                    <span className={TONE_CLASS[change.positionTone]}>
                      {change.position} Plätze
                    </span>
                  )}
                </p>
              )}
              <p className="text-muted-foreground">
                {page.site
                  ? `Eigener Zähler: ${formatCount(page.site.visits)} Besuche aus der Suche · Absprung ${formatShare(page.site.bounceRate)} · Ø ${formatDuration(page.site.avgVisitSeconds)}`
                  : 'Eigener Zähler: kein Besuch aus der Suche begann hier.'}
              </p>
            </>
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
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {targets.map((target) => (
              <a
                key={target.href}
                href={target.href}
                className="text-primary inline-flex items-center gap-1 underline underline-offset-2"
              >
                <Pencil className="h-3 w-3" /> {target.name} bearbeiten
              </a>
            ))}
            <a
              href={`/admin/traffic/seo?${SEARCH_CONSOLE_PAGE_PARAM}=${encodeURIComponent(path)}`}
              className="text-primary inline-flex items-center gap-1 underline underline-offset-2"
            >
              Suchdaten im Admin <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </aside>
  );
}
