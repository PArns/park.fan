'use client';

import { useDeferredValue, useState, type ReactNode } from 'react';
import { useMounted } from '@/lib/hooks/use-mounted';
import { cn } from '@/lib/utils';

export interface NewsStreamItem {
  key: string;
  /** The item's park slug, or `null` when it has none (it then shows only unfiltered). */
  park: string | null;
  /** The server-rendered entry. */
  node: ReactNode;
}

export interface NewsStreamGroup {
  /** The day, `YYYY-MM-DD`. */
  key: string;
  /** The server-rendered day heading. */
  heading: ReactNode;
  items: NewsStreamItem[];
}

export interface NewsStreamPark {
  slug: string;
  name: string;
  count: number;
}

/** The query parameter the park filter lives in. `/news?park=europa-park` */
const PARK_PARAM = 'park';

/**
 * The news overview's stream, newest day first, with a filter by park.
 *
 * Every entry is rendered on the server and passed in as a node, so the full list is in the
 * first HTML and in the static page; this component only decides which of them to show. The
 * filter is a query parameter on the one `/news` page, not a URL of its own: the route stays
 * static, and its canonical stays `/news` whatever the parameter says. It is read once mounted
 * (`useSearchParams` would put the whole stream behind a `<Suspense>` boundary on a static
 * route) and written with `history.replaceState`, so a filtered view can be shared without
 * adding one history entry per click.
 *
 * The pressed pill updates at once; the stream reads a deferred copy of it
 * (`docs/rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md`).
 */
export function NewsStream({
  groups,
  parks,
  filterLabel,
  allLabel,
}: {
  groups: NewsStreamGroup[];
  parks: NewsStreamPark[];
  filterLabel: string;
  allLabel: string;
}) {
  // `undefined` until the reader picks a pill; until then the URL decides, once mounted.
  const [chosen, setChosen] = useState<string | null | undefined>(undefined);
  const mounted = useMounted();
  const fromUrl = mounted ? new URLSearchParams(window.location.search).get(PARK_PARAM) : null;
  // A parameter naming a park without news (an old link, a typo) shows everything.
  const park =
    chosen !== undefined ? chosen : parks.some((p) => p.slug === fromUrl) ? fromUrl : null;
  const shownPark = useDeferredValue(park);

  const choose = (next: string | null) => {
    setChosen(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set(PARK_PARAM, next);
    else url.searchParams.delete(PARK_PARAM);
    window.history.replaceState(window.history.state, '', url);
  };

  const visible = groups
    .map((group) => ({
      ...group,
      items: shownPark ? group.items.filter((item) => item.park === shownPark) : group.items,
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div>
      {parks.length > 1 && (
        <div role="group" aria-label={filterLabel} className="mb-8 flex flex-wrap gap-2">
          <FilterPill pressed={park === null} onClick={() => choose(null)}>
            {allLabel}
          </FilterPill>
          {parks.map((p) => (
            <FilterPill key={p.slug} pressed={park === p.slug} onClick={() => choose(p.slug)}>
              {p.name}
              <span className="tabular-nums opacity-70">{p.count}</span>
            </FilterPill>
          ))}
        </div>
      )}

      <div className="space-y-10">
        {visible.map((group) => (
          <section
            key={group.key}
            className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8"
          >
            <div className="sm:sticky sm:top-20 sm:self-start sm:pt-4">{group.heading}</div>
            <ol className="sm:border-border/60 space-y-3 sm:border-l sm:pl-8">
              {group.items.map((item) => (
                <li key={item.key}>{item.node}</li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

function FilterPill({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
        pressed
          ? 'bg-primary text-primary-foreground border-transparent'
          : 'border-border bg-card text-foreground hover:bg-muted'
      )}
    >
      {children}
    </button>
  );
}
